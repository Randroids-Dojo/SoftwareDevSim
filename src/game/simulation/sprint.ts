import type { Sprint, UserStory, Practices, DeveloperState, GameClock } from '../types'
import { productivity } from '../character/needs'
import { aiSpeedMultiplier, computeStoryQuality } from './codebase'

const SPRINT_LENGTH_DAYS = 10

export function createSprint(number: number): Sprint {
  return {
    number,
    phase: 'planning',
    dayInSprint: 0,
    stories: [],
    hadPlanning: false,
    hadRetro: false,
  }
}

export function startSprint(sprint: Sprint, storyIds: string[], didPlanning: boolean): Sprint {
  return {
    ...sprint,
    phase: 'active',
    dayInSprint: 0,
    stories: storyIds,
    hadPlanning: didPlanning,
  }
}

export function advanceDay(sprint: Sprint): Sprint {
  const newDay = sprint.dayInSprint + 1
  if (newDay >= SPRINT_LENGTH_DAYS) {
    return { ...sprint, dayInSprint: newDay, phase: 'review' }
  }
  return { ...sprint, dayInSprint: newDay }
}

export function shipSprint(sprint: Sprint, didRetro: boolean): Sprint {
  return {
    ...sprint,
    phase: 'shipped',
    hadRetro: didRetro,
  }
}

/** Progress stories based on developer work. Returns updated stories. */
export function tickStoryProgress(
  stories: UserStory[],
  developers: DeveloperState[],
  practices: Practices,
  clock: GameClock,
): UserStory[] {
  // Only progress during work hours
  if (clock.hour < 9 || clock.hour >= 18) return stories

  const speedMult = aiSpeedMultiplier(practices)

  return stories.map((story) => {
    if (story.status !== 'in_progress') return story

    // Find assigned developer
    const dev = developers.find((d) => d.assignedStoryId === story.id)
    if (!dev) return story
    if (dev.currentActivity !== 'working' && dev.currentActivity !== 'pairing') return story

    const prod = productivity(dev)
    // Base progress per game minute: 1/(points * 60 work-minutes-per-point)
    // With AI multiplier and dev productivity
    const baseRate = 1 / (story.points * 60)
    let progressDelta = baseRate * prod * speedMult

    // TDD slows progress by 20% but improves quality
    if (practices.tdd) progressDelta *= 0.8

    // Pairing: 1.3x quality but two devs on one story
    const isPairing = dev.currentActivity === 'pairing'

    const newProgress = Math.min(1, story.progress + progressDelta)

    const updated = { ...story, progress: newProgress }

    // Story completion — mark practices and compute quality only once
    if (newProgress >= 1) {
      if (practices.tdd) updated.hasTests = true
      if (practices.codeReview) updated.wasReviewed = true
      // wasPlanned is set during beginSprint, not here — don't overwrite

      updated.status = practices.codeReview ? 'review' : 'done'
      updated.quality = computeStoryQuality(updated, practices, prod * (isPairing ? 1.3 : 1.0))
    }

    return updated
  })
}

/** Move stories from review to done (auto-approve after review). */
export function tickReview(stories: UserStory[]): UserStory[] {
  return stories.map((story) => {
    if (story.status !== 'review') return story
    // Reviews take a tick to complete
    return { ...story, status: 'done', wasReviewed: true }
  })
}

export function sprintVelocity(stories: UserStory[]): number {
  return stories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0)
}

export function isSprintComplete(sprint: Sprint): boolean {
  return sprint.dayInSprint >= SPRINT_LENGTH_DAYS
}

export function getSprintLength(): number {
  return SPRINT_LENGTH_DAYS
}
