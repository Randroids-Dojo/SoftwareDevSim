# SoftwareDevSim — Agent Instructions

## Stack

- **Next.js** (App Router, TypeScript strict mode)
- **Tailwind CSS** — styling
- **Vercel KV** (Upstash Redis) — persistent game state
- **Zod** — runtime validation

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript strict (tsc --noEmit)
npm run test:unit    # Unit tests
npm run test:smoke   # Smoke tests
```

## Task Tracking with .dots

This project uses [dots](https://github.com/joelreymont/dots) for task tracking across sessions.

### Essential Commands

```bash
dot ls               # List open dots
dot ready            # Show unblocked dots (ready to work on)
dot on <id>          # Start working on a dot
dot off <id> -r "What was done"   # Complete a dot with reason

dot "Short description"                    # Quick-add a dot
dot add "Description" -p 1 -d "Details"   # Add with priority and description
dot add "Subtask" -P dots-1               # Add as child of another dot
dot add "After X" -a dots-2               # Add with dependency

dot show dots-1      # Show dot details
dot tree             # Show hierarchy
dot find "query"     # Search dots
```

### Priority Levels

| Level | Meaning |
|------:|---------|
| 0 | Critical (do now) |
| 1 | High |
| 2 | Medium (default) |
| 3 | Low |
| 4 | Backlog |

### Rules for Agents

- Run `dot ls` at the start of every session to see open work
- Always close dots with a reason: `dot off <id> -r "reason"`
- Create subtasks for partial progress rather than leaving dots open
- Use dependencies (`-a`) to enforce ordering between dots

## Unit Tests

Tests live in `tests/unit/`. Run directly — no server needed:

```bash
npm run test:unit
```

### Rules for agents

- Always run `npm run test:unit` after changes to game logic or data models
- If a test fails, fix the code — do not weaken the assertion

## Smoke Tests

```bash
npm run build && npm start &
npx wait-on http://localhost:3000
npm run test:smoke
```

## TypeScript

Always run `npm run type-check` after code changes. All code must compile with zero errors — strict mode is on.

## Vercel KV

Game state is persisted in Vercel KV (Upstash Redis). The KV helper module lives at `src/lib/kv.ts`.

- All KV reads must use Zod schema validation (`.safeParse()`)
- Use key prefixes to namespace data (e.g. `game:`, `player:`)
- Environment variables for KV are in `.env.local` (see `.env.local.example`)

## CI/CD

- **CI** (`ci.yml`): Runs lint + type-check on PRs and pushes to main
- **Smoke** (`smoke.yml`): Builds and runs smoke tests on PRs and pushes to main
- **Deploy**: Vercel Git integration auto-deploys on push to main and creates preview deploys for PRs (no GitHub Actions workflow needed)

## Game Design

The Game Design Document lives at `Docs/GDD.md`. Update it as features are designed and implemented.

## Commits

- One logical unit of work per commit
- Do not push unless explicitly instructed
- Do not include AI attribution in commit messages
