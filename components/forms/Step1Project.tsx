// components/forms/Step1Project.tsx
"use client";

import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import ToneSwitch from "@/components/ToneSwitch";
import AvailabilityBadges from "@/components/AvailabilityBadges";
import { safeNumber } from "@/lib/util";

export default function Step1Project({
  project,
  setProject,
  settings,
  regions,
  crops,
  availability
}: {
  project: ProjectInput;
  setProject: (p: ProjectInput) => void;
  settings: SettingsV1;
  regions: string[];
  crops: string[];
  availability: { N: boolean; P: boolean; K: boolean };
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Proje adı</Label>
        <Input value={project.projectName} onChange={(e) => setProject({ ...project, projectName: e.target.value })} />
      </div>

      <div>
        <Label>Bölge</Label>
        <Select value={project.region} onChange={(e) => setProject({ ...project, region: e.target.value })}>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Bitki</Label>
        <Select value={project.crop} onChange={(e) => setProject({ ...project, crop: e.target.value })}>
          {crops.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="mt-2">
          <AvailabilityBadges availability={availability} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tarım Şekli</Label>
          <Select value={project.farming} onChange={(e) => setProject({ ...project, farming: e.target.value as any })}>
            <option value="Sulu">Sulu</option>
            <option value="Kuru">Kuru</option>
          </Select>
        </div>
        <div>
          <Label>Sulama sistemi</Label>
          <Select value={project.irrigation} onChange={(e) => setProject({ ...project, irrigation: e.target.value as any })}>
            <option value="Damla">Damla</option>
            <option value="Yağmurlama">Yağmurlama</option>
            <option value="Salma">Salma</option>
            <option value="Kuru">Kuru</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Alan</Label>
          <Input
            type="number"
            step="0.01"
            value={project.area_da}
            onChange={(e) => setProject({ ...project, area_da: safeNumber(e.target.value) ?? project.area_da })}
          />
          <div className="mt-1 text-xs text-neutral-600">da (dekar)</div>
        </div>
        <div>
          <Label>Ağaç sayısı (opsiyonel)</Label>
          <Input
            type="number"
            value={project.treeCount ?? ""}
            onChange={(e) => setProject({ ...project, treeCount: safeNumber(e.target.value) })}
          />
        </div>
      </div>

      <div className="pt-2">
        <ToneSwitch
          tone={project.tone}
          onChange={(tone) => setProject({ ...project, tone })}
        />
      </div>

      <div className="text-xs text-neutral-600">
        Not: Tarım şekli fallback için Step 4’te “Tarım şekli otomatik uyarlansın” seçeneğini kullan.
      </div>
    </div>
  );
}
