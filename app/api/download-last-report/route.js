import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import { isSnackOrBev } from '../../itemFilter'
import { consolidateDays } from '../../dates'
import { COMPANIES, DEFAULT_COMPANY_ID, companyInfo, eventCompanyId } from '../../companies'

// Reuse functions from generate-weekly
const TITLE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } }
const SECT_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } }
const TIME_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } }
const ALT_FILL    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF3FB' } }
const WHITE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
const SEP_FILL    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }

function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FFBFBFBF' } }
  return { left: s, right: s, top: s, bottom: s }
}

function medBorder() {
  const s = { style: 'medium', color: { argb: 'FF1F3864' } }
  return { left: s, right: s, top: s, bottom: s }
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

function safeSheetName(name) {
  return name.replace(/[*?:\\/\[\]]/g, '-').substring(0, 31)
}

function buildKitchenSheet(wb, day, printedAt, company, beoId) {
  const tabName = safeSheetName(`🔪 ${company.short} ${day.shortDate}`)
  const ws = wb.addWorksheet(tabName)
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  ws.columns = [
    { width: 32 }, { width: 8 }, { width: 10 },
    { width: 20 }, { width: 14 }, { width: 52 }
  ]

  addTitleRow(ws, `🔪  Kitchen Production Sheet — ${company.name} — ${day.date} — BEO #${beoId}`, 6)
  addHeaderRow(ws, ['Event Item','Qty','Time','Location','Allergens','Details / Dietary Notes'])

  const sections = ['BREAKFAST','LUNCH','AFTERNOON & CAKES','EVENING']
  const serviceMap = {}

  day.events?.forEach(ev => {
    if (/just\s*eat/i.test(ev.eventName) || /just\s*eat/i.test(ev.room)) return
    if (/cancel/i.test(ev.eventName) || /cancel/i.test(ev.room)) return

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

  sections.forEach(section => {
    const items = (serviceMap[section] || [])
      .sort((a,b) => {
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

export async function GET(request) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    // Fetch the most recent upload
    const { data: previousUploads, error } = await supabase
      .from('beo_uploads')
      .select('id, uploaded_at, summary')
      .order('uploaded_at', { ascending: false })
      .limit(1)

    if (error || !previousUploads || previousUploads.length === 0) {
      return NextResponse.json({ error: 'No previous BEO uploads found' }, { status: 404 })
    }

    const beoId = previousUploads[0].id
    // Merge any days that were saved under two date spellings (05 vs 5 October)
    const days = consolidateDays(previousUploads[0].summary || [])
    if (!days || days.length === 0) {
      return NextResponse.json({ error: 'No events in last upload' }, { status: 400 })
    }

    // Filter future dates
    const MONTHS = { January:0, February:1, March:2, April:3, May:4, June:5,
      July:6, August:7, September:8, October:9, November:10, December:11 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const futureDays = days.filter(day => {
      const parts = (day.date || '').split(' ')
      if (parts.length !== 3) return true
      const d = new Date(parseInt(parts[2]), MONTHS[parts[1]] ?? 0, parseInt(parts[0]))
      return d >= today
    })

    if (futureDays.length === 0) {
      return NextResponse.json({ error: 'All dates in last upload are in the past' }, { status: 400 })
    }

    // Generate Excel
    const wb = new ExcelJS.Workbook()
    const printedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/London'
    })

    futureDays.forEach(day => {
      const byCompany = new Map()
      ;(day.events || []).forEach(ev => {
        const cid = eventCompanyId(ev)
        if (!byCompany.has(cid)) byCompany.set(cid, [])
        byCompany.get(cid).push(ev)
      })

      const orderedIds = COMPANIES.map(c => c.id).filter(id => byCompany.has(id))
      byCompany.forEach((_, id) => { if (!orderedIds.includes(id)) orderedIds.push(id) })

      orderedIds.forEach(cid => {
        const company = companyInfo(cid)
        const dayForCompany = { ...day, events: byCompany.get(cid) }
        buildKitchenSheet(wb, dayForCompany, printedAt, company, beoId)
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const firstDay = futureDays[0]?.shortDate?.replace(/ /g,'_') || 'week'
    const lastDay = futureDays[futureDays.length-1]?.shortDate?.replace(/ /g,'_') || ''

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PlateUp_Latest_${firstDay}_to_${lastDay}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Download last report error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
