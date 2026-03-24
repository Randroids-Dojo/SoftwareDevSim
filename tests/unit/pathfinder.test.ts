import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  findLocation,
  distanceTo,
  moveToward,
  facingAngle,
} from '../../src/game/character/pathfinder'
import type { NamedLocation, Vec3 } from '../../src/game/types'

// Polyfill for floating-point comparisons
declare module 'node:assert/strict' {
  function closeTo(actual: number, expected: number, delta: number, message?: string): void
}
assert.closeTo = function (actual: number, expected: number, delta: number, message?: string) {
  if (Math.abs(actual - expected) > delta) {
    assert.fail(message ?? `Expected ${actual} to be close to ${expected} (within ${delta})`)
  }
}

const DELTA = 1e-9

function makeLoc(name: string, position: Vec3): NamedLocation {
  return { name, position }
}

// ---------- findLocation ----------

describe('findLocation', () => {
  const locations: NamedLocation[] = [
    makeLoc('desk-a', [1, 0, 2]),
    makeLoc('kitchen', [5, 0, 5]),
    makeLoc('exit', [10, 0, 0]),
  ]

  it('returns the matching location by name', () => {
    const result = findLocation(locations, 'kitchen')
    assert.deepStrictEqual(result, makeLoc('kitchen', [5, 0, 5]))
  })

  it('returns undefined for a name that does not exist', () => {
    const result = findLocation(locations, 'nonexistent')
    assert.strictEqual(result, undefined)
  })

  it('returns undefined for an empty array', () => {
    const result = findLocation([], 'desk-a')
    assert.strictEqual(result, undefined)
  })
})

// ---------- distanceTo ----------

describe('distanceTo', () => {
  it('returns 0 for the same point', () => {
    const p: Vec3 = [3, 1, 4]
    assert.strictEqual(distanceTo(p, p), 0)
  })

  it('computes horizontal (x-axis) distance', () => {
    assert.strictEqual(distanceTo([0, 0, 0], [5, 0, 0]), 5)
  })

  it('computes depth (z-axis) distance', () => {
    assert.strictEqual(distanceTo([0, 0, 0], [0, 0, 7]), 7)
  })

  it('computes diagonal distance with exact expected value', () => {
    // 3-4-5 triangle on x/z plane
    assert.strictEqual(distanceTo([0, 0, 0], [3, 0, 4]), 5)
  })

  it('ignores the y-axis entirely', () => {
    const a: Vec3 = [0, 0, 0]
    const b: Vec3 = [0, 999, 0]
    assert.strictEqual(distanceTo(a, b), 0)
  })

  it('ignores y-axis while computing x/z distance', () => {
    assert.strictEqual(distanceTo([0, 0, 0], [3, 100, 4]), 5)
  })
})

// ---------- moveToward ----------

describe('moveToward', () => {
  it('arrives when distance is less than speed', () => {
    const current: Vec3 = [0, 0, 0]
    const target: Vec3 = [0.3, 5, 0.4]
    // distance in x/z = 0.5, speed = 1 → should arrive
    const result = moveToward(current, target, 1)
    assert.strictEqual(result.arrived, true)
    assert.deepStrictEqual(result.position, [0.3, 5, 0.4])
  })

  it('does not arrive when far away and returns correct intermediate position', () => {
    const current: Vec3 = [0, 0, 0]
    const target: Vec3 = [6, 0, 8] // distance = 10
    const speed = 5
    const result = moveToward(current, target, speed)
    assert.strictEqual(result.arrived, false)
    // ratio = 5/10 = 0.5 → position = [3, 0, 4]
    assert.closeTo(result.position[0], 3, DELTA)
    assert.closeTo(result.position[1], 0, DELTA)
    assert.closeTo(result.position[2], 4, DELTA)
  })

  it('arrives exactly when distance equals speed (boundary)', () => {
    const current: Vec3 = [0, 0, 0]
    const target: Vec3 = [3, 2, 4] // x/z distance = 5
    const result = moveToward(current, target, 5)
    assert.strictEqual(result.arrived, true)
    assert.deepStrictEqual(result.position, [3, 2, 4])
  })

  it('uses default speed of 0.5', () => {
    const current: Vec3 = [0, 0, 0]
    const target: Vec3 = [10, 0, 0] // distance = 10
    const result = moveToward(current, target)
    assert.strictEqual(result.arrived, false)
    // ratio = 0.5 / 10 = 0.05 → x = 0.5, z = 0
    assert.closeTo(result.position[0], 0.5, DELTA)
    assert.closeTo(result.position[2], 0, DELTA)
  })

  it('preserves the y-coordinate of the current position when not arrived', () => {
    const current: Vec3 = [0, 42, 0]
    const target: Vec3 = [10, 99, 0]
    const result = moveToward(current, target, 1)
    assert.strictEqual(result.arrived, false)
    assert.strictEqual(result.position[1], 42)
  })

  it('copies the target y-coordinate when arrived', () => {
    const current: Vec3 = [0, 42, 0]
    const target: Vec3 = [0.1, 99, 0]
    const result = moveToward(current, target, 1)
    assert.strictEqual(result.arrived, true)
    assert.strictEqual(result.position[1], 99)
  })

  it('moves in the correct direction (negative)', () => {
    const current: Vec3 = [5, 0, 5]
    const target: Vec3 = [0, 0, 5] // distance = 5 on x-axis, moving left
    const result = moveToward(current, target, 1)
    assert.strictEqual(result.arrived, false)
    assert.closeTo(result.position[0], 4, DELTA) // moved -1 in x
    assert.closeTo(result.position[2], 5, DELTA) // z unchanged
  })
})

// ---------- facingAngle ----------

describe('facingAngle', () => {
  const origin: Vec3 = [0, 0, 0]

  it('returns correct angle facing +x direction', () => {
    // atan2(x, z) where x>0, z=0 → π/2
    const angle = facingAngle(origin, [1, 0, 0])
    assert.closeTo(angle, Math.PI / 2, DELTA)
  })

  it('returns correct angle facing -x direction', () => {
    // atan2(-1, 0) → -π/2
    const angle = facingAngle(origin, [-1, 0, 0])
    assert.closeTo(angle, -Math.PI / 2, DELTA)
  })

  it('returns correct angle facing +z direction', () => {
    // atan2(0, 1) → 0
    const angle = facingAngle(origin, [0, 0, 1])
    assert.closeTo(angle, 0, DELTA)
  })

  it('returns correct angle facing -z direction', () => {
    // atan2(0, -1) → π
    const angle = facingAngle(origin, [0, 0, -1])
    assert.closeTo(angle, Math.PI, DELTA)
  })

  it('returns correct angle for diagonal (+x, +z)', () => {
    // atan2(1, 1) → π/4
    const angle = facingAngle(origin, [1, 0, 1])
    assert.closeTo(angle, Math.PI / 4, DELTA)
  })

  it('returns correct angle for diagonal (-x, -z)', () => {
    // atan2(-1, -1) → -3π/4
    const angle = facingAngle(origin, [-1, 0, -1])
    assert.closeTo(angle, (-3 * Math.PI) / 4, DELTA)
  })

  it('computes correctly with non-origin from position', () => {
    // from=[2,0,3] to=[5,0,7] → dx=3, dz=4 → atan2(3,4)
    const angle = facingAngle([2, 0, 3], [5, 0, 7])
    assert.closeTo(angle, Math.atan2(3, 4), DELTA)
  })

  it('subtraction matters: different from changes the angle', () => {
    // from=[1,0,0] to=[0,0,1] → dx=-1, dz=1 → atan2(-1,1) = -π/4
    const angle = facingAngle([1, 0, 0], [0, 0, 1])
    assert.closeTo(angle, Math.atan2(-1, 1), DELTA)
    // If it were addition: atan2(1,1) = π/4 — different!
    assert.ok(Math.abs(angle - Math.PI / 4) > 0.1, 'should not be π/4')
  })
})
