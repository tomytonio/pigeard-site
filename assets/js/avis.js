/* ============================================================
   PIGEARD — carrousel d'avis Google (accueil)
   Récupère les avis via le webhook n8n « avis-site ».
   La section reste masquée s'il y a moins de 3 avis avec texte.
   À charger APRÈS site.js.
   ============================================================ */
(function(){
  var sec = document.getElementById('avis');
  if(!sec || !window.fetch) return;
  var GG = '<svg class="gg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2 3.7-5 3.7-8.6z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c.9-2.8 3.6-4.9 6.8-4.9z"/></svg>';
  var ROTS = [-1.2, .9, -.7, 1.1, -1, .8];

  fetch('https://n8n-1zv1.srv1641932.hstgr.cloud/webhook/avis-site')
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || !Array.isArray(d.avis) || d.avis.length < 3) return;
      construire(d);
    })
    .catch(function(){});

  function construire(d){
    var track = document.getElementById('avisTrack');
    var note = document.getElementById('avisNote');
    var etoiles = document.getElementById('avisEtoiles');
    var sous = document.getElementById('avisSous');
    if(!track) return;
    if(note) note.textContent = d.note_moyenne;
    if(etoiles) etoiles.style.setProperty('--rate', String(d.note_moyenne).replace(',', '.'));
    if(sous) sous.innerHTML = '<b style="color:var(--blanc-chaud)">' + Number(d.total) + ' avis Google</b> · Nogent-le-Rotrou, Brou &amp; La Loupe';

    d.avis.forEach(function(a, i){
      var card = document.createElement('article');
      card.className = 'avis-card';
      card.style.setProperty('--rot', ROTS[i % ROTS.length] + 'deg');
      card.innerHTML = '<span class="tape"></span>' +
        '<span class="g-stars" style="--rate:' + (Number(a.note) || 5) + '" aria-hidden="true"></span>' +
        '<p class="txt"></p>' +
        '<div class="qui"><div><div class="nom-a"></div><div class="mag-a"></div></div>' + GG + '</div>';
      card.querySelector('.txt').textContent = '\u00ab\u00a0' + a.commentaire + '\u00a0\u00bb';
      card.querySelector('.nom-a').textContent = a.auteur;
      card.querySelector('.mag-a').textContent = a.magasin;
      track.appendChild(card);
      if(window.PIGEARD && PIGEARD.tilt) PIGEARD.tilt(card, {amp:7, scale:1.05, retomber:function(){ track.dispatchEvent(new Event('scroll')); }});
    });

    sec.hidden = false;

    /* flèches */
    var cartes = [].slice.call(track.querySelectorAll('.avis-card'));
    var pas = function(){ return cartes[0] ? (cartes[0].offsetWidth + 18) : 340; };
    var prev = document.getElementById('avisPrev'), next = document.getElementById('avisNext');
    if(prev) prev.onclick = function(){ track.scrollBy({left: -pas(), behavior: 'smooth'}); };
    if(next) next.onclick = function(){ track.scrollBy({left: pas(), behavior: 'smooth'}); };

    /* animation liée au défilement : la carte au centre se redresse et s'illumine */
    cartes.forEach(function(c){ c.dataset.rot = parseFloat(c.style.getPropertyValue('--rot')) || 0; });
    var raf = null;
    function anime(){
      raf = null;
      var r = track.getBoundingClientRect(), cx = r.left + r.width / 2;
      cartes.forEach(function(c){
        if(window.__tiltHover === c) return;
        var cr = c.getBoundingClientRect();
        var dist = Math.min(1, Math.abs((cr.left + cr.width / 2) - cx) / (r.width * 0.55));
        c.style.transform = 'rotate(' + ((+c.dataset.rot) * dist) + 'deg) translateY(' + (dist * 10) + 'px) scale(' + (1.03 - 0.07 * dist) + ')';
        c.style.opacity = String(1 - 0.28 * dist);
        c.style.boxShadow = dist < 0.35 ? '0 26px 54px -18px rgba(0,0,0,.65)' : '0 18px 40px -18px rgba(0,0,0,.55)';
      });
    }
    function demande(){ if(!raf) raf = requestAnimationFrame(anime); }
    track.addEventListener('scroll', demande, {passive: true});
    window.addEventListener('resize', demande);
    anime();

    if(window.ScrollTrigger){ try{ ScrollTrigger.refresh(); }catch(e){} }
  }
})();
