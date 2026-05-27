# Monster Farm Quest

Jeu web pour apprendre les **tables de multiplication** (3 à 10, étendu à 15 en combat), mêlant **élevage de créatures, ferme, et combats** type Pokemon. Pensé pour les enfants.

🎯 **Règle d'or** : chaque action de jeu (planter, nourrir, combattre, capturer, évoluer…) déclenche une multiplication. Bonne réponse = action réussie + bonus.

## ✨ Fonctionnalités

- **10 espèces** de créatures × **3 stages d'évolution** = 30 visuels uniques
- **4 stats** (Force / Vitesse / Intelligence / Défense) chacune liée à un atelier d'entraînement et à une attaque de combat
- **Combat tour par tour** : Frappe / Esquive / Sort / Garde + Potion, avec avantages de type, combo de victoires, ennemis variés (espèces, stage, tempérament)
- **Boss de zone**, **ennemis élites**, **capture** d'ennemis (Pokedex extensible)
- **Système tamagotchi** : faim, bonheur, énergie avec **incidences réelles** sur les combats (debuffs si négligés)
- **Évolution** déclenchée par le joueur, multiplicateur de stats (×1.5 ou ×2)
- **Quêtes journalières** (3 par jour, regénérées à minuit)
- **Achievements** (12 succès) + **streak** de connexion quotidienne
- **PWA installable** sur tablette/mobile avec raccourcis et fonctionnement hors-ligne

## 🚀 Démarrage

```bash
npm install
npm run dev          # localhost:3000
npm run dev:lan      # accessible aux autres appareils du LAN
npm run build        # build prod
npm run typecheck    # tsc strict
```

## 🛠 Stack

- **Next.js 14** (App Router, static generation)
- **TypeScript** strict
- **Tailwind CSS** + **Framer Motion**
- **localStorage** pour la persistance (clé `monster-farm-save-v2`)
- **PWA** : Service Worker + manifest

## 📁 Architecture

Voir [AGENTS.md](AGENTS.md) — doc d'onboarding complète pour tout agent IA ou humain qui intervient sur le code.

## 🚢 Déploiement

Voir [DEPLOY.md](DEPLOY.md) — LAN domestique, PWA, Vercel.

## 📜 Licence

Projet personnel, usage libre.
