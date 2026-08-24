// Auth.gs
// v2 (20 Ogos 2026) — tambah had cubaan log masuk.
// Perubahan berbanding versi asal:
//   * login() menyekat ID selepas 5 cubaan gagal, selama 15 minit
//   * cubaan gagal direkod dalam CacheService, dikosongkan bila berjaya
//   * ID dibandingkan sebagai teks yang dipangkas (lebih tahan ralat)
// Selebihnya kekal sama.

var MAKS_CUBAAN = 5;
var TEMPOH_SEKAT_SAAT = 15 * 60;

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

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PENGGUNA');

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

      if (idPengguna === id && passwordHash === hash) {
        kosongkanCubaan_(id);
        var token = buatToken(id, peranan);
        logAktiviti(id, 'LOGIN', 'Berjaya log masuk');
        return { berjaya: true, token: token, peranan: peranan };
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

function semakSesi(token) {
  if (!token) return null;
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

function logout(token) {
  if (!token) return;
  PropertiesService.getScriptProperties()
    .deleteProperty('SESI_' + token);
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
