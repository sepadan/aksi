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
| `Auth.gs` | 23 Ogos 2026 | Sepadan dengan yang dipasang |
| **`Code.gs`** | **20 Ogos 2026** | **LAPUK — lihat di bawah** |
| Selebihnya (25 fail) | 20 Ogos 2026 | Belum berubah sejak itu |

### ⚠️ `Code.gs` lapuk

Dalam projek sebenar, `doPost(e)` dan array `var API_DIBENARKAN = [...]`
sudah **dibuang** daripada `Code.gs` pada 23 Ogos, dan digantikan oleh
`Kebenaran.gs`. Salinan di sini masih mengandungi kedua-duanya.

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
