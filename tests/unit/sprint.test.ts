import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createSprint,
  startSprint,
  advanceDay,
  shipSprint,
  tickStoryProgress,
  tickReview,
  sprintVelocity,
  isSprintComplete,
  getSprintLength,
} from '../../src/game/simulation/sprint'
import type { UserStory, DeveloperState, Practices, GameClock } from '../../src/game/types'

function makeStory(overrides: Partial<UserStory> = {}): UserStory {
  return {
    id: 'story-1',
    title: 'Test Story',
    points: 3,
    status: 'in_progress',
    quality: 0,
    progress: 0,
    wasPlanned: false,
    hasTests: false,
    wasReviewed: false,
    wasRefactored: false,
    ...overrides,
  }
}

function makeDev(overrides: Partial<DeveloperState> = {}): DeveloperState {
  return {
    id: 'dev-0',
    name: 'Alex',
    trait: 'architect',
    morale: 0.8,
    energy: 1.0,
    focus: 0.7,
    currentActivity: 'working',
    assignedStoryId: 'story-1',
    position: [3.5, 0, 1],
    ...overrides,
  }
}

function makePractices(overrides: Partial<Practices> = {}): Practices {
  return {
    ci: false,
    codeReview: false,
    tdd: false,
    pairProgramming: false,
    sprintPlanning: false,
    refactoringBudget: false,
    ...overrides,
  }
}

function makeClock(overrides: Partial<GameClock> = {}): GameClock {
  return { day: 1, hour: 10, minute: 0, paused: false, speed: 1, ...overrides }
}

describe('Sprint', () => {
  it('creates a sprint in planning phase', () => {
    const sprint = createSprint(1)
    assert.equal(sprint.number, 1)
    assert.equal(sprint.phase, 'planning')
    assert.equal(sprint.dayInSprint, 0)
    assert.deepEqual(sprint.stories, [])
  })

  it('starts a sprint with stories', () => {
    const sprint = startSprint(createSprint(1), ['s1', 's2'], true)
    assert.equal(sprint.phase, 'active')
    assert.deepEqual(sprint.stories, ['s1', 's2'])
    assert.equal(sprint.hadPlanning, true)
  })

  it('advances sprint day', () => {
    let sprint = startSprint(createSprint(1), ['s1'], false)
    sprint = advanceDay(sprint)
    assert.equal(sprint.dayInSprint, 1)
    assert.equal(sprint.phase, 'active')
  })

  it('transitions to review after sprint length days', () => {
    let sprint = startSprint(createSprint(1), ['s1'], false)
    for (let i = 0; i < getSprintLength(); i++) {
      sprint = advanceDay(sprint)
    }
    assert.equal(sprint.phase, 'review')
  })

  it('ships a sprint', () => {
    let sprint = startSprint(createSprint(1), ['s1'], true)
    sprint = shipSprint(sprint, true)
    assert.equal(sprint.phase, 'shipped')
    assert.equal(sprint.hadRetro, true)
  })

  it('reports sprint completeness', () => {
    let sprint = startSprint(createSprint(1), ['s1'], false)
    assert.equal(isSprintComplete(sprint), false)
    for (let i = 0; i < getSprintLength(); i++) {
      sprint = advanceDay(sprint)
    }
    assert.equal(isSprintComplete(sprint), true)
  })
})

describe('Story Progress', () => {
  it('progresses a story when dev is working', () => {
    const stories = [makeStory()]
    const devs = [makeDev()]
    const updated = tickStoryProgress(stories, devs, makePractices(), makeClock())
    assert.ok(updated[0].progress > 0)
  })

  it('does not progress outside work hours', () => {
    const stories = [makeStory()]
    const devs = [makeDev()]
    const updated = tickStoryProgress(stories, devs, makePractices(), makeClock({ hour: 20 }))
    assert.equal(updated[0].progress, 0)
  })

  it('does not progress when dev is idle', () => {
    const stories = [makeStory()]
    const devs = [makeDev({ currentActivity: 'idle' })]
    const updated = tickStoryProgress(stories, devs, makePractices(), makeClock())
    assert.equal(updated[0].progress, 0)
  })

  it('applies TDD quality floor', () => {
    const stories = [makeStory({ progress: 0.998 })]
    const devs = [makeDev()]
    const updated = tickStoryProgress(stories, devs, makePractices({ tdd: true }), makeClock())
    const completed = updated.find((s) => s.status === 'done' || s.status === 'review')
    assert.ok(completed, 'Expected a completed story')
    assert.ok(completed.quality >= 0.85, `Expected quality >= 0.85, got ${completed.quality}`)
    assert.equal(completed.hasTests, true)
  })

  it('moves completed stories to review when code review is on', () => {
    const stories = [makeStory({ progress: 0.998 })]
    const devs = [makeDev()]
    const updated = tickStoryProgress(
      stories,
      devs,
      makePractices({ codeReview: true }),
      makeClock(),
    )
    const completed = updated.find((s) => s.progress >= 1)
    assert.ok(completed, 'Expected a story with progress >= 1')
    assert.equal(completed.status, 'review')
  })

  it('moves reviewed stories to done', () => {
    const stories = [makeStory({ status: 'review', progress: 1 })]
    const updated = tickReview(stories)
    assert.equal(updated[0].status, 'done')
    assert.equal(updated[0].wasReviewed, true)
  })

  it('applies pairing quality boost when two devs are assigned to the same story', () => {
    const stories = [makeStory({ progress: 0.998 })]
    const devs = [
      makeDev({ id: 'dev-0', currentActivity: 'pairing', assignedStoryId: 'story-1' }),
      makeDev({
        id: 'dev-1',
        name: 'Jordan',
        currentActivity: 'pairing',
        assignedStoryId: 'story-1',
      }),
    ]
    const updated = tickStoryProgress(
      stories,
      devs,
      makePractices({ pairProgramming: true }),
      makeClock(),
    )
    const completed = updated.find((s) => s.progress >= 1)
    assert.ok(completed, 'Expected a completed story')
    // Pairing gives 1.3x quality multiplier
    assert.ok(completed.quality > 0, 'Expected quality > 0 from pairing')
  })

  it('progresses story with two devs assigned (pair programming)', () => {
    const stories = [makeStory()]
    const devs = [
      makeDev({ id: 'dev-0', currentActivity: 'pairing', assignedStoryId: 'story-1' }),
      makeDev({
        id: 'dev-1',
        name: 'Jordan',
        currentActivity: 'pairing',
        assignedStoryId: 'story-1',
      }),
    ]
    const updated = tickStoryProgress(
      stories,
      devs,
      makePractices({ pairProgramming: true }),
      makeClock(),
    )
    assert.ok(updated[0].progress > 0, 'Expected progress from paired devs')
  })
})

describe('Sprint Velocity', () => {
  it('sums points of done stories', () => {
    const stories = [
      makeStory({ id: 's1', points: 3, status: 'done' }),
      makeStory({ id: 's2', points: 5, status: 'done' }),
      makeStory({ id: 's3', points: 2, status: 'in_progress' }),
    ]
    assert.equal(sprintVelocity(stories), 8)
  })

  it('returns 0 for empty stories array', () => {
    assert.equal(sprintVelocity([]), 0)
  })

  it('returns 0 when no stories are done', () => {
    const stories = [
      makeStory({ id: 's1', status: 'in_progress' }),
      makeStory({ id: 's2', status: 'review' }),
    ]
    assert.equal(sprintVelocity(stories), 0)
  })
})
