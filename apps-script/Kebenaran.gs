/* =====================================================================
   Kebenaran.gs — satu-satunya pintu masuk web AKSI.
   Baharu: 23 Ogos 2026.

   SEBELUM MEMASANG: buang dari Code.gs
     • seluruh fungsi  doPost(e)
     • seluruh array   var API_DIBENARKAN = [...]
   Dua doPost dalam satu projek Apps Script = tingkah laku tidak
   menentu. Fail ini menggantikan kedua-duanya.

   Model kebenaran — empat peranan, satu tempat:

     (tiada sesi)  hanya boleh log masuk dan lihat identiti sekolah
     tetamu        baca sahaja; tiada tambah, edit atau padam
     guru          baca + tulis kerja harian
     admin         semua, termasuk tetapan dan import

   Peraturan: senarai IZIN, bukan senarai LARANG. Fungsi baharu yang
   tidak disenaraikan akan DITOLAK secara lalai. Ini disengajakan —
   terlupa menyenaraikan fungsi baharu menyebabkan ia tidak berfungsi
   dan cepat disedari; terlupa melarangnya menyebabkan lubang senyap.
   ===================================================================== */

var TOKEN_TETAMU = 'TETAMU';

/* Nombor IC murid dilindungi daripada pelawat yang tidak log masuk.
   Tukar kepada false untuk memaparkan IC penuh kepada sesiapa sahaja
   yang membuka alamat AKSI — termasuk orang di luar sekolah. */
var TETAMU_LINDUNG_IC = true;

/* --- boleh dipanggil tanpa sesi langsung --- */
var API_TANPA_SESI = [
  'login', 'getIdentitiAwam', 'senaraiGuruLogin'
];

/* --- tetamu: BACA sahaja ---------------------------------------------
   Sengaja tidak termasuk getTetapan(): ia memulangkan seluruh tab
   TETAPAN. getIdentitiAwam() memberi tiga medan yang benar-benar
   diperlukan oleh muka depan. */
var API_TETAMU = [
  'getSidebarData', 'getDashboardSemua',
  'getStatistikDashboard', 'getAmaranDashboard',
  'getPerjumpaanTerkini', 'getStatusLaporan',
  'getSenaraiMurid', 'getSenaraiKelab', 'getSenaraiKelabPenuh',
  'getSenaraiGuru', 'getPerjumpaanKelab', 'getKehadiran',
  'getLaporan', 'getSenaraiPencapaian',
  'getPenilaianMurid', 'getEkstraMurid', 'getSenaraiJawatanKelab',
  'getMarkahPenglibatan', 'getAhliKelab', 'getKeahlianMuridPenilaian',
  'getSenaraiPAJSK', 'getAnggaranMurid', 'getAnggaranKelas',
  'getPeneranganGred', 'getDataKeahlianKelab',
  'getSenaraiJenisKoku', 'getSemakanKeahlian',
  'getSenaraiKelasAktif', 'getSenaraiIkutKelas',
  'cariMuridUntukKeahlian', 'exportTemplateKoku'
];

/* --- guru: semua yang tetamu boleh, tambah kerja harian --- */
var API_GURU = [
  'logout', 'tukarKataLaluanSendiri',
  'buatPerjumpaan', 'simpanKehadiran', 'padamPerjumpaan',
  'simpanLaporan', 'padamLaporan',
  'tambahPencapaian', 'padamPencapaian',
  'simpanKomitmen', 'simpanKhidmat', 'simpanPenglibatan',
  'simpanJawatan', 'simpanEkstra',
  'kiraPAJSK', 'simpanAnggaranKeRekod',
  'tambahAhliKelab', 'buangAhliKelab',
  'tukarJawatanAhli', 'tukarKelabAhli'
];

/* --- admin sahaja: tetapan, import, akaun, arkib --- */
var API_ADMIN = [
  'kemaskiniTetapan', 'simpanLogo', 'getTetapanAdmin',
  'importMurid', 'importKeahlian', 'importGuru',
  'tambahKelab', 'togolStatusKelab', 'padamKelab', 'tukarJenisKelab',
  'tambahGuru', 'padamGuru',
  'padamKeahlianKekal',
  'getStatusArkib', 'tutupTahunAkademik',
  'buatBackupManual', 'togolBackupAutomatik',
  'jalankanSetup', 'semakSetup',
  'tukarKataLaluanAdmin', 'tukarKataLaluanGuru',
  'pastikanAkaunGuru', 'bukaSekatan'
];

/** Peranan yang dibenarkan memanggil fungsi ini, atau null jika tidak. */
function kebenaranFungsi_(fn, peranan) {
  if (API_TANPA_SESI.indexOf(fn) !== -1) return true;
  if (!peranan) return false;
  if (API_TETAMU.indexOf(fn) !== -1) return true;           // semua peranan
  if (peranan === 'tetamu') return false;
  if (API_GURU.indexOf(fn) !== -1) return true;             // guru dan admin
  if (peranan === 'guru') return false;
  return API_ADMIN.indexOf(fn) !== -1;                      // admin sahaja
}

/** Peranan pemanggil berdasarkan token. Null bermakna tiada sesi. */
function perananToken_(token) {
  if (!token) return null;
  var sesi = semakSesi(token);
  return sesi ? String(sesi.peranan || '') : null;
}

/* --- perlindungan IC untuk tetamu -------------------------------------
   Ditapis di PELAYAN, bukan di pelayar. Menyembunyikan IC dengan CSS
   tidak melindungi apa-apa — sesiapa boleh membuka panel rangkaian dan
   membacanya. Kalau ia tidak sepatutnya keluar, ia tidak boleh dihantar. */

var RE_IC = /\b(\d{12})\b/g;

function tutupIc_(ic) {
  return '••••••••' + String(ic).slice(-4);
}

function lindungIc_(nilai, dalam) {
  dalam = dalam || 0;
  if (dalam > 12 || nilai === null || nilai === undefined) return nilai;
  var jenis = typeof nilai;
  if (jenis === 'string') return nilai.replace(RE_IC, function (m) { return tutupIc_(m); });
  if (jenis === 'number') {
    var s = String(nilai);
    return /^\d{12}$/.test(s) ? tutupIc_(s) : nilai;
  }
  if (Object.prototype.toString.call(nilai) === '[object Array]') {
    return nilai.map(function (x) { return lindungIc_(x, dalam + 1); });
  }
  if (jenis === 'object') {
    var keluar = {};
    for (var k in nilai) {
      if (Object.prototype.hasOwnProperty.call(nilai, k)) {
        keluar[k] = lindungIc_(nilai[k], dalam + 1);
      }
    }
    return keluar;
  }
  return nilai;
}

/* --- pintu masuk ------------------------------------------------------ */

function doPost(e) {
  var jawapan;
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = String(req.fn || '');
    /* Token dalam sampul. Halaman lama menghantarnya sebagai hujah
       pertama juga; kedua-duanya diterima supaya tiada yang patah. */
    var token = req.token || (req.args && req.args[0]) || '';
    var peranan = perananToken_(token);

    if (!kebenaranFungsi_(fn, peranan)) {
      jawapan = { ok: false, kod: peranan ? 'DILARANG' : 'PERLU_LOGIN',
                  ralat: peranan === 'tetamu'
                    ? 'Sila log masuk sebagai guru untuk membuat perubahan.'
                    : (peranan ? 'Tindakan ini untuk admin sahaja.'
                               : 'Sesi tamat. Sila log masuk semula.') };
      return balas_(jawapan);
    }

    var fungsi = this[fn];
    if (typeof fungsi !== 'function') {
      return balas_({ ok: false, ralat: 'Fungsi tidak dijumpai.' });
    }

    var hasil = fungsi.apply(null, req.args || []);
    if (peranan === 'tetamu' && TETAMU_LINDUNG_IC) hasil = lindungIc_(hasil);
    jawapan = { ok: true, hasil: hasil };
  } catch (err) {
    jawapan = { ok: false, ralat: err.toString() };
  }
  return balas_(jawapan);
}

function balas_(jawapan) {
  return ContentService
    .createTextOutput(JSON.stringify(jawapan))
    .setMimeType(ContentService.MimeType.JSON);
}
