/** Simple seeded PRNG (mulberry32) for deterministic game events. */
export function createRng(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }

  return function next(): number {
    h |= 0
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick a random element from an array using the rng. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Shuffle array in place using Fisher-Yates with the rng. */
export function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Return a number in [min, max) using the rng. */
export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}
