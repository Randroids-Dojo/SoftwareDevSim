# SoftwareDevSim — Game Design Document

> A voxel office sim where you hire a team and watch them build an app over 4 sprints. Balance your budget across Developers, Designers, Product Owners, and Managers — then see if you turn a profit.

---

## 1. Overview

**Title:** SoftwareDevSim
**Genre:** Simulation / Management
**Platform:** Web (browser-based)
**Tech Stack:** Next.js 15, TypeScript, Three.js (voxel rendering)

### Elevator Pitch

You have $500K and 4 sprints. Choose an app to build, hire your team, and watch them work in a voxel office. Your team composition determines what ships — hire all managers and nothing gets built. Find the right mix and you might get an S-grade.

### Target Audience

Software developers and engineering managers who enjoy simulation/management games and will appreciate the meta-humor of simulating their own work.

---

## 2. Core Concept

### Theme

Team composition matters more than headcount. The right roles working together outperform a large unfocused team.

### Player Fantasy

You're a startup founder who gets to experiment with different team compositions and see the consequences play out in real time.

### Core Loop

```
Choose App → Hire Team → Watch 4 Sprints → See Results → Retry
```

The player picks an app to build, allocates budget across roles, and watches the office animate through 4 sprints. At the end, they see a letter grade, cost/revenue breakdown, and can retry with a different strategy.

### Win/Loss Conditions

No explicit loss — the game always runs 4 sprints. The implicit goal is to maximize ROI. Grades range from S (ROI >= 300%) to F (ROI < -50%).

---

## 3. Game Mechanics

### App Choices

| App | Complexity | Est. Sprints | Revenue Potential |
|-----|-----------|-------------|------------------|
| Todo App | Simple | 2 | $120,000 |
| Fitness Tracker | Medium | 4 | $350,000 |
| E-Commerce Platform | Complex | 6 | $750,000 |

The player has 4 sprints regardless. Simple apps are easy to complete; complex apps offer higher reward but may not finish.

### Team Roles

| Role | Salary/Sprint | Effect |
|------|--------------|--------|
| Developer | $15,000 | +20% app progress per sprint |
| Designer | $12,000 | +0.15 quality (only with devs present) |
| Product Owner | $18,000 | +25% dev effectiveness (multiplicative) |
| Manager | $20,000 | 1st: +10% coordination bonus. Each additional: -15% productivity (meetings!) |

**Starting budget:** $500,000
**Max team size:** 6 per role (24 total, but budget limits practical size to 3-5)

### Scoring

- **Progress:** Accumulated over 4 sprints based on dev count, PO boost, and manager effect
- **Completion:** Progress scaled by app difficulty (`estimatedSprints / 4`)
- **Quality:** 0.3 base (with devs) + 0.15 per designer, capped at 1.0. Zero without devs.
- **Revenue:** `appPotential * completion * (0.5 + quality)`. Requires >= 40% completion to ship anything.
- **Cost:** Sum of all salaries across 4 sprints
- **ROI:** `(revenue - cost) / cost * 100`

### Grading

| Grade | ROI Threshold |
|-------|--------------|
| S | >= 300% |
| A | >= 150% |
| B | >= 50% |
| C | >= 0% |
| D | >= -50% |
| F | < -50% |

### Degenerate Team Examples

- **All managers:** 0 devs = 0 progress = F grade
- **All designers:** 0 devs = 0 quality (no product to design) = F grade
- **1 dev, no PO/designer:** Low progress, low quality = likely D or F
- **2 devs, 1 PO, 1 designer:** Solid team = B or A depending on app choice

---

## 4. World & Setting

### Setting

A voxel office (~24x16x8 voxels). Orthographic camera, front wall open.

### Office Layout

| Location | Position | Purpose |
|----------|----------|---------|
| desk_0, desk_1 | Front-left pair | Work desks |
| desk_2, desk_3 | Front-right pair | Work desks |
| coffee | Back-right corner | Break spot |
| meeting | Back-left | Meeting area |
| whiteboard | Back-center | PO workspace + build light |

### Character Behavior by Role

| Role | Primary Activity | Location |
|------|-----------------|----------|
| Developer | Typing at desk | desk (assigned by index) |
| Designer | Typing at desk | desk (assigned by index) |
| Product Owner | Alternates meeting/working | whiteboard + desk |
| Manager | Meetings, then coffee | meeting area + coffee |

Workers take coffee breaks when energy is low. Outside work hours (before 9am, after 6pm), everyone is idle.

### Character Activities

idle, moving, working (typing), meeting (talking), break (drinking coffee), standup (daily sync)

### Daily Standup & Standdown

Once per day, the entire team gathers for two brief ceremonies:

- **Standup (9:00–11:00):** All workers walk to the whiteboard area and form a circle. They play a talk animation and show speech bubbles with standup-style updates ("Working on the API", "PR needs review", "Tests are green!").
- **Standdown (15:30–18:00):** Same gathering at end of day, with wrap-up messages ("Good progress today!", "Let's ship it tomorrow", "Done for today!").

Windows are deliberately wide so the ceremonies remain visible at 20× game speed, where each tick jumps ~100 game minutes. Movement is per-frame (60fps) and scales with clock speed so characters walk briskly at fast-forward.

After each ceremony, workers return to their desks and sit down. Workers with critically low energy (< 5%) skip standup for a coffee break.

Circle positions are generated dynamically around the whiteboard (6 slots, radius 1.8 units, center at [12, 0, 12]).

---

## 5. Technical Design

### Data Model

```
WorkerState: id, name, role (developer|designer|product_owner|manager),
             salary, energy, currentActivity, position

AppChoice:   id, name, description, complexity, estimatedSprints, revenuePotential

SprintState: current (0-3), total (4), dayInSprint, daysPerSprint (5)

GameState:   phase, cash, chosenApp, team[], sprint, clock,
             progress (0-1), quality (0-1), result, seed
```

### State Management

- Game state is a single `GameState` object owned by the game engine
- React polls it via `useGameState` hook (4x/sec)
- State mutations happen through direct property assignment on `game.state`
- No persistence — each session is a fresh game

### Game Clock

- 1 real second = 5 game minutes (base rate)
- During auto-play: 20x speed (1 real second = 100 game minutes)
- Work hours: 9am-6pm
- Sprint length: 5 game days
- Total: 4 sprints = 20 game days

### Sprint Progression

Progress and quality are calculated once per sprint completion (not per-tick). Each sprint:
1. Clock ticks at 20x speed
2. Workers animate based on role (devs type, POs visit whiteboard, managers hold meetings)
3. After 5 game days: sprint completes, progress/quality updated
4. After 4 sprints: result calculated, end screen shown

---

## 6. User Interface

### Game Flow Screens

| Screen | Description |
|--------|-------------|
| **Title** | Game name, budget intro, Start button |
| **App Selection** | 3 cards: Todo App, Fitness Tracker, E-Commerce Platform |
| **Hire Team** | +/- controls for each role, live budget tracking |
| **Sprint Overlay** | Sprint counter, day progress bar, overall progress bar |
| **End Screen** | Letter grade, completion %, quality %, cost/revenue/ROI breakdown, Retry button |

All screens render as overlays on top of the 3D office canvas.

### Camera Controls

| Input | Action |
|-------|--------|
| Left mouse drag | Pan camera |
| Right mouse drag | Rotate orbit |
| Mouse wheel | Zoom in/out |
| Single-finger drag (touch) | Pan camera |
| Two-finger pinch (touch) | Zoom + rotate |

Zoom range: 0.5x to 4x. Pan is clamped to keep the office in view.

---

## 7. Art & Audio Direction

### Visual Style

Voxel art with an isometric-ish orthographic camera. Warm office colors. Monitor screens glow green. Build light near whiteboard.

### Character Animations

- **sit:** Seated idle at desk
- **type:** Seated typing (arms on keyboard)
- **walk:** Walking between locations
- **talk:** Standing, gesticulating (meetings & standup)
- **drink:** Coffee break (arm raised)
- **chat bubble:** Canvas-rendered speech sprite shown during standup/standdown

### Audio

Silent for MVP. Ambient office sounds possible future enhancement.

---

## 8. Multiplayer / Social

Single player. No multiplayer planned.

---

## 9. Monetization

Free and open source.

---

## 10. Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| M0 — Scaffold | Project setup, CI/CD, basic Next.js app | Done |
| Phase 1 — Static Office | Voxel office renders with characters | Done |
| Phase 2 — Character System | Character meshes, animations, pathfinding, state machine | Done |
| Camera Controls | Zoom, pan, rotate (mouse + touch) | Done |
| Tooling | Prettier, ESLint strict, coverage thresholds, CI enforcement | Done |
| Basic Game Loop | Choose app, hire team, auto-play 4 sprints, end screen with grading | Done |
| Standup/Standdown | Daily team ceremonies with circle formation and chat bubbles | Done |

---

## 11. Open Questions

- Should hiring include a "tip" or hint about what makes a good team?
- Should sprint-by-sprint progress be shown (breakdown per sprint)?
- Should there be unlockable team compositions or achievements?
- Should the office grow/change based on team size?

---

## Appendix

### References & Inspiration

- **Game Dev Tycoon**: Management sim with cascading quality decisions
- **Factorio**: Optimization loop, compound effects of early decisions
- **Lemonade Stand**: Simple economic game with clear inputs/outputs

### Glossary

- **Sprint:** A 5-day work cycle (4 sprints per game)
- **Progress:** How much of the app has been built (0-1 scale)
- **Quality:** How well the app is built (0-1 scale, requires devs and designers)
- **ROI:** Return on Investment — `(revenue - cost) / cost * 100%`
