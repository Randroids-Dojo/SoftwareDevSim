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

  it('allows moving to working', () => {
    assert.equal(transition('moving', 'working'), 'working')
  })

  it('allows working to break', () => {
    assert.equal(transition('working', 'break'), 'break')
  })

  it('allows break to idle', () => {
    assert.equal(transition('break', 'idle'), 'idle')
  })

  it('goes through moving for invalid direct transition', () => {
    // break -> working is not direct, so goes through moving first
    assert.equal(transition('break', 'working'), 'moving')
  })

  it('stays in current state when no transition possible', () => {
    // moving -> moving (already in moving, no self-transition)
    assert.equal(transition('moving', 'moving'), 'moving')
  })
})
