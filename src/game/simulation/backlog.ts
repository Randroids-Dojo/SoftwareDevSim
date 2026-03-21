import type { UserStory } from '../types'
import { pick, shuffle } from '../../lib/seededRng'

interface StoryTemplate {
  title: string
  basePoints: number[]
}

const STORY_TEMPLATES: StoryTemplate[] = [
  { title: 'User login flow', basePoints: [3, 5] },
  { title: 'Dashboard analytics widget', basePoints: [2, 3] },
  { title: 'Push notification system', basePoints: [5, 8] },
  { title: 'Search with filters', basePoints: [3, 5] },
  { title: 'User profile settings', basePoints: [2, 3] },
  { title: 'Payment integration', basePoints: [5, 8] },
  { title: 'Email notification preferences', basePoints: [2, 3] },
  { title: 'Data export to CSV', basePoints: [1, 2] },
  { title: 'Dark mode theme', basePoints: [2, 3] },
  { title: 'Onboarding tutorial', basePoints: [3, 5] },
  { title: 'Admin user management', basePoints: [5, 8] },
  { title: 'Activity feed', basePoints: [3, 5] },
  { title: 'File upload with preview', basePoints: [3, 5] },
  { title: 'Real-time collaboration', basePoints: [8, 8] },
  { title: 'API rate limiting', basePoints: [2, 3] },
  { title: 'Accessibility audit fixes', basePoints: [3, 5] },
  { title: 'Mobile responsive layout', basePoints: [3, 5] },
  { title: 'Caching layer', basePoints: [3, 5] },
  { title: 'Automated backup system', basePoints: [2, 3] },
  { title: 'Keyboard shortcuts', basePoints: [1, 2] },
]

export function generateBacklog(rng: () => number, count: number = 15): UserStory[] {
  const templates = shuffle(rng, [...STORY_TEMPLATES]).slice(0, count)

  return templates.map((template, i) => ({
    id: `story-${i}`,
    title: template.title,
    points: pick(rng, template.basePoints),
    status: 'backlog' as const,
    quality: 0,
    progress: 0,
    wasPlanned: false,
    hasTests: false,
    wasReviewed: false,
    wasRefactored: false,
  }))
}

export function totalPoints(stories: UserStory[]): number {
  return stories.reduce((sum, s) => sum + s.points, 0)
}

export function storiesByStatus(stories: UserStory[]): Record<string, UserStory[]> {
  const result: Record<string, UserStory[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  }
  for (const story of stories) {
    result[story.status].push(story)
  }
  return result
}
