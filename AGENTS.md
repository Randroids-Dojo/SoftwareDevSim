# SoftwareDevSim — Agent Instructions

## Stack

- **Next.js** (App Router, TypeScript strict mode)
- **Tailwind CSS** — styling
- **Upstash Redis** — persistent game state
- **Zod** — runtime validation

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run format       # Prettier — autofix formatting (src + tests)
npm run format:check # Prettier — check only, fails if unformatted
npm run lint         # ESLint — errors on unused imports (src + tests)
npm run lint:fix     # ESLint — autofix unused imports (src + tests)
npm run type-check   # TypeScript strict (noUnusedLocals + noUnusedParameters)
npm run test:unit     # Unit tests (fast, no coverage)
npm run test:coverage # Unit tests + coverage (lines≥90%, branches≥80%, functions≥90%)
npm run test:smoke    # Smoke tests
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
- **Before starting implementation:** Create or verify dots exist for the work. Never code without a tracked task.
- **Use `dot on <id>` before writing code** for a task, and `dot off <id>` when done
- **Always commit the entire `.dots/` directory**, including `archive/`. Archived dots are part of the project history.

## Unit Tests & Coverage

Tests live in `tests/unit/`. Run directly — no server needed:

```bash
npm run test:unit      # Fast iteration during development
npm run test:coverage  # Before committing — enforces coverage thresholds
```

Coverage thresholds (enforced in CI): **lines ≥ 90%**, **branches ≥ 80%**, **functions ≥ 90%**. Coverage is measured on `src/game/**` and `src/lib/**`.

### Rules for agents

- Always run `npm run test:unit` after changes to game logic or data models
- Run `npm run test:coverage` before committing to check coverage thresholds
- If a test fails, fix the code — do not weaken the assertion
- If coverage drops below thresholds, add tests — do not lower the thresholds

## Smoke Tests

```bash
npm run build && npm start &
npx wait-on http://localhost:3000
npm run test:smoke
```

## E2E Tests (Playwright)

Playwright tests live in `tests/e2e/`. They launch a real browser and exercise the full game UI.

```bash
npm run test:e2e           # Headless (CI)
npm run test:e2e:headed    # Headed (watch the tests play the game)
npx playwright test --ui   # Interactive UI mode for debugging
```

Tests cover: intro/start flow, sprint planning, team management, speed controls, practices panel, ship release, and panel toggling. The game instance is exposed on `window.__game` for E2E tests to call `fastForward()` or manipulate state directly.

### Rules for agents

- Always run `npm run test:e2e` after changes to UI components or game logic
- If a test fails, fix the code — do not weaken the assertion
- For tests that need game state advancement, use `page.evaluate` to call `window.__game.fastForward(ticks)` or manipulate state directly. Do NOT wait for real-time simulation (rAF is too slow).

## Formatting, Linting & TypeScript

After code changes, always run (in order):

1. `npm run format` — autofix formatting with Prettier
2. `npm run lint:fix` — autofix unused imports with ESLint
3. `npm run type-check` — must pass with zero errors

All three checks must be clean before committing. CI runs `format:check`, `lint`, and `type-check` — PRs that fail any check are rejected. Prefix intentionally unused parameters with `_` (e.g. `_request`).

### Strict Typing Rules (enforced by ESLint)

- **No `any`** — `@typescript-eslint/no-explicit-any`. Use `unknown` at system boundaries and narrow with Zod.
- **No non-null assertions** — `@typescript-eslint/no-non-null-assertion`. Validate instead of `!`.
- **Consistent type imports** — `@typescript-eslint/consistent-type-imports`. Use `import type` for type-only imports.

### Schema Validation Rules

- All types in `src/game/types.ts` are derived from Zod schemas in `src/lib/schemas.ts` via `z.infer`. **Never define types manually that duplicate a schema.**
- All data crossing system boundaries (API, Redis, localStorage) **must** be validated with `.safeParse()`.
- Use `unknown` (not `any`) for unvalidated external data, then narrow with Zod.

## Upstash Redis

Game state is persisted in Upstash Redis (via Vercel Marketplace). The client lives at `src/lib/kv.ts`.

- All reads must use Zod schema validation (`.safeParse()`)
- Use key prefixes to namespace data (e.g. `game:`, `player:`)
- Environment variables: `KV_REST_API_URL` and `KV_REST_API_TOKEN` in `.env.local`

## CI/CD

- **CI** (`ci.yml`): Runs format:check + lint + type-check + test:coverage on PRs and pushes to main
- **Smoke** (`smoke.yml`): Builds and runs smoke tests on PRs and pushes to main
- **E2E** (`e2e.yml`): Runs Playwright E2E tests (chromium) on PRs and pushes to main
- **Deploy**: Vercel Git integration auto-deploys on push to main and creates preview deploys for PRs (no GitHub Actions workflow needed)

## Game Design

The Game Design Document lives at `Docs/GDD.md`.

### Rules for Agents

- **Before implementing a new feature or system:** Update `Docs/GDD.md` with the design first. Plan before you code.
- After completing a feature, update the milestones table in GDD.md to reflect current status.
- If a design decision changes during implementation, update the GDD to match.

## 3D Character & Animation Conventions

The character mesh (in `src/game/character/mesh.ts`) is built facing **-Z** (eyes at z=-0.26). All animation rotations in `src/game/character/animations.ts` use **local space** relative to this orientation.

### Coordinate rules

- **Mesh forward = -Z (local).** The root group is rotated by `Math.PI` at runtime so characters face +Z in world space. Do not change the mesh construction to face a different axis.
- **Leg/arm rotations are local but flipped by the PI offset.** The PI rotation on root.rotation.y reverses both X-axis and Z-axis rotation effects:
  - **rotation.x:** Positive = forward (toward desk), negative = backward (away from desk).
  - **rotation.z:** Positive on the right arm = inward (toward body), negative = outward. Opposite for left arm.
  - **rotation.y and head rotations** are unaffected (Y axis is unchanged by Y rotation).
- **`seatDirection`** on `NamedLocation` defines the world-space direction the character should face when seated. The facing angle is computed as `atan2(dir.x, dir.z)` and the PI offset is added in `syncMeshPosition`.
- **`facingAngle(from, to)`** returns the Y rotation for walking toward a target. The PI offset in `syncMeshPosition` handles the mesh-to-world conversion — do not add extra offsets in animation code.

### Checklist for animation changes

1. Test sitting poses visually — legs must bend **toward** the desk, not away
2. Arm rotations for typing must reach **toward** the keyboard (positive X rotation in local space)
3. Walking leg swings should appear natural from the isometric camera angle
4. After any rotation change, verify from multiple camera angles before committing

## Pre-Push Checklist

Before pushing any branch, **always** run the full verification sequence and fix all errors:

```bash
npm run format
npm run lint:fix
npm run build
```

`npm run build` runs the production Next.js build, which includes TypeScript compilation **and** ESLint. A Vercel deploy will fail on any error this catches, so never push without a clean build.

## No Broken Windows

If you encounter a broken or misconfigured tool, flaky script, stale dependency, or any other pre-existing issue **while working on a task**, fix it right then — do not skip it, work around it, or label it "pre-existing." Broken infrastructure left unfixed causes compounding failures. Treat every red signal as your responsibility, regardless of who introduced it.

## Boy Scout Rule

Leave every file you touch cleaner than you found it. When editing a file, fix nearby issues you notice: dead imports, unclear names, stale comments, inconsistent formatting, missing type annotations on the lines you're already changing. Do not make sweeping unrelated refactors — keep improvements scoped to the files and functions you are already working in.

## Commits

- **Before every commit**, do two rounds of review and cleanup.
- One logical unit of work per commit
- Do not push unless explicitly instructed
- Do not include AI attribution in commit messages
