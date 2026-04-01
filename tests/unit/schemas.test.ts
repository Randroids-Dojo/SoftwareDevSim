import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  RoleSchema,
  ActivityStateSchema,
  GamePhaseSchema,
  GradeSchema,
  ComplexitySchema,
  Vec3Schema,
  WorkerStateSchema,
  AppChoiceSchema,
  SprintStateSchema,
  GameClockSchema,
  CrisisChoiceSchema,
  CrisisSchema,
  GameResultSchema,
  GameStateSchema,
} from '../../src/lib/schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validWorker() {
  return {
    id: 'w1',
    name: 'Alice',
    role: 'developer' as const,
    salary: 15000,
    energy: 0.8,
    currentActivity: 'idle' as const,
    position: [0, 0, 0] as [number, number, number],
  }
}

function validAppChoice() {
  return {
    id: 'app1',
    name: 'Cool App',
    description: 'A cool app',
    complexity: 'medium' as const,
    estimatedSprints: 3,
    revenuePotential: 50000,
  }
}

function validSprint() {
  return {
    current: 0,
    total: 4 as const,
    dayInSprint: 0,
    daysPerSprint: 5 as const,
  }
}

function validClock() {
  return {
    day: 1,
    hour: 9,
    minute: 30,
    paused: false,
    speed: 100,
  }
}

function validGameResult() {
  return {
    grade: 'B' as const,
    completion: 0.75,
    quality: 0.8,
    totalCost: 100000,
    revenue: 200000,
    roi: 1.0,
    featuresShipped: '3/4',
  }
}

function validCrisisChoice() {
  return {
    id: 'fix',
    label: 'Fix Now',
    description: 'Patch it immediately',
  }
}

function validCrisis() {
  return {
    id: 'security_vuln',
    title: 'Critical Security Vulnerability',
    narrative: 'A security audit reveals a critical vulnerability.',
    choices: [validCrisisChoice(), { id: 'skip', label: 'Skip', description: 'Ship anyway' }],
    triggeredAtSprint: 1,
  }
}

function validGameState() {
  return {
    phase: 'running' as const,
    cash: 50000,
    chosenApp: validAppChoice(),
    team: [validWorker()],
    sprint: validSprint(),
    clock: validClock(),
    progress: 0.5,
    quality: 0.7,
    result: null,
    seed: 'abc123',
    pendingCrisis: null,
    crisisOutcome: null,
    crisesResolved: [] as string[],
    progressBonus: 0,
  }
}

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

describe('RoleSchema', () => {
  for (const v of ['developer', 'designer', 'product_owner', 'manager'] as const) {
    it(`accepts "${v}"`, () => {
      assert.equal(RoleSchema.safeParse(v).success, true)
    })
  }
  it('rejects invalid value', () => {
    assert.equal(RoleSchema.safeParse('intern').success, false)
  })
  it('rejects empty string', () => {
    assert.equal(RoleSchema.safeParse('').success, false)
  })
})

describe('ActivityStateSchema', () => {
  for (const v of ['idle', 'moving', 'working', 'meeting', 'break', 'standup'] as const) {
    it(`accepts "${v}"`, () => {
      assert.equal(ActivityStateSchema.safeParse(v).success, true)
    })
  }
  it('rejects invalid value', () => {
    assert.equal(ActivityStateSchema.safeParse('sleeping').success, false)
  })
})

describe('GamePhaseSchema', () => {
  for (const v of ['title', 'choose_app', 'hire_team', 'running', 'ended'] as const) {
    it(`accepts "${v}"`, () => {
      assert.equal(GamePhaseSchema.safeParse(v).success, true)
    })
  }
  it('rejects invalid value', () => {
    assert.equal(GamePhaseSchema.safeParse('paused').success, false)
  })
})

describe('GradeSchema', () => {
  for (const v of ['S', 'A', 'B', 'C', 'D', 'F'] as const) {
    it(`accepts "${v}"`, () => {
      assert.equal(GradeSchema.safeParse(v).success, true)
    })
  }
  it('rejects invalid value', () => {
    assert.equal(GradeSchema.safeParse('E').success, false)
  })
})

describe('ComplexitySchema', () => {
  for (const v of ['simple', 'medium', 'complex'] as const) {
    it(`accepts "${v}"`, () => {
      assert.equal(ComplexitySchema.safeParse(v).success, true)
    })
  }
  it('rejects invalid value', () => {
    assert.equal(ComplexitySchema.safeParse('extreme').success, false)
  })
})

// ---------------------------------------------------------------------------
// Vec3Schema
// ---------------------------------------------------------------------------

describe('Vec3Schema', () => {
  it('accepts a valid 3-element tuple', () => {
    assert.equal(Vec3Schema.safeParse([1, 2, 3]).success, true)
  })

  it('rejects too few elements', () => {
    assert.equal(Vec3Schema.safeParse([1, 2]).success, false)
  })

  it('rejects too many elements', () => {
    assert.equal(Vec3Schema.safeParse([1, 2, 3, 4]).success, false)
  })

  it('rejects non-number elements', () => {
    assert.equal(Vec3Schema.safeParse(['a', 'b', 'c']).success, false)
  })

  it('rejects non-array input', () => {
    assert.equal(Vec3Schema.safeParse('not-an-array').success, false)
  })

  it('accepts negative numbers and zero', () => {
    assert.equal(Vec3Schema.safeParse([-1, 0, 3.5]).success, true)
  })
})

// ---------------------------------------------------------------------------
// WorkerStateSchema
// ---------------------------------------------------------------------------

describe('WorkerStateSchema', () => {
  it('accepts a valid worker', () => {
    assert.equal(WorkerStateSchema.safeParse(validWorker()).success, true)
  })

  it('rejects empty id', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), id: '' }).success, false)
  })

  it('rejects empty name', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), name: '' }).success, false)
  })

  it('rejects invalid role', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), role: 'intern' }).success, false)
  })

  it('rejects negative salary', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), salary: -1 }).success, false)
  })

  it('rejects zero salary', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), salary: 0 }).success, false)
  })

  it('rejects energy > 1', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), energy: 1.01 }).success, false)
  })

  it('rejects energy < 0', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), energy: -0.1 }).success, false)
  })

  it('accepts energy at boundary 0', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), energy: 0 }).success, true)
  })

  it('accepts energy at boundary 1', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), energy: 1 }).success, true)
  })

  it('rejects invalid currentActivity', () => {
    assert.equal(
      WorkerStateSchema.safeParse({ ...validWorker(), currentActivity: 'sleeping' }).success,
      false,
    )
  })

  it('rejects invalid position (too few elements)', () => {
    assert.equal(WorkerStateSchema.safeParse({ ...validWorker(), position: [0, 0] }).success, false)
  })
})

// ---------------------------------------------------------------------------
// AppChoiceSchema
// ---------------------------------------------------------------------------

describe('AppChoiceSchema', () => {
  it('accepts a valid app choice', () => {
    assert.equal(AppChoiceSchema.safeParse(validAppChoice()).success, true)
  })

  it('rejects empty id', () => {
    assert.equal(AppChoiceSchema.safeParse({ ...validAppChoice(), id: '' }).success, false)
  })

  it('rejects empty name', () => {
    assert.equal(AppChoiceSchema.safeParse({ ...validAppChoice(), name: '' }).success, false)
  })

  it('rejects empty description', () => {
    assert.equal(AppChoiceSchema.safeParse({ ...validAppChoice(), description: '' }).success, false)
  })

  it('rejects invalid complexity', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), complexity: 'extreme' }).success,
      false,
    )
  })

  it('rejects 0 estimatedSprints', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), estimatedSprints: 0 }).success,
      false,
    )
  })

  it('rejects negative estimatedSprints', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), estimatedSprints: -1 }).success,
      false,
    )
  })

  it('rejects non-integer estimatedSprints', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), estimatedSprints: 2.5 }).success,
      false,
    )
  })

  it('rejects negative revenuePotential', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), revenuePotential: -100 }).success,
      false,
    )
  })

  it('rejects zero revenuePotential', () => {
    assert.equal(
      AppChoiceSchema.safeParse({ ...validAppChoice(), revenuePotential: 0 }).success,
      false,
    )
  })
})

// ---------------------------------------------------------------------------
// SprintStateSchema
// ---------------------------------------------------------------------------

describe('SprintStateSchema', () => {
  it('accepts a valid sprint', () => {
    assert.equal(SprintStateSchema.safeParse(validSprint()).success, true)
  })

  it('rejects total !== 4', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), total: 3 }).success, false)
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), total: 5 }).success, false)
  })

  it('rejects daysPerSprint !== 5', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), daysPerSprint: 4 }).success, false)
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), daysPerSprint: 6 }).success, false)
  })

  it('rejects negative current', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), current: -1 }).success, false)
  })

  it('rejects negative dayInSprint', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), dayInSprint: -1 }).success, false)
  })

  it('rejects non-integer current', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), current: 1.5 }).success, false)
  })

  it('rejects non-integer dayInSprint', () => {
    assert.equal(SprintStateSchema.safeParse({ ...validSprint(), dayInSprint: 2.5 }).success, false)
  })
})

// ---------------------------------------------------------------------------
// GameClockSchema
// ---------------------------------------------------------------------------

describe('GameClockSchema', () => {
  it('accepts a valid clock', () => {
    assert.equal(GameClockSchema.safeParse(validClock()).success, true)
  })

  it('rejects hour > 23', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), hour: 24 }).success, false)
  })

  it('rejects hour < 0', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), hour: -1 }).success, false)
  })

  it('accepts hour at boundary 0', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), hour: 0 }).success, true)
  })

  it('accepts hour at boundary 23', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), hour: 23 }).success, true)
  })

  it('rejects minute > 59', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), minute: 60 }).success, false)
  })

  it('rejects minute < 0', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), minute: -1 }).success, false)
  })

  it('accepts minute at boundary 0', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), minute: 0 }).success, true)
  })

  it('accepts minute at boundary 59', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), minute: 59 }).success, true)
  })

  it('rejects day < 1', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), day: 0 }).success, false)
  })

  it('rejects negative speed', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), speed: -1 }).success, false)
  })

  it('rejects zero speed', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), speed: 0 }).success, false)
  })

  it('rejects non-integer hour', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), hour: 9.5 }).success, false)
  })

  it('rejects non-integer minute', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), minute: 30.5 }).success, false)
  })

  it('rejects non-boolean paused', () => {
    assert.equal(GameClockSchema.safeParse({ ...validClock(), paused: 'yes' }).success, false)
  })
})

// ---------------------------------------------------------------------------
// CrisisChoiceSchema
// ---------------------------------------------------------------------------

describe('CrisisChoiceSchema', () => {
  it('accepts a valid crisis choice', () => {
    assert.equal(CrisisChoiceSchema.safeParse(validCrisisChoice()).success, true)
  })

  it('rejects empty id', () => {
    assert.equal(CrisisChoiceSchema.safeParse({ ...validCrisisChoice(), id: '' }).success, false)
  })

  it('rejects empty label', () => {
    assert.equal(CrisisChoiceSchema.safeParse({ ...validCrisisChoice(), label: '' }).success, false)
  })

  it('rejects empty description', () => {
    assert.equal(
      CrisisChoiceSchema.safeParse({ ...validCrisisChoice(), description: '' }).success,
      false,
    )
  })
})

// ---------------------------------------------------------------------------
// CrisisSchema
// ---------------------------------------------------------------------------

describe('CrisisSchema', () => {
  it('accepts a valid crisis', () => {
    assert.equal(CrisisSchema.safeParse(validCrisis()).success, true)
  })

  it('rejects empty id', () => {
    assert.equal(CrisisSchema.safeParse({ ...validCrisis(), id: '' }).success, false)
  })

  it('rejects empty title', () => {
    assert.equal(CrisisSchema.safeParse({ ...validCrisis(), title: '' }).success, false)
  })

  it('rejects empty narrative', () => {
    assert.equal(CrisisSchema.safeParse({ ...validCrisis(), narrative: '' }).success, false)
  })

  it('rejects fewer than 2 choices', () => {
    assert.equal(
      CrisisSchema.safeParse({ ...validCrisis(), choices: [validCrisisChoice()] }).success,
      false,
    )
  })

  it('rejects more than 3 choices', () => {
    const c = validCrisisChoice()
    assert.equal(
      CrisisSchema.safeParse({
        ...validCrisis(),
        choices: [
          { ...c, id: 'a' },
          { ...c, id: 'b' },
          { ...c, id: 'c' },
          { ...c, id: 'd' },
        ],
      }).success,
      false,
    )
  })

  it('accepts exactly 3 choices', () => {
    const c = validCrisisChoice()
    assert.equal(
      CrisisSchema.safeParse({
        ...validCrisis(),
        choices: [
          { ...c, id: 'a' },
          { ...c, id: 'b' },
          { ...c, id: 'c' },
        ],
      }).success,
      true,
    )
  })

  it('rejects negative triggeredAtSprint', () => {
    assert.equal(CrisisSchema.safeParse({ ...validCrisis(), triggeredAtSprint: -1 }).success, false)
  })

  it('rejects non-integer triggeredAtSprint', () => {
    assert.equal(
      CrisisSchema.safeParse({ ...validCrisis(), triggeredAtSprint: 1.5 }).success,
      false,
    )
  })
})

// ---------------------------------------------------------------------------
// GameResultSchema
// ---------------------------------------------------------------------------

describe('GameResultSchema', () => {
  it('accepts a valid result', () => {
    assert.equal(GameResultSchema.safeParse(validGameResult()).success, true)
  })

  it('rejects invalid grade', () => {
    assert.equal(GameResultSchema.safeParse({ ...validGameResult(), grade: 'E' }).success, false)
  })

  it('rejects negative completion', () => {
    assert.equal(
      GameResultSchema.safeParse({ ...validGameResult(), completion: -0.1 }).success,
      false,
    )
  })

  it('rejects quality > 1', () => {
    assert.equal(GameResultSchema.safeParse({ ...validGameResult(), quality: 1.01 }).success, false)
  })

  it('rejects quality < 0', () => {
    assert.equal(GameResultSchema.safeParse({ ...validGameResult(), quality: -0.1 }).success, false)
  })
})

// ---------------------------------------------------------------------------
// GameStateSchema
// ---------------------------------------------------------------------------

describe('GameStateSchema', () => {
  it('accepts a valid game state', () => {
    assert.equal(GameStateSchema.safeParse(validGameState()).success, true)
  })

  it('accepts null chosenApp', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), chosenApp: null }).success, true)
  })

  it('accepts null result', () => {
    const state = validGameState()
    state.result = null
    assert.equal(GameStateSchema.safeParse(state).success, true)
  })

  it('accepts non-null result', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), result: validGameResult() }).success,
      true,
    )
  })

  it('rejects invalid phase', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), phase: 'loading' }).success,
      false,
    )
  })

  it('rejects progress > 1', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), progress: 1.01 }).success, false)
  })

  it('rejects progress < 0', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), progress: -0.1 }).success, false)
  })

  it('rejects quality > 1', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), quality: 1.01 }).success, false)
  })

  it('rejects quality < 0', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), quality: -0.1 }).success, false)
  })

  it('rejects empty seed', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), seed: '' }).success, false)
  })

  it('rejects empty team array is valid', () => {
    assert.equal(GameStateSchema.safeParse({ ...validGameState(), team: [] }).success, true)
  })

  it('rejects invalid worker in team', () => {
    assert.equal(
      GameStateSchema.safeParse({
        ...validGameState(),
        team: [{ ...validWorker(), energy: 2 }],
      }).success,
      false,
    )
  })

  it('accepts null pendingCrisis', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), pendingCrisis: null }).success,
      true,
    )
  })

  it('accepts non-null pendingCrisis', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), pendingCrisis: validCrisis() }).success,
      true,
    )
  })

  it('accepts empty crisesResolved array', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), crisesResolved: [] }).success,
      true,
    )
  })

  it('accepts non-empty crisesResolved array', () => {
    assert.equal(
      GameStateSchema.safeParse({
        ...validGameState(),
        crisesResolved: ['tech_debt', 'burnout'],
      }).success,
      true,
    )
  })

  it('accepts positive progressBonus', () => {
    assert.equal(
      GameStateSchema.safeParse({ ...validGameState(), progressBonus: 0.06 }).success,
      true,
    )
  })
})
