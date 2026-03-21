import type { GameClock } from '../types'

/** 1 real second = 5 game minutes. */
const REAL_SEC_TO_GAME_MIN = 5

export function createClock(): GameClock {
  return {
    day: 1,
    hour: 9,
    minute: 0,
    paused: true,
    speed: 1,
  }
}

/**
 * Advance the clock by the given real-time delta (seconds).
 * Returns the new clock state and number of game minutes elapsed.
 */
export function tickClock(
  clock: GameClock,
  realDeltaSec: number,
): { clock: GameClock; minutesElapsed: number } {
  if (clock.paused) return { clock, minutesElapsed: 0 }

  const gameMinutes = realDeltaSec * REAL_SEC_TO_GAME_MIN * clock.speed
  const totalMinutes = Math.floor(gameMinutes)

  let { day, hour, minute } = clock

  minute += totalMinutes

  while (minute >= 60) {
    minute -= 60
    hour++
  }

  while (hour >= 24) {
    hour -= 24
    day++
  }

  return {
    clock: { ...clock, day, hour, minute },
    minutesElapsed: totalMinutes,
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
