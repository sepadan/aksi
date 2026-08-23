# Pelan migrasi AKSI → GitHub Pages

Matlamat: spreadsheet = pusat data, Apps Script = API JSON, antara muka di
GitHub Pages (`https://sepadan.github.io/aksi/`).

---

## Berita baik: separuh kerja sudah siap

Semasa membaca kod, saya jumpa dua perkara yang mengubah anggaran kerja secara
drastik.

**1. `doPost` sudah menjadi API JSON generik.**
`Code.gs` sudah ada endpoint RPC lengkap dengan senarai putih 75 fungsi
(`API_DIBENARKAN`). Ia menerima `{"fn":"namaFungsi","args":[...]}` dan
memulangkan `{"ok":true,"hasil":...}`. Tiada API baharu perlu direka.

**2. `ApiShim.html` sudah menggantikan `google.script.run` dengan `fetch`.**
Shim itu sudah pun membuat panggilan **rentas-asal** hari ini — dari
`script.googleusercontent.com` (tempat HtmlService melayan halaman) ke
`script.google.com/macros/.../exec`. Ia guna `Content-Type: text/plain` supaya
tiada preflight CORS, dan `redirect: 'follow'`. Corak yang sama akan berfungsi
dari `sepadan.github.io` — asal yang berbeza, mekanisme yang sama.

Kesannya: migrasi ini bukan tulis semula. Ia **memindahkan fail HTML keluar
dari HtmlService** dan menggantikan enam corak templat.

---

## Enam gantian yang diperlukan

Hanya lima jenis skriptlet Apps Script wujud dalam 13 fail HTML:

| Sekarang | Selepas |
|---|---|
| `<?!= include('Style') ?>` | `<link rel="stylesheet" href="css/style.css">` |
| `<?!= include('Script') ?>` `<?!= include('ApiShim') ?>` | `<script src="js/api.js">` `<script src="js/app.js">` |
| `<?!= renderSidebar(token, peranan) ?>` | `renderSidebar()` di klien + fungsi API baharu `getSidebarData()` |
| `<?= token ?>` `<?= peranan ?>` | `sessionStorage.getItem('token' / 'peranan')` |
| `<?= url ?>` | pemalar `URL_EXEC` dalam `js/config.js` |
| `<?= namaSekolah ?>` `<?= tahunAkademik ?>` | dari `getSidebarData()` |

Satu fungsi backend baharu sahaja diperlukan:

```javascript
function getSidebarData(token) {
  if (!semakSesi(token)) return null;
  var t = getTetapan() || {};
  return {
    namaSekolah: t.NAMA_SEKOLAH || '',
    tahunAkademik: t.TAHUN_AKADEMIK || '',
    logo: t.LOGO || '',
    versi: VERSI_SISTEM
  };
}
```
…dan `'getSidebarData'` ditambah ke `API_DIBENARKAN`.

---

## Struktur repo sasaran

```
src/                    kod Apps Script (sumber rasmi)
  Code.gs  Auth.gs  ...  appsscript.json
web/                    diterbitkan oleh GitHub Pages
  index.html            = Login
  dashboard.html  keahlian.html  kehadiran.html
  laporan.html  pencapaian.html  penilaian.html
  senarai.html  admin.html  setup.html
  css/style.css         dari Style.html
  js/config.js          URL_EXEC
  js/api.js             dari ApiShim.html
  js/app.js             dari Script.html + renderSidebar klien
```

---

## Perubahan navigasi — dan satu pembaikan keselamatan percuma

Sekarang setiap pautan sidebar ialah
`.../exec?page=Keahlian&token=<uuid>`. **Token berjalan dalam URL** — ia masuk
ke sejarah pelayar, bar alamat, dan header `Referer`.

Selepas migrasi, pautan menjadi `keahlian.html` sahaja dan token kekal dalam
`sessionStorage`. Kebocoran itu hilang dengan sendirinya.

---

## Fasa

> **Status pada 23 Ogos 2026.** Struktur sasaran dalam pelan asal menyebut
> folder `src/` dan `web/`. Kenyataannya berbeza: kod Apps Script berada di
> **akar repo**, dan frontend berada dalam **`docs/`** (folder yang dihidangkan
> GitHub Pages). Pelan ini telah dikemas kini untuk mencerminkan keadaan sebenar.

**Fasa 1 — sumber di GitHub** ✅ **SIAP**
30 fail di akar repo (bukan `src/` seperti dirancang asalnya).

**Fasa 2 — rangka web** ✅ **SIAP DAN DISAHKAN BERFUNGSI**
`docs/css/style.css`, `docs/js/config.js`, `docs/js/api.js`, `docs/js/app.js`,
`docs/index.html`.

Log masuk dari `https://sepadan.github.io/aksi/` **berjaya pada 23 Ogos 2026**.
Itu ujian CORS sebenar, dan ia lulus. Ia juga membuktikan ketiga-tiga patch
Apps Script sudah masuk ke deployment: `Auth.gs` yang dipatch, fail baharu
`WebBackend.gs`, dan `getIdentitiAwam` serta `getSidebarData` dalam
`API_DIBENARKAN`.

**Fasa 3 — halaman baca** 🔨 **DIBINA, MENUNGGU PENGESAHAN**
`docs/dashboard.html`, `docs/senarai.html` — kedua-duanya wujud dan memuat
tanpa ralat JavaScript.

**Fasa 4 — halaman tulis** 🔨 **DIBINA, MENUNGGU PENGESAHAN**
`docs/keahlian.html`, `docs/kehadiran.html`, `docs/laporan.html`,
`docs/pencapaian.html`, `docs/penilaian.html` — kesemuanya wujud dan memuat
tanpa ralat JavaScript.

**Fasa 5 — admin & setup** 🔨 **DIBINA, MENUNGGU PENGESAHAN**
`docs/admin.html`, `docs/setup.html` — kedua-duanya wujud dan memuat tanpa
ralat JavaScript.

> ⚠️ *Dibina* bukan *disahkan*. Halaman yang memuat tanpa ralat hanya
> membuktikan cangkerangnya betul. Yang belum diuji ialah sama ada setiap
> operasi baca dan **tulis** benar-benar menyimpan ke spreadsheet. Gunakan
> senarai semak di bawah.

### Senarai semak pengesahan — Fasa 3, 4, 5

Buat setiap satu dari `https://sepadan.github.io/aksi/`, log masuk sebagai admin.
Selepas setiap tindakan **tulis**, buka spreadsheet AKSI dan sahkan barisnya
benar-benar masuk.

**Fasa 3 — baca sahaja, tiada risiko**

- [ ] `dashboard.html` — statistik terpapar, bukan sifar atau kosong
- [ ] `senarai.html` — senarai murid terpapar, carian berfungsi

**Fasa 4 — tulis. Uji dengan satu rekod, kemudian padam semula**

- [ ] `keahlian.html` — tambah seorang murid ke satu kelab, sahkan dalam tab `KEAHLIAN`, padam semula
- [ ] `kehadiran.html` — buat satu perjumpaan, tanda kehadiran, sahkan dalam tab `PERJUMPAAN` dan `KEHADIRAN`
- [ ] `laporan.html` — hantar satu laporan dengan **satu gambar**, sahkan PDF dijana dan `PDF_URL` terisi
- [ ] `pencapaian.html` — tambah satu pencapaian, sahkan dalam tab `PENCAPAIAN`, padam semula
- [ ] `penilaian.html` — isi markah seorang murid, sahkan dalam tab `PENILAIAN_KOKU`

**Fasa 5 — admin. Uji paling akhir**

- [ ] `admin.html` — buka setiap tab dalamnya, sahkan tiada yang kosong
- [ ] `setup.html` — buka sahaja, **jangan jalankan setup semula**

> Muat naik gambar dalam `laporan.html` ialah ujian paling berisiko. Muatan
> Apps Script terhad ~50 MB dan masa jalan 6 minit. Kalau gambar besar gagal,
> ia perlu dikecilkan di klien dahulu — lihat perkara 4 di bawah.

---

**Fasa 6 — kecilkan Apps Script**
⏸️ **BELUM BERMULA — dan memang belum patut.**

Buang semua `HtmlService` dari `Code.gs`; `doGet` tinggal untuk semakan
kesihatan. Padam 13 fail `.html` dari projek Apps Script.

**Jangan buat fasa ini sebelum senarai semak Fasa 3–5 di atas selesai
sepenuhnya.** Deployment lama ialah satu-satunya jaring keselamatan; sebaik ia
dibuang, tiada jalan pulang kalau ada operasi tulis yang rupanya tidak
berfungsi.

---

## Perkara yang perlu diputuskan / dibaiki

**1. Log masuk (belum diputuskan).**
Sekarang: dua akaun kongsi — `admin` dan `guru` — dalam tab `PENGGUNA`,
password sebagai SHA-256 **tanpa salt**, minimum 4 aksara, dan `login` boleh
dipanggil tanpa kebenaran oleh sesiapa yang tahu URL `/exec` (web app ditetapkan
`ANYONE_ANONYMOUS`). Tiada had cubaan.

Tiga pilihan:
- *Kekal token*, tambah had kadar + password lebih panjang. Paling sedikit kerja.
- *Google Sign-In* — guru log masuk dengan akaun MOE, `doPost` sahkan e-mel
  terhadap tab `GURU`. Tiada password langsung untuk diurus. Paling selamat.
- *Kekal token tapi seorang satu akaun* — supaya `LOG_AKTIVITI` bermakna;
  sekarang semua guru berkongsi identiti `guru`.

**2. Sesi tidak pernah dibuang.**
`buatToken` menulis Script Property `SESI_<uuid>` untuk setiap log masuk.
`semakSesi` hanya memadam sesi yang **dibaca semula selepas tamat tempoh 8 jam**
— sesi yang tidak pernah disentuh lagi kekal selama-lamanya. Sudah ada ratusan.
Script Properties ada had 500 KB; bila penuh, log masuk akan mula gagal.
Baiki dengan fungsi cuci berkala (pemicu harian) yang membuang `SESI_*` lebih
tua daripada 8 jam.

**3. `doPost` memanggil `this[req.fn]`.**
Berfungsi hari ini pada V8, tetapi rapuh. Lebih selamat: peta eksplisit
`var API = { login: login, logout: logout, ... }`.

**4. Gambar laporan.**
`Laporanbackend.gs` menyimpan gambar ke folder Drive (`DRIVE_FOLDER`) dan
menjana PDF. Muat naik dari GitHub Pages kekal melalui `doPost` — saiz muatan
Apps Script terhad ~50 MB tetapi masa jalan 6 minit; gambar besar perlu
dikecilkan di klien dahulu.

**5. `setXFrameOptionsMode(ALLOWALL)`** boleh dibuang selepas Fasa 6 — ia hanya
diperlukan kerana HtmlService melayan dalam iframe.
