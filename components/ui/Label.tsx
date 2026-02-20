// components/ui/Label.tsx
import type { ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-xs font-medium text-neutral-700">{children}</div>;
}
