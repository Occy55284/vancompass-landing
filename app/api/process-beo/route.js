import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import { isSnackOrBev as isBevOrSnack } from '../../itemFilter'
import { DEFAULT_COMPANY_ID, eventCompanyId, isValidCompanyId } from '../../companies'
import { normalizeDate, shortDateFor, consolidateDays } from '../../dates'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Known room/venue names that should never be in dietaryRequirements
const KNOWN_ROOMS = [
  'beech room', 'the beech room', 'beech',
  'beach room', 'the beach room', 'beach',
  'chestnut room', 'the chestnut room', 'chestnut',
  'willow room', 'the willow room', 'willow',
  'sycamore room', 'the sycamore room', 'sycamore',
  'oak room', 'the oak room', 'oak',
  'welcome area',
  'private dining',
  'boardroom',
  'seminar room',
  'academy',
  'reinvention studio',
  'dominion theatre',
  'wembley',
  'kempton park',
  // Numeric room identifiers
  '3.20', '4.31', '4.25', 'nw-681'
]

// Correct events where room names ended up in dietaryRequirements field
// This is a safety net for when Claude extraction misplaces room information
function extractRoomNamesFromDietary(days) {
  days.forEach(day => {
    day.events?.forEach(event => {
      if (event.dietaryRequirements && !event.room) {
        const dietary = event.dietaryRequirements.toLowerCase()
        for (const roomName of KNOWN_ROOMS) {
          if (dietary.includes(roomName)) {
            // Extract the room name (preserve original case if possible)
            const roomMatch = event.dietaryRequirements.match(new RegExp(roomName, 'i'))
            if (roomMatch) {
              // Find the original cased version in dietaryRequirements
              const startIdx = event.dietaryRequirements.toLowerCase().indexOf(roomName)
              const endIdx = startIdx + roomName.length
              const originalRoom = event.dietaryRequirements.substring(startIdx, endIdx)
              event.room = originalRoom
              // Remove room name from dietary requirements
              event.dietaryRequirements = event.dietaryRequirements
                .substring(0, startIdx)
                .concat(event.dietaryRequirements.substring(endIdx))
                .trim()
                .replace(/\s+/g, ' ')
              console.log(`[ROOM EXTRACTION] Moved room "${originalRoom}" from dietary to room field for event: ${event.eventName}`)
              break
            }
          }
        }
      }

      // Additional validation: if room still empty/missing, flag it
      if (!event.room || event.room.trim() === '') {
        console.warn(`[ROOM MISSING] Event ${event.eventName} has no room assigned. Dietary: ${event.dietaryRequirements}`)
      }

      // Verify every item has items array
      if (!event.items) event.items = []
    })
  })
  return days
}

function parseTextToData(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  const days = []
  let currentDay = null
  let currentEvent = null
  let orphanedItems = [] // Track items without an event

  for (const line of lines) {
    if (line.startsWith('DATE:')) {
      if (currentDay) days.push(currentDay)
      // Standardise to "D Month YYYY" so "05 October" and "5 October" are one day
      const dateParts = normalizeDate(line.replace('DATE:', ''))
      currentDay = { date: dateParts, shortDate: shortDateFor(dateParts), events: [] }
      currentEvent = null
    } else if (line.startsWith('BEO:') && currentDay) {
      const parts = line.replace('BEO:', '').trim().split('|')
      currentEvent = {
        beoNumber: parts[0]?.trim() || '',
        eventName: parts[1]?.trim() || '',
        room: parts[2]?.trim() || '',
        dietaryRequirements: parts[3]?.trim() || '',
        items: []
      }
      currentDay.events.push(currentEvent)
    } else if (line.startsWith('ITEM:') && currentEvent) {
      const parts = line.replace('ITEM:', '').trim().split('|')
      const name = parts[0]?.trim() || ''
      const isBev = /tea|coffee|water|juice|cola|beer|wine|peroni|corona|soft drink|fanta|7up|lemonade|filtered|sparkling|smoothie/i.test(name)
      const isSnack = /crisp|nibble|rice cake|pretzel/i.test(name)
      const svcRaw = (parts[4]?.trim() || '').toUpperCase()
      let service = 'BREAKFAST'
      if (svcRaw.includes('LUNCH')) service = 'LUNCH'
      else if (svcRaw.includes('AFTERNOON') || svcRaw.includes('CAKE')) service = 'AFTERNOON & CAKES'
      else if (svcRaw.includes('EVENING') || svcRaw.includes('NETWORK')) service = 'EVENING'

      // Preserve full details, especially for multi-option items
      const details = parts[5]?.trim() || ''

      currentEvent.items.push({
        name,
        quantity: parseInt(parts[1]?.trim()) || 0,
        time: parts[2]?.trim() || '',
        allergens: parts[3]?.trim() || '',
        details,
        notes: '',
        totalQty: parseInt(parts[1]?.trim()) || 0,
        service,
        isBeverage: isBev,
        isSnack
      })
    } else if (line.startsWith('ITEM:') && !currentEvent) {
      // Item without an event — log a warning
      orphanedItems.push(line)
    }
  }
  if (currentDay) days.push(currentDay)

  if (orphanedItems.length > 0) {
    console.warn(`[ORPHANED ITEMS] Found ${orphanedItems.length} items without an event:`, orphanedItems.slice(0, 3))
  }

  const parsed = days.filter(d => d.events.length > 0)

  // Validate extracted data
  parsed.forEach(day => {
    day.events.forEach(event => {
      if (!event.room) {
        console.warn(`[EVENT NO ROOM] ${event.eventName} on ${day.date} has no room field`)
      }
      if (event.items.length === 0) {
        console.warn(`[EVENT NO ITEMS] ${event.eventName} on ${day.date} has no items`)
      }
    })
  })

  // Fix any room names that ended up in dietary requirements
  return extractRoomNamesFromDietary(parsed)
}

// Flatten an Excel workbook into plain text so it can run through the same
// chunk → Claude extraction pipeline as PDFs and Markdown. Each sheet is
// emitted as a labelled CSV block; blank rows/columns are dropped by SheetJS.
function workbookToText(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const blocks = []
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name]
    if (!sheet) return
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim()
    if (csv) blocks.push(`### Sheet: ${name}\n${csv}`)
  })
  return blocks.join('\n\n')
}

// Split text into chunks of roughly chunkSize characters, breaking on newlines
function splitIntoChunks(text, chunkSize = 8000) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = start + chunkSize
    if (end < text.length) {
      // Break at the last newline before the limit
      const lastNewline = text.lastIndexOf('\n', end)
      if (lastNewline > start) end = lastNewline
    }
    chunks.push(text.slice(start, end).trim())
    start = end
  }
  return chunks.filter(c => c.length > 0)
}

// Group whole PDF pages into chunks, never splitting a single page's text
// across two chunks. A BEO bundle is typically one booking per page, so
// cutting mid-page (as plain character-count chunking can) puts the tail of
// one booking and the start of an unrelated one in the same Claude call,
// which is how event names/rooms end up cross-attributed between bookings.
function splitIntoChunksByPage(pages, chunkSize = 4000) {
  const chunks = []
  let current = ''
  for (const page of pages) {
    const pageText = page.trim()
    if (!pageText) continue
    if (current && (current.length + pageText.length + 2) > chunkSize) {
      chunks.push(current)
      current = pageText
    } else {
      current = current ? `${current}\n\n${pageText}` : pageText
    }
  }
  if (current) chunks.push(current)
  return chunks
}

const PROMPT_RULES = `Extract ALL dates and events from this BEO document text.
Return ONLY plain text in this exact format. No JSON, no markdown, no explanation:
DATE: 14 April 2026
BEO: 5699 | PI Planning with Rathbones | Welcome Area on 7 | 2x halal 1x GF
ITEM: Gourmandise Pains A La Creme | 27 | 09:15 | V | BREAKFAST | Served with seasonal compote and cream
ITEM: Yoghurt Bar | 27 | 09:15 | V,GF | BREAKFAST | Greek yoghurt with granola, honey, mixed berries
ITEM: Pizza Aventura | 32 | 12:00 | V | LUNCH | Mozzarella, artichokes, asparagus, mushroom
ITEM: Pizza Diavola Dolce | 32 | 12:00 | | LUNCH | Spicy pizza with caramelised pineapple
ITEM: Blueberry Cake | 18 | 15:00 | VG | AFTERNOON & CAKES | Vegan alternative, fresh blueberries
ITEM: Vanilla Cheesecake | 24 | 15:00 | | AFTERNOON & CAKES | Served with berry coulis
ITEM: Canapes Selection | 80 | 17:30 | V,GF | EVENING | Cold options (4pc), Hot options (4pc), Dessert options (2pc)
ITEM: Wellness Salad with 3 options | 42 | 12:00 | V,GF | LUNCH | Land: Coffee & Black Pepper Crusted Roast Sirloin GF; Sea: Roasted Pesto Salmon GF; Farm: Smoked Paprika & Tomato Marinated Tofu V,GF
DATE: 15 April 2026
BEO: 5593 | Aon Workshops | The Beech Room | 2x halal
ITEM: Artisan Sandwich Lunch | 26 | 12:30 | | LUNCH | Selection of sourdough and ciabatta with assorted fillings
DATE: 16 April 2026
BEO: 5612 | Client Dinner | Chestnut Room | 1x vegan 3x GF
ITEM: Pan-Seared Salmon | 18 | 19:00 | GF,N | EVENING | With lemon butter and fresh herbs
ITEM: Vegetable Risotto | 4 | 19:00 | V,GF,VG | EVENING | Seasonal vegetables, truffle oil
Rules:
- DATE must always be formatted as "D Month YYYY" (e.g. 14 April 2026), converting from any other format found in the source (e.g. 14/04/2026 or 2026-04-14)
- One DATE line per event date
- One BEO line per event (beoNumber | eventName | room | dietaryRequirements)
  * room field MUST contain ONLY the room/venue name (e.g. "Chestnut Room", "The Beech Room", "Welcome Area 5", "3.20", "NW-681")
  * room field MUST NEVER contain any dietary requirements or allergen information
  * CRITICAL: Room names can be text (Beech, Chestnut) or numeric identifiers (3.20, 4.31, 4.25, NW-681) — capture them exactly as they appear
  * CRITICAL: For Chestnut Room events, ALWAYS put "Chestnut Room" or "The Chestnut Room" in the room field — verify this for every Chestnut event
- One ITEM line per catering item (name | quantity | time | allergens | service | details)
  * CRITICAL: Extract EVERY SINGLE food item for the event — NO EXCEPTIONS. Do not skip, abbreviate, or merge items except for multi-option variants
  * Include ALL items: pizzas, cakes, cookies, canapes, sandwiches, salads, hot dishes, desserts, small bites, prepared items — everything listed in the BEO
  * Include items at all nesting levels: items listed at top level, items in bullet points, items in sub-lists, items in grouped sections
  * Extract items even if they appear in complex grouped formats like "Dessert Selection" or "Bread Basket" — list each distinct item separately
  * Do NOT drop or skip any items, especially for Chestnut Room or any other venue
  * SPECIAL HANDLING FOR MULTI-OPTION ITEMS: For items like "Wellness Salad" or "World Fusion Hot Fork Buffet" or "Canapes Selection" that offer multiple sub-options (e.g., Land/Sea/Farm choices, Cold/Hot/Dessert canapes), extract as ONE item line with the TOTAL quantity and include ALL sub-options in the details field. Example: "Wellness Salad with 3 options | 42 | 12:00 | V,GF | LUNCH | Land: Coffee & Black Pepper Crusted Roast Sirloin GF; Sea: Roasted Pesto Salmon GF; Farm: Smoked Paprika & Tomato Marinated Tofu V,GF"
  * For items with allergen options within the same dish (like "Buffalo Mozzarella with Heirloom Tomatoes V, GF" as one salad option), include in the single item line's details
  * The QUANTITY field is the total number of people for the entire dish, not per option
- CRITICAL: Always extract and include the item serving time if present in the BEO (e.g., 09:15, 12:30, 19:00). If no specific time is listed for an item, leave the time field blank.
- The "details" field should capture:
  * Any product description, preparation notes, accompaniments, presentation instructions, or specific ingredients listed for the item
  * For multi-option dishes: ALL sub-options in format "Land: X; Sea: Y; Farm: Z" or similar
  * The full composition of bundle items (e.g., "Includes: A, B, C") — for grouped items like Canapes, list all variant types (Cold, Hot, Dessert)
  * If none of the above apply, leave blank.
- service: BREAKFAST, LUNCH, AFTERNOON & CAKES, or EVENING (based on the time or explicit service type in the BEO)
- Skip items with quantity 0
- Include ALL events from ALL dates found in this chunk
- If no events found in this chunk, return nothing
- Include ALL catering food items including: cakes, pizzas, cookies, canapes, vegan options, vegetarian options, halal alternatives, and any dietary alternative dishes
- Capture ALL dietary requirements and allergen information: both at the BEO level (in the dietaryRequirements field) and at the item level (in the allergens field). Common allergens include: V (vegetarian), VG (vegan), GF (gluten-free), DF (dairy-free), N (contains nuts), as well as halal, kosher, etc.
- KNOWN ROOM NAMES (physical event spaces, NOT dietary requirements): Beech Room, Beach Room, Chestnut Room, Willow Room, Sycamore Room, Oak Room, Academy, Reinvention Studio, Dominion Theatre, Welcome Area (with numbers), Private Dining, Boardroom, Seminar Room, Wembley, Kempton Park, and numeric identifiers like 3.20, 4.31, 4.25, NW-681. Room names ONLY go in the room field of BEO lines.
- If a room name contains a slash (e.g. "The Willow / Welcome Area 4"), use only the text after the final slash as the room name (e.g. "Welcome Area 4")
- Only extract events that appear as actual catering bookings in the BEO — do not create BEO lines for rooms or locations mentioned only in passing, in notes, or in headers
- CRITICAL: Each BEO line's beoNumber, eventName, and room MUST all come from the SAME booking. Never combine the event name from one booking with the room or BEO number from a different booking on the same document, even if they look similar or are near each other in the text. Before writing each BEO line, re-check the source text for that specific BEO number and confirm the eventName and room you are about to write both belong to that exact BEO number.
- VERIFICATION: For each event with items, verify that ALL items are present (including pizzas, cakes, canapes at all nesting levels) and that the room field is correctly populated. If uncertain about a room name, default to what is written in the BEO. CRITICAL: Do not split multi-option salads/buffets/canapes into separate lines — keep them as single items with all options in the details field. But DO list separate named items (e.g., Pizza Aventura and Pizza Diavola Dolce are separate items, not grouped together).`

async function processChunk(text, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        output_config: { effort: 'high' },
        messages: [{ role: 'user', content: `${PROMPT_RULES}\n\nBEO TEXT:\n${text}` }]
      })
      const textBlock = message.content.find(block => block.type === 'text')
      return textBlock?.text || ''
    } catch (error) {
      // Retry on overloaded errors
      if (error.error?.type === 'overloaded_error' && attempt < retries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s exponential backoff
        console.log(`Claude API overloaded, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      throw error
    }
  }
}

function mergeDays(allDays) {
  const map = new Map()
  allDays.forEach(day => {
    if (map.has(day.date)) {
      // Merge events, avoiding duplicates by BEO number
      const existing = map.get(day.date)
      day.events.forEach(ev => {
        if (!existing.events.find(e => e.beoNumber === ev.beoNumber)) {
          existing.events.push(ev)
        }
      })
    } else {
      map.set(day.date, { ...day })
    }
  })
  return Array.from(map.values()).sort((a, b) => {
    // Sort by date
    const months = { January:0, February:1, March:2, April:3, May:4, June:5,
      July:6, August:7, September:8, October:9, November:10, December:11 }
    const parseDate = d => {
      const p = d.split(' ')
      return new Date(parseInt(p[2]), months[p[1]] || 0, parseInt(p[0]))
    }
    return parseDate(a.date) - parseDate(b.date)
  })
}

const MONTHS = { January:0, February:1, March:2, April:3, May:4, June:5,
  July:6, August:7, September:8, October:9, November:10, December:11 }

function sortByDate(a, b) {
  const parse = d => {
    const p = (d.date || '').split(' ')
    return new Date(parseInt(p[2]), MONTHS[p[1]] || 0, parseInt(p[0]))
  }
  return parse(a) - parse(b)
}

// Tag every event in a set of days with the company that uploaded them.
function tagDaysWithCompany(days, companyId) {
  days.forEach(day => day.events.forEach(ev => { ev.company = companyId }))
  return days
}

// Return a copy of `days` keeping only the events belonging to `companyId`.
// Used so change detection compares a company against its OWN previous upload.
function daysForCompany(days, companyId) {
  return (days || [])
    .map(day => ({ ...day, events: (day.events || []).filter(ev => eventCompanyId(ev) === companyId) }))
    .filter(day => day.events.length > 0)
}

// Merge a company's freshly-uploaded days into the stored full-week record.
// Only the uploading company's events for the affected dates are replaced;
// other companies' events (and dates not in this upload) are left untouched.
function mergeCompanyDays(storedDays, newDays, companyId) {
  const map = new Map()
  ;(storedDays || []).forEach(d => map.set(d.date, { ...d, events: [...(d.events || [])] }))
  newDays.forEach(nd => {
    if (!map.has(nd.date)) {
      map.set(nd.date, { ...nd, events: [...nd.events] })
    } else {
      const day = map.get(nd.date)
      // Drop this company's previous events for the day, keep everyone else's.
      day.events = day.events.filter(ev => eventCompanyId(ev) !== companyId)
      day.events.push(...nd.events)
      if (!day.shortDate) day.shortDate = nd.shortDate
    }
  })
  return Array.from(map.values()).sort(sortByDate)
}

function detectChanges(oldSummary, newSummary) {
  const changes = []
  newSummary.forEach(newDay => {
    const oldDay = oldSummary.find(d => d.date === newDay.date)
    if (!oldDay) {
      changes.push({ day: newDay.date, room: 'All rooms', change: 'New day added to BEO' })
      return
    }
    newDay.events.forEach(newEv => {
      const oldEv = oldDay.events.find(e => e.beoNumber === newEv.beoNumber)
      if (!oldEv) {
        changes.push({ day: newDay.date, room: newEv.room, change: `New event added: ${newEv.eventName}` })
        return
      }
      if (oldEv.room !== newEv.room) {
        changes.push({ day: newDay.date, room: newEv.room, change: `${newEv.eventName} — room changed: "${oldEv.room}" → "${newEv.room}"` })
      }
      newEv.items.forEach(newItem => {
        if (isBevOrSnack(newItem.name)) return
        const oldItem = oldEv.items.find(i => i.name === newItem.name)
        if (!oldItem) {
          changes.push({ day: newDay.date, room: newEv.room, change: `${newEv.eventName} — new item: ${newItem.name} x${newItem.quantity}` })
        } else if (oldItem.quantity !== newItem.quantity) {
          changes.push({ day: newDay.date, room: newEv.room, change: `${newEv.eventName} — ${newItem.name} qty: ${oldItem.quantity} → ${newItem.quantity}` })
        }
      })
    })
  })
  return changes
}

export async function POST(request) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    const formData = await request.formData()
    const file = formData.get('pdf') || formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Which company sent this file. Defaults to the first company so older
    // clients / single-company uploads keep working.
    const companyRaw = (formData.get('company') || '').toString()
    const companyId = isValidCompanyId(companyRaw) ? companyRaw : DEFAULT_COMPANY_ID

    // Accept a PDF, a pre-converted Markdown/text file, or an Excel workbook.
    // Markdown is read directly (no pdf-parse); Excel is flattened to text via
    // SheetJS. All three feed the same chunk → Claude extraction pipeline.
    const fileName = (file.name || '').toLowerCase()
    const isMarkdown =
      fileName.endsWith('.md') ||
      fileName.endsWith('.markdown') ||
      fileName.endsWith('.txt') ||
      file.type === 'text/markdown' ||
      file.type === 'text/plain'
    const isExcel =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'

    let sourceText
    let pdfPages = null
    if (isMarkdown) {
      sourceText = await file.text()
      console.log(`Markdown: ${sourceText.length} chars`)
    } else if (isExcel) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      sourceText = workbookToText(buffer)
      console.log(`Excel: ${sourceText.length} chars`)
    } else {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      pdfPages = []
      const parsed = await pdfParse(buffer, {
        pagerender: pageData =>
          pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false }).then(textContent => {
            let lastY, text = ''
            for (const item of textContent.items) {
              text += (lastY === item.transform[5] || !lastY) ? item.str : `\n${item.str}`
              lastY = item.transform[5]
            }
            pdfPages.push(text)
            return text
          })
      })
      sourceText = parsed.text
      console.log(`PDF: ${parsed.numpages} pages, ${sourceText.length} chars`)
    }

    if (!sourceText || sourceText.trim().length < 50) {
      throw new Error('Could not read text from the file. Please check the file.')
    }

    // Split into chunks and process all in parallel. For PDFs, chunk along
    // whole page boundaries so a single BEO booking's text never gets split
    // across chunks and two unrelated bookings never get merged into the
    // same chunk — either of those lets Claude cross-attribute one booking's
    // name/room onto a different booking's BEO number. Smaller chunks also
    // keep each individual request fast, avoiding the Vercel function timeout.
    const chunks = pdfPages && pdfPages.length > 0
      ? splitIntoChunksByPage(pdfPages, 4000)
      : splitIntoChunks(sourceText, 4000)
    console.log(`Processing ${chunks.length} chunks in parallel`)

    const chunkResults = await Promise.all(chunks.map(chunk => processChunk(chunk)))
    const combinedText = chunkResults.join('\n')

    const allDays = parseTextToData(combinedText)
    const days = mergeDays(allDays)

    if (!days || days.length === 0) {
      throw new Error('No events could be extracted. Please try again.')
    }

    console.log(`Extracted ${days.length} days for company ${companyId}`)

    // Tag this upload's events with the company that sent them.
    tagDaysWithCompany(days, companyId)

    // Get the previously stored full-week record (all companies) so we can
    // detect changes and merge without clobbering the other company's events.
    let changes = []
    let storedDays = []
    try {
      const { data: previousUploads, error } = await supabase
        .from('beo_uploads')
        .select('id, uploaded_at, summary')
        .order('uploaded_at', { ascending: false })
        .limit(1)

      if (!error && previousUploads && previousUploads.length > 0) {
        // Consolidate on load so any days saved under two date spellings merge
        storedDays = consolidateDays(previousUploads[0].summary || [])
        // Compare this company against ITS OWN previously stored events only,
        // so the other company's orders never show up as added/removed.
        changes = detectChanges(daysForCompany(storedDays, companyId), days)
        changes.forEach(ch => { ch.company = companyId })
      }
    } catch (dbError) {
      console.error('Supabase fetch error:', dbError)
    }

    // Merge this company's events into the stored record. Other companies'
    // events and dates not in this upload are preserved untouched.
    const mergedDays = mergeCompanyDays(storedDays, days, companyId)

    // Save the merged full record to Supabase.
    try {
      const { error: insertError } = await supabase
        .from('beo_uploads')
        .insert({
          week_type: 'all',
          summary: mergedDays,
          uploaded_at: new Date().toISOString()
        })
      if (insertError) {
        console.error('Supabase insert error:', JSON.stringify(insertError))
      }
    } catch (dbError) {
      console.error('Supabase insert exception:', dbError)
    }

    // Return the merged view for the dates in this upload, so the user sees —
    // and can download — every company's events for those shared dates.
    const uploadedDates = new Set(days.map(d => d.date))
    const responseDays = mergedDays.filter(d => uploadedDates.has(d.date))
    const { data: lastUpload } = await supabase
      .from('beo_uploads')
      .select('id')
      .order('uploaded_at', { ascending: false })
      .limit(1)
    const beoId = lastUpload?.[0]?.id || 'unknown'

    return NextResponse.json({
      success: true,
      data: { days: responseDays, changes, beoId }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process file: ' + error.message },
      { status: 500 }
    )
  }
}
