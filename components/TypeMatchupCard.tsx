"use client";

import { motion } from "framer-motion";
import TypeBadge from "@/components/TypeBadge";
import { CreatureType } from "@/lib/types";
import { TypeMatchup } from "@/lib/gameLogic";

interface TypeMatchupCardProps {
  playerType: CreatureType;
  enemyType: CreatureType;
  matchup: TypeMatchup;
  compact?: boolean;
}

const kindStyles: Record<TypeMatchup["kind"], { border: string; bg: string; text: string; emoji: string }> = {
  advantage: {
    border: "border-emerald-300/50",
    bg: "from-emerald-500/30 via-emerald-400/15 to-slate-900/30",
    text: "text-emerald-100",
    emoji: "🔥"
  },
  disadvantage: {
    border: "border-rose-300/50",
    bg: "from-rose-500/30 via-rose-400/15 to-slate-900/30",
    text: "text-rose-100",
    emoji: "⚠️"
  },
  neutral: {
    border: "border-white/20",
    bg: "from-slate-500/25 via-slate-400/10 to-slate-900/30",
    text: "text-white/85",
    emoji: "⚖️"
  }
};

const fmtPct = (mul: number) => {
  if (mul === 1) return "±0%";
  const pct = Math.round((mul - 1) * 100);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
};

export default function TypeMatchupCard({ playerType, enemyType, matchup, compact = false }: TypeMatchupCardProps) {
  const s = kindStyles[matchup.kind];
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-3 backdrop-blur-md shadow-glow`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{s.emoji}</span>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.text}`}>Affrontement</p>
            <p className={`text-base font-black ${s.text}`}>{matchup.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TypeBadge type={playerType} size="xs" />
          <span className={`text-xs font-black ${s.text}`}>vs</span>
          <TypeBadge type={enemyType} size="xs" />
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[11px] font-black">
            <div className="rounded-xl border border-white/15 bg-black/30 px-2 py-1">
              <p className="text-[9px] uppercase tracking-wide text-white/60">Tes dégâts</p>
              <p className={matchup.playerMul > 1 ? "text-emerald-200" : matchup.playerMul < 1 ? "text-rose-200" : "text-white/85"}>
                {fmtPct(matchup.playerMul)}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/30 px-2 py-1">
              <p className="text-[9px] uppercase tracking-wide text-white/60">Dégâts subis</p>
              <p className={matchup.enemyMul > 1 ? "text-rose-200" : matchup.enemyMul < 1 ? "text-emerald-200" : "text-white/85"}>
                {fmtPct(matchup.enemyMul)}
              </p>
            </div>
          </div>
          <p className={`mt-2 text-[11px] font-bold ${s.text}`}>{matchup.hint}</p>
        </>
      )}
    </motion.section>
  );
}
