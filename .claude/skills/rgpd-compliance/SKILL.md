---
name: rgpd-compliance
description: Audit et mise en conformité RGPD / ePrivacy / mentions légales du site vitrine Pigeard Opticiens (pigeard-opticiens.fr). Utiliser dès qu'il est question de RGPD, GDPR, données personnelles, vie privée, cookies, traceurs, statistiques de visite, formulaire de contact, mentions légales, politique de confidentialité, CNIL, hébergeur, sous-traitants (n8n, Hostinger), droit à l'image, sécurité du site — et systématiquement AVANT d'ajouter au site un script tiers, un formulaire, une intégration (carte, vidéo, avis, prise de rendez-vous) ou tout nouveau flux de données, même si l'utilisateur ne prononce pas le mot « RGPD ».
---

# Conformité RGPD du site Pigeard

Ce skill fait deux choses : **inventorier** les faits (script) et **analyser** ces
faits au regard de textes vérifiés (références du skill), pour produire un
rapport ou une correction. Il ne remplace pas un avis juridique : le
propriétaire (Antoine, non-juriste, non-développeur) doit pouvoir s'appuyer
sur chaque phrase, donc chaque affirmation juridique renvoie à une source de
`references/sources-juridiques.md`. Si un point n'y figure pas et ne peut pas
être vérifié pendant la session, écrire « je ne sais pas » et le classer
« à vérifier » plutôt que d'extrapoler.

## Fichiers du skill

| Fichier | Rôle | Quand le lire |
|---|---|---|
| `scripts/audit_rgpd.py` | Inventaire technique (stdlib, aucune dépendance) : ressources tierces, liens sortants, appels réseau, stockage navigateur, formulaires, mots-clés des pages légales, conf nginx, sondes du site en ligne (`--prod`) | Toujours, en premier |
| `references/etat-des-lieux.md` | Fiche du site, inventaire des flux de données, statut de chaque point, questions ouvertes, historique des audits | Toujours, avant d'analyser |
| `references/sources-juridiques.md` | Textes vérifiés (LCEN, RGPD, art. 82 LIL, CNIL, Code de la consommation) avec URL et date de vérification | Pour chaque constat |
| `references/modeles.md` | Textes prêts à adapter : mention sous le formulaire, section « données personnelles », compléments d'identification, en-têtes nginx, réponse à une demande de droits | Quand on corrige |

## Procédure d'audit

1. **Se synchroniser** : `git pull` (règle générale du dépôt).
2. **Inventorier** :
   ```bash
   python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py            # rapport Markdown
   python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py --prod     # + sondes sur www.pigeard-opticiens.fr
   python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py --json     # données brutes si besoin
   ```
   Le script ne juge pas ; ses repérages par mots-clés (section 5) sont des
   heuristiques : relire la page avant de conclure.
3. **Comparer** avec `references/etat-des-lieux.md` : nouveau flux, nouveau
   tiers, nouvelle clé de stockage, formulaire modifié ? Tout écart doit être
   expliqué (changement du site) ou corrigé (régression).
4. **Analyser** chaque flux avec la grille ci-dessous, en citant la source.
5. **Rédiger** le rapport dans le format imposé (section « Format du rapport »).
6. **Corriger** si c'est demandé (section « Corriger »), puis relancer le script.
7. **Mettre à jour** `references/etat-des-lieux.md` (statuts + entrée dans
   l'historique) dans le même commit, et `CLAUDE.md` si le changement est
   transverse (nouvel outil, nouveau flux, nouvelle règle serveur).

## Grille d'analyse

Pour chaque thème : la question à se poser, puis la source à citer
(détail dans `references/sources-juridiques.md`).

**Identification de l'éditeur** — La page « Mentions légales » donne-t-elle
dénomination, forme, siège, téléphone, numéro RCS/SIREN, **capital social**,
TVA, directeur de la publication, et pour l'hébergeur nom, adresse **et
téléphone** ? Source : LCEN art. 1-1 (ex-art. 6 III, renuméroté par la loi du
21 mai 2024). Profession réglementée (opticien-lunetier) : LCEN art. 19 si
l'activité relève du commerce électronique — applicabilité incertaine pour
un site sans vente en ligne, la mention reste sans risque.

**Information des personnes** — Pour chaque collecte (formulaire, statistiques,
avis affichés) : responsable, finalité, base juridique, destinataires et
sous-traitants, durée de conservation, droits (accès, rectification,
effacement, limitation, portabilité, opposition), droit de réclamation auprès
de la CNIL, transferts hors UE le cas échéant. Source : RGPD art. 13
(collecte directe) et art. 14 (données obtenues d'un tiers, ex. avis Google).
L'information doit être **au moment de la collecte**, donc près du formulaire,
pas seulement au fond des mentions légales.

**Formulaires** — Champs limités au nécessaire (RGPD art. 5-1-c) ; aucune case
pré-cochée ; téléphone → information Bloctel au moment du recueil (C. conso
L.223-2) ; champ libre → risque de données de santé (RGPD art. 9) : ne pas
solliciter d'ordonnance ni de données de santé par ce canal, le dire près du
formulaire ; anti-spam sans traceur (le honeypot actuel convient).

**Traceurs et stockage navigateur** — Toute lecture/écriture dans le terminal
(cookies, mais aussi `localStorage` / `sessionStorage`) requiert le
consentement, sauf traceurs strictement nécessaires au service demandé
(préférence d'interface, mémorisation d'un choix) et **mesure d'audience
exemptée** sous conditions cumulatives : finalité exclusive pour l'éditeur,
statistiques anonymes uniquement, pas de recoupement, pas de transmission de
données non anonymes à un tiers, pas de suivi entre sites, information des
personnes, traceur ≤ 13 mois, données ≤ 25 mois. Source : LIL art. 82,
délibérations CNIL 2020-091 et 2020-092, page CNIL « mesure d'audience ».
Tant que le site n'utilise que des traceurs exemptés, **aucun bandeau de
consentement n'est nécessaire** ; en ajouter un serait même trompeur. Un
seul script tiers non exempté (Google Analytics, pixel Meta, YouTube
intégré, Google Maps intégrée, polices Google) change cette conclusion.

**Ressources tierces chargées** — Chaque ressource externe chargée par la page
transmet l'adresse IP du visiteur au tiers avant tout consentement. Le site
auto-héberge tout (polices, GSAP, Lenis, images, vidéos) : conserver cet
état. Un simple lien sortant n'est pas un flux (le visiteur choisit de
cliquer) ; le `Referrer-Policy` actuel ne transmet que l'origine.

**Sous-traitants** — Hostinger (VPS nginx + n8n), messagerie des magasins,
Zerosix (prise de RDV, site externe), Google (avis). Contrat ou clauses
art. 28 ? Localisation UE ? Ce que n8n **conserve** (contenu, IP, referrer,
identifiant de session) et pendant combien de temps ? → questions au
propriétaire, jamais de supposition.

**Sécurité** — HTTPS et redirection, en-têtes (`X-Content-Type-Options`,
`Referrer-Policy` présents ; HSTS, CSP, `X-Frame-Options`,
`Permissions-Policy` absents au 2026-09-08), fichiers de travail et chemins
cachés non servis (`.git/`, `.claude/`, `.md`, `.py`, `/deploy/`, `/tools/`),
aucune donnée client dans le dépôt (il est **public**). Source : RGPD art. 32.

**Durées** — Prospect : 3 ans après le dernier contact (référentiel CNIL
gestion commerciale, indicatif) ; audience : ≤ 25 mois ; dossier optique en
magasin : hors périmètre du site (5 ans annoncés dans les mentions légales,
non vérifié par ce skill).

**Hors code** — Registre des traitements (RGPD art. 30 : pas de dérogation
« moins de 250 salariés » quand on traite des données de santé), droit à
l'image des salariés et personnes photographiées (C. civ. art. 9),
désignation éventuelle d'un DPO. À signaler, pas à trancher.

## Format du rapport

Utiliser exactement cette structure (en français, sans jargon inutile ;
Antoine doit pouvoir décider à partir de la synthèse seule) :

```markdown
# Audit RGPD — site Pigeard — [date]
Commit `[sha]` · [n] pages · site en ligne sondé : oui/non

## Synthèse (3 phrases maximum)

## Constats
| # | Thème | Constat (fait observé) | Gravité | Source | Correction proposée |
|---|---|---|---|---|---|
Gravité : 🔴 non-conformité probable · 🟠 à vérifier ou à améliorer · 🟢 conforme

## Ce que je ne sais pas
(liste des points invérifiables depuis le code, avec la question précise à poser)

## Actions hors code (propriétaire)

## Écart avec l'état des lieux précédent
```

Règles : un constat = un fait observé + une source ; pas de gravité 🔴 sans
texte cité ; pas de correction qui élargit le périmètre demandé sans le dire.

## Corriger

- **Textes** : partir de `references/modeles.md`, garder les crochets
  `[à compléter]` pour ce que seul le propriétaire connaît (capital social,
  téléphone de l'hébergeur, durées retenues, boîte mail destinataire) et les
  lister dans le message final. Ne jamais inventer un montant, un numéro ou
  une durée.
- **Page « Mentions légales »** (`mentions-legales.html`) : y ajouter une
  section « Données personnelles & traceurs » plutôt que créer une nouvelle
  page ; poser un `id` sur le titre pour y renvoyer depuis le formulaire.
  Mettre à jour la ligne « Dernière mise à jour ».
- **Nouvelle page HTML** (si vraiment nécessaire) : copier depuis `index.html`
  le `<head>` (dont l'extrait inline « Écran de chargement »), l'en-tête, le
  pied de page et les `speculationrules` ; ajouter la page à
  `tools/build_static.py` (sitemap) ; toute fonctionnalité JS doit rester
  inoffensive sans JS et en pré-rendu.
- **Pied de page** : il est dupliqué dans chaque page ET dans le gabarit de
  `tools/build_static.py` (pages `marque-*` générées) — modifier les deux.
- **`site.css` / `site.js`** : bumper le paramètre `?v=` des `<link>` /
  `<script>` de toutes les pages et du gabarit.
- **nginx** (`deploy/nginx-vitrine.conf`) : la conf n'est relue qu'au
  rechargement du conteneur sur le VPS — l'écrire dans le message final et
  vérifier ensuite avec `--prod`.
- **Ne jamais** ajouter un bandeau cookies « par précaution », un script tiers
  d'analytics, ni transmettre des données de santé par le formulaire.
- Après correction : relancer le script, mettre à jour `etat-des-lieux.md`
  (statuts, historique), puis suivre le workflow du dépôt (PR, fusion,
  contrôle en production ~10 min après).

## Entretien du skill

- Chaque source porte une date de vérification ; au-delà d'un an, la
  revérifier avant de la citer (la CNIL et Légifrance évoluent : l'art. 6 III
  de la LCEN est devenu l'art. 1-1 en 2024).
- Enrichir `SIGNATURES` du script quand un nouveau service tiers est envisagé.
- Ajouter une entrée d'historique dans `etat-des-lieux.md` à chaque audit.
