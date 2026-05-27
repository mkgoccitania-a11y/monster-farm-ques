"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GameIcon from "@/components/GameIcon";

interface HelpPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function HelpPanel({ open, title, onClose, children }: HelpPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 pb-20 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-900/85 via-slate-900/90 to-slate-900/95 p-4 shadow-glow backdrop-blur-xl"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black shimmer-text">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-full border border-white/20 bg-white/10 p-1.5 text-white backdrop-blur-md hover:bg-white/20"
              >
                <GameIcon name="close" size={16} />
              </button>
            </div>
            <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto text-sm text-white/90">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface HelpButtonProps {
  onClick: () => void;
  label?: string;
}

export function HelpButton({ onClick, label = "Aide" }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black text-white backdrop-blur-md transition active:scale-95 hover:bg-white/25"
      aria-label="Aide"
    >
      <GameIcon name="help" size={14} />
      <span>{label}</span>
    </button>
  );
}
