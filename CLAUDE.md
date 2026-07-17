# CLAUDE.md — Mémoire du projet Pigeard

> **Consigne permanente : tenir ce fichier à jour.** À chaque changement notable
> (hébergement, workflow, fonctionnalité transverse, convention), mettre à jour la
> section concernée dans le même commit que le changement. Le propriétaire
> (Antoine, non-développeur) compte sur ce fichier pour que chaque nouvelle
> session soit opérationnelle immédiatement.

## Le projet

Site vitrine statique (HTML/CSS/JS pur, aucune compilation) de **Pigeard
Opticiens**, maison familiale d'opticiens depuis 1863 — magasins à
Nogent-le-Rotrou, Brou et La Loupe. Tout est en **français** : contenu, commits,
commentaires de code, échanges avec le propriétaire.

- ~76 pages HTML à la racine, très travaillées SEO (JSON-LD, sitemap, llms.txt).
- Les pages `marque-*.html` + les grilles + `sitemap.xml` sont **générées** par
  `tools/build_static.py` à partir de `assets/data/*.json` — ne pas les éditer à
  la main pour le contenu ; le workflow GitHub `build-static.yml` les régénère
  automatiquement quand les JSON changent sur `main`.
- Le propriétaire édite textes/photos via **Pages CMS** (config `.pages.yml`).
  `GUIDE-EDITION.md` est son mode d'emploi : le garder simple et non technique.

## Hébergement & publication (⚠️ à jour au 2026-07-10)

- **Hostinger VPS** (Docker + nginx), config dans `deploy/nginx-vitrine.conf`.
  **Netlify est abandonné** — `netlify.toml` est un vestige inoffensif ; le
  robot Netlify commente encore les PR, ignorer ses previews.
- Le serveur fait un `git pull` de `main` **toutes les 5 minutes** : fusionner
  dans `main` = mise en ligne sous ~5 min sur https://www.pigeard-opticiens.fr.
- **Workflow validé par le propriétaire** : Claude développe sur sa branche,
  ouvre une PR, puis **la fusionne lui-même** dans `main` (pas d'attente de
  validation), et vérifie ensuite le site en production (`curl` sur le HTML +
  les assets, ~10 min après la fusion).
- nginx : redirection domaine nu → www, 404 personnalisée, gzip, redirections
  301 des anciennes URLs Shopify (QR codes imprimés !), fichiers de travail
  (`.md`, `.py`, `/tools/`, `/deploy/`…) non servis au public.
- Cache : HTML `no-cache`, CSS/JS 1 h, images/polices 30 j, JSON 5 min. Par
  précaution, bumper le paramètre `?v=` des `<link>`/`<script>` lors d'une
  modification de `site.css`/`site.js` (convention existante).

## Postes de travail & synchronisation

- Le site est géré depuis **plusieurs endroits** : le(s) PC d'Antoine (Claude
  Code local), les sessions Claude sur le web/mobile, Pages CMS et le robot
  GitHub Actions. **Le dépôt GitHub est le seul lien entre eux** — les sessions
  ne communiquent jamais directement ; tout ce qui doit être partagé doit être
  commité et poussé.
- Règles pour chaque session, locale ou en ligne : **toujours `git pull` avant
  de travailler** ; **jamais de fin de session avec du travail non poussé** ;
  jamais de `push --force` sur `main`.
- Pour installer un nouveau poste : suivre `CONFIGURATION-NOUVEAU-PC.md` (à la
  racine). Ce document ne sert qu'au premier démarrage ; ensuite, c'est le
  présent fichier qui fait foi.

## Structure & design system

- `assets/css/site.css` : design system partagé (thème sombre chaud). Variables
  clés dans `:root` : `--vert` #7E8C5A (accent), `--encre` #26231C, `--camel`
  #D1A379, `--creme`, `--noir` ; polices `--serif` Playfair Display, `--sans`
  Karla, `--hand` Reenie Beanie (manuscrite) — toutes auto-hébergées
  (`assets/css/fonts.css`).
- `assets/js/site.js` : moteur commun (GSAP + ScrollTrigger + Lenis, chargés
  depuis `assets/js/vendor/`).
- Logo lunettes : `assets/brand/lunette-white.svg` (et déclinaisons).
- Les pages utilisent les **speculation rules** (pré-rendu) et un repli
  `<noscript>` : toute fonctionnalité JS doit rester inoffensive sans JS et en
  pré-rendu.

## Écran de chargement (loader)

- `assets/js/loader.js` + un extrait inline dans le `<head>` de chaque page
  (juste après `site.css`) : voile encre immédiat, lunette qui se remplit du
  bas vers le haut, message manuscrit « Réglage de la netteté… » qui se
  défloute.
- Une fois **par visite** (`sessionStorage['pg-loader-vu']`), durée mini 1,6 s /
  maxi 3,2 s, jauge plafonnée à 90 % tant que la page n'est pas prête (DOM
  chargé + images `fetchpriority="high"` disponibles — on n'attend pas
  l'événement `load`, trop tardif sur mobile). Désactivé si
  `prefers-reduced-motion`, sans JS, en pré-rendu et au retour bfcache.
- **Le défilement est libéré dès le début du fondu de sortie** (retrait de
  `pg-loading` au premier instant de `finish()`) : ne pas réintroduire de
  blocage du scroll pendant ou après le fondu, c'était la cause d'une latence
  ressentie sur mobile.
- **Toute nouvelle page HTML doit reprendre l'extrait inline** (copier le bloc
  « Écran de chargement » depuis `index.html`). La 404 n'en a pas, c'est voulu.
  Le gabarit de `tools/build_static.py` inclut le même bloc pour les pages
  `marque-*`.

## Vérification

Pas de suite de tests : vérifier en conditions réelles. Serveur local
(`python3 -m http.server`) + Playwright avec le Chromium préinstallé
(`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`,
`NODE_PATH=/opt/node22/lib/node_modules`). Après fusion, contrôler la prod.
