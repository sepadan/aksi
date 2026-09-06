// pwa.js — pemasangan dan kemas kini automatik AKSI sebagai PWA.
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  var sudahMuatSemula = false;
  document.documentElement.setAttribute('data-pwa-status', 'mendaftar');

  /* Muat semula hanya apabila Service Worker BARU menggantikan yang lama.

     Pada lawatan pertama tiada pengawal lagi, tetapi `clients.claim()` dalam
     service-worker.js tetap membangkitkan `controllerchange`. Dahulu itu
     memuat semula halaman di tengah-tengah kerja: setiap panggilan API
     halaman berjalan dua kali (14 permintaan, bukan 7) dan mana-mana POST
     yang sedang berjalan dibatalkan. Simpan logo ialah mangsa paling kerap
     kerana muatannya besar dan mengambil beberapa saat — Safari iOS
     melaporkan pembatalan itu sebagai "Load failed", yang kelihatan seperti
     ralat pelayan sedangkan pelayan tidak pernah menerima permintaan. */
  var adaPengawalAwal = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!adaPengawalAwal) return;
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
