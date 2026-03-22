'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import { formatTime } from '../game/simulation/clock'
import { getSprintLength } from '../game/simulation/sprint'

interface HUDProps {
  snapshot: GameSnapshot
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

function qualityColor(v: number): string {
  if (v >= 0.8) return 'text-green-400'
  if (v >= 0.5) return 'text-yellow-400'
  return 'text-red-400'
}

function debtColor(v: number): string {
  if (v <= 0.3) return 'text-green-400'
  if (v <= 0.6) return 'text-yellow-400'
  return 'text-red-400'
}

export default function HUD({ snapshot }: HUDProps) {
  const { clock, sprint, codebase, developers } = snapshot
  const avgMorale =
    developers.length > 0 ? developers.reduce((s, d) => s + d.morale, 0) / developers.length : 0
  const sprintDay = `${sprint.dayInSprint + 1}/${getSprintLength()}`

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-10 select-none"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
    >
      <div className="flex items-center gap-1">
        <span className="text-white font-mono text-sm">{formatTime(clock)}</span>
        <span className="text-gray-500 text-xs ml-2">Sprint {sprint.number}</span>
        <span className="text-gray-500 text-xs">Day {sprintDay}</span>
        <span
          className={`text-xs ml-2 px-2 py-0.5 rounded ${
            sprint.phase === 'planning'
              ? 'bg-blue-900 text-blue-300'
              : sprint.phase === 'active'
                ? 'bg-green-900 text-green-300'
                : sprint.phase === 'review'
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-purple-900 text-purple-300'
          }`}
        >
          {sprint.phase}
        </span>
      </div>

      <div className="flex items-center gap-1 divide-x divide-gray-700">
        <StatBadge
          label="Quality"
          value={pct(codebase.quality)}
          color={qualityColor(codebase.quality)}
        />
        <StatBadge
          label="Tech Debt"
          value={pct(codebase.techDebt)}
          color={debtColor(codebase.techDebt)}
        />
        <StatBadge label="Morale" value={pct(avgMorale)} color={qualityColor(avgMorale)} />
        <StatBadge
          label="Architecture"
          value={pct(codebase.architecture)}
          color={qualityColor(codebase.architecture)}
        />
        <StatBadge
          label="CI"
          value={codebase.ciStatus.toUpperCase()}
          color={
            codebase.ciStatus === 'green'
              ? 'text-green-400'
              : codebase.ciStatus === 'red'
                ? 'text-red-400'
                : 'text-yellow-400'
          }
        />
        <StatBadge label="Shipped" value={`${codebase.totalPointsShipped}pts`} color="text-white" />
      </div>
    </div>
  )
}
