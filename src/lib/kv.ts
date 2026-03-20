import { Redis } from '@upstash/redis'

/**
 * Upstash Redis client for persistent game state.
 *
 * All reads must use Zod schema validation (.safeParse()).
 * Use key prefixes to namespace data (e.g. 'game:', 'player:').
 *
 * Add domain-specific helpers here as the game takes shape.
 */

export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
