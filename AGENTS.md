# AGENTS.md — Notes for AI agents working in this repo

## Repository layout

```
/                   ← repo root (git root, root package.json for tooling)
├── app/            ← React frontend (Vite, TypeScript, Vitest, Playwright)
├── server/         ← Express backend (TypeScript, ts-node, Vitest, Biome)
├── public/         ← Static files served by Caddy
├── doc/            ← Documentation / ADRs (managed with adr-tools)
└── craft2026/      ← Workshop materials
```

## Package management rules

- **Always use `npm pkg set/delete`** to modify `package.json` fields — never edit the file directly.
  This keeps `package-lock.json` in sync and avoids JSON formatting errors.
  ```bash
  npm pkg set scripts.foo="bar"
  npm pkg delete scripts.foo
  ```
- Use `npm install / uninstall` for adding or removing dependencies as normal.

## app/ (React frontend)

**Toolchain:** Vite · TypeScript · React 19 · Vitest · Playwright · ESLint

| Task | Command (run from `app/`) |
|---|---|
| Dev server (port 5173) | `npm run dev` |
| Production build | `npm run build` |
| Unit tests (single run) | `npm run test:run` |
| Unit tests (watch) | `npm test` |
| Unit test coverage | `npm run test:coverage` |
| E2E tests (Playwright) | `npm run test:e2e` |
| Lint | `npm run lint` |

- Unit tests use **jsdom**, configured in `vitest.config.ts`. Test setup file is `src/test/setup.ts`.
- E2E tests live in `e2e/` and are excluded from Vitest runs.
- Playwright targets Chromium on `http://localhost:5173`; it spins up `vite dev` automatically.

## server/ (Express backend)

**Toolchain:** TypeScript · ts-node · Vitest · Biome (lint + format)

| Task | Command (run from `server/`) |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Tests | `npm test` |
| Lint / format check | `npm run checkstyle` |
| Auto-fix formatting | `npm run pretty` |

Note: `server/` uses **Biome** for linting and formatting, not ESLint/Prettier.

## Tooling (mise)

Runtime versions and tasks are managed with [mise](https://mise.jdx.dev/) via `mise.toml`:

- **Node 24**
- **Caddy** — static file server (`mise run caddy` serves `public/` on port 8888)
- **adr-tools** — for writing Architecture Decision Records in `doc/`
- **k6** — load testing

## Pre-commit hook (Husky)

A Husky pre-commit hook runs on every `git commit`:
1. `npm run build` — TypeScript compile + Vite production build
2. `npm run test:run` — Vitest unit tests (single pass)

Both run inside `app/`. The hook is defined in `.husky/pre-commit`.
The root `package.json` `prepare` script installs it automatically on `npm install`.

New contributors should run `npm install` from the **repo root** after cloning.

## Environment

- Environment variables are loaded from `.env` via mise (`_.file = ".env"` in `mise.toml`).
- `.env` is gitignored.

## Development Process

Use test driven development to implement small, testable changes. When fixing a bug or implementing an improvement or feature, follow this process:
1. Explore the problem and create a list of tests.
2. Write one failing test. No production code without a failing test. 
3. Write just enough code to make the test pass.
4. Refactor when opprotunities arise.
5. Repeat from 1, adding any new tests to the list if the need arises, and iterating until all tests are implemented and passing.



<!-- br-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_rust](https://github.com/Dicklesworthstone/beads_rust) (`br`/`bd`) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View ready issues (open, unblocked, not deferred)
br ready              # or: bd ready

# List and search
br list --status=open # All open issues
br show <id>          # Full issue details with dependencies
br search "keyword"   # Full-text search

# Create and update
br create --title="..." --description="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason="Completed"
br close <id1> <id2>  # Close multiple issues at once

# Sync with git
br sync --flush-only  # Export DB to JSONL
br sync --status      # Check sync status
```

### Workflow Pattern

1. **Start**: Run `br ready` to find actionable work
2. **Claim**: Use `br update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `br close <id>`
5. **Sync**: Always run `br sync --flush-only` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `br ready` shows only open, unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers 0-4, not words)
- **Types**: task, bug, feature, epic, chore, docs, question
- **Blocking**: `br dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads changes to JSONL
git commit -m "..."     # Commit everything
git push                # Push to remote
```

### Best Practices

- Check `br ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `br create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always sync before ending session

<!-- end-br-agent-instructions -->
