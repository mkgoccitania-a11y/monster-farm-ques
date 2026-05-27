"use client";

import { CreatureType } from "@/lib/types";

const labels: Record<CreatureType, string> = {
  fire: "Feu",
  water: "Eau",
  plant: "Plante",
  electric: "Elek"
};

const icons: Record<CreatureType, string> = {
  fire: "🔥",
  water: "💧",
  plant: "🌿",
  electric: "⚡"
};

const cls: Record<CreatureType, string> = {
  fire: "type-fire",
  water: "type-water",
  plant: "type-plant",
  electric: "type-electric"
};

interface TypeBadgeProps {
  type: CreatureType;
  size?: "xs" | "sm" | "md";
}

export default function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const sizing = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-black shadow-bubble ${sizing} ${cls[type]}`}>
      <span>{icons[type]}</span>
      <span className="uppercase tracking-wide">{labels[type]}</span>
    </span>
  );
}
