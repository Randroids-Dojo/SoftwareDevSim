import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tickNeeds } from '../../src/game/character/needs'
import type { WorkerState } from '../../src/game/types'

function makeWorker(overrides?: Partial<WorkerState>): WorkerState {
  return {
    id: 'worker-0',
    name: 'Test',
    role: 'developer',
    salary: 15000,
    energy: 0.5,
    currentActivity: 'idle',
    position: [0, 0, 0],
    ...overrides,
  }
}

describe('tickNeeds', () => {
  it('energy decays each tick', () => {
    const worker = makeWorker({ energy: 0.5 })
    const result = tickNeeds(worker)
    assert.ok(result.energy < 0.5)
  })

  it('break restores energy', () => {
    const worker = makeWorker({ energy: 0.5, currentActivity: 'break' })
    const result = tickNeeds(worker)
    // Break restore (0.008) > decay (0.001), so net positive
    assert.ok(result.energy > 0.5)
  })

  it('energy does not go below 0', () => {
    const worker = makeWorker({ energy: 0.0001 })
    const result = tickNeeds(worker)
    assert.ok(result.energy >= 0)
  })

  it('energy does not go above 1', () => {
    const worker = makeWorker({ energy: 0.999, currentActivity: 'break' })
    const result = tickNeeds(worker)
    assert.ok(result.energy <= 1)
  })

  it('returns new object (immutable)', () => {
    const worker = makeWorker()
    const result = tickNeeds(worker)
    assert.notEqual(result, worker)
  })
})
