/** Artificial network latency — simulates 200-600 ms round-trip */
export function mockDelay(): Promise<void> {
  const ms = 200 + Math.floor(Math.random() * 401);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
