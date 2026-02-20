// components/AvailabilityBadges.tsx
import { Badge } from "@/components/ui/Badge";

export default function AvailabilityBadges({ availability }: { availability: { N: boolean; P: boolean; K: boolean } }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={availability.N ? "ok" : "bad"}>N {availability.N ? "Var" : "Yok"}</Badge>
      <Badge tone={availability.P ? "ok" : "bad"}>P {availability.P ? "Var" : "Yok"}</Badge>
      <Badge tone={availability.K ? "ok" : "bad"}>K {availability.K ? "Var" : "Yok"}</Badge>
    </div>
  );
}
