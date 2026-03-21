import { PersistedGameStateSchema } from './schemas'
import type { GameState } from '../game/types'

export function getGameId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('softwaredevsim-game-id')
  if (!id) {
    id = `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('softwaredevsim-game-id', id)
  }
  return id
}

export function resetGameId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('softwaredevsim-game-id')
  }
}

export async function loadGameState(): Promise<GameState | null> {
  if (typeof window === 'undefined') return null
  const gameId = localStorage.getItem('softwaredevsim-game-id')
  if (!gameId) return null

  try {
    const res = await fetch(`/api/game/${gameId}`)
    if (!res.ok) return null

    const data: unknown = await res.json()
    const result = PersistedGameStateSchema.safeParse(data)
    if (!result.success) return null

    return result.data.state
  } catch {
    return null
  }
}
