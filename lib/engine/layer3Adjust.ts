// lib/engine/layer3Adjust.ts
import type { AdjustmentRule, ExplainabilityNutrient, ProjectInput, SettingsV1 } from "@/lib/types";
import { clamp } from "@/lib/util";
import { ecToDSm } from "@/lib/util";

export function applyLayer3Adjustments(args: {
  input: ProjectInput;
  settings: SettingsV1;
  explain: ExplainabilityNutrient;
  globalWarnings: { farmer: string[]; expert: string[] };
}): ExplainabilityNutrient {
  const { input, settings, explain, globalWarnings } = args;
  if (explain.status !== "ok") return explain;
  const base = explain.finalDoseKgDa ?? explain.baseDoseKgDa ?? 0;

  const rules = settings.adjustmentRules;
  const applied: ExplainabilityNutrient["adjustments"] = [];
  const nutrient = explain.nutrient;

  if (!input.prefs.enableLayer3Adjustments) {
    explain.finalDoseKgDa = base;
    explain.adjustments = [];
    return explain;
  }

  const soil = input.soil;
  const pH = soil.pH ?? null;
  const limePct = soil.limePct ?? null;
  const omPct = soil.omPct ?? null;
  const sandPct = soil.sandPct ?? null;
  const ec =
    soil.ec_value != null && soil.ec_unit
      ? ecToDSm(soil.ec_value, soil.ec_unit)
      : null;

  const matches = (r: AdjustmentRule) => {
    const c = r.condition;
    if (c.pH_gte != null && !(pH != null && pH >= c.pH_gte)) return false;
    if (c.limePct_gte != null && !(limePct != null && limePct >= c.limePct_gte)) return false;
    if (c.omPct_lt != null && !(omPct != null && omPct < c.omPct_lt)) return false;
    if (c.ec_dSm_gte != null && !(ec != null && ec >= c.ec_dSm_gte)) return false;
    if (c.sandPct_gte != null && !(sandPct != null && sandPct >= c.sandPct_gte)) return false;
    if (c.irrigationIs != null && input.irrigation !== c.irrigationIs) return false;
    return true;
  };

  // Modest + capped: max +/-20% per nutrient; max combined +/-25%
  let combinedMultiplier = 1;
  let current = base;

  for (const r of rules) {
    if (!r.appliesTo.includes(nutrient)) continue;
    if (!matches(r)) continue;

    const mult = r.multiplierByNutrient[nutrient] ?? 1;

    if (r.warningOnly) {
      globalWarnings.farmer.push(r.messageFarmer);
      globalWarnings.expert.push(r.messageExpert);
      applied.push({
        nutrient,
        ruleId: r.id,
        multiplier: 1,
        before: current,
        after: current,
        messageFarmer: r.messageFarmer,
        messageExpert: r.messageExpert,
        warningOnly: true
      });
      continue;
    }

    const before = current;
    const perNutrientCapped = clamp(mult, 0.8, 1.2);
    const nextCombined = combinedMultiplier * perNutrientCapped;
    const combinedCapped = clamp(nextCombined, 0.75, 1.25);
    // adjust per application to respect combined cap
    const effective = combinedCapped / combinedMultiplier;

    current = before * effective;
    combinedMultiplier = combinedCapped;

    applied.push({
      nutrient,
      ruleId: r.id,
      multiplier: effective,
      before,
      after: current,
      messageFarmer: r.messageFarmer,
      messageExpert: r.messageExpert
    });
  }

  explain.adjustments = applied ?? [];
  explain.finalDoseKgDa = current;
  return explain;
}
