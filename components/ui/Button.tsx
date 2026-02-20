// components/ui/Button.tsx
"use client";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : variant === "secondary"
      ? "bg-white border border-neutral-200 hover:bg-neutral-50"
      : "bg-transparent hover:bg-neutral-100";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
