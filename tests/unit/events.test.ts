import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CRISIS_CATALOG,
  selectCrisis,
  applyCrisisChoice,
  type CrisisDefinition,
} from '../../src/game/events'
import type { GameState, WorkerState } from '../../src/game/types'

/** Assert that actual is within delta of expected. */
function assertCloseTo(actual: number, expected: number, delta: number) {
  assert.ok(
    Math.abs(actual - expected) <= delta,
    `Expected ${actual} to be within ${delta} of ${expected}`,
  )
}

/** Find a crisis by id — fails the test if not found. */
function findCrisis(id: string): CrisisDefinition {
  const crisis = CRISIS_CATALOG.find((c) => c.id === id)
  assert.ok(crisis, `Crisis '${id}' not found in catalog`)
  return crisis
}

const ROLE_SALARIES: Record<string, number> = {
  developer: 15_000,
  designer: 12_000,
  product_owner: 18_000,
  manager: 20_000,
}

function makeWorker(role: WorkerState['role'], id = 'worker-0'): WorkerState {
  return {
    id,
    name: 'Test',
    role,
    salary: ROLE_SALARIES[role],
    energy: 1,
    currentActivity: 'idle',
    position: [0, 0, 0],
  }
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'running',
    cash: 500_000,
    chosenApp: {
      id: 'fitness',
      name: 'Fitness Tracker',
      description: 'A workout and health tracking app.',
      complexity: 'medium',
      estimatedSprints: 4,
      revenuePotential: 350_000,
    },
    team: [makeWorker('developer', 'w-0'), makeWorker('developer', 'w-1')],
    sprint: { current: 1, total: 4, dayInSprint: 0, daysPerSprint: 5 },
    clock: { day: 6, hour: 9, minute: 0, paused: false, speed: 100 },
    progress: 0.2,
    quality: 0.3,
    result: null,
    seed: 'test-seed',
    pendingCrisis: null,
    crisesResolved: [],
    progressBonus: 0,
    ...overrides,
  }
}

// --- Precondition tests ---

describe('CRISIS_CATALOG preconditions', () => {
  it('tech_debt requires progress >= 0.15', () => {
    const crisis = findCrisis('tech_debt')
    assert.equal(crisis.precondition(makeState({ progress: 0.14 })), false)
    assert.equal(crisis.precondition(makeState({ progress: 0.15 })), true)
    assert.equal(crisis.precondition(makeState({ progress: 0.5 })), true)
  })

  it('star_dev_poached requires devCount >= 2', () => {
    const crisis = findCrisis('star_dev_poached')
    assert.equal(crisis.precondition(makeState({ team: [makeWorker('developer', 'w-0')] })), false)
    assert.equal(
      crisis.precondition(
        makeState({
          team: [makeWorker('developer', 'w-0'), makeWorker('developer', 'w-1')],
        }),
      ),
      true,
    )
  })

  it('scope_creep requires sprint.current >= 1', () => {
    const crisis = findCrisis('scope_creep')
    assert.equal(
      crisis.precondition(
        makeState({ sprint: { current: 0, total: 4, dayInSprint: 0, daysPerSprint: 5 } }),
      ),
      false,
    )
    assert.equal(
      crisis.precondition(
        makeState({ sprint: { current: 1, total: 4, dayInSprint: 0, daysPerSprint: 5 } }),
      ),
      true,
    )
  })

  it('open_source requires devCount >= 1', () => {
    const crisis = findCrisis('open_source')
    assert.equal(crisis.precondition(makeState({ team: [] })), false)
    assert.equal(crisis.precondition(makeState({ team: [makeWorker('developer')] })), true)
  })

  it('burnout requires average energy < 0.5', () => {
    const crisis = findCrisis('burnout')
    // Full energy — not burned out
    assert.equal(crisis.precondition(makeState()), false)
    // Low energy
    const tiredTeam = [
      { ...makeWorker('developer', 'w-0'), energy: 0.3 },
      { ...makeWorker('developer', 'w-1'), energy: 0.2 },
    ]
    assert.equal(crisis.precondition(makeState({ team: tiredTeam })), true)
    // Empty team
    assert.equal(crisis.precondition(makeState({ team: [] })), false)
  })

  it('security_vuln requires progress >= 0.30', () => {
    const crisis = findCrisis('security_vuln')
    assert.equal(crisis.precondition(makeState({ progress: 0.29 })), false)
    assert.equal(crisis.precondition(makeState({ progress: 0.3 })), true)
  })

  it('designer_breakthrough requires designer and quality < 0.8', () => {
    const crisis = findCrisis('designer_breakthrough')
    // No designer
    assert.equal(crisis.precondition(makeState({ team: [makeWorker('developer')] })), false)
    // Has designer, quality too high
    assert.equal(
      crisis.precondition(
        makeState({
          team: [makeWorker('designer')],
          quality: 0.8,
        }),
      ),
      false,
    )
    // Has designer, quality low enough
    assert.equal(
      crisis.precondition(
        makeState({
          team: [makeWorker('designer')],
          quality: 0.79,
        }),
      ),
      true,
    )
  })

  it('investor_interest requires progress >= 0.20', () => {
    const crisis = findCrisis('investor_interest')
    assert.equal(crisis.precondition(makeState({ progress: 0.19 })), false)
    assert.equal(crisis.precondition(makeState({ progress: 0.2 })), true)
  })

  it('cicd_down requires devCount >= 1 and sprint >= 1', () => {
    const crisis = findCrisis('cicd_down')
    assert.equal(crisis.precondition(makeState({ team: [] })), false)
    assert.equal(
      crisis.precondition(
        makeState({
          sprint: { current: 0, total: 4, dayInSprint: 0, daysPerSprint: 5 },
        }),
      ),
      false,
    )
    assert.equal(crisis.precondition(makeState()), true)
  })

  it('manager_micromanagement requires manager and dev', () => {
    const crisis = findCrisis('manager_micromanagement')
    // Needs both a dev and >=2 managers (never leaves player with 0 managers)
    assert.equal(crisis.precondition(makeState({ team: [makeWorker('developer')] })), false)
    assert.equal(crisis.precondition(makeState({ team: [makeWorker('manager')] })), false)
    assert.equal(
      crisis.precondition(
        makeState({
          team: [makeWorker('developer', 'w-0'), makeWorker('manager', 'w-1')],
        }),
      ),
      false,
    )
    assert.equal(
      crisis.precondition(
        makeState({
          team: [
            makeWorker('developer', 'w-0'),
            makeWorker('manager', 'w-1'),
            makeWorker('manager', 'w-2'),
          ],
        }),
      ),
      true,
    )
  })
})

// --- Effect tests ---

describe('crisis effects', () => {
  it('tech_debt refactor increases quality and decreases progress', () => {
    const state = makeState({ progress: 0.2, quality: 0.3 })
    const crisis = findCrisis('tech_debt')
    crisis.applyChoice(state, 'refactor')
    assertCloseTo(state.quality, 0.4, 0.001)
    assertCloseTo(state.progress, 0.15, 0.001)
  })

  it('tech_debt push decreases quality', () => {
    const state = makeState({ quality: 0.3 })
    const crisis = findCrisis('tech_debt')
    crisis.applyChoice(state, 'push')
    assertCloseTo(state.quality, 0.22, 0.001)
  })

  it('star_dev_poached counter-offer costs cash', () => {
    const state = makeState({ cash: 500_000 })
    const crisis = findCrisis('star_dev_poached')
    crisis.applyChoice(state, 'counter')
    assert.equal(state.cash, 475_000)
    assert.equal(state.team.length, 2)
  })

  it('star_dev_poached let_go removes a developer', () => {
    const state = makeState()
    const crisis = findCrisis('star_dev_poached')
    crisis.applyChoice(state, 'let_go')
    assert.equal(state.team.length, 1)
    assert.equal(state.team[0].role, 'developer')
  })

  it('scope_creep accept reduces progress, boosts quality', () => {
    const state = makeState({ progress: 0.3, quality: 0.3 })
    const crisis = findCrisis('scope_creep')
    crisis.applyChoice(state, 'accept')
    assertCloseTo(state.progress, 0.2, 0.001)
    assertCloseTo(state.quality, 0.35, 0.001)
  })

  it('scope_creep push_back has no effect', () => {
    const state = makeState({ progress: 0.3, quality: 0.3 })
    const crisis = findCrisis('scope_creep')
    crisis.applyChoice(state, 'push_back')
    assertCloseTo(state.progress, 0.3, 0.001)
    assertCloseTo(state.quality, 0.3, 0.001)
  })

  it('open_source adopt boosts progress, reduces quality', () => {
    const state = makeState({ progress: 0.2, quality: 0.3 })
    const crisis = findCrisis('open_source')
    crisis.applyChoice(state, 'adopt')
    assertCloseTo(state.progress, 0.28, 0.001)
    assertCloseTo(state.quality, 0.25, 0.001)
  })

  it('open_source build boosts quality', () => {
    const state = makeState({ quality: 0.3 })
    const crisis = findCrisis('open_source')
    crisis.applyChoice(state, 'build')
    assertCloseTo(state.quality, 0.35, 0.001)
  })

  it('burnout rest restores energy and reduces progress', () => {
    const tiredTeam = [
      { ...makeWorker('developer', 'w-0'), energy: 0.2 },
      { ...makeWorker('developer', 'w-1'), energy: 0.3 },
    ]
    const state = makeState({ team: tiredTeam, progress: 0.2 })
    const crisis = findCrisis('burnout')
    crisis.applyChoice(state, 'rest')
    assert.equal(state.team[0].energy, 0.9)
    assert.equal(state.team[1].energy, 0.9)
    assertCloseTo(state.progress, 0.17, 0.001)
  })

  it('burnout push reduces quality', () => {
    const state = makeState({ quality: 0.3 })
    const crisis = findCrisis('burnout')
    crisis.applyChoice(state, 'push')
    assertCloseTo(state.quality, 0.24, 0.001)
  })

  it('security_vuln fix reduces progress', () => {
    const state = makeState({ progress: 0.4 })
    const crisis = findCrisis('security_vuln')
    crisis.applyChoice(state, 'fix')
    assertCloseTo(state.progress, 0.34, 0.001)
  })

  it('security_vuln workaround reduces quality', () => {
    const state = makeState({ quality: 0.5 })
    const crisis = findCrisis('security_vuln')
    crisis.applyChoice(state, 'workaround')
    assertCloseTo(state.quality, 0.4, 0.001)
  })

  it('designer_breakthrough redesign boosts quality, reduces progress', () => {
    const state = makeState({ quality: 0.3, progress: 0.3 })
    const crisis = findCrisis('designer_breakthrough')
    crisis.applyChoice(state, 'redesign')
    assertCloseTo(state.quality, 0.45, 0.001)
    assertCloseTo(state.progress, 0.24, 0.001)
  })

  it('designer_breakthrough stay has no effect', () => {
    const state = makeState({ quality: 0.3, progress: 0.3 })
    const crisis = findCrisis('designer_breakthrough')
    crisis.applyChoice(state, 'stay')
    assertCloseTo(state.quality, 0.3, 0.001)
    assertCloseTo(state.progress, 0.3, 0.001)
  })

  it('investor_interest take_money adds cash, reduces progress', () => {
    const state = makeState({ cash: 100_000, progress: 0.3 })
    const crisis = findCrisis('investor_interest')
    crisis.applyChoice(state, 'take_money')
    assert.equal(state.cash, 140_000)
    assertCloseTo(state.progress, 0.25, 0.001)
  })

  it('investor_interest independent has no effect', () => {
    const state = makeState({ cash: 100_000, progress: 0.3 })
    const crisis = findCrisis('investor_interest')
    crisis.applyChoice(state, 'independent')
    assert.equal(state.cash, 100_000)
    assertCloseTo(state.progress, 0.3, 0.001)
  })

  it('cicd_down fix reduces progress and sets progressBonus', () => {
    const state = makeState({ progress: 0.3, progressBonus: 0 })
    const crisis = findCrisis('cicd_down')
    crisis.applyChoice(state, 'fix')
    assertCloseTo(state.progress, 0.26, 0.001)
    assertCloseTo(state.progressBonus, 0.06, 0.001)
  })

  it('cicd_down manual reduces quality', () => {
    const state = makeState({ quality: 0.5 })
    const crisis = findCrisis('cicd_down')
    crisis.applyChoice(state, 'manual')
    assertCloseTo(state.quality, 0.46, 0.001)
  })

  it('manager_micromanagement coach boosts quality', () => {
    const state = makeState({
      quality: 0.3,
      team: [
        makeWorker('developer', 'w-0'),
        makeWorker('manager', 'w-1'),
        makeWorker('manager', 'w-2'),
      ],
    })
    const crisis = findCrisis('manager_micromanagement')
    crisis.applyChoice(state, 'coach')
    assertCloseTo(state.quality, 0.35, 0.001)
    assert.equal(state.team.length, 3)
  })

  it('manager_micromanagement let_go removes a manager', () => {
    const state = makeState({
      team: [
        makeWorker('developer', 'w-0'),
        makeWorker('manager', 'w-1'),
        makeWorker('manager', 'w-2'),
      ],
    })
    const crisis = findCrisis('manager_micromanagement')
    crisis.applyChoice(state, 'let_go')
    assert.equal(state.team.length, 2)
    assert.equal(state.team.filter((w) => w.role === 'manager').length, 1)
  })
})

// --- Clamping tests ---

describe('effect clamping', () => {
  it('quality never exceeds 1', () => {
    const state = makeState({ quality: 0.98 })
    const crisis = findCrisis('designer_breakthrough')
    crisis.applyChoice(state, 'redesign')
    assert.equal(state.quality, 1)
  })

  it('quality never goes below 0', () => {
    const state = makeState({ quality: 0.02 })
    const crisis = findCrisis('security_vuln')
    crisis.applyChoice(state, 'workaround')
    assert.equal(state.quality, 0)
  })

  it('progress never goes below 0', () => {
    const state = makeState({ progress: 0.02, quality: 0.3 })
    const crisis = findCrisis('scope_creep')
    crisis.applyChoice(state, 'accept')
    assert.equal(state.progress, 0)
  })

  it('progress never exceeds 1', () => {
    const state = makeState({ progress: 0.98 })
    const crisis = findCrisis('open_source')
    crisis.applyChoice(state, 'adopt')
    assert.equal(state.progress, 1)
  })
})

// --- Selection tests ---

describe('selectCrisis', () => {
  it('returns a crisis when preconditions are met', () => {
    const state = makeState()
    const crisis = selectCrisis(state)
    assert.ok(crisis, 'Expected a crisis to be selected')
    assert.ok(crisis.id.length > 0)
    assert.ok(crisis.choices.length >= 2)
  })

  it('returns null when no preconditions are met', () => {
    const state = makeState({
      team: [],
      progress: 0,
      quality: 0,
      sprint: { current: 0, total: 4, dayInSprint: 0, daysPerSprint: 5 },
    })
    const crisis = selectCrisis(state)
    assert.equal(crisis, null)
  })

  it('excludes already-resolved crises', () => {
    // Resolve all crises except one
    const allIds = CRISIS_CATALOG.map((c) => c.id)
    const state = makeState({
      crisesResolved: allIds.filter((id) => id !== 'tech_debt'),
      progress: 0.5,
    })
    const crisis = selectCrisis(state)
    if (crisis) {
      assert.equal(crisis.id, 'tech_debt')
    }
    // If null, it means tech_debt precondition wasn't met — that's fine
  })

  it('is deterministic with the same seed and sprint', () => {
    const state1 = makeState({ seed: 'deterministic', progress: 0.5 })
    const state2 = makeState({ seed: 'deterministic', progress: 0.5 })
    const crisis1 = selectCrisis(state1)
    const crisis2 = selectCrisis(state2)
    assert.deepEqual(crisis1, crisis2)
  })

  it('produces different results for different seeds', () => {
    // Run multiple seeds and check we get at least 2 different crises
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const state = makeState({
        seed: `seed-${i}`,
        progress: 0.5,
        quality: 0.3,
        team: [
          makeWorker('developer', 'w-0'),
          makeWorker('developer', 'w-1'),
          makeWorker('designer', 'w-2'),
          makeWorker('manager', 'w-3'),
        ],
      })
      const crisis = selectCrisis(state)
      if (crisis) results.add(crisis.id)
    }
    assert.ok(results.size >= 2, `Expected variety but got: ${[...results].join(', ')}`)
  })

  it('sets triggeredAtSprint correctly', () => {
    const state = makeState({
      sprint: { current: 2, total: 4, dayInSprint: 0, daysPerSprint: 5 },
      progress: 0.5,
    })
    const crisis = selectCrisis(state)
    if (crisis) {
      assert.equal(crisis.triggeredAtSprint, 2)
    }
  })
})

// --- applyCrisisChoice integration ---

describe('applyCrisisChoice', () => {
  it('applies choice, clears pending, adds to resolved', () => {
    const state = makeState({ progress: 0.3 })
    const crisis = selectCrisis(state)
    assert.ok(crisis, 'Expected a crisis to be selected')
    state.pendingCrisis = crisis

    const summary = applyCrisisChoice(state, crisis.choices[0].id)
    assert.ok(summary.length > 0)
    assert.equal(state.pendingCrisis, null)
    assert.ok(state.crisesResolved.includes(crisis.id))
  })

  it('returns empty string when no pending crisis', () => {
    const state = makeState()
    const summary = applyCrisisChoice(state, 'whatever')
    assert.equal(summary, '')
  })

  it('returns empty string for unknown crisis id', () => {
    const state = makeState()
    state.pendingCrisis = {
      id: 'nonexistent',
      title: 'X',
      narrative: 'X',
      choices: [
        { id: 'a', label: 'A', description: 'A' },
        { id: 'b', label: 'B', description: 'B' },
      ],
      triggeredAtSprint: 1,
    }
    const summary = applyCrisisChoice(state, 'a')
    assert.equal(summary, '')
  })

  it('returns empty string for invalid choiceId', () => {
    const state = makeState({ progress: 0.3 })
    const crisis = selectCrisis(state)
    assert.ok(crisis, 'Expected a crisis to be selected')
    state.pendingCrisis = crisis

    const summary = applyCrisisChoice(state, 'bogus_choice')
    assert.equal(summary, '')
    // Crisis should NOT be resolved when choice is invalid
    assert.ok(state.pendingCrisis, 'Crisis should still be pending')
  })
})

// --- Catalog integrity ---

describe('CRISIS_CATALOG integrity', () => {
  it('has 10 crises', () => {
    assert.equal(CRISIS_CATALOG.length, 10)
  })

  it('all crises have unique ids', () => {
    const ids = CRISIS_CATALOG.map((c) => c.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('all crises have at least 2 choices', () => {
    for (const crisis of CRISIS_CATALOG) {
      assert.ok(crisis.choices.length >= 2, `${crisis.id} has fewer than 2 choices`)
    }
  })

  it('all choice ids within a crisis are unique', () => {
    for (const crisis of CRISIS_CATALOG) {
      const choiceIds = crisis.choices.map((c) => c.id)
      assert.equal(
        new Set(choiceIds).size,
        choiceIds.length,
        `${crisis.id} has duplicate choice ids`,
      )
    }
  })
})
