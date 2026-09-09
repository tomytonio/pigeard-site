# Modèles de textes et de configuration

Tout ce qui est entre crochets `[…]` est **inconnu du skill** : le laisser en
crochets dans le code tant que le propriétaire n'a pas fourni la valeur, et
lister ces crochets dans le message final. Ne jamais inventer un montant, un
numéro, une durée ou un nom de prestataire. Les choix juridiques (base
juridique, durée) sont proposés avec leur source ; le propriétaire tranche.

## 1. Mention d'information sous le formulaire de contact (`contact.html`)

À placer juste avant le bouton « Envoyer » (RGPD art. 13 : information **au
moment** de la collecte), dans le style existant (`.form-notice`) :

```html
<p class="form-notice" style="margin-top:14px;line-height:1.55">
  Les informations saisies sont transmises à Optique Pigeard SAS (responsable du
  traitement) et au magasin choisi, uniquement pour répondre à votre demande
  [base juridique à choisir : « mesures précontractuelles » (RGPD art. 6-1-b) ou
  « intérêt légitime à répondre aux demandes » (art. 6-1-f)]. Elles transitent
  par notre outil d'automatisation hébergé chez Hostinger (Union européenne) et
  sont conservées [durée à fixer — repère CNIL : 3 ans après votre dernier
  contact]. Merci de ne pas indiquer d'ordonnance ni d'information sur votre
  santé dans ce message : nous les recueillons en magasin.
  Le téléphone est facultatif et ne sert qu'à vous rappeler ; vous pouvez vous
  inscrire sur la liste d'opposition au démarchage téléphonique
  <a href="https://www.bloctel.gouv.fr" target="_blank" rel="noopener">Bloctel</a>.
  Vous disposez de droits d'accès, de rectification, d'effacement, de limitation,
  d'opposition et de portabilité (<a href="mailto:nogent@pigeard-opticiens.fr">nogent@pigeard-opticiens.fr</a>)
  et pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>.
  <a href="mentions-legales.html#donnees-personnelles">En savoir plus</a>.
</p>
```

Sources : RGPD art. 13 ; C. conso L.223-2 (Bloctel — relire la version en
vigueur depuis le 12 août 2026) ; RGPD art. 9 (données de santé) ; référentiel
CNIL gestion commerciale (3 ans, indicatif).

## 2. Section « Données personnelles & traceurs » pour `mentions-legales.html`

À insérer à la place (ou à la suite) du paragraphe « Protection des données
personnelles (RGPD) » existant, en gardant le style de la page (`<h2
class="reveal">`, `<h3 class="reveal">`, `<p>`). Poser l'ancre
`id="donnees-personnelles"` sur le `<h2>` pour le lien du formulaire.

```html
<h2 class="reveal" id="donnees-personnelles">Données personnelles &amp; traceurs</h2>

<h3 class="reveal">Responsable du traitement</h3>
<p>Optique Pigeard SAS, 4 rue Gouverneur, 28400 Nogent-le-Rotrou —
nogent@pigeard-opticiens.fr — 02 37 52 03 39. [Aucun délégué à la protection
des données n'a été désigné. / Délégué : …]</p>

<h3 class="reveal">Ce que ce site collecte</h3>
<p><strong>Formulaire de contact</strong> — nom, e-mail, téléphone (facultatif),
magasin, objet et message, pour répondre à votre demande [base juridique
choisie]. Les messages sont acheminés par notre outil d'automatisation
(n8n, hébergé chez Hostinger, Union européenne) vers la messagerie du magasin
choisi [prestataire de messagerie : …] et conservés [durée : …]. Merci de ne
pas y indiquer de données de santé : elles sont recueillies en magasin.</p>
<p><strong>Statistiques de fréquentation</strong> — pour connaître les pages
consultées et améliorer le site, notre outil (hébergé chez Hostinger, sans
prestataire tiers) enregistre : page vue, temps passé, site de provenance,
type d'appareil (mobile, tablette, ordinateur) et un identifiant aléatoire
valable le temps de l'onglet. Ces données ne permettent pas de vous
identifier, ne sont pas recoupées avec d'autres fichiers ni transmises à des
tiers, et sont conservées [durée ≤ 25 mois : …]. Ce dispositif de mesure
d'audience est dispensé de consentement (article 82 de la loi Informatique
et Libertés, conditions fixées par la CNIL).</p>
<p><strong>Avis Google affichés sur l'accueil</strong> — nous affichons les
avis publiés sur nos fiches Google (prénom ou pseudonyme et texte, tels que
rendus publics par leurs auteurs), sur le fondement de notre intérêt
légitime à présenter la satisfaction de nos clients. Tout auteur peut
demander le retrait de son avis de cette page (contact ci-dessus) ou le
modifier sur Google.</p>
<p><strong>Prise de rendez-vous, visites virtuelles, cartes, réseaux
sociaux</strong> — ces services sont proposés par des liens vers des sites
tiers (Zerosix, TourMkr, Google Maps, Instagram, Facebook, Lentilles
Opticiens) qui appliquent leur propre politique de confidentialité une fois
que vous les avez rejoints. Ce site n'y charge aucun contenu et n'y
transmet aucune donnée.</p>

<h3 class="reveal">Stockage dans votre navigateur</h3>
<p>Ce site ne dépose aucun cookie et n'utilise aucun outil publicitaire ni de
suivi tiers. Il mémorise seulement, dans votre navigateur :</p>
<table>
  <tr><th>Clé</th><th>Rôle</th><th>Durée</th></tr>
  <tr><td><code>pg-loader-vu</code></td><td>ne pas rejouer l'écran d'accueil à chaque page</td><td>fermeture de l'onglet</td></tr>
  <tr><td><code>pigeardSession</code></td><td>identifiant aléatoire de la mesure d'audience ci-dessus</td><td>fermeture de l'onglet</td></tr>
  <tr><td><code>pgEclipseFerme</code></td><td>mémorise la fermeture d'une information ponctuelle [à retirer avec le code]</td><td>persistant</td></tr>
</table>
<p>Ces éléments sont strictement nécessaires au fonctionnement demandé ou
relèvent de la mesure d'audience exemptée ; aucun bandeau de consentement
n'est donc requis.</p>

<h3 class="reveal">Vos droits</h3>
<p>Vous pouvez accéder à vos données, les faire rectifier ou effacer, en
limiter le traitement, vous y opposer et en demander la portabilité en
écrivant à nogent@pigeard-opticiens.fr [ou par courrier : …]. Nous
répondons dans un délai d'un mois. Vous pouvez aussi introduire une
réclamation auprès de la CNIL (www.cnil.fr). Aucune donnée n'est transférée
hors de l'Union européenne [à confirmer].</p>

<h3 class="reveal">En magasin</h3>
<p>[Conserver ici le paragraphe existant sur le dossier optique, le devis,
le tiers payant et la durée de 5 ans.]</p>
```

Puis mettre à jour « Dernière mise à jour : [mois année] ».

## 3. Compléments d'identification de l'éditeur (bloc « Éditeur du site »)

Lignes à ajouter dans le tableau existant :

- **Capital social** : `[montant] €` — source : extrait Kbis. (LCEN art. 1-1 I 2°)
- **RCS** : `[ville du greffe] [SIREN 431 741 032]` — le SIREN est déjà
  connu (9 premiers chiffres du SIRET) ; le greffe est à relever sur le Kbis.
- **Hébergeur — téléphone** : `[à relever sur les mentions légales de hostinger.fr]`. (LCEN art. 1-1 I 4°)
- **Profession réglementée** (facultatif mais sans risque, LCEN art. 19) :
  « Opticien-lunetier, profession de santé réglementée par le Code de la
  santé publique [référence à vérifier : art. L.4362-1 et suivants] ;
  diplômes délivrés en France [BTS Opticien-Lunetier], enregistrés auprès de
  [autorité à confirmer]. »

## 4. nginx — en-têtes de sécurité complémentaires (optionnel, RGPD art. 32)

À ajouter dans le bloc `server` de `deploy/nginx-vitrine.conf` à côté des
en-têtes existants, puis dans le bloc `location /` (nginx n'hérite pas des
`add_header` d'un niveau supérieur dès qu'un bloc en déclare un) :

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
# HSTS : seulement si l'on est sûr que le domaine (et ses sous-domaines si
# includeSubDomains) sera toujours servi en HTTPS ; commencer sans preload.
add_header Strict-Transport-Security "max-age=31536000" always;
```

Une CSP (Content-Security-Policy) est envisageable — tout est auto-hébergé,
seul `connect-src` doit autoriser `https://n8n-1zv1.srv1641932.hstgr.cloud` —
mais elle exige des tests sur toutes les pages (styles et scripts inline,
`data:` pour les SVG) : la traiter comme un chantier à part, jamais « en
passant ». Après toute modification fusionnée : sur le VPS,
`sh /docker/pigeard-vitrine/repo/deploy/recharger-nginx.sh` (recréation du
conteneur ; un simple reload relit l'ancien fichier), puis
`audit_rgpd.py --prod`.

## 5. Réponse à une demande d'exercice de droits (courriel)

```
Objet : Votre demande relative à vos données personnelles

Bonjour [prénom nom],

Nous avons bien reçu le [date] votre demande [d'accès / de rectification /
d'effacement / d'opposition / de limitation / de portabilité] concernant vos
données personnelles.

[Réponse : données détenues et leur origine / correction effectuée /
suppression effectuée le … / motif légitime de refus le cas échéant.]

Conformément au RGPD (article 12), nous vous répondons dans le délai d'un
mois. Si vous n'êtes pas satisfait de cette réponse, vous pouvez saisir la
CNIL (www.cnil.fr).

Optique Pigeard SAS — nogent@pigeard-opticiens.fr — 02 37 52 03 39
```

Avant de répondre : vérifier l'identité du demandeur si un doute existe
(RGPD art. 12-6), ne jamais envoyer de données de santé à une adresse non
vérifiée.

## 6. Registre des traitements (hors code)

Modèle officiel de registre (tableur) et notice sur la page CNIL
https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement. Fiches
minimales à prévoir pour Pigeard : gestion des clients et dossiers optiques
(données de santé, tiers payant), formulaire de contact du site, mesure
d'audience du site, gestion du personnel, vidéosurveillance si elle existe.
