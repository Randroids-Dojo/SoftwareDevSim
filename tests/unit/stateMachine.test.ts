import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transition } from '../../src/game/character/stateMachine'

describe('transition', () => {
  it('allows idle to working', () => {
    assert.equal(transition('idle', 'working'), 'working')
  })

  it('allows idle to moving', () => {
    assert.equal(transition('idle', 'moving'), 'moving')
  })

  it('allows idle to break', () => {
    assert.equal(transition('idle', 'break'), 'break')
  })

  it('allows idle to meeting', () => {
    assert.equal(transition('idle', 'meeting'), 'meeting')
  })

  it('allows idle to standup', () => {
    assert.equal(transition('idle', 'standup'), 'standup')
  })

  it('allows moving to working', () => {
    assert.equal(transition('moving', 'working'), 'working')
  })

  it('allows moving to standup', () => {
    assert.equal(transition('moving', 'standup'), 'standup')
  })

  it('allows working to break', () => {
    assert.equal(transition('working', 'break'), 'break')
  })

  it('allows working to standup', () => {
    assert.equal(transition('working', 'standup'), 'standup')
  })

  it('allows break to idle', () => {
    assert.equal(transition('break', 'idle'), 'idle')
  })

  it('allows meeting to working', () => {
    assert.equal(transition('meeting', 'working'), 'working')
  })

  it('allows meeting to break', () => {
    assert.equal(transition('meeting', 'break'), 'break')
  })

  it('allows meeting to standup', () => {
    assert.equal(transition('meeting', 'standup'), 'standup')
  })

  it('allows break to working', () => {
    assert.equal(transition('break', 'working'), 'working')
  })

  it('allows break to meeting', () => {
    assert.equal(transition('break', 'meeting'), 'meeting')
  })

  it('allows break to standup', () => {
    assert.equal(transition('break', 'standup'), 'standup')
  })

  it('allows standup to idle', () => {
    assert.equal(transition('standup', 'idle'), 'idle')
  })

  it('allows standup to moving', () => {
    assert.equal(transition('standup', 'moving'), 'moving')
  })

  it('allows standup to working', () => {
    assert.equal(transition('standup', 'working'), 'working')
  })

  it('stays in current state when no transition possible', () => {
    // moving -> moving (already in moving, no self-transition)
    assert.equal(transition('moving', 'moving'), 'moving')
  })
})
