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
})

describe('calculateQuality', () => {
  it('returns 0 with no devs', () => {
    assert.equal(calculateQuality([]), 0)
  })

  it('returns 0.3 base with devs only', () => {
    assert.equal(calculateQuality([makeWorker('developer')]), 0.3)
  })

  it('designers add 0.15 each', () => {
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
})

describe('calculateTotalCost', () => {
  it('returns 0 for empty team', () => {
    assert.equal(calculateTotalCost([]), 0)
  })

  it('multiplies salary by sprint count', () => {
    const team = [makeWorker('developer')]
    assert.equal(calculateTotalCost(team), ROLE_SALARIES.developer * TOTAL_SPRINTS)
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
})

describe('calculateRevenue', () => {
  it('returns 0 if completion < 40%', () => {
    assert.equal(
      calculateRevenue(0.39, 0.5, {
        id: 't',
        name: 'T',
        description: 'T',
        complexity: 'simple',
        estimatedSprints: 2,
        revenuePotential: 100_000,
      }),
      0,
    )
  })

  it('scales with completion and quality', () => {
    const app = {
      id: 't',
      name: 'T',
      description: 'T',
      complexity: 'simple' as const,
      estimatedSprints: 2,
      revenuePotential: 100_000,
    }
    // completion=1.0, quality=0.5 → multiplier=1.0 → 100_000
    assert.equal(calculateRevenue(1, 0.5, app), 100_000)
  })
})

describe('calculateGrade', () => {
  it('returns S for ROI >= 300', () => {
    assert.equal(calculateGrade(300), 'S')
  })
  it('returns A for ROI >= 150', () => {
    assert.equal(calculateGrade(150), 'A')
  })
  it('returns B for ROI >= 50', () => {
    assert.equal(calculateGrade(50), 'B')
  })
  it('returns C for ROI >= 0', () => {
    assert.equal(calculateGrade(0), 'C')
  })
  it('returns D for ROI >= -50', () => {
    assert.equal(calculateGrade(-50), 'D')
  })
  it('returns F for ROI < -50', () => {
    assert.equal(calculateGrade(-51), 'F')
  })
})

describe('calculateResult', () => {
  it('returns F with no app selected', () => {
    const state = {
      phase: 'ended',
      cash: 0,
      chosenApp: null,
      team: [],
      sprint: { current: 4, total: 4, dayInSprint: 0, daysPerSprint: 5 },
      clock: { day: 1, hour: 9, minute: 0, paused: true, speed: 1 },
      progress: 0,
      quality: 0,
      result: null,
      seed: 'test',
    } as GameState
    const result = calculateResult(state)
    assert.equal(result.grade, 'F')
  })

  it('calculates a complete game result', () => {
    const state = {
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
      team: [makeWorker('developer', 'w-0'), makeWorker('designer', 'w-1')],
      sprint: { current: 4, total: 4, dayInSprint: 0, daysPerSprint: 5 },
      clock: { day: 1, hour: 9, minute: 0, paused: true, speed: 1 },
      progress: 0.8,
      quality: 0.45,
      result: null,
      seed: 'test',
    } as GameState
    const result = calculateResult(state)
    assert.ok(result.completion > 0)
    assert.ok(result.revenue > 0)
    assert.ok(result.totalCost > 0)
    assert.ok(['S', 'A', 'B', 'C', 'D', 'F'].includes(result.grade))
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
