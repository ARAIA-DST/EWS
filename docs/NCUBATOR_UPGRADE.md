# NCUBATOR 3.0 — Panduan Upgrade dan Penggunaan

**NCUBATOR — Nutrition Consultant Unified Base for Assessment, Training, Operations & Reporting.**

Paket ini memperbaiki loading dan foto, mengganti nama, serta merapikan alur aplikasi Araia. Source sudah diuji lokal. Perubahan baru berlaku di aplikasi Anda setelah backend dan frontend diperbarui.

## 1. Apa yang berubah

| Sebelumnya | NCUBATOR 3.0 |
|---|---|
| Dashboard dihitung pada bootstrap lalu diminta lagi | Login membawa metadata ringan; dashboard diminta sekali |
| Login membuang cache domain user dan bootstrap | Aktivitas login tidak membuang cache bisnis; perubahan izin tetap membatalkan akses |
| Banyak pembacaan seluruh sheet pada pengguna berbeda | Dataset server dapat dipakai bersama; hasil tetap dibatasi per akun/peran |
| Auth membaca seluruh Users untuk tiap request | Membaca baris akun terbaru; perubahan role/password/status tetap diperiksa |
| Login membaca seluruh riwayat audit | Audit ditambahkan langsung; receipt dicari berdasarkan ID permintaan |
| Gambar disembunyikan sekaligus memakai native lazy loading | Pemicu viewport mengatur kapan foto dimuat; gambar memakai eager loading saat dipicu |
| Foto baru hanya ditambahkan dari halaman profil | Foto dapat dipilih pada form Tambah SPG dan pada profil |
| Banyak permintaan foto bersamaan | Maksimal 3 permintaan jaringan aktif per browser; foto memiliki cache versi |
| Kalender selalu dimuat bersama daftar pengajuan | Kalender dimuat ketika tab Kalender tim dibuka |
| Menu fitur tersebar | Satu menu utama per alur; fitur terkait menjadi tab |
| Supervisor / Viewer pada antarmuka | Label TL / Client; nilai role lama tetap dipakai di data |
| NC belum memiliki ruang pribadi | Role NC terhubung ke satu profil melalui NC_User_Links |

Aturan skor, approval, onboarding, action plan, konversi SPG, laporan harian, data, ID dan riwayat tetap digunakan. Logo PNG Araia asli tetap menjadi identitas pemilik; nama produk di layar menjadi NCUBATOR.

## 2. Upgrade aplikasi yang sudah digunakan

**Gunakan proyek Apps Script, spreadsheet, folder foto, akun Admin, dan URL /exec yang sama. Simpan API_URL lama sebelum memperbarui frontend.**

1. Buat cadangan spreadsheet dan source yang saat ini dipakai. Ekstrak paket baru di folder terpisah.
2. Pada proyek Apps Script lama, ganti isi file yang namanya sama dan tambahkan file yang belum ada. Folder `apps-script/` berisi 11 file `.gs` dan `appsscript.json`. Hindari dua salinan fungsi dengan nama sama.
3. Pertahankan Script properties yang sudah ada, terutama `SPREADSHEET_ID`, `AUTH_PEPPER`, `TALENT_PHOTO_FOLDER_ID`, dan konfigurasi AI.
4. Jalankan **setupNCUBATOR** dari editor Apps Script. Setujui izin Google yang diperlukan bila muncul. Fungsi ini memeriksa header lama, menambahkan `NC_User_Links`, mengaktifkan pilihan role NC, dan menyiapkan sheet/folder add-on yang belum ada. Isi sheet lama tidak dihapus. Fungsi dapat diulang.
5. Buka **Deploy → Manage deployments → Edit → New version → Deploy**. Gunakan deployment lama agar URL `/exec` tetap sama.
6. Terapkan source frontend baru pada folder/repository aplikasi Anda. Gunakan installer di bawah agar `API_URL` tetap dipertahankan. Jika menyalin manual, kembalikan `API_URL` lama di `js/config.js` sebelum upload ke GitHub Pages.
7. Perbarui GitHub Pages, lakukan reload penuh browser, keluar lalu masuk kembali. Header aplikasi harus menampilkan NCUBATOR.
8. Uji profil lama, upload satu foto, konversi kandidat uji, pengajuan/approval, serta laporan TL. Periksa bahwa jumlah data lama dan riwayatnya tetap sesuai cadangan.

**Upgrade tidak memerlukan `seedDemoData`, penghapusan Users, penggantian AUTH_PEPPER, atau pembuatan spreadsheet baru.** Jika setup melaporkan header berbeda, hentikan migrasi dan periksa perbedaannya.

Gunakan **NCUBATOR_Full_Package_v3.zip** untuk mendapatkan seluruh source dan untuk upgrade dari V1/2.0/2.1. **NCUBATOR_Update_Only_v3.zip** berisi perubahan terhadap paket add-on 2.1.1 terakhir; gunakan hanya jika source lama Anda sudah berada pada versi tersebut. Kedua paket memakai folder `ncubator/` dan installer yang sama.

### Installer frontend/source

Python hanya digunakan untuk membantu upgrade folder lokal; frontend produksi tetap tidak membutuhkan npm build.

```bash
python3 /path/paket-baru/ncubator/scripts/apply-ncubator-update.py --target /path/aplikasi-lama
```

Installer mengenali source V1, add-on 2.0/2.1/2.1.1 dan NCUBATOR saat ini. Installer memeriksa seluruh file yang akan diperbarui sebelum menulis, membuat backup folder, mempertahankan konfigurasi publik yang ada, dan menolak file dengan modifikasi khusus yang belum dikenali. Gunakan `docs/NCUBATOR_UPGRADE.diff` untuk menggabungkan modifikasi tersebut. Installer mengubah folder lokal; deployment Apps Script dan GitHub Pages tetap mengikuti langkah di atas.

Untuk instalasi benar-benar baru, isi `INITIAL_ADMIN_USERNAME` dan `INITIAL_ADMIN_PASSWORD` pada Script properties, jalankan `setupSheets`, lalu `setupNCUBATOR`. Batas password 8–200 karakter. Gunakan langkah deployment yang sama. Aplikasi baru tidak berisi 1.000 data pegawai asli; import data Araia yang sudah disiapkan.

## 3. Menu dan alur yang sekarang

| Menu utama | Isi / urutan kerja |
|---|---|
| Beranda | Ringkasan kondisi dan prioritas tim |
| Database SPG | Cari profil → periksa pengalaman/foto → verifikasi → pilih Jadikan NC baru |
| Onboarding | Tahapan → training → assessment → kesiapan 30/60/90 hari |
| Tim NC | Direktori, area, TL, tanggal bergabung dan tahap NC |
| Izin & Cuti | Daftar pengajuan atau kalender; approval tetap mengikuti aturan lama |
| Competitor & Market | Laporan harian sebagai tab awal; Observasi pasar dan Pengalaman kompetitor menjadi tab |
| Retensi & Follow-up | Risiko → Input sinyal → Percakapan → Action plan → Tindak lanjut |
| Laporan & Insight | Laporan bulanan, Papan retensi, Resign, Analytics & AI |
| Administrasi | Akun & akses, Pengaturan, Audit log; Admin saja |

**Database SPG berisi kandidat. Tim NC berisi personel yang sudah menjadi NC.** Konversi menghubungkan keduanya. Profil lama tidak didaftarkan ulang setiap berpindah tahap.

Onboarding dipakai sampai kesiapan kerja; pendampingan retensi dipakai untuk kondisi dan tindak lanjut NC. Laporan harian TL tidak menggantikan input sinyal mingguan. Status laporan Ditinjau juga tidak otomatis memverifikasi seluruh fakta pasar.

## 4. Cara menggunakan berdasarkan peran

### Admin dan HR

Masuk melalui tombol **Masuk** menggunakan akun produksi. Buka Database SPG untuk menambahkan/mengimport profil. Lengkapi pengalaman, bidang, industri, domisili dan foto; tetapkan Terverifikasi setelah diperiksa. Dari profil terpilih, tekan **Jadikan NC baru**, pilih area, TL, dan tanggal bergabung. Lanjutkan di Onboarding. Gunakan laporan/analytics untuk memantau tim. Admin mengelola akun dan pengaturan; HR tidak mendapat menu administrasi.

### TL

Buka Beranda untuk melihat prioritas. Gunakan Tim NC dan Onboarding untuk anggota tim sendiri. Catat sinyal, percakapan, tindakan dan check-in melalui Retensi & Follow-up. Di Competitor & Market, buat laporan sesuai tanggal kegiatan, simpan Draft bila belum lengkap, lalu kirim. Buka tab Observasi pasar setiap ada temuan baru. Laporan/observasi boleh dimasukkan kemudian dengan tanggal kegiatan yang benar; tanggal masa depan ditolak.

### NC

Menu pribadi terdiri dari **Beranda Saya, Onboarding Saya, Pengajuan Saya, dan Tugas Saya**. NC melihat tahap, jadwal training, hasil assessment, checklist, status izin/cuti dan tugas miliknya sendiri. Ajukan izin/cuti melalui Pengajuan Saya. Perubahan assessment, checklist, penyelesaian tindakan dan approval dicatat TL/HR/Admin. NC tidak mengakses kandidat, tim lain, catatan percakapan, skor risiko internal, laporan TL atau administrasi.

### Client

Menu Client berisi **Beranda, Tim NC, Competitor & Market, dan Laporan & Insight**. Client membaca hasil operasional dan laporan yang diizinkan. Laporan harian yang dapat dibaca berstatus Dikirim/Ditinjau. Menu dan tombol input/approval tidak ditampilkan. Role tersimpan sebagai Viewer agar akun lama tetap berfungsi.

## 5. Membuat akun pribadi NC

1. Admin membuka **Administrasi → Akun & akses → Tambah user**.
2. Isi nama dan username, lalu pilih **NC (akun pribadi)**.
3. Salin ID profil dari **Tim NC**, lalu isi pada **ID profil NC yang terhubung**.
4. Tetapkan password dan status aktif, lalu simpan.
5. NC masuk dengan akun tersebut. Sistem menentukan profil dari relasi di server; NC tidak memilih ID orang lain.

Satu profil NC hanya memiliki satu relasi akun. Perubahan relasi, role, password, atau status akun membatalkan sesi yang tidak lagi sesuai. Jika role NC diubah menjadi role lain, relasi lama dikosongkan. Nonaktifkan dan aktifkan kembali akun yang sama bila perlu.

## 6. Foto profil

Saat **Tambah SPG**, pilih foto pada field **Foto profil**. Aplikasi mengecilkan sisi terpanjang menjadi maksimal 384 px, menyimpan profil lalu mengupload foto. Foto tampil setelah selesai. Dari profil lama, gunakan **Upload foto** untuk mengganti.

Format pilihan JPG, PNG atau WebP, maksimal 12 MB sebelum kompresi. Backend menerima maksimal 600 KB setelah kompresi. Folder Drive tetap privat; pembacaan foto memerlukan sesi dan hak akses profil. Foto lama tetap dapat dibaca. Link foto HTTPS opsional tetap didukung.

Jika penyimpanan foto gagal sesudah profil berhasil dibuat, form menjelaskan bahwa profil sudah tersimpan. Coba simpan kembali; ID profil yang sama digunakan. Jika foto lama masih gagal, periksa versi deployment, izin Drive, `TALENT_PHOTO_FOLDER_ID`, dan apakah file foto masih ada. Jangan membuka akses publik folder hanya untuk menampilkan avatar.

## 7. Kinerja dan rencana 300+ pengguna

Target kerja saat ini adalah **300+ akun terdaftar dengan aktivitas yang tersebar**. Pengujian lokal mengirim permintaan dari 300 identitas terpisah terhadap 1.000 profil, memeriksa scope dan jumlah pembacaan sheet. Ini belum merupakan uji 300 orang bersamaan pada Google.

Google mencantumkan batas 30 eksekusi bersamaan per pengguna Google dan 1.000 per script. Deployment Execute as me berjalan dengan identitas pemilik. Karena itu, menambah akun aplikasi tidak memperbanyak kapasitas akun Google pemilik. Cache dan antrean mengurangi tekanan, tetapi tidak menghapus kuota tersebut.

Rujukan resmi, diperiksa 11 Oktober 2026: [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas), [Web apps](https://developers.google.com/apps-script/guides/web), dan [Best practices](https://developers.google.com/apps-script/guides/support/best-practices).

UAT deployment dilakukan bertahap: 5 → 10 → 20 pengguna uji dengan pola kerja nyata, lalu 300 akun sepanjang jadwal operasional. Ukur waktu membuka halaman, persentase error, BUSY/timeout, serta durasi di Apps Script Executions. Sasaran awal untuk dievaluasi: pembacaan hangat p95 ≤ 3 detik dan error < 1%; sasaran ini belum klaim hasil produksi. Jika kebutuhan sebenarnya 300 orang mengirim permintaan tepat bersamaan, arsitektur backend perlu dibahas berdasarkan hasil uji. Paket ini mempertahankan stack yang sudah disepakati.

Untuk perubahan data lewat aplikasi, cache dibatalkan otomatis. Sesudah edit/import manual langsung di Sheets, jalankan **clearNCUBATORCache**, lalu lakukan reload penuh. Cache tidak menggantikan pemeriksaan status, role, password, dan relasi NC terbaru.

## 8. Pemeriksaan yang sudah selesai

- Tes aturan lama: risiko, onboarding, cuti, approval, pendampingan, konversi, laporan harian dan AI agregat.
- Tes NC pribadi, relasi unik, revokasi sesi, dan penolakan akses/tindakan lintas peran.
- Tes cache bersama untuk 300 identitas dan 1.000 profil, invalidasi setelah perubahan, serta antrean browser.
- Uji browser dengan backend simulasi: login ringan, foto terlihat, dua cara upload, konversi SPG → NC, kalender dimuat saat dibuka, menu Client/TL, dan pengajuan NC.
- Tampilan desktop 1600×1000 dan ponsel 390×844 diperiksa melalui screenshot. Data screenshot adalah contoh.

Hasil lengkap ada di `docs/NCUBATOR_QA.md`. URL deployment, data/foto asli, izin akun Google dan kapasitas produksi belum diuji dalam sesi ini.

## 9. Lupa password Admin

`AdminRecovery.gs` sekarang disertakan dalam paket. Pada proyek asli, isi `RESET_ADMIN_USERNAME` sesuai Admin aktif dan `RESET_ADMIN_PASSWORD` dengan password baru pilihan Anda, lalu jalankan **resetAdminPassword**. Properti reset dibersihkan setelah berhasil. Password tidak dicetak dan AUTH_PEPPER lama tetap digunakan. Tidak ada password Admin produksi bawaan pada paket ini.
