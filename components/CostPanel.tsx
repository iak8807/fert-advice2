// components/CostPanel.tsx
import type { CostResult, Tone, ProjectInput } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function CostPanel({
  tone,
  cost,
  scenarios
}: {
  tone: Tone;
  cost: CostResult;
  scenarios?: ProjectInput["scenarios"];
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Maliyet</CardTitle>
        <Badge tone={cost.available ? "ok" : "neutral"}>{cost.available ? "Hesaplandı" : "Fiyat girilmedi"}</Badge>
      </div>

      {cost.available && (
        <>
          <div className="mt-2 text-sm">
            {tone === "farmer" ? (
              <div>
                Toplam: <span className="font-semibold">{cost.totalCostTry?.toFixed(2)} TRY</span>
              </div>
            ) : (
              <div>
                da başı: <span className="font-semibold">{cost.costPerDaTry?.toFixed(2)} TRY/da</span> • Toplam:{" "}
                <span className="font-semibold">{cost.totalCostTry?.toFixed(2)} TRY</span>
              </div>
            )}
          </div>

          {cost.mostExpensive && (
            <div className="mt-2 rounded-xl border bg-amber-50 p-3 text-sm text-amber-900">
              En pahalı kalem: <span className="font-semibold">{cost.mostExpensive.productName}</span> (
              {cost.mostExpensive.lineCostTry.toFixed(2)} TRY)
            </div>
          )}

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Ürün</th>
                <th className="py-2">Toplam kg</th>
                <th className="py-2">TRY/kg</th>
                <th className="py-2">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {cost.lines.map((l) => (
                <tr key={l.productId} className="border-b">
                  <td className="py-2">{l.productName}</td>
                  <td className="py-2">{l.totalKg}</td>
                  <td className="py-2">{l.unitPriceTryPerKg ?? "—"}</td>
                  <td className="py-2">{l.lineCostTry?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {(scenarios?.A || scenarios?.B) && (
        <div className="mt-4 rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-700">
          <div className="font-semibold">Senaryo Karşılaştırma (özet)</div>
          <div className="mt-1">
            Not: Senaryo maliyeti, burada yalnızca saklama amaçlıdır. Karşılaştırmayı v2’de “tek tıkla yeniden hesapla” ile
            genişletebilirsin.
          </div>
        </div>
      )}
    </Card>
  );
}
