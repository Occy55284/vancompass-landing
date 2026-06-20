# VanCompass Landing — Progress Log

A running log of work done on this repo, session by session. Update this file at the end of each work session: add a new entry at the top with the date, what shipped, and what's still open.

---

## 2026-06-19

**Shipped (PRs #1–#8, all merged):**
- Scaffolded the landing page as a Next.js / React app (replacing the original placeholder `index.html`), deployed on Vercel, domain `vancompass.co.uk` connected and live.
- Swapped the CTA email to the real Gmail address.
- Added Vercel Web Analytics.
- Added a real waitlist signup form, backed by a Supabase `waitlist` table (RLS: anon insert-only).
- Added dynamic OG/Twitter social preview image generation (`opengraph-image.tsx`).
- Added the VanCompass logo: header badge, favicon/app icon, and a large badge above the hero heading. Iterated on sizing twice after feedback that it was "too tiny" and got lost against the dark background — now sits in a white circular badge at 176px in the hero.
- Added hover-preview popovers on the feature cards (Surf, Kite, Fishing, Wild camps, Van services, Near me) — hovering a card shows a screenshot of that part of the app.
- Replaced the "Weather & tides" card with a "Near me" card per request.
- Wired in real app screenshots as they were dropped into the repo: `surf.png`, `kite.png`, `fishing.png`, `camping.png`, `nearme.png`.

**Open / not yet done:**
- `events.PNG` was uploaded to the repo but not yet used — need to confirm which card (or new card) it belongs to.
- "Van services" feature card still uses a placeholder SVG screenshot — no real screenshot provided yet.
- Email forwarding for `hello@vancompass.co.uk` at 123-reg — explicitly deferred early on, not yet revisited.

**Notes / gotchas for next time:**
- The user adds new asset files (logos, screenshots) by uploading them directly to the repo root on `main` — check `git log origin/main` / `git diff HEAD origin/main --stat` for new files at the start of a session.
- Vercel preview deployments are protected by Vercel SSO, so direct `WebFetch`/`curl` to preview URLs returns 401 — use `mcp__Vercel__web_fetch_vercel_url` instead.
- Always run `npm run build` locally before pushing — `next-env.d.ts` gets auto-modified by the build and should not be committed (`git checkout next-env.d.ts` before committing).
