// Single source of truth for the companies that send in orders.
//
// PlateUp is used by 30 Fenchurch Street, but more than one catering company
// can send orders for the same date. Each upload is tagged with one of these
// companies so that uploading one company's file never overwrites another
// company's events for a shared date.
//
// To rename a company, just edit `name`/`short` below — `id` is the stable key
// stored against every event, so leave the ids alone once data exists.
export const COMPANIES = [
  { id: 'company-a', name: 'Delphi', short: 'Delphi' },
  { id: 'company-b', name: 'Places', short: 'Places' }
]

// Events stored before companies existed (or from an unknown source) are
// treated as belonging to the first company.
export const DEFAULT_COMPANY_ID = COMPANIES[0].id

const COMPANY_MAP = Object.fromEntries(COMPANIES.map(c => [c.id, c]))

export function companyInfo(id) {
  return COMPANY_MAP[id] || COMPANY_MAP[DEFAULT_COMPANY_ID]
}

// Normalise an event's company id, falling back to the default for untagged
// (legacy) events.
export function eventCompanyId(ev) {
  return (ev && ev.company) || DEFAULT_COMPANY_ID
}

export function isValidCompanyId(id) {
  return Boolean(id && COMPANY_MAP[id])
}
