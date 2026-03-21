import type { DeveloperState, GameClock, Practices } from '../types'
import { needsBreak } from './needs'

export type ScheduleDecision = {
  activity: 'break' | 'meeting' | 'working' | 'pairing' | 'idle'
  targetLocation: string
}

/** Decide what a developer should do this tick based on schedule and needs. */
export function decideActivity(
  dev: DeveloperState,
  clock: GameClock,
  practices: Practices,
  isStandupTime: boolean,
  pairPartnerId: string | null,
): ScheduleDecision {
  // Critical energy → take a break
  if (needsBreak(dev)) {
    return { activity: 'break', targetLocation: 'coffee' }
  }

  // 9am standup
  if (isStandupTime) {
    return { activity: 'meeting', targetLocation: 'meeting' }
  }

  // Outside work hours → idle at own desk
  if (clock.hour < 9 || clock.hour >= 18) {
    return { activity: 'idle', targetLocation: getDeskForDev(dev.id) }
  }

  // Has assigned story → work on it
  if (dev.assignedStoryId) {
    if (practices.pairProgramming && pairPartnerId) {
      return { activity: 'pairing', targetLocation: getDeskForDev(dev.id) }
    }
    return { activity: 'working', targetLocation: getDeskForDev(dev.id) }
  }

  // Nothing to do
  return { activity: 'idle', targetLocation: getDeskForDev(dev.id) }
}

const DESK_ASSIGNMENTS: Record<string, string> = {
  'dev-0': 'desk_0',
  'dev-1': 'desk_1',
  'dev-2': 'desk_2',
}

export function getDeskForDev(devId: string): string {
  return DESK_ASSIGNMENTS[devId] ?? 'desk_0'
}

export function isStandupTime(clock: GameClock): boolean {
  // Wide window so high-speed ticks can't skip it entirely
  return clock.hour === 9 && clock.minute < 30
}
