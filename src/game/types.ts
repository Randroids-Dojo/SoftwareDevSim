import type * as THREE from 'three'
import type { z } from 'zod'
import type {
  ActivityStateSchema,
  AppChoiceSchema,
  ComplexitySchema,
  GameClockSchema,
  GamePhaseSchema,
  GameResultSchema,
  GameStateSchema,
  GradeSchema,
  RoleSchema,
  SprintStateSchema,
  Vec3Schema,
  WorkerStateSchema,
} from '../lib/schemas'

// --- Types derived from Zod schemas (single source of truth) ---

export type Vec3 = z.infer<typeof Vec3Schema>
export type Role = z.infer<typeof RoleSchema>
export type ActivityState = z.infer<typeof ActivityStateSchema>
export type GamePhase = z.infer<typeof GamePhaseSchema>
export type Grade = z.infer<typeof GradeSchema>
export type Complexity = z.infer<typeof ComplexitySchema>
export type WorkerState = z.infer<typeof WorkerStateSchema>
export type AppChoice = z.infer<typeof AppChoiceSchema>
export type SprintState = z.infer<typeof SprintStateSchema>
export type GameClock = z.infer<typeof GameClockSchema>
export type GameResult = z.infer<typeof GameResultSchema>
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
  /** Add workers to the 3D scene. Called when transitioning to running phase. */
  spawnWorkers(workers: WorkerState[]): void
  /** Remove all workers from the 3D scene. */
  clearWorkers(): void
  /** Pan the camera by pixel deltas (content follows pointer). */
  applyPanDeltaPixels(dx: number, dy: number): void
  /** Zoom the camera by a scale factor (>1 = zoom in, <1 = zoom out). */
  applyZoomScale(factor: number): void
  /** Rotate the camera orbit around the Y axis by a delta in radians. */
  applyRotationDelta(deltaRadians: number): void
  /** Reset camera to default position and zoom. */
  resetCamera(): void
}
