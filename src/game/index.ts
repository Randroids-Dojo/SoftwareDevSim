import { createRenderer } from './renderer'
import { Developer, createInitialDevelopers } from './character/developer'
import { createClock, tickClock } from './simulation/clock'
import {
  createSprint,
  startSprint,
  advanceDay,
  shipSprint,
  tickStoryProgress,
  tickReview,
  sprintVelocity,
} from './simulation/sprint'
import { generateBacklog } from './simulation/backlog'
import { createCodebase, shipRelease } from './simulation/codebase'
import { generateFeedback } from './simulation/feedback'
import { createRng } from '../lib/seededRng'
import type { GameState, GameInstance, Practices } from './types'

function createInitialState(seed: string): GameState {
  const rng = createRng(seed)
  return {
    clock: createClock(),
    developers: createInitialDevelopers(),
    sprint: createSprint(1),
    backlog: generateBacklog(rng),
    codebase: createCodebase(),
    feedback: [],
    practices: {
      ci: false,
      codeReview: false,
      tdd: false,
      pairProgramming: false,
      sprintPlanning: false,
      refactoringBudget: false,
    },
    seed,
  }
}

export function createGame(canvas: HTMLCanvasElement, existingState?: GameState): GameInstance {
  const seed = existingState?.seed ?? `game-${Date.now()}`
  const state: GameState = existingState ?? createInitialState(seed)

  const gameRenderer = createRenderer(canvas)
  const developers: Developer[] = []

  // Create developer visuals
  for (let i = 0; i < state.developers.length; i++) {
    const dev = new Developer(state.developers[i], i)
    developers.push(dev)
    gameRenderer.addToScene(dev.mesh.root)
  }

  // Screen glow (AI-assisted coding is always on)
  gameRenderer.setScreenGlow(true)
  gameRenderer.setBuildLight(state.codebase.ciStatus)

  let clockAccumulator = 0
  const TICK_INTERVAL = 1 // 1 real second per tick

  gameRenderer.onFrame((dt) => {
    // Animate characters every frame
    for (const dev of developers) {
      dev.animate(dt)
    }

    if (state.clock.paused) return

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

    // Tick developer AI
    for (const dev of developers) {
      const pairPartner =
        state.practices.pairProgramming && dev.state.assignedStoryId
          ? (developers.find(
              (d) => d !== dev && d.state.assignedStoryId === dev.state.assignedStoryId,
            )?.state.id ?? null)
          : null

      dev.tick(
        state.clock,
        state.practices,
        state.codebase.techDebt,
        gameRenderer.office.locations,
        pairPartner,
      )

      // Sync state back
      const idx = state.developers.findIndex((d) => d.id === dev.state.id)
      if (idx >= 0) state.developers[idx] = dev.state
    }

    // Progress stories
    if (state.sprint.phase === 'active') {
      const sprintStories = state.backlog.filter((s) => state.sprint.stories.includes(s.id))
      const updated = tickStoryProgress(
        sprintStories,
        state.developers,
        state.practices,
        state.clock,
      )
      const reviewed = tickReview(updated)

      // Merge back
      for (const story of reviewed) {
        const idx = state.backlog.findIndex((s) => s.id === story.id)
        if (idx >= 0) state.backlog[idx] = story
      }
    }

    // Advance sprint day after work — so the last day isn't lost
    if (clock.day > prevDay && state.sprint.phase === 'active') {
      state.sprint = advanceDay(state.sprint)
    }

    // Update build light
    gameRenderer.setBuildLight(state.codebase.ciStatus)
  }

  const instance: GameInstance = {
    scene: gameRenderer.scene,
    camera: gameRenderer.camera,
    renderer: gameRenderer.renderer,

    state,

    start() {
      // Only auto-unpause for new games; saved games keep their paused state
      if (!existingState) {
        state.clock.paused = false
      }
      gameRenderer.start()
    },

    stop() {
      gameRenderer.stop()
    },

    getState() {
      return {
        ...state,
        developers: state.developers.map((d) => ({
          ...d,
          position: [...d.position] as [number, number, number],
        })),
        backlog: state.backlog.map((s) => ({ ...s })),
        feedback: state.feedback.map((f) => ({ ...f })),
        practices: { ...state.practices },
        codebase: { ...state.codebase },
        clock: { ...state.clock },
        sprint: { ...state.sprint, stories: [...state.sprint.stories] },
      }
    },

    updateState(partial) {
      Object.assign(state, partial)

      if (partial.developers) {
        for (let i = 0; i < developers.length; i++) {
          developers[i].state = state.developers[i]
        }
      }

      if (partial.codebase) {
        gameRenderer.setBuildLight(state.codebase.ciStatus)
      }
    },

    beginSprint(storyIds: string[], didPlanning: boolean) {
      for (const id of storyIds) {
        const story = state.backlog.find((s) => s.id === id)
        if (story) {
          story.status = 'todo'
          if (didPlanning) story.wasPlanned = true
        }
      }
      state.sprint = startSprint(state.sprint, storyIds, didPlanning)
    },

    assignStory(devId: string, storyId: string) {
      const dev = state.developers.find((d) => d.id === devId)
      const story = state.backlog.find((s) => s.id === storyId)
      if (dev && story) {
        const othersOnStory = state.developers.filter(
          (d) => d.assignedStoryId === storyId && d.id !== devId,
        )

        // Allow two devs on one story when pair programming is enabled
        const maxDevs = state.practices.pairProgramming ? 2 : 1
        if (othersOnStory.length >= maxDevs) {
          // Evict existing devs to make room
          for (const d of othersOnStory) {
            d.assignedStoryId = null
            const inst = developers.find((di) => di.state.id === d.id)
            if (inst) inst.state.assignedStoryId = null
          }
        }

        dev.assignedStoryId = storyId
        story.status = 'in_progress'
        const devInstance = developers.find((d) => d.state.id === devId)
        if (devInstance) devInstance.state.assignedStoryId = storyId
      }
    },

    unassignStory(devId: string) {
      const dev = state.developers.find((d) => d.id === devId)
      if (dev) {
        dev.assignedStoryId = null
        const devInstance = developers.find((d) => d.state.id === devId)
        if (devInstance) devInstance.state.assignedStoryId = null
      }
    },

    shipRelease() {
      const doneStories = state.backlog.filter(
        (s) => state.sprint.stories.includes(s.id) && s.status === 'done',
      )
      state.codebase = shipRelease(state.codebase, doneStories, state.practices)

      const sprintRng = createRng(state.seed + state.sprint.number)
      const feedback = generateFeedback(
        sprintRng,
        state.sprint.number,
        doneStories,
        state.codebase,
        state.practices,
      )
      state.feedback.push(...feedback)

      state.sprint = shipSprint(state.sprint, false)
      gameRenderer.setBuildLight(state.codebase.ciStatus)

      return { feedback, velocity: sprintVelocity(doneStories), codebase: { ...state.codebase } }
    },

    nextSprint() {
      // Reset incomplete stories from the old sprint back to backlog
      for (const storyId of state.sprint.stories) {
        const story = state.backlog.find((s) => s.id === storyId)
        if (story && story.status !== 'done') {
          story.status = 'backlog'
          story.progress = 0
          story.quality = 0
          story.wasPlanned = false
          story.hasTests = false
          story.wasReviewed = false
          story.wasRefactored = false
        }
      }

      // Clear all dev assignments
      for (const dev of state.developers) {
        dev.assignedStoryId = null
      }
      for (const devInstance of developers) {
        devInstance.state.assignedStoryId = null
      }

      state.sprint = createSprint(state.sprint.number + 1)
    },

    togglePractice(key: keyof Practices) {
      state.practices[key] = !state.practices[key]
    },

    setPaused(paused: boolean) {
      state.clock.paused = paused
    },

    setSpeed(speed: number) {
      state.clock.speed = speed
    },
  }

  return instance
}

export type GameActions = GameInstance
