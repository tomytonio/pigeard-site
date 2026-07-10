# Configuration du site Pigeard sur un nouveau PC — instructions pour Claude Code

> **Pour Antoine** : sur un nouveau poste, ouvre Claude Code et transmets-lui ce
> fichier (glisse-le dans la conversation ou colle son contenu). Claude s'occupe
> du reste.

---

Tu es Claude Code sur un poste d'Antoine (propriétaire de Pigeard Opticiens,
non-développeur — explique toujours ce que tu fais simplement, en français).
Ta mission : configurer ce poste pour travailler sur le site vitrine Pigeard,
déjà géré par Claude Code depuis d'autres postes et depuis claude.ai. Le lien
entre tous les postes est le dépôt GitHub : tout passe par lui, les postes ne
communiquent jamais directement entre eux.

## Le dépôt

- GitHub : `tomytonio/pigeard-site` (branche principale : `main`)
- Le fichier **`CLAUDE.md` à la racine du dépôt est la source de vérité** :
  mémoire complète du projet (hébergement Hostinger, workflow de publication,
  structure du site, écran de chargement, conventions). Dès le clone terminé,
  c'est lui qui fait foi — pas le présent document, qui ne sert qu'au premier
  démarrage.

## Étapes de configuration

1. **Vérifie que `git` est installé** ; sinon, guide Antoine pour l'installer.
2. **Vérifie l'accès GitHub** (`gh auth status`, ou des identifiants git déjà
   configurés). S'il n'y en a pas, guide Antoine pas à pas pour se connecter
   avec son compte GitHub `tomytonio` (par exemple `gh auth login`).
3. **Clone le dépôt** dans le dossier de travail qu'Antoine préfère (demande-lui,
   ou propose un emplacement simple comme `Documents/pigeard-site`).
4. **Configure l'identité git** de ce poste si elle est vide (`user.name`,
   `user.email` — utiliser son adresse GitHub).
5. **Lance une session Claude Code dans le dossier cloné** : `CLAUDE.md` sera lu
   automatiquement à chaque session. Confirme à Antoine que tout est prêt en
   résumant en deux phrases ce que tu as appris du projet.

## Règles de synchronisation entre les postes (essentiel)

- **Toujours `git pull` avant de commencer à travailler.** Des modifications
  peuvent arriver à tout moment depuis : les autres PC, les sessions Claude sur
  le web, Pages CMS (Antoine y édite textes et photos), et le robot GitHub
  Actions (qui régénère automatiquement des pages).
- **Ne jamais terminer une session avec du travail non poussé** : commit + push
  systématique, sinon les autres postes ne verront rien et des conflits
  apparaîtront.
- **Publier = fusionner dans `main`** : le serveur Hostinger se synchronise
  toutes les 5 minutes, donc tout ce qui arrive sur `main` est en ligne sur
  https://www.pigeard-opticiens.fr en ~5 minutes. Les détails du workflow sont
  dans `CLAUDE.md`.
- En cas de conflit git que tu ne peux pas résoudre proprement, explique la
  situation à Antoine simplement et propose la solution la plus sûre — jamais de
  `push --force` sur `main`.
