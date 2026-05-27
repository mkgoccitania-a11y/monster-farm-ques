"use client";

import { motion } from "framer-motion";

export default function PageLoader({ label = "Chargement..." }: { label?: string }) {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <motion.div
        className="h-16 w-16 rounded-full border-4 border-white/15 border-t-violet-400 shadow-glow"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-sm font-black text-white/80 shimmer-text">{label}</p>
    </main>
  );
}
