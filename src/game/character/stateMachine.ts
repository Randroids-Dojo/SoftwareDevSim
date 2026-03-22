import type { ActivityState } from '../types'

interface FSMTransition {
  from: ActivityState
  to: ActivityState
}

const VALID_TRANSITIONS: FSMTransition[] = [
  { from: 'idle', to: 'moving' },
  { from: 'idle', to: 'working' },
  { from: 'idle', to: 'break' },
  { from: 'idle', to: 'meeting' },
  { from: 'moving', to: 'idle' },
  { from: 'moving', to: 'working' },
  { from: 'moving', to: 'break' },
  { from: 'moving', to: 'meeting' },
  { from: 'working', to: 'idle' },
  { from: 'working', to: 'moving' },
  { from: 'working', to: 'break' },
  { from: 'working', to: 'meeting' },
  { from: 'meeting', to: 'idle' },
  { from: 'meeting', to: 'moving' },
  { from: 'break', to: 'idle' },
  { from: 'break', to: 'moving' },
]

function canTransition(from: ActivityState, to: ActivityState): boolean {
  return VALID_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function transition(current: ActivityState, desired: ActivityState): ActivityState {
  if (canTransition(current, desired)) return desired
  // If direct transition isn't valid, go through moving
  if (current !== 'moving' && canTransition(current, 'moving')) return 'moving'
  return current
}
