const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const code = read('apps-script', 'Code.gs');
const attendance = read('apps-script', 'Kehadiranbackend.gs');
const assessment = read('apps-script', 'PenilaianBackend.gs');
const pajsk = read('apps-script', 'PAJSKBackend.gs');
const report = read('apps-script', 'Laporanbackend.gs');
const achievement = read('apps-script', 'Pencapaianbackend.gs');
const membership = read('apps-script', 'KeahlianBackend.gs');
const students = read('apps-script', 'Murid.gs');
const clubs = read('apps-script', 'KelabBackend.gs');
const config = read('docs', 'js', 'config.js');
const appJs = read('docs', 'js', 'app.js');
const sharedScript = read('apps-script', 'Script.html');
const worker = read('docs', 'service-worker.js');
const archive = read('apps-script', 'ArkibBackend.gs');
const auth = read('apps-script', 'Auth.gs');
const setup = read('apps-script', 'SetupBackend.gs');
const pages = [
  ['GitHub Pages', read('docs', 'penilaian.html')],
  ['Apps Script', read('apps-script', 'Penilaian.html')]
];
const authPages = [
  ['GitHub Laporan', read('docs', 'laporan.html')],
  ['Apps Script Laporan', read('apps-script', 'Laporan.html')],
  ['GitHub Keahlian', read('docs', 'keahlian.html')],
  ['Apps Script Keahlian', read('apps-script', 'Keahlian.html')],
  ['GitHub Penilaian', read('docs', 'penilaian.html')],
  ['Apps Script Penilaian', read('apps-script', 'Penilaian.html')],
  ['GitHub Admin', read('docs', 'admin.html')],
  ['Apps Script Admin', read('apps-script', 'Admin.html')]
];
assert.match(appJs, /function kodArgumenURI_[\s\S]*replace\(\/\'\/g,\s*'%27'\)/,
  'GitHub Pages mesti mengekod apostrof dalam argumen inline');
assert.match(sharedScript, /function kodArgumenURI_[\s\S]*replace\(\/\'\/g,\s*'%27'\)/,
  'Apps Script mesti mengekod apostrof dalam argumen inline');
assert.match(sharedScript, /function escAtr\(t\)/,
  'HtmlService mesti menyediakan pelolos atribut yang digunakan halaman Keahlian');

for (const [name, source] of [
  ['Code.gs', code],
  ['Kehadiranbackend.gs', attendance],
  ['PenilaianBackend.gs', assessment],
  ['PAJSKBackend.gs', pajsk],
  ['Laporanbackend.gs', report],
  ['Pencapaianbackend.gs', achievement],
  ['KeahlianBackend.gs', membership],
  ['Murid.gs', students],
  ['KelabBackend.gs', clubs],
  ['ArkibBackend.gs', archive],
  ['Auth.gs', auth],
  ['SetupBackend.gs', setup]
]) {
  assert.doesNotThrow(() => new Function(source), `${name}: sintaks mesti sah`);
}

assert.match(code, /function normalisasiIC\(nilai\)/,
  'Normalisasi IC mesti berpusat');
assert.match(code, /padStart\(12, '0'\)/,
  'IC numerik yang hilang sifar awal perlu dipulihkan');
assert.match(code, /function denganKunciDokumen_/,
  'Operasi tulis mesti menggunakan satu pembantu LockService');
assert.match(code, /function nomborSah_/,
  'Nilai PAJSK mesti melalui pengawal nombor');
for (const operation of ['kemaskiniTetapan', 'simpanLogo']) {
  const block = code.match(new RegExp(
    `function ${operation}\\([\\s\\S]*?(?=\\nfunction |$)`))[0];
  assert.match(block, /denganKunciDokumen_/,
    `${operation}: perubahan tetapan mesti dikunci`);
}

const helperSource = [
  code.match(/function normalisasiIC\(nilai\) \{[\s\S]*?\n\}/)[0],
  code.match(/function samaNilai\(a, b\) \{[\s\S]*?\n\}/)[0]
].join('\n');
const context = {};
vm.runInNewContext(helperSource, context);
const icBerformat = ['01', '0203', '04', '0506'].join('-');
const icHilangSifar = Number(['01', '0203', '04', '0506'].join(''));
assert.equal(context.normalisasiIC(icBerformat),
  ['01', '0203', '04', '0506'].join(''));
assert.equal(context.normalisasiIC(icHilangSifar),
  ['01', '0203', '04', '0506'].join(''));
assert.equal(context.samaNilai('2026', 2026), true);
assert.equal(context.samaNilai('K001', 'K001'), true);

for (const operation of ['buatPerjumpaan', 'simpanKehadiran', 'padamPerjumpaan']) {
  const block = attendance.match(new RegExp(
    `function ${operation}\\([\\s\\S]*?(?=\\nfunction |$)`))[0];
  assert.match(block, /denganKunciDokumen_/,
    `${operation}: penulisan mesti dikunci`);
}
assert.match(attendance, /function idPerjumpaanBaru_/,
  'ID perjumpaan mesti dijana oleh pembantu khusus');
assert.match(attendance, /Math\.max\(maks/,
  'ID perjumpaan mesti berasaskan nombor maksimum, bukan lastRow');
assert.doesNotMatch(attendance, /var idBaru = 'P' \+ String\(jumlah\)/,
  'ID perjumpaan tidak boleh diguna semula selepas baris dipadam');
assert.match(attendance, /normalisasiIC\(it\.ic\)/,
  'Peta kehadiran mesti menggunakan IC ternormalisasi');

for (const operation of [
  'simpanKomitmen', 'simpanKhidmat', 'simpanPenglibatan',
  'simpanJawatan', 'simpanEkstra'
]) {
  const block = assessment.match(new RegExp(
    `function ${operation}\\([\\s\\S]*?(?=\\nfunction |$)`))[0];
  assert.match(block, /denganKunciDokumen_/,
    `${operation}: penulisan mesti dikunci`);
}
assert.doesNotMatch(assessment, /deleteRow\(/,
  'Penilaian tidak boleh memadam baris satu demi satu');
assert.match(assessment, /setValues\(rekod\)/,
  'Penilaian terperinci mesti ditulis secara pukal');

assert.match(pajsk, /nomborSah_\(/,
  'Pengiraan PAJSK mesti mengawal NaN dan Infinity');
assert.match(pajsk, /ic: kunciIc/,
  'IC keluar dari PAJSK mesti ternormalisasi agar perlindungan tetamu berfungsi');
const kiraPajsk = pajsk.match(
  /function kiraPAJSK\([\s\S]*?(?=\nfunction tentukanGred)/)[0];
assert.equal((kiraPajsk.match(/sheetPenilaian\.getDataRange\(\)/g) || []).length, 1,
  'PENILAIAN_KOKU mesti dibaca sekali sahaja setiap pengiraan');
assert.match(pajsk, /cacheSimpan\(kunciCache, hasil, 120\)/,
  'Anggaran kelas perlu cache pelayan jangka pendek');
assert.match(pajsk, /batalCacheAnggaran_\(\)/,
  'Penulisan markah mesti membatalkan cache anggaran');
const kiraPajskTulis = pajsk.match(new RegExp(
  'function kiraPAJSK\\([\\s\\S]*?(?=\\nfunction |$)'))[0];
assert.match(kiraPajskTulis, /denganKunciDokumen_/,
  'kiraPAJSK menulis ringkasan dan mesti dikunci');

for (const [name, source, operations] of [
  ['Laporan', report, ['simpanLaporan', 'padamLaporan']],
  ['Pencapaian', achievement, ['tambahPencapaian', 'padamPencapaian']],
  ['Keahlian', membership, [
    'tambahAhliKelab', 'tukarJawatanAhli', 'buangAhliKelab',
    'padamKeahlianKekal', 'tukarKelabAhli'
  ]],
  ['Import', students, ['importMurid', 'importKeahlian']],
  ['Kelab/Guru', clubs, [
    'tambahKelab', 'editKelab', 'togolStatusKelab', 'tambahGuru',
    'padamGuru', 'padamKelab', 'tukarJenisKelab', 'importGuru'
  ]],
  ['Arkib', archive, [
    'tutupTahunAkademik', 'buatBackupManual',
    'togolBackupAutomatik', 'backupAutoTrigger'
  ]],
  ['Persediaan', setup, ['jalankanSetup', 'resetUntukSekolahBaru']]
]) {
  for (const operation of operations) {
    const block = source.match(new RegExp(
      `function ${operation}\\([\\s\\S]*?(?=\\nfunction |$)`))[0];
    assert.match(block, /denganKunciDokumen_/,
      `${name}/${operation}: penulisan mesti dikunci`);
  }
}

assert.match(report, /nomborLaporan[\s\S]*Math\.max\(maks/,
  'ID laporan mesti berdasarkan nombor maksimum');
assert.match(report, /nomborGambarSeterus[\s\S]*Math\.max\(maks/,
  'ID gambar tidak boleh diguna semula selepas pemadaman');
assert.doesNotMatch(report, /sheetG\.appendRow/,
  'Metadata gambar mesti ditulis secara pukal');
assert.match(achievement, /normalisasiIC\(senaraiIC\[i\]\)/,
  'Pencapaian mesti menyimpan IC ternormalisasi');
assert.match(achievement, /var noMula =[\s\S]*Math\.max\(maks/,
  'ID pencapaian mesti berdasarkan nombor maksimum');

const importGuru = clubs.match(new RegExp(
  'function importGuru\\([\\s\\S]*?(?=\\nfunction |$)'))[0];
assert.match(importGuru, /typeof item === 'object'/,
  'Import guru mesti menerima objek nama dan jawatan daripada HADIR');
assert.match(importGuru, /jawatan &&/,
  'Jawatan kosong daripada HADIR tidak boleh menindih jawatan AKSI');
assert.match(importGuru, /setValues\(data\.slice\(1\)/,
  'Kemas kini jawatan guru mesti ditulis secara pukal');
assert.doesNotMatch(importGuru, /clear(?:Contents)?\(|deleteRow\(/,
  'Import/sync guru tidak boleh memadam senarai sedia ada secara fizikal');
assert.match(importGuru, /mod === 'sync'[\s\S]*'TIDAK AKTIF'/,
  'Sync penuh mesti menyahaktifkan guru yang tiada');
assert.match(importGuru, /asalSync[\s\S]*!== 'HADIR'/,
  'Import guru tempatan mesti relay, tetapi import daripada HADIR tidak boleh berpusing');
assert.match(importGuru, /pastikanAkaunGuru\(token\)/,
  'Import guru AKSI mesti memastikan akaun baharu tersedia');

const importMurid = students.match(new RegExp(
  'function importMurid\\([\\s\\S]*?(?=\\nfunction |$)'))[0];
assert.match(importMurid, /Import dihentikan sebelum data diubah/,
  'Import murid rosak mesti gagal sebelum menukar data');
assert.match(importMurid, /normalisasiIC\(icAsal\)/,
  'Import murid mesti menormalkan IC di sempadan masuk');
assert.match(importMurid, /sepadanHantarKeHadir_\('murid'/,
  'Upload murid AKSI mesti dihantar kepada relay HADIR');
assert.match(importMurid, /asalSync[\s\S]*!== 'HADIR'/,
  'Import murid daripada HADIR tidak boleh mencetuskan gelung sync');
assert.match(students, /getProperty\('SEPADAN_SYNC_SECRET'\)/,
  'Rahsia relay mesti dibaca daripada Script Properties');
assert.doesNotMatch(students, /SEPADAN_SYNC_SECRET\s*=/,
  'Nilai rahsia relay tidak boleh disimpan dalam kod');
assert.match(students, /kaedah: kaedah[\s\S]*argumen: \[senarai \|\| \[\], String\(sumber/,
  'Relay AKSI mesti menghantar jenis data dan penanda sumber');
assert.match(config, /AKSI v1\.5\.0 · PWA/,
  'Versi paparan AKSI mesti dinaikkan');
assert.match(worker, /aksi-shell-v1\.5\.0-20260830-12/,
  'Cache Service Worker mesti dinaikkan bersama versi aset');
assert.doesNotMatch(worker, /20260826-9|v1\.3\.1/,
  'Service Worker tidak boleh menyimpan nombor aset lama');
const importKeahlian = students.match(new RegExp(
  'function importKeahlian\\([\\s\\S]*?(?=\\nfunction |$)'))[0];
assert.ok(importKeahlian.indexOf('sheetKeahlian.clearContents()') >
  importKeahlian.indexOf('for (var i = 1; i < baris.length; i++)'),
  'Import keahlian mesti selesai mengesah sebelum mengosongkan sheet');
assert.match(importKeahlian, /keahlianDilihat/,
  'Keahlian pendua dalam fail import mesti dikesan');

for (const operation of [
  'pastikanAkaunGuru', 'tukarKataLaluanAdmin',
  'tukarKataLaluanGuru', 'tukarKataLaluanSendiri'
]) {
  const block = auth.match(new RegExp(
    `function ${operation}\\([\\s\\S]*?(?=\\nfunction |$)`))[0];
  assert.match(block, /denganKunciDokumen_/,
    `${operation}: perubahan akaun mesti dikunci`);
}
assert.doesNotMatch(auth.match(new RegExp(
  'function pastikanAkaunGuru\\([\\s\\S]*?(?=\\nfunction |$)'))[0],
  /appendRow/,
  'Segerak akaun guru tidak boleh menulis dalam gelung');
assert.match(auth, /TIDAK AKTIF/,
  'Guru tidak aktif tidak boleh muncul dalam log masuk atau penciptaan akaun baharu');
assert.match(auth, /function guruAktif_\(nama\)/,
  'Semakan status guru aktif mesti berpusat');
const loginBlock = auth.match(/function login\([\s\S]*?(?=\nfunction |$)/)[0];
assert.match(loginBlock, /peranan === 'guru'[\s\S]*guruAktif_\(idPengguna\)/,
  'Login terus mesti menolak akaun guru yang telah dinyahaktifkan');
const sessionBlock = auth.match(/function semakSesi\([\s\S]*?(?=\nfunction |$)/)[0];
assert.match(sessionBlock,
  /sesi\.peranan === 'guru'[\s\S]*guruAktif_\(sesi\.id\)[\s\S]*deleteProperty\('SESI_' \+ token\)/,
  'Sesi guru mesti dibatalkan segera apabila guru dinyahaktifkan');
assert.match(clubs, /function padamGuru[\s\S]*TIDAK AKTIF[\s\S]*sepadanHantarKeHadir_\('guru', guruAktif, 'AKSI', 'sync'\)/,
  'Padam guru mesti menjadi nyahaktif dan dihantar sebagai sync penuh');
assert.match(auth, /LockService\.getScriptLock\(\)/,
  'Log aktiviti serentak mesti mempunyai kunci khusus');

for (const [name, html] of pages) {
  assert.match(html, /cacheAnggaranKelas/,
    `${name}: hasil kelas perlu disimpan dalam memori halaman`);
  assert.match(html, /getAnggaranKelas\(kelas/,
    `${name}: kelas perlu dihitung dengan satu panggilan`);
  assert.match(html, /const sedia = \(cacheAnggaranKelas\[kelas\]/,
    `${name}: pilihan murid perlu diselesaikan tanpa rangkaian`);
  assert.doesNotMatch(html, /localStorage\.setItem/,
    `${name}: data murid tidak boleh ditulis ke localStorage`);
  assert.doesNotMatch(html,
    /(?:localStorage|sessionStorage)\.setItem\([^\n]*cacheAnggaranKelas/,
    `${name}: cache kelas mesti kekal dalam memori halaman`);
  assert.match(html, /function nomborPaparan_/,
    `${name}: nilai rosak tidak boleh memecahkan paparan`);

  const scripts = [...html.matchAll(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, source] of scripts) {
    assert.doesNotThrow(() => new Function(source),
      `${name}: JavaScript sebaris mesti sah`);
  }
}

for (const [name, html] of authPages) {
  assert.doesNotMatch(html, /<strong>' \+ (?:m\.nama|a\.nama|g\.nama) \+/,
    `${name}: nama dinamik tidak boleh dimasukkan mentah ke innerHTML`);
  assert.doesNotMatch(html, /📍 ' \+ p\.tempat \+/,
    `${name}: tempat perjumpaan tidak boleh dimasukkan mentah ke innerHTML`);
  assert.doesNotMatch(html,
    /(?:' \+ (?:a\.(?:nama|kelas|rumahSukan)|k\.(?:nama|jawatanKeahlian)|p\.(?:nama|peringkat)) \+|\$\{laporan\.(?:tajuk|aktiviti|namaGuru)\})/,
    `${name}: teks rekod mesti melalui esc sebelum dimasukkan ke innerHTML`);
  assert.doesNotMatch(html, /encodeURIComponent\((?:a|g)\.(?:ic|id|nama)\)/,
    `${name}: encodeURIComponent biasa tidak mengekod apostrof untuk atribut onclick`);
  assert.doesNotMatch(html, /tambahAhli\(\\''\s*\+\s*m\.ic/,
    `${name}: IC murid tidak boleh dimasukkan mentah ke onclick tambahAhli`);
  assert.doesNotMatch(html, /(?:tukarJawatan|bukaMurid)\(\\''\s*\+\s*a\.ic/,
    `${name}: IC ahli tidak boleh dimasukkan mentah ke pengendali sebaris`);
  assert.doesNotMatch(html, /\$\{n\}/,
    `${name}: nama guru dalam chip laporan mesti dilolos`);
  assert.doesNotMatch(html, /return '<span>' \+ i \+ '<\/span>'/,
    `${name}: metadata kelab mesti dilolos sebelum innerHTML`);
  assert.doesNotMatch(html, /'<tr><td>Jawatan<\/td><td><b>' \+ k\.jawatan/,
    `${name}: jawatan ahli mesti dilolos sebelum innerHTML`);
  assert.doesNotMatch(html, /k\.nama\.replace\(\/\'\/g/,
    `${name}: nama kelab dalam onclick mesti menggunakan kodArgumenURI_`);
  assert.doesNotMatch(html, /(?:togolKelab|padamKelabAdmin)\(\\''\s*\+\s*k\.id/,
    `${name}: ID kelab tidak boleh dimasukkan mentah ke pengendali sebaris`);
  assert.doesNotMatch(html, /'<option value="' \+ k\.id/,
    `${name}: ID kelab mesti dilolos sebelum atribut option`);
  assert.doesNotMatch(html, /Sudah ahli: ' \+ m\.sudahAhli/,
    `${name}: nama kelab sedia ada mesti dilolos`);
  assert.doesNotMatch(html, /'<tr><td>' \+ m\.nama|'<td>' \+ m\.kelas/,
    `${name}: jadual semakan murid mesti melolos nama dan kelas`);
  assert.doesNotMatch(html, /color:#666">' \+ c\.nama/,
    `${name}: nama kelab dalam jadual semakan mesti dilolos`);
  assert.doesNotMatch(html, /k\.nama \+ '<\/option>'/,
    `${name}: pilihan kelab mesti melolos nama`);
}

for (const [name, html] of [
  ['GitHub Admin', read('docs', 'admin.html')],
  ['Apps Script Admin', read('apps-script', 'Admin.html')]
]) {
  assert.doesNotMatch(html, /'<strong>' \+ (?:k\.nama|b\.nama) \+/,
    `${name}: nama kelab/backup mesti dilolos sebelum dimasukkan ke innerHTML`);
}

console.log('Ujian kestabilan lulus: IC, kunci tulis, PAJSK, cache kelas dan relay SePadan selamat.');
