"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomGameNav from "@/components/BottomGameNav";
import DailyQuestsPanel from "@/components/DailyQuestsPanel";
import EvolutionPreviewPanel from "@/components/EvolutionPreviewPanel";
import GameIcon from "@/components/GameIcon";
import TypeBadge from "@/components/TypeBadge";
import HelpPanel, { HelpButton } from "@/components/HelpPanel";
import PageLoader from "@/components/PageLoader";
import StatusEffectsBar from "@/components/StatusEffectsBar";
import { ACHIEVEMENTS, claimQuestReward, getEvolutionProgress, getStatusEffects, getZoneName } from "@/lib/gameLogic";
import { defaultSpeciesForType, getSpeciesSprite } from "@/lib/creatureVisuals";
import { useGameState } from "@/lib/useGameState";

const zones: Array<{ id: number; label: string; tables: string; gradient: string; emoji: string }> = [
  { id: 1, label: "Prairie", tables: "× 3 et × 4", gradient: "from-emerald-400/50 via-lime-400/30 to-emerald-600/40", emoji: "🌿" },
  { id: 2, label: "Forêt", tables: "× 5 et × 6", gradient: "from-teal-400/40 via-cyan-400/30 to-teal-700/40", emoji: "🌲" },
  { id: 3, label: "Montagne", tables: "× 7 et × 8", gradient: "from-slate-400/40 via-zinc-400/30 to-slate-700/40", emoji: "⛰️" },
  { id: 4, label: "Volcan", tables: "× 9 et × 10", gradient: "from-orange-400/40 via-red-500/30 to-rose-700/40", emoji: "🌋" }
];

export default function HomePage() {
  const { state, creature, hydrated, commit } = useGameState();
  const [help, setHelp] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [evoPreviewOpen, setEvoPreviewOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [questToast, setQuestToast] = useState<string | null>(null);
  const [streakToast, setStreakToast] = useState<{ coins: number; xp: number; streak: number } | null>(null);

  useEffect(() => {
    const onAward = (e: Event) => {
      const ce = e as CustomEvent<{ coins: number; xp: number; streak: number }>;
      setStreakToast(ce.detail);
      window.setTimeout(() => setStreakToast(null), 4000);
    };
    window.addEventListener("daily-streak-awarded", onAward as EventListener);
    return () => window.removeEventListener("daily-streak-awarded", onAward as EventListener);
  }, []);

  const earnedAchievements = useMemo(() => {
    const owned = new Set(state?.progress.achievements ?? []);
    return ACHIEVEMENTS.map((a) => ({ ...a, earned: owned.has(a.id) }));
  }, [state]);
  const statusEffects = useMemo(() => (state ? getStatusEffects(state) : []), [state]);
  const evolutionInfo = useMemo(() => (state && creature ? getEvolutionProgress(state, creature) : null), [state, creature]);

  if (!hydrated || !state || !creature) {
    return <PageLoader label="Préparation de l'aventure..." />;
  }

  return (
    <main className="relative space-y-3 pb-24">
      <header className="glass-strong flex items-center justify-between p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Aventure</p>
          <h1 className="text-2xl font-black shimmer-text">Monster Farm Quest</h1>
        </div>
        <HelpButton onClick={() => setHelp(true)} />
      </header>

      {/* Héros : créature en grand */}
      <section className="poke-card relative overflow-hidden bg-gradient-to-br from-violet-600/30 via-indigo-600/25 to-slate-900/40 p-4">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/30">
            <img
              src={getSpeciesSprite(creature.species ?? defaultSpeciesForType(creature.type), creature.evolution_stage)}
              alt={creature.name}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TypeBadge type={creature.type} />
              <span className="chip">Lv {creature.level}</span>
            </div>
            <p className="mt-2 text-2xl font-black text-white drop-shadow">{creature.name}</p>
            <p className="text-[11px] font-bold text-white/70">{state.progress.objective}</p>
            <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-black">
              <div className="flex items-center justify-center gap-0.5 rounded-lg bg-rose-500/20 px-1 py-0.5 text-rose-100"><GameIcon name="strength" size={11} />{creature.stats.attack}</div>
              <div className="flex items-center justify-center gap-0.5 rounded-lg bg-cyan-500/20 px-1 py-0.5 text-cyan-100"><GameIcon name="speed" size={11} />{creature.stats.speed}</div>
              <div className="flex items-center justify-center gap-0.5 rounded-lg bg-violet-500/20 px-1 py-0.5 text-violet-100"><GameIcon name="intelligence" size={11} />{creature.stats.intelligence}</div>
              <div className="flex items-center justify-center gap-0.5 rounded-lg bg-emerald-500/20 px-1 py-0.5 text-emerald-100"><GameIcon name="defense" size={11} />{creature.stats.defense}</div>
            </div>
          </div>
        </div>

        {/* Bouton preview évolution */}
        <button
          onClick={() => setEvoPreviewOpen(true)}
          className="relative mt-3 w-full rounded-xl border border-violet-300/30 bg-violet-500/15 px-3 py-2 text-xs font-black text-violet-100 backdrop-blur-md hover:bg-violet-500/25 active:scale-95"
        >
          ❓ Prochaine évolution {evolutionInfo?.ready ? "· prêt à évoluer !" : evolutionInfo?.stageTarget && evolutionInfo.stageTarget <= 3 ? `· Forme ${evolutionInfo.stageTarget}` : "· Forme finale"}
        </button>

        {/* Effets actifs */}
        <div className="relative mt-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">Effets actifs</p>
          <StatusEffectsBar effects={statusEffects} />
        </div>
      </section>

      {/* Actions principales */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/farm" className="poke-card group bg-gradient-to-br from-emerald-500/40 via-green-600/30 to-emerald-900/40 p-3 active:scale-95">
          <div className="text-emerald-200"><GameIcon name="farm" size={28} /></div>
          <p className="mt-1 text-lg font-black text-white">Ferme</p>
          <p className="text-[11px] font-bold text-white/80">Planter, nourrir, soigner</p>
        </Link>
        <Link href="/battle" className="poke-card group bg-gradient-to-br from-rose-500/40 via-red-600/30 to-rose-900/40 p-3 active:scale-95">
          <div className="text-rose-200"><GameIcon name="battle" size={28} /></div>
          <p className="mt-1 text-lg font-black text-white">Combat</p>
          <p className="text-[11px] font-bold text-white/80">Affronter des monstres</p>
        </Link>
        <Link href="/train" className="poke-card group bg-gradient-to-br from-amber-500/40 via-orange-600/30 to-amber-900/40 p-3 active:scale-95">
          <div className="text-amber-200"><GameIcon name="train" size={28} /></div>
          <p className="mt-1 text-lg font-black text-white">Entraînement</p>
          <p className="text-[11px] font-bold text-white/80">Booster les stats</p>
        </Link>
        <Link href="/pokedex" className="poke-card group bg-gradient-to-br from-violet-500/40 via-fuchsia-600/30 to-violet-900/40 p-3 active:scale-95">
          <div className="text-violet-200"><GameIcon name="codex" size={28} /></div>
          <p className="mt-1 text-lg font-black text-white">Codex</p>
          <p className="text-[11px] font-bold text-white/80">Toutes les créatures</p>
        </Link>
      </section>

      {/* Carte des zones */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Carte des zones</p>
          <span className="chip">{state.progress.unlockedZones} / 4</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone) => {
            const unlocked = zone.id <= state.progress.unlockedZones;
            return (
              <motion.div
                key={zone.id}
                whileTap={unlocked ? { scale: 0.97 } : undefined}
                className={`poke-card relative overflow-hidden bg-gradient-to-br ${zone.gradient} p-3 ${unlocked ? "" : "opacity-60"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl">{zone.emoji}</p>
                  {!unlocked && <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-black text-white/80">🔒</span>}
                </div>
                <p className="mt-1 text-lg font-black text-white drop-shadow">{zone.label}</p>
                <p className="text-[11px] font-bold text-white/85">Tables {zone.tables}</p>
                {unlocked && zone.id === state.progress.unlockedZones && (
                  <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">Zone active</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Stats progression */}
      <section className="glass p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Progression</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
          <div className="rounded-xl bg-violet-500/20 px-2 py-1 text-violet-100">Niv joueur {state.progress.level}</div>
          <div className="rounded-xl bg-rose-500/20 px-2 py-1 text-rose-100">{state.progress.battlesWon} victoires</div>
          <div className="rounded-xl bg-emerald-500/20 px-2 py-1 text-emerald-100">Zone {getZoneName(state.progress.unlockedZones)}</div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[11px] font-black">
          <div className="rounded-xl bg-orange-500/20 px-2 py-1 text-orange-100">🔥 Streak {state.progress.streakDays ?? 0}j</div>
          <button onClick={() => setAchievementsOpen(true)} className="rounded-xl bg-amber-500/20 px-2 py-1 text-amber-100 active:scale-95">
            🏅 {earnedAchievements.filter(a => a.earned).length}/{ACHIEVEMENTS.length} succès
          </button>
        </div>
      </section>

      {/* Quêtes journalières — bouton fixe */}
      {state.progress.dailyQuests && (
        <button
          onClick={() => setQuestsOpen(true)}
          className="relative w-full overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/25 via-sky-500/20 to-indigo-500/25 p-3 text-left backdrop-blur-md active:scale-95"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">📋 Quêtes du jour</p>
              <p className="text-sm font-black text-white">
                {state.progress.dailyQuests.quests.filter((q) => q.claimed).length}
                {" / "}
                {state.progress.dailyQuests.quests.length} validées
              </p>
            </div>
            {state.progress.dailyQuests.quests.some((q) => !q.claimed && q.progress >= q.target) && (
              <span className="rounded-full bg-amber-400 px-2 py-1 text-[10px] font-black text-amber-950 shadow-glowElectric animate-pulse">
                Récompense !
              </span>
            )}
          </div>
        </button>
      )}

      <BottomGameNav active="map" />

      {/* Toast streak */}
      <AnimatePresence>
        {streakToast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/90 to-orange-500/90 px-4 py-2 text-center shadow-glow backdrop-blur"
          >
            <p className="text-sm font-black text-white">🔥 Streak {streakToast.streak} jours !</p>
            <p className="text-xs font-bold text-white/90">+{streakToast.coins} pièces · +{streakToast.xp} XP</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale achievements */}
      <AnimatePresence>
        {achievementsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 pb-20 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAchievementsOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-br from-amber-900/85 via-slate-900/90 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black shimmer-text">🏅 Succès</h3>
                <button onClick={() => setAchievementsOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">✕</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {earnedAchievements.map((a) => (
                  <div key={a.id} className={`rounded-xl border p-2 ${a.earned ? "border-amber-300/40 bg-amber-500/15" : "border-white/10 bg-white/5 opacity-50"}`}>
                    <p className="text-2xl">{a.icon}</p>
                    <p className="text-xs font-black text-white">{a.name}</p>
                    <p className="text-[10px] font-bold text-white/70">{a.description}</p>
                    {a.earned && <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-amber-200">Débloqué</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {evolutionInfo && (
        <EvolutionPreviewPanel
          open={evoPreviewOpen}
          creature={creature}
          progress={evolutionInfo}
          onClose={() => setEvoPreviewOpen(false)}
          /* Pas de onEvolve depuis le hub : on redirige vers la ferme */
        />
      )}

      {state.progress.dailyQuests && (
        <DailyQuestsPanel
          open={questsOpen}
          quests={state.progress.dailyQuests.quests}
          onClose={() => setQuestsOpen(false)}
          onClaim={(id) => {
            const result = claimQuestReward(state, id);
            if (result.ok && result.reward) {
              commit(result.nextState);
              setQuestToast(`+${result.reward.coins} 🪙 · +${result.reward.xp} ⭐${result.reward.rare ? ` · +${result.reward.rare} 💎` : ""}`);
              window.setTimeout(() => setQuestToast(null), 3500);
            }
          }}
        />
      )}

      <AnimatePresence>
        {questToast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-emerald-400/90 to-green-600/90 px-4 py-2 text-center shadow-glow backdrop-blur"
          >
            <p className="text-sm font-black text-white">Quête réclamée !</p>
            <p className="text-xs font-bold text-white/90">{questToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <HelpPanel open={help} title="🎮 Comment jouer ?" onClose={() => setHelp(false)}>
        <p><b>But du jeu :</b> élever ta créature, apprendre les tables de multiplication, et conquérir les 4 zones.</p>
        <p><b>Règle d'or :</b> chaque action demande une multiplication. Bonne réponse = action réussie + récompense.</p>
        <ul className="ml-4 list-disc space-y-1 text-[12px]">
          <li><b>🌾 Ferme :</b> plante des graines, récolte, nourris ta créature.</li>
          <li><b>⚔️ Combat :</b> bats des ennemis pour gagner des pièces et des matériaux rares.</li>
          <li><b>💪 Entraînement :</b> améliore Force / Vitesse / Intelligence / Défense.</li>
          <li><b>📖 Codex :</b> retrouve toutes les créatures que tu peux débloquer.</li>
        </ul>
        <p>💡 La table de <b>2</b> n'apparaît jamais (trop facile). Les combats peuvent demander des tables × 11 à × 15.</p>
        <p><b>Effets actifs</b> selon les besoins :</p>
        <ul className="ml-4 list-disc space-y-1 text-[12px]">
          <li>🍖 <b>Faim &gt; 70</b> : +10 % dégâts/récolte. <b>&lt; 30</b> : -15 % dégâts + perd XP. <b>&lt; 15</b> : -30 % + perd des niveaux !</li>
          <li>💖 <b>Bonheur &gt; 75</b> : +12 % récompenses. <b>&lt; 30</b> : -10 % dégâts + 15 % chance de rater son tour.</li>
          <li>⚡ <b>Énergie &gt; 80 %</b> : +10 % XP. <b>&lt; 30 %</b> : -20 % dégâts + atelier impossible.</li>
        </ul>
      </HelpPanel>
    </main>
  );
}
