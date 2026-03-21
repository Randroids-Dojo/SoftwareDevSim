import type * as THREE from 'three'
import type { z } from 'zod'
import type {
  ActivityStateSchema,
  CIStatusSchema,
  CodebaseSchema,
  DeveloperStateSchema,
  DeveloperTraitSchema,
  FeedbackEventSchema,
  GameClockSchema,
  GameStateSchema,
  PracticeKeySchema,
  PracticesSchema,
  SprintPhaseSchema,
  SprintSchema,
  StoryStatusSchema,
  UserStorySchema,
  Vec3Schema,
} from '../lib/schemas'

// --- Types derived from Zod schemas (single source of truth) ---

export type Vec3 = z.infer<typeof Vec3Schema>
export type DeveloperTrait = z.infer<typeof DeveloperTraitSchema>
export type ActivityState = z.infer<typeof ActivityStateSchema>
export type StoryStatus = z.infer<typeof StoryStatusSchema>
export type SprintPhase = z.infer<typeof SprintPhaseSchema>
export type CIStatus = z.infer<typeof CIStatusSchema>
export type PracticeKey = z.infer<typeof PracticeKeySchema>
export type DeveloperState = z.infer<typeof DeveloperStateSchema>
export type UserStory = z.infer<typeof UserStorySchema>
export type Sprint = z.infer<typeof SprintSchema>
export type Codebase = z.infer<typeof CodebaseSchema>
export type GameClock = z.infer<typeof GameClockSchema>
export type FeedbackEvent = z.infer<typeof FeedbackEventSchema>
export type Practices = z.infer<typeof PracticesSchema>
export type GameState = z.infer<typeof GameStateSchema>

// --- Types that don't have schemas (runtime-only, not persisted) ---

export interface NamedLocation {
  name: string
  position: Vec3
  seatDirection?: Vec3
}

export interface GameInstance {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  state: GameState
  start(): void
  stop(): void
  getState(): GameState
  updateState(partial: Partial<GameState>): void
  beginSprint(storyIds: string[], didPlanning: boolean): void
  assignStory(devId: string, storyId: string): void
  unassignStory(devId: string): void
  shipRelease(): { feedback: FeedbackEvent[]; velocity: number; codebase: Codebase }
  nextSprint(): void
  togglePractice(key: keyof Practices): void
  setPaused(paused: boolean): void
  setSpeed(speed: number): void
  /** Run N game ticks synchronously (for E2E testing). */
  fastForward(ticks: number): void
  /** Pan the camera by pixel deltas (content follows pointer). */
  applyPanDeltaPixels(dx: number, dy: number): void
  /** Zoom the camera by a scale factor (>1 = zoom in, <1 = zoom out). */
  applyZoomScale(factor: number): void
  /** Reset camera to default position and zoom. */
  resetCamera(): void
}
