// pwa.js — pemasangan dan kemas kini automatik AKSI sebagai PWA.
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  var sudahMuatSemula = false;
  document.documentElement.setAttribute('data-pwa-status', 'mendaftar');

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (sudahMuatSemula) return;
    sudahMuatSemula = true;
    window.location.reload();
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./service-worker.js', {
      scope: './',
      updateViaCache: 'none'
    }).then(function (pendaftaran) {
      document.documentElement.setAttribute('data-pwa-status', 'didaftar');
      navigator.serviceWorker.ready.then(function () {
        document.documentElement.setAttribute('data-pwa-status', 'sedia');
      });
      // Semak versi baharu setiap kali aplikasi dibuka. Pemasangan semula
      // pada homescreen tidak diperlukan.
      pendaftaran.update().catch(function () {});
    }).catch(function (ralat) {
      document.documentElement.setAttribute('data-pwa-status', 'gagal');
      if (window.console) console.warn('PWA AKSI tidak dapat didaftarkan:', ralat);
    });
  });
})();
