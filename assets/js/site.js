/* ============================================================
   PIGEARD — moteur partagé (site.js)
   À charger APRÈS gsap, ScrollTrigger et lenis (CDN), puis le
   script inline propre à la page. Expose window.PIGEARD.
   ============================================================ */
(function(){
  /* Animations ACTIVES par défaut (le site se veut très animé) — plus besoin de ?motion=force.
     Pour réduire les animations (accessibilité), ouvrir la page avec ?reduce=1. */
  /* Animations TOUJOURS actives — l'option « réduire les animations » a été retirée à la
     demande du client : le site n'écoute plus le réglage système prefers-reduced-motion. */
  var reduce = false;
  document.documentElement.classList.add('force-motion');

  /* --- Nav : état scrollé + barre de progression --- */
  var nav = document.getElementById('nav');
  var prog = document.getElementById('progress');
  /* hauteur défilable mise en cache (relue seulement quand la page change de taille) :
     la lire à chaque image forçait un recalcul de mise en page pendant le défilement */
  var maxScroll = -1;
  function mesurer(){ maxScroll = document.body.scrollHeight - innerHeight; }
  if(window.ResizeObserver) new ResizeObserver(function(){ maxScroll = -1; }).observe(document.body);
  window.addEventListener('resize', function(){ maxScroll = -1; });
  var navScrolled = null;
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if(nav && navScrolled !== (y > 40)){ navScrolled = y > 40; nav.classList.toggle('scrolled', navScrolled); }
    if(prog){
      if(maxScroll < 0 || y > maxScroll || !window.ResizeObserver) mesurer();
      prog.style.width = (maxScroll>0 ? (y/maxScroll*100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();


  /* --- Menu mobile --- */
  var burger = document.querySelector('.burger');
  var mobile = document.querySelector('.mobile-menu');
  if(burger && mobile){
    burger.addEventListener('click', function(){ mobile.classList.add('open'); });
    mobile.addEventListener('click', function(e){ if(e.target.matches('a, .close, .mobile-menu')) mobile.classList.remove('open'); });
  }

  /* --- Lueur souris sur les cartes services --- */
  document.querySelectorAll('.svc-card').forEach(function(c){
    c.addEventListener('mousemove', function(e){ var r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px'); });
  });

  var PIG = window.PIGEARD = { reduce: reduce, force: !reduce, gsap: window.gsap || null, lenis: null };

  /* --- Boucles infinies (halos, bandeaux défilants) : mises en pause tant que leur
     section est hors de l'écran, reprises à l'identique dès qu'elle revient (marge de
     300 px). Rien ne change à l'œil ; le navigateur cesse juste de les recalculer
     à chaque image pendant qu'on lit le reste de la page. --- */
  var veille = null;
  PIG.boucle = function(tween, zone){
    if(!tween || !zone || !window.IntersectionObserver) return tween;
    if(!veille) veille = new IntersectionObserver(function(entrees){
      entrees.forEach(function(e){
        (e.target.__pgBoucles || []).forEach(function(t){ if(e.isIntersecting) t.resume(); else t.pause(); });
      });
    }, {rootMargin:'300px 0px'});
    (zone.__pgBoucles = zone.__pgBoucles || []).push(tween);
    veille.observe(zone);
    return tween;
  };

  /* --- Recalcul des positions ScrollTrigger regroupé : plusieurs demandes rapprochées
     (textes, avis, images…) = un seul recalcul, au lieu d'un à-coup à chaque fois --- */
  var refreshPrevu = null;
  PIG.refresh = function(){
    if(!window.ScrollTrigger) return;
    clearTimeout(refreshPrevu);
    refreshPrevu = setTimeout(function(){ try{ ScrollTrigger.refresh(); }catch(e){} }, 120);
  };


  /* --- Inclinaison 3D au survol : la carte suit la souris (souris précise uniquement) --- */
  PIG.tilt = function(el, opts){
    if(!(window.matchMedia && window.matchMedia('(pointer:fine)').matches)) return;
    opts = opts || {}; var amp = opts.amp || 9, sc = opts.scale || 1.04;
    el.addEventListener('mouseenter', function(){ window.__tiltHover = el; el.style.transition = 'transform .18s ease-out, box-shadow .4s'; });
    el.addEventListener('mousemove', function(e){
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(700px) rotateX(' + (-y * amp) + 'deg) rotateY(' + (x * amp * 1.2) + 'deg) translateY(-8px) scale(' + sc + ')';
    });
    el.addEventListener('mouseleave', function(){
      window.__tiltHover = null;
      el.style.transform = '';
      if(opts.retomber) opts.retomber(el);
    });
  };

  if(!reduce && window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    var lenis = null;
    if(window.Lenis){
      lenis = new Lenis({ lerp:.085, wheelMultiplier:1, autoRaf:false });
      window.__lenis = lenis; PIG.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis.raf(t*1000); });
      gsap.ticker.lagSmoothing(0);
    }
    /* Ancres internes en scroll doux */
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href');
        if(id && id.length>1 && document.querySelector(id)){
          e.preventDefault();
          if(lenis) lenis.scrollTo(id, {offset:-10, duration:1.2});
          else document.querySelector(id).scrollIntoView({behavior:'smooth'});
        }
      });
    });
    /* Reveals génériques */
    gsap.utils.toArray('.reveal').forEach(function(el){
      gsap.to(el, {autoAlpha:1, y:0, duration:1.05, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 87%'}});
    });
    /* Compteurs */
    gsap.utils.toArray('.stat .n[data-count]').forEach(function(el){
      var end=+el.dataset.count, suf=el.dataset.suffix||'', pre=el.dataset.prefix||'';
      ScrollTrigger.create({trigger:el, start:'top 88%', once:true, onEnter:function(){
        gsap.to({v:0},{v:end, duration:1.9, ease:'power2.out', onUpdate:function(){ el.textContent = pre + Math.round(this.targets()[0].v) + suf; }});
      }});
    });
    /* Nuances de couleur en fond : dérive douce et continue (vivant, subtil) */
    gsap.utils.toArray('.blob').forEach(function(b,i){
      PIG.boucle(gsap.to(b,{ x:(i%2?'+=40':'-=40'), y:(i%2?'-=30':'+=30'), scale:1.14, duration:9+i*2, ease:'sine.inOut', yoyo:true, repeat:-1, delay:i*0.5 }),
        b.closest('section, header, footer') || b.parentNode);
    });
    /* Notes manuscrites : "écriture qui se trace" (révélation gauche→droite à l'arrivée) */
    gsap.utils.toArray('.foot-brand .hand, .kicker').forEach(function(el){
      gsap.fromTo(el,
        { clipPath:'inset(0 100% -12% 0)', webkitClipPath:'inset(0 100% -12% 0)' },
        { clipPath:'inset(0 0% -12% 0)', webkitClipPath:'inset(0 0% -12% 0)', duration:1.25, ease:'power1.inOut',
          scrollTrigger:{ trigger:el, start:'top 90%', once:true } });
    });
    /* Soulignés de titres qui se dessinent (largeur pilotée via la variable CSS --uw) */
    gsap.utils.toArray('.sec-head h2').forEach(function(el){
      gsap.fromTo(el, { '--uw':'0%' }, { '--uw':'58%', duration:1.1, ease:'power2.out',
        scrollTrigger:{ trigger:el, start:'top 84%', once:true } });
    });
    /* Boutons magnétiques : suivent légèrement la souris (souris précise uniquement, jamais au toucher) */
    if(window.matchMedia && window.matchMedia('(pointer:fine)').matches){
      document.querySelectorAll('.btn, .nav-cta').forEach(function(b){
        b.addEventListener('mousemove', function(e){
          var r=b.getBoundingClientRect();
          gsap.to(b,{ x:(e.clientX-(r.left+r.width/2))*0.32, y:(e.clientY-(r.top+r.height/2))*0.42, duration:0.4, ease:'power3.out' });
        });
        b.addEventListener('mouseleave', function(){ gsap.to(b,{ x:0, y:0, duration:0.55, ease:'elastic.out(1,0.45)' }); });
      });
    }
    PIG.ScrollTrigger = ScrollTrigger;
  } else {
    document.querySelectorAll('.reveal').forEach(function(e){ e.style.opacity=1; e.style.transform='none'; });
    document.querySelectorAll('.stat .n[data-count]').forEach(function(e){ e.textContent=(e.dataset.prefix||'')+e.dataset.count+(e.dataset.suffix||''); });
  }

  /* --- FILET DE SÉCURITÉ : le contenu above-the-fold reste visible --- */
  setTimeout(function(){
    document.querySelectorAll('#heroLogo, .hero-logo, .hero h1, .page-hero h1, .hero-lead, .page-hero .lede, .hero-note, .kicker, .hero .span-years').forEach(function(el){
      if(parseFloat(getComputedStyle(el).opacity) < 0.05){ el.style.opacity='1'; el.style.visibility='visible'; el.style.transform='none'; }
    });
  }, 2200);
})();

/* ============================================================
   ÉDITION DE CONTENU — surcharge les textes/photos depuis
   assets/data/*.json (modifiables via l'éditeur Pages CMS).
   Si le fichier ou la clé n'existe pas, le texte d'origine reste
   (donc aucun risque, et bon pour le référencement).
   ============================================================ */
(function(){
  function get(o,p){ return p.split('.').reduce(function(a,k){ return (a!=null && a[k]!=null) ? a[k] : undefined; }, o); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  /* n'écrit que ce qui diffère de la page (le plus souvent rien) : renvoie true si la
     mise en page a pu changer, pour ne recalculer les animations qu'à ce moment-là */
  function apply(data){
    var change = false;
    document.querySelectorAll('[data-bind]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind')); if(v==null || v==='') return;
      if(el.hasAttribute('data-bind-multiline')){
        var h = esc(v).replace(/\n/g,'<br>');
        if(el.innerHTML !== h){ el.innerHTML = h; change = true; }
      }
      else if(el.textContent !== String(v)){ el.textContent = v; change = true; }
    });
    document.querySelectorAll('[data-bind-href]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind-href')); if(v!=null && v!=='' && el.getAttribute('href') !== String(v)) el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-bind-src]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind-src')); if(v!=null && v!=='' && el.getAttribute('src') !== String(v)){ el.setAttribute('src', v); change = true; }
    });
    return change;
  }
  if(!document.querySelector('[data-bind],[data-bind-href],[data-bind-src]')) return;
  var files = { textes:'assets/data/textes.json' };
  var data = {};
  Promise.all(Object.keys(files).map(function(key){
    return fetch(files[key], {cache:'no-cache'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if(j) data[key]=j; })
      .catch(function(){});
  })).then(function(){
    if(apply(data) && window.PIGEARD && PIGEARD.refresh) PIGEARD.refresh();
  });
})();

/* ============================================================
   VISITES & STATISTIQUES — anonyme, hébergé sur le n8n Pigeard.
   - compteur discret en bas de page (1 visite = 1 session)
   - événements pour le menu « Site internet » de l'application :
     page vue + temps passé (aucune donnée personnelle, ni cookie)
   ============================================================ */
(function(){
  function lancerStats(){
  var N8N = 'https://n8n-1zv1.srv1641932.hstgr.cloud/webhook/';
  var sid = null, nouvelle = false;
  try{
    sid = sessionStorage.getItem('pigeardSession');
    if(!sid){
      sid = 'S' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('pigeardSession', sid);
      nouvelle = true;
    }
  }catch(e){}

  /* — collecte anonyme : page vue + temps passé — */
  if(sid){
    var page = location.pathname.replace(/\/index\.html$/, '/') || '/';
    var appareil = window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1080 ? 'tablette' : 'ordinateur');
    var envoyer = function(donnees){
      try{
        var corps = JSON.stringify(donnees);
        if(navigator.sendBeacon) navigator.sendBeacon(N8N + 'stats-site', new Blob([corps], {type:'text/plain'}));
        else if(window.fetch) fetch(N8N + 'stats-site', {method:'POST', headers:{'Content-Type':'text/plain'}, body:corps, keepalive:true});
      }catch(e){}
    };
    envoyer({type:'pageview', session:sid, page:page, referrer:document.referrer || '', appareil:appareil});
    var debut = Date.now();
    var finDePage = function(){
      var duree = Math.round((Date.now() - debut) / 1000);
      debut = Date.now();
      if(duree >= 1 && duree <= 86400) envoyer({type:'duration', session:sid, page:page, duree:duree, appareil:appareil});
    };
    window.addEventListener('pagehide', finDePage);
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden') finDePage();
      else debut = Date.now();
    });
  }

  /* — compteur discret dans le pied de page — */
  var bar = document.querySelector('.foot-bottom');
  if(!bar || !window.fetch) return;
  fetch(N8N + 'visites-site' + (nouvelle ? '?add=1' : ''))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      if(!j || j.count == null) return;
      var el = document.createElement('span');
      el.className = 'foot-visites';
      el.style.cssText = 'opacity:.35;font-size:.72rem;letter-spacing:.04em';
      el.textContent = Number(j.count).toLocaleString('fr-FR') + ' visites';
      bar.appendChild(el);
    })
    .catch(function(){});
  }
  /* prerender (speculation rules) : ne compter qu'à l'affichage réel */
  if(document.prerendering) document.addEventListener('prerenderingchange', lancerStats, {once:true});
  else lancerStats();
})();

/* ============================================================
   DÉCOR DES FÊTES — guirlande, neige, sapin (noel.js + noel.css)
   Réglages dans assets/data/noel.json (Pages CMS) : le décor
   s'affiche tout seul chaque année entre « debut » et « fin »
   (jour/mois, ex. 01/11 → 31/01) si « actif » est coché.
   Aperçu hors saison : ajouter ?noel=1 à l'adresse (valable pour
   tout l'onglet) ; ?noel=0 l'arrête. Hors saison, seul ce petit
   fichier JSON est lu : ni CSS ni JS de décor chargés.
   ============================================================ */
(function(){
  if(!window.fetch || !document.querySelector('header.nav')) return;
  var VERSION = '20261008c';
  var apercu = false;
  try{
    var m = /[?&]noel=([01])\b/.exec(location.search);
    if(m && m[1] === '1') sessionStorage.setItem('pg-noel-apercu', '1');
    if(m && m[1] === '0'){ sessionStorage.removeItem('pg-noel-apercu'); return; }
    apercu = sessionStorage.getItem('pg-noel-apercu') === '1';
  }catch(e){}
  /* « JJ/MM » → nombre MMJJ comparable (ex. 01/11 → 1101) */
  function jour(txt, defaut){
    var m = /^\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*$/.exec(txt || '');
    if(!m || +m[1] < 1 || +m[1] > 31 || +m[2] < 1 || +m[2] > 12) return defaut;
    return (+m[2]) * 100 + (+m[1]);
  }
  function enSaison(c, d){
    var debut = jour(c.debut, 1101), fin = jour(c.fin, 131), auj = (d.getMonth() + 1) * 100 + d.getDate();
    return debut <= fin ? (auj >= debut && auj <= fin) : (auj >= debut || auj <= fin);
  }
  fetch('assets/data/noel.json')
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(c){
      if(!c || !(apercu || (c.actif && enSaison(c, new Date())))) return;
      window.PIGEARD_NOEL = c;
      /* le script attend la feuille de style : aucun élément de décor sans son
         style ; il est préchargé en parallèle pour arriver à temps sur l'écran
         de chargement (bonnet sur la lunette) */
      var pre = document.createElement('link');
      pre.rel = 'preload'; pre.as = 'script'; pre.href = 'assets/js/noel.js?v=' + VERSION;
      document.head.appendChild(pre);
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'assets/css/noel.css?v=' + VERSION;
      l.onload = function(){
        var s = document.createElement('script');
        s.src = 'assets/js/noel.js?v=' + VERSION;
        document.body.appendChild(s);
      };
      document.head.appendChild(l);
    })
    .catch(function(){});
})();
