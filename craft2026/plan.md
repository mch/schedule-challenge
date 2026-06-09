# Wouter Migration — Plan

> **Tracking:** Epic `sc-wouter-migration-u6d` in beads. Sub-issues `sc-wouter-migration-u6d.1` through `.11`.

## Goal

Replace the current query-param-based navigation (`?view=`, `?session=`, `?speaker=`) with path-based routing using **wouter** v3. Every commit is deployable — users never notice the migration happening.

## Route Map

| Current URL                         | New path            | View component       |
|-------------------------------------|---------------------|----------------------|
| `/` (no param or `?view=schedule`) | `/`                 | SessionListView      |
| `/?view=myschedule`                | `/myschedule`       | PersonalScheduleView |
| `/?view=speakers`                  | `/speakers`         | SpeakersListView     |
| `/?view=settings`                  | `/settings`         | SettingsView         |
| `/?session=<slotId>`               | `/session/:id`      | SessionDetailView    |
| `/?speaker=<slug>`                 | `/speaker/:slug`    | SpeakerDetailView    |

**Filter params unchanged:** `?day=`, `?tag=`, `?stage=`, `?speakersSearch=` remain managed by `useSessionListParams`.

## Guiding Principles

- **Every commit is deployable.** The app must work for users at every step.
- **New routes appear before old routes are removed.** We add a path, prove it works, then later remove the old param.
- **E2e test first (red → green).** Write a failing test, then implement, then commit.
- **Old URLs keep working** until explicit "decision point" steps remove them.
- **No big-bang refactors.** Each step changes one thing.

## Migration Sequence

Steps are tracked as beads issues. Each step is a single deployable commit.

| Step | Issue | Description | Type |
|------|-------|-------------|------|
| 1 | `sc-wouter-migration-u6d.1` | Install wouter | chore |
| 2 | `sc-wouter-migration-u6d.2` | E2e test (red): `/myschedule` | test |
| 3 | `sc-wouter-migration-u6d.3` | Serve `/myschedule` alongside `?view=myschedule` | green |
| 4 | `sc-wouter-migration-u6d.4` | Serve `/speakers` and `/settings` | feature |
| 5 | `sc-wouter-migration-u6d.5` | Serve `/session/:id` | feature |
| 6 | `sc-wouter-migration-u6d.6` | Serve `/speaker/:slug` | feature |
| 7 ⚑ | `sc-wouter-migration-u6d.7` | Nav bar navigates to new paths | **decision** |
| 8 ⚑ | `sc-wouter-migration-u6d.8` | Redirect legacy params to canonical paths | **decision** |
| 9 | `sc-wouter-migration-u6d.9` | Extract `AppRouter.tsx` (pure refactor) | refactor |
| 10 ⚑ | `sc-wouter-migration-u6d.10` | Delete legacy nav hooks | **decision** |
| 11 | `sc-wouter-migration-u6d.11` | Post-migration cleanup | chore |

Steps marked ⚑ are explicit decision points — moments where user-visible URLs change or legacy code is removed. These should be reviewed before proceeding.

## Architecture: Before → After

### Before (current `App.tsx`)

```
useSessionListParams()  → ?view=, ?day=, ?tag=, ?stage=, ?speakersSearch=
useSessionDetailParam() → ?session=<slotId>
useSpeakerParam()       → ?speaker=<slug>

App renders a big conditional:
  if view=settings  → <SettingsView>
  if speakerSlug    → <SpeakerDetailView>
  if view=speakers  → <SpeakersListView>
  if sessionId      → <SessionDetailView>
  if view=myschedule → <PersonalScheduleView>
  else              → <SessionListView>
```

### After (target)

```
<Router>
  <Switch>
    <Route path="/session/:id">  → <SessionDetailView>
    <Route path="/speaker/:slug"> → <SpeakerDetailView>
    <Route path="/myschedule">   → <PersonalScheduleView>
    <Route path="/speakers">     → <SpeakersListView>
    <Route path="/settings">     → <SettingsView>
    <Route path="/">             → <SessionListView>
  </Switch>
</Router>

useSessionListParams() → ?day=, ?tag=, ?stage=, ?speakersSearch= (view removed)
useSessionDetailParam, useSpeakerParam → deleted
```

## Key Technical Notes

### wouter v3 API

- **No `useNavigate`.** Use `const [, navigate] = useLocation()`.
  - `navigate('/path')` — push
  - `navigate(-1)` — go back (history.back())
- **`useRoute(pattern)` → `[matched, params]` tuple:**
  ```tsx
  const [, params] = useRoute('/speaker/:slug')
  const slug = params?.slug ?? ''
  ```
- **`<Router>` must wrap** everything that uses wouter hooks.
- **Wouter matches only the path**, not search params — `/?day=1` correctly matches `/`.

### Scroll Restoration

`useScrollRestoration` hooks into `popstate`. When replacing `openSession()` / `openSpeaker()` with `navigate()`, call `saveScrollToState()` first — exactly as the old hooks did.

### Coexistence Pattern (Steps 1–6)

During the incremental migration, both URL forms work simultaneously:

```tsx
const [isMySchedulePath] = useRoute('/myschedule')
const showMySchedule = view === 'myschedule' || isMySchedulePath
```

This coexistence code is removed in Step 10.

## Files Changed

| File | Change |
|------|--------|
| `app/src/App.tsx` | Incrementally modified (steps 3–10) |
| `app/src/AppRouter.tsx` | Created (step 9) |
| `app/src/AppRouter.test.tsx` | Created (step 9) |
| `app/src/automerge/UserDocContext.tsx` | Created if needed (step 9) |
| `app/src/schedule/useSessionListParams.ts` | Remove `view` param (step 10) |
| `app/src/schedule/useSessionDetailParam.ts` | **Deleted** (step 10) |
| `app/src/schedule/useSpeakerParam.ts` | **Deleted** (step 10) |
| `app/e2e/new-routes.spec.ts` | Created (step 2), merged into `routes.spec.ts` (step 11) |
| `app/e2e/routes.spec.ts` | Updated (steps 7–8, 11) |
