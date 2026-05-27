"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadState, saveState } from "@/lib/storage";
import {
  AnswerResolution,
  applyTimeSystems,
  buildQuestion,
  checkDailyStreak,
  createInitialState,
  createEnemy,
  getCurrentCreature,
  getXpToNextLevel,
  refreshDailyQuests,
  resolveAnswer,
  switchCreature
} from "@/lib/gameLogic";
import { MultiplicationQuestion, PlayerState, QuestionRange } from "@/lib/types";

// state: null tant que pas hydraté côté client (évite tout SSR mismatch).
// Toute page consommatrice doit afficher un loader si hydrated === false.
export const useGameState = () => {
  const [state, setState] = useState<PlayerState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef<PlayerState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydratation côté client uniquement.
  // Au passage, on déclenche le streak journalier (bonus de connexion).
  useEffect(() => {
    try {
      const loaded = applyTimeSystems(loadState());
      const withQuests = refreshDailyQuests(loaded);
      const { state: withStreak, awarded, bonus } = checkDailyStreak(withQuests);
      setState(withStreak);
      stateRef.current = withStreak;
      saveState(withStreak);
      if (awarded && bonus && typeof window !== "undefined") {
        // Petit délai pour laisser l'UI se monter avant le toast
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("daily-streak-awarded", { detail: { coins: bonus.coins, xp: bonus.xp, streak: withStreak.progress.streakDays ?? 1 } }));
        }, 600);
      }
    } catch {
      const fallback = createInitialState();
      setState(fallback);
      stateRef.current = fallback;
      saveState(fallback);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Tick périodique pour faim/énergie.
  useEffect(() => {
    if (!hydrated) return;
    const interval = window.setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        const updated = applyTimeSystems(prev);
        if (updated !== prev) {
          saveState(updated);
          stateRef.current = updated;
        }
        return updated;
      });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [hydrated]);

  // Sauvegarde de sécurité + recalcule au retour.
  useEffect(() => {
    if (!hydrated) return;
    const saveLatest = () => {
      const latest = stateRef.current;
      if (!latest) return;
      try { saveState(latest); } catch { /* localStorage indispo (privé) */ }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveLatest();
      else if (document.visibilityState === "visible") {
        setState((prev) => {
          if (!prev) return prev;
          const updated = applyTimeSystems(prev);
          if (updated !== prev) {
            saveState(updated);
            stateRef.current = updated;
          }
          return updated;
        });
      }
    };
    window.addEventListener("beforeunload", saveLatest);
    window.addEventListener("pagehide", saveLatest);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", saveLatest);
      window.removeEventListener("pagehide", saveLatest);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [hydrated]);

  const commit = (next: PlayerState) => {
    if (!hydrated) return;
    const updated = applyTimeSystems(next);
    setState(updated);
    stateRef.current = updated;
    saveState(updated);
  };

  const commitWithUpdater = (updater: (state: PlayerState) => PlayerState): PlayerState | null => {
    if (!state || !hydrated) return null;
    const next = updater(applyTimeSystems(state));
    commit(next);
    return next;
  };

  const answerQuestion = (
    question: MultiplicationQuestion,
    selectedAnswer: number,
    rewardScale = 1,
    responseMs = 2500
  ): AnswerResolution | null => {
    if (!state) return null;
    const resolved = resolveAnswer(state, question.key, selectedAnswer === question.correct, rewardScale, responseMs);
    commit(resolved.nextState);
    return resolved;
  };

  const setCurrentCreature = (creatureId: string) => {
    if (!state) return;
    commit(switchCreature(state, creatureId));
  };

  const creature = useMemo(() => (state ? getCurrentCreature(state) : null), [state]);
  const xpToNext = useMemo(() => (state ? getXpToNextLevel(state) : 0), [state]);

  return {
    state,
    hydrated,
    commit,
    commitWithUpdater,
    creature,
    xpToNext,
    answerQuestion,
    setCurrentCreature,
    buildQuestion: (forcedTable?: number, recentKeys: string[] = [], range: QuestionRange = "standard"): MultiplicationQuestion | null =>
      state ? buildQuestion(state, forcedTable, recentKeys, range) : null,
    createEnemy: () => (state ? createEnemy(state) : null)
  };
};
