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

## ⚠️ Salinan ini LAPUK

**Tarikh snapshot: 20 Ogos 2026.**

Yang sudah berubah dalam projek sebenar tetapi **belum** dicerminkan di sini:

- `Kebenaran.gs` — fail baharu (23 Ogos). Mengandungi `doPost` dan seluruh
  matriks kebenaran empat peranan. **Tiada langsung dalam folder ini**
- `Auth.gs` — ditulis semula untuk mod tetamu: token tetamu, dropdown nama
  guru, tukar kata laluan. Salinan di sini ialah versi lama
- `Code.gs` — `doPost` dan `API_DIBENARKAN` sudah **dibuang** daripada
  projek sebenar. Salinan di sini masih mengandunginya

Jangan pulihkan projek Apps Script daripada folder ini tanpa membaca
bahagian 7b `BLUEPRINT-AKSI.md` dahulu. Memulihkan `Code.gs` lama akan
mengembalikan `doPost` kedua ke dalam projek, dan dua `doPost` memberi
tingkah laku yang tidak menentu.

---

## Cara mengemas kini salinan ini

Buka setiap fail dalam editor Apps Script, salin isinya, tampal ke fail
yang sama di sini, kemudian commit. Ambil masa lebih kurang sepuluh minit.

Buat ini **setiap kali** kod backend berubah — bukan kemudian. Cerminan
yang lapuk lebih bahaya daripada tiada cerminan langsung, kerana ia
kelihatan boleh dipercayai.
