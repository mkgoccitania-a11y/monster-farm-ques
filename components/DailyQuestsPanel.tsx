"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DailyQuest } from "@/lib/types";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface DailyQuestsPanelProps {
  quests: DailyQuest[];
  onClaim: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

const kindIcon: Record<DailyQuest["kind"], GameIconName> = {
  harvest: "sprout",
  battles: "battle",
  feed: "food",
  combo: "streak",
  boss: "boss",
  capture: "capture",
  spend_energy: "energy"
};

export default function DailyQuestsPanel({ quests, onClaim, open, onClose }: DailyQuestsPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 pb-20 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Aujourd'hui</p>
                <h3 className="text-lg font-black shimmer-text">📋 Quêtes journalières</h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-white/10 p-1.5 text-white"><GameIcon name="close" size={14} /></button>
            </div>

            <p className="mt-2 text-[12px] text-white/70">Termine ces objectifs avant minuit pour empocher les bonus. Nouvelles quêtes chaque jour.</p>

            <div className="mt-3 space-y-2">
              {quests.length === 0 && (
                <p className="rounded-xl bg-white/5 p-3 text-center text-xs text-white/60">Pas de quête disponible.</p>
              )}
              {quests.map((q) => {
                const done = q.progress >= q.target;
                const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-3 backdrop-blur-md transition ${
                      q.claimed
                        ? "border-white/10 bg-white/5 opacity-60"
                        : done
                        ? "border-emerald-300/50 bg-emerald-500/15 shadow-glow"
                        : "border-white/15 bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-white"><GameIcon name={kindIcon[q.kind]} size={22} /></div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-white">{q.label}</p>
                        <p className="text-[11px] font-black text-white/60">
                          {q.progress} / {q.target}
                        </p>
                      </div>
                      {q.claimed && <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-emerald-200"><GameIcon name="check" size={11} /> RÉCLAMÉ</span>}
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className={`h-full rounded-full ${done ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-cyan-400 to-sky-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[12px] font-black">
                      <div className="flex items-center gap-2 text-amber-100">
                        <span className="inline-flex items-center gap-0.5"><GameIcon name="coin" size={11} />{q.reward.coins}</span>
                        <span className="inline-flex items-center gap-0.5"><GameIcon name="star" size={11} />{q.reward.xp}</span>
                        {q.reward.rare && <span className="inline-flex items-center gap-0.5"><GameIcon name="gem" size={11} />{q.reward.rare}</span>}
                      </div>
                      {!q.claimed && done && (
                        <button
                          onClick={() => onClaim(q.id)}
                          className="rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[12px] font-black text-amber-950 shadow-glowElectric active:scale-95"
                        >
                          Réclamer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
