"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomGameNav from "@/components/BottomGameNav";
import TypeBadge from "@/components/TypeBadge";
import HelpPanel, { HelpButton } from "@/components/HelpPanel";
import PageLoader from "@/components/PageLoader";
import { CREATURE_POOL } from "@/lib/gameLogic";
import { getSpeciesSprite, SPECIES_META } from "@/lib/creatureVisuals";
import { CreatureType } from "@/lib/types";
import { useGameState } from "@/lib/useGameState";

// Descriptions narratives par famille
const lore: Record<CreatureType, { tagline: string; story: string; weakness: string; strength: string; habitat: string }> = {
  fire: {
    tagline: "Petit feu qui rugit, grand soleil qui brûle.",
    story: "Flamy vit dans les pierres chaudes et adore les défis rapides. À chaque évolution, sa flamme grandit comme une crinière.",
    weakness: "Subit plus de dégâts contre les créatures Eau.",
    strength: "Très efficace face aux créatures Plante.",
    habitat: "Volcans, plaines sèches, sources chaudes."
  },
  water: {
    tagline: "Vague calme, vague rapide.",
    story: "Bubbli respire dans la brume et glisse sur les rivières. Sa goutte du dessus de la tête grandit avec lui.",
    weakness: "Subit plus de dégâts contre les créatures Électrique et Plante.",
    strength: "Très efficace face aux créatures Feu.",
    habitat: "Rivières, marais, océans tièdes."
  },
  plant: {
    tagline: "La nature gagne toujours, lentement.",
    story: "Leafy pousse vers la lumière et fait pousser tout ce qu'il touche. Sa couronne fleurit à la dernière forme.",
    weakness: "Subit plus de dégâts contre les créatures Feu.",
    strength: "Très efficace face aux créatures Eau et Électrique.",
    habitat: "Forêts, prairies, champs de roches verdoyantes."
  },
  electric: {
    tagline: "Étincelle d'abord, tonnerre ensuite.",
    story: "Zappi adore courir et déclenche des éclairs quand il rit. À la dernière forme, il porte une tempête entière.",
    weakness: "Subit plus de dégâts contre les créatures Plante.",
    strength: "Très efficace face aux créatures Eau.",
    habitat: "Montagnes orageuses, plaines venteuses."
  }
};

export default function PokedexPage() {
  const { state, hydrated } = useGameState();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [help, setHelp] = useState(false);

  const entries = useMemo(() => {
    if (!state) return [];
    return CREATURE_POOL.map((c, idx) => {
      // Recherche par species (plus précis qu'un match par type maintenant)
      const owned = state.creatures.find((cr) => (cr.species ?? cr.type) === c.species);
      const isUnlocked = idx < state.progress.unlockedCreatures;
      return {
        idx,
        pool: c,
        owned,
        isUnlocked,
        isDiscovered: isUnlocked || Boolean(owned)
      };
    });
  }, [state]);

  if (!hydrated || !state) {
    return <PageLoader label="Ouverture du Codex..." />;
  }

  const selected = selectedIdx !== null ? entries[selectedIdx] : null;
  const lored = selected ? lore[selected.pool.type] : null;
  const family = selected ? SPECIES_META[selected.pool.species] : null;

  return (
    <main className="space-y-3 pb-24">
      <header className="glass-strong flex items-center justify-between p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Codex</p>
          <h1 className="text-2xl font-black shimmer-text">Mon Pokédex</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">{entries.filter((e) => e.isDiscovered).length} / {entries.length}</span>
          <HelpButton onClick={() => setHelp(true)} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {entries.map((entry) => {
          const stage = (entry.owned?.evolution_stage ?? 1) as 1 | 2 | 3;
          const typeGradient: Record<string, string> = {
            fire: "from-orange-500/25 via-rose-500/15 to-slate-900/40",
            water: "from-sky-500/25 via-cyan-500/15 to-slate-900/40",
            plant: "from-emerald-500/25 via-lime-500/15 to-slate-900/40",
            electric: "from-amber-400/25 via-yellow-500/15 to-slate-900/40"
          };
          return (
            <motion.button
              key={entry.idx}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedIdx(entry.idx)}
              className={`poke-card group flex flex-col bg-gradient-to-br ${typeGradient[entry.pool.type] ?? typeGradient.fire} p-2.5 text-left`}
            >
              {/* En-tête : numéro + type */}
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-black text-white/90">
                  N°{String(entry.idx + 1).padStart(3, "0")}
                </span>
                <TypeBadge type={entry.pool.type} size="xs" />
              </div>

              {/* Vignette sprite ou placeholder */}
              <div className="relative mt-1.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/30 to-black/50">
                {entry.isDiscovered ? (
                  <div className="h-full w-full overflow-hidden">
                    <img
                      src={getSpeciesSprite(entry.pool.species, entry.owned?.evolution_stage ?? 1)}
                      alt={entry.pool.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                ) : (
                  // Placeholder élégant : "?" lumineux + halo discret
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                    <motion.div
                      animate={{ y: [0, -3, 0], opacity: [0.6, 0.9, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-5xl font-black text-white/30"
                      style={{ textShadow: "0 0 18px rgba(255,255,255,0.18)" }}
                    >
                      ?
                    </motion.div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Inconnu</p>
                  </div>
                )}
                {/* Reflet glass */}
                <div className="pointer-events-none absolute inset-x-2 top-2 h-3 rounded-full bg-white/10 blur-md" />
              </div>

              {/* Bas : nom + meta */}
              <div className="mt-2 space-y-0.5">
                <p className="truncate text-center text-sm font-black text-white">
                  {entry.isDiscovered ? (entry.owned?.name ?? entry.pool.name) : "???"}
                </p>
                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-white/60">
                  <span className="rounded bg-white/10 px-1.5 py-0.5">×{entry.pool.table}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5">{entry.owned ? `Niv ${entry.owned.level}` : "Niv —"}</span>
                </div>
              </div>

              {!entry.isUnlocked && !entry.owned && (
                <div className="mt-1.5 rounded-full bg-black/40 px-2 py-0.5 text-center text-[9px] font-black text-white/65">
                  🔒 Niv joueur +{entry.idx * 5}
                </div>
              )}
            </motion.button>
          );
        })}
      </section>

      <BottomGameNav active="pokedex" />

      {/* Détail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 pb-20 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIdx(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black backdrop-blur-md">
                  N°{String(selected.idx + 1).padStart(3, "0")}
                </span>
                <button onClick={() => setSelectedIdx(null)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">✕</button>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-black/30 to-black/50">
                  {selected.isDiscovered ? (
                    <img
                      src={getSpeciesSprite(selected.pool.species, selected.owned?.evolution_stage ?? 1)}
                      alt={selected.pool.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-6xl font-black text-white/30" style={{ textShadow: "0 0 20px rgba(255,255,255,0.18)" }}>?</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Inconnu</p>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-2 top-2 h-3 rounded-full bg-white/10 blur-md" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-black shimmer-text">{selected.isDiscovered ? (selected.owned?.name ?? selected.pool.name) : "???"}</p>
                  <p className="text-xs font-black text-white/70">Espèce {family?.display}</p>
                  <div className="mt-1 flex gap-1"><TypeBadge type={selected.pool.type} /></div>
                  <p className="mt-2 text-[11px] italic text-white/70">"{lored?.tagline}"</p>
                </div>
              </div>

              {selected.isDiscovered ? (
                <>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs">
                    <p className="font-black uppercase tracking-wide text-cyan-200">Histoire</p>
                    <p className="mt-1 text-white/80">{lored?.story}</p>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-100">
                      <p className="font-black uppercase tracking-wide">Force</p>
                      <p>{lored?.strength}</p>
                    </div>
                    <div className="rounded-xl bg-rose-500/20 p-2 text-rose-100">
                      <p className="font-black uppercase tracking-wide">Faiblesse</p>
                      <p>{lored?.weakness}</p>
                    </div>
                    <div className="rounded-xl bg-sky-500/20 p-2 text-sky-100">
                      <p className="font-black uppercase tracking-wide">Habitat</p>
                      <p>{lored?.habitat}</p>
                    </div>
                  </div>

                  <div className="mt-2 rounded-2xl border border-amber-300/30 bg-amber-400/15 p-2 text-center text-xs font-black text-amber-100">
                    🎯 Table associée : multiplications de × {selected.pool.table}
                  </div>

                  {/* Évolutions */}
                  <div className="mt-3">
                    <p className="text-[11px] font-black uppercase tracking-wide text-white/70">Lignée d'évolution</p>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((stage) => {
                        const owned = selected.owned;
                        const reached = owned ? owned.evolution_stage >= stage : false;
                        const name = SPECIES_META[selected.pool.species].stageNames[stage - 1];
                        return (
                          <div key={stage} className={`rounded-xl border p-2 text-center ${reached ? "border-violet-300/40 bg-violet-500/20" : "border-white/10 bg-white/5"}`}>
                            <div className="h-20 overflow-hidden rounded-lg bg-black/30">
                              {reached ? (
                                <img
                                  src={getSpeciesSprite(selected.pool.species, stage)}
                                  alt={name}
                                  className="h-full w-full object-cover"
                                  draggable={false}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <span className="text-2xl font-black text-white/30">?</span>
                                </div>
                              )}
                            </div>
                            <p className={`mt-1 text-[10px] font-black ${reached ? "text-violet-100" : "text-white/50"}`}>{reached ? name : "???"}</p>
                            <p className="text-[9px] text-white/60">Forme {stage}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selected.owned && (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-black">
                      <div className="rounded-lg bg-rose-500/20 px-2 py-1 text-rose-100">💪 {selected.owned.stats.attack}</div>
                      <div className="rounded-lg bg-cyan-500/20 px-2 py-1 text-cyan-100">⚡ {selected.owned.stats.speed}</div>
                      <div className="rounded-lg bg-violet-500/20 px-2 py-1 text-violet-100">🧠 {selected.owned.stats.intelligence}</div>
                      <div className="rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-100">🛡 {selected.owned.stats.defense}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-white/70">
                  <p>Cette créature reste à découvrir.</p>
                  <p className="mt-1 text-[11px]">Continue à monter de niveau pour la rencontrer.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HelpPanel open={help} title="📖 À propos du Codex" onClose={() => setHelp(false)}>
        <p>Le <b>Codex</b> liste toutes les créatures que tu peux dresser. Chacune est liée à une table de multiplication.</p>
        <p>🔒 Une créature à découvrir reste en silhouette. Monte en niveau pour la débloquer (une nouvelle créature tous les 5 niveaux joueur).</p>
        <p>👉 Touche une carte pour voir l'histoire, les forces, faiblesses et les 3 formes d'évolution.</p>
        <p>💡 Les avantages de type sont importants en combat : Feu &gt; Plante, Eau &gt; Feu, Plante &gt; Eau/Élec, Élec &gt; Eau.</p>
      </HelpPanel>
    </main>
  );
}
