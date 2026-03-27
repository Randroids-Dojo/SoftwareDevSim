/** Simple seeded PRNG (mulberry32). Returns a function that yields 0-1 floats. */
export function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i)
  }
  return () => {
    h |= 0
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick N items from an array using seeded randomness. */
export function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, n)
}

export type GlitchType =
  | 'misaligned'
  | 'lorem'
  | 'error-modal'
  | 'broken-image'
  | 'overflow'
  | 'wrong-color'

export const ALL_GLITCHES: GlitchType[] = [
  'misaligned',
  'lorem',
  'error-modal',
  'broken-image',
  'overflow',
  'wrong-color',
]

export function getActiveGlitches(quality: number, rand: () => number): Set<GlitchType> {
  if (quality > 0.6) return new Set()
  const count = quality < 0.3 ? 4 : 2
  return new Set(pickN(ALL_GLITCHES, count, rand))
}
