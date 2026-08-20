# docs/ — muka depan AKSI di GitHub Pages

Folder ini diterbitkan sebagai laman web. Tetapkan dalam repo:
**Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /docs**

GitHub Pages hanya boleh melayan dari akar repo atau dari `/docs` —
tiada pilihan folder lain. Sebab itu ia dinamakan `docs`, bukan `web`.

| Fail | Peranan |
|---|---|
| `index.html` | skrin log masuk |
| `css/style.css` | dijana dari `Style.html` projek Apps Script |
| `js/config.js` | URL `/exec` — satu-satunya tempat ia ditetapkan |
| `js/api.js` | dari `ApiShim.html` — `google.script.run` melalui `fetch` |
| `js/app.js` | sidebar, sesi, toast — ganti `Script.html` + `renderSidebar()` |

Halaman dalam (`dashboard.html`, `keahlian.html`, dan lain-lain)
belum dibina — itu Fasa 3 dan seterusnya.

## Cara halaman dalam akan berfungsi

```html
<div id="rangka"></div>
<div class="kandungan"> … isi halaman … </div>

<script src="js/config.js"></script>
<script src="js/api.js"></script>
<script src="js/app.js"></script>
<script>
  var token = initHalaman('Dashboard');   // null jika sesi tiada
  if (token) { /* muat data halaman */ }
</script>
```

`initHalaman()` menyemak sesi, melukis sidebar, menandakan nav aktif,
dan memuatkan nama sekolah. Kalau tiada token ia terus ke `index.html`.
