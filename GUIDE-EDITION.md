# ✏️ Modifier le site toi-même (textes & photos)

Tu peux modifier le contenu de ton site **sans toucher au code**, depuis un éditeur en ligne gratuit : **Pages CMS**. Il se connecte à ton site GitHub ; quand tu enregistres, **le site se met à jour tout seul**.

---

## 1. Activation (à faire **une seule fois**)

1. Va sur **https://app.pagescms.org**
2. Clique sur **« Sign in with GitHub »** et connecte-toi avec **ton compte GitHub** (le même que dans GitHub Desktop).
3. GitHub te demande d'**autoriser Pages CMS** : choisis **seulement le dépôt de ton site** (pas tous tes dépôts).
4. De retour sur Pages CMS, **sélectionne le dépôt du site Pigeard**. L'éditeur s'ouvre. ✅

> C'est une connexion sécurisée : c'est **toi** qui autorises l'accès, je n'ai jamais tes identifiants.

---

## 2. Modifier un texte ou une photo

1. Dans le menu de gauche, tu verras **« Créations sur-mesure »** et **« Nos marques »**.
2. Clique dessus → la liste s'ouvre (chaque ligne = une monture / une marque).
3. Clique sur l'élément à modifier.
4. Change ce que tu veux :
   - **Textes** : tape directement dans les cases (Nom, Accroche, Descriptif…).
   - **Photo** : clique sur le champ **Photo** → tu peux en **choisir une existante** ou **en téléverser une nouvelle**.
5. Clique sur **« Save »** (en haut à droite).

## 3. Publier

Dès que tu cliques **Save**, la modification est envoyée sur GitHub et **ton site se met à jour automatiquement en 1 à 2 minutes**. Rien d'autre à faire (même pas besoin de GitHub Desktop pour ces modifs).

---

## ⚠️ À savoir

- **Ne touche jamais au champ « Identifiant »** : il relie la photo et la page. Le modifier casserait le lien.
- Pour **ajouter** une monture ou une marque : bouton **« Add »** en bas de la liste.
- Pour les créations, des **photos carrées sur fond blanc** rendent le mieux.

---

## 🏷️ Logos des marques

Sur la page **« Nos marques »**, chaque carte affiche le **logo** de la marque à la place de son nom écrit.

- Pour **changer un logo** : ouvre la marque dans **« Nos marques »**, clique sur le champ **Logo** → choisis un fichier existant ou téléverse-en un nouveau, puis **Save**.
- Le fichier doit être un **SVG** ou un **PNG à fond transparent** (pas de fond blanc ni de couleur). Sur le site, le logo est affiché **en blanc cassé sur fond sombre** : sa couleur d'origine n'est pas conservée, c'est voulu pour que toutes les cartes soient harmonieuses.
- Si une marque n'a **pas de logo** (champ vide), son **nom** s'affiche à la place, comme avant.

---

## 🆕 Nouveautés & visuels d'une marque

Dans **« Nos marques »**, chaque marque a deux cases facultatives :

- **Nouveauté** : un texte court, par exemple « En magasin dès janvier 2027 ». Tant qu'il est rempli, la marque affiche un badge **« Nouveau »** (sur la grille des marques, où elle passe en premier), un bandeau sur sa fiche et un rappel sur la page d'accueil. **Vide la case** quand la marque n'est plus une nouveauté : tout disparaît.
- **Visuels de la fiche** : les images affichées dans la galerie **« En images »** de la fiche. Pour chaque image : la photo (**JPG**, 1600 px de large maximum), une **légende**, une **description** (lue aux personnes malvoyantes et par Google) et le **crédit** (ex. « © Anne & Valentin »). La 1re image sert aussi d'aperçu quand on partage la page sur les réseaux.

> ⚠️ Les **photos officielles d'une marque** ne se publient qu'avec **son accord écrit** (à demander à la marque, par exemple à son commercial). Sans accord, garde les illustrations Pigeard.

---

## 🎄 Décor de Noël

Chaque année, **du 1er novembre au 31 janvier**, le site se met tout seul aux couleurs des fêtes : bonnet de Noël sur la lunette de l'écran « Réglage de la netteté… », guirlande lumineuse sous le menu, boules suspendues, neige fine, petit sapin doré et message de saison en bas des pages. Rien à faire : il apparaît le 1er novembre et disparaît le 1er février, tous les ans.

- **Voir le décor avant novembre** : ouvre le site avec `?noel=1` à la fin de l'adresse, par exemple **www.pigeard-opticiens.fr/?noel=1**. Le décor reste affiché sur toutes les pages tant que l'onglet est ouvert. Pour l'enlever : `?noel=0`. L'écran « Réglage de la netteté… » (et donc le bonnet) ne passe qu'une fois par onglet : pour le revoir, ouvre le lien dans un **nouvel onglet**. (Si ton ordinateur ou ton téléphone est réglé sur « réduire les animations », cet écran ne s'affiche jamais, et la neige non plus.)
- **Réglages** (dans l'éditeur, rubrique **« Décor de Noël »**) :
  - **Décor de Noël activé** : décoche-le pour ne plus rien afficher, même en décembre.
  - **Début / Fin** : les dates, au format jour/mois (ex. `01/11` et `31/01`). Elles servent **tous les ans**, inutile de les changer.
  - **Neige qui tombe** : décoche-le pour garder la guirlande et le sapin sans la neige.
  - **Messages** : celui de fin d'année (jusqu'au 31 décembre) et celui de janvier ; dans ce dernier, `{annee}` est remplacé par l'année (ex. « Belle et heureuse année 2027 »).
- Les visiteurs peuvent **arrêter la neige** (bouton flocon en bas à gauche sur ordinateur, lien « Arrêter la neige » en bas de page et dans le menu sur téléphone).

---

## 🏷️ Popup « Journées Privilège » (opérations commerciales)

Du **15 novembre au 29 décembre 2026** (dates incluses), une petite fenêtre animée présente les Journées Privilège à l'arrivée sur le site : les bandeaux « Les journées / Privilège / Du 15 novembre au 29 décembre » se dévoilent, puis l'étoile « -50% » tourne et se pose. Elle apparaît **une fois par visite**, environ 2 secondes après l'écran « Réglage de la netteté… », et jamais sur la page des mentions légales. Sur ordinateur, c'est une fenêtre au centre de l'écran ; sur téléphone, une carte en bas d'écran qui laisse la page lisible (Google déconseille les fenêtres qui cachent la page sur mobile, cela peut nuire au référencement). Rien à faire : elle s'arrête toute seule le 30 décembre.

- **La voir avant le 15 novembre** : ouvre le site avec `?operation=1` à la fin de l'adresse, par exemple **www.pigeard-opticiens.fr/?operation=1**. Comme pour un visiteur, elle ne s'affiche qu'**une fois par visite** : les pages suivantes ne la rejouent pas. Pour la revoir, rouvre le lien avec `?operation=1`. Pour l'arrêter : `?operation=0`.
- **Réglages** (dans l'éditeur, rubrique **« Popup opération commerciale (Journées Privilège) »**) :
  - **Popup activé** : décoche-le pour l'arrêter tout de suite.
  - **Premier jour / Dernier jour inclus** : au format jour/mois/année (ex. `15/11/2026` et `29/12/2026`).
  - **Les textes** : les trois bandeaux, l'étoile, la phrase, le paragraphe (sur ordinateur seulement), le bouton et la page qu'il ouvre (`magasins.html` par défaut), et les **mentions obligatoires** en petit. Garde toujours ces mentions tant que l'offre est affichée (« *Sur articles signalés en magasin… »).
- **Pour une prochaine opération** : change les dates et les textes, coche « Popup activé », c'est tout. La photo du magasin et les couleurs restent les mêmes ; pour les changer, demande-le-moi.

---

## 📌 Ce qui est modifiable aujourd'hui

- ✅ **Textes — Page d'accueil** (accroches, titres et paragraphes de la page d'accueil)
- ✅ **Créations sur-mesure** (noms, accroches, descriptifs, photos)
- ✅ **Nos marques** (noms, accroches, présentations, **logos**, **nouveautés** et **visuels**)
- ✅ **Décor de Noël** (activation, dates, neige, messages)
- ✅ **Popup opération commerciale** (activation, dates, textes, mentions)

> 💡 Pour les titres sur **2 lignes** (ex. « Un savoir-faire / qui se transmet »), appuie sur **Entrée** dans la case pour créer la 2ᵉ ligne.

**Prochaine étape (je m'en occupe) :** rendre aussi modifiables les **infos des magasins** (horaires, adresses, téléphones), l'**équipe**, et les **textes des autres pages**.

Une question ou un souci ? Dis-le-moi. 👓
