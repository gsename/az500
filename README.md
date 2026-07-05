# az500

App de révision pour la certification AZ-500 (Microsoft Azure Security Technologies).

Application 100% statique : React + Vite + TypeScript, aucune dépendance à un
backend ou à un service externe. Les données de progression sont stockées
côté navigateur dans IndexedDB (via Dexie.js).

## Lancer le projet (avec Node.js installé)

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:5173
npm run build    # build statique dans dist/
npm run preview  # prévisualiser le build de production
```

## Lancer le projet sans Node.js installé (via Docker)

Si Node.js n'est pas installé localement, les mêmes commandes peuvent être
exécutées dans un conteneur Node — c'est une simple commodité de
développement, l'application elle-même ne dépend pas de Docker :

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 npm install
docker run --rm --name az500-dev -p 5173:5173 -v "${PWD}:/app" -w /app node:20 npm run dev
# Dans un autre terminal, pour arrêter :
docker stop az500-dev
```

## Partager l'app avec quelqu'un

Deux builds sont disponibles selon le besoin — le point important : **une app
Vite ne peut pas s'ouvrir en double-cliquant `dist/index.html`**. Les
navigateurs bloquent par CORS le chargement des `<script type="module">`
depuis une origine `file://` (comportement standard de tout navigateur
moderne, pas spécifique à ce projet) — vérifié : ça échoue silencieusement
(page blanche) sans build dédié.

**Option A — dossier à héberger (`dist/`)** : le build normal. Fonctionne
servi par n'importe quel serveur statique, sans configuration (le routing par
`#/...` évite d'avoir besoin d'une règle de réécriture serveur) :

```bash
npm run build   # génère dist/
npx serve dist  # ou tout autre serveur statique, ou double-clic si Node est absent : voir option B
```

**Option B — fichier unique à envoyer (`dist-single/index.html`)** : tout
(JS + CSS) est inliné dans un seul fichier HTML autonome. **Vérifié** :
s'ouvre directement en double-clic (`file://`), navigation et sauvegarde de
la progression (IndexedDB) fonctionnent sans aucun serveur :

```bash
npm run build:single   # génère dist-single/index.html
```

C'est la façon la plus simple de partager l'app : envoie juste ce fichier
(par mail, clé USB, Teams…), la personne le double-clique et l'app tourne
entièrement en local, hors-ligne, avec sa propre progression sauvegardée dans
son navigateur.

## Fonctionnalités

- **Dashboard** : progression globale pondérée par domaine, objectifs à risque
  (score faible ou révision en retard), historique des examens blancs.
- **Domaines → objectifs** : navigation par les 4 domaines officiels
  (pondération Microsoft affichée), fiche de cours condensée par objectif
  (résumé, points clés, pièges fréquents, liens Microsoft Learn).
- **Quiz ciblé** : ~30 questions par objectif (banque de 360 au total). Chaque
  session tire un sous-ensemble au hasard (10, 20, ou tout), l'ordre des
  réponses est mélangé (stable pendant la session, différent à chaque passage),
  feedback immédiat avec explication, et mise à jour de la répétition espacée
  (SM-2) à la fin. Les distracteurs sont plausibles et dans le même domaine
  pour éviter la devinette par élimination.
- **Examen blanc** : tirage pondéré selon les % officiels des 4 domaines,
  chronométré (durée officielle de l'examen), résultat détaillé par domaine
  avec score ramené sur 1000 (seuil de réussite 700).
- **Répétition espacée** : algorithme SM-2 simplifié, calculé par objectif à
  partir du taux de bonnes réponses de chaque session (quiz ciblé ou tranche
  d'examen blanc concernant cet objectif).
- **Labs** : scénarios pratiques à réaliser sur ton propre tenant Azure
  (portal.azure.com), avec checklist de complétion persistée.

Toutes les données de contenu (référentiel, fiches de cours, banque de
questions, études de cas, labs) sont versionnées en JSON dans `src/content/`.
Toutes les données utilisateur (progression, tentatives, résultats d'examen,
complétion des labs) sont stockées côté navigateur dans IndexedDB via
Dexie — rien n'est envoyé à un serveur. Pour repartir de zéro, vide les
données du site dans les outils de développement du navigateur (Application
▸ IndexedDB ▸ az500-study-guide ▸ Delete database).

## Vérification end-to-end (Playwright)

Un script pilote un vrai navigateur headless pour vérifier que les
principaux parcours fonctionnent (dashboard, navigation, quiz, examen blanc,
labs) :

```bash
npm run dev &                 # dans un terminal
npm run test:e2e              # dans un autre (installe Chromium au besoin)
```

Avec Docker (pas de Node local), tout se fait dans le même conteneur — voir
`scripts/smoke-test.mjs` pour le détail des vérifications effectuées.

