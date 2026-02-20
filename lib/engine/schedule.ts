// lib/engine/schedule.ts
import type { ProjectInput, SchedulePreset, ScheduleResult } from "@/lib/types";
function sum(fracs: number[]) {
  return fracs.reduce((a, b) => a + b, 0);
}

export function validateFractions(apps: { label: string; fraction: number }[]) {
  const s = sum(apps.map((a) => a.fraction));
  // deterministic tolerance
  return Math.abs(s - 1) < 1e-9;
}

export function buildSchedule(args: {
  preset: SchedulePreset;
  startMonth: string;
  isSandy: boolean;
  products: { productId: string; productName: string; kgDa: number; bucket: "P" | "K" | "N" }[];
}): ScheduleResult {
  const { preset, startMonth, isSandy, products } = args;

  const rules = preset.rules;
  const bucketRules = (b: "P" | "K" | "N") => {
    if (isSandy && rules.sandyOverrides?.[b]) return rules.sandyOverrides[b]!;
    return rules.buckets[b];
  };

  const plans = products.map((p) => {
    const br = bucketRules(p.bucket).applications;
    const ok = validateFractions(br);
    const apps = ok
      ? br
      : // deterministic fallback: single shot if preset invalid
        [{ label: "Tek uygulama", fraction: 1 }];

    return {
      productId: p.productId,
      productName: p.productName,
      applications: apps.map((a) => ({
        label: a.label,
        fraction: a.fraction,
        kgDa: p.kgDa * a.fraction,
        totalKg: 0 // filled by caller if needed
      }))
    };
  });

  return {
    presetId: preset.id,
    presetName: preset.name,
    startMonth,
    plans: plans.map((pl) => ({
      ...pl,
      applications: pl.applications.map((a) => ({ ...a, totalKg: 0 }))
    })),
    messages: { farmer: [], expert: [] }
  };
}
export function fillScheduleTotals(schedule: ScheduleResult, input: ProjectInput): ScheduleResult {
  const areaDa = Number((input as any).area_da ?? (input as any).areaDa ?? 1);

  return {
    ...schedule,
    plans: schedule.plans.map((plan: any) => {
      const applications = (plan.applications ?? []).map((app: any) => {
        const kgDa = Number(app.kgDa ?? 0);
        const totalKg = kgDa * areaDa;
        return { ...app, totalKg };
      });

      const planTotalKg = applications.reduce((s: number, a: any) => s + Number(a.totalKg ?? 0), 0);

      return {
        ...plan,
        applications,
        totalKg: planTotalKg,
      };
    }),
  };
}
