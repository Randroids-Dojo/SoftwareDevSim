import { Redis } from '@upstash/redis'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

/**
 * Upstash Redis client for persistent game state.
 *
 * All reads must use Zod schema validation (.safeParse()).
 * Use key prefixes to namespace data (e.g. 'game:', 'player:').
 */
export const kv = new Redis({
  url: requireEnv('KV_REST_API_URL'),
  token: requireEnv('KV_REST_API_TOKEN'),
})
