---
name: add-creature
description: Ajouter une nouvelle créature au roster (nouveau type ou nouveau membre du pool). Touche gameLogic, creatureVisuals, spriteConfig et les sprites PNG.
---

# Ajouter une créature

Une créature = un membre du `CREATURE_POOL` rattaché à un type élémentaire, à une table de multiplication conceptuelle, et avec 3 stages d'évolution (sprites + noms FR).

## Quand utiliser cette skill

- Le user veut une 5ème créature au-delà des 4 actuelles
- Le user veut **remplacer** une créature existante (changer nom, type, table)
- Le user veut ajouter un nouveau **type** élémentaire (impact plus large : avantages de type, ennemis)

## Décisions à prendre avant de coder

| Question | Détail |
|---|---|
| Nouveau type ou type existant ? | Nouveau type = travail ×3 (avantages, ennemis, sprites) |
| Quelle table conceptuelle ? | Une table 3-10, pas encore prise. Vérifier `CREATURE_POOL`. |
| 3 noms français pour les 3 stages d'évolution | Cohérents avec la famille (ex. eau : Goutin → Riploutre → Maroracle) |
| Réactions FR pour 8 contextes | feed, harvest, train, battleWin, battleLose, evolve, idleHappy, idleHungry (3 réactions par contexte) |
| Sprites PNG disponibles ? | `public/sprites/customs/<type>.png` au minimum. Idéalement par stage : `public/sprites/<type>/stage{1,2,3}/body.png` |

## Procédure

### 1. Ajouter au pool dans `lib/gameLogic.ts`

```ts
const CREATURE_POOL: Array<{ name: string; type: CreatureType; table: number }> = [
  { name: "Flamy", type: "fire", table: 3 },
  { name: "Bubbli", type: "water", table: 5 },
  { name: "Leafy", type: "plant", table: 7 },
  { name: "Zappi", type: "electric", table: 9 },
  { name: "<NomDéfaut>", type: "<type>", table: <table> }, // nouveau membre
];
```

⚠️ Si nouveau **type** : ajouter d'abord à `CreatureType` dans `lib/types.ts` :

```ts
export type CreatureType = "fire" | "water" | "plant" | "electric" | "<new>";
```

Puis dans `gameLogic.ts` : ajouter au `TYPE_ADVANTAGE`, au `ENEMY_NAMES`, et au `pickEnemyType` par zone.

### 2. Ajouter visuels dans `lib/creatureVisuals.ts`

Ajouter une entrée dans `roster: Record<CreatureType, CreatureFamily>` :

```ts
<new>: {
  familyName: "<NomFamille>",
  stageNames: ["<Stage1>", "<Stage2>", "<Stage3>"],
  emotes: ["<emoji1>", "<emoji2>", "<emoji3>"],
  aura: "from-... via-... to-...",       // Tailwind gradient
  body: "from-... to-...",
  accent: "bg-...-500",
  reactions: {
    feed: ["...", "...", "..."],
    harvest: ["...", "...", "..."],
    train: ["...", "...", "..."],
    battleWin: ["...", "...", "..."],
    battleLose: ["...", "...", "..."],
    evolve: ["...", "...", "..."],
    idleHappy: ["...", "...", "..."],
    idleHungry: ["...", "...", "..."]
  }
}
```

3 réactions par contexte = randomisation visible.
Style : court, joyeux, en français, avec une touche thématique du type.

### 3. Ajouter sprites

Au minimum :
```
public/sprites/customs/<type>.png        # affiché par CreatureSprite (cf. components/CreatureSprite.tsx)
```

Idéalement (pour évolutions distinctes) :
```
public/sprites/<type>/stage1/body.png
public/sprites/<type>/stage2/body.png
public/sprites/<type>/stage3/body.png
public/sprites/manual/<type>-stage1.png  # fallback
public/sprites/manual/<type>-stage2.png
public/sprites/manual/<type>-stage3.png
```

Format conseillé : PNG transparent, ~300×300, alignement central.

### 4. (Si nouveau type) Ajouter ennemis et avantages

Dans `lib/gameLogic.ts` :

```ts
const ENEMY_NAMES: Record<CreatureType, string[]> = {
  fire: [...],
  water: [...],
  plant: [...],
  electric: [...],
  <new>: ["Nom Ennemi 1", "Nom Ennemi 2", "Nom Ennemi 3"]
};

const TYPE_ADVANTAGE: Record<CreatureType, CreatureType[]> = {
  fire: ["plant"],
  water: ["fire"],
  plant: ["water", "electric"],
  electric: ["water"],
  <new>: ["<typeBattu>"]
};

// pickEnemyType : décider à quelles zones le nouveau type apparaît
```

### 5. Vérifier les `unlockedCreatures`

Le déblocage se fait via `playerLevel`. Avec un 5ème membre, l'enfant le débloque au niveau 20+ (`1 + floor(level/5)`). Si tu veux un déblocage plus rapide, ajuster :

```ts
const unlockedCreatures = clamp(1 + Math.floor(next.progress.level / 5), 1, CREATURE_POOL.length);
//                                                              ^ ajuster ici
```

Le `clamp(..., 1, CREATURE_POOL.length)` se met à jour automatiquement avec la nouvelle taille.

### 6. Lancer typecheck + build

```bash
npm run typecheck   # vérifie que tous les Record<CreatureType, ...> sont exhaustifs
npm run build
```

TS bloquera si tu as oublié une entrée dans un `Record<CreatureType, ...>` — c'est voulu.

### 7. Test manuel

- Reset save (cf AGENTS.md §9)
- Monter le niveau joueur jusqu'au seuil de déblocage (via console : `localStorage` patch)
- Vérifier que la nouvelle créature apparaît dans le panneau "Équipe" en Farm
- Switch créature → vérifier sprite, nom, stage 1
- Aller jusqu'à l'évolution (forcer via console si besoin) → vérifier les noms stage 2 / stage 3
- Combat : vérifier les avantages de type (si nouveau type)

## Pièges courants

- **Oublier un contexte de réaction** → crash silencieux car `pool[Math.floor(...)] ?? "..."` masque l'erreur.
- **Sprite manquant** → fallback via `srcByFamily` sinon image cassée. Toujours fournir au moins `customs/<type>.png`.
- **Table déjà prise** → 2 créatures rattachées à la même table = redondance pédagogique inutile.
- **Nouveau type sans entrée dans `pickEnemyType`** → le type n'apparaît jamais comme ennemi, donc l'avantage de type est invisible.
- **Multiplier les types** → max 6 environ, sinon l'enfant ne mémorise plus le triangle d'avantages.
