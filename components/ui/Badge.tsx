// components/ui/Badge.tsx
import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-neutral-50 text-neutral-700 border-neutral-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}
