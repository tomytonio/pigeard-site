/* ============================================================
   PIGEARD — Décor des fêtes (noel.js)
   Chargé par site.js (bloc « Décor des fêtes ») seulement quand
   la saison est ouverte — dates et textes dans assets/data/noel.json
   (Pages CMS) — ou en aperçu avec ?noel=1. Ajoute :
   - une guirlande lumineuse sous le menu (+ boules suspendues
     sur grand écran), qui s'efface au défilement ;
   - une neige fine et lente (canvas, sous le menu) ;
   - un sapin tracé à la main + message de saison en tête du
     pied de page ;
   - de quoi mettre neige et scintillements en pause (bouton
     rond sur grand écran, lien sous la carte et dans le menu
     mobile) ; choix mémorisé : localStorage « pg-noel-pause ».
   Sans JS : rien. En pré-rendu : la neige attend l'affichage.
   « Réduire les animations » (système) : décor fixe, sans neige.
   ============================================================ */
(function () {
  'use strict';
  var cfg = window.PIGEARD_NOEL || {};
  var root = document.documentElement;
  if (root.classList.contains('noel')) return; /* déjà installé */
  root.classList.add('noel');

  var reduit = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var pause = false;
  try { pause = localStorage.getItem('pg-noel-pause') === '1'; } catch (e) {}
  if (pause) root.classList.add('noel-pause');

  function f(n) { return Math.round(n * 10) / 10; }
  /* hasard « stable » : même tirage à chaque dessin pour un même index */
  function hasard(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

  /* ---------- Bonnet de Noël sur la lunette de l'écran de chargement ----------
     L'écran « Réglage de la netteté… » (loader.js) ne s'affiche qu'une fois par
     visite : s'il est encore à l'écran quand ce script arrive, un bonnet vient
     se poser sur le grand verre (chute courte, petit rebond, pompon qui se
     balance). Dessin dans les coordonnées de la lunette (viewBox prolongé de
     100 unités vers le haut). */
  var BONNET = '<svg class="pg-bonnet" viewBox="262.5 117.75 276 265.5" aria-hidden="true" focusable="false"><defs>' +
    '<path id="pgb-c" d="M-40-10C-39-44-26-74 4-88C20-95 42-90 54-76L47-66C41-52 38-30 40-10Z"/>' +
    '<path id="pgb-q" d="M30.5-87.6C39.5-86.4 48-82.6 54-76C64-65 71-50 72-33L65.5-34C64-48 58-60 47-66Z"/>' +
    '<path id="pgb-b" d="M-48 12C-30-7 30-7 48 12C55 8 54-5 46-8C28-25-28-25-46-8C-54-5-55 8-48 12Z"/>' +
    '<radialGradient id="pgb-v" gradientUnits="userSpaceOnUse" cx="-14" cy="-74" r="104"><stop offset="0" stop-color="#C23A33"/><stop offset=".5" stop-color="#A72E29"/><stop offset="1" stop-color="#8E1F1C"/></radialGradient>' +
    '<radialGradient id="pgb-s" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(-41 -40) rotate(16) scale(9 36)"><stop offset="0" stop-color="#F08A7E" stop-opacity=".42"/><stop offset="1" stop-color="#F08A7E" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="pgb-k" gradientUnits="userSpaceOnUse" x1="19" y1="-14" x2="32" y2="-10"><stop offset="0" stop-color="#5A1211" stop-opacity="0"/><stop offset=".75" stop-color="#5A1211" stop-opacity=".22"/><stop offset="1" stop-color="#5A1211" stop-opacity=".06"/></linearGradient>' +
    '<linearGradient id="pgb-t" gradientUnits="userSpaceOnUse" x1="50" y1="-78" x2="68" y2="-34"><stop offset="0" stop-color="#3A0B0A" stop-opacity="0"/><stop offset="1" stop-color="#3A0B0A" stop-opacity=".4"/></linearGradient>' +
    '<linearGradient id="pgb-f" x2="0" y2="1"><stop offset="0" stop-color="#F7F3EB"/><stop offset=".45" stop-color="#EFE9DF"/><stop offset="1" stop-color="#CDBFA4"/></linearGradient>' +
    '<linearGradient id="pgb-e"><stop offset="0" stop-color="#7A6A50" stop-opacity=".5"/><stop offset=".2" stop-color="#7A6A50" stop-opacity="0"/><stop offset=".8" stop-color="#7A6A50" stop-opacity="0"/><stop offset="1" stop-color="#7A6A50" stop-opacity=".5"/></linearGradient>' +
    '<radialGradient id="pgb-p" cx=".38" cy=".32" r=".72"><stop offset="0" stop-color="#FBF8F2"/><stop offset=".6" stop-color="#E7DDCB"/><stop offset="1" stop-color="#BFAF90"/></radialGradient>' +
    '<radialGradient id="pgb-o"><stop offset="0" stop-opacity=".55"/><stop offset="1" stop-opacity="0"/></radialGradient></defs>' +
    '<g transform="translate(405 241) rotate(6) scale(.95)">' +
    '<ellipse class="pg-bonnet-ombre" cy="9" rx="56" ry="12" fill="url(#pgb-o)"/>' +
    '<g class="pg-bonnet-pose">' +
    '<use href="#pgb-c" fill="url(#pgb-v)"/>' +
    '<use href="#pgb-c" fill="url(#pgb-s)"/>' +
    '<path d="M18-12C22-38 28-58 38-74C34-56 30-36 30-12Z" fill="url(#pgb-k)"/>' +
    '<g class="pg-bonnet-pointe"><use href="#pgb-q" fill="url(#pgb-v)"/><use href="#pgb-q" fill="url(#pgb-t)"/>' +
    '<path d="M65.5-34C64-48 58-60 47-66" fill="none" stroke="#5A1211" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/><circle cx="69.5" cy="-30" r="11" fill="url(#pgb-p)"/></g>' +
    '<use href="#pgb-b" fill="url(#pgb-f)"/>' +
    '<use href="#pgb-b" fill="url(#pgb-e)"/></g></g></svg>';
  function bonnet() {
    var logo = document.querySelector('.pg-loader:not(.pg-loader-out) .pg-loader-logo');
    if (logo && !logo.querySelector('.pg-bonnet')) logo.insertAdjacentHTML('beforeend', BONNET);
  }

  /* ---------- Guirlande ---------- */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<radialGradient id="noelOr" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#FBEFC9"/><stop offset=".42" stop-color="#D9B26A"/><stop offset="1" stop-color="#6E5124"/></radialGradient>' +
    '<radialGradient id="noelVert" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#C9D1A8"/><stop offset=".45" stop-color="#7E8C5A"/><stop offset="1" stop-color="#2B3120"/></radialGradient>' +
    '</defs></svg>';
  function boule(degrade) {
    return '<svg viewBox="0 0 30 36" aria-hidden="true" focusable="false">' +
      '<rect x="12" y="0" width="6" height="5" rx="1" fill="#B8904C"/>' +
      '<circle cx="15" cy="18" r="13" fill="url(#' + degrade + ')"/>' +
      '<path d="M2.6 19.4Q15 24.2 27.4 19.4" fill="none" stroke="rgba(255,244,214,.6)" stroke-width=".7"/>' +
      '<path d="M3.3 15.2Q15 19.6 26.7 15.2" fill="none" stroke="rgba(255,244,214,.28)" stroke-width=".5"/>' +
      '<ellipse cx="10" cy="11.8" rx="3.4" ry="1.8" transform="rotate(-38 10 11.8)" fill="rgba(255,255,255,.5)"/></svg>';
  }
  var ETOILE = '<svg viewBox="0 2 30 24" aria-hidden="true" focusable="false"><path d="M15 2.5L18.1 10.8 26.9 11.1 19.9 16.6 22.3 25.1 15 20.2 7.7 25.1 10.1 16.6 3.1 11.1 11.9 10.8Z" fill="url(#noelOr)" stroke="#F3DFAE" stroke-width=".6" stroke-linejoin="round"/></svg>';
  /* petit nœud doré à chaque point d'accroche */
  function noeud(x) {
    return '<g class="noeud" transform="translate(' + f(x) + ' 0)">' +
      '<path d="M0 0C-3.5-4.5-8.5-4.8-8-.2-7.6 3.6-3.6 2.6 0 0ZM0 0C3.5-4.5 8.5-4.8 8-.2 7.6 3.6 3.6 2.6 0 0Z"/>' +
      '<path d="M-.6.5-3.2 7.2M.6.5 3.2 7.2" fill="none"/><circle r="1.4"/></g>';
  }

  function guirlande() {
    var nav = document.querySelector('header.nav');
    if (!nav) return;
    var box = document.createElement('div');
    box.className = 'noel-guirlande';
    box.setAttribute('aria-hidden', 'true');
    nav.appendChild(box);
    var accueil = !!document.querySelector('.hero'); /* mise en page centrée : boule aussi à gauche */
    var largeur = 0;

    function dessiner() {
      var w = nav.clientWidth || window.innerWidth;
      if (!w || w === largeur) return;
      largeur = w;
      var etroit = w < 700;
      var n = Math.max(3, Math.round(w / (etroit ? 135 : 300)));
      var seg = w / n, prof = etroit ? 15 : 26, pas = etroit ? 21 : 29;
      var cable = '', noeuds = '', ampoules = '', k = 0, points = [];
      for (var i = 0; i < n; i++) {
        var x0 = i * seg, x1 = x0 + seg, cx = x0 + seg / 2;
        var p = prof * (0.88 + 0.24 * hasard(i)); /* creux du feston */
        cable += 'M' + f(x0) + ' 0Q' + f(cx) + ' ' + f(2 * p) + ' ' + f(x1) + ' 0';
        if (i > 0) { noeuds += noeud(x0); points.push(x0); }
        var m = Math.max(3, Math.round(seg / pas));
        for (var j = 1; j < m; j++, k++) {
          var t = j / m;
          var x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
          var y = 4 * p * t * (1 - t);
          ampoules += '<i class="noel-ampoule' + (k % 4 === 2 ? ' or' : '') + '" style="left:' + f(x) + 'px;top:' + f(y + 1) +
            'px;--d:' + (2.4 + Math.random() * 2.6).toFixed(2) + 's;--r:-' + (Math.random() * 5).toFixed(2) + 's"></i>';
        }
      }
      /* boules : nœuds de droite (le titre des pages intérieures est à gauche) */
      var decos = '', droite = points.filter(function (x) { return x > w * 0.55; });
      function deco(x, type, l, dur) {
        decos += '<div class="noel-deco' + (type === 'etoile' ? ' etoile' : '') + '" style="left:' + f(x) + 'px;--l:' + l + 'px;--dur:' + dur + 's;--del:-' + (Math.random() * 4).toFixed(2) + 's">' +
          '<span class="lien"></span>' + (type === 'etoile' ? ETOILE : boule(type === 'vert' ? 'noelVert' : 'noelOr')) + '</div>';
      }
      if (droite.length) deco(droite[droite.length - 1], 'or', 92, 6.4);
      if (droite.length > 1) deco(droite[droite.length - 2], 'etoile', 44, 5.2);
      if (accueil && points.length && points[0] < w * 0.45) deco(points[0], 'vert', 66, 7);

      box.innerHTML = DEFS +
        '<svg class="fil" width="' + Math.round(w) + '" height="' + Math.ceil(prof * 1.3 + 4) + '" aria-hidden="true" focusable="false">' +
        '<path class="cable" d="' + cable + '"/>' + noeuds + '</svg>' + ampoules + decos;
    }

    dessiner();
    var minuterie;
    window.addEventListener('resize', function () { clearTimeout(minuterie); minuterie = setTimeout(dessiner, 200); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('on'); }); });
  }

  /* ---------- Carte de vœux : sapin tracé + message ---------- */
  var SAPIN = '<svg class="noel-sapin" viewBox="0 0 120 130" aria-hidden="true" focusable="false">' +
    '<defs><radialGradient id="noelHalo"><stop offset="0" stop-color="rgba(243,223,174,.55)"/><stop offset="1" stop-color="rgba(243,223,174,0)"/></radialGradient></defs>' +
    '<circle class="halo" cx="60" cy="15" r="15" fill="url(#noelHalo)"/>' +
    '<path class="trace" pathLength="1" d="M60 26C56 36 50 46 42 55L50 54C45 64 38 73 30 82L40 81C34 92 26 102 17 112C40 116 80 116 103 112C94 102 86 92 80 81L90 82C82 73 75 64 70 54L78 55C70 46 64 36 60 26Z"/>' +
    '<path class="trace tronc" pathLength="1" d="M55 114.5V125H65V114.5"/>' +
    '<path class="trace feston f1" pathLength="1" d="M47 48Q60 56 72 46"/>' +
    '<path class="trace feston f2" pathLength="1" d="M37 74Q60 86 83 72"/>' +
    '<path class="trace feston f3" pathLength="1" d="M26 102Q60 116 95 99"/>' +
    '<path class="etoile" d="M60 7L61.9 12.3 67.6 12.5 63.1 16 64.7 21.5 60 18.3 55.3 21.5 56.9 16 52.4 12.5 58.1 12.3Z"/>';
  var LUMIERES = [[55.4, 51.3], [63.9, 50.6], [48.5, 78.4], [60, 79.5], [71.5, 77.4], [39.6, 106.4], [53.4, 108.2], [67.2, 107.6], [81, 104.6]];

  function carte() {
    var pied = document.querySelector('footer.site .wrap');
    if (!pied) return;
    var d = new Date();
    var texte = d.getMonth() === 0
      ? (cfg.messageVoeux || 'Belle et heureuse année {annee}')
      : (cfg.messageFetes || "Belles fêtes de fin d'année");
    texte = String(texte).replace(/\{annee\}/g, d.getFullYear());

    var lum = '';
    LUMIERES.forEach(function (pt, i) {
      lum += '<circle class="lum" cx="' + pt[0] + '" cy="' + pt[1] + '" r="1.7" style="--a:' + (2.9 + i * 0.14).toFixed(2) +
        's;--d:' + (2.2 + Math.random() * 2.2).toFixed(2) + 's"/>';
    });
    var el = document.createElement('div');
    el.className = 'noel-carte';
    el.innerHTML = SAPIN + lum + '</svg><p class="noel-message"></p>' + (cfg.signature ? '<p class="noel-signature"></p>' : '');
    el.querySelector('.noel-message').textContent = texte;
    if (cfg.signature) el.querySelector('.noel-signature').textContent = cfg.signature;
    pied.insertBefore(el, pied.firstChild);

    if (reduit || !('IntersectionObserver' in window)) { el.classList.add('vu'); return; }
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { el.classList.add('vu'); io.disconnect(); }
      });
    }, { threshold: 0.35 });
    io.observe(el);
  }

  /* ---------- Neige ---------- */
  function neige() {
    var c = document.createElement('canvas');
    var ctx = c.getContext && c.getContext('2d');
    if (!ctx) return null;
    c.className = 'noel-neige';
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);

    function sprite(rgb) {
      var s = document.createElement('canvas');
      s.width = s.height = 32;
      var g = s.getContext('2d');
      var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(' + rgb + ',1)');
      gr.addColorStop(0.3, 'rgba(' + rgb + ',.8)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
      return s;
    }
    var BLANC = sprite('255,250,240'), OR = sprite('240,206,140');
    var W = 0, H = 0, flocons = [], actif = false, raf = 0, avant = 0, defile = 0;

    function flocon(enHaut) {
      var r = 0.8 + Math.pow(Math.random(), 2.2) * 2.4; /* surtout de petits flocons, quelques gros au premier plan */
      return {
        x: Math.random() * W, y: enHaut ? -8 - Math.random() * 40 : Math.random() * H, r: r,
        v: 0.2 + r * 0.19 + Math.random() * 0.1,          /* vitesse de chute (px par image à 60 i/s) */
        a: 0.28 + (r / 3) * 0.5 + Math.random() * 0.1,     /* opacité */
        ph: Math.random() * 6.283, fr: 0.4 + Math.random() * 0.8, amp: 0.12 + Math.random() * 0.3,
        or: Math.random() < 0.07                            /* rares paillettes dorées qui scintillent */
      };
    }
    function taille() {
      var w = window.innerWidth, h = window.innerHeight;
      /* barre d'adresse mobile : ignorer les petites variations de hauteur */
      if (W && w === W && Math.abs(h - H) < 120) return;
      W = w; H = h;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(84, Math.max(30, W * H / 17000)));
      while (flocons.length < n) flocons.push(flocon(false));
      flocons.length = n;
    }
    function image(t) {
      raf = requestAnimationFrame(image);
      var dt = avant ? Math.min(3, (t - avant) / 16.67) : 1;
      avant = t;
      /* au défilement, la neige file légèrement (profondeur) */
      var sy = window.scrollY || window.pageYOffset || 0;
      var ds = Math.max(-60, Math.min(60, sy - defile));
      defile = sy;
      var vent = Math.sin(t * 0.00011) * 0.18;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flocons.length; i++) {
        var p = flocons[i];
        p.y += p.v * dt - ds * (p.r / 3) * 0.35;
        p.x += (Math.sin(t * 0.001 * p.fr + p.ph) * p.amp + vent * (p.r / 3 + 0.4)) * dt;
        if (p.y > H + 12) { flocons[i] = p = flocon(true); }
        else if (p.y < -60) { p.y = H + 8; }
        if (p.x < -12) p.x = W + 12; else if (p.x > W + 12) p.x = -12;
        var a = p.a;
        if (p.or) a *= 0.5 + 0.5 * Math.sin(t * 0.004 * p.fr + p.ph);
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        var s = p.r * 4;
        ctx.drawImage(p.or ? OR : BLANC, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    var minuterie;
    window.addEventListener('resize', function () { clearTimeout(minuterie); minuterie = setTimeout(taille, 150); });
    return {
      demarrer: function () {
        if (actif) return;
        actif = true; taille(); avant = 0;
        defile = window.scrollY || window.pageYOffset || 0;
        raf = requestAnimationFrame(image);
        c.classList.add('on');
      },
      arreter: function () {
        actif = false;
        cancelAnimationFrame(raf);
        c.classList.remove('on');
      }
    };
  }

  /* ---------- Commandes « pause » ----------
     Grand écran : bouton rond flottant en bas à gauche (dans la marge).
     Partout : lien discret sous la carte de vœux et dans le menu mobile
     (sur téléphone, un bouton flottant masquerait le texte). */
  var FLOCON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path class="flocon" d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.9 4.3 12 6.6l2.1-2.3M17.6 6.4l-.9 2.9 3 .6M19.7 14.1l-3 .6.9 2.9M14.1 19.7 12 17.4l-2.1 2.3M6.4 17.6l.9-2.9-3-.6M4.3 9.9l3-.6-.9-2.9"/>' +
    '<path class="barre" d="M4.5 19.5 19.5 4.5"/></svg>';

  function commandes(chute) {
    var quoi = chute ? 'la neige' : 'les scintillements';
    var rond = null, liens = [];
    function maj() {
      if (rond) {
        rond.setAttribute('aria-pressed', pause ? 'true' : 'false');
        rond.title = (pause ? 'Relancer ' : 'Arrêter ') + quoi;
      }
      liens.forEach(function (b) { b.lastChild.textContent = (pause ? 'Relancer ' : 'Arrêter ') + quoi; });
    }
    function basculer() {
      pause = !pause;
      root.classList.toggle('noel-pause', pause);
      try {
        if (pause) localStorage.setItem('pg-noel-pause', '1');
        else localStorage.removeItem('pg-noel-pause');
      } catch (e) {}
      if (chute) { if (pause) chute.arreter(); else chute.demarrer(); }
      maj();
    }
    function creer(classe, html, parent) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = classe;
      b.innerHTML = html;
      b.addEventListener('click', basculer);
      parent.appendChild(b);
      return b;
    }
    rond = creer('noel-btn', FLOCON, document.body);
    rond.setAttribute('aria-label', 'Mettre en pause ' + quoi);
    setTimeout(function () { rond.classList.add('on'); }, 1800);
    var carte = document.querySelector('.noel-carte');
    if (carte) liens.push(creer('noel-lien', FLOCON + '<span></span>', carte));
    var menu = document.querySelector('.mobile-menu');
    if (menu) liens.push(creer('noel-lien noel-lien--menu', FLOCON + '<span></span>', menu));
    maj();
  }

  /* ---------- Mise en place ---------- */
  function installer() {
    bonnet();
    guirlande();
    carte();
    if (reduit) return; /* décor fixe : ni neige ni commandes */
    var chute = cfg.neige === false ? null : neige();
    commandes(chute);
    if (!chute || pause) return;
    if (document.prerendering) document.addEventListener('prerenderingchange', function () { if (!pause) chute.demarrer(); }, { once: true });
    else chute.demarrer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installer);
  else installer();
})();
