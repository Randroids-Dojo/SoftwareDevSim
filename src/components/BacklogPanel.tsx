'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import type { StoryStatus } from '../game/types'

interface BacklogPanelProps {
  snapshot: GameSnapshot
  onClose: () => void
}

const STATUS_COLORS: Record<StoryStatus, string> = {
  backlog: 'text-gray-400',
  todo: 'text-blue-300',
  in_progress: 'text-yellow-300',
  review: 'text-purple-300',
  done: 'text-green-300',
}

const STATUS_LABELS: Record<StoryStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export default function BacklogPanel({ snapshot, onClose }: BacklogPanelProps) {
  const grouped = snapshot.backlog.reduce<Record<StoryStatus, typeof snapshot.backlog>>(
    (acc, s) => {
      if (!acc[s.status]) acc[s.status] = []
      acc[s.status].push(s)
      return acc
    },
    {} as Record<StoryStatus, typeof snapshot.backlog>,
  )

  const order: StoryStatus[] = ['in_progress', 'review', 'todo', 'backlog', 'done']

  return (
    <div className="absolute bottom-18 left-1/2 -translate-x-1/2 w-[520px] max-w-[90vw] bg-gray-800 border border-gray-600 rounded-t-lg shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h3 className="text-white font-medium">Backlog</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
          &times;
        </button>
      </div>
      <div className="p-4 max-h-72 overflow-y-auto">
        {order.map((status) => {
          const stories = grouped[status]
          if (!stories || stories.length === 0) return null
          return (
            <div key={status} className="mb-3">
              <h4
                className={`text-xs font-medium uppercase tracking-wider mb-1 ${STATUS_COLORS[status]}`}
              >
                {STATUS_LABELS[status]} ({stories.length})
              </h4>
              {stories.map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1 px-2 text-sm">
                  <span className="text-white">{s.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{s.points}pts</span>
                    {s.status === 'in_progress' && (
                      <span className="text-yellow-400 text-xs">
                        {Math.round(s.progress * 100)}%
                      </span>
                    )}
                    {s.status === 'done' && (
                      <span className="text-green-400 text-xs">
                        Q:{Math.round(s.quality * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
