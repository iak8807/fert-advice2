// lib/engine/cost.ts
import type { CostResult, PriceCatalog } from "@/lib/types";

export function computeCost(args: {
  lines: { productId: string; productName: string; kgDa: number; totalKg: number }[];
  prices: PriceCatalog;
  area_da: number;
}): CostResult {
  const { lines, prices } = args;

  const costLines = lines.map((l) => {
    const p = prices[l.productId];
    const unit = p == null ? null : p;
    const lineCost = unit == null ? null : l.totalKg * unit;
    return {
      productId: l.productId,
      productName: l.productName,
      kgDa: l.kgDa,
      totalKg: l.totalKg,
      unitPriceTryPerKg: unit,
      lineCostTry: lineCost
    };
  });

  const hasAnyPrice = costLines.some((x) => x.unitPriceTryPerKg != null);
  if (!hasAnyPrice) {
    return {
      available: false,
      costPerDaTry: null,
      totalCostTry: null,
      mostExpensive: null,
      lines: costLines
    };
  }

  const known = costLines.filter((x) => x.lineCostTry != null) as (typeof costLines)[number][];
  const total = known.reduce((s, x) => s + (x.lineCostTry ?? 0), 0);
  const areaTotalKgDa = lines.reduce((s, x) => s + x.kgDa, 0);

  const costPerDa = areaTotalKgDa > 0 ? total / (args.area_da || 1) : null;

  let most: CostResult["mostExpensive"] = null;
  for (const x of known) {
    if (!most || (x.lineCostTry ?? 0) > most.lineCostTry) {
      most = { productId: x.productId, productName: x.productName, lineCostTry: x.lineCostTry ?? 0 };
    }
  }

  return {
    available: true,
    costPerDaTry: costPerDa,
    totalCostTry: total,
    mostExpensive: most,
    lines: costLines
  };
}
