import type { ActivityState, GameClock, NamedLocation, Vec3, WorkerState } from '../types'
import { type CharacterMesh, createCharacterMesh } from './mesh'
import { type AnimationName, applyAnimation } from './animations'
import { transition } from './stateMachine'
import { moveToward, findLocation, facingAngle } from './pathfinder'
import { tickNeeds } from './needs'
import { decideActivity } from './schedule'
import { type ChatBubble, createChatBubble, STANDUP_LINES, STANDDOWN_LINES } from './chatBubble'

const ACTIVITY_TO_ANIMATION: Record<ActivityState, AnimationName> = {
  idle: 'sit',
  moving: 'walk',
  working: 'type',
  meeting: 'talk',
  break: 'drink',
  standup: 'talk',
}

/** Base movement speed in units per second. Speed scaling is capped so
 *  characters cross the room in 1-2 seconds at any game speed. */
const FRAME_MOVE_SPEED = 8

/** Seconds between chat bubble text changes during standup. */
const BUBBLE_CHANGE_INTERVAL = 3

export class Developer {
  state: WorkerState
  mesh: CharacterMesh
  chatBubble: ChatBubble | null = null

  private animTime = 0
  private facing = 0
  private bubbleTimer = 0
  private lastBubbleIndex = -1

  // Target tracking — set by tick(), consumed by animate()
  private targetPosition: Vec3 | null = null
  private targetSeatDirection: Vec3 | null = null
  private desiredActivity: ActivityState = 'idle'
  private clockSpeed = 1

  constructor(state: WorkerState, colorIndex: number) {
    this.state = state
    this.mesh = createCharacterMesh(colorIndex)
    this.syncMeshPosition()
  }

  /** Lazily create the chat bubble (requires DOM, so defer until first use). */
  private ensureChatBubble(): ChatBubble {
    if (!this.chatBubble) {
      this.chatBubble = createChatBubble()
      this.mesh.root.add(this.chatBubble.sprite)
    }
    return this.chatBubble
  }

  /** Run one game-minute tick — AI decisions only, no movement. */
  tick(clock: GameClock, locations: NamedLocation[]) {
    this.state = tickNeeds(this.state)
    this.clockSpeed = clock.speed

    const decision = decideActivity(this.state, clock)
    this.desiredActivity = decision.activity

    const targetLoc = findLocation(locations, decision.targetLocation)
    if (targetLoc) {
      this.targetPosition = targetLoc.position
      this.targetSeatDirection = targetLoc.seatDirection ?? null
    } else {
      this.targetPosition = null
      this.targetSeatDirection = null
      this.state.currentActivity = transition(this.state.currentActivity, decision.activity)
    }
  }

  /** Update visuals and movement. Called every render frame (60fps). */
  animate(dt: number) {
    this.animTime += dt

    // Move toward target at frame rate (smooth, speed-scaled)
    if (this.targetPosition) {
      const dist = Math.hypot(
        this.targetPosition[0] - this.state.position[0],
        this.targetPosition[2] - this.state.position[2],
      )

      if (dist > 0.5) {
        this.state.currentActivity = transition(this.state.currentActivity, 'moving')
        this.facing = facingAngle(this.state.position, this.targetPosition)
        const speed = FRAME_MOVE_SPEED * dt * Math.min(Math.max(1, this.clockSpeed), 5)
        const result = moveToward(this.state.position, this.targetPosition, speed)
        this.state.position = result.position

        if (result.arrived) {
          this.arriveAtTarget()
        }
      } else {
        this.arriveAtTarget()
      }
    }

    const animation = ACTIVITY_TO_ANIMATION[this.state.currentActivity]
    applyAnimation(this.mesh, animation, this.animTime)
    this.syncMeshPosition()
  }

  /** Show or hide the chat bubble based on current activity. */
  updateChatBubble(dt: number, clock: GameClock) {
    const inStandup = this.state.currentActivity === 'standup'

    if (!inStandup) {
      if (this.chatBubble?.visible) {
        this.chatBubble.hide()
      }
      this.bubbleTimer = 0
      this.lastBubbleIndex = -1
      return
    }

    const bubble = this.ensureChatBubble()
    this.bubbleTimer += dt

    if (this.bubbleTimer >= BUBBLE_CHANGE_INTERVAL || this.lastBubbleIndex === -1) {
      this.bubbleTimer = 0
      // Pick whether we're in standup or standdown based on the hour
      const lines = clock.hour < 12 ? STANDUP_LINES : STANDDOWN_LINES
      // Pick a new random line different from the last
      let idx = Math.floor(Math.random() * lines.length)
      if (idx === this.lastBubbleIndex && lines.length > 1) {
        idx = (idx + 1) % lines.length
      }
      this.lastBubbleIndex = idx
      bubble.show(lines[idx])
    }
  }

  /** Snap to target, apply facing, clear movement state so we stop re-evaluating. */
  private arriveAtTarget() {
    if (this.targetPosition) {
      this.state.position = [this.targetPosition[0], this.targetPosition[1], this.targetPosition[2]]
    }
    this.state.currentActivity = transition(this.state.currentActivity, this.desiredActivity)
    if (this.targetSeatDirection) {
      this.facing = Math.atan2(this.targetSeatDirection[0], this.targetSeatDirection[2])
    }
    this.targetPosition = null
    this.targetSeatDirection = null
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
