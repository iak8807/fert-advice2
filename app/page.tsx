// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { makeSeedSettings, SETTINGS_KEY } from "@/lib/seed";
import { lsGet, lsSet } from "@/lib/storage";
import type { EngineResult, ProjectInput, SettingsV1 } from "@/lib/types";
import { todayISO, ecToDSm, normalizeName, roundTo } from "@/lib/util";
import { lookupBaseDose } from "@/lib/engine/lookup";
import { applyLayer2Clamp } from "@/lib/engine/layer2Clamp";
import { applyLayer3Adjustments } from "@/lib/engine/layer3Adjust";
import { balanceFertilizers } from "@/lib/engine/balancer";
import { computeCost } from "@/lib/engine/cost";
import { buildSchedule, fillScheduleTotals } from "@/lib/engine/schedule";

import Stepper from "@/components/Stepper";
import PreviewPanels from "@/components/PreviewPanels";
import SettingsDrawer from "@/components/SettingsDrawer";
import { Button } from "@/components/ui/Button";

function uuid() {
  // deterministic enough for local project storage; not crypto
  return "p_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

const PROJECT_KEY = "fert_project_active_v1";

function seedIfNeeded() {
  const existing = lsGet<SettingsV1>(SETTINGS_KEY);
  if (existing) return existing;
  const seed = makeSeedSettings();
  lsSet(SETTINGS_KEY, seed);
  return seed;
}

function getRegions(settings: SettingsV1): string[] {
  const all = new Set<string>();
  const add = (keys?: string[]) => keys?.forEach((k) => all.add(k));
  add(settings?.referenceTables?.N?.supportedRegions);
  add(settings?.referenceTables?.P?.supportedRegions);
  add(settings?.referenceTables?.K?.supportedRegions);
  return Array.from(all).sort((a, b) => a.localeCompare(b, "tr"));
}

function getCrops(settings: SettingsV1): string[] {
  // union across all tables
  const crops = new Set<string>();
  const addFrom = (tables: any) => {
    const by = tables.tables_by_regionTable || {};
    for (const k of Object.keys(by)) {
      for (const crop of Object.keys(by[k] || {})) crops.add(crop);
    }
  };
  addFrom(settings.referenceTables.N);
  addFrom(settings.referenceTables.P);
  addFrom(settings.referenceTables.K);
  return Array.from(crops).sort((a, b) => a.localeCompare(b, "tr"));
}

function availability(settings: SettingsV1, region: string, crop: string) {
  const has = (json: any) => {
    const keys = ((json?.supported_region_tables ?? []) as string[]).filter((k) => k.startsWith(`${region}|`));
    for (const k of keys) {
      const node = json.tables_by_regionTable?.[k];
      if (!node) continue;
      // exact/normalized/alias check
      if (node[crop]) return true;
      const cropNorm = normalizeName(crop);
      for (const c of Object.keys(node)) if (normalizeName(c) === cropNorm) return true;
      const alias = settings.cropMeta.aliases[cropNorm];
      if (alias && node[alias]) return true;
    }
    return false;
  };
  return { N: has(settings.referenceTables.N), P: has(settings.referenceTables.P), K: has(settings.referenceTables.K) };
}

function makeEmptyProject(settings: SettingsV1): ProjectInput {
  return {
    id: uuid(),
    createdAtISO: todayISO(),
    projectName: "Yeni Proje",
    region: getRegions(settings)[0] ?? "Akdeniz",
    crop: getCrops(settings)[0] ?? "Zeytin",
    farming: "Kuru",
    allowFarmingFallback: false,
    irrigation: "Kuru",
    area_da: 1,
    treeCount: null,
    tone: settings.ui.tone,
    soil: {
      pH: null,
      ec_value: null,
      ec_unit: settings.ui.units.ec,
      limePct: null,
      omPct: null,
      sandPct: null,
      clayPct: null,
      siltPct: null,
      p_olsen_value: null,
      p_olsen_unit: settings.ui.units.p,
      k_available_value: null,
      k_available_unit: settings.ui.units.k,
      micros_ppm: {}
    },
    leaf: { enabled: false, enableLeafCorrectionAdvanced: false, micros_ppm: {} },
    prefs: {
      enableLayer3Adjustments: false,
      avoidChloride: false,
      pSourceProductId: "dap",
      kSourceProductId: "k2so4",
      nSourceProductId: "urea",
      precisionKgDa: settings.ui.precisionKgDa,
      schedulePresetId: "classic",
      startMonth: "Mart",
      fertigationApplications: 6
    },
    prices: { ...settings.priceCatalog },
    scenarios: {}
  };
}

function computeEngine(input: ProjectInput, settings: SettingsV1): {
  engine: EngineResult;
  balance: ReturnType<typeof balanceFertilizers>;
  cost: ReturnType<typeof computeCost>;
  schedule: ReturnType<typeof fillScheduleTotals>;
} {
  const warn = { farmer: [] as string[], expert: [] as string[] };

  const explainN = (() => {
    const soilValue = input.soil.omPct == null ? null : input.soil.omPct; // NOTE: placeholder; real N tables typically use soil N/OM class; user-provided JSON defines bins
    return lookupBaseDose({
      nutrient: "N",
      nutrientJson: settings.referenceTables.N,
      settings,
      region: input.region,
      crop: input.crop,
      farming: input.farming,
      allowFarmingFallback: input.allowFarmingFallback,
      soilValue: soilValue, // N lookup uses whatever bins in N JSON expect; example uses OM% here for determinism
      soilUnitLabel: "OM% (N tablo binleri)"
    });
  })();

  const explainP = (() => {
    const v = input.soil.p_olsen_value ?? null;
    const unit = input.soil.p_olsen_unit ?? "kg/da";
    if (v == null) {
      return {
        nutrient: "P2O5" as const,
        status: "blocked" as const,
        messages: [
          {
            farmer: "Fosfor için Olsen P (kg/da) gerekli.",
            expert: "ppm verilmişse kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı gerekir."
          }
        ]
      };
    }
    if (unit === "ppm") {
      return {
        nutrient: "P2O5" as const,
        status: "blocked" as const,
        messages: [
          {
            farmer: "Fosfor için Olsen P (kg/da) gerekli.",
            expert: "ppm verilmiş: kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı (BD) gerekir."
          }
        ]
      };
    }
    return lookupBaseDose({
      nutrient: "P2O5",
      nutrientJson: settings.referenceTables.P,
      settings,
      region: input.region,
      crop: input.crop,
      farming: input.farming,
      allowFarmingFallback: input.allowFarmingFallback,
      soilValue: v,
      soilUnitLabel: "Olsen P (kg/da)"
    });
  })();

  const explainK = (() => {
    const v = input.soil.k_available_value ?? null;
    const unit = input.soil.k_available_unit ?? "kg/da";
    if (v == null) {
      return {
        nutrient: "K2O" as const,
        status: "blocked" as const,
        messages: [
          {
            farmer: "Potasyum için Kullanılabilir K (kg/da) gerekli.",
            expert: "ppm verilmişse kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı gerekir."
          }
        ]
      };
    }
    if (unit === "ppm") {
      return {
        nutrient: "K2O" as const,
        status: "blocked" as const,
        messages: [
          {
            farmer: "Potasyum için Kullanılabilir K (kg/da) gerekli.",
            expert: "ppm verilmiş: kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı (BD) gerekir."
          }
        ]
      };
    }
    return lookupBaseDose({
      nutrient: "K2O",
      nutrientJson: settings.referenceTables.K,
      settings,
      region: input.region,
      crop: input.crop,
      farming: input.farming,
      allowFarmingFallback: input.allowFarmingFallback,
      soilValue: v,
      soilUnitLabel: "Kullanılabilir K (kg/da)"
    });
  })();

  // Layer 2 clamp
  const cN = applyLayer2Clamp({ crop: input.crop, settings, explain: explainN });
  const cP = applyLayer2Clamp({ crop: input.crop, settings, explain: explainP as any });
  const cK = applyLayer2Clamp({ crop: input.crop, settings, explain: explainK as any });

  // Layer 3 adjustments
  const aN = applyLayer3Adjustments({ input, settings, explain: cN, globalWarnings: warn });
  const aP = applyLayer3Adjustments({ input, settings, explain: cP as any, globalWarnings: warn });
  const aK = applyLayer3Adjustments({ input, settings, explain: cK as any, globalWarnings: warn });

  // Ensure finalDose populated
  const final = (e: any) => (e.status === "ok" ? (e.finalDoseKgDa ?? e.baseDoseKgDa) : undefined);

  const targets = {
    N: final(aN),
    P2O5: final(aP),
    K2O: final(aK)
  };

  // Leaf: warnings only by default (deterministic)
  if (input.leaf?.enabled) {
    warn.farmer.push("Yaprak analizi: sadece uyarı/ipuçları için kullanılır.");
    warn.expert.push("Yaprak analizi varsayılan olarak hedef dozları değiştirmez (advanced OFF).");
  }

  const engine: EngineResult = {
    targets: Object.fromEntries(Object.entries(targets).filter(([, v]) => v != null)) as any,
    explain: {
      N: { ...aN, finalDoseKgDa: targets.N },
      P2O5: { ...(aP as any), finalDoseKgDa: targets.P2O5 },
      K2O: { ...(aK as any), finalDoseKgDa: targets.K2O }
    } as any,
    warnings: warn
  };

  const blocked = {
    N: engine.explain.N.status !== "ok",
    P2O5: engine.explain.P2O5.status !== "ok",
    K2O: engine.explain.K2O.status !== "ok"
  };

  const balance = balanceFertilizers({
    input,
    settings,
    targets: targets as any,
    blockedNutrients: blocked
  });

  const cost = computeCost({
    lines: balance.lines.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      kgDa: l.kgDa,
      totalKg: l.totalKg
    })),
    prices: input.prices,
    area_da: input.area_da
  });

  const preset = settings.schedulePresets.find((p) => p.id === input.prefs.schedulePresetId) ?? settings.schedulePresets[0];
  const isSandy = (input.soil.sandPct ?? 0) >= 60;

  const productsForSchedule = balance.lines
    .filter((l) => l.kgDa > 0)
    .map((l) => {
      const bucket = l.productId === input.prefs.pSourceProductId ? "P" : l.productId === input.prefs.kSourceProductId ? "K" : "N";
      return { productId: l.productId, productName: l.productName, kgDa: l.kgDa, bucket: bucket as "P" | "K" | "N" };
    });

  const scheduleBase = buildSchedule({
    preset,
    startMonth: input.prefs.startMonth,
    isSandy,
    products: productsForSchedule
  });
  const schedule = fillScheduleTotals(scheduleBase, input);

  // Extra deterministic constraints messaging
  const ec =
    input.soil.ec_value != null && input.soil.ec_unit
      ? ecToDSm(input.soil.ec_value, input.soil.ec_unit)
      : null;
  const salinityRisk = ec != null && ec >= 2;
  if (salinityRisk || input.prefs.avoidChloride) {
    if (input.prefs.kSourceProductId === "kcl") {
      engine.warnings.farmer.push("KCl seçili ama klorür/tuzluluk kısıtı var: K kaynağını değiştir.");
      engine.warnings.expert.push("KCl, avoidChloride veya EC riski altında önerilmez.");
    }
  }

  // Expert hint: high pH & high lime
  if ((input.soil.pH ?? 0) >= 7.8 && (input.soil.limePct ?? 0) >= 15) {
    engine.warnings.expert.push("Yüksek pH + yüksek kireç: MAP/TSP bant uygulama (band placement) önerilir.");
    engine.warnings.farmer.push("pH+kireç yüksek: Fosforu banttan vermek işe yarayabilir.");
  }

  // Ensure determinism: round targets for display only (not altering calculations)
  if (engine.targets.N != null) engine.targets.N = roundTo(engine.targets.N, input.prefs.precisionKgDa);
  if (engine.targets.P2O5 != null) engine.targets.P2O5 = roundTo(engine.targets.P2O5, input.prefs.precisionKgDa);
  if (engine.targets.K2O != null) engine.targets.K2O = roundTo(engine.targets.K2O, input.prefs.precisionKgDa);

  return { engine, balance, cost, schedule };
}

export default function Page() {
  const [settings, setSettings] = useState<SettingsV1 | null>(null);
  const [project, setProject] = useState<ProjectInput | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const s = seedIfNeeded();
    setSettings(s);

    const p = lsGet<ProjectInput>(PROJECT_KEY);
    if (p) setProject(p);
    else {
      const np = makeEmptyProject(s);
      lsSet(PROJECT_KEY, np);
      setProject(np);
    }
  }, []);

  useEffect(() => {
    if (!project) return;
    lsSet(PROJECT_KEY, project);
  }, [project]);

  const regions = useMemo(() => (settings ? getRegions(settings) : []), [settings]);
  const crops = useMemo(() => (settings ? getCrops(settings) : []), [settings]);

  const computed = useMemo(() => {
    if (!settings || !project) return null;
    return computeEngine(project, settings);
  }, [settings, project]);

  if (!settings || !project) return null;

  const avail = availability(settings, project.region, project.crop);

  const fillSample = () => {
    const updated: ProjectInput = {
      ...project,
      projectName: "Örnek Zeytin Projesi",
      region: "Akdeniz",
      crop: "Zeytin",
      farming: "Kuru",
      irrigation: "Damla",
      area_da: 8,
      soil: {
        ...project.soil,
        pH: 7.9,
        ec_value: 394,
        ec_unit: "uS/cm",
        limePct: 14.9,
        omPct: 2.5,
        sandPct: 37,
        clayPct: 29,
        siltPct: 34,
        p_olsen_value: 3.25,
        p_olsen_unit: "kg/da",
        k_available_value: 58.25,
        k_available_unit: "kg/da"
      }
    };
    setProject(updated);
  };

  const resetProject = () => {
    const np = makeEmptyProject(settings);
    lsSet(PROJECT_KEY, np);
    setProject(np);
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Deterministik Gübre Önerisi</div>
          <div className="text-sm text-neutral-600">
            Aynı girişler ⇒ aynı çıktılar • Referans tabloları zorunlu • Açıklanabilir
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            Ayarlar
          </Button>
          <Button variant="secondary" onClick={fillSample}>
            Örnek Veri Doldur
          </Button>
          <Button variant="ghost" onClick={resetProject}>
            Sıfırla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Stepper
          project={project}
          setProject={setProject}
          settings={settings}
          setSettings={setSettings}
          regions={regions}
          crops={crops}
          availability={avail}
        />
        <PreviewPanels project={project} computed={computed} settings={settings} />
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        onResetToSeed={() => {
          const seed = makeSeedSettings();
          lsSet(SETTINGS_KEY, seed);
          setSettings(seed);
        }}
      />
    </div>
  );
}
