/* ============================================================
   PIGEARD — Neige du décor des fêtes (noel-neige.js)
   Une seule simulation, deux façons de la faire tourner — c'est
   noel.js (fonction « neige ») qui choisit :
   - dans un fil d'exécution séparé (Worker + OffscreenCanvas) :
     calcul et dessin ne passent plus par le fil principal de la
     page, qui reste disponible pour le défilement et les
     animations. noel.js envoie la taille de l'écran, la position
     de défilement et les ordres marche / arrêt ;
   - dans la page (repli, navigateur sans OffscreenCanvas ou
     erreur du fil séparé) : noel.js charge ce même fichier comme
     un script ordinaire et appelle PIGEARD_NEIGE(canvas).
   Le rendu est le même dans les deux cas.
   Après modification : bumper VERSION dans le bloc « Décor des
   fêtes » de site.js (puis le ?v= de site.js dans les pages).
   ============================================================ */
(function (g) {
  'use strict';
  var DANS_UN_FIL = typeof document === 'undefined';

  var prochaine = g.requestAnimationFrame
    ? function (f) { return g.requestAnimationFrame(f); }
    : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  var annuler = g.cancelAnimationFrame
    ? function (id) { g.cancelAnimationFrame(id); }
    : function (id) { clearTimeout(id); };

  /* c : canevas (ou OffscreenCanvas) ; lireDefilement : position de défilement de la page ;
     surErreur : appelée si le dessin échoue (le fil séparé prévient alors la page) */
  function simulation(c, ctx, lireDefilement, surErreur) {
    function sprite(rgb) {
      var s;
      if (DANS_UN_FIL) s = new OffscreenCanvas(32, 32);
      else { s = document.createElement('canvas'); s.width = s.height = 32; }
      var d = s.getContext('2d');
      var gr = d.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(' + rgb + ',1)');
      gr.addColorStop(0.3, 'rgba(' + rgb + ',.8)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      d.fillStyle = gr;
      d.fillRect(0, 0, 32, 32);
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
    /* d : { W, H : taille de la fenêtre ; dpr : densité de pixels, plafonnée à 2 } */
    function taille(d) {
      /* barre d'adresse mobile : ignorer les petites variations de hauteur */
      if (W && d.W === W && Math.abs(d.H - H) < 120) return;
      W = d.W; H = d.H;
      c.width = Math.round(W * d.dpr); c.height = Math.round(H * d.dpr);
      ctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);
      var n = Math.round(Math.min(84, Math.max(30, W * H / 17000)));
      while (flocons.length < n) flocons.push(flocon(false));
      flocons.length = n;
    }
    function dessiner(t) {
      var dt = avant ? Math.min(3, (t - avant) / 16.67) : 1;
      avant = t;
      /* au défilement, la neige file légèrement (profondeur) */
      var sy = lireDefilement();
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
    function image(t) {
      if (!actif) return;
      raf = prochaine(image);
      try { dessiner(t); }
      catch (e) { actif = false; annuler(raf); if (surErreur) surErreur(); }
    }
    return {
      taille: taille,
      demarrer: function (d) {
        if (actif) return;
        actif = true; taille(d); avant = 0;
        defile = lireDefilement();
        raf = prochaine(image);
      },
      arreter: function () {
        actif = false;
        annuler(raf);
      }
    };
  }

  if (DANS_UN_FIL) {
    /* ---- fil séparé : ordres envoyés par noel.js ---- */
    var sim = null, y = 0;
    var erreur = function () { g.postMessage({ t: 'erreur' }); };
    g.onmessage = function (e) {
      var m = e.data || {};
      try {
        if (m.t === 'init') {
          var ctx = m.canvas.getContext('2d');
          if (!ctx) throw new Error('contexte 2d indisponible');
          sim = simulation(m.canvas, ctx, function () { return y; }, erreur);
          sim.taille(m.d);
          g.postMessage({ t: 'pret' });
        }
        else if (!sim) return;
        else if (m.t === 'defilement') y = m.y;
        else if (m.t === 'taille') sim.taille(m.d);
        else if (m.t === 'marche') { y = m.y; sim.demarrer(m.d); }
        else if (m.t === 'arret') sim.arreter();
      } catch (err) { erreur(); }
    };
  } else {
    /* ---- dans la page (repli) ---- */
    g.PIGEARD_NEIGE = function (canvas) {
      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return null;
      return simulation(canvas, ctx, function () { return window.scrollY || window.pageYOffset || 0; }, null);
    };
  }
})(self);
