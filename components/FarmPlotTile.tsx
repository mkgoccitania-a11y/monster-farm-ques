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
  /** Avancement de la culture : 0 = juste planté, 1 = prêt. Undefined si non planté. */
  growthRatio?: number;
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

// Choisit le pattern SVG du champ selon l'avancement.
// - Sol brut : vide OU < 33% de croissance
// - Pousses : 33–66%
// - Produit fini : > 66% OU prêt à récolter
const getFieldPattern = (status: PlotUiStatus, growthRatio?: number): string | null => {
  if (status === "verrouillee") return null;
  if (status === "disponible") return "/farm/champ_01.svg";
  if (status === "prete") return "/farm/champ_03.svg";
  const r = growthRatio ?? 0;
  if (r < 0.33) return "/farm/champ_01.svg";
  if (r < 0.66) return "/farm/champ_02.svg";
  return "/farm/champ_03.svg";
};

export default function FarmPlotTile({ plot, isBuying, canBuy, canPlant, unlockedCrops, seedsByType, onBuy, onPlant, onHarvest, onAskCropsInfo, onNoSeed }: FarmPlotTileProps) {
  const isLocked = plot.statut === "verrouillee";
  const isReady = plot.statut === "prete";
  const isGrowing = plot.statut === "croissance" || plot.statut === "plantee";

  const fieldPattern = getFieldPattern(plot.statut, plot.growthRatio);

  // Border / glow selon le statut
  const borderClass = isLocked
    ? "border-white/10"
    : isReady
    ? "border-amber-300/60 shadow-glowElectric"
    : isGrowing
    ? "border-emerald-300/40"
    : "border-amber-700/30";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`poke-card relative overflow-hidden border ${borderClass} p-2.5`}
      style={{
        background: isLocked
          ? "linear-gradient(135deg, rgba(51,65,85,0.55), rgba(15,23,42,0.65))"
          : undefined
      }}
    >
      {/* Couche fond : pattern de champ */}
      {fieldPattern && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url("${fieldPattern}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
          aria-hidden
        />
      )}
      {/* Voile sombre pour garder le texte lisible */}
      {fieldPattern && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isReady
              ? "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.35) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 100%)"
          }}
          aria-hidden
        />
      )}
      {/* Halo doré quand prêt */}
      {isReady && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          animate={{ boxShadow: ["inset 0 0 0 rgba(250,204,21,0)", "inset 0 0 24px rgba(250,204,21,0.55)", "inset 0 0 0 rgba(250,204,21,0)"] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          aria-hidden
        />
      )}

      {/* Contenu */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
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
              <p className="text-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Sol prêt — choisis une graine</p>
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
                          : "border-amber-300/40 from-slate-700/60 to-slate-900/70 text-amber-100"
                      } px-1 py-1 text-[10px] font-black backdrop-blur-md active:scale-95`}
                    >
                      <GameIcon name={hasSeed ? cropIcon[type] : "coin"} size={12} />
                      <span>{cropLabel[type]} ({count})</span>
                    </button>
                  );
                })}
              </div>
              {unlockedCrops.length < 3 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAskCropsInfo?.(); }}
                  className="flex w-full items-center justify-center gap-1 rounded-md border border-white/15 bg-white/10 px-1 py-1 text-[9px] font-black text-white/90 backdrop-blur-md active:scale-95 hover:bg-white/20"
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
              <p className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{plot.planteActuelle ? cropLabel[plot.planteActuelle] : "Culture"}</p>
              {/* Mini barre de progression */}
              <div className="mx-auto h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-black/40">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-lime-300 to-emerald-400"
                  initial={false}
                  animate={{ width: `${Math.round((plot.growthRatio ?? 0) * 100)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{plot.tempsRestantLabel ?? "..."}</p>
            </div>
          )}

          {!isLocked && isReady && (
            <div className="space-y-1.5 text-center">
              <p className="text-[11px] font-black text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                ✨ {plot.planteActuelle ? cropLabel[plot.planteActuelle] : "Culture"} prête !
              </p>
              <button
                onClick={() => onHarvest(plot.id)}
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-400 to-orange-500 px-2 py-1.5 text-[11px] font-black text-amber-950 shadow-glowElectric active:scale-95"
              >
                <GameIcon name="check" size={14} />
                <span>Récolter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
