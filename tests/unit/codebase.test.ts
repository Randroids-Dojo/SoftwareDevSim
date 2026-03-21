import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCodebase,
  computeStoryQuality,
  shipRelease,
  aiSpeedMultiplier,
  debtMultiplier,
  isDeathSpiral,
} from '../../src/game/simulation/codebase'
import type { UserStory, Practices } from '../../src/game/types'

function makeStory(overrides: Partial<UserStory> = {}): UserStory {
  return {
    id: 'story-1',
    title: 'Test',
    points: 3,
    status: 'done',
    quality: 0.7,
    progress: 1,
    wasPlanned: false,
    hasTests: false,
    wasReviewed: false,
    wasRefactored: false,
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

describe('Codebase', () => {
  it('creates with sensible defaults', () => {
    const cb = createCodebase()
    assert.ok(cb.quality > 0)
    assert.ok(cb.techDebt < 0.5)
    assert.equal(cb.ciStatus, 'green')
  })

  it('death spiral triggers at tech debt > 0.7', () => {
    const cb = createCodebase()
    assert.equal(isDeathSpiral(cb), false)
    assert.equal(isDeathSpiral({ ...cb, techDebt: 0.8 }), true)
  })

  it('tech debt stays clamped at 1.0', () => {
    const cb = { ...createCodebase(), techDebt: 0.95 }
    const stories = [makeStory({ points: 8 }), makeStory({ id: 's2', points: 8 })]
    const updated = shipRelease(cb, stories, makePractices())
    assert.ok(updated.techDebt <= 1.0, `Expected techDebt <= 1.0, got ${updated.techDebt}`)
  })

  it('handles shipping with no stories', () => {
    const cb = createCodebase()
    const updated = shipRelease(cb, [], makePractices())
    assert.equal(updated.totalPointsShipped, 0)
    assert.equal(updated.releasesShipped, 1)
    assert.equal(updated.quality, cb.quality)
  })
})

describe('Story Quality', () => {
  it('TDD gives quality floor of 0.85', () => {
    const story = makeStory()
    const q = computeStoryQuality(story, makePractices({ tdd: true }), 0.5)
    assert.ok(q >= 0.85, `Expected >= 0.85, got ${q}`)
  })

  it('without tests, quality capped at 0.6', () => {
    const story = makeStory()
    const q = computeStoryQuality(story, makePractices(), 1.0)
    assert.ok(q <= 0.6, `Expected <= 0.6, got ${q}`)
  })

  it('code review adds +0.15', () => {
    const story = makeStory({ hasTests: true })
    const withoutReview = computeStoryQuality(story, makePractices(), 0.5)
    const withReview = computeStoryQuality(story, makePractices({ codeReview: true }), 0.5)
    assert.ok(withReview > withoutReview)
  })
})

describe('Ship Release', () => {
  it('increases total points shipped', () => {
    const cb = createCodebase()
    const stories = [makeStory({ points: 5 }), makeStory({ id: 's2', points: 3 })]
    const updated = shipRelease(cb, stories, makePractices())
    assert.equal(updated.totalPointsShipped, 8)
    assert.equal(updated.releasesShipped, 1)
  })

  it('tech debt increases without tests or review', () => {
    const cb = createCodebase()
    const stories = [makeStory()]
    const updated = shipRelease(cb, stories, makePractices())
    assert.ok(updated.techDebt > cb.techDebt)
  })

  it('refactoring budget reduces tech debt', () => {
    const cb = { ...createCodebase(), techDebt: 0.3 }
    const stories = [makeStory({ hasTests: true, wasReviewed: true, wasPlanned: true })]
    const updated = shipRelease(cb, stories, makePractices({ refactoringBudget: true }))
    assert.ok(
      updated.techDebt < cb.techDebt,
      `Expected debt to decrease: ${updated.techDebt} < ${cb.techDebt}`,
    )
  })
})

describe('AI Multipliers', () => {
  it('gives 2x speed with good practices', () => {
    const mult = aiSpeedMultiplier(
      makePractices({
        tdd: true,
        codeReview: true,
        ci: true,
        sprintPlanning: true,
      }),
    )
    assert.equal(mult, 2.0)
  })

  it('gives 2x speed with no practices (but reckless)', () => {
    assert.equal(aiSpeedMultiplier(makePractices()), 2.0)
  })

  it('debt multiplier is 2x with no practices', () => {
    assert.equal(debtMultiplier(makePractices()), 2.0)
  })

  it('debt multiplier is 0.5x with good practices', () => {
    const mult = debtMultiplier(
      makePractices({
        tdd: true,
        codeReview: true,
        ci: true,
        sprintPlanning: true,
      }),
    )
    assert.equal(mult, 0.5)
  })
})
