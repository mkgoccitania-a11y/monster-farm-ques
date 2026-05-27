import { CreatureSpecies, CreatureType } from "@/lib/types";

// ==================================================================
// MANIFESTE DES SPRITES (10 espèces × 3 stages)
// ==================================================================
// Le user a fourni 30 images sous /public/sprites/customs/ avec un naming
// pas toujours homogène. On mappe explicitement chaque (species, stage).
export const SPECIES_SPRITES: Record<CreatureSpecies, Record<1 | 2 | 3, string>> = {
  eclair: {
    1: "/sprites/customs/01_eclair_192.webp",
    2: "/sprites/customs/08_eclair_evolution_192.webp",
    3: "/sprites/customs/08_eclair_adulte.jpg"
  },
  braise: {
    1: "/sprites/customs/02_braise_192.webp",
    2: "/sprites/customs/09_braise_evolution_192.webp",
    3: "/sprites/customs/09_lave_feu_adulte.jpg"
  },
  foret: {
    1: "/sprites/customs/03_foret_192.webp",
    2: "/sprites/customs/10_foret_evolution_192.webp",
    3: "/sprites/customs/10_foret_adulte.jpg"
  },
  eau: {
    1: "/sprites/customs/04_eau_192.webp",
    2: "/sprites/customs/01_eau_evolution_192.webp",
    3: "/sprites/customs/01_eau_glace_adulte.jpg"
  },
  cristal: {
    1: "/sprites/customs/05_cristal_192.webp",
    2: "/sprites/customs/02_cristal_evolution_192.webp",
    3: "/sprites/customs/02_cristal_violet_adulte.jpg"
  },
  vent: {
    1: "/sprites/customs/06_vent_192.webp",
    2: "/sprites/customs/03_vent_evolution_192.webp",
    3: "/sprites/customs/03_vent_griffon_adulte.jpg"
  },
  roche: {
    1: "/sprites/customs/07_roche_192.webp",
    2: "/sprites/customs/04_roche_evolution_192.webp",
    3: "/sprites/customs/04_roche_mousse_adulte.jpg"
  },
  ombre: {
    1: "/sprites/customs/08_ombre_192.webp",
    2: "/sprites/customs/05_ombre_evolution_192.webp",
    3: "/sprites/customs/05_ombre_violette_adulte.jpg"
  },
  fleur: {
    1: "/sprites/customs/09_fleur_192.webp",
    2: "/sprites/customs/06_fleur_evolution_192.webp",
    3: "/sprites/customs/06_fleur_rose_adulte.jpg"
  },
  givre: {
    1: "/sprites/customs/10_givre_192.webp",
    2: "/sprites/customs/07_givre_evolution_192.webp",
    3: "/sprites/customs/07_glace_cristal_adulte.jpg"
  }
};

// Type sous-jacent (pour avantages combat) : chaque species hérite d'un des 4 types.
export const SPECIES_TYPE: Record<CreatureSpecies, CreatureType> = {
  eclair:  "electric",
  braise:  "fire",
  foret:   "plant",
  eau:     "water",
  cristal: "electric",
  vent:    "water",
  roche:   "plant",
  ombre:   "fire",
  fleur:   "plant",
  givre:   "water"
};

// Métadonnées d'affichage par species
export interface SpeciesMeta {
  display: string;
  stageNames: [string, string, string];
  table: number;
  tagline: string;
}

export const SPECIES_META: Record<CreatureSpecies, SpeciesMeta> = {
  eclair:  { display: "Eclair",  stageNames: ["Zappi", "Voltif", "Stormraptor"], table: 3, tagline: "Vif comme la foudre, agile comme l'éclair." },
  braise:  { display: "Braise",  stageNames: ["Flamy", "Brasion", "Lavaroar"],    table: 4, tagline: "Une étincelle qui devient brasier." },
  foret:   { display: "Forêt",   stageNames: ["Leafy", "Vinoxe", "Sylvarum"],     table: 5, tagline: "La nature lente mais imparable." },
  eau:     { display: "Eau",     stageNames: ["Bubbli", "Riploutre", "Glacéan"],  table: 6, tagline: "Calme à l'extérieur, profond en dedans." },
  cristal: { display: "Cristal", stageNames: ["Prismet", "Améthystin", "Cristalys"], table: 7, tagline: "Réfléchit la lumière, et le savoir." },
  vent:    { display: "Vent",    stageNames: ["Briso", "Tornadi", "Griffaero"],   table: 8, tagline: "Souffle léger, ouragan puissant." },
  roche:   { display: "Roche",   stageNames: ["Pébou", "Mousseroc", "Lithogiant"], table: 9, tagline: "Solide comme la pierre, têtu comme la mousse." },
  ombre:   { display: "Ombre",   stageNames: ["Pénombi", "Skulky", "Nyxion"],     table: 4, tagline: "Discret la nuit, redoutable au combat." },
  fleur:   { display: "Fleur",   stageNames: ["Pétali", "Bourgeon", "Rosaria"],   table: 5, tagline: "Petites pétales, grandes ambitions." },
  givre:   { display: "Givre",   stageNames: ["Flocon", "Cristos", "Boréalis"],   table: 6, tagline: "Glaçon mignon, blizzard endurant." }
};

// Helper : retourne le path du sprite selon species + stage
export const getSpeciesSprite = (species: CreatureSpecies, stage: number): string => {
  const s = Math.max(1, Math.min(3, stage)) as 1 | 2 | 3;
  return SPECIES_SPRITES[species][s];
};

// Helper : devine une species selon un type (rétrocompat saves anciennes)
export const defaultSpeciesForType = (type: CreatureType): CreatureSpecies => {
  switch (type) {
    case "fire": return "braise";
    case "water": return "eau";
    case "plant": return "foret";
    case "electric": return "eclair";
  }
};


export type ReactionContext = "feed" | "harvest" | "train" | "battleWin" | "battleLose" | "evolve" | "idleHappy" | "idleHungry";

interface CreatureFamily {
  familyName: string;
  stageNames: [string, string, string];
  emotes: [string, string, string];
  aura: string;
  body: string;
  accent: string;
  reactions: Record<ReactionContext, string[]>;
}

const roster: Record<CreatureType, CreatureFamily> = {
  fire: {
    familyName: "Flarecub",
    stageNames: ["Etincelou", "Braselion", "Solarfang"],
    emotes: ["🔥", "🦊", "🦁"],
    aura: "from-orange-300 via-amber-300 to-rose-400",
    body: "from-orange-200 to-red-300",
    accent: "bg-orange-500",
    reactions: {
      feed: ["Miam !", "Chaud et bon !", "Ça crépite !"],
      harvest: ["Récolte brûlante !", "Croque !", "Butin épicé !"],
      train: ["Je m'échauffe !", "Entraînement puissance !", "Grrr !"],
      battleWin: ["Victoire de flamme !", "Trop facile !", "Incinéré !"],
      battleLose: ["Aïe...", "Je fume...", "Il me faut de l'énergie..."],
      evolve: ["Ignition !", "Brasier total !", "Explosion solaire !"],
      idleHappy: ["Tout chaud !", "Héhé !", "Petite flamme !"],
      idleHungry: ["J'ai faim...", "Il me faut du carburant...", "Ventre froid..."]
    }
  },
  water: {
    familyName: "Bubbli",
    stageNames: ["Goutin", "Riploutre", "Maroracle"],
    emotes: ["💧", "🦭", "🐉"],
    aura: "from-cyan-200 via-sky-300 to-blue-400",
    body: "from-cyan-100 to-sky-300",
    accent: "bg-sky-500",
    reactions: {
      feed: ["Glou glou !", "Super frais !", "Miam vague !"],
      harvest: ["Récolte splash !", "Bonus bulle !", "Butin goutte !"],
      train: ["Mode courant !", "Vitesse aquatique !", "Esprit profond !"],
      battleWin: ["La marée gagne !", "Trempé !", "Vague finale !"],
      battleLose: ["Je suis vidé...", "Pause eau...", "Marée basse..."],
      evolve: ["Marée montante !", "Appel de l'océan !", "Profondeur éveillée !"],
      idleHappy: ["Bloup !", "Brise fraîche !", "Splash joyeux !"],
      idleHungry: ["Un snack ?", "J'ai faim...", "Besoin de bouchées..."]
    }
  },
  plant: {
    familyName: "Budsy",
    stageNames: ["Poussinfeuille", "Vinelynx", "Couronneverte"],
    emotes: ["🌱", "🐱", "🦌"],
    aura: "from-lime-200 via-emerald-300 to-green-500",
    body: "from-lime-100 to-emerald-300",
    accent: "bg-green-500",
    reactions: {
      feed: ["Croque !", "Délicieux !", "Ça fleurit !"],
      harvest: ["Jolie récolte !", "Bonus nature !", "Cadeau du jardin !"],
      train: ["Racines solides !", "Vignes rapides !", "Esprit calme !"],
      battleWin: ["La nature triomphe !", "Frappe fleurie !", "Rugissement vert !"],
      battleLose: ["Je fane...", "Besoin de soleil...", "Feuilles fatiguées..."],
      evolve: ["Floraison !", "Montée verdoyante !", "Couronne vivante !"],
      idleHappy: ["Soleil !", "Air pur !", "Bloom bloom !"],
      idleHungry: ["Besoin d'énergie...", "Racines vides...", "J'ai faim..."]
    }
  },
  electric: {
    familyName: "Sparky",
    stageNames: ["Etincel", "Voltifox", "Stormraptor"],
    emotes: ["⚡", "🦝", "🦅"],
    aura: "from-yellow-200 via-lime-300 to-emerald-400",
    body: "from-yellow-100 to-lime-300",
    accent: "bg-yellow-500",
    reactions: {
      feed: ["Zzap snack !", "Croque-éclair !", "Chargé !"],
      harvest: ["Récolte électrique !", "Bonus zap !", "Butin crépitant !"],
      train: ["Turbo réflexe !", "Vitesse éclair !", "Tension max !"],
      battleWin: ["Choc victorieux !", "K.O. statique !", "Orage final !"],
      battleLose: ["Batterie faible...", "Plus d'étincelle...", "Recharge..."] ,
      evolve: ["Surcharge !", "Montée tonnerre !", "Forme tempête !"],
      idleHappy: ["Zzip !", "Bzzz !", "Étincelles !"],
      idleHungry: ["Faim électrique...", "Besoin de charge...", "Volts faibles..."]
    }
  }
};

export const getCreatureFamily = (type: CreatureType) => roster[type];

export const getCreatureStageName = (type: CreatureType, stage: number) => {
  const idx = Math.max(1, Math.min(3, stage)) - 1;
  return roster[type].stageNames[idx];
};

export const getCreatureEmote = (type: CreatureType, stage: number) => {
  const idx = Math.max(1, Math.min(3, stage)) - 1;
  return roster[type].emotes[idx];
};

export const getCreatureReaction = (type: CreatureType, context: ReactionContext) => {
  const pool = roster[type].reactions[context];
  return pool[Math.floor(Math.random() * pool.length)] ?? "...";
};

// ==================================================================
// MESSAGES CONTEXTUELS KAWAII (bulle au-dessus de la créature)
// ==================================================================
export type CreatureMoodKind = "alert" | "suggest" | "love" | "idle" | "tired" | "happy";

export interface CreatureMessage {
  text: string;
  kind: CreatureMoodKind;
}

interface MessageContext {
  hunger: number;      // 0-100
  happiness: number;   // 0-100
  energy: number;      // 0-energyMax
  energyMax: number;
  evolutionReady: boolean;
  bossReady: boolean;
  hasReadyCrop: boolean;
  name: string;
}

const RNG = () => Math.random();

// Pool kawaii adapté à un enfant
const MESSAGES_FROM = {
  starving: [
    "J'ai trop faim 😭",
    "Mon ventre fait des bruits...",
    "Donne-moi à manger steup !",
    "Je vais m'évanouir..."
  ],
  hungry: [
    "J'ai un peu faim...",
    "Une bouchée ? 🥺",
    "Mon ventre gargouille",
  ],
  sad: [
    "Je suis triste...",
    "Fais-moi un câlin ? 🥹",
    "Joue avec moi steplé"
  ],
  tired: [
    "Je suis crevé(e)...",
    "On fait une pause ?",
    "Zzz... attends que je récupère"
  ],
  superHappy: [
    "Trop content(e) !",
    "Je te fais un bisou 💋",
    "T'es le meilleur dresseur !",
    "Yeahhh ! 🎉"
  ],
  wellFed: [
    "Miam c'était bon !",
    "J'ai le ventre plein ~",
    "Je pète la forme !"
  ],
  energized: [
    "J'ai la pêche !",
    "Allez on y va !",
    "Trop d'énergie là !"
  ],
  evolveReady: [
    "Je sens que je vais grandir !",
    "Fais-moi évoluer !",
    "Plus fort, plus fort !"
  ],
  bossReady: [
    "Un BOSS rôde par ici...",
    "On l'affronte ?!",
    "J'ai senti une présence forte"
  ],
  cropReady: [
    "La récolte est prête !",
    "Ça sent bon le jardin",
    "Viens cueillir vite"
  ],
  suggestPlay: [
    "On joue ?",
    "On va combattre ?",
    "Allez, à l'entraînement !"
  ],
  idle: [
    "Tout va bien ✨",
    "Je t'aime bien tu sais",
    "Coucou !",
    "On fait quoi maintenant ?",
    "Je suis bien là"
  ]
};

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export const getCreatureMessage = (ctx: MessageContext): CreatureMessage => {
  const energyRatio = ctx.energyMax > 0 ? ctx.energy / ctx.energyMax : 0;

  // Priorité aux alertes urgentes
  if (ctx.hunger < 15) return { text: pick(MESSAGES_FROM.starving), kind: "alert" };
  if (ctx.happiness < 25) return { text: pick(MESSAGES_FROM.sad), kind: "love" };
  if (ctx.hunger < 30) return { text: pick(MESSAGES_FROM.hungry), kind: "alert" };
  if (energyRatio < 0.25) return { text: pick(MESSAGES_FROM.tired), kind: "tired" };

  // Évolution / boss : opportunités fortes
  if (ctx.evolutionReady) return { text: pick(MESSAGES_FROM.evolveReady), kind: "suggest" };
  if (ctx.bossReady) return { text: pick(MESSAGES_FROM.bossReady), kind: "suggest" };
  if (ctx.hasReadyCrop) return { text: pick(MESSAGES_FROM.cropReady), kind: "suggest" };

  // Buffs positifs
  if (ctx.happiness > 85 && ctx.hunger > 60) {
    return RNG() < 0.6
      ? { text: pick(MESSAGES_FROM.superHappy), kind: "happy" }
      : { text: pick(MESSAGES_FROM.suggestPlay), kind: "suggest" };
  }
  if (ctx.hunger > 70) return { text: pick(MESSAGES_FROM.wellFed), kind: "happy" };
  if (energyRatio > 0.85) return { text: pick(MESSAGES_FROM.energized), kind: "happy" };

  // Idle générique
  return RNG() < 0.7
    ? { text: pick(MESSAGES_FROM.idle), kind: "idle" }
    : { text: pick(MESSAGES_FROM.suggestPlay), kind: "suggest" };
};
