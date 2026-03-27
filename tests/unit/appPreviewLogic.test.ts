import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { seededRandom, pickN, getActiveGlitches, ALL_GLITCHES } from '../../src/lib/appPreviewLogic'

// ---------------------------------------------------------------------------
// seededRandom
// ---------------------------------------------------------------------------

describe('seededRandom', () => {
  it('returns values between 0 and 1', () => {
    const rand = seededRandom('test-seed')
    for (let i = 0; i < 100; i++) {
      const v = rand()
      assert.ok(v >= 0, `value ${v} should be >= 0`)
      assert.ok(v < 1, `value ${v} should be < 1`)
    }
  })

  it('same seed produces same sequence', () => {
    const a = seededRandom('hello')
    const b = seededRandom('hello')
    for (let i = 0; i < 20; i++) {
      assert.equal(a(), b())
    }
  })

  it('different seeds produce different sequences', () => {
    const a = seededRandom('seed-a')
    const b = seededRandom('seed-b')
    // At least one of the first 5 values should differ
    let allSame = true
    for (let i = 0; i < 5; i++) {
      if (a() !== b()) allSame = false
    }
    assert.ok(!allSame, 'different seeds should produce different sequences')
  })

  it('handles empty seed without crashing', () => {
    const rand = seededRandom('')
    const v = rand()
    assert.ok(v >= 0 && v < 1)
  })
})

// ---------------------------------------------------------------------------
// pickN
// ---------------------------------------------------------------------------

describe('pickN', () => {
  it('returns exactly N items', () => {
    const rand = seededRandom('pick-test')
    const result = pickN([1, 2, 3, 4, 5], 3, rand)
    assert.equal(result.length, 3)
  })

  it('returns all items when N >= array length', () => {
    const rand = seededRandom('pick-all')
    const result = pickN([1, 2, 3], 5, rand)
    assert.equal(result.length, 3)
  })

  it('returns empty array when N is 0', () => {
    const rand = seededRandom('pick-zero')
    const result = pickN([1, 2, 3], 0, rand)
    assert.equal(result.length, 0)
  })

  it('returns items from the original array', () => {
    const rand = seededRandom('pick-source')
    const source = ['a', 'b', 'c', 'd']
    const result = pickN(source, 2, rand)
    for (const item of result) {
      assert.ok(source.includes(item), `${item} should be from source array`)
    }
  })

  it('does not mutate the original array', () => {
    const rand = seededRandom('pick-immutable')
    const source = [1, 2, 3, 4]
    const copy = [...source]
    pickN(source, 2, rand)
    assert.deepEqual(source, copy)
  })

  it('same seed picks same items', () => {
    const source = ['a', 'b', 'c', 'd', 'e']
    const a = pickN(source, 3, seededRandom('deterministic'))
    const b = pickN(source, 3, seededRandom('deterministic'))
    assert.deepEqual(a, b)
  })
})

// ---------------------------------------------------------------------------
// getActiveGlitches
// ---------------------------------------------------------------------------

describe('getActiveGlitches', () => {
  it('returns empty set for high quality (> 0.6)', () => {
    const rand = seededRandom('high-q')
    assert.equal(getActiveGlitches(0.61, rand).size, 0)
    assert.equal(getActiveGlitches(0.8, seededRandom('hq2')).size, 0)
    assert.equal(getActiveGlitches(1.0, seededRandom('hq3')).size, 0)
  })

  it('returns empty set at quality boundary 0.6 (exclusive)', () => {
    // quality > 0.6 returns empty — 0.6 is NOT > 0.6
    const rand = seededRandom('boundary')
    const glitches = getActiveGlitches(0.6, rand)
    assert.equal(glitches.size, 2)
  })

  it('returns 2 glitches for medium quality (0.3-0.6)', () => {
    const rand = seededRandom('med-q')
    const glitches = getActiveGlitches(0.5, rand)
    assert.equal(glitches.size, 2)
  })

  it('returns 4 glitches for low quality (< 0.3)', () => {
    const rand = seededRandom('low-q')
    const glitches = getActiveGlitches(0.2, rand)
    assert.equal(glitches.size, 4)
  })

  it('returns 2 glitches at quality boundary 0.3', () => {
    // quality < 0.3 → 4, quality >= 0.3 → 2
    const rand = seededRandom('boundary-low')
    const glitches = getActiveGlitches(0.3, rand)
    assert.equal(glitches.size, 2)
  })

  it('returns 4 glitches just below 0.3', () => {
    const rand = seededRandom('just-below')
    const glitches = getActiveGlitches(0.29, rand)
    assert.equal(glitches.size, 4)
  })

  it('returns 4 glitches for quality 0', () => {
    const rand = seededRandom('zero-q')
    const glitches = getActiveGlitches(0, rand)
    assert.equal(glitches.size, 4)
  })

  it('only returns valid glitch types', () => {
    const rand = seededRandom('valid-types')
    const glitches = getActiveGlitches(0.1, rand)
    for (const g of glitches) {
      assert.ok(ALL_GLITCHES.includes(g), `${g} should be a valid glitch type`)
    }
  })

  it('same seed + quality produces same glitches', () => {
    const a = getActiveGlitches(0.4, seededRandom('deterministic'))
    const b = getActiveGlitches(0.4, seededRandom('deterministic'))
    assert.deepEqual([...a].sort(), [...b].sort())
  })

  it('different seeds can produce different glitches', () => {
    const results = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const glitches = getActiveGlitches(0.4, seededRandom(`seed-${i}`))
      results.add([...glitches].sort().join(','))
    }
    // With 10 different seeds picking 2 from 6, we should get at least 2 unique sets
    assert.ok(results.size >= 2, 'different seeds should sometimes produce different glitch sets')
  })
})
