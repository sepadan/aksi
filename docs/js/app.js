// app.js — rangka bersama semua halaman AKSI di GitHub Pages.
// Menggantikan Script.html + renderSidebar() Apps Script.
// Memerlukan config.js dan api.js dimuatkan dahulu.

(function () {
  'use strict';

  var HALAMAN = [
    { fail: 'dashboard.html',  id: 'Dashboard',  ikon: '🏠',  label: 'Dashboard' },
    { fail: 'keahlian.html',   id: 'Keahlian',   ikon: '👥',  label: 'Keahlian' },
    { fail: 'kehadiran.html',  id: 'Kehadiran',  ikon: '📅',  label: 'Kehadiran' },
    { fail: 'laporan.html',    id: 'Laporan',    ikon: '📝',  label: 'Laporan Perjumpaan' },
    { fail: 'pencapaian.html', id: 'Pencapaian', ikon: '🏅',  label: 'Pencapaian' },
    { fail: 'penilaian.html',  id: 'Penilaian',  ikon: '📋',  label: 'Penilaian Koku' },
    { fail: 'senarai.html',    id: 'Senarai',    ikon: '⬇️', label: 'Muat Turun' }
  ];

  // ---------- sesi ----------

  function token() {
    return sessionStorage.getItem('token');
  }

  function peranan() {
    return sessionStorage.getItem('peranan');
  }

  function isAdmin() {
    return peranan() === 'admin';
  }

  function pergiLogin() {
    try { sessionStorage.clear(); } catch (e) {}
    window.location.href = 'index.html';
  }

  function logout() {
    var t = token();
    tunjukLoading(true);
    if (!t) { pergiLogin(); return; }
    google.script.run
      .withSuccessHandler(pergiLogin)
      .withFailureHandler(pergiLogin)
      .logout(t);
  }

  // ---------- rangka halaman ----------

  function lukisRangka(aktif) {
    var bekas = document.getElementById('rangka');
    if (!bekas) return;

    var nav = HALAMAN.map(function (h) {
      var kelas = 'nav-item' + (h.id === aktif ? ' aktif' : '');
      return '<a href="' + h.fail + '" class="' + kelas +
             '" id="nav-' + h.id + '">' + h.ikon + ' ' + h.label + '</a>';
    }).join('');

    if (isAdmin()) {
      nav += '<div id="menu-admin">' +
             '<div class="nav-divider">PENTADBIRAN</div>' +
             '<a href="admin.html" class="nav-item' +
             (aktif === 'Admin' ? ' aktif' : '') +
             '" id="nav-Admin">⚙️ Tetapan &amp; Upload</a>' +
             '</div>';
    }

    bekas.innerHTML =
      '<div class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
          '<div class="sidebar-icon" id="sidebar-icon">🏫</div>' +
          '<div class="sidebar-nama">' +
            '<h3 id="sidebar-nama-sekolah"></h3>' +
            '<p id="sidebar-tahun"></p>' +
          '</div>' +
        '</div>' +
        '<nav class="sidebar-nav">' + nav + '</nav>' +
        '<div class="sidebar-footer">' +
          '<button class="btn-logout" type="button" ' +
          'onclick="logout()">🚪 Log Keluar</button>' +
          '<p style="text-align:center;font-size:10px;color:#999;' +
          'margin:8px 0 0 0" id="versi-sistem"></p>' +
        '</div>' +
      '</div>' +
      '<div class="topbar">' +
        '<button class="btn-menu" type="button" ' +
        'onclick="togolSidebar()">☰</button>' +
        '<h2 id="topbar-tajuk"></h2>' +
      '</div>';
  }

  function isiIdentitiSekolah() {
    google.script.run
      .withSuccessHandler(function (d) {
        if (!d) return;
        var nama = document.getElementById('sidebar-nama-sekolah');
        var tahun = document.getElementById('sidebar-tahun');
        var ikon = document.getElementById('sidebar-icon');
        var versi = document.getElementById('versi-sistem');
        if (nama) nama.textContent = d.namaSekolah || '';
        if (tahun) tahun.textContent = 'TA ' + (d.tahunAkademik || '');
        if (versi) versi.textContent = d.versi || window.AKSI_VERSI || '';
        if (ikon && d.logo) {
          ikon.innerHTML = '<img src="' + d.logo + '" style="width:42px;' +
            'height:42px;object-fit:contain;border-radius:8px;' +
            'background:#fff;padding:2px" alt="">';
        }
        if (d.namaSekolah) {
          document.title = document.title.replace(/—.*$/, '').trim() +
            ' — ' + d.namaSekolah;
        }
      })
      .withFailureHandler(function () {})
      .getSidebarData(token());
  }

  // Dipanggil di hujung setiap halaman dalam.
  // Pulangkan token, atau null jika sesi tiada (dan alih ke login).
  function initHalaman(aktif) {
    if (!token()) { pergiLogin(); return null; }
    lukisRangka(aktif);
    isiIdentitiSekolah();
    return token();
  }

  function togolSidebar() {
    var s = document.getElementById('sidebar');
    if (s) s.classList.toggle('buka');
  }

  // ---------- utiliti ----------

  function tunjukToast(mesej, jenis) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mesej;
    toast.className = 'toast ' + (jenis || 'berjaya') + ' aktif';
    setTimeout(function () { toast.classList.remove('aktif'); }, 3000);
  }

  function tunjukLoading(tunjuk) {
    var o = document.getElementById('loading-overlay');
    if (o) o.style.display = tunjuk ? 'flex' : 'none';
  }

  function formatTarikh(tarikh) {
    if (!tarikh) return '-';
    try {
      return new Date(tarikh).toLocaleDateString('ms-MY');
    } catch (e) {
      return String(tarikh);
    }
  }

  // Sesi tamat di tengah kerja: backend pulangkan null.
  // Guna ini supaya guru nampak sebab, bukan skrin kosong.
  function sahHasil(hasil) {
    if (hasil === null || hasil === undefined) {
      tunjukLoading(false);
      tunjukToast('Sesi tamat. Sila log masuk semula.', 'ralat');
      setTimeout(pergiLogin, 1800);
      return false;
    }
    return true;
  }

  // ---------- dedah ke global (halaman guna terus) ----------

  window.AKSI = {
    token: token,
    peranan: peranan,
    isAdmin: isAdmin,
    initHalaman: initHalaman,
    sahHasil: sahHasil
  };

  window.logout = logout;
  window.pergiLogin = pergiLogin;
  window.togolSidebar = togolSidebar;
  window.tunjukToast = tunjukToast;
  window.tunjukLoading = tunjukLoading;
  window.formatTarikh = formatTarikh;
  window.initHalaman = initHalaman;
  window.getPeranan = peranan;
  window.isAdmin = isAdmin;
  window.semakSesiAktif = function () {
    var t = token();
    if (!t) { pergiLogin(); return null; }
    return t;
  };
})();
