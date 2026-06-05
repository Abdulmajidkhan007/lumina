/**
 * Deterministic pseudo-random number generator (LCG).
 * Given a seed string, always produces the same sequence.
 */
export function createSeededRng(seed: string): () => number {
  // Hash the seed string to an integer
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  }
  // LCG parameters (Numerical Recipes)
  return function rng(): number {
    state = (Math.imul(1664525, state) + 1013904223) | 0;
    // Convert to [0, 1)
    return (state >>> 0) / 4294967296;
  };
}

export function seededPick<T>(arr: readonly T[], rng: () => number): T {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) throw new Error('seededPick: empty array');
  return item;
}

export function seededInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
