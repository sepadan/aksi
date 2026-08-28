# Salinan kod Apps Script AKSI

Folder ini ialah **cerminan**, bukan kod yang berjalan. Kod sebenar hidup
dalam editor Apps Script Google, dan editor itulah yang betul apabila
kedua-duanya berbeza.

---

## Kenapa ia wujud

Apps Script tiada kawalan versi yang tuan miliki. Kalau projek itu rosak
atau terpadam, tiada `git reflog` untuk memulihkannya. Salinan di sini
ialah jaring keselamatan itu.

Ia juga menjimatkan masa: sesi AI yang menyambung kerja boleh membaca kod
backend terus dari sini, tanpa tuan perlu menampal 27 fail satu per satu.

---

## Ketepatan setiap fail

| Fail | Tarikh | Keadaan |
|---|---|---|
| `Kebenaran.gs` | 23 Ogos 2026 | Sepadan dengan yang dipasang |
| `Auth.gs` | 27 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| **`Code.gs`** | **28 Ogos 2026** | Fungsi tetapan/logo, pembantu kestabilan/IC dan versi v1.4.0 sepadan; struktur fail masih lapuk — lihat di bawah |
| `Kehadiranbackend.gs` | 26 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `PenilaianBackend.gs` | 26 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `Penilaian.html` | 26 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `PAJSKBackend.gs` | 27 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `ArkibBackend.gs`, `KeahlianBackend.gs` | 27 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `KelabBackend.gs` | 28 Ogos 2026 | Sepadan dengan Apps Script Version 10; import guru merge-only + relay upload tempatan |
| `Laporanbackend.gs`, `Pencapaianbackend.gs` | 27 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| `Murid.gs` | 28 Ogos 2026 | Sepadan dengan Apps Script Version 10; import tempatan relay ke HADIR tanpa gelung |
| `SetupBackend.gs` | 27 Ogos 2026 | Sepadan dengan Apps Script Version 8 |
| Fail lain | 20–23 Ogos 2026 | Tidak berubah dalam Version 8; status terdahulu dikekalkan |

### ⚠️ `Code.gs` lapuk

Dalam projek sebenar, `doPost(e)` dan array `var API_DIBENARKAN = [...]`
sudah **dibuang** daripada `Code.gs` pada 23 Ogos, dan digantikan oleh
`Kebenaran.gs`. Salinan di sini masih mengandungi kedua-duanya. Bahagian
fungsi tetapan/logo, pembantu cache, `LockService`, nombor selamat,
normalisasi IC dan nombor versi telah dicerminkan pada 27 Ogos, tetapi itu tidak menjadikan keseluruhan `Code.gs`
selamat dipulihkan.

**Jangan pulihkan `Code.gs` daripada folder ini** tanpa membuang semula dua
benda itu. Dua `doPost` dalam satu projek Apps Script memberi tingkah laku
yang tidak menentu — log masuk berpusing tanpa mesej ralat, dan puncanya
sukar dikesan.

Lihat bahagian 7b `BLUEPRINT-AKSI.md` untuk model kebenaran penuh.

---

## Cara mengemas kini salinan ini

Buka fail dalam editor Apps Script, salin isinya, tampal ke fail yang sama
di sini, commit. Untuk `Code.gs` sahaja pun sudah memadai buat masa ini.

Buat ini **setiap kali** kod backend berubah — bukan kemudian. Cerminan
yang lapuk lebih bahaya daripada tiada cerminan langsung, kerana ia
kelihatan boleh dipercayai.
