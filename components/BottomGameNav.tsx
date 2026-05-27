"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import GameIcon, { GameIconName } from "@/components/GameIcon";

interface BottomGameNavProps {
  active: "farm" | "battle" | "train" | "map" | "pokedex";
}

const items: Array<{ id: BottomGameNavProps["active"]; href: string; label: string; icon: GameIconName }> = [
  { id: "map",     href: "/",         label: "Carte",  icon: "map" },
  { id: "farm",    href: "/farm",     label: "Ferme",  icon: "farm" },
  { id: "battle",  href: "/battle",   label: "Combat", icon: "battle" },
  { id: "train",   href: "/train",    label: "Train",  icon: "train" },
  { id: "pokedex", href: "/pokedex",  label: "Codex",  icon: "codex" }
];

export default function BottomGameNav({ active }: BottomGameNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-[480px] border-t border-white/15 bg-slate-950/70 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-cardLift backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <Link key={item.id} href={item.href} className="block">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition ${
                  isActive
                    ? "bg-gradient-to-br from-indigo-500/60 via-violet-500/60 to-fuchsia-500/60 text-white shadow-glow"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <GameIcon name={item.icon} size={22} />
                <p className="text-[10px] font-black uppercase tracking-wide">{item.label}</p>
                {isActive && <span className="absolute inset-x-3 -top-0.5 h-0.5 rounded-full bg-cyan-300/80 shadow-glow" />}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
