# Wouter Migration — Plan

## Task

Replace the current query-param-based navigation (`?view=`, `?session=`, `?speaker=`) with path-based routing using **wouter** v3.

## Route Map

| Current URL param                       | New path            | Purpose                    |
|-----------------------------------------|---------------------|---------------------------|
| `/` (no param or `?view=schedule`)     | `/`                 | SessionListView           |
| `/?view=myschedule`                    | `/myschedule`       | PersonalScheduleView      |
| `/?view=speakers`                      | `/speakers`         | SpeakersListView          |
| `/?view=settings`                      | `/settings`         | SettingsView              |
| `/?session=<slotId>`                   | `/session/:id`      | SessionDetailView         |
| `/?speaker=<slug>`                     | `/speaker/:slug`    | SpeakerDetailView         |

**Query params preserved:** `?day=`, `?tag=`, `?stage=`, `?speakersSearch=` continue to be managed by `useSessionListParams` for filter state. They are NOT changed by the router migration.

## Current Architecture

### Navigation hooks (to be removed)

**`useSessionListParams`** — manages `?view=`, `?day=`, `?tag=`, `?stage=`, `?speakersSearch=`
- Currently the `view` param (schedule/myschedule/speakers/settings) is managed here
- After migration: `view` is removed; only day/tag/stage/speakersSearch remain
- Uses `pushState` + custom `session-params-change` event for re-renders

**`useSessionDetailParam`** — manages `?session=<slotId>`
- `openSession(id)` → pushState with `?session=id`
- `closeSession()` → replaceState removing `?session=`
- After migration: replaced by `/session/:id` path routed by wouter's `Switch`

**`useSpeakerParam`** — manages `?speaker=<slug>`
- `openSpeaker(slug)` → pushState with `?speaker=slug`
- `closeSpeaker()` → replaceState removing `?speaker=`
- After migration: replaced by `/speaker/:slug` path routed by wouter

### App.tsx (to be refactored)

Currently a big conditional render:
```
switch (view / sessionId / speakerSlug) {
  case 'settings': SettingsView
  case speakerSlug != null: SpeakerDetailView
  case view === 'speakers': SpeakersListView
  case sessionId != null: SessionDetailView
  case 'myschedule': PersonalScheduleView
  default: SessionListView
}
```
Navigation callbacks are passed as props down through the component tree.

### Target Architecture

```
<main>
  <OfflineBanner />
  <header>...</header>
  <AppRouter ... />
</main>

AppRouter = <Router><Switch>
  <Route path="/session/:id">   <SessionDetailPage />
  <Route path="/speaker/:slug"> <SpeakerDetailPage />
  <Route path="/myschedule">    <PersonalSchedulePage />
  <Route path="/speakers">      <SpeakersListPage />
  <Route path="/settings">      <SettingsPage />
  <Route path="/">              <SchedulePage />
</Switch></Router>
```

Each `<Page>` wrapper is a thin component that:
1. Calls `useLocation()` to get the wouter `navigate` function
2. Calls `useUserDocContext()` to get `doc`/`handle`
3. Renders the view component passing navigation callbacks as props (existing component APIs unchanged)

## What We Learned (Session 1 — Wed Jun 3, 2026)

### Wouter v3 API specifics

- **`useNavigate` does NOT exist in wouter v3.** Use `const [path, navigate] = useLocation()` instead.
  - `navigate(-1)` → go back (equivalent to `history.back()`)
  - `navigate('/path')` → push navigation

- **`useRoute(pattern)` returns `[match, params]`** — a tuple. In wouter v3 under jsdom/Vitest, the first element (`match`) is coerced in some contexts. The reliable pattern is:
  ```jsx
  const [, params] = useRoute('/speaker/:slug')  // skip match, keep params
  const slug = params?.slug ?? ''
  ```

- **`<Router>` must wrap `<Switch>`** for wouter hooks to work correctly. Without it, `useLocation()` returns `undefined`.

### Tool quirks in this environment

- **`cat -A` doesn't work** (illegal option error on macOS). Use `sed -n 'N,Mp' file | cat -e` to inspect trailing whitespace and line endings, or use the `read` tool directly.

- **`edit` tool whitespace sensitivity:** The `oldText` field must match exactly including all whitespace. The leading spaces before `})` are tricky — use `sed -n` to inspect the exact bytes when edits keep failing.

- **Vitest test filtering:** `npx vitest run <file> -t "<test name>"` works for isolating single tests.

### Existing test infrastructure

- **25 test files, 312 tests** — all passing at start of migration
- Tests use jsdom environment (configured in `vitest.config.ts`)
- Test setup file `src/test/setup.ts` only imports `@testing-library/jest-dom`
- Components tested in isolation using context providers directly (no full app tree)
- `useScrollRestoration` is called by most view components; we need to keep this working after migration

### Migration strategy

1. ⬜ Add `wouter` dependency
2. ⬜ Create `UserDocContext` to avoid prop-drilling `doc`/`handle` through AppRouter page wrappers
3. ⬜ Create `AppRouter.tsx` with page wrapper components
4. ⬜ Create `AppRouter.test.tsx` integration tests (11 tests covering all route paths)
5. ⬜ Refactor `App.tsx` to use `AppRouter` instead of conditional rendering
6. ⬜ Simplify `useSessionListParams` (remove `view` param handling)
7. ⬜ Delete `useSessionDetailParam.ts` and `useSpeakerParam.ts`
8. ⬜ Update nav bar in App.tsx to use wouter `<Link>` components or `useNavigate`
9. ⬜ Update all component unit tests that depend on the old navigation pattern
10. ⬜ Verify all 312+ tests still pass
11. ⬜ Verify e2e tests still pass
12. ⬜ Handle scroll restoration compatibility (wouter navigations call `pushState`/`replaceState` through the browser, which triggers `popstate` on back — scroll restoration should work)

### Open questions

- **Nav bar:** Should the nav bar tabs (`Schedule`, `My Schedule`, `Speakers`, `⚙`) use wouter `<Link>` components or `useNavigate`? `<Link>` is more semantic but requires updating the button-based nav to anchors. Decision: use `<Link>` for semantic correctness and consistency.
- **Session detail `/session/:id` fallback:** When the session is not found, we currently show "← Back to schedule". With wouter, `navigate(-1)` goes back in history. This is more correct than the previous behavior.
- **Speaker detail `/speaker/:slug` fallback:** Similarly, `navigate(-1)` for "← Back".
- **Root `/` route with query params:** Need to ensure `/?day=1&tag=tdd` still matches the root route. Wouter matches only the path (not search), so this is automatic.

## Implementation order

Small, testable changes:

1. **`UserDocContext`** — already created, needs integration into the test setup and eventually `main.tsx`
2. **`AppRouter` + tests** — AppRouter created, tests need the not-found text assertions fixed (minor)  
3. **`App.tsx` refactor** — replace conditional rendering with `<AppRouter />`
4. **Nav bar** — replace button-based nav with wouter `<Link>` components
5. **`useSessionListParams` simplification** — remove `view` handling, keep `day`/`tag`/`stage`/`speakersSearch`
6. **Delete old hooks** — `useSessionDetailParam.ts`, `useSpeakerParam.ts` (and their tests)
7. **Update component tests** — any test that mocks `onOpenSession`/`onOpenSpeaker` callbacks may need updates
8. **Run full test suite** — verify all tests pass
9. **Run e2e tests** — Playwright integration tests

## Files to create/modify

| File | Action | Purpose |
|------|--------|---------|
| `app/src/automerge/UserDocContext.tsx` | Created ✅ | Context for `doc`/`handle` |
| `app/src/AppRouter.tsx` | Created ✅ | Wouter route definitions |
| `app/src/AppRouter.test.tsx` | Created ✅ | Integration tests for routing |
| `app/src/App.tsx` | Modify | Replace conditional rendering, add nav bar with `<Link>` |
| `app/src/schedule/useSessionListParams.ts` | Modify | Remove `view` param, simplify |
| `app/src/schedule/useSessionDetailParam.ts` | Delete | Replaced by wouter |
| `app/src/schedule/useSpeakerParam.ts` | Delete | Replaced by wouter |
| `app/src/schedule/useSessionDetailParam.test.ts` | Delete | Component no longer exists |
| `app/src/schedule/useSpeakerParam.test.ts` | Delete | Component no longer exists |
| `app/src/main.tsx` | Modify | Wrap `App` with `<UserDocProvider>` |
| Various `*.test.tsx` | Modify | Update test fixtures if needed |

## Notes

- **wouter is lightweight** — no browser needed for most routes. It works well with jsdom.
- **`<Router>` wraps everything** — in production (`main.tsx`), the `App` component wraps children in `<UserDocProvider>` → `<ScheduleProvider>` → `<App>`. The `<Router>` is inside `<AppRouter>`.
- **Scroll restoration** is handled by `useScrollRestoration` which listens to `popstate`. Wouter's `navigate()` uses `history.pushState`/`replaceState` internally, so `popstate` fires correctly on browser back/forward.
- **`useScrollRestoration` + `saveScrollToState`**: Before migrating `App.tsx`, verify that the old navigation hooks (`openSession`, `openSpeaker`, `closeSession`, etc.) that called `saveScrollToState()` are properly replaced. The new wouter `navigate()` calls browser `history.pushState` directly, so scroll position is NOT automatically saved. We need to either:
  - Call `saveScrollToState()` in each `navigate()` call wrapper
  - OR update `useScrollRestoration` to auto-save on `pushState`/`replaceState` via the monkey-patching that wouter itself does

## Todo improvements for this project

- [ ] Remove trailing whitespace from all files (the `})` pattern with trailing spaces makes edits harder to match)
- [ ] Consider using `npm run pretty` (Biome) consistently for `server/`-side files
- [ ] Consider adding a pre-commit hook in the `app/` directory too (currently only `server/` uses Biome; `app/` uses ESLint which doesn't auto-format)
