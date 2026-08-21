// WebBackend.gs
// Fail BAHARU (20 Ogos 2026) — sokongan untuk muka depan
// GitHub Pages. Tidak mengubah apa-apa fungsi sedia ada.
//
// Tiga perkara:
//   1. getIdentitiAwam()  — nama/tahun/logo untuk skrin log masuk
//   2. getSidebarData()   — ganti renderSidebar() yang dulu HTML
//   3. cuciSesiLama()     — buang sesi tamat tempoh yang bertimbun
//
// Selepas menampal, tambah dua nama ini ke API_DIBENARKAN
// dalam Code.gs:  'getIdentitiAwam', 'getSidebarData'

// ============================================
// 1. Identiti sekolah untuk halaman log masuk.
//    Sengaja TIDAK memerlukan token — skrin log masuk
//    belum ada token. Hanya tiga medan dipulangkan,
//    bukan keseluruhan tab TETAPAN.
// ============================================
function getIdentitiAwam() {
  try {
    var t = getTetapan() || {};
    return {
      namaSekolah: t.NAMA_SEKOLAH || '',
      tahunAkademik: t.TAHUN_AKADEMIK || '',
      logo: t.LOGO || ''
    };
  } catch(e) {
    return { namaSekolah: '', tahunAkademik: '', logo: '' };
  }
}

// ============================================
// 2. Data sidebar untuk halaman dalam.
//    Perlu token — ini di sebalik log masuk.
// ============================================
function getSidebarData(token) {
  var sesi = semakSesi(token);
  if (!sesi) return null;
  var t = getTetapan() || {};
  return {
    namaSekolah: t.NAMA_SEKOLAH || '',
    tahunAkademik: t.TAHUN_AKADEMIK || '',
    logo: t.LOGO || '',
    peranan: sesi.peranan,
    versi: (typeof VERSI_SISTEM !== 'undefined') ?
      VERSI_SISTEM : ''
  };
}

// ============================================
// 3. Cuci sesi lama.
//    buatToken() menulis satu Script Property setiap kali
//    seseorang log masuk. semakSesi() hanya memadam sesi
//    yang dibaca semula selepas tamat tempoh — sesi yang
//    ditinggalkan kekal selamanya. Script Properties ada
//    had 500 KB; bila penuh, log masuk mula gagal.
//
//    Jalankan pasangPemicuCuciSesi() SEKALI untuk memasang
//    pemicu harian. Selepas itu ia berjalan sendiri.
// ============================================
function cuciSesiLama() {
  var props = PropertiesService.getScriptProperties();
  var semua = props.getProperties();
  var lapanJam = 8 * 60 * 60 * 1000;
  var sekarang = new Date().getTime();
  var jumlah = 0, dibuang = 0;

  for (var kunci in semua) {
    if (kunci.indexOf('SESI_') !== 0) continue;
    jumlah++;
    var masihSah = false;
    try {
      var sesi = JSON.parse(semua[kunci]);
      masihSah = (sekarang - sesi.masa) <= lapanJam;
    } catch(e) {
      masihSah = false;   // rosak = buang
    }
    if (!masihSah) {
      props.deleteProperty(kunci);
      dibuang++;
    }
  }

  var mesej = 'Sesi diperiksa: ' + jumlah +
              ', dibuang: ' + dibuang +
              ', tinggal: ' + (jumlah - dibuang);
  Logger.log(mesej);
  return mesej;
}

function pasangPemicuCuciSesi() {
  var adaSudah = ScriptApp.getProjectTriggers()
    .filter(function(t) {
      return t.getHandlerFunction() === 'cuciSesiLama';
    });
  adaSudah.forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('cuciSesiLama')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  return 'Pemicu harian cuciSesiLama dipasang (kira-kira 3 pagi). ' +
         'Pemicu lama yang sama dibuang: ' + adaSudah.length;
}
