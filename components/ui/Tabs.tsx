import * as React from "react";
import { Button } from "./Button";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Button
          key={t.key}
          type="button"
          variant={t.key === value ? "primary" : "secondary"}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
