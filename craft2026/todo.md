# Craft 2026 Schedule App — Plan

## Decisions

- **Frontend:** React + TypeScript, scaffolded with Vite, in a new top-level `app/` directory
- **Local-first sync:** Automerge (`@automerge/automerge-repo` + `@automerge/automerge-repo-react-hooks`)
- **Sync server:** `sync.home.halfbakery.xyz` via Automerge WebSocket sync protocol
- **PWA:** `vite-plugin-pwa`
- **Identity:** Passphrase-based — generated on first use or entered manually to recover an existing account. Passphrase deterministically derives an Automerge document ID.
- **Deployment:** Purely static (no backend); Vite builds to static files served independently
- **Testing:** Vitest + React Testing Library (unit & component) + Playwright (e2e), TDD approach
- **Stretch goal:** Store conference schedule itself in Automerge so updates sync automatically
- **Stretch goal:** Pocket ID / OIDC sign-in via `auth.home.halfbakery.xyz`

---

## To Do

- [x] Project scaffold
  - [x] Create `app/` with Vite + React + TypeScript
  - [x] Configure Vitest and React Testing Library
  - [x] Configure Playwright
  - [x] Add `vite-plugin-pwa` and basic PWA manifest
  - [x] Add Automerge dependencies (`@automerge/automerge-repo`, `@automerge/automerge-repo-react-hooks`, `@automerge/automerge-repo-network-websocket`, `@automerge/automerge-repo-storage-indexeddb`)

- [x] Passphrase identity
  - [x] `generatePassphrase()` — returns a random human-readable passphrase (e.g. 4 words)
  - [x] `passphraseToDocId()` — deterministically derives an Automerge document URL / ID from a passphrase
  - [x] Persist passphrase in localStorage on first use
  - [x] UI: on first visit, offer "Create new account" (shows generated passphrase) or "Enter existing passphrase"
  - [x] UI: display and allow copying of the user's passphrase

- [x] Automerge setup
  - [x] Define `UserDocument` type — contains bookmarked slot IDs (a set of integers)
  - [x] Create/open the user's Automerge doc from the derived document ID
  - [x] Wire up WebSocket sync to `sync.home.halfbakery.xyz`
  - [x] Wire up IndexedDB storage for offline persistence
  - [x] Provide Automerge `Repo` via React context

- [x] Schedule data
  - [x] Load `craft2026/schedule.json` as a static asset
  - [x] Define TypeScript types matching `craft2026/schedule-schema.json`
  - [x] Make schedule data available to components via a hook or context

- [x] Session list view
  - [x] Display all sessions grouped by day (one day per page/tab)
  - [x] Show session title, time, stage/room, speaker(s)
  - [x] Filter by tag
  - [x] Filter by stage/room
  - [x] Filters reflected in URL (back/forward works)
  - [x] Scroll position preserved on navigation and refresh

- [x] Session detail view
  - [x] Show full session details (title, speakers, description, tags, etc.)
  - [x] Bookmark button (add/remove from personal schedule)

- [x] Personal schedule
  - [x] View personal schedule (bookmarked sessions, grouped by day)
  - [x] Handle overlapping sessions in the display
  - [x] Bookmark button in session list view (add/remove)
  - [x] Bookmark button in session detail view (add/remove)
  - [x] Button state reflects current bookmark status

- [x] Schedule data: add `description` and `level` to talks
  - [x] Update `craft2026/schedule-schema.json` — add `description` and `level` fields to the `Talk` definition
  - [x] Update `craft2026/update-schedule.py` (or equivalent scraper) to fetch `description` and `level` from each talk page on craft-conf.com and include them in the output
  - [x] Re-run the scraper and commit updated `craft2026/schedule.json` with real values

- [x] PWA / offline
  - [x] Service worker caches static assets and schedule data
  - [x] App is fully usable offline (view schedule, manage bookmarks)
  - [x] Syncs bookmarks when connectivity is restored
  - [x] PWA icons (192×192, 512×512, apple-touch-icon)
  - [x] SW registered via `registerSW` in `main.tsx` (auto-update)
  - [x] `OfflineBanner` shown when browser is offline

- [x] Feature: filter controls in "My Schedule"
  - [x] Show the same tag and stage/room filter dropdowns in "My Schedule" as in the full schedule, scoped to the bookmarked sessions on the selected day
  - [x] Filters reflected in URL (shared `?tag=` and `?stage=` params, same as the full schedule)

- [x] Bug: "My Schedule" missing day tabs
  - [x] "My Schedule" now uses the same day-tab structure as the full schedule, sharing the `?day=` URL param

- [x] Bug: "My Schedule" tab not reflected in URL
  - [x] Active view is now encoded as `?view=myschedule` (My Schedule) or omitted (Schedule, the default); navigating back from a session detail correctly restores the active view

- [x] Deployment to Render
  - [x] Follow https://vite.dev/guide/static-deploy#render to set up a Static Site on render.com
  - [x] Set build command to `npm run build` and publish directory to `dist` (from the `app/` subdirectory)
  - [x] Confirm the deployed URL works correctly with Vite's client-side routing (configure rewrite rule so all routes serve `index.html`)

- [x] Search engine exclusion
  - [x] Add `robots.txt` with `Disallow: /` for all crawlers
  - [x] Add `<meta name="robots" content="noindex, nofollow">` in `index.html`
  - [x] Verify the deployed site is not accidentally submitted to any search index

- [ ] Error handling
  - [x] Graceful UI when sync server is unreachable (offline banner + Automerge falls back to IndexedDB)
  - [ ] Graceful UI when schedule data fails to load

- [ ] Stretch: Schedule in Automerge
  - [ ] Store `craft2026/schedule.json` contents in a shared read-only Automerge doc
  - [ ] Sync schedule updates through the sync server
  - [ ] Fall back to bundled schedule if sync is unavailable

- [x] Stretch: Speaker pages
  - [ ] Option A — Scrape: fetch speaker bio and photo from craft-conf.com; add fields to schema/JSON; show on session detail view
  - [x] Option B (preferred) — In-app speaker page: derive speaker info from the existing schedule data (no scraping needed); create a speaker detail view listing all their talks, workshops, and other events; include a clearly labelled link to the speaker's page on craft-conf.com for full bio/details

- [ ] Stretch: full text search across speakers, sessions, etc

- [ ] Improvement: Migrate navigation to wouter
   - [ ] Add e2e tests and confirm they cover the existing routing logic, including checking mutatants
   - [ ] Add `wouter` dependency
   - [ ] Write `AppRouter` integration tests (verify view rendering per URL)
   - [ ] Create `RouterLayer` wrapper component with wouter `<Route>` declarations
   - [ ] Replace `useSessionListParams`'s `view` dispatch with wouter view routing
   - [ ] Replace `?session=` overlay with path-based `/session/:id` route
   - [ ] Replace `?speaker=` overlay with path-based `/speaker/:slug` route
   - [ ] Update nav buttons to use wouter `<Link>` / `useNavigate`
   - [ ] Remove `useSessionDetailParam`, `useSpeakerParam` and `view` handling from `useSessionListParams`
   - [ ] Verify all existing component tests still pass
   - [ ] Verify e2e tests still pass

- [x] Improvement: ensure the input box on ios doesn't allow the first character to be uppercase 
- [x] Improvement: improve the styling of the intial new/recover account screen be consistent with the rest and mobile friendly (no zooming to the box)

- [x] Stretch: Hide past events toggle
  - [x] Add a persistent boolean preference (stored in the user's Automerge doc) to hide sessions whose end time has passed
  - [x] Show a toggle in the UI (e.g. in the filter bar) to enable/disable this; state syncs across devices via Automerge
  - [x] Apply the filter in both the full schedule and "My Schedule" views

- [ ] Stretch: Pocket ID / OIDC
  - [ ] Integrate OIDC sign-in via `auth.home.halfbakery.xyz`
  - [ ] Link OIDC identity to Automerge document (replace or supplement passphrase)
  - [ ] Handle sign-in / sign-out flow in UI

- [x] Improvement: Add links to the official site for all sessions
- [x] Improvement: Colours to match the official site, but shifted in some way to make it clear this is not official
- [x] Improvement: Favicon and pwa icons to match official site better, but also shifted in some way to make it clear this is not official
- [x] Improvement: Make the sync server configurable
  - allow selecting between my internal one and the public example one (wss://sync.automerge.org)
  - allow the user to input their own sync server url 
  - show connection status for the sync server (e.g. green circle if connection is good, red if the server is unreachable in any way)
  - if the public server is selected, show a warning that data is not encrypted and may not be long term durable
  - make the public one the default
- [x] Improvement: The timeslots on the schedule should have some differentiation and should pop a little more 
  - currently you have to keep an eye on the details within the session listings to see when the time changes 
  - the user need is that I want to be able to see when I get to a new timeslot when I've already picked the session I want for a slot and am scrolling to the next slot.
- [x] Improvement: move the passphrase to a separate page available through a hamburger menu 
- [x] Improvement: Add a speakers list and make it searchable

- [X] Bug: offline mode doesn't seem to be working
  - opening the PWA when it has been saved to home screen fails
  - if the app is already loaded when going offline, it seems fine 

- [x] Improvement: the styling of "Schedule" and "My Schedule" are subtly different.
  - Extract common styles for reuse

- [x] Improvement: Make settings a real page that works the same way as schedule, speakers, etc. 
  - replace the hamburger menu with a gear icon 
  - should be reflected in the url

- [x] Improvement: in the schedule item, the session time should be vertically aligned to the title

- [x] Improvement: scroll positions need to be saved before navigating, and restored when navigation back

- [x] Bug: I have to hit back twice to get back to the session list after clicking into a session.
  - Fixed: `closeSession` and `closeSpeaker` now use `replaceState` instead of `pushState`, so closing a detail view no longer adds a spurious history entry.

- [ ] Project hygiene to enable the use of smaller models like Qwen 3.6:27b-coding-nvfp4 (which is tripped up by trainling white space in some of the files)
   - [ ] Run `npx eslint --fix` or equivalent across `app/src/` to remove trailing whitespace from all source files. Trailing whitespace on lines like `    })` causes the `edit` tool to fail matching `oldText` because the tool captures trailing spaces but humans don't see them.
      - macOS `cat -A` doesn't work (Illegal option). Use `sed -n 'N,Mp' file | catvet` to see whitespace, or `grep -P '\s+$' file` to find trailing whitespace.
   - [ ] Convert any tab-using files to spaces (indent with 2 spaces consistently — matching project convention)
   - [ ] Consider adding a pre-format hook in `app/` (e.g., ESLint with `prettier` plugin or standalone Biome) to prevent regression

Improvements: 
- [ ] save the last page viewed in local storage so that returning to the app puts you back in the same place
- [ ] replace, rather than push, the history entry when searching so that you don't have to click back N times for N searched characters
- [ ] disable page zoom because it's annoying when i do it by accident
- [ ] add a splash screen for faster start up feedback
- [ ] add a share button to share a page when in app mode so i can send it to my friend
- [ ] Improvement: Hide the Craft 2026 header on mobile, or maybe move the tabs below it 
- [ ] Improvement: Clicking the "Craft 2026" in the top left of any page should take you to the home page and reset the filters
- [ ] Improvement: Make it possible to filter by session type (talk vs workshop)

Features: 
- [ ] Add non-session things to the schedule, lunch, coffee breaks, networking, etc.

