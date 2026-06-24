/* ============================================================
   PIGEARD — moteur partagé (site.js)
   À charger APRÈS gsap, ScrollTrigger et lenis (CDN), puis le
   script inline propre à la page. Expose window.PIGEARD.
   ============================================================ */
(function(){
  /* Animations ACTIVES par défaut (le site se veut très animé) — plus besoin de ?motion=force.
     Pour réduire les animations (accessibilité), ouvrir la page avec ?reduce=1. */
  var REDUCE_OPT = location.search.indexOf('reduce=1') > -1;
  if(!REDUCE_OPT) document.documentElement.classList.add('force-motion');
  var reduce = REDUCE_OPT;

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

  var PIG = window.PIGEARD = { reduce: reduce, force: !REDUCE_OPT, gsap: window.gsap || null, lenis: null };

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
