// lib/engine/binning.ts
import { safeNumber } from "@/lib/util";

export type BinDef =
  | { kind: "range"; min: number; max: number; minInc: boolean; maxInc: boolean; raw: string }
  | { kind: "plus"; min: number; minInc: boolean; raw: string }
  | { kind: "exact"; value: number; raw: string };

function parseNum(s: string) {
  const n = safeNumber(s.replace(",", "."));
  if (n === null) throw new Error(`Invalid number in bin: ${s}`);
  return n;
}

export function parseBin(raw: string): BinDef {
  const s = raw.trim();
  if (s.endsWith("+")) {
    const min = parseNum(s.slice(0, -1).trim());
    return { kind: "plus", min, minInc: true, raw };
  }
  if (s.includes("-")) {
    const [a, b] = s.split("-").map((x) => x.trim());
    const min = parseNum(a);
    const max = parseNum(b);
    // Deterministic inclusive for both ends by default
    return { kind: "range", min, max, minInc: true, maxInc: true, raw };
  }
  const v = parseNum(s);
  return { kind: "exact", value: v, raw };
}

export function matchBin(value: number, bins: string[]): string | null {
  // Deterministic: first match in provided bins order
  for (const raw of bins) {
    const b = parseBin(raw);
    if (b.kind === "plus") {
      if (value >= b.min) return b.raw;
    } else if (b.kind === "range") {
      const okMin = b.minInc ? value >= b.min : value > b.min;
      const okMax = b.maxInc ? value <= b.max : value < b.max;
      if (okMin && okMax) return b.raw;
    } else {
      if (value === b.value) return b.raw;
    }
  }
  return null;
}

export function normalizeBins(bins: string[] | Record<string, string[]>): string[] {
  if (Array.isArray(bins)) return bins.slice();
  const keys = Object.keys(bins).sort(); // deterministic merge order
  const merged: string[] = [];
  for (const k of keys) merged.push(...bins[k]);
  return merged;
}
