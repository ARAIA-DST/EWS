# NCUBATOR 3.0.0 — Hasil Pemeriksaan

Tanggal pemeriksaan: 11 Oktober 2026. Pemeriksaan menggunakan source dan layanan Google simulasi lokal. Deployment produksi, spreadsheet/foto asli, dan akun Google pemilik belum diakses dalam sesi ini.

## Ringkasan hasil

| Pemeriksaan | Hasil | Batas hasil |
|---|---|---|
| Suite utama `node --test tests/*.test.mjs` | 73 tes lulus; 0 gagal | Aturan domain, adapter backend, frontend, demo dan installer lokal |
| Pemulihan Admin | 9 tes terpisah lulus; 0 gagal | Fungsi pemulihan diperiksa; password produksi tidak diubah |
| Uji browser Chromium | Lulus; tanpa error JavaScript | API diarahkan ke simulasi Apps Script |
| Desktop dan ponsel | 1600×1000 dan 390×844 diperiksa | Empat screenshot internal dengan data contoh; tidak menggunakan data pegawai produksi |
| Syntax backend | 11 file `.gs` dapat diparse | Bukan bukti deployment pada akun Google pemilik |
| Kesamaan core | Dua pasangan shared/backend identik | `shared/core.js` = `Core.gs`; `shared/talent-core.js` = `TalentCore.gs` |
| Migrasi dari source 2.1.1 | Lulus; konfigurasi lama, file tambahan dan backup dipertahankan | Salinan lokal source yang pernah dikirim |
| Skema lama | Header 19 sheet asli tetap identik | Ditambahkan NC_User_Links; total 20 core + 7 add-on |
| Logo Araia | File PNG asli tidak berubah | SHA-256 diperiksa terhadap file awal |

## Loading dan cache

- Login browser membutuhkan dua request: `login` yang membawa context ringan, lalu `dashboard`. Dashboard tidak dihitung ulang pada context login.
- Uji 300 identitas berbeda terhadap 1.000 profil memeriksa scope Client/TL dan pagination. Dataset SPG dibaca penuh satu kali sepanjang skenario tersebut; respons akun tetap terpisah dan kontak Client tetap disamarkan.
- Skenario 300 identitas dijalankan dalam simulasi dengan cache terkendali. Hasilnya membuktikan reuse dataset dan pembatasan data, bukan kecepatan Sheets/Drive atau kapasitas 300 eksekusi Google bersamaan.
- Request yang memakai cache tetap memeriksa baris akun terbaru. Status nonaktif, perubahan role/password, dan perubahan relasi NC menolak sesi yang sudah tidak sesuai.
- Penulisan data membatalkan cache terkait. Login tidak membuang cache bisnis. Cache dapat hilang/diusir tanpa membuat request gagal.
- Antrean browser diuji dengan 20 tugas: paling banyak tiga aktif sekaligus, dan tugas antrean yang dibatalkan tidak dijalankan. Uji browser akhir mengamati paling banyak dua request aktif dari batas tiga.
- Kalender izin/cuti tidak dipanggil pada pembukaan daftar; dipanggil ketika pengguna memilih Kalender tim.
- Idempotensi tetap menggunakan request ID yang sama pada retry. Pencarian receipt tetap membedakan huruf besar/kecil walaupun TextFinder Sheets tidak membedakannya secara default.

## Foto profil

Uji browser memastikan foto tersimpan muncul pada daftar dan profil. Pemicu viewport memakai wrapper yang terlihat; gambar mulai dimuat secara eager saat dipicu, sehingga tidak terjebak kombinasi hidden dan native lazy loading.

Upload dari profil dan form Tambah SPG diuji. Foto diperkecil oleh frontend, versi baru membatalkan avatar lama, dan foto baru langsung tersedia pada sesi yang mengupload. Uji backend memeriksa autentikasi, scope TL, validasi MIME/ukuran, dan penolakan pembacaan tanpa sesi atau dari pool yang tidak diizinkan. Folder Drive tidak dibuat publik.

Foto asli pada deployment lama masih memerlukan pemeriksaan izin Drive, versi deployment, ID folder dan keberadaan file setelah upgrade.

## Struktur, peran dan alur

| Peran | Yang diperiksa |
|---|---|
| Admin | Sembilan menu utama, form user dengan relasi NC, upload foto, konversi SPG, akses administrasi |
| HR | Aturan konversi, peninjauan laporan harian, approval dan pembatasan administrasi pada tes domain/backend |
| TL / Supervisor | Scope tim/pool, delapan menu utama pada tes navigasi, input laporan harian, penolakan akses tim lain |
| Client / Viewer | Empat menu baca, tanpa administrasi/penulisan, laporan Dikirim/Ditinjau, kontak dan catatan sensitif disamarkan |
| NC | Empat menu pribadi; hanya profil, onboarding, pengajuan dan tugas sendiri; tidak mengakses tim, kandidat, market, AI atau catatan internal |

Browser memeriksa konversi SPG → NC dan kembali ke profil asal, form relasi akun NC, pengajuan izin/cuti milik NC sendiri, tombol Client/TL, serta batas halaman pada ponsel. Form NC tidak menampilkan pemilihan orang lain.

Tes lama untuk skor risiko, impor, onboarding, izin/cuti dua tingkat, percakapan, action plan, resign, laporan, talent, pengalaman kompetitor, observasi pasar, laporan harian, dan AI agregat tetap lulus. Perubahan menu tidak mengganti lifecycle atau formula tersebut.

## Migrasi dan installer

`setupNCUBATOR` dijalankan dua kali pada fixture berisi data lama. Header, record 19 sheet awal dan AUTH_PEPPER tetap sama. Relasi NC ditambahkan pada tabel baru. Setup tidak melakukan seed atau reset akun.

Installer diuji dengan API_URL dan timeout yang telah diubah pengguna: konfigurasi tetap dipertahankan, versi menjadi 3.0.0, backup lengkap tersedia, dan menjalankannya kembali tidak membuat backup tambahan. File source dengan modifikasi yang tidak dikenal ditolak sebelum penulisan apa pun. Paket update sebagian juga ditolak jika file runtime yang tidak disertakan belum ada atau versinya tidak sesuai; gunakan paket lengkap untuk baseline tersebut.

Pemeriksaan tambahan menggunakan salinan source 2.1.1 yang pernah dikirim. Semua file source hasil upgrade sama dengan paket baru, kecuali konfigurasi yang sengaja dipertahankan. File catatan tambahan pengguna tetap ada dan backup menyimpan konfigurasi awal.

## Pengujian pada deployment

Setelah upgrade sesuai panduan, periksa jumlah data dan contoh riwayat terhadap backup; lakukan login ulang dan uji satu foto, satu pengajuan/approval, konversi kandidat uji, serta laporan harian. Ukur waktu buka halaman, error/BUSY/timeout dan durasi eksekusi Google dengan pengguna uji bertahap sebelum rollout.

Target awal evaluasi pembacaan hangat p95 ≤ 3 detik dan error < 1% merupakan sasaran UAT, belum hasil produksi. Target 300+ akun terdaftar menggunakan asumsi aktivitas tersebar. Google mencantumkan 30 eksekusi serentak per pengguna Google dan 1.000 per script; deployment Execute as me berjalan dengan identitas pemilik. Kebutuhan 300 orang mengirim request tepat bersamaan memerlukan uji dan keputusan kapasitas berikutnya.

Rujukan resmi diperiksa 11 Oktober 2026: [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas), [Web apps](https://developers.google.com/apps-script/guides/web), dan [Best practices](https://developers.google.com/apps-script/guides/support/best-practices).

## Menjalankan ulang pemeriksaan lokal

```bash
node --test tests/*.test.mjs
```

Uji browser opsional memerlukan Playwright dan Chromium yang tersedia:

```bash
PLAYWRIGHT_MODULE=/path/playwright/index.mjs CHROMIUM_PATH=/path/chromium node tests/browser-smoke.mjs
```

Browser test memulai server lokal, memakai data contoh, dan mengintersep API ke layanan simulasi. Tidak mengirim data uji ke deployment produksi.
