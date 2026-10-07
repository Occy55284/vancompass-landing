// Date handling shared by the BEO routes.
//
// Claude sometimes writes the same date as "05 October 2026" and sometimes as
// "5 October 2026". Days are keyed by this string, so the two spellings used
// to become two separate days (duplicate sheet tabs, split orders). Every date
// is now standardised to "D Month YYYY" (no leading zero).

import { eventCompanyId } from './companies'

const DATE_RE = /^\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/

// "05 october 2026" -> "5 October 2026". Anything that doesn't look like a
// date is returned trimmed but otherwise unchanged.
export function normalizeDate(raw) {
  const str = String(raw || '').trim()
  const m = str.match(DATE_RE)
  if (!m) return str
  const month = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()
  return `${parseInt(m[1], 10)} ${month} ${m[3]}`
}

// "5 October 2026" -> "5 October" (used for Excel tab names and file names).
export function shortDateFor(normalized) {
  const m = String(normalized || '').match(DATE_RE)
  return m ? `${parseInt(m[1], 10)} ${m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()}` : String(normalized || '').substring(0, 10)
}

// Some extracted events have no real booking number ("Unknown", "N/A", blank).
// Those must never be treated as the same booking as each other.
function hasRealBeoNumber(ev) {
  const n = String((ev && ev.beoNumber) || '').trim()
  return n !== '' && !/^(unknown|n\/?a|none|tbc|-+)$/i.test(n)
}

// Standardise every day's date and merge days that now share a date. Within a
// merged day, the same company's booking with the same BEO number appears once
// (the version with more items wins); bookings that differ are all kept.
export function consolidateDays(days) {
  const byDate = new Map()
  ;(days || []).forEach(day => {
    const date = normalizeDate(day.date)
    if (!byDate.has(date)) byDate.set(date, { ...day, date, shortDate: shortDateFor(date), events: [] })
    const target = byDate.get(date)
    ;(day.events || []).forEach(ev => {
      const idx = hasRealBeoNumber(ev)
        ? target.events.findIndex(e => e.beoNumber === ev.beoNumber && eventCompanyId(e) === eventCompanyId(ev))
        : -1
      if (idx === -1) {
        target.events.push(ev)
      } else if ((ev.items || []).length > (target.events[idx].items || []).length) {
        target.events[idx] = ev
      }
    })
  })
  return Array.from(byDate.values())
}
