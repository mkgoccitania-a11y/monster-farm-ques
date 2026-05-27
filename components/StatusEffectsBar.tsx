"use client";

import { motion } from "framer-motion";
import { StatusEffect } from "@/lib/gameLogic";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface StatusEffectsBarProps {
  effects: StatusEffect[];
  compact?: boolean;
}

const iconByEffect: Record<string, GameIconName> = {
  well_fed: "well-fed",
  starving: "starving",
  hungry: "starving",
  happy: "happy",
  sad: "sad",
  energized: "energized",
  drained: "drained"
};

export default function StatusEffectsBar({ effects, compact = false }: StatusEffectsBarProps) {
  if (effects.length === 0) {
    return (
      <div className="flex items-center justify-center gap-1 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-center text-[11px] font-black text-emerald-100">
        <GameIcon name="spark" size={12} />
        <span>Aucun effet — créature en forme</span>
      </div>
    );
  }
  return (
    <div className={`grid gap-1 ${compact ? "grid-cols-2" : "grid-cols-1"}`}>
      {effects.map((eff) => {
        const icon = iconByEffect[eff.id] ?? "warn";
        return (
          <motion.div
            key={eff.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-black backdrop-blur-md ${
              eff.kind === "buff"
                ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-50"
                : eff.severity === "major"
                ? "border-rose-300/50 bg-rose-500/20 text-rose-50"
                : "border-amber-300/40 bg-amber-500/15 text-amber-50"
            }`}
            title={eff.description}
          >
            <GameIcon name={icon} size={16} />
            <div className="flex-1">
              <p className="leading-tight">{eff.label}</p>
              <p className={`text-[10px] font-normal opacity-80 ${compact ? "hidden" : ""}`}>{eff.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
