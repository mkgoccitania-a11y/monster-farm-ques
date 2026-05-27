"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AnswerButtons from "@/components/AnswerButtons";
import BottomGameNav from "@/components/BottomGameNav";
import CreatureCard from "@/components/Creature";
import EvolutionModal from "@/components/EvolutionModal";
import GameIcon, { GameIconName } from "@/components/GameIcon";
import HelpPanel, { HelpButton } from "@/components/HelpPanel";
import PageLoader from "@/components/PageLoader";
import QuestionBox from "@/components/QuestionBox";
import QuestionGate from "@/components/QuestionGate";
import ResourceTopBar from "@/components/ResourceTopBar";
import RewardBurst from "@/components/RewardBurst";
import {
  applyTrainingStatGain,
  canSpendEnergy,
  getCurrentCreature,
  getEvolutionProgress,
  getMasteryOverview,
  progressQuests,
  resolveAnswer,
  spendEnergyForAction,
  triggerEvolution,
  buildQuestion
} from "@/lib/gameLogic";
import { getCreatureReaction } from "@/lib/creatureVisuals";
import { Creature, MultiplicationQuestion, TrainingFocus } from "@/lib/types";
import { useGameState } from "@/lib/useGameState";

const TOTAL_QUESTIONS = 5;
const TRAIN_COST = 2;

const focusOptions: Array<{ id: TrainingFocus; label: string; fantasy: string; stat: string; combatMove: string; icon: GameIconName; color: string }> = [
  { id: "strength",  label: "Force",         fantasy: "Drill marteau",  stat: "+Force",                  combatMove: "⚔️ Frappe plus forte",      icon: "strength",     color: "from-rose-500/40 to-red-700/30" },
  { id: "reflex",    label: "Réflexe",       fantasy: "Esquive éclair", stat: "+Vitesse",                combatMove: "💨 Esquive plus efficace",   icon: "speed",        color: "from-cyan-500/40 to-sky-700/30" },
  { id: "focus",     label: "Concentration", fantasy: "Rayon mental",   stat: "+Intelligence",           combatMove: "✨ Sort plus puissant",      icon: "intelligence", color: "from-violet-500/40 to-fuchsia-700/30" },
  { id: "endurance", label: "Endurance",     fantasy: "Camp bouclier",  stat: "+Défense + Énergie max",  combatMove: "🛡 Garde plus solide",       icon: "defense",      color: "from-emerald-500/40 to-green-700/30" }
];

type QuestionResult = { key: string; isCorrect: boolean; responseMs: number };

export default function TrainPage() {
  const { state, creature, commit, hydrated } = useGameState();

  const [active, setActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [focus, setFocus] = useState<TrainingFocus>("strength");
  const [question, setQuestion] = useState<MultiplicationQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [message, setMessage] = useState("Choisis un atelier pour booster une stat.");
  const [summary, setSummary] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  const [reaction, setReaction] = useState("On s'entraîne !");
  const [help, setHelp] = useState(false);
  const [burst, setBurst] = useState<{ show: boolean; text: string; color: "gold" | "green" | "blue" }>({ show: false, text: "", color: "blue" });

  const [startGate, setStartGate] = useState<MultiplicationQuestion[] | null>(null);
  const [evolutionGate, setEvolutionGate] = useState<MultiplicationQuestion[] | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evoPrev, setEvoPrev] = useState<Creature | null>(null);
  const [evoCurrent, setEvoCurrent] = useState<Creature | null>(null);

  useEffect(() => {
    if (!state || !active || question || index >= TOTAL_QUESTIONS) return;
    const next = buildQuestion(state, undefined, recentKeys);
    if (!next) return;
    setQuestion(next);
    setSelected(null);
    setQuestionStartedAt(Date.now());
  }, [state, active, question, index, recentKeys]);

  const accuracy = useMemo(() => {
    if (index === 0) return 0;
    return Math.round((correctCount / index) * 100);
  }, [correctCount, index]);

  const mastery = useMemo(() => (state ? getMasteryOverview(state) : { mastered: 0, total: 0, weak: [] }), [state]);
  const evolutionInfo = useMemo(() => (state && creature ? getEvolutionProgress(state, creature) : null), [state, creature]);

  if (!hydrated || !state || !creature) {
    return <PageLoader label="Chargement du camp..." />;
  }

  const currentTheme = focusOptions.find((f) => f.id === focus) ?? focusOptions[0];

  const popBurst = (text: string) => {
    setBurst({ show: true, text, color: "blue" });
    window.setTimeout(() => setBurst({ show: false, text: "", color: "blue" }), 1100);
  };

  const requestStartTraining = () => {
    if (!canSpendEnergy(state, TRAIN_COST)) {
      setMessage(`Il faut ${TRAIN_COST} énergie pour cet atelier.`);
      setReaction("Fatigué...");
      return;
    }
    const q = buildQuestion(state, undefined, recentKeys);
    setStartGate([q]);
  };

  const beginTraining = () => {
    const charged = spendEnergyForAction(state, TRAIN_COST, 2);
    commit(charged);
    setActive(true); setShowSummary(false); setIndex(0); setCombo(0); setBestCombo(0); setCorrectCount(0); setSessionXp(0);
    setQuestion(null); setSelected(null); setSummary(""); setRecentKeys([]);
    setReaction(getCreatureReaction(creature.type, "train"));
    setMessage(`${currentTheme.fantasy} lancé.`);
  };

  const onStartGateResolved = (results: QuestionResult[]) => {
    setStartGate(null);
    let next = state;
    let allCorrect = true;
    results.forEach((r) => {
      const solved = resolveAnswer(next, r.key, r.isCorrect, 0.6, r.responseMs);
      next = solved.nextState;
      if (!r.isCorrect) allCorrect = false;
    });
    commit(next);
    if (!allCorrect) { setMessage("Réponse fausse, atelier annulé."); setReaction("Pas prêt..."); return; }
    beginTraining();
  };

  const finishTraining = (baseState: typeof state) => {
    const before = getCurrentCreature(baseState);
    const points = Math.max(1, Math.floor(correctCount / 2) + (bestCombo >= 3 ? 1 : 0));
    let upgraded = applyTrainingStatGain(baseState, focus, points);
    // Progrès quête "combo en atelier"
    upgraded = progressQuests(upgraded, { kind: "combo", value: bestCombo });
    upgraded = {
      ...upgraded,
      progress: { ...upgraded.progress, bestComboTrain: Math.max(upgraded.progress.bestComboTrain ?? 0, bestCombo) }
    };
    commit(upgraded);
    const current = getCurrentCreature(upgraded);
    setSummary(`+${points} points ${focus}. F${current.stats.attack} V${current.stats.speed} I${current.stats.intelligence} D${current.stats.defense}.`);
    const total = (current.stats.attack - before.stats.attack) + (current.stats.speed - before.stats.speed) + (current.stats.intelligence - before.stats.intelligence) + (current.stats.defense - before.stats.defense);
    popBurst(`Stats +${total}`);
    setReaction(getCreatureReaction(creature.type, "train"));
    setMessage("Atelier terminé.");
    setActive(false); setShowSummary(true);
  };

  const onSelect = (answer: number) => {
    if (!question || selected !== null) return;
    setSelected(answer);
    const isCorrect = answer === question.correct;
    const responseMs = Date.now() - questionStartedAt;
    const resolved = resolveAnswer(state, question.key, isCorrect, 1 + combo * 0.1, responseMs);
    commit(resolved.nextState);
    setSessionXp((v) => v + resolved.xpGain);
    setIndex((v) => v + 1);
    setRecentKeys((v) => [question.key, ...v].slice(0, 5));
    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((v) => Math.max(v, nextCombo));
      setCorrectCount((v) => v + 1);
      setReaction("Parfait !");
      if (nextCombo >= 3) popBurst(`Combo ×${nextCombo}`);
      setMessage(nextCombo >= 3 ? `Combo ×${nextCombo} !` : "Bonne réponse.");
    } else {
      setCombo(0); setReaction("Encore !");
      setMessage(`Faux. ${question.left} × ${question.right} = ${question.correct}`);
    }
    window.setTimeout(() => {
      setQuestion(null); setSelected(null);
      if (index + 1 >= TOTAL_QUESTIONS) finishTraining(resolved.nextState);
    }, 520);
  };

  const handleEvolveClick = () => {
    if (!evolutionInfo?.ready) return;
    const q = buildQuestion(state, undefined, recentKeys);
    setEvolutionGate([q]);
  };

  const resolveEvolutionGate = (results: QuestionResult[]) => {
    setEvolutionGate(null);
    let next = state;
    let allCorrect = true;
    results.forEach((r) => {
      const solved = resolveAnswer(next, r.key, r.isCorrect, 1, r.responseMs);
      next = solved.nextState;
      if (!r.isCorrect) allCorrect = false;
    });
    if (!allCorrect) { commit(next); setMessage("Réponse fausse, évolution échouée."); return; }
    const evolved = triggerEvolution(next);
    if (!evolved.ok) { commit(next); setMessage(evolved.reason ?? "Évolution impossible."); return; }
    const newCreature = evolved.nextState.creatures.find((c) => c.id === creature.id) ?? creature;
    setEvoPrev({ ...creature }); setEvoCurrent({ ...newCreature }); setShowEvolution(true);
    commit(evolved.nextState);
  };

  return (
    <main className="relative space-y-3 pb-24">
      <RewardBurst show={burst.show} text={burst.text} color={burst.color} />

      <ResourceTopBar
        level={state.progress.level}
        title="Camp d'entraînement"
        coins={state.progress.coins}
        happiness={creature.happiness}
        energy={state.progress.energy}
        energyMax={state.progress.energyMax}
        rare={state.progress.rareMaterial}
      />

      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">💪 Entraînement</p>
        <HelpButton onClick={() => setHelp(true)} />
      </div>

      {evolutionInfo?.ready && !active && (
        <button onClick={handleEvolveClick} className="w-full rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/40 to-fuchsia-600/40 px-3 py-2 text-sm font-black text-white shadow-glow backdrop-blur-md">
          ✨ Ta créature peut évoluer ! (1 multiplication)
        </button>
      )}

      <section className="poke-card bg-gradient-to-br from-indigo-500/25 to-slate-900/40 p-3">
        <CreatureCard creature={creature} mood={active ? "happy" : "idle"} reaction={active ? reaction : null} state={state} />
        <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] font-black">
          <div className="flex items-center justify-center gap-1 rounded-lg bg-rose-500/25 px-2 py-1 text-rose-100"><GameIcon name="strength" size={12} />{creature.stats.attack}</div>
          <div className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500/25 px-2 py-1 text-cyan-100"><GameIcon name="speed" size={12} />{creature.stats.speed}</div>
          <div className="flex items-center justify-center gap-1 rounded-lg bg-violet-500/25 px-2 py-1 text-violet-100"><GameIcon name="intelligence" size={12} />{creature.stats.intelligence}</div>
          <div className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/25 px-2 py-1 text-emerald-100"><GameIcon name="defense" size={12} />{creature.stats.defense}</div>
        </div>
      </section>

      {!active && (
        <section className="grid grid-cols-2 gap-2">
          {focusOptions.map((opt) => {
            const selected = focus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFocus(opt.id)}
                className={`poke-card border bg-gradient-to-br p-2.5 text-left ${opt.color} ${selected ? "ring-2 ring-cyan-300/70 shadow-glow" : ""}`}
              >
                <div className="text-white"><GameIcon name={opt.icon} size={22} /></div>
                <p className="mt-1 text-sm font-black text-white">{opt.label}</p>
                <p className="text-[10px] font-bold text-white/80">{opt.fantasy}</p>
                <p className="text-[10px] font-bold text-cyan-200">{opt.stat}</p>
                <p className="mt-1 rounded bg-black/30 px-1 py-0.5 text-[9px] font-black text-amber-100">{opt.combatMove}</p>
              </button>
            );
          })}
        </section>
      )}

      <section className="glass grid grid-cols-4 gap-2 p-2 text-center text-[11px] font-black text-white/90">
        <div className="flex items-center justify-center gap-1"><GameIcon name="energy" size={12} />{state.progress.energy}/{state.progress.energyMax}</div>
        <div>Série {Math.min(index + (active ? 1 : 0), TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</div>
        <div>Combo ×{combo}</div>
        <div>Best ×{bestCombo}</div>
      </section>

      <section className="glass p-3 text-xs">
        <p className="font-black text-cyan-200">Atelier {currentTheme.label} — {currentTheme.fantasy}</p>
        <p className="mt-1 text-white/80">Maîtrise {mastery.mastered}/{mastery.total} · Faibles : {mastery.weak.length > 0 ? mastery.weak.join(", ") : "—"}</p>
        {/* Effets actuels de la stat ciblée */}
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/85">
          {focus === "strength" && (
            <p>💪 Force actuelle : <b>{creature.stats.attack}</b> → Frappe inflige ~<b>{Math.round(creature.stats.attack * 1.3)}</b> dégâts (avant défense).</p>
          )}
          {focus === "reflex" && (
            <p>⚡ Vitesse actuelle : <b>{creature.stats.speed}</b> → Esquive joue toujours en premier, <b>{Math.round(30 + creature.stats.speed * 0.5)}</b> % de chance d'éviter un coup.</p>
          )}
          {focus === "focus" && (
            <>
              <p>🧠 Intelligence actuelle : <b>{creature.stats.intelligence}</b></p>
              <p className="mt-0.5">• Sort {creature.specialUnlocked ? <span className="text-emerald-200">débloqué ✓</span> : <span className="text-rose-200">verrouillé · atteint INT 15</span>} — inflige ~<b>{Math.round(creature.stats.intelligence * (creature.specialUnlocked ? 1.7 : 1.5))}</b> dégâts (ignore 50 % DEF).</p>
              <p className="mt-0.5">• Bonus XP par bonne réponse : <b>+{Math.max(0, creature.stats.intelligence - 10)} %</b></p>
            </>
          )}
          {focus === "endurance" && (
            <p>🛡 Défense actuelle : <b>{creature.stats.defense}</b> · Énergie max : <b>{state.progress.energyMax}</b> → Garde divise les dégâts par ~2,5 et soigne <b>{Math.round(creature.stats.defense * 0.4)}</b> PV.</p>
          )}
        </div>
      </section>

      {!active && (
        <button onClick={requestStartTraining} className="btn-primary w-full">
          Lancer l'atelier (−{TRAIN_COST} énergie · 1 multiplication pour engager)
        </button>
      )}

      {active && question && (
        <motion.section className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <QuestionBox question={question} subtitle={`${currentTheme.label} en cours`} />
          <AnswerButtons answers={question.answers} selected={selected} correctAnswer={selected !== null ? question.correct : undefined} disabled={selected !== null} onSelect={onSelect} />
        </motion.section>
      )}

      {showSummary && (
        <motion.section className="poke-card bg-gradient-to-br from-violet-500/30 to-fuchsia-700/30 p-4 text-center" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-2xl font-black shimmer-text">Atelier terminé</h2>
          <p className="mt-1 text-sm font-bold text-white/85">Précision {accuracy}% · XP +{sessionXp} · Combo max ×{bestCombo}</p>
          <p className="text-xs text-white/75">{summary}</p>
          <button onClick={requestStartTraining} className="btn-primary mt-3 w-full">Rejouer l'atelier</button>
        </motion.section>
      )}

      <Link href="/battle" className="btn-secondary block text-center">⚔️ Aller au duel</Link>

      {startGate && (
        <QuestionGate open subtitle="Engager l'atelier" questions={startGate} onAllAnswered={onStartGateResolved} onCancel={() => setStartGate(null)} />
      )}

      {evolutionGate && (
        <QuestionGate open subtitle="Évolution" questions={evolutionGate} onAllAnswered={resolveEvolutionGate} onCancel={() => setEvolutionGate(null)} />
      )}

      <EvolutionModal open={showEvolution} previous={evoPrev} current={evoCurrent} onClose={() => setShowEvolution(false)} />

      <HelpPanel open={help} title="💪 Entraînement" onClose={() => setHelp(false)}>
        <p>Chaque <b>atelier</b> améliore une <b>stat</b> qui sert dans plusieurs aspects du jeu.</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Force</b> → ATK → améliore la <b>Frappe</b> en combat (dégâts directs).</li>
          <li><b>Réflexe</b> → VITESSE → améliore l'<b>Esquive</b> (priorité, +crit, +chance d'éviter un coup).</li>
          <li>
            <b>Concentration</b> → INTELLIGENCE :
            <ul className="ml-4 mt-1 list-[circle] space-y-0.5 text-[11px]">
              <li>Améliore le <b>Sort</b> en combat (dégâts qui ignorent 50 % de la défense)</li>
              <li>Débloque le Sort à <b>INT ≥ 15</b> (~3 ateliers Concentration)</li>
              <li>Augmente l'<b>XP gagné par bonne réponse</b> (+1 % par point au-dessus de 10)</li>
            </ul>
          </li>
          <li><b>Endurance</b> → DÉFENSE + énergie max → améliore la <b>Garde</b> (réduit dégâts, soigne).</li>
        </ul>
        <p>Une session = 5 questions. Plus tu fais de bonnes réponses, plus la stat monte.</p>
        <p>Un combo de 3 bonnes réponses donne un point bonus.</p>
        <p className="rounded-lg bg-cyan-500/20 p-2 text-cyan-100">💡 Tu veux frapper plus fort ? <b>Force</b>. Esquiver ? <b>Réflexe</b>. Apprendre plus vite + sort puissant ? <b>Concentration</b>. Encaisser ? <b>Endurance</b>.</p>
      </HelpPanel>

      <BottomGameNav active="train" />
    </main>
  );
}
