'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import type { UserStory } from '../game/types'

interface KanbanOverlayProps {
  snapshot: GameSnapshot
  visible: boolean
}

function Column({ title, stories, color }: { title: string; stories: UserStory[]; color: string }) {
  return (
    <div className="flex-1 min-w-0">
      <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${color}`}>
        {title} ({stories.length})
      </h4>
      <div className="space-y-1">
        {stories.map((s) => (
          <div key={s.id} className="bg-gray-700/60 rounded p-1.5 text-xs">
            <div className="text-white truncate">{s.title}</div>
            <div className="flex justify-between mt-0.5">
              <span className="text-gray-400">{s.points}pts</span>
              {s.status === 'in_progress' && (
                <span className="text-yellow-400">{Math.round(s.progress * 100)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KanbanOverlay({ snapshot, visible }: KanbanOverlayProps) {
  if (!visible) return null

  const sprintStories = snapshot.backlog.filter((s) => snapshot.sprint.stories.includes(s.id))
  const todo = sprintStories.filter((s) => s.status === 'todo')
  const inProgress = sprintStories.filter((s) => s.status === 'in_progress')
  const review = sprintStories.filter((s) => s.status === 'review')
  const done = sprintStories.filter((s) => s.status === 'done')

  return (
    <div className="absolute top-12 right-4 w-80 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl z-10 p-3">
      <h3 className="text-white text-sm font-medium mb-2">Sprint Board</h3>
      <div className="flex gap-2">
        <Column title="Todo" stories={todo} color="text-blue-300" />
        <Column title="WIP" stories={inProgress} color="text-yellow-300" />
        <Column title="Review" stories={review} color="text-purple-300" />
        <Column title="Done" stories={done} color="text-green-300" />
      </div>
    </div>
  )
}
