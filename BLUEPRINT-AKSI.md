# Blueprint sambungan projek AKSI

> Sumber rujukan utama untuk menyambung projek menggunakan ChatGPT, Claude,
> Codex, atau sistem lain. Baca fail ini sepenuhnya sebelum mengubah kod.

**Dikemas kini:** 21 Ogos 2026, Asia/Kuala_Lumpur  
**Repositori rasmi:** `https://github.com/sepadan/aksi`  
**Laman produksi calon:** `https://sepadan.github.io/aksi/`  
**Sistem lama:** Google Apps Script HtmlService — masih perlu dikekalkan

## 1. Matlamat dan keadaan semasa

AKSI mengurus kokurikulum SK Paya Redan. Spreadsheet kekal sebagai pusat data,
Google Apps Script menjadi API JSON, dan antaramuka baharu dilayan oleh GitHub
Pages.

Keadaan semasa:

| Bahagian | Status | Bukti/catatan |
|---|---|---|
| Kod Apps Script di GitHub | Siap | branch `main` |
| GitHub Pages `/docs` | Hidup | halaman log masuk memberi HTTP 200 |
| API rentas-domain | Siap | `getIdentitiAwam` memberi `ok:true`; CORS `*` |
| Log masuk berkadar terhad | Kod siap | maksimum 5 cubaan, sekat 15 minit |
| Pembersihan sesi lama | Kod siap | pemasangan pemicu harian belum disahkan |
| Halaman baca | Kod siap | ujian akaun sebenar belum disahkan |
| Halaman tulis | Kod siap | ujian data sebenar belum disahkan |
| Admin dan Setup | Kod siap | ujian akaun sebenar belum disahkan |
| Pembuangan frontend lama | Belum | jangan buat sebelum semua ujian lulus |

Pilihan log masuk yang telah dilaksanakan ialah mengekalkan akaun kongsi
`admin` dan `guru`, dengan perlindungan had cubaan. Jangan tukar kepada Google
Sign-In tanpa keputusan baharu daripada pemilik projek.

## 2. Seni bina

```text
Pelayar guru
  -> GitHub Pages: /docs/*.html
  -> docs/js/api.js menukar google.script.run kepada fetch JSON
  -> URL backend tunggal dalam docs/js/config.js
  -> Google Apps Script doPost(e)
  -> fungsi yang disenaraiputihkan dalam API_DIBENARKAN
  -> Google Spreadsheet dan Google Drive
```

Peraturan penting:

- Token disimpan dalam `sessionStorage`, bukan URL.
- Permintaan dihantar sebagai `text/plain` untuk mengelakkan preflight CORS.
- Semua fungsi API mesti berada dalam `API_DIBENARKAN` dan tetap menyemak token
  atau peranan di peringkat fungsi.
- `getIdentitiAwam()` sahaja boleh dipanggil sebelum log masuk untuk nama,
  tahun, dan logo sekolah.
- `getSidebarData(token)` memerlukan sesi sah.
- URL deployment Apps Script hanya boleh ditetapkan dalam
  `docs/js/config.js`.

## 3. Fail penting

| Fail/folder | Tanggungjawab |
|---|---|
| `Code.gs` | `doGet`, `doPost`, whitelist API, dashboard dan fungsi teras |
| `Auth.gs` | login, logout, token sesi, had cubaan |
| `WebBackend.gs` | identiti awam, data sidebar, pembersihan sesi |
| `Murid.gs` | import murid secara pukal dan fungsi murid |
| `*Backend.gs` | logik domain setiap modul |
| `docs/index.html` | log masuk GitHub Pages |
| `docs/js/config.js` | URL `/exec` dan versi frontend |
| `docs/js/api.js` | adapter panggilan Apps Script kepada `fetch` |
| `docs/js/app.js` | sesi, sidebar, navigasi, logout, toast |
| `docs/*.html` | halaman aplikasi baharu |
| `patch-apps-script/` | salinan patch dalam folder kerja lama; bukan struktur repo rasmi |

Repositori GitHub meletakkan fail Apps Script di akar. Folder kerja Google Drive
yang digunakan pada 21 Ogos 2026 bukan klon Git: ia menyimpan salinan lama
dalam `src/` dan patch terbaharu dalam `patch-apps-script/`. Jangan anggap
`src/` sebagai sumber rasmi tanpa membandingkannya dengan GitHub.

## 4. Perubahan penting yang sudah dibuat

- Membina frontend GitHub Pages untuk Login, Dashboard, Senarai, Keahlian,
  Kehadiran, Laporan, Pencapaian, Penilaian, Admin, dan Setup.
- Menambah `WebBackend.gs` dengan `getIdentitiAwam`, `getSidebarData`,
  `cuciSesiLama`, dan `pasangPemicuCuciSesi`.
- Menambah `getIdentitiAwam` dan `getSidebarData` ke `API_DIBENARKAN`.
- Menambah had lima cubaan log masuk dan sekatan 15 minit dalam `Auth.gs`.
- Mengoptimumkan import murid daripada ratusan tulisan Sheets kepada satu
  tulisan pukal untuk mengurangkan ralat `Failed to fetch`.
- Menyimpan token frontend dalam `sessionStorage` supaya token tidak bocor
  melalui URL, sejarah pelayar, atau `Referer`.

## 5. Pengesahan automatik terakhir

Pada 21 Ogos 2026:

- `https://sepadan.github.io/aksi/` memberi HTTP 200 dan tajuk
  `Log Masuk — AKSI`.
- Kesemua 10 halaman HTML dan empat aset bersama (`style.css`, `config.js`,
  `api.js`, `app.js`) yang diterbitkan memberi HTTP 200.
- Panggilan POST `getIdentitiAwam` ke URL `/exec` memberi `ok:true`, identiti
  SK Paya Redan, tahun 2026, dan header CORS `*`.
- `Auth.gs`, `Code.gs`, `Murid.gs`, dan `WebBackend.gs` di GitHub sepadan tepat
  dengan folder patch tempatan.
- Aset utama dan halaman contoh di GitHub sepadan dengan `docs/` tempatan.
- Semua 10 skrip sebaris halaman HTML dan semua fail dalam `docs/js/` lulus
  semakan sintaks Node.js; jumlah ralat sintaks ialah sifar.

Pengesahan ini tidak membuktikan log masuk sebenar atau operasi baca/tulis
setiap modul. Kata laluan tidak tersedia dan tidak patut direkod dalam repo.

## 6. Langkah seterusnya — ikut urutan ini

### Langkah 1: ujian log masuk sebenar

Buka `https://sepadan.github.io/aksi/` dalam tetingkap InPrivate/Incognito dan
log masuk menggunakan akaun `guru`. Sahkan:

- identiti sekolah dan logo muncul;
- log masuk membawa pengguna ke `dashboard.html`;
- refresh kekal log masuk dalam tab sama;
- membuka aplikasi dalam tab/sesi baharu meminta log masuk semula;
- logout memadam sesi dan kembali ke `index.html`.

Jika gagal, rekod mesej tepat dan tangkap skrin Console/Network. Jangan ulang
kata laluan salah lima kali kerana akaun akan disekat 15 minit.

### Langkah 2: halaman baca

Uji `dashboard.html` dan `senarai.html` dahulu. Bandingkan nombor ringkasan dan
senarai dengan sistem lama. Jangan teruskan ke operasi tulis jika data baca
berbeza.

### Langkah 3: halaman tulis berperingkat

Uji mengikut urutan:

1. Keahlian
2. Kehadiran/perjumpaan
3. Laporan dan muat naik gambar/PDF
4. Pencapaian
5. Penilaian

Gunakan rekod ujian yang dipersetujui oleh pemilik. Sebelum mengubah data
produksi, ambil salinan Spreadsheet atau pilih rekod yang selamat untuk diuji.
Selepas setiap simpanan, semak hasil dalam frontend baharu, sistem lama, dan
tab Spreadsheet berkaitan.

### Langkah 4: Admin dan Setup

Uji dengan akaun `admin`, termasuk kawalan peranan. Jangan jalankan semula Setup
pada data produksi kecuali aliran itu memang diperlukan dan sandaran tersedia.

### Langkah 5: sahkan kerja operasi backend

Dalam Apps Script, sahkan pemicu harian untuk `cuciSesiLama` sudah dipasang dan
jalankan pembersihan sekali jika belum pernah dibuat.

### Langkah 6: tamatkan migrasi

Hanya selepas semua ujian lulus dan pemilik memberi arahan:

- jadikan frontend GitHub Pages sebagai laluan rasmi guru;
- kecilkan `doGet` Apps Script kepada semakan kesihatan;
- buang frontend HtmlService lama dan skop/opsyen iframe yang tidak diperlukan.

Sebelum langkah ini, sistem lama ialah jaring keselamatan dan tidak boleh
dipadam.

## 7. Senarai ujian penerimaan

| Modul | Baca | Tulis | Peranan | Status |
|---|---:|---:|---|---|
| Login/logout | Ya | sesi | guru/admin | Belum disahkan manual |
| Dashboard | Ya | Tidak | guru/admin | Belum disahkan manual |
| Senarai | Ya | eksport | guru/admin | Belum disahkan manual |
| Keahlian | Ya | Ya | guru/admin | Belum disahkan manual |
| Kehadiran | Ya | Ya | guru/admin | Belum disahkan manual |
| Laporan | Ya | Ya + fail | guru/admin | Belum disahkan manual |
| Pencapaian | Ya | Ya | guru/admin | Belum disahkan manual |
| Penilaian | Ya | Ya | guru/admin | Belum disahkan manual |
| Admin | Ya | Ya | admin sahaja | Belum disahkan manual |
| Setup | Ya | Ya | keadaan belum setup | Belum disahkan manual |

Tukar status dalam jadual ini selepas bukti ujian diterima.

## 8. Deployment

Frontend:

- GitHub Pages menggunakan branch `main`, folder `/docs`.
- Perubahan frontend diterbitkan selepas push ke `main` dan mungkin mengambil
  beberapa minit untuk muncul.

Backend:

- Salin/pergi segerakkan fail `.gs`, `.html`, dan `appsscript.json` ke projek
  Apps Script.
- Gunakan **Deploy -> Manage deployments -> Edit -> New version** supaya URL
  `/exec` kekal sama.
- Jika deployment baharu dengan URL baharu sengaja dibuat, ubah
  `docs/js/config.js` dan uji CORS/log masuk semula.

## 9. Risiko dan hutang teknikal

- Akaun `guru` masih dikongsi; log aktiviti tidak mengenal pasti guru sebenar.
- Hash password ialah SHA-256 tanpa salt. Had cubaan mengurangkan serangan tetapi
  tidak menggantikan sistem identiti individu.
- `doPost` masih menggunakan `this[req.fn]`; peta fungsi eksplisit lebih kukuh
  tetapi belum dilaksanakan.
- Pemasangan pemicu `cuciSesiLama` belum mempunyai bukti operasi.
- Laporan bergambar tertakluk pada had saiz dan masa Apps Script; gambar besar
  patut dikecilkan di klien jika ujian menunjukkan masalah.
- Folder kerja semasa bukan klon Git, jadi status `git diff` tempatan tidak
  tersedia. Untuk pembangunan seterusnya, gunakan klon sebenar repositori.

## 10. Peraturan untuk sesi AI seterusnya

1. Baca blueprint ini dan `PELAN-MIGRASI.md` sebelum bertindak.
2. Semak GitHub `main` sebagai sumber kod rasmi; jangan percaya salinan `src/`
   lama tanpa perbandingan.
3. Jangan masukkan IC, nama murid, markah, password, token, atau data produksi
   ke repo, log, tangkap skrin, atau prompt.
4. Jangan padam sistem lama sebelum senarai ujian penerimaan lengkap dan pemilik
   memberi arahan.
5. Selepas setiap perubahan, kemas kini sekurang-kurangnya tarikh, status,
   perubahan, ujian, risiko, dan langkah seterusnya dalam fail ini.
6. Jika perubahan belum diterbitkan atau diuji, nyatakan dengan jelas; jangan
   menandainya siap hanya kerana kod sudah ditulis.

## 11. Log blueprint

| Tarikh | Perubahan | Pengesahan | Seterusnya |
|---|---|---|---|
| 21 Ogos 2026 | Blueprint diwujudkan; status dokumentasi diselaraskan | Semua halaman/aset HTTP 200; API CORS, padanan fail dan sintaks JS disahkan | Ujian log masuk sebenar |
