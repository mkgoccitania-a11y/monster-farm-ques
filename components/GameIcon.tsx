"use client";

// Système d'icônes SVG kawaii sticker pour Monster Farm Quest.
// Style : fill plein + highlight blanc en haut-gauche (effet bombé / 3D mignon),
// pas d'outline, formes très arrondies. currentColor pour la couleur principale.
// Optimisé pour 14-32 px. ViewBox 24×24.

import { SVGProps } from "react";

export type GameIconName =
  | "strength" | "speed" | "intelligence" | "defense"
  | "coin" | "gem" | "energy" | "food" | "happiness"
  | "well-fed" | "starving" | "happy" | "sad" | "energized" | "drained"
  | "sprout" | "berry" | "root"
  | "map" | "farm" | "battle" | "train" | "codex"
  | "attack" | "shield" | "special" | "potion"
  | "boss" | "elite" | "evolve" | "capture" | "quest" | "trophy" | "streak"
  | "lock" | "check" | "close" | "help" | "warn" | "star" | "spark"
  | "level";

interface GameIconProps extends Omit<SVGProps<SVGSVGElement>, "stroke"> {
  name: GameIconName;
  size?: number;
}

// Tons utilisés systématiquement
const HI = "rgba(255,255,255,0.5)";   // highlight bombé
const DK = "rgba(0,0,0,0.18)";        // ombre interne discrète

export default function GameIcon({ name, size = 18, ...rest }: GameIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    ...rest
  };

  switch (name) {
    // ============ STATS CRÉATURE ============
    case "strength": // poing rond stylé "punchy"
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="9" fill="currentColor" />
          <ellipse cx="9.5" cy="9" rx="4" ry="2.5" fill={HI} />
          <path d="M8 11h8M9 14h6M10 17h4" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="20" cy="6" r="1.5" fill="currentColor" />
        </svg>
      );
    case "speed": // éclair plein bombé
      return (
        <svg {...common}>
          <path d="M14 2L4 13h6l-1 9 11-14h-7l1-6z" fill="currentColor" />
          <path d="M14 2L4 13h3l8-7z" fill={HI} />
        </svg>
      );
    case "intelligence": // ampoule "idée"
      return (
        <svg {...common}>
          <path d="M12 3a7 7 0 0 1 4 12.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.3A7 7 0 0 1 12 3z" fill="currentColor" />
          <ellipse cx="9" cy="8" rx="3" ry="2" fill={HI} />
          <path d="M10 21h4M9.5 17.5h5" stroke={DK} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 9l-1.5 3h3L12 14" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "defense": // bouclier rond avec étoile
      return (
        <svg {...common}>
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="currentColor" />
          <path d="M12 2l8 3-2 1-6 1-6-1-2-1z" fill={HI} />
          <path d="M12 8l1.3 2.7 3 .3-2.3 2 .7 3-2.7-1.5-2.7 1.5.7-3-2.3-2 3-.3z" fill="white" opacity="0.9" />
        </svg>
      );

    // ============ RESSOURCES ============
    case "coin": // pièce dorée brillante
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <circle cx="12" cy="12" r="6.5" fill={DK} />
          <circle cx="12" cy="12" r="6.5" fill="currentColor" opacity="0.95" />
          <ellipse cx="9" cy="9" rx="3" ry="1.6" fill={HI} />
          <path d="M12 8l1.3 2.7 3 .3-2.3 2 .7 3-2.7-1.5-2.7 1.5.7-3-2.3-2 3-.3z" fill="white" opacity="0.9" />
        </svg>
      );
    case "gem": // diamant cristal violet
      return (
        <svg {...common}>
          <path d="M6 3h12l3 6-9 12L3 9z" fill="currentColor" />
          <path d="M6 3h12l-1 4H7z" fill={HI} />
          <path d="M6 3l3 6L3 9zM18 3l-3 6 6 0zM9 9h6l-3 12z" fill={DK} />
          <path d="M6 3h12l3 6-9 12L3 9z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeLinejoin="round" />
        </svg>
      );
    case "energy": // éclair sticker
      return (
        <svg {...common}>
          <path d="M14 2L4 13h6l-1 9 11-14h-7l1-6z" fill="currentColor" />
          <path d="M14 2L4 13h3l8-7z" fill={HI} />
          <circle cx="20" cy="4" r="1" fill="currentColor" />
          <circle cx="22" cy="7" r="0.6" fill="currentColor" />
        </svg>
      );
    case "food": // os de viande rond
      return (
        <svg {...common}>
          <path d="M5 7a3 3 0 0 1 5.5-1.6 3 3 0 0 1 4.5 0 3 3 0 0 1 4 4 3 3 0 0 1-1 4l-2 2 2 2a3 3 0 0 1 1 4 3 3 0 0 1-4 4 3 3 0 0 1-4.5 0 3 3 0 0 1-5.5-1.6 3 3 0 0 1-1.6-5.5 3 3 0 0 1 0-4.5A3 3 0 0 1 5 7z" fill="currentColor" />
          <ellipse cx="8" cy="7" rx="2" ry="1.2" fill={HI} />
        </svg>
      );
    case "happiness": // cœur bombé
      return (
        <svg {...common}>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" fill="currentColor" />
          <path d="M7 4a3 3 0 0 0-2.7 4.3c.5-1.5 1.7-2.6 3.2-3 .8-.2 1.5 0 2 .4-.7-.9-1.5-1.7-2.5-1.7z" fill={HI} />
        </svg>
      );

    // ============ BESOINS (visages kawaii) ============
    case "well-fed":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="8.5" cy="7" rx="3.5" ry="2" fill={HI} />
          <path d="M8 13.5c1 1.8 2.5 2.5 4 2.5s3-.7 4-2.5" stroke={DK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="9" cy="10" r="1.2" fill={DK} />
          <circle cx="15" cy="10" r="1.2" fill={DK} />
          <circle cx="6.5" cy="13" r="1.2" fill="rgba(255,150,170,0.7)" />
          <circle cx="17.5" cy="13" r="1.2" fill="rgba(255,150,170,0.7)" />
        </svg>
      );
    case "starving":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="8.5" cy="7" rx="3.5" ry="2" fill={HI} />
          <path d="M9 16c1-1 2-1.5 3-1.5s2 .5 3 1.5" stroke={DK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M7.5 9l2 2M9.5 9l-2 2M14.5 9l2 2M16.5 9l-2 2" stroke={DK} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "happy":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="8.5" cy="7" rx="3.5" ry="2" fill={HI} />
          <path d="M8 13c.8 2 2.3 3 4 3s3.2-1 4-3" stroke={DK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="9" cy="10" rx="0.9" ry="1.3" fill={DK} />
          <ellipse cx="15" cy="10" rx="0.9" ry="1.3" fill={DK} />
          <circle cx="9.4" cy="9.5" r="0.4" fill="white" />
          <circle cx="15.4" cy="9.5" r="0.4" fill="white" />
        </svg>
      );
    case "sad":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="8.5" cy="7" rx="3.5" ry="2" fill={HI} />
          <path d="M8 16.5c.8-1.8 2.3-2.8 4-2.8s3.2 1 4 2.8" stroke={DK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx="9" cy="10.5" rx="0.9" ry="1.3" fill={DK} />
          <ellipse cx="15" cy="10.5" rx="0.9" ry="1.3" fill={DK} />
          <path d="M8.5 13.5c0 1 .5 2 1 2.5M15.5 13.5c0 1-.5 2-1 2.5" stroke="rgba(120,180,255,0.6)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "energized":
      return (
        <svg {...common}>
          <path d="M14 2L4 13h6l-1 9 11-14h-7l1-6z" fill="currentColor" />
          <path d="M14 2L4 13h3l8-7z" fill={HI} />
          <circle cx="20" cy="4" r="1" fill="currentColor" />
          <circle cx="22" cy="8" r="0.8" fill="currentColor" />
          <circle cx="19" cy="9" r="0.6" fill="currentColor" />
        </svg>
      );
    case "drained": // batterie déchargée
      return (
        <svg {...common}>
          <rect x="3" y="8" width="16" height="9" rx="2.5" fill="currentColor" />
          <rect x="4" y="9" width="14" height="2" rx="1" fill={HI} />
          <path d="M19 11v3h2v-3z" fill="currentColor" />
          <path d="M7 12.5h2" stroke={DK} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // ============ CULTURES ============
    case "sprout": // petite pousse mignonne
      return (
        <svg {...common}>
          <path d="M12 22v-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 13c0-4-3-6-6-7 1 3 2 6 6 7z" fill="currentColor" />
          <path d="M12 13c0-3 2-5 5-6-1 3-2 5-5 6z" fill="currentColor" opacity="0.8" />
          <ellipse cx="8" cy="9" rx="1.5" ry="1" fill={HI} />
        </svg>
      );
    case "berry": // fraise toute ronde
      return (
        <svg {...common}>
          <path d="M12 5c-3.5 0-6 2.5-6 6 0 4.5 3.5 9 6 9s6-4.5 6-9c0-3.5-2.5-6-6-6z" fill="currentColor" />
          <path d="M9 4l3 1 3-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="9" cy="9" rx="2" ry="1.2" fill={HI} />
          <circle cx="10" cy="12" r="0.7" fill="white" opacity="0.85" />
          <circle cx="14" cy="13.5" r="0.7" fill="white" opacity="0.85" />
          <circle cx="11" cy="16" r="0.7" fill="white" opacity="0.85" />
        </svg>
      );
    case "root": // carotte joviale
      return (
        <svg {...common}>
          <path d="M12 22l-5-12a5 5 0 0 1 10 0L12 22z" fill="currentColor" />
          <path d="M7.5 11l3 1 3-1 3-1" stroke={HI} strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M9 7l-2-3M12 6V2M15 7l2-3" stroke="rgba(80,180,80,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // ============ NAVIGATION ============
    case "map":
      return (
        <svg {...common}>
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="currentColor" />
          <path d="M3 6l6-2 6 2 6-2-1 2-5 1-6-1-5 1z" fill={HI} />
          <path d="M9 4v16M15 6v16" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M18 9.5l-1 2 1 2 1-2z" fill="white" opacity="0.95" />
        </svg>
      );
    case "farm": // grange ronde
      return (
        <svg {...common}>
          <path d="M3 21V10l9-7 9 7v11z" fill="currentColor" />
          <path d="M3 10l9-7 9 7-1.5 1.5L12 5l-7.5 6.5z" fill={HI} />
          <rect x="9" y="14" width="6" height="7" rx="1" fill={DK} />
          <circle cx="12" cy="17.5" r="0.8" fill="white" />
        </svg>
      );
    case "battle": // épées croisées
      return (
        <svg {...common}>
          <path d="M14 3l7 7-4 4-7-7z" fill="currentColor" />
          <path d="M10 3l-7 7 4 4 7-7z" fill="currentColor" />
          <path d="M10 14L3 21l3-1 8-7z" fill={DK} opacity="0.5" />
          <path d="M14 14l7 7-3-1-7-7z" fill={DK} opacity="0.5" />
          <path d="M14 3l7 7-1.5 1.5L13 5z" fill={HI} />
          <path d="M10 3L3 10l1.5 1.5L11 5z" fill={HI} />
        </svg>
      );
    case "train": // haltère bombée
      return (
        <svg {...common}>
          <rect x="2" y="11" width="2.5" height="2.5" rx="1" fill="currentColor" />
          <rect x="19.5" y="11" width="2.5" height="2.5" rx="1" fill="currentColor" />
          <rect x="5" y="7" width="4" height="10" rx="2" fill="currentColor" />
          <rect x="15" y="7" width="4" height="10" rx="2" fill="currentColor" />
          <rect x="5.5" y="8" width="3" height="3" rx="1" fill={HI} />
          <rect x="15.5" y="8" width="3" height="3" rx="1" fill={HI} />
          <rect x="9" y="11" width="6" height="2.5" rx="1" fill="currentColor" />
        </svg>
      );
    case "codex":
      return (
        <svg {...common}>
          <path d="M2 5h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2V5z" fill="currentColor" />
          <path d="M22 5h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7V5z" fill="currentColor" />
          <path d="M2 5h7a3 3 0 0 1 2 1.5L11 8v13l-1-1.5A3 3 0 0 0 9 18H2z" fill={HI} />
          <path d="M17 5v6l-1.5-1L14 11V5z" fill="rgba(255,200,100,0.95)" />
        </svg>
      );

    // ============ COMBAT ============
    case "attack": // épée pleine
      return (
        <svg {...common}>
          <path d="M14 3l7 7-3 3-1-1-9 9-3 1 1-3 9-9-1-1z" fill="currentColor" />
          <path d="M14 3l7 7-2 2L13 5z" fill={HI} />
          <path d="M3 21l1-3 9-9 1 1-9 9z" fill={DK} opacity="0.4" />
        </svg>
      );
    case "shield": // bouclier plein avec check
      return (
        <svg {...common}>
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="currentColor" />
          <path d="M12 2l8 3-2 1-6 1-6-1-2-1z" fill={HI} />
          <path d="M8.5 12l2.5 2.5 4.5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "special": // étoile filante
      return (
        <svg {...common}>
          <path d="M12 2l2.6 6.4 6.9 1-5 4.7 1.5 6.9L12 17.5 5.9 21l1.5-6.9-5-4.7 6.9-1z" fill="currentColor" />
          <path d="M12 2l2.6 6.4 6.9 1L17 11l-3-5z" fill={HI} />
          <circle cx="20.5" cy="3.5" r="0.8" fill="currentColor" />
          <circle cx="3" cy="20" r="0.8" fill="currentColor" />
        </svg>
      );
    case "potion": // fiole bombée
      return (
        <svg {...common}>
          <path d="M9 2h6v5l3 11a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4l3-11z" fill="currentColor" />
          <path d="M9 2h6v5L12 6.5 9 7z" fill={HI} />
          <ellipse cx="11" cy="16" r="1" fill="white" opacity="0.5" />
          <ellipse cx="14" cy="18.5" r="0.7" fill="white" opacity="0.4" />
          <path d="M9 2h6" stroke={DK} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // ============ GAMEPLAY ============
    case "boss": // couronne royale
      return (
        <svg {...common}>
          <path d="M3 8l3 4 3-6 3 6 3-6 3 6 3-4 1 12H2z" fill="currentColor" />
          <path d="M3 8l3 4 3-6 3 6 3-6 3 6 3-4-1 4-3 1-9-2-9 2-3-1z" fill={HI} />
          <circle cx="3" cy="8" r="1.5" fill="rgba(255,140,200,0.95)" />
          <circle cx="12" cy="6" r="1.8" fill="rgba(255,140,200,0.95)" />
          <circle cx="21" cy="8" r="1.5" fill="rgba(255,140,200,0.95)" />
          <path d="M5 18h14" stroke="white" strokeWidth="1.4" opacity="0.5" />
        </svg>
      );
    case "elite": // étoile diamant 4 branches
      return (
        <svg {...common}>
          <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="currentColor" />
          <path d="M12 2l3 7-3 1-3-1z" fill={HI} />
        </svg>
      );
    case "evolve": // soleil portail
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <ellipse cx="10" cy="10.5" rx="2" ry="1.2" fill={HI} />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "capture": // poké-ball cute
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <path d="M2.5 12h19" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
          <ellipse cx="9" cy="6" rx="3.5" ry="2" fill={HI} />
          <circle cx="12" cy="12" r="3" fill="white" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "quest": // parchemin enroulé
      return (
        <svg {...common}>
          <path d="M5 4h11l3 3v13H5z" fill="currentColor" />
          <path d="M5 4h11l3 3-1 1-2-2H6z" fill={HI} />
          <path d="M16 4v3h3" fill={DK} />
          <path d="M8 10h8M8 13h8M8 16h5" stroke={DK} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "trophy": // coupe dorée
      return (
        <svg {...common}>
          <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" fill="currentColor" />
          <path d="M8 4h8v2L12 7 8 6z" fill={HI} />
          <path d="M16 6h3v2a3 3 0 0 1-3 3M8 6H5v2a3 3 0 0 0 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="10" y="14" width="4" height="3" rx="0.5" fill="currentColor" />
          <rect x="7" y="17" width="10" height="3" rx="1" fill="currentColor" />
          <circle cx="12" cy="8" r="1.5" fill="rgba(255,210,80,0.95)" />
        </svg>
      );
    case "streak": // flamme bombée
      return (
        <svg {...common}>
          <path d="M12 22c4 0 7-3 7-7 0-4-3-5-3-9 0 2-3 3-3 6-1-2-3-2-3-4-2 2-5 4-5 8 0 3 3 6 7 6z" fill="currentColor" />
          <path d="M16 6c0 2-3 3-3 6-1-2-3-2-3-4 1-1 3-1 3-3 1 0 2 0 3 1z" fill={HI} />
          <ellipse cx="12" cy="19" rx="3" ry="2" fill="rgba(255,220,150,0.85)" />
        </svg>
      );

    // ============ UI ============
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" />
          <rect x="6" y="12" width="12" height="2" rx="1" fill={HI} />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="16" r="1.6" fill={DK} />
        </svg>
      );
    case "check": // check rond
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="9" cy="8" rx="3.5" ry="2" fill={HI} />
          <path d="M7 12l3.5 3.5 7-7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="9" cy="8" rx="3.5" ry="2" fill={HI} />
          <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <ellipse cx="9" cy="8" rx="3.5" ry="2" fill={HI} />
          <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="17" r="1.3" fill="white" />
        </svg>
      );
    case "warn": // triangle bombé
      return (
        <svg {...common}>
          <path d="M12 3L2 21h20z" fill="currentColor" />
          <path d="M12 3L8 9l4-2 4 2z" fill={HI} />
          <path d="M12 10v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="18" r="1.3" fill="white" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 2l2.6 6.4 6.9 1-5 4.7 1.5 6.9L12 17.5 5.9 21l1.5-6.9-5-4.7 6.9-1z" fill="currentColor" />
          <path d="M12 2l2.6 6.4 6.9 1L17 11l-3-5z" fill={HI} />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <ellipse cx="11" cy="11" rx="1.5" ry="1" fill={HI} />
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "level": // barres montantes
      return (
        <svg {...common}>
          <rect x="3" y="13" width="4" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
          <rect x="10" y="8" width="4" height="13" rx="1.5" fill="currentColor" opacity="0.8" />
          <rect x="17" y="3" width="4" height="18" rx="1.5" fill="currentColor" />
          <rect x="3.5" y="13.5" width="2" height="3" rx="0.7" fill={HI} />
          <rect x="10.5" y="8.5" width="2" height="3" rx="0.7" fill={HI} />
          <rect x="17.5" y="3.5" width="2" height="3" rx="0.7" fill={HI} />
        </svg>
      );

    default:
      return null;
  }
}
