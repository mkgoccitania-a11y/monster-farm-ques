"use client";

import { motion } from "framer-motion";

interface AnswerButtonsProps {
  answers: number[];
  disabled?: boolean;
  selected?: number | null;
  correctAnswer?: number;
  onSelect: (answer: number) => void;
}

export default function AnswerButtons({
  answers,
  disabled = false,
  selected = null,
  correctAnswer,
  onSelect
}: AnswerButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {answers.map((answer) => {
        const isSelected = selected === answer;
        const isCorrect = correctAnswer === answer;
        const showValidation = selected !== null && correctAnswer !== undefined;

        let baseClass = "rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 text-white";
        let animate: Record<string, number[]> | undefined;

        if (showValidation && isCorrect) {
          baseClass = "rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-glow";
          animate = { scale: [1, 1.1, 1] };
        } else if (showValidation && isSelected && !isCorrect) {
          baseClass = "rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-500 to-red-600 text-white";
          animate = { x: [0, -8, 8, -6, 6, 0] };
        }

        return (
          <motion.button
            key={answer}
            whileTap={{ scale: 0.95 }}
            animate={animate}
            transition={{ duration: 0.4 }}
            disabled={disabled}
            onClick={() => onSelect(answer)}
            className={`h-16 text-3xl font-black shadow-cardLift backdrop-blur-md transition ${baseClass} ${
              disabled && !isSelected ? "opacity-60" : ""
            }`}
          >
            {answer}
          </motion.button>
        );
      })}
    </div>
  );
}
