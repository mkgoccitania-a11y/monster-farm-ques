"use client";

import { AnimatePresence, motion } from "framer-motion";

interface RewardBurstProps {
  show: boolean;
  text: string;
  color?: "gold" | "green" | "blue";
}

export default function RewardBurst({ show, text, color = "gold" }: RewardBurstProps) {
  const palette = color === "green"
    ? "from-emerald-400 via-green-500 to-teal-500"
    : color === "blue"
    ? "from-cyan-400 via-sky-500 to-indigo-500"
    : "from-amber-300 via-yellow-400 to-orange-500";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-full border border-white/30 bg-gradient-to-r ${palette} px-5 py-2.5 text-base font-black text-white shadow-glow backdrop-blur`}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: [0, 1, 1, 0], y: [8, -10, -28, -52], scale: [0.85, 1.15, 1.05, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4 }}
        >
          ✨ {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
