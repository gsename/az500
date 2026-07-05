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

## Fonctionnalités

- **Dashboard** : progression globale pondérée par domaine, objectifs à risque
  (score faible ou révision en retard), historique des examens blancs.
- **Domaines → objectifs** : navigation par les 4 domaines officiels
  (pondération Microsoft affichée), fiche de cours condensée par objectif
  (résumé, points clés, pièges fréquents, liens Microsoft Learn).
- **Quiz ciblé** : par objectif, feedback immédiat avec explication, met à
  jour la répétition espacée (SM-2) à la fin de la session.
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

