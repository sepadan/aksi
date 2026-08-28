// Murid.gs

function importMurid(csvText, token, asalSync) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };

  var rekodSync = [];
  var hasilImport = denganKunciDokumen_('Import data murid', function() {
    // Buang BOM & pecah baris (sokong CRLF Windows)
    var baris = csvText.replace(/^\uFEFF/, '')
      .trim().split(/\r?\n/);

    var IC_CAND = ['NO. PENGENALAN', 'NO PENGENALAN',
      'NO KP', 'NO. KP', 'MYKID', 'NO KAD', 'IC'];
    var NAMA_CAND = ['NAMA MURID', 'NAMA PENUH', 'NAMA'];

    // AUTO-KESAN baris header (fail iDMe ada baris
    // tajuk hiasan sebelum header sebenar)
    var idxHeader = -1;
    var header = null;
    var hadKesan = Math.min(baris.length, 20);
    for (var b = 0; b < hadKesan; b++) {
      var h = pecahCSV(baris[b]).map(function(x) {
        return x.trim().replace(/"/g, '');
      });
      if (cariIndeks(h, IC_CAND) !== -1 &&
          cariIndeks(h, NAMA_CAND) !== -1) {
        idxHeader = b;
        header = h;
        break;
      }
    }

    if (idxHeader === -1) {
      return {
        berjaya: false,
        mesej: 'Lajur IC/MyKid atau Nama tidak ' +
          'dijumpai dalam 20 baris pertama fail.'
      };
    }

    var idx = {
      ic: cariIndeks(header, IC_CAND),
      nama: cariIndeks(header, NAMA_CAND),
      tahun: cariIndeks(header,
        ['TAHUN / TINGKATAN', 'TAHUN', 'TINGKATAN']),
      kelas: cariIndeks(header,
        ['NAMA KELAS', 'KELAS']),
      jantina: cariIndeks(header,
        ['JANTINA', 'JENIS KELAMIN']),
      agama: cariIndeks(header, ['AGAMA']),
      kaum: cariIndeks(header, ['KAUM', 'BANGSA'])
    };

    // Peta tahun perkataan -> nombor (format iDMe)
    var petaTahun = {
      'PERALIHAN': '1',
      'SATU': '1', 'DUA': '2', 'TIGA': '3',
      'EMPAT': '4', 'LIMA': '5', 'ENAM': '6'
    };
    function prosesTahun(nilai) {
      var atas = (nilai || '').toUpperCase();
      for (var kunci in petaTahun) {
        if (atas.indexOf(kunci) !== -1)
          return petaTahun[kunci];
      }
      return atas.replace(/\D/g, '');
    }

    // ------------------------------------------------
    // v2 — SATU TULISAN SAHAJA.
    // Versi lama memanggil setValues() sekali bagi
    // setiap murid: 223 murid = 223 panggilan Sheets,
    // kira-kira seminit. Bila permintaan mengambil masa
    // terlalu lama, pelayar kehilangan sambungan dan
    // memaparkan "Failed to fetch" walaupun import
    // sebenarnya berjaya.
    // Sekarang semua perubahan dibuat dalam ingatan,
    // kemudian ditulis sekali gus.
    // ------------------------------------------------
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('MURID_MASTER');
    var semua = sheet.getDataRange().getValues();
    var barisData = semua.slice(1).filter(function(r) {
      return r[0] !== '' && r[0] !== null &&
             r[0] !== undefined;
    }).map(function(r) {
      var salin = r.slice(0, 10);
      while (salin.length < 10) salin.push('');
      return salin;
    });

    var petaBaris = {};
    var penduaSedia = 0;
    var icSediaTidakSah = 0;
    barisData.forEach(function(r, i) {
      var icKunci = normalisasiIC(r[0]);
      if (!icKunci) {
        icSediaTidakSah++;
        return;
      }
      if (petaBaris[icKunci] !== undefined) penduaSedia++;
      petaBaris[icKunci] = i;
      r[0] = icKunci;
    });
    if (penduaSedia > 0 || icSediaTidakSah > 0) {
      return {
        berjaya: false,
        mesej: 'Import dihentikan: MURID_MASTER mempunyai ' +
          'IC pendua: ' + penduaSedia +
          ', IC tidak sah: ' + icSediaTidakSah +
          '. Betulkan sumber dahulu.'
      };
    }

    var icDalamCSV = {};
    var icDilihat = {};
    var jumlahTambah = 0;
    var jumlahKemaskini = 0;
    var jumlahLangkau = 0;
    var jumlahTidakSah = 0;
    var jumlahPendua = 0;
    var tarikhKini = new Date().toLocaleDateString('ms-MY');

    for (var i = idxHeader + 1; i < baris.length; i++) {
      var lajur = pecahCSV(baris[i]);
      if (!lajur || lajur.length < 2) continue;

      var icAsal = (lajur[idx.ic] || '').trim()
        .replace(/"/g, '');
      var ic = normalisasiIC(icAsal);
      var nama = (lajur[idx.nama] || '').trim()
        .replace(/"/g, '');
      if (!ic || !nama) {
        if (icAsal || nama) jumlahTidakSah++;
        continue;
      }
      if (icDilihat[ic]) {
        jumlahPendua++;
        continue;
      }
      icDilihat[ic] = true;

      // Langkau prasekolah & pendidikan khas
      // (bukan skop sistem koku)
      var tahunRaw = idx.tahun !== -1 ?
        (lajur[idx.tahun] || '') : '';
      var namaKelas = idx.kelas !== -1 ?
        (lajur[idx.kelas] || '').trim()
          .replace(/"/g, '') : '';
      var saring = (tahunRaw + ' ' + namaKelas)
        .toUpperCase();
      if (tahunRaw.toUpperCase().indexOf('PRA') !== -1 ||
          /(^|[^A-Z])(KHAS|PPKI|PKBP|INTEGRASI)([^A-Z]|$)/
            .test(saring)) {
        jumlahLangkau++;
        continue;
      }

      icDalamCSV[ic] = true;

      var tahun = prosesTahun(tahunRaw);
      var kelasLabel = tahun ?
        tahun + ' ' + namaKelas : namaKelas;
      var jantina = idx.jantina !== -1 ?
        (lajur[idx.jantina] || '').trim()
          .replace(/"/g, '') : '';
      var agama = idx.agama !== -1 ?
        (lajur[idx.agama] || '').trim()
          .replace(/"/g, '') : '';
      var kaum = idx.kaum !== -1 ?
        (lajur[idx.kaum] || '').trim()
          .replace(/"/g, '') : '';

      var rekod = [
        ic, nama, tahun, namaKelas, kelasLabel,
        jantina, agama, kaum, 'AKTIF', tarikhKini
      ];

      if (petaBaris[ic] !== undefined) {
        barisData[petaBaris[ic]] = rekod;
        jumlahKemaskini++;
      } else {
        petaBaris[ic] = barisData.length;
        barisData.push(rekod);
        jumlahTambah++;
      }
    }

    if (jumlahTidakSah > 0 || jumlahPendua > 0 ||
        Object.keys(icDalamCSV).length === 0) {
      return {
        berjaya: false,
        mesej: 'Import dihentikan sebelum data diubah. ' +
          'IC/nama tidak sah: ' + jumlahTidakSah +
          ', IC pendua: ' + jumlahPendua + '.'
      };
    }

    // Murid yang tiada dalam CSV ditandakan TIDAK AKTIF
    var jumlahTidakAktif = 0;
    barisData.forEach(function(r) {
      var icR = r[0] ? r[0].toString().trim() : '';
      if (icR && !icDalamCSV[icR] && r[8] === 'AKTIF') {
        r[8] = 'TIDAK AKTIF';
        jumlahTidakAktif++;
      }
    });

    // Satu tulisan untuk keseluruhan jadual
    if (barisData.length > 0) {
      sheet.getRange(2, 1, barisData.length, 10)
           .setValues(barisData);
    }

    // Baris kosong yang ditapis tadi boleh menyebabkan
    // jadual baharu lebih pendek daripada yang lama —
    // bersihkan lebihan di bawah supaya tiada rekod
    // hantu tertinggal.
    var barisAkhirLama = sheet.getLastRow();
    var barisAkhirBaru = barisData.length + 1;
    if (barisAkhirLama > barisAkhirBaru) {
      sheet.getRange(barisAkhirBaru + 1, 1,
        barisAkhirLama - barisAkhirBaru,
        sheet.getLastColumn()).clearContent();
    }

    logAktiviti('sistem', 'IMPORT_MURID',
      'Tambah:' + jumlahTambah +
      ' Kemaskini:' + jumlahKemaskini +
      ' TidakAktif:' + jumlahTidakAktif +
      ' LangkauPra:' + jumlahLangkau);

    cacheBuang('KELAS_AKTIF_V1');
    batalCacheAnggaran_();
    rekodSync = barisData.filter(function(r) { return r[8] === 'AKTIF'; }).map(function(r) {
      return {
        ic: r[0], nama: r[1], tahun: r[2], namaKelas: r[3], kelas: r[4],
        jantina: r[5], agama: r[6], kaum: r[7]
      };
    });
    return {
      berjaya: true,
      tambah: jumlahTambah,
      kemaskini: jumlahKemaskini,
      tidakAktif: jumlahTidakAktif,
      langkau: jumlahLangkau
    };
  });
  if (hasilImport && hasilImport.berjaya && String(asalSync || '').toUpperCase() !== 'HADIR') {
    hasilImport.sync = sepadanHantarKeHadir_('murid', rekodSync, 'AKSI');
  }
  return hasilImport;
}

function exportTemplateKoku(token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MURID_MASTER');
  var data = sheet.getDataRange().getValues().slice(1);

  var csv = 'IC,NAMA,KELAS,UNIT,KELAB,SUKAN,RUMAH\n';

  var muridAktif = data
    .filter(function(r) { return r[8] === 'AKTIF'; })
    .sort(function(a, b) {
      // 1. Tahun (1-6)
      var tA = parseInt(a[2]) || 0;
      var tB = parseInt(b[2]) || 0;
      if (tA !== tB) return tA - tB;
      // 2. Nama kelas (BIJAK, CERDIK, ...)
      var kA = (a[3] || '').toString();
      var kB = (b[3] || '').toString();
      if (kA !== kB) return kA.localeCompare(kB);
      // 3. Nama murid (abjad)
      return a[1].localeCompare(b[1]);
    });

  muridAktif.forEach(function(r) {
    var ic = r[0] || '';
    var nama = r[1] || '';
    var kelas = r[4] || '';
    // ="..." supaya Excel TIDAK tukar IC kepada
    // notasi saintifik (cth: 1.9042E+11)
    csv += '="' + ic + '","' + nama + '","' +
      kelas + '",,,,\n';
  });

  return csv;
}

function importKeahlian(csvText, token) {
  if (!semakSesi(token))
    return { berjaya: false, mesej: 'Sesi tamat.' };

  return denganKunciDokumen_('Import keahlian', function() {
    var baris = csvText.trim().split('\n');
    var header = baris[0].split(',').map(function(h) {
      return h.trim().replace(/"/g, '');
    });

    var idx = {
      ic: cariIndeks(header,
        ['IC', 'NO KP', 'MYKID']),
      nama: cariIndeks(header,
        ['NAMA MURID', 'NAMA']),
      kelas: cariIndeks(header,
        ['KELAS']),
      unit: cariIndeks(header, ['UNIT']),
      kelab: cariIndeks(header, ['KELAB']),
      sukan: cariIndeks(header, ['SUKAN']),
      rumah: cariIndeks(header, ['RUMAH'])
    };

    if (idx.ic === -1) {
      return {
        berjaya: false,
        mesej: 'Lajur IC tidak dijumpai.'
      };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetMurid = ss.getSheetByName('MURID_MASTER');
    var sheetKeahlian = ss.getSheetByName('KEAHLIAN');
    var sheetKelab = ss.getSheetByName('KELAB');
    var tetapan = getTetapan();
    var tahunAkademik = tetapan.TAHUN_AKADEMIK;

    var dataMurid = sheetMurid.getDataRange()
      .getValues().slice(1);
    var icMurid = {};
    var namaMap = {};
    dataMurid.filter(function(r) {
      return r[8] === 'AKTIF';
    }).forEach(function(r) {
      if (!r[0]) return;
      var icKunci = normalisasiIC(r[0]);
      if (!icKunci) return;
      icMurid[icKunci] = true;
      var kunci = (r[1] || '').toString()
        .trim().toUpperCase();
      if (!namaMap[kunci]) namaMap[kunci] = [];
      namaMap[kunci].push({
        ic: icKunci,
        kelas: (r[4] || '').toString()
          .trim().toUpperCase()
      });
    });

    var dataKelab = sheetKelab.getDataRange()
      .getValues().slice(1);
    var kelabMap = {};
    dataKelab.forEach(function(r) {
      if (r[1]) kelabMap[r[1].toString().trim()
        .toUpperCase()] = r[0];
    });

    var dataKeahlianSedia = sheetKeahlian.getDataRange()
      .getValues().slice(1);
    var barisKekal = dataKeahlianSedia.filter(function(r) {
      return !samaNilai(r[4], tahunAkademik);
    });

    var jumlahBerjaya = 0;
    var jumlahRalat = 0;
    var kokuBaruBaris = [];
    var kokuBaruNama = [];
    var kokuBaruBil = 0;
    var senaraiRalat = [];
    var barisBaru = [];
    var keahlianDilihat = {};

    for (var i = 1; i < baris.length; i++) {
      var lajur = pecahCSV(baris[i]);
      if (!lajur || lajur.length < 2) continue;

      var icAsal = (lajur[idx.ic] || '').trim()
        .replace(/"/g, '').replace(/^=/, '');
      var ic = normalisasiIC(icAsal);
      var namaRow = idx.nama !== -1 ?
        (lajur[idx.nama] || '').trim()
          .replace(/"/g, '') : '';
      var kelasRow = idx.kelas !== -1 ?
        (lajur[idx.kelas] || '').trim()
          .replace(/"/g, '') : '';
      if (!ic && !namaRow) continue;

      if (!icMurid[ic]) {
        // IC tidak sah (mungkin dirosakkan Excel,
        // cth 1.9042E+11) — cuba padan ikut NAMA,
        // dan KELAS jika nama berganda
        var calon = namaMap[namaRow.toUpperCase()] || [];
        if (calon.length > 1 && kelasRow) {
          calon = calon.filter(function(c) {
            return c.kelas === kelasRow.toUpperCase();
          });
        }
        if (calon.length === 1) {
          ic = calon[0].ic;
        } else {
          senaraiRalat.push('Baris ' + (i + 1) + ': "' +
            (namaRow || ic) +
            '" tidak dapat dipadankan' +
            (calon.length > 1 ? ' (nama berganda)' : ''));
          jumlahRalat++;
          continue;
        }
      }

      var kategoriMap = [
        { key: 'unit', label: 'Unit Beruniform' },
        { key: 'kelab', label: 'Kelab & Persatuan' },
        { key: 'sukan', label: 'Sukan & Permainan' },
        { key: 'rumah', label: 'Rumah Sukan' }
      ];

      kategoriMap.forEach(function(kat) {
        if (idx[kat.key] === -1) return;
        var namaKelab = (lajur[idx[kat.key]] || '')
          .trim().replace(/"/g, '').toUpperCase();
        if (!namaKelab) return;

        var idKelab = kelabMap[namaKelab];
        if (!idKelab) {
          // v3.8: daftar koku baru secara automatik
          // ikut kategori lajur CSV
          idKelab = 'K' + Date.now() + '_' +
            (kokuBaruBil++);
          kelabMap[namaKelab] = idKelab;
          kokuBaruBaris.push([idKelab, namaKelab,
            kat.label, '', '', '', 'AKTIF']);
          kokuBaruNama.push(namaKelab +
            ' (' + kat.label + ')');
        }

        var kunciKeahlian = ic + '|' + kat.label;
        if (keahlianDilihat[kunciKeahlian]) {
          senaraiRalat.push('Baris ' + (i + 1) +
            ': keahlian kategori ' + kat.label + ' pendua');
          jumlahRalat++;
          return;
        }
        keahlianDilihat[kunciKeahlian] = true;
        barisBaru.push([
          ic, idKelab, kat.label,
          'Ahli Biasa', tahunAkademik, 'AKTIF'
        ]);
        jumlahBerjaya++;
      });
    }

    if (jumlahRalat > 0 || barisBaru.length === 0) {
      return {
        berjaya: false,
        mesej: 'Import keahlian dihentikan sebelum data diubah. ' +
          'Ralat: ' + jumlahRalat +
          ', keahlian sah: ' + barisBaru.length + '.',
        jumlahRalat: jumlahRalat,
        senaraiBaris: senaraiRalat.slice(0, 10)
      };
    }

    // Semua parsing dan pengesahan selesai sebelum jadual semasa
    // disentuh. Ralat tidak boleh meninggalkan sheet separuh kosong.
    sheetKeahlian.clearContents();
    sheetKeahlian.getRange(1, 1, 1, 6).setValues([[
      'IC', 'ID_KELAB', 'KATEGORI', 'JAWATAN',
      'TAHUN_AKADEMIK', 'STATUS'
    ]]);
    if (barisKekal.length > 0) {
      sheetKeahlian.getRange(2, 1,
        barisKekal.length, 6).setValues(barisKekal);
    }
    if (barisBaru.length > 0) {
      var barisAkhir = sheetKeahlian.getLastRow() + 1;
      sheetKeahlian.getRange(barisAkhir, 1,
        barisBaru.length, 6).setValues(barisBaru);
    }

    logAktiviti('sistem', 'IMPORT_KEAHLIAN',
      'Berjaya:' + jumlahBerjaya +
      ' Ralat:' + jumlahRalat);

    // Tulis koku baru ke sheet KELAB (satu tulisan)
    if (kokuBaruBaris.length > 0) {
      var barisKelab = sheetKelab.getLastRow() + 1;
      sheetKelab.getRange(barisKelab, 1,
        kokuBaruBaris.length, 7)
        .setValues(kokuBaruBaris);
      cacheBuang('KELAB_AKTIF_V1');
    }
    batalCacheAnggaran_();

    return {
      berjaya: true,
      jumlahBerjaya: jumlahBerjaya,
      jumlahRalat: jumlahRalat,
      kokuBaru: kokuBaruNama,
      senaraiBaris: senaraiRalat.slice(0, 10)
    };
  });
}

function getSenaraiMurid(filter, token) {
  if (!semakSesi(token)) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('MURID_MASTER');
  var data = sheet.getDataRange().getValues().slice(1);

  return data.filter(function(r) {
    if (filter.status && r[8] !== filter.status)
      return false;
    if (filter.tahun && r[2] !== filter.tahun)
      return false;
    if (filter.kelas && r[3] !== filter.kelas)
      return false;
    if (filter.carian) {
      var carian = filter.carian.toLowerCase();
      var nama = (r[1] || '').toLowerCase();
      var ic = (r[0] || '').toString();
      if (!nama.includes(carian) && !ic.includes(carian))
        return false;
    }
    return true;
  }).map(function(r) {
    return {
      ic: r[0], nama: r[1], tahun: r[2],
      kelas: r[3], kelasLabel: r[4],
      jantina: r[5], status: r[8]
    };
  });
}

function cariIndeks(header, kemungkinan) {
  for (var k = 0; k < kemungkinan.length; k++) {
    for (var i = 0; i < header.length; i++) {
      if (header[i].toUpperCase().includes(
          kemungkinan[k].toUpperCase())) {
        return i;
      }
    }
  }
  return -1;
}

function pecahCSV(baris) {
  var hasil = [];
  var semasa = '';
  var dalamPetikan = false;
  for (var i = 0; i < baris.length; i++) {
    var c = baris[i];
    if (c === '"') {
      dalamPetikan = !dalamPetikan;
    } else if (c === ',' && !dalamPetikan) {
      hasil.push(semasa);
      semasa = '';
    } else {
      semasa += c;
    }
  }
  hasil.push(semasa);
  return hasil;
}

function sepadanHantarKeHadir_(jenis, senarai, sumber) {
  var props = PropertiesService.getScriptProperties();
  var rahsia = props.getProperty('SEPADAN_SYNC_SECRET');
  var url = props.getProperty('SEPADAN_HADIR_URL') ||
    'https://script.google.com/macros/s/AKfycbzqppwOPHQZz7dZe9OW3Hbhf1nA5wdfqBeQUUXmOxrt1ILDezw_HsLE4wgpbKMt8hbe/exec';
  if (!rahsia) return { ok: false, mesej: 'Rahsia penyelarasan SePadan belum ditetapkan.' };
  try {
    var kaedah = jenis === 'guru' ? 'terimaSyncGuru' : 'terimaSyncMurid';
    var respons = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'text/plain; charset=utf-8', followRedirects: true,
      muteHttpExceptions: true,
      payload: JSON.stringify({
        mode: 'hadir', kaedah: kaedah,
        argumen: [senarai || [], String(sumber || 'AKSI').toUpperCase(), rahsia]
      })
    });
    var data = JSON.parse(respons.getContentText());
    if (!data.ok) throw new Error(data.ralat || 'Relay HADIR gagal.');
    if (!data.hasil || data.hasil.ok === false)
      throw new Error((data.hasil && data.hasil.mesej) || 'Relay HADIR gagal.');
    return { ok: data.hasil.syncOk !== false, mesej: data.hasil.mesej || 'Semua sistem diselaraskan.' };
  } catch (e) {
    return { ok: false, mesej: e && e.message ? e.message : String(e) };
  }
}
