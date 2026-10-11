# Hasil pengujian v1.0.0

Tanggal: 7 Oktober 2026. Lingkungan: Node.js 24 untuk domain/API mock, Chrome preview untuk UI. Data uji sintetis, bukan data pegawai nyata.

## Otomatis — 20 tes lulus

Perintah: `node --test tests/*.test.mjs`.

1. Formula skor dan batas kategori risiko.
2. Pembatasan read/write supervisor ke timnya.
3. Viewer tidak bisa menulis dan respons user tidak mengandung hash/salt.
4. Catatan sensitif dan akar masalah disembunyikan dari user yang tidak berhak.
5. Import invalid tidak menulis baris valid sebagian.
6. Import periode lama tidak menggantikan skor minggu berjalan.
7. Cuti dua level, approver berbeda, dan saldo baru terpakai setelah final approval.
8. Cadangan cuti tertunda, overlap, larangan tanggal lampau, dan saldo lintas tahun.
9. Izin disetujui meningkatkan Attendance.
10. Onboarding membutuhkan assessment lulus dan merekam actor.
11. Plan menyimpan initial score, empat check-in, completion, dan hasil.
12. Resign mengeluarkan NC dari daftar aktif, menutup plan, dan mempertahankan histori.
13. Laporan tidak mengandung isi percakapan sensitif; readiness dan pagination terbatas.
14. Parsing TSV memeriksa header dan severity.
15. Final score plan tidak berubah setelah ditutup; laporan periode lalu mengikuti status saat itu.
16. Envelope HTTP, hash login, protected endpoint, pencabutan sesi saat role berubah.
17. Satu getDataRange per sheet dalam request dan cache agregat dashboard.
18. Metode POST untuk write, receipt permanen setelah cache evict, anti reuse ID untuk payload berbeda.
19. Validasi batch sebelum commit, cache JSON >100 KB dipecah, chunk hilang menjadi cache miss.
20. Replay receipt memeriksa ulang supervisor NC saat ini.

## UI — diuji langsung

- PNG asli terbaca dan tampil di halaman masuk/sidebar.
- Mode demo Admin: dashboard 38 NC aktif, tren, distribusi area, daftar prioritas.
- Seluruh 15 halaman navigasi, ditambah profil NC, dimuat; modul administratif ditampilkan untuk Admin.
- Form input sinyal dipakai untuk NC003, severity enam kategori diubah menjadi 3; tabel berubah menjadi skor 100 / Immediate Intervention.
- Action plan dibuat dari profil NC003; tindakan/PIC/due date dan empat jadwal check-in tampil setelah disimpan.
- Preview iframe 390 × 844: bottom nav tampil, body tidak meluber horizontal (375 px termasuk scrollbar).
- Preview tablet 768 × 1024 pada role Viewer: tombol input sinyal tidak tampil.
- Layar HP/tablet memakai CSS yang sama dengan desktop. Tabel tetap dapat digeser horizontal di dalam kontainer.

## Belum diverifikasi di akun pengguna

- Deployment Apps Script milik pengguna, izin organisasi Google, dan GitHub Pages milik pengguna.
- Fetch/CORS aktual antara domain GitHub pengguna dan Web App Google.
- Kuota, latency, dan kapasitas dengan ribuan NC/data produksi nyata.
- Jalannya trigger harian pada akun Google yang sebenarnya.
- Dialog cetak/PDF lintas browser; stylesheet A4 tersedia tetapi bukan PDF yang dihasilkan backend.

Hasil UI menggunakan mode demo yang memakai aturan domain sama dengan Core.gs. Mock backend menguji kontrak dan akses service, bukan menggantikan uji deployment Google setelah pemasangan.
