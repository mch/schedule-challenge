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

- [ ] Project scaffold
  - [ ] Create `app/` with Vite + React + TypeScript
  - [ ] Configure Vitest and React Testing Library
  - [ ] Configure Playwright
  - [ ] Add `vite-plugin-pwa` and basic PWA manifest
  - [ ] Add Automerge dependencies (`@automerge/automerge-repo`, `@automerge/automerge-repo-react-hooks`, `@automerge/automerge-repo-network-websocket`, `@automerge/automerge-repo-storage-indexeddb`)

- [ ] Passphrase identity
  - [ ] `generatePassphrase()` — returns a random human-readable passphrase (e.g. 4 words)
  - [ ] `passphraseToDocId()` — deterministically derives an Automerge document URL / ID from a passphrase
  - [ ] Persist passphrase in localStorage on first use
  - [ ] UI: on first visit, offer "Create new account" (shows generated passphrase) or "Enter existing passphrase"
  - [ ] UI: display and allow copying of the user's passphrase

- [ ] Automerge setup
  - [ ] Define `UserDocument` type — contains bookmarked slot IDs (a set of integers)
  - [ ] Create/open the user's Automerge doc from the derived document ID
  - [ ] Wire up WebSocket sync to `sync.home.halfbakery.xyz`
  - [ ] Wire up IndexedDB storage for offline persistence
  - [ ] Provide Automerge `Repo` via React context

- [ ] Schedule data
  - [ ] Load `craft2026/schedule.json` as a static asset
  - [ ] Define TypeScript types matching `craft2026/schedule-schema.json`
  - [ ] Make schedule data available to components via a hook or context

- [ ] Session list view
  - [ ] Display all sessions grouped by day (one day per page/tab)
  - [ ] Show session title, time, stage/room, speaker(s)
  - [ ] Filter by tag
  - [ ] Filter by stage/room
  - [ ] Filters reflected in URL (back/forward works)
  - [ ] Scroll position preserved on navigation and refresh

- [ ] Session detail view
  - [ ] Show full session details (title, speakers, description, tags, etc.)
  - [ ] Bookmark button (add/remove from personal schedule)

- [ ] Personal schedule
  - [ ] View personal schedule (bookmarked sessions, grouped by day)
  - [ ] Handle overlapping sessions in the display
  - [ ] Bookmark button in session list view (add/remove)
  - [ ] Bookmark button in session detail view (add/remove)
  - [ ] Button state reflects current bookmark status

- [ ] PWA / offline
  - [ ] Service worker caches static assets and schedule data
  - [ ] App is fully usable offline (view schedule, manage bookmarks)
  - [ ] Syncs bookmarks when connectivity is restored

- [ ] Error handling
  - [ ] Graceful UI when sync server is unreachable
  - [ ] Graceful UI when schedule data fails to load

- [ ] Stretch: Schedule in Automerge
  - [ ] Store `craft2026/schedule.json` contents in a shared read-only Automerge doc
  - [ ] Sync schedule updates through the sync server
  - [ ] Fall back to bundled schedule if sync is unavailable

- [ ] Stretch: Pocket ID / OIDC
  - [ ] Integrate OIDC sign-in via `auth.home.halfbakery.xyz`
  - [ ] Link OIDC identity to Automerge document (replace or supplement passphrase)
  - [ ] Handle sign-in / sign-out flow in UI
