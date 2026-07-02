#!/bin/sh
# ============================================================
# PIGEARD VITRINE — installation de la config nginx sur le VPS
#
# À lancer UNE SEULE FOIS, sur le VPS (en SSH root) :
#   bash /docker/pigeard-vitrine/repo/deploy/installer-serveur.sh
#
# Ce script :
#   1. sauvegarde docker-compose.yml
#   2. monte deploy/nginx-vitrine.conf dans le conteneur nginx
#   3. redémarre le conteneur et vérifie la config
# ============================================================
set -e
cd /docker/pigeard-vitrine

# 1) sauvegarde
cp docker-compose.yml "docker-compose.yml.bak-$(date +%Y%m%d-%H%M%S)"

# 2) ajoute le montage de la conf nginx (idempotent)
if grep -q "nginx-vitrine.conf" docker-compose.yml; then
  echo "→ montage déjà présent dans docker-compose.yml"
else
  sed -i "s#\(- \./repo:[^\n]*\)#\1\n      - ./repo/deploy/nginx-vitrine.conf:/etc/nginx/conf.d/default.conf:ro#" docker-compose.yml
  grep -q "nginx-vitrine.conf" docker-compose.yml || {
    echo "!! échec de l'insertion automatique — ajouter à la main dans docker-compose.yml,"
    echo "   sous les volumes du service pigeard-vitrine :"
    echo "      - ./repo/deploy/nginx-vitrine.conf:/etc/nginx/conf.d/default.conf:ro"
    exit 1
  }
  echo "→ montage ajouté à docker-compose.yml"
fi

# 3) redémarre et vérifie
docker compose up -d --force-recreate pigeard-vitrine
sleep 3
docker exec pigeard-vitrine nginx -t

echo ""
echo "— Vérifications depuis l'extérieur —"
echo "· compression :"
curl -sI -H "Accept-Encoding: gzip" https://www.pigeard-opticiens.fr/ | grep -i "content-encoding" || echo "  (pas encore visible — réessayer dans 1 min)"
echo "· cache CSS :"
curl -sI https://www.pigeard-opticiens.fr/assets/css/site.css | grep -i "cache-control" || true
echo "· redirection domaine nu :"
curl -sI https://pigeard-opticiens.fr/ | head -3
echo "· page 404 :"
curl -s -o /dev/null -w "  code %{http_code} pour /page-inexistante\n" https://www.pigeard-opticiens.fr/page-inexistante
echo ""
echo "✓ Terminé."
