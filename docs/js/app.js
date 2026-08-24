// app.js — rangka bersama semua halaman AKSI di GitHub Pages.
// v4 (24 Ogos 2026): menu mudah alih boleh ditutup dengan jelas.
//
// Sesiapa boleh membaca AKSI tanpa log masuk. Hanya guru dan admin
// boleh menambah, mengubah atau memadam.
//
// Dua lapisan, dan kedua-duanya perlu:
//   1. Pelayan (Kebenaran.gs) MENOLAK setiap panggilan tulis daripada
//      tetamu. Ini lapisan yang benar-benar melindungi.
//   2. Muka depan MENYEMBUNYIKAN butang yang tidak boleh digunakan.
//      Ini bukan keselamatan — ia kesopanan. Butang yang kelihatan
//      tetapi sentiasa gagal hanya membuang masa guru.
//
// Menyembunyikan butang TIDAK menggantikan lapisan 1. Sesiapa boleh
// membuka konsol pelayar dan memanggil fungsi itu terus.

(function () {
  'use strict';

  var TETAMU = 'TETAMU';

  var HALAMAN = [
    { fail: 'index.html',      id: 'Dashboard',  ikon: '🏠',  label: 'Dashboard' },
    { fail: 'keahlian.html',   id: 'Keahlian',   ikon: '👥',  label: 'Keahlian' },
    { fail: 'kehadiran.html',  id: 'Kehadiran',  ikon: '📅',  label: 'Kehadiran' },
    { fail: 'laporan.html',    id: 'Laporan',    ikon: '📝',  label: 'Laporan Perjumpaan' },
    { fail: 'pencapaian.html', id: 'Pencapaian', ikon: '🏅',  label: 'Pencapaian' },
    { fail: 'penilaian.html',  id: 'Penilaian',  ikon: '📋',  label: 'Penilaian Koku' },
    { fail: 'senarai.html',    id: 'Senarai',    ikon: '⬇️', label: 'Muat Turun' }
  ];

  // ---------- sesi ----------

  function ambil(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function simpan(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) {}
  }

  // Sentiasa ada token. Tiada log masuk = token tetamu, bukan null.
  // Ini membuang setiap semakan "kalau tiada token" yang bertaburan
  // dalam halaman lama.
  function token() {
    return ambil('token') || TETAMU;
  }

  function peranan() {
    return token() === TETAMU ? 'tetamu' : (ambil('peranan') || 'tetamu');
  }

  function namaPengguna() {
    return ambil('nama') || '';
  }

  function isTetamu() { return peranan() === 'tetamu'; }
  function isAdmin()  { return peranan() === 'admin'; }
  function bolehTulis() {
    var p = peranan();
    return p === 'guru' || p === 'admin';
  }

  function tetapkanKelasBadan() {
    var b = document.body;
    if (!b) return;
    b.classList.toggle('tetamu', isTetamu());
    b.classList.toggle('peranan-guru', peranan() === 'guru');
    b.classList.toggle('peranan-admin', isAdmin());
  }

  function keluarSesi() {
    try { sessionStorage.clear(); } catch (e) {}
    window.location.reload();
  }

  /* Log keluar mesti berlaku SERTA-MERTA di pelayar.
     Versi pertama menunggu jawapan pelayan dahulu — bila pelayan tidak
     menjawab, guru terperangkap pada skrin memuat dan masih log masuk.
     Log keluar yang boleh gagal bukan log keluar.
     Pelayan diberitahu secara hantar-dan-lupa; kalau ia terlepas, sesi
     itu akan luput sendiri dalam 8 jam. */
  function logout() {
    var t = token();
    try { sessionStorage.clear(); } catch (e) {}
    if (t !== TETAMU) {
      try {
        google.script.run
          .withSuccessHandler(function () {})
          .withFailureHandler(function () {})
          .logout(t);
      } catch (e) {}
    }
    window.location.reload();
  }

  // ---------- panel log masuk ----------

  var _guruDimuat = false;

  function bukaLogin(jenis) {
    tutupSidebar();
    var panel = document.getElementById('panel-login');
    if (!panel) return;
    panel.classList.add('buka');
    pilihTabLogin(jenis || 'guru');
    if (!_guruDimuat) muatSenaraiGuru();
    var f = panel.querySelector('.tab-login.aktif input[type="password"]');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function tutupLogin() {
    var panel = document.getElementById('panel-login');
    if (panel) panel.classList.remove('buka');
    ralatLogin('');
  }

  function pilihTabLogin(jenis) {
    ['guru', 'admin'].forEach(function (j) {
      var tab = document.getElementById('tab-' + j);
      var btn = document.getElementById('btntab-' + j);
      if (tab) tab.classList.toggle('aktif', j === jenis);
      if (btn) btn.classList.toggle('aktif', j === jenis);
    });
    ralatLogin('');
  }

  function muatSenaraiGuru() {
    var sel = document.getElementById('login-guru-nama');
    if (!sel) return;
    google.script.run
      .withSuccessHandler(function (senarai) {
        _guruDimuat = true;
        if (!senarai || !senarai.length) {
          sel.innerHTML = '<option value="">(tiada guru dalam sistem)</option>';
          return;
        }
        sel.innerHTML = '<option value="">-- Pilih Guru --</option>' +
          senarai.map(function (n) {
            return '<option value="' + escAtr(n) + '">' + esc(n) + '</option>';
          }).join('');
      })
      .withFailureHandler(function () {
        sel.innerHTML = '<option value="">(gagal memuat senarai guru)</option>';
      })
      .senaraiGuruLogin();
  }

  function ralatLogin(mesej) {
    var el = document.getElementById('login-ralat');
    if (!el) return;
    el.textContent = mesej || '';
    el.style.display = mesej ? 'block' : 'none';
  }

  function hantarLogin(jenis) {
    var id, kataLaluan, btn;
    if (jenis === 'admin') {
      id = 'admin';
      kataLaluan = (document.getElementById('login-admin-kunci') || {}).value || '';
      btn = document.getElementById('btn-login-admin');
    } else {
      id = (document.getElementById('login-guru-nama') || {}).value || '';
      kataLaluan = (document.getElementById('login-guru-kunci') || {}).value || '';
      btn = document.getElementById('btn-login-guru');
      if (!id) { ralatLogin('Sila pilih nama guru.'); return; }
    }
    if (!kataLaluan) { ralatLogin('Sila masukkan kata laluan.'); return; }

    ralatLogin('');
    if (btn) { btn.disabled = true; btn.textContent = 'Sedang log masuk…'; }

    function pulih() {
      if (!btn) return;
      btn.disabled = false;
      btn.textContent = 'Log Masuk';
    }

    google.script.run
      .withSuccessHandler(function (hasil) {
        if (hasil && hasil.berjaya) {
          simpan('token', hasil.token);
          simpan('peranan', hasil.peranan);
          simpan('nama', hasil.nama || id);
          window.location.reload();
          return;
        }
        pulih();
        ralatLogin((hasil && hasil.mesej) || 'Log masuk gagal. Cuba lagi.');
      })
      .withFailureHandler(function (e) {
        pulih();
        ralatLogin('Tidak dapat menghubungi pelayan. Semak sambungan internet.');
        if (window.console) console.error(e);
      })
      .login(id, kataLaluan);
  }

  function htmlPanelLogin() {
    return '' +
    '<div class="login-latar" onclick="tutupLogin()"></div>' +
    '<div class="login-kotak" role="dialog" aria-modal="true" aria-label="Log masuk">' +
      '<button class="login-tutup" type="button" onclick="tutupLogin()" ' +
              'aria-label="Tutup">×</button>' +
      '<h3>Log Masuk</h3>' +
      '<div class="login-tab-butang">' +
        '<button type="button" id="btntab-guru" class="aktif" ' +
                'onclick="pilihTabLogin(\'guru\')">🧑‍🏫 Guru</button>' +
        '<button type="button" id="btntab-admin" ' +
                'onclick="pilihTabLogin(\'admin\')">⚙️ Admin</button>' +
      '</div>' +

      '<div class="tab-login aktif" id="tab-guru">' +
        '<label for="login-guru-nama">Nama Guru</label>' +
        '<select id="login-guru-nama" class="form-input">' +
          '<option value="">Memuatkan…</option></select>' +
        '<label for="login-guru-kunci">Kata Laluan</label>' +
        '<input type="password" id="login-guru-kunci" class="form-input" ' +
               'autocomplete="current-password">' +
        '<button type="button" class="btn-utama" id="btn-login-guru" ' +
                'onclick="hantarLogin(\'guru\')">Log Masuk</button>' +
      '</div>' +

      '<div class="tab-login" id="tab-admin">' +
        '<label for="login-admin-kunci">Kata Laluan Admin</label>' +
        '<input type="password" id="login-admin-kunci" class="form-input" ' +
               'autocomplete="current-password">' +
        '<button type="button" class="btn-utama" id="btn-login-admin" ' +
                'onclick="hantarLogin(\'admin\')">Log Masuk</button>' +
      '</div>' +

      '<div id="login-ralat" class="mesej-ralat" style="display:none"></div>' +
    '</div>';
  }

  function pasangPanelLogin() {
    if (document.getElementById('panel-login')) return;
    var d = document.createElement('div');
    d.id = 'panel-login';
    d.className = 'panel-login';
    d.innerHTML = htmlPanelLogin();
    document.body.appendChild(d);

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tutupLogin();
      if (e.key === 'Enter') {
        var tab = d.querySelector('.tab-login.aktif');
        if (tab) hantarLogin(tab.id === 'tab-admin' ? 'admin' : 'guru');
      }
    });
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

    var kaki = isTetamu()
      ? '<div class="kotak-tetamu">' +
          '<p>👁️ Mod lihat sahaja</p>' +
          '<button class="btn-masuk" type="button" ' +
                  'onclick="bukaLogin(\'guru\')">🔐 Log Masuk</button>' +
        '</div>'
      : '<p class="nama-pengguna">' + esc(namaPengguna()) +
        '<span>' + esc(peranan()) + '</span></p>' +
        '<button class="btn-logout" type="button" ' +
        'onclick="logout()">🚪 Log Keluar</button>';

    bekas.innerHTML =
      '<div class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
          '<div class="sidebar-icon" id="sidebar-icon">🏫</div>' +
          '<div class="sidebar-nama">' +
            '<h3 id="sidebar-nama-sekolah"></h3>' +
            '<p id="sidebar-tahun"></p>' +
          '</div>' +
          '<button class="btn-tutup-sidebar" type="button" ' +
          'onclick="tutupSidebar()" aria-label="Tutup menu">×</button>' +
        '</div>' +
        '<nav class="sidebar-nav">' + nav + '</nav>' +
        '<div class="sidebar-footer">' + kaki +
          '<p style="text-align:center;font-size:10px;color:#999;' +
          'margin:8px 0 0 0" id="versi-sistem"></p>' +
        '</div>' +
      '</div>' +
      '<button class="sidebar-latar" id="sidebar-latar" type="button" ' +
      'onclick="tutupSidebar()" aria-label="Tutup menu"></button>' +
      '<div class="topbar">' +
        '<button class="btn-menu" id="btn-menu" type="button" ' +
        'onclick="togolSidebar()" aria-controls="sidebar" ' +
        'aria-expanded="false" aria-label="Buka menu">☰</button>' +
        '<h2 id="topbar-tajuk"></h2>' +
      '</div>';

    pasangKawalanSidebar();
  }

  // Sepanduk di atas kandungan — supaya sebab butang hilang itu jelas.
  /* Tidak setiap halaman memberi id="kandungan" kepada bekasnya —
     sesetengahnya hanya class="kandungan". Mencari satu sahaja bermakna
     halaman yang lain terlepas sekatan sepenuhnya. */
  function bekasKandungan() {
    return document.getElementById('kandungan') ||
           document.querySelector('.kandungan');
  }

  function lukisSepandukTetamu() {
    if (!isTetamu()) return;
    var k = bekasKandungan();
    if (!k || document.getElementById('sepanduk-tetamu')) return;
    var d = document.createElement('div');
    d.id = 'sepanduk-tetamu';
    d.className = 'sepanduk-tetamu';
    d.innerHTML = '<span>👁️ Anda melihat sebagai <strong>tetamu</strong>. ' +
      'Data boleh dibaca tetapi tidak boleh diubah.</span>' +
      '<button type="button" class="btn-masuk" ' +
      'onclick="bukaLogin(\'guru\')">Log Masuk untuk Mengubah</button>';
    k.insertBefore(d, k.firstChild);
  }

  /* --- sapu butang tulis untuk tetamu ---------------------------------
     Banyak butang dijana oleh JavaScript selepas data tiba, jadi satu
     sapuan sekali sahaja akan terlepas. Pemerhati ini menangkap butang
     yang muncul kemudian juga.

     Sekali lagi: ini KOSMETIK. Pelayan yang menolak panggilan tulis. */

  var CORAK_TULIS = /(tambah|simpan|padam|hapus|hantar|muat\s*naik|import|edit|kemas\s*kini|tukar|reset|jana|buat\s+perjumpaan|tanda)/i;
  var KELAS_TULIS = ['btn-tambah', 'btn-padam', 'btn-simpan', 'btn-hantar'];

  function butangTulis_(el) {
    if (!el || el.dataset.tetamuDisapu === '1') return false;
    if (el.closest && el.closest('#panel-login')) return false;   // butang log masuk
    if (el.classList.contains('hanya-guru') ||
        el.classList.contains('hanya-admin')) return true;
    for (var i = 0; i < KELAS_TULIS.length; i++) {
      if (el.classList.contains(KELAS_TULIS[i])) return true;
    }
    return CORAK_TULIS.test(el.textContent || '');
  }

  function sapuKawalanTulis() {
    if (!isTetamu()) return;
    var calon = document.querySelectorAll(
        'button, input[type="submit"], input[type="file"], .btn-tambah, .btn-padam');
    Array.prototype.forEach.call(calon, function (el) {
      if (el.tagName === 'INPUT' && el.type === 'file') {
        el.dataset.tetamuDisapu = '1';
        el.classList.add('hanya-guru');
        return;
      }
      if (!butangTulis_(el)) return;
      el.dataset.tetamuDisapu = '1';
      el.classList.add('hanya-guru');
    });
  }

  function pantauKawalanTulis() {
    if (!isTetamu() || typeof MutationObserver === 'undefined') return;
    var pemerhati = new MutationObserver(function () { sapuKawalanTulis(); });
    pemerhati.observe(document.body, { childList: true, subtree: true });
  }

  var _sekolah = null;
  var _menunggu = [];

  function bilaSedia(fn) {
    if (typeof fn !== 'function') return;
    if (_sekolah) { fn(_sekolah); return; }
    _menunggu.push(fn);
  }

  function lepaskanMenunggu(d) {
    _sekolah = d;
    var senarai = _menunggu;
    _menunggu = [];
    senarai.forEach(function (f) {
      try { f(d); } catch (e) { if (window.console) console.error(e); }
    });
  }

  function isiIdentitiSekolah() {
    google.script.run
      .withSuccessHandler(function (d) {
        if (!d) {
          lepaskanMenunggu({ namaSekolah: '', tahunAkademik: '', logo: '' });
          return;
        }
        lepaskanMenunggu(d);
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
      .withFailureHandler(function () {
        lepaskanMenunggu({ namaSekolah: '', tahunAkademik: '', logo: '' });
      })
      .getSidebarData(token());
  }

  // Dipanggil di hujung setiap halaman. Tidak pernah mengalih ke mana-mana —
  // tetamu berhak melihat halaman ini.
  function initHalaman(aktif) {
    tetapkanKelasBadan();
    lukisRangka(aktif);
    pasangPanelLogin();
    lukisSepandukTetamu();
    sapuKawalanTulis();
    pantauKawalanTulis();
    isiIdentitiSekolah();
    if (aktif === 'Admin' && !isAdmin()) {
      var k = bekasKandungan();
      if (k) {
        k.id = 'kandungan';
        k.innerHTML = '<div class="halaman-header"><h2>Tetapan</h2></div>' +
          '<p class="tiada-data" id="admin-ditolak">Halaman ini untuk admin ' +
          'sahaja. Sila log masuk sebagai admin.</p>' +
          '<button class="btn-masuk" type="button" ' +
          'onclick="bukaLogin(\'admin\')">🔐 Log Masuk sebagai Admin</button>';
      } else {
        // Bekas tidak dijumpai: kosongkan badan sepenuhnya. Lebih baik
        // halaman kosong daripada borang admin terdedah.
        document.body.innerHTML =
          '<p style="padding:40px;font-family:sans-serif">Halaman ini untuk ' +
          'admin sahaja.</p>';
      }
      return null;
    }
    return token();
  }

  function pergiHalaman(halaman) {
    var padan = HALAMAN.filter(function (x) { return x.id === halaman; })[0];
    window.location.href = padan ? padan.fail :
      String(halaman).toLowerCase() + '.html';
    return false;
  }

  function tetapkanSidebar(terbuka) {
    var s = document.getElementById('sidebar');
    var latar = document.getElementById('sidebar-latar');
    var btn = document.getElementById('btn-menu');
    if (!s) return;
    s.classList.toggle('buka', !!terbuka);
    if (latar) latar.classList.toggle('buka', !!terbuka);
    document.body.classList.toggle('menu-sidebar-buka', !!terbuka);
    if (btn) {
      btn.setAttribute('aria-expanded', terbuka ? 'true' : 'false');
      btn.setAttribute('aria-label', terbuka ? 'Tutup menu' : 'Buka menu');
    }
  }

  function tutupSidebar() {
    tetapkanSidebar(false);
  }

  function togolSidebar() {
    var s = document.getElementById('sidebar');
    tetapkanSidebar(!(s && s.classList.contains('buka')));
  }

  function pasangKawalanSidebar() {
    var s = document.getElementById('sidebar');
    if (!s) return;
    s.querySelectorAll('.nav-item').forEach(function (pautan) {
      pautan.addEventListener('click', tutupSidebar);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tutupSidebar();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) tutupSidebar();
    });
  }

  // ---------- utiliti ----------

  function esc(t) {
    return String(t === null || t === undefined ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAtr(t) { return esc(t); }

  function tunjukToast(mesej, jenis) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mesej;
    toast.className = 'toast ' + (jenis || 'berjaya') + ' aktif';
    setTimeout(function () { toast.classList.remove('aktif'); }, 3000);
  }

  /* Pengawal masa. Tirai memuat yang tidak pernah hilang kelihatan
     seperti sistem rosak, dan guru tiada cara untuk keluar daripadanya.
     Selepas 20 saat, tirai dibuka dan sebabnya dinyatakan. */
  var _jamLoading = null;

  function tunjukLoading(tunjuk) {
    var o = document.getElementById('loading-overlay');
    if (o) o.style.display = tunjuk ? 'flex' : 'none';
    if (_jamLoading) { clearTimeout(_jamLoading); _jamLoading = null; }
    if (!tunjuk) return;
    _jamLoading = setTimeout(function () {
      _jamLoading = null;
      if (o) o.style.display = 'none';
      tunjukToast('Pelayan tidak menjawab. Semak sambungan internet, atau ' +
                  'deployment Apps Script mungkin belum dikemas kini.', 'ralat');
    }, 20000);
  }

  function formatTarikh(tarikh) {
    if (!tarikh) return '-';
    try {
      return new Date(tarikh).toLocaleDateString('ms-MY');
    } catch (e) {
      return String(tarikh);
    }
  }

  // Pelayan menolak panggilan. Bezakan tiga sebab, kerana tindakan
  // guru bagi setiap satu berbeza.
  function kendaliRalat(e) {
    var kod = e && e.kod;
    if (kod === 'PERLU_LOGIN') {
      try { sessionStorage.clear(); } catch (x) {}
      tunjukLoading(false);
      tunjukToast('Sesi tamat. Sila log masuk semula.', 'ralat');
      setTimeout(function () { bukaLogin('guru'); }, 800);
      return true;
    }
    if (kod === 'DILARANG') {
      tunjukLoading(false);
      tunjukToast(e.message || 'Tiada kebenaran.', 'ralat');
      if (isTetamu()) setTimeout(function () { bukaLogin('guru'); }, 800);
      return true;
    }
    return false;
  }

  function sahHasil(hasil) {
    if (hasil === null || hasil === undefined) {
      tunjukLoading(false);
      tunjukToast('Sesi tamat. Sila log masuk semula.', 'ralat');
      setTimeout(function () { bukaLogin('guru'); }, 1200);
      return false;
    }
    return true;
  }

  // Halaman memanggil ini sebelum tindakan menulis. Ia menghalang
  // permintaan yang pasti ditolak daripada dihantar langsung.
  function perluTulis() {
    if (bolehTulis()) return true;
    tunjukToast('Sila log masuk sebagai guru untuk membuat perubahan.', 'ralat');
    bukaLogin('guru');
    return false;
  }

  // ---------- dedah ke global ----------

  window.AKSI = {
    token: token,
    peranan: peranan,
    nama: namaPengguna,
    isAdmin: isAdmin,
    isTetamu: isTetamu,
    bolehTulis: bolehTulis,
    perluTulis: perluTulis,
    sapuKawalanTulis: sapuKawalanTulis,
    initHalaman: initHalaman,
    sahHasil: sahHasil,
    kendaliRalat: kendaliRalat,
    bilaSedia: bilaSedia
  };

  window.logout = logout;
  window.pergiHalaman = pergiHalaman;
  window.togolSidebar = togolSidebar;
  window.tutupSidebar = tutupSidebar;
  window.tunjukToast = tunjukToast;
  window.tunjukLoading = tunjukLoading;
  window.formatTarikh = formatTarikh;
  window.initHalaman = initHalaman;
  window.getPeranan = peranan;
  window.isAdmin = isAdmin;
  window.bolehTulis = bolehTulis;
  window.perluTulis = perluTulis;
  window.bukaLogin = bukaLogin;
  window.tutupLogin = tutupLogin;
  window.pilihTabLogin = pilihTabLogin;
  window.hantarLogin = hantarLogin;
  window.kendaliRalat = kendaliRalat;

  // Halaman lama memanggil ini dan menjangka null bermakna "jangan teruskan".
  // Dalam mod tetamu ia mesti memulangkan token supaya paparan tetap dimuat.
  window.semakSesiAktif = function () { return token(); };
  window.pergiLogin = function () { bukaLogin('guru'); };
})();
