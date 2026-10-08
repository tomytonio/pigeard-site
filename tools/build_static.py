#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de pages statiques Pigeard.

Lit assets/data/marques.json et assets/data/creations.json (la SOURCE éditée
via PagesCMS) et génère :
  - une page statique par marque : marque-<slug>.html (contenu complet + JSON-LD)
  - le contenu crawlable <noscript> injecté dans marques.html et creations.html
    (entre les marqueurs GEN:...-START / GEN:...-END)
  - sitemap.xml (pages principales + toutes les fiches marques)
  - le nombre de marques françaises affiché sur index.html (marqueurs
    GEN:stat-france-START / GEN:stat-france-END), même règle que le filtre
    « France » de marques.html
  - la puce « Nouveau » de l'accueil (marqueurs GEN:nouveautes-START / -END)
    pour chaque marque dont le champ « nouveaute » est rempli

Champs facultatifs d'une marque (en plus des champs habituels) :
  - "nouveaute" : texte court (ex. « En magasin dès janvier 2027 ») → bandeau
    « Nouveau chez Pigeard » sur la fiche, pastille « Nouveau » sur la grille
    (marques.html) et puce sur l'accueil ; vide ou absent = rien ;
  - "visuels" : liste de {image, legende, alt, credit} → galerie « En images »
    sur la fiche ; la 1re image sert aussi d'image de partage (og:image). Un
    .webp de même nom à côté d'un .jpg/.png est servi en priorité (<picture>).

Le JSON reste la source de vérité : on régénère à chaque modif (cf. GitHub Action).
Lancer depuis la racine du dépôt :  python tools/build_static.py
"""

import json, re, html, datetime, pathlib, struct, sys
from urllib.parse import quote

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://www.pigeard-opticiens.fr"
TODAY = datetime.date.today().isoformat()

def esc(s):
    return html.escape(str(s or ""), quote=True)

def cat_label(c):
    return {"made-in-france": "made in France", "createur": "créateur"}.get(c, c)

# ---------------------------------------------------------------- images
def image_size(path):
    """(largeur, hauteur) d'une image JPEG, PNG, GIF ou WebP, lue dans son
    en-tête (bibliothèque standard seulement) ; None si illisible."""
    try:
        with open(path, "rb") as f:
            head = f.read(32)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                return struct.unpack(">II", head[16:24])
            if head[:6] in (b"GIF87a", b"GIF89a"):
                return struct.unpack("<HH", head[6:10])
            if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
                kind = head[12:16]
                if kind == b"VP8 ":
                    w, h = struct.unpack("<HH", head[26:30])
                    return w & 0x3FFF, h & 0x3FFF
                if kind == b"VP8L":
                    bits = int.from_bytes(head[21:25], "little")
                    return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
                if kind == b"VP8X":
                    return int.from_bytes(head[24:27], "little") + 1, int.from_bytes(head[27:30], "little") + 1
                return None
            if head[:2] == b"\xff\xd8":
                f.seek(2)
                while True:
                    b = f.read(1)
                    while b and b != b"\xff":
                        b = f.read(1)
                    while b == b"\xff":
                        b = f.read(1)
                    if not b:
                        return None
                    m = b[0]
                    if m == 0xD8 or m == 0x01 or 0xD0 <= m <= 0xD7:
                        continue
                    seg = struct.unpack(">H", f.read(2))[0]
                    if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        h, w = struct.unpack(">xHH", f.read(5))
                        return w, h
                    f.seek(seg - 2, 1)
    except (OSError, struct.error):
        return None
    return None

def txt(v):
    """Valeur texte facultative du JSON (None, nombre… → chaîne nettoyée)."""
    return str(v if v is not None else "").strip()

def chemin_image(p):
    """Chemin d'image du JSON, relatif à la racine du site (sans / initial)."""
    return txt(p).lstrip("/")

def url_image(p):
    """Chemin d'image utilisable dans src/srcset (espaces, accents encodés)."""
    return quote(p, safe="/-_.~")

def build_visuels(b):
    """Galerie « En images » (champ « visuels ») → (html, infos og:image ou None)."""
    items = [v for v in (b.get("visuels") or []) if isinstance(v, dict) and chemin_image(v.get("image"))]
    if not items:
        return "", None
    figs = []
    for i, v in enumerate(items):
        src = chemin_image(v.get("image"))
        legende = txt(v.get("legende"))
        alt = txt(v.get("alt")) or legende or txt(b.get("name"))
        credit = txt(v.get("credit"))
        size = image_size(ROOT / src)
        if size is None and not (ROOT / src).exists():
            print("  ! visuel introuvable pour %s : %s" % (b.get("slug"), src))
        dims = (' width="%d" height="%d"' % size) if size else ""
        img = '<img src="%s" alt="%s"%s loading="lazy" decoding="async">' % (esc(url_image(src)), esc(alt), dims)
        webp = re.sub(r"\.(jpe?g|png)$", ".webp", src, flags=re.I)
        if webp != src and (ROOT / webp).exists():
            img = '<picture><source srcset="%s" type="image/webp">%s</picture>' % (esc(url_image(webp)), img)
        cap = ""
        if legende or credit:
            cap = "<figcaption>%s%s</figcaption>" % (
                esc(legende), ('<span class="credit">%s</span>' % esc(credit)) if credit else "")
        # nombre impair d'images : la première occupe toute la largeur
        cls = "bv reveal" + (" bv--large" if i == 0 and len(items) % 2 else "")
        figs.append('      <figure class="%s"><div class="bv-img">%s</div>%s</figure>' % (cls, img, cap))
    html_ = ('\n  <section class="brand-visuels" aria-labelledby="bv-titre"><div class="wrap">\n'
             '    <div class="bv-head reveal"><span class="eyebrow">En images</span>'
             '<h2 id="bv-titre">L\'univers %s</h2></div>\n'
             '    <div class="bv-grid">\n%s\n    </div>\n'
             '  </div></section>') % (esc(b.get("name")), "\n".join(figs))
    first = items[0]
    og = {"src": chemin_image(first.get("image")),
          "size": image_size(ROOT / chemin_image(first.get("image"))),
          "alt": txt(first.get("alt")) or txt(first.get("legende"))}
    return html_, og

# ---------------------------------------------------------------- brand page
BRAND_TMPL = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>@@TITLE@@</title>
<meta name="description" content="@@DESC@@" />
<link rel="canonical" href="@@CANON@@" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="fr_FR" />
<meta property="og:site_name" content="Pigeard Opticiens" />
<meta property="og:url" content="@@CANON@@" />
<meta property="og:title" content="@@OGTITLE@@" />
<meta property="og:description" content="@@DESC@@" />
<meta property="og:image" content="@@OGIMAGE@@" />@@OGEXTRA@@
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="@@OGTITLE@@" />
<meta name="twitter:description" content="@@DESC@@" />
<meta name="twitter:image" content="@@OGIMAGE@@" />
<script type="application/ld+json">
@@JSONLD@@
</script>
<link rel="preload" href="assets/fonts/karla-normal-300-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/playfair-display-italic-400-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/playfair-display-normal-400-900-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/brand/favicon-180.png">
<link rel="stylesheet" href="assets/css/site.css?v=20261008">
<!-- Écran de chargement (une fois par visite) : voile immédiat + logique dans loader.js -->
<style>html.pg-loading{overflow:hidden}html.pg-loading::before{content:"";position:fixed;inset:0;z-index:11000;background:#26231C;pointer-events:none;animation:pg-voile .5s ease 3.8s forwards}@keyframes pg-voile{to{opacity:0;visibility:hidden}}</style>
<script>try{if(!document.prerendering&&!sessionStorage.getItem('pg-loader-vu')&&!matchMedia('(prefers-reduced-motion:reduce)').matches)document.documentElement.classList.add('pg-loading')}catch(e){}</script>
<script src="assets/js/loader.js" defer></script>
<script type="speculationrules">
{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}
</script>
<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>
</head>
<body>
<a class="skip-link" href="#top">Aller au contenu</a>
<div class="grain"></div><div class="progress" id="progress"></div>
<header class="nav" id="nav">
  <a href="index.html"><img class="nav-logo" src="assets/brand/pigeard-logo-white.svg" alt="Pigeard — créateur de regards depuis 1863"></a>
  <nav class="nav-links"><a href="histoire.html">Notre histoire</a><a href="services.html">Nos expertises</a><a href="marques.html" class="active">Nos marques</a><a href="equipe.html">L'équipe</a><a href="magasins.html">Magasins</a></nav>
  <button class="nav-cta" onclick="location.href='magasins.html#rdv'">Prendre rendez-vous</button>
  <button class="burger" aria-label="Ouvrir le menu">☰</button>
</header>
<div class="mobile-menu"><button class="close" aria-label="Fermer">✕</button><a href="histoire.html">Notre histoire</a><a href="services.html">Nos expertises</a><a href="marques.html">Nos marques</a><a href="equipe.html">L'équipe</a><a href="magasins.html">Magasins</a><a href="magasins.html#rdv">Prendre rendez-vous</a></div>

<main id="brandRoot">
  <section class="brand-hero wrap">
    <div class="watermark" aria-hidden="true">@@NAME@@</div>
    <a class="back" href="marques.html">← Toutes nos marques</a>
    <h1 class="brand-name">@@NAME@@</h1>
    <p class="brand-tagline">@@TAGLINE@@</p>@@NOUVEAU@@
    <div class="brand-meta">@@META@@</div>
  </section>
  <section class="brand-body"><div class="wrap">
    <div id="bParas">@@PARAS@@</div>
    <aside class="brand-aside">
      <h4>Origine</h4><div class="v">@@ORIGIN@@</div>
      <h4>Depuis</h4><div class="v">@@FOUNDED@@</div>
      <h4>Esprit</h4><div class="v" style="font-size:1.05rem;font-style:italic;color:var(--creme)">@@STYLE@@</div>@@NOUVEAU_ASIDE@@
      <a class="btn btn--primary" href="magasins.html#rdv">Essayer en boutique <span class="arr">→</span></a>
      @@SITE@@
    </aside>
  </div></section>@@VISUELS@@
  <section class="wrap"><div class="brand-nav">
    <a href="@@PREV_HREF@@">← Précédente<span class="nm">@@PREV_NAME@@</span></a>
    <a href="@@NEXT_HREF@@" style="text-align:right">Suivante →<span class="nm">@@NEXT_NAME@@</span></a>
  </div></section>
  <section class="sec-sm sec--cream"><div class="wrap" style="text-align:center">
    <h2 class="reveal" style="font-family:var(--serif);font-weight:700;font-size:clamp(1.8rem,5vw,3rem);max-width:20ch;margin:0 auto">Envie de l'essayer ? Venez la voir chez Pigeard.</h2>@@NOUVEAU_CTA@@
    <div class="reveal" style="margin-top:26px"><a class="btn btn--primary" href="magasins.html#rdv">Prendre rendez-vous <span class="arr">→</span></a></div>
  </div></section>
</main>

<footer class="site"><div class="wrap">
  <div class="foot-top">
    <div class="foot-brand">
      <img class="mac" src="assets/brand/macaron-cream.svg" alt="Pigeard depuis 1863">
      <h3>Créateur de regards depuis 1863.</h3>
      <span class="hand">à très vite chez Pigeard</span>
    </div>
    <div class="foot-links">
      <div class="foot-col"><h4>La maison</h4><a href="histoire.html">Notre histoire</a><a href="equipe.html">L'équipe</a><a href="engagements.html">Nos engagements</a><a href="engagements.html#mutuelles">Nos mutuelles</a></div>
      <div class="foot-col"><h4>Expertises</h4><a href="services.html#sur-mesure">Sur mesure</a><a href="services.html#optikid">Optikid</a><a href="services.html#basse-vision">Basse vision</a><a href="services.html#nuance-audio">Nuance Audio</a><a href="lentilles.html">Lentilles en ligne</a><a href="marques.html">Nos marques</a><a href="creations.html">Nos créations</a></div>
      <div class="foot-col"><h4>Magasins</h4><a href="magasins.html">Nos 3 magasins</a><a href="opticien-nogent-le-rotrou.html">Opticien Nogent-le-Rotrou</a><a href="opticien-brou.html">Opticien Brou</a><a href="opticien-la-loupe.html">Opticien La Loupe</a><a href="contact.html">Contact</a><a href="https://instagram.com/pigeard.opticiens" target="_blank" rel="noopener">Instagram</a><a href="https://facebook.com/pigeard.opticiens" target="_blank" rel="noopener">Facebook</a></div>
    </div>
  </div>
  <div class="foot-bottom"><span>© 2026 Pigeard — Créateur de regards depuis 1863.</span><span><a href="mentions-legales.html">Mentions légales</a> · Nogent-le-Rotrou · Brou · La Loupe</span></div>
</div></footer>

<script src="assets/js/vendor/gsap.min.js"></script>
<script src="assets/js/vendor/ScrollTrigger.min.js"></script>
<script src="assets/js/vendor/lenis.min.js"></script>
<script src="assets/js/site.js?v=20261008d"></script>
<script>
if(window.PIGEARD && !PIGEARD.reduce && window.gsap){
  gsap.from('.brand-name',{y:40,autoAlpha:0,duration:1.1,ease:'expo.out'});
  gsap.from('.brand-tagline,.brand-nouveau,.brand-meta',{y:20,autoAlpha:0,duration:.9,ease:'power3.out',stagger:.12,delay:.2});
  gsap.from('#bParas p',{y:30,autoAlpha:0,duration:.8,ease:'power3.out',stagger:.12,scrollTrigger:{trigger:'#bParas',start:'top 85%'}});
  if(window.ScrollTrigger)ScrollTrigger.refresh();
}
</script>
</body>
</html>
"""

def build_brand_page(b, prev, nxt):
    name = b.get("name", "")
    paras = b.get("paragraphs") or []
    desc = (paras[0][:152] + "…") if paras else ("Découvrez " + name + " chez Pigeard Opticiens, opticien dans le Perche depuis 1863.")
    canon = "%s/marque-%s.html" % (BASE, b["slug"])

    # badges catégories (hors made-in-france, repris par la pastille mif)
    cats = [c for c in (b.get("category") or []) if c != "made-in-france"][:5]
    meta = "".join('<span>%s</span>' % esc(cat_label(c)) for c in cats)
    if b.get("madeInFrance"):
        meta += '<span class="mif">◆ Fabriqué en France</span>'

    paras_html = "".join("<p>%s</p>" % esc(p) for p in paras)
    origin = esc(b.get("origin") or "—")
    founded = ("depuis %s" % b["founded"]) if b.get("founded") else "—"
    style = esc(b.get("style") or "—")
    site = ('<a class="site" href="%s" target="_blank" rel="noopener">Site officiel ↗</a>' % esc(b["url"])) if b.get("url") else ""

    # JSON-LD : fil d'ariane + Brand
    brand_ld = {"@type": "Brand", "name": name, "url": canon}
    if paras:
        brand_ld["description"] = paras[0]
    if b.get("url"):
        brand_ld["sameAs"] = [b["url"]]
    if b.get("founded"):
        brand_ld["foundingDate"] = str(b["founded"])
    jsonld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Accueil", "item": BASE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Nos marques", "item": BASE + "/marques.html"},
                {"@type": "ListItem", "position": 3, "name": name, "item": canon},
            ]},
            brand_ld,
        ],
    }
    jsonld_str = json.dumps(jsonld, ensure_ascii=False, indent=2)

    # nouveauté (bandeau, encart, rappel sous le CTA)
    nv = txt(b.get("nouveaute"))
    nouveau = aside = cta = ""
    if nv:
        nouveau = ('\n    <p class="brand-nouveau"><span class="bn-tag"><i aria-hidden="true"></i>Nouveau chez Pigeard</span>'
                   '<span class="bn-txt">%s</span></p>') % esc(nv)
        aside = '\n      <p class="aside-nouveau"><i aria-hidden="true"></i>%s</p>' % esc(nv)
        cta = '\n    <p class="reveal"><span class="hand cta-nouveau">%s</span></p>' % esc(nv)

    # galerie de visuels ; la 1re image devient l'image de partage
    visuels, og = build_visuels(b)
    og_image = BASE + "/assets/photos/histoire-famille.jpg"
    og_extra = ""
    if og:
        og_image = BASE + "/" + url_image(og["src"])
        if og["size"]:
            og_extra += '\n<meta property="og:image:width" content="%d" />\n<meta property="og:image:height" content="%d" />' % og["size"]
        if og["alt"]:
            og_extra += '\n<meta property="og:image:alt" content="%s" />' % esc(og["alt"])

    repl = {
        "@@TITLE@@": esc("%s — Nos marques · Pigeard Opticiens" % name),
        "@@DESC@@": esc(desc),
        "@@CANON@@": canon,
        "@@OGTITLE@@": esc("%s — Pigeard Opticiens" % name),
        "@@JSONLD@@": jsonld_str,
        "@@NAME@@": esc(name),
        "@@TAGLINE@@": esc(b.get("tagline") or ""),
        "@@META@@": meta,
        "@@PARAS@@": paras_html,
        "@@ORIGIN@@": origin,
        "@@FOUNDED@@": esc(founded),
        "@@STYLE@@": style,
        "@@SITE@@": site,
        "@@OGIMAGE@@": esc(og_image),
        "@@OGEXTRA@@": og_extra,
        "@@NOUVEAU_ASIDE@@": aside,
        "@@NOUVEAU_CTA@@": cta,
        "@@NOUVEAU@@": nouveau,
        "@@VISUELS@@": visuels,
        "@@PREV_HREF@@": "marque-%s.html" % prev["slug"],
        "@@PREV_NAME@@": esc(prev["name"]),
        "@@NEXT_HREF@@": "marque-%s.html" % nxt["slug"],
        "@@NEXT_NAME@@": esc(nxt["name"]),
    }
    out = BRAND_TMPL
    for k, v in repl.items():
        out = out.replace(k, v)
    return out

def inject(path, start, end, content):
    """Remplace le contenu entre <!--start--> et <!--end--> (idempotent)."""
    p = ROOT / path
    t = p.read_text(encoding="utf-8")
    pat = re.compile(re.escape("<!--%s-->" % start) + r".*?" + re.escape("<!--%s-->" % end), re.S)
    if not pat.search(t):
        print("  ! marqueurs %s introuvables dans %s (ignoré)" % (start, path))
        return
    new = "<!--%s-->\n%s\n<!--%s-->" % (start, content, end)
    p.write_text(pat.sub(lambda m: new, t), encoding="utf-8", newline="")
    print("  ✓ %s : bloc %s injecté" % (path, start))

def main():
    brands = json.loads((ROOT / "assets/data/marques.json").read_text(encoding="utf-8"))["brands"]
    creations = json.loads((ROOT / "assets/data/creations.json").read_text(encoding="utf-8"))["creations"]
    n = len(brands)
    print("Marques : %d | Créations : %d" % (n, len(creations)))

    # 1) pages marques
    for i, b in enumerate(brands):
        prev = brands[(i - 1) % n]
        nxt = brands[(i + 1) % n]
        (ROOT / ("marque-%s.html" % b["slug"])).write_text(build_brand_page(b, prev, nxt), encoding="utf-8", newline="")
    print("  ✓ %d pages marque-*.html générées" % n)

    # 2) fallback crawlable marques.html
    brands_ns = "\n".join(
        '<a href="marque-%s.html">%s — %s</a>' % (b["slug"], esc(b["name"]), esc(b.get("tagline") or ""))
        for b in brands)
    inject("marques.html", "GEN:brands-START", "GEN:brands-END",
           '<h2 style="font-size:1rem">Toutes nos marques</h2>\n' + brands_ns)

    # 2b) accueil : nombre de marques françaises = marques d'origine France
    #     + la carte « Pigeard sur mesure » de la grille (comptée par le filtre France)
    n_fr = sum(1 for b in brands if "france" in (b.get("origin") or "").lower()) + 1
    inject("index.html", "GEN:stat-france-START", "GEN:stat-france-END", str(n_fr))

    # 2c) accueil : puce « Nouveau » pour chaque marque dont « nouveaute » est rempli
    chips = "\n".join(
        '<a class="chip-nouveau" href="marque-%s.html"><span class="bn-tag"><i aria-hidden="true"></i>Nouveau</span>'
        '<span><b>%s</b> — %s</span><span class="arr" aria-hidden="true">→</span></a>'
        % (b["slug"], esc(b["name"]), esc(txt(b.get("nouveaute"))))
        for b in brands if txt(b.get("nouveaute")))
    inject("index.html", "GEN:nouveautes-START", "GEN:nouveautes-END", chips)

    # 3) fallback crawlable creations.html
    crea_ns = "\n".join(
        '<article><h3>%s</h3><p>%s</p></article>' % (esc(c.get("name")), esc(c.get("description") or c.get("tagline") or ""))
        for c in creations)
    inject("creations.html", "GEN:creations-START", "GEN:creations-END",
           '<h2 style="font-size:1rem">Nos créations sur mesure</h2>\n' + crea_ns)

    # 4) sitemap
    main_pages = [
        ("/", "1.0", "monthly"), ("/histoire.html", "0.8", "yearly"),
        ("/services.html", "0.9", "monthly"), ("/lentilles.html", "0.8", "monthly"),
        ("/verres-nikon.html", "0.8", "monthly"),
        ("/marques.html", "0.8", "monthly"),
        ("/creations.html", "0.8", "monthly"), ("/equipe.html", "0.6", "yearly"),
        ("/magasins.html", "0.9", "monthly"), ("/engagements.html", "0.7", "yearly"),
        ("/contact.html", "0.7", "yearly"), ("/mentions-legales.html", "0.3", "yearly"),
        ("/opticien-nogent-le-rotrou.html", "0.9", "monthly"),
        ("/opticien-brou.html", "0.9", "monthly"),
        ("/opticien-la-loupe.html", "0.9", "monthly"),
    ]
    urls = []
    for loc, pr, cf in main_pages:
        urls.append("  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>" % (BASE, loc, TODAY, cf, pr))
    for b in brands:
        urls.append("  <url>\n    <loc>%s/marque-%s.html</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>" % (BASE, b["slug"], TODAY))
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8", newline="")
    print("  ✓ sitemap.xml : %d URLs" % (len(main_pages) + n))

    print("OK.")

if __name__ == "__main__":
    main()
