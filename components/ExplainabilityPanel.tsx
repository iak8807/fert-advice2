import { Card } from "@/components/ui/Card";
import type { AdviceResult } from "@/lib/types";

export function ExplainabilityPanel({ result }: { result: AdviceResult | null }) {
  return (
    <Card className="mt-4">
      <h3 className="font-semibold">Açıklanabilirlik</h3>
      <p className="mt-1 text-sm text-neutral-600">Hangi tablodan hangi değer çekildi?</p>
      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs ring-1 ring-neutral-200">
        {result ? JSON.stringify(result.explain, null, 2) : "Henüz hesap yok."}
      </pre>
    </Card>
  );
}
