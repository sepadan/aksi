# docs/ — muka depan AKSI di GitHub Pages

Folder ini diterbitkan sebagai laman web. Tetapkan dalam repo:
**Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /docs**

GitHub Pages hanya boleh melayan dari akar repo atau dari `/docs` —
tiada pilihan folder lain. Sebab itu ia dinamakan `docs`, bukan `web`.

| Fail | Peranan |
|---|---|
| `index.html` | dashboard dan log masuk dalam halaman |
| `css/style.css` | dijana dari `Style.html` projek Apps Script |
| `js/config.js` | URL `/exec` — satu-satunya tempat ia ditetapkan |
| `js/api.js` | dari `ApiShim.html` — `google.script.run` melalui `fetch` |
| `js/app.js` | sidebar, sesi, toast — ganti `Script.html` + `renderSidebar()` |
| `js/pwa.js` | daftar Service Worker dan semak kemas kini semasa aplikasi dibuka |
| `manifest.webmanifest` | nama, warna dan ikon pemasangan PWA |
| `service-worker.js` | cache cangkerang statik; API dan data murid tidak dicache |
| `offline.html` | mesej selamat apabila internet terputus |

Halaman dalam (`dashboard.html`, `keahlian.html`, dan lain-lain)
sudah tersedia dalam folder ini.

## Cara halaman dalam akan berfungsi

```html
<div id="rangka"></div>
<div class="kandungan"> … isi halaman … </div>

<script src="js/config.js?v=20260828-11"></script>
<script src="js/api.js?v=20260828-11"></script>
<script src="js/app.js?v=20260828-11"></script>
<script>
  var token = initHalaman('Dashboard');   // TETAMU jika belum log masuk
  if (token) { /* muat data halaman */ }
</script>
```

`initHalaman()` menyemak sesi, melukis sidebar, menandakan nav aktif,
dan memuatkan nama sekolah. Tanpa log masuk ia menggunakan token baca sahaja
`TETAMU`; panggilan halaman mesti menggunakan `AKSI.token()` dan bukan membaca
`sessionStorage` secara terus.
