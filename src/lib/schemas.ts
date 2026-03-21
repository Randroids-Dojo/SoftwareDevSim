import { z } from 'zod'

// --- Enums ---

export const DeveloperTraitSchema = z.enum(['architect', 'craftsman', 'hustler'])

export const ActivityStateSchema = z.enum([
  'idle',
  'moving',
  'working',
  'pairing',
  'meeting',
  'break',
])

export const StoryStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'review', 'done'])

export const SprintPhaseSchema = z.enum(['planning', 'active', 'review', 'shipped'])

export const CIStatusSchema = z.enum(['green', 'red', 'building'])

export const PracticeKeySchema = z.enum([
  'ci',
  'codeReview',
  'tdd',
  'pairProgramming',
  'sprintPlanning',
  'refactoringBudget',
])

// --- Value objects ---

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()])

// --- Domain schemas ---

export const DeveloperStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  trait: DeveloperTraitSchema,
  morale: z.number().min(0).max(1),
  energy: z.number().min(0).max(1),
  focus: z.number().min(0).max(1),
  currentActivity: ActivityStateSchema,
  assignedStoryId: z.string().nullable(),
  position: Vec3Schema,
})

const VALID_POINTS = [1, 2, 3, 5, 8] as const

export const UserStorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  points: z.number().refine((n) => VALID_POINTS.includes(n as (typeof VALID_POINTS)[number]), {
    message: 'Story points must be 1, 2, 3, 5, or 8',
  }),
  status: StoryStatusSchema,
  quality: z.number().min(0).max(1),
  progress: z.number().min(0).max(1),
  wasPlanned: z.boolean(),
  hasTests: z.boolean(),
  wasReviewed: z.boolean(),
  wasRefactored: z.boolean(),
})

export const SprintSchema = z.object({
  number: z.number().int().min(1),
  phase: SprintPhaseSchema,
  dayInSprint: z.number().int().min(0),
  stories: z.array(z.string()),
  hadPlanning: z.boolean(),
  hadRetro: z.boolean(),
})

export const CodebaseSchema = z.object({
  techDebt: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  ciStatus: CIStatusSchema,
  totalPointsShipped: z.number().int().min(0),
  releasesShipped: z.number().int().min(0),
  architecture: z.number().min(0).max(1),
})

export const GameClockSchema = z.object({
  day: z.number().int().min(1),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  paused: z.boolean(),
  speed: z.number().positive(),
})

export const FeedbackEventSchema = z.object({
  id: z.string().min(1),
  sprint: z.number().int().min(1),
  message: z.string().min(1),
  type: z.enum(['positive', 'negative', 'neutral']),
})

export const PracticesSchema = z.object({
  ci: z.boolean(),
  codeReview: z.boolean(),
  tdd: z.boolean(),
  pairProgramming: z.boolean(),
  sprintPlanning: z.boolean(),
  refactoringBudget: z.boolean(),
})

export const GameStateSchema = z.object({
  clock: GameClockSchema,
  developers: z.array(DeveloperStateSchema),
  sprint: SprintSchema,
  backlog: z.array(UserStorySchema),
  codebase: CodebaseSchema,
  feedback: z.array(FeedbackEventSchema),
  practices: PracticesSchema,
  seed: z.string().min(1),
})

// --- Persistence ---

export const GAME_STATE_VERSION = 1

export const PersistedGameStateSchema = z.object({
  version: z.literal(GAME_STATE_VERSION),
  state: GameStateSchema,
  savedAt: z.number().int().positive(),
})

export type PersistedGameState = z.infer<typeof PersistedGameStateSchema>
