"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Creature } from "@/lib/types";
import { defaultSpeciesForType, getSpeciesSprite, SPECIES_META } from "@/lib/creatureVisuals";
import GameIcon from "@/components/GameIcon";
import TypeBadge from "@/components/TypeBadge";

interface EvolutionModalProps {
  open: boolean;
  previous: Creature | null;
  current: Creature | null;
  onClose: () => void;
}

export default function EvolutionModal({ open, previous, current, onClose }: EvolutionModalProps) {
  if (!previous || !current) {
    return null;
  }

  const prevSpecies = previous.species ?? defaultSpeciesForType(previous.type);
  const currSpecies = current.species ?? defaultSpeciesForType(current.type);
  const oldName = SPECIES_META[prevSpecies].stageNames[Math.max(0, Math.min(2, previous.evolution_stage - 1))];
  const newName = SPECIES_META[currSpecies].stageNames[Math.max(0, Math.min(2, current.evolution_stage - 1))];
  const prevSprite = getSpeciesSprite(prevSpecies, previous.evolution_stage);
  const currSprite = getSpeciesSprite(currSpecies, current.evolution_stage);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Faisceau de lumière en arrière-plan */}
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            style={{
              background: "radial-gradient(circle at center, rgba(167,139,250,0.4) 0%, transparent 60%)"
            }}
          />

          <motion.div
            className="w-full max-w-md rounded-3xl border border-white/25 bg-gradient-to-br from-indigo-900/90 via-violet-900/85 to-fuchsia-900/85 p-5 shadow-glow backdrop-blur-xl"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
          >
            <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Évolution</p>
            <h3 className="mt-1 text-center text-4xl font-black shimmer-text">{current.name}</h3>
            <p className="mt-1 text-center text-sm font-bold text-white/70">{oldName} → {newName}</p>
            <div className="mt-2 flex justify-center">
              <TypeBadge type={current.type} size="md" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-2 text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/60">Avant</p>
                <div className="flex justify-center">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl">
                    <img src={prevSprite} alt={oldName} className="h-full w-full object-cover" draggable={false} />
                  </div>
                </div>
                <p className="text-[11px] font-black text-white/80">{oldName}</p>
              </div>
              <div className="rounded-2xl border border-violet-300/40 bg-violet-500/15 p-2 text-center shadow-glow backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-wide text-violet-200">Après</p>
                <motion.div className="flex justify-center" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <div className="h-28 w-28 overflow-hidden rounded-2xl">
                    <img src={currSprite} alt={newName} className="h-full w-full object-cover" draggable={false} />
                  </div>
                </motion.div>
                <p className="text-[11px] font-black text-violet-200">{newName}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black">
              <div className="flex items-center justify-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-rose-100"><GameIcon name="strength" size={12} />+{current.stats.attack - previous.stats.attack}</div>
              <div className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-cyan-100"><GameIcon name="speed" size={12} />+{current.stats.speed - previous.stats.speed}</div>
              <div className="flex items-center justify-center gap-1 rounded-lg bg-violet-500/20 px-2 py-1 text-violet-100"><GameIcon name="intelligence" size={12} />+{current.stats.intelligence - previous.stats.intelligence}</div>
              <div className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-100"><GameIcon name="defense" size={12} />+{current.stats.defense - previous.stats.defense}</div>
            </div>

            <button onClick={onClose} className="btn-primary mt-4 flex w-full items-center justify-center gap-2">
              <GameIcon name="spark" size={16} />
              <span>Incroyable !</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
