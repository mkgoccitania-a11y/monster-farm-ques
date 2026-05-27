"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Creature, EvolutionProgress } from "@/lib/types";
import { defaultSpeciesForType, getSpeciesSprite, SPECIES_META } from "@/lib/creatureVisuals";
import GameIcon from "@/components/GameIcon";
import TypeBadge from "@/components/TypeBadge";

interface EvolutionPreviewPanelProps {
  open: boolean;
  creature: Creature;
  progress: EvolutionProgress;
  onClose: () => void;
  onEvolve?: () => void;
}

export default function EvolutionPreviewPanel({ open, creature, progress, onClose, onEvolve }: EvolutionPreviewPanelProps) {
  const isFinalForm = creature.evolution_stage >= 3;
  const target = progress.stageTarget;
  const multiplier = target === 2 ? 1.5 : target === 3 ? 2 : 1;
  const species = creature.species ?? defaultSpeciesForType(creature.type);
  const meta = SPECIES_META[species];
  const currentName = meta.stageNames[Math.max(0, Math.min(2, creature.evolution_stage - 1))];
  const nextName = meta.stageNames[Math.max(0, Math.min(2, target - 1))];
  const currentSprite = getSpeciesSprite(species, creature.evolution_stage);
  const nextSprite = getSpeciesSprite(species, target);

  // Projection des stats
  const projected = {
    attack: Math.round(creature.stats.attack * multiplier),
    speed: Math.round(creature.stats.speed * multiplier),
    intelligence: Math.round(creature.stats.intelligence * multiplier),
    defense: Math.round(creature.stats.defense * multiplier)
  };

  const requirementsCount = progress.requirements.length;
  const requirementsDone = progress.requirements.filter((r) => r.done).length;

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
            className="w-full max-w-md rounded-3xl border border-violet-300/30 bg-gradient-to-br from-indigo-950/95 via-violet-950/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prochaine évolution</p>
              <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">✕</button>
            </div>

            {isFinalForm ? (
              <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-500/15 p-4 text-center">
                <p className="text-3xl">🌟</p>
                <p className="mt-1 text-lg font-black shimmer-text">Forme finale atteinte !</p>
                <p className="text-xs text-white/70">{currentName} est la dernière forme de cette lignée.</p>
              </div>
            ) : (
              <>
                {/* Vignette comparative */}
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="rounded-2xl border border-white/15 bg-black/30 p-2 text-center">
                    <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-black/20">
                      <img src={currentSprite} alt={currentName} className="h-full w-full object-cover" draggable={false} />
                    </div>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-white/70">Forme {creature.evolution_stage}</p>
                    <p className="text-[12px] font-black text-white">{currentName}</p>
                  </div>

                  <div className="text-2xl font-black text-violet-300">→</div>

                  <div className="rounded-2xl border border-violet-300/40 bg-violet-500/20 p-2 text-center shadow-glow">
                    <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-black/20">
                      {progress.ready ? (
                        <img src={nextSprite} alt={nextName} className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <span className="text-4xl font-black text-white/30">?</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-violet-200">Forme {target}</p>
                    <p className="text-[12px] font-black text-violet-100">{progress.ready ? nextName : "Mystère"}</p>
                  </div>
                </div>

                {/* Type */}
                <div className="mt-2 flex justify-center"><TypeBadge type={creature.type} /></div>

                {/* Conditions */}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[12px] font-black uppercase tracking-wide text-cyan-200">
                    Conditions ({requirementsDone}/{requirementsCount})
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs">
                    {progress.requirements.map((req, i) => (
                      <li key={i} className={`flex items-center gap-2 font-bold ${req.done ? "text-emerald-200" : "text-white/70"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-black ${req.done ? "bg-emerald-500/40" : "bg-white/10"}`}>
                          {req.done ? "✓" : "·"}
                        </span>
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Effet (multiplicateur) */}
                <div className="mt-2 rounded-2xl border border-amber-300/30 bg-amber-500/15 p-3">
                  <p className="text-[12px] font-black uppercase tracking-wide text-amber-200">Effet à l'évolution</p>
                  <p className="mt-1 text-sm font-black text-white">Toutes les stats × {multiplier}</p>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[12px] font-black">
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-rose-100">
                      <GameIcon name="strength" size={12} />{creature.stats.attack} → <span className="text-rose-50">{projected.attack}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-cyan-100">
                      <GameIcon name="speed" size={12} />{creature.stats.speed} → <span className="text-cyan-50">{projected.speed}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-violet-500/20 px-2 py-1 text-violet-100">
                      <GameIcon name="intelligence" size={12} />{creature.stats.intelligence} → <span className="text-violet-50">{projected.intelligence}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-100">
                      <GameIcon name="defense" size={12} />{creature.stats.defense} → <span className="text-emerald-50">{projected.defense}</span>
                    </div>
                  </div>
                  {target >= 2 && !creature.specialUnlocked && (
                    <p className="mt-2 text-[11px] font-black text-fuchsia-200">✨ Débloque l'attaque Spéciale en combat</p>
                  )}
                </div>

                {/* CTA */}
                {progress.ready && onEvolve ? (
                  <button onClick={() => { onClose(); onEvolve(); }} className="btn-primary mt-3 w-full">
                    ✨ Faire évoluer maintenant (1 multiplication)
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-[12px] font-black text-white/70">
                    {progress.ready ? "Prêt à évoluer !" : "Continue à jouer pour remplir les conditions."}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
