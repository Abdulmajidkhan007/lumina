import { playbackFraction } from '../videoProgress';

describe('playbackFraction', () => {
  it('maps position to 0–1', () => {
    expect(playbackFraction(2500, 10000)).toBe(0.25);
  });
  it('clamps overshoot and guards unknown durations', () => {
    expect(playbackFraction(12000, 10000)).toBe(1);
    expect(playbackFraction(1000, 0)).toBe(0);
    expect(playbackFraction(-5, 1000)).toBe(0);
    expect(playbackFraction(Number.NaN, 1000)).toBe(0);
  });
});
