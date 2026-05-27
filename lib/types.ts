export type CreatureType = "fire" | "water" | "plant" | "electric";

// 10 espèces visuelles distinctes (3 stages chacune).
// Chaque species a un type sous-jacent pour la logique de combat.
export type CreatureSpecies =
  | "eclair" | "braise" | "foret" | "eau" | "cristal"
  | "vent"   | "roche"  | "ombre" | "fleur" | "givre";

// Tempérament d'un ennemi : modifie statistiques + sprite preview légèrement
export type EnemyTemperament = "balanced" | "fierce" | "swift" | "tanky" | "tricky";
export type CreatureStatKey = "attack" | "speed" | "intelligence" | "defense";
export type TrainingFocus = "strength" | "reflex" | "focus" | "endurance";
// 4 attaques + 1 objet, chacune liée à une stat boostée par son atelier dans Train.
export type BattleAction = "strike" | "dodge" | "spell" | "guard" | "potion";
export type CropType = "fast" | "medium" | "slow";
export type EnemyBehavior = "aggressive" | "balanced" | "trickster";

export interface CreatureStats {
  attack: number;
  speed: number;
  intelligence: number;
  defense: number;
}

export interface Creature {
  id: string;
  name: string;
  type: CreatureType;
  /** Identifiant visuel : détermine quels sprites utiliser. Par défaut dérivé du type pour la rétrocompat. */
  species?: CreatureSpecies;
  multiplication_table: number;
  level: number;
  xp: number;
  happiness: number;
  hunger: number;
  evolution_stage: number;
  stats: CreatureStats;
  correctStreak: number;
  specialUnlocked: boolean;
}

export type EnemyRank = "common" | "elite" | "boss";

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  difficulty: number;
  table_focus: number;
  type: CreatureType;
  /** Espèce visuelle : décide quel sprite afficher. */
  species: CreatureSpecies;
  /** Stage d'évolution affiché (1, 2 ou 3). Boss = 3. */
  stage: 1 | 2 | 3;
  /** Tempérament : modifie sprite + stats. */
  temperament: EnemyTemperament;
  attack: number;
  speed: number;
  defense: number;
  zone: number;
  behavior: EnemyBehavior;
  rank: EnemyRank;
}

export interface CropPlot {
  id: string;
  cropType: CropType | null;
  plantedAt: number | null;
  readyAt: number | null;
}

export interface MasteryEntry {
  attempts: number;
  correct: number;
  errors: number;
  successRate: number;
  mastered: boolean;
  avgResponseMs: number;
}

export interface MasteryMap {
  [key: string]: MasteryEntry;
}

export interface PlayerProgress {
  level: number;
  xp: number;
  coins: number;
  food: number;
  energy: number;
  energyMax: number;
  seeds: Record<CropType, number>;
  rareMaterial: number;
  battlesWon: number;
  unlockedZones: number;
  unlockedTables: number[];
  unlockedCreatures: number;
  currentCreatureId: string;
  farmPlotLevel: number;
  plots: CropPlot[];
  lastEnergyTickAt: number;
  lastNeedsTickAt: number;
  objective: string;
  // Nouveau : compteur de victoires PAR zone pour gating de boss
  zoneVictories?: Record<number, number>;
  // Bestiaire : créatures (par type) déjà rencontrées comme ennemi
  seenEnemies?: Partial<Record<CreatureType, number>>;
  // Achievements débloqués (clé arbitraire)
  achievements?: string[];
  // Streak journalier : date ISO du dernier jour joué + nombre de jours consécutifs
  lastPlayDay?: string;
  streakDays?: number;
  // Bosses vaincus par zone (pour débloquer la zone suivante)
  zoneBossesBeaten?: Record<number, boolean>;
  // Quêtes journalières
  dailyQuests?: DailyQuestsState;
  // Combo de victoires en combat (réinitialisé à 0 à la défaite)
  winStreak?: number;
  bestWinStreak?: number;
  // Capture
  captured?: Partial<Record<CreatureType, CapturedEntry>>;
  // Statistiques cumulées pour les quêtes
  totalHarvests?: number;
  totalFeeds?: number;
  totalCaptured?: number;
  bestComboTrain?: number;
  energySpentToday?: number;
}

export interface PlayerState {
  creatures: Creature[];
  progress: PlayerProgress;
  mastery: MasteryMap;
}

export interface MultiplicationQuestion {
  left: number;
  right: number;
  prompt: string;
  answers: number[];
  correct: number;
  key: string;
}

export interface NextUnlockInfo {
  title: string;
  detail: string;
  progressLabel: string;
}

export interface EvolutionProgress {
  ready: boolean;
  stageTarget: number;
  requirements: Array<{ label: string; done: boolean }>;
}

export type QuestionRange = "standard" | "extended";

// ============================================================
// Quêtes journalières
// ============================================================
export type DailyQuestKind = "harvest" | "battles" | "feed" | "combo" | "boss" | "capture" | "spend_energy";

export interface DailyQuest {
  id: string;          // identifiant stable (kind + date)
  kind: DailyQuestKind;
  label: string;
  target: number;
  progress: number;
  reward: { coins: number; xp: number; rare?: number };
  claimed: boolean;
}

export interface DailyQuestsState {
  day: string;         // dayKey "YYYY-MM-DD"
  quests: DailyQuest[];
}

// ============================================================
// Capture d'ennemis (Pokedex étendu)
// ============================================================
export interface CapturedEntry {
  type: CreatureType;
  count: number;          // nb de fois capturé (le 1er = découverte)
  firstCapturedAt: number;
}

export interface BattleTurnResult {
  enemyHp: number;
  playerHp: number;
  damageToEnemy: number;
  damageToPlayer: number;
  critical: boolean;
  won: boolean;
  lost: boolean;
  enemyAction: string;
  guardApplied: boolean;
  playerActed: boolean;
  enemyActedFirst: boolean;
  skipped?: boolean; // créature trop triste → saute le tour
}

