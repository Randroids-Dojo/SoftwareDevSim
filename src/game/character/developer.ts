import type { ActivityState, GameClock, NamedLocation, WorkerState } from '../types'
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

  private syncMeshPosition() {
    this.mesh.root.position.set(
      this.state.position[0],
      this.state.position[1],
      this.state.position[2],
    )
    this.mesh.root.rotation.y = this.facing + Math.PI
  }
}
