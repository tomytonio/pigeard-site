/* ============================================================
   PIGEARD — vidéo(s) de fond de section (ex : "Lunettes sur mesure", "Verres Nikon")
   Pour CHAQUE <video class="sm-bgvid" data-src="..."> de la page :
   ne charge la vidéo QUE si c'est pertinent :
   - pas en mouvement réduit (accessibilité)
   - pas sur mobile (économie de data / batterie)
   - pas en mode "économie de données"
   Sinon, la section garde son image fixe (.sm-poster).
   À charger APRÈS site.js.
   ============================================================ */
(function(){
  var vids = document.querySelectorAll('.sm-bgvid');
  if(!vids.length) return;

  var reduce = (window.PIGEARD && window.PIGEARD.reduce) ||
               !document.documentElement.classList.contains('force-motion');
  if(reduce) return;                                                   /* image fixe */
  if(window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return; /* mobile : image fixe */
  if(navigator.connection && navigator.connection.saveData) return;    /* mode éco data */

  vids.forEach(function(v){
    var src = v.getAttribute('data-src');
    if(!src) return;
    v.preload = 'auto';
    v.src = src;
    v.addEventListener('playing', function(){
      v.classList.add('is-playing');
      var s = v.closest('.bgvid-sec'); if(s) s.classList.add('has-video'); /* masque le poster (corrige le "double" image) */
    });
    var p = v.play();
    if(p && p.catch) p.catch(function(){ /* lecture auto refusée : on garde l'image fixe */ });
  });
})();
