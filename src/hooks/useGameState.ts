'use client'

import { useEffect, useRef, useState } from 'react'
import type { GameActions } from '../game'
import type {
  Codebase,
  DeveloperState,
  FeedbackEvent,
  GameClock,
  Practices,
  Sprint,
  UserStory,
} from '../game/types'

export interface GameSnapshot {
  clock: GameClock
  developers: DeveloperState[]
  sprint: Sprint
  backlog: UserStory[]
  codebase: Codebase
  feedback: FeedbackEvent[]
  practices: Practices
}

export function useGameState(game: GameActions | null): GameSnapshot | null {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    if (!game) return

    const interval = setInterval(() => {
      const s = gameRef.current?.getState()
      if (s) {
        setSnapshot({
          clock: s.clock,
          developers: s.developers,
          sprint: s.sprint,
          backlog: s.backlog,
          codebase: s.codebase,
          feedback: s.feedback,
          practices: s.practices,
        })
      }
    }, 250) // Poll 4x/sec for smooth HUD

    return () => clearInterval(interval)
  }, [game])

  return snapshot
}
