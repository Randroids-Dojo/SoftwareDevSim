import { createRenderer } from './renderer'
import { Developer } from './character/developer'
import { createClock, createClockTicker } from './simulation/clock'
import { calculateSprintProgress, calculateQuality, calculateResult } from './scoring'
import { isStandupTime } from './character/schedule'
import { buildStandupCircle, buildOverflowSpots } from './office'
import { selectCrisis, applyCrisisChoice } from './events'
import type { AppChoice, GameInstance, GameState, WorkerState } from './types'

// --- Constants ---

export const STARTING_CASH = 500_000
export const TOTAL_SPRINTS = 4
export const DAYS_PER_SPRINT = 5

/** Salary per sprint for each role. */
export const ROLE_SALARIES: Record<string, number> = {
  developer: 15_000,
  designer: 12_000,
  product_owner: 18_000,
  manager: 20_000,
}

/** Role display labels. */
export const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  designer: 'Designer',
  product_owner: 'Product Owner',
  manager: 'Manager',
}

export const APP_CHOICES: AppChoice[] = [
  {
    id: 'todo',
    name: 'Todo App',
    description: 'A simple task management app. Low risk, low reward.',
    complexity: 'simple',
    estimatedSprints: 2,
    revenuePotential: 120_000,
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'A workout and health tracking app. Moderate complexity.',
    complexity: 'medium',
    estimatedSprints: 4,
    revenuePotential: 350_000,
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Platform',
    description: 'A full online store with payments. High complexity, high reward.',
    complexity: 'complex',
    estimatedSprints: 6,
    revenuePotential: 750_000,
  },
]

// Re-export scoring functions for convenience
export {
  calculateSprintProgress,
  calculateQuality,
  calculateTotalCost,
  calculateCompletion,
  calculateRevenue,
  calculateGrade,
  calculateResult,
} from './scoring'

// --- Initial state ---

function createInitialState(seed: string): GameState {
  return {
    phase: 'title',
    cash: STARTING_CASH,
    chosenApp: null,
    team: [],
    sprint: {
      current: 0,
      total: 4,
      dayInSprint: 0,
      daysPerSprint: 5,
    },
    clock: createClock(),
    progress: 0,
    quality: 0,
    result: null,
    seed,
    pendingCrisis: null,
    crisesResolved: [],
    progressBonus: 0,
  }
}

// --- Game factory ---

export function createGame(canvas: HTMLCanvasElement): GameInstance {
  const seed = `game-${Date.now()}`
  const state: GameState = createInitialState(seed)

  const gameRenderer = createRenderer(canvas)
  let workers: Developer[] = []

  // Screen glow (AI-assisted coding is always on)
  gameRenderer.setScreenGlow(true)
  gameRenderer.setBuildLight('green')

  const tickClock = createClockTicker()
  let clockAccumulator = 0
  const TICK_INTERVAL = 1 // 1 real second per tick

  // How far the chair slides out to let the character pass
  const CHAIR_SLIDE_DIST = -0.6

  // Standup turn tracker — one speaker at a time
  let standupSpeakerIndex = -1 // -1 = no standup active
  let standupSpeakerTimer = 0
  let standupTotalTimer = 0
  const SPEAKER_DURATION = 5 * 60 // 5 game-minutes per speaker (= 5 real min at 1x)
  const MAX_STANDUP_DURATION = 60 * 60 // hard cap: 1 game-hour
  let standupWasActive = false

  gameRenderer.onFrame((dt) => {
    // Update standup turn coordination
    const standupTriggered = isStandupTime(state.clock) && workers.length > 0
    const speakersRemain = standupSpeakerIndex >= 0 && standupSpeakerIndex < workers.length
    const withinTimeCap = standupTotalTimer < MAX_STANDUP_DURATION
    const standupActive = (standupTriggered || speakersRemain) && withinTimeCap
    if (standupActive) {
      if (!standupWasActive) {
        standupSpeakerIndex = 0
        standupSpeakerTimer = 0
        standupTotalTimer = 0
      }
      const gameDt = dt * state.clock.speed
      standupSpeakerTimer += gameDt
      standupTotalTimer += gameDt
      if (standupSpeakerTimer >= SPEAKER_DURATION && standupSpeakerIndex < workers.length) {
        standupSpeakerTimer = 0
        standupSpeakerIndex++
      }
    } else if (standupWasActive) {
      standupSpeakerIndex = -1
      standupSpeakerTimer = 0
      standupTotalTimer = 0
    }
    standupWasActive = standupActive

    // Animate characters every frame
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i]
      worker.animate(dt)
      worker.updateChatBubble(state.clock, i === standupSpeakerIndex)
    }

    // Animate chairs
    for (let i = 0; i < workers.length && i < gameRenderer.office.chairGroups.length; i++) {
      const chair = gameRenderer.office.chairGroups[i]
      if (!chair) continue
      const activity = workers[i].state.currentActivity
      const targetZ = activity === 'moving' ? CHAIR_SLIDE_DIST : 0
      chair.position.z += (targetZ - chair.position.z) * Math.min(1, dt * 5)
    }

    // Update wall clock hands based on game time
    const { hour, minute } = state.clock
    const minuteAngle = (minute / 60) * Math.PI * 2
    const hourAngle = (((hour % 12) + minute / 60) / 12) * Math.PI * 2
    gameRenderer.office.wallClock.minuteHand.rotation.z = minuteAngle
    gameRenderer.office.wallClock.hourHand.rotation.z = hourAngle

    if (state.clock.paused || state.phase !== 'running') return

    clockAccumulator += dt
    while (clockAccumulator >= TICK_INTERVAL) {
      clockAccumulator -= TICK_INTERVAL
      gameTick()
    }
  })

  function gameTick() {
    const prevDay = state.clock.day
    const { clock, minutesElapsed } = tickClock(state.clock, TICK_INTERVAL)
    state.clock = clock

    if (minutesElapsed === 0) return

    // Tick worker AI (skip while standup meeting is still in progress)
    for (const worker of workers) {
      const meetingExtended = standupSpeakerIndex >= 0 && standupSpeakerIndex < workers.length
      if (meetingExtended && worker.state.currentActivity === 'standup') continue
      worker.tick(state.clock, gameRenderer.office.locations)
      // Sync state back
      const idx = state.team.findIndex((w) => w.id === worker.state.id)
      if (idx >= 0) state.team[idx] = worker.state
    }

    // Track day changes for sprint advancement
    if (clock.day > prevDay) {
      state.sprint.dayInSprint++

      // Sprint complete?
      if (state.sprint.dayInSprint >= state.sprint.daysPerSprint) {
        // Calculate progress for this sprint
        const sprintProgress = calculateSprintProgress(state.team)
        state.progress = Math.min(1, state.progress + sprintProgress)
        state.quality = calculateQuality(state.team)

        // Apply deferred progress bonus (e.g. from CI/CD fix crisis)
        if (state.progressBonus > 0) {
          state.progress = Math.min(1, state.progress + state.progressBonus)
          state.progressBonus = 0
        }

        state.sprint.current++
        state.sprint.dayInSprint = 0

        // All sprints done?
        if (state.sprint.current >= state.sprint.total) {
          state.result = calculateResult(state)
          state.phase = 'ended'
          state.clock.paused = true
        } else if (state.sprint.current >= 1) {
          // Trigger a crisis at sprint boundaries (between sprints 1-3)
          const crisis = selectCrisis(state)
          if (crisis) {
            state.pendingCrisis = crisis
            state.clock.paused = true
          }
        }
      }
    }
  }

  const instance: GameInstance = {
    scene: gameRenderer.scene,
    camera: gameRenderer.camera,
    renderer: gameRenderer.renderer,
    state,
    screenMeshes: gameRenderer.office.screenMeshes,

    start() {
      gameRenderer.start()
    },

    stop() {
      gameRenderer.stop()
    },

    getState() {
      return {
        ...state,
        team: state.team.map((w) => ({
          ...w,
          position: [...w.position] as [number, number, number],
        })),
        sprint: { ...state.sprint },
        clock: { ...state.clock },
        chosenApp: state.chosenApp ? { ...state.chosenApp } : null,
        result: state.result ? { ...state.result } : null,
        pendingCrisis: state.pendingCrisis
          ? {
              ...state.pendingCrisis,
              choices: state.pendingCrisis.choices.map((c) => ({ ...c })),
            }
          : null,
        crisesResolved: [...state.crisesResolved],
        progressBonus: state.progressBonus,
      }
    },

    spawnWorkers(workerStates: WorkerState[]) {
      // Remove existing workers
      for (const w of workers) {
        gameRenderer.removeFromScene(w.mesh.root)
      }
      workers = []

      // Rebuild dynamic locations to fit the team
      const fixed = gameRenderer.office.locations.filter(
        (l) => !l.name.startsWith('standup_') && !l.name.startsWith('overflow_'),
      )
      gameRenderer.office.locations = [
        ...fixed,
        ...buildOverflowSpots(workerStates.length),
        ...buildStandupCircle(workerStates.length),
      ]

      // Create new workers
      for (let i = 0; i < workerStates.length; i++) {
        const worker = new Developer(workerStates[i], i)
        workers.push(worker)
        gameRenderer.addToScene(worker.mesh.root)
      }
    },

    clearWorkers() {
      for (const w of workers) {
        gameRenderer.removeFromScene(w.mesh.root)
      }
      workers = []
    },

    applyPanDeltaPixels(dx: number, dy: number) {
      gameRenderer.applyPanDeltaPixels(dx, dy)
    },

    applyZoomScale(factor: number) {
      gameRenderer.applyZoomScale(factor)
    },

    applyRotationDelta(deltaRadians: number) {
      gameRenderer.applyRotationDelta(deltaRadians)
    },

    resetCamera() {
      gameRenderer.resetCamera()
    },

    resolveCrisis(choiceId: string) {
      const teamSizeBefore = state.team.length
      applyCrisisChoice(state, choiceId)

      // Only respawn workers if a crisis removed a team member
      if (state.team.length !== teamSizeBefore) {
        instance.spawnWorkers(state.team)
      }

      state.clock.paused = false
    },
  }

  return instance
}

export type GameActions = GameInstance
