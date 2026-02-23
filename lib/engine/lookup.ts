// lib/engine/lookup.ts
import type {
  ExplainabilityNutrient,
  FarmingType,
  NutrientKey,
  NutrientTablesJson,
  SettingsV1
} from "@/lib/types";
import { normalizeBins, matchBin } from "@/lib/engine/binning";
import { normalizeName, parseTableNumber } from "@/lib/util";

function selectRegionTableKey(args: {
  region: string;
  crop: string;
  nutrientJson: NutrientTablesJson;
}): { regionTableKey: string | null; tableId?: string } {
  const { region, crop, nutrientJson } = args;
  const keys = nutrientJson.supported_region_tables.filter((k) => k.startsWith(`${region}|`));
  if (keys.length === 0) return { regionTableKey: null };

  // If preferredTableOrder exists, respect it as a primary deterministic tie-breaker list
  const pref = nutrientJson.meta?.preferredTableOrder ?? [];
  const prefFiltered = pref.filter((k) => keys.includes(k));

  const candidateKeys = prefFiltered.length > 0 ? prefFiltered : keys;

  // Prefer table with more crop matches (exact/normalized) across its crop list
  const cropNorm = normalizeName(crop);

  const score = (k: string) => {
    const cropMap = nutrientJson.tables_by_regionTable[k] ?? {};
    const crops = Object.keys(cropMap);
    let exact = 0;
    let norm = 0;
    for (const c of crops) {
      if (c === crop) exact++;
      if (normalizeName(c) === cropNorm) norm++;
    }
    return { exact, norm, total: exact * 2 + norm };
  };

  if (prefFiltered.length > 0) {
    for (const k of candidateKeys) {
      const s = score(k);
      if (s.total > 0) {
        const m = k.match(/\|table(\d+)/i);
        return { regionTableKey: k, tableId: m ? `table${m[1]}` : undefined };
      }
    }
    const m = candidateKeys[0].match(/\|table(\d+)/i);
    return { regionTableKey: candidateKeys[0], tableId: m ? `table${m[1]}` : undefined };
  }

  let best = candidateKeys[0];
  let bestScore = score(best);
  for (const k of candidateKeys.slice(1)) {
    const s = score(k);
    if (s.total > bestScore.total) {
      best = k;
      bestScore = s;
      continue;
    }
    if (s.total === bestScore.total) {
      // lower table number wins
      const a = parseTableNumber(k);
      const b = parseTableNumber(best);
      if (a < b) best = k;
    }
  }

  const m = best.match(/\|table(\d+)/i);
  return { regionTableKey: best, tableId: m ? `table${m[1]}` : undefined };
}

function resolveCropKey(args: {
  crop: string;
  cropMap: Record<string, any>;
  settings: SettingsV1;
}): { cropKey: string | null; strategy?: "exact" | "normalized" | "alias" } {
  const { crop, cropMap, settings } = args;

  if (cropMap[crop]) return { cropKey: crop, strategy: "exact" };

  const cropNorm = normalizeName(crop);
  for (const k of Object.keys(cropMap)) {
    if (normalizeName(k) === cropNorm) return { cropKey: k, strategy: "normalized" };
  }

  const alias = settings.cropMeta.aliases[cropNorm];
  if (alias) {
    if (cropMap[alias]) return { cropKey: alias, strategy: "alias" };
    // try normalized on alias too
    const aliasNorm = normalizeName(alias);
    for (const k of Object.keys(cropMap)) {
      if (normalizeName(k) === aliasNorm) return { cropKey: k, strategy: "alias" };
    }
  }

  return { cropKey: null };
}

export function lookupBaseDose(args: {
  nutrient: NutrientKey;
  nutrientJson: NutrientTablesJson;
  settings: SettingsV1;
  region: string;
  crop: string;
  farming: FarmingType;
  allowFarmingFallback: boolean;
  soilValue: number | null;
  soilUnitLabel: string;
}): ExplainabilityNutrient {
  const {
    nutrient,
    nutrientJson,
    settings,
    region,
    crop,
    farming,
    allowFarmingFallback,
    soilValue,
    soilUnitLabel
  } = args;

  const explain: ExplainabilityNutrient = {
    nutrient,
    status: "missing",
    messages: [],
    farmingRequested: farming
  };

  if (soilValue === null) {
    explain.status = "blocked";
    return explain;
  }

  const sel = selectRegionTableKey({ region, crop, nutrientJson });
  if (!sel.regionTableKey) {
    explain.status = "blocked";
    explain.messages.push({
      farmer: "Referans tablosunda bulunamadı.",
      expert: `Bölge için regionTableKey bulunamadı: "${region}".`
    });
    return explain;
  }
  explain.regionTableKey = sel.regionTableKey;
  explain.tableId = sel.tableId;

  const regionTable = nutrientJson.tables_by_regionTable[sel.regionTableKey];
  if (!regionTable) {
    explain.status = "blocked";
    explain.messages.push({
      farmer: "Referans tablosunda bulunamadı.",
      expert: `tables_by_regionTable içinde anahtar yok: "${sel.regionTableKey}".`
    });
    return explain;
  }

  const cropResolved = resolveCropKey({ crop, cropMap: regionTable, settings });
  if (!cropResolved.cropKey) {
    explain.status = "blocked";
    explain.messages.push({
      farmer: "Referans tablosunda bulunamadı.",
      expert: `Bitki eşleşmesi yok: "${crop}". (exact/normalized/alias başarısız)`
    });
    return explain;
  }
  explain.cropMatched = cropResolved.cropKey;
  explain.cropMatchStrategy = cropResolved.strategy;

  const cropNode = regionTable[cropResolved.cropKey] as Record<string, any>;
  const farmingNode = cropNode[farming] as Record<string, number | null> | undefined;

  let farmingUsed: FarmingType = farming;
  let farmingFallbackUsed = false;

  if (!farmingNode) {
    const other: FarmingType = farming === "Sulu" ? "Kuru" : "Sulu";
    const otherNode = cropNode[other] as Record<string, number | null> | undefined;

    if (otherNode && allowFarmingFallback) {
      farmingUsed = other;
      farmingFallbackUsed = true;
    } else {
      explain.status = "blocked";
      explain.messages.push({
        farmer: "Bu tarım şeklinde öneri yok.",
        expert:
          allowFarmingFallback && otherNode
            ? "Tarım şekli fallback kullanıcı izni olmadan kullanılamaz."
            : `Tarım şekli yok: "${farming}" (ve fallback yok/izin yok).`
      });
      return explain;
    }
  }

  explain.farmingUsed = farmingUsed;
  explain.farmingFallbackUsed = farmingFallbackUsed;

  const node = cropNode[farmingUsed] as Record<string, number | null>;
  const bins = normalizeBins(nutrientJson.bins);
  const bin = matchBin(soilValue, bins);

  explain.soilValueUsed = soilValue;
  explain.soilUnitUsed = soilUnitLabel;

  if (!bin) {
    explain.status = "blocked";
    explain.messages.push({
      farmer: "Referans tabloda eşleşme yok.",
      expert: `Bin eşleşmesi yok. value=${soilValue}, bins=${JSON.stringify(bins)}`
    });
    return explain;
  }
  explain.bin = bin;

  const cell = node[bin];
  if (cell === null || cell === undefined) {
    explain.status = "blocked";
    explain.messages.push({
      farmer: "Bu tarım şeklinde öneri yok.",
      expert: `Tablo hücresi null/eksik. crop=${explain.cropMatched}, farming=${farmingUsed}, bin=${bin}`
    });
    return explain;
  }

  explain.status = "ok";
  explain.baseDoseKgDa = cell;
  return explain;
}
