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
- Les pages `marque-*.html` + les grilles + `sitemap.xml` + le nombre de
  marques françaises de l'accueil (`index.html`, marqueurs `GEN:stat-france`)
  + les puces « Nouveau » de l'accueil (marqueurs `GEN:nouveautes`)
  sont **générés** par `tools/build_static.py` à partir de `assets/data/*.json` — ne pas les éditer à
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
- **Exception automatique** (accord du propriétaire, 2026-11-05) : le programme
  `scripts/site_activer.py` du dépôt `Video` (tâche Windows horaire sur le PC
  d'Antoine) pousse **directement sur `main`** des commits « Vidéos d'Iris : …
  [automatique] » qui ne modifient que les cartes de `videos-iris.html` (voir
  « Iris et ses vidéos »). Toujours `git pull` avant de travailler.
- nginx : redirection domaine nu → www, 404 personnalisée, gzip, redirections
  301 des anciennes URLs Shopify (QR codes imprimés !), fichiers de travail
  (`.md`, `.py`, `/tools/`, `/deploy/`…) non servis au public, et depuis le
  2026-09-08 refus de tout chemin commençant par un point (`/.git/`,
  `/.claude/`, `/.gitignore`…, sauf `/.well-known/`).
- **Une modification de `deploy/nginx-vitrine.conf` n'est active qu'après
  recréation du conteneur sur le VPS** : en SSH root,
  `sh /docker/pigeard-vitrine/repo/deploy/recharger-nginx.sh` (attendre que
  le `git pull` automatique ait récupéré la fusion, ~5 min). Un simple
  `nginx -s reload` **ne suffit pas** : la conf est montée fichier par fichier
  dans le conteneur et git remplace ce fichier à chaque pull (nouvel inode),
  donc le conteneur relit l'ancienne version — constaté le 2026-09-09.
  Contrôle : `curl -sI https://www.pigeard-opticiens.fr/.git/HEAD` doit
  renvoyer 404.
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
- `tools/affiches/` : visuels pour les réseaux sociaux (stories, posts) et
  affiches imprimables, composés en HTML avec la charte du site puis rendus via
  Playwright — `rendu-story.mjs` (1080×1920), `rendu-affiche.mjs` (A3
  portrait, PNG 300 dpi + PDF), `rendu-a4.mjs` (A4 `paysage` ou `portrait`,
  PNG 300 dpi + PDF) ou `rendu-ecran.mjs` (écrans : PNG en définition simple
  et double, ex. 1080×1920 + 2160×3840) ; `rendu-visuel.mjs` (taille libre → JPEG +
  WebP) pour les visuels publiés sur le site (galeries des fiches marques). Le blason du Golf du Perche y est redessiné en
  vectoriel (`logo-golf-du-perche.svg`). Visuels produits : la photo fournie
  est détourée sur fond transparent (ex. `brett-le-mans-classic-2026-monture.png`)
  et le logo de la marque vient de son site officiel (ex. `logo-brett.png`) ;
  sources et informations non vérifiables notées en commentaire du HTML. Non
  servis au public (comme tout `/tools/`).

## Journées Privilège 2026 (affiches magasin, 2026-11-03)

- Opération du **15 novembre au 29 décembre 2026** : -50 % sur une sélection
  de montures de grandes marques, mentions « *Sur articles signalés en
  magasin. Voir conditions en magasin. Dispositif médical CE. » Source :
  planning éditorial novembre 2026 de l'agence My Client Is Rich (PDF fourni
  par le propriétaire, page 3 ; non commité, les `*.pdf` sont ignorés par git).
- `tools/affiches/journees-privilege-2026-facing-a4-paysage.html` (A4 paysage,
  fond blanc, posée sur le présentoir des montures en promotion : « Sur cette
  sélection ») ; variante **avec le magasin en fond** (même composition que le
  16:9 retiré, demandée par le propriétaire le 2026-11-03)
  `journees-privilege-2026-facing-a4-paysage-photo.html`, photo
  `journees-privilege-2026-magasin-a4-paysage.jpg` (recadrage du visuel de
  l'agence) ; et, pour l'**écran de la vitrine (format 9:16 vertical**,
  précisé par le propriétaire le 2026-11-03 ; une version 16:9 faite par
  erreur a été retirée),
  `journees-privilege-2026-ecran-vitrine-9x16.html` → PNG 1080×1920 et
  2160×3840 (`node rendu-ecran.mjs <html> <sortie> 1080 1920`). Fond : photo
  du visuel de l'agence (magasin de Nogent-le-Rotrou), recadrée
  `journees-privilege-2026-magasin-9x16.jpg`. La version A4 portrait
  (`journees-privilege-2026-ecran-vitrine-a4.html`, `-magasin.jpg`) reste
  disponible pour une impression en vitrine ; elle ne convient pas à l'écran.
  Rendu A4 : `node rendu-a4.mjs <html> <png> <pdf> paysage|portrait`.
- Ces affiches reprennent les codes du visuel de l'agence, **pas la charte du
  site** : bandeaux noir #000000 / corail #FF635B / vert #6A7959 (relevés au
  pixel), étoile noire « -50% », police **Poppins** (OFL, auto-hébergée dans
  `tools/affiches/polices/`, lettres identiques au visuel de l'agence).
- **Popup animé sur le site** (2026-11-03) : `assets/js/operation.js` +
  `assets/css/operation.css`, chargés par le bloc « Popup d'opération » de
  `site.js` seulement entre `debut` et `fin` de `assets/data/operation.json`
  (JJ/MM/**AAAA**, jours inclus, heure locale du visiteur ; Pages CMS,
  rubrique « Popup opération commerciale ») — réglé sur le 15/11 → 29/12/2026.
  Une fois par visite (`sessionStorage['pg-operation-vu']`), ~1,8 s après la
  fin du loader, jamais en pré-rendu ni sur `mentions-legales.html`. Aperçu :
  `?operation=1` (une fois par visite aussi, depuis le 2026-11-03 à la
  demande du propriétaire : le lien force un nouvel affichage, les pages
  suivantes ne le rejouent pas), `?operation=0`. Une page pré-rendue avec
  une mémoire d'onglet antérieure est prévenue par `BroadcastChannel
  ('pg-operation')` (pré-rendu non testable dans le Chromium automatisé
  d'ici ; canal vérifié entre deux pages ouvertes). Après modification
  de `operation.js`/`.css`, bumper `VERSION` dans ce bloc de `site.js` (puis
  le `?v=` de `site.js`).
  - ≥ 700 px : fenêtre centrée (voile, `aria-modal`, focus gardé, Échap / × /
    clic à côté, défilement et Lenis suspendus). < 700 px : carte compacte en
    bas d'écran **sans voile ni photo**, page utilisable — Google Search
    Central (« Avoid intrusive interstitials and dialogs ») déconseille les
    fenêtres qui masquent le contenu (« may lead to poor search performance »).
  - Corps de carte **blanc** (l'étoile noire chevauche photo et texte : sur
    fond noir sa moitié basse disparaissait). Bandeau corail #F85A52 (texte
    blanc à 3,2:1 ; le #FF635B de l'agence donnait 2,9:1). Bouton corail
    #FF625B à texte foncé, comme `.btn--primary`.
  - Poppins 500/700/800 copiée dans `assets/fonts/` (+ `OFL-poppins.txt`),
    déclarée seulement dans `operation.css`. Photo : recadrage de
    `boutique-nogent-interieur.jpg` (déjà publiée sur le site) →
    `assets/photos/journees-privilege.webp` ; pas la photo du PDF de l'agence.
  - Vérifié en local (Playwright) : 320 → 1920 px sans chevauchement, bornes
    de dates en fuseau Europe/Paris, clavier, une fois par visite, i/s
    inchangées pendant l'animation (CPU ×4).

## Équipe : aperçu de l'accueil (depuis le 2026-10-08)

- Section « Les visages de la maison » de `index.html` (`#teamPiles`, CSS
  `.pile*` dans `site.css`) : **une pile de polaroïds par magasin** contenant
  toute l'équipe (7 / 3 / 3), compteur « N visages », prénoms en texte, lien
  vers l'ancre du magasin sur `equipe.html` (`#nogent-le-rotrou`, `#brou`,
  `#la-loupe`). Remplace la grille de 8 portraits, qui laissait croire que
  l'équipe se limitait à 8 personnes (retour du propriétaire).
- La dernière photo d'une pile est dessus ; positions par rang
  (`:nth-last-child`), donc aucun réglage par photo. Le JS en bas de
  `index.html` « feuillette » la pile (photo du dessus → dessous) au survol /
  focus clavier, et une seule fois à l'arrivée. Sans JS : pile fixe.
- L'équipe n'est pas dans Pages CMS. Arrivée ou départ : mettre à jour à la
  main `equipe.html` (cartes, « N visages », méta description « 13
  collaborateurs », « Treize passionnés ») **et** `index.html` (photo dans la
  pile, compteur, prénoms, bouton « Rencontrer les 13 visages »).

## Iris et ses vidéos (depuis le 2026-11-05)

- **Iris** : assistante virtuelle créée par IA, présentatrice des vidéos courtes de la maison
  (fabriquées sur le PC d'Antoine, studio HyperFrames + dépôt `Video` ; publiées via l'appli Pigeard
  et Buffer). Portrait fourni par le propriétaire : `assets/equipe/ia/iris.*`.
- **`equipe.html`, partie 04 « Iris, l'IA de la maison »** (`#ia`, après La Loupe) : séparateur
  `.mag-cover--ia` dont la photo est le **portrait d'Iris** (pastille « IA », cadre 4:5) et bloc
  `.ia-bandeau` vers les vidéos. **≥ 981 px : trois colonnes titre | portrait | vidéos** (gain de
  place demandé) ; en dessous, une colonne titre → portrait → bandeau (« comme les équipes
  magasin »). Mention « Iris est un personnage créé par intelligence artificielle… » dessous. Iris
  n'est **pas** comptée dans « 13 collaborateurs » ni dans le JSON-LD `employee`.
- **`videos-iris.html`** (dans le sitemap et `llms.txt`) : une carte par vidéo (vignette 9:16 dans
  `assets/videos-iris/<ep>.webp|jpg` tirée du rendu, date, durée, thème `data-theme`, mots-clés
  `data-mots`, légende validée), filtres par thème et loupe de recherche (accents ignorés, lien
  direct `?q=`). Sans JS : toutes les cartes visibles, pas d'outils. Un filtre de thème sans vidéo
  est retiré (les styles `.vcard--bientot` restent pour annoncer une vidéo à venir).
- **Lecture sur le site via YouTube** (choix du propriétaire) : `data-youtube` vide = pas de bouton
  ▶ ; l'identifiant YouTube (11 caractères) rend la carte lisible : fenêtre d'accord (CNIL, FAQ
  cookies q. 23 : finalités, liens FR Google, refus = lien direct, retrait sous le lecteur), puis
  lecteur `youtube-nocookie.com`. Rien n'est chargé depuis YouTube avant « Accepter et lire »
  (flux F10 de l'état des lieux RGPD, paragraphe dédié des mentions légales).
- **Ajouter une vidéo** (Claude, au moment de l'envoi de la vidéo, avec le même accord) : copier
  une carte existante.
  - Vignette dans `assets/videos-iris/<ep>.jpg` + `.webp`, où `<ep>` est le nom de l'épisode dans
    le dépôt `Video`. C'est ainsi que le programme reconnaît la carte ; on peut aussi poser
    `data-ep="<ep>"`.
  - `data-youtube=""`, date prévue, thème, mots-clés, légende validée, liens vers les comptes.
  - Toutes les vidéos sortent sur Instagram, TikTok et YouTube (décision du 2026-11-05).
- **Activer une vidéo : automatique** (`scripts/site_activer.py` du dépôt `Video`, tâche Windows
  « Pigeard - vidéos sur le site », toutes les heures et à l'ouverture de session).
  - Il traite chaque carte à `data-youtube=""`. Il lit l'état dans l'appli Pigeard et vérifie que
    la vidéo YouTube est publique (oEmbed 200).
  - Il renseigne alors `data-youtube`, la date de sortie (« 6 nov. ») et les liens des
    publications, puis pousse sur `main`.
  - Il travaille dans un clone réservé (`~/Projets/automatisation/pigeard-site`).
  - Journal : `~/Projets/automatisation/site-activer.log`. Essai sans écriture : `--essai`.
  - **Ne pas changer** les classes `vcard`, `vc-date`, `vc-liens` ni l'attribut `data-youtube`
    sans adapter ce programme.
  - Activation manuelle (secours) : même opération à la main, après la vérification oEmbed.
- État au 2026-11-06 : **myopie** lisible (`5o0Wwe_pOeA`, YouTube seulement) ; **polarisé**
  programmée le vendredi 6/11 à 18 h, **presbytie** le lundi 9/11 à 17 h 30 et **progressifs** le
  jeudi 12/11 à 17 h (Instagram, TikTok, YouTube), activées automatiquement à leur sortie.

## Impression 3D en magasin — OOmade (depuis le 2026-10-14)

- Service des **3 magasins** (propriétaire, 2026-10-14) : dépannage de lunettes
  cassées — monture imprimée à la forme des verres, verres d'origine remontés,
  **30 €**, **une vingtaine de minutes**, **ouvert à tous** — et montures sur
  mesure imprimées en magasin. Solution **OOmade** (oomade.com, société FTA),
  imprimante **Bambu Lab P1S**.
- Page dédiée `impression-3d.html` (sources en commentaire du `<head>`, FAQ +
  JSON-LD avec l'offre à 30 €). Accueil : volontairement **discret** (demande
  du propriétaire) — simple pastille « Nouveau : impression 3D & dépannage »
  dans la carte 01 « Lunettes sur mesure » (`.svc-card--duo` : lien étiré sur
  le titre + pastille cliquable, styles dans `index.html`). `services.html` :
  section `#impression-3d` en tête + lien dans le hero. Sitemap
  (`build_static.py`) et `llms.txt` à jour.
- Photos : **uniquement** la Bambu Lab P1S fournie par le propriétaire
  (`assets/photos/impression-3d/bambu-lab-p1s.*`, détourée, alpha érodé de
  2 px contre le liseré blanc) + l'image de partage `og-impression-3d.*`
  (1200×630, composée dans `tools/affiches/og-impression-3d.html`, rendu
  `rendu-visuel.mjs`). Ne pas reprendre de photos d'oomade.com : leurs
  mentions légales interdisent la reproduction sans accord écrit de FTA. Une
  2e photo fournie (imprimante + 2 montures) était identique à
  `oom13-proto-duo.jpg` d'oomade.com (dont une monture en acétate) : retirée
  le 2026-10-14 sur décision du propriétaire, à remettre seulement avec
  l'accord écrit de FTA ou une photo prise dans un magasin Pigeard.
- **Écran vitrine 9:16** (2026-11-04) : `tools/affiches/impression-3d-ecran-vitrine-9x16.html`
  → PNG 1080×1920 et 2160×3840 (`node rendu-ecran.mjs <html> <sortie> 1080 1920`),
  charte du site (Playfair / Karla / Reenie Beanie, vert, corail, halo crème),
  photo de la P1S, nom « OOmade » en texte seulement. Il annonce un dépannage
  **en 30 minutes** (propriétaire, 2026-11-04 : « désormais en 30 mn ») ; le
  site dit encore « une vingtaine de minutes » — non modifié, en attente de
  décision du propriétaire (liste des endroits ci-dessous).
- Changement de tarif ou de délai : mettre à jour `impression-3d.html`
  (`<title>`, meta description, og:description et twitter:description, hero,
  atouts, encart tarif, étape 03, FAQ **et** les deux JSON-LD), `services.html`
  (texte et JSON-LD) et `llms.txt`.

## Café Nespresso offert pour toute demande de devis (depuis le 2026-10-14)

- Annoncé par le propriétaire (2026-10-14) : pour toute demande de devis,
  commande ou non, on s'installe avec un café Nespresso offert (d'abord
  annoncé « pour toute commande », corrigé le jour même). Mention
  **volontairement discrète** (demande du propriétaire) : note manuscrite
  avec une petite tasse sous l'étape 02 « Conseil & choix de la monture »
  du parcours de `services.html` (`.step-cafe`, styles dans la page) + ligne
  « Engagements » de `llms.txt`.
  Retrait ou changement : ces deux endroits seulement.
- La police manuscrite (Reenie Beanie) n'a pas d'espace insécable (`&nbsp;`
  s'affiche collé) : groupes de mots insécables via `<span class="nw">`
  (`white-space:nowrap`), relâchés sous 420 px (sinon la colonne déborde
  à 320–360 px) où la note passe à 24 px avec `text-wrap:balance`.

## Logos des marques (page « Nos marques »)

- `assets/marques/<slug>.svg|png` : logo de chaque marque, référencé par le champ
  `logo` de `assets/data/marques.json` (chemin depuis la racine). La grille de
  `marques.html` affiche l'image quand le champ existe et retombe sur le nom en
  toutes lettres sinon (champ absent, vide ou image qui ne charge pas).
- Rendu **monochrome** par CSS (`.brand-card img.logo`, filtre
  `brightness(0) invert(1)` : crème, puis blanc au survol) — les fichiers doivent
  donc avoir un **fond transparent** (un fond blanc/coloré deviendrait un
  rectangle blanc). PNG recadrés sur leur contenu, ≤ 600 px de large ; SVG
  autonome (attribut `xmlns` présent).
- Provenance de chaque fichier : `tools/marques-logos-sources.json` (site
  officiel de la marque ; Wikimedia Commons « Public domain » quand le site
  bloque les robots ; réseau Mes Nouvelles Lunettes à défaut — qualité moindre).
  Les logos ne servent qu'à désigner les marques vendues en magasin.
- Le propriétaire remplace un logo via Pages CMS (champ « Logo », média
  `assets/marques`) — voir `GUIDE-EDITION.md`.
- Marques françaises (origine contenant « France », même règle que le filtre
  « France », + carte « Pigeard sur mesure ») : classe `fr` posée par le JS de
  `marques.html` → liseré 1 px bleu-blanc-rouge en dégradé (`.brand-card.fr::before`,
  masque CSS, demandé par le propriétaire le 2026-09-30).

## Nouveautés & visuels des fiches marques (depuis le 2026-09-30)

- Deux champs **facultatifs** de `assets/data/marques.json`, éditables dans
  Pages CMS ; une marque sans ces champs produit exactement la même page
  qu'avant.
- `nouveaute` (texte court, ex. « En magasin dès janvier 2027 ») : bandeau
  « Nouveau chez Pigeard » + encart + rappel sous le CTA de la fiche, pastille
  « Nouveau » sur la grille de `marques.html` (les nouveautés y passent en
  tête), puce sur l'accueil (`GEN:nouveautes`). Vider le champ retire tout.
- `visuels` (liste de `{image, legende, alt, credit}`) : galerie « En images »
  sous le texte de la fiche. Images dans `assets/marques/visuels/` (JPG, un
  `.webp` de même nom est servi en priorité via `<picture>`) ; dimensions lues
  dans les fichiers par `build_static.py` (pas de décalage au chargement) ; la
  1re image devient l'`og:image` de la fiche (1er visuel en JPG de préférence).
- **Droits** : ne pas publier de photos officielles d'une marque sans son
  accord écrit (ex. mentions légales d'anneetvalentin.com : reproduction
  « interdite, sauf autorisation écrite préalable »). À défaut : créations
  originales dans `tools/affiches/` (sources en commentaire), crédit
  « Illustration Pigeard ».
- **Anne & Valentin** (lunetier de Toulouse) : ajoutée le 2026-09-30 pour une
  arrivée en magasin en janvier 2027 (magasin(s) non précisé(s) par le
  propriétaire → textes « chez Pigeard ») ; 3 visuels originaux
  (`tools/affiches/anne-et-valentin-0*.html`). Faits sourcés sur
  anneetvalentin.com (pages À propos, boutique de Toulouse, concepts). La
  marque a un espace Pro (img.anneetvalentin.com, identifiants requis, contenu
  non vérifié) : photos officielles à ajouter au champ « visuels » une fois
  l'accord écrit obtenu.

## Décor des fêtes (depuis le 2026-10-08)

- Bonnet de Noël (velours rouge, fourrure crème, choisi par le propriétaire le
  2026-10-08) posé sur le grand verre de la lunette de l'écran de chargement :
  `noel.js` l'ajoute dans `.pg-loader-logo` si le loader est encore affiché
  (`noel.js` est préchargé en parallèle de `noel.css` ; en général dans la
  première demi-seconde du loader). `loader.js` pose `data-debut` sur l'écran :
  si le bonnet arrive plus de 0,7 s après, il apparaît déjà posé (fondu
  court, classe `pg-bonnet--tard`) au lieu de tomber ; s'il arrive pendant le
  fondu de sortie, il n'est pas ajouté. Largeur de la lunette bornée à 40vh
  (téléphone en paysage : le bonnet dépasse au-dessus de la lunette).
- Guirlande lumineuse sous le menu (+ boules et étoile suspendues ≥ 900 px,
  côté droit ; à gauche aussi sur les pages à `.hero`), neige en canvas sous
  le menu (z-index 8990), sapin tracé + message de saison en tête du pied de
  page. Fichiers : `assets/js/noel.js`, `assets/css/noel.css`, réglages
  `assets/data/noel.json` (Pages CMS, rubrique « Décor de Noël »).
- **Activation automatique chaque année** entre `debut` et `fin` (JJ/MM,
  défaut 01/11 → 31/01) si `actif` est vrai : le bloc « Décor des fêtes » de
  `site.js` lit le JSON à chaque page et ne charge `noel.css` puis `noel.js`
  qu'en saison (rien d'autre hors saison). Message `messageFetes` jusqu'au
  31/12, `messageVoeux` en janvier (`{annee}` remplacé).
- **Aperçu** : `?noel=1` (mémorisé pour l'onglet, `sessionStorage['pg-noel-apercu']`),
  `?noel=0` l'arrête. Après modification de `noel.js`/`noel.css`, bumper
  `VERSION` dans ce bloc de `site.js` (puis le `?v=` de `site.js` dans les pages).
- Pause visiteur (WCAG 2.2.2) : bouton rond flottant ≥ 1100 px, liens
  « Arrêter la neige » sous la carte de vœux et dans le menu mobile ; choix
  dans `localStorage['pg-noel-pause']` (listé dans les mentions légales).
  `prefers-reduced-motion` : décor fixe, sans neige ni commandes (contrairement
  au reste du site, voulu pour un effet plein écran continu).

## Flux de données personnelles (RGPD) & skill dédié

- Le site n'embarque **aucun script tiers ni cookie** ; polices, GSAP, Lenis
  et images sont auto-hébergés. **Seule exception, au clic** : le lecteur
  YouTube (`youtube-nocookie.com`) des vidéos d'Iris (`videos-iris.html`),
  chargé seulement après « Accepter et lire » dans une fenêtre d'accord dédiée
  (flux F10 de l'état des lieux RGPD). Les seuls flux sortants vont vers le **n8n
  Pigeard** (`n8n-1zv1.srv1641932.hstgr.cloud`, VPS Hostinger) : formulaire
  de contact (`contact-site`), statistiques de visite maison (`stats-site`,
  `visites-site`, identifiant aléatoire en `sessionStorage`) et avis Google
  affichés sur l'accueil (`avis-site`). Détail et état de conformité :
  `.claude/skills/rgpd-compliance/references/etat-des-lieux.md`.
- **Skill `rgpd-compliance`** (`.claude/skills/rgpd-compliance/`, chargé
  automatiquement par Claude Code sur tous les postes) : procédure d'audit,
  script d'inventaire `scripts/audit_rgpd.py` (stdlib, option `--prod`),
  sources juridiques vérifiées et modèles de textes. **À utiliser avant
  d'ajouter un script tiers, un formulaire, une intégration (carte, vidéo,
  avis) ou un nouveau flux de données**, et mettre à jour son
  `etat-des-lieux.md` dans le même commit que le changement.
- Le dossier `.claude/` n'est pas servi au public (règle nginx ci-dessus).
- L'information des visiteurs vit dans `mentions-legales.html` (section
  « Données personnelles & traceurs », ancre `#donnees-personnelles`) et sous
  le formulaire de `contact.html` : **tout nouveau flux doit y être décrit**.

## Écran de chargement (loader)

- `assets/js/loader.js` + un extrait inline dans le `<head>` de chaque page
  (juste après `site.css`) : voile encre immédiat, lunette qui se remplit du
  bas vers le haut, message manuscrit « Réglage de la netteté… » qui se
  défloute.
- Pendant les fêtes, un bonnet de Noël se pose sur la lunette (voir « Décor des
  fêtes » : ajouté par `noel.js`, pas par `loader.js`).
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

## Fluidité & performances (depuis le 2026-10-22)

- Plainte du propriétaire (2026-10-22) : « après la lunette, le site lag ». Cause
  principale mesurée : les halos `.blob` portaient `filter: blur(105px)` sur
  l'élément animé → flou recalculé à chaque image (≈ 15 i/s au lieu de 60 dans un
  test isolé). Corrigé **sans changer le rendu** (écart ≤ 3/255 au pixel) :
  - **Règle : jamais de `filter` (blur, drop-shadow…) sur un élément animé en
    `transform`.** Le filtre va sur un `::before` (ou un enfant) non animé, peint
    une fois puis mis en cache ; seul le parent bouge. Appliqué à `.blob`
    (dégradé via la variable `--blob-fond`) et `.streak`.
  - Boucles GSAP infinies : `PIGEARD.boucle(tween, zone)` (site.js) les met en
    pause quand `zone` (la section, qui doit rogner son contenu) est hors écran.
    Utilisé pour les halos et les deux bandeaux défilants de l'accueil.
  - `ScrollTrigger.refresh()` : passer par `PIGEARD.refresh()` (regroupe les
    demandes rapprochées). Les textes `data-bind` (Pages CMS) ne sont réécrits
    que s'ils diffèrent du HTML, et le recalcul n'a lieu qu'alors : **garder le
    texte du HTML identique à `assets/data/textes.json`** (sinon remplacement
    visible + recalcul à chaque chargement).
  - Hauteur de page de la barre de progression mise en cache (ResizeObserver).
- Essayés puis **écartés car le rendu changeait** (à ne pas retenter tels quels) :
  barres de progression en `transform: scaleX` (barre de 2 px plus sombre),
  Ken Burns de la photo du hero porté par un conteneur (photo 5 % moins nette),
  trait « Découvrir » en `translateY` (anticrénelage différent).
- Mesure : `tools/mesure-fluidite.mjs <page> mobile|desktop` (serveur local
  requis ; `BASE=` pour comparer avec une autre version servie sur un autre
  port). Chromium tourne sans GPU ici : comparer deux versions, ne pas lire les
  chiffres comme absolus. Avant/après du 2026-10-22, accueil mobile CPU ×4 :
  ~21 → ~57 images/s pendant le défilement.

## Vérification

Pas de suite de tests : vérifier en conditions réelles. Serveur local
(`python3 -m http.server`) + Playwright avec le Chromium préinstallé
(`chromium.launch()` sans `executablePath` : le chemin versionné
`chromium-1194` codé en dur a disparu de l'environnement le 2026-11-03 ;
`NODE_PATH=/opt/node22/lib/node_modules`). Après fusion, contrôler la prod.
Toute modification d'animation : vérifier aussi la fluidité
(`tools/mesure-fluidite.mjs`) et l'identité du rendu (captures figées comparées
au pixel entre ancienne et nouvelle version).
