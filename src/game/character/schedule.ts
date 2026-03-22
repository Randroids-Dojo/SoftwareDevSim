import type { Role, WorkerState, GameClock } from '../types'

export type ScheduleDecision = {
  activity: 'break' | 'meeting' | 'working' | 'idle'
  targetLocation: string
}

/** Assign desk names by worker index. Only 4 desks available. */
function getDeskForWorker(workerId: string): string {
  const idx = parseInt(workerId.split('-')[1] ?? '0', 10)
  if (idx < 4) return `desk_${idx}`
  // Overflow workers stand near whiteboard
  return 'whiteboard'
}

/** Role-based behavior during work hours. */
function workBehavior(worker: WorkerState, clock: GameClock): ScheduleDecision {
  const desk = getDeskForWorker(worker.id)

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
