/* ============================================================
   PIGEARD — Écran de chargement (loader.js)
   La lunette blanche se remplit du bas vers le haut pendant le
   chargement, avec le message manuscrit « Réglage de la netteté… ».
   Ne s'exécute que si l'extrait inline du <head> a posé la classe
   « pg-loading » : une fois par visite (sessionStorage), jamais en
   pré-rendu ni quand « réduire les animations » est activé.
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pg-loading')) return;
  try { sessionStorage.setItem('pg-loader-vu', '1'); } catch (e) {}

  var MIN = 1600; /* durée minimale d'affichage (ms) */
  var MAX = 3200; /* durée maximale, quoi qu'il arrive (ms) */

  var GLASSES = '<svg viewBox="262.5 217.75 276 165.5" aria-hidden="true" focusable="false"><path transform="matrix(1,0,0,-1,528.2666,281.3065)" d="M0 0C-2.313-27.874-9.173-47.89-21.758-48.849-26.107-49.18-29.593-46.969-32.669-39.288-34.372-35.032-35.4-28.79-35.984-24.26-37.241-15.98-37.107-5.298-36.232 5.257-34.242 29.252-27.732 46.243-19.892 51.999-16.741 53.959-14.783 54.445-11.88 53.826-2.778 51.884 2.315 27.877 0 0M-83.868-23.213C-86.17-62.967-105.518-94.716-127.573-94.112-135.439-93.896-144.446-89.797-152.895-72.347-158.707-60.093-162.032-47.321-160.328-14.453-156.57 26.335-143.87 52.304-121.167 55.224-113.79 56.01-109.003 53.833-103.684 48.837-100.118 45.484-97.416 41.36-95.098 36.906-86.912 22.953-82.568-.718-83.868-23.213M-15.562 58.441C-35.146 58.866-44.24 43.603-48.896 31.515-48.902 31.5-48.908 31.494-48.914 31.479-50.444 27.585-52.443 27.035-54.768 27.515-57.41 28.06-62.315 28.107-67.743 25.326-71.074 23.62-73.211 25.211-74.373 26.693-74.734 27.291-75.097 27.86-75.455 28.516-85.067 46.13-101.616 61.486-124.402 60.255-147.189 59.024-180.484 39.19-188.879-10.77-188.879-10.77-188.907-11.015-188.993-11.44-190.35-18.124-196.752-22.544-203.507-21.603L-261.29-13.553C-261.961-13.46-262.561-13.981-262.561-14.66V-41.43C-262.561-42.573-261.718-43.542-260.586-43.699L-207.028-51.161C-205.105-51.501-203.227-51.765-201.412-51.942L-192.297-53.213C-190.443-53.471-188.755-54.457-187.672-55.982-186.863-57.123-186.14-58.508-185.235-60.13-184.065-62.226-183.387-63.753-182.148-66.192-181.378-67.788-180.506-69.427-179.525-71.092-179.488-71.161-179.459-71.213-179.42-71.283-179.389-71.339-179.363-71.37-179.332-71.422-171.372-84.753-156.267-99.197-128.158-98.934-82.828-98.509-70.444-34.678-66.971-10.557-66.971-10.553-66.97-10.55-66.969-10.545-64.256 4.931-55.198 5.413-55.198 5.413-55.198 5.413-62.6-49.128-29.914-52.903 2.771-56.678 6.867-2.224 7.008 10.441 7.149 23.105 6.99 57.951-15.562 58.441" fill="#fff"/></svg>';

  var style = document.createElement('style');
  style.textContent =
    '.pg-loader{position:fixed;inset:0;z-index:11001;display:flex;align-items:center;justify-content:center;background:var(--encre,#26231C);transition:opacity .55s ease}' +
    '.pg-loader-out{opacity:0;pointer-events:none}' +
    '.pg-loader-box{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px}' +
    '.pg-loader-logo{position:relative;width:min(220px,52vw);aspect-ratio:276/165.5}' +
    '.pg-loader-logo svg{position:absolute;left:0;bottom:0;width:100%;height:auto;aspect-ratio:276/165.5;display:block}' +
    '.pg-loader-ghost svg{opacity:.15}' +
    '.pg-loader-fill{position:absolute;left:0;bottom:0;width:100%;height:0%;overflow:hidden}' +
    '.pg-loader-msg{font-family:var(--hand,cursive);font-size:clamp(1.7rem,4.5vw,2.2rem);line-height:1;color:var(--camel,#D1A379);margin-top:26px;transform:rotate(-2deg)}' +
    'html.pg-net::before{opacity:0;transition:opacity .55s ease}';
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'pg-loader';
  overlay.setAttribute('role', 'status');
  overlay.innerHTML =
    '<div class="pg-loader-box">' +
      '<div class="pg-loader-logo" aria-hidden="true">' +
        '<div class="pg-loader-ghost">' + GLASSES + '</div>' +
        '<div class="pg-loader-fill">' + GLASSES + '</div>' +
      '</div>' +
      '<p class="pg-loader-msg">Réglage de la netteté…</p>' +
    '</div>';
  document.body.appendChild(overlay);

  var fill = overlay.querySelector('.pg-loader-fill');
  var msg = overlay.querySelector('.pg-loader-msg');
  var start = performance.now();
  var progress = 0;
  var loaded = document.readyState === 'complete';
  var finished = false;
  window.addEventListener('load', function () { loaded = true; });

  function paint() {
    fill.style.height = progress + '%';
    /* clin d'œil au message : le texte se « met au point » avec le chargement */
    msg.style.filter = 'blur(' + ((1 - progress / 100) * 2.5).toFixed(2) + 'px)';
  }

  function finish() {
    if (finished) return;
    finished = true;
    progress = 100;
    paint();
    root.classList.add('pg-net');
    overlay.classList.add('pg-loader-out');
    setTimeout(function () {
      overlay.remove();
      root.classList.remove('pg-loading', 'pg-net');
    }, 600);
  }

  function frame(now) {
    if (finished) return;
    var t = now - start;
    /* la jauge suit le temps (pleine à MIN) mais plafonne à 90 % tant
       que la page n'a pas réellement fini de charger */
    var target = Math.min((t / MIN) * 100, loaded ? 100 : 90);
    progress += (target - progress) * 0.14;
    if (progress > 99.4) progress = 100;
    paint();
    if ((progress >= 100 && t >= MIN) || t >= MAX) finish();
    else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(finish, MAX + 300); /* filet de sécurité si l'onglet est en arrière-plan */

  /* retour via le cache navigateur (bouton précédent) : pas de loader */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.remove();
      root.classList.remove('pg-loading', 'pg-net');
    }
  });
})();
