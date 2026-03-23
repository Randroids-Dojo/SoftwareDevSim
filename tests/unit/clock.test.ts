import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createClock, createClockTicker, isWorkHours, formatTime } from '../../src/game/simulation/clock'

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

describe('createClockTicker', () => {
  it('does not advance when paused', () => {
    const tickClock = createClockTicker()
    const clock = createClock()
    const result = tickClock(clock, 1)
    assert.equal(result.minutesElapsed, 0)
    assert.deepEqual(result.clock, clock)
  })

  it('advances by 1 game minute per 60 real seconds at speed 1', () => {
    const tickClock = createClockTicker()
    const clock = { ...createClock(), paused: false }
    // Simulate 60 one-second ticks to accumulate 1 game minute
    let current = clock
    let totalMinutes = 0
    for (let i = 0; i < 60; i++) {
      const result = tickClock(current, 1)
      current = result.clock
      totalMinutes += result.minutesElapsed
    }
    assert.equal(totalMinutes, 1)
    assert.equal(current.minute, 1)
  })

  it('rolls over hours correctly', () => {
    const tickClock = createClockTicker()
    const clock = { ...createClock(), paused: false, minute: 59 }
    // 60 real seconds = 1 game minute at 1x, pushing 59 → 60 → rollover
    let current = clock
    for (let i = 0; i < 60; i++) {
      const result = tickClock(current, 1)
      current = result.clock
    }
    assert.equal(current.hour, 10)
    assert.equal(current.minute, 0)
  })

  it('rolls over days correctly', () => {
    const tickClock = createClockTicker()
    const clock = { ...createClock(), paused: false, hour: 23, minute: 59 }
    let current = clock
    for (let i = 0; i < 60; i++) {
      const result = tickClock(current, 1)
      current = result.clock
    }
    assert.equal(current.day, 2)
    assert.equal(current.hour, 0)
    assert.equal(current.minute, 0)
  })

  it('respects speed multiplier', () => {
    const tickClock = createClockTicker()
    const clock = { ...createClock(), paused: false, speed: 60 }
    // At 60x: 1 real second = 1 game minute
    const result = tickClock(clock, 1)
    assert.equal(result.minutesElapsed, 1)
  })

  it('accumulates fractional minutes across ticks', () => {
    const tickClock = createClockTicker()
    const clock = { ...createClock(), paused: false }
    // At 1x, each tick adds 1/60 of a minute. After 30 ticks we have 0.5 minutes (no advance yet)
    let current = clock
    let totalMinutes = 0
    for (let i = 0; i < 30; i++) {
      const result = tickClock(current, 1)
      current = result.clock
      totalMinutes += result.minutesElapsed
    }
    assert.equal(totalMinutes, 0)
    // After 30 more ticks we cross 1 minute
    for (let i = 0; i < 30; i++) {
      const result = tickClock(current, 1)
      current = result.clock
      totalMinutes += result.minutesElapsed
    }
    assert.equal(totalMinutes, 1)
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
