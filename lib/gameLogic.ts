
import {
  BattleAction,
  BattleTurnResult,
  CapturedEntry,
  Creature,
  CreatureSpecies,
  CreatureStatKey,
  CreatureType,
  CropPlot,
  CropType,
  DailyQuest,
  DailyQuestKind,
  DailyQuestsState,
  Enemy,
  EnemyBehavior,
  EnemyTemperament,
  EvolutionProgress,
  MasteryEntry,
  MasteryMap,
  MultiplicationQuestion,
  NextUnlockInfo,
  PlayerProgress,
  PlayerState,
  QuestionRange,
  TrainingFocus
} from "@/lib/types";
import { defaultSpeciesForType, SPECIES_META, SPECIES_TYPE } from "@/lib/creatureVisuals";

export const ALL_TABLES = [3, 4, 5, 6, 7, 8, 9, 10] as const;

export interface AnswerResolution {
  nextState: PlayerState;
  isCorrect: boolean;
  xpGain: number;
  coinsGain: number;
  streak: number;
  mastery: MasteryEntry;
}

interface BattleTurnInput {
  action: BattleAction;
  currentEnemyHp: number;
  currentPlayerHp: number;
  isCorrect: boolean;
  answerTimeMs: number;
  combo: number;
  creature: Creature;
  enemy: Enemy;
  guardActive: boolean;
  // Optionnels : si fournis, la baisse d'énergie réduit aussi les dégâts
  playerEnergy?: number;
  playerEnergyMax?: number;
}

// =================================================
// ACHIEVEMENTS
// =================================================
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (state: PlayerState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_battle", name: "Premier sang", description: "Gagner un combat", icon: "⚔️", check: (s) => s.progress.battlesWon >= 1 },
  { id: "ten_battles", name: "Aguerri", description: "Gagner 10 combats", icon: "🏆", check: (s) => s.progress.battlesWon >= 10 },
  { id: "first_evolution", name: "Métamorphose", description: "Première évolution", icon: "✨", check: (s) => s.creatures.some((c) => c.evolution_stage >= 2) },
  { id: "final_form", name: "Forme finale", description: "Atteindre la forme 3", icon: "🌟", check: (s) => s.creatures.some((c) => c.evolution_stage >= 3) },
  { id: "first_boss", name: "Tombeur de boss", description: "Battre un boss de zone", icon: "👑", check: (s) => Object.values(s.progress.zoneBossesBeaten ?? {}).some(Boolean) },
  { id: "all_bosses", name: "Maître des zones", description: "Battre tous les boss", icon: "🛡️", check: (s) => [1, 2, 3].every((z) => s.progress.zoneBossesBeaten?.[z]) },
  { id: "level_10", name: "Vétéran", description: "Atteindre niveau 10 joueur", icon: "⭐", check: (s) => s.progress.level >= 10 },
  { id: "mastery_50", name: "Apprenti", description: "Maîtriser 50% des paires", icon: "🧠", check: (s) => {
    const total = Object.keys(s.mastery).length;
    if (total === 0) return false;
    const mastered = Object.values(s.mastery).filter((m) => m.mastered).length;
    return mastered / total >= 0.5;
  }},
  { id: "naturalist", name: "Naturaliste", description: "Rencontrer les 4 types d'ennemis", icon: "🔍", check: (s) => {
    const seen = s.progress.seenEnemies ?? {};
    return Boolean(seen.fire && seen.water && seen.plant && seen.electric);
  }},
  { id: "harvester", name: "Récolteur", description: "Récolter 20 cultures", icon: "🌾", check: (s) => (s.progress.totalHarvests ?? 0) >= 20 },
  { id: "streak_3", name: "Régulier", description: "3 jours de jeu d'affilée", icon: "🔥", check: (s) => (s.progress.streakDays ?? 0) >= 3 },
  { id: "streak_7", name: "Discipliné", description: "7 jours d'affilée", icon: "🌠", check: (s) => (s.progress.streakDays ?? 0) >= 7 },
];

export const checkAchievements = (state: PlayerState): PlayerState => {
  const owned = new Set(state.progress.achievements ?? []);
  const newlyEarned: string[] = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!owned.has(a.id) && a.check(state)) {
      owned.add(a.id);
      newlyEarned.push(a.id);
    }
  });
  if (newlyEarned.length === 0) return state;
  return {
    ...state,
    progress: { ...state.progress, achievements: Array.from(owned) }
  };
};

// =================================================
// STREAK JOURNALIER
// =================================================
const dayKey = (d: Date = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const checkDailyStreak = (state: PlayerState): { state: PlayerState; awarded: boolean; bonus?: { coins: number; xp: number } } => {
  const today = dayKey();
  if (state.progress.lastPlayDay === today) return { state, awarded: false };

  const lastDay = state.progress.lastPlayDay;
  let streak = state.progress.streakDays ?? 0;
  if (lastDay) {
    // Calcul du delta en jours
    const last = new Date(lastDay + "T00:00:00");
    const now = new Date(today + "T00:00:00");
    const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak += 1;
    else if (diffDays > 1) streak = 1; // streak cassé
  } else {
    streak = 1;
  }

  // Bonus de connexion
  const bonusCoins = 10 + Math.min(50, streak * 5);
  const bonusXp = 5 + Math.min(40, streak * 4);

  const next = {
    ...state,
    progress: {
      ...state.progress,
      lastPlayDay: today,
      streakDays: streak,
      coins: state.progress.coins + bonusCoins,
      xp: state.progress.xp + bonusXp
    }
  };
  return { state: checkAchievements(next), awarded: true, bonus: { coins: bonusCoins, xp: bonusXp } };
};

// ============================================================
// QUÊTES JOURNALIÈRES
// ============================================================
type QuestTemplate = {
  kind: DailyQuestKind;
  label: (target: number) => string;
  target: number;
  reward: { coins: number; xp: number; rare?: number };
};

const QUEST_POOL: QuestTemplate[] = [
  { kind: "harvest",      label: (n) => `Récolter ${n} cultures`,        target: 3, reward: { coins: 25, xp: 15 } },
  { kind: "harvest",      label: (n) => `Récolter ${n} cultures`,        target: 5, reward: { coins: 45, xp: 25 } },
  { kind: "battles",      label: (n) => `Gagner ${n} combats`,           target: 2, reward: { coins: 30, xp: 25 } },
  { kind: "battles",      label: (n) => `Gagner ${n} combats`,           target: 4, reward: { coins: 60, xp: 50, rare: 1 } },
  { kind: "feed",         label: (n) => `Nourrir ${n} fois ta créature`, target: 3, reward: { coins: 20, xp: 15 } },
  { kind: "combo",        label: (n) => `Combo ×${n} en atelier`,        target: 4, reward: { coins: 35, xp: 30 } },
  { kind: "combo",        label: (n) => `Combo ×${n} en atelier`,        target: 6, reward: { coins: 60, xp: 50 } },
  { kind: "boss",         label: ()  => `Vaincre un boss`,               target: 1, reward: { coins: 80, xp: 60, rare: 1 } },
  { kind: "capture",      label: (n) => `Capturer ${n} ennemi`,          target: 1, reward: { coins: 50, xp: 40 } },
  { kind: "spend_energy", label: (n) => `Dépenser ${n} énergie`,         target: 8, reward: { coins: 25, xp: 20 } },
];

// Picker pseudo-aléatoire stable par jour (chaque jour génère les mêmes 3 quêtes pour tous les joueurs)
const pickDailyQuests = (day: string): DailyQuest[] => {
  // Hash très simple basé sur la date pour répartir
  let seed = 0;
  for (let i = 0; i < day.length; i += 1) seed = (seed * 31 + day.charCodeAt(i)) >>> 0;

  const candidates = QUEST_POOL.slice();
  const picked: DailyQuest[] = [];
  // On évite 2 quêtes du même kind
  const usedKinds = new Set<DailyQuestKind>();
  while (picked.length < 3 && candidates.length > 0) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % candidates.length;
    const tpl = candidates.splice(idx, 1)[0];
    if (usedKinds.has(tpl.kind)) continue;
    usedKinds.add(tpl.kind);
    picked.push({
      id: `${day}-${tpl.kind}-${tpl.target}`,
      kind: tpl.kind,
      label: tpl.label(tpl.target),
      target: tpl.target,
      progress: 0,
      reward: tpl.reward,
      claimed: false
    });
  }
  return picked;
};

const todayDayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const refreshDailyQuests = (state: PlayerState): PlayerState => {
  const today = todayDayKey();
  if (state.progress.dailyQuests?.day === today) return state;
  const quests = pickDailyQuests(today);
  return {
    ...state,
    progress: {
      ...state.progress,
      dailyQuests: { day: today, quests },
      energySpentToday: 0
    }
  };
};

// Incrémente le progrès des quêtes selon l'événement
type QuestEvent =
  | { kind: "harvest"; amount?: number }
  | { kind: "battles"; amount?: number }
  | { kind: "feed"; amount?: number }
  | { kind: "combo"; value: number }
  | { kind: "boss"; amount?: number }
  | { kind: "capture"; amount?: number }
  | { kind: "spend_energy"; amount: number };

export const progressQuests = (state: PlayerState, event: QuestEvent): PlayerState => {
  if (!state.progress.dailyQuests) return state;
  const quests = state.progress.dailyQuests.quests.map((q) => {
    if (q.claimed) return q;
    if (q.kind !== event.kind) return q;
    if (event.kind === "combo") {
      // Quête "combo" se valide si la valeur atteinte est >= target
      return { ...q, progress: Math.max(q.progress, event.value) };
    }
    const delta = event.amount ?? 1;
    return { ...q, progress: Math.min(q.target, q.progress + delta) };
  });
  return {
    ...state,
    progress: { ...state.progress, dailyQuests: { ...state.progress.dailyQuests, quests } }
  };
};

export const claimQuestReward = (state: PlayerState, questId: string): { ok: boolean; nextState: PlayerState; reward?: DailyQuest["reward"] } => {
  if (!state.progress.dailyQuests) return { ok: false, nextState: state };
  const quest = state.progress.dailyQuests.quests.find((q) => q.id === questId);
  if (!quest || quest.claimed) return { ok: false, nextState: state };
  if (quest.progress < quest.target) return { ok: false, nextState: state };
  const quests = state.progress.dailyQuests.quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );
  return {
    ok: true,
    reward: quest.reward,
    nextState: {
      ...state,
      progress: {
        ...state.progress,
        coins: state.progress.coins + quest.reward.coins,
        xp: state.progress.xp + quest.reward.xp,
        rareMaterial: state.progress.rareMaterial + (quest.reward.rare ?? 0),
        dailyQuests: { ...state.progress.dailyQuests, quests }
      }
    }
  };
};

// ============================================================
// COMBO DE VICTOIRES (multiplicateur de loot)
// ============================================================
export const getWinStreakMultiplier = (streak: number): number => {
  if (streak >= 7) return 2;
  if (streak >= 5) return 1.6;
  if (streak >= 3) return 1.3;
  return 1;
};

// ============================================================
// CAPTURE D'ENNEMIS
// ============================================================
export const isAlreadyCaptured = (state: PlayerState, species: CreatureSpecies): boolean => {
  return Boolean(state.progress.captured?.[species]);
};

export const recordCapture = (
  state: PlayerState,
  enemy: Enemy
): { state: PlayerState; firstCapture: boolean; addedToTeam: boolean; stageUpgraded: boolean; previousBestStage: 1 | 2 | 3 | 0 } => {
  const species = enemy.species;
  const captured = { ...(state.progress.captured ?? {}) };
  const existing = captured[species];
  const firstCapture = !existing;
  const previousBestStage: 1 | 2 | 3 | 0 = existing?.bestStage ?? 0;
  // Le stage de l'ennemi vaincu remplace le précédent s'il est strictement supérieur
  const stageUpgraded = !firstCapture && enemy.stage > previousBestStage;
  const newBestStage: 1 | 2 | 3 = (Math.max(previousBestStage, enemy.stage) || enemy.stage) as 1 | 2 | 3;
  const recordStats = stageUpgraded || firstCapture
    ? {
        attack: enemy.attack,
        speed: enemy.speed,
        defense: enemy.defense,
        maxHp: enemy.maxHp,
        difficulty: enemy.difficulty
      }
    : existing?.bestStats;

  captured[species] = {
    species,
    count: (existing?.count ?? 0) + 1,
    firstCapturedAt: existing?.firstCapturedAt ?? Date.now(),
    bestStage: newBestStage,
    bestStats: recordStats,
    bestCapturedAt: stageUpgraded || firstCapture ? Date.now() : existing?.bestCapturedAt
  };

  // Si la species n'est pas encore dans l'équipe : on l'ajoute (stage 1, neuve, comme un Pokemon fraîchement capturé)
  const alreadyInTeam = state.creatures.some((c) => (c.species ?? defaultSpeciesForType(c.type)) === species);
  let creatures = state.creatures;
  let addedToTeam = false;
  if (!alreadyInTeam) {
    const poolEntry = CREATURE_POOL.find((p) => p.species === species);
    const idx = poolEntry ? CREATURE_POOL.findIndex((p) => p.species === species) : 0;
    const newCreature: Creature = {
      id: `creature-captured-${species}-${Date.now()}`,
      name: poolEntry?.name ?? SPECIES_META[species].stageNames[0],
      type: SPECIES_TYPE[species],
      species,
      multiplication_table: poolEntry?.table ?? SPECIES_META[species].table,
      level: 1,
      xp: 0,
      happiness: 70,
      hunger: 75,
      evolution_stage: 1,
      correctStreak: 0,
      specialUnlocked: false,
      stats: {
        attack: 12 + Math.floor(idx * 1.5),
        speed: 10 + Math.floor(idx * 1.5),
        intelligence: 10 + Math.floor(idx * 1.5),
        defense: 8 + Math.floor(idx / 1.5)
      }
    };
    creatures = [...state.creatures, newCreature];
    addedToTeam = true;
  }

  return {
    firstCapture,
    addedToTeam,
    stageUpgraded,
    previousBestStage,
    state: {
      ...state,
      creatures,
      progress: {
        ...state.progress,
        captured,
        totalCaptured: (state.progress.totalCaptured ?? 0) + 1
      }
    }
  };
};

const ZONE_TABLES: Record<number, number[]> = {
  1: [3, 4],
  2: [5, 6],
  3: [7, 8],
  4: [9, 10]
};

const ZONE_NAMES = ["Grassland", "Forest", "Mountain", "Volcano"];

// Pool de 10 espèces (une species par entrée). Ordre = ordre de déblocage.
export const CREATURE_POOL: Array<{ species: CreatureSpecies; name: string; type: CreatureType; table: number }> = [
  { species: "braise",  name: "Flamy",    type: "fire",     table: 3 },
  { species: "eau",     name: "Bubbli",   type: "water",    table: 4 },
  { species: "foret",   name: "Leafy",    type: "plant",    table: 5 },
  { species: "eclair",  name: "Zappi",    type: "electric", table: 6 },
  { species: "cristal", name: "Prismi",   type: "electric", table: 7 },
  { species: "vent",    name: "Briso",    type: "water",    table: 8 },
  { species: "roche",   name: "Pébou",    type: "plant",    table: 9 },
  { species: "fleur",   name: "Pétali",   type: "plant",    table: 10 },
  { species: "ombre",   name: "Pénombi",  type: "fire",     table: 4 },
  { species: "givre",   name: "Flocon",   type: "water",    table: 5 }
];

// Boss : un par zone, plus puissant, name dédié
const BOSS_NAMES: Record<number, { name: string; type: CreatureType }> = {
  1: { name: "Brutos l'Ombre des Plaines", type: "plant" },
  2: { name: "Glacius le Mirage", type: "water" },
  3: { name: "Pierraille le Titan", type: "electric" },
  4: { name: "Ignifer le Calciné", type: "fire" }
};

const CROP_CONFIG: Record<
  CropType,
  { label: string; durationMs: number; food: number; coins: number; rareChance: number; rareDrop: number; seedCost: number; unlockZone: number; xp: number; happiness: number }
> = {
  fast: {
    label: "Pousse Rapide",
    durationMs: 2 * 60 * 1000,
    food: 3,
    coins: 4,
    rareChance: 0.03,
    rareDrop: 0,
    seedCost: 4,
    unlockZone: 1,
    xp: 3,
    happiness: 1
  },
  medium: {
    label: "Buisson a Baies",
    durationMs: 6 * 60 * 1000,
    food: 6,
    coins: 10,
    rareChance: 0.1,
    rareDrop: 1,
    seedCost: 8,
    unlockZone: 2,
    xp: 7,
    happiness: 3
  },
  slow: {
    label: "Racine Doree",
    durationMs: 12 * 60 * 1000,
    food: 10,
    coins: 18,
    rareChance: 0.2,
    rareDrop: 2,
    seedCost: 14,
    unlockZone: 3,
    xp: 14,
    happiness: 6
  }
};

// Cycle équilibré 1:1 : chaque type a exactement 1 force + 1 faiblesse + 2 neutres
// 🔥 Feu bat 🌿 Plante (brûle), faible vs 💧 Eau
// 💧 Eau bat 🔥 Feu (éteint), faible vs ⚡ Électrique
// ⚡ Électrique bat 💧 Eau (électrocute), faible vs 🌿 Plante
// 🌿 Plante bat ⚡ Électrique (s'enracine, met à la terre), faible vs 🔥 Feu
export const TYPE_ADVANTAGE: Record<CreatureType, CreatureType> = {
  fire: "plant",
  water: "fire",
  electric: "water",
  plant: "electric"
};

// Calculé depuis TYPE_ADVANTAGE : chaque type est faible vs celui qui l'a comme advantage
export const TYPE_WEAKNESS: Record<CreatureType, CreatureType> = (() => {
  const w: Partial<Record<CreatureType, CreatureType>> = {};
  (Object.keys(TYPE_ADVANTAGE) as CreatureType[]).forEach((attacker) => {
    const target = TYPE_ADVANTAGE[attacker];
    w[target] = attacker;
  });
  return w as Record<CreatureType, CreatureType>;
})();

export type TypeMatchupKind = "advantage" | "disadvantage" | "neutral";
export interface TypeMatchup {
  kind: TypeMatchupKind;
  playerMul: number;   // multiplicateur quand le joueur attaque (1.25 / 0.82 / 1)
  enemyMul: number;    // multiplicateur quand l'ennemi attaque (1.25 / 0.82 / 1)
  label: string;       // texte court pour la UI
  hint: string;        // une phrase pédagogique
}

export const getTypeMatchup = (playerType: CreatureType, enemyType: CreatureType): TypeMatchup => {
  const playerHasAdv = TYPE_ADVANTAGE[playerType] === enemyType;
  const enemyHasAdv = TYPE_ADVANTAGE[enemyType] === playerType;
  if (playerHasAdv) {
    return {
      kind: "advantage",
      playerMul: 1.25,
      enemyMul: 0.82,
      label: "Avantage",
      hint: "Tes attaques font +25% de dégâts et tu encaisses moins. Fonce !"
    };
  }
  if (enemyHasAdv) {
    return {
      kind: "disadvantage",
      playerMul: 0.82,
      enemyMul: 1.25,
      label: "Désavantage",
      hint: "L'ennemi te surclasse : pense à Garde / Esquive pour limiter la casse."
    };
  }
  return {
    kind: "neutral",
    playerMul: 1,
    enemyMul: 1,
    label: "Match neutre",
    hint: "Aucun bonus de type. Combat à la régulière."
  };
};

const LEVEL_XP_STEP = 115;
const CREATURE_XP_STEP = 90;
const ENERGY_REGEN_MS = 3 * 60 * 1000;        // 3 min par défaut
const ENERGY_REGEN_FAST_MS = 2 * 60 * 1000;   // 2 min si bonheur > 75
const NEEDS_DECAY_MS = 6 * 60 * 1000;

// Durée actuelle de régen, fonction du bonheur de la créature active
const energyRegenMsFor = (state: PlayerState): number => {
  const c = state.creatures.find((cr) => cr.id === state.progress.currentCreatureId);
  if (c && c.happiness > 75) return ENERGY_REGEN_FAST_MS;
  return ENERGY_REGEN_MS;
};

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const getNow = () => Date.now();

const shuffle = <T>(arr: T[]): T[] => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const masteryRate = (entry?: MasteryEntry) => {
  if (!entry || entry.attempts === 0) {
    return 0;
  }
  return entry.correct / entry.attempts;
};

const createCreature = (seedIndex: number): Creature => {
  const base = CREATURE_POOL[seedIndex];
  return {
    id: `creature-${seedIndex + 1}`,
    name: base.name,
    type: base.type,
    species: base.species,
    multiplication_table: base.table,
    level: 1,
    xp: 0,
    happiness: 68,
    hunger: 72,
    evolution_stage: 1,
    correctStreak: 0,
    specialUnlocked: false,
    stats: {
      attack: 12 + Math.floor(seedIndex * 1.5),
      speed: 10 + Math.floor(seedIndex * 1.5),
      intelligence: 10 + Math.floor(seedIndex * 1.5),
      defense: 8 + Math.floor(seedIndex / 1.5)
    }
  };
};

const createStarterPlots = (): CropPlot[] => {
  const now = getNow();
  return [
    { id: "plot-1", cropType: "fast", plantedAt: now - CROP_CONFIG.fast.durationMs, readyAt: now },
    { id: "plot-2", cropType: null, plantedAt: null, readyAt: null },
    { id: "plot-3", cropType: null, plantedAt: null, readyAt: null }
  ];
};

const defaultProgress = (currentCreatureId: string): PlayerProgress => {
  const now = getNow();
  return {
    level: 1,
    xp: 0,
    coins: 24,
    food: 6,
    energy: 10,
    energyMax: 10,
    seeds: { fast: 4, medium: 1, slow: 0 },
    rareMaterial: 0,
    battlesWon: 0,
    unlockedZones: 1,
    unlockedTables: [...ZONE_TABLES[1]],
    unlockedCreatures: 1,
    currentCreatureId,
    farmPlotLevel: 1,
    plots: createStarterPlots(),
    lastEnergyTickAt: now,
    lastNeedsTickAt: now,
    objective: "Recolte ta premiere culture et nourris ta creature."
  };
};

const mergeMastery = (mastery?: MasteryMap): MasteryMap => {
  if (!mastery || typeof mastery !== "object") {
    return {};
  }

  const merged: MasteryMap = {};
  Object.entries(mastery).forEach(([key, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const attempts = Number.isFinite(entry.attempts) ? entry.attempts : 0;
    const correct = Number.isFinite(entry.correct) ? entry.correct : 0;
    const errors = Number.isFinite(entry.errors) ? entry.errors : 0;
    const successRate = attempts > 0 ? correct / attempts : 0;
    merged[key] = {
      attempts,
      correct,
      errors,
      successRate,
      mastered: attempts >= 6 && successRate >= 0.8,
      avgResponseMs: Number.isFinite(entry.avgResponseMs) ? entry.avgResponseMs : 2800
    };
  });

  return merged;
};

const sanitizePlots = (plots: CropPlot[] | undefined): CropPlot[] => {
  if (!Array.isArray(plots) || plots.length === 0) {
    return createStarterPlots();
  }

  return plots.slice(0, 4).map((plot, index) => ({
    id: plot.id || `plot-${index + 1}`,
    cropType: plot.cropType ?? null,
    plantedAt: Number.isFinite(plot.plantedAt) ? plot.plantedAt : null,
    readyAt: Number.isFinite(plot.readyAt) ? plot.readyAt : null
  }));
};

export const createInitialState = (seed?: Partial<PlayerState>): PlayerState => {
  const firstCreature = createCreature(0);

  const creatures =
    Array.isArray(seed?.creatures) && seed.creatures.length > 0
      ? seed.creatures.map((c, index) => {
          const base = createCreature(index < CREATURE_POOL.length ? index : 0);
          return {
            ...base,
            ...c,
            // Rétrocompat : si pas de species dans la save, on la devine depuis le type
            species: c.species ?? base.species ?? defaultSpeciesForType(c.type ?? base.type),
            level: clamp(Number(c.level ?? base.level), 1, 60),
            xp: Math.max(0, Number(c.xp ?? base.xp)),
            happiness: clamp(Number(c.happiness ?? base.happiness), 0, 100),
            hunger: clamp(Number(c.hunger ?? base.hunger), 0, 100),
            evolution_stage: clamp(Number(c.evolution_stage ?? base.evolution_stage), 1, 3),
            correctStreak: Math.max(0, Number(c.correctStreak ?? 0)),
            specialUnlocked: Boolean(c.specialUnlocked ?? false),
            stats: {
              ...base.stats,
              ...c.stats,
              attack: Math.max(6, Number(c.stats?.attack ?? base.stats.attack)),
              speed: Math.max(6, Number(c.stats?.speed ?? base.stats.speed)),
              intelligence: Math.max(6, Number(c.stats?.intelligence ?? base.stats.intelligence)),
              defense: Math.max(4, Number(c.stats?.defense ?? base.stats.defense))
            }
          };
        })
      : [firstCreature];

  const seededProgress = seed?.progress && typeof seed.progress === "object" ? seed.progress : undefined;
  const defaults = defaultProgress(creatures[0].id);

  const progress: PlayerProgress = {
    ...defaults,
    ...seededProgress,
    level: clamp(Number(seededProgress?.level ?? defaults.level), 1, 100),
    xp: Math.max(0, Number(seededProgress?.xp ?? defaults.xp)),
    coins: Math.max(0, Number(seededProgress?.coins ?? defaults.coins)),
    food: Math.max(0, Number(seededProgress?.food ?? defaults.food)),
    energy: Math.max(0, Number(seededProgress?.energy ?? defaults.energy)),
    energyMax: clamp(Number(seededProgress?.energyMax ?? defaults.energyMax), 8, 24),
    seeds: {
      fast: Math.max(0, Number(seededProgress?.seeds?.fast ?? defaults.seeds.fast)),
      medium: Math.max(0, Number(seededProgress?.seeds?.medium ?? defaults.seeds.medium)),
      slow: Math.max(0, Number(seededProgress?.seeds?.slow ?? defaults.seeds.slow))
    },
    rareMaterial: Math.max(0, Number(seededProgress?.rareMaterial ?? defaults.rareMaterial)),
    battlesWon: Math.max(0, Number(seededProgress?.battlesWon ?? defaults.battlesWon)),
    unlockedZones: clamp(Number(seededProgress?.unlockedZones ?? defaults.unlockedZones), 1, 4),
    unlockedTables: Array.isArray(seededProgress?.unlockedTables)
      ? seededProgress.unlockedTables.filter((n): n is number => Number.isFinite(n) && n >= 2 && n <= 10)
      : defaults.unlockedTables,
    unlockedCreatures: clamp(Number(seededProgress?.unlockedCreatures ?? defaults.unlockedCreatures), 1, CREATURE_POOL.length),
    currentCreatureId: seededProgress?.currentCreatureId ?? defaults.currentCreatureId,
    farmPlotLevel: clamp(Number(seededProgress?.farmPlotLevel ?? defaults.farmPlotLevel), 1, 4),
    plots: sanitizePlots(seededProgress?.plots),
    lastEnergyTickAt: Number(seededProgress?.lastEnergyTickAt ?? defaults.lastEnergyTickAt),
    lastNeedsTickAt: Number(seededProgress?.lastNeedsTickAt ?? defaults.lastNeedsTickAt),
    objective: typeof seededProgress?.objective === "string" ? seededProgress.objective : defaults.objective,
    // Nouveaux champs (rétrocompatibles)
    zoneVictories: seededProgress?.zoneVictories ?? {},
    seenEnemies: seededProgress?.seenEnemies ?? {},
    achievements: Array.isArray(seededProgress?.achievements) ? seededProgress.achievements : [],
    lastPlayDay: typeof seededProgress?.lastPlayDay === "string" ? seededProgress.lastPlayDay : undefined,
    streakDays: Number.isFinite(seededProgress?.streakDays) ? seededProgress?.streakDays : 0,
    zoneBossesBeaten: seededProgress?.zoneBossesBeaten ?? {},
    dailyQuests: seededProgress?.dailyQuests,
    winStreak: Number.isFinite(seededProgress?.winStreak) ? seededProgress?.winStreak : 0,
    bestWinStreak: Number.isFinite(seededProgress?.bestWinStreak) ? seededProgress?.bestWinStreak : 0,
    captured: seededProgress?.captured ?? {},
    seenSpecies: seededProgress?.seenSpecies ?? {},
    seenBest: seededProgress?.seenBest ?? {},
    totalHarvests: Number.isFinite(seededProgress?.totalHarvests) ? seededProgress?.totalHarvests : 0,
    totalFeeds: Number.isFinite(seededProgress?.totalFeeds) ? seededProgress?.totalFeeds : 0,
    totalCaptured: Number.isFinite(seededProgress?.totalCaptured) ? seededProgress?.totalCaptured : 0,
    bestComboTrain: Number.isFinite(seededProgress?.bestComboTrain) ? seededProgress?.bestComboTrain : 0,
    energySpentToday: Number.isFinite(seededProgress?.energySpentToday) ? seededProgress?.energySpentToday : 0
  };

  progress.energy = clamp(progress.energy, 0, progress.energyMax);
  // Toujours retirer la table de 2 (concept: trop facile, sur-représentée)
  progress.unlockedTables = progress.unlockedTables.filter((t) => t !== 2);
  if (progress.unlockedTables.length === 0) {
    progress.unlockedTables = [...ZONE_TABLES[1]];
  }

  if (!creatures.some((item) => item.id === progress.currentCreatureId)) {
    progress.currentCreatureId = creatures[0].id;
  }

  // Ensure switch is meaningful even on old saves: keep at least unlockedCreatures creatures available.
  let ensuredCreatures = creatures;
  while (ensuredCreatures.length < progress.unlockedCreatures) {
    ensuredCreatures = [...ensuredCreatures, createCreature(ensuredCreatures.length % CREATURE_POOL.length)];
  }

  if (!ensuredCreatures.some((item) => item.id === progress.currentCreatureId)) {
    progress.currentCreatureId = ensuredCreatures[0].id;
  }

  return {
    creatures: ensuredCreatures,
    progress,
    mastery: mergeMastery(seed?.mastery)
  };
};

export const applyTimeSystems = (state: PlayerState, now = getNow()): PlayerState => {
  let next = state;
  let changed = false;

  const regenMs = energyRegenMsFor(state);
  const energyTicks = Math.floor((now - state.progress.lastEnergyTickAt) / regenMs);
  if (energyTicks > 0) {
    next = {
      ...next,
      progress: {
        ...next.progress,
        energy: clamp(next.progress.energy + energyTicks, 0, next.progress.energyMax),
        lastEnergyTickAt: state.progress.lastEnergyTickAt + energyTicks * regenMs
      }
    };
    changed = true;
  }

  const needsTicks = Math.floor((now - state.progress.lastNeedsTickAt) / NEEDS_DECAY_MS);
  if (needsTicks > 0) {
    // On clamp les penalites pour eviter qu'une absence longue (1 jour, 1 semaine)
    // ne vide tout. La faim peut descendre a 0, mais on limite les degats par session.
    const clampedTicks = Math.min(needsTicks, 8); // max 8 ticks = ~48 minutes de degradation par retour

    next = {
      ...next,
      creatures: next.creatures.map((creature) => {
        const hunger = clamp(creature.hunger - clampedTicks * 2, 0, 100);
        const happinessPenalty = hunger < 30 ? clampedTicks : hunger < 45 ? Math.ceil(clampedTicks / 2) : 0;

        // Penalite de niveau quand la creature a tres faim trop longtemps.
        // < 15 = perte serieuse mais bornee, < 30 = perte XP seulement.
        let level = creature.level;
        let xp = creature.xp;
        if (hunger < 15) {
          // Max 3 niveaux perdus par session de retour
          const lostLevels = Math.min(level - 1, Math.min(clampedTicks, 3));
          level = Math.max(1, level - lostLevels);
          xp = 0;
        } else if (hunger < 30) {
          xp = Math.max(0, xp - clampedTicks * 12);
        }

        return {
          ...creature,
          hunger,
          happiness: clamp(creature.happiness - happinessPenalty, 0, 100),
          level,
          xp
        };
      }),
      progress: {
        ...next.progress,
        // Important: on consomme TOUT le delta de temps, meme si on n'a applique que clampedTicks
        // sinon le prochain tick va re-appliquer le retard.
        lastNeedsTickAt: state.progress.lastNeedsTickAt + needsTicks * NEEDS_DECAY_MS
      }
    };
    changed = true;
  }

  return changed ? next : state;
};

const calculateMasteryRatio = (state: PlayerState): number => {
  const entries = Object.entries(state.mastery).filter(([key]) => state.progress.unlockedTables.some((t) => key.startsWith(`${t}x`)));
  if (entries.length === 0) {
    return 0;
  }
  const mastered = entries.filter(([, m]) => m.mastered).length;
  return mastered / entries.length;
};

const getCreatureXpToNextLevel = (creature: Creature) => CREATURE_XP_STEP + (creature.level - 1) * 24;

const applyProgression = (state: PlayerState): PlayerState => {
  let next = state;
  const masteryRatio = calculateMasteryRatio(next);
  const currentCreature = getCurrentCreature(next);

  // Une nouvelle creature debloque tous les 5 niveaux du joueur.
  const unlockedCreatures = clamp(1 + Math.floor(next.progress.level / 5), 1, CREATURE_POOL.length);

  // Une nouvelle zone debloque tous les 4 niveaux de la creature active (entrainement + combats).
  const unlockedZones = clamp(1 + Math.floor(currentCreature.level / 4), 1, 4);

  const unlockedTables = Array.from(
    new Set(
      Object.entries(ZONE_TABLES)
        .filter(([zone]) => Number(zone) <= unlockedZones)
        .flatMap(([, tables]) => tables)
    )
  ).sort((a, b) => a - b);

  let creatures = next.creatures;
  while (creatures.length < unlockedCreatures) {
    creatures = [...creatures, createCreature(creatures.length)];
  }

  // L'action speciale est debloquee a partir du stage 2 d'evolution OU intelligence elevee.
  next = {
    ...next,
    creatures: creatures.map((creature) => {
      // Sort débloqué : Stage 2 d'évolution OU Intelligence ≥ 15 (atteignable en ~3 ateliers Concentration)
      const shouldUnlockSpecial = creature.specialUnlocked || creature.evolution_stage >= 2 || creature.stats.intelligence >= 15;
      return {
        ...creature,
        specialUnlocked: shouldUnlockSpecial
      };
    }),
    progress: {
      ...next.progress,
      unlockedZones,
      unlockedTables,
      unlockedCreatures
    }
  };

  // Objectif courant
  const evo = getEvolutionProgress(next, getCurrentCreature(next));
  const objective = evo.ready
    ? "Ta creature peut evoluer ! Touche le bouton evolution."
    : masteryRatio < 0.4
    ? "Entraine tes tables faibles pour progresser."
    : unlockedZones < 4
    ? `Gagne des combats pour debloquer ${ZONE_NAMES[unlockedZones]}.`
    : "Atteins le prochain palier d'evolution.";

  return {
    ...next,
    progress: {
      ...next.progress,
      objective
    }
  };
};
export const getCurrentCreature = (state: PlayerState): Creature => {
  return state.creatures.find((item) => item.id === state.progress.currentCreatureId) ?? state.creatures[0];
};

export const switchCreature = (state: PlayerState, creatureId: string): PlayerState => {
  if (!state.creatures.some((item) => item.id === creatureId)) {
    return state;
  }

  return {
    ...state,
    progress: {
      ...state.progress,
      currentCreatureId: creatureId
    }
  };
};

export const getXpToNextLevel = (state: PlayerState): number => {
  return LEVEL_XP_STEP + (state.progress.level - 1) * 34;
};

export const getZoneName = (zone: number): string => {
  return ZONE_NAMES[clamp(zone, 1, ZONE_NAMES.length) - 1] ?? ZONE_NAMES[0];
};

export const getCropConfig = (cropType: CropType) => CROP_CONFIG[cropType];

// ==================================================================
// SYSTÈME DE BESOINS (faim / bonheur / énergie) AVEC INCIDENCE RÉELLE
// ==================================================================
// Seuils unifiés, utilisés à la fois par le calcul gameplay (needsMultiplier)
// et par l'affichage des effets actifs (getStatusEffects).
//
// FAIM           : > 70 buff +10% ; 30-70 neutre ; 15-30 debuff -15% + perte XP ; < 15 debuff -30% + perte niveau
// BONHEUR        : > 75 buff +12% pièces/XP ; 30-75 neutre ; < 30 debuff -10% + 15% chance saute son tour
// ÉNERGIE (ratio): > 0.80 buff +10% XP ; 0.30-0.80 neutre ; < 0.30 debuff -20% dégâts ; 0 atelier/combat bloqués

const hungerMultiplier = (h: number) => (h > 70 ? 1.1 : h < 15 ? 0.7 : h < 30 ? 0.85 : 1);
const happyMultiplier = (h: number) => (h > 75 ? 1.12 : h < 30 ? 0.9 : 1);
const energyRatioMultiplier = (energy: number, max: number) => {
  const r = max > 0 ? energy / max : 0;
  if (r > 0.8) return 1.1;
  if (r < 0.3) return 0.8;
  return 1;
};

// Pour les dégâts/récolte : combine les 3 facteurs (la créature combat ET le joueur a de l'énergie)
const needsMultiplier = (creature: Creature, energy?: number, energyMax?: number) => {
  const e = (typeof energy === "number" && typeof energyMax === "number") ? energyRatioMultiplier(energy, energyMax) : 1;
  return hungerMultiplier(creature.hunger) * happyMultiplier(creature.happiness) * e;
};

// Multiplicateur de récompenses (XP gagné, pièces récoltées) : bonheur + énergie
export const getRewardMultiplier = (state: PlayerState): number => {
  const c = getCurrentCreature(state);
  return happyMultiplier(c.happiness) * energyRatioMultiplier(state.progress.energy, state.progress.energyMax);
};

// Saute son tour en combat ? (créature trop triste : ~15% de chance)
export const willSkipTurn = (creature: Creature): boolean => {
  if (creature.happiness >= 30) return false;
  return Math.random() < 0.15;
};

export interface StatusEffect {
  id: string;
  label: string;
  description: string;
  icon: string;
  kind: "buff" | "debuff";
  severity: "minor" | "major";
  source: "hunger" | "happiness" | "energy";
}

// Effets actifs lisibles pour l'UI.
export const getStatusEffects = (state: PlayerState): StatusEffect[] => {
  const c = getCurrentCreature(state);
  const effects: StatusEffect[] = [];

  // FAIM
  if (c.hunger > 70) {
    effects.push({ id: "well_fed", label: "Rassasié", description: "+10 % dégâts et récoltes", icon: "🍖", kind: "buff", severity: "minor", source: "hunger" });
  } else if (c.hunger < 15) {
    effects.push({ id: "starving", label: "Affamé", description: "-30 % dégâts · perd des niveaux !", icon: "💀", kind: "debuff", severity: "major", source: "hunger" });
  } else if (c.hunger < 30) {
    effects.push({ id: "hungry", label: "Faim", description: "-15 % dégâts · perd de l'XP", icon: "🥺", kind: "debuff", severity: "minor", source: "hunger" });
  }

  // BONHEUR
  if (c.happiness > 75) {
    effects.push({ id: "happy", label: "Heureux", description: "+12 % récompenses (XP, pièces)", icon: "💖", kind: "buff", severity: "minor", source: "happiness" });
  } else if (c.happiness < 30) {
    effects.push({ id: "sad", label: "Triste", description: "-10 % dégâts · 15 % de rater son tour", icon: "😢", kind: "debuff", severity: "major", source: "happiness" });
  }

  // ÉNERGIE
  const ratio = state.progress.energyMax > 0 ? state.progress.energy / state.progress.energyMax : 0;
  if (ratio > 0.8) {
    effects.push({ id: "energized", label: "Plein d'énergie", description: "+10 % XP gagné", icon: "⚡", kind: "buff", severity: "minor", source: "energy" });
  } else if (ratio < 0.3) {
    effects.push({ id: "drained", label: "Fatigué", description: "-20 % dégâts · atelier impossible", icon: "🥱", kind: "debuff", severity: "major", source: "energy" });
  }

  return effects;
};

const applyXpRewards = (state: PlayerState, creatureId: string, creatureXpGain: number, playerXpGain: number, coinsGain: number): PlayerState => {
  let leveledCreature = false;

  const creatures = state.creatures.map((creature) => {
    if (creature.id !== creatureId) {
      return creature;
    }

    let xp = creature.xp + creatureXpGain;
    let level = creature.level;
    const stats = { ...creature.stats };

    while (xp >= getCreatureXpToNextLevel({ ...creature, level })) {
      xp -= getCreatureXpToNextLevel({ ...creature, level });
      level += 1;
      stats.attack += 1;
      stats.speed += 1;
      stats.intelligence += 1;
      stats.defense += 1;
      leveledCreature = true;
    }

    return {
      ...creature,
      level,
      xp,
      stats,
      happiness: clamp(creature.happiness + (leveledCreature ? 2 : 0), 0, 100)
    };
  });

  let level = state.progress.level;
  let xp = state.progress.xp + playerXpGain;
  while (xp >= (LEVEL_XP_STEP + (level - 1) * 34)) {
    xp -= LEVEL_XP_STEP + (level - 1) * 34;
    level += 1;
  }

  return {
    ...state,
    creatures,
    progress: {
      ...state.progress,
      level,
      xp,
      coins: Math.max(0, state.progress.coins + coinsGain)
    }
  };
};

const updateMasteryEntry = (entry: MasteryEntry | undefined, isCorrect: boolean, responseMs: number): MasteryEntry => {
  const attempts = (entry?.attempts ?? 0) + 1;
  const correct = (entry?.correct ?? 0) + (isCorrect ? 1 : 0);
  const errors = (entry?.errors ?? 0) + (isCorrect ? 0 : 1);
  const avgResponseMs = entry
    ? Math.round((entry.avgResponseMs * entry.attempts + responseMs) / attempts)
    : responseMs;
  const successRate = correct / attempts;

  return {
    attempts,
    correct,
    errors,
    avgResponseMs,
    successRate,
    mastered: attempts >= 6 && successRate >= 0.8
  };
};

// Evolution declenchee uniquement par le joueur (bouton "Faire evoluer").
// L'effet est multiplicatif: x1.5 (stage 2) ou x2 (stage 3) sur toutes les stats.
export const triggerEvolution = (state: PlayerState):
  { ok: boolean; nextState: PlayerState; reason?: string } => {
  const current = getCurrentCreature(state);
  const evo = getEvolutionProgress(state, current);
  if (!evo.ready) {
    return { ok: false, nextState: state, reason: "Les conditions ne sont pas reunies." };
  }

  const target = evo.stageTarget;
  if (target <= current.evolution_stage || target > 3) {
    return { ok: false, nextState: state, reason: "Pas d'evolution disponible." };
  }

  const rareCost = target >= 3 ? 2 : 1;
  if (state.progress.rareMaterial < rareCost) {
    return { ok: false, nextState: state, reason: `Il faut ${rareCost} materiau rare.` };
  }

  const multiplier = target === 2 ? 1.5 : 2;

  return {
    ok: true,
    nextState: {
      ...state,
      creatures: state.creatures.map((creature) => {
        if (creature.id !== current.id) {
          return creature;
        }

        return {
          ...creature,
          evolution_stage: target,
          happiness: clamp(creature.happiness + 15, 0, 100),
          specialUnlocked: true,
          stats: {
            attack: Math.round(creature.stats.attack * multiplier),
            speed: Math.round(creature.stats.speed * multiplier),
            intelligence: Math.round(creature.stats.intelligence * multiplier),
            defense: Math.round(creature.stats.defense * multiplier)
          }
        };
      }),
      progress: {
        ...state.progress,
        rareMaterial: Math.max(0, state.progress.rareMaterial - rareCost),
        objective: `Evolution Forme ${target} atteinte !`
      }
    }
  };
};

export const getEvolutionProgress = (state: PlayerState, creature = getCurrentCreature(state)): EvolutionProgress => {
  const target = creature.evolution_stage >= 2 ? 3 : 2;
  const requiredLevel = target === 2 ? 6 : 12;
  const requiredRare = target === 2 ? 1 : 2;

  if (creature.evolution_stage >= 3) {
    return {
      ready: false,
      stageTarget: 3,
      requirements: [{ label: "Forme finale atteinte", done: true }]
    };
  }

  const requirements = [
    { label: `Niveau ${requiredLevel}`, done: creature.level >= requiredLevel },
    { label: `${requiredRare} materiau${requiredRare > 1 ? "x" : ""} rare${requiredRare > 1 ? "s" : ""}`, done: state.progress.rareMaterial >= requiredRare }
  ];

  return {
    ready: requirements.every((req) => req.done),
    stageTarget: target,
    requirements
  };
};

export const getNextUnlockInfo = (state: PlayerState): NextUnlockInfo => {
  const nextZone = state.progress.unlockedZones < 4 ? state.progress.unlockedZones + 1 : null;
  if (nextZone) {
    const needWins = nextZone === 2 ? 3 : nextZone === 3 ? 8 : 15;
    const currentWins = state.progress.battlesWon;
    return {
      title: `Prochaine zone: ${getZoneName(nextZone)}`,
      detail: `Gagne encore ${needWins - currentWins > 0 ? needWins - currentWins : 0} combats pour debloquer nouvelles tables et ennemis.`,
      progressLabel: `${currentWins}/${needWins} victoires`
    };
  }

  const evo = getEvolutionProgress(state);
  const done = evo.requirements.filter((req) => req.done).length;
  return {
    title: `Evolution Forme ${evo.stageTarget}`,
    detail: "Complete toutes les etapes pour evoluer.",
    progressLabel: `${done}/${evo.requirements.length} objectifs`
  };
};

const questionKey = (left: number, right: number) => `${left}x${right}`;

const weightedPick = <T>(items: Array<{ item: T; weight: number }>): T => {
  const total = items.reduce((acc, current) => acc + current.weight, 0);
  const roll = Math.random() * total;
  let running = 0;
  for (const item of items) {
    running += item.weight;
    if (roll <= running) {
      return item.item;
    }
  }
  return items[items.length - 1].item;
};

const buildDistractors = (left: number, right: number, correct: number): number[] => {
  const candidates = new Set<number>();
  const nearA = correct + left;
  const nearB = correct - left;
  const nearC = correct + right;
  const nearD = correct - right;
  const offByOneA = left * Math.max(1, right - 1);
  const offByOneB = left * (right + 1);

  [nearA, nearB, nearC, nearD, offByOneA, offByOneB].forEach((value) => {
    if (value !== correct && value > 0) {
      candidates.add(value);
    }
  });

  while (candidates.size < 8) {
    const jitter = random(-12, 12);
    const value = correct + jitter;
    if (value > 0 && value !== correct) {
      candidates.add(value);
    }
  }

  return shuffle(Array.from(candidates)).slice(0, 3);
};
export const buildQuestion = (
  state: PlayerState,
  forcedTable?: number,
  recentKeys: string[] = [],
  range: QuestionRange = "standard"
): MultiplicationQuestion => {
  const candidateTables = forcedTable
    ? [forcedTable]
    : state.progress.unlockedTables.length > 0
    ? state.progress.unlockedTables
    : [...ALL_TABLES];

  // Concept: jamais de table de 2 (sur-representee).
  const filteredTables = candidateTables.filter((t) => t !== 2);
  const tables = filteredTables.length > 0 ? filteredTables : [...ALL_TABLES];

  // Pour les coups a enjeu (combat), on etend la droite jusqu'a 15.
  const maxRight = range === "extended" ? 15 : 10;

  const weightedPairs: Array<{ item: { left: number; right: number; key: string }; weight: number }> = [];

  tables.forEach((left) => {
    for (let right = 1; right <= maxRight; right += 1) {
      const key = questionKey(left, right);
      const mastery = state.mastery[key];
      const errors = mastery?.errors ?? 0;
      const attempts = mastery?.attempts ?? 0;
      const rate = masteryRate(mastery);
      const isRecent = recentKeys.includes(key);

      let weight = 1;
      if (attempts === 0) {
        weight += 1.2;
      }
      if (left >= 7) {
        weight *= 1.35;
      }
      if (right > 10) {
        // les multiplications etendues (x11..x15) un peu plus rares pour ne pas surcharger
        weight *= 0.75;
      }
      weight += errors * 0.45;
      weight += (1 - rate) * 2.2;
      if (mastery?.mastered) {
        weight *= 0.45;
      }
      if (isRecent) {
        weight *= 0.35;
      }

      weightedPairs.push({ item: { left, right, key }, weight: Math.max(0.15, weight) });
    }
  });

  const chosen = weightedPick(weightedPairs);
  const correct = chosen.left * chosen.right;
  const wrong = buildDistractors(chosen.left, chosen.right, correct);

  return {
    left: chosen.left,
    right: chosen.right,
    key: chosen.key,
    prompt: `${chosen.left} x ${chosen.right} = ?`,
    correct,
    answers: shuffle([correct, ...wrong])
  };
};

export const resolveAnswer = (
  state: PlayerState,
  key: string,
  isCorrect: boolean,
  rewardScale = 1,
  responseMs = 2600
): AnswerResolution => {
  const current = getCurrentCreature(state);
  const entry = state.mastery[key];
  const nextMastery = updateMasteryEntry(entry, isCorrect, responseMs);

  const speedBonus = isCorrect ? (responseMs < 1700 ? 3 : responseMs < 2600 ? 1 : 0) : 0;
  const streak = isCorrect ? current.correctStreak + 1 : 0;
  const streakBonus = isCorrect ? Math.min(4, Math.floor(streak / 2)) : 0;
  // Intelligence : +1% XP par point au-dessus de 10 (créature concentrée apprend plus vite)
  const intelMul = isCorrect ? 1 + Math.max(0, current.stats.intelligence - 10) * 0.01 : 1;
  const baseXp = isCorrect ? 7 : 2;
  const baseCoins = isCorrect ? 2 : 0;
  const xpGain = Math.max(1, Math.round((baseXp + speedBonus + streakBonus) * rewardScale * intelMul));
  const coinsGain = Math.max(0, Math.round(baseCoins * rewardScale));

  let next: PlayerState = {
    ...state,
    mastery: {
      ...state.mastery,
      [key]: nextMastery
    },
    creatures: state.creatures.map((creature) => {
      if (creature.id !== current.id) {
        return creature;
      }

      return {
        ...creature,
        correctStreak: streak,
        happiness: clamp(creature.happiness + (isCorrect ? 1 : -2), 0, 100),
        hunger: clamp(creature.hunger - 1, 0, 100)
      };
    })
  };

  next = applyXpRewards(next, current.id, xpGain, Math.max(1, Math.round(xpGain * 0.7)), coinsGain);
  next = applyProgression(next);

  return {
    nextState: next,
    isCorrect,
    xpGain,
    coinsGain,
    streak,
    mastery: nextMastery
  };
};

export const canSpendEnergy = (state: PlayerState, cost: number): boolean => state.progress.energy >= cost;

export const spendEnergyForAction = (state: PlayerState, cost: number, happinessBoost = 0): PlayerState => {
  const current = getCurrentCreature(state);
  let next: PlayerState = {
    ...state,
    creatures: state.creatures.map((creature) =>
      creature.id === current.id
        ? {
            ...creature,
            hunger: clamp(creature.hunger - 2, 0, 100),
            happiness: clamp(creature.happiness + happinessBoost, 0, 100)
          }
        : creature
    ),
    progress: {
      ...state.progress,
      energy: clamp(state.progress.energy - cost, 0, state.progress.energyMax),
      energySpentToday: (state.progress.energySpentToday ?? 0) + cost
    }
  };
  next = progressQuests(next, { kind: "spend_energy", amount: cost });
  return next;
};

export const feedCurrentCreature = (state: PlayerState, wasCorrect: boolean) => {
  if (state.progress.food <= 0) {
    return { ok: false as const, nextState: state, hungerGain: 0, happinessGain: 0 };
  }

  const current = getCurrentCreature(state);
  const hungerGain = wasCorrect ? 18 : 10;
  const happinessGain = wasCorrect ? 4 : 1;

  let next: PlayerState = {
    ...state,
    creatures: state.creatures.map((creature) => {
      if (creature.id !== current.id) {
        return creature;
      }
      return {
        ...creature,
        hunger: clamp(creature.hunger + hungerGain, 0, 100),
        happiness: clamp(creature.happiness + happinessGain, 0, 100)
      };
    }),
    progress: {
      ...state.progress,
      food: Math.max(0, state.progress.food - 1),
      totalFeeds: (state.progress.totalFeeds ?? 0) + 1
    }
  };

  next = applyXpRewards(next, current.id, wasCorrect ? 5 : 2, wasCorrect ? 4 : 2, 0);
  next = applyProgression(next);
  next = progressQuests(next, { kind: "feed" });

  return { ok: true as const, nextState: next, hungerGain, happinessGain };
};

export const plantCrop = (state: PlayerState, plotId: string, cropType: CropType) => {
  if (state.progress.unlockedZones < CROP_CONFIG[cropType].unlockZone) {
    return { ok: false as const, nextState: state, reason: "Crop locked in this zone." };
  }

  if (state.progress.seeds[cropType] <= 0) {
    return { ok: false as const, nextState: state, reason: "No seeds available." };
  }

  const plot = state.progress.plots.find((item) => item.id === plotId);
  if (!plot || plot.cropType) {
    return { ok: false as const, nextState: state, reason: "Plot not available." };
  }

  const now = getNow();
  const cfg = CROP_CONFIG[cropType];

  return {
    ok: true as const,
    nextState: {
      ...state,
      progress: {
        ...state.progress,
        seeds: {
          ...state.progress.seeds,
          [cropType]: state.progress.seeds[cropType] - 1
        },
        plots: state.progress.plots.map((item) =>
          item.id === plotId ? { ...item, cropType, plantedAt: now, readyAt: now + cfg.durationMs } : item
        )
      }
    }
  };
};

export const harvestCrop = (state: PlayerState, plotId: string, bonusMultiplier = 1) => {
  const plot = state.progress.plots.find((item) => item.id === plotId);
  if (!plot || !plot.cropType || !plot.readyAt || plot.readyAt > getNow()) {
    return { ok: false as const, nextState: state, gainedFood: 0, gainedCoins: 0, rare: 0, gainedXp: 0, gainedHappiness: 0 };
  }

  const cfg = CROP_CONFIG[plot.cropType];
  const creature = getCurrentCreature(state);
  // On combine : bonus de réponse + bonheur (>75 = +12%) + énergie (>80% = +10% ; <30% = -20%)
  // + malus faim (créature affamée récolte mal).
  const needsBonus = happyMultiplier(creature.happiness) * hungerMultiplier(creature.hunger) * energyRatioMultiplier(state.progress.energy, state.progress.energyMax);
  const amountFactor = bonusMultiplier * needsBonus;
  const gainedFood = Math.max(1, Math.round(cfg.food * amountFactor));
  const gainedCoins = Math.max(1, Math.round(cfg.coins * amountFactor));

  const rareRoll = Math.random();
  const rare = rareRoll < cfg.rareChance * (bonusMultiplier > 1 ? 1.2 : 1) ? Math.max(1, cfg.rareDrop) : 0;

  // NOUVEAU : la récolte donne aussi XP et bonheur à la créature active
  // (la production fait progresser le personnage, pas juste le portefeuille)
  const gainedXp = Math.max(1, Math.round(cfg.xp * amountFactor));
  const gainedHappiness = cfg.happiness;

  let nextState: PlayerState = {
    ...state,
    progress: {
      ...state.progress,
      food: state.progress.food + gainedFood,
      coins: state.progress.coins + gainedCoins,
      rareMaterial: state.progress.rareMaterial + rare,
      totalHarvests: (state.progress.totalHarvests ?? 0) + 1,
      plots: state.progress.plots.map((item) =>
        item.id === plotId ? { ...item, cropType: null, plantedAt: null, readyAt: null } : item
      )
    },
    // Bonheur ajouté à la créature active (clamp 100)
    creatures: state.creatures.map((c) =>
      c.id === state.progress.currentCreatureId
        ? { ...c, happiness: Math.min(100, c.happiness + gainedHappiness) }
        : c
    )
  };
  // XP + petit gain joueur (réutilise le pipeline standard qui gère level-ups)
  nextState = applyXpRewards(nextState, creature.id, gainedXp, Math.max(1, Math.round(gainedXp * 0.4)), 0);
  nextState = progressQuests(nextState, { kind: "harvest" });

  return { ok: true as const, gainedFood, gainedCoins, rare, gainedXp, gainedHappiness, nextState };
};

export const buySeeds = (state: PlayerState, cropType: CropType, amount = 1) => {
  const cfg = CROP_CONFIG[cropType];
  if (state.progress.unlockedZones < cfg.unlockZone) {
    return { ok: false as const, nextState: state, cost: cfg.seedCost * amount };
  }

  const cost = cfg.seedCost * amount;
  if (state.progress.coins < cost) {
    return { ok: false as const, nextState: state, cost };
  }

  return {
    ok: true as const,
    cost,
    nextState: {
      ...state,
      progress: {
        ...state.progress,
        coins: state.progress.coins - cost,
        seeds: {
          ...state.progress.seeds,
          [cropType]: state.progress.seeds[cropType] + amount
        }
      }
    }
  };
};
export const upgradeCurrentCreatureStat = (state: PlayerState, stat: CreatureStatKey) => {
  const creature = getCurrentCreature(state);
  const totalStats = creature.stats.attack + creature.stats.speed + creature.stats.intelligence + creature.stats.defense;
  const cost = 18 + Math.floor(totalStats / 7);

  if (state.progress.coins < cost) {
    return { ok: false as const, nextState: state, cost };
  }

  let next: PlayerState = {
    ...state,
    creatures: state.creatures.map((item) =>
      item.id === creature.id
        ? {
            ...item,
            stats: {
              ...item.stats,
              [stat]: item.stats[stat] + 1
            }
          }
        : item
    ),
    progress: {
      ...state.progress,
      coins: state.progress.coins - cost
    }
  };

  next = applyProgression(next);
  return { ok: true as const, nextState: next, cost };
};

export const upgradeFarmPlot = (state: PlayerState) => {
  if (state.progress.plots.length >= 4) {
    return { ok: false as const, nextState: state, cost: 0 };
  }

  const cost = 35 + (state.progress.plots.length - 2) * 20;
  if (state.progress.coins < cost) {
    return { ok: false as const, nextState: state, cost };
  }

  return {
    ok: true as const,
    cost,
    nextState: {
      ...state,
      progress: {
        ...state.progress,
        coins: state.progress.coins - cost,
        farmPlotLevel: clamp(state.progress.farmPlotLevel + 1, 1, 4),
        plots: [
          ...state.progress.plots,
          {
            id: `plot-${state.progress.plots.length + 1}`,
            cropType: null,
            plantedAt: null,
            readyAt: null
          }
        ]
      }
    }
  };
};

export const applyTrainingStatGain = (state: PlayerState, focus: TrainingFocus, points: number): PlayerState => {
  const creature = getCurrentCreature(state);
  const statMap: Record<TrainingFocus, CreatureStatKey> = {
    strength: "attack",
    reflex: "speed",
    focus: "intelligence",
    endurance: "defense"
  };

  const stat = statMap[focus];

  let next: PlayerState = {
    ...state,
    creatures: state.creatures.map((item) => {
      if (item.id !== creature.id) {
        return item;
      }

      return {
        ...item,
        stats: {
          ...item.stats,
          [stat]: item.stats[stat] + points
        },
        happiness: clamp(item.happiness + 2 + Math.floor(points / 2), 0, 100),
        hunger: clamp(item.hunger - 2, 0, 100)
      };
    }),
    progress: {
      ...state.progress,
      energyMax: focus === "endurance" ? clamp(state.progress.energyMax + Math.floor(points / 2), 8, 24) : state.progress.energyMax,
      energy:
        focus === "endurance"
          ? clamp(state.progress.energy + Math.floor(points / 2), 0, clamp(state.progress.energyMax + Math.floor(points / 2), 8, 24))
          : state.progress.energy
    }
  };

  next = applyXpRewards(next, creature.id, points * 8, points * 6, Math.max(1, Math.floor(points / 2)));
  next = applyProgression(next);

  return next;
};

const getTypeMultiplier = (attacker: CreatureType, defender: CreatureType) => {
  if (TYPE_ADVANTAGE[attacker] === defender) {
    return 1.25;
  }
  if (TYPE_ADVANTAGE[defender] === attacker) {
    return 0.82;
  }
  return 1;
};

const scaleWithNeeds = (creature: Creature, value: number, energy?: number, energyMax?: number) =>
  Math.round(value * needsMultiplier(creature, energy, energyMax));

export const getBattlePlayerHp = (creature: Creature): number => {
  return 76 + creature.level * 5 + creature.stats.defense * 2 + creature.evolution_stage * 8;
};

const enemyActionLabel = (behavior: EnemyBehavior) => {
  if (behavior === "aggressive") {
    return Math.random() < 0.6 ? "Wild Rush" : "Heavy Strike";
  }
  if (behavior === "trickster") {
    return Math.random() < 0.55 ? "Sneaky Spark" : "Feint Claw";
  }
  return Math.random() < 0.5 ? "Quick Bite" : "Guard Break";
};

// ==================================================================
// MOVES DEFINITIONS — chaque action liée à sa stat (mappée 1-to-1 aux ateliers de Train)
// ==================================================================
//
// strike (Frappe)   → Force          (atelier "strength")  : dégâts droits ATK
// dodge  (Esquive)  → Vitesse        (atelier "reflex")    : agit toujours en premier, +crit, peut esquiver
// spell  (Sort)     → Concentration  (atelier "focus")     : dégâts INT qui ignorent 50% DEF, 2 multiplications
// guard  (Garde)    → Endurance      (atelier "endurance") : réduit damage subis 60%, soin léger DEF
// potion (Objet)    → -              consomme food, soigne, ne donne pas de tour offensif

export interface MoveProfile {
  questions: 1 | 2;
  /** Stat utilisée pour le calcul de dégâts (ou null pour potion) */
  primaryStat: "attack" | "speed" | "intelligence" | "defense" | null;
}

export const MOVE_PROFILES: Record<BattleAction, MoveProfile> = {
  strike:  { questions: 1, primaryStat: "attack" },
  dodge:   { questions: 1, primaryStat: "speed" },
  spell:   { questions: 2, primaryStat: "intelligence" },
  guard:   { questions: 1, primaryStat: "defense" },
  potion:  { questions: 1, primaryStat: null }
};

export const resolveBattleTurn = ({
  action,
  currentEnemyHp,
  currentPlayerHp,
  isCorrect,
  answerTimeMs,
  combo,
  creature,
  enemy,
  guardActive,
  playerEnergy,
  playerEnergyMax
}: BattleTurnInput): BattleTurnResult => {
  // Initiative : Esquive agit TOUJOURS en premier ; sinon comparaison de vitesses
  const speedRoll = creature.stats.speed + random(0, 7);
  const enemySpeedRoll = enemy.speed + random(0, 7);
  const playerGoesFirst = action === "dodge" || action === "guard" || speedRoll >= enemySpeedRoll;

  // Saut de tour (créature triste)
  const skipped = willSkipTurn(creature) && action !== "guard" && action !== "dodge";

  // Calcul des dégâts selon l'action
  let actionPowerBase = 0;
  let ignoreDefenseFactor = 1; // 1 = défense pleine ; <1 = ignore une partie de la DEF
  if (!skipped) {
    switch (action) {
      case "strike":
        // Frappe directe : ATK × 1.3
        actionPowerBase = creature.stats.attack * 1.3;
        break;
      case "dodge":
        // Esquive : dégâts modérés via Vitesse, mais surtout boost de crit
        actionPowerBase = creature.stats.speed * 1.0;
        break;
      case "spell":
        // Sort : INT × 1.95 (= 1.5× plus fort que Frappe qui est ATK × 1.3) + ignore 50% DEF
        // Coût : 2 multiplications (vs 1 pour les autres actions) — justifie la puissance
        actionPowerBase = creature.stats.intelligence * 1.95;
        ignoreDefenseFactor = 0.5;
        break;
      case "guard":
        // Garde : dégâts faibles (riposte), DEF × 0.6
        actionPowerBase = creature.stats.defense * 0.6;
        break;
      case "potion":
        // Pas d'attaque, juste l'effet soin (géré dans useBattleFoodItem)
        actionPowerBase = 0;
        break;
    }
  }

  // Accuracy : mauvaise réponse = 45% des dégâts, OK = 100%
  const accuracyMul = isCorrect ? 1 : 0.45;

  // Combo : jusqu'à +28%
  const comboBonus = isCorrect ? 1 + Math.min(0.28, combo * 0.05) : 1;

  // Avantage de type
  const typeMul = getTypeMultiplier(creature.type, enemy.type);

  // Critique : SPD aide + bonus si Esquive (+15%) + bonus si réponse rapide
  const dodgeCritBonus = action === "dodge" && isCorrect ? 0.15 : 0;
  const critChance = Math.min(0.5, 0.04 + creature.stats.speed * 0.006 + dodgeCritBonus + (isCorrect && answerTimeMs < 1500 ? 0.16 : 0));
  const critical = isCorrect && actionPowerBase > 0 && Math.random() < critChance;
  const critMul = critical ? 1.55 : 1;

  const playerRaw = scaleWithNeeds(creature, actionPowerBase * accuracyMul * comboBonus * typeMul * critMul, playerEnergy, playerEnergyMax);
  const enemyEffectiveDef = enemy.defense * ignoreDefenseFactor;
  const damageToEnemy = skipped || action === "potion" ? 0 : Math.max(1, Math.round(playerRaw * (100 / (100 + enemyEffectiveDef * 5))));

  let enemyHp = clamp(currentEnemyHp - damageToEnemy, 0, 9999);
  let playerHp = currentPlayerHp;
  let enemyAction = "Stunned";
  let damageToPlayer = 0;
  let lost = false;
  const won = enemyHp <= 0;

  const guardApplied = action === "guard" && isCorrect;
  // Esquive réussie : 30% de chance de complètement éviter le coup
  const dodgeSucceeds = action === "dodge" && isCorrect && Math.random() < 0.3 + creature.stats.speed * 0.005;

  if (!won) {
    const enemyMul = getTypeMultiplier(enemy.type, creature.type);
    const behaviorMul = enemy.behavior === "aggressive" ? 1.15 : enemy.behavior === "trickster" ? 1.05 : 1;
    const pressure = enemy.attack * behaviorMul * enemyMul;

    // Modificateurs de défense :
    // - Garde : -60% dégâts
    // - Esquive non réussie : -30% dégâts (couvre quand même partiellement)
    // - Dodge réussie : 0 dégât (esquive totale)
    let defenseMul = 1;
    if (guardActive || guardApplied) defenseMul = 0.4;
    if (action === "dodge" && isCorrect) defenseMul = Math.min(defenseMul, 0.7);
    if (dodgeSucceeds) defenseMul = 0;

    const rawEnemyDamage = pressure * defenseMul;
    damageToPlayer = dodgeSucceeds ? 0 : Math.max(1, Math.round(rawEnemyDamage * (100 / (100 + creature.stats.defense * 4.5))));

    enemyAction = dodgeSucceeds ? "Coup esquivé !" : enemyActionLabel(enemy.behavior);

    // Garde + soin léger basé sur DEF
    if (guardApplied) {
      const heal = Math.round(creature.stats.defense * 0.4);
      playerHp = Math.min(getBattlePlayerHp(creature), playerHp + heal);
    }

    const enemyFirst = !playerGoesFirst;
    if (enemyFirst) {
      playerHp = clamp(playerHp - damageToPlayer, 0, 9999);
      if (playerHp > 0) {
        enemyHp = clamp(currentEnemyHp - damageToEnemy, 0, 9999);
      }
    } else {
      playerHp = clamp(playerHp - damageToPlayer, 0, 9999);
    }

    lost = playerHp <= 0;
  }

  return {
    enemyHp,
    playerHp,
    damageToEnemy,
    damageToPlayer,
    critical,
    won: enemyHp <= 0,
    lost,
    enemyAction,
    guardApplied,
    playerActed: !skipped && (isCorrect || action === "guard" || action === "potion" || action === "dodge"),
    enemyActedFirst: !playerGoesFirst && !won,
    skipped
  };
};

export const useBattleFoodItem = (state: PlayerState, wasCorrect: boolean) => {
  if (state.progress.food <= 0) {
    return { ok: false as const, nextState: state, heal: 0 };
  }

  const creature = getCurrentCreature(state);
  const heal = wasCorrect ? 22 : 14;

  return {
    ok: true as const,
    heal,
    nextState: {
      ...state,
      creatures: state.creatures.map((item) =>
        item.id === creature.id
          ? {
              ...item,
              hunger: clamp(item.hunger + (wasCorrect ? 8 : 4), 0, 100),
              happiness: clamp(item.happiness + 1, 0, 100)
            }
          : item
      ),
      progress: {
        ...state.progress,
        food: state.progress.food - 1
      }
    }
  };
};
const pickTableForZone = (state: PlayerState, zone: number): number => {
  const zoneTables = ZONE_TABLES[zone] ?? [3, 4];
  const scored = zoneTables.map((table) => {
    const entries = Array.from({ length: 10 }).map((_, i) => state.mastery[`${table}x${i + 1}`]);
    const avgRate = entries.reduce((sum, entry) => sum + masteryRate(entry), 0) / entries.length;
    const errors = entries.reduce((sum, entry) => sum + (entry?.errors ?? 0), 0);
    return { table, weight: 1 + errors * 0.12 + (1 - avgRate) * 2 };
  });

  return weightedPick(scored.map((s) => ({ item: s.table, weight: s.weight })));
};

// Seuils par zone pour déclencher un boss (avant qu'on puisse débloquer la suivante)
const BOSS_VICTORIES_NEEDED = 5;

export const isBossAvailable = (state: PlayerState): boolean => {
  const zone = state.progress.unlockedZones;
  if (zone >= 4) return false; // pas de boss après la zone 4 (sauf le boss final ; pour l'instant on s'arrête là)
  const beaten = state.progress.zoneBossesBeaten?.[zone] ?? false;
  if (beaten) return false;
  const wins = state.progress.zoneVictories?.[zone] ?? 0;
  return wins >= BOSS_VICTORIES_NEEDED;
};

// ==================================================================
// VARIANCE DES ENNEMIS — pour ne jamais voir 2 fois le même
// ==================================================================
const ALL_SPECIES: CreatureSpecies[] = ["eclair", "braise", "foret", "eau", "cristal", "vent", "roche", "ombre", "fleur", "givre"];

// Préfixes thématiques pour individualiser le nom
const ENEMY_PREFIXES = ["Sauvage", "Petit", "Ancien", "Furtif", "Brutal", "Vif", "Caché", "Hargneux", "Rusé", "Stoïque", "Mystique", "Furieux"];
const ENEMY_SUFFIXES = ["d'Ombre", "du Vent", "Solitaire", "de Pierre", "Fugace", "Royal", "Errant", "Sombre", "Clair", "Brûlant"];

// Pondération par tempérament
const TEMPERAMENT_MULS: Record<EnemyTemperament, { atk: number; spd: number; def: number; hp: number }> = {
  balanced: { atk: 1.0, spd: 1.0, def: 1.0, hp: 1.0 },
  fierce:   { atk: 1.25, spd: 1.0, def: 0.85, hp: 0.95 },  // +ATK -DEF
  swift:    { atk: 0.95, spd: 1.3, def: 0.9, hp: 0.9 },    // +SPD léger -DEF
  tanky:    { atk: 0.9, spd: 0.85, def: 1.3, hp: 1.25 },   // +DEF +HP -ATK -SPD
  tricky:   { atk: 1.05, spd: 1.1, def: 0.95, hp: 0.95 }   // léger +ATK +SPD
};

const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Filtre les espèces probables selon la zone (variété progressive)
const speciesForZone = (zone: number): CreatureSpecies[] => {
  if (zone === 1) return ["eau", "foret", "fleur", "givre", "roche"];
  if (zone === 2) return ["foret", "fleur", "vent", "roche", "eclair", "eau"];
  if (zone === 3) return ["cristal", "vent", "ombre", "eclair", "givre", "roche"];
  return ["braise", "ombre", "cristal", "eclair", "vent"];
};

export const createBossEnemy = (state: PlayerState): Enemy => {
  const zone = state.progress.unlockedZones;
  const meta = BOSS_NAMES[zone] ?? BOSS_NAMES[1];
  const tableFocus = pickTableForZone(state, zone);
  // Boss difficulty bumpée : +1 toutes les 3 victoires + bonus de base
  const difficulty = zone * 3 + Math.floor(state.progress.battlesWon / 3) + 5;

  // Le boss prend une species spécifique par zone et toujours stage 3 (forme finale)
  const bossSpecies: Record<number, CreatureSpecies> = { 1: "roche", 2: "givre", 3: "cristal", 4: "braise" };
  const species: CreatureSpecies = bossSpecies[zone] ?? "ombre";

  // Stats boss bumpées (+25-30%) pour rester un cran au-dessus du commun
  const maxHp = 180 + difficulty * 30;
  const attack = 21 + difficulty * 2.5;
  const speed = 15 + difficulty * 2;
  const defense = 18 + difficulty * 2.2;

  return {
    id: `boss-${Date.now()}`,
    name: meta.name,
    hp: maxHp,
    maxHp,
    difficulty,
    table_focus: tableFocus,
    type: meta.type,
    species,
    stage: 3,
    temperament: "fierce",
    attack,
    speed,
    defense,
    zone,
    behavior: "aggressive",
    rank: "boss"
  };
};

export const createEnemy = (state: PlayerState): Enemy => {
  const zone = state.progress.unlockedZones;

  // Si un boss est dispo, on le déclenche en priorité
  if (isBossAvailable(state)) {
    return createBossEnemy(state);
  }

  // Choix species selon la zone (pas tous les ennemis sont disponibles dans toutes les zones)
  const speciesPool = speciesForZone(zone);
  const species: CreatureSpecies = pickRandom(speciesPool);
  const type: CreatureType = SPECIES_TYPE[species];

  // Stage selon la zone : stage 2/3 plus fréquents pour pousser la difficulté
  const stageRoll = Math.random();
  const stage: 1 | 2 | 3 = zone === 1
    ? (stageRoll < 0.65 ? 1 : stageRoll < 0.95 ? 2 : 3)
    : zone === 2
    ? (stageRoll < 0.35 ? 1 : stageRoll < 0.80 ? 2 : 3)
    : zone === 3
    ? (stageRoll < 0.15 ? 1 : stageRoll < 0.55 ? 2 : 3)
    : (stageRoll < 0.10 ? 2 : 3);

  // Tempérament aléatoire → fait varier stats. Pondération vers les variantes offensives.
  const temperament: EnemyTemperament = pickRandom(["balanced", "fierce", "fierce", "swift", "tanky", "tricky"]);
  const tm = TEMPERAMENT_MULS[temperament];

  const tableFocus = pickTableForZone(state, zone);
  // Difficulté grimpe 33% plus vite : +1 toutes les 3 victoires (vs 4 avant)
  const difficulty = zone + Math.floor(state.progress.battlesWon / 3);
  const behavior: EnemyBehavior = zone >= 3 ? (Math.random() < 0.5 ? "aggressive" : "trickster") : "balanced";

  // Élite : ~22% en zone 1 et jusqu'à ~42% en zone 4 (avant : 19%–31%)
  const isElite = Math.random() < 0.18 + zone * 0.06;
  const eliteMul = isElite ? 1.35 : 1;
  // Stage de l'ennemi : stage 2 = +30%, stage 3 = +70% (avant 25%/60%)
  const stageMul = stage === 3 ? 1.7 : stage === 2 ? 1.3 : 1;
  // Petite variance individuelle ±10%
  const personalMul = 0.9 + Math.random() * 0.2;

  const finalMul = eliteMul * stageMul * personalMul;

  // Stats de base bumpées : HP +28%, ATK +30%, DEF +28% pour rester challenge après évolution joueur
  const maxHp = Math.max(20, Math.round((72 + difficulty * 22 + random(0, 12)) * finalMul * tm.hp));
  const attack = Math.max(6, Math.round((13 + difficulty * 2.4 + random(0, 4)) * finalMul * tm.atk));
  const speed = Math.max(6, Math.round((10 + difficulty * 2.2 + random(0, 4)) * finalMul * tm.spd));
  const defense = Math.max(4, Math.round((9 + difficulty * 1.3 + random(0, 3)) * finalMul * tm.def));

  // Nom : Préfixe + nom de stage de l'espèce + suffixe occasionnel
  const stageName = SPECIES_META[species].stageNames[stage - 1];
  const prefix = pickRandom(ENEMY_PREFIXES);
  const useSuffix = Math.random() < 0.35;
  const suffix = useSuffix ? ` ${pickRandom(ENEMY_SUFFIXES)}` : "";
  const eliteMark = isElite ? "✦ " : "";

  return {
    id: `enemy-${Date.now()}-${random(100, 999)}`,
    name: `${eliteMark}${prefix} ${stageName}${suffix}`,
    hp: maxHp,
    maxHp,
    difficulty,
    table_focus: tableFocus,
    type,
    species,
    stage,
    temperament,
    attack,
    speed,
    defense,
    zone,
    behavior,
    rank: isElite ? "elite" : "common"
  };
};

export const applyBattleWinRewards = (state: PlayerState, defeatedEnemy?: Enemy): PlayerState => {
  const creature = getCurrentCreature(state);
  const zoneBonus = state.progress.unlockedZones;
  const isBoss = defeatedEnemy?.rank === "boss";
  const isElite = defeatedEnemy?.rank === "elite";
  const mul = isBoss ? 3 : isElite ? 1.8 : 1;

  // Win streak : +1 par victoire (reset à la défaite via resetWinStreak)
  const newStreak = (state.progress.winStreak ?? 0) + 1;
  const streakMul = getWinStreakMultiplier(newStreak);

  const rewardMul = getRewardMultiplier(state) * streakMul; // bonheur + énergie + combo victoires
  const coins = Math.round((random(9, 14) + zoneBonus * 2) * mul * rewardMul);
  const food = Math.round((random(2, 4) + Math.floor(zoneBonus / 2)) * mul * rewardMul);
  const seedDropType: CropType = zoneBonus >= 3 ? (Math.random() < 0.35 ? "slow" : "medium") : Math.random() < 0.5 ? "fast" : "medium";
  const seedDrop = Math.max(1, Math.round(random(1, 2) * mul));
  // Boss : matériau rare garanti (+2). Elite : 50%. Common : ~20%.
  const rare = isBoss ? 2 : isElite ? (Math.random() < 0.5 ? 1 : 0) : (Math.random() < 0.18 + zoneBonus * 0.03 ? 1 : 0);

  const enemyType = defeatedEnemy?.type;
  const zone = state.progress.unlockedZones;

  // Bestiaire legacy (par type) — pour les achievements
  const seenEnemies = { ...(state.progress.seenEnemies ?? {}) };
  if (enemyType) {
    seenEnemies[enemyType] = (seenEnemies[enemyType] ?? 0) + 1;
  }
  // Bestiaire fin (par espèce) → alimente le Codex en mode "Vue"
  const seenSpecies = { ...(state.progress.seenSpecies ?? {}) };
  if (defeatedEnemy?.species) {
    seenSpecies[defeatedEnemy.species] = (seenSpecies[defeatedEnemy.species] ?? 0) + 1;
  }

  // Record du plus fort spécimen vu (par species). Maj si nouvelle difficulté supérieure.
  const seenBest = { ...(state.progress.seenBest ?? {}) };
  if (defeatedEnemy?.species) {
    const prev = seenBest[defeatedEnemy.species];
    if (!prev || defeatedEnemy.difficulty > prev.difficulty) {
      seenBest[defeatedEnemy.species] = {
        difficulty: defeatedEnemy.difficulty,
        stage: defeatedEnemy.stage,
        maxHp: defeatedEnemy.maxHp,
        attack: defeatedEnemy.attack,
        speed: defeatedEnemy.speed,
        defense: defeatedEnemy.defense,
        temperament: defeatedEnemy.temperament,
        rank: defeatedEnemy.rank,
        zone: defeatedEnemy.zone,
        lastSeenAt: Date.now()
      };
    }
  }

  // Compteur victoires par zone
  const zoneVictories = { ...(state.progress.zoneVictories ?? {}) };
  zoneVictories[zone] = (zoneVictories[zone] ?? 0) + 1;

  // Boss vaincu ? Marquer + débloquer la zone suivante.
  const zoneBossesBeaten = { ...(state.progress.zoneBossesBeaten ?? {}) };
  if (isBoss) {
    zoneBossesBeaten[zone] = true;
  }

  let next: PlayerState = {
    ...state,
    progress: {
      ...state.progress,
      coins: state.progress.coins + coins,
      food: state.progress.food + food,
      rareMaterial: state.progress.rareMaterial + rare,
      battlesWon: state.progress.battlesWon + 1,
      seeds: {
        ...state.progress.seeds,
        [seedDropType]: state.progress.seeds[seedDropType] + seedDrop
      },
      seenEnemies,
      seenSpecies,
      seenBest,
      zoneVictories,
      zoneBossesBeaten,
      winStreak: newStreak,
      bestWinStreak: Math.max(state.progress.bestWinStreak ?? 0, newStreak),
      // Si on a battu le boss, la zone suivante est débloquée immédiatement
      unlockedZones: isBoss ? clamp(zone + 1, 1, 4) : state.progress.unlockedZones
    },
    creatures: state.creatures.map((item) =>
      item.id === creature.id
        ? {
            ...item,
            happiness: clamp(item.happiness + (isBoss ? 12 : 4), 0, 100),
            hunger: clamp(item.hunger - 3, 0, 100)
          }
        : item
    )
  };

  next = applyXpRewards(next, creature.id, Math.round((16 + zoneBonus * 2) * mul), Math.round((12 + zoneBonus) * mul), 0);
  next = applyProgression(next);
  // Quêtes : 1 combat gagné, +1 boss si applicable
  next = progressQuests(next, { kind: "battles" });
  if (isBoss) next = progressQuests(next, { kind: "boss" });
  next = checkAchievements(next);

  return next;
};

// Réinitialise le combo de victoires (à appeler en cas de défaite)
export const resetWinStreak = (state: PlayerState): PlayerState => {
  if (!state.progress.winStreak) return state;
  return {
    ...state,
    progress: { ...state.progress, winStreak: 0 }
  };
};

// Pénalité quand on perd un combat : -bonheur sur la créature qui a perdu, -faim un peu,
// petit malus d'XP. Reset du winStreak aussi.
export const applyBattleLossPenalty = (state: PlayerState, defeatedByBoss = false): { state: PlayerState; happinessLost: number } => {
  const current = getCurrentCreature(state);
  const happinessLost = defeatedByBoss ? 18 : 10;
  const next: PlayerState = {
    ...state,
    creatures: state.creatures.map((c) =>
      c.id === current.id
        ? {
            ...c,
            happiness: clamp(c.happiness - happinessLost, 0, 100),
            hunger: clamp(c.hunger - 5, 0, 100),
            xp: Math.max(0, c.xp - 8)
          }
        : c
    ),
    progress: {
      ...state.progress,
      winStreak: 0
    }
  };
  return { state: next, happinessLost };
};

export const getMasteryOverview = (state: PlayerState) => {
  const entries = Object.entries(state.mastery).filter(([key]) => state.progress.unlockedTables.some((t) => key.startsWith(`${t}x`)));
  const mastered = entries.filter(([, entry]) => entry.mastered).length;
  const weak = entries
    .filter(([, entry]) => entry.attempts > 0)
    .sort((a, b) => (a[1].successRate + a[1].errors * 0.02) - (b[1].successRate + b[1].errors * 0.02))
    .slice(0, 3)
    .map(([key]) => key.replace("x", " x "));

  return {
    mastered,
    total: entries.length,
    weak
  };
};

export const getEnergyRefillInMs = (state: PlayerState, now = getNow()) => {
  if (state.progress.energy >= state.progress.energyMax) {
    return 0;
  }
  const regenMs = energyRegenMsFor(state);
  const elapsed = now - state.progress.lastEnergyTickAt;
  return clamp(regenMs - elapsed, 0, regenMs);
};

// Indique si la régen est en mode "rapide" (bonheur > 75)
export const isEnergyRegenFast = (state: PlayerState): boolean => {
  const c = state.creatures.find((cr) => cr.id === state.progress.currentCreatureId);
  return Boolean(c && c.happiness > 75);
};

// ============================================================
// REPOS / SIESTE — action active qui rend de l'énergie
// ============================================================
export const restCurrentCreature = (state: PlayerState, wasCorrect: boolean):
  { ok: boolean; nextState: PlayerState; reason?: string; energyGain: number; happinessGain: number } => {
  if (state.progress.food <= 0) {
    return { ok: false, nextState: state, reason: "Plus de nourriture pour une sieste.", energyGain: 0, happinessGain: 0 };
  }
  if (state.progress.energy >= state.progress.energyMax) {
    return { ok: false, nextState: state, reason: "Énergie déjà au max.", energyGain: 0, happinessGain: 0 };
  }
  const current = getCurrentCreature(state);
  const energyGain = wasCorrect ? 3 : 1;
  const happinessGain = wasCorrect ? 3 : 1;
  const next: PlayerState = {
    ...state,
    progress: {
      ...state.progress,
      food: Math.max(0, state.progress.food - 1),
      energy: clamp(state.progress.energy + energyGain, 0, state.progress.energyMax)
    },
    creatures: state.creatures.map((c) =>
      c.id === current.id
        ? { ...c, happiness: clamp(c.happiness + happinessGain, 0, 100) }
        : c
    )
  };
  return { ok: true, nextState: next, energyGain, happinessGain };
};

// ============================================================
// POTION D'ÉNERGIE — achat au shop
// ============================================================
export const ENERGY_POTION_COST = 20;
export const ENERGY_POTION_GAIN = 5;

export const buyEnergyPotion = (state: PlayerState):
  { ok: boolean; nextState: PlayerState; reason?: string } => {
  if (state.progress.coins < ENERGY_POTION_COST) {
    return { ok: false, nextState: state, reason: `Il faut ${ENERGY_POTION_COST} pièces.` };
  }
  if (state.progress.energy >= state.progress.energyMax) {
    return { ok: false, nextState: state, reason: "Énergie déjà au max." };
  }
  return {
    ok: true,
    nextState: {
      ...state,
      progress: {
        ...state.progress,
        coins: state.progress.coins - ENERGY_POTION_COST,
        energy: clamp(state.progress.energy + ENERGY_POTION_GAIN, 0, state.progress.energyMax)
      }
    }
  };
};


