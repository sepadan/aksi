/* Ujian versi aset AKSI.

   Sebab ujian ini wujud: pada 6 September 2026 didapati setiap halaman
   meminta `manifest.webmanifest?v=1.4.0` dan ikon `?v=1.3.1`, sedangkan
   Service Worker hanya menyimpan versi `?v=1.5.0`. Padanan cache adalah
   tepat-URL untuk sub-sumber, jadi setiap URL yang tidak sepadan terlepas
   daripada cache dan gagal ketika luar talian. Tiada sesiapa perasan
   kerana dalam talian ia diambil dari rangkaian seperti biasa.

   HADIR sudah mempunyai ujian setara; AKSI dan SEMAK tidak, dan itulah
   sebabnya kedua-duanya hanyut. Jalankan: node tests/versi-aset.test.cjs */

const fs = require('fs');
const path = require('path');

const AKAR = path.join(__dirname, '..', 'docs');
const gagal = [];

function baca(f) { return fs.readFileSync(path.join(AKAR, f), 'utf8'); }

const sw = baca('service-worker.js');

/* --- 1. CACHE_VERSION sepadan dengan cap binaan aset --------------------- */
const capCache = (sw.match(/CACHE_VERSION\s*=\s*'aksi-shell-v[\d.]+-(\d{8}-\d+)'/) || [])[1];
if (!capCache) {
  gagal.push('CACHE_VERSION tidak dijumpai atau formatnya berubah.');
}

/* --- 2. Setiap aset berversi dalam HTML mesti ada dalam APP_SHELL -------- */
const halaman = fs.readdirSync(AKAR).filter(f => f.endsWith('.html'));
const shell = new Set(
  (sw.match(/'\.\/[^']+'/g) || []).map(s => s.slice(3, -1))
);

halaman.forEach(function (f) {
  const html = baca(f);
  const rujukan = html.match(/(?:href|src)="([^"]+\?v=[^"]+)"/g) || [];
  rujukan.forEach(function (r) {
    const url = r.replace(/^(?:href|src)="/, '').replace(/"$/, '');
    if (/^https?:/.test(url)) return;
    if (!shell.has(url)) {
      gagal.push(f + ' meminta "' + url + '" tetapi APP_SHELL tidak menyimpannya.');
    }
  });
});

/* --- 3. Cap binaan mesti seragam merentas semua halaman ------------------ */
halaman.forEach(function (f) {
  const capHalaman = baca(f).match(/\?v=(\d{8}-\d+)/g) || [];
  capHalaman.forEach(function (c) {
    if (c !== '?v=' + capCache) {
      gagal.push(f + ' menggunakan cap binaan ' + c + ', sepatutnya ?v=' + capCache + '.');
    }
  });
});

/* --- 4. pwa.js tidak boleh memuat semula pada pemasangan pertama --------- */
const pwa = baca('js/pwa.js');
if (!/navigator\.serviceWorker\.controller/.test(pwa)) {
  gagal.push('js/pwa.js memuat semula pada setiap controllerchange. ' +
    'Pemasangan pertama juga membangkitkannya melalui clients.claim(), ' +
    'lalu membatalkan permintaan yang sedang berjalan.');
}

if (gagal.length) {
  console.error('Ujian versi aset AKSI GAGAL:\n- ' + gagal.join('\n- '));
  process.exit(1);
}
console.log('Ujian versi aset AKSI lulus: cap binaan seragam, setiap aset ' +
  'berversi ada dalam APP_SHELL, dan pemasangan pertama tidak memuat semula.');
