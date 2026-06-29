#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère des versions WebP des images référencées et réécrit les <img> en
<picture><source ...webp><img ...original></picture>. Le <img> d'origine
(jpg/png) reste en secours : si un .webp manque, l'image s'affiche quand même.

Utilitaire ponctuel — relancer après ajout de nouvelles photos :
    python tools/make_webp.py
(idempotent : ne retraite pas un fichier déjà converti).
"""
import re, json, pathlib, sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML_FILES = ["index.html", "histoire.html", "equipe.html", "magasins.html", "services.html"]
IMG_RE = re.compile(r'<img\b[^>]*?>', re.I)
SRC_RE = re.compile(r'src="([^"]+\.(?:jpe?g|png))"', re.I)

def to_webp_rel(rel):
    return re.sub(r'\.(jpe?g|png)$', '.webp', rel, flags=re.I)

# 1) collecte des images référencées (HTML + creations.json)
refs = set()
for f in HTML_FILES:
    t = (ROOT / f).read_text(encoding="utf-8")
    for m in IMG_RE.finditer(t):
        s = SRC_RE.search(m.group(0))
        if s:
            refs.add(s.group(1))
crea = json.loads((ROOT / "assets/data/creations.json").read_text(encoding="utf-8"))["creations"]
for c in crea:
    img = c.get("image")
    if img and re.search(r'\.(jpe?g|png)$', img, re.I):
        refs.add(img.lstrip("/"))

# 2) conversion
conv = skip = miss = err = 0
for rel in sorted(refs):
    src = ROOT / rel
    webp = ROOT / to_webp_rel(rel)
    if not src.exists():
        print("  ! source manquante :", rel); miss += 1; continue
    if webp.exists():
        skip += 1; continue
    try:
        im = Image.open(src)
        im = im.convert("RGBA") if im.mode in ("P", "RGBA", "LA") else im.convert("RGB")
        webp.parent.mkdir(parents=True, exist_ok=True)
        im.save(webp, "WEBP", quality=82, method=6)
        conv += 1
    except Exception as e:
        print("  ! échec %s : %s" % (rel, e)); err += 1
print("WebP : %d converties, %d déjà présentes, %d manquantes, %d échecs (%d référencées)" % (conv, skip, miss, err, len(refs)))

# 3) réécriture <img> -> <picture> (fallback conservé)
def repl(m):
    tag = m.group(0)
    s = SRC_RE.search(tag)
    if not s:
        return tag
    webprel = to_webp_rel(s.group(1))
    if not (ROOT / webprel).exists():
        return tag
    return '<picture><source srcset="%s" type="image/webp">%s</picture>' % (webprel, tag)

for f in HTML_FILES:
    t = (ROOT / f).read_text(encoding="utf-8")
    if 'type="image/webp"' in t:
        print("  = déjà traité :", f); continue
    new = IMG_RE.sub(repl, t)
    if new != t:
        (ROOT / f).write_text(new, encoding="utf-8", newline="")
        print("  ✓ %s : <img> → <picture>" % f)
    else:
        print("  = aucun changement :", f)
print("OK.")
