# SoftwareDevSim — Game Design Document

> A voxel office sim where 3 developers build an app using XP/agile/lean practices with AI coding tools. The player manages sprints, assigns work, and balances velocity vs quality vs tech debt.

---

## 1. Overview

**Title:** SoftwareDevSim
**Genre:** Simulation / Management
**Platform:** Web (browser-based)
**Tech Stack:** Next.js 15, TypeScript, Three.js (voxel rendering), Upstash Redis

### Elevator Pitch

Manage a 3-person dev team building an app — plan sprints, assign stories, toggle engineering practices, and discover that agentic AI coding is a force multiplier for your process, not a replacement for it.

### Target Audience

Software developers and engineering managers who enjoy simulation/management games and will appreciate the meta-humor of simulating their own work.

---

## 2. Core Concept

### Theme

The real danger of AI coding isn't AI itself — it's bad engineering practices. Good process + AI = shipping fast with high quality. Bad process + AI = generating bad code faster.

### Player Fantasy

You're a tech lead who gets to prove that investing in engineering practices (TDD, CI, code review, sprint planning, refactoring) pays off — even when the pressure is to skip them and ship faster.

### Core Loop

```
Sprint Planning → Devs Work → Ship Release → User Feedback → Repeat
```

The player picks user stories from a backlog, assigns them to developers, and decides which engineering practices to invest in. Each sprint takes ~2 minutes of real time.

### Win/Loss Conditions

No explicit win/loss — the game is a sandbox. But tech debt > 0.7 triggers a "death spiral" where everything slows down, morale drops, and more shortcuts get taken. The implicit goal is to ship the most points with the highest quality.

---

## 3. Game Mechanics

### Primary Mechanics

#### Engineering Practices (toggleable safety nets)

| Practice | Effect | Without It |
|----------|--------|------------|
| Sprint Planning | Stories validated; fewer wasted features | 30% chance completed story is "wrong feature" |
| TDD / Tests | Quality floor 0.85; bugs caught before shipping | Quality capped at 0.6; tech debt rises faster |
| Code Review | Quality +0.15; catches architecture issues | Architecture degrades; subtle bugs compound |
| CI/CD Pipeline | Broken builds caught instantly | Broken code ships silently |
| Pair Programming | Knowledge sharing; 1.3x quality | Single points of failure; knowledge silos |
| Refactoring Budget | Tech debt decreases each sprint | Tech debt only increases; eventual death spiral |

#### AI Coding (always on — this is the future)

All devs use agentic AI tools. AI multiplies your existing process:

| Your Process | AI Effect |
|-------------|-----------|
| Good practices | 2x speed, quality stays high |
| Some practices | 1.5x speed, quality gaps amplified |
| No practices (yolo) | 2x speed, 2x tech debt |

### Secondary Mechanics

- **Developer Needs:** morale, energy, focus (0-1 each, decay/restore)
- **Tech Debt:** accumulates from missing practices, triggers death spiral at 0.7
- **User Feedback:** random events based on quality/debt after each release

### Progression

Sprints get harder as the backlog grows more complex. The codebase's quality/debt scores compound over time, making early practice investment critical.

---

## 4. World & Setting

### Setting

A voxel office (~24x16x8 voxels). Orthographic camera, front wall open.

### Office Layout

| Location | Position | Purpose |
|----------|----------|---------|
| desk_0, desk_1 | Front-left pair | Paired desks |
| desk_2, desk_3 | Front-right pair | Paired desks |
| coffee | Back-right corner | Break spot |
| meeting | Back-left | Standup circle |
| whiteboard | Back-center | Kanban display + build light |

### Characters

Three developers with distinct traits:

| Name | Trait | Description |
|------|-------|-------------|
| Alex | Architect | Thinks about structure; architecture-boosting |
| Jordan | Craftsman | Meticulous; quality-boosting |
| Sam | Hustler | Fast but sloppy; velocity-boosting |

### Character Activities

idle, moving, working (typing), pairing, meeting (talking), break (drinking coffee)

---

## 5. Technical Design

### Data Model

```
Developer: id, name, trait, stats {morale, energy, focus},
           currentActivity, assignedStoryId, position

UserStory:  id, title, points (1/2/3/5/8), status (backlog→todo→in_progress→review→done),
            quality, testCoverage, progress, wasPlanned, hasTests, wasReviewed, wasRefactored

Sprint:     number, phase (planning|active|review|shipped), dayInSprint,
            stories[], hadPlanning, hadRetro

Codebase:   techDebt, quality, ciStatus, totalPointsShipped, releasesShipped, architecture

GameState:  clock, developers[], sprint, backlog[], codebase, feedback[], practices, seed
```

### State Management

- Game state is a single `GameState` object owned by the game engine
- React polls it via `useGameState` hook (4x/sec)
- Persistent storage via Upstash Redis with Zod validation

### Game Clock

- 1 real second = 5 game minutes
- Work hours: 9am-6pm
- Sprint length: 10 game days

### API Routes

- `GET /api/game/[id]` — Load game state
- `POST /api/game/[id]` — Save game state (version guard)
- `GET /api/health` — Health check

---

## 6. User Interface

### Screens / Views

Full-screen 3D canvas with overlay UI. Supports camera zoom and panning.

### Camera Controls

| Input | Action |
|-------|--------|
| Mouse drag | Pan camera |
| Mouse wheel | Zoom in/out |
| Single-finger drag (touch) | Pan camera |
| Two-finger pinch (touch) | Zoom in/out |

Zoom range: 0.5x (zoomed out) to 4x (zoomed in). Pan is clamped to keep the office in view. Camera pans in screen-space (content follows pointer/finger).

### HUD (top bar)

Sprint day, velocity, quality, morale, tech debt, CI status, points shipped

### Menu Bar (bottom)

Sprint | Team | Backlog | Practices | Ship + speed controls (pause, 1x, 2x, 5x)

### Panels (slide up from bottom)

- **SprintPanel:** Pick stories for sprint, start with/without planning
- **TeamPanel:** Assign stories to devs, view dev stats
- **PracticesPanel:** Toggle engineering practices
- **BacklogPanel:** View full backlog with status
- **ShipPanel:** Ship release, view feedback
- **KanbanOverlay:** Todo/InProgress/Review/Done columns

---

## 7. Art & Audio Direction

### Visual Style

Voxel art with an isometric-ish orthographic camera. Warm office colors. Monitor screens glow green (AI-assisted coding). Build light near whiteboard shows CI status.

### Visual Polish

- Terminal glow on all screens (AI is always on)
- Pair programming: two devs at one desk
- Standup: devs walk to meeting area, talk, return
- Build light: green/red/yellow voxel
- Thought bubbles: devs say things ("Tests passing!", "This architecture is clean", "Need coffee")

### Audio

Silent for MVP. Ambient office sounds possible future enhancement.

---

## 8. Multiplayer / Social

Single player for MVP. No multiplayer planned.

---

## 9. Monetization

Free and open source.

---

## 10. Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| M0 — Scaffold | Project setup, CI/CD, basic Next.js app | Done |
| Phase 1 — Static Office | Voxel office renders with one dev typing | Done |
| Phase 2 — Multi-Character | 3 devs with state machines, needs, pathfinding | Done |
| Phase 3 — Sprint Engine | Sprint cycle, story progress, tech debt, feedback | Done |
| Phase 4 — Player UI | Sprint planning, team mgmt, practices, shipping | Done |
| Phase 5 — Visual Polish | Animations, thought bubbles, screen glow, build light | In Progress |
| Camera Controls | Zoom and pan (mouse wheel/drag, touch pinch/drag) | Done |
| Phase 6 — Persistence | Save/load game state via Redis | Done |
| New Game Flow | Intro screen, load saved state, auto-onboarding | Done |
| Tooling | Prettier, ESLint strict, coverage thresholds, CI enforcement | Done |

---

## 11. Open Questions

- Should developer traits have mechanical effects beyond flavor?
- How should the game introduce practices gradually (tutorial)?
- Should there be explicit "game over" conditions?

---

## Appendix

### References & Inspiration

- **mi-casa-es-su-casa**: Three.js voxel rendering patterns, tick-based simulation, character state machines
- **Game Dev Tycoon**: Management sim with cascading quality decisions
- **Factorio**: Optimization loop, compound effects of early decisions

### Tech Debt Sources

| Source | Cause |
|--------|-------|
| No tests | Bugs slip through, patches create spaghetti |
| No code review | Poor architecture decisions compound |
| No refactoring | Complexity grows unchecked |
| Building wrong thing | Dead code, pivots require rework |
| Crunch/low morale | Sloppy shortcuts under pressure |

### Glossary

- **Sprint:** A 10-day work cycle
- **Story:** A unit of work with point value
- **Tech Debt:** Accumulated code quality problems (0-1 scale)
- **Death Spiral:** Tech debt > 0.7, everything compounds negatively
