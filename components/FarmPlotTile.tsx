"use client";

import { motion } from "framer-motion";
import { CropType } from "@/lib/types";
import GameIcon, { GameIconName } from "@/components/GameIcon";

export type PlotUiStatus = "verrouillee" | "disponible" | "plantee" | "croissance" | "prete";

export interface FarmPlotUiModel {
  id: string;
  nom: string;
  statut: PlotUiStatus;
  prix: number;
  achetee: boolean;
  planteActuelle: CropType | null;
  tempsRestantLabel?: string;
}

interface FarmPlotTileProps {
  plot: FarmPlotUiModel;
  isBuying: boolean;
  canBuy: boolean;
  canPlant: boolean;
  unlockedCrops: CropType[];
  seedsByType: Record<CropType, number>;
  onBuy: (id: string) => void;
  onPlant: (id: string, cropType: CropType) => void;
  onHarvest: (id: string) => void;
  /** Callback quand l'utilisateur clique sur "Plus de cultures bientôt" */
  onAskCropsInfo?: () => void;
  /** Callback quand l'utilisateur clique sur une graine épuisée → ouvre le shop */
  onNoSeed?: (cropType: CropType) => void;
}

const cropLabel: Record<CropType, string> = {
  fast: "Pousse",
  medium: "Baie",
  slow: "Racine"
};

const cropIcon: Record<CropType, GameIconName> = {
  fast: "sprout",
  medium: "berry",
  slow: "root"
};

const cropColor: Record<CropType, string> = {
  fast: "from-lime-400 to-emerald-500",
  medium: "from-rose-400 to-pink-500",
  slow: "from-amber-400 to-orange-500"
};

const statusLabel: Record<PlotUiStatus, string> = {
  verrouillee: "Verrouillée",
  disponible: "Vide",
  plantee: "Plantée",
  croissance: "En croissance",
  prete: "Prête !"
};

export default function FarmPlotTile({ plot, isBuying, canBuy, canPlant, unlockedCrops, seedsByType, onBuy, onPlant, onHarvest, onAskCropsInfo, onNoSeed }: FarmPlotTileProps) {
  const isLocked = plot.statut === "verrouillee";
  const isReady = plot.statut === "prete";
  const isGrowing = plot.statut === "croissance" || plot.statut === "plantee";

  const containerBg = isLocked
    ? "from-slate-700/40 to-slate-900/50 border-white/10"
    : isReady
    ? "from-amber-400/40 to-yellow-600/30 border-amber-300/40 shadow-glowElectric"
    : isGrowing
    ? "from-emerald-500/30 to-green-700/30 border-emerald-300/40"
    : "from-indigo-500/30 to-violet-700/30 border-indigo-300/30";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`poke-card relative bg-gradient-to-br ${containerBg} p-2.5`}
    >
      <div className="flex items-center justify-between text-[10px] font-black text-white/85">
        <span>{plot.nom}</span>
        <span>{statusLabel[plot.statut]}</span>
      </div>

      <div className="mt-1.5">
        {isLocked && (
          <div className="space-y-2 text-center">
            <div className="flex justify-center text-white/70"><GameIcon name="lock" size={28} /></div>
            <p className="text-[11px] font-black text-white/80">Case fermée</p>
            <button
              onClick={() => onBuy(plot.id)}
              disabled={!canBuy || isBuying}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-400/30 to-orange-600/30 px-2 py-1.5 text-[11px] font-black text-amber-100 backdrop-blur-md disabled:opacity-40 active:scale-95"
            >
              Acheter
              <span className="flex items-center gap-0.5"><GameIcon name="coin" size={12} /> {plot.prix}</span>
            </button>
          </div>
        )}

        {!isLocked && plot.statut === "disponible" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center text-emerald-200"><GameIcon name="sprout" size={28} /></div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, unlockedCrops.length)}, minmax(0, 1fr))` }}>
              {unlockedCrops.map((type) => {
                const count = seedsByType[type] ?? 0;
                const hasSeed = count > 0;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (!canPlant) return;
                      if (!hasSeed) onNoSeed?.(type);
                      else onPlant(plot.id, type);
                    }}
                    disabled={!canPlant}
                    title={hasSeed ? `Planter ${cropLabel[type]}` : `Pas de graine ${cropLabel[type]} — clique pour aller au shop`}
                    className={`flex items-center justify-center gap-1 rounded-lg border bg-gradient-to-br ${
                      hasSeed
                        ? `border-white/20 ${cropColor[type]} text-white`
                        : "border-amber-300/40 from-slate-700/50 to-slate-900/50 text-amber-100"
                    } px-1 py-1 text-[10px] font-black backdrop-blur-md active:scale-95`}
                  >
                    <GameIcon name={hasSeed ? cropIcon[type] : "coin"} size={12} />
                    <span>{cropLabel[type]} ({count})</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[9px] font-black text-white/60">Pas de graine ? Touche le bouton pour acheter</p>
            {unlockedCrops.length < 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); onAskCropsInfo?.(); }}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-white/15 bg-white/10 px-1 py-1 text-[9px] font-black text-white/80 backdrop-blur-md active:scale-95 hover:bg-white/15"
              >
                <GameIcon name="lock" size={10} />
                <span>Voir cultures verrouillées</span>
                <GameIcon name="help" size={10} />
              </button>
            )}
          </div>
        )}

        {!isLocked && isGrowing && (
          <div className="space-y-1 text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="flex justify-center text-emerald-300"
            >
              {plot.planteActuelle ? <GameIcon name={cropIcon[plot.planteActuelle]} size={32} /> : <GameIcon name="sprout" size={32} />}
            </motion.div>
            <p className="text-[11px] font-black text-emerald-100">{plot.planteActuelle ? cropLabel[plot.planteActuelle] : "Culture"}</p>
            <p className="text-[10px] font-black text-white/80">{plot.tempsRestantLabel ?? "..."}</p>
          </div>
        )}

        {!isLocked && isReady && (
          <motion.div
            animate={{ boxShadow: ["0 0 0 rgba(250,204,21,0)", "0 0 24px rgba(250,204,21,0.7)", "0 0 0 rgba(250,204,21,0)"] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="space-y-1.5 text-center"
          >
            <div className="flex justify-center text-amber-200">
              {plot.planteActuelle ? <GameIcon name={cropIcon[plot.planteActuelle]} size={32} /> : <GameIcon name="berry" size={32} />}
            </div>
            <p className="text-[11px] font-black text-amber-100">{plot.planteActuelle ? cropLabel[plot.planteActuelle] : "Culture"} prêt !</p>
            <button
              onClick={() => onHarvest(plot.id)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-amber-300/50 bg-gradient-to-br from-amber-400 to-orange-500 px-2 py-1.5 text-[11px] font-black text-amber-950 shadow-glowElectric active:scale-95"
            >
              <GameIcon name="check" size={14} />
              <span>Récolter</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
