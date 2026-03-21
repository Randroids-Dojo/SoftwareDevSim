import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateBacklog, totalPoints, storiesByStatus } from '../../src/game/simulation/backlog'
import { createRng } from '../../src/lib/seededRng'

describe('Backlog', () => {
  it('generates the requested number of stories', () => {
    const rng = createRng('test-seed')
    const backlog = generateBacklog(rng, 10)
    assert.equal(backlog.length, 10)
  })

  it('generates 15 stories by default', () => {
    const rng = createRng('test-seed')
    const backlog = generateBacklog(rng)
    assert.equal(backlog.length, 15)
  })

  it('all stories start in backlog status', () => {
    const rng = createRng('test-seed')
    const backlog = generateBacklog(rng)
    assert.ok(backlog.every((s) => s.status === 'backlog'))
  })

  it('stories have valid point values', () => {
    const rng = createRng('test-seed')
    const backlog = generateBacklog(rng)
    const validPoints = [1, 2, 3, 5, 8]
    assert.ok(backlog.every((s) => validPoints.includes(s.points)))
  })

  it('stories have unique IDs', () => {
    const rng = createRng('test-seed')
    const backlog = generateBacklog(rng)
    const ids = new Set(backlog.map((s) => s.id))
    assert.equal(ids.size, backlog.length)
  })

  it('is deterministic with same seed', () => {
    const backlog1 = generateBacklog(createRng('same-seed'))
    const backlog2 = generateBacklog(createRng('same-seed'))
    assert.deepEqual(
      backlog1.map((s) => s.title),
      backlog2.map((s) => s.title),
    )
  })

  it('differs with different seeds', () => {
    const backlog1 = generateBacklog(createRng('seed-a'))
    const backlog2 = generateBacklog(createRng('seed-b'))
    const titles1 = backlog1.map((s) => s.title).join(',')
    const titles2 = backlog2.map((s) => s.title).join(',')
    assert.notEqual(titles1, titles2)
  })
})

describe('totalPoints', () => {
  it('sums all story points', () => {
    const rng = createRng('test')
    const backlog = generateBacklog(rng, 5)
    const total = totalPoints(backlog)
    const manual = backlog.reduce((s, b) => s + b.points, 0)
    assert.equal(total, manual)
  })
})

describe('storiesByStatus', () => {
  it('groups stories by status', () => {
    const rng = createRng('test')
    const backlog = generateBacklog(rng, 5)
    const grouped = storiesByStatus(backlog)
    assert.equal(grouped.backlog.length, 5)
    assert.equal(grouped.done.length, 0)
  })
})
