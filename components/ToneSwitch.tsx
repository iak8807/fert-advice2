// components/ToneSwitch.tsx
"use client";

import type { Tone } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function ToneSwitch({ tone, onChange }: { tone: Tone; onChange: (t: Tone) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-neutral-700">Dil modu</div>
      <div className="flex gap-2">
        <Button variant={tone === "farmer" ? "primary" : "secondary"} type="button" onClick={() => onChange("farmer")}>
          Çiftçi
        </Button>
        <Button variant={tone === "expert" ? "primary" : "secondary"} type="button" onClick={() => onChange("expert")}>
          Uzman
        </Button>
      </div>
    </div>
  );
}
