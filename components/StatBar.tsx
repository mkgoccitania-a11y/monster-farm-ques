"use client";

import { motion } from "framer-motion";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color?: "violet" | "cyan" | "green" | "amber" | "rose" | "red";
  icon?: string;
  iconName?: GameIconName;
}

const palette = {
  violet: "from-violet-500 to-fuchsia-500",
  cyan: "from-cyan-400 to-sky-500",
  green: "from-emerald-400 to-green-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500",
  red: "from-rose-500 to-red-600"
};

export default function StatBar({ label, value, max, color = "violet", icon, iconName }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-black text-white/90">
        <span className="flex items-center gap-1">
          {iconName ? <GameIcon name={iconName} size={13} /> : icon ? <span>{icon}</span> : null}
          {label}
        </span>
        <span>{Math.round(value)}/{max}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${palette[color]} shadow-glow`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
