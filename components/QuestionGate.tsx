"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnswerButtons from "@/components/AnswerButtons";
import QuestionBox from "@/components/QuestionBox";
import { MultiplicationQuestion, QuestionRange } from "@/lib/types";

interface QuestionGateProps {
  open: boolean;
  subtitle?: string;
  questions: MultiplicationQuestion[];
  onAllAnswered: (results: Array<{ key: string; isCorrect: boolean; responseMs: number }>) => void;
  onCancel?: () => void;
}

// Composant generique: une ou plusieurs questions a enchainer avant de declencher une action.
// Si "questions" contient plusieurs entrees, la modale les pose dans l'ordre.
export default function QuestionGate({ open, subtitle, questions, onAllAnswered, onCancel }: QuestionGateProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [results, setResults] = useState<Array<{ key: string; isCorrect: boolean; responseMs: number }>>([]);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setSelected(null);
      setResults([]);
      setStartedAt(Date.now());
    }
  }, [open]);

  if (!open || questions.length === 0) return null;
  const q = questions[index];
  if (!q) return null;

  const onSelect = (answer: number) => {
    if (selected !== null) return;
    setSelected(answer);
    const isCorrect = answer === q.correct;
    const responseMs = Date.now() - startedAt;
    const nextResults = [...results, { key: q.key, isCorrect, responseMs }];
    setResults(nextResults);

    window.setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex(index + 1);
        setSelected(null);
        setStartedAt(Date.now());
      } else {
        onAllAnswered(nextResults);
      }
    }, 550);
  };

  return (
    <motion.section
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full rounded-[1.6rem] border-[3px] border-[#7b4418] bg-gradient-to-b from-[#ffe4ba] to-[#efc482] p-3">
        {questions.length > 1 && (
          <p className="mb-1 text-center text-[11px] font-black text-[#6a3814]">
            Question {index + 1} / {questions.length}
          </p>
        )}
        <QuestionBox question={q} subtitle={subtitle} />
        <div className="mt-3">
          <AnswerButtons
            answers={q.answers}
            selected={selected}
            correctAnswer={selected !== null ? q.correct : undefined}
            disabled={selected !== null}
            onSelect={onSelect}
          />
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 w-full rounded-xl bg-white/85 px-3 py-2 text-sm font-black text-[#6a3814]"
          >
            Annuler
          </button>
        )}
      </div>
    </motion.section>
  );
}

// Helper type pour les pages qui veulent gater plusieurs actions differentes.
export type GateMode = string;
export type { QuestionRange };
