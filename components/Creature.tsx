"use client";

import { motion } from "framer-motion";
import { Creature, PlayerState } from "@/lib/types";
import { defaultSpeciesForType, getSpeciesSprite, SPECIES_META } from "@/lib/creatureVisuals";
import CreatureSpeechBubble from "@/components/CreatureSpeechBubble";
import TypeBadge from "@/components/TypeBadge";

interface CreatureProps {
  creature: Creature;
  mood?: "idle" | "happy" | "oops" | "evolving";
  /** Si fourni, override la bulle dynamique avec ce texte */
  reaction?: string | null;
  /** Si fourni, active la bulle kawaii contextuelle */
  state?: PlayerState;
  size?: "sm" | "md" | "lg";
}

export default function CreatureCard({ creature, mood = "idle", reaction, state, size = "md" }: CreatureProps) {
  const species = creature.species ?? defaultSpeciesForType(creature.type);
  const meta = SPECIES_META[species];
  const stageName = meta.stageNames[Math.max(0, Math.min(2, creature.evolution_stage - 1))];
  const spriteSrc = getSpeciesSprite(species, creature.evolution_stage);

  const cardSize = size === "lg" ? "h-64 w-64" : size === "md" ? "h-48 w-48" : "h-32 w-32";
  const labelSize = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm";

  const idleAnim = mood === "evolving"
    ? { scale: [1, 1.06, 1] }
    : mood === "oops"
    ? { x: [0, -4, 4, -3, 3, 0] }
    : { scale: [1, 1.03, 1] };  // léger pulse au lieu de y-translate → pas de débordement vertical
  const idleTransition = mood === "evolving"
    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
    : mood === "oops"
    ? { duration: 0.4 }
    : { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className="space-y-1.5">
      {/* Parent (sans overflow) : contient cadre + bulle */}
      <div className={`relative mx-auto ${cardSize}`}>
        {/* Couche fond/déco — backdrop-blur ici, PAS d'overflow-hidden */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] border border-white/15 bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-cardLift backdrop-blur-md" />

        {/* Couche sprite — overflow-hidden via clip-path (robuste vs backdrop) */}
        <div
          className="absolute inset-0 rounded-[1.6rem]"
          style={{ clipPath: "inset(0 round 1.6rem)" }}
        >
          {/* Voile glass intérieur (purement visuel) */}
          <div className="pointer-events-none absolute inset-1 rounded-[1.4rem] bg-gradient-to-br from-white/15 via-transparent to-white/5" />

          {/* Sprite */}
          <motion.div
            initial={false}
            animate={idleAnim}
            transition={idleTransition}
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformOrigin: "50% 60%" }}
          >
            <img
              src={spriteSrc}
              alt={creature.name}
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{
                filter: mood === "oops" ? "saturate(0.7) brightness(0.85)" : "drop-shadow(0 6px 14px rgba(0,0,0,0.35))"
              }}
            />
          </motion.div>

          {/* Badges (au-dessus du sprite, toujours clippés) */}
          <div className="absolute left-2 top-2 z-20">
            <TypeBadge type={creature.type} size="xs" />
          </div>
          <div className="absolute right-2 top-2 z-20 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-md">
            Forme {creature.evolution_stage}
          </div>
        </div>

        {/* Bulle EN DEHORS du clipping */}
        {state ? (
          <CreatureSpeechBubble state={state} creature={creature} override={reaction || undefined} vertical="bottom" />
        ) : reaction ? (
          <div className="pointer-events-none absolute -bottom-3 z-30 flex w-full justify-center">
            <div className="max-w-[90%] rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-500/90 to-violet-600/90 px-3 py-1 text-center text-[11px] font-black text-white shadow-glow backdrop-blur-md">
              {reaction}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 text-center">
        <p className={`${labelSize} font-black leading-tight text-white drop-shadow`}>{creature.name}</p>
        <p className="text-[11px] font-semibold text-white/70">{stageName} · {meta.display}</p>
      </div>
    </div>
  );
}
