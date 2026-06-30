/* ============================================================
   PIGEARD — vidéo(s) de fond de section (ex : "Lunettes sur mesure", "Verres Nikon")
   Pour CHAQUE <video class="sm-bgvid" data-src="..."> de la page :
   charge et joue la vidéo (ordinateur ET mobile), SAUF si le visiteur est en
   mode "économie de données" → dans ce cas la section garde son image fixe (.sm-poster).
   À charger APRÈS site.js.
   ============================================================ */
(function(){
  var vids = document.querySelectorAll('.sm-bgvid');
  if(!vids.length) return;

  /* Vidéos actives partout (ordinateur ET mobile). On respecte seulement le mode
     "économie de données" explicite du visiteur (les fichiers sont légers : ~260–450 Ko). */
  if(navigator.connection && navigator.connection.saveData) return;

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
