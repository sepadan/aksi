// KelabBackend.gs

function getSenaraiKelabPenuh(token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('KELAB');
  var data = sheet.getDataRange().getValues().slice(1);
  return data.filter(function(r) {
    return r[0];
  }).map(function(r) {
    return {
      id: r[0], nama: r[1], kategori: r[2],
      jenis: r[3], guru1: r[4], guru2: r[5],
      status: r[6]
    };
  });
}

function tambahKelab(data, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  return denganKunciDokumen_('Tambah kelab', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues()
      .slice(1);

    // Semak nama duplicate
    var namaBaru = data.nama.trim().toUpperCase();
    var wujud = rekod.filter(function(r) {
      return r[1] &&
        r[1].toString().trim().toUpperCase() ===
        namaBaru;
    })[0];
    if (wujud) {
      return {
        berjaya: false,
        mesej: 'Kelab "' + data.nama +
          '" sudah wujud.'
      };
    }

    var idBaru = 'K' + new Date().getTime();
    sheet.appendRow([
      idBaru, namaBaru, data.kategori,
      data.jenis || '', data.guru1 || '',
      data.guru2 || '', 'AKTIF'
    ]);

    cacheBuang('KELAB_AKTIF_V1');
    batalCacheAnggaran_();
    logAktiviti(sesi.id, 'TAMBAH_KELAB',
      'Kelab: ' + namaBaru);
    return { berjaya: true, id: idBaru };
  });
}

function editKelab(id, data, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  return denganKunciDokumen_('Edit kelab', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[
          data.nama.trim().toUpperCase(),
          data.kategori,
          data.jenis || '',
          data.guru1 || '',
          data.guru2 || '',
          data.status || 'AKTIF'
        ]]);
        cacheBuang('KELAB_AKTIF_V1');
        batalCacheAnggaran_();
        logAktiviti(sesi.id, 'EDIT_KELAB',
          'ID: ' + id);
        return { berjaya: true };
      }
    }
    return {
      berjaya: false,
      mesej: 'Kelab tidak dijumpai.'
    };
  });
}

function togolStatusKelab(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  return denganKunciDokumen_('Tukar status kelab', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        var statusBaru = rekod[i][6] === 'AKTIF' ?
          'TIDAK AKTIF' : 'AKTIF';
        sheet.getRange(i + 1, 7).setValue(statusBaru);
        cacheBuang('KELAB_AKTIF_V1');
        batalCacheAnggaran_();
        logAktiviti(sesi.id, 'TOGOL_KELAB',
          'ID: ' + id + ' → ' + statusBaru);
        return { berjaya: true, status: statusBaru };
      }
    }
    return {
      berjaya: false,
      mesej: 'Kelab tidak dijumpai.'
    };
  });
}

function tambahGuru(nama, jawatan, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  var guruSync = [];
  var hasilTambah = denganKunciDokumen_('Tambah guru', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GURU');
    pastikanSkemaGuru_(sheet);
    nama = String(nama || '').trim().replace(/\s+/g, ' ').toUpperCase();
    jawatan = String(jawatan || '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!nama) return { berjaya: false, mesej: 'Nama guru diperlukan.' };
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues() : [];
    var baris = -1, maksimum = 0;
    data.forEach(function (r, i) {
      if (String(r[1] || '').trim().toUpperCase() === nama) baris = i;
      var n = parseInt(String(r[0] || '').replace(/^G/i, ''), 10);
      if (isFinite(n)) maksimum = Math.max(maksimum, n);
    });
    var idBaru;
    if (baris >= 0) {
      idBaru = data[baris][0];
      if (jawatan) data[baris][2] = jawatan;
      data[baris][3] = 'AKTIF';
      sheet.getRange(2, 1, data.length, 4).setValues(data);
    } else {
      idBaru = 'G' + (maksimum + 1);
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, 4)
        .setValues([[idBaru, nama, jawatan, 'AKTIF']]);
    }
    guruSync = [{ nama: nama, jawatan: jawatan }];
    logAktiviti(sesi.id, 'TAMBAH_GURU',
      'ID: ' + idBaru);
    return { berjaya: true, id: idBaru };
  });
  if (hasilTambah && hasilTambah.berjaya)
    hasilTambah.sync = sepadanHantarKeHadir_('guru', guruSync, 'AKSI', 'merge');
  return hasilTambah;
}

function padamGuru(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };

  var guruAktif = [];
  var hasilPadam = denganKunciDokumen_('Nyahaktif guru', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('GURU');
    pastikanSkemaGuru_(sheet);
    var rekod = sheet.getRange(1, 1, sheet.getLastRow(), 4).getValues();

    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        rekod[i][3] = 'TIDAK AKTIF';
        if (rekod.length > 1) sheet.getRange(2, 1, rekod.length - 1, 4).setValues(rekod.slice(1));
        guruAktif = rekod.slice(1).filter(function (r) {
          return String(r[3] || 'AKTIF').trim().toUpperCase() !== 'TIDAK AKTIF';
        }).map(function (r) { return { nama: r[1], jawatan: r[2] }; });
        logAktiviti(sesi.id, 'NYAHAKTIF_GURU',
          'ID: ' + id);
        return { berjaya: true, mesej: 'Guru dinyahaktifkan; akaun dan sejarah dikekalkan.' };
      }
    }
    return {
      berjaya: false,
      mesej: 'Guru tidak dijumpai.'
    };
  });
  if (hasilPadam && hasilPadam.berjaya)
    hasilPadam.sync = sepadanHantarKeHadir_('guru', guruAktif, 'AKSI', 'sync');
  return hasilPadam;
}

function pastikanSkemaGuru_(sheet) {
  if (!sheet) throw new Error('Tab GURU tidak ditemui.');
  if (sheet.getMaxColumns() < 4) sheet.insertColumnsAfter(sheet.getMaxColumns(), 4 - sheet.getMaxColumns());
  if (!sheet.getRange(1, 4).getValue()) {
    sheet.getRange(1, 4).setValue('STATUS');
    if (sheet.getLastRow() > 1) sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).setValue('AKTIF');
  }
}

/**
 * ADMIN SAHAJA: Padam koku secara kekal.
 * Disekat jika masih ada data keahlian atau
 * perjumpaan berkaitan (guna Nyahaktif untuk itu).
 */
function padamKelab(id, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false,
             mesej: 'Hanya admin boleh memadam.' };

  return denganKunciDokumen_('Padam kelab', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Semak data berkaitan
    var adaKeahlian = ss.getSheetByName('KEAHLIAN')
      .getDataRange().getValues().slice(1)
      .some(function(r) { return r[1] === id; });
    var adaPerjumpaan = ss.getSheetByName('PERJUMPAAN')
      .getDataRange().getValues().slice(1)
      .some(function(r) { return r[1] === id; });

    if (adaKeahlian || adaPerjumpaan) {
      return {
        berjaya: false,
        mesej: 'Tidak boleh dipadam — masih ada data ' +
          (adaKeahlian ? 'keahlian' : '') +
          (adaKeahlian && adaPerjumpaan ? ' dan ' : '') +
          (adaPerjumpaan ? 'perjumpaan' : '') +
          ' berkaitan. Gunakan Nyahaktif.'
      };
    }

    var sheet = ss.getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();
    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.deleteRow(i + 1);
        logAktiviti(sesi.id, 'PADAM_KELAB', 'ID:' + id);
        cacheBuang('KELAB_AKTIF_V1');
        batalCacheAnggaran_();
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Rekod tidak dijumpai.' };
  });
}


/**
 * TUKAR JENIS KOKU (v4.0, admin sahaja)
 * Jenis menentukan jadual jawatan PAJSK yang
 * digunakan (cth: Pengakap, PBSM). 'Umum' =
 * jadual jawatan lalai.
 */
function tukarJenisKelab(id, jenis, token) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };
  return denganKunciDokumen_('Tukar jenis kelab', function() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('KELAB');
    var rekod = sheet.getDataRange().getValues();
    for (var i = 1; i < rekod.length; i++) {
      if (rekod[i][0] === id) {
        sheet.getRange(i + 1, 4)
          .setValue(jenis === 'Umum' ? '' : jenis);
        batalCacheAnggaran_();
        logAktiviti(sesi.id, 'TUKAR_JENIS_KOKU',
          'ID: ' + id + ' → ' + jenis);
        return { berjaya: true };
      }
    }
    return { berjaya: false,
             mesej: 'Koku tidak dijumpai.' };
  });
}


/**
 * IMPORT GURU PUKAL (v4.3, admin sahaja)
 * Terima array nama atau objek {nama, jawatan}. Rekod sedia ada dikekalkan;
 * jawatan hanya dikemas kini jika nilai baharu tidak kosong.
 */
function importGuru(senaraiNama, token, asalSync, mod) {
  var sesi = semakSesi(token);
  if (!sesi || sesi.peranan !== 'admin')
    return { berjaya: false, mesej: 'Akses ditolak.' };
  mod = String(mod || 'merge').toLowerCase() === 'sync' ? 'sync' : 'merge';
  var guruSync = [];
  var hasilImport = denganKunciDokumen_('Import guru', function() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('GURU');
    pastikanSkemaGuru_(sheet);
    var data = sheet.getRange(1, 1, sheet.getLastRow(), 4).getValues();
    var sedia = {}, maksimum = 0;
    data.slice(1).forEach(function(r, i) {
      var nama = String(r[1] || '').trim().toUpperCase();
      if (nama && sedia[nama] === undefined) sedia[nama] = i + 1;
      var nombor = parseInt(String(r[0] || '').replace(/^G/i, ''), 10);
      if (isFinite(nombor)) maksimum = Math.max(maksimum, nombor);
    });

    var baris = [], kemasKini = 0, langkau = 0, dilihat = {};
    (senaraiNama || []).forEach(function(item) {
      var nama = String(item && typeof item === 'object' ? (item.nama || '') : (item || ''))
        .trim().replace(/\s+/g, ' ').toUpperCase();
      var jawatan = String(item && typeof item === 'object' ? (item.jawatan || '') : '')
        .trim().replace(/\s+/g, ' ').toUpperCase();
      if (!nama || dilihat[nama]) { langkau++; return; }
      dilihat[nama] = true;
      guruSync.push({ nama: nama, jawatan: jawatan });
      if (sedia[nama] !== undefined) {
        var indeks = sedia[nama];
        if (jawatan && String(data[indeks][2] || '').trim().toUpperCase() !== jawatan) {
          data[indeks][2] = jawatan;
          kemasKini++;
        }
        if (String(data[indeks][3] || 'AKTIF').trim().toUpperCase() === 'TIDAK AKTIF') {
          data[indeks][3] = 'AKTIF';
          kemasKini++;
        } else if (!jawatan || String(data[indeks][2] || '').trim().toUpperCase() === jawatan) langkau++;
        return;
      }
      maksimum++;
      sedia[nama] = data.length - 1 + baris.length;
      baris.push(['G' + maksimum, nama, jawatan, 'AKTIF']);
    });
    var nyahaktif = 0;
    if (mod === 'sync') {
      data.slice(1).forEach(function (r) {
        var nama = String(r[1] || '').trim().toUpperCase();
        if (nama && !dilihat[nama] && String(r[3] || 'AKTIF').trim().toUpperCase() !== 'TIDAK AKTIF') {
          r[3] = 'TIDAK AKTIF';
          nyahaktif++;
        }
      });
    }
    if (data.length > 1) sheet.getRange(2, 1, data.length - 1, 4).setValues(data.slice(1));
    if (baris.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1,
        baris.length, 4).setValues(baris);
    }
    logAktiviti(sesi.id, 'IMPORT_GURU',
      'Tambah:' + baris.length +
      ' KemasKini:' + kemasKini +
      ' Nyahaktif:' + nyahaktif + ' Langkau:' + langkau);
    return { berjaya: true, tambah: baris.length,
             kemasKini: kemasKini, nyahaktif: nyahaktif, langkau: langkau };
  });
  if (hasilImport && hasilImport.berjaya) {
    hasilImport.akaun = pastikanAkaunGuru(token);
    if (String(asalSync || '').toUpperCase() !== 'HADIR') {
      hasilImport.sync = sepadanHantarKeHadir_('guru', guruSync, 'AKSI', mod);
    }
  }
  return hasilImport;
}
