import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tickNeeds, needsBreak, productivity } from '../../src/game/character/needs'
import type { DeveloperState } from '../../src/game/types'

function makeDev(overrides: Partial<DeveloperState> = {}): DeveloperState {
  return {
    id: 'dev-0',
    name: 'Alex',
    trait: 'architect',
    morale: 0.8,
    energy: 1.0,
    focus: 0.7,
    currentActivity: 'working',
    assignedStoryId: null,
    position: [0, 0, 0],
    ...overrides,
  }
}

describe('Developer Needs', () => {
  it('energy decays each tick', () => {
    const dev = makeDev()
    const updated = tickNeeds(dev, 0)
    assert.ok(updated.energy < dev.energy)
  })

  it('focus decays each tick when idle', () => {
    const dev = makeDev({ currentActivity: 'idle' })
    const updated = tickNeeds(dev, 0)
    assert.ok(updated.focus < dev.focus)
  })

  it('morale decays each tick', () => {
    const dev = makeDev()
    const updated = tickNeeds(dev, 0)
    assert.ok(updated.morale < dev.morale)
  })

  it('break restores energy', () => {
    const dev = makeDev({ energy: 0.3, currentActivity: 'break' })
    const updated = tickNeeds(dev, 0)
    assert.ok(updated.energy > dev.energy)
  })

  it('break restores morale', () => {
    const dev = makeDev({ morale: 0.3, currentActivity: 'break' })
    const updated = tickNeeds(dev, 0)
    assert.ok(updated.morale > dev.morale)
  })

  it('high tech debt drags down morale', () => {
    const dev = makeDev({ morale: 0.5 })
    const lowDebt = tickNeeds(dev, 0.2)
    const highDebt = tickNeeds(dev, 0.8)
    assert.ok(highDebt.morale < lowDebt.morale)
  })

  it('needs stay clamped between 0 and 1', () => {
    const dev = makeDev({ energy: 0.001, focus: 0.001, morale: 0.001 })
    const updated = tickNeeds(dev, 0.9)
    assert.ok(updated.energy >= 0 && updated.energy <= 1)
    assert.ok(updated.focus >= 0 && updated.focus <= 1)
    assert.ok(updated.morale >= 0 && updated.morale <= 1)
  })
})

describe('needsBreak', () => {
  it('returns true when energy < 0.2', () => {
    assert.equal(needsBreak(makeDev({ energy: 0.1 })), true)
  })

  it('returns false when energy >= 0.2', () => {
    assert.equal(needsBreak(makeDev({ energy: 0.5 })), false)
  })

  it('returns true when energy is exactly 0', () => {
    assert.equal(needsBreak(makeDev({ energy: 0 })), true)
  })
})

describe('productivity', () => {
  it('returns a value between 0 and 1', () => {
    const p = productivity(makeDev())
    assert.ok(p >= 0 && p <= 1)
  })

  it('higher stats = higher productivity', () => {
    const high = productivity(makeDev({ energy: 1, focus: 1, morale: 1 }))
    const low = productivity(makeDev({ energy: 0.2, focus: 0.2, morale: 0.2 }))
    assert.ok(high > low)
  })

  it('returns 0 when all stats are 0', () => {
    assert.equal(productivity(makeDev({ energy: 0, focus: 0, morale: 0 })), 0)
  })

  it('returns 1 when all stats are 1', () => {
    assert.equal(productivity(makeDev({ energy: 1, focus: 1, morale: 1 })), 1)
  })
})
