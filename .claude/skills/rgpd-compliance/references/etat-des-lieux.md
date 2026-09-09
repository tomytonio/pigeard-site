# État des lieux RGPD du site — référence vivante

> À mettre à jour dans le **même commit** que tout changement de flux (nouveau
> script, formulaire, intégration, clé de stockage, sous-traitant) et après
> chaque audit (statuts + historique en bas de page).

Dernière mise à jour : **2026-09-09** (lecture des workflows n8n via le connecteur : faits vérifiés sur ce que conserve chaque flux — voir l'historique).

## 1. Fiche du site

| Élément | Valeur (telle qu'affichée dans `mentions-legales.html`, « juin 2026 ») |
|---|---|
| Éditeur | Optique Pigeard SAS — 4 rue Gouverneur, 28400 Nogent-le-Rotrou — SIRET 431 741 032 00053 — TVA FR 53 431 741 032 — tél. 02 37 52 03 39 — nogent@pigeard-opticiens.fr |
| Directeur de la publication | Antoine Pigeard |
| Hébergeur | Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre (VPS Hostinger ; nginx dans Docker, écoute en HTTP sur le port 80 derrière un proxy qui termine le TLS et redirige http→https en 308) |
| Dépôt du code | GitHub `tomytonio/pigeard-site`, **public** (vérifié le 2026-09-08 : l'API GitHub répond 200 sans authentification) → ne jamais y commiter de donnée client |
| Outils internes | Pages CMS (édition des JSON par le propriétaire via son compte GitHub), GitHub Actions (`build-static.yml`), n8n auto-hébergé (`n8n-1zv1.srv1641932.hstgr.cloud`, VPS Hostinger) |

## 2. Inventaire des flux de données personnelles

| # | Flux | Déclencheur → destination | Données | Stockage navigateur | Information donnée au visiteur (2026-09-08) | Statut |
|---|---|---|---|---|---|---|
| F1 | **Formulaire de contact** (`contact.html`, script inline) | Envoi volontaire → `POST` JSON sur le webhook n8n `contact-site` (workflow `Vex7o3A9sVolEWby`, vérifié le 2026-09-09) → nœud **Gmail du compte Google personnel d'Antoine** (expéditeur « Site Pigeard », copie dans ses éléments envoyés) → boîte Google du magasin (`nogent@` / `brou@` / `laloupe@pigeard-opticiens.fr`), visiteur en Reply-To. Aucune base ni table n8n : seules les **exécutions n8n** (réglage par défaut : sauvegardées) gardent le contenu pendant la durée de rétention de l'instance (inconnue ; 14 jours par défaut si l'élagage est actif). Sur la boîte Nogent, le workflow « Tri Matinal » (`PIY7J4hxWDGEy2r1`) envoie chaque matin expéditeur, objet et **250 premiers caractères** (donc nom, e-mail, téléphone du visiteur) à **OpenAI gpt-4o-mini** pour classer PUB / GARDER ; Brou et La Loupe ne sont pas triés. | nom, e-mail, téléphone (facultatif), magasin, objet, **message libre** (peut contenir des données de santé : correction, pathologie) ; honeypot anti-spam sans traceur | aucun | Mention sous le formulaire + section détaillée dans `mentions-legales.html#donnees-personnelles`, complétées le 2026-09-09 : messageries Google (Google LLC, adhérent DPF — vérifié sur policies.google.com/privacy/frameworks, version du 23 août 2025), copie sur le compte d'envoi, tri automatisé OpenAI (États-Unis, garanties chapitre V — adhésion DPF d'OpenAI rapportée par des sources secondaires, à confirmer sur dataprivacyframework.gov). | 🟢 information art. 13 en place · 🟠 base juridique (intérêt légitime) et durée (3 ans) choisies par défaut · 🟠 **relais via un compte Gmail personnel** : à remplacer par un compte de l'entreprise · 🟠 exécutions n8n : régler « Save successful executions : Do not save » sur `contact-site` (et vérifier la rétention de l'instance) · 🟠 tri OpenAI : soit l'exclure pour les messages du site (sujet se terminant par `[Nogent-le-Rotrou]`), soit conserver la mention publiée · 🟠 la durée de 3 ans doit être appliquée dans les boîtes Google (suppression / archivage) |
| F2 | **Statistiques de visite maison** (`assets/js/site.js`, bloc « Visites & statistiques ») | À chaque page affichée (pas en pré-rendu) → `sendBeacon`/`fetch` vers le webhook n8n `stats-site` ; `GET visites-site` (compteur global, `?add=1` à la première page d'une session) | type (`pageview` / `duration`), identifiant de session aléatoire, chemin de page, **referrer**, classe d'appareil (mobile / tablette / ordinateur), durée en secondes. **Vérifié le 2026-09-09** (workflow `gPcDIobyB225OzzC`) : la data table « Stats visites site » (`XYWThUPXrFMWWxAV`) ne contient que `session, type, page, duree, referrer, appareil` (+ `createdAt`) — **aucune adresse IP** ; l'IP n'apparaît que dans les en-têtes des exécutions n8n sauvegardées. Aucune purge n'existait : workflow « Stats site : purge RGPD (25 mois) » (`pbcdZn2VaR5HAlTy`) créé le 2026-09-09, **inactif jusqu'à activation par le propriétaire** (rien à purger avant août 2028). | `sessionStorage['pigeardSession']` (identifiant aléatoire, durée = l'onglet) | Paragraphe « Statistiques de fréquentation » des mentions légales : données collectées, absence de recoupement / de tiers / de suivi entre sites, conservation ≤ 25 mois, fondement art. 82, pas de bandeau. | 🟢 conditions CNIL réunies sur les données stockées (anonymes, pas de recoupement, pas de tiers) · 🟠 activer la purge à 25 mois · 🟠 régler « Save successful executions : Do not save » sur `stats-site` et `visites-site` pour ne pas garder les IP dans les exécutions · 🟠 journaux du serveur nginx (IP) : conservation « au plus un an » annoncée → prévoir la rotation des logs Docker sur le VPS |
| F3 | **Avis Google affichés** (`assets/js/avis.js`, page d'accueil) | Chargement de l'accueil → `GET` webhook n8n `avis-site` → JSON `{note_moyenne, total, avis[{auteur, note, commentaire, magasin}]}` | **prénom + initiale du nom** (anonymisation faite dans le workflow `HHapUpbQNpUJNbE3`, vérifié le 2026-09-09), note, commentaire (320 caractères max), magasin — 12 avis ≥ 4 étoiles, lus dans la table `margaux.reviews` (Postgres **Neon**, alimentée par l'API Google Business Profile) | aucun | Paragraphe « Avis Google affichés sur l'accueil » des mentions légales (source, intérêt légitime, retrait sur demande). | 🟢 information art. 14 en place · 🟠 hors site : la base `margaux.reviews` et les workflows « Margaux » (réponses aux avis rédigées par OpenAI) traitent noms et avis des clients — à inscrire au registre, avec Neon (localisation de la base à vérifier) et OpenAI comme destinataires |
| F4 | **Écran de chargement** (`assets/js/loader.js` + extrait inline dans chaque page) | Première page de la visite | — | `sessionStorage['pg-loader-vu']` (durée = l'onglet) | Listé dans « Stockage dans votre navigateur » des mentions légales. | 🟢 |
| F5 | ~~Avis éclipse~~ — bloc supprimé de `site.js` le 2026-09-08 (inerte depuis le 13/08/2026) | — | — | `localStorage['pgEclipseFerme']` peut subsister dans les navigateurs des visiteurs, plus jamais lu ni écrit | — | 🟢 supprimé |
| F6 | **Liens sortants** : prise de RDV Zerosix (3 sous-domaines `zerosix.com`), visites virtuelles `tourmkr.com`, Google Maps (liens), Instagram / Facebook, commande de lentilles `lentilles-opticiens.com`, sites des marques | Clic volontaire du visiteur | — (le `Referrer-Policy: strict-origin-when-cross-origin` ne transmet que l'origine) | aucun | Paragraphe « Services tiers accessibles par lien » des mentions légales. | 🟢 |
| F7 | **Ressources tierces chargées par les pages** | — | — | — | — | 🟢 **aucune** : polices, GSAP, Lenis, images, vidéos auto-hébergés (vérifié par `audit_rgpd.py` sur 80 pages le 2026-09-08) |

Cookies HTTP : **aucun** (aucun `Set-Cookie` en production, aucun `document.cookie` dans le code). Bandeau de consentement : **non nécessaire** tant que F1–F7 restent en l'état.

## 3. Page « Mentions légales » (`mentions-legales.html`)

| Élément (source dans `sources-juridiques.md`) | État 2026-09-08 |
|---|---|
| Dénomination, forme (SAS), siège, téléphone, SIRET, TVA, directeur de la publication | ✅ présents |
| **Capital social** (LCEN art. 1-1 I 2°) | ✅ « au capital de 40 000 € » (source : societe.com, données du 06/09/2026 — à confronter au Kbis) |
| Numéro RCS avec greffe (LCEN art. 1-1 I 2°) | ✅ « RCS Chartres 431 741 032 » (même source) |
| Hébergeur : nom, adresse | ✅ |
| **Hébergeur : téléphone** (LCEN art. 1-1 I 4°) | ✅ +357 24 030 182 — **source secondaire** (mentions légales de nombreux sites clients) : Hostinger ne publie aucun numéro sur ses conditions, sa page contact ni sa politique de confidentialité (vérifié le 2026-09-08). À confirmer depuis l'espace client Hostinger |
| Profession réglementée (LCEN art. 19, applicabilité incertaine) | ✅ « Opticien-lunetier, profession de santé réglementée (CSP art. L.4362-1 et s.) » |
| Responsable du traitement, droits, contact, CNIL, durée (5 ans, dossier optique) | ✅ section « Données personnelles & traceurs » couvrant magasin **et** site |
| Finalités, bases juridiques, destinataires / sous-traitants **pour le site** (contact, statistiques, avis) | ✅ |
| Droits de limitation et de portabilité | ✅ |
| Traceurs / stockage navigateur / mesure d'audience | ✅ |
| Médiation (MCP Médiation + site), Bloctel | ✅ |
| Date de mise à jour | ✅ « septembre 2026 » |
| Lien vers la page depuis chaque page | ✅ toutes, `404.html` compris (les deux pages de `pages/` sont des redirections) |

## 4. Sécurité (RGPD art. 32) — constats en production le 2026-09-08

| Point | Constat | Statut |
|---|---|---|
| HTTPS | oui ; `http://` → 308 vers `https://www.` (proxy amont) | 🟢 |
| `X-Content-Type-Options`, `Referrer-Policy` | présents (`nosniff`, `strict-origin-when-cross-origin`) | 🟢 |
| HSTS, `X-Frame-Options`, `Permissions-Policy` | ajoutés à `deploy/nginx-vitrine.conf` le 2026-09-08 (actifs après recréation du conteneur, voir ligne précédente) ; CSP non traitée (chantier à part) | 🟠 en attente de la recréation du conteneur |
| Fichiers de travail (`.md`, `.py`, `.yml`, `/tools/`, `/deploy/`) | 404 | 🟢 |
| **`/.git/HEAD`, `/.git/config`, `/.gitignore`** | **200** : l'historique git est téléchargeable. Impact confidentialité faible (dépôt public, aucun identifiant dans `.git/config` — vérifié) mais à fermer. Règle nginx ajoutée le 2026-09-08 (`location ~ /\.(?!well-known/) { return 404; }`). Le 2026-09-09, un `nginx -s reload` fait par le propriétaire n'a rien changé (conf montée fichier par fichier, remplacée par git : le conteneur lit l'ancienne version) → il faut recréer le conteneur avec `deploy/recharger-nginx.sh` | 🟠 en attente de la recréation du conteneur |
| Cookies / sessions | aucun | 🟢 |

## 5. Questions ouvertes (« je ne sais pas ») — à poser au propriétaire

1. ~~Que conservent les workflows n8n ?~~ **Répondu le 2026-09-09** (voir F1–F3). Reste : la rétention des exécutions n8n sur l'instance (réglages `EXECUTIONS_DATA_PRUNE` / `EXECUTIONS_DATA_MAX_AGE`) — **je ne sais pas**.
2. ~~Copie des messages ?~~ Répondu : aucune table ; exécutions n8n + éléments envoyés du compte Gmail personnel + boîte du magasin.
3. ~~Quelle messagerie ?~~ Répondu : Google (Gmail / Google Workspace ?) pour les trois magasins — **Workspace ou Gmail grand public : je ne sais pas** ; combien de temps les messages sont gardés dans ces boîtes : **je ne sais pas** (la page annonce 3 ans).
4. Existe-t-il un contrat / des clauses de sous-traitance (art. 28) avec Hostinger ? Avec le prestataire de messagerie ?
5. Registre des traitements (art. 30) : existe-t-il ? (obligatoire : données de santé traitées en magasin)
6. Autorisations écrites pour les photos de l'équipe et des personnes visibles sur le site (dont enfants, page Optikid) ?
7. Capital social, greffe du RCS, téléphone de Hostinger (pour compléter les mentions légales).
8. Un DPO a-t-il été désigné ?

## 6. Historique des audits

| Date | Session / commit | Résumé |
|---|---|---|
| 2026-09-09 | lecture des workflows n8n (connecteur), PR #30 | Faits vérifiés : table des statistiques sans IP ; formulaire relayé par le compte Gmail personnel vers des boîtes Google ; tri matinal de la boîte Nogent par OpenAI (250 premiers caractères) ; avis anonymisés prénom + initiale depuis Postgres Neon. Textes d'information complétés (Google/DPF, copie sur le compte d'envoi, tri automatisé OpenAI, journaux serveur ≤ 1 an, avis « prénom et initiale »). Workflow de purge à 25 mois créé dans n8n, inactif. Nouvelles actions propriétaire : activer la purge, désactiver la sauvegarde des exécutions sur les trois webhooks du site, remplacer le relais Gmail personnel, exclure ou assumer le tri OpenAI, rotation des logs Docker, recréer le conteneur nginx (toujours pas fait à 07:54 UTC). |
| 2026-09-08 (2) | corrections (même branche, 2ᵉ PR) | Crawl de la production : 76 URL du sitemap et 180 liens/ressources internes en 200, JSON-LD valides. Corrections : mention d'information sous le formulaire de contact ; section « Données personnelles & traceurs » (magasin, formulaire, statistiques, avis Google, services tiers, stockage navigateur, droits) ; capital social, RCS, activité réglementée et téléphone de l'hébergeur ajoutés ; lien mentions légales sur la 404 ; bloc « avis éclipse » retiré de `site.js` (bump `?v=20260908`) ; en-têtes HSTS / X-Frame-Options / Permissions-Policy dans nginx. Choix par défaut à valider par le propriétaire : intérêt légitime et 3 ans (contact), 25 mois (statistiques), téléphone Hostinger de source secondaire. |
| 2026-09-08 | création du skill (branche `claude/rgpd-compliance-skill-4xpms9`) | Inventaire initial sur 80 pages : aucune ressource tierce, aucun cookie, trois flux vers n8n (contact, statistiques, avis), quatre clés de stockage. Constats principaux : information art. 13 absente au formulaire de contact ; mentions légales sans capital social, sans téléphone de l'hébergeur, sans volet « site » (statistiques, avis, traceurs) ; `.git/` servi en production → règle nginx ajoutée (rechargement à faire sur le VPS). Aucune correction de contenu effectuée dans ce commit. |
