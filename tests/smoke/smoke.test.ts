import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('smoke', () => {
  it('health endpoint returns ok', async () => {
    const res = await fetch('http://localhost:3000/api/health')
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })
})
