// components/forms/Step4Prefs.tsx
"use client";

import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

export default function Step4Prefs({ project, setProject, settings }: { project: ProjectInput; setProject: (p: ProjectInput) => void; settings: SettingsV1 }) {
  const prefs = project.prefs;
  const setPrefs = (patch: Partial<ProjectInput["prefs"]>) => setProject({ ...project, prefs: { ...prefs, ...patch } });

  const products = settings.fertilizerCatalog;
  const pOptions = products.filter((p) => p.nutrients.P2O5);
  const kOptions = products.filter((p) => p.nutrients.K2O);
  const nOptions = products.filter((p) => p.nutrients.N && !p.nutrients.P2O5 && !p.nutrients.K2O);

  return (
    <div className="space-y-3">
      <Switch checked={prefs.enableLayer3Adjustments} onCheckedChange={(v) => setPrefs({ enableLayer3Adjustments: v })} label="Layer-3 düzeltmeleri" />
      <Switch checked={prefs.avoidChloride} onCheckedChange={(v) => setPrefs({ avoidChloride: v })} label="Klorürden kaçın" />

      <Switch
        checked={project.allowFarmingFallback}
        onCheckedChange={(v) => setProject({ ...project, allowFarmingFallback: v })}
        label="Tarım şekli otomatik uyarlansın (fallback)"
      />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>P kaynağı</Label>
          <Select value={prefs.pSourceProductId} onChange={(e) => setPrefs({ pSourceProductId: e.target.value })}>
            {pOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>K kaynağı</Label>
          <Select value={prefs.kSourceProductId} onChange={(e) => setPrefs({ kSourceProductId: e.target.value })}>
            {kOptions.map((p) => (
              <option key={p.id} value={p.id} disabled={prefs.avoidChloride && p.id === "kcl"}>
                {p.name}
              </option>
            ))}
          </Select>
          {prefs.avoidChloride && prefs.kSourceProductId === "kcl" && (
            <div className="mt-1 text-xs text-rose-700">KCl bloklu. K kaynağını değiştir.</div>
          )}
        </div>
        <div>
          <Label>N kaynağı</Label>
          <Select value={prefs.nSourceProductId} onChange={(e) => setPrefs({ nSourceProductId: e.target.value })}>
            {nOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {/* allow also compound N sources if user insists via settings */}
            {products
              .filter((p) => p.nutrients.N && (p.nutrients.P2O5 || p.nutrients.K2O))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (kompoze)
                </option>
              ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Yuvarlama hassasiyeti</Label>
          <Select value={String(prefs.precisionKgDa)} onChange={(e) => setPrefs({ precisionKgDa: Number(e.target.value) as any })}>
            <option value="0.1">0.1 kg/da</option>
            <option value="0.01">0.01 kg/da</option>
          </Select>
        </div>

        <div>
          <Label>Takvim preset</Label>
          <Select value={prefs.schedulePresetId} onChange={(e) => setPrefs({ schedulePresetId: e.target.value })}>
            {settings.schedulePresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Başlangıç ayı</Label>
          <Select value={prefs.startMonth} onChange={(e) => setPrefs({ startMonth: e.target.value })}>
            {["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Fertigation uygulama sayısı</Label>
          <Select value={String(prefs.fertigationApplications)} onChange={(e) => setPrefs({ fertigationApplications: Number(e.target.value) as any })}>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
          </Select>
          <div className="mt-1 text-xs text-neutral-600">Preset bunu kullanmıyorsa sadece bilgi amaçlıdır.</div>
        </div>
      </div>
    </div>
  );
}
