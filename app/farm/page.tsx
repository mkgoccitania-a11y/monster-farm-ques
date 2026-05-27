"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BottomGameNav from "@/components/BottomGameNav";
import CreatureCard from "@/components/Creature";
import CropsHelpPanel from "@/components/CropsHelpPanel";
import EvolutionModal from "@/components/EvolutionModal";
import EvolutionPreviewPanel from "@/components/EvolutionPreviewPanel";
import FarmPlotTile, { FarmPlotUiModel } from "@/components/FarmPlotTile";
import RareMaterialPanel from "@/components/RareMaterialPanel";
import HelpPanel, { HelpButton } from "@/components/HelpPanel";
import PageLoader from "@/components/PageLoader";
import QuestionGate from "@/components/QuestionGate";
import ResourceTopBar from "@/components/ResourceTopBar";
import RewardBurst from "@/components/RewardBurst";
import GameIcon from "@/components/GameIcon";
import StatBar from "@/components/StatBar";
import StatusEffectsBar from "@/components/StatusEffectsBar";
import TypeBadge from "@/components/TypeBadge";
import {
  buyEnergyPotion,
  buySeeds,
  ENERGY_POTION_COST,
  ENERGY_POTION_GAIN,
  feedCurrentCreature,
  getCropConfig,
  getEnergyRefillInMs,
  getEvolutionProgress,
  getMasteryOverview,
  getNextUnlockInfo,
  getStatusEffects,
  getZoneName,
  harvestCrop,
  isEnergyRegenFast,
  plantCrop,
  resolveAnswer,
  restCurrentCreature,
  triggerEvolution,
  upgradeFarmPlot,
  upgradeCurrentCreatureStat
} from "@/lib/gameLogic";
import { resetState } from "@/lib/storage";
import { getCreatureReaction } from "@/lib/creatureVisuals";
import { Creature, CropType, MultiplicationQuestion, PlayerState } from "@/lib/types";
import { useGameState } from "@/lib/useGameState";

const cropTypes: CropType[] = ["fast", "medium", "slow"];

const cropLabel: Record<CropType, string> = { fast: "Pousse", medium: "Baie", slow: "Racine" };
const cropIcon: Record<CropType, string> = { fast: "🌱", medium: "🍓", slow: "🥕" };

const formatRemaining = (ms: number) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

type QuestionResult = { key: string; isCorrect: boolean; responseMs: number };

interface PendingAction {
  subtitle: string;
  questions: MultiplicationQuestion[];
  run: (results: QuestionResult[]) => void;
}

export default function FarmPage() {
  const { state, creature, hydrated, buildQuestion, commit, commitWithUpdater, setCurrentCreature } = useGameState();
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const [mood, setMood] = useState<"idle" | "happy" | "oops" | "evolving">("idle");
  const [reaction, setReaction] = useState<string>("Bienvenue !");
  const [message, setMessage] = useState("Récolte, nourris, entraîne, combats.");

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [panel, setPanel] = useState<"none" | "shop" | "stats" | "team">("none");
  const [help, setHelp] = useState(false);
  const [cropsHelp, setCropsHelp] = useState(false);
  const [rareHelp, setRareHelp] = useState(false);
  const [evoPreviewOpen, setEvoPreviewOpen] = useState(false);

  const [burst, setBurst] = useState<{ show: boolean; text: string; color: "gold" | "green" | "blue" }>({ show: false, text: "", color: "gold" });
  const [showEvolution, setShowEvolution] = useState(false);
  const [evoPrev, setEvoPrev] = useState<Creature | null>(null);
  const [evoCurrent, setEvoCurrent] = useState<Creature | null>(null);

  const TOTAL_PLOTS = 4;
  const LOCKED_PRICES = [35, 55, 75, 95];

  const masteryInfo = useMemo(() => (state ? getMasteryOverview(state) : { mastered: 0, total: 0, weak: [] }), [state]);
  const nextUnlock = useMemo(() => (state ? getNextUnlockInfo(state) : null), [state]);
  const evolutionInfo = useMemo(() => (state && creature ? getEvolutionProgress(state, creature) : null), [state, creature]);
  const unlockedCrops = useMemo<CropType[]>(() => {
    if (!state) return [];
    const z = state.progress.unlockedZones;
    return (["fast", "medium", "slow"] as CropType[]).filter((c) => getCropConfig(c).unlockZone <= z);
  }, [state]);
  const statusEffects = useMemo(() => (state ? getStatusEffects(state) : []), [state]);

  // IMPORTANT : ce useMemo doit rester avant tout early return (règle des hooks React).
  const potagerCases = useMemo<FarmPlotUiModel[]>(() => {
    if (!state) return [];
    const list: FarmPlotUiModel[] = [];
    for (let i = 0; i < TOTAL_PLOTS; i += 1) {
      const id = `plot-${i + 1}`;
      const found = state.progress.plots.find((p) => p.id === id);
      const achetee = Boolean(found);
      const prix = LOCKED_PRICES[i] ?? 120;

      let statut: FarmPlotUiModel["statut"] = "verrouillee";
      let planteActuelle: CropType | null = null;
      let tempsRestantLabel: string | undefined;

      if (achetee && found) {
        if (!found.cropType) statut = "disponible";
        else {
          planteActuelle = found.cropType;
          const ready = Boolean(found.readyAt && found.readyAt <= now);
          if (ready) statut = "prete";
          else { statut = "croissance"; const remaining = found.readyAt ? found.readyAt - now : 0; tempsRestantLabel = formatRemaining(remaining); }
        }
      }

      list.push({ id, nom: `Case ${i + 1}`, statut, prix, achetee, planteActuelle, tempsRestantLabel });
    }
    return list;
  }, [state?.progress.plots, now]);

  if (!hydrated || !state || !creature) {
    return <PageLoader label="Chargement de la ferme..." />;
  }

  const popBurst = (text: string, color: "gold" | "green" | "blue" = "gold") => {
    setBurst({ show: true, text, color });
    window.setTimeout(() => setBurst({ show: false, text: "", color }), 1100);
  };

  const flashMood = (m: "idle" | "happy" | "oops" | "evolving", r: string) => {
    setMood(m);
    setReaction(r);
    window.setTimeout(() => setMood("idle"), 800);
  };

  const applyAnswers = (results: QuestionResult[], rewardScale: number): { next: PlayerState; allCorrect: boolean } => {
    let next = state;
    let allCorrect = true;
    results.forEach((r) => {
      const solved = resolveAnswer(next, r.key, r.isCorrect, rewardScale, r.responseMs);
      next = solved.nextState;
      if (!r.isCorrect) allCorrect = false;
    });
    return { next, allCorrect };
  };

  const askThenRun = (subtitle: string, count: number, run: (results: QuestionResult[]) => void) => {
    const questions: MultiplicationQuestion[] = [];
    const recents: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const q = buildQuestion(undefined, recents);
      if (!q) return;
      questions.push(q);
      recents.push(q.key);
    }
    setPending({ subtitle, questions, run });
  };

  const handleEvolveClick = () => {
    const evo = getEvolutionProgress(state, creature);
    if (!evo.ready) {
      setMessage("Conditions d'évolution non remplies.");
      flashMood("oops", "Pas encore...");
      return;
    }
    askThenRun("Évolution · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 1);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, évolution échouée."); flashMood("oops", "Encore !"); return; }
      const evolved = triggerEvolution(next);
      if (!evolved.ok) { commit(next); setMessage(evolved.reason ?? "Évolution impossible."); flashMood("oops", "Pas prêt..."); return; }
      const newCreature = evolved.nextState.creatures.find((c) => c.id === creature.id) ?? creature;
      setEvoPrev({ ...creature }); setEvoCurrent({ ...newCreature }); setShowEvolution(true);
      setMood("evolving"); setReaction(getCreatureReaction(creature.type, "evolve"));
      commit(evolved.nextState); popBurst("Évolution !", "gold");
    });
  };

  const handleFeed = () => {
    if (state.progress.food <= 0) { setMessage("Plus de nourriture. Récolte d'abord."); flashMood("oops", "Vide"); return; }
    askThenRun("Repas · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.65);
      const fed = feedCurrentCreature(next, allCorrect);
      if (!fed.ok) { commit(next); setMessage("Plus de nourriture."); flashMood("oops", "Vide"); return; }
      commit(fed.nextState);
      flashMood(allCorrect ? "happy" : "idle", allCorrect ? getCreatureReaction(creature.type, "feed") : "Repas moyen");
      popBurst(`Faim +${fed.hungerGain}`, "green");
      setMessage("Repas donné.");
    });
  };

  const handleRest = () => {
    if (state.progress.food <= 0) { setMessage("Pas de ration pour la sieste."); flashMood("oops", "Vide"); return; }
    if (state.progress.energy >= state.progress.energyMax) { setMessage("Énergie déjà au max."); return; }
    askThenRun("Sieste · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.5);
      const rested = restCurrentCreature(next, allCorrect);
      if (!rested.ok) { commit(next); setMessage(rested.reason ?? "Sieste impossible."); flashMood("oops", "Pas pu"); return; }
      commit(rested.nextState);
      flashMood(allCorrect ? "happy" : "idle", allCorrect ? "Bien dormi !" : "Petit roupillon");
      popBurst(`Énergie +${rested.energyGain}`, "blue");
      setMessage(`Sieste : +${rested.energyGain} énergie, +${rested.happinessGain} bonheur (−1 ration).`);
    });
  };

  const handleBuyEnergyPotion = () => {
    if (state.progress.energy >= state.progress.energyMax) { setMessage("Énergie déjà au max."); return; }
    if (state.progress.coins < ENERGY_POTION_COST) { setMessage(`Il faut ${ENERGY_POTION_COST} pièces pour la potion.`); flashMood("oops", "Pas assez"); return; }
    askThenRun(`Potion d'énergie · 1 multiplication`, 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.5);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, achat refusé."); flashMood("oops", "Raté"); return; }
      const bought = buyEnergyPotion(next);
      if (!bought.ok) { commit(next); setMessage(bought.reason ?? "Achat impossible."); flashMood("oops", "Raté"); return; }
      commit(bought.nextState);
      flashMood("happy", "Boost !");
      popBurst(`Énergie +${ENERGY_POTION_GAIN}`, "blue");
      setMessage(`Potion d'énergie : −${ENERGY_POTION_COST} pièces, +${ENERGY_POTION_GAIN} énergie.`);
    });
  };

  const handleHarvest = (plotId: string) => {
    askThenRun("Récolte · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.55);
      const harvested = harvestCrop(next, plotId, allCorrect ? 1.3 : 1);
      if (!harvested.ok) { commit(next); setMessage("Cette parcelle n'est pas prête."); flashMood("oops", "Pas prêt"); return; }
      commit(harvested.nextState);
      flashMood(allCorrect ? "happy" : "idle", getCreatureReaction(creature.type, "harvest"));
      popBurst(`+${harvested.gainedCoins}P +${harvested.gainedFood}N`, "gold");
      setMessage("Récolte terminée.");
    });
  };

  const handlePlant = (plotId: string, cropType: CropType) => {
    const cfg = getCropConfig(cropType);
    if (state.progress.unlockedZones < cfg.unlockZone) { setMessage(`Culture ${cropLabel[cropType]} verrouillée.`); flashMood("oops", "Verrouillé"); return; }
    if (state.progress.seeds[cropType] <= 0) { setMessage("Pas de graine de ce type."); flashMood("oops", "Plus de graines"); return; }
    askThenRun(`Planter ${cropLabel[cropType]} · 1 multiplication`, 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.5);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, plantation ratée."); flashMood("oops", "Raté !"); return; }
      const planted = plantCrop(next, plotId, cropType);
      if (!planted.ok) { commit(next); setMessage(planted.reason ?? "Plantation impossible."); flashMood("oops", "Impossible"); return; }
      commit(planted.nextState); flashMood("happy", "Graine plantée !"); setMessage(`${cropLabel[cropType]} en pousse.`);
    });
  };

  const handleBuySeed = (cropType: CropType) => {
    const cfg = getCropConfig(cropType);
    if (state.progress.coins < cfg.seedCost) { setMessage(`Il faut ${cfg.seedCost} pièces.`); flashMood("oops", "Pas assez"); return; }
    askThenRun(`Acheter graine ${cropLabel[cropType]} · 1 multiplication`, 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.5);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, achat refusé."); flashMood("oops", "Raté"); return; }
      const bought = buySeeds(next, cropType, 1);
      if (!bought.ok) { commit(next); setMessage(`Il faut ${bought.cost} pièces.`); flashMood("oops", "Pas assez"); return; }
      commit(bought.nextState); flashMood("happy", "Achat ok !"); setMessage(`+1 graine ${cropLabel[cropType]}.`);
    });
  };

  const handleBuyPlot = (plotId: string) => {
    const nextLockedIndex = state.progress.plots.length;
    const expectedId = `plot-${nextLockedIndex + 1}`;
    if (plotId !== expectedId) { setMessage("Achète d'abord la case précédente."); flashMood("oops", "Pas encore"); return; }
    askThenRun("Acheter une case · 2 multiplications", 2, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.7);
      if (!allCorrect) { commit(next); setMessage("Au moins une réponse fausse, achat refusé."); flashMood("oops", "Raté"); return; }
      const upgraded = upgradeFarmPlot(next);
      if (!upgraded.ok) { commit(next); setMessage(`Il faut ${upgraded.cost} pièces.`); flashMood("oops", "Pas assez"); return; }
      commit(upgraded.nextState); flashMood("happy", "Nouvelle case !"); popBurst("Case +1", "gold"); setMessage("Case débloquée !");
    });
  };

  const handleUpgradeStat = (stat: "attack" | "speed" | "intelligence" | "defense") => {
    askThenRun(`+1 ${stat} · 2 multiplications`, 2, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.7);
      if (!allCorrect) { commit(next); setMessage("Au moins une réponse fausse, upgrade raté."); flashMood("oops", "Raté"); return; }
      const upgraded = upgradeCurrentCreatureStat(next, stat);
      if (!upgraded.ok) { commit(next); setMessage(`Il faut ${upgraded.cost} pièces.`); flashMood("oops", "Pas assez"); return; }
      commit(upgraded.nextState); flashMood("happy", "Stat +1"); popBurst(`+1 ${stat}`, "blue");
    });
  };

  const handleSwitch = (creatureId: string) => {
    if (creatureId === state.progress.currentCreatureId) return;
    askThenRun("Changer de créature · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.4);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, changement refusé."); flashMood("oops", "Raté"); return; }
      setCurrentCreature(creatureId);
      setMessage("Créature active changée."); flashMood("happy", "Nouveau partenaire !"); setPanel("none");
    });
  };

  const handleRename = () => {
    const value = window.prompt("Nouveau nom du personnage :", creature.name);
    if (!value) return;
    const cleaned = value.trim().slice(0, 16);
    if (!cleaned) return;
    askThenRun("Renommer · 1 multiplication", 1, (results) => {
      const { next, allCorrect } = applyAnswers(results, 0.4);
      if (!allCorrect) { commit(next); setMessage("Réponse fausse, renommage échoué."); flashMood("oops", "Raté"); return; }
      commitWithUpdater((prev) => ({
        ...prev,
        creatures: prev.creatures.map((item) =>
          item.id === prev.progress.currentCreatureId ? { ...item, name: cleaned } : item
        )
      }));
      flashMood("happy", "Nouveau nom !"); setMessage(`Ton personnage s'appelle maintenant ${cleaned}.`);
    });
  };

  const todayGoal = evolutionInfo?.ready
    ? "Ta créature peut évoluer !"
    : creature.hunger < 35
    ? "Nourrir ta créature"
    : state.progress.energy < 3
    ? "Attendre la recharge"
    : "Faire 1 duel";
  const refill = getEnergyRefillInMs(state, now);

  return (
    <main className="relative space-y-3 pb-24">
      <RewardBurst show={burst.show} text={burst.text} color={burst.color} />

      <ResourceTopBar
        level={state.progress.level}
        title="Ma Ferme"
        coins={state.progress.coins}
        happiness={creature.happiness}
        energy={state.progress.energy}
        energyMax={state.progress.energyMax}
        energyRefillMs={getEnergyRefillInMs(state, now)}
        energyRegenFast={isEnergyRegenFast(state)}
        rare={state.progress.rareMaterial}
        onRareClick={() => setRareHelp(true)}
      />

      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">🌾 Ferme — Zone {getZoneName(state.progress.unlockedZones)}</p>
        <HelpButton onClick={() => setHelp(true)} />
      </div>

      <section className="poke-card bg-gradient-to-br from-emerald-500/25 via-green-700/20 to-slate-900/50 p-3">
        <p className="text-[11px] font-black text-emerald-100">Objectif : {todayGoal}</p>
      </section>

      {/* Créature + stats */}
      <section className="grid grid-cols-[1.1fr_1fr] gap-3">
        <div className="poke-card bg-gradient-to-br from-violet-500/30 via-indigo-600/25 to-slate-900/40 p-3">
          <CreatureCard creature={creature} mood={mood} reaction={reaction !== "Bienvenue !" ? reaction : null} state={state} size="md" />
          <div className="mt-2 space-y-1.5">
            <StatBar label="Faim" value={creature.hunger} max={100} color="amber" iconName="food" />
            <StatBar label="Bonheur" value={creature.happiness} max={100} color="rose" iconName="happiness" />
            <StatBar label="Énergie" value={state.progress.energy} max={state.progress.energyMax} color="cyan" iconName="energy" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-black">
            <div className="flex items-center justify-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-rose-100"><GameIcon name="strength" size={12} />{creature.stats.attack}</div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-cyan-100"><GameIcon name="speed" size={12} />{creature.stats.speed}</div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-violet-500/20 px-2 py-1 text-violet-100"><GameIcon name="intelligence" size={12} />{creature.stats.intelligence}</div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-100"><GameIcon name="defense" size={12} />{creature.stats.defense}</div>
          </div>
          <div className="mt-2">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">Effets actifs</p>
            <StatusEffectsBar effects={statusEffects} compact />
          </div>
          <button
            onClick={() => setEvoPreviewOpen(true)}
            className="mt-2 w-full rounded-xl border border-violet-300/30 bg-violet-500/15 px-2 py-1.5 text-[11px] font-black text-violet-100 backdrop-blur-md hover:bg-violet-500/25 active:scale-95"
          >
            ❓ Prochaine évolution {evolutionInfo?.ready ? "(prêt !)" : ""}
          </button>
          {evolutionInfo?.ready && (
            <button onClick={handleEvolveClick} className="btn-primary mt-2 w-full text-xs">
              ✨ Faire évoluer !
            </button>
          )}
          <p className="mt-1 text-center text-[10px] font-black text-white/70">⏱ {formatRemaining(refill)}</p>
        </div>

        <div className="poke-card bg-gradient-to-br from-amber-500/25 via-orange-600/20 to-slate-900/40 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-200">
              Potager
            </p>
            <button
              onClick={() => setCropsHelp(true)}
              aria-label="Cultures"
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-amber-100 backdrop-blur-md hover:bg-white/20 active:scale-95"
            >
              <GameIcon name="help" size={11} /> Cultures
            </button>
          </div>
          {/* Détail des graines par type (les verrouillées sont grisées) */}
          <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] font-black">
            {(["fast", "medium", "slow"] as CropType[]).map((type) => {
              const count = state.progress.seeds[type] ?? 0;
              const cfg = getCropConfig(type);
              const locked = state.progress.unlockedZones < cfg.unlockZone;
              const iconName = type === "fast" ? "sprout" : type === "medium" ? "berry" : "root";
              const colorCls = locked
                ? "border-white/10 bg-white/5 text-white/40"
                : count > 0
                ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
                : "border-rose-300/40 bg-rose-500/20 text-rose-100";
              return (
                <button
                  key={type}
                  onClick={() => locked ? setCropsHelp(true) : (count === 0 ? setPanel("shop") : null)}
                  title={locked ? "Verrouillé, voir explications" : count === 0 ? "Aller au shop" : `${count} ${cropLabel[type]}`}
                  className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 backdrop-blur-md active:scale-95 ${colorCls}`}
                >
                  {locked && <GameIcon name="lock" size={10} />}
                  <GameIcon name={iconName} size={11} />
                  <span>{cropLabel[type]}: {count}</span>
                </button>
              );
            })}
            <span className="inline-flex items-center gap-0.5 rounded-lg border border-amber-300/30 bg-amber-500/15 px-1.5 py-0.5 text-amber-100">
              <GameIcon name="food" size={11} />{state.progress.food}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {potagerCases.map((plot) => {
              const nextLockedId = `plot-${state.progress.plots.length + 1}`;
              const canBuy = plot.id === nextLockedId && state.progress.plots.length < TOTAL_PLOTS;
              return (
                <FarmPlotTile
                  key={plot.id}
                  plot={plot}
                  isBuying={false}
                  canBuy={canBuy}
                  canPlant
                  unlockedCrops={unlockedCrops}
                  seedsByType={state.progress.seeds}
                  onBuy={handleBuyPlot}
                  onPlant={handlePlant}
                  onHarvest={handleHarvest}
                  onAskCropsInfo={() => setCropsHelp(true)}
                  onNoSeed={() => { setPanel("shop"); setMessage("Achète une graine au shop !"); }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Actions principales */}
      <section className="grid grid-cols-4 gap-2">
        <button onClick={handleFeed} className="poke-card flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-amber-400/40 to-orange-700/30 p-2 text-center active:scale-95">
          <div className="text-amber-200"><GameIcon name="food" size={24} /></div>
          <p className="text-[11px] font-black text-white">Nourrir</p>
        </button>
        <button onClick={handleRest} className="poke-card flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-cyan-400/40 to-sky-700/30 p-2 text-center active:scale-95">
          <div className="text-cyan-200"><GameIcon name="energy" size={24} /></div>
          <p className="text-[11px] font-black text-white">Sieste</p>
        </button>
        <Link href="/train" className="poke-card flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-rose-400/40 to-pink-700/30 p-2 text-center active:scale-95">
          <div className="text-rose-200"><GameIcon name="train" size={24} /></div>
          <p className="text-[11px] font-black text-white">Train</p>
        </Link>
        <Link href="/battle" className="poke-card flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-red-500/40 to-rose-800/30 p-2 text-center active:scale-95">
          <div className="text-red-200"><GameIcon name="battle" size={24} /></div>
          <p className="text-[11px] font-black text-white">Combat</p>
        </Link>
      </section>

      <section className="grid grid-cols-4 gap-2">
        <button onClick={() => setPanel("shop")} className="btn-soft text-[11px]">🛒 Shop</button>
        <button onClick={() => setPanel("stats")} className="btn-soft text-[11px]">📊 Stats</button>
        <button onClick={() => setPanel("team")} className="btn-soft text-[11px]">👥 Équipe ({state.creatures.length}/{state.progress.unlockedCreatures})</button>
        <button onClick={handleRename} className="btn-soft text-[11px]">✏️ Nom</button>
      </section>

      <section className="glass p-2 text-center text-sm font-bold text-white/90">{message}</section>

      {panel !== "none" && (
        <motion.section className="fixed inset-0 z-40 flex items-end bg-black/50 p-3 pb-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setPanel("none")}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl">
            {panel === "shop" && (
              <div className="space-y-2">
                <p className="text-base font-black shimmer-text">🛒 Boutique</p>
                <p className="text-xs text-white/70">Chaque achat demande 1 multiplication.</p>
                <div className="grid grid-cols-3 gap-2">
                  {cropTypes.map((type) => {
                    const cfg = getCropConfig(type);
                    const locked = state.progress.unlockedZones < cfg.unlockZone;
                    return (
                      <button
                        key={type}
                        disabled={locked}
                        onClick={() => { setPanel("none"); handleBuySeed(type); }}
                        className={`poke-card bg-gradient-to-br from-emerald-500/40 to-green-700/30 p-2 text-center ${locked ? "opacity-40" : ""}`}
                      >
                        <p className="text-2xl">{cropIcon[type]}</p>
                        <p className="text-[11px] font-black text-white">{cropLabel[type]}</p>
                        <p className="text-[10px] text-amber-200">{cfg.seedCost}P</p>
                        {locked && <p className="text-[9px] text-rose-200">🔒 Zone {cfg.unlockZone}</p>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-white/10 pt-2">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-cyan-200">Consommables</p>
                  <button
                    onClick={() => { setPanel("none"); handleBuyEnergyPotion(); }}
                    disabled={state.progress.energy >= state.progress.energyMax}
                    className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/30 to-sky-700/30 p-3 text-left backdrop-blur-md active:scale-95 disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-cyan-100"><GameIcon name="potion" size={24} /></div>
                      <div>
                        <p className="text-sm font-black text-white">Potion d'énergie</p>
                        <p className="text-[10px] font-bold text-cyan-100">+{ENERGY_POTION_GAIN} énergie · 1 multiplication</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 px-2 py-0.5 text-xs font-black text-amber-100">
                      <GameIcon name="coin" size={12} />{ENERGY_POTION_COST}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {panel === "stats" && (
              <div className="space-y-3 text-sm text-white/90">
                <p className="text-base font-black shimmer-text">📊 Progression</p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                  <p className="font-black text-cyan-200">{nextUnlock?.title}</p>
                  <p className="text-white/80">{nextUnlock?.progressLabel}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                  <p className="font-black text-violet-200">Maîtrise : {masteryInfo.mastered}/{masteryInfo.total}</p>
                  <p className="text-white/80">Paires faibles : {masteryInfo.weak.length > 0 ? masteryInfo.weak.join(", ") : "—"}</p>
                </div>
                {evolutionInfo && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                    <p className="font-black text-fuchsia-200">Évolution</p>
                    <p>{evolutionInfo.requirements.filter((r) => r.done).length}/{evolutionInfo.requirements.length} · {evolutionInfo.requirements.map((r) => `${r.done ? "✓" : "·"} ${r.label}`).join(" | ")}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase text-cyan-200">Améliorer une stat (2 multiplications)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-black">
                    <button onClick={() => { setPanel("none"); handleUpgradeStat("attack"); }} className="rounded-xl bg-rose-500/30 px-2 py-1.5">💪 Force</button>
                    <button onClick={() => { setPanel("none"); handleUpgradeStat("speed"); }} className="rounded-xl bg-cyan-500/30 px-2 py-1.5">⚡ Vitesse</button>
                    <button onClick={() => { setPanel("none"); handleUpgradeStat("intelligence"); }} className="rounded-xl bg-violet-500/30 px-2 py-1.5">🧠 Intelligence</button>
                    <button onClick={() => { setPanel("none"); handleUpgradeStat("defense"); }} className="rounded-xl bg-emerald-500/30 px-2 py-1.5">🛡 Défense</button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Réinitialiser TOUTE la partie ? Cette action est irréversible.")) {
                      const fresh = resetState();
                      commit(fresh);
                      setPanel("none");
                      setMessage("Partie réinitialisée.");
                    }
                  }}
                  className="w-full rounded-xl border border-rose-300/40 bg-rose-500/20 px-2 py-2 text-xs font-black text-rose-100"
                >
                  ⚠ Réinitialiser la partie
                </button>
              </div>
            )}

            {panel === "team" && (
              <div className="space-y-2 text-sm text-white/90">
                <p className="text-base font-black shimmer-text">👥 Mon équipe</p>
                <p className="text-xs text-white/70">{state.creatures.length} créature(s) · {state.progress.unlockedCreatures} débloquée(s)</p>
                <div className="grid grid-cols-2 gap-2">
                  {state.creatures.map((c) => {
                    const active = c.id === state.progress.currentCreatureId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSwitch(c.id)}
                        className={`poke-card p-2 text-left ${active ? "bg-gradient-to-br from-violet-500/40 to-fuchsia-600/40 shadow-glow" : "bg-gradient-to-br from-white/10 to-white/5"}`}
                      >
                        <div className="flex items-center gap-2">
                          <TypeBadge type={c.type} size="xs" />
                          <span className="chip">Lv {c.level}</span>
                          {active && <span className="text-xs text-yellow-300">★</span>}
                        </div>
                        <p className="mt-1 text-sm font-black">{c.name}</p>
                        <p className="text-[10px] text-white/70">Forme {c.evolution_stage} · Table × {c.multiplication_table}</p>
                        <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] font-black">
                          <span className="rounded bg-rose-500/20 px-1 py-0.5 text-rose-100">{c.stats.attack}</span>
                          <span className="rounded bg-cyan-500/20 px-1 py-0.5 text-cyan-100">{c.stats.speed}</span>
                          <span className="rounded bg-violet-500/20 px-1 py-0.5 text-violet-100">{c.stats.intelligence}</span>
                          <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-emerald-100">{c.stats.defense}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/60">Une nouvelle créature est débloquée tous les 5 niveaux joueur.</p>
              </div>
            )}

            <button onClick={() => setPanel("none")} className="btn-secondary mt-3 w-full">Fermer</button>
          </div>
        </motion.section>
      )}

      {pending && (
        <QuestionGate
          open
          subtitle={pending.subtitle}
          questions={pending.questions}
          onAllAnswered={(results) => { const action = pending; setPending(null); action.run(results); }}
          onCancel={() => setPending(null)}
        />
      )}

      <EvolutionModal
        open={showEvolution}
        previous={evoPrev}
        current={evoCurrent}
        onClose={() => {
          setShowEvolution(false);
          setMood("happy");
          setReaction(getCreatureReaction(creature.type, "evolve"));
          window.setTimeout(() => setMood("idle"), 800);
        }}
      />

      {evolutionInfo && (
        <EvolutionPreviewPanel
          open={evoPreviewOpen}
          creature={creature}
          progress={evolutionInfo}
          onClose={() => setEvoPreviewOpen(false)}
          onEvolve={handleEvolveClick}
        />
      )}

      <CropsHelpPanel open={cropsHelp} unlockedZones={state.progress.unlockedZones} onClose={() => setCropsHelp(false)} />

      <RareMaterialPanel open={rareHelp} current={state.progress.rareMaterial} onClose={() => setRareHelp(false)} />

      <HelpPanel open={help} title="🌾 La Ferme" onClose={() => setHelp(false)}>
        <p>La ferme est ton QG. Tu peux y planter des cultures, nourrir ta créature, voir ses stats, et changer de partenaire.</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><b>🌱 Planter / 🌾 Récolter :</b> chaque action demande 1 multiplication. Bonne réponse = bonus de récolte.</li>
          <li><b>🍖 Nourrir :</b> augmente la faim et le bonheur de ta créature. Si la faim descend sous 30, elle perd de l'XP. Sous 15, elle peut perdre un niveau !</li>
          <li><b>👥 Équipe :</b> change de créature active (1 multiplication). Chaque créature est liée à une table.</li>
          <li><b>📊 Stats :</b> améliore Force/Vitesse/Intelligence/Défense (2 multiplications).</li>
          <li><b>🛒 Shop :</b> achète des graines pour planter (1 multiplication).</li>
        </ul>
        <p>💎 Le <b>matériau rare</b> (à côté des pièces) sert à faire évoluer ta créature.</p>
      </HelpPanel>

      <BottomGameNav active="farm" />
    </main>
  );
}
