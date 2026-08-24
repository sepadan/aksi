// Auth.gs
// v3 (23 Ogos 2026) — log masuk gaya SEMAK.
// Perubahan berbanding v2:
//   * sesi tetamu: token tetap 'TETAMU', peranan 'tetamu', baca sahaja
//   * senaraiGuruLogin() — nama guru untuk dropdown log masuk
//   * pastikanAkaunGuru() — setiap guru dalam tab GURU dapat akaun
//   * tukarKataLaluanAdmin() / tukarKataLaluanGuru() dari halaman Tetapan
//   * tukarKataLaluanSendiri() — guru menukar kata laluan sendiri
// Had cubaan log masuk (v2) kekal tidak berubah.

var MAKS_CUBAAN = 5;
var TEMPOH_SEKAT_SAAT = 15 * 60;
var KATA_LALUAN_LALAI_GURU = 'guru';
var PANJANG_MIN_KATA_LALUAN = 4;

function hashPassword(password) {
  var rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return rawHash.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// ---- had cubaan -------------------------------------------

function kunciCubaan_(id) {
  return 'CUBA_' + String(id).toLowerCase();
}

function bacaCubaan_(id) {
  try {
    var n = CacheService.getScriptCache().get(kunciCubaan_(id));
    return n ? parseInt(n, 10) : 0;
  } catch(e) {
    return 0;
  }
}

function catatGagal_(id) {
  try {
    var n = bacaCubaan_(id) + 1;
    CacheService.getScriptCache()
      .put(kunciCubaan_(id), String(n), TEMPOH_SEKAT_SAAT);
    return n;
  } catch(e) {
    return 0;
  }
}

function kosongkanCubaan_(id) {
  try {
    CacheService.getScriptCache().remove(kunciCubaan_(id));
  } catch(e) {}
}

// Untuk admin: buka semula ID yang tersekat tanpa menunggu.
function bukaSekatan(id) {
  kosongkanCubaan_(id);
  return 'Sekatan untuk "' + id + '" dibuka.';
}

// ---- tab PENGGUNA -----------------------------------------

function tabPengguna_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('PENGGUNA');
}

/** Cari baris pengguna mengikut ID. Pulangkan nombor baris atau -1. */
function cariBarisPengguna_(sheet, id) {
  var data = sheet.getDataRange().getValues();
  var sasar = String(id || '').trim().toUpperCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toUpperCase() === sasar) return i + 1;
  }
  return -1;
}

/** Nama guru dari tab GURU, dibersihkan dan disusun. */
function namaGuruSemua_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('GURU');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var nampak = {}, keluar = [];
  for (var i = 1; i < data.length; i++) {
    var nama = String(data[i][1] || '').trim();   // ID_GURU, NAMA_GURU, JAWATAN
    if (!nama) continue;
    var kunci = nama.toUpperCase();
    if (nampak[kunci]) continue;
    nampak[kunci] = true;
    keluar.push(nama);
  }
  return keluar.sort(function (a, b) { return a.localeCompare(b, 'ms'); });
}

/**
 * Nama guru untuk dropdown log masuk.
 * Sengaja TIDAK memerlukan sesi — dropdown dipaparkan sebelum log masuk.
 * Hanya nama dipulangkan; tiada kata laluan, tiada hash, tiada jawatan.
 */
function senaraiGuruLogin() {
  try {
    return namaGuruSemua_();
  } catch (e) {
    return [];
  }
}

/**
 * Pastikan setiap guru dalam tab GURU ada akaun dalam tab PENGGUNA.
 * Guru baharu diberi kata laluan lalai 'guru'.
 * Akaun sedia ada TIDAK disentuh — kata laluan yang sudah ditukar kekal.
 */
function pastikanAkaunGuru(token) {
  var sheet = tabPengguna_();
  if (!sheet) return { berjaya: false, mesej: 'Tab PENGGUNA tiada.' };

  var data = sheet.getDataRange().getValues();
  var ada = {};
  for (var i = 1; i < data.length; i++) {
    ada[String(data[i][0] || '').trim().toUpperCase()] = true;
  }

  var hashLalai = hashPassword(KATA_LALUAN_LALAI_GURU);
  var baharu = [];
  namaGuruSemua_().forEach(function (nama) {
    if (ada[nama.toUpperCase()]) return;
    sheet.appendRow([nama, 'guru', hashLalai]);
    baharu.push(nama);
  });

  logAktiviti(sesiId_(token), 'AKAUN_GURU',
      baharu.length + ' akaun guru baharu dibuat');
  return { berjaya: true, baharu: baharu.length, nama: baharu };
}

// ---- log masuk --------------------------------------------

function login(id, password) {
  try {
    id = String(id === null || id === undefined ? '' : id).trim();

    if (!id || !password) {
      return { berjaya: false,
               mesej: 'Sila masukkan ID dan password.' };
    }

    if (bacaCubaan_(id) >= MAKS_CUBAAN) {
      return {
        berjaya: false,
        mesej: 'Terlalu banyak cubaan gagal. ' +
               'Cuba lagi dalam 15 minit.'
      };
    }

    var sheet = tabPengguna_();
    if (!sheet) {
      return { berjaya: false,
               mesej: 'Sistem tidak dikonfigurasi.' };
    }

    var data = sheet.getDataRange().getValues();
    var hash = hashPassword(password);

    for (var i = 1; i < data.length; i++) {
      var idPengguna = String(data[i][0] === null ||
        data[i][0] === undefined ? '' : data[i][0]).trim();
      var peranan = data[i][1];
      var passwordHash = data[i][2];

      // Nama guru dibandingkan tanpa mengira huruf besar/kecil —
      // ia datang dari dropdown, bukan ditaip, tetapi ejaan dalam
      // tab GURU dan tab PENGGUNA boleh berbeza hurufnya.
      if (idPengguna.toUpperCase() === id.toUpperCase() &&
          passwordHash === hash) {
        kosongkanCubaan_(id);
        var token = buatToken(idPengguna, peranan);
        logAktiviti(idPengguna, 'LOGIN', 'Berjaya log masuk');
        return { berjaya: true, token: token, peranan: peranan,
                 nama: idPengguna };
      }
    }

    var kali = catatGagal_(id);
    if (kali >= MAKS_CUBAAN) {
      logAktiviti(id, 'LOGIN_DISEKAT',
        'Disekat 15 minit selepas ' + kali + ' cubaan gagal');
      return {
        berjaya: false,
        mesej: 'Terlalu banyak cubaan gagal. ' +
               'Cuba lagi dalam 15 minit.'
      };
    }

    var baki = MAKS_CUBAAN - kali;
    return {
      berjaya: false,
      mesej: 'ID atau password tidak betul.' +
        (baki > 0 && baki <= 2 ?
          ' Tinggal ' + baki + ' cubaan.' : '')
    };
  } catch(e) {
    return { berjaya: false,
             mesej: 'Ralat sistem: ' + e.toString() };
  }
}

function buatToken(id, peranan) {
  var token = Utilities.getUuid();
  var sesi = {
    id: id,
    peranan: peranan,
    masa: new Date().getTime()
  };
  PropertiesService.getScriptProperties()
    .setProperty('SESI_' + token,
      JSON.stringify(sesi));
  return token;
}

/**
 * Sesi tetamu tidak disimpan di mana-mana.
 *
 * Kalau setiap pelawat yang tidak log masuk menulis satu Script Property,
 * kuota 500 KB habis dan LOG MASUK SEBENAR mula gagal — pelawat awam
 * menjatuhkan guru. Token tetap yang dikenali di sini tidak menyimpan
 * apa-apa, jadi bilangan pelawat tidak lagi menjadi risiko.
 */
function semakSesi(token) {
  if (!token) return null;

  if (token === TOKEN_TETAMU) {
    return { id: 'tetamu', peranan: 'tetamu', masa: new Date().getTime() };
  }

  var prop = PropertiesService.getScriptProperties()
    .getProperty('SESI_' + token);
  if (!prop) return null;

  var sesi = JSON.parse(prop);
  var lapan_jam = 8 * 60 * 60 * 1000;
  var sekarang = new Date().getTime();

  if (sekarang - sesi.masa > lapan_jam) {
    PropertiesService.getScriptProperties()
      .deleteProperty('SESI_' + token);
    return null;
  }
  return sesi;
}

function sesiId_(token) {
  var s = semakSesi(token);
  return s ? s.id : '(tiada sesi)';
}

function logout(token) {
  if (!token || token === TOKEN_TETAMU) return;
  PropertiesService.getScriptProperties()
    .deleteProperty('SESI_' + token);
}

// ---- tukar kata laluan ------------------------------------

function sahKataLaluan_(baharu) {
  baharu = String(baharu === null || baharu === undefined ? '' : baharu);
  if (baharu.length < PANJANG_MIN_KATA_LALUAN) {
    return 'Kata laluan mesti sekurang-kurangnya ' +
           PANJANG_MIN_KATA_LALUAN + ' aksara.';
  }
  return null;
}

/** Tulis hash baharu. Pulangkan true jika baris pengguna dijumpai. */
function tulisKataLaluan_(id, baharu) {
  var sheet = tabPengguna_();
  if (!sheet) return false;
  var baris = cariBarisPengguna_(sheet, id);
  if (baris === -1) return false;
  sheet.getRange(baris, 3).setValue(hashPassword(baharu));
  return true;
}

/**
 * Tukar kata laluan admin. Admin sahaja.
 * Kebenaran ditapis dalam doPost; semakan di sini ialah lapisan kedua,
 * kerana fungsi ini juga boleh dipanggil dari editor Apps Script.
 */
function tukarKataLaluanAdmin(token, baharu) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin') {
    return { berjaya: false, mesej: 'Tindakan ini untuk admin sahaja.' };
  }
  var ralat = sahKataLaluan_(baharu);
  if (ralat) return { berjaya: false, mesej: ralat };

  var sheet = tabPengguna_();
  if (!sheet) return { berjaya: false, mesej: 'Tab PENGGUNA tiada.' };

  var data = sheet.getDataRange().getValues();
  var bil = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() === 'admin') {
      sheet.getRange(i + 1, 3).setValue(hashPassword(baharu));
      bil++;
    }
  }
  if (!bil) return { berjaya: false, mesej: 'Tiada akaun admin dijumpai.' };

  logAktiviti(sesi.id, 'TUKAR_KATA_LALUAN', 'Kata laluan admin ditukar');
  return { berjaya: true,
           mesej: 'Kata laluan admin ditukar. Log masuk semula diperlukan.' };
}

/** Tukar kata laluan seorang guru. Admin sahaja. */
function tukarKataLaluanGuru(token, namaGuru, baharu) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin') {
    return { berjaya: false, mesej: 'Tindakan ini untuk admin sahaja.' };
  }
  namaGuru = String(namaGuru || '').trim();
  if (!namaGuru) return { berjaya: false, mesej: 'Sila pilih guru.' };

  var ralat = sahKataLaluan_(baharu);
  if (ralat) return { berjaya: false, mesej: ralat };

  if (!tulisKataLaluan_(namaGuru, baharu)) {
    return { berjaya: false,
             mesej: 'Guru "' + namaGuru + '" tiada akaun. ' +
                    'Tekan "Segerak Akaun Guru" dahulu.' };
  }
  kosongkanCubaan_(namaGuru);
  logAktiviti(sesi.id, 'TUKAR_KATA_LALUAN', 'Kata laluan ' + namaGuru + ' ditukar');
  return { berjaya: true, mesej: 'Kata laluan ' + namaGuru + ' ditukar.' };
}

/** Guru menukar kata laluan sendiri. Tidak boleh menukar orang lain. */
function tukarKataLaluanSendiri(token, lama, baharu) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan === 'tetamu') {
    return { berjaya: false, mesej: 'Sila log masuk dahulu.' };
  }
  var sheet = tabPengguna_();
  if (!sheet) return { berjaya: false, mesej: 'Tab PENGGUNA tiada.' };

  var baris = cariBarisPengguna_(sheet, sesi.id);
  if (baris === -1) return { berjaya: false, mesej: 'Akaun tidak dijumpai.' };

  if (sheet.getRange(baris, 3).getValue() !== hashPassword(lama)) {
    return { berjaya: false, mesej: 'Kata laluan lama tidak betul.' };
  }
  var ralat = sahKataLaluan_(baharu);
  if (ralat) return { berjaya: false, mesej: ralat };

  sheet.getRange(baris, 3).setValue(hashPassword(baharu));
  logAktiviti(sesi.id, 'TUKAR_KATA_LALUAN', 'Kata laluan sendiri ditukar');
  return { berjaya: true, mesej: 'Kata laluan ditukar.' };
}

function logAktiviti(pengguna, tindakan, butiran) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('LOG_AKTIVITI');
    if (!sheet) return;
    var masa = new Date().toLocaleString('ms-MY');
    sheet.appendRow([masa, pengguna, tindakan, butiran]);
  } catch(e) {}
}
