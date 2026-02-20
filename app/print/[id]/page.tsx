// app/print/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { lsGet } from "@/lib/storage";
import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { SETTINGS_KEY } from "@/lib/seed";
import { makeSeedSettings } from "@/lib/seed";
import { lookupBaseDose } from "@/lib/engine/lookup";
import { applyLayer2Clamp } from "@/lib/engine/layer2Clamp";
import { applyLayer3Adjustments } from "@/lib/engine/layer3Adjust";
import { balanceFertilizers } from "@/lib/engine/balancer";
import { computeCost } from "@/lib/engine/cost";
import { buildSchedule, fillScheduleTotals } from "@/lib/engine/schedule";
import { ecToDSm, roundTo } from "@/lib/util";

function computeAll(input: ProjectInput, settings: SettingsV1) {
  const warn = { farmer: [] as string[], expert: [] as string[] };

  const N = applyLayer3Adjustments({
    input,
    settings,
    globalWarnings: warn,
    explain: applyLayer2Clamp({
      crop: input.crop,
      settings,
      explain: lookupBaseDose({
        nutrient: "N",
        nutrientJson: settings.referenceTables.N,
        settings,
        region: input.region,
        crop: input.crop,
        farming: input.farming,
        allowFarmingFallback: input.allowFarmingFallback,
        soilValue: input.soil.omPct ?? null,
        soilUnitLabel: "OM% (N tablo binleri)"
      })
    })
  });

  const P =
    input.soil.p_olsen_value == null || input.soil.p_olsen_unit === "ppm"
      ? ({
          nutrient: "P2O5",
          status: "blocked",
          messages: [
            {
              farmer: "Fosfor için Olsen P (kg/da) gerekli.",
              expert: "ppm verilmişse kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı gerekir."
            }
          ]
        } as any)
      : applyLayer3Adjustments({
          input,
          settings,
          globalWarnings: warn,
          explain: applyLayer2Clamp({
            crop: input.crop,
            settings,
            explain: lookupBaseDose({
              nutrient: "P2O5",
              nutrientJson: settings.referenceTables.P,
              settings,
              region: input.region,
              crop: input.crop,
              farming: input.farming,
              allowFarmingFallback: input.allowFarmingFallback,
              soilValue: input.soil.p_olsen_value,
              soilUnitLabel: "Olsen P (kg/da)"
            })
          })
        });

  const K =
    input.soil.k_available_value == null || input.soil.k_available_unit === "ppm"
      ? ({
          nutrient: "K2O",
          status: "blocked",
          messages: [
            {
              farmer: "Potasyum için Kullanılabilir K (kg/da) gerekli.",
              expert: "ppm verilmişse kg/da dönüşümü için örnekleme derinliği ve hacim ağırlığı gerekir."
            }
          ]
        } as any)
      : applyLayer3Adjustments({
          input,
          settings,
          globalWarnings: warn,
          explain: applyLayer2Clamp({
            crop: input.crop,
            settings,
            explain: lookupBaseDose({
              nutrient: "K2O",
              nutrientJson: settings.referenceTables.K,
              settings,
              region: input.region,
              crop: input.crop,
              farming: input.farming,
              allowFarmingFallback: input.allowFarmingFallback,
              soilValue: input.soil.k_available_value,
              soilUnitLabel: "Kullanılabilir K (kg/da)"
            })
          })
        });

  const final = (e: any) => (e.status === "ok" ? (e.finalDoseKgDa ?? e.baseDoseKgDa) : undefined);

  const targets = {
    N: final(N),
    P2O5: final(P),
    K2O: final(K)
  };

  const blocked = {
    N: N.status !== "ok",
    P2O5: P.status !== "ok",
    K2O: K.status !== "ok"
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

  const preset =
    settings.schedulePresets.find((p) => p.id === input.prefs.schedulePresetId) ?? settings.schedulePresets[0];
  const isSandy = (input.soil.sandPct ?? 0) >= 60;
  const productsForSchedule = balance.lines
    .filter((l) => l.kgDa > 0)
    .map((l) => {
      const bucket = l.productId === input.prefs.pSourceProductId ? "P" : l.productId === input.prefs.kSourceProductId ? "K" : "N";
      return { productId: l.productId, productName: l.productName, kgDa: l.kgDa, bucket: bucket as "P" | "K" | "N" };
    });

  const schedule = fillScheduleTotals(
    buildSchedule({ preset, startMonth: input.prefs.startMonth, isSandy, products: productsForSchedule }),
    input
  );

  const ec =
    input.soil.ec_value != null && input.soil.ec_unit ? ecToDSm(input.soil.ec_value, input.soil.ec_unit) : null;
  if (ec != null && ec >= 2) {
    warn.farmer.push("Tuzluluk riski: Sülfat formlarını tercih et, klorürden kaçın.");
    warn.expert.push("EC≥2 dS/m: Tuzluluk riski. Klorür kaynakları uygun olmayabilir.");
  }

  // round for print display only
  if (targets.N != null) targets.N = roundTo(targets.N, input.prefs.precisionKgDa);
  if (targets.P2O5 != null) targets.P2O5 = roundTo(targets.P2O5, input.prefs.precisionKgDa);
  if (targets.K2O != null) targets.K2O = roundTo(targets.K2O, input.prefs.precisionKgDa);

  return { targets, explain: { N, P, K }, balance, cost, schedule, warn };
}

export default function PrintPage({ params }: { params: { id: string } }) {
  const [settings, setSettings] = useState<SettingsV1 | null>(null);
  const [project, setProject] = useState<ProjectInput | null>(null);

  useEffect(() => {
    const s = lsGet<SettingsV1>(SETTINGS_KEY) ?? makeSeedSettings();
    setSettings(s);

    const p = lsGet<ProjectInput>(`fert_project_${params.id}`) ?? lsGet<ProjectInput>("fert_project_active_v1");
    setProject(p ?? null);
  }, [params.id]);

  const computed = useMemo(() => {
    if (!settings || !project) return null;
    return computeAll(project, settings);
  }, [settings, project]);

  if (!settings || !project || !computed) return null;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="no-print mb-4 flex justify-end gap-2">
        <button className="rounded-xl border bg-white px-3 py-2 text-sm" onClick={() => window.print()}>
          Yazdır
        </button>
      </div>

      <div className="print-card rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-2 text-2xl font-semibold">{project.projectName}</div>
        <div className="text-sm text-neutral-600">
          Bölge: {project.region} • Bitki: {project.crop} • Tarım: {project.farming} • Alan: {project.area_da} da
        </div>

        <hr className="my-4" />

        <div className="mb-4">
          <div className="text-lg font-semibold">Özet (kg/da)</div>
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600">N</div>
              <div className="text-xl font-semibold">{computed.targets.N ?? "—"}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600">P2O5</div>
              <div className="text-xl font-semibold">{computed.targets.P2O5 ?? "—"}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600">K2O</div>
              <div className="text-xl font-semibold">{computed.targets.K2O ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-lg font-semibold">Gübre Ürünleri</div>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Ürün</th>
                <th className="py-2">kg/da</th>
                <th className="py-2">Toplam kg</th>
                <th className="py-2">kg/ağaç</th>
              </tr>
            </thead>
            <tbody>
              {computed.balance.lines.map((l) => (
                <tr key={l.productId} className="border-b">
                  <td className="py-2">{l.productName}</td>
                  <td className="py-2">{l.kgDa}</td>
                  <td className="py-2">{l.totalKg}</td>
                  <td className="py-2">{l.kgPerTree ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="text-lg font-semibold">Takvim</div>
          {computed.schedule.plans.map((p) => (
            <div key={p.productId} className="mt-2 rounded-xl border p-3">
              <div className="font-semibold">{p.productName}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {p.applications.map((a, idx) => (
                  <div key={idx} className="rounded-lg bg-neutral-50 p-2">
                    <div className="text-neutral-600">{a.label}</div>
                    <div className="font-semibold">
                      {a.kgDa.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} kg/da
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {computed.cost.available && (
          <div className="mb-4">
            <div className="text-lg font-semibold">Maliyet</div>
            <div className="mt-2 text-sm text-neutral-700">
              Toplam: <span className="font-semibold">{computed.cost.totalCostTry?.toFixed(2)} TRY</span>
            </div>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Ürün</th>
                  <th className="py-2">Toplam kg</th>
                  <th className="py-2">Birim (TRY/kg)</th>
                  <th className="py-2">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {computed.cost.lines.map((l) => (
                  <tr key={l.productId} className="border-b">
                    <td className="py-2">{l.productName}</td>
                    <td className="py-2">{l.totalKg}</td>
                    <td className="py-2">{l.unitPriceTryPerKg ?? "—"}</td>
                    <td className="py-2">{l.lineCostTry?.toFixed(2) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-4">
          <div className="text-lg font-semibold">Uyarılar</div>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(project.tone === "farmer" ? computed.warn.farmer : computed.warn.expert).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-lg font-semibold">Açıklanabilirlik (Uzman Ek)</div>
          <pre className="mt-2 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs">
{JSON.stringify(
  {
    N: computed.explain.N,
    P2O5: computed.explain.P,
    K2O: computed.explain.K
  },
  null,
  2
)}
          </pre>
        </div>
      </div>
    </div>
  );
}
