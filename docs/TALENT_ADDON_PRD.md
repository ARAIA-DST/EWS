# Addendum PRD — Talent, Competitor & Market, AI Insight

11 Oktober 2026 · Add-on 2.1.1 untuk NC Retention V1.

## Tujuan dan batas perubahan

Memperluas aplikasi yang sudah ada untuk memakai database SPG milik Araia sebagai sumber kandidat NC, menyimpan pengalaman kompetitor/observasi pasar, dan menyediakan analytics serta insight AI. Fitur, tampilan, akun, formula risiko, sheet, trigger dan alur NC V1 tetap digunakan. Integrasi terbatas pada lima file penghubung; rincian dan hash tersedia di V1_COMPATIBILITY.json dan V1_INTEGRATION.diff.

Frontend tetap vanilla JS di GitHub Pages. Backend tetap Apps Script Web App, Sheets dan Drive. Tidak menggunakan Firebase, custom GCP, Cloud Console, Advanced Services atau server hosting lain.

## Kebutuhan pengguna

1. Database minimal 1.000 profil SPG: ID Araia, nama, foto, domisili/provinsi, kontak, ringkasan pengalaman, tahun pengalaman, kategori bidang dan beberapa industri spesialisasi dari 19 pilihan di lima sektor yang diberikan pengguna.
2. Import CSV/TSV, profil individual, pencarian dan filter. Pembaruan menggunakan external_id yang konsisten. Maksimum 1.000 baris per import; jumlah total tidak dibatasi 1.000.
3. HR/Admin dapat memverifikasi kandidat dan membuat NC melalui fungsi NC V1. Profil SPG dan pengalaman tetap disimpan; relasi tercatat dan konversi ulang tidak menambah NC baru.
4. Riwayat pengalaman per perusahaan/brand dengan periode, posisi, channel, tugas, pencapaian dan penanda kompetitor.
5. Observasi pasar dengan sumber, tanggal, area, kategori, verifikasi dan nominal opsional dengan periode yang jelas, dapat diinput kapan saja.
6. Analytics agregat, analisis otomatis, pencocokan kandidat yang dapat dijelaskan, serta koneksi AI generatif yang dikonfigurasi di backend.
7. Laporan harian TL dari akun Supervisor: draft, kirim, tinjauan HR/Admin, permintaan perbaikan, kirim ulang, riwayat status, rekap/filter, ekspor semua halaman dan cetak individual. Tanggal kegiatan terpisah dari waktu kirim; satu laporan per pelapor/tanggal/area. Input hari sebelumnya diizinkan; tanggal masa depan ditolak.

## Model dan akses

Model baru: SPG_Database, SPG_Experience, Market_Intelligence, Market_Daily_Reports, Market_Daily_Log, SPG_NC_Links, Talent_AI_Log. Skema lengkap berada di shared/talent-core.js dan salinan identik TalentCore.gs. Tidak menambah kolom pada model V1.

Admin/HR mengelola profil, import, foto, verifikasi dan konversi. Supervisor membaca pool yang dimiliki/ditugaskan serta menambah pengalaman dan observasinya. Viewer membaca profil dengan kontak/catatan disembunyikan, pengalaman dasar dan observasi terverifikasi. AI generatif hanya Admin/HR; riwayat Admin menyeluruh dan HR miliknya. Pemeriksaan akses dilakukan di server termasuk sebelum receipt replay. Laporan harian hanya bisa diisi pemilik; Admin/HR membaca seluruh laporan dan meninjau status Dikirim; Viewer membaca Dikirim/Ditinjau. Revisi harus sesuai untuk mencegah penimpaan layar usang. Permintaan tinjauan Perlu perbaikan wajib memiliki catatan. Role, header V1, serta lima header sheet add-on 2.0 tidak diubah.

Foto privat dibaca melalui API bertoken untuk profil yang berhak diakses. File upload dikompresi browser dan divalidasi MIME/signature/ukuran di backend; tidak dibuat publik di Drive. Foto dimuat bertahap ketika kartu mendekati layar. Foto versi sebelumnya dipertahankan.

## API tambahan

| Aksi | Metode / kegunaan |
| --- | --- |
| talent.meta | GET: daftar pilihan dan supervisor dalam akses |
| talent.list | GET: pencarian/filter/pagination profil |
| talent.detail | GET: profil, halaman pengalaman dan relasi NC |
| talent.save | POST: tambah/update profil |
| talent.import | POST: validasi 1–1.000 profil, lalu upsert |
| talent.convert | POST: SPG menjadi NC Baru Bergabung |
| talent.experience.save | POST: tambah/update pengalaman |
| talent.competitors | GET: pengalaman kompetitor |
| market.list | GET: observasi sesuai akses/filter |
| market.save | POST: tambah/update observasi |
| market.daily.list | GET: laporan paginated dan rekap sesuai filter/akses |
| market.daily.detail | GET: laporan dan riwayat status/catatan |
| market.daily.save | POST: simpan draft atau isi lengkap sekaligus kirim (`send: true`) |
| market.daily.submit | POST: kirim draft lengkap yang sudah tersimpan |
| market.daily.review | POST: HR/Admin menandai Ditinjau atau Perlu perbaikan |
| talent.photo.upload | POST: foto JPEG/PNG/WebP, maksimum 600 KB |
| talent.photo | GET: foto profil yang diizinkan |
| talent.analytics | GET: ringkasan dari data aktual dalam akses |
| talent.match | GET: kandidat Tersedia berdasarkan kriteria yang dipilih |
| talent.ai.status | GET: status konfigurasi tanpa secret |
| talent.ai.generate | POST: insight dari ringkasan agregat |
| talent.ai.history | GET: halaman riwayat sesuai akses |

Envelope dan token mengikuti V1. Semua penulisan memakai requestId unik dan receipt durable V1. Aksi add-on tidak masuk ke endpoint batch V1; import profil memakai talent.import.

## Kinerja dan konsistensi

- Pembacaan sheet dimemo per adapter/request; import 1.000 profil memakai peta ID dan satu range untuk baris berurutan, tanpa getValue/setValue dalam loop.
- Pagination default 20, maksimum 50. Metadata dan hasil baca dicache server 5 menit; cache frontend add-on hanya di memori, 1 menit, terpisah per sesi.
- Epoch add-on dan domain V1 menjadi bagian kunci cache analytics. Konversi menginvalidasi cache NC V1.
- Seluruh import divalidasi sebelum penulisan. Sheets tidak menjamin transaksi lintas sheet saat terjadi kegagalan layanan.
- AI melepas shared script lock selama menunggu jaringan, lalu membaca ulang sesi/receipt saat commit untuk menjaga otorisasi dan mencegah menimpa hasil paralel.
- Data produksi membutuhkan koneksi. Tidak menambah transaksi offline atau sinkronisasi latar belakang pada V1.

## Aturan analisis

Skor risiko NC tetap dihitung V1. Pencocokan kandidat memakai bobot industri/domisili/bidang/pengalaman 40/30/20/10 yang dinormalisasi dari kriteria aktif. Pencocokan adalah kecocokan atribut, bukan penilaian kemampuan atau prediksi resign. Profil tidak tersedia, Arsip, Dipertimbangkan dan Menjadi NC tidak ikut hasil matching.

Benchmark nominal memakai hanya observasi terverifikasi dan memisahkan satuan harian/bulanan/program. Pengalaman di brand kompetitor bukan bukti pasar. Analisis otomatis memperlihatkan fakta hitungan dan tindakan yang dapat dilakukan.

AI menerima angka agregat dan kategori; tidak menerima nama individu, kontak, foto, catatan percakapan, observasi mentah, narasi laporan harian, nama TL atau referensi interview. Jumlah/status laporan, kunjungan, industri dan cakupan TL menjadi fakta agregat AI; label Ditinjau bukan verifikasi fakta pasar dan cakupan bukan absensi. Prompt memilih fokus dari daftar tetap. Output JSON divalidasi, evidence ID dibatasi ke fakta yang tersedia, disimpan dan diaudit. Insight bersifat rekomendasi; tidak mengubah skor atau mengambil keputusan rekrutmen otomatis. Key/provider/model harus diisi pemilik backend.

## Acceptance

Seluruh 20 tes V1 tetap lulus; import 1.000 profil dan pembaruan tidak menggandakan data; baris invalid menolak import sebelum commit; konversi mempertahankan NC lama; duplicate request tidak membuat NC kedua; foto membutuhkan token dan scope; Supervisor/Viewer tidak dapat melewati izin; AI payload tidak membawa data pribadi; hasil AI mock disimpan; render baru memperlihatkan dependensi AI yang belum aktif; demo mendukung beberapa konversi dan refresh data NC lama. Deployment dan browser nyata diuji pemilik setelah pemasangan.

Pembaruan 2.1 mempertahankan seluruh 30 file V1 pada byte yang sama dengan paket add-on 2.0. Installer memverifikasi hash V1/add-on sebelumnya, mencadangkan file yang diperbarui dan menolak modifikasi khusus sebelum penulisan. Laporan harian hanya menambah dua sheet; tidak memakai trigger atau notifikasi eksternal baru. Pengujian mencakup alur tinjauan, invalid/stale write, scope, receipt, redaksi AI, render, CSV dan persistensi demo.

Patch 2.1.1: logical assignment di memoryStore dihapus dan Array.at diganti. Inisialisasi tabel tetap null/undefined saja dan mempertahankan referensi data yang sudah ada. Tidak menambah atau mengubah tabel. File GS diparse dengan batas sintaks konservatif ECMAScript 2020, yang mereproduksi error baris 226 pada source 2.1.0.
