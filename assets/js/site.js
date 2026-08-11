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
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if(nav) nav.classList.toggle('scrolled', y > 40);
    if(prog){ var max = document.body.scrollHeight - innerHeight; prog.style.width = (max>0 ? (y/max*100) : 0) + '%'; }
  }
  window.addEventListener('scroll', onScroll); onScroll();


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
  document.querySelectorAll('#teamRow .frame').forEach(function(fr){ PIG.tilt(fr, {amp:9, scale:1.04}); });

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
      gsap.to(b,{ x:(i%2?'+=40':'-=40'), y:(i%2?'-=30':'+=30'), scale:1.14, duration:9+i*2, ease:'sine.inOut', yoyo:true, repeat:-1, delay:i*0.5 });
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
  function apply(data){
    document.querySelectorAll('[data-bind]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind')); if(v==null || v==='') return;
      if(el.hasAttribute('data-bind-multiline')) el.innerHTML = esc(v).replace(/\n/g,'<br>');
      else el.textContent = v;
    });
    document.querySelectorAll('[data-bind-href]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind-href')); if(v!=null && v!=='') el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-bind-src]').forEach(function(el){
      var v = get(data, el.getAttribute('data-bind-src')); if(v!=null && v!=='') el.setAttribute('src', v);
    });
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
    apply(data);
    if(window.ScrollTrigger){ try{ ScrollTrigger.refresh(); }catch(e){} }
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
   AVIS ÉCLIPSE (TEMPORAIRE) — rupture de stock des lunettes
   d'éclipse. Petite fenêtre à fermer, affichée sur toutes les
   pages tant qu'elle n'a pas été fermée (localStorage), puis
   plus jamais après la soirée du 12 août 2026 : passé le
   13/08/2026 à 0 h (heure de Paris), ce bloc ne fait plus rien.
   → Après l'éclipse, supprimer tout ce bloc (et bumper ?v=).
   ============================================================ */
(function(){
  if(Date.now() > new Date('2026-08-13T00:00:00+02:00').getTime()) return;
  try{ if(localStorage.getItem('pgEclipseFerme')) return; }catch(e){}

  function montrer(){
    var style = document.createElement('style');
    style.textContent =
      '.pg-avis-fond{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(14,13,11,.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);opacity:0;transition:opacity .4s ease}' +
      '.pg-avis-fond.visible{opacity:1}' +
      '.pg-avis{position:relative;width:100%;max-width:420px;background:var(--encre,#26231C);border:1px solid rgba(231,221,203,.16);border-radius:20px;padding:36px 30px 30px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.55);transform:translateY(14px);transition:transform .4s cubic-bezier(.16,1,.3,1);outline:none}' +
      '.pg-avis-fond.visible .pg-avis{transform:none}' +
      '.pg-avis-fermer{position:absolute;top:8px;right:8px;width:42px;height:42px;background:none;border:none;color:rgba(231,221,203,.65);font-size:26px;line-height:1;border-radius:50%}' +
      '.pg-avis-fermer:hover{color:#E7DDCB}' +
      '.pg-avis-astre{width:84px;height:84px;margin:0 auto 6px;display:block}' +
      '.pg-avis-kicker{font-size:.72rem;font-weight:700;letter-spacing:.32em;text-indent:.32em;text-transform:uppercase;color:var(--camel,#D1A379);margin-bottom:10px}' +
      '.pg-avis h2{font-family:var(--serif,Georgia,serif);font-weight:500;font-size:1.6rem;line-height:1.2;color:var(--creme,#E7DDCB);margin-bottom:12px}' +
      '.pg-avis-texte{font-size:.95rem;line-height:1.6;color:rgba(231,221,203,.82);margin-bottom:6px}' +
      '.pg-avis-main{font-family:var(--hand,cursive);font-size:1.5rem;line-height:1;color:var(--vert-clair,#9DAA78);transform:rotate(-1.8deg);margin-bottom:16px}' +
      '.pg-avis-prudence{font-size:.78rem;line-height:1.55;color:var(--muted,#938B7C);margin-bottom:20px}' +
      '.pg-avis-ok{display:inline-block;background:var(--vert,#7E8C5A);color:#0E0D0B;border:none;border-radius:999px;padding:12px 30px;font-weight:700;font-size:.95rem;letter-spacing:.02em}' +
      '@media (max-width:480px){.pg-avis{padding:30px 22px 24px}.pg-avis h2{font-size:1.4rem}}';
    document.head.appendChild(style);

    var fond = document.createElement('div');
    fond.className = 'pg-avis-fond';
    fond.innerHTML =
      '<div class="pg-avis" role="dialog" aria-modal="true" aria-labelledby="pgAvisTitre" tabindex="-1">' +
        '<button type="button" class="pg-avis-fermer" aria-label="Fermer">&times;</button>' +
        '<svg class="pg-avis-astre" viewBox="0 0 96 96" aria-hidden="true">' +
          '<defs>' +
            '<radialGradient id="pgAvisSol" cx="38%" cy="36%" r="75%"><stop offset="0%" stop-color="#F0E4CE"/><stop offset="55%" stop-color="#E3C9A4"/><stop offset="100%" stop-color="#D1A379"/></radialGradient>' +
            '<radialGradient id="pgAvisHalo" cx="50%" cy="50%" r="50%"><stop offset="52%" stop-color="#D1A379" stop-opacity="0"/><stop offset="70%" stop-color="#E7DDCB" stop-opacity=".32"/><stop offset="100%" stop-color="#D1A379" stop-opacity="0"/></radialGradient>' +
          '</defs>' +
          '<circle cx="48" cy="48" r="47" fill="url(#pgAvisHalo)"/>' +
          '<circle cx="48" cy="48" r="30" fill="url(#pgAvisSol)"/>' +
          '<circle cx="45.8" cy="45.8" r="29.4" fill="#26231C"/>' +
        '</svg>' +
        '<p class="pg-avis-kicker">Éclipse du 12 août</p>' +
        '<h2 id="pgAvisTitre">Plus de lunettes d’éclipse</h2>' +
        '<p class="pg-avis-texte">Victimes de leur succès, elles sont épuisées dans nos trois magasins.</p>' +
        '<p class="pg-avis-main">merci pour votre enthousiasme&nbsp;!</p>' +
        '<p class="pg-avis-prudence">Ne regardez jamais le soleil sans protection certifiée, même partiellement éclipsé.</p>' +
        '<button type="button" class="pg-avis-ok">J’ai compris</button>' +
      '</div>';
    document.body.appendChild(fond);

    var carte = fond.querySelector('.pg-avis');
    function fermer(){
      try{ localStorage.setItem('pgEclipseFerme','1'); }catch(e){}
      document.removeEventListener('keydown', surTouche);
      fond.classList.remove('visible');
      setTimeout(function(){ if(fond.parentNode) fond.parentNode.removeChild(fond); }, 420);
    }
    function surTouche(e){ if(e.key === 'Escape') fermer(); }
    fond.querySelector('.pg-avis-fermer').addEventListener('click', fermer);
    fond.querySelector('.pg-avis-ok').addEventListener('click', fermer);
    fond.addEventListener('click', function(e){ if(e.target === fond) fermer(); });
    document.addEventListener('keydown', surTouche);

    requestAnimationFrame(function(){
      fond.classList.add('visible');
      try{ carte.focus({preventScroll:true}); }catch(e){}
    });
  }

  /* prerender (speculation rules) : n'afficher qu'à l'affichage réel */
  function initAvis(){
    if(document.prerendering) document.addEventListener('prerenderingchange', montrer, {once:true});
    else montrer();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAvis, {once:true});
  else initAvis();
})();
