import type { GameClock } from '../types'

/** At 1× speed the game clock matches real time (1 real minute = 1 game minute). */
const REAL_SEC_TO_GAME_MIN = 1 / 60

export function createClock(): GameClock {
  return {
    day: 1,
    hour: 9,
    minute: 0,
    paused: true,
    speed: 100,
  }
}

/**
 * Create a clock ticker that accumulates fractional game minutes between calls
 * so that slow tick rates (like real-time 1×) don't lose sub-minute deltas.
 */
export function createClockTicker() {
  let partialMinutes = 0

  return function tickClock(
    clock: GameClock,
    realDeltaSec: number,
  ): { clock: GameClock; minutesElapsed: number } {
    if (clock.paused) return { clock, minutesElapsed: 0 }

    partialMinutes += realDeltaSec * REAL_SEC_TO_GAME_MIN * clock.speed
    const totalMinutes = Math.floor(partialMinutes)
    partialMinutes -= totalMinutes

    if (totalMinutes === 0) return { clock, minutesElapsed: 0 }

    let { day, hour, minute } = clock

    minute += totalMinutes

    while (minute >= 60) {
      minute -= 60
      hour++
    }

    // Skip night: jump from 6pm to 9am next day
    if (hour >= 18) {
      hour = 9
      minute = 0
      day++
      partialMinutes = 0
    }

    return {
      clock: { ...clock, day, hour, minute },
      minutesElapsed: totalMinutes,
    }
  }
}

export function isWorkHours(clock: GameClock): boolean {
  return clock.hour >= 9 && clock.hour < 18
}

export function formatTime(clock: GameClock): string {
  const h = clock.hour.toString().padStart(2, '0')
  const m = clock.minute.toString().padStart(2, '0')
  return `Day ${clock.day} ${h}:${m}`
}
