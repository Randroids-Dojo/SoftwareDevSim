'use client'

import { useEffect, useRef } from 'react'
import type { GameActions } from '../game'
import type { GameState } from '../game/types'

interface GameCanvasProps {
  savedState: GameState | null
  onGameReady: (game: GameActions) => void
}

export default function GameCanvas({ savedState, onGameReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameActions | null>(null)
  const onGameReadyRef = useRef(onGameReady)
  onGameReadyRef.current = onGameReady

  // Capture savedState at mount time so effect doesn't re-run
  const savedStateRef = useRef(savedState)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gameRef.current) return

    let cancelled = false

    import('../game').then(({ createGame }) => {
      if (cancelled) return
      const game = createGame(canvas, savedStateRef.current ?? undefined)
      gameRef.current = game
      game.start()
      onGameReadyRef.current(game)
    })

    return () => {
      cancelled = true
      gameRef.current?.stop()
      gameRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
