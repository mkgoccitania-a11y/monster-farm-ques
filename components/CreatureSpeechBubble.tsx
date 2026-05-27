"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Creature, PlayerState } from "@/lib/types";
import { CreatureMessage, getCreatureMessage } from "@/lib/creatureVisuals";
import { isBossAvailable } from "@/lib/gameLogic";

interface CreatureSpeechBubbleProps {
  state: PlayerState;
  creature: Creature;
  /** Si fourni, override le message auto (ex: "Repas donné !") pendant un court délai */
  override?: string | null;
  /** Position : centré au-dessus du sprite (default), ou à droite pour les sprites de profil */
  align?: "center" | "right";
  /** Vertical : "top" (au-dessus) ou "bottom" (en dessous) */
  vertical?: "top" | "bottom";
  /** Durée d'affichage en ms d'un message auto avant rotation */
  rotateMs?: number;
}

const kindStyles: Record<CreatureMessage["kind"], string> = {
  alert:   "from-rose-500/90 to-red-600/90 border-rose-200/60 text-rose-50",
  suggest: "from-amber-400/90 to-orange-500/90 border-amber-200/60 text-amber-50",
  love:    "from-pink-500/90 to-fuchsia-600/90 border-pink-200/60 text-pink-50",
  tired:   "from-slate-500/90 to-slate-700/90 border-slate-300/40 text-slate-50",
  happy:   "from-emerald-500/90 to-green-600/90 border-emerald-200/60 text-emerald-50",
  idle:    "from-indigo-500/90 to-violet-600/90 border-indigo-200/60 text-indigo-50"
};

export default function CreatureSpeechBubble({ state, creature, override, align = "center", vertical = "bottom", rotateMs = 6000 }: CreatureSpeechBubbleProps) {
  const hasReadyCrop = useMemo(
    () => state.progress.plots.some((p) => p.cropType && p.readyAt && p.readyAt <= Date.now()),
    [state.progress.plots]
  );
  const evolutionReady = useMemo(() => {
    // Lecture minimale sans cycle : on regarde simplement si level+rare sont assez hauts
    const targetLevel = creature.evolution_stage >= 2 ? 12 : 6;
    const requiredRare = creature.evolution_stage >= 2 ? 2 : 1;
    return creature.evolution_stage < 3 && creature.level >= targetLevel && state.progress.rareMaterial >= requiredRare;
  }, [creature, state.progress.rareMaterial]);
  const bossReady = useMemo(() => isBossAvailable(state), [state]);

  const ctx = useMemo(
    () => ({
      hunger: creature.hunger,
      happiness: creature.happiness,
      energy: state.progress.energy,
      energyMax: state.progress.energyMax,
      evolutionReady,
      bossReady,
      hasReadyCrop,
      name: creature.name
    }),
    [creature, state.progress.energy, state.progress.energyMax, evolutionReady, bossReady, hasReadyCrop]
  );

  const [message, setMessage] = useState<CreatureMessage>(() => getCreatureMessage(ctx));

  // Rotation auto toutes les rotateMs (sauf si override)
  useEffect(() => {
    if (override) return;
    const id = window.setInterval(() => setMessage(getCreatureMessage(ctx)), rotateMs);
    return () => window.clearInterval(id);
  }, [ctx, override, rotateMs]);

  // Quand le contexte change significativement, recalcule
  // (on passe les valeurs brutes pour que React détecte tous les changements,
  // pas juste les transitions de seuils — sinon des baisses successives ne refresh pas)
  useEffect(() => {
    if (override) return;
    setMessage(getCreatureMessage(ctx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override, ctx.hunger, ctx.happiness, ctx.energy, ctx.energyMax, ctx.evolutionReady, ctx.bossReady, ctx.hasReadyCrop]);

  const displayText = override ?? message.text;
  const displayKind = override ? "happy" : message.kind;
  const styleCls = kindStyles[displayKind];

  const positionCls = vertical === "top" ? "-top-2" : "-bottom-3";
  const tailCls = vertical === "top"
    ? "left-1/2 top-full -translate-x-1/2 -translate-y-1 border-b border-r"
    : "left-1/2 bottom-full -translate-x-1/2 translate-y-1 border-t border-l";

  return (
    <div className={`pointer-events-none absolute ${positionCls} z-30 flex w-full justify-${align === "center" ? "center" : "end"}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={displayText}
          initial={{ opacity: 0, y: vertical === "top" ? 6 : -6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: vertical === "top" ? -4 : 4, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`relative max-w-[90%] rounded-2xl border bg-gradient-to-br ${styleCls} px-3 py-1.5 text-center text-[12px] font-black shadow-glow backdrop-blur-md`}
          style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}
        >
          {displayText}
          {/* Queue de bulle (orientée selon vertical) */}
          <span
            className={`absolute h-2 w-2 rotate-45 bg-gradient-to-br ${styleCls.split(" ").slice(0, 2).join(" ")} ${tailCls}`}
            style={{ borderBottomRightRadius: "2px" }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
