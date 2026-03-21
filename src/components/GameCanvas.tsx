'use client'

import { useEffect, useRef } from 'react'
import type { GameActions } from '../game'
import type { GameState } from '../game/types'

interface GameCanvasProps {
  savedState: GameState | null
  onGameReady: (game: GameActions) => void
}

/** Pixel distance between two 2D points */
function dist2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

/** Distance between two touches */
function getTouchDistance(touches: TouchList): number {
  return dist2D(touches[0].clientX, touches[0].clientY, touches[1].clientX, touches[1].clientY)
}

/** Angle in radians of the line between two touches */
function getTouchAngle(touches: TouchList): number {
  return Math.atan2(
    touches[1].clientY - touches[0].clientY,
    touches[1].clientX - touches[0].clientX,
  )
}

/** Pixel movement threshold before we start panning */
const PAN_THRESHOLD = 8

export default function GameCanvas({ savedState, onGameReady }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameActions | null>(null)
  const onGameReadyRef = useRef(onGameReady)
  onGameReadyRef.current = onGameReady

  // Capture savedState at mount time so effect doesn't re-run
  const savedStateRef = useRef(savedState)

  // Touch gesture state (not React state — avoids re-renders)
  const touchStateRef = useRef<{
    type: 'none' | 'pan' | 'pinch'
    lastX: number
    lastY: number
    lastDist: number
    lastAngle: number
    startX: number
    startY: number
  }>({ type: 'none', lastX: 0, lastY: 0, lastDist: 0, lastAngle: 0, startX: 0, startY: 0 })

  // Mouse drag state
  const mouseStateRef = useRef<{
    isDown: boolean
    isPanning: boolean
    button: number // 0 = left (pan), 2 = right (rotate)
    lastX: number
    lastY: number
    startX: number
    startY: number
  }>({ isDown: false, isPanning: false, button: 0, lastX: 0, lastY: 0, startX: 0, startY: 0 })

  // Initialize game
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

      // Expose game instance for E2E testing
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).__game = game
      }
    })

    return () => {
      cancelled = true
      gameRef.current?.stop()
      gameRef.current = null
    }
  }, [])

  // Native touch event listeners (non-passive so we can preventDefault)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onTouchStart(e: TouchEvent): void {
      e.preventDefault()
      const state = touchStateRef.current

      if (e.touches.length === 1) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        state.type = 'none'
        state.lastX = x
        state.lastY = y
        state.startX = x
        state.startY = y
      } else if (e.touches.length === 2) {
        state.type = 'pinch'
        state.lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        state.lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        state.lastDist = getTouchDistance(e.touches)
        state.lastAngle = getTouchAngle(e.touches)
      }
    }

    function onTouchMove(e: TouchEvent): void {
      e.preventDefault()
      const game = gameRef.current
      if (!game) return
      const state = touchStateRef.current

      if (e.touches.length === 1) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY

        // Check threshold before entering pan mode
        if (state.type === 'none') {
          if (dist2D(x, y, state.startX, state.startY) > PAN_THRESHOLD) {
            state.type = 'pan'
            state.lastX = x
            state.lastY = y
          }
          return
        }

        if (state.type === 'pan') {
          const dx = x - state.lastX
          const dy = y - state.lastY
          game.applyPanDeltaPixels(dx, dy)
          state.lastX = x
          state.lastY = y
        }
      } else if (state.type === 'pinch' && e.touches.length === 2) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const dist = getTouchDistance(e.touches)
        const angle = getTouchAngle(e.touches)

        // Zoom by scale factor relative to previous frame
        if (state.lastDist > 0) {
          game.applyZoomScale(dist / state.lastDist)
        }

        // Rotate by the angular change between fingers
        const dAngle = angle - state.lastAngle
        if (Math.abs(dAngle) < Math.PI) {
          game.applyRotationDelta(-dAngle)
        }

        // Also pan by midpoint movement so the pinch center stays fixed
        const dx = midX - state.lastX
        const dy = midY - state.lastY
        game.applyPanDeltaPixels(dx, dy)

        state.lastDist = dist
        state.lastAngle = angle
        state.lastX = midX
        state.lastY = midY
      }
    }

    function onTouchEnd(e: TouchEvent): void {
      e.preventDefault()
      const state = touchStateRef.current
      if (e.touches.length === 1) {
        // Transition from pinch back to single-finger pan
        state.type = 'pan'
        state.lastX = e.touches[0].clientX
        state.lastY = e.touches[0].clientY
      } else if (e.touches.length === 0) {
        state.type = 'none'
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // Mouse drag and wheel — desktop pan/zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onMouseDown(e: MouseEvent): void {
      // Left button (0) = pan, right button (2) = rotate
      if (e.button !== 0 && e.button !== 2) return
      mouseStateRef.current = {
        isDown: true,
        isPanning: false,
        button: e.button,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      }
    }

    function onContextMenu(e: MouseEvent): void {
      e.preventDefault()
    }

    function onMouseMove(e: MouseEvent): void {
      const state = mouseStateRef.current
      if (!state.isDown) return
      const game = gameRef.current
      if (!game) return

      // Check threshold before entering drag mode
      if (!state.isPanning) {
        if (dist2D(e.clientX, e.clientY, state.startX, state.startY) > PAN_THRESHOLD) {
          state.isPanning = true
          if (container) container.style.cursor = state.button === 2 ? 'ew-resize' : 'grabbing'
          // Snap to current position so the first delta isn't huge
          state.lastX = e.clientX
          state.lastY = e.clientY
        }
        return
      }

      const dx = e.clientX - state.lastX
      const dy = e.clientY - state.lastY

      if (state.button === 2) {
        // Right-click drag: rotate (horizontal movement maps to Y-axis rotation)
        const ROTATE_SPEED = 0.005
        game.applyRotationDelta(dx * ROTATE_SPEED)
      } else {
        // Left-click drag: pan
        game.applyPanDeltaPixels(dx, dy)
      }

      state.lastX = e.clientX
      state.lastY = e.clientY
    }

    function onMouseUp(): void {
      mouseStateRef.current.isDown = false
      mouseStateRef.current.isPanning = false
      if (container) container.style.cursor = 'grab'
    }

    function onWheel(e: WheelEvent): void {
      e.preventDefault()
      const game = gameRef.current
      if (!game) return
      // Scroll up (deltaY < 0) → zoom in; scroll down → zoom out
      const factor = Math.pow(0.999, e.deltaY)
      game.applyZoomScale(factor)
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        touchAction: 'none',
        cursor: 'grab',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
