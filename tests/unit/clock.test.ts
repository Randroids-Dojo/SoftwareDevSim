import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createClock, tickClock, isWorkHours, formatTime } from '../../src/game/simulation/clock'

describe('createClock', () => {
  it('starts at day 1, 9:00, paused', () => {
    const clock = createClock()
    assert.equal(clock.day, 1)
    assert.equal(clock.hour, 9)
    assert.equal(clock.minute, 0)
    assert.equal(clock.paused, true)
    assert.equal(clock.speed, 1)
  })
})

describe('tickClock', () => {
  it('does not advance when paused', () => {
    const clock = createClock()
    const result = tickClock(clock, 1)
    assert.equal(result.minutesElapsed, 0)
    assert.deepEqual(result.clock, clock)
  })

  it('advances by 5 game minutes per real second at speed 1', () => {
    const clock = { ...createClock(), paused: false }
    const result = tickClock(clock, 1)
    assert.equal(result.minutesElapsed, 5)
    assert.equal(result.clock.minute, 5)
  })

  it('rolls over hours correctly', () => {
    const clock = { ...createClock(), paused: false, minute: 58 }
    const result = tickClock(clock, 1)
    assert.equal(result.clock.hour, 10)
    assert.equal(result.clock.minute, 3)
  })

  it('rolls over days correctly', () => {
    const clock = { ...createClock(), paused: false, hour: 23, minute: 58 }
    const result = tickClock(clock, 1)
    assert.equal(result.clock.day, 2)
    assert.equal(result.clock.hour, 0)
  })

  it('respects speed multiplier', () => {
    const clock = { ...createClock(), paused: false, speed: 10 }
    const result = tickClock(clock, 1)
    assert.equal(result.minutesElapsed, 50)
  })
})

describe('isWorkHours', () => {
  it('returns true during work hours (9-17)', () => {
    assert.equal(isWorkHours({ ...createClock(), hour: 9 }), true)
    assert.equal(isWorkHours({ ...createClock(), hour: 17 }), true)
  })

  it('returns false outside work hours', () => {
    assert.equal(isWorkHours({ ...createClock(), hour: 8 }), false)
    assert.equal(isWorkHours({ ...createClock(), hour: 18 }), false)
  })
})

describe('formatTime', () => {
  it('formats time correctly', () => {
    assert.equal(formatTime(createClock()), 'Day 1 09:00')
  })

  it('pads single digits', () => {
    assert.equal(formatTime({ ...createClock(), hour: 8, minute: 5 }), 'Day 1 08:05')
  })
})
