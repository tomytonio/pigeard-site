#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_rgpd.py — inventaire technique RGPD / ePrivacy du site vitrine Pigeard.

Ce script ne juge pas : il relève des faits vérifiables dans le code
(ressources tierces chargées, liens sortants, appels réseau, stockage
navigateur, formulaires, mentions repérées dans les pages légales,
configuration nginx) et, en option, sonde le site en ligne. L'analyse
juridique est faite ensuite par la session Claude en suivant SKILL.md
et le dossier references/ du skill.

Usage (depuis la racine du dépôt) :
  python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py           # rapport Markdown
  python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py --json    # données brutes (JSON)
  python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py --prod    # + sondes HTTP sur le site en ligne
  python3 .claude/skills/rgpd-compliance/scripts/audit_rgpd.py --racine /chemin/du/depot

Bibliothèque standard uniquement (aucune dépendance à installer).
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

HOTES_PROPRES = {"", "pigeard-opticiens.fr", "www.pigeard-opticiens.fr"}
# Espaces de noms / licences cités dans le code (SVG, JSON-LD, en-têtes GSAP) : jamais appelés par le navigateur
HOTES_IGNORES = {"schema.org", "www.w3.org", "gsap.com"}
TYPES_SCRIPT_EXECUTES = ("", "text/javascript", "application/javascript", "module")
SITE_PROD = "https://www.pigeard-opticiens.fr"

# Signatures de traceurs / services tiers connus (nom → motif regex)
SIGNATURES = [
    ("Google Analytics / gtag / Tag Manager", r"gtag\(|google-analytics\.com|googletagmanager\.com|/gtag/js|ga\('create'|\bdataLayer\b"),
    ("Meta (Facebook) Pixel", r"fbq\(|connect\.facebook\.net"),
    ("Matomo / Piwik", r"\b_paq\b|matomo\.js|piwik\.js"),
    ("Hotjar", r"hotjar"),
    ("Microsoft Clarity", r"clarity\.ms"),
    ("Plausible", r"plausible\.io"),
    ("LinkedIn Insight", r"snap\.licdn\.com|_linkedin_partner_id"),
    ("TikTok Pixel", r"analytics\.tiktok\.com"),
    ("Google Fonts (polices externes)", r"fonts\.googleapis\.com|fonts\.gstatic\.com"),
    ("YouTube (intégration)", r"youtube\.com/embed|youtube-nocookie\.com"),
    ("Vimeo (intégration)", r"player\.vimeo\.com"),
    ("Google Maps (intégration)", r"google\.com/maps/embed|maps\.googleapis\.com"),
    ("reCAPTCHA", r"recaptcha"),
    ("hCaptcha", r"hcaptcha\.com"),
    ("Cloudflare Insights", r"cloudflareinsights\.com"),
    ("Sentry", r"sentry\.io|sentry-cdn"),
    ("HubSpot", r"hs-scripts\.com|hsforms"),
    ("Calendly", r"calendly\.com"),
]

MOTIFS_STOCKAGE = [
    ("localStorage", r"\blocalStorage\b"),
    ("sessionStorage", r"\bsessionStorage\b"),
    ("document.cookie", r"document\.cookie"),
    ("indexedDB", r"\bindexedDB\b"),
]
MOTIFS_RESEAU = [
    ("fetch()", r"\bfetch\s*\("),
    ("XMLHttpRequest", r"XMLHttpRequest"),
    ("navigator.sendBeacon", r"sendBeacon"),
    ("WebSocket", r"\bWebSocket\b"),
    ("EventSource", r"\bEventSource\b"),
    ("iframe créé par script", r"createElement\(\s*['\"]iframe|<iframe"),
]
RE_CLE_STOCKAGE = re.compile(r"(localStorage|sessionStorage)\.(setItem|getItem|removeItem)\(\s*['\"]([^'\"]+)['\"]")
RE_URL = re.compile(r"https?://[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+")
RE_FORM = re.compile(r"<form\b[^>]*>.*?</form>", re.S | re.I)
RE_CHAMP = re.compile(r"<(input|select|textarea)\b([^>]*)>", re.I)
RE_ATTR = re.compile(r"([\w:-]+)(?:\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'>]+)))?")
MOTS_INFORMATION = r"donn[ée]es personnelles|rgpd|confidentialit|droit d['’]acc[èe]s|mentions-legales|protection des donn[ée]es"

# Éléments recherchés (heuristique par mots-clés) dans les pages d'information légale.
# Les fondements sont détaillés dans references/sources-juridiques.md.
CHECKLIST_LEGALE = [
    ("Dénomination / raison sociale (LCEN art. 1-1 I 2°)", r"raison sociale|dénomination"),
    ("Forme juridique (SAS, SARL…)", r"\b(sas|sasu|sarl|eurl|sa|snc|sci)\b"),
    ("Adresse du siège social", r"siège"),
    ("Numéro de téléphone de l'éditeur", r"téléphone|\b0\d([ .]?\d{2}){4}\b"),
    ("Numéro d'inscription RCS / SIREN / SIRET", r"\brcs\b|siren|siret"),
    ("Capital social", r"capital social"),
    ("TVA intracommunautaire", r"\btva\b"),
    ("Directeur de la publication (LCEN art. 1-1 I 3°)", r"directeur.{0,20}publication"),
    ("Hébergeur : nom et adresse (LCEN art. 1-1 I 4°)", r"hébergeur"),
    ("Hébergeur : numéro de téléphone (LCEN art. 1-1 I 4°) — heuristique", "@tel_hebergeur"),
    ("Profession réglementée : diplôme / autorité (LCEN art. 19 si commerce électronique)", r"profession réglementée|opticien-lunetier|diplôme|agence régionale de santé"),
    ("Responsable du traitement identifié (RGPD art. 13-1-a)", r"responsable (du|de) traitement"),
    ("Finalités du traitement (RGPD art. 13-1-c)", r"finalit|uniquement pour|servent uniquement|seulement pour"),
    ("Base(s) juridique(s) (RGPD art. 13-1-c)", r"base(s)? (juridique|légale)|intérêt légitime|consentement|exécution (du|d'un) contrat|obligation légale"),
    ("Destinataires / sous-traitants (RGPD art. 13-1-e)", r"destinataire|sous-traitant|prestataire"),
    ("Durée de conservation (RGPD art. 13-2-a)", r"conserv"),
    ("Droit d'accès (RGPD art. 15)", r"droit d['’]accès|accéder aux données"),
    ("Droit de rectification (RGPD art. 16)", r"rectifi"),
    ("Droit à l'effacement (RGPD art. 17)", r"effac|suppr"),
    ("Droit à la limitation (RGPD art. 18)", r"limitation|limiter le traitement"),
    ("Droit à la portabilité (RGPD art. 20)", r"portabilit"),
    ("Droit d'opposition (RGPD art. 21)", r"opposition|vous y opposer|opposer au traitement"),
    ("Droit de réclamation auprès de la CNIL (RGPD art. 13-2-d)", r"cnil"),
    ("Délégué à la protection des données, si désigné (RGPD art. 13-1-b)", r"délégué à la protection|\bdpo\b"),
    ("Cookies / traceurs / stockage navigateur (LIL art. 82)", r"cookie|traceur|stockage local|localstorage|sessionstorage"),
    ("Mesure d'audience / statistiques de visite (exemption CNIL : information requise)", r"audience|statistique"),
    ("Médiation de la consommation : médiateur + site (C. conso L.616-1)", r"médiat"),
    ("Bloctel / opposition au démarchage téléphonique (C. conso L.223-2)", r"bloctel|démarchage téléphonique"),
    ("Date de dernière mise à jour", r"mise à jour"),
]

BALISES_RESSOURCES = {"script", "link", "img", "iframe", "video", "audio", "source", "track", "object", "embed", "frame"}
CHEMINS_PROD = [
    ("/", 200), ("/robots.txt", 200),
    ("/.git/HEAD", 404), ("/.git/config", 404), ("/.gitignore", 404), ("/.pages.yml", 404),
    ("/.claude/skills/rgpd-compliance/SKILL.md", 404), ("/CLAUDE.md", 404),
    ("/deploy/nginx-vitrine.conf", 404), ("/tools/build_static.py", 404),
]
EN_TETES_SECURITE = ["strict-transport-security", "content-security-policy", "x-frame-options",
                     "x-content-type-options", "referrer-policy", "permissions-policy"]


def hote(url):
    url = (url or "").strip()
    if url.startswith("//"):
        url = "https:" + url
    p = urlsplit(url)
    if p.scheme in ("http", "https"):
        return p.netloc.lower()
    return ""


def externe(url):
    h = hote(url)
    return h if h and h not in HOTES_PROPRES and h not in HOTES_IGNORES else None


def resume(liste, n=4):
    """Liste courte : au-delà de n éléments, n'affiche que les premiers."""
    l = sorted(liste)
    return ", ".join(l) if len(l) <= n else ", ".join(l[:n]) + f" … (+{len(l) - n} autres)"


def attrs(chaine):
    d = {}
    for m in RE_ATTR.finditer(chaine):
        d[m.group(1).lower()] = m.group(2) or m.group(3) or m.group(4) or ""
    return d


class Analyseur(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ressources = []      # (balise, attribut, url, complément)
        self.liens = []           # href des <a>
        self.scripts_inline = []
        self.styles_inline = []
        self.titre = ""
        self.texte = []
        self._dans = None

    def handle_starttag(self, tag, attributs):
        a = dict(attributs)
        if tag == "script":
            t = (a.get("type") or "").lower().strip()
            # JSON-LD, speculation rules, gabarits… : des données, pas du code exécuté
            self._dans = "script" if t in TYPES_SCRIPT_EXECUTES else "script-donnees"
            if a.get("src"):
                self.ressources.append((tag, "src", a["src"], t))
        elif tag == "style":
            self._dans = "style"
        elif tag == "title":
            self._dans = "title"
        elif tag == "a":
            if a.get("href"):
                self.liens.append(a["href"])
        elif tag == "link":
            if a.get("href"):
                self.ressources.append((tag, "href", a["href"], a.get("rel", "")))
        elif tag in BALISES_RESSOURCES:
            for attr in ("src", "data-src", "data", "poster"):
                if a.get(attr):
                    self.ressources.append((tag, attr, a[attr], a.get("rel", "")))
            if a.get("srcset"):
                for part in a["srcset"].split(","):
                    u = part.strip().split(" ")[0]
                    if u:
                        self.ressources.append((tag, "srcset", u, ""))
        elif tag == "form" and a.get("action"):
            self.ressources.append((tag, "action", a["action"], a.get("method", "")))
        if a.get("style") and "url(" in a["style"]:
            self.styles_inline.append(a["style"])

    def handle_endtag(self, tag):
        if tag in ("script", "style", "title"):
            self._dans = None

    def handle_data(self, data):
        if self._dans == "script":
            self.scripts_inline.append(data)
        elif self._dans == "script-donnees":
            pass
        elif self._dans == "style":
            self.styles_inline.append(data)
        elif self._dans == "title":
            self.titre += data
        else:
            self.texte.append(data)


def analyser_js(code, origine):
    r = {"origine": origine, "stockage": [], "cles_stockage": [], "reseau": [], "urls": defaultdict(list), "signatures": []}
    for nom, motif in MOTIFS_STOCKAGE:
        if re.search(motif, code):
            r["stockage"].append(nom)
    for m in RE_CLE_STOCKAGE.finditer(code):
        cle = (m.group(1), m.group(3))
        if cle not in r["cles_stockage"]:
            r["cles_stockage"].append(cle)
    for nom, motif in MOTIFS_RESEAU:
        if re.search(motif, code):
            r["reseau"].append(nom)
    for m in RE_URL.finditer(code):
        u = m.group(0).rstrip("'\").,;")
        h = externe(u)
        if h and u not in r["urls"][h]:
            r["urls"][h].append(u[:160])
    for nom, motif in SIGNATURES:
        if re.search(motif, code, re.I):
            r["signatures"].append(nom)
    r["urls"] = dict(r["urls"])
    return r


def vide_js(r):
    return not (r["stockage"] or r["reseau"] or r["urls"] or r["signatures"])


def analyser_formulaires(html, page):
    out = []
    for m in RE_FORM.finditer(html):
        bloc = m.group(0)
        fa = attrs(bloc[5:bloc.find(">")])
        champs = []
        for c in RE_CHAMP.finditer(bloc):
            balise = c.group(1).lower()
            ca = attrs(c.group(2))
            t = (ca.get("type") or balise if balise != "input" else (ca.get("type") or "text")).lower()
            if t in ("submit", "button", "reset", "image"):
                continue
            cache = t == "hidden" or "display:none" in ca.get("style", "").replace(" ", "") or ca.get("aria-hidden") == "true"
            champs.append({
                "nom": ca.get("name") or ca.get("id") or "?", "type": t,
                "obligatoire": "required" in ca, "precoche": "checked" in ca, "cache": cache,
            })
        voisinage = bloc + html[m.end(): m.end() + 1500]
        mots = re.findall(MOTS_INFORMATION, voisinage, re.I)
        out.append({
            "page": page, "id": fa.get("id", ""), "action": fa.get("action", ""),
            "hote_action": externe(fa.get("action", "")), "methode": fa.get("method", ""),
            "champs": champs,
            "cases_precochees": [c["nom"] for c in champs if c["precoche"] and not c["cache"]],
            "mention_information_detectee": bool(mots),
            "mots_information": sorted(set(x.lower() for x in mots)),
        })
    return out


def analyser_page(chemin, racine):
    html = chemin.read_text(encoding="utf-8", errors="replace")
    a = Analyseur()
    a.feed(html)
    rel = chemin.relative_to(racine).as_posix()
    ressources = []
    for balise, attr, url, extra in a.ressources:
        h = externe(url)
        if h:
            ressources.append({"balise": balise, "attribut": attr, "hote": h, "url": url[:160], "info": extra})
    liens = defaultdict(int)
    for u in a.liens:
        h = externe(u)
        if h:
            liens[h] += 1
    css_ext = []
    for m in RE_URL.finditer("\n".join(a.styles_inline)):
        if externe(m.group(0)):
            css_ext.append(m.group(0)[:160])
    js = analyser_js("\n".join(a.scripts_inline), "inline:" + rel)
    texte = re.sub(r"\s+", " ", " ".join(a.texte))
    m_maj = re.search(r"(derni[èe]re )?mise à jour\s*:?\s*([^.]{3,40})", texte, re.I)
    return {
        "page": rel, "titre": a.titre.strip(),
        "ressources_tierces": ressources, "liens_externes": dict(liens),
        "css_inline_urls_externes": css_ext,
        "js_inline": None if vide_js(js) else js,
        "formulaires": analyser_formulaires(html, rel),
        "lien_mentions_legales": "mentions-legales.html" in html,
        "redirection": bool(re.search(r'http-equiv="refresh"', html, re.I)),
        "mise_a_jour": m_maj.group(2).strip() if m_maj else "",
        "texte": texte,
    }


def est_page_legale(p):
    t = (p["titre"] + " " + p["page"]).lower()
    return any(k in t for k in ("mentions", "légal", "legal", "confidentialit", "données personnelles", "donnees-personnelles", "cookies", "rgpd", "vie-privee"))


def tel_hebergeur(texte):
    """Un numéro de téléphone figure-t-il juste après la dernière mention « hébergeur » ?"""
    i = texte.lower().rfind("hébergeur")
    if i < 0:
        return False
    fenetre = texte[i:i + 450]
    return bool(re.search(r"t[ée]l[ée]phone|\+\d{2,3}[ \d.]{6,}|\b0\d([ .]?\d{2}){4}\b", fenetre, re.I))


def checklist(p):
    out = []
    for label, motif in CHECKLIST_LEGALE:
        ok = tel_hebergeur(p["texte"]) if motif == "@tel_hebergeur" else bool(re.search(motif, p["texte"], re.I | re.S))
        out.append((label, ok))
    return out


def analyser_nginx(racine):
    conf = racine / "deploy" / "nginx-vitrine.conf"
    if not conf.exists():
        return {"present": False}
    c = conf.read_text(encoding="utf-8", errors="replace")
    en_tetes = sorted(set(m.group(1).lower() for m in re.finditer(r"add_header\s+([A-Za-z-]+)", c)))
    ext = re.search(r"location\s+~\*?\s+\\\.\(([^)]+)\)\$", c)
    return {
        "present": True,
        "regle_fichiers_caches": bool(re.search(r"location\s+~\*?\s+\S*/\\\.", c)),
        "extensions_bloquees": ext.group(1).split("|") if ext else [],
        "prefixes_bloques": re.findall(r"location\s+\^~\s+(\S+)\s*\{\s*return 404", c),
        "en_tetes": en_tetes,
        "en_tetes_securite_absents": [h for h in EN_TETES_SECURITE if h not in en_tetes],
    }


def sonder_prod(base):
    import urllib.error
    import urllib.request
    res = {"base": base, "sondes": [], "en_tetes": {}}
    for chemin, attendu in CHEMINS_PROD:
        req = urllib.request.Request(base + chemin, headers={"User-Agent": "audit-rgpd-pigeard/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                code, corps, h = r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            code, corps, h = e.code, (e.read() or b""), e.headers
        except Exception as e:  # réseau, TLS…
            res["sondes"].append({"chemin": chemin, "code": None, "attendu": attendu, "erreur": str(e)[:140]})
            continue
        res["sondes"].append({"chemin": chemin, "code": code, "attendu": attendu, "octets": len(corps)})
        if chemin == "/":
            for k in EN_TETES_SECURITE + ["set-cookie", "server"]:
                v = h.get(k)
                res["en_tetes"][k] = (v[:120] if v else None)
    return res


def infos_git(racine):
    try:
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=racine, capture_output=True, text=True, timeout=10).stdout.strip()
        date = subprocess.run(["git", "log", "-1", "--format=%cd", "--date=short"], cwd=racine, capture_output=True, text=True, timeout=10).stdout.strip()
        return sha, date
    except Exception:
        return "", ""


def collecter(racine, prod):
    pages = sorted(racine.glob("*.html")) + sorted(racine.glob("pages/**/*.html"))
    resultats = [analyser_page(p, racine) for p in pages]
    fichiers_js = []
    for f in sorted((racine / "assets" / "js").rglob("*.js")):
        r = analyser_js(f.read_text(encoding="utf-8", errors="replace"), f.relative_to(racine).as_posix())
        if not vide_js(r):
            fichiers_js.append(r)
    css_ext = []
    for f in sorted((racine / "assets" / "css").glob("*.css")):
        for m in RE_URL.finditer(f.read_text(encoding="utf-8", errors="replace")):
            if externe(m.group(0)):
                css_ext.append((f.relative_to(racine).as_posix(), m.group(0)[:160]))
    sha, date_commit = infos_git(racine)
    donnees = {
        "date": datetime.date.today().isoformat(), "commit": sha, "date_commit": date_commit,
        "racine": str(racine), "nb_pages": len(resultats),
        "pages": resultats, "fichiers_js": fichiers_js, "css_urls_externes": css_ext,
        "nginx": analyser_nginx(racine),
        "prod": sonder_prod(SITE_PROD) if prod else None,
    }
    return donnees


def oui(b):
    return "✅ oui" if b else "❌ non"


def rapport(d):
    L = []
    P = L.append
    P("# Inventaire RGPD / ePrivacy — site vitrine Pigeard")
    P(f"Généré le {d['date']} · commit `{d['commit'] or '?'}` du {d['date_commit'] or '?'} · {d['nb_pages']} pages HTML analysées")
    P("")
    P("> Inventaire factuel produit par `audit_rgpd.py`. Il ne conclut pas sur la conformité : l'analyse juridique et les recommandations suivent `SKILL.md` et `references/`. Les repérages par mots-clés sont des heuristiques à confirmer en lisant les pages.")
    P("")

    # 1. ressources tierces
    P("## 1. Ressources tierces chargées par les pages (transfert de l'adresse IP du visiteur)")
    agreg = defaultdict(lambda: {"balises": set(), "pages": set(), "exemple": ""})
    for p in d["pages"]:
        for r in p["ressources_tierces"]:
            e = agreg[r["hote"]]
            e["balises"].add(f"{r['balise']}[{r['attribut']}]")
            e["pages"].add(p["page"])
            e["exemple"] = e["exemple"] or r["url"]
        for u in p["css_inline_urls_externes"]:
            e = agreg[hote(u)]
            e["balises"].add("style[url()]")
            e["pages"].add(p["page"])
            e["exemple"] = e["exemple"] or u
    for f, u in d["css_urls_externes"]:
        e = agreg[hote(u)]
        e["balises"].add("css[url()]")
        e["pages"].add(f)
        e["exemple"] = e["exemple"] or u
    if not agreg:
        P("Aucune ressource externe chargée par le HTML/CSS : polices, scripts, images et vidéos sont auto-hébergés.")
    else:
        P("| Hôte tiers | Balises | Pages concernées | Exemple |")
        P("|---|---|---|---|")
        for h, e in sorted(agreg.items()):
            P(f"| `{h}` | {', '.join(sorted(e['balises']))} | {len(e['pages'])} | `{e['exemple']}` |")
    P("")

    # 2. liens sortants
    P("## 2. Liens sortants (le visiteur quitte le site ; le tiers applique sa propre politique)")
    liens = defaultdict(lambda: [0, set()])
    for p in d["pages"]:
        for h, n in p["liens_externes"].items():
            liens[h][0] += n
            liens[h][1].add(p["page"])
    principaux = {h: v for h, v in liens.items() if v[0] >= 2 or len(v[1]) >= 2}
    autres = sorted(h for h in liens if h not in principaux)
    P("| Hôte | Liens | Pages |")
    P("|---|---|---|")
    for h, (n, pages) in sorted(principaux.items(), key=lambda x: -x[1][0]):
        P(f"| `{h}` | {n} | {len(pages)} |")
    if autres:
        P("")
        P(f"Autres hôtes liés une seule fois ({len(autres)}, sites de marques pour l'essentiel) : " + ", ".join(f"`{h}`" for h in autres))
    P("")

    # 3. scripts
    P("## 3. Scripts : appels réseau, stockage navigateur, signatures connues")
    origines = list(d["fichiers_js"]) + [p["js_inline"] for p in d["pages"] if p["js_inline"]]
    cles = defaultdict(set)
    endpoints = defaultdict(lambda: defaultdict(set))
    signatures = defaultdict(set)
    apis = defaultdict(set)
    for o in origines:
        for api, cle in o["cles_stockage"]:
            cles[(api, cle)].add(o["origine"])
        for api in o["stockage"]:
            apis[api].add(o["origine"])
        for h, urls in o["urls"].items():
            for u in urls:
                endpoints[h][u].add(o["origine"])
        for s in o["signatures"]:
            signatures[s].add(o["origine"])
    P("### Stockage dans le navigateur (lecture/écriture dans le terminal — LIL art. 82)")
    if cles or apis:
        P("| API | Clé | Où |")
        P("|---|---|---|")
        for (api, cle), o in sorted(cles.items()):
            P(f"| {api} | `{cle}` | {resume(o)} |")
        for api, o in sorted(apis.items()):
            if not any(k[0] == api for k in cles):
                P(f"| {api} | (clé non littérale) | {resume(o)} |")
    else:
        P("Aucun accès à localStorage / sessionStorage / cookie / indexedDB détecté.")
    P("")
    P("### Appels réseau vers des hôtes tiers (URL littérales dans le code)")
    if endpoints:
        P("| Hôte | URL | Où |")
        P("|---|---|---|")
        for h, urls in sorted(endpoints.items()):
            for u, o in sorted(urls.items()):
                P(f"| `{h}` | `{u}` | {resume(o)} |")
    else:
        P("Aucune URL tierce dans les scripts.")
    P("")
    P("### Signatures de traceurs / services connus")
    if signatures:
        for s, o in sorted(signatures.items()):
            P(f"- **{s}** — {resume(o)}")
    else:
        P("Aucune signature de traceur connu (Google Analytics, Meta Pixel, Matomo, Hotjar, Google Fonts, YouTube, Maps intégrée…).")
    P("")
    P("### Détail par fichier / page (regroupé par profil identique)")
    groupes = defaultdict(list)
    for o in origines:
        groupes[(tuple(o["stockage"]), tuple(o["reseau"]), tuple(sorted(o["urls"])))].append(o["origine"])
    for (st, rs, hs), origs in sorted(groupes.items(), key=lambda x: -len(x[1])):
        P(f"- {len(origs)} fichier(s)/page(s) — stockage {', '.join(st) or '—'} ; réseau {', '.join(rs) or '—'} ; hôtes {', '.join(hs) or '—'} : {resume(origs)}")
    P("")

    # 4. formulaires
    P("## 4. Formulaires (collecte directe de données — RGPD art. 5-1-c, 13 ; C. conso L.223-2 si téléphone)")
    forms = [f for p in d["pages"] for f in p["formulaires"]]
    if not forms:
        P("Aucun formulaire.")
    for f in forms:
        P(f"### `{f['page']}` — formulaire `{f['id'] or '(sans id)'}`")
        P(f"- Destination : {('`' + f['action'] + '`') if f['action'] else 'aucun attribut action (envoi par script : voir les appels réseau de la page)'}")
        champs = [f"`{c['nom']}` ({c['type']}{', obligatoire' if c['obligatoire'] else ''}{', caché' if c['cache'] else ''})" for c in f["champs"]]
        P(f"- Champs : {', '.join(champs) or '—'}")
        tel = [c["nom"] for c in f["champs"] if c["type"] == "tel" or "tel" in c["nom"].lower()]
        P(f"- Numéro de téléphone collecté : {oui(bool(tel))}{(' (' + ', '.join(tel) + ')') if tel else ''}")
        P(f"- Cases pré-cochées visibles : {', '.join(f['cases_precochees']) or 'aucune'}")
        P(f"- Mention d'information repérée dans/près du formulaire : {oui(f['mention_information_detectee'])}{(' — mots : ' + ', '.join(f['mots_information'])) if f['mots_information'] else ''}")
        P("")

    # 5. pages légales
    P("## 5. Pages d'information légale (repérage par mots-clés)")
    legales = [p for p in d["pages"] if est_page_legale(p)]
    if not legales:
        P("Aucune page dont le titre ou le nom évoque les mentions légales / la confidentialité.")
    for p in legales:
        P(f"### `{p['page']}` — « {p['titre']} »")
        P(f"Mise à jour indiquée : {p['mise_a_jour'] or 'non repérée'}")
        P("")
        P("| Élément | Repéré |")
        P("|---|---|")
        for label, ok in checklist(p):
            P(f"| {label} | {oui(ok)} |")
        P("")

    # 6. maillage
    P("## 6. Accès aux mentions légales depuis chaque page")
    sans = [p["page"] for p in d["pages"] if not p["lien_mentions_legales"] and not p["redirection"]]
    stubs = [p["page"] for p in d["pages"] if p["redirection"]]
    if sans:
        P(f"Pages sans lien vers `mentions-legales.html` : {', '.join('`' + s + '`' for s in sans)}")
    else:
        P("Toutes les pages analysées contiennent un lien vers `mentions-legales.html`.")
    if stubs:
        P(f"(Pages de redirection ignorées : {', '.join('`' + s + '`' for s in stubs)})")
    P("")

    # 7. nginx
    n = d["nginx"]
    P("## 7. Configuration nginx (`deploy/nginx-vitrine.conf`)")
    if not n.get("present"):
        P("Fichier absent.")
    else:
        P(f"- Règle bloquant les fichiers/dossiers cachés (`/.git/`, `/.claude/`, `/.gitignore`…) : {oui(n['regle_fichiers_caches'])}")
        P(f"- Extensions de travail non servies : {', '.join(n['extensions_bloquees']) or 'aucune'}")
        P(f"- Préfixes non servis : {', '.join('`' + x + '`' for x in n['prefixes_bloques']) or 'aucun'}")
        P(f"- En-têtes `add_header` déclarés : {', '.join(n['en_tetes']) or 'aucun'}")
        P(f"- En-têtes de sécurité absents de cette conf : {', '.join(n['en_tetes_securite_absents']) or 'aucun'} (HSTS/CSP peuvent être posés par le proxy TLS en amont : vérifier avec `--prod`)")
    P("")

    # 8. prod
    if d["prod"]:
        pr = d["prod"]
        P(f"## 8. Sondes sur le site en ligne ({pr['base']})")
        P("| Chemin | Code | Attendu | Constat |")
        P("|---|---|---|---|")
        for s in pr["sondes"]:
            if s["code"] is None:
                P(f"| `{s['chemin']}` | erreur | {s['attendu']} | {s['erreur']} |")
            else:
                verdict = "conforme" if s["code"] == s["attendu"] else ("⚠️ fichier de travail accessible" if s["code"] == 200 else "inattendu")
                P(f"| `{s['chemin']}` | {s['code']} | {s['attendu']} | {verdict} |")
        P("")
        P("| En-tête sur `/` | Valeur |")
        P("|---|---|")
        for k, v in pr["en_tetes"].items():
            P(f"| `{k}` | {('`' + v + '`') if v else '— absent'} |")
        P("")

    # 9. hors code
    P("## 9. Points hors code — à vérifier avec le propriétaire (le script ne peut pas les voir)")
    P("- Ce que les workflows n8n stockent réellement (contenu des messages, adresse IP, identifiant de session, referrer), où, et pendant combien de temps.")
    P("- Boîtes mail destinataires du formulaire (fournisseur, localisation, durée de conservation).")
    P("- Contrats / clauses de sous-traitance (RGPD art. 28) : Hostinger (VPS + n8n), messagerie, Zerosix (prise de RDV), source des avis Google.")
    P("- Registre des activités de traitement (RGPD art. 30) : une entreprise traitant des données de santé (dossiers optiques) ne bénéficie pas de la dérogation « moins de 250 salariés ».")
    P("- Droit à l'image (C. civ. art. 9) : consentements écrits des salariés et des personnes (dont enfants) visibles sur les photos du site.")
    P("- Désignation éventuelle d'un délégué à la protection des données (RGPD art. 37).")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description="Inventaire RGPD / ePrivacy du site vitrine Pigeard (stdlib uniquement).")
    ap.add_argument("--racine", help="racine du dépôt (défaut : déduite de l'emplacement du script)")
    ap.add_argument("--json", action="store_true", help="sortie JSON brute au lieu du rapport Markdown")
    ap.add_argument("--prod", action="store_true", help=f"sonder aussi le site en ligne ({SITE_PROD})")
    args = ap.parse_args()
    racine = Path(args.racine).resolve() if args.racine else Path(__file__).resolve().parents[4]
    if not (racine / "index.html").exists():
        sys.exit(f"Racine du site introuvable : {racine} (pas d'index.html). Utiliser --racine.")
    d = collecter(racine, args.prod)
    if args.json:
        for p in d["pages"]:
            p.pop("texte", None)
        print(json.dumps(d, ensure_ascii=False, indent=2, default=list))
    else:
        print(rapport(d))


if __name__ == "__main__":
    main()
