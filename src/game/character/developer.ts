import type { ActivityState, DeveloperState, GameClock, NamedLocation, Practices } from '../types'
import { type CharacterMesh, createCharacterMesh } from './mesh'
import { type AnimationName, applyAnimation } from './animations'
import { transition } from './stateMachine'
import { moveToward, findLocation } from './pathfinder'
import { tickNeeds } from './needs'
import { decideActivity, isStandupTime } from './schedule'

const ACTIVITY_TO_ANIMATION: Record<ActivityState, AnimationName> = {
  idle: 'sit',
  moving: 'walk',
  working: 'type',
  pairing: 'type',
  meeting: 'talk',
  break: 'drink',
}

export class Developer {
  state: DeveloperState
  mesh: CharacterMesh

  private targetLocation: string | null = null
  private animTime = 0

  constructor(state: DeveloperState, colorIndex: number) {
    this.state = state
    this.mesh = createCharacterMesh(colorIndex)
    this.syncMeshPosition()
  }

  /** Run one game-minute tick. */
  tick(
    clock: GameClock,
    practices: Practices,
    techDebt: number,
    locations: NamedLocation[],
    pairPartnerId: string | null,
  ) {
    // Update needs
    this.state = tickNeeds(this.state, techDebt)

    // Decide what to do
    const decision = decideActivity(
      this.state,
      clock,
      practices,
      isStandupTime(clock),
      pairPartnerId,
    )

    const desiredActivity = decision.activity
    this.targetLocation = decision.targetLocation

    // Check if we need to move to the target location first
    const targetLoc = findLocation(locations, this.targetLocation)
    if (!targetLoc) {
      // Unknown location — just transition in place
      this.state.currentActivity = transition(this.state.currentActivity, desiredActivity)
      return
    }

    const dist = Math.hypot(
      targetLoc.position[0] - this.state.position[0],
      targetLoc.position[2] - this.state.position[2],
    )

    if (dist > 0.5) {
      this.state.currentActivity = transition(this.state.currentActivity, 'moving')
      const result = moveToward(this.state.position, targetLoc.position)
      this.state.position = result.position

      if (result.arrived) {
        this.state.currentActivity = transition('moving', desiredActivity)
      }
    } else {
      this.state.currentActivity = transition(this.state.currentActivity, desiredActivity)
    }
  }

  /** Update visual representation. Called every render frame. */
  animate(dt: number) {
    this.animTime += dt
    const animation = ACTIVITY_TO_ANIMATION[this.state.currentActivity]
    applyAnimation(this.mesh, animation, this.animTime)
    this.syncMeshPosition()
  }

  private syncMeshPosition() {
    this.mesh.root.position.set(
      this.state.position[0],
      this.state.position[1],
      this.state.position[2],
    )
  }
}

export function createInitialDevelopers(): DeveloperState[] {
  return [
    {
      id: 'dev-0',
      name: 'Alex',
      trait: 'architect',
      morale: 0.8,
      energy: 1.0,
      focus: 0.7,
      currentActivity: 'idle',
      assignedStoryId: null,
      position: [3.5, 0, 1],
    },
    {
      id: 'dev-1',
      name: 'Jordan',
      trait: 'craftsman',
      morale: 0.9,
      energy: 0.9,
      focus: 0.8,
      currentActivity: 'idle',
      assignedStoryId: null,
      position: [7.5, 0, 1],
    },
    {
      id: 'dev-2',
      name: 'Sam',
      trait: 'hustler',
      morale: 0.7,
      energy: 1.0,
      focus: 0.6,
      currentActivity: 'idle',
      assignedStoryId: null,
      position: [15.5, 0, 1],
    },
  ]
}
