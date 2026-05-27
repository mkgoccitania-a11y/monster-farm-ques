"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CropType } from "@/lib/types";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface CropsHelpPanelProps {
  open: boolean;
  unlockedZones: number;
  onClose: () => void;
}

interface CropInfo {
  type: CropType;
  label: string;
  icon: GameIconName;
  color: string;
  duration: string;
  earns: string;
  unlockZone: number;
}

const CROPS: CropInfo[] = [
  { type: "fast", label: "Pousse", icon: "sprout", color: "from-lime-400 to-emerald-500", duration: "2 min", earns: "+3 nourriture, +4 pièces", unlockZone: 1 },
  { type: "medium", label: "Baie", icon: "berry", color: "from-rose-400 to-pink-500", duration: "6 min", earns: "+6 nourriture, +10 pièces, parfois 💎", unlockZone: 2 },
  { type: "slow", label: "Racine dorée", icon: "root", color: "from-amber-400 to-orange-500", duration: "12 min", earns: "+10 nourriture, +18 pièces, souvent 💎", unlockZone: 3 }
];

const zoneNames = ["", "Prairie", "Forêt", "Montagne", "Volcan"];

export default function CropsHelpPanel({ open, unlockedZones, onClose }: CropsHelpPanelProps) {
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
            className="w-full max-w-md rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-emerald-900/95 via-slate-900/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">Potager</p>
                <h3 className="text-lg font-black shimmer-text">🌱 Cultures à débloquer</h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-white/10 p-1.5 text-white">
                <GameIcon name="close" size={14} />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-white/70">
              Tu peux planter <b>une culture par zone débloquée</b>. Plus la culture est lente, plus elle rapporte de nourriture, de pièces et de matériau rare 💎.
            </p>

            <div className="mt-3 space-y-2">
              {CROPS.map((c) => {
                const unlocked = unlockedZones >= c.unlockZone;
                return (
                  <div
                    key={c.type}
                    className={`rounded-2xl border p-3 backdrop-blur-md transition ${
                      unlocked
                        ? "border-emerald-300/40 bg-emerald-500/15"
                        : "border-white/10 bg-white/5 opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-bubble`}>
                        <GameIcon name={c.icon} size={26} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-black text-white">{c.label}</p>
                          {unlocked ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/40 px-1.5 py-0.5 text-[9px] font-black text-emerald-50">
                              <GameIcon name="check" size={10} />
                              Débloquée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/40 px-1.5 py-0.5 text-[9px] font-black text-rose-50">
                              <GameIcon name="lock" size={10} />
                              Verrouillée
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] font-bold text-white/70">Pousse en {c.duration}</p>
                        <p className="text-[10px] font-bold text-amber-200">{c.earns}</p>
                      </div>
                    </div>
                    {!unlocked && (
                      <div className="mt-2 rounded-xl border border-rose-300/30 bg-rose-500/15 px-2 py-1.5 text-[11px] text-rose-100">
                        <p>
                          <b>Pour débloquer :</b> atteins la <b>Zone {c.unlockZone} ({zoneNames[c.unlockZone]})</b>.
                        </p>
                        <p className="mt-0.5 text-[10px] text-rose-50/85">
                          Gagne 5 combats dans ta zone actuelle, puis bats le 👑 <b>Boss de zone</b> pour passer à la suivante.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-3 rounded-xl bg-cyan-500/15 px-2 py-1.5 text-center text-[11px] font-black text-cyan-100">
              Astuce : la créature heureuse récolte +12 % de bonus !
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
