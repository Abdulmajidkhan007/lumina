/** Smallest "nice" number (1, 2, 5 × 10ⁿ) ≥ `value`; at least 1. */
export function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}
