// components/forms/Step2Soil.tsx
"use client";

import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { safeNumber } from "@/lib/util";

export default function Step2Soil({ project, setProject, settings }: { project: ProjectInput; setProject: (p: ProjectInput) => void; settings: SettingsV1 }) {
  const soil = project.soil;
  const setSoil = (patch: Partial<ProjectInput["soil"]>) => setProject({ ...project, soil: { ...soil, ...patch } });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>pH</Label>
          <Input type="number" step="0.01" value={soil.pH ?? ""} onChange={(e) => setSoil({ pH: safeNumber(e.target.value) })} />
        </div>
        <div>
          <Label>EC</Label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Input
              type="number"
              step="0.01"
              value={soil.ec_value ?? ""}
              onChange={(e) => setSoil({ ec_value: safeNumber(e.target.value) })}
            />
            <Select
              value={soil.ec_unit ?? settings.ui.units.ec}
              onChange={(e) => setSoil({ ec_unit: e.target.value as any })}
            >
              <option value="uS/cm">µS/cm</option>
              <option value="dS/m">dS/m</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>% Kireç</Label>
          <Input type="number" step="0.01" value={soil.limePct ?? ""} onChange={(e) => setSoil({ limePct: safeNumber(e.target.value) })} />
        </div>
        <div>
          <Label>Organik madde (%)</Label>
          <Input type="number" step="0.01" value={soil.omPct ?? ""} onChange={(e) => setSoil({ omPct: safeNumber(e.target.value) })} />
        </div>
      </div>

      <div>
        <Label>Tekstür (kum/kil/mil %)</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" step="0.1" value={soil.sandPct ?? ""} onChange={(e) => setSoil({ sandPct: safeNumber(e.target.value) })} placeholder="Kum %" />
          <Input type="number" step="0.1" value={soil.clayPct ?? ""} onChange={(e) => setSoil({ clayPct: safeNumber(e.target.value) })} placeholder="Kil %" />
          <Input type="number" step="0.1" value={soil.siltPct ?? ""} onChange={(e) => setSoil({ siltPct: safeNumber(e.target.value) })} placeholder="Mil %" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>P (Olsen)</Label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Input
              type="number"
              step="0.01"
              value={soil.p_olsen_value ?? ""}
              onChange={(e) => setSoil({ p_olsen_value: safeNumber(e.target.value) })}
            />
            <Select value={soil.p_olsen_unit ?? "kg/da"} onChange={(e) => setSoil({ p_olsen_unit: e.target.value as any })}>
              <option value="kg/da">kg/da</option>
              <option value="ppm">ppm</option>
            </Select>
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            ppm seçilirse P2O5 lookup bloklanır (BD*derinlik dönüşümü gerekir).
          </div>
        </div>

        <div>
          <Label>K (Kullanılabilir)</Label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Input
              type="number"
              step="0.01"
              value={soil.k_available_value ?? ""}
              onChange={(e) => setSoil({ k_available_value: safeNumber(e.target.value) })}
            />
            <Select value={soil.k_available_unit ?? "kg/da"} onChange={(e) => setSoil({ k_available_unit: e.target.value as any })}>
              <option value="kg/da">kg/da</option>
              <option value="ppm">ppm</option>
            </Select>
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            ppm seçilirse K2O lookup bloklanır (BD*derinlik dönüşümü gerekir).
          </div>
        </div>
      </div>

      <div>
        <Label>Mikro elementler (ppm) — sadece uyarılar</Label>
        <div className="grid grid-cols-5 gap-2">
          {(["Fe", "Mn", "Zn", "Cu", "B"] as const).map((k) => (
            <Input
              key={k}
              type="number"
              step="0.01"
              value={(soil.micros_ppm?.[k] ?? "") as any}
              onChange={(e) => setSoil({ micros_ppm: { ...(soil.micros_ppm ?? {}), [k]: safeNumber(e.target.value) } })}
              placeholder={k}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
