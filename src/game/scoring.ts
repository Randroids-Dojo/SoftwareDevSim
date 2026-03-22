import type { AppChoice, GameResult, GameState, Grade, WorkerState } from './types'

export const TOTAL_SPRINTS = 4

/** Calculate how much progress the team makes in one sprint. */
export function calculateSprintProgress(team: WorkerState[]): number {
  const devCount = team.filter((w) => w.role === 'developer').length
  const poCount = team.filter((w) => w.role === 'product_owner').length
  const managerCount = team.filter((w) => w.role === 'manager').length

  // Base progress: each dev contributes 20% per sprint
  let progress = devCount * 0.2

  // PO bonus: each PO increases dev effectiveness by 25%
  if (poCount > 0) {
    progress *= 1 + poCount * 0.25
  }

  // Manager effect: first manager adds 10% coordination bonus
  // Each additional manager reduces productivity by 15% (meetings!)
  if (managerCount >= 1) {
    progress *= 1.1
    if (managerCount > 1) {
      progress *= Math.max(0.1, 1 - (managerCount - 1) * 0.15)
    }
  }

  return progress
}

/** Calculate quality based on team composition. */
export function calculateQuality(team: WorkerState[]): number {
  const designerCount = team.filter((w) => w.role === 'designer').length
  const devCount = team.filter((w) => w.role === 'developer').length

  // Base quality from having devs
  let quality = devCount > 0 ? 0.3 : 0

  // Each designer adds 0.15 quality
  quality += designerCount * 0.15

  return Math.min(1, quality)
}

/** Calculate total team cost across all sprints. */
export function calculateTotalCost(team: WorkerState[]): number {
  return team.reduce((sum, w) => sum + w.salary * TOTAL_SPRINTS, 0)
}

/** Determine completion: how much of the app actually got built. */
export function calculateCompletion(progress: number, app: AppChoice): number {
  // Scale progress relative to app difficulty
  const difficultyScale = app.estimatedSprints / TOTAL_SPRINTS
  return Math.min(1, progress / difficultyScale)
}

/** Calculate revenue based on completion and quality. */
export function calculateRevenue(completion: number, quality: number, app: AppChoice): number {
  // Need at least 40% completion to ship anything
  if (completion < 0.4) return 0

  // Quality multiplier ranges from 0.5 (terrible) to 1.5 (excellent)
  const qualityMultiplier = 0.5 + quality

  return Math.round(app.revenuePotential * completion * qualityMultiplier)
}

/** Determine letter grade from ROI percentage. */
export function calculateGrade(roi: number): Grade {
  if (roi >= 300) return 'S'
  if (roi >= 150) return 'A'
  if (roi >= 50) return 'B'
  if (roi >= 0) return 'C'
  if (roi >= -50) return 'D'
  return 'F'
}

/** Build the end-of-game result. */
export function calculateResult(state: GameState): GameResult {
  const app = state.chosenApp
  if (!app) {
    return {
      grade: 'F',
      completion: 0,
      quality: 0,
      totalCost: 0,
      revenue: 0,
      roi: -100,
      featuresShipped: 'Nothing — no app was selected.',
    }
  }

  const totalCost = calculateTotalCost(state.team)
  const completion = calculateCompletion(state.progress, app)
  const quality = state.quality
  const revenue = calculateRevenue(completion, quality, app)
  const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : -100
  const grade = calculateGrade(roi)

  let featuresShipped: string
  if (completion < 0.4) {
    featuresShipped = `The ${app.name} never reached a shippable state.`
  } else if (completion < 0.7) {
    featuresShipped = `A bare-bones ${app.name} with core features only.`
  } else if (completion < 1) {
    featuresShipped = `A solid ${app.name} missing some polish.`
  } else {
    featuresShipped = `A fully complete ${app.name}!`
  }

  return { grade, completion, quality, totalCost, revenue, roi, featuresShipped }
}
