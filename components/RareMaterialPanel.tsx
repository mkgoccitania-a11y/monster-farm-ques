"use client";

import { AnimatePresence, motion } from "framer-motion";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface RareMaterialPanelProps {
  open: boolean;
  current: number;
  onClose: () => void;
}

interface Source {
  icon: GameIconName;
  label: string;
  detail: string;
  chance: string;
  color: string;
}

const SOURCES: Source[] = [
  {
    icon: "boss",
    label: "Boss de zone",
    detail: "Vaincre le boss qui apparaît après 5 victoires en zone",
    chance: "+2 garantis",
    color: "from-fuchsia-500/30 to-pink-700/30 border-fuchsia-300/40"
  },
  {
    icon: "elite",
    label: "Ennemi élite ✦",
    detail: "Combattre un ennemi marqué d'une étoile (15 à 30 % d'apparition selon zone)",
    chance: "50 % de chance d'1 💎",
    color: "from-amber-500/30 to-orange-700/30 border-amber-300/40"
  },
  {
    icon: "battle",
    label: "Combat gagné",
    detail: "Chaque victoire offre une petite chance",
    chance: "~18 % à 30 % selon la zone",
    color: "from-rose-500/30 to-red-700/30 border-rose-300/40"
  },
  {
    icon: "root",
    label: "Récolter une Racine dorée",
    detail: "Cultiver dans le potager (verrouillée en zone 1, débloquée en zone 3)",
    chance: "20 % de chance d'1 💎",
    color: "from-amber-500/30 to-orange-700/30 border-amber-300/40"
  },
  {
    icon: "berry",
    label: "Récolter une Baie",
    detail: "Culture intermédiaire (débloquée en zone 2)",
    chance: "10 % de chance d'1 💎",
    color: "from-rose-500/30 to-pink-700/30 border-rose-300/40"
  },
  {
    icon: "quest",
    label: "Quêtes journalières",
    detail: "Certaines quêtes (boss, combats) donnent un 💎",
    chance: "Variable, vois le panneau Quêtes",
    color: "from-cyan-500/30 to-sky-700/30 border-cyan-300/40"
  }
];

export default function RareMaterialPanel({ open, current, onClose }: RareMaterialPanelProps) {
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
            className="w-full max-w-md rounded-3xl border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-950/95 via-slate-900/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-200">Évolution</p>
                <h3 className="flex items-center gap-2 text-lg font-black shimmer-text">
                  <GameIcon name="gem" size={20} />
                  Matériau rare
                </h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-white/10 p-1.5 text-white">
                <GameIcon name="close" size={14} />
              </button>
            </div>

            <p className="mt-2 rounded-xl border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-2 text-center text-sm font-black text-fuchsia-100">
              Tu en as <span className="text-2xl">{current}</span> · sert à faire évoluer ta créature.
            </p>

            <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-fuchsia-200">Comment en obtenir ?</p>

            <div className="mt-2 space-y-2">
              {SOURCES.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-2xl border bg-gradient-to-br ${s.color} p-2.5 backdrop-blur-md`}>
                  <div className="mt-0.5 shrink-0 text-white">
                    <GameIcon name={s.icon} size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">{s.label}</p>
                    <p className="text-[10px] font-bold text-white/80">{s.detail}</p>
                    <p className="mt-0.5 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-black text-amber-200">
                      {s.chance}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 rounded-xl bg-cyan-500/20 px-3 py-2 text-center text-[11px] font-black text-cyan-100">
              💡 Astuce : plus la zone est avancée, plus le matériau rare tombe souvent !
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
