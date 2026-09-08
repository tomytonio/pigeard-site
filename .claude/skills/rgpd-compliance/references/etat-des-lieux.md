# État des lieux RGPD du site — référence vivante

> À mettre à jour dans le **même commit** que tout changement de flux (nouveau
> script, formulaire, intégration, clé de stockage, sous-traitant) et après
> chaque audit (statuts + historique en bas de page).

Dernière mise à jour : **2026-09-08** (création du skill, commit de référence `61222c8` + ce commit).

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
| F1 | **Formulaire de contact** (`contact.html`, script inline) | Envoi volontaire → `POST` JSON sur le webhook n8n `contact-site` → e-mail au magasin choisi, adresse du visiteur en Reply-To (workflow n8n « Pigeard IA — Formulaire Contact ») | nom, e-mail, téléphone (facultatif), magasin, objet, **message libre** (peut contenir des données de santé : correction, pathologie) ; honeypot anti-spam sans traceur | aucun | **Aucune mention près du formulaire.** Le paragraphe RGPD des mentions légales ne parle que du dossier optique en magasin (devis, tiers payant). Bloctel mentionné dans les mentions légales mais pas au moment du recueil du téléphone. | 🔴 information art. 13 absente au point de collecte · 🟠 données de santé possibles (art. 9) · 🟠 Bloctel (L.223-2) |
| F2 | **Statistiques de visite maison** (`assets/js/site.js`, bloc « Visites & statistiques ») | À chaque page affichée (pas en pré-rendu) → `sendBeacon`/`fetch` vers le webhook n8n `stats-site` ; `GET visites-site` (compteur global, `?add=1` à la première page d'une session) | type (`pageview` / `duration`), identifiant de session aléatoire, chemin de page, **referrer**, classe d'appareil (mobile / tablette / ordinateur), durée en secondes ; côté serveur n8n reçoit nécessairement l'**adresse IP** | `sessionStorage['pigeardSession']` (identifiant aléatoire, durée = l'onglet) | **Aucune** (le commentaire du code dit « aucune donnée personnelle, ni cookie », mais un identifiant en `sessionStorage` est une écriture dans le terminal au sens de l'art. 82) | 🟠 exemption « mesure d'audience » plausible **si** n8n ne conserve ni IP ni donnée identifiante, pas de recoupement, ≤ 25 mois — à confirmer ; information à ajouter dans les mentions légales (condition CNIL) |
| F3 | **Avis Google affichés** (`assets/js/avis.js`, page d'accueil) | Chargement de l'accueil → `GET` webhook n8n `avis-site` → JSON `{note_moyenne, total, avis[{auteur, note, commentaire, magasin}]}` | nom (tel qu'affiché sur Google) et commentaire de tiers, obtenus **indirectement** via Google | aucun | Aucune | 🟠 information art. 14 (source, finalité, base « intérêt légitime », droit d'opposition) à ajouter ; vérifier les conditions d'utilisation de la source Google côté n8n |
| F4 | **Écran de chargement** (`assets/js/loader.js` + extrait inline dans chaque page) | Première page de la visite | — | `sessionStorage['pg-loader-vu']` (durée = l'onglet) | Aucune | 🟢 strictement nécessaire (préférence d'affichage) — à lister par transparence |
| F5 | **Avis éclipse** (`site.js`, bloc temporaire, inerte depuis le 13/08/2026) | Fermeture de la fenêtre | — | `localStorage['pgEclipseFerme']` (persistant) | Aucune | 🟢 mémorisation d'un choix (exempté) — code mort à supprimer (voir commentaire du code) |
| F6 | **Liens sortants** : prise de RDV Zerosix (3 sous-domaines `zerosix.com`), visites virtuelles `tourmkr.com`, Google Maps (liens), Instagram / Facebook, commande de lentilles `lentilles-opticiens.com`, sites des marques | Clic volontaire du visiteur | — (le `Referrer-Policy: strict-origin-when-cross-origin` ne transmet que l'origine) | aucun | Aucune | 🟢 pas de flux depuis notre site ; mention « sites tiers » facultative |
| F7 | **Ressources tierces chargées par les pages** | — | — | — | — | 🟢 **aucune** : polices, GSAP, Lenis, images, vidéos auto-hébergés (vérifié par `audit_rgpd.py` sur 80 pages le 2026-09-08) |

Cookies HTTP : **aucun** (aucun `Set-Cookie` en production, aucun `document.cookie` dans le code). Bandeau de consentement : **non nécessaire** tant que F1–F7 restent en l'état.

## 3. Page « Mentions légales » (`mentions-legales.html`)

| Élément (source dans `sources-juridiques.md`) | État 2026-09-08 |
|---|---|
| Dénomination, forme (SAS), siège, téléphone, SIRET, TVA, directeur de la publication | ✅ présents |
| **Capital social** (LCEN art. 1-1 I 2°) | ❌ absent |
| Numéro RCS avec greffe (LCEN art. 1-1 I 2°) | 🟠 SIRET seul ; greffe non indiqué |
| Hébergeur : nom, adresse | ✅ |
| **Hébergeur : téléphone** (LCEN art. 1-1 I 4°) | ❌ absent |
| Profession réglementée (LCEN art. 19, applicabilité incertaine) | ❌ absent |
| Responsable du traitement, droits d'accès / rectification / opposition / effacement, contact, CNIL, durée (5 ans, dossier optique) | ✅ mais **périmètre limité au magasin** (devis, tiers payant) |
| Finalités, bases juridiques, destinataires / sous-traitants **pour le site** (contact, statistiques, avis) | ❌ absents |
| Droits de limitation et de portabilité | ❌ absents |
| Traceurs / stockage navigateur / mesure d'audience | ❌ absents |
| Médiation (MCP Médiation + site), Bloctel | ✅ |
| Date de mise à jour | ✅ « juin 2026 » |
| Lien vers la page depuis chaque page | ✅ sauf `404.html` (les deux pages de `pages/` sont des redirections) |

## 4. Sécurité (RGPD art. 32) — constats en production le 2026-09-08

| Point | Constat | Statut |
|---|---|---|
| HTTPS | oui ; `http://` → 308 vers `https://www.` (proxy amont) | 🟢 |
| `X-Content-Type-Options`, `Referrer-Policy` | présents (`nosniff`, `strict-origin-when-cross-origin`) | 🟢 |
| HSTS, CSP, `X-Frame-Options`, `Permissions-Policy` | absents (le `netlify.toml` historique en posait certains ; jamais reportés dans nginx) | 🟠 amélioration, voir `modeles.md` § nginx |
| Fichiers de travail (`.md`, `.py`, `.yml`, `/tools/`, `/deploy/`) | 404 | 🟢 |
| **`/.git/HEAD`, `/.git/config`, `/.gitignore`** | **200** : l'historique git est téléchargeable. Impact confidentialité faible (dépôt public, aucun identifiant dans `.git/config` — vérifié) mais à fermer. Règle nginx ajoutée le 2026-09-08 (`location ~ /\.(?!well-known/) { return 404; }`), **active seulement après rechargement de nginx sur le VPS** | 🟠 en attente du rechargement |
| Cookies / sessions | aucun | 🟢 |

## 5. Questions ouvertes (« je ne sais pas ») — à poser au propriétaire

1. Que conservent les workflows n8n `stats-site` / `visites-site` : adresse IP ? identifiant de session ? referrer ? Pendant combien de temps ? (condition de l'exemption « mesure d'audience »)
2. Le workflow `contact-site` garde-t-il une copie des messages (exécutions n8n, base, tableur) ? Durée ?
3. Quelle messagerie reçoit les messages des trois magasins (fournisseur, localisation UE ?) et combien de temps sont-ils gardés ?
4. Existe-t-il un contrat / des clauses de sous-traitance (art. 28) avec Hostinger ? Avec le prestataire de messagerie ?
5. Registre des traitements (art. 30) : existe-t-il ? (obligatoire : données de santé traitées en magasin)
6. Autorisations écrites pour les photos de l'équipe et des personnes visibles sur le site (dont enfants, page Optikid) ?
7. Capital social, greffe du RCS, téléphone de Hostinger (pour compléter les mentions légales).
8. Un DPO a-t-il été désigné ?

## 6. Historique des audits

| Date | Session / commit | Résumé |
|---|---|---|
| 2026-09-08 | création du skill (branche `claude/rgpd-compliance-skill-4xpms9`) | Inventaire initial sur 80 pages : aucune ressource tierce, aucun cookie, trois flux vers n8n (contact, statistiques, avis), quatre clés de stockage. Constats principaux : information art. 13 absente au formulaire de contact ; mentions légales sans capital social, sans téléphone de l'hébergeur, sans volet « site » (statistiques, avis, traceurs) ; `.git/` servi en production → règle nginx ajoutée (rechargement à faire sur le VPS). Aucune correction de contenu effectuée dans ce commit. |
