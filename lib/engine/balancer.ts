// lib/engine/balancer.ts
import type { BalanceResult, FertilizerProduct, ProjectInput, SettingsV1 } from "@/lib/types";
import { roundTo } from "@/lib/util";

function findProduct(settings: SettingsV1, id: string) {
  return settings.fertilizerCatalog.find((p) => p.id === id) ?? null;
}

export function balanceFertilizers(args: {
  input: ProjectInput;
  settings: SettingsV1;
  targets: Partial<Record<"N" | "P2O5" | "K2O", number>>;
  blockedNutrients: { N: boolean; P2O5: boolean; K2O: boolean };
}): BalanceResult {
  const { input, settings, targets, blockedNutrients } = args;
  const messages = { farmer: [] as string[], expert: [] as string[] };

  if (blockedNutrients.N && blockedNutrients.P2O5 && blockedNutrients.K2O) {
    return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
  }

  const area = input.area_da;
  const precision = input.prefs.precisionKgDa;

  const pProd = findProduct(settings, input.prefs.pSourceProductId);
  const kProd = findProduct(settings, input.prefs.kSourceProductId);
  const nProd = findProduct(settings, input.prefs.nSourceProductId);

  if (!pProd || !kProd || !nProd) {
    messages.farmer.push("Gübre seçimi eksik.");
    messages.expert.push("Seçilen ürün(ler) katalogda bulunamadı.");
    return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
  }

  // Constraints: avoidChloride or salinity risk hides/disallows KCl
  if (input.prefs.avoidChloride && kProd.id === "kcl") {
    messages.farmer.push("KCl seçilemez (Klorürden kaçın).");
    messages.expert.push("avoidChloride=true iken KCl bloklanır.");
    return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
  }

  const lines: BalanceResult["lines"] = [];
  const contributes = (prod: FertilizerProduct, kgDa: number) => {
    const out: any = {};
    if (prod.nutrients.N) out.N = (prod.nutrients.N ?? 0) * kgDa;
    if (prod.nutrients.P2O5) out.P2O5 = (prod.nutrients.P2O5 ?? 0) * kgDa;
    if (prod.nutrients.K2O) out.K2O = (prod.nutrients.K2O ?? 0) * kgDa;
    return out as Partial<Record<"N" | "P2O5" | "K2O", number>>;
  };

  let N_target = targets.N ?? 0;
  const P_target = blockedNutrients.P2O5 ? 0 : (targets.P2O5 ?? 0);
  const K_target = blockedNutrients.K2O ? 0 : (targets.K2O ?? 0);

  // 1) Choose P product
  if (!blockedNutrients.P2O5) {
    const frac = pProd.nutrients.P2O5 ?? 0;
    if (frac <= 0) {
      messages.farmer.push("Seçilen P gübresinde P2O5 yok.");
      messages.expert.push(`P ürünü P2O5 fraksiyonu 0: ${pProd.id}`);
      return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
    }
    const kgDa = roundTo(P_target / frac, precision);
    const contr = contributes(pProd, kgDa);
    if (contr.N) N_target = Math.max(0, N_target - contr.N);
    lines.push({
      productId: pProd.id,
      productName: pProd.name,
      kgDa,
      totalKg: roundTo(kgDa * area, precision),
      kgPerTree: input.treeCount ? roundTo((kgDa * area) / input.treeCount, precision) : null,
      contributes: contr
    });
  }

  // 4) Choose K product
  if (!blockedNutrients.K2O) {
    const frac = kProd.nutrients.K2O ?? 0;
    if (frac <= 0) {
      messages.farmer.push("Seçilen K gübresinde K2O yok.");
      messages.expert.push(`K ürünü K2O fraksiyonu 0: ${kProd.id}`);
      return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
    }
    const kgDa = roundTo(K_target / frac, precision);
    const contr = contributes(kProd, kgDa);
    if (contr.N) N_target = Math.max(0, N_target - contr.N);
    lines.push({
      productId: kProd.id,
      productName: kProd.name,
      kgDa,
      totalKg: roundTo(kgDa * area, precision),
      kgPerTree: input.treeCount ? roundTo((kgDa * area) / input.treeCount, precision) : null,
      contributes: contr
    });
  }

  // 6) Choose N product for remaining
  if (!blockedNutrients.N) {
    const frac = nProd.nutrients.N ?? 0;
    if (frac <= 0) {
      messages.farmer.push("Seçilen N gübresinde N yok.");
      messages.expert.push(`N ürünü N fraksiyonu 0: ${nProd.id}`);
      return { blocked: true, messages, lines: [], totals: { kgDa: 0, totalKg: 0 }, remainingNkgDa: 0 };
    }
    const remaining = N_target;
    const kgDa = remaining <= 0 ? 0 : roundTo(remaining / frac, precision);
    const contr = contributes(nProd, kgDa);
    lines.push({
      productId: nProd.id,
      productName: nProd.name,
      kgDa,
      totalKg: roundTo(kgDa * area, precision),
      kgPerTree: input.treeCount ? roundTo((kgDa * area) / input.treeCount, precision) : null,
      contributes: contr
    });
  }

  const totalKgDa = roundTo(lines.reduce((s, l) => s + l.kgDa, 0), precision);
  const totalKg = roundTo(lines.reduce((s, l) => s + l.totalKg, 0), precision);

  return {
    blocked: false,
    messages,
    lines,
    totals: { kgDa: totalKgDa, totalKg },
    remainingNkgDa: N_target
  };
}
