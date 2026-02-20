// components/PreviewPanels.tsx
"use client";

import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { PdfButton } from "@/components/PdfButton";
import { FertilizerProductsPanel } from "@/components/FertilizerProductsPanel";
import { SchedulePanel } from "@/components/SchedulePanel";
import { CostPanel } from "@/components/CostPanel";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { Card, CardTitle } from "@/components/ui/Card";

export default function PreviewPanels({
  project,
  computed,
  settings
}: {
  project: ProjectInput;
  computed: any;
  settings: SettingsV1;
}) {
  const tone = project.tone;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>STEP 6 — Sonuç + PDF</CardTitle>
            <div className="mt-1 text-xs text-neutral-600">
              Çıktılar deterministiktir. Eşleşme yoksa ilgili besin için durur.
            </div>
          </div>
          <div className="flex gap-2">
            <PdfButton project={project} computed={computed} settings={settings} />
            <a
              className="rounded-2xl border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              href={`/print/${project.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Print View
            </a>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-neutral-600">N (kg/da)</div>
            <div className="text-2xl font-semibold">{computed?.engine?.targets?.N ?? "—"}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-neutral-600">P2O5 (kg/da)</div>
            <div className="text-2xl font-semibold">{computed?.engine?.targets?.P2O5 ?? "—"}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-neutral-600">K2O (kg/da)</div>
            <div className="text-2xl font-semibold">{computed?.engine?.targets?.K2O ?? "—"}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold">Uyarılar</div>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(tone === "farmer" ? computed?.engine?.warnings?.farmer : computed?.engine?.warnings?.expert)?.map((w: string, i: number) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </Card>

      <FertilizerProductsPanel tone={tone} balance={computed?.balance} />
      <SchedulePanel tone={tone} schedule={computed?.schedule} precision={project.prefs.precisionKgDa} />
      <CostPanel tone={tone} cost={computed?.cost} scenarios={project.scenarios} />
      <ExplainabilityPanel tone={tone} explain={computed?.engine?.explain} />
    </div>
  );
}
