import { Card } from "@/components/ui/Card";
import type { AdviceResult } from "@/lib/types";

export function FertilizerProductsPanel({ result }: { result: AdviceResult | null }) {
  return (
    <Card className="mt-4">
      <h3 className="font-semibold">Ürün karşılıkları (demo)</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Hesap, saf besin dozunu ürün miktarına kabaca çevirir.
      </p>
      {!result ? (
        <p className="mt-2 text-sm text-neutral-600">Henüz hesap yok.</p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
          <li>Üre ≈ N / 0.46</li>
          <li>TSP ≈ P2O5 / 0.46</li>
          <li>Potasyum Sülfat (SOP) ≈ K2O / 0.50</li>
        </ul>
      )}
    </Card>
  );
}
