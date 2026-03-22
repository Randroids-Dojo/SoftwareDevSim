'use client'

import type { GameSnapshot } from '../hooks/useGameState'
import type { GameActions } from '../game'

type Panel = 'sprint' | 'team' | 'backlog' | 'practices' | 'ship' | null

interface MenuBarProps {
  snapshot: GameSnapshot
  game: GameActions
  activePanel: Panel
  setActivePanel: (panel: Panel) => void
}

function MenuButton({
  label,
  active,
  onClick,
  disabled,
  badge,
  pulse,
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
  badge?: string
  pulse?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative px-4 py-2 text-sm font-medium rounded transition-colors ${
        active
          ? 'bg-gray-700 text-white'
          : pulse
            ? 'bg-blue-900/80 text-blue-200 hover:bg-blue-800/80 animate-pulse'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
      {badge && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  )
}

export default function MenuBar({ snapshot, game, activePanel, setActivePanel }: MenuBarProps) {
  const toggle = (panel: Panel) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  const backlogCount = snapshot.backlog.filter((s) => s.status === 'backlog').length
  const isPlannable = snapshot.sprint.phase === 'planning'
  const isShippable = snapshot.sprint.phase === 'review' || snapshot.sprint.phase === 'active'

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
      <div
        className="flex items-center justify-center gap-1 px-4 py-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        <MenuButton
          label="Sprint"
          active={activePanel === 'sprint'}
          onClick={() => toggle('sprint')}
          badge={isPlannable ? '!' : undefined}
          pulse={isPlannable && activePanel !== 'sprint'}
        />
        <MenuButton label="Team" active={activePanel === 'team'} onClick={() => toggle('team')} />
        <MenuButton
          label="Backlog"
          active={activePanel === 'backlog'}
          onClick={() => toggle('backlog')}
          badge={backlogCount > 0 ? String(backlogCount) : undefined}
        />
        <MenuButton
          label="Practices"
          active={activePanel === 'practices'}
          onClick={() => toggle('practices')}
        />
        <MenuButton
          label="Ship"
          active={activePanel === 'ship'}
          onClick={() => toggle('ship')}
          disabled={!isShippable}
        />

        {/* Speed controls */}
        <div className="ml-4 flex items-center gap-1">
          <button
            onClick={() => game.setPaused(!snapshot.clock.paused)}
            className={`px-3 py-1 text-xs rounded ${snapshot.clock.paused ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {snapshot.clock.paused ? 'PAUSED' : 'PAUSE'}
          </button>
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => game.setSpeed(s)}
              className={`px-2 py-1 text-xs rounded ${snapshot.clock.speed === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
