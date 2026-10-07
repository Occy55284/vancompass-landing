import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { isSnackOrBev } from '../../itemFilter'
import { COMPANIES, DEFAULT_COMPANY_ID, companyInfo, eventCompanyId } from '../../companies'

const TITLE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
const SECT_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } }
const TIME_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
const ALT_FILL    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3FB' } }
const WARN_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } }
const SEP_FILL    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
const WHITE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
const RED_FILL    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }
const AMBER_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
const GREEN_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }
const LRED_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4CCCC' } }

function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FFBFBFBF' } }
  return { left: s, right: s, top: s, bottom: s }
}
function redBorder() {
  const s = { style: 'medium', color: { argb: 'FFC00000' } }
  return { left: s, right: s, top: s, bottom: s }
}
function medBorder() {
  const s = { style: 'medium', color: { argb: 'FF1F3864' } }
  return { left: s, right: s, top: s, bottom: s }
}

function addChangeLog(ws, changes, ncols, printedAt) {
  const hRow = ws.addRow([`⚠  TODAY'S CHANGES   |   Sheet generated: ${printedAt}`])
  hRow.height = 22
  ws.mergeCells(hRow.number, 1, hRow.number, ncols)
  const hCell = hRow.getCell(1)
  hCell.fill = RED_FILL
  hCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  hCell.alignment = { vertical: 'middle', horizontal: 'left' }
  hCell.border = redBorder()

  if (!changes || changes.length === 0) {
    const nRow = ws.addRow(['   ✓  No changes today — sheet is current'])
    nRow.height = 20
    ws.mergeCells(nRow.number, 1, nRow.number, ncols)
    const nCell = nRow.getCell(1)
    nCell.fill = GREEN_FILL
    nCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF375623' } }
    nCell.alignment = { vertical: 'middle', horizontal: 'left' }
    nCell.border = redBorder()
  } else {
    const chRow = ws.addRow(['Room', 'What Changed'])
    chRow.height = 16
    chRow.eachCell({ includeEmpty: true }, cell => {
      cell.fill = LRED_FILL
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF7B0000' } }
      cell.border = thinBorder()
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ws.mergeCells(chRow.number, 2, chRow.number, ncols)

    changes.forEach(c => {
      const cRow = ws.addRow([c.room, c.change])
      cRow.height = 36
      cRow.eachCell({ includeEmpty: true }, (cell, i) => {
        cell.fill = AMBER_FILL
        cell.font = { name: 'Arial', size: 10, bold: i === 2, color: { argb: i === 2 ? 'FF7B0000' : 'FF000000' } }
        cell.border = thinBorder()
        cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'center' : 'left', wrapText: true }
      })
      ws.mergeCells(cRow.number, 2, cRow.number, ncols)
    })
  }

  const sRow = ws.addRow([])
  sRow.height = 7
  for (let c = 1; c <= ncols; c++) sRow.getCell(c).fill = SEP_FILL
}

function addTitleRow(ws, text, ncols) {
  const row = ws.addRow([text])
  row.height = 32
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = TITLE_FILL
  cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = medBorder()
}

function addHeaderRow(ws, headers) {
  const row = ws.addRow(headers)
  row.height = 22
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = TITLE_FILL
    cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
}

function addSectionRow(ws, label, ncols) {
  const row = ws.addRow([label])
  row.height = 20
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = SECT_FILL
  cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = thinBorder()
}

function addTimeRow(ws, label, ncols) {
  const row = ws.addRow([`   ${label}`])
  row.height = 15
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = TIME_FILL
  cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1F3864' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = thinBorder()
}

function addRoomRow(ws, label, ncols) {
  const row = ws.addRow([`📍  ${label}`])
  row.height = 22
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = SECT_FILL
  cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = medBorder()
}

function addItemRow(ws, values, isAlt, boldCols = []) {
  const row = ws.addRow(values)
  row.height = 40
  const fill = isAlt ? ALT_FILL : WHITE_FILL
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.fill = fill
    cell.font = { name: 'Arial', size: 13, bold: boldCols.includes(colNumber) && !!cell.value }
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = thinBorder()
  })
}

function addSepRow(ws, ncols) {
  const row = ws.addRow([])
  row.height = 7
  for (let c = 1; c <= ncols; c++) row.getCell(c).fill = SEP_FILL
}

function addFooterRow(ws, printedAt, ncols) {
  const fRow = ws.addRow([`Printed: ${printedAt}`])
  fRow.height = 14
  ws.mergeCells(fRow.number, 1, fRow.number, ncols)
  const fCell = fRow.getCell(1)
  fCell.fill = WHITE_FILL
  fCell.font = { name: 'Arial', size: 10, color: { argb: 'FF666666' } }
  fCell.alignment = { vertical: 'middle', horizontal: 'right' }
  fCell.border = thinBorder()
}

// Excel forbids * ? : \ / [ ] in worksheet names and caps them at 31 chars.
// Date strings from Markdown can be numeric (e.g. 14/04/2026), so sanitize.
function safeSheetName(name) {
  return name.replace(/[*?:\\/\[\]]/g, '-').substring(0, 31)
}

function buildKitchenSheet(wb, day, allChanges, printedAt, company, beoId) {
  const tabName = safeSheetName(`🔪 ${company.short} ${day.shortDate}`)
  const ws = wb.addWorksheet(tabName)
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  ws.columns = [
    { width: 32 }, { width: 8 }, { width: 10 },
    { width: 20 }, { width: 14 }, { width: 52 }
  ]

  const dayChanges = (allChanges || [])
    .filter(c => c.day === day.date && (c.company || DEFAULT_COMPANY_ID) === company.id)

  addTitleRow(ws, `🔪  Kitchen Production Sheet — ${company.name} — ${day.date} — BEO #${beoId}`, 6)
  addChangeLog(ws, dayChanges, 6, printedAt)
  addHeaderRow(ws, ['Event Item','Qty','Time','Location','Allergens','Details / Dietary Notes'])

  const sections = ['BREAKFAST','LUNCH','AFTERNOON & CAKES','EVENING']
  const serviceMap = {}

  day.events?.forEach(ev => {
    // Just Eat orders are externally sourced — not prepared in-house kitchen
    if (/just\s*eat/i.test(ev.eventName) || /just\s*eat/i.test(ev.room)) return
    // Skip cancelled events
    if (/cancel/i.test(ev.eventName) || /cancel/i.test(ev.room)) return

    // Log Chestnut room events for debugging
    if (/chestnut/i.test(ev.room)) {
      console.log(`[CHESTNUT EVENT] ${ev.eventName} in ${ev.room} - Items: ${ev.items?.length || 0}`)
      ev.items?.forEach(item => {
        console.log(`  - ${item.name} x${item.quantity} (${item.service})`)
      })
    }

    ev.items?.forEach(item => {
      if (isSnackOrBev(item.name)) return
      const svc = item.service || 'BREAKFAST'
      if (!serviceMap[svc]) serviceMap[svc] = []
      const noteParts = []
      if (item.details) noteParts.push(item.details)
      if (item.notes) noteParts.push(item.notes)
      if (ev.dietaryRequirements) noteParts.push(`Dietary: ${ev.dietaryRequirements}`)
      serviceMap[svc].push({
        name: item.name, qty: item.quantity, time: item.time,
        location: ev.room, allergens: item.allergens || '',
        notes: noteParts.join('\n') || ''
      })
    })
  })

  // If every item was filtered out (e.g. a drinks-only order), say so rather
  // than leaving the sheet looking like the order was missed.
  const hasFood = sections.some(s => (serviceMap[s] || []).length > 0)
  if (!hasFood) {
    const row = ws.addRow(['No kitchen items for this day — the order contains drinks / non-food items only'])
    row.height = 30
    ws.mergeCells(row.number, 1, row.number, 6)
    const cell = row.getCell(1)
    cell.fill = AMBER_FILL
    cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF7B0000' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    cell.border = thinBorder()
  }

  sections.forEach(section => {
    const items = (serviceMap[section] || [])
      .sort((a,b) => {
        // Sort by time first, then by location, then by name
        const timeCompare = (a.time||'').localeCompare(b.time||'')
        if (timeCompare !== 0) return timeCompare
        const locCompare = (a.location||'').localeCompare(b.location||'')
        if (locCompare !== 0) return locCompare
        return a.name.localeCompare(b.name)
      })
    if (!items.length) return
    addSectionRow(ws, section, 6)
    items.forEach((item, idx) => {
      addItemRow(ws,
        [item.name, item.qty, item.time, item.location, item.allergens, item.notes],
        idx % 2 === 1, [5])
    })
    addSepRow(ws, 6)
  })

  addFooterRow(ws, printedAt, 6)
}

function buildHospitalitySheet(wb, day, allChanges, printedAt, company) {
  const tabName = safeSheetName(`🛎 ${company.short} ${day.shortDate}`)
  const ws = wb.addWorksheet(tabName)
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  ws.columns = [
    { width: 34 }, { width: 8 }, { width: 10 },
    { width: 16 }, { width: 54 }
  ]

  const dayChanges = (allChanges || [])
    .filter(c => c.day === day.date && (c.company || DEFAULT_COMPANY_ID) === company.id)

  addTitleRow(ws, `🛎  Hospitality Sheet — ${company.name} — ${day.date}`, 5)
  addChangeLog(ws, dayChanges, 5, printedAt)
  addHeaderRow(ws, ['Event Item','Qty','Time','Allergens','Details / Dietary Notes'])

  day.events?.forEach(ev => {
    // Skip cancelled events
    if (/cancel/i.test(ev.eventName) || /cancel/i.test(ev.room)) return
    addRoomRow(ws, `${ev.room}   |   ${ev.eventName}`, 5)

    const timeGroups = {}
    ev.items?.forEach(item => {
      const key = `${item.time}|${item.service}`
      if (!timeGroups[key]) timeGroups[key] = { time: item.time, service: item.service, items: [] }
      timeGroups[key].items.push(item)
    })

    Object.values(timeGroups)
      .sort((a,b) => (a.time||'').localeCompare(b.time||''))
      .forEach(group => {
        addTimeRow(ws, `${group.time}  |  ${group.service}`, 5)
        group.items.forEach((item, idx) => {
          addItemRow(ws,
            [item.name, item.quantity, item.time, item.allergens || '', ev.dietaryRequirements || item.notes || ''],
            idx % 2 === 1, [4])
        })
        addSepRow(ws, 5)
      })
  })

  addFooterRow(ws, printedAt, 5)
}

export async function POST(request) {
  try {
    const { data } = await request.json()
    const wb = new ExcelJS.Workbook()
    const allChanges = data.changes || []
    const beoId = data.beoId || 'unknown'
    const printedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/London'
    })

    if (!data.days || data.days.length === 0) {
      return NextResponse.json({ error: 'No days found in BEO data' }, { status: 400 })
    }

    const MONTHS = { January:0, February:1, March:2, April:3, May:4, June:5,
      July:6, August:7, September:8, October:9, November:10, December:11 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const futureDays = data.days.filter(day => {
      const parts = (day.date || '').split(' ')
      if (parts.length !== 3) return true
      const d = new Date(parseInt(parts[2]), MONTHS[parts[1]] ?? 0, parseInt(parts[0]))
      return d >= today
    })

    if (futureDays.length === 0) {
      return NextResponse.json({ error: 'All selected dates are in the past' }, { status: 400 })
    }

    futureDays.forEach(day => {
      // Split the day's events by company so each company gets its own tabs.
      const byCompany = new Map()
      ;(day.events || []).forEach(ev => {
        const cid = eventCompanyId(ev)
        if (!byCompany.has(cid)) byCompany.set(cid, [])
        byCompany.get(cid).push(ev)
      })

      // Emit tabs in a stable order (configured companies first, then any
      // unexpected ids), skipping companies with no events that day.
      const orderedIds = COMPANIES.map(c => c.id).filter(id => byCompany.has(id))
      byCompany.forEach((_, id) => { if (!orderedIds.includes(id)) orderedIds.push(id) })

      orderedIds.forEach(cid => {
        const company = companyInfo(cid)
        const dayForCompany = { ...day, events: byCompany.get(cid) }
        buildKitchenSheet(wb, dayForCompany, allChanges, printedAt, company, beoId)
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const firstDay = futureDays[0]?.shortDate?.replace(/ /g,'_') || 'week'
    const lastDay = futureDays[futureDays.length-1]?.shortDate?.replace(/ /g,'_') || ''

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PlateUp_Weekly_${firstDay}_to_${lastDay}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Weekly sheet error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
