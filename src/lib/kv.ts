import { kv } from '@vercel/kv'

/**
 * Vercel KV helper module.
 *
 * All reads must use Zod schema validation (.safeParse()).
 * Use key prefixes to namespace data (e.g. 'game:', 'player:').
 *
 * Add domain-specific helpers here as the game takes shape.
 */

export { kv }
