import type { WorkerState } from '../types'

/** Per-tick decay rates (called once per game minute). */
const ENERGY_DECAY = 0.001

/** Restore rates per game minute. */
const BREAK_ENERGY_RESTORE = 0.008

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function tickNeeds(worker: WorkerState): WorkerState {
  let { energy } = worker

  // Base decay
  energy = clamp01(energy - ENERGY_DECAY)

  // Activity-specific effects
  switch (worker.currentActivity) {
    case 'break':
      energy = clamp01(energy + BREAK_ENERGY_RESTORE)
      break
  }

  return { ...worker, energy }
}
