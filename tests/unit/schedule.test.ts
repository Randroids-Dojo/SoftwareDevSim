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
  it('returns true at 9:00 (morning standup)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 9, minute: 0 })), true)
  })

  it('returns true at 10:40 (still morning standup)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 10, minute: 40 })), true)
  })

  it('returns false at 11:00 (standup over)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 11, minute: 0 })), false)
  })

  it('returns false at 12:00 (midday work)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 12, minute: 0 })), false)
  })

  it('returns false at 15:29 (just before standdown)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 15, minute: 29 })), false)
  })

  it('returns true at 15:30 (standdown starts)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 15, minute: 30 })), true)
  })

  it('returns true at 16:00 (standdown)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 16, minute: 0 })), true)
  })

  it('returns true at 17:20 (standdown)', () => {
    assert.equal(isStandupTime(makeClock({ hour: 17, minute: 20 })), true)
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

  it('worker index > 3 gets whiteboard location', () => {
    const decision = decideActivity(makeWorker('developer', { id: 'worker-5' }), makeClock())
    assert.equal(decision.targetLocation, 'whiteboard')
  })

  it('all roles go to standup at 9:00', () => {
    const clock = makeClock({ hour: 9, minute: 5 })
    for (const role of ['developer', 'designer', 'product_owner', 'manager'] as const) {
      const decision = decideActivity(makeWorker(role), clock)
      assert.equal(decision.activity, 'standup', `${role} should be in standup`)
      assert.equal(decision.targetLocation, 'standup_0')
    }
  })

  it('all roles go to standdown at 16:00', () => {
    const clock = makeClock({ hour: 16, minute: 0 })
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
})
