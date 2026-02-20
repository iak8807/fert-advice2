// components/StepNav.tsx
"use client";
import { Button } from "@/components/ui/Button";

const steps = [
  { id: 1, label: "1. Proje" },
  { id: 2, label: "2. Toprak" },
  { id: 3, label: "3. Yaprak" },
  { id: 4, label: "4. Tercihler" },
  { id: 5, label: "5. Fiyat" },
  { id: 6, label: "6. Sonuç" }
];

export default function StepNav({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((s) => (
        <Button
          key={s.id}
          type="button"
          variant={step === s.id ? "primary" : "secondary"}
          className="justify-start"
          onClick={() => setStep(s.id)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
