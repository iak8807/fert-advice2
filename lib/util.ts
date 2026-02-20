export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function roundTo(n: number, step: 0.1 | 0.01) {
  const inv = step === 0.1 ? 10 : 100;
  return Math.round(n * inv) / inv;
}

export function toLowerTr(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function normalizeName(s: string) {
  return toLowerTr(s.trim().replace(/\s+/g, " "));
}

export function parseTableNumber(regionTableKey: string): number {
  const m = regionTableKey.match(/\|table(\d+)/i);
  if (!m) return Number.POSITIVE_INFINITY;
  return Number(m[1]);
}

export function todayISO() {
  return new Date().toISOString();
}

export function safeNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function ecToDSm(value: number, unit: "dS/m" | "uS/cm") {
  if (unit === "dS/m") return value;
  // 1 dS/m = 1000 µS/cm
  return value / 1000;
}

