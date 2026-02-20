// lib/engine/layer2Clamp.ts
import type { ExplainabilityNutrient, NutrientKey, SettingsV1 } from "@/lib/types";
import { clamp } from "@/lib/util";

export function applyLayer2Clamp(args: {
  crop: string;
  settings: SettingsV1;
  explain: ExplainabilityNutrient;
}): ExplainabilityNutrient {
  const { crop, settings, explain } = args;
  if (explain.status !== "ok" || explain.baseDoseKgDa === undefined) return explain;

  const ranges = settings.cropMeta.maintenanceRanges[crop];
  if (!ranges) return explain;

  const r = ranges[explain.nutrient as NutrientKey];
  if (!r) return explain;

  const before = explain.baseDoseKgDa;
  const after = clamp(before, r.min, r.max);

  if (after !== before) {
    explain.clamped = { before, after, min: r.min, max: r.max };
  }
  explain.finalDoseKgDa = after;
  return explain;
}
