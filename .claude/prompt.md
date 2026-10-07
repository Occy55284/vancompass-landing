# PlateUp — Agent Context

## What is this?

PlateUp is an internal B2B tool for **30 Fenchurch Street** (a venue/event space). It processes **BEO (Banquet Event Order) PDF documents** to extract structured event data, detect changes between uploads, and generate print-ready Excel production sheets for Kitchen and Hospitality teams.

It is **not a public product** — it is a bespoke internal tool built for a specific client.

## Stack

- **Next.js 15** (App Router, JS not TS)
- **Anthropic Claude API** — parses raw BEO PDF text into structured data
- **Supabase** (PostgreSQL) — stores BEO summaries for change detection
- **ExcelJS** — generates formatted `.xlsx` production sheets
- **Vercel** — deployment target (60s function timeout for PDF processing)

## Core flow

1. User uploads a BEO PDF
2. `pdf-parse` extracts text → chunked to ~8KB → sent to Claude API for structured parsing
3. Parsed data compared against previous upload stored in Supabase (change detection)
4. User selects which dates to include → Excel workbook generated with Kitchen + Hospitality sheets per day
5. File downloaded in browser

## Key API routes

- `/api/process-beo` — upload, parse, change detection
- `/api/generate-weekly` — Excel generation

## Things to know

- All styling is CSS-in-JS, dark theme
- Allergen and service-type classification is regex-based (hardcoded lists) — fragile
- No auth, no multi-tenancy, no user tracking — single-client tool
- `generate-sheet` API route appears unused
- No `.env.example` exists — required vars are `ANTHROPIC_API_KEY` and Supabase credentials

## Instructions for the agent

1. Read this file at the start of every session before doing anything else.
2. At the end of every session, **automatically** append a dated entry to the Progress Log below — do not wait to be asked. Keep it to 2–3 lines: what was done, what is next.
3. Do not rewrite or remove old entries.

---

## Progress Log

### 2026-04-26

Initial project setup complete. Core BEO upload, Claude parsing, change detection, and Excel generation are all working. Starting to introduce agent handoff documentation (this file). Next: continue feature development — check with the user for current priorities.

### 2026-04-28

Fixed partial BEO upload behaviour: uploading a single-day BEO now merges that day into the stored full-week Supabase record rather than replacing it. Change detection now only shows changes for the days included in the upload. Next: continue testing with real BEOs, check with user for next priorities.

### 2026-06-12

Added a PDF → Markdown conversion tool to the front page (new "Tools" section) backed by a new `/api/pdf-to-md` route: pdf-parse extracts text, Claude converts chunks to Markdown in parallel, browser downloads the `.md` file. Next: user testing with real PDFs; consider a preview/copy option instead of download-only.

### 2026-06-16

Main BEO uploader now accepts Markdown/text as well as PDF: `/api/process-beo` detects `.md`/`.markdown`/`.txt` (by extension or MIME) and reads the text directly, skipping pdf-parse, while PDFs work exactly as before; downstream chunking/extraction/change-detection/Excel are unchanged. Front page input + labels updated to advertise "PDF or Markdown". Next: real-world testing with converted `.md` BEOs; note conversion adds an Opus pass so it isn't cheaper, just more reviewable — revisit if cost is the priority.

### 2026-06-17

Main BEO uploader now also accepts Excel (`.xlsx`/`.xls`): `/api/process-beo` detects spreadsheets (by extension or MIME) and flattens every sheet to labelled CSV text via the already-installed SheetJS (`xlsx`), then feeds the same chunk → Claude → change-detection → Excel pipeline (PDF/Markdown paths unchanged). Front page input `accept` + labels updated to advertise "PDF, Excel or Markdown". Verified with `next build` and a unit test of the workbook-to-text helper. Next: test with a real Excel BEO and confirm Claude extracts events correctly from the tabular layout — may need prompt tweaks if the spreadsheet structure differs a lot from the PDF text.

### 2026-06-17 (multi-company support)

Added per-company separation so two companies can send orders for the same date without clobbering each other. New `app/companies.js` defines the two fixed companies (single source of truth; rename via `name`/`short`, keep `id` stable). `/api/process-beo` now tags each upload's events with the selected company, stores the FULL day/event record (not the old lossy summary), merges at the event level per company (a company's upload only replaces its own events for those dates — others preserved), and scopes change-detection to the same company. `/api/generate-weekly` groups each day's events by company and emits separate Kitchen + Hospitality tabs per company (tab/title include company name). Front page has a company picker before upload and labels each event with its company short tag. Verified with `next build` + a merge simulation. Note: the two companies are placeholder-named ("Company A"/"Company B") — needs the real names from the user. Also, legacy events stored before this change have no company tag and are treated as the default (first) company until that company re-uploads. Next: confirm real company names, then real-world test with both companies' files for a shared date.

### 2026-06-18

User reported confusion: downloading 18 June showed both DELPHI and PLACES events after only uploading a Places file. Root cause was NOT a bug in the merge logic (`mergeCompanyDays` correctly preserves each company's own events per date) — it was 93 legacy events across the stored record (pre-dating the multi-company feature) with no `company` tag, defaulting to Delphi (`DEFAULT_COMPANY_ID`) at render time. Confirmed with user these are real Delphi data, so ran a one-off Supabase update tagging all 93 untagged events explicitly as `company-a`. Next: confirm Delphi/Places are the correct real company names (still placeholders in `app/companies.js`); consider surfacing company attribution more clearly in the UI so untagged/legacy data is obvious before it causes confusion again.

### 2026-07-15

Disabled FOH/Hospitality sheet generation to focus on getting Kitchen production sheets right first. Enhanced the Claude extraction prompt to capture a new item-level `details` field (product descriptions, accompaniments, preparation notes). Kitchen sheet Details column now combines item details + item notes + event dietary requirements (previously only showed one). Strengthened allergen/dietary guidance in the prompt. Removed Hospitality nav pill from the front-end.

### 2026-07-15 (filtering, change detection, cleanup)

Comprehensive non-food filtering: added two-tier keep-list/skip-list (`isSnackOrBev` in generate-weekly, `isBevOrSnack` in process-beo) — keep-list (pot, bowl, brioche, bacon, sandwich) overrides skip-list (100+ drink/wine/snack/non-food terms) so food items with drink-adjacent words aren't wrongly excluded. Past-date filtering added to both Excel generation and front-end display. Simplified change detection to only report kitchen-relevant changes: room changes, new events, new food items, food quantity changes — removed item-removal tracking and drink/tea/coffee/Just Eat noise entirely. Fixed false "changes detected" on duplicate upload by matching items by name only (not name+time, since Claude's time extraction is non-deterministic). Cleared all 32 Supabase rows for fresh start. PRs #10–#16 created and deployed. Next: merge PR #16, user testing with real BEOs, revisit FOH sheets once Kitchen is solid.

### 2026-07-20

Fixed Chestnut Room and event timing extraction issues across three layers: (1) Claude extraction prompt clarification (PR #21); (2) enhanced prompt with concrete examples and timing rules (PR #22); (3) post-processing safety net that guarantees room names are moved from dietaryRequirements to room field (PR #23). All PRs merged. Added `extractRoomNamesFromDietary()` function with known room names list (Beech, Chestnut, Willow, Welcome Area, etc.) to catch and correct any misextractions. Next: real-world testing with BEOs containing Chestnut Room to confirm all three layers work together correctly.

### 2026-09-02

Fixed two bugs causing missing items and room numbers in BEO extraction: (1) Added numeric room identifiers (3.20, 4.31, 4.25, NW-681) and additional named rooms to KNOWN_ROOMS array; (2) Strengthened Claude extraction prompt to be far more aggressive about capturing ALL items, with explicit emphasis on pizzas, cakes, canapes, cookies, and items nested in bullet points or grouped sections (PR #30 — merged). Also implemented three report styling improvements (PR #31): unified all text to size 13 for better readability, changed dietary/description column to standard (not bold) formatting, and added print timestamp footer showing when each report was generated. All changes deployed and ready for testing.

### 2026-10-01

Investigated a Places download that looked empty: the Places Excel export is mostly drinks, which the kitchen sheet filters out on purpose, so some days (e.g. 8 Oct) had no rows. Kitchen sheets with no food items now show an amber "No kitchen items — drinks / non-food only" row instead of looking blank. Found but NOT yet fixed: (1) the same date is stored in two spellings ("05 October" from Delphi vs "5 October" from Places), creating duplicate days/tabs — needs date normalisation plus a one-off Supabase merge; (2) `isSnackOrBev` matches substrings ("tea" hides "steak", "rum" hides "crumble", "biscuits" hidden) — needs whole-word matching. Next: do those two fixes.

### 2026-10-01 (drinks filter)

Moved the drinks/snack skip-list into one shared file, `app/itemFilter.js` (was copy-pasted into generate-weekly, process-beo and download-last-report; `generate-sheet` is unused and untouched). It now matches whole words only (plurals allowed), so "steak", "crumble", "watercress", "teacake" are no longer hidden, and "biscuit" joins the keep-list so "Tea, coffee & biscuits" now appears on kitchen sheets. Verified old-vs-new on real stored items (only intended changes) and `next build`. Next: normalise date spellings ("05 October" vs "5 October") so days stop duplicating — includes a one-off Supabase merge of existing duplicate days (confirm with user first).

### 2026-10-01 (date normalisation)

Fixed duplicate days caused by Claude writing the same date as "05 October 2026" and "5 October 2026". New `app/dates.js`: `normalizeDate` standardises every extracted date to "D Month YYYY" (also used for `shortDate`, so tab names are now clean e.g. "Delphi 5 October"), and `consolidateDays` merges days sharing a date — same company + same BEO number keeps the version with more items, differing bookings are all kept, and events with BEO "Unknown"/blank are never merged. `process-beo` normalises on parse and consolidates the stored record on load; `download-last-report` consolidates on read. One-off Supabase clean-up applied: inserted a NEW row `eb3b27e0-232f-4629-b59f-51e4298bfe5b` (31 days / 207 events, was 39 / 212; 5 exact duplicate Delphi bookings dropped: 6931, 7498, 6317, 7269, 7499). The previous row `4a0c6169-8a0d-477d-95e5-0579f4944404` was left untouched as the backup; to roll back, delete the new row. Caveats: on 1, 2 and 8 Oct the two spellings held DIFFERENT Delphi bookings, all kept — some may be stale leftovers; re-uploading the Delphi file refreshes a date. Also noticed some past (Sept) events tagged company-b carry Delphi BEO numbers (e.g. 6962, 7178) — likely mis-tagged legacy data, not investigated. Next: user to check the real Delphi/Places downloads; consider a stricter "Unknown" BEO number handling in the extraction prompt.
