/* ============================================================
   PIGEARD — Popup d'opération commerciale (operation.js)
   Chargé par site.js (bloc « Popup d'opération ») seulement
   entre les dates de assets/data/operation.json, après
   operation.css. Première opération : « Journées Privilège »
   (15 novembre → 29 décembre 2026).
   - Ordinateur / tablette (≥ 700 px) : fenêtre centrée sur un
     voile, focus gardé dans la fenêtre, Échap / × / clic à côté
     pour fermer, défilement de la page suspendu.
   - Téléphone : carte compacte en bas d'écran, sans voile, la page
     reste utilisable (recommandation Google contre les fenêtres
     intrusives sur mobile).
   Une fois par visite (sessionStorage « pg-operation-vu »), aperçu
   (?operation=1) compris : les pages suivantes ne la rejouent pas.
   Jamais en pré-rendu ni pendant l'écran de chargement. Sans JS :
   rien.
   ============================================================ */
(function () {
  'use strict';
  var c = window.PIGEARD_OPERATION;
  if (!c || document.querySelector('.op-fond')) return;
  var CLE = 'pg-operation-vu';
  var DELAI = 1800; /* ms laissées au visiteur pour découvrir la page */

  function texte(v, defaut) { return (typeof v === 'string' && v.trim()) ? v.trim() : defaut; }
  /* Relu au moment d'afficher. Une page pré-rendue (speculation rules) a pu
     être préparée avant que la fenêtre soit vue sur la page précédente, avec
     une mémoire d'onglet antérieure : la page qui affiche la fenêtre prévient
     les autres pages du site déjà ouvertes ou préparées par un BroadcastChannel
     (moyen recommandé par Chrome pour transmettre un changement d'état aux
     pages pré-rendues, developer.chrome.com/docs/web-platform/prerender-pages). */
  var vuAilleurs = false, canal = null;
  try {
    canal = new BroadcastChannel('pg-operation');
    canal.onmessage = function (e) { if (e.data === 'vu') vuAilleurs = true; };
  } catch (e) {}
  function dejaVu() {
    if (vuAilleurs) return true;
    try { return !!sessionStorage.getItem(CLE); } catch (e) { return false; }
  }
  /* lien saisi dans l'éditeur : page du site ou adresse https, rien d'autre */
  function lienSur(v) {
    v = texte(v, '');
    return (/^https:\/\//i.test(v) || /^[a-z0-9][a-z0-9\-\/]*\.html(#[\w-]+)?$/i.test(v)) ? v : 'magasins.html';
  }

  var ETOILE = '<svg viewBox="-500 -500 1000 1000" aria-hidden="true" focusable="false"><polygon fill="#000" points="487,-6 386,76 457,178 346,199 374,319 247,307 224,444 118,377 42,497 -39,396 -148,462 -186,350 -284,396 -294,275 -414,269 -372,140 -478,88 -395,12 -482,-96 -375,-140 -417,-256 -291,-276 -304,-389 -179,-361 -126,-473 -23,-394 43,-494 100,-386 206,-450 247,-315 370,-320 343,-206 460,-175 399,-65"/></svg>';

  function construire() {
    var fond = document.createElement('div');
    fond.className = 'op-fond';
    fond.innerHTML =
      '<div class="op-carte" role="dialog" aria-labelledby="opTitre" aria-describedby="opAccroche" tabindex="-1">' +
        '<button type="button" class="op-fermer" aria-label="Fermer">&times;</button>' +
        '<div class="op-visuel">' +
          '<img class="op-photo" src="assets/photos/journees-privilege.webp" alt="" width="920" height="760" decoding="async">' +
          '<h2 class="op-pile" id="opTitre"><span class="op-b op-b1"></span> <span class="op-b op-b2"></span> <span class="op-b op-b3"></span></h2>' +
        '</div>' +
        '<p class="op-etoile">' + ETOILE + '<span></span></p>' +
        '<div class="op-corps">' +
          '<p class="op-accroche" id="opAccroche"></p>' +
          '<p class="op-texte"></p>' +
          '<a class="op-bouton"></a>' +
          '<p class="op-mentions"></p>' +
        '</div>' +
      '</div>';
    /* textes de l'éditeur posés en texte brut (jamais interprétés comme du HTML) */
    var champs = {
      '.op-b1': texte(c.ligne1, 'Les journées'),
      '.op-b2': texte(c.ligne2, 'Privilège'),
      '.op-b3': texte(c.dates, ''),
      '.op-etoile span': texte(c.remise, ''),
      '.op-accroche': texte(c.remiseTexte, ''),
      '.op-texte': texte(c.texte, ''),
      '.op-bouton': texte(c.bouton, 'Trouver mon magasin'),
      '.op-mentions': texte(c.mentions, '')
    };
    Object.keys(champs).forEach(function (sel) {
      var el = fond.querySelector(sel);
      if (champs[sel]) { el.textContent = champs[sel]; return; }
      /* champ vidé dans l'éditeur : l'élément disparaît (l'étoile entière pour la remise) */
      var cible = sel === '.op-etoile span' ? el.parentNode : el;
      cible.parentNode.removeChild(cible);
    });
    if (!fond.querySelector('#opAccroche')) fond.querySelector('.op-carte').removeAttribute('aria-describedby');
    fond.querySelector('.op-bouton').href = lienSur(c.lien);
    return fond;
  }

  var fond, carte, mq = window.matchMedia('(min-width: 700px)');
  var modal = false, focusAvant = null, scrollBloque = false;

  function bloquerScroll(oui) {
    if (oui === scrollBloque) return;
    scrollBloque = oui;
    var lenis = window.PIGEARD && window.PIGEARD.lenis;
    document.documentElement.style.overflow = oui ? 'hidden' : '';
    if (lenis) { try { oui ? lenis.stop() : lenis.start(); } catch (e) {} }
  }
  function appliquerMode() {
    modal = mq.matches;
    carte.setAttribute('aria-modal', modal ? 'true' : 'false');
    bloquerScroll(modal);
  }
  function focusables() {
    return Array.prototype.filter.call(carte.querySelectorAll('button, a[href]'), function (el) {
      return el.offsetParent !== null;
    });
  }
  function surTouche(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { fermer(); return; }
    if (e.key !== 'Tab' || !modal) return;
    var f = focusables();
    if (!f.length) return;
    var premier = f[0], dernier = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === premier || document.activeElement === carte)) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    else if (!carte.contains(document.activeElement)) { e.preventDefault(); premier.focus(); }
  }

  function fermer() {
    if (!fond || fond.classList.contains('op-sortie')) return;
    document.removeEventListener('keydown', surTouche);
    if (mq.removeEventListener) mq.removeEventListener('change', appliquerMode);
    bloquerScroll(false);
    fond.classList.add('op-sortie');
    var f = fond;
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 320);
    if (modal && focusAvant && focusAvant.focus && document.contains(focusAvant)) {
      try { focusAvant.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function ouvrir() {
    if (dejaVu()) return;
    try { sessionStorage.setItem(CLE, '1'); } catch (e) {}
    try { if (canal) canal.postMessage('vu'); } catch (e) {}
    fond = construire();
    carte = fond.querySelector('.op-carte');
    fond.querySelector('.op-fermer').addEventListener('click', fermer);
    fond.querySelector('.op-bouton').addEventListener('click', function () { bloquerScroll(false); });
    fond.addEventListener('click', function (e) { if (e.target === fond && modal) fermer(); });
    document.addEventListener('keydown', surTouche);
    if (mq.addEventListener) mq.addEventListener('change', appliquerMode);
    focusAvant = document.activeElement;
    document.body.appendChild(fond);
    appliquerMode();
    /* deux images : l'état initial (masqué) est peint avant de lancer l'animation */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fond.classList.add('op-on');
        if (modal) { try { carte.focus({ preventScroll: true }); } catch (e) {} }
      });
    });
  }

  /* polices et photo prêtes avant l'entrée en scène (pas de saut de texte) */
  function preparer() {
    var attentes = [];
    if (document.fonts && document.fonts.load) {
      ['500 20px Poppins', '700 44px Poppins', '800 50px Poppins'].forEach(function (f) {
        attentes.push(document.fonts.load(f).catch(function () {}));
      });
    }
    if (mq.matches) {
      var img = new Image();
      img.src = 'assets/photos/journees-privilege.webp';
      attentes.push(img.decode ? img.decode().catch(function () {}) : Promise.resolve());
    }
    var limite = new Promise(function (r) { setTimeout(r, 2500); });
    return Promise.race([Promise.all(attentes), limite]);
  }

  /* moment opportun : page affichée (pas en pré-rendu), onglet visible,
     écran de chargement terminé, menu mobile et visionneuse fermés */
  function quandPret(fn) {
    var root = document.documentElement;
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', function () { quandPret(fn); }, { once: true });
    } else if (root.classList.contains('pg-loading')) {
      var mo = new MutationObserver(function () {
        if (!root.classList.contains('pg-loading')) { mo.disconnect(); quandPret(fn); }
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else if (document.visibilityState === 'hidden') {
      document.addEventListener('visibilitychange', function attendre() {
        if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', attendre); quandPret(fn); }
      });
    } else if (document.querySelector('.mobile-menu.open, .lb.open')) {
      setTimeout(function () { quandPret(fn); }, 1500);
    } else {
      fn();
    }
  }

  quandPret(function () {
    setTimeout(function () {
      quandPret(function () { preparer().then(function () { quandPret(ouvrir); }); });
    }, DELAI);
  });
})();
