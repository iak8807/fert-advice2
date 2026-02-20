// components/ui/Input.tsx
"use client";
import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 ${className}`}
      {...props}
    />
  );
}
