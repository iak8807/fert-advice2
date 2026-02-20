"use client";

import { Card, CardTitle } from "@/components/ui/Card";

export default function ExplainabilityPanel({
  tone,
  explain
}: {
  tone: string;
  explain: any;
}) {
  return (
    <Card>
      <CardTitle>Hangi tablodan hangi değer çekildi?</CardTitle>
      <div className="mt-2 text-xs text-neutral-600">
        Ton: <span className="font-medium">{tone}</span>
      </div>

      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs ring-1 ring-neutral-200">
        {explain ? JSON.stringify(explain, null, 2) : "Henüz hesap yok."}
      </pre>
    </Card>
  );
}
