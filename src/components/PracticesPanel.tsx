'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import type { GameActions } from '../game'
import type { PracticeKey } from '../game/types'

interface PracticesPanelProps {
  snapshot: GameSnapshot
  game: GameActions
  onClose: () => void
}

const PRACTICE_INFO: { key: PracticeKey; label: string; desc: string; cost: string }[] = [
  {
    key: 'sprintPlanning',
    label: 'Sprint Planning',
    desc: 'Validate stories against user needs before building',
    cost: 'Half a day per sprint',
  },
  {
    key: 'tdd',
    label: 'TDD / Tests',
    desc: 'Write tests first; quality floor 0.85',
    cost: '20% slower story progress',
  },
  {
    key: 'codeReview',
    label: 'Code Review',
    desc: '+0.15 quality; catches architecture issues',
    cost: 'Review step before done',
  },
  {
    key: 'ci',
    label: 'CI/CD Pipeline',
    desc: 'Broken builds caught instantly',
    cost: 'None (just enable it!)',
  },
  {
    key: 'pairProgramming',
    label: 'Pair Programming',
    desc: '1.3x quality; knowledge sharing',
    cost: 'Two devs on one story',
  },
  {
    key: 'refactoringBudget',
    label: 'Refactoring Budget',
    desc: 'Tech debt decreases each sprint',
    cost: 'Capacity spent on non-features',
  },
]

export default function PracticesPanel({ snapshot, game, onClose }: PracticesPanelProps) {
  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[520px] max-w-[90vw] bg-gray-800 border border-gray-600 rounded-t-lg shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h3 className="text-white font-medium">Engineering Practices</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
          &times;
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-400 mb-3">
          AI coding multiplies your process. Good practices + AI = 2x speed, high quality. No
          practices + AI = 2x speed, 2x tech debt.
        </p>
        {PRACTICE_INFO.map(({ key, label, desc, cost }) => (
          <label
            key={key}
            className="flex items-start gap-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={snapshot.practices[key]}
              onChange={() => game.togglePractice(key)}
              className="mt-1 rounded"
            />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{label}</div>
              <div className="text-gray-400 text-xs">{desc}</div>
              <div className="text-yellow-500 text-xs mt-0.5">Cost: {cost}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
