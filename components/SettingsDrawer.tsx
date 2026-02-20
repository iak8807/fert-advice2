// components/SettingsDrawer.tsx
"use client";

import type { SettingsV1 } from "@/lib/types";
import { SETTINGS_KEY, makeSeedSettings } from "@/lib/seed";
import { lsSet } from "@/lib/storage";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { safeNumber } from "@/lib/util";

export default function SettingsDrawer({
  open,
  onOpenChange,
  settings,
  setSettings,
  onResetToSeed
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: SettingsV1;
  setSettings: (s: SettingsV1) => void;
  onResetToSeed: () => void;
}) {
  if (!open) return null;

  const updatePrice = (id: string, v: number | null) => {
    const next: SettingsV1 = { ...settings, priceCatalog: { ...settings.priceCatalog, [id]: v } };
    setSettings(next);
    lsSet(SETTINGS_KEY, next);
  };

  const updateAlias = (from: string, to: string) => {
    const next: SettingsV1 = {
      ...settings,
      cropMeta: { ...settings.cropMeta, aliases: { ...settings.cropMeta.aliases, [from]: to } }
    };
    setSettings(next);
    lsSet(SETTINGS_KEY, next);
  };

  const close = () => onOpenChange(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/20 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Ayarlar</div>
          <Button variant="secondary" onClick={close}>
            Kapat
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardTitle>Fiyat kataloğu (seed + düzenlenebilir)</CardTitle>
            <div className="mt-3 space-y-2">
              {settings.fertilizerCatalog.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_120px] items-end gap-2">
                  <div className="text-sm">{p.name}</div>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.priceCatalog[p.id] ?? ""}
                    onChange={(e) => updatePrice(p.id, safeNumber(e.target.value))}
                    placeholder="TRY/kg"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Bitki alias (cropMeta.aliases)</CardTitle>
            <div className="mt-2 text-xs text-neutral-600">Örn: "zeytın" → "Zeytin"</div>

            <div className="mt-3 space-y-2">
              {Object.entries(settings.cropMeta.aliases).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[1fr_1fr] gap-2">
                  <Input value={k} readOnly />
                  <Input value={v} onChange={(e) => updateAlias(k, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-700">
              Daha fazlası (maintenanceRanges, schedulePresets, katalog) v2’de genişletilebilir; deterministik çekirdek hazır.
            </div>
          </Card>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              const seed = makeSeedSettings();
              lsSet(SETTINGS_KEY, seed);
              setSettings(seed);
            }}
          >
            Reset to Seed Defaults
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              lsSet(SETTINGS_KEY, settings);
              close();
            }}
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}
