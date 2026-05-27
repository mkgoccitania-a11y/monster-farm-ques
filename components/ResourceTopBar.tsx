"use client";

import { motion } from "framer-motion";
import GameIcon from "@/components/GameIcon";

interface ResourceTopBarProps {
  level: number;
  title: string;
  coins: number;
  happiness: number;
  energy: number;
  rare?: number;
  onRareClick?: () => void;
}

export default function ResourceTopBar({ level, title, coins, happiness, energy, rare, onRareClick }: ResourceTopBarProps) {
  return (
    <motion.section
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-strong overflow-hidden p-2.5"
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-gradient-to-br from-violet-500 to-indigo-600 px-2 py-1 text-xs font-black text-white shadow-glow">
          <GameIcon name="level" size={14} />
          <span>Niv {level}</span>
        </div>
        <div className="truncate text-center text-base font-black tracking-wide shimmer-text">{title}</div>
        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-amber-400/20 px-2 py-1 text-xs font-black text-amber-100">
          <GameIcon name="coin" size={14} />
          <span>{coins}</span>
        </div>
      </div>

      <div className={`mt-2 grid gap-2 ${rare !== undefined ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-pink-500/15 px-2 py-1 text-xs font-black text-pink-100">
          <GameIcon name="happiness" size={14} />
          <span>{happiness}</span>
        </div>
        <div className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-cyan-400/15 px-2 py-1 text-xs font-black text-cyan-100">
          <GameIcon name="energy" size={14} />
          <span>{energy}</span>
        </div>
        {rare !== undefined && (
          <button
            onClick={onRareClick}
            disabled={!onRareClick}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-fuchsia-500/15 px-2 py-1 text-xs font-black text-fuchsia-100 transition active:scale-95 hover:bg-fuchsia-500/25 disabled:cursor-default"
            aria-label="Matériau rare — voir comment en obtenir"
          >
            <GameIcon name="gem" size={14} />
            <span>{rare}</span>
            {onRareClick && <GameIcon name="help" size={11} />}
          </button>
        )}
      </div>
    </motion.section>
  );
}
