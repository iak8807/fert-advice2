// tests/schedule.test.ts
import { describe, expect, it } from "vitest";
import { validateFractions } from "@/lib/engine/schedule";

describe("schedule percentages sum", () => {
  it("sums to 1 exactly for preset fractions", () => {
    const ok = validateFractions([
      { label: "a", fraction: 0.4 },
      { label: "b", fraction: 0.3 },
      { label: "c", fraction: 0.3 }
    ]);
    expect(ok).toBe(true);
  });
});
