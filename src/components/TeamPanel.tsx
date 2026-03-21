'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import type { GameActions } from '../game'

interface TeamPanelProps {
  snapshot: GameSnapshot
  game: GameActions
  onClose: () => void
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

function barColor(v: number): string {
  if (v >= 0.7) return 'bg-green-500'
  if (v >= 0.4) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function TeamPanel({ snapshot, game, onClose }: TeamPanelProps) {
  const assignableStories = (devId: string) =>
    snapshot.backlog.filter((s) => {
      if (!snapshot.sprint.stories.includes(s.id)) return false
      if (s.status !== 'todo' && s.status !== 'in_progress') return false

      const assignedDevs = snapshot.developers.filter((d) => d.assignedStoryId === s.id)
      // Already assigned to this dev
      if (assignedDevs.some((d) => d.id === devId)) return false
      // With pair programming, allow a second dev; without, only unassigned stories
      if (snapshot.practices.pairProgramming) return assignedDevs.length < 2
      return assignedDevs.length === 0
    })

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[520px] max-w-[90vw] bg-gray-800 border border-gray-600 rounded-t-lg shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h3 className="text-white font-medium">Team</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
          &times;
        </button>
      </div>
      <div className="p-4 space-y-4">
        {snapshot.developers.map((dev) => {
          const assignedStory = dev.assignedStoryId
            ? snapshot.backlog.find((s) => s.id === dev.assignedStoryId)
            : null
          const pairPartner = assignedStory
            ? snapshot.developers.find(
                (d) => d.id !== dev.id && d.assignedStoryId === assignedStory.id,
              )
            : undefined

          return (
            <div key={dev.id} className="bg-gray-700/50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-medium">{dev.name}</span>
                  <span className="text-gray-400 text-xs ml-2 capitalize">{dev.trait}</span>
                </div>
                <span className="text-xs text-gray-400 capitalize">{dev.currentActivity}</span>
              </div>

              {/* Stats bars */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(['energy', 'focus', 'morale'] as const).map((stat) => (
                  <div key={stat} className="flex flex-col">
                    <span className="text-xs text-gray-400 capitalize">{stat}</span>
                    <div className="h-1.5 bg-gray-600 rounded-full mt-0.5">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(dev[stat])}`}
                        style={{ width: pct(dev[stat]) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Story assignment */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Story:</span>
                {assignedStory ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-blue-300">{assignedStory.title}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(assignedStory.progress * 100)}%)
                    </span>
                    {pairPartner && (
                      <span className="text-xs text-purple-400">Pairing w/ {pairPartner.name}</span>
                    )}
                    <button
                      onClick={() => game.unassignStory(dev.id)}
                      className="text-xs text-red-400 hover:text-red-300 ml-auto"
                    >
                      Unassign
                    </button>
                  </div>
                ) : (
                  <select
                    className="text-xs bg-gray-600 text-white rounded px-2 py-1 flex-1"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) game.assignStory(dev.id, e.target.value)
                    }}
                  >
                    <option value="">-- Assign story --</option>
                    {assignableStories(dev.id).map((s) => {
                      const assignedDev = snapshot.developers.find(
                        (d) => d.assignedStoryId === s.id,
                      )
                      const label = assignedDev
                        ? `${s.title} (${s.points}pts) — pair w/ ${assignedDev.name}`
                        : `${s.title} (${s.points}pts)`
                      return (
                        <option key={s.id} value={s.id}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
