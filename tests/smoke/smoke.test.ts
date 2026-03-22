import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('smoke', () => {
  it('home page returns 200', async () => {
    const res = await fetch('http://localhost:3000')
    assert.equal(res.status, 200)
  })
})
