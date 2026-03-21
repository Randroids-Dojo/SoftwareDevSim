'use client'

import { useState } from 'react'
import type { GameSnapshot } from '../hooks/useGameState'
import type { GameActions } from '../game'

interface SprintPanelProps {
  snapshot: GameSnapshot
  game: GameActions
  onClose: () => void
}

export default function SprintPanel({ snapshot, game, onClose }: SprintPanelProps) {
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const backlogStories = snapshot.backlog.filter((s) => s.status === 'backlog')
  const totalSelected = backlogStories
    .filter((s) => selectedStories.includes(s.id))
    .reduce((sum, s) => sum + s.points, 0)

  const toggleStory = (id: string) => {
    setSelectedStories((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const canStart = selectedStories.length > 0 && snapshot.sprint.phase === 'planning'

  const handleStart = (withPlanning: boolean) => {
    game.beginSprint(selectedStories, withPlanning)
    onClose()
  }

  if (snapshot.sprint.phase !== 'planning') {
    return (
      <PanelWrapper title={`Sprint ${snapshot.sprint.number}`} onClose={onClose}>
        <p className="text-gray-400">Sprint is {snapshot.sprint.phase}.</p>
        <div className="mt-2 space-y-1">
          {snapshot.backlog
            .filter((s) => snapshot.sprint.stories.includes(s.id))
            .map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-white">{s.title}</span>
                <span
                  className={`${s.status === 'done' ? 'text-green-400' : s.status === 'in_progress' ? 'text-blue-400' : s.status === 'review' ? 'text-purple-400' : 'text-gray-400'}`}
                >
                  {s.status} ({Math.round(s.progress * 100)}%)
                </span>
              </div>
            ))}
        </div>
      </PanelWrapper>
    )
  }

  return (
    <PanelWrapper title="Sprint Planning" onClose={onClose}>
      <p className="text-gray-400 text-sm mb-3">
        Select stories for Sprint {snapshot.sprint.number} ({totalSelected} points selected)
      </p>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {backlogStories.map((story) => (
          <label
            key={story.id}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-700/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedStories.includes(story.id)}
              onChange={() => toggleStory(story.id)}
              className="rounded"
            />
            <span className="text-white text-sm flex-1">{story.title}</span>
            <span className="text-gray-400 text-xs">{story.points}pts</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handleStart(true)}
          disabled={!canStart}
          className="flex-1 px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start with Planning
        </button>
        <button
          onClick={() => handleStart(false)}
          disabled={!canStart}
          className="flex-1 px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start (Skip Planning)
        </button>
      </div>
    </PanelWrapper>
  )
}

function PanelWrapper({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[480px] max-w-[90vw] bg-gray-800 border border-gray-600 rounded-t-lg shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h3 className="text-white font-medium">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Collapse">
          &#9662;
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
