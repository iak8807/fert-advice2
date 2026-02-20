// tests/binning.test.ts
import { describe, expect, it } from "vitest";
import { matchBin, parseBin } from "@/lib/engine/binning";

describe("binning", () => {
  it("parses range and plus", () => {
    expect(parseBin("0-2.5").kind).toBe("range");
    expect(parseBin("5+").kind).toBe("plus");
  });

  it("matches boundaries deterministically", () => {
    const bins = ["0-2.5", "2.5-5", "5+"];
    expect(matchBin(0, bins)).toBe("0-2.5");
    expect(matchBin(2.5, bins)).toBe("0-2.5"); // inclusive and first-match rule
    expect(matchBin(3, bins)).toBe("2.5-5");
    expect(matchBin(5, bins)).toBe("2.5-5");
    expect(matchBin(999, bins)).toBe("5+");
  });
});
