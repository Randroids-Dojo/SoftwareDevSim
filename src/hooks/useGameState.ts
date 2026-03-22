'use client'

import { useEffect, useRef, useState } from 'react'
import type { GameActions } from '../game'
import type { GameState } from '../game/types'

export function useGameState(game: GameActions | null): GameState | null {
  const [snapshot, setSnapshot] = useState<GameState | null>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    if (!game) return

    const interval = setInterval(() => {
      const s = gameRef.current?.getState()
      if (s) setSnapshot(s)
    }, 250) // Poll 4x/sec

    return () => clearInterval(interval)
  }, [game])

  return snapshot
}
