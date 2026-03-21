import type { Codebase, FeedbackEvent, Practices, UserStory } from '../types'
import { pick } from '../../lib/seededRng'

const POSITIVE_FEEDBACK = [
  'Users love the new feature!',
  'Great test coverage — caught a regression before release.',
  'Clean architecture makes onboarding new devs easy.',
  'The code review process caught a critical security issue.',
  'Sprint planning paid off — we built exactly what users needed.',
  'Refactoring budget is keeping the codebase healthy.',
  'CI pipeline caught a broken build before it shipped.',
  'Pair programming spread knowledge — no single points of failure.',
]

const NEGATIVE_FEEDBACK = [
  'Users report: "This isn\'t what we asked for."',
  'Bug in production — no tests caught it.',
  'New dev is lost — codebase has no clear architecture.',
  'Tech debt is slowing everything down.',
  'We shipped broken code — no CI pipeline to catch it.',
  'A dev burned out — they were the only one who knew that module.',
  'Feature was rushed — quality is noticeably poor.',
  'We built the wrong thing — no sprint planning to validate.',
]

const NEUTRAL_FEEDBACK = [
  'Users are using the feature, but engagement is moderate.',
  'The team is steady but could use a morale boost.',
  'Velocity is consistent — nothing exciting, nothing alarming.',
]

export function generateFeedback(
  rng: () => number,
  sprintNumber: number,
  stories: UserStory[],
  codebase: Codebase,
  practices: Practices,
): FeedbackEvent[] {
  const events: FeedbackEvent[] = []
  let eventId = 0

  const makeEvent = (type: FeedbackEvent['type'], pool: string[]): FeedbackEvent => ({
    id: `feedback-${sprintNumber}-${eventId++}`,
    sprint: sprintNumber,
    message: pick(rng, pool),
    type,
  })

  const doneStories = stories.filter((s) => s.status === 'done')

  // Wrong feature check (no sprint planning)
  if (!practices.sprintPlanning) {
    for (const story of doneStories) {
      if (!story.wasPlanned && rng() < 0.3) {
        events.push({
          id: `feedback-${sprintNumber}-${eventId++}`,
          sprint: sprintNumber,
          message: `"${story.title}" turned out to be the wrong feature — wasted ${story.points} points.`,
          type: 'negative',
        })
      }
    }
  }

  // Quality-based feedback
  if (codebase.quality > 0.8) {
    events.push(makeEvent('positive', POSITIVE_FEEDBACK))
  } else if (codebase.quality < 0.5) {
    events.push(makeEvent('negative', NEGATIVE_FEEDBACK))
  }

  // Tech debt feedback
  if (codebase.techDebt > 0.7) {
    events.push({
      id: `feedback-${sprintNumber}-${eventId++}`,
      sprint: sprintNumber,
      message: 'Tech debt is critical! Everything is slowing down. The team is demoralized.',
      type: 'negative',
    })
  } else if (codebase.techDebt > 0.4) {
    events.push({
      id: `feedback-${sprintNumber}-${eventId++}`,
      sprint: sprintNumber,
      message: 'Tech debt is accumulating. The team is starting to feel the drag.',
      type: 'negative',
    })
  }

  // Practice-specific feedback
  if (practices.ci && practices.tdd) {
    if (rng() < 0.4) events.push(makeEvent('positive', POSITIVE_FEEDBACK))
  }
  if (!practices.codeReview && rng() < 0.3) {
    events.push(
      makeEvent('negative', [
        'Architecture is degrading without code reviews.',
        'Subtle bugs are slipping through without reviews.',
      ]),
    )
  }

  // Always at least one piece of feedback
  if (events.length === 0) {
    events.push(makeEvent('neutral', NEUTRAL_FEEDBACK))
  }

  return events
}

/** Generate thought bubble messages for developers. */
export function devThought(
  rng: () => number,
  codebase: Codebase,
  practices: Practices,
  isWorking: boolean,
): string | null {
  if (rng() > 0.05) return null // Only occasionally show thoughts

  if (codebase.techDebt > 0.6) {
    return pick(rng, [
      'This codebase is a mess...',
      'Need to refactor this...',
      'Who wrote this code?',
      'Technical debt everywhere...',
    ])
  }

  if (isWorking && practices.tdd) {
    return pick(rng, ['Tests passing!', 'Green bar!', 'TDD flow is great'])
  }

  if (isWorking) {
    return pick(rng, [
      'AI is crushing it today',
      'This architecture is clean',
      'Shipping fast!',
      'In the zone...',
    ])
  }

  return pick(rng, ['Need coffee...', 'Good standup today', 'What a team!'])
}
