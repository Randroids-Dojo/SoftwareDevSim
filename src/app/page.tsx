'use client'

import { useCallback, useEffect, useState } from 'react'
import GameCanvas from '../components/GameCanvas'
import HUD from '../components/HUD'
import MenuBar from '../components/MenuBar'
import SprintPanel from '../components/SprintPanel'
import TeamPanel from '../components/TeamPanel'
import PracticesPanel from '../components/PracticesPanel'
import BacklogPanel from '../components/BacklogPanel'
import ShipPanel from '../components/ShipPanel'
import KanbanOverlay from '../components/KanbanOverlay'
import { useGameState } from '../hooks/useGameState'
import { useGamePersistence } from '../hooks/useGamePersistence'
import { loadGameState, resetGameId } from '../lib/persistence'
import type { GameActions } from '../game'
import type { GameState } from '../game/types'

type Panel = 'sprint' | 'team' | 'backlog' | 'practices' | 'ship' | null
type AppPhase = 'loading' | 'intro' | 'playing'

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('loading')
  const [savedState, setSavedState] = useState<GameState | null>(null)
  const [game, setGame] = useState<GameActions | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const snapshot = useGameState(game)
  useGamePersistence(game)

  // Try to load saved game on mount
  useEffect(() => {
    loadGameState().then((state) => {
      if (state) {
        setSavedState(state)
        setPhase('playing')
      } else {
        setPhase('intro')
      }
    })
  }, [])

  const handleNewGame = useCallback(() => {
    resetGameId()
    setSavedState(null)
    setPhase('playing')
  }, [])

  const onGameReady = useCallback(
    (g: GameActions) => {
      setGame(g)
      // Auto-open sprint panel for new games in planning phase
      if (!savedState) {
        setActivePanel('sprint')
      }
    },
    [savedState],
  )

  if (phase === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
      </main>
    )
  }

  if (phase === 'intro') {
    return <IntroScreen onStart={handleNewGame} />
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <GameCanvas savedState={savedState} onGameReady={onGameReady} />

      {snapshot && game && (
        <>
          <HUD snapshot={snapshot} />
          <KanbanOverlay snapshot={snapshot} visible={snapshot.sprint.phase === 'active'} />
          <MenuBar
            snapshot={snapshot}
            game={game}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
          />

          {activePanel === 'sprint' && (
            <SprintPanel snapshot={snapshot} game={game} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'team' && (
            <TeamPanel snapshot={snapshot} game={game} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'practices' && (
            <PracticesPanel snapshot={snapshot} game={game} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'backlog' && (
            <BacklogPanel snapshot={snapshot} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'ship' && (
            <ShipPanel snapshot={snapshot} game={game} onClose={() => setActivePanel(null)} />
          )}
        </>
      )}
    </main>
  )
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white px-6">
      <h1 className="text-5xl font-bold mb-2 tracking-tight">SoftwareDevSim</h1>
      <p className="text-gray-400 text-lg mb-10 text-center max-w-lg">
        You&apos;re the tech lead. Manage a 3-person dev team building an app with AI coding tools.
        Plan sprints, assign stories, and invest in engineering practices.
      </p>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mb-8">
        <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">
          The tension
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          AI makes your team fast at <em>whatever process you already have</em>. Good practices + AI
          = shipping fast with high quality. No practices + AI = generating bad code faster. Your
          job is to build the right process.
        </p>
      </div>

      <button
        onClick={onStart}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-lg transition-colors"
      >
        Start Game
      </button>

      <p className="text-gray-600 text-xs mt-6">
        Tip: Open the Sprint panel to plan your first sprint, then assign stories to your team.
      </p>
    </main>
  )
}
