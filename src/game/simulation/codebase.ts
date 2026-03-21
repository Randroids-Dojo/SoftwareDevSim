import type { Codebase, Practices, UserStory } from '../types'

export function createCodebase(): Codebase {
  return {
    techDebt: 0.1,
    quality: 0.7,
    ciStatus: 'green',
    totalPointsShipped: 0,
    releasesShipped: 0,
    architecture: 0.7,
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Calculate quality for a completed story based on practices. */
export function computeStoryQuality(
  story: UserStory,
  practices: Practices,
  devProductivity: number,
): number {
  let quality = 0.5 + devProductivity * 0.2

  // Without tests, base quality capped at 0.6 — applied before bonuses
  if (!practices.tdd && !story.hasTests) quality = Math.min(quality, 0.6)

  // Tests lift quality to a floor of 0.85
  if (practices.tdd || story.hasTests) quality = Math.max(quality, 0.85)

  // Additive bonuses from other practices
  if (practices.codeReview || story.wasReviewed) quality += 0.15
  if (story.wasPlanned) quality += 0.05
  if (story.wasRefactored) quality += 0.05

  return clamp01(quality)
}

/** Update codebase after shipping a set of stories. */
export function shipRelease(
  codebase: Codebase,
  stories: UserStory[],
  practices: Practices,
): Codebase {
  const updated = { ...codebase }
  let totalQuality = 0
  let shippedPoints = 0

  for (const story of stories) {
    shippedPoints += story.points
    totalQuality += story.quality * story.points
  }

  if (shippedPoints > 0) {
    const avgQuality = totalQuality / shippedPoints
    // Blend new quality with existing
    updated.quality = clamp01(updated.quality * 0.7 + avgQuality * 0.3)
  }

  updated.totalPointsShipped += shippedPoints
  updated.releasesShipped++

  // Tech debt from stories without tests/review
  for (const story of stories) {
    if (!story.hasTests && !practices.tdd) updated.techDebt += 0.03 * story.points
    if (!story.wasReviewed && !practices.codeReview) updated.techDebt += 0.02 * story.points
    if (!story.wasPlanned) updated.techDebt += 0.01 * story.points
  }

  // Refactoring budget reduces tech debt
  if (practices.refactoringBudget) {
    updated.techDebt -= 0.05
  }

  // Architecture degrades without code review
  if (!practices.codeReview) {
    updated.architecture = clamp01(updated.architecture - 0.03)
  }

  // CI catches broken builds
  if (practices.ci) {
    updated.ciStatus = 'green'
  } else {
    // Without CI, broken builds can slip through
    const hasUntested = stories.some((s) => !s.hasTests && !practices.tdd)
    updated.ciStatus = hasUntested ? 'red' : 'green'
  }

  updated.techDebt = clamp01(updated.techDebt)
  updated.quality = clamp01(updated.quality)
  updated.architecture = clamp01(updated.architecture)

  return updated
}

/** Get the AI speed multiplier based on practices. */
export function aiSpeedMultiplier(practices: Practices): number {
  const practiceCount = [
    practices.tdd,
    practices.codeReview,
    practices.sprintPlanning,
    practices.ci,
    practices.refactoringBudget,
  ].filter(Boolean).length

  // AI always gives at least 1.5x. With good practices, 2x.
  // With no practices, still 2x speed but tech debt also 2x.
  if (practiceCount >= 4) return 2.0
  if (practiceCount >= 2) return 1.5
  return 2.0 // Fast but reckless
}

/** Get the tech debt accumulation multiplier. */
export function debtMultiplier(practices: Practices): number {
  const practiceCount = [
    practices.tdd,
    practices.codeReview,
    practices.sprintPlanning,
    practices.ci,
    practices.refactoringBudget,
  ].filter(Boolean).length

  if (practiceCount >= 4) return 0.5
  if (practiceCount >= 2) return 1.0
  return 2.0 // AI generates bad code faster
}

export function isDeathSpiral(codebase: Codebase): boolean {
  return codebase.techDebt > 0.7
}
