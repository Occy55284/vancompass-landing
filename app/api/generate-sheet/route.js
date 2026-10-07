import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

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

function addChangeLog(ws, changes, ncols, printedAt) {
  // Header
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
    // Column headers
    const chHdrs = ['Room', 'What Changed']
    const chRow = ws.addRow(chHdrs)
    chRow.height = 16
    chRow.eachCell({ includeEmpty: true }, (cell, i) => {
      cell.fill = LRED_FILL
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF7B0000' } }
      cell.border = thinBorder()
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    // Merge remaining columns into last cell
    ws.mergeCells(chRow.number, 2, chRow.number, ncols)

    // Change rows
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

  // Spacer
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
}

function addHeaderRow(ws, headers) {
  const row = ws.addRow(headers)
  row.height = 22
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = TITLE_FILL
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  ws.freeze_panes = 'A3'
}

function addSectionRow(ws, label, ncols) {
  const row = ws.addRow([label])
  row.height = 20
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = SECT_FILL
  cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = thinBorder()
}

function addTimeRow(ws, label, ncols) {
  const row = ws.addRow([`   ${label}`])
  row.height = 15
  ws.mergeCells(row.number, 1, row.number, ncols)
  const cell = row.getCell(1)
  cell.fill = TIME_FILL
  cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1F3864' } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.border = thinBorder()
}

function addItemRow(ws, values, isWarn, isAlt) {
  const row = ws.addRow(values)
  row.height = 40
  const fill = isWarn ? WARN_FILL : (isAlt ? ALT_FILL : WHITE_FILL)
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = fill
    cell.font = { name: 'Arial', size: 11 }
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = thinBorder()
  })
}

function addSepRow(ws, ncols) {
  const row = ws.addRow([])
  row.height = 7
  for (let c = 1; c <= ncols; c++) row.getCell(c).fill = SEP_FILL
}

function isSnackOrBev(name) {
  const n = name.toLowerCase()
  const skip = [
    // Hot drinks
    'tea', 'coffee', 'hot chocolate',
    // Soft drinks & mixers
    'water', 'juice', 'soft drink', 'coca', 'lemonade', '7up', 'fanta',
    'lemonaid', 'kombucha', 'smoothie', 'squash', 'cordial', 'elderflower',
    'presse', 'tonic', 'soda water', 'remedy', 'fentiman',
    // Beer & cider
    'beer', 'lager', 'ale', 'cider', 'corona', 'peroni',
    // Wine & sparkling
    'wine', 'prosecco', 'champagne', 'sparkling', 'filtered',
    // Spirits & cocktails
    'gin', 'vodka', 'rum', 'whisky', 'whiskey', 'liqueur', 'spirits',
    'cocktail', 'mocktail',
    // Snacks
    'crisp', 'nibble', 'rice cake', 'pretzel',
  ]
  return skip.some(k => n.includes(k))
}

export async function POST(request) {
  try {
    const { data, type } = await request.json()
    const wb = new ExcelJS.Workbook()
    const printedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const changes = data.changes || []

    if (type === 'Kitchen') {
      const ws = wb.addWorksheet('Kitchen Sheet')
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      ws.columns = [
        { width: 32 }, { width: 8 }, { width: 10 },
        { width: 20 }, { width: 14 }, { width: 52 }, { width: 10 }
      ]

      addTitleRow(ws, `🔪  Kitchen Production Sheet — ${data.date}`, 7)
      addChangeLog(ws, changes, 7, printedAt)
      addHeaderRow(ws, ['Event Item','Qty','Time','Location','Allergens','Details / Dietary Notes','Total Qty'])

      const sections = ['BREAKFAST','LUNCH','AFTERNOON & CAKES','EVENING']
      const serviceMap = {}
      data.events?.forEach(ev => {
        ev.items?.forEach(item => {
          if (isSnackOrBev(item.name)) return
          const svc = item.service || 'BREAKFAST'
          if (!serviceMap[svc]) serviceMap[svc] = []
          serviceMap[svc].push({
            name: item.name, qty: item.quantity, time: item.time,
            location: ev.room, allergens: item.allergens || '',
            notes: item.notes || '', total: item.totalQty
          })
        })
      })

      sections.forEach(section => {
        const items = (serviceMap[section] || [])
          .sort((a,b) => a.name.localeCompare(b.name) || (a.time||'').localeCompare(b.time||''))
        if (!items.length) return
        addSectionRow(ws, section, 7)
        items.forEach((item, idx) => {
          addItemRow(ws,
            [item.name, item.qty, item.time, item.location, item.allergens, item.notes, item.total],
            false, idx % 2 === 1)
        })
        addSepRow(ws, 7)
      })

    } else {
      const ws = wb.addWorksheet('Hospitality Sheet')
      ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
      ws.columns = [
        { width: 34 }, { width: 8 }, { width: 10 },
        { width: 16 }, { width: 54 }, { width: 10 }
      ]

      addTitleRow(ws, `🛎  Hospitality Sheet — ${data.date}`, 6)
      addChangeLog(ws, changes, 6, printedAt)
      addHeaderRow(ws, ['Event Item','Qty','Time','Allergens','Details / Dietary Notes','Total Qty'])

      data.events?.forEach(ev => {
        const roomRow = ws.addRow([`📍  ${ev.room}   |   ${ev.eventName}`])
        roomRow.height = 22
        ws.mergeCells(roomRow.number, 1, roomRow.number, 6)
        const rc = roomRow.getCell(1)
        rc.fill = SECT_FILL
        rc.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
        rc.alignment = { vertical: 'middle', horizontal: 'left' }

        const timeGroups = {}
        ev.items?.forEach(item => {
          const key = `${item.time}|${item.service}`
          if (!timeGroups[key]) timeGroups[key] = { time: item.time, service: item.service, items: [] }
          timeGroups[key].items.push(item)
        })

        Object.values(timeGroups)
          .sort((a,b) => (a.time||'').localeCompare(b.time||''))
          .forEach(group => {
            addTimeRow(ws, `${group.time}  |  ${group.service}`, 6)
            group.items.forEach((item, idx) => {
              addItemRow(ws,
                [item.name, item.quantity, item.time, item.allergens || '', item.notes || '', item.totalQty],
                false, idx % 2 === 1)
            })
            addSepRow(ws, 6)
          })
      })
    }

    const buffer = await wb.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PlateUp_${type}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Sheet generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
