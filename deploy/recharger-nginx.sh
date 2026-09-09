#!/bin/sh
# ============================================================
# PIGEARD VITRINE — appliquer la conf nginx du dépôt sur le VPS
#
# À lancer sur le VPS (en SSH root) après chaque modification de
# deploy/nginx-vitrine.conf fusionnée dans main (et récupérée par le
# git pull automatique, ~5 min) :
#   sh /docker/pigeard-vitrine/repo/deploy/recharger-nginx.sh
#
# Pourquoi recréer le conteneur et pas seulement « nginx -s reload » :
# la conf est montée fichier par fichier dans le conteneur (voir
# installer-serveur.sh). Or git remplace le fichier à chaque pull (nouvel
# inode) : le conteneur continue de voir l'ANCIEN fichier tant qu'il n'a
# pas été recréé. Un simple reload relit donc l'ancienne conf.
# ============================================================
set -e
cd /docker/pigeard-vitrine

echo "— Conf vue par le conteneur avant recréation —"
if docker exec pigeard-vitrine grep -q "well-known" /etc/nginx/conf.d/default.conf 2>/dev/null; then
  echo "  déjà à jour (règle « fichiers cachés » présente)"
else
  echo "  ancienne version (règle « fichiers cachés » absente) → recréation"
fi

docker compose up -d --force-recreate pigeard-vitrine
sleep 3
docker exec pigeard-vitrine nginx -t

echo ""
echo "— Vérifications depuis l'extérieur (attendre ~10 s si la 1re échoue) —"
echo "· chemins cachés (attendu : 404) :"
for p in /.git/HEAD /.gitignore; do
  curl -s -o /dev/null -w "  $p → %{http_code}\n" "https://www.pigeard-opticiens.fr$p"
done
echo "· en-têtes de sécurité sur l'accueil :"
curl -sI https://www.pigeard-opticiens.fr/ | grep -iE "strict-transport|x-frame|permissions-policy" || echo "  (absents : la conf n'est pas appliquée)"
echo "· site :"
curl -s -o /dev/null -w "  / → %{http_code}\n" https://www.pigeard-opticiens.fr/
echo ""
echo "✓ Terminé."
