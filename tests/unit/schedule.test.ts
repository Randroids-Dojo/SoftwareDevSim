import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decideActivity } from '../../src/game/character/schedule'
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

function makeClock(overrides?: Partial<GameClock>): GameClock {
  return {
    day: 1,
    hour: 10,
    minute: 0,
    paused: false,
    speed: 1,
    ...overrides,
  }
}

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
})
