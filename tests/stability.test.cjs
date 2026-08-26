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
const pages = [
  ['GitHub Pages', read('docs', 'penilaian.html')],
  ['Apps Script', read('apps-script', 'Penilaian.html')]
];

for (const [name, source] of [
  ['Code.gs', code],
  ['Kehadiranbackend.gs', attendance],
  ['PenilaianBackend.gs', assessment],
  ['PAJSKBackend.gs', pajsk]
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
