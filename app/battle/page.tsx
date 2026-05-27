"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BottomGameNav from "@/components/BottomGameNav";
import CreatureCard from "@/components/Creature";
import EvolutionModal from "@/components/EvolutionModal";
import GameIcon, { GameIconName } from "@/components/GameIcon";
import HelpPanel, { HelpButton } from "@/components/HelpPanel";
import PageLoader from "@/components/PageLoader";
import ProgressBar from "@/components/ProgressBar";
import QuestionGate from "@/components/QuestionGate";
import RareMaterialPanel from "@/components/RareMaterialPanel";
import ResourceTopBar from "@/components/ResourceTopBar";
import RewardBurst from "@/components/RewardBurst";
import TypeBadge from "@/components/TypeBadge";
import TypeMatchupCard from "@/components/TypeMatchupCard";
import { getSpeciesSprite, SPECIES_META } from "@/lib/creatureVisuals";
import {
  applyBattleLossPenalty,
  applyBattleWinRewards,
  buildQuestion,
  canSpendEnergy,
  createEnemy,
  getBattlePlayerHp,
  getCurrentCreature,
  getEvolutionProgress,
  getTypeMatchup,
  getWinStreakMultiplier,
  getZoneName,
  isAlreadyCaptured,
  isBossAvailable,
  progressQuests,
  recordCapture,
  resolveAnswer,
  resolveBattleTurn,
  spendEnergyForAction,
  triggerEvolution,
  useBattleFoodItem
} from "@/lib/gameLogic";
import { getCreatureReaction } from "@/lib/creatureVisuals";
import { BattleAction, BattleTurnResult, Creature, Enemy, MultiplicationQuestion } from "@/lib/types";
import { useGameState } from "@/lib/useGameState";

const BATTLE_COST = 3;

const actionLabel: Record<BattleAction, string> = {
  strike: "Frappe",
  dodge:  "Esquive",
  spell:  "Sort",
  guard:  "Garde",
  potion: "Potion"
};

const actionIcon: Record<BattleAction, GameIconName> = {
  strike: "attack",
  dodge:  "speed",
  spell:  "special",
  guard:  "shield",
  potion: "potion"
};

const actionStat: Record<BattleAction, string> = {
  strike: "Force",
  dodge:  "Vitesse",
  spell:  "Concentration",
  guard:  "Endurance",
  potion: "—"
};

const actionDesc: Record<BattleAction, string> = {
  strike: "Coup direct · 1 multiplication",
  dodge:  "Frappe rapide + chance d'éviter · 1 multiplication",
  spell:  "Dégâts magiques perçants · 2 multiplications",
  guard:  "Réduit -60% dégâts + soin · 1 multiplication",
  potion: "Mange une ration et soigne"
};

const actionGradient: Record<BattleAction, string> = {
  strike: "from-rose-500/40 to-red-700/40 border-rose-300/40",
  dodge:  "from-cyan-500/40 to-sky-700/40 border-cyan-300/40",
  spell:  "from-violet-500/40 to-fuchsia-700/40 border-violet-300/40",
  guard:  "from-emerald-500/40 to-green-700/40 border-emerald-300/40",
  potion: "from-amber-400/40 to-orange-600/40 border-amber-300/40"
};

type QuestionResult = { key: string; isCorrect: boolean; responseMs: number };

export default function BattlePage() {
  const { state, creature, commit, hydrated } = useGameState();

  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(1);
  const [pendingQuestions, setPendingQuestions] = useState<MultiplicationQuestion[] | null>(null);
  const [pendingAction, setPendingAction] = useState<BattleAction | null>(null);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState("Touche « Lancer un duel » pour entrer dans l'arène.");
  const [status, setStatus] = useState<"idle" | "fight" | "won" | "lost">("idle");
  const [guardActive, setGuardActive] = useState(false);
  const [lastTurn, setLastTurn] = useState<BattleTurnResult | null>(null);
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  const [reaction, setReaction] = useState("Prêt à combattre !");
  const [enemyState, setEnemyState] = useState<"idle" | "hit" | "ko">("idle");
  const [help, setHelp] = useState(false);
  const [burst, setBurst] = useState<{ show: boolean; text: string; color: "gold" | "green" | "blue" }>({ show: false, text: "", color: "gold" });
  const [evoPrev, setEvoPrev] = useState<Creature | null>(null);
  const [evoCurrent, setEvoCurrent] = useState<Creature | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionGate, setEvolutionGate] = useState<MultiplicationQuestion[] | null>(null);
  const [rareHelp, setRareHelp] = useState(false);
  const [captureGate, setCaptureGate] = useState<MultiplicationQuestion[] | null>(null);
  const [captureDone, setCaptureDone] = useState(false);
  // Aperçu de l'ennemi (avant d'engager le duel) — sert à afficher la matchup de types
  const [scoutedEnemy, setScoutedEnemy] = useState<Enemy | null>(null);

  useEffect(() => {
    if (!state || !creature || status !== "idle" || enemy) return;
    const hp = getBattlePlayerHp(creature);
    setPlayerMaxHp(hp);
    setPlayerHp(hp);
  }, [state, creature, status, enemy]);

  // Repérage automatique d'un ennemi quand on est en idle
  useEffect(() => {
    if (!state || !creature || status !== "idle" || enemy || scoutedEnemy) return;
    setScoutedEnemy(createEnemy(state));
  }, [state, creature, status, enemy, scoutedEnemy]);

  const evolutionInfo = useMemo(() => (state && creature ? getEvolutionProgress(state, creature) : null), [state, creature]);
  const bossAvailable = useMemo(() => (state ? isBossAvailable(state) : false), [state]);
  const zoneVictories = state?.progress.zoneVictories?.[state?.progress.unlockedZones ?? 1] ?? 0;

  if (!hydrated || !state || !creature) {
    return <PageLoader label="Chargement de l'arène..." />;
  }

  const popBurst = (text: string, color: "gold" | "green" | "blue") => {
    setBurst({ show: true, text, color });
    window.setTimeout(() => setBurst({ show: false, text: "", color }), 1100);
  };

  const startBattle = () => {
    if (!canSpendEnergy(state, BATTLE_COST)) {
      setMessage(`Il faut ${BATTLE_COST} énergie.`);
      setReaction("Trop fatigué...");
      return;
    }
    const charged = spendEnergyForAction(state, BATTLE_COST, 4);
    // On engage l'ennemi déjà repéré ; sinon on en spawne un nouveau (cas limite)
    const spawned = scoutedEnemy ?? createEnemy(charged);
    commit(charged);
    const hp = getBattlePlayerHp(getCurrentCreature(charged));
    setEnemy(spawned);
    setScoutedEnemy(null);
    setPlayerMaxHp(hp);
    setPlayerHp(hp);
    setStatus("fight");
    setCombo(0);
    setGuardActive(false);
    setLastTurn(null);
    setRecentKeys([]);
    setReaction("En garde !");
    setEnemyState("idle");
    setMessage(`Un ${spawned.name} sauvage apparaît en ${getZoneName(spawned.zone)} !`);
  };

  const rerollScout = () => {
    if (status !== "idle") return;
    setScoutedEnemy(createEnemy(state));
    setMessage("Nouvel ennemi repéré.");
  };

  const chooseAction = (action: BattleAction) => {
    if (!enemy || status !== "fight") return;
    if (action === "spell" && !creature.specialUnlocked) {
      setMessage("Sort verrouillé. Atteins la Forme 2 pour le débloquer.");
      setReaction("Pas encore...");
      return;
    }
    if (action === "potion" && state.progress.food <= 0) {
      setMessage("Plus de nourriture. Récolte d'abord à la ferme.");
      return;
    }
    const count = action === "spell" ? 2 : 1;
    const questions: MultiplicationQuestion[] = [];
    const recents = [...recentKeys];
    for (let i = 0; i < count; i += 1) {
      const q = buildQuestion(state, enemy.table_focus, recents, "extended");
      questions.push(q);
      recents.push(q.key);
    }
    setPendingAction(action);
    setPendingQuestions(questions);
    setMessage(`${actionLabel[action]} — ${actionDesc[action]}`);
  };

  const resolveAction = (results: QuestionResult[]) => {
    if (!enemy || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setPendingQuestions(null);

    let postState = state;
    let allCorrect = true;
    let totalResponseMs = 0;

    results.forEach((r) => {
      const solved = resolveAnswer(postState, r.key, r.isCorrect, action === "spell" ? 1.2 : 0.95, r.responseMs);
      postState = solved.nextState;
      if (!r.isCorrect) allCorrect = false;
      totalResponseMs += r.responseMs;
    });

    let preTurnPlayerHp = playerHp;
    let itemNote = "";

    if (action === "potion") {
      const item = useBattleFoodItem(postState, allCorrect);
      if (item.ok) {
        postState = item.nextState;
        preTurnPlayerHp = Math.min(playerMaxHp, preTurnPlayerHp + item.heal);
        itemNote = `Snack +${item.heal} PV. `;
        popBurst(`+${item.heal} PV`, "green");
      } else {
        itemNote = "Plus de nourriture. ";
      }
    }

    const currentCreature = getCurrentCreature(postState);

    const turn = resolveBattleTurn({
      action,
      currentEnemyHp: enemy.hp,
      currentPlayerHp: preTurnPlayerHp,
      isCorrect: allCorrect,
      answerTimeMs: totalResponseMs / Math.max(1, results.length),
      combo,
      creature: currentCreature,
      enemy,
      guardActive,
      playerEnergy: postState.progress.energy,
      playerEnergyMax: postState.progress.energyMax
    });

    if (turn.won) {
      postState = applyBattleWinRewards(postState, enemy);
    }

    commit(postState);

    setEnemy((prev) => (prev ? { ...prev, hp: turn.enemyHp } : prev));
    setPlayerHp(turn.playerHp);
    setLastTurn(turn);
    setCombo(allCorrect ? combo + 1 : 0);
    setGuardActive(turn.guardApplied);
    setRecentKeys((prev) => [...results.map((r) => r.key), ...prev].slice(0, 5));

    // Animation ennemi
    if (turn.damageToEnemy > 0) setEnemyState("hit");
    if (turn.won) setEnemyState("ko");
    setTimeout(() => setEnemyState("idle"), 450);

    if (turn.skipped) {
      popBurst("Trop triste...", "blue");
      setReaction("Bouge plus...");
    } else if (turn.critical) {
      popBurst("CRITIQUE !", "gold");
      setReaction("Impact max !");
    } else if (allCorrect) {
      setReaction("Bien joué !");
    } else {
      setReaction("Aïe...");
    }

    if (turn.won) {
      setStatus("won");
      setReaction(getCreatureReaction(creature.type, "battleWin"));
      popBurst("VICTOIRE !", "gold");
      // 2e popBurst après 600ms pour le gain de bonheur
      const happinessGain = enemy.rank === "boss" ? 12 : 4;
      window.setTimeout(() => popBurst(`+${happinessGain} 💖`, "green"), 700);
      setMessage(`${itemNote}Duel gagné ! +${happinessGain} bonheur. Récompenses obtenues.`);
    } else if (turn.lost) {
      setStatus("lost");
      setReaction(getCreatureReaction(creature.type, "battleLose"));
      const lossResult = applyBattleLossPenalty(postState, enemy.rank === "boss");
      commit(lossResult.state);
      popBurst(`−${lossResult.happinessLost} 💖`, "blue");
      setMessage(`${itemNote}Défaite. -${lossResult.happinessLost} bonheur. Retourne à la ferme pour récupérer.`);
    } else {
      setMessage(`${itemNote}${turn.enemyAction}. Tu infliges ${turn.damageToEnemy}, tu subis ${turn.damageToPlayer}.`);
    }
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
    if (!allCorrect) {
      commit(next);
      setMessage("Réponse fausse, évolution échouée.");
      return;
    }
    const evolved = triggerEvolution(next);
    if (!evolved.ok) {
      commit(next);
      setMessage(evolved.reason ?? "Évolution impossible.");
      return;
    }
    const newCreature = evolved.nextState.creatures.find((c) => c.id === creature.id) ?? creature;
    setEvoPrev({ ...creature });
    setEvoCurrent({ ...newCreature });
    setShowEvolution(true);
    commit(evolved.nextState);
    popBurst("Évolution !", "gold");
  };

  const handleCaptureClick = () => {
    if (!enemy || captureDone) return;
    // 3 multiplications consécutives pour capturer
    const questions: MultiplicationQuestion[] = [];
    const recents: string[] = [...recentKeys];
    for (let i = 0; i < 3; i += 1) {
      const q = buildQuestion(state, enemy.table_focus, recents);
      questions.push(q);
      recents.push(q.key);
    }
    setCaptureGate(questions);
  };

  const resolveCaptureGate = (results: QuestionResult[]) => {
    setCaptureGate(null);
    if (!enemy) return;
    let next = state;
    let allCorrect = true;
    results.forEach((r) => {
      const solved = resolveAnswer(next, r.key, r.isCorrect, 0.8, r.responseMs);
      next = solved.nextState;
      if (!r.isCorrect) allCorrect = false;
    });
    if (!allCorrect) {
      commit(next);
      setMessage("Capture ratée ! L'ennemi s'enfuit.");
      setCaptureDone(true);
      return;
    }
    // Réussite : enregistre la capture (passe l'ennemi complet pour stocker stage + stats)
    const rec = recordCapture(next, enemy);
    let after = rec.state;
    after = progressQuests(after, { kind: "capture" });
    commit(after);
    if (rec.firstCapture && rec.addedToTeam) {
      popBurst("Nouveau partenaire !", "gold");
      setMessage(`🎉 ${SPECIES_META[enemy.species].stageNames[0]} rejoint ton équipe ! Va dans la Ferme → Équipe pour le définir comme actif.`);
    } else if (rec.stageUpgraded) {
      popBurst(`Stage ${rec.previousBestStage} → ${enemy.stage}`, "gold");
      setMessage(`✨ Spécimen plus fort capturé ! Codex mis à jour : stage ${rec.previousBestStage} → stage ${enemy.stage}.`);
    } else if (rec.firstCapture) {
      popBurst("Nouvelle créature !", "gold");
      setMessage(`🎉 ${enemy.name} ajouté au Codex !`);
    } else {
      popBurst("Capturé !", "gold");
      setMessage(`${enemy.name} capturé (+1 essence).`);
    }
    setCaptureDone(true);
  };

  const resetBattle = () => {
    setEnemy(null);
    setScoutedEnemy(null); // force un nouveau repérage via le useEffect
    setStatus("idle");
    setPendingQuestions(null);
    setPendingAction(null);
    setCombo(0);
    setGuardActive(false);
    setLastTurn(null);
    setRecentKeys([]);
    setCaptureDone(false);
    setReaction("Prêt à combattre !");
    setMessage("Lance une exploration pour trouver un duel.");
  };

  const winStreak = state.progress.winStreak ?? 0;
  const winStreakMul = getWinStreakMultiplier(winStreak);

  return (
    <main className="relative space-y-3 pb-28">
      <RewardBurst show={burst.show} text={burst.text} color={burst.color} />

      <ResourceTopBar
        level={state.progress.level}
        title="Arène"
        coins={state.progress.coins}
        happiness={creature.happiness}
        energy={state.progress.energy}
        energyMax={state.progress.energyMax}
        rare={state.progress.rareMaterial}
        onRareClick={() => setRareHelp(true)}
      />

      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">⚔️ Combat</p>
        <HelpButton onClick={() => setHelp(true)} />
      </div>

      {evolutionInfo?.ready && status === "idle" && (
        <button
          onClick={handleEvolveClick}
          className="w-full rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/40 to-fuchsia-600/40 px-3 py-2 text-sm font-black text-white shadow-glow backdrop-blur-md"
        >
          ✨ Ta créature peut évoluer ! (1 multiplication)
        </button>
      )}

      {bossAvailable && status === "idle" && (
        <motion.div
          className="rounded-2xl border border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-600/40 to-rose-700/30 p-3 shadow-glow backdrop-blur-md"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <p className="text-sm font-black text-white">👑 Un BOSS de zone t'attend !</p>
          <p className="text-[11px] font-bold text-white/80">Vainquez-le pour débloquer la zone suivante. Gros loot garanti.</p>
        </motion.div>
      )}

      {!bossAvailable && status === "idle" && state.progress.unlockedZones < 4 && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-2 text-center text-[11px] font-black text-white/70 backdrop-blur-md">
          Encore {Math.max(0, 5 - zoneVictories)} victoire(s) avant le boss de zone
        </div>
      )}

      {/* Arène */}
      <section className="poke-card relative overflow-hidden bg-gradient-to-b from-slate-900/40 via-indigo-900/30 to-slate-900/60 p-3">
        <div className="absolute inset-0 -z-10 opacity-50" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.2), transparent 70%)" }} />

        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="chip">Combo × {combo}</span>
          {winStreak > 0 && (
            <span className={`chip inline-flex items-center gap-1 ${winStreakMul > 1 ? "border-amber-300/50 bg-amber-500/25 text-amber-100" : ""}`}>
              <GameIcon name="trophy" size={12} />
              {winStreak} victoires{winStreakMul > 1 ? ` · ×${winStreakMul} loot` : ""}
            </span>
          )}
          {(state.progress.bestWinStreak ?? 0) > 0 && (
            <span className="chip inline-flex items-center gap-1 text-violet-200">
              <GameIcon name="star" size={11} />
              Record {state.progress.bestWinStreak}
            </span>
          )}
          <span className="chip">{enemy ? getZoneName(enemy.zone) : "—"}</span>
          {guardActive && <span className="chip text-sky-200">🛡 Défense</span>}
        </div>

        {/* Ennemi en haut */}
        <div className={`mt-3 rounded-2xl border p-3 backdrop-blur-md ${enemy?.rank === "boss" ? "border-fuchsia-300/60 bg-fuchsia-900/40 shadow-glow" : enemy?.rank === "elite" ? "border-amber-300/60 bg-amber-900/30" : "border-white/15 bg-black/30"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-white/70">Ennemi</p>
              <div className="flex items-center gap-1">
                <p className="text-lg font-black text-white">{enemy?.name ?? "—"}</p>
                {enemy?.rank === "boss" && <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white"><GameIcon name="boss" size={12} /> Boss</span>}
                {enemy?.rank === "elite" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white"><GameIcon name="elite" size={12} /> Élite</span>}
              </div>
              {enemy && (
                <div className="mt-0.5 flex items-center gap-1">
                  <TypeBadge type={enemy.type} size="xs" />
                  <span className="chip">× {enemy.table_focus}</span>
                  <span className="chip">Diff {enemy.difficulty}</span>
                </div>
              )}
            </div>
            <div className={`relative ${enemy?.rank === "boss" ? "h-36 w-36" : "h-32 w-32"} overflow-hidden rounded-2xl border border-white/15 bg-black/30`}>
              {enemy ? (
                <motion.div
                  animate={
                    enemyState === "hit"
                      ? { x: [0, -8, 8, -6, 6, 0], rotate: [0, -2, 2, 0] }
                      : enemyState === "ko"
                      ? { rotate: 90, opacity: 0.4, y: 18, scale: 0.9 }
                      : { y: [0, -4, 0] }
                  }
                  transition={{ duration: enemyState === "idle" ? 2.6 : 0.5, repeat: enemyState === "idle" ? Infinity : 0, ease: "easeInOut" }}
                  className="h-full w-full"
                >
                  <img
                    src={getSpeciesSprite(enemy.species, enemy.stage)}
                    alt={enemy.name}
                    className="h-full w-full object-cover"
                    style={{
                      // Légère teinte selon le tempérament pour différencier
                      filter:
                        enemy.temperament === "fierce" ? "saturate(1.3) hue-rotate(-10deg)" :
                        enemy.temperament === "tanky"  ? "saturate(0.9) brightness(0.95)" :
                        enemy.temperament === "swift"  ? "saturate(1.15) brightness(1.05)" :
                        enemy.temperament === "tricky" ? "saturate(1.1) hue-rotate(10deg)" :
                        "none"
                    }}
                    draggable={false}
                  />
                  {/* Halo coloré selon rang */}
                  {enemy.rank !== "common" && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: enemy.rank === "boss"
                          ? "inset 0 0 30px rgba(244,114,182,0.6)"
                          : "inset 0 0 20px rgba(251,191,36,0.45)"
                      }}
                    />
                  )}
                </motion.div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">?</div>
              )}
            </div>
          </div>
          <div className="mt-2"><ProgressBar label="PV ennemi" value={enemy?.hp ?? 0} max={enemy?.maxHp ?? 1} colorClass="bg-gradient-to-r from-rose-500 to-red-600" /></div>
        </div>

        {/* Allié en bas */}
        <div className="mt-3 rounded-2xl border border-white/15 bg-black/30 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex shrink-0 items-center justify-center">
              <CreatureCard creature={creature} mood={status === "lost" ? "oops" : status === "won" ? "happy" : "idle"} reaction={reaction !== "Prêt à combattre !" ? reaction : null} state={state} size="sm" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-wide text-white/70">Allié</p>
              <p className="text-lg font-black text-white">{creature.name}</p>
              <div className="mt-0.5 flex items-center justify-end gap-1">
                <TypeBadge type={creature.type} size="xs" />
                <span className="chip">Lv {creature.level}</span>
              </div>
            </div>
          </div>
          <div className="mt-2"><ProgressBar label="PV allié" value={playerHp} max={playerMaxHp} colorClass="bg-gradient-to-r from-emerald-400 to-green-600" /></div>
        </div>
      </section>

      {/* Repérage : aperçu avant duel + matchup de types */}
      {status === "idle" && scoutedEnemy && (
        <section className="space-y-2">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900/60 to-indigo-950/60 p-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">🔭 Repérage</p>
                <p className="text-base font-black text-white">{scoutedEnemy.name}</p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                  <TypeBadge type={scoutedEnemy.type} size="xs" />
                  <span className="chip">{getZoneName(scoutedEnemy.zone)}</span>
                  <span className="chip">× {scoutedEnemy.table_focus}</span>
                  <span className="chip">Diff {scoutedEnemy.difficulty}</span>
                  {scoutedEnemy.rank === "boss" && <span className="chip text-fuchsia-200">👑 Boss</span>}
                  {scoutedEnemy.rank === "elite" && <span className="chip text-amber-200">✦ Élite</span>}
                </div>
              </div>
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                <img
                  src={getSpeciesSprite(scoutedEnemy.species, scoutedEnemy.stage)}
                  alt={scoutedEnemy.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <TypeMatchupCard
            playerType={creature.type}
            enemyType={scoutedEnemy.type}
            matchup={getTypeMatchup(creature.type, scoutedEnemy.type)}
          />

          <button
            onClick={rerollScout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white/85 backdrop-blur-md active:scale-95"
          >
            🔄 Chercher un autre ennemi
          </button>
        </section>
      )}

      {/* Actions */}
      {status === "idle" && (
        <button onClick={startBattle} className="btn-primary w-full text-xl">
          ⚔️ Lancer un duel (−{BATTLE_COST} énergie)
        </button>
      )}

      {status === "fight" && enemy && (
        <TypeMatchupCard
          playerType={creature.type}
          enemyType={enemy.type}
          matchup={getTypeMatchup(creature.type, enemy.type)}
          compact
        />
      )}

      {status === "fight" && !pendingQuestions && (
        <>
          <section className="grid grid-cols-2 gap-3">
            {(["strike", "dodge", "spell", "guard"] as BattleAction[]).map((action) => {
              const locked = action === "spell" && !creature.specialUnlocked;
              const statValue =
                action === "strike" ? creature.stats.attack :
                action === "dodge" ? creature.stats.speed :
                action === "spell" ? creature.stats.intelligence :
                creature.stats.defense;
              return (
                <motion.button
                  key={action}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => chooseAction(action)}
                  disabled={locked}
                  className={`poke-card border bg-gradient-to-br p-3 text-left ${actionGradient[action]} ${locked ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between text-white">
                    <GameIcon name={actionIcon[action]} size={22} />
                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-black">{statValue}</span>
                    {locked && <GameIcon name="lock" size={14} />}
                  </div>
                  <p className="mt-1 text-base font-black text-white">{actionLabel[action]}</p>
                  <p className="text-[10px] font-bold text-white/85">{actionDesc[action]}</p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-white/60">
                    Atelier {actionStat[action]}
                  </p>
                </motion.button>
              );
            })}
          </section>
          <button
            onClick={() => chooseAction("potion")}
            disabled={state.progress.food <= 0}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300/40 bg-gradient-to-br ${actionGradient.potion} px-3 py-2 text-sm font-black text-amber-100 backdrop-blur-md disabled:opacity-40 active:scale-95`}
          >
            <GameIcon name="potion" size={18} />
            <span>Manger une ration · {state.progress.food} 🍖 dispo</span>
          </button>
        </>
      )}

      {/* Message */}
      <section className="glass p-2 text-center text-sm font-bold text-white/90">
        {message}
      </section>

      {lastTurn && status === "fight" && (
        <div className="rounded-2xl border border-white/15 bg-rose-500/15 p-2 text-xs font-black text-rose-100 backdrop-blur-md">
          {lastTurn.critical ? "✨ Tour critique. " : ""}
          {lastTurn.enemyAction}. {lastTurn.enemyActedFirst ? "L'ennemi commence." : "Tu commences."}
        </div>
      )}

      {(status === "won" || status === "lost") && (
        <motion.section
          className={`poke-card p-4 text-center ${status === "won" ? "bg-gradient-to-br from-violet-600/40 to-fuchsia-700/40" : "bg-gradient-to-br from-slate-700/40 to-slate-900/40"}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="text-3xl font-black shimmer-text">{status === "won" ? "Victoire !" : "Défaite"}</h2>
          <p className="mt-1 text-sm font-bold text-white/85">
            {status === "won"
              ? `Pièces, graines et bonheur gagnés.${winStreakMul > 1 ? ` Loot ×${winStreakMul} grâce au combo !` : ""}`
              : "Retour à la ferme pour récupérer. Combo de victoires perdu."}
          </p>

          {status === "won" && enemy && !captureDone && enemy.rank !== "boss" && (
            <button
              onClick={handleCaptureClick}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/40 to-orange-600/40 px-3 py-2 text-sm font-black text-amber-100 backdrop-blur-md active:scale-95"
            >
              <GameIcon name="capture" size={16} />
              <span>Tenter la capture · 3 multiplications {isAlreadyCaptured(state, enemy.species) ? "" : "· NOUVEAU !"}</span>
            </button>
          )}
          {status === "won" && enemy?.rank === "boss" && (
            <p className="mt-3 text-[11px] font-black text-fuchsia-200">👑 Les boss ne peuvent pas être capturés.</p>
          )}
          {captureDone && status === "won" && (
            <p className="mt-3 text-[11px] font-black text-emerald-200">🎒 Capture terminée pour ce combat.</p>
          )}

          <button onClick={resetBattle} className="btn-secondary mt-3 w-full">Nouveau duel</button>
        </motion.section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link href="/farm" className="btn-soft text-center">🌾 Retour ferme</Link>
        <Link href="/train" className="btn-soft text-center">💪 Aller train</Link>
      </div>

      {pendingQuestions && (
        <QuestionGate
          open
          subtitle={`${pendingAction ? actionLabel[pendingAction] : "Action"} · jusqu'à × 15`}
          questions={pendingQuestions}
          onAllAnswered={resolveAction}
        />
      )}

      {evolutionGate && (
        <QuestionGate
          open
          subtitle="Évolution"
          questions={evolutionGate}
          onAllAnswered={resolveEvolutionGate}
          onCancel={() => setEvolutionGate(null)}
        />
      )}

      {captureGate && (
        <QuestionGate
          open
          subtitle={`Capture · 3 multiplications`}
          questions={captureGate}
          onAllAnswered={resolveCaptureGate}
          onCancel={() => { setCaptureGate(null); setCaptureDone(true); setMessage("Capture abandonnée."); }}
        />
      )}

      <EvolutionModal open={showEvolution} previous={evoPrev} current={evoCurrent} onClose={() => setShowEvolution(false)} />

      <RareMaterialPanel open={rareHelp} current={state.progress.rareMaterial} onClose={() => setRareHelp(false)} />

      <HelpPanel open={help} title="⚔️ Combat" onClose={() => setHelp(false)}>
        <p>Chaque attaque utilise <b>une stat différente</b>, boostée par l'atelier correspondant dans <b>Train</b>.</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Frappe (Force) :</b> coup direct simple. Bons dégâts. Améliorée par l'atelier <i>Force</i>.</li>
          <li><b>Esquive (Vitesse) :</b> agit en premier, +crit, 30 % de chance d'esquiver totalement. Améliorée par <i>Réflexe</i>.</li>
          <li><b>Sort (Concentration) :</b> 2 multiplications. Dégâts magiques qui ignorent 50 % de la défense ennemie. Améliorée par <i>Concentration</i>. Débloqué à la Forme 2.</li>
          <li><b>Garde (Endurance) :</b> divise les dégâts subis par ~2,5 et soigne légèrement. Améliorée par <i>Endurance</i>.</li>
          <li><b>Potion :</b> mange une ration pour récupérer des PV (consomme 1 nourriture).</li>
        </ul>
        <p>Le <b>combo</b> augmente avec les bonnes réponses : plus il est haut, plus les dégâts montent.</p>
        <p><b>Cycle de types</b> (chaque type bat 1 type et est faible vs 1 type) :</p>
        <ul className="ml-4 list-disc space-y-0.5">
          <li>🔥 Feu &gt; 🌿 Plante &nbsp;·&nbsp; ⚠️ Feu &lt; 💧 Eau</li>
          <li>💧 Eau &gt; 🔥 Feu &nbsp;·&nbsp; ⚠️ Eau &lt; ⚡ Élec</li>
          <li>⚡ Élec &gt; 💧 Eau &nbsp;·&nbsp; ⚠️ Élec &lt; 🌿 Plante</li>
          <li>🌿 Plante &gt; ⚡ Élec &nbsp;·&nbsp; ⚠️ Plante &lt; 🔥 Feu</li>
        </ul>
        <p>Avantage = +25 % dégâts donnés et −18 % dégâts subis. Repère l'ennemi avant d'engager pour adapter ta tactique.</p>
        <p>💎 Les ennemis lâchent parfois un <b>matériau rare</b>, nécessaire pour faire évoluer.</p>
      </HelpPanel>

      <BottomGameNav active="battle" />
    </main>
  );
}
