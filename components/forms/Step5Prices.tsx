// components/forms/Step5Prices.tsx
"use client";

import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { safeNumber } from "@/lib/util";

export default function Step5Prices({ project, setProject, settings }: { project: ProjectInput; setProject: (p: ProjectInput) => void; settings: SettingsV1 }) {
  const setPrice = (productId: string, val: number | null) => {
    setProject({ ...project, prices: { ...project.prices, [productId]: val } });
  };

  const selected = new Set([project.prefs.pSourceProductId, project.prefs.kSourceProductId, project.prefs.nSourceProductId]);
  const products = settings.fertilizerCatalog.filter((p) => selected.has(p.id));

  const saveScenario = (key: "A" | "B") => {
    const label = key === "A" ? "Senaryo A" : "Senaryo B";
    setProject({
      ...project,
      scenarios: {
        ...(project.scenarios ?? {}),
        [key]: { label, prefs: project.prefs, prices: project.prices }
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-neutral-700">Seçili ürünler için TRY/kg gir (opsiyonel).</div>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_180px] items-end gap-3">
            <div>
              <Label>{p.name}</Label>
              <div className="text-xs text-neutral-600">ID: {p.id}</div>
            </div>
            <Input
              type="number"
              step="0.01"
              value={project.prices[p.id] ?? ""}
              onChange={(e) => setPrice(p.id, safeNumber(e.target.value))}
              placeholder="TRY/kg"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => saveScenario("A")}>
          Senaryo A Kaydet
        </Button>
        <Button variant="secondary" onClick={() => saveScenario("B")}>
          Senaryo B Kaydet
        </Button>
      </div>

      <div className="rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-700">
        Senaryolar, farklı P kaynağı (DAP vs TSP) gibi karşılaştırmalar için saklanır.
      </div>
    </div>
  );
}
