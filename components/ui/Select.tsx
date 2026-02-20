// components/ui/Select.tsx
"use client";
import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
