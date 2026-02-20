// components/SchedulePanel.tsx
import type { ScheduleResult, Tone } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/Card";

export default function SchedulePanel({ tone, schedule }: { tone: Tone; schedule: ScheduleResult; precision: 0.1 | 0.01 }) {
  return (
    <Card>
      <CardTitle>Takvim</CardTitle>
      <div className="mt-1 text-xs text-neutral-600">
        Preset: {schedule?.presetName} • Başlangıç: {schedule?.startMonth}
      </div>

      <div className="mt-3 space-y-3">
        {schedule?.plans?.map((p) => (
          <div key={p.productId} className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.productName}</div>
              <div className="text-xs text-neutral-600">{tone === "farmer" ? "Adım adım" : "Yüzde + kg/da"}</div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {p.applications.map((a, idx) => (
                <div key={idx} className="rounded-lg bg-neutral-50 p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-neutral-600">{Math.round(a.fraction * 100)}%</div>
                  </div>
                  <div className="mt-1">
                    {tone === "farmer" ? (
                      <span className="font-semibold">{a.kgDa.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} kg/da</span>
                    ) : (
                      <div className="text-xs text-neutral-700">
                        kg/da: <span className="font-semibold">{a.kgDa.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}</span> • toplam kg:{" "}
                        <span className="font-semibold">{a.totalKg.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
