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

  it('returns current state when already in desired state', () => {
    assert.equal(transition('idle', 'idle'), 'idle')
    assert.equal(transition('working', 'working'), 'working')
    assert.equal(transition('moving', 'moving'), 'moving')
    assert.equal(transition('break', 'break'), 'break')
    assert.equal(transition('meeting', 'meeting'), 'meeting')
    assert.equal(transition('standup', 'standup'), 'standup')
  })

  it('all valid transitions from idle are accepted', () => {
    assert.equal(transition('idle', 'moving'), 'moving')
    assert.equal(transition('idle', 'working'), 'working')
    assert.equal(transition('idle', 'break'), 'break')
    assert.equal(transition('idle', 'meeting'), 'meeting')
    assert.equal(transition('idle', 'standup'), 'standup')
  })

  it('all valid transitions from moving are accepted', () => {
    assert.equal(transition('moving', 'idle'), 'idle')
    assert.equal(transition('moving', 'working'), 'working')
    assert.equal(transition('moving', 'break'), 'break')
    assert.equal(transition('moving', 'meeting'), 'meeting')
    assert.equal(transition('moving', 'standup'), 'standup')
  })

  it('all valid transitions from working are accepted', () => {
    assert.equal(transition('working', 'idle'), 'idle')
    assert.equal(transition('working', 'moving'), 'moving')
    assert.equal(transition('working', 'break'), 'break')
    assert.equal(transition('working', 'meeting'), 'meeting')
    assert.equal(transition('working', 'standup'), 'standup')
  })

  it('all valid transitions from meeting are accepted', () => {
    assert.equal(transition('meeting', 'idle'), 'idle')
    assert.equal(transition('meeting', 'moving'), 'moving')
    assert.equal(transition('meeting', 'working'), 'working')
    assert.equal(transition('meeting', 'break'), 'break')
    assert.equal(transition('meeting', 'standup'), 'standup')
  })

  it('all valid transitions from break are accepted', () => {
    assert.equal(transition('break', 'idle'), 'idle')
    assert.equal(transition('break', 'moving'), 'moving')
    assert.equal(transition('break', 'working'), 'working')
    assert.equal(transition('break', 'meeting'), 'meeting')
    assert.equal(transition('break', 'standup'), 'standup')
  })

  it('all valid transitions from standup are accepted', () => {
    assert.equal(transition('standup', 'idle'), 'idle')
    assert.equal(transition('standup', 'moving'), 'moving')
    assert.equal(transition('standup', 'working'), 'working')
    assert.equal(transition('standup', 'meeting'), 'meeting')
    assert.equal(transition('standup', 'break'), 'break')
  })
})
