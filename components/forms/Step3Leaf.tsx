// components/forms/Step3Leaf.tsx
"use client";

import type { ProjectInput } from "@/lib/types";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { safeNumber } from "@/lib/util";

export default function Step3Leaf({ project, setProject }: { project: ProjectInput; setProject: (p: ProjectInput) => void }) {
  const leaf = project.leaf ?? { enabled: false, enableLeafCorrectionAdvanced: false, micros_ppm: {} };

  const setLeaf = (patch: Partial<ProjectInput["leaf"]>) => setProject({ ...project, leaf: { ...leaf, ...patch } as any });

  return (
    <div className="space-y-3">
      <Switch checked={leaf.enabled} onCheckedChange={(v) => setLeaf({ enabled: v })} label="Yaprak analizi var" />

      {leaf.enabled && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>N %</Label>
              <Input type="number" step="0.01" value={leaf.n_pct ?? ""} onChange={(e) => setLeaf({ n_pct: safeNumber(e.target.value) })} />
            </div>
            <div>
              <Label>P %</Label>
              <Input type="number" step="0.01" value={leaf.p_pct ?? ""} onChange={(e) => setLeaf({ p_pct: safeNumber(e.target.value) })} />
            </div>
            <div>
              <Label>K %</Label>
              <Input type="number" step="0.01" value={leaf.k_pct ?? ""} onChange={(e) => setLeaf({ k_pct: safeNumber(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Mikro elementler (ppm)</Label>
            <div className="grid grid-cols-5 gap-2">
              {(["Fe", "Mn", "Zn", "Cu", "B"] as const).map((k) => (
                <Input
                  key={k}
                  type="number"
                  step="0.01"
                  value={(leaf.micros_ppm?.[k] ?? "") as any}
                  onChange={(e) => setLeaf({ micros_ppm: { ...(leaf.micros_ppm ?? {}), [k]: safeNumber(e.target.value) } })}
                  placeholder={k}
                />
              ))}
            </div>
          </div>

          <Switch
            checked={!!leaf.enableLeafCorrectionAdvanced}
            onCheckedChange={(v) => setLeaf({ enableLeafCorrectionAdvanced: v })}
            label="(Advanced) Yaprak düzeltmesi ile hedefleri etkilesin"
          />
          <div className="text-xs text-neutral-600">
            Varsayılan OFF: Yaprak verileri yalnızca uyarı/ipuçları üretir.
          </div>
        </>
      )}
    </div>
  );
}
