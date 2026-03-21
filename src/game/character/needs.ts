import type { DeveloperState } from '../types'

/** Per-tick decay rates (called once per game minute). */
const ENERGY_DECAY = 0.001
const FOCUS_DECAY = 0.0005
const MORALE_DECAY = 0.0002

/** Restore rates per game minute. */
const BREAK_ENERGY_RESTORE = 0.008
const BREAK_MORALE_RESTORE = 0.003
const WORK_FOCUS_BOOST = 0.001
const PAIRING_MORALE_BOOST = 0.002

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function tickNeeds(dev: DeveloperState, techDebt: number): DeveloperState {
  let { morale, energy, focus } = dev

  // Base decay
  energy = clamp01(energy - ENERGY_DECAY)
  focus = clamp01(focus - FOCUS_DECAY)
  morale = clamp01(morale - MORALE_DECAY)

  // Tech debt drags down morale
  if (techDebt > 0.5) {
    morale = clamp01(morale - (techDebt - 0.5) * 0.001)
  }

  // Activity-specific effects
  switch (dev.currentActivity) {
    case 'break':
      energy = clamp01(energy + BREAK_ENERGY_RESTORE)
      morale = clamp01(morale + BREAK_MORALE_RESTORE)
      break
    case 'working':
      focus = clamp01(focus + WORK_FOCUS_BOOST)
      break
    case 'pairing':
      morale = clamp01(morale + PAIRING_MORALE_BOOST)
      focus = clamp01(focus + WORK_FOCUS_BOOST)
      break
    case 'meeting':
      // Meetings restore some focus but drain energy slightly faster
      focus = clamp01(focus + 0.002)
      energy = clamp01(energy - 0.001)
      break
  }

  return { ...dev, morale, energy, focus }
}

export function needsBreak(dev: DeveloperState): boolean {
  return dev.energy < 0.2
}

export function productivity(dev: DeveloperState): number {
  // Weighted sum: energy 40%, focus 35%, morale 25%
  return clamp01(dev.energy * 0.4 + dev.focus * 0.35 + dev.morale * 0.25)
}
