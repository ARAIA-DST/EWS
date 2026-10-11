# Tambahan Database SPG, Competitor & Market, AI Insight

Versi add-on 2.1.0 · 11 Oktober 2026. Aplikasi NC Retention tetap memakai aturan dan tampilan V1.

**Mulai dari sini untuk aplikasi yang sudah terpasang:** simpan cadangan source, tambahkan file baru, pasang hook frontend/backend, jalankan `setupTalentAddon`, lalu deploy versi backend baru. Pertahankan `API_URL` yang sudah Anda isi. Tidak perlu menjalankan ulang seed demo.

## Yang ditambahkan

| Menu baru | Kegunaan |
| --- | --- |
| Database SPG | Profil, foto, domisili, pengalaman, kategori bidang, 19 industri spesialisasi, pencarian, filter, import hingga 1.000 profil sekaligus, dan konversi menjadi NC |
| Competitor & Market | Pengalaman bekerja pada brand kompetitor, observasi pasar yang dapat diinput kapan saja, dan laporan harian TL dengan draft, pengiriman, tinjauan, rekap dan ekspor |
| AI Insight & Analytics | Distribusi talent, kesiapan kandidat, pencocokan kandidat, prioritas retensi, rekap laporan harian TL, analisis otomatis dan insight AI melalui penyedia yang dikonfigurasi |

**Data asli 1.000 SPG dan foto belum diberikan.** Modul produksi mulai kosong. Import menerima data Araia; tidak mengisi nama, pengalaman atau foto rekaan. Jumlah profil keseluruhan boleh lebih dari 1.000; batas 1.000 berlaku per import. Pengujian kapasitas menggunakan data uji di folder tests, yang tidak dimasukkan ke database aplikasi.

## Jika add-on 2.0.0 sudah terpasang

1. Perbarui `shared/talent-core.js`, `js/talent-addon.js`, `css/talent-addon.css`, lalu tambahkan `js/market-daily-ui.js` ke repository GitHub yang sama. Script pemasangan di bawah juga dapat mengerjakan pembaruan source yang sesuai.
2. Di proyek Apps Script yang sama, perbarui **TalentCore.gs**, **TalentStorage.gs**, dan **TalentApi.gs** dari paket terbaru. File TalentAdmin.gs tetap memakai fungsi yang sama.
3. Jalankan **setupTalentAddon** sekali lagi untuk menambahkan dua sheet laporan harian. Tidak perlu menjalankan setupSheets, seedDemoData, mengubah akun, atau menambah scope baru untuk pembaruan ini.
4. Deploy versi baru pada deployment yang sama, lalu refresh GitHub Pages. `API_URL` dan alamat aplikasi tetap menggunakan konfigurasi sebelumnya.
5. TL masuk memakai akun berperan **Supervisor** yang sudah tersedia. Buka **Competitor & Market → Laporan harian TL**.

## 1. Cara memperbarui frontend GitHub yang sudah ada

Paket lengkap mempertahankan `index.html`, logo, CSS utama, seluruh view V1, mesin risiko, onboarding, cuti, action plan, laporan dan source lain. Dari 30 file V1, 25 tetap sama byte demi byte. Lima file menerima sambungan tambahan berikut:

| File yang menerima sambungan | Tambahan |
| --- | --- |
| `js/app.js` | Import dan router modul tambahan; menahan refresh ketika form tambahan terbuka |
| `js/api.js` | Invalidasi cache NC setelah konversi SPG |
| `js/demo.js` | Penghubung modul tambahan khusus mode demo |
| `apps-script/Code.gs` | Satu baris pengarah aksi `talent.*` dan `market.*` ke API tambahan |
| `apps-script/appsscript.json` | Dua izin Apps Script untuk Drive dan permintaan HTTPS ke AI |

Tidak ada perubahan pada formula skor, warna risiko, fungsi setup V1, trigger harian V1 atau aturan bisnis lama. Semua field dan header sheet lama tetap sama. Integrasi dapat diperiksa di `docs/V1_INTEGRATION.diff`; hash file asli dan hasil ada di `docs/V1_COMPATIBILITY.json`.

**Jika source Anda masih persis V1 yang sebelumnya diberikan:**

1. Ekstrak paket add-on di folder terpisah.
2. Salin folder/file baru berikut ke repository yang sudah ada: `shared/talent-core.js`, `js/talent-addon.js`, `js/market-daily-ui.js`, `js/talent-service.js`, `js/talent-demo.js`, `css/talent-addon.css`, dan `templates/`.
3. Perbarui tiga file penghubung frontend `js/app.js`, `js/api.js`, `js/demo.js` dari paket.
4. **Pertahankan `js/config.js` milik Anda**, termasuk URL `/exec` yang sudah bekerja. Jangan menggantinya dengan config kosong dari paket lengkap.
5. Commit perubahan ke GitHub. Alamat Pages dan konfigurasi Pages tetap menggunakan repository sebelumnya.

**Jika Anda sudah memodifikasi file-file tersebut:** pasang hanya tambahan pada diff, atau gunakan script di bawah. Script memeriksa hash lima file penghubung sebelum menulis. Jika file berbeda, script berhenti sebelum mengubah apa pun dan meminta integrasi manual. Script tidak menyentuh `js/config.js` atau source V1 lain yang tidak menerima hook.

```bash
python scripts/apply-talent-addon.py --target "/path/folder-aplikasi-yang-sudah-ada"
```

Jalankan dari folder hasil ekstrak add-on. Script mengenali source V1 dan add-on 2.0.0 yang pernah diberikan, serta menolak file dengan modifikasi khusus sebelum menulis. Cadangan file yang diperbarui dibuat di folder dengan akhiran `-before-talent-addon-2.1`; config dan file V1 lainnya dipertahankan. Untuk pengguna GitHub melalui browser, gunakan langkah salin file di atas.

## 2. Tambahkan backend di proyek Apps Script yang sama

Jangan membuat spreadsheet baru untuk add-on. Pakai proyek Apps Script, `SPREADSHEET_ID`, akun dan database NC yang sekarang.

1. Tambahkan empat file Script baru; salin isi lengkap dari paket:

| File baru | Sumber |
| --- | --- |
| TalentCore.gs | apps-script/TalentCore.gs |
| TalentStorage.gs | apps-script/TalentStorage.gs |
| TalentApi.gs | apps-script/TalentApi.gs |
| TalentAdmin.gs | apps-script/TalentAdmin.gs |

2. Pada `Code.gs`, tepat setelah baris yang membaca `action` dan `p`, tambahkan:

```js
if(typeof talentHandles_==='function'&&talentHandles_(action))return talentHandle_(payload,isPost);
```

Jika `Code.gs` Anda masih persis V1, Anda juga dapat memakai isi `apps-script/Code.gs` dari paket, yang hanya menambahkan baris tersebut.

3. Tambahkan dua scope di array `oauthScopes` pada manifest, sambil mempertahankan scope dan pengaturan sebelumnya:

```json
"https://www.googleapis.com/auth/drive",
"https://www.googleapis.com/auth/script.external_request"
```

Manifest lengkap di paket sudah mencakup scope tersebut. Penggunaan tetap melalui Apps Script, Google Sheets dan Drive. Tidak perlu Firebase, Advanced Services, project Google Cloud custom atau Cloud Console.

4. Pilih fungsi **setupTalentAddon** → Jalankan. Berikan izin tambahan ketika Google meminta.
5. Fungsi menyiapkan tujuh sheet tambahan: `SPG_Database`, `SPG_Experience`, `Market_Intelligence`, `Market_Daily_Reports`, `Market_Daily_Log`, `SPG_NC_Links`, `Talent_AI_Log`. Pada upgrade dari add-on 2.0.0, hanya dua sheet `Market_Daily_*` yang belum ada dibuat; lima sheet tambahan sebelumnya dan seluruh data tetap dipertahankan. Fungsi juga membuat folder Drive **ARAIA — Foto Profil SPG** dan menyimpan ID-nya dalam Script properties.
6. Fungsi boleh dijalankan kembali. Header yang berbeda menyebabkan proses berhenti untuk diperiksa; data tidak ditimpa. Sheet lama tidak diformat atau ditulis ulang.
7. **Deploy → Manage deployments → Edit → New version → Deploy.** Gunakan deployment yang sama agar URL `/exec` tetap sama.
8. Buka situs GitHub Pages, refresh, login, lalu periksa tiga menu baru di sidebar. Pada HP, buka menu lainnya.

## 3. Isi database 1.000 SPG milik Araia

1. Buka **Database SPG → Import 1.000 profil → Download template CSV**. Template juga tersedia di `templates/ARAIA_SPG_Import_Template.csv`.
2. Isi satu baris per SPG. Header wajib: `external_id`, `nama`, `domisili`, `provinsi`, `bidang`, `industri`.
3. Gunakan ID Araia yang konsisten. ID yang sudah ada memperbarui profil yang sama; tidak membuat profil kedua.
4. Isi `experience_years` dengan tahun pengalaman yang diketahui, boleh desimal. Isi riwayat singkat di `experience_summary`. Pengalaman rinci per perusahaan dicatat melalui profil setelah import.
5. Pisahkan beberapa bidang atau industri menggunakan titik koma. Nama bidang harus sesuai daftar di bawah; industri menggunakan kode pada tabel.
6. CSV dapat menggunakan tanda kutip untuk teks dengan koma atau baris baru. Anda juga dapat copy tabel Excel dan tempel sebagai TSV.
7. Pilih file atau tempel tabel → **Lihat preview** → periksa → **Import data**. Preview menampilkan 10 baris pertama; server memvalidasi seluruh baris sebelum menyimpan.
8. Jika satu baris salah, perbaiki baris yang disebutkan, lalu preview dan simpan kembali. Kesalahan validasi tidak menyimpan sebagian profil.

| Kolom | Isi |
| --- | --- |
| external_id | ID talent Araia yang unik dan tetap |
| nama | Nama lengkap |
| domisili | Kota/kabupaten |
| provinsi | Provinsi |
| no_hp | Nomor HP; awalan 0 diubah menjadi 62, kontak duplikat ditolak |
| email | Email opsional |
| foto_url | Link foto HTTPS opsional; upload foto juga tersedia di profil |
| bidang | Satu/lebih nama bidang, dipisahkan `;` |
| industri | Satu/lebih kode industri, dipisahkan `;` |
| experience_years | Angka 0–60; boleh desimal |
| experience_summary | Ringkasan pengalaman dari data asli |
| status | Tersedia, Dipertimbangkan, Tidak tersedia, Arsip; default Tersedia |
| owner_id | ID supervisor aktif, opsional; diperlukan agar masuk pool supervisor tersebut |

Kategori bidang: **SPG / SPB; Brand Ambassador; Direct Selling; Merchandiser; Beauty Advisor; Product Consultant / NC; Event & Activation; Team Leader / Supervisor.**

Status verifikasi baru default **Belum diverifikasi**. HR/Admin dapat mengubah menjadi Terverifikasi dari Edit profil setelah memeriksa data. Import ulang tidak menghilangkan foto upload, ID NC atau riwayat pengalaman. Untuk profil yang sudah terhubung NC, kosongkan status pada import ulang atau isi `Menjadi NC` agar tidak mencoba mengubah status konversinya.

## 4. Foto profil

Buka profil SPG → **Upload foto** → pilih JPG, PNG atau WebP. Foto maksimum 12 MB sebelum kompresi; browser mengubahnya menjadi JPEG maksimum 640 piksel dan backend menerima maksimum 600 KB.

Foto upload disimpan di folder Drive melalui backend. Aplikasi membaca foto setelah memeriksa login dan akses profil. Folder tidak diubah menjadi publik. Daftar profil memuat foto saat kartu mendekati area layar agar 1.000 foto tidak dimuat sekaligus.

Link `foto_url` harus HTTPS dan dapat dibuka browser sebagai gambar. Link halaman Google Drive yang masih privat bukan direct image URL; untuk foto privat gunakan Upload foto. Jika foto gagal diambil, aplikasi menampilkan inisial nama dan profil tetap dapat dibaca. File foto lama tidak dihapus ketika diganti; versi sebelumnya tetap di folder Drive.

## 5. Lanjutkan SPG menjadi NC baru

1. HR/Admin buka profil terpilih.
2. Periksa kontak dan pengalaman; ubah verifikasi menjadi **Terverifikasi**.
3. Klik **Jadikan NC baru**.
4. Isi area penempatan, supervisor aktif dan tanggal bergabung, lalu **Buat NC**.
5. NC dibuat melalui fungsi `nc.save` V1 dan berstatus **Aktif / Baru Bergabung**. Profil SPG diberi status **Menjadi NC**, menyimpan relasi ID dan tetap menyimpan pengalaman/foto sebelumnya.
6. Aplikasi membuka profil NC yang sudah ada. Lanjutkan training, assessment, checklist, Input Sinyal dan pendampingan menggunakan alur lama.

Konversi profil yang sama tidak membuat NC kedua. Jika nomor HP sudah terdaftar di NC lain, pembuatan dihentikan untuk diperiksa HR. Tanggal bergabung tidak boleh di masa depan. Jumlah Menjadi NC pada analytics adalah total konversi yang tercatat, termasuk riwayat NC yang kemudian resign.

## 6. Competitor Experience & Market Intelligence

**Pengalaman kompetitor:** Profil SPG → Tambah pengalaman → isi perusahaan/agency, brand, posisi, bidang, industri, channel, periode, tugas dan pencapaian → tandai pengalaman pada brand kompetitor. Centang Masih bekerja di sana bila tanggal selesai belum ada. Pengalaman tersebut tampil pada tab Pengalaman kompetitor.

**Observasi pasar:** Competitor & Market → Tambah observasi → isi tanggal, kota/area, brand, industri, topik, temuan dan sumber. Sumber bisa observasi lapangan, wawancara atau laporan publik. Sertakan link HTTPS atau nomor/referensi dokumen interview yang dapat diperiksa. Nominal minimum-maksimum bersifat opsional; periode harus jelas: Harian, Bulanan atau Program.

HR/Admin melakukan verifikasi. Supervisor dapat mencatat dan mengubah observasi miliknya; perubahan disimpan sebagai belum diverifikasi untuk ditinjau HR. Viewer melihat observasi yang sudah terverifikasi. Analytics nominal hanya memakai observasi terverifikasi dan tidak mencampurkan satuan harian/bulanan/program. Rentang yang ditampilkan adalah data observasi yang tersedia, bukan penetapan harga pasar.

### Laporan harian TL: dapat diinput kapan saja

Competitor & Market memiliki tiga tab: **Observasi pasar**, **Pengalaman kompetitor**, dan **Laporan harian TL**. Observasi pasar boleh dicatat setiap kali ada temuan; laporan harian menjadi rekap kegiatan TL untuk suatu tanggal dan area.

1. TL login dengan akun **Supervisor** → Competitor & Market → **Laporan harian TL → Buat laporan harian**.
2. Isi tanggal kegiatan, area dan industri. Nama pelapor mengikuti akun yang login. Tanggal kegiatan boleh hari ini atau hari sebelumnya. Waktu simpan/kirim dicatat otomatis; tidak ada batas jam input.
3. Catat outlet/lokasi dan jumlah kunjungan, brand yang diamati, ringkasan kegiatan, kondisi pasar, aktivitas kompetitor, promo/harga, kendala, serta tindak lanjut.
4. Untuk mengirim, lengkapi ringkasan, kondisi pasar, aktivitas kompetitor, tindak lanjut, jenis sumber dan referensi sumber. Jika tidak melihat aktivitas kompetitor, tuliskan **Tidak terlihat**. Link bukti HTTPS bersifat opsional.
5. Klik **Simpan draft** jika belum selesai. Draft minimal membutuhkan tanggal, area dan industri. Lanjutkan dari **Lihat laporan → Lengkapi / kirim**. Klik **Kirim laporan** ketika sudah lengkap.
6. HR/Admin membuka laporan berstatus **Dikirim → Tinjau laporan**. Pilih **Ditinjau** atau **Perlu perbaikan**. Catatan wajib diisi bila meminta perbaikan.
7. TL memperbaiki laporan yang dikembalikan dan mengirim ulang. Riwayat perubahan status, pelaku, waktu dan catatan tinjauan tetap tersimpan.

| Status | Penggunaan |
| --- | --- |
| Draft | Pelapor melengkapi laporan sendiri |
| Dikirim | Menunggu tinjauan HR/Admin; isi terkunci bagi pelapor |
| Ditinjau | Sudah diperiksa HR/Admin; isi terkunci |
| Perlu perbaikan | Pelapor dapat mengubah dan mengirim ulang |

Satu laporan berlaku untuk **satu pelapor, tanggal dan area**. Beberapa outlet pada area yang sama dicatat dalam laporan tersebut. Area berbeda dapat mempunyai laporan lain pada tanggal yang sama. Permintaan duplikat tidak membuat laporan kedua. Perubahan dari layar yang sudah usang ditolak; segarkan dan buka kembali agar revisi terbaru digunakan.

Rekap dapat difilter menurut tanggal, TL, area, industri, status dan kata pencarian. Tampilan awal memakai hari ini; **Semua tanggal** menampilkan riwayat. Cakupan kiriman dihitung dari laporan Dikirim/Ditinjau milik TL aktif dalam akses akun pada tanggal terpilih, mengikuti pilihan TL dan mencakup semua area. Saat Semua tanggal dipilih, cakupan tetap menunjukkan hari ini. Keterangan belum ada kiriman perlu dibandingkan dengan jadwal kerja; tidak menjadi catatan absensi.

**Download CSV** mengambil semua halaman sesuai filter dan hak akses, maksimum 10.000 laporan per ekspor. **Lihat laporan → Cetak / PDF** mencetak laporan individual; pilih Save as PDF pada browser untuk menyimpan PDF. Jumlah kunjungan outlet merupakan total kunjungan yang dilaporkan, bukan jumlah outlet unik.

Status Ditinjau menunjukkan pemeriksaan laporan operasional. Verifikasi fakta/nominal tetap memakai proses verifikasi pada **Observasi pasar**. Laporan harian tidak mengubah sinyal, skor risiko, onboarding, izin/cuti atau laporan NC sebelumnya.

**Narasi sederhana untuk client:**

> “Menu Competitor & Market membantu kita melihat pengalaman talent sekaligus perkembangan pasar. TL bisa mengisi laporan kapan saja sesuai tanggal kegiatannya, mencatat aktivitas kompetitor, promo, kondisi pasar, kendala, dan rencana tindak lanjut. Jika belum selesai, laporan disimpan sebagai draft. Setelah dikirim, HR/Admin meninjau laporan dan seluruh rekap dapat dilihat kembali atau diunduh.”

## 7. AI Insight & Analytics

**Langsung tersedia tanpa key AI:** jumlah dan ketersediaan SPG, kelengkapan profil, distribusi domisili/industri/pengalaman, pengalaman kompetitor, observasi nominal terverifikasi, prioritas NC berdasarkan skor V1, serta rekap/status laporan harian, jumlah kunjungan, cakupan kiriman TL dan analisis otomatis dengan bukti angka. Analisis otomatis menggunakan aturan, sehingga diberi label tersendiri.

**Pencocokan kandidat:** pilih industri, domisili, bidang dan/atau pengalaman minimal → Cari kandidat. Hanya SPG Tersedia yang belum menjadi NC ikut hasil. Bobot dasar: industri 40, domisili 30, bidang 20, pengalaman 10. Sistem menormalisasi bobot hanya dari kriteria yang dipilih dan memperlihatkan alasan cocok/belum cocok. Hasil awal dibatasi 20 kandidat; filter dapat dipersempit dan seluruh profil tetap tersedia di Database SPG. Keputusan rekrutmen berada pada HR.

**AI generatif membutuhkan penyedia AI dan key Anda.** Format integrasi adalah HTTPS **Chat Completions compatible** dengan respons `choices[0].message.content`. Isi di Apps Script → Project Settings → Script properties:

| Property | Nilai |
| --- | --- |
| TALENT_AI_ENABLED | `true` |
| TALENT_AI_API_URL | Endpoint HTTPS Chat Completions milik penyedia yang Anda pilih |
| TALENT_AI_API_KEY | API key dari akun penyedia AI |
| TALENT_AI_MODEL | Model yang tersedia pada akun penyedia tersebut |

Endpoint harus menerima Bearer token, `model`, `messages` dan batas keluaran `max_tokens`. Sesuaikan pilihan model dengan format tersebut. Biaya/kuota mengikuti penyedia Anda. Tidak ada key yang disertakan dalam paket dan tidak ada key di frontend/GitHub.

Jalankan `checkTalentAIConfiguration` untuk memeriksa apakah properties sudah lengkap. Fungsi hanya memeriksa kelengkapan, bukan menguji koneksi. Pada menu AI Insight & Analytics, pilih fokus → **Buat insight AI**. Respons yang sesuai disimpan dalam riwayat dan audit. Hasil dari fakta identik dapat dipakai ulang selama 10 menit. Permintaan AI tidak memegang lock penulisan NC selama menunggu jaringan; sesi dan hak akses diperiksa kembali sebelum hasil disimpan.

AI menerima ringkasan angka dan kategori, tanpa nama individu, nomor HP, email, foto, catatan percakapan, hasil observasi mentah, isi narasi laporan harian, nama TL atau referensi interview. AI memakai angka agregat laporan dan cakupan untuk insight operasional; tidak menafsirkan narasi mentah laporan. Label brand kompetitor hanya dikirim sebagai kategori agregat pengalaman. UI menggunakan fokus yang tersedia, tanpa kolom prompt bebas. Insight AI adalah rekomendasi untuk ditinjau HR/Admin; skor V1 dan status NC tidak diubah oleh AI.

Mode demo mendukung fitur talent, foto lokal, konversi dan analytics. AI generatif pada demo sengaja tidak memanggil penyedia eksternal. Data talent pada demo dimulai kosong; reset demo juga membersihkan data tambahan khusus demo.

## 8. Hak akses

| Kemampuan | Admin / HR | Supervisor | Viewer |
| --- | --- | --- | --- |
| Baca database SPG | Semua profil | Pool miliknya / NC yang ditugaskan | Profil dengan kontak internal disembunyikan |
| Tambah/edit/import profil dan foto | Ya | Tidak | Tidak |
| Konversi menjadi NC | Ya | Tidak | Tidak |
| Catat pengalaman | Ya | Profil dalam aksesnya | Tidak |
| Catat observasi pasar | Ya | Observasi sendiri | Tidak |
| Verifikasi data | Ya | Tidak | Tidak |
| Isi/kirim laporan harian | Laporan sendiri | Laporan sendiri | Tidak |
| Baca rekap harian | Semua laporan | Laporan sendiri | Dikirim / Ditinjau |
| Tinjau laporan harian | Semua laporan Dikirim | Tidak | Tidak |
| Ekspor/cetak laporan harian | Sesuai akses baca | Laporan sendiri | Dikirim / Ditinjau |
| Analytics | Dalam aksesnya | Dalam aksesnya | Ringkasan yang diizinkan |
| Buat insight AI | Ya | Tidak | Tidak |
| Riwayat insight AI | Admin semua; HR miliknya | Tidak | Tidak |

Kontak, email dan catatan profil tidak dikirim ke Viewer. Pengalaman rinci bagian tugas/pencapaian juga dibatasi dari Viewer. Akun yang memiliki akses langsung ke spreadsheet/Drive mengikuti hak akses Google pada file tersebut.

## 9. Pemeriksaan setelah dipasang

1. Login dengan akun lama; periksa Dashboard dan satu profil NC lama.
2. Buka Database SPG, buat satu profil nyata dan upload foto.
3. Tambahkan pengalaman dan observasi; pastikan sumber serta verifikasi tampil.
4. Uji import data Araia dengan ID yang konsisten.
5. Verifikasi satu kandidat yang memang diterima, lalu jadikan NC; pastikan hanya satu NC dibuat.
6. Login sebagai Supervisor dan Viewer untuk memeriksa batas akses.
7. TL membuat draft laporan harian, melengkapinya, lalu mengirim. HR meminta perbaikan, TL mengirim ulang, lalu HR menandai Ditinjau. Periksa rekap, riwayat, CSV dan hasil cetak.
8. Buka Analytics. Jika key AI sudah diisi, buat insight dan periksa riwayat.

Jika modul belum tersedia, pastikan empat file `.gs` baru dan hook `Code.gs` sudah dipasang, `setupTalentAddon` selesai, serta deployment menggunakan New version. Jika foto gagal, periksa izin Drive dan folder foto. Jika AI gagal, periksa key, endpoint, model, format respons dan kuota penyedia.

Pengujian otomatis dijelaskan dalam `docs/TALENT_ADDON_QA.md`. Deployment akun Google/GitHub Anda, koneksi AI nyata dan tampilan pada browser/perangkat nyata perlu diperiksa setelah pemasangan. Sheets tidak menyediakan transaksi lintas sheet; gangguan layanan saat commit masih dapat menyebabkan sebagian perubahan, seperti batas platform pada V1. Request ID dan relasi unik mencegah pengulangan pembuatan NC setelah request yang sudah selesai.

## Daftar industri

| Kode | Industri | Sektor |
| --- | --- | --- |
| fmcg | FMCG | Konsumsi & Ritel |
| retail | Retail & E-commerce | Konsumsi & Ritel |
| electronics | Consumer Electronics | Konsumsi & Ritel |
| fashion | Apparel & Fashion | Konsumsi & Ritel |
| automotive | Otomotif | Manufaktur & Transportasi |
| machinery | Manufaktur Berat | Manufaktur & Transportasi |
| logistics | Logistik & Transportasi | Manufaktur & Transportasi |
| pharma | Farmasi & Alat Kesehatan | Manufaktur & Transportasi |
| it | IT & Software | Teknologi & Jasa |
| telecom | Telekomunikasi | Teknologi & Jasa |
| bfsi | Perbankan & Keuangan | Teknologi & Jasa |
| media | Media & Hiburan | Teknologi & Jasa |
| energy | Energi, Minyak & Gas | Sumber Daya & Energi |
| mining | Pertambangan | Sumber Daya & Energi |
| agribusiness | Pertanian & Perkebunan | Sumber Daya & Energi |
| property | Properti & Real Estate | Infrastruktur & Jasa Profesional |
| construction | Konstruksi & Teknis | Infrastruktur & Jasa Profesional |
| hospitality | Perhotelan & Pariwisata | Infrastruktur & Jasa Profesional |
| professional | Konsultan & Jasa Profesional | Infrastruktur & Jasa Profesional |

Rujukan API platform: [Apps Script Drive File](https://developers.google.com/apps-script/reference/drive/file), [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app), [Kuota Apps Script](https://developers.google.com/apps-script/guides/services/quotas).
