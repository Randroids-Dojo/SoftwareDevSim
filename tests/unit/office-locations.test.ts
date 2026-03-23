import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildStandupCircle, buildOverflowSpots } from '../../src/game/office'

describe('buildStandupCircle', () => {
  it('generates at least 3 slots even for small teams', () => {
    const locs = buildStandupCircle(1)
    assert.equal(locs.length, 3)
  })

  it('generates one slot per team member', () => {
    const locs = buildStandupCircle(8)
    assert.equal(locs.length, 8)
  })

  it('all slots have unique names', () => {
    const locs = buildStandupCircle(12)
    const names = locs.map((l) => l.name)
    assert.equal(new Set(names).size, names.length)
  })

  it('all slots have unique positions', () => {
    const locs = buildStandupCircle(12)
    const posKeys = locs.map((l) => l.position.join(','))
    assert.equal(new Set(posKeys).size, posKeys.length)
  })

  it('uses concentric rings for large teams', () => {
    const locs = buildStandupCircle(12)
    // First 6 in inner ring, next 6 in outer ring
    const innerDist = Math.hypot(locs[0].position[0] - 12, locs[0].position[2] - 12)
    const outerDist = Math.hypot(locs[6].position[0] - 12, locs[6].position[2] - 12)
    assert.ok(outerDist > innerDist, 'outer ring should have larger radius')
  })

  it('all slots face toward center', () => {
    const locs = buildStandupCircle(6)
    for (const loc of locs) {
      assert.ok(loc.seatDirection, `${loc.name} should have seatDirection`)
    }
  })
})

describe('buildOverflowSpots', () => {
  it('returns empty for 4 or fewer workers', () => {
    assert.equal(buildOverflowSpots(4).length, 0)
    assert.equal(buildOverflowSpots(2).length, 0)
  })

  it('returns one spot per overflow worker', () => {
    assert.equal(buildOverflowSpots(6).length, 2)
    assert.equal(buildOverflowSpots(10).length, 6)
  })

  it('all spots have unique names', () => {
    const locs = buildOverflowSpots(20)
    const names = locs.map((l) => l.name)
    assert.equal(new Set(names).size, names.length)
  })

  it('all spots have unique positions', () => {
    const locs = buildOverflowSpots(20)
    const posKeys = locs.map((l) => l.position.join(','))
    assert.equal(new Set(posKeys).size, posKeys.length)
  })
})
