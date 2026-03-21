'use client'

import { useState } from 'react'
import type { GameSnapshot } from '../hooks/useGameState'
import type { GameActions } from '../game'
import type { FeedbackEvent } from '../game/types'

interface ShipPanelProps {
  snapshot: GameSnapshot
  game: GameActions
  onClose: () => void
}

export default function ShipPanel({ snapshot, game, onClose }: ShipPanelProps) {
  const [shipResult, setShipResult] = useState<{
    feedback: FeedbackEvent[]
    velocity: number
  } | null>(null)

  const sprintStories = snapshot.backlog.filter((s) => snapshot.sprint.stories.includes(s.id))
  const doneStories = sprintStories.filter((s) => s.status === 'done')
  const inProgress = sprintStories.filter(
    (s) => s.status === 'in_progress' || s.status === 'review',
  )
  const donePoints = doneStories.reduce((s, d) => s + d.points, 0)

  const canShip =
    doneStories.length > 0 &&
    (snapshot.sprint.phase === 'active' || snapshot.sprint.phase === 'review')
  const isShipped = snapshot.sprint.phase === 'shipped'

  const handleShip = () => {
    const result = game.shipRelease()
    setShipResult({ feedback: result.feedback, velocity: result.velocity })
  }

  const handleNextSprint = () => {
    game.nextSprint()
    setShipResult(null)
    onClose()
  }

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[480px] max-w-[90vw] bg-gray-800 border border-gray-600 rounded-t-lg shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h3 className="text-white font-medium">Ship Release</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Collapse">
          &#9662;
        </button>
      </div>
      <div className="p-4">
        {!isShipped && !shipResult && (
          <>
            <div className="mb-3">
              <p className="text-sm text-gray-300">
                Ready to ship:{' '}
                <span className="text-green-400">
                  {doneStories.length} stories ({donePoints} pts)
                </span>
              </p>
              {inProgress.length > 0 && (
                <p className="text-sm text-yellow-400 mt-1">
                  {inProgress.length} stories still in progress will not be shipped.
                </p>
              )}
            </div>
            <button
              onClick={handleShip}
              disabled={!canShip}
              className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ship Release
            </button>
          </>
        )}

        {shipResult && (
          <>
            <div className="mb-3">
              <p className="text-green-400 text-sm font-medium mb-2">
                Shipped! Velocity: {shipResult.velocity} points
              </p>
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">User Feedback</h4>
              <div className="space-y-1.5">
                {shipResult.feedback.map((f) => (
                  <div
                    key={f.id}
                    className={`text-sm p-2 rounded ${
                      f.type === 'positive'
                        ? 'bg-green-900/50 text-green-300'
                        : f.type === 'negative'
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    {f.message}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleNextSprint}
              className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded"
            >
              Start Next Sprint
            </button>
          </>
        )}

        {isShipped && !shipResult && (
          <button
            onClick={handleNextSprint}
            className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded"
          >
            Start Next Sprint
          </button>
        )}
      </div>
    </div>
  )
}
