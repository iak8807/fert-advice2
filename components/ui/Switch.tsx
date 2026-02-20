// components/ui/Switch.tsx
"use client";
import { Button } from "@/components/ui/Button";

export function Switch({
  checked,
  onCheckedChange,
  label
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label ? <div className="text-sm text-neutral-700">{label}</div> : <div />}
      <Button
        type="button"
        variant={checked ? "primary" : "secondary"}
        className="h-9 min-w-[72px] rounded-full"
        onClick={() => onCheckedChange(!checked)}
      >
        {checked ? "Açık" : "Kapalı"}
      </Button>
    </div>
  );
}
