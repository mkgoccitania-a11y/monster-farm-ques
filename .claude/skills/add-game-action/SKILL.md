---
name: add-game-action
description: Ajouter une nouvelle action de jeu gatée par une (ou plusieurs) multiplication. Utilise QuestionGate, met à jour le state via gameLogic.ts, refuse l'action si une réponse est fausse.
---

# Ajouter une action de jeu

Une "action" = un bouton qui modifie le `PlayerState` (planter, acheter, combattre, évoluer, etc.).
**Règle d'or :** toute action doit passer par `QuestionGate`. Pas d'exception.

## Quand utiliser cette skill

- Le user demande "ajoute un bouton pour <verbe>"
- Le user veut transformer une action gratuite existante en action gatée

## Décisions à prendre avant de coder

| Question | Choix typique |
|---|---|
| Nb de questions ? | 1 pour action légère, 2 pour action coûteuse / à enjeu |
| Range ? | `"standard"` (x1..x10) hors combat, `"extended"` (x1..x15) en combat |
| Récompense en cas de bonne réponse ? | Modifier le state via une fonction de `gameLogic.ts` |
| Que faire si **une** réponse est fausse ? | **Refuser l'action** (commit la mise à jour mastery uniquement) |
| Forcer une table précise ? | Oui pour combat (`enemy.table_focus`), non sinon |

## Procédure

### 1. (Si nécessaire) Ajouter une fonction de state dans `lib/gameLogic.ts`

Convention : la fonction renvoie `{ ok: boolean; nextState: PlayerState; reason?: string }`.

```ts
export const doMyAction = (state: PlayerState, args: ...) => {
  // validations
  if (notEnoughCoins) return { ok: false, nextState: state, reason: "Pas assez de pieces." };

  // modifs immuables du state
  let next = { ...state, progress: { ...state.progress, coins: state.progress.coins - cost } };

  // si la créature gagne XP / change : appeler applyXpRewards puis applyProgression
  next = applyXpRewards(next, current.id, xpGain, playerXpGain, coinsGain);
  next = applyProgression(next);

  return { ok: true, nextState: next };
};
```

### 2. Brancher l'action dans la page concernée

Dans `app/<page>/page.tsx` :

```tsx
// 1. État local pour le pending
const [pending, setPending] = useState<PendingAction | null>(null);

// 2. Helper pour générer les questions + lancer le gate
const askThenRun = (subtitle: string, count: number, run: (results: QuestionResult[]) => void) => {
  const questions: MultiplicationQuestion[] = [];
  const recents: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const q = buildQuestion(undefined, recents);          // ou (state, table, recents, "extended")
    questions.push(q);
    recents.push(q.key);
  }
  setPending({ subtitle, questions, run });
};

// 3. Handler du bouton
const handleMyAction = () => {
  // pré-checks rapides (UX) — éviter d'ouvrir la modale si déjà impossible
  if (state.progress.coins < cost) {
    setMessage("Pas assez de pieces.");
    flashMood("oops", "Pas assez");
    return;
  }

  askThenRun("Mon action : 1 multiplication", 1, (results) => {
    // applyAnswers met à jour la mastery pour CHAQUE question, OK ou pas
    const { next, allCorrect } = applyAnswers(results, 0.6);
    if (!allCorrect) {
      commit(next);
      setMessage("Reponse fausse, action refusee.");
      flashMood("oops", "Rate");
      return;
    }
    const done = doMyAction(next, ...);
    if (!done.ok) {
      commit(next);
      setMessage(done.reason ?? "Impossible.");
      return;
    }
    commit(done.nextState);
    flashMood("happy", "Fait !");
    popBurst("+1 truc", "gold");
  });
};
```

Dans le JSX, ajouter le `QuestionGate` une seule fois (déjà présent dans Farm/Battle/Train) :

```tsx
{pending && (
  <QuestionGate
    open
    subtitle={pending.subtitle}
    questions={pending.questions}
    onAllAnswered={(results) => {
      const action = pending;
      setPending(null);
      action.run(results);
    }}
    onCancel={() => setPending(null)}
  />
)}
```

### 3. Vérifier le contrat

- [ ] Mauvaise réponse = action refusée, **mais** mastery mise à jour (via `applyAnswers` / `resolveAnswer`)
- [ ] Pré-checks rapides avant d'ouvrir la modale (pas de gaspillage de question si l'action est déjà impossible)
- [ ] Message texte côté UI mis à jour à chaque branche (succès / refus / erreur)
- [ ] La range étendue (`"extended"`) **uniquement** pour les coups à enjeu en combat

### 4. Lancer typecheck + build

```bash
npm run typecheck
npm run build
```

### 5. Test manuel

- Ouvrir la page concernée
- Reset save si besoin (cf AGENTS.md §9)
- Cliquer le bouton → la modale s'ouvre avec le bon `subtitle` et le bon nb de questions
- Répondre faux → vérifier que l'action est refusée et que le message est explicite
- Répondre juste → vérifier l'effet (ressource, créature, etc.) et l'animation

## Pièges courants

- **Oublier `applyProgression`** après `applyXpRewards` → l'unlock zones/créatures ne se met pas à jour.
- **Passer `"extended"` hors combat** → l'enfant voit du x14 pour planter une graine, c'est punitif.
- **Ne pas filtrer la table de 2** → ça arrive si on passe un `forcedTable=2` quelque part. Ne jamais forcer 2.
- **Commit le state seulement en cas de succès** → la mastery des bonnes/mauvaises réponses se perd. Toujours `commit(next)` après `applyAnswers`, même si on refuse ensuite.
