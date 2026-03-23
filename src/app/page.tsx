'use client'

import { useCallback, useMemo, useState } from 'react'
import GameCanvas from '../components/GameCanvas'
import FeedbackFab from '../components/FeedbackFab'
import { useGameState } from '../hooks/useGameState'
import type { GameActions } from '../game'
import { APP_CHOICES, ROLE_SALARIES, ROLE_LABELS, STARTING_CASH, TOTAL_SPRINTS } from '../game'
import type { AppChoice, GameResult, GameState, Role, WorkerState } from '../game/types'

// --- Name pools for hired workers ---
const NAMES: Record<Role, string[]> = {
  developer: ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan'],
  designer: ['Avery', 'Quinn', 'Blake', 'Drew', 'Sage', 'Reese'],
  product_owner: ['Taylor', 'Cameron', 'Jamie', 'Rowan', 'Hayden', 'Emery'],
  manager: ['Parker', 'Spencer', 'Kendall', 'Logan', 'Devon', 'Finley'],
}

/** Starting positions for workers — first 4 at desks, rest near meeting area. */
function startPosition(index: number): [number, number, number] {
  const deskPositions: [number, number, number][] = [
    [3.5, 0, 1.5],
    [7.5, 0, 1.5],
    [15.5, 0, 1.5],
    [19.5, 0, 1.5],
  ]
  if (index < 4) return deskPositions[index]
  // Overflow near meeting area / coffee
  return [3 + (index - 4) * 2, 0, 10]
}

function buildTeamStates(roster: { role: Role; count: number }[]): WorkerState[] {
  const workers: WorkerState[] = []
  let globalIdx = 0

  for (const entry of roster) {
    for (let i = 0; i < entry.count; i++) {
      const namePool = NAMES[entry.role]
      workers.push({
        id: `worker-${globalIdx}`,
        name: namePool[i % namePool.length],
        role: entry.role,
        salary: ROLE_SALARIES[entry.role],
        energy: 1,
        currentActivity: 'idle',
        position: startPosition(globalIdx),
      })
      globalIdx++
    }
  }

  return workers
}

// --- Main page ---

export default function Home() {
  const [game, setGame] = useState<GameActions | null>(null)
  const snapshot = useGameState(game)

  const onGameReady = useCallback((g: GameActions) => {
    setGame(g)
  }, [])

  const phase = snapshot?.phase ?? game?.state.phase ?? 'title'

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-gray-900">
      {/* 3D canvas always renders in the background */}
      <GameCanvas onGameReady={onGameReady} />

      {/* UI overlays based on game phase */}
      {phase === 'title' && game && <TitleScreen game={game} />}
      {phase === 'choose_app' && game && <AppSelectScreen game={game} />}
      {phase === 'hire_team' && game && snapshot && (
        <HireTeamScreen game={game} cash={snapshot.cash} chosenApp={snapshot.chosenApp} />
      )}
      {phase === 'running' && snapshot && game && <SprintOverlay snapshot={snapshot} game={game} />}
      {phase === 'ended' && snapshot?.result && game && (
        <EndScreen result={snapshot.result} game={game} />
      )}
    </main>
  )
}

// --- Title Screen ---

function TitleScreen({ game }: { game: GameActions }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
      <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">SoftwareDevSim</h1>
      <p className="text-gray-400 text-lg mb-10 text-center max-w-lg px-6">
        You have ${STARTING_CASH.toLocaleString()} to build an app. Choose wisely, hire your team,
        and see what ships after {TOTAL_SPRINTS} sprints.
      </p>
      <button
        onClick={() => {
          game.state.phase = 'choose_app'
        }}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-lg transition-colors"
      >
        Start Game
      </button>
    </div>
  )
}

// --- App Selection Screen ---

function AppSelectScreen({ game }: { game: GameActions }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10 px-4">
      <h2 className="text-3xl font-bold text-white mb-2">Choose Your App</h2>
      <p className="text-gray-400 mb-8 text-center">
        Pick what to build. You have {TOTAL_SPRINTS} sprints to ship.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {APP_CHOICES.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onSelect={() => {
              game.state.chosenApp = app
              game.state.phase = 'hire_team'
            }}
          />
        ))}
      </div>
    </div>
  )
}

function AppCard({ app, onSelect }: { app: AppChoice; onSelect: () => void }) {
  const complexityColor = {
    simple: 'text-green-400',
    medium: 'text-yellow-400',
    complex: 'text-red-400',
  }[app.complexity]

  return (
    <button
      onClick={onSelect}
      className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-left hover:border-blue-500 hover:bg-gray-750 transition-colors"
    >
      <h3 className="text-xl font-semibold text-white mb-1">{app.name}</h3>
      <p className="text-gray-400 text-sm mb-3">{app.description}</p>
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-gray-500">Complexity: </span>
          <span className={complexityColor}>{app.complexity}</span>
        </div>
        <div>
          <span className="text-gray-500">Estimated: </span>
          <span className="text-white">{app.estimatedSprints} sprints</span>
        </div>
        <div>
          <span className="text-gray-500">Revenue potential: </span>
          <span className="text-emerald-400">${app.revenuePotential.toLocaleString()}</span>
        </div>
      </div>
    </button>
  )
}

// --- Hire Team Screen ---

const ROLES: Role[] = ['developer', 'designer', 'product_owner', 'manager']

function HireTeamScreen({
  game,
  cash,
  chosenApp,
}: {
  game: GameActions
  cash: number
  chosenApp: AppChoice | null
}) {
  const [counts, setCounts] = useState<Record<Role, number>>({
    developer: 0,
    designer: 0,
    product_owner: 0,
    manager: 0,
  })

  const totalPerSprint = useMemo(
    () => ROLES.reduce((sum, role) => sum + counts[role] * ROLE_SALARIES[role], 0),
    [counts],
  )

  const totalCost = totalPerSprint * TOTAL_SPRINTS
  const overBudget = totalCost > cash
  const teamSize = Object.values(counts).reduce((a, b) => a + b, 0)

  function adjust(role: Role, delta: number) {
    setCounts((prev) => ({
      ...prev,
      [role]: Math.max(0, Math.min(6, prev[role] + delta)),
    }))
  }

  function startGame() {
    if (teamSize === 0 || overBudget) return

    const roster = ROLES.map((role) => ({ role, count: counts[role] })).filter((r) => r.count > 0)
    const workers = buildTeamStates(roster)

    game.state.team = workers
    game.state.cash = cash - totalCost
    game.state.phase = 'running'
    game.state.clock.paused = false
    game.state.clock.speed = 100

    game.spawnWorkers(workers)
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10 px-4">
      <h2 className="text-3xl font-bold text-white mb-1">Hire Your Team</h2>
      {chosenApp && (
        <p className="text-gray-400 mb-6">
          Building: <span className="text-blue-400 font-medium">{chosenApp.name}</span>
        </p>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mb-6">
        {ROLES.map((role) => (
          <div
            key={role}
            className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
          >
            <div>
              <div className="text-white font-medium">{ROLE_LABELS[role]}</div>
              <div className="text-gray-500 text-sm">
                ${ROLE_SALARIES[role].toLocaleString()}/sprint
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjust(role, -1)}
                disabled={counts[role] === 0}
                className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-white text-lg font-mono w-4 text-center">{counts[role]}</span>
              <button
                onClick={() => adjust(role, 1)}
                disabled={counts[role] >= 6}
                className="w-8 h-8 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Budget summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md w-full mb-6 text-sm">
        <div className="flex justify-between text-gray-400 mb-1">
          <span>Per sprint:</span>
          <span className="text-white">${totalPerSprint.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-400 mb-1">
          <span>Total ({TOTAL_SPRINTS} sprints):</span>
          <span className={overBudget ? 'text-red-400' : 'text-white'}>
            ${totalCost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-gray-400 border-t border-gray-600 pt-1 mt-1">
          <span>Budget:</span>
          <span className="text-emerald-400">${cash.toLocaleString()}</span>
        </div>
        {overBudget && <p className="text-red-400 text-xs mt-2">Over budget! Reduce your team.</p>}
      </div>

      <button
        onClick={startGame}
        disabled={teamSize === 0 || overBudget}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Development
      </button>
      {teamSize === 0 && (
        <p className="text-gray-500 text-xs mt-3">Hire at least one team member.</p>
      )}
    </div>
  )
}

// --- Sprint HUD (during auto-play) ---

const SPEED_OPTIONS = [
  { speed: 50, label: '\u203A', title: 'Slow' },
  { speed: 100, label: '\u00BB', title: 'Normal' },
  { speed: 250, label: '\u00BB\u203A', title: 'Fast' },
  { speed: 500, label: '\u00BB\u00BB', title: 'Very Fast' },
] as const

function SprintOverlay({ snapshot, game }: { snapshot: GameState; game: GameActions }) {
  const { sprint, progress, quality, chosenApp, team, clock } = snapshot
  const paused = clock.paused
  const sprintNum = sprint.current + 1
  const dayProgress = sprint.dayInSprint / sprint.daysPerSprint

  // Team composition summary
  const roleCounts = {
    developer: team.filter((w) => w.role === 'developer').length,
    designer: team.filter((w) => w.role === 'designer').length,
    product_owner: team.filter((w) => w.role === 'product_owner').length,
    manager: team.filter((w) => w.role === 'manager').length,
  }

  const togglePause = () => {
    game.state.clock.paused = !game.state.clock.paused
  }

  const setSpeed = (speed: number) => {
    game.state.clock.speed = speed
  }

  return (
    <>
      {/* Top HUD bar — z-30 so the button stays above the z-20 pause overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="bg-gray-900/90 border-b border-gray-700/50 backdrop-blur-sm px-4 py-3">
          <div className="max-w-2xl mx-auto">
            {/* Title row: app name + sprint */}
            <div className="flex items-center gap-3 mb-2">
              {chosenApp && (
                <span className="text-blue-400 font-semibold text-sm">{chosenApp.name}</span>
              )}
              <span className="text-gray-600 text-sm">|</span>
              <span className="text-white font-bold">Sprint {sprintNum}</span>
              <span className="text-gray-500 text-sm">of {sprint.total}</span>
            </div>

            {/* Controls row: day + speed + pause */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">
                Day {sprint.dayInSprint + 1} / {sprint.daysPerSprint}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center pointer-events-auto">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.speed}
                      onClick={() => setSpeed(opt.speed)}
                      title={opt.title}
                      className={`px-2.5 py-1.5 text-xs font-semibold transition-colors first:rounded-l-md last:rounded-r-md border-r border-gray-600 last:border-r-0 ${
                        clock.speed === opt.speed
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={togglePause}
                  className={`pointer-events-auto px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    paused
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {paused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </div>

            {/* Sprint day progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sprint progress</span>
                <span>{Math.round(dayProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dayProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Overall app progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>App completion</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
            </div>

            {/* Bottom stats row */}
            <div className="flex items-center justify-between text-xs">
              {/* Team composition */}
              <div className="flex items-center gap-3 text-gray-400">
                {roleCounts.developer > 0 && (
                  <span>
                    <span className="text-blue-400">{roleCounts.developer}</span> Dev
                    {roleCounts.developer !== 1 ? 's' : ''}
                  </span>
                )}
                {roleCounts.designer > 0 && (
                  <span>
                    <span className="text-pink-400">{roleCounts.designer}</span> Designer
                    {roleCounts.designer !== 1 ? 's' : ''}
                  </span>
                )}
                {roleCounts.product_owner > 0 && (
                  <span>
                    <span className="text-amber-400">{roleCounts.product_owner}</span> PO
                    {roleCounts.product_owner !== 1 ? 's' : ''}
                  </span>
                )}
                {roleCounts.manager > 0 && (
                  <span>
                    <span className="text-gray-300">{roleCounts.manager}</span> Mgr
                    {roleCounts.manager !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Quality indicator */}
              <div className="text-gray-400">
                Quality:{' '}
                <span
                  className={
                    quality >= 0.6
                      ? 'text-emerald-400'
                      : quality >= 0.3
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {Math.round(quality * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paused overlay */}
      {paused && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Dim overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* PAUSED badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-white/60 text-4xl font-bold tracking-widest select-none">
              PAUSED
            </span>
          </div>
        </div>
      )}

      {/* Feedback FAB — only visible when paused */}
      {paused && <FeedbackFab />}

      {/* Sprint milestone dots at bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-10 pointer-events-none">
        <div className="flex justify-center gap-2">
          {Array.from({ length: sprint.total }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i < sprint.current
                  ? 'bg-emerald-500 border-emerald-400'
                  : i === sprint.current
                    ? 'bg-blue-500 border-blue-400 animate-pulse'
                    : 'bg-gray-700 border-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// --- End Screen ---

function EndScreen({ result, game }: { result: GameResult; game: GameActions }) {
  const gradeColors: Record<string, string> = {
    S: 'text-purple-400',
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-yellow-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  }

  function handleRetry() {
    // Reset game state for a new round
    game.state.phase = 'title'
    game.state.cash = STARTING_CASH
    game.state.chosenApp = null
    game.state.team = []
    game.state.sprint = { current: 0, total: 4, dayInSprint: 0, daysPerSprint: 5 }
    game.state.progress = 0
    game.state.quality = 0
    game.state.result = null
    game.state.clock.paused = true
    game.state.clock.speed = 100
    game.state.clock.day = 1
    game.state.clock.hour = 9
    game.state.clock.minute = 0
    game.clearWorkers()
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/85 z-10 px-4">
      <div className="max-w-md w-full">
        {/* Grade */}
        <div className="text-center mb-6">
          <div className={`text-8xl font-black ${gradeColors[result.grade] ?? 'text-white'}`}>
            {result.grade}
          </div>
          <p className="text-gray-400 mt-2">{result.featuresShipped}</p>
        </div>

        {/* Breakdown */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 mb-6">
          <h3 className="text-white font-semibold mb-3">Results Breakdown</h3>
          <div className="space-y-2 text-sm">
            <Row label="Completion" value={`${Math.round(result.completion * 100)}%`} />
            <Row label="Quality" value={`${Math.round(result.quality * 100)}%`} />
            <Row
              label="Total Cost"
              value={`$${result.totalCost.toLocaleString()}`}
              color="text-red-400"
            />
            <Row
              label="Revenue"
              value={`$${result.revenue.toLocaleString()}`}
              color="text-emerald-400"
            />
            <div className="border-t border-gray-600 pt-2">
              <Row
                label="ROI"
                value={`${result.roi >= 0 ? '+' : ''}${Math.round(result.roi)}%`}
                color={result.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleRetry}
          className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={color ?? 'text-white'}>{value}</span>
    </div>
  )
}
