# AGENTS.md — Monster Farm Quest

Document d'onboarding pour tout agent IA (ou humain) qui intervient sur ce projet.
Lis-le **avant** de toucher au code.

---

## 1. Pitch

App web mobile-first pour apprendre les tables de multiplication à un enfant.
Mix de **farm** (potager, plantation, récolte), **pokemon** (créatures, types, évolution, combat) et **tamagotchi** (faim, bonheur, soin).

**Règle d'or :** chaque action de jeu déclenche au moins une multiplication. Le gameplay et l'apprentissage sont indissociables.

---

## 2. Stack & commandes

- Next.js 14 (App Router), TypeScript strict, React 18, Tailwind, Framer Motion
- State persisté côté client via `localStorage` (clé `monster-farm-save-v2`)
- Pas de backend hors une route REST jouet `/api/question` (peu utilisée)

```bash
npm run dev         # serveur de dev
npm run build       # build prod
npm run typecheck   # tsc --noEmit (à passer avant tout commit)
npm run lint        # eslint
```

Avant de marquer une tâche terminée : **`npm run typecheck` + `npm run build` doivent passer.**

---

## 3. Architecture

```
app/
  page.tsx              # home (placeholder, à enrichir)
  farm/page.tsx         # écran principal : potager, créature, équipe, actions
  battle/page.tsx       # combat tour par tour vs ennemi
  train/page.tsx        # ateliers (5 questions → +stats)
  api/question/route.ts # route jouet
components/
  Creature.tsx          # carte créature (affiche nom personnalisé + stage)
  CreatureSprite.tsx    # sprite (PNG dans /public/sprites)
  EvolutionModal.tsx    # modale "Avant / Après" à l'évolution
  QuestionGate.tsx      # ★ composant générique : N questions → callback. Toutes les actions passent par là.
  AnswerButtons.tsx     # grille 2×2 (4 réponses)
  QuestionBox.tsx       # affichage "X × Y = ?"
  FarmPlotTile.tsx      # case du potager
  BottomGameNav.tsx     # nav fixée en bas (Ferme / Combat / Train / Carte)
  ResourceTopBar.tsx    # bandeau ressources en haut
  ProgressBar.tsx       # barre PV / XP
  RewardBurst.tsx       # animation pop "+5XP" etc.
lib/
  types.ts              # types partagés (Creature, PlayerState, QuestionRange...)
  gameLogic.ts          # ★ cœur du jeu : questions, mastery, progression, combat, evolution
  useGameState.ts       # hook React : load/save + tick temps
  storage.ts            # localStorage helpers
  creatureVisuals.ts    # noms par stage + réactions FR par contexte
  spriteConfig.ts       # mapping famille/stage → assets
Doc/                    # doc fonctionnelle FR (vieille, à recroiser avec ce fichier)
```

---

## 4. Concept-clé : « 1 action = 1 multiplication »

Toute action UI qui modifie le state passe par **`QuestionGate`** (`components/QuestionGate.tsx`).
Échec à la question = action **refusée** (mais la mastery est tout de même mise à jour).

| Catégorie | Nb questions | Range max |
|---|---|---|
| Nourrir, récolter, planter, acheter graine | 1 | x10 |
| Acheter case, upgrade stat | **2** | x10 |
| Switch créature, renommer | 1 | x10 |
| Engager un atelier d'entraînement | 1 | x10 |
| Attaque / Défense / Objet en combat | 1 | **x15** |
| Coup spécial en combat | **2** | **x15** |
| Faire évoluer | 1 | x10 |

**Pour ajouter une action :** voir `.claude/skills/add-game-action/SKILL.md`.

---

## 5. Règles tables de multiplication

- **Table de 2 retirée définitivement** (sur-représentée, trop facile). Filtrée à 3 endroits :
  - `lib/gameLogic.ts` → `defaultProgress` initialise `[3,4]` (zone 1)
  - `createInitialState` purge `unlockedTables` des `2` au chargement (saves anciennes)
  - `buildQuestion` filtre `left === 2` quoi qu'il arrive
- Tables disponibles : **3 → 10**
- Range :
  - `"standard"` (défaut) : `right ∈ [1..10]` — actions hors combat
  - `"extended"` (combat à enjeu) : `right ∈ [1..15]`, multiplications x11..x15 légèrement plus rares
- Distracteurs : 3 par question (≠ correct, > 0, proches mais pas trop). Total = 4 boutons.
- Pondération `buildQuestion` : favorise tables faiblement maîtrisées, tables 7+, paires jamais vues. Évite les paires récentes.

---

## 6. Système d'évolution

**Manuelle uniquement.** Il n'y a plus aucun appel automatique à `triggerEvolution` (suppression volontaire — c'était un bug à l'audit initial).

Conditions (`getEvolutionProgress`) :
- Stage 1 → 2 : niveau créature ≥ 6 + 1 matériau rare
- Stage 2 → 3 : niveau créature ≥ 12 + 2 matériaux rares

Flux :
1. Quand `evolutionInfo.ready === true`, un bouton "✨ Faire évoluer" apparaît dans Farm, Battle, Train.
2. Clic → `QuestionGate` avec 1 multiplication.
3. Bonne réponse → `triggerEvolution(state)` qui :
   - consomme le matériau rare,
   - **multiplie toutes les stats** par 1.5 (stage 2) ou 2 (stage 3),
   - débloque `specialUnlocked = true`,
   - +15 bonheur.
4. Modale `EvolutionModal` affiche "Avant / Après" + nom personnalisé + stage.

Mauvaise réponse à la question d'évolution = évolution refusée (mais la créature garde son niveau et son matériau rare).

---

## 7. Système de niveau / stats créature

Chaque créature a 4 stats visibles :
- **Force** (`attack`) — dégâts
- **Vitesse** (`speed`) — initiative + crit
- **Intelligence** (`intelligence`) — puissance du spécial
- **Défense** (`defense`) — encaisse + HP

Gains : XP par bonne réponse, par récolte/nourrir, par tour de combat, et un peu plus en atelier.

**Pénalité faim** (ajoutée à `applyTimeSystems`) :
- `hunger < 30` → perte XP créature
- `hunger < 15` → perte de niveau possible

Le tick s'applique toutes les 6 minutes (`NEEDS_DECAY_MS`). C'est volontairement perceptible.

**Déblocage créatures** : `1 + floor(playerLevel / 5)`, max 4.
**Déblocage zones** : `1 + floor(currentCreature.level / 4)`, max 4.

Les 4 créatures sont rattachées à une table conceptuelle :

| Créature | Type | Table |
|---|---|---|
| Flamy | fire | 3 |
| Bubbli | water | 5 |
| Leafy | plant | 7 |
| Zappi | electric | 9 |

(Champ `creature.multiplication_table`. Actuellement informatif uniquement — un bonus créature-sur-sa-table reste à ajouter si besoin de relier davantage le choix de créature à l'apprentissage.)

---

## 8. Combat

- 4 actions : attaque / défense / objet / spécial
- Spécial (Sort) verrouillé tant que `creature.specialUnlocked === false` (stage évolution ≥ 2 OU intelligence ≥ 15). L'UI montre 🔒.
- `enemy.table_focus` détermine la table demandée pendant le combat — l'enfant travaille la table de la zone.
- Avantages de type : feu > plante, eau > feu, plante > eau/électrique, électrique > eau (×1.25 ou ×0.82). Affichage à améliorer côté UI.

---

## 9. Persistance

- Clé : `monster-farm-save-v2`
- Version legacy purgée à `monster-farm-save-v1`
- Tick automatique toutes les 15s pour appliquer `applyTimeSystems` (énergie qui se recharge, faim/bonheur qui descendent)
- **Reset save (debug)** :
  ```js
  // Console navigateur
  localStorage.removeItem("monster-farm-save-v2");
  localStorage.removeItem("monster-farm-save-v1");
  location.reload();
  ```
  Une fonction `resetState()` existe dans `lib/storage.ts` mais aucun bouton UI ne l'expose. À ajouter si besoin.

---

## 10. Pièges à éviter (anti-patterns repérés)

Bugs corrigés ; **ne pas réintroduire** :

1. **Ne JAMAIS** appeler `triggerEvolution` automatiquement après une action. C'est une action joueur.
2. **Ne JAMAIS** initialiser `unlockedTables` avec toutes les tables — on noie l'enfant. Toujours partir des tables de la zone 1.
3. **Ne JAMAIS** initialiser `unlockedCreatures: 4` au démarrage. Le sentiment de progression dépend du déblocage.
4. **Ne JAMAIS** afficher uniquement `stageName` quand un `creature.name` personnalisé existe. Toujours afficher les deux.
5. Une nouvelle action UI **doit** passer par `QuestionGate`. Sinon l'enfant peut cliquer sans rien apprendre.
6. **Ne pas** ajouter table de 2 dans `ZONE_TABLES`, `CREATURE_POOL`, ni les distracteurs. Filtrée systématiquement.
7. En combat, toujours utiliser `buildQuestion(state, enemy.table_focus, recentKeys, "extended")` — l'enfant doit voir des x11..x15.
8. Le coup spécial demande **2** questions (l'utilisateur a explicitement validé que c'est un coup à enjeu).

---

## 11. Tests / vérifications avant de pousser

Pas de suite de tests automatisée. À chaque modif :

1. `npm run typecheck` — doit passer sans erreur
2. `npm run build` — doit passer
3. **Test manuel** :
   - Démarrer `npm run dev`, ouvrir `http://localhost:3000`
   - Reset le save (cf §9)
   - Vérifier l'écran Farm : créature visible, nom personnalisé après "Renommer", 1 créature débloquée au départ
   - Faire 1 question Nourrir → la modale s'ouvre, 4 boutons, bonne réponse = repas donné
   - Aller en Combat → vérifier que `Spécial` est 🔒 si stage 1
   - Aller en Train → engager l'atelier demande 1 multiplication, puis enchaîne 5 questions
   - Forcer l'évolution (via console : monter `creature.level` à 6 et `rareMaterial` à 1) → bouton ✨ apparaît
   - Couper le serveur, attendre 6+ minutes, recharger → vérifier que la faim a baissé et que l'XP/niveau a éventuellement été pénalisé
4. **Le typecheck/build vérifie la correction du code, pas la correction de la feature.** Tester à l'écran.

---

## 12. Cheat-sheet équilibrage

| Paramètre | Fichier | Constante |
|---|---|---|
| Coût énergie d'un combat | `app/battle/page.tsx` | `BATTLE_COST = 3` |
| Coût énergie d'un atelier | `app/train/page.tsx` | `TRAIN_COST = 2` |
| Pas d'XP joueur par niveau | `lib/gameLogic.ts` | `LEVEL_XP_STEP = 115` |
| Pas d'XP créature | `lib/gameLogic.ts` | `CREATURE_XP_STEP = 90` |
| Régen énergie | `lib/gameLogic.ts` | `ENERGY_REGEN_MS = 3min` |
| Tick faim/bonheur | `lib/gameLogic.ts` | `NEEDS_DECAY_MS = 6min` |
| Range étendue x15 | `lib/gameLogic.ts` | `buildQuestion(..., "extended")` |
| Multiplicateur évo | `lib/gameLogic.ts` → `triggerEvolution` | `1.5` (stage 2) / `2` (stage 3) |
| Conditions évo | `lib/gameLogic.ts` → `getEvolutionProgress` | niveau + matériau rare |
| Tables par zone | `lib/gameLogic.ts` | `ZONE_TABLES` |
| Pool créatures | `lib/gameLogic.ts` | `CREATURE_POOL` |

---

## 13. Skills disponibles

Procédures détaillées dans `.claude/skills/` :

- `add-game-action` — ajouter une nouvelle action gatée par multiplication
- `add-creature` — ajouter une créature au roster

---

## 14. Reste à faire (non bloquant)

- Onglet "Carte" du `BottomGameNav` pointe encore vers `/` (home placeholder). Soit le retirer, soit faire une vraie carte.
- Bouton "Reset save" caché dans un coin (panneau Stats ?) pour les parents.
- Bonus XP/dégâts si la créature combat sur **sa** table conceptuelle (relie vraiment créature ↔ table).
- Onboarding pour la 1ère ouverture : flèche "Touche ce bouton", explication de la jauge faim.
- Visualisation par table (vue "table de 7 : 6/10 paires maîtrisées").
