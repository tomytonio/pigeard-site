#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vignettes réduites de la page d'accueil (fichiers « -petit.webp »).

Sur l'accueil, les portraits des piles « Les visages de la maison », le portrait
d'Iris et les tuiles Instagram sont affichés en petit (100 à 260 px de côté) :
leur envoyer la photo entière (800 à 1600 px) fait télécharger ~500 Ko de trop
sur un téléphone. Ce script fabrique, à côté de chaque photo, une copie réduite
« <nom>-petit.webp » ; index.html la propose au navigateur avec la grande
(attributs srcset + sizes), et le navigateur ne prend la petite que si elle
suffit pour l'écran (jamais d'image agrandie, donc jamais plus floue qu'avant).

Les autres pages (equipe.html…) affichent ces photos en grand : elles gardent
le fichier d'origine.

Usage :
    python tools/vignettes.py            # crée les vignettes manquantes ou plus anciennes que leur photo
    python tools/vignettes.py --force    # refait tout
    python tools/vignettes.py --liste    # n'écrit rien : affiche les largeurs (« 400w ») à reporter dans index.html

À relancer quand une de ces photos est remplacée (même nom de fichier). Si les
dimensions de la nouvelle photo diffèrent, reporter dans index.html la largeur
affichée par --liste (srcset) — et, pour un autre format (portrait / paysage),
revoir l'attribut sizes (voir CLAUDE.md, « Vignettes réduites »).
"""
import pathlib, sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
QUALITE = 82  # comme tools/make_webp.py

# (photo d'origine, dimension contrainte, valeur en pixels)
#   "hauteur" : portraits des polaroïds (cadre plus haut que large) → 600 px de haut
#   "petit_cote" : tuiles carrées → 600 px sur le petit côté
VIGNETTES = [
    ("assets/equipe/nogent/karim.jpg", "hauteur", 600),
    ("assets/equipe/nogent/christelle.jpg", "hauteur", 600),
    ("assets/equipe/nogent/isabelle.jpg", "hauteur", 600),
    ("assets/equipe/nogent/ludo.jpg", "hauteur", 600),
    ("assets/equipe/nogent/vincent.jpg", "hauteur", 600),
    ("assets/equipe/nogent/antoine.jpg", "hauteur", 600),
    ("assets/equipe/nogent/christophe.jpg", "hauteur", 600),
    ("assets/equipe/brou/edouard.jpg", "hauteur", 600),
    ("assets/equipe/brou/ana.jpg", "hauteur", 600),
    ("assets/equipe/brou/magali.jpg", "hauteur", 600),
    ("assets/equipe/la-loupe/christel.jpg", "hauteur", 600),
    ("assets/equipe/la-loupe/clemence.jpg", "hauteur", 600),
    ("assets/equipe/la-loupe/helene.jpg", "hauteur", 600),
    ("assets/equipe/ia/iris.jpg", "hauteur", 600),
    ("assets/photos/ambiance-1.jpg", "petit_cote", 600),
    ("assets/photos/ambiance-2.jpg", "petit_cote", 600),
    ("assets/photos/optikid.jpg", "petit_cote", 600),
    ("assets/photos/gen-atelier.jpg", "petit_cote", 600),
]


def chemin_vignette(rel):
    p = pathlib.PurePosixPath(rel)
    return str(p.with_name(p.stem + "-petit.webp"))


def taille_cible(w, h, mode, px):
    k = px / (h if mode == "hauteur" else min(w, h))
    return (round(w * k), round(h * k)) if k < 1 else (w, h)


def main():
    force = "--force" in sys.argv
    liste = "--liste" in sys.argv
    faites = gardees = 0
    avant = apres = 0
    for rel, mode, px in VIGNETTES:
        src = ROOT / rel
        dst = ROOT / chemin_vignette(rel)
        grand = src.with_suffix(".webp")
        if not src.exists():
            print("  ! photo manquante :", rel)
            continue
        with Image.open(src) as im:
            w, h = im.size
            cible = taille_cible(w, h, mode, px)
            if liste:
                print("  %-42s %4d×%-4d → %s  %dw" % (rel, w, h, chemin_vignette(rel), cible[0]))
                continue
            if dst.exists() and not force and dst.stat().st_mtime >= src.stat().st_mtime:
                gardees += 1
            else:
                im.convert("RGB").resize(cible, Image.LANCZOS).save(dst, "WEBP", quality=QUALITE, method=6)
                faites += 1
        if grand.exists():
            avant += grand.stat().st_size
            apres += dst.stat().st_size
    if not liste:
        print("Vignettes : %d créées, %d déjà à jour — %d Ko au lieu de %d Ko pour les %d photos"
              % (faites, gardees, round(apres / 1024), round(avant / 1024), len(VIGNETTES)))


if __name__ == "__main__":
    main()
