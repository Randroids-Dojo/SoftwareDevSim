import type { Crisis, GameState, WorkerState } from './types'
import { createRng, pick } from '../lib/seededRng'

// --- Crisis definition type (internal, not serialized) ---

export interface CrisisDefinition {
  id: string
  title: string
  narrative: string
  choices: { id: string; label: string; description: string }[]
  /** Return true when this crisis is valid given current game state. */
  precondition: (state: GameState) => boolean
  /** Mutate state to apply the chosen option. Return a short summary. */
  applyChoice: (state: GameState, choiceId: string) => string
}

// --- Helpers ---

function countByRole(team: WorkerState[], role: WorkerState['role']): number {
  return team.filter((w) => w.role === role).length
}

function averageEnergy(team: WorkerState[]): number {
  if (team.length === 0) return 1
  return team.reduce((sum, w) => sum + w.energy, 0) / team.length
}

function removeLastWorkerByRole(team: WorkerState[], role: WorkerState['role']): WorkerState[] {
  const lastIndex = team.findLastIndex((w) => w.role === role)
  if (lastIndex < 0) return team
  return [...team.slice(0, lastIndex), ...team.slice(lastIndex + 1)]
}

// --- Crisis catalog ---

export const CRISIS_CATALOG: readonly CrisisDefinition[] = [
  {
    id: 'tech_debt',
    title: 'Technical Debt Pileup',
    narrative:
      'Your codebase is getting messy. Tests are failing, bugs are creeping in. The team wants to pause features and refactor.',
    choices: [
      {
        id: 'refactor',
        label: 'Refactor',
        description: 'Slow down and clean up (+10% quality, −5% progress)',
      },
      { id: 'push', label: 'Push Through', description: 'Ship now, fix later (−8% quality)' },
    ],
    precondition: (s) => s.progress >= 0.15,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'refactor') {
        s.quality = Math.min(1, s.quality + 0.1)
        s.progress = Math.max(0, s.progress - 0.05)
        return 'The team refactored — cleaner code, slightly less progress.'
      }
      s.quality = Math.max(0, s.quality - 0.08)
      return 'The team pushed through — faster, but messier.'
    },
  },
  {
    id: 'star_dev_poached',
    title: 'Star Developer Poached',
    narrative:
      'A big tech company offered one of your developers triple salary. They\u2019re considering leaving.',
    choices: [
      { id: 'counter', label: 'Counter-Offer', description: 'Pay $25K to keep them' },
      { id: 'let_go', label: 'Let Them Go', description: 'Lose one developer' },
    ],
    precondition: (s) => countByRole(s.team, 'developer') >= 2,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'counter') {
        s.cash -= 25_000
        return 'You matched the offer — the developer stays, but it cost $25K.'
      }
      s.team = removeLastWorkerByRole(s.team, 'developer')
      return 'The developer left for greener pastures.'
    },
  },
  {
    id: 'scope_creep',
    title: 'Scope Creep from Stakeholders',
    narrative:
      'Stakeholders love what they\u2019ve seen and want to add \u201Cjust a few more features.\u201D',
    choices: [
      {
        id: 'accept',
        label: 'Accept Scope',
        description: 'Better product vision (+5% quality, −10% progress)',
      },
      { id: 'push_back', label: 'Push Back', description: 'Protect the sprint scope (no change)' },
    ],
    precondition: (s) => s.sprint.current >= 1,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'accept') {
        s.progress = Math.max(0, s.progress - 0.1)
        s.quality = Math.min(1, s.quality + 0.05)
        return 'You accommodated the requests — more work, but a better product.'
      }
      return 'You held the line — scope stays as planned.'
    },
  },
  {
    id: 'open_source',
    title: 'Open-Source Goldmine',
    narrative:
      'A developer found an open-source library that could replace weeks of work. But it\u2019s unproven and might have bugs.',
    choices: [
      { id: 'adopt', label: 'Adopt It', description: 'Risky but fast (+8% progress, −5% quality)' },
      { id: 'build', label: 'Build In-House', description: 'Safe and polished (+5% quality)' },
    ],
    precondition: (s) => countByRole(s.team, 'developer') >= 1,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'adopt') {
        s.progress = Math.min(1, s.progress + 0.08)
        s.quality = Math.max(0, s.quality - 0.05)
        return 'The library saved time, but introduced some rough edges.'
      }
      s.quality = Math.min(1, s.quality + 0.05)
      return 'The team built it from scratch — slower, but solid.'
    },
  },
  {
    id: 'burnout',
    title: 'Team Burnout Warning',
    narrative:
      'Your team is exhausted. Productivity is dropping and people are making careless mistakes.',
    choices: [
      {
        id: 'rest',
        label: 'Mandatory Rest Day',
        description: 'Restore team energy (−3% progress)',
      },
      {
        id: 'push',
        label: 'Push Through',
        description: 'Keep going despite fatigue (−6% quality)',
      },
    ],
    precondition: (s) => s.team.length > 0 && averageEnergy(s.team) < 0.5,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'rest') {
        for (const worker of s.team) {
          worker.energy = 0.9
        }
        s.progress = Math.max(0, s.progress - 0.03)
        return 'The team took a breather — refreshed and ready.'
      }
      s.quality = Math.max(0, s.quality - 0.06)
      return 'The team pushed through exhaustion — mistakes were made.'
    },
  },
  {
    id: 'security_vuln',
    title: 'Critical Security Vulnerability',
    narrative:
      'A security audit reveals a critical vulnerability. Shipping without a fix would be risky.',
    choices: [
      { id: 'fix', label: 'Fix Now', description: 'Patch it immediately (−6% progress)' },
      {
        id: 'workaround',
        label: 'Ship with Workaround',
        description: 'Temporary mitigation (−10% quality)',
      },
    ],
    precondition: (s) => s.progress >= 0.3,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'fix') {
        s.progress = Math.max(0, s.progress - 0.06)
        return 'Security patched — lost some time, but the app is safe.'
      }
      s.quality = Math.max(0, s.quality - 0.1)
      return 'Shipped with a workaround — fingers crossed.'
    },
  },
  {
    id: 'designer_breakthrough',
    title: 'Designer Breakthrough',
    narrative:
      'Your lead designer has a bold new UX vision. It requires rework but could dramatically improve the product.',
    choices: [
      {
        id: 'redesign',
        label: 'Redesign',
        description: 'Bold new UX (+15% quality, −6% progress)',
      },
      { id: 'stay', label: 'Stay the Course', description: 'Keep current design (no change)' },
    ],
    precondition: (s) => countByRole(s.team, 'designer') >= 1 && s.quality < 0.8,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'redesign') {
        s.quality = Math.min(1, s.quality + 0.15)
        s.progress = Math.max(0, s.progress - 0.06)
        return 'The redesign is stunning — users will love it.'
      }
      return 'You stuck with the current design — safe and steady.'
    },
  },
  {
    id: 'investor_interest',
    title: 'Investor Interest',
    narrative:
      'A VC saw your demo and wants to invest! But they want a feature that wasn\u2019t in your roadmap.',
    choices: [
      {
        id: 'take_money',
        label: 'Take the Money',
        description: 'Accept $40K investment (−5% progress)',
      },
      {
        id: 'independent',
        label: 'Stay Independent',
        description: 'Decline the offer (no change)',
      },
    ],
    precondition: (s) => s.progress >= 0.2,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'take_money') {
        s.cash += 40_000
        s.progress = Math.max(0, s.progress - 0.05)
        return 'You took the investment — more cash, but a detour on the roadmap.'
      }
      return 'You stayed independent — full control, no distractions.'
    },
  },
  {
    id: 'cicd_down',
    title: 'CI/CD Pipeline Down',
    narrative: 'Your build pipeline is broken. Fixing it costs time now but speeds up future work.',
    choices: [
      {
        id: 'fix',
        label: 'Fix the Pipeline',
        description: 'Invest now for future gains (−4% progress, +6% next sprint)',
      },
      {
        id: 'manual',
        label: 'Deploy Manually',
        description: 'Quick workaround (−4% quality)',
      },
    ],
    precondition: (s) => countByRole(s.team, 'developer') >= 1 && s.sprint.current >= 1,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'fix') {
        s.progress = Math.max(0, s.progress - 0.04)
        s.progressBonus += 0.06
        return 'Pipeline fixed — next sprint will be smoother.'
      }
      s.quality = Math.max(0, s.quality - 0.04)
      return 'Manual deploys for now — error-prone but functional.'
    },
  },
  {
    id: 'manager_micromanagement',
    title: 'Manager Micromanagement Crisis',
    narrative:
      'Your manager is hovering over developers, requesting status updates every hour. The team is frustrated.',
    choices: [
      {
        id: 'coach',
        label: 'Coach the Manager',
        description: 'Improve their leadership (+5% quality)',
      },
      {
        id: 'let_go',
        label: 'Let the Manager Go',
        description: 'Remove the overhead (lose one manager)',
      },
    ],
    precondition: (s) =>
      countByRole(s.team, 'manager') >= 1 && countByRole(s.team, 'developer') >= 1,
    applyChoice: (s, choiceId) => {
      if (choiceId === 'coach') {
        s.quality = Math.min(1, s.quality + 0.05)
        return 'You coached the manager — the team dynamic improved.'
      }
      s.team = removeLastWorkerByRole(s.team, 'manager')
      return 'The manager was let go — less overhead, more autonomy.'
    },
  },
]

// --- Selection & application ---

/** Pick a crisis for the current sprint boundary, or null if none qualify. */
export function selectCrisis(state: GameState): Crisis | null {
  const rng = createRng(state.seed + '-crisis-' + state.sprint.current)

  const eligible = CRISIS_CATALOG.filter(
    (c) => !state.crisesResolved.includes(c.id) && c.precondition(state),
  )

  if (eligible.length === 0) return null

  const chosen = pick(rng, eligible)
  return {
    id: chosen.id,
    title: chosen.title,
    narrative: chosen.narrative,
    choices: chosen.choices,
    triggeredAtSprint: state.sprint.current,
  }
}

/** Apply the player's choice for the pending crisis. Mutates state. Returns summary. */
export function applyCrisisChoice(state: GameState, choiceId: string): string {
  const crisis = state.pendingCrisis
  if (!crisis) return ''

  const definition = CRISIS_CATALOG.find((c) => c.id === crisis.id)
  if (!definition) return ''

  const summary = definition.applyChoice(state, choiceId)
  state.crisesResolved.push(crisis.id)
  state.pendingCrisis = null
  return summary
}
