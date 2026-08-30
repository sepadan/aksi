const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const github = fs.readFileSync(path.join(root, 'docs', 'pencapaian.html'), 'utf8');
const legacy = fs.readFileSync(path.join(root, 'apps-script', 'Pencapaian.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'docs', 'service-worker.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'docs', 'js', 'config.js'), 'utf8');

for (const [name, html] of [['GitHub Pages', github], ['Apps Script', legacy]]) {
  assert.doesNotMatch(html, /onclick="pilihMurid\(/,
    `${name}: data murid tidak boleh disisip ke inline onclick`);
  assert.doesNotMatch(html, /onclick="padamPencapaian\(/,
    `${name}: data pencapaian tidak boleh disisip ke inline onclick`);
  assert.doesNotMatch(html, /cariTimeout|setTimeout\([^)]*400/,
    `${name}: carian tidak patut menunggu debounce/rangkaian lama`);
  assert.match(html, /senaraiMuridPencapaian/,
    `${name}: senarai murid perlu dipramuat sekali`);
  assert.match(html, /item\.addEventListener\('click', pilih\)/,
    `${name}: pilihan murid mesti menggunakan event listener selamat`);
  assert.match(html, /withFailureHandler/,
    `${name}: panggilan pelayan mesti mempunyai pengendali kegagalan`);
  assert.match(html, /textContent/,
    `${name}: data dinamik mesti dipaparkan sebagai teks`);

  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, source] of scripts) {
    assert.doesNotThrow(() => new Function(source),
      `${name}: JavaScript sebaris mesti sah`);
  }
}

assert.match(github, /if \(AKSI\.bolehTulis\(\)\) muatSenaraiMuridPencapaian\(\)/,
  'GitHub Pages: hanya pengguna yang boleh menulis boleh memuat senarai penuh murid');
assert.match(sw, /aksi-shell-v1\.5\.0-20260830-12/,
  'Cache PWA mesti dinaikkan bersama aset');
assert.match(config, /AKSI v1\.5\.0 · PWA/,
  'Versi paparan mesti sepadan dengan cache PWA');

const docs = path.join(root, 'docs');
function semuaFail(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? semuaFail(full) : [full];
  });
}

for (const file of semuaFail(docs)) {
  const relative = path.relative(docs, file);
  const content = fs.readFileSync(file, 'utf8');
  if (/\.(?:html|js|md)$/.test(file)) {
    assert.doesNotMatch(content, /20260824-6|AKSI v1\.2\.0/,
      `${relative}: rujukan aset semasa tidak boleh menggunakan versi lama`);
  }
  if (/\.js$/.test(file)) {
    assert.doesNotThrow(() => new Function(content),
      `${relative}: JavaScript mesti sah`);
  }
  if (/\.html$/.test(file)) {
    const scripts = [...content.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [, source] of scripts) {
      assert.doesNotThrow(() => new Function(source),
        `${relative}: JavaScript sebaris mesti sah`);
    }
  }
}

console.log('Ujian Pencapaian lulus: pilihan aksara khas selamat dan carian setempat aktif.');
