# Déploiement & accès

## 🏠 Mode LAN (jouer sur tablette/autre PC chez toi)

### 1. Lancer le serveur en mode LAN

```bash
npm run dev:lan
```

Au premier lancement, Windows va proposer **"Autoriser Node.js à communiquer sur les réseaux privés"**. Coche la case et accepte.

### 2. Trouver l'IP du PC

```powershell
ipconfig
```

Cherche `IPv4` dans `Carte Ethernet` ou `Carte Wi-Fi`. Format typique : `192.168.1.X`.

Sur ce PC actuellement : **`192.168.1.105`**

### 3. Sur la tablette ou autre ordi

Connecte l'appareil **au même Wi-Fi** que le PC, puis ouvre dans le navigateur :

```
http://192.168.1.105:3000
```

(Remplace par ton IP si elle a changé.)

### Si ça ne marche pas

- Le pare-feu Windows bloque souvent les premiers accès. Va dans **Paramètres → Réseau et Internet → Pare-feu Windows → Autoriser une appli** et autorise `node.exe` pour le réseau **privé**.
- Le routeur isole parfois les appareils. Vérifie qu'il n'y a pas un mode "AP isolation" / "guest Wi-Fi".

## 📱 Installer l'app sur la tablette (PWA)

Le jeu est configuré comme **PWA installable**. Une fois la page chargée sur la tablette :

### iOS (iPad, iPhone)
1. Ouvre `http://192.168.1.105:3000` dans **Safari** (pas Chrome iOS).
2. Touche le bouton **Partager** (carré avec flèche).
3. Choisis **"Sur l'écran d'accueil"** → "Ajouter".
4. L'icône Monster Farm Quest apparaît comme une vraie app, plein écran.

### Android / Chrome
1. Ouvre l'URL dans Chrome.
2. Menu (⋮ en haut à droite) → **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**.
3. Icône installée, lancement plein écran.

### Configuration PWA actuelle
- **Nom** : Monster Farm Quest
- **Mode** : standalone (plein écran, sans barre de navigateur)
- **Orientation** : portrait
- **Couleurs** : fond `#0B1226`, thème `#4F46E5` (violet)
- **Icônes** : `/icon-192.webp` et `/icon-512.jpg`
- **Langue** : français

Fichier : [public/manifest.json](public/manifest.json)

## 🌐 Déploiement public (optionnel, plus tard)

Pour rendre le jeu accessible depuis n'importe où sans dépendre de ton PC allumé :

### Vercel (recommandé pour Next.js, gratuit)

1. Pousse le repo sur GitHub
2. Va sur [vercel.com](https://vercel.com), connecte ton compte GitHub
3. Importe le repo `table`
4. Vercel détecte Next.js automatiquement et déploie
5. Tu reçois une URL `https://table-XXXX.vercel.app`
6. À chaque `git push`, redéploiement automatique

Aucune config supplémentaire requise — le projet est déjà compatible.

### Autres options
- **Netlify** : même principe que Vercel, gratuit aussi
- **Cloudflare Pages** : gratuit, performant
- **Self-host** : sur un Raspberry Pi avec `npm run build && npm run start:lan` derrière un reverse proxy nginx

## 🛠 Mode production locale

Si tu veux tester les perfs prod en LAN avant déploiement :

```bash
npm run build
npm run start:lan
```

→ Bundle optimisé, pas de hot reload, accessible sur le LAN sur le port 3000.

## ⚠️ Données

Le state du jeu (créature, niveau, XP, succès…) est stocké dans le **localStorage du navigateur**. Donc :
- Chaque appareil a sa propre partie indépendante
- Vider le cache navigateur = perdre la partie
- Pas de sync multi-appareils

Pour synchroniser entre PC et tablette, il faudrait un backend (à voir plus tard).
