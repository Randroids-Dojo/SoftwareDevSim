import { z } from 'zod'

// --- Enums ---

export const RoleSchema = z.enum(['developer', 'designer', 'product_owner', 'manager'])

export const ActivityStateSchema = z.enum(['idle', 'moving', 'working', 'meeting', 'break'])

export const GamePhaseSchema = z.enum(['title', 'choose_app', 'hire_team', 'running', 'ended'])

export const GradeSchema = z.enum(['S', 'A', 'B', 'C', 'D', 'F'])

export const ComplexitySchema = z.enum(['simple', 'medium', 'complex'])

// --- Value objects ---

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()])

// --- Domain schemas ---

export const WorkerStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: RoleSchema,
  salary: z.number().positive(),
  energy: z.number().min(0).max(1),
  currentActivity: ActivityStateSchema,
  position: Vec3Schema,
})

export const AppChoiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  complexity: ComplexitySchema,
  estimatedSprints: z.number().int().positive(),
  revenuePotential: z.number().positive(),
})

export const SprintStateSchema = z.object({
  current: z.number().int().min(0),
  total: z.literal(4),
  dayInSprint: z.number().int().min(0),
  daysPerSprint: z.literal(5),
})

export const GameClockSchema = z.object({
  day: z.number().int().min(1),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  paused: z.boolean(),
  speed: z.number().positive(),
})

export const GameResultSchema = z.object({
  grade: GradeSchema,
  completion: z.number().min(0),
  quality: z.number().min(0).max(1),
  totalCost: z.number(),
  revenue: z.number(),
  roi: z.number(),
  featuresShipped: z.string(),
})

export const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  cash: z.number(),
  chosenApp: AppChoiceSchema.nullable(),
  team: z.array(WorkerStateSchema),
  sprint: SprintStateSchema,
  clock: GameClockSchema,
  progress: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  result: GameResultSchema.nullable(),
  seed: z.string().min(1),
})
