import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateSprintProgress,
  calculateQuality,
  calculateTotalCost,
  calculateCompletion,
  calculateRevenue,
  calculateGrade,
  calculateResult,
  TOTAL_SPRINTS,
} from '../../src/game/scoring'
import { ROLE_SALARIES } from '../../src/game/index'
import type { WorkerState, GameState } from '../../src/game/types'

function makeWorker(role: WorkerState['role'], id = 'worker-0'): WorkerState {
  return {
    id,
    name: 'Test',
    role,
    salary: ROLE_SALARIES[role],
    energy: 1,
    currentActivity: 'idle',
    position: [0, 0, 0],
  }
}

describe('calculateSprintProgress', () => {
  it('returns 0 with no team', () => {
    assert.equal(calculateSprintProgress([]), 0)
  })

  it('returns 0.2 per developer', () => {
    const team = [makeWorker('developer')]
    assert.equal(calculateSprintProgress(team), 0.2)
  })

  it('scales linearly with developers', () => {
    const team = [makeWorker('developer', 'w-0'), makeWorker('developer', 'w-1')]
    assert.equal(calculateSprintProgress(team), 0.4)
  })

  it('PO boosts dev progress by 25%', () => {
    const team = [makeWorker('developer', 'w-0'), makeWorker('product_owner', 'w-1')]
    assert.closeTo(calculateSprintProgress(team), 0.25, 0.001)
  })

  it('first manager adds 10% bonus', () => {
    const team = [makeWorker('developer', 'w-0'), makeWorker('manager', 'w-1')]
    assert.closeTo(calculateSprintProgress(team), 0.22, 0.001)
  })

  it('extra managers reduce productivity', () => {
    const team = [
      makeWorker('developer', 'w-0'),
      makeWorker('manager', 'w-1'),
      makeWorker('manager', 'w-2'),
      makeWorker('manager', 'w-3'),
    ]
    const progress = calculateSprintProgress(team)
    // 0.2 * 1.1 * max(0.1, 1 - 2*0.15) = 0.2 * 1.1 * 0.7 = 0.154
    assert.closeTo(progress, 0.154, 0.001)
  })

  it('all managers = no progress', () => {
    const team = [makeWorker('manager', 'w-0'), makeWorker('manager', 'w-1')]
    // 0 devs = 0 base progress, even with manager bonus
    assert.equal(calculateSprintProgress(team), 0)
  })

  it('designer alone produces no progress', () => {
    assert.equal(calculateSprintProgress([makeWorker('designer')]), 0)
  })

  it('multiple POs stack multiplicatively', () => {
    const team = [
      makeWorker('developer', 'w-0'),
      makeWorker('product_owner', 'w-1'),
      makeWorker('product_owner', 'w-2'),
    ]
    // 0.2 * (1 + 2*0.25) = 0.2 * 1.5 = 0.3
    assert.closeTo(calculateSprintProgress(team), 0.3, 0.001)
  })

  it('PO without devs produces no progress', () => {
    assert.equal(calculateSprintProgress([makeWorker('product_owner')]), 0)
  })

  it('manager penalty floors at 0.1 multiplier', () => {
    const team = [
      makeWorker('developer', 'w-0'),
      makeWorker('manager', 'w-1'),
      makeWorker('manager', 'w-2'),
      makeWorker('manager', 'w-3'),
      makeWorker('manager', 'w-4'),
      makeWorker('manager', 'w-5'),
      makeWorker('manager', 'w-6'),
      makeWorker('manager', 'w-7'),
    ]
    // 0.2 * 1.1 * max(0.1, 1 - 7*0.15) = 0.2 * 1.1 * 0.1 = 0.022
    assert.closeTo(calculateSprintProgress(team), 0.022, 0.001)
  })
})

describe('calculateQuality', () => {
  it('returns 0 with no team', () => {
    assert.equal(calculateQuality([]), 0)
  })

  it('returns 0 with designers but no devs', () => {
    const team = [makeWorker('designer', 'w-0'), makeWorker('designer', 'w-1')]
    assert.equal(calculateQuality(team), 0)
  })

  it('returns 0.3 base with devs only', () => {
    assert.equal(calculateQuality([makeWorker('developer')]), 0.3)
  })

  it('designers add 0.15 each when devs present', () => {
    const team = [makeWorker('developer', 'w-0'), makeWorker('designer', 'w-1')]
    assert.closeTo(calculateQuality(team), 0.45, 0.001)
  })

  it('caps quality at 1.0', () => {
    const team = [
      makeWorker('developer', 'w-0'),
      makeWorker('designer', 'w-1'),
      makeWorker('designer', 'w-2'),
      makeWorker('designer', 'w-3'),
      makeWorker('designer', 'w-4'),
      makeWorker('designer', 'w-5'),
    ]
    assert.equal(calculateQuality(team), 1)
  })

  it('two designers add 0.30 quality on top of base', () => {
    const team = [
      makeWorker('developer', 'w-0'),
      makeWorker('designer', 'w-1'),
      makeWorker('designer', 'w-2'),
    ]
    assert.closeTo(calculateQuality(team), 0.6, 0.001)
  })

  it('single dev with no designers returns exactly 0.3', () => {
    assert.equal(calculateQuality([makeWorker('developer')]), 0.3)
    // Verify it's not 0 or some other value
    assert.notEqual(calculateQuality([makeWorker('developer')]), 0)
    assert.ok(calculateQuality([makeWorker('developer')]) > 0.2)
    assert.ok(calculateQuality([makeWorker('developer')]) < 0.4)
  })
})

describe('calculateTotalCost', () => {
  it('returns 0 for empty team', () => {
    assert.equal(calculateTotalCost([]), 0)
  })

  it('multiplies salary by sprint count', () => {
    const team = [makeWorker('developer')]
    assert.equal(calculateTotalCost(team), ROLE_SALARIES.developer * TOTAL_SPRINTS)
  })

  it('sums across multiple workers', () => {
    const team = [makeWorker('developer', 'w-0'), makeWorker('designer', 'w-1')]
    const expected = (ROLE_SALARIES.developer + ROLE_SALARIES.designer) * TOTAL_SPRINTS
    assert.equal(calculateTotalCost(team), expected)
  })

  it('TOTAL_SPRINTS is 4', () => {
    assert.equal(TOTAL_SPRINTS, 4)
  })
})

describe('calculateCompletion', () => {
  it('returns 1.0 when progress matches difficulty', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'medium' as const,
      estimatedSprints: 4,
      revenuePotential: 100,
    }
    // estimatedSprints/totalSprints = 4/4 = 1, so need progress=1
    assert.equal(calculateCompletion(1, app), 1)
  })

  it('simple apps are easier to complete', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'simple' as const,
      estimatedSprints: 2,
      revenuePotential: 100,
    }
    // difficultyScale = 2/4 = 0.5, so progress=0.5 → completion=1
    assert.equal(calculateCompletion(0.5, app), 1)
  })

  it('complex apps are harder to complete', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'complex' as const,
      estimatedSprints: 6,
      revenuePotential: 100,
    }
    // difficultyScale = 6/4 = 1.5, so progress=0.6 → completion=0.4
    assert.closeTo(calculateCompletion(0.6, app), 0.4, 0.001)
  })

  it('caps completion at 1.0 for excess progress', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'simple' as const,
      estimatedSprints: 2,
      revenuePotential: 100,
    }
    // difficultyScale = 0.5, progress=1.0 → 1.0/0.5 = 2.0 → capped to 1.0
    assert.equal(calculateCompletion(1.0, app), 1)
  })

  it('returns 0 for zero progress', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'medium' as const,
      estimatedSprints: 4,
      revenuePotential: 100,
    }
    assert.equal(calculateCompletion(0, app), 0)
  })
})

describe('calculateRevenue', () => {
  const app = {
    id: 't',
    name: 'T',
    description: 'T',
    complexity: 'simple' as const,
    estimatedSprints: 2,
    revenuePotential: 100_000,
  }

  it('returns 0 if completion < 40%', () => {
    assert.equal(calculateRevenue(0.39, 0.5, app), 0)
  })

  it('returns revenue at exactly 40% completion', () => {
    // 0.4 * 100_000 * (0.5 + 0.5) = 40_000
    assert.equal(calculateRevenue(0.4, 0.5, app), 40_000)
  })

  it('returns 0 at completion just below 40%', () => {
    assert.equal(calculateRevenue(0.399, 0.5, app), 0)
  })

  it('scales with completion and quality', () => {
    // completion=1.0, quality=0.5 → multiplier=1.0 → 100_000
    assert.equal(calculateRevenue(1, 0.5, app), 100_000)
  })

  it('quality 0 gives 0.5 multiplier', () => {
    // 1.0 * 100_000 * 0.5 = 50_000
    assert.equal(calculateRevenue(1, 0, app), 50_000)
  })

  it('quality 1 gives 1.5 multiplier', () => {
    // 1.0 * 100_000 * 1.5 = 150_000
    assert.equal(calculateRevenue(1, 1, app), 150_000)
  })

  it('partial completion reduces revenue proportionally', () => {
    // 0.5 * 100_000 * (0.5 + 0.5) = 50_000
    assert.equal(calculateRevenue(0.5, 0.5, app), 50_000)
  })
})

describe('calculateGrade', () => {
  it('returns S for ROI >= 300', () => {
    assert.equal(calculateGrade(300), 'S')
    assert.equal(calculateGrade(500), 'S')
  })
  it('returns A just below S threshold', () => {
    assert.equal(calculateGrade(299), 'A')
  })
  it('returns A for ROI >= 150', () => {
    assert.equal(calculateGrade(150), 'A')
  })
  it('returns B just below A threshold', () => {
    assert.equal(calculateGrade(149), 'B')
  })
  it('returns B for ROI >= 50', () => {
    assert.equal(calculateGrade(50), 'B')
  })
  it('returns C just below B threshold', () => {
    assert.equal(calculateGrade(49), 'C')
  })
  it('returns C for ROI >= 0', () => {
    assert.equal(calculateGrade(0), 'C')
  })
  it('returns D just below C threshold', () => {
    assert.equal(calculateGrade(-1), 'D')
  })
  it('returns D for ROI >= -50', () => {
    assert.equal(calculateGrade(-50), 'D')
  })
  it('returns F just below D threshold', () => {
    assert.equal(calculateGrade(-51), 'F')
  })
  it('returns F for very negative ROI', () => {
    assert.equal(calculateGrade(-100), 'F')
  })
})

describe('calculateResult', () => {
  function makeState(overrides: Partial<GameState> = {}): GameState {
    return {
      phase: 'ended',
      cash: 0,
      chosenApp: {
        id: 'todo',
        name: 'Todo App',
        description: 'Simple',
        complexity: 'simple',
        estimatedSprints: 2,
        revenuePotential: 120_000,
      },
      team: [makeWorker('developer', 'w-0')],
      sprint: { current: 4, total: 4, dayInSprint: 0, daysPerSprint: 5 },
      clock: { day: 1, hour: 9, minute: 0, paused: true, speed: 1 },
      progress: 0.5,
      quality: 0.5,
      result: null,
      seed: 'test',
      ...overrides,
    } as GameState
  }

  it('returns F with no app selected', () => {
    const result = calculateResult(makeState({ chosenApp: null, team: [] }))
    assert.equal(result.grade, 'F')
    assert.equal(result.completion, 0)
    assert.equal(result.quality, 0)
    assert.equal(result.totalCost, 0)
    assert.equal(result.revenue, 0)
    assert.equal(result.roi, -100)
    assert.ok(result.featuresShipped.includes('no app was selected'))
  })

  it('calculates exact values for a complete game', () => {
    const state = makeState({
      team: [makeWorker('developer', 'w-0'), makeWorker('designer', 'w-1')],
      progress: 0.8,
      quality: 0.45,
    })
    const result = calculateResult(state)
    // completion = min(1, 0.8 / (2/4)) = min(1, 1.6) = 1
    assert.equal(result.completion, 1)
    assert.equal(result.quality, 0.45)
    // totalCost = (15000 + 12000) * 4 = 108000
    assert.equal(result.totalCost, 108_000)
    // revenue = round(120000 * 1.0 * (0.5 + 0.45)) = round(114000) = 114000
    assert.equal(result.revenue, 114_000)
    assert.ok(result.featuresShipped.includes('fully complete'))
  })

  it('featuresShipped says "never reached" when completion < 0.4', () => {
    // progress=0.1, estimatedSprints=4 → completion = 0.1/1 = 0.1
    const result = calculateResult(
      makeState({
        chosenApp: {
          id: 't',
          name: 'Test',
          description: 'T',
          complexity: 'medium',
          estimatedSprints: 4,
          revenuePotential: 100_000,
        },
        progress: 0.1,
      }),
    )
    assert.ok(result.completion < 0.4)
    assert.ok(result.featuresShipped.includes('never reached'))
  })

  it('featuresShipped says "bare-bones" when completion 0.4-0.7', () => {
    // progress=0.5, estimatedSprints=4 → completion = 0.5
    const result = calculateResult(
      makeState({
        chosenApp: {
          id: 't',
          name: 'Test',
          description: 'T',
          complexity: 'medium',
          estimatedSprints: 4,
          revenuePotential: 100_000,
        },
        progress: 0.5,
      }),
    )
    assert.ok(result.completion >= 0.4 && result.completion < 0.7)
    assert.ok(result.featuresShipped.includes('bare-bones'))
  })

  it('featuresShipped at exactly 0.4 completion says "bare-bones" not "never reached"', () => {
    // progress=0.4, estimatedSprints=4 → completion = 0.4/1.0 = 0.4
    const result = calculateResult(
      makeState({
        chosenApp: {
          id: 't',
          name: 'Test',
          description: 'T',
          complexity: 'medium',
          estimatedSprints: 4,
          revenuePotential: 100_000,
        },
        progress: 0.4,
      }),
    )
    assert.equal(result.completion, 0.4)
    assert.ok(result.featuresShipped.includes('bare-bones'))
    assert.ok(!result.featuresShipped.includes('never reached'))
  })

  it('featuresShipped at exactly 0.7 completion says "missing some polish"', () => {
    // progress=0.7, estimatedSprints=4 → completion = 0.7
    const result = calculateResult(
      makeState({
        chosenApp: {
          id: 't',
          name: 'Test',
          description: 'T',
          complexity: 'medium',
          estimatedSprints: 4,
          revenuePotential: 100_000,
        },
        progress: 0.7,
      }),
    )
    assert.closeTo(result.completion, 0.7, 0.001)
    assert.ok(result.featuresShipped.includes('missing some polish'))
    assert.ok(!result.featuresShipped.includes('bare-bones'))
  })

  it('featuresShipped says "missing some polish" when completion 0.7-1.0', () => {
    // progress=0.8, estimatedSprints=4 → completion = 0.8
    const result = calculateResult(
      makeState({
        chosenApp: {
          id: 't',
          name: 'Test',
          description: 'T',
          complexity: 'medium',
          estimatedSprints: 4,
          revenuePotential: 100_000,
        },
        progress: 0.8,
      }),
    )
    assert.ok(result.completion >= 0.7 && result.completion < 1)
    assert.ok(result.featuresShipped.includes('missing some polish'))
  })

  it('roi is -100 when team is empty', () => {
    const result = calculateResult(makeState({ team: [], progress: 0.5 }))
    assert.equal(result.roi, -100)
  })

  it('roi is computed from revenue and cost', () => {
    const state = makeState({
      team: [makeWorker('developer', 'w-0')],
      progress: 0.5,
      quality: 0.5,
    })
    const result = calculateResult(state)
    const expectedRoi = ((result.revenue - result.totalCost) / result.totalCost) * 100
    assert.closeTo(result.roi, expectedRoi, 0.01)
  })
})

// Polyfill assert.closeTo for Node test runner
declare module 'node:assert/strict' {
  function closeTo(actual: number, expected: number, delta: number, message?: string): void
}

assert.closeTo = function (actual: number, expected: number, delta: number, message?: string) {
  if (Math.abs(actual - expected) > delta) {
    assert.fail(message ?? `Expected ${actual} to be close to ${expected} (within ${delta})`)
  }
}
