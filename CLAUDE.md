# Arahan kerja — AKSI

`BLUEPRINT-AKSI.md` ialah rujukan utama untuk dalaman AKSI. Baca **Bahagian 12
— Halangan yang sudah dicuba dan gagal** sebelum mencadangkan apa-apa; ia
menjimatkan masa paling banyak.

1. Repo ini **awam**. Jangan commit nama murid, IC, markah, kata laluan, token,
   atau data produksi
2. Fungsi backend baharu mesti disenaraikan dalam `Kebenaran.gs` — `API_TETAMU`,
   `API_GURU` atau `API_ADMIN`. Yang tidak disenaraikan ditolak secara lalai
3. Menyembunyikan butang **bukan** keselamatan. Kebenaran dikuatkuasakan dalam
   `doPost`, sebelum fungsi sasaran dijalankan
4. `apps-script/` ialah **cerminan** kod Apps Script, bukan kod yang berjalan.
   Editor Apps Script yang betul bila kedua-duanya berbeza. Baca
   `apps-script/README.md` sebelum memulihkan apa-apa dari situ
5. Setiap kali kod backend berubah dalam editor, salin ke `apps-script/` pada
   hari yang sama. Cerminan lapuk lebih bahaya daripada tiada cerminan
6. Jangan tulis ke Sheets dalam gelung
7. Pemilik projek seorang guru, bukan jurutera perisian. Cadangkan langkah
   melalui antara muka web dahulu; baris perintah sebagai pilihan kedua.
   Bahasa perbualan **Bahasa Melayu**

---

## Hab ekosistem

Sistem ini sebahagian daripada ekosistem data SK Paya Redan. Hab dokumentasi
memegang peraturan merentas sistem, kontrak antara sistem, akaun, dan **daftar
isu tunggal**:

**<https://sepadan.github.io/dashboard/BLUEPRINT.md>**

Baca hab sebelum menyentuh apa-apa yang menjejaskan sistem lain.

`BLUEPRINT-AKSI.md` dalam repo ini ialah **jejari** — dalaman sistem ini sahaja.

### Dua peraturan yang mudah dilanggar tanpa sedar

**Isu dicatat di hab sahaja.** Jangan mulakan senarai "belum selesai", "langkah
seterusnya" atau "status" dalam repo ini. Empat senarai isu bermakna empat versi
kebenaran, dan percanggahan itu senyap.

**Jangan percaya `raw.githubusercontent.com`.** Ia pernah memulangkan salinan
seminggu lapuk dan menyesatkan satu sesi penuh. Untuk mengetahui keadaan
sebenar: `git ls-files` selepas `git pull`, atau baca melalui
`https://sepadan.github.io/<repo>/<fail>`.
