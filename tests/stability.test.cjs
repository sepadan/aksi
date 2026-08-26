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
const archive = read('apps-script', 'ArkibBackend.gs');
const auth = read('apps-script', 'Auth.gs');
const setup = read('apps-script', 'SetupBackend.gs');
const pages = [
  ['GitHub Pages', read('docs', 'penilaian.html')],
  ['Apps Script', read('apps-script', 'Penilaian.html')]
];

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

const importMurid = students.match(new RegExp(
  'function importMurid\\([\\s\\S]*?(?=\\nfunction |$)'))[0];
assert.match(importMurid, /Import dihentikan sebelum data diubah/,
  'Import murid rosak mesti gagal sebelum menukar data');
assert.match(importMurid, /normalisasiIC\(icAsal\)/,
  'Import murid mesti menormalkan IC di sempadan masuk');
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

console.log('Ujian kestabilan lulus: IC, kunci tulis, PAJSK dan cache kelas selamat.');
