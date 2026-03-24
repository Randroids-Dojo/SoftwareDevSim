import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decideActivity, isStandupTime } from '../../src/game/character/schedule'
import type { WorkerState, GameClock } from '../../src/game/types'

function makeWorker(role: WorkerState['role'], overrides?: Partial<WorkerState>): WorkerState {
  return {
    id: 'worker-0',
    name: 'Test',
    role,
    salary: 15000,
    energy: 1,
    currentActivity: 'idle',
    position: [0, 0, 0],
    ...overrides,
  }
}

/** Default clock at 12:00 — middle of workday, outside standup windows. */
function makeClock(overrides?: Partial<GameClock>): GameClock {
  return {
    day: 1,
    hour: 12,
    minute: 0,
    paused: false,
    speed: 1,
    ...overrides,
  }
}

describe('isStandupTime', () => {
  // Fixed 15-min windows: standup 9:00-9:15, standdown 17:45-18:00

  it('returns true at 9:00 (morning standup starts)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 0 })), true)
  })

  it('returns true at 9:14 (still morning standup)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 14 })), true)
  })

  it('returns false at 9:15 (standup over)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 15 })), false)
  })

  it('returns false at 12:00 (midday work)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 12, minute: 0 })), false)
  })

  it('returns false at 16:59 (just before standdown)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 16, minute: 59 })), false)
  })

  it('returns true at 17:00 (standdown starts)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 17, minute: 0 })), true)
  })

  it('returns true at 17:14 (standdown in progress)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 17, minute: 14 })), true)
  })

  it('returns false at 17:15 (standdown trigger window over)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 17, minute: 15 })), false)
  })

  it('window is fixed regardless of speed', () => {
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 14, speed: 500 })), true)
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 15, speed: 500 })), false)
    assert.equal(isStandupTime(makeClock({ hour: 10, minute: 0, speed: 500 })), false)
  })
})

describe('decideActivity', () => {
  it('developer works at desk during work hours', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock())
    assert.equal(decision.activity, 'working')
    assert.equal(decision.targetLocation, 'desk_0')
  })

  it('designer works at desk during work hours', () => {
    const decision = decideActivity(makeWorker('designer'), makeClock())
    assert.equal(decision.activity, 'working')
    assert.equal(decision.targetLocation, 'desk_0')
  })

  it('product_owner goes to whiteboard first half of hour', () => {
    const decision = decideActivity(makeWorker('product_owner'), makeClock({ minute: 15 }))
    assert.equal(decision.activity, 'meeting')
    assert.equal(decision.targetLocation, 'whiteboard')
  })

  it('product_owner works at desk second half of hour', () => {
    const decision = decideActivity(makeWorker('product_owner'), makeClock({ minute: 35 }))
    assert.equal(decision.activity, 'working')
    assert.equal(decision.targetLocation, 'desk_0')
  })

  it('manager goes to meetings most of the time', () => {
    const decision = decideActivity(makeWorker('manager'), makeClock({ minute: 20 }))
    assert.equal(decision.activity, 'meeting')
    assert.equal(decision.targetLocation, 'meeting')
  })

  it('manager takes break at end of hour', () => {
    const decision = decideActivity(makeWorker('manager'), makeClock({ minute: 50 }))
    assert.equal(decision.activity, 'break')
    assert.equal(decision.targetLocation, 'coffee')
  })

  it('low energy worker takes break regardless of role', () => {
    const decision = decideActivity(makeWorker('developer', { energy: 0.1 }), makeClock())
    assert.equal(decision.activity, 'break')
    assert.equal(decision.targetLocation, 'coffee')
  })

  it('outside work hours worker is idle', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock({ hour: 20 }))
    assert.equal(decision.activity, 'idle')
  })

  it('before work hours worker is idle', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock({ hour: 7 }))
    assert.equal(decision.activity, 'idle')
  })

  it('worker index > 3 gets unique overflow location', () => {
    const d5 = decideActivity(makeWorker('developer', { id: 'worker-5' }), makeClock())
    const d6 = decideActivity(makeWorker('developer', { id: 'worker-6' }), makeClock())
    assert.equal(d5.targetLocation, 'overflow_1')
    assert.equal(d6.targetLocation, 'overflow_2')
    assert.notEqual(d5.targetLocation, d6.targetLocation)
  })

  it('all roles go to standup at 9:00', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    for (const role of ['developer', 'designer', 'product_owner', 'manager'] as const) {
      const decision = decideActivity(makeWorker(role), clock)
      assert.equal(decision.activity, 'standup', `${role} should be in standup`)
      assert.equal(decision.targetLocation, 'standup_0')
    }
  })

  it('all roles go to standdown at 17:05', () => {
    const clock = makeClock({ hour: 17, minute: 5 })
    for (const role of ['developer', 'designer', 'product_owner', 'manager'] as const) {
      const decision = decideActivity(makeWorker(role), clock)
      assert.equal(decision.activity, 'standup', `${role} should be in standdown`)
      assert.equal(decision.targetLocation, 'standup_0')
    }
  })

  it('assigns different standup slots per worker index', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    const d0 = decideActivity(makeWorker('developer', { id: 'worker-0' }), clock)
    const d1 = decideActivity(makeWorker('developer', { id: 'worker-1' }), clock)
    const d2 = decideActivity(makeWorker('developer', { id: 'worker-2' }), clock)
    assert.equal(d0.targetLocation, 'standup_0')
    assert.equal(d1.targetLocation, 'standup_1')
    assert.equal(d2.targetLocation, 'standup_2')
  })

  it('very low energy worker skips standup for break', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    const decision = decideActivity(makeWorker('developer', { energy: 0.03 }), clock)
    assert.equal(decision.activity, 'break')
    assert.equal(decision.targetLocation, 'coffee')
  })

  it('energy exactly at 0.2 does not trigger break', () => {
    const decision = decideActivity(makeWorker('developer', { energy: 0.2 }), makeClock())
    assert.equal(decision.activity, 'working')
  })

  it('energy just below 0.2 triggers break', () => {
    const decision = decideActivity(makeWorker('developer', { energy: 0.19 }), makeClock())
    assert.equal(decision.activity, 'break')
  })

  it('energy exactly at 0.05 allows standup', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    const decision = decideActivity(makeWorker('developer', { energy: 0.05 }), clock)
    assert.equal(decision.activity, 'standup')
  })

  it('energy just below 0.05 skips standup for break', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    const decision = decideActivity(makeWorker('developer', { energy: 0.04 }), clock)
    assert.equal(decision.activity, 'break')
  })

  it('PO at minute 29 goes to whiteboard', () => {
    const decision = decideActivity(makeWorker('product_owner'), makeClock({ minute: 29 }))
    assert.equal(decision.activity, 'meeting')
    assert.equal(decision.targetLocation, 'whiteboard')
  })

  it('PO at minute 30 works at desk', () => {
    const decision = decideActivity(makeWorker('product_owner'), makeClock({ minute: 30 }))
    assert.equal(decision.activity, 'working')
  })

  it('manager at minute 44 is in meeting', () => {
    const decision = decideActivity(makeWorker('manager'), makeClock({ minute: 44 }))
    assert.equal(decision.activity, 'meeting')
  })

  it('manager at minute 45 takes break', () => {
    const decision = decideActivity(makeWorker('manager'), makeClock({ minute: 45 }))
    assert.equal(decision.activity, 'break')
  })

  it('worker at hour 9 is working (not idle)', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock({ hour: 9, minute: 30 }))
    assert.equal(decision.activity, 'working')
  })

  it('worker at hour 17 (non-standup) is working', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock({ hour: 17, minute: 30 }))
    assert.equal(decision.activity, 'working')
  })

  it('worker at hour 18 is idle', () => {
    const decision = decideActivity(makeWorker('developer'), makeClock({ hour: 18, minute: 0 }))
    assert.equal(decision.activity, 'idle')
  })

  it('desk assignment uses worker id index', () => {
    const d0 = decideActivity(makeWorker('developer', { id: 'worker-0' }), makeClock())
    const d1 = decideActivity(makeWorker('developer', { id: 'worker-1' }), makeClock())
    const d2 = decideActivity(makeWorker('developer', { id: 'worker-2' }), makeClock())
    const d3 = decideActivity(makeWorker('developer', { id: 'worker-3' }), makeClock())
    assert.equal(d0.targetLocation, 'desk_0')
    assert.equal(d1.targetLocation, 'desk_1')
    assert.equal(d2.targetLocation, 'desk_2')
    assert.equal(d3.targetLocation, 'desk_3')
  })

  it('worker index 4 gets overflow_0', () => {
    const d = decideActivity(makeWorker('developer', { id: 'worker-4' }), makeClock())
    assert.equal(d.targetLocation, 'overflow_0')
  })
})
