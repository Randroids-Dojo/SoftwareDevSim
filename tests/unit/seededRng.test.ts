import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRng, pick, shuffle, randRange } from '../../src/lib/seededRng'

declare module 'node:assert/strict' {
  function closeTo(actual: number, expected: number, delta: number, message?: string): void
}
assert.closeTo = function (actual: number, expected: number, delta: number, message?: string) {
  if (Math.abs(actual - expected) > delta) {
    assert.fail(message ?? `Expected ${actual} to be close to ${expected} (within ${delta})`)
  }
}

describe('createRng', () => {
  it('returns a function', () => {
    const rng = createRng('seed')
    assert.equal(typeof rng, 'function')
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng('bounds-check')
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      assert.ok(v >= 0, `value ${v} should be >= 0`)
      assert.ok(v < 1, `value ${v} should be < 1`)
    }
  })

  it('is deterministic — same seed produces same sequence', () => {
    const rng1 = createRng('deterministic')
    const rng2 = createRng('deterministic')
    for (let i = 0; i < 100; i++) {
      assert.equal(rng1(), rng2())
    }
  })

  it('different seeds produce different sequences', () => {
    const rng1 = createRng('alpha')
    const rng2 = createRng('beta')
    const vals1: number[] = []
    const vals2: number[] = []
    for (let i = 0; i < 10; i++) {
      vals1.push(rng1())
      vals2.push(rng2())
    }
    const allSame = vals1.every((v, i) => v === vals2[i])
    assert.ok(!allSame, 'different seeds should produce different sequences')
  })

  it('produces a uniform-ish distribution over many calls', () => {
    const rng = createRng('distribution-test')
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const n = 10000
    for (let i = 0; i < n; i++) {
      const v = rng()
      const idx = Math.min(Math.floor(v * 10), 9)
      buckets[idx]++
    }
    const expected = n / 10
    for (let i = 0; i < 10; i++) {
      assert.closeTo(
        buckets[i],
        expected,
        expected * 0.15,
        `bucket ${i} has ${buckets[i]}, expected ~${expected}`,
      )
    }
  })

  it('works with empty string seed', () => {
    const rng = createRng('')
    const v = rng()
    assert.ok(v >= 0 && v < 1)
  })

  it('first value differs from second value (sequence advances)', () => {
    const rng = createRng('advance')
    const first = rng()
    const second = rng()
    assert.notEqual(first, second)
  })

  it('produces exact known values for a fixed seed (snapshot)', () => {
    const rng = createRng('test')
    // Pin exact values — any change to the RNG algorithm will break this
    assert.equal(rng(), 0.9655703860335052)
    assert.equal(rng(), 0.9004089587833732)
    assert.equal(rng(), 0.9055827066767961)
  })
})

describe('pick', () => {
  it('picks the only element from a single-element array', () => {
    const rng = createRng('pick-single')
    assert.equal(pick(rng, [42]), 42)
  })

  it('picks a valid element from a multi-element array', () => {
    const rng = createRng('pick-multi')
    const arr = ['a', 'b', 'c', 'd', 'e'] as const
    for (let i = 0; i < 50; i++) {
      const result = pick(rng, arr)
      assert.ok(arr.includes(result), `picked "${result}" which is not in the array`)
    }
  })

  it('is deterministic with the same rng', () => {
    const rng1 = createRng('pick-det')
    const rng2 = createRng('pick-det')
    const arr = [1, 2, 3, 4, 5]
    for (let i = 0; i < 20; i++) {
      assert.equal(pick(rng1, arr), pick(rng2, arr))
    }
  })

  it('can pick every element given enough calls', () => {
    const rng = createRng('pick-coverage')
    const arr = ['x', 'y', 'z']
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      seen.add(pick(rng, arr))
    }
    assert.equal(seen.size, 3, 'should eventually pick every element')
  })
})

describe('shuffle', () => {
  it('returns the same array reference (in-place)', () => {
    const rng = createRng('shuffle-ref')
    const arr = [1, 2, 3, 4, 5]
    const result = shuffle(rng, arr)
    assert.ok(result === arr, 'should return the same array reference')
  })

  it('contains the same elements after shuffling', () => {
    const rng = createRng('shuffle-elements')
    const arr = [10, 20, 30, 40, 50]
    const sorted = [...arr].sort((a, b) => a - b)
    shuffle(rng, arr)
    arr.sort((a, b) => a - b)
    assert.deepEqual(arr, sorted)
  })

  it('shuffles into a different order with a known seed', () => {
    const rng = createRng('shuffle-reorder')
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const original = [...arr]
    shuffle(rng, arr)
    const same = arr.every((v, i) => v === original[i])
    assert.ok(!same, 'shuffled array should differ from original order')
  })

  it('leaves a single-element array unchanged', () => {
    const rng = createRng('shuffle-one')
    const arr = [99]
    shuffle(rng, arr)
    assert.deepEqual(arr, [99])
  })

  it('can swap a two-element array', () => {
    // Try many seeds to find one that swaps
    let swapped = false
    for (let s = 0; s < 20; s++) {
      const rng = createRng(`two-elem-${s}`)
      const arr = [1, 2]
      shuffle(rng, arr)
      if (arr[0] === 2 && arr[1] === 1) {
        swapped = true
        break
      }
    }
    assert.ok(swapped, 'at least one seed should swap a two-element array')
  })

  it('is deterministic with the same seed', () => {
    const arr1 = [1, 2, 3, 4, 5]
    const arr2 = [1, 2, 3, 4, 5]
    shuffle(createRng('shuffle-det'), arr1)
    shuffle(createRng('shuffle-det'), arr2)
    assert.deepEqual(arr1, arr2)
  })

  it('produces exact known order for a fixed seed (snapshot)', () => {
    const arr = [1, 2, 3, 4, 5]
    shuffle(createRng('shuffle-snapshot'), arr)
    assert.deepEqual(arr, [5, 4, 1, 3, 2])
  })
})

describe('randRange', () => {
  it('returns values in [min, max)', () => {
    const rng = createRng('range-bounds')
    for (let i = 0; i < 1000; i++) {
      const v = randRange(rng, 5, 10)
      assert.ok(v >= 5, `value ${v} should be >= 5`)
      assert.ok(v < 10, `value ${v} should be < 10`)
    }
  })

  it('works with negative ranges', () => {
    const rng = createRng('range-negative')
    for (let i = 0; i < 1000; i++) {
      const v = randRange(rng, -10, -5)
      assert.ok(v >= -10, `value ${v} should be >= -10`)
      assert.ok(v < -5, `value ${v} should be < -5`)
    }
  })

  it('returns min when min equals max', () => {
    const rng = createRng('range-equal')
    const v = randRange(rng, 7, 7)
    assert.equal(v, 7)
  })

  it('is deterministic with the same seed', () => {
    const rng1 = createRng('range-det')
    const rng2 = createRng('range-det')
    for (let i = 0; i < 50; i++) {
      assert.equal(randRange(rng1, 0, 100), randRange(rng2, 0, 100))
    }
  })

  it('covers the range spread', () => {
    const rng = createRng('range-spread')
    let minSeen = Infinity
    let maxSeen = -Infinity
    for (let i = 0; i < 5000; i++) {
      const v = randRange(rng, 10, 20)
      if (v < minSeen) minSeen = v
      if (v > maxSeen) maxSeen = v
    }
    assert.ok(minSeen < 11, `min seen ${minSeen} should be near 10`)
    assert.ok(maxSeen > 19, `max seen ${maxSeen} should be near 20`)
  })

  it('works with a range crossing zero', () => {
    const rng = createRng('range-cross-zero')
    for (let i = 0; i < 100; i++) {
      const v = randRange(rng, -5, 5)
      assert.ok(v >= -5 && v < 5)
    }
  })
})
