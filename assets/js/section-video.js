/* ============================================================
   PIGEARD — vidéo de fond de section (ex : "Lunettes sur mesure")
   Lit la vidéo d'atelier UNIQUEMENT quand c'est pertinent :
   - pas en mouvement réduit (accessibilité)
   - pas sur mobile (économie de data / batterie)
   - pas en mode "économie de données"
   Sinon, la section garde son image fixe (.sm-poster).
   À charger APRÈS site.js.
   ============================================================ */
(function(){
  var v = document.querySelector('.sm-bgvid');
  if(!v) return;

  var reduce = (window.PIGEARD && window.PIGEARD.reduce) ||
               !document.documentElement.classList.contains('force-motion');
  if(reduce) return;                                                   /* image fixe */
  if(window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return; /* mobile : image fixe */
  if(navigator.connection && navigator.connection.saveData) return;    /* mode éco data */

  v.preload = 'auto';
  v.src = 'assets/video/hero-atelier.mp4';
  v.addEventListener('playing', function(){ v.classList.add('is-playing'); });

  var p = v.play();
  if(p && p.catch) p.catch(function(){ /* lecture auto refusée : on garde l'image fixe */ });
})();
