# AKSI → GitHub : mula di sini

Satu fail ini sahaja yang tuan perlu ikut. `README.md` dan `PELAN-MIGRASI.md`
adalah rujukan teknikal — baca bila perlu, bukan sekarang.

---

## 1. Apa yang kita buat, dan kenapa

Sekarang AKSI hidup sepenuhnya di dalam Google Apps Script — kod *dan* muka
depan. Itu bermakna setiap kali nak ubah satu butang, tuan kena masuk editor
Apps Script, dan tiada sejarah perubahan, tiada salinan selamat.

Selepas migrasi:

| | Sekarang | Selepas |
|---|---|---|
| Muka depan (yang guru nampak) | Apps Script | GitHub Pages |
| Kod | dalam Apps Script sahaja | dalam repo GitHub |
| Data murid, kelab, markah | spreadsheet | **spreadsheet — tidak berubah** |
| Apps Script buat apa | semua | API JSON sahaja |

Spreadsheet kekal sebagai pusat data. Yang berpindah cuma kod.

---

## 2. Kedudukan sekarang

Sudah siap:

- Kesemua 27 fail sumber AKSI sudah keluar dari Apps Script, ada dalam
  folder `github-aksi\src\` di komputer tuan
- Repo `sepadan/aksi` sudah dicipta
- Skema 16 tab spreadsheet sudah didokumenkan (`README.md`)
- Pelan migrasi 6 fasa sudah siap (`PELAN-MIGRASI.md`)

Belum siap:

- Kod belum naik ke GitHub ← **ini tugas tuan sekarang**
- Muka depan GitHub Pages belum dibina ← tugas saya, selepas tuan pilih (bahagian 4)

---

## 3. TUGAS TUAN SEKARANG — naikkan kod ke GitHub

Anggaran 10 minit. Sama corak dengan dashboard dahulu.

### 3a. Semak fail sudah sampai

File Explorer → pergi ke:

```
C:\Users\seman\My Drive\2026\PROJEK\Dashboard SePadan\github-aksi\src
```

Mesti ada **27 fail**. Yang paling besar `Admin.html` (~52 KB), dan ada
`Code.gs` (~22 KB).

> Kalau saiz fail nampak 0 KB: itu masalah lama Google Drive — fail cuma
> *placeholder awan*. Klik kanan folder `github-aksi` → **Google Drive** →
> **Available offline**, tunggu sync selesai, semak semula.

### 3b. Buka Git Bash

Tekan **Windows** → taip `git bash` → **Enter**.

> Tampal dalam Git Bash: **klik kanan → Paste**. `Ctrl+V` tidak berfungsi.

### 3c. Klon repo (sekali sahaja)

```bash
cd ~
git clone https://github.com/sepadan/aksi.git
```

### 3d. Salin fail masuk

Satu arahan sahaja — ia menyalin semua sekali (`src/`, fail `.md`, `.gitignore`):

```bash
cp -r "/c/Users/seman/My Drive/2026/PROJEK/Dashboard SePadan/github-aksi/." ~/aksi/
```

`/.` di hujung laluan sumber bermaksud *isi folder ini*, bukan folder itu
sendiri — itu yang mengelakkan folder bersarang bila arahan ini diulang
kemudian. `~/aksi/` di hujung ialah destinasi; kalau bahagian itu tertinggal
semasa menampal, `cp` akan mengadu `missing destination file operand`.

Semak:

```bash
ls ~/aksi/src | wc -l
```

Mesti papar `27`. Kalau bukan 27, berhenti dan beritahu saya.

### 3e. Hantar

```bash
cd ~/aksi
git add -A
git commit -m "Sumber Apps Script AKSI + pelan migrasi"
git push
```

Buka https://github.com/sepadan/aksi untuk sahkan folder `src` ada di sana.

**Selepas ini, setiap kemas kini cuma tiga baris:**

```bash
cd ~/aksi
cp -r "/c/Users/seman/My Drive/2026/PROJEK/Dashboard SePadan/github-aksi/." ~/aksi/
git add -A && git commit -m "kemas kini" && git push
```

---

## 4. SATU KEPUTUSAN yang saya perlukan

Sistem log masuk AKSI sekarang: dua akaun sahaja, `admin` dan `guru`, dikongsi
oleh semua orang. Password disimpan sebagai SHA-256 tanpa salt, minimum 4
aksara, dan sesiapa yang tahu URL sistem boleh cuba meneka password tanpa had.

Saya perlu tahu arah mana sebelum membina muka depan baharu, sebab ia menentukan
bagaimana halaman log masuk berfungsi.

**Pilihan A — kekal seperti sekarang, tambah perlindungan**
Kekal `admin`/`guru`, tapi tambah had cubaan (cth 5 kali gagal = sekat 15 minit)
dan naikkan minimum password. Paling sedikit kerja, guru tak perlu belajar apa-apa
baharu.

**Pilihan B — Google Sign-In (cadangan saya)**
Guru log masuk dengan akaun MOE mereka sendiri. Tiada password untuk diurus,
tiada password untuk bocor, dan `LOG_AKTIVITI` akan menunjukkan siapa sebenarnya
buat apa. Kerja tambahan: perlu senaraikan e-mel guru dalam tab `GURU`.

**Pilihan C — kekal token, tapi seorang satu akaun**
Setiap guru dapat ID sendiri dalam tab `PENGGUNA`. Di tengah-tengah A dan B.
Tuan kena urus password 22 orang guru.

Jawab **A**, **B**, atau **C** sahaja — itu cukup.

---

## 5. Selepas itu

Saya bina muka depan berperingkat. Setiap fasa tuan cuma perlu buka pautan dan
beritahu saya sama ada ia berfungsi:

1. **Halaman log masuk** — ini ujian paling penting. Kalau log masuk dari
   `sepadan.github.io` berjaya, selebihnya mekanikal.
2. **Dashboard** dan **Muat Turun** — halaman baca sahaja, risiko rendah.
3. **Keahlian, Kehadiran, Laporan, Pencapaian, Penilaian** — halaman yang menulis data.
4. **Admin** dan **Setup**.
5. Barulah kita buang bahagian muka depan dari Apps Script.

**Sistem lama kekal hidup sepanjang masa ini.** Guru boleh terus guna AKSI
seperti biasa. Kita hanya menukar apabila versi baharu sudah terbukti berfungsi.

---

## 6. Pembersihan (boleh buat bila-bila)

Tiga perkara dari percubaan tadi yang sudah tidak berguna:

- **Token GitHub dalam Script Properties** — fungsi yang sepatutnya menggunakannya
  tidak boleh berjalan (Google sekat akses projek Cloud untuk akaun MOE). Elok
  dibuang: Apps Script → Project Settings → Edit script properties → padam
  `GITHUB_TOKEN`. Kemudian revoke token itu di
  https://github.com/settings/personal-access-tokens
- **Fail `PushKeGitHub.gs`** dalam projek Apps Script — kod mati, boleh dipadam.
- **Skop `script.projects.readonly`** dalam `appsscript.json` — boleh dibuang
  dari senarai `oauthScopes`. Empat skop lain mesti kekal.

Tiga-tiga ini tidak merosakkan apa-apa kalau dibiarkan. Cuma kemas.
