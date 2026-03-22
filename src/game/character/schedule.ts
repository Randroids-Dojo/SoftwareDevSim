import type { Role, WorkerState, GameClock } from '../types'

export type ScheduleDecision = {
  activity: 'break' | 'meeting' | 'working' | 'idle' | 'standup'
  targetLocation: string
}

/** Standup: 9:00–9:10. Standdown: 17:50–18:00. */
const STANDUP_START = 9
const STANDUP_END_MINUTE = 10
const STANDDOWN_HOUR = 17
const STANDDOWN_START_MINUTE = 50

/** True when the team should be in standup or standdown. */
export function isStandupTime(clock: GameClock): boolean {
  if (clock.hour === STANDUP_START && clock.minute < STANDUP_END_MINUTE) return true
  if (clock.hour === STANDDOWN_HOUR && clock.minute >= STANDDOWN_START_MINUTE) return true
  return false
}

/** Assign desk names by worker index. Only 4 desks available. */
function getDeskForWorker(workerId: string): string {
  const idx = parseInt(workerId.split('-')[1] ?? '0', 10)
  if (idx < 4) return `desk_${idx}`
  // Overflow workers stand near whiteboard
  return 'whiteboard'
}

/** Get the standup circle slot for a worker. */
function getStandupSlot(workerId: string): string {
  const idx = parseInt(workerId.split('-')[1] ?? '0', 10)
  return `standup_${idx % 6}`
}

/** Role-based behavior during work hours. */
function workBehavior(worker: WorkerState, clock: GameClock): ScheduleDecision {
  const desk = getDeskForWorker(worker.id)

  // Standup / standdown takes priority over everything except dangerously low energy
  if (isStandupTime(clock) && worker.energy >= 0.05) {
    return { activity: 'standup', targetLocation: getStandupSlot(worker.id) }
  }

  // Low energy → coffee break
  if (worker.energy < 0.2) {
    return { activity: 'break', targetLocation: 'coffee' }
  }

  // Outside work hours → idle at desk
  if (clock.hour < 9 || clock.hour >= 18) {
    return { activity: 'idle', targetLocation: desk }
  }

  const role: Role = worker.role

  switch (role) {
    case 'developer':
    case 'designer':
      return { activity: 'working', targetLocation: desk }

    case 'product_owner':
      // POs alternate between whiteboard and checking on devs
      if (clock.minute < 30) {
        return { activity: 'meeting', targetLocation: 'whiteboard' }
      }
      return { activity: 'working', targetLocation: desk }

    case 'manager':
      // Managers spend most of their time in meetings
      if (clock.minute < 45) {
        return { activity: 'meeting', targetLocation: 'meeting' }
      }
      return { activity: 'break', targetLocation: 'coffee' }
  }
}

/** Decide what a worker should do this tick. */
export function decideActivity(worker: WorkerState, clock: GameClock): ScheduleDecision {
  return workBehavior(worker, clock)
}
