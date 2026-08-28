# AKSI — Aplikasi Kokurikulum Sekolah Integrasi

Sistem pengurusan kokurikulum SK Paya Redan.

| | |
|---|---|
| Spreadsheet (pusat data) | `1ElBfhTcj1pcxYS6hA2mzTfEeX5udCskODnNdqU7G_dM` |
| Projek Apps Script | `1a-_G8leFyeftmf4jUB5JURZbZGYlmqlyKgRHm7H8sdqbFGXX5GFDwskK` |
| Pemilik | `sekolah-3458-cm1@moe-dl.edu.my` |
| Aplikasi web | https://sepadan.github.io/aksi/ |

## Struktur repo

```
*.gs  *.html          kod Apps Script — sumber rasmi, di akar repo
docs/                 aplikasi web, dihidangkan oleh GitHub Pages
  index.html          dashboard dan log masuk dalam halaman
  dashboard.html  senarai.html
  keahlian.html   kehadiran.html  laporan.html
  pencapaian.html penilaian.html
  admin.html      setup.html
  css/style.css
  js/config.js        URL /exec — satu-satunya tempat ia ditetapkan
  js/api.js           shim: google.script.run → fetch POST
  js/app.js           sesi, sidebar, navigasi
  js/pwa.js           pemasangan + semakan kemas kini automatik
  manifest.webmanifest
  service-worker.js   cache cangkerang statik sahaja
  offline.html        mesej apabila tiada internet
  icons/              ikon AKSI untuk Android, iOS dan pelayar
```

## Bagaimana aplikasi web berfungsi

Spreadsheet kekal sebagai pusat data. Apps Script menjadi **API JSON** —
`doPost` menerima `{"fn":"namaFungsi","args":[...]}` dan memulangkan
`{"ok":true,"hasil":...}`, dengan senarai putih `API_DIBENARKAN`.

Antara muka pula dihidangkan sebagai fail statik dari GitHub Pages.
`docs/js/api.js` memasang *shim*: ia menggantikan `google.script.run` dengan
`Proxy` yang menghantar `fetch` POST ke `/exec`, guna
`Content-Type: text/plain` supaya tiada preflight CORS. Kesannya, setiap
halaman masih memanggil `google.script.run` seperti biasa — tiada satu pun
panggilan perlu ditulis semula.

**Versi semasa:** `AKSI v1.5.0 · PWA`. Aplikasi boleh ditambah ke homescreen
Android/iPhone. Setiap kali dibuka, ia menyemak Service Worker baharu dan
mengemas kini sendiri tanpa perlu dipasang semula. Cache dihadkan kepada HTML,
CSS, JavaScript dan ikon; jawapan API, token serta data murid tidak dicache.

Upload data murid atau guru oleh admin AKSI turut menyelaraskan data asas ke
HADIR dan SEMAK. Syarat AKSI tetap berkuat kuasa: kelas layak kokurikulum,
keahlian, kehadiran, pencapaian, PAJSK, akaun dan kata laluan tidak dikongsi.
Rahsia relay disimpan dalam Script Properties, bukan dalam repo.

Tambah/edit guru menggunakan mod gabung. Nyahaktif atau sync penuh menyamakan
senarai aktif di ketiga-tiga sistem; rekod guru yang tiada ditanda
`TIDAK AKTIF`, bukan dipadam, supaya akaun, tugasan dan sejarah kekal.

**Status:** log masuk dari GitHub Pages disahkan berfungsi pada 23 Ogos 2026.
Halaman selebihnya sudah dibina dan menunggu pengesahan operasi baca/tulis —
lihat senarai semak dalam `PELAN-MIGRASI.md`.

> Bila deployment Apps Script ditukar, kemas kini `docs/js/config.js`.
> Guna **Manage deployments**, bukan **New deployment** — New deployment
> mencipta URL baharu dan memutuskan aplikasi web.

## Tab spreadsheet (16)

| Tab | Lajur |
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
| `GURU` | ID_GURU, NAMA_GURU, JAWATAN, STATUS |
| `PENGGUNA` | ID_PENGGUNA, PERANAN, PASSWORD_HASH |
| `LOG_AKTIVITI` | TARIKH_MASA, PENGGUNA, TINDAKAN, BUTIRAN |

Kunci `TETAPAN` yang digunakan: `NAMA_SEKOLAH`, `KOD_SEKOLAH`, `JENIS_SEKOLAH`
(`rendah`/`menengah`), `TAHUN_AKADEMIK`, `DRIVE_FOLDER`, `TARIKH_SETUP`, `LOGO`
(data-URL), `TAHUN_KOKU_UNIT`, `TAHUN_KOKU_KELAB`, `TAHUN_KOKU_SUKAN`.

## Tiada data peribadi dalam repo ini

Repo awam. Hanya kod. IC murid, nama, dan markah kekal dalam spreadsheet.
