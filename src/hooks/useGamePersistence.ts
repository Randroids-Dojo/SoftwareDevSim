'use client'

import { useEffect, useRef } from 'react'
import type { GameActions } from '../game'
import { getGameId } from '../lib/persistence'

const SAVE_INTERVAL_MS = 30_000

export function useGamePersistence(game: GameActions | null) {
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    if (!game) return

    const gameId = getGameId()
    if (!gameId) return

    async function save() {
      const g = gameRef.current
      if (!g) return

      const state = g.getState()
      try {
        await fetch(`/api/game/${gameId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        })
      } catch {
        // Silent failure — will retry on next interval
      }
    }

    const interval = setInterval(save, SAVE_INTERVAL_MS)

    // Save on unload
    function onUnload() {
      const g = gameRef.current
      if (!g) return
      const state = g.getState()
      const blob = new Blob([JSON.stringify(state)], { type: 'application/json' })
      navigator.sendBeacon(`/api/game/${gameId}`, blob)
    }

    window.addEventListener('beforeunload', onUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [game])
}
