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
| Kod Apps Script di GitHub | Siap | branch `main`, disahkan selaras 21 Ogos |
| GitHub Pages `/docs` | Hidup | halaman log masuk memberi HTTP 200 |
| API rentas-domain | Siap | `getIdentitiAwam` memberi `ok:true`; CORS `*` |
| Log masuk berkadar terhad | Kod siap | maksimum 5 cubaan, sekat 15 minit |
| Pembersihan sesi lama | Kod siap | pemasangan pemicu harian belum disahkan |
| Halaman baca | Diuji separa | Dashboard disahkan memaparkan data sebenar |
| Halaman tulis | Kod siap | ujian data sebenar belum disahkan |
| Admin dan Setup | Kod siap | ujian akaun sebenar belum disahkan |
| Pembuangan frontend lama | Belum | jangan buat sebelum semua ujian lulus |

Pilihan log masuk yang telah dilaksanakan ialah mengekalkan akaun kongsi
`admin` dan `guru`, dengan perlindungan had cubaan. Jangan tukar kepada Google
Sign-In tanpa keputusan baharu daripada pemilik projek.

### Identiti dan alamat

| Perkara | Nilai |
|---|---|
| Spreadsheet | `1ElBfhTcj1pcxYS6hA2mzTfEeX5udCskODnNdqU7G_dM` |
| Projek Apps Script | `1a-_G8leFyeftmf4jUB5JURZbZGYlmqlyKgRHm7H8sdqbFGXX5GFDwskK` |
| Endpoint `/exec` | `https://script.google.com/macros/s/AKfycby0Td2p3zoAdBWXYbbKTqmVS4Xa8R42k0suzeDFTIjgwg-hVxIzYqNkEyTE75E_bukfLA/exec` |
| Pemilik fail Google | `sekolah-3458-cm1@moe-dl.edu.my` (akaun MOE sekolah) |
| Sekolah | Sekolah Kebangsaan Paya Redan · kod `JBA5054` |
| Folder kerja tempatan | `C:\Users\seman\My Drive\2026\PROJEK\Dashboard SePadan\github-aksi\` |

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
bukan klon Git: ia menyimpan salinan lama dalam `src/` dan patch terbaharu dalam
`patch-apps-script/`. Jangan anggap `src/` sebagai sumber rasmi tanpa
membandingkannya dengan GitHub.

Pemilik memuat naik dengan **seret fail ke laman GitHub**, bukan Git. Itu
keputusan sedar, bukan kekurangan — lihat Bahagian 14.

Peraturan mudah untuk menentukan tempat sesuatu fail: kalau ia mengandungi
`SpreadsheetApp` ia milik akar repo; kalau ia mengandungi
`document.getElementById` ia milik `docs/`.

## 4. Skema spreadsheet — 16 tab

| Tab | Lajur (mengikut turutan) |
|---|---|
| `TETAPAN` | KUNCI, NILAI |
| `MURID_MASTER` | IC, NAMA, TAHUN, KELAS, KELAS_LABEL, JANTINA, AGAMA, KAUM, STATUS, TARIKH_KEMASKINI |
| `KELAB` | ID_KELAB, NAMA_KELAB, KATEGORI, JENIS_KELAB, GURU_PENASIHAT_1, GURU_PENASIHAT_2, STATUS |
| `KEAHLIAN` | IC, ID_KELAB, KATEGORI, JAWATAN, TAHUN_AKADEMIK, STATUS |
| `PERJUMPAAN` | ID_PERJUMPAAN, ID_KELAB, TARIKH, MASA, TEMPAT, BIL_HADIR, BIL_AHLI |
| `KEHADIRAN` | ID_PERJUMPAAN, IC, STATUS |
| `LAPORAN_PERJUMPAAN` | ID_LAPORAN, ID_PERJUMPAAN, ID_KELAB, TAJUK, AKTIVITI, NAMA_GURU, TARIKH_HANTAR, PDF_URL |
| `GAMBAR_LAPORAN` | ID_GAMBAR, ID_LAPORAN, NAMA_FAIL, URL_DRIVE |
| `PENCAPAIAN` | ID_PENCAPAIAN, IC, NAMA_PERTANDINGAN, KATEGORI_PERTANDINGAN, PERINGKAT, TEMPAT_KEPUTUSAN, JENIS_PENGLIBATAN, TARIKH, GURU_PENGIRING, ID_KELAB, TAHUN_AKADEMIK |
| `PENILAIAN_KOKU` | IC, ID_KELAB, TAHUN_AKADEMIK, MARKAH_JAWATAN, MARKAH_PENGLIBATAN, MARKAH_KOMITMEN, MARKAH_KHIDMAT, MARKAH_KEHADIRAN, MARKAH_PENCAPAIAN, JUMLAH_110, JUMLAH_100 |
| `KOMITMEN_DETAIL` | IC, ID_KELAB, TAHUN_AKADEMIK, ASPEK_KOMITMEN, MARKAH |
| `EKSTRA_KURIKULUM` | IC, TAHUN_AKADEMIK, JENIS_EKSTRA, PERKARA, PERINGKAT, MARKAH |
| `PAJSK_SUMMARY` | IC, TAHUN, MARKAH_KP, MARKAH_PBB, MARKAH_SP, EKSTRA, GPA, CGPA, MARKAH_10_PERATUS, GRED |
| `GURU` | ID_GURU, NAMA_GURU, JAWATAN |
| `PENGGUNA` | ID_PENGGUNA, PERANAN, PASSWORD_HASH |
| `LOG_AKTIVITI` | TARIKH_MASA, PENGGUNA, TINDAKAN, BUTIRAN |

Kunci dalam tab `TETAPAN`: `NAMA_SEKOLAH`, `KOD_SEKOLAH`, `JENIS_SEKOLAH`
(`rendah`/`menengah`), `TAHUN_AKADEMIK`, `DRIVE_FOLDER`, `TARIKH_SETUP`,
`LOGO` (data-URL), `TAHUN_KOKU_UNIT`, `TAHUN_KOKU_KELAB`, `TAHUN_KOKU_SUKAN`
(senarai tahun dipisah koma, cth `4,5,6`).

**Perangkap jenis data:** Sheets menyimpan IC dan TAHUN sebagai **nombor**,
tetapi nilai dari pelayar tiba sebagai **teks**. Perbandingan `===` terus akan
gagal secara senyap. Gunakan helper `samaNilai(a, b)` dalam `Code.gs`.

## 5. Kontrak API

Semua panggilan ialah satu POST ke `/exec`:

```javascript
fetch(URL_EXEC, {
  method: 'POST',
  redirect: 'follow',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ fn: 'namaFungsi', args: [arg1, arg2] })
})
```

Jawapan: `{ ok: true, hasil: ... }` atau `{ ok: false, ralat: "..." }`.

`Content-Type: text/plain` wajib — ia mengelakkan preflight CORS.
`redirect: 'follow'` wajib — Apps Script membalas 302 ke
`script.googleusercontent.com`.

Token ialah argumen **terakhir** pada kebanyakan fungsi. Setiap fungsi
menyemak `semakSesi(token)` sendiri dan memulangkan `null` jika sesi tidak sah.

### `API_DIBENARKAN` — senarai penuh

```
login, logout, getTetapan, getScriptUrl,
getIdentitiAwam, getSidebarData,
getDashboardSemua, getStatistikDashboard, getAmaranDashboard,
getPerjumpaanTerkini, getStatusLaporan,
kemaskiniTetapan, simpanLogo,
importMurid, exportTemplateKoku, importKeahlian, getSenaraiMurid,
getSenaraiKelab, getSenaraiKelabPenuh, tambahKelab, togolStatusKelab,
padamKelab, tukarJenisKelab, getSenaraiJenisKoku,
getSenaraiGuru, tambahGuru, padamGuru, importGuru,
buatPerjumpaan, getPerjumpaanKelab, getKehadiran, simpanKehadiran,
padamPerjumpaan,
simpanLaporan, getLaporan, padamLaporan,
tambahPencapaian, getSenaraiPencapaian, padamPencapaian,
simpanKomitmen, simpanKhidmat, simpanPenglibatan, simpanJawatan,
getPenilaianMurid, simpanEkstra, getEkstraMurid,
getSenaraiJawatanKelab, getMarkahPenglibatan, getAhliKelab,
getKeahlianMuridPenilaian,
kiraPAJSK, getSenaraiPAJSK, getPeneranganGred,
getAnggaranMurid, getAnggaranKelas, simpanAnggaranKeRekod,
getDataKeahlianKelab, cariMuridUntukKeahlian,
getSemakanKeahlian, tukarKelabAhli, tambahAhliKelab,
tukarJawatanAhli, buangAhliKelab, padamKeahlianKekal,
getSenaraiKelasAktif, getSenaraiIkutKelas,
getStatusArkib, tutupTahunAkademik,
buatBackupManual, togolBackupAutomatik,
jalankanSetup, semakSetup
```

Fungsi baharu yang tidak dimasukkan ke senarai ini akan membalas
"Fungsi tidak dibenarkan."

## 6. Kontrak frontend

Rangka setiap halaman dalam:

```html
<div id="loading-overlay" class="loading-overlay"><div class="spinner"></div></div>
<div id="toast" class="toast"></div>
<div id="rangka"></div>
<div class="kandungan"> … isi halaman … </div>

<script src="js/config.js"></script>
<script src="js/api.js"></script>
<script src="js/app.js"></script>
<script>
  var token = initHalaman('Dashboard');   // null jika sesi tiada
</script>
```

`initHalaman(nav)` menyemak sesi, melukis sidebar, menandakan nav aktif, dan
memuatkan nama sekolah serta logo. Kalau tiada token ia terus ke `index.html`.
Nilai `nav` yang sah: `Dashboard`, `Keahlian`, `Kehadiran`, `Laporan`,
`Pencapaian`, `Penilaian`, `Senarai`, `Admin`.

Yang disediakan `app.js`:

| Fungsi | Kegunaan |
|---|---|
| `initHalaman(nav)` | permulaan setiap halaman dalam |
| `AKSI.token()` `AKSI.peranan()` `AKSI.isAdmin()` | maklumat sesi |
| `AKSI.sahHasil(hasil)` | `null` = sesi tamat → toast + balik log masuk |
| `AKSI.bilaSedia(fn)` | terima `{namaSekolah, tahunAkademik, logo, peranan, versi}` |
| `pergiHalaman(nav)` | navigasi antara halaman |
| `logout()` `togolSidebar()` | kawalan sidebar |
| `tunjukToast(mesej, jenis)` | `jenis`: `berjaya` atau `ralat` |
| `tunjukLoading(bool)` | overlay spinner |
| `formatTarikh(t)` | tarikh gaya `ms-MY` |

Sesi dalam `sessionStorage`: kunci `token` dan `peranan`.

### Menukar halaman HtmlService lama kepada statik

Gunakan skrip, jangan tulis semula dengan tangan — kod terbukti kekal huruf
demi huruf dan skrip tidak boleh tersilap taip.

1. `<html>` → `<html lang="ms">`
2. `<base target="_top">` → meta charset/viewport/robots + `<title>`
3. `<?!= include('Style') ?>` → `<link rel="stylesheet" href="css/style.css">`
4. `<?!= renderSidebar(token, peranan) ?>` → `<div id="rangka"></div>`
5. `<?!= include('Script') ?>` → tiga tag `<script src>`
6. Buang IIFE yang menyalin `'<?= token ?>'` ke `sessionStorage`
7. `semakSesiAktif()` → `initHalaman('Nav')` — yang asal tidak melukis sidebar
8. `pergiHalaman('X')` kekal — `app.js` sudah beri penggantinya
9. **Kekalkan skrip halaman di aras atas, bukan dalam IIFE**, supaya
   `onclick="..."` inline terus berfungsi
10. `Setup.html` khas: buang `window.URL_EXEC = '<?= url ?>'`,
    `<?!= include('ApiShim') ?>` → config.js + api.js, dan
    `pergiLoginSekarang()` → `location.href='index.html'`

Semakan selepas menukar: tiada baki `<?…?>`; sintaks setiap blok skrip sah;
ada `#rangka`, `style.css`, `config.js`, `api.js`; setiap fungsi dalam
`onclick=`/`onchange=` benar-benar wujud.

Kelas CSS yang memang tiada dalam `style.css` — juga tiada dalam versi asal,
jadi bukan ralat penukaran: `.kad-info`, `.senarai-amaran`, `.senarai-item`,
`.amaran-ikon`, `.masa`, `.no-print`.

## 7. Perubahan penting yang sudah dibuat

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
- Menggantikan `getTetapan()` pada skrin log masuk dengan `getIdentitiAwam()`,
  yang hanya memulangkan tiga medan dan bukan keseluruhan tab TETAPAN kepada
  pelawat yang belum log masuk.

### 7b. Mod tetamu dan log masuk gaya SEMAK — 23 Ogos 2026

**Apa yang berubah**

- `index.html` bukan lagi skrin log masuk. Ia kini **dashboard**, dan
  sesiapa boleh membukanya tanpa kata laluan. Log masuk ialah panel yang
  muncul di atas halaman, bukan muka depan berasingan.
- `dashboard.html` menjadi ubah hala ke `index.html` supaya penanda buku
  lama tidak mati.
- Log masuk guru menggunakan **dropdown nama** dari tab `GURU`, bukan
  medan teks. Log masuk admin ialah tab kedua dalam panel yang sama.
- Halaman Tetapan mendapat borang **Tukar kata laluan admin** dan
  **Tukar kata laluan guru** (pilih guru + kata laluan), serta butang
  **Segerak Akaun Guru**.

**Model kebenaran — empat peranan**

| Peranan | Boleh |
|---|---|
| (tiada sesi) | log masuk, identiti sekolah, senarai nama guru |
| `tetamu` | baca semua paparan; tiada tambah, edit atau padam |
| `guru` | baca + kerja harian |
| `admin` | semua, termasuk tetapan, import, akaun dan arkib |

**Di mana ia dikuatkuasakan**

Satu tempat: `doPost` dalam `Kebenaran.gs`. Ia menyemak peranan
**sebelum** fungsi sasaran dijalankan. `Kebenaran.gs` menggantikan
`doPost` dan `API_DIBENARKAN` yang dahulunya dalam `Code.gs` — kedua-dua
yang lama **mesti dibuang**, kerana dua `doPost` dalam satu projek Apps
Script memberi tingkah laku tidak menentu.

Senarai IZIN, bukan senarai LARANG. Fungsi baharu yang tidak
disenaraikan **ditolak secara lalai**, walaupun kepada admin. Terlupa
menyenaraikan fungsi baharu menyebabkan ia tidak berfungsi dan cepat
disedari; terlupa melarangnya menyebabkan lubang senyap.

**Sesi tetamu tidak disimpan**

Token tetamu ialah pemalar `'TETAMU'` yang dikenali oleh `semakSesi()`.
Ia tidak menulis Script Property. Kalau setiap pelawat awam menulis satu
sesi, kuota 500 KB akan habis dan **log masuk guru yang sebenar mula
gagal** — pelawat awam menjatuhkan sekolah.

**Perlindungan IC**

`TETAMU_LINDUNG_IC = true` dalam `Kebenaran.gs`. Setiap nombor 12 digit
dalam jawapan kepada tetamu ditukar kepada `••••••••1651`. Nama, kelas
dan semua paparan lain kekal.

Ditapis di **pelayan**, bukan dengan CSS. Menyembunyikan IC di pelayar
tidak melindungi apa-apa — sesiapa boleh membuka panel rangkaian dan
membacanya. Kalau ia tidak sepatutnya keluar, ia tidak boleh dihantar.

> Tukar kepada `false` untuk memaparkan IC penuh kepada sesiapa sahaja
> yang membuka alamat AKSI, termasuk orang di luar sekolah. Nombor
> MyKad kanak-kanak digunakan untuk pengesahan identiti; sebab itu ia
> dilindungi secara lalai.

**`getTetapan` ditutup dari web.** Ia dahulu ada dalam `API_DIBENARKAN`
**tanpa semakan token** — sesiapa boleh memulangkan seluruh tab
`TETAPAN`. Ia kini bukan API sama sekali; `getIdentitiAwam()` memberi
tiga medan yang benar-benar diperlukan.

**Menyembunyikan butang bukan keselamatan.** `app.js` menyembunyikan
kawalan tulis daripada tetamu, termasuk butang yang dijana kemudian
(melalui `MutationObserver`). Itu kesopanan — supaya guru tidak menekan
butang yang pasti gagal. Perlindungan sebenar ialah `doPost`.

## 8. Pengesahan automatik terakhir

Pada 21 Ogos 2026:

- `https://sepadan.github.io/aksi/` memberi HTTP 200 dan tajuk
  `Log Masuk — AKSI`.
- Kesemua 10 halaman HTML dan empat aset bersama (`style.css`, `config.js`,
  `api.js`, `app.js`) yang diterbitkan memberi HTTP 200.
- Panggilan POST `getIdentitiAwam` ke URL `/exec` memberi `ok:true`, identiti
  SK Paya Redan, tahun 2026, dan header CORS `*`.
- `Auth.gs`, `Code.gs`, `Murid.gs`, dan `WebBackend.gs` di GitHub sepadan tepat
  dengan folder patch tempatan. Disemak semula secara berasingan: `Auth.gs` di
  GitHub mengandungi `MAKS_CUBAAN` dan `bukaSekatan`.
- Aset utama dan halaman contoh di GitHub sepadan dengan `docs/` tempatan.
- Semua 10 skrip sebaris halaman HTML dan semua fail dalam `docs/js/` lulus
  semakan sintaks Node.js; jumlah ralat sintaks ialah sifar.
- Log masuk sebenar dari GitHub Pages berjaya dan membawa ke `dashboard.html`;
  dashboard memaparkan nombor sebenar, bukan tanda `-`.

Pengesahan ini tidak membuktikan operasi baca/tulis setiap modul. Kata laluan
tidak tersedia dan tidak patut direkod dalam repo.

## 9. Langkah seterusnya — ikut urutan ini

### Langkah 1: ujian log masuk sebenar

Buka `https://sepadan.github.io/aksi/` dalam tetingkap InPrivate/Incognito dan
log masuk menggunakan akaun `guru`. Sahkan:

- identiti sekolah dan logo muncul;
- log masuk membawa pengguna ke `dashboard.html`;
- refresh kekal log masuk dalam tab sama;
- membuka aplikasi dalam tab/sesi baharu meminta log masuk semula;
- logout memadam sesi dan kembali ke `index.html`.

Jika gagal, rekod mesej tepat dan tangkap skrin Console/Network. Jangan ulang
kata laluan salah lima kali kerana akaun akan disekat 15 minit. Kalau tersekat,
jalankan `bukaSekatan('guru')` dari editor Apps Script.

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
- buang `renderSidebar()` dan `include()` daripada `Code.gs`;
- buang `getTetapan` dan `getScriptUrl` daripada `API_DIBENARKAN`;
- buang frontend HtmlService lama dan `setXFrameOptionsMode(ALLOWALL)`.

Sebelum langkah ini, sistem lama ialah jaring keselamatan dan tidak boleh
dipadam.

## 10. Senarai ujian penerimaan

| Modul | Baca | Tulis | Peranan | Status |
|---|---:|---:|---|---|
| Login/logout | Ya | sesi | guru/admin | Log masuk disahkan; logout belum |
| Dashboard | Ya | Tidak | guru/admin | Disahkan memaparkan data sebenar |
| Senarai | Ya | eksport | guru/admin | Belum disahkan manual |
| Keahlian | Ya | Ya | guru/admin | Belum disahkan manual |
| Kehadiran | Ya | Ya | guru/admin | Belum disahkan manual |
| Laporan | Ya | Ya + fail | guru/admin | Belum disahkan manual |
| Pencapaian | Ya | Ya | guru/admin | Belum disahkan manual |
| Penilaian | Ya | Ya | guru/admin | Belum disahkan manual |
| Admin | Ya | Ya | admin sahaja | Import murid gagal `Failed to fetch`; pembetulan disediakan, belum diuji |
| Setup | Ya | Ya | keadaan belum setup | Belum disahkan manual |

Tukar status dalam jadual ini selepas bukti ujian diterima.

## 11. Deployment

Frontend:

- GitHub Pages menggunakan branch `main`, folder `/docs`.
- GitHub Pages hanya boleh melayan dari akar repo atau `/docs` — tiada pilihan
  folder lain. Itu sebabnya namanya `docs`, bukan `web`.
- Perubahan frontend diterbitkan selepas push ke `main` dan mungkin mengambil
  beberapa minit untuk muncul.

Backend:

- Salin fail `.gs`, `.html`, dan `appsscript.json` ke projek Apps Script.
- Gunakan **Deploy → Manage deployments → Edit → New version** supaya URL
  `/exec` kekal sama.
- Jika deployment baharu dengan URL baharu sengaja dibuat, ubah
  `docs/js/config.js` dan uji CORS/log masuk semula.

## 12. Halangan yang sudah dicuba dan gagal

Bahagian ini menjimatkan masa paling banyak. Jangan cadangkan semula
perkara-perkara ini tanpa membaca sebabnya.

**Apps Script API tidak boleh dihidupkan.** Projek Cloud lalai `671722095071`
menolak akaun MOE — `resourcemanager.projects.get` dan
`serviceusage.services.list` kedua-duanya tiada kebenaran, dan permintaan akses
pergi kepada pentadbir MOE. Maka `clasp`, push automatik, dan apa-apa yang
menggunakan `script.googleapis.com` **tidak berfungsi**. Fail `PushKeGitHub.gs`
dalam projek ialah bangkai percubaan ini dan patut dipadam bersama Script
Property `GITHUB_TOKEN` serta skop `script.projects.readonly`.

**Cara kod dikeluarkan dari Apps Script.** Kerana API disekat, sumber projek
dikeluarkan dengan menjalankan JavaScript dalam tab editor yang membaca
`monaco.editor.getModels()`, memetakan model kepada nama fail mengikut panjang
teks, dan memuat turunnya sebagai satu fail JSON. Gunakan kaedah yang sama jika
perlu menarik kod semula.

**Fail dalam Google Drive kadang-kadang placeholder awan.** Saiz nampak 0 KB dan
muat naik gagal atau memuat naik versi lama. Penyelesaian: klik kanan folder →
Google Drive → Available offline, tunggu sync, cuba semula.

**Menulis ke Sheets dalam gelung adalah perangkap.** `importMurid` versi asal
memanggil `setValues()` sekali bagi setiap murid — 223 murid bermakna lebih
seminit masa jalan, dan pelayar membalas `Failed to fetch` walaupun import
sebenarnya berjaya. Betulkan dengan mengumpul semua perubahan dalam ingatan dan
menulis sekali sahaja. **Semak corak yang sama dalam fungsi lain sebelum
menambah ciri baharu** — kelemahan ini mungkin masih wujud di tempat lain.

**`Failed to fetch` bukan bermakna operasi gagal.** Ia bermakna pelayar
kehilangan sambungan. Semak `LOG_AKTIVITI` dan Apps Script → Executions sebelum
mencuba semula, supaya tidak menjalankan operasi yang sama dua kali.

## 13. Risiko dan hutang teknikal

- Akaun `guru` masih dikongsi; log aktiviti tidak mengenal pasti guru sebenar.
- Hash password ialah SHA-256 tanpa salt, minimum 4 aksara. Had cubaan
  mengurangkan serangan tetapi tidak menggantikan sistem identiti individu.
- Had cubaan mengira ikut **ID**, bukan IP — Apps Script tidak mendedahkan IP.
  Orang berniat jahat boleh sengaja menyekat akaun `guru` selama 15 minit.
- URL `/exec` terdedah kerana ia berada dalam `config.js` di repo awam. Ini
  tidak dapat dielakkan pada seni bina statik.
- `doPost` masih menggunakan `this[req.fn]`; peta fungsi eksplisit lebih kukuh
  tetapi belum dilaksanakan.
- Pemasangan pemicu `cuciSesiLama` belum mempunyai bukti operasi.
- Laporan bergambar tertakluk pada had saiz dan masa Apps Script; gambar besar
  patut dikecilkan di klien jika ujian menunjukkan masalah.
- `dashboard.html` dan `senarai.html` ditulis semula dengan tangan dan mendapat
  tiga pembaikan yang halaman lain **tidak** ada: `withFailureHandler` pada
  setiap panggilan, `AKSI.sahHasil()` untuk sesi tamat, dan helper `esc()`
  sebelum `innerHTML`. Lima halaman lain dan `admin.html` ditukar secara
  mekanikal, jadi ia masih tiada ketiga-tiganya.
- Folder kerja tempatan bukan klon Git, jadi `git diff` tidak tersedia.

## 14. Peraturan untuk sesi AI seterusnya

1. Baca blueprint ini sebelum bertindak, terutamanya Bahagian 12.
2. **Pemilik projek seorang guru, bukan jurutera perisian.** Beliau menggunakan
   Windows, GitHub melalui pelayar, dan editor Apps Script, dan **tidak selesa
   dengan terminal**. Cadangkan langkah melalui antara muka web dahulu; simpan
   arahan baris perintah sebagai pilihan kedua sahaja. Bahasa perbualan ialah
   Bahasa Melayu.
3. Semak GitHub `main` sebagai sumber kod rasmi; jangan percaya salinan `src/`
   lama tanpa perbandingan.
4. **Repo mesti sentiasa selaras.** Setiap kali kod ditukar dalam editor Apps
   Script, muat naik fail itu ke repo pada hari yang sama. Repo pernah lapuk
   sekali dan itu mengalahkan seluruh tujuan migrasi.
5. Fungsi backend baharu mesti dimasukkan ke `API_DIBENARKAN`.
6. Jangan tulis ke Sheets dalam gelung.
7. Jangan masukkan IC, nama murid, markah, password, token, atau data produksi
   ke repo, log, tangkap skrin, atau prompt.
8. Jangan padam sistem lama sebelum senarai ujian penerimaan lengkap dan pemilik
   memberi arahan.
9. Selepas setiap perubahan, kemas kini sekurang-kurangnya tarikh, status,
   perubahan, ujian, risiko, dan langkah seterusnya dalam fail ini.
10. Jika perubahan belum diterbitkan atau diuji, nyatakan dengan jelas; jangan
    menandainya siap hanya kerana kod sudah ditulis.

## 15. Log blueprint

| Tarikh | Perubahan | Pengesahan | Seterusnya |
|---|---|---|---|
| 21 Ogos 2026 | Blueprint diwujudkan; status dokumentasi diselaraskan | Semua halaman/aset HTTP 200; API CORS, padanan fail dan sintaks JS disahkan | Ujian log masuk sebenar |
| 23 Ogos 2026 | Mod tetamu; log masuk dalam halaman gaya SEMAK; dropdown nama guru; tukar kata laluan admin/guru dalam Tetapan; kebenaran dipusatkan dalam `Kebenaran.gs`; `getTetapan` ditutup dari web; IC dilindungi daripada tetamu | 37 ujian kebenaran (Node) + 26 ujian pelayar (Playwright) lulus; 7 halaman dimuat dalam mod tetamu tanpa ralat JS dan tanpa kawalan tulis kelihatan | Pasang di Apps Script, buang `doPost` lama dari `Code.gs`, tekan Segerak Akaun Guru |
| 21 Ogos 2026 | Digabungkan dengan blueprint kedua: ditambah skema 16 tab, `API_DIBENARKAN` penuh, kontrak `app.js`, resipi penukaran halaman, dan Bahagian 12 Halangan | `Auth.gs` di GitHub disemak semula mengandungi `MAKS_CUBAAN` dan `bukaSekatan`; log masuk sebenar dan dashboard disahkan | Uji halaman tulis; pasang `Murid.gs` v2 |

---
