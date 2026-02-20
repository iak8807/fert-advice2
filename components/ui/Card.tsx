// components/ui/Card.tsx
import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-4 shadow-sm">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="text-sm font-semibold">{children}</div>;
}

export function CardDesc({ children }: { children: ReactNode }) {
  return <div className="mt-1 text-xs text-neutral-600">{children}</div>;
}
