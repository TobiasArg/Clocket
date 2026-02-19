import { describe, expect, it } from "vitest";
import { clampPullDistance, computePullProgress } from "./usePullToRefresh";

describe("usePullToRefresh helpers", () => {
  it("clamps pull distance into allowed range", () => {
    expect(clampPullDistance(-12, 120)).toBe(0);
    expect(clampPullDistance(64, 120)).toBe(64);
    expect(clampPullDistance(240, 120)).toBe(120);
  });

  it("computes progress between 0 and 1", () => {
    expect(computePullProgress(0, 72)).toBe(0);
    expect(computePullProgress(36, 72)).toBe(0.5);
    expect(computePullProgress(96, 72)).toBe(1);
    expect(computePullProgress(10, 0)).toBe(0);
  });
});
