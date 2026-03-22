import type { ActivityState, GameClock, NamedLocation, WorkerState } from '../types'
import { type CharacterMesh, createCharacterMesh } from './mesh'
import { type AnimationName, applyAnimation } from './animations'
import { transition } from './stateMachine'
import { moveToward, findLocation, facingAngle } from './pathfinder'
import { tickNeeds } from './needs'
import { decideActivity } from './schedule'

const ACTIVITY_TO_ANIMATION: Record<ActivityState, AnimationName> = {
  idle: 'sit',
  moving: 'walk',
  working: 'type',
  meeting: 'talk',
  break: 'drink',
}

export class Developer {
  state: WorkerState
  mesh: CharacterMesh

  private animTime = 0
  private facing = 0

  constructor(state: WorkerState, colorIndex: number) {
    this.state = state
    this.mesh = createCharacterMesh(colorIndex)
    this.syncMeshPosition()
  }

  /** Run one game-minute tick. */
  tick(clock: GameClock, locations: NamedLocation[]) {
    // Update needs
    this.state = tickNeeds(this.state)

    // Decide what to do based on role
    const decision = decideActivity(this.state, clock)

    const desiredActivity = decision.activity
    const targetLocation = decision.targetLocation

    // Check if we need to move to the target location first
    const targetLoc = findLocation(locations, targetLocation)
    if (!targetLoc) {
      this.state.currentActivity = transition(this.state.currentActivity, desiredActivity)
      return
    }

    const dist = Math.hypot(
      targetLoc.position[0] - this.state.position[0],
      targetLoc.position[2] - this.state.position[2],
    )

    if (dist > 0.5) {
      this.state.currentActivity = transition(this.state.currentActivity, 'moving')
      this.facing = facingAngle(this.state.position, targetLoc.position)
      const result = moveToward(this.state.position, targetLoc.position)
      this.state.position = result.position

      if (result.arrived) {
        this.state.currentActivity = transition('moving', desiredActivity)
        if (targetLoc.seatDirection) {
          this.facing = Math.atan2(targetLoc.seatDirection[0], targetLoc.seatDirection[2])
        }
      }
    } else {
      this.state.currentActivity = transition(this.state.currentActivity, desiredActivity)
      if (targetLoc.seatDirection) {
        this.facing = Math.atan2(targetLoc.seatDirection[0], targetLoc.seatDirection[2])
      }
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
    this.mesh.root.rotation.y = this.facing + Math.PI
  }
}
