# SoftwareDevSim — Agent Instructions

## Stack

- **Next.js** (App Router, TypeScript strict mode)
- **Tailwind CSS** — styling
- **Three.js** — voxel 3D rendering
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
npm run test:mutation # Stryker mutation testing (~7 min)
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

Coverage thresholds (enforced in CI): **lines ≥ 90%**, **branches ≥ 80%**, **functions ≥ 90%**. Coverage is measured on pure game logic files: `src/game/scoring.ts`, `src/game/simulation/**`, and select character modules (`needs.ts`, `schedule.ts`, `stateMachine.ts`, `pathfinder.ts`). Browser-only 3D files (renderer, office, mesh, animations) are excluded.

### Rules for agents

- Always run `npm run test:unit` after changes to game logic or data models
- Run `npm run test:coverage` before committing to check coverage thresholds
- If a test fails, fix the code — do not weaken the assertion
- If coverage drops below thresholds, add tests — do not lower the thresholds

## Mutation Testing

Mutation testing uses [Stryker Mutator](https://stryker-mutator.io/) to verify test effectiveness by introducing small code changes (mutants) and checking that tests catch them.

```bash
npm run test:mutation  # Run Stryker mutation tests (~7 min)
```

Stryker targets the same game logic files as unit coverage. Configuration lives in `stryker.config.json`. Mutation score thresholds: **break at 50%**, low warning at 60%, high target at 80%. The HTML report is generated at `reports/mutation/mutation.html`.

### Rules for agents

- Run `npm run test:mutation` after adding or changing unit tests to verify test quality
- If mutation score drops below the break threshold (50%), add stronger assertions — do not lower the threshold
- Surviving mutants indicate weak test assertions — review the clear-text output to identify gaps
- Do not add mutation testing to the pre-push checklist (it's too slow for every push); it runs in CI

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

Tests cover the full game flow: title screen, app selection, team hiring, sprint auto-play, end screen, and retry. The game instance is exposed on `window.__game` for E2E tests to manipulate state directly.

### Rules for agents

- Always run `npm run test:e2e` after changes to UI components or game logic
- If a test fails, fix the code — do not weaken the assertion
- For tests that need to advance the game, use `page.evaluate` to mutate `window.__game.state` directly. Do NOT wait for real-time simulation (rAF is too slow).

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
- Use `unknown` (not `any`) for unvalidated external data, then narrow with Zod.

## CI/CD

- **CI** (`ci.yml`): Runs format:check + lint + type-check + test:coverage on PRs and pushes to main
- **Smoke** (`smoke.yml`): Builds and runs smoke tests on PRs and pushes to main
- **E2E** (`e2e.yml`): Runs Playwright E2E tests (chromium) on PRs and pushes to main
- **Mutation** (`mutation.yml`): Runs Stryker mutation testing on PRs and pushes to main
- **Deploy**: Vercel Git integration auto-deploys on push to main and creates preview deploys for PRs (no GitHub Actions workflow needed)

## Game Design

The Game Design Document lives at `Docs/GDD.md`.

### Rules for Agents

- **Before implementing a new feature or system:** Update `Docs/GDD.md` with the design first. Plan before you code.
- After completing a feature, update the milestones table in GDD.md to reflect current status.
- If a design decision changes during implementation, update the GDD to match.

## Architecture Overview

### Game Flow

```
Title → Choose App → Hire Team → Auto-Play (4 sprints) → End Screen → Retry
```

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | All UI screens (title, app select, hire, sprint overlay, end screen) |
| `src/game/index.ts` | Game factory, tick loop, constants (salaries, app choices) |
| `src/game/scoring.ts` | Pure scoring logic (progress, quality, revenue, grading) |
| `src/game/types.ts` | TypeScript types derived from Zod schemas |
| `src/lib/schemas.ts` | Zod schemas (source of truth for all data shapes) |
| `src/game/character/developer.ts` | Worker class (role-based AI, movement, animation) |
| `src/game/character/schedule.ts` | Role-based activity decisions |
| `src/game/renderer.ts` | Three.js setup, camera controls |
| `src/game/office.ts` | Voxel office layout and desk positions |
| `src/components/GameCanvas.tsx` | 3D canvas with mouse/touch input handling |

### Roles & Scoring

| Role | Salary/Sprint | Effect |
|------|--------------|--------|
| Developer | $15,000 | +20% progress/sprint |
| Designer | $12,000 | +0.15 quality (requires devs) |
| Product Owner | $18,000 | +25% dev effectiveness |
| Manager | $20,000 | 1st: +10% coordination. Each extra: -15% productivity |

## 3D Character & Animation Conventions

The character mesh (in `src/game/character/mesh.ts`) is built facing **-Z** (eyes at z=-0.26). All animation rotations in `src/game/character/animations.ts` use **local space** relative to this orientation.

### Coordinate rules

- **Mesh forward = -Z (local).** The root group is rotated by `Math.PI` at runtime so characters face +Z in world space. Do not change the mesh construction to face a different axis.
- **Leg/arm rotations are local but flipped by the PI offset.** The PI rotation on root.rotation.y reverses both X-axis and Z-axis rotation effects:
  - **rotation.x:** Positive = forward (toward desk), negative = backward (away from desk).
  - **rotation.z:** Left arm: positive = inward (toward body), negative = outward. Right arm: negative = inward, positive = outward.
  - **rotation.y and head rotations** are unaffected (Y axis is unchanged by Y rotation).
- **`seatDirection`** on `NamedLocation` defines the world-space direction the character should face when seated. The facing angle is computed as `atan2(dir.x, dir.z)` and the PI offset is added in `syncMeshPosition`.
- **`facingAngle(from, to)`** returns the Y rotation for walking toward a target. The PI offset in `syncMeshPosition` handles the mesh-to-world conversion — do not add extra offsets in animation code.

### Rotation helpers (`src/game/character/rotationHelpers.ts`)

**Always use these constants** instead of raw sign values in animation code. They encode the PI-offset convention so you never need to reason about sign flips:

| Constant | Value | Meaning |
|----------|-------|---------|
| `ARM_FORWARD` | `1` | rotation.x toward desk |
| `ARM_BACKWARD` | `-1` | rotation.x away from desk |
| `LEFT_ARM_INWARD` | `1` | rotation.z toward body (left arm) |
| `LEFT_ARM_OUTWARD` | `-1` | rotation.z away from body (left arm) |
| `RIGHT_ARM_INWARD` | `-1` | rotation.z toward body (right arm) |
| `RIGHT_ARM_OUTWARD` | `1` | rotation.z away from body (right arm) |
| `LEG_FORWARD` | `1` | rotation.x toward desk (sitting bend) |
| `LEG_BACKWARD` | `-1` | rotation.x away from desk |
| `HEAD_TILT_DOWN` | `-1` | rotation.x looking down |
| `SEATED_LEG_BEND` | `π/2` | 90° forward bend for sitting |

Usage example:
```ts
character.leftArm.rotation.set(ARM_FORWARD * 1.0, 0, LEFT_ARM_INWARD * 0.35)
```

### Wall-mounted objects (clock, signs, etc.)

Objects on the back wall have their face rotated `rotation.y = Math.PI` so they point toward the camera (-Z). This **mirrors the X axis**, which reverses the sign of `rotation.z` from the viewer's perspective. When rotating hands, dials, or any child of a wall-mounted group:

- **Clockwise rotation (as seen by the player) = positive `rotation.z`**, not negative.
- Always sanity-check rotation direction visually before committing wall-mounted animation code.

### Checklist for animation changes

1. Test sitting poses visually — legs must bend **toward** the desk, not away
2. Arm rotations for typing must reach **toward** the keyboard (positive X rotation in local space)
3. Walking leg swings should appear natural from the isometric camera angle
4. After any rotation change, verify from multiple camera angles before committing
5. Use rotation helper constants — never hardcode sign values for limb directions

## Pre-Push Checklist

**MANDATORY — never push without completing ALL steps.** CI will reject the PR otherwise.

```bash
npm run format       # Step 1: autofix formatting (Prettier)
npm run lint:fix     # Step 2: autofix lint issues (ESLint)
npm run test:unit    # Step 3: all unit tests must pass
npm run build        # Step 4: production build (includes tsc + ESLint)
```

Run these **after every commit, before every push** — not just at the end of a session. `npm run format` rewrites files in place; if it changes anything, stage and amend the commit before pushing.

## Game-Logic Guard Rails

When writing or modifying time-based or range-based conditions in game logic:

- **Always use bounded ranges.** A check like `hour >= 16` must include an upper bound (e.g. `hour >= 16 && hour < 18`). Open-ended ranges leak behavior into unintended periods (night, weekends, etc.).
- **Test boundary values explicitly.** For any time/range condition, write tests for: inside the range, both edges, and clearly outside (e.g. hour 20 for a work-hours feature).
- **Cross-check with `isWorkHours`.** Schedule activities that should only happen during work must be gated by work-hour boundaries, not just a start threshold.

## No Broken Windows

If you encounter a broken or misconfigured tool, flaky script, stale dependency, or any other pre-existing issue **while working on a task**, fix it right then — do not skip it, work around it, or label it "pre-existing." Broken infrastructure left unfixed causes compounding failures. Treat every red signal as your responsibility, regardless of who introduced it.

## Boy Scout Rule

Leave every file you touch cleaner than you found it. When editing a file, fix nearby issues you notice: dead imports, unclear names, stale comments, inconsistent formatting, missing type annotations on the lines you're already changing. Do not make sweeping unrelated refactors — keep improvements scoped to the files and functions you are already working in.

## Commits

- **Before every commit**, do two rounds of review and cleanup.
- One logical unit of work per commit
- Do not push unless explicitly instructed
- Do not include AI attribution in commit messages
