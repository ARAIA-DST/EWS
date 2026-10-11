# PRD — NC Retention & Attrition Early Warning System

Versi: 1.0.0. Pemilik operasional: Araia Group. Tim: Enfagrow. Bahasa: Indonesia.

Tujuan: mendeteksi risiko resign NC lebih awal dan mengubah sinyal menjadi percakapan, dukungan, action plan, serta pengukuran hasil. Sistem tidak mengambil keputusan resign otomatis.

Alur utama: DETECT → TALK → UNDERSTAND → ACT → FOLLOW UP → MEASURE.

## Spesifikasi yang diimplementasikan

| Modul | Acceptance |
|---|---|
| Dashboard | KPI NC aktif/risk/onboarding/pending/due, trend 12 minggu, area, maksimal 8 prioritas |
| Early Warning | Severity 0–3, bobot/threshold configurable, filter/debounce/sort/pagination, profil |
| Profil NC | Enam tab lazy; risk breakdown, timeline, seluruh riwayat dalam scope |
| Onboarding | Pipeline enam status termasuk Perlu Ulang, data assessment, log, tertahan, masa kritis, Kanban desktop |
| Izin | Pengajuan, link lampiran, approval, izin disetujui menambah severity Attendance |
| Cuti | Saldo dari sheet/Requests, anti bentrok, validasi tanggal/saldo, satu/dua level, kalender kapasitas area |
| Percakapan | Panduan 1-on-1, akar masalah, note sensitivitas dibatasi server |
| Action Plan | Maksimal 5 tindakan, PIC/due, target/initial score, check-in 7/14/21/30, hasil |
| Input / import | TSV → preview → satu batch server, validasi seluruh baris |
| Pengaturan/Admin | Role Admin/HR/Supervisor/Viewer, scope tim, config, user, audit pagination |
| Attrition Log | Tanggal efektif, alasan, deteksi sebelum resign, masa kerja, riwayat tetap tersedia |
| Papan Retensi | Supervisor/area, retention 90 hari, plan/check-in tepat waktu, respons, filter periode |
| Laporan Bulanan | Cetak A4/PDF, ringkasan clipboard, CSV data yang dimuat, tanpa note sensitif |
| Pengingat | Jadwal tertunda, item due, assessment, approval >2 hari, template wa.me, trigger opsional |
| Kesiapan NC Baru | Checklist configurable, progres x/n, check-in 30/60/90 |

Default bobot: Attendance 25; Performance 25; Commitment 15; Support 15; Execution 10; Engagement 10. Score = pembulatan jumlah `(severity / 3) × bobot`. Attendance memakai tambahan izin approved dalam jendela hari, dibatasi severity maksimum 3. Threshold 0–29 Low, 30–59 Moderate, 60–100 High.

Logo wajib berasal dari PNG pengguna `Araia New.png`, utuh, di login/sidebar/laporan. Palet hitam-putih Araia, biru Enfagrow, hijau/kuning/merah khusus risk. Rail/pinned sidebar, bottom nav mobile, dark mode, fokus terlihat, reduced motion, target sentuh mobile.

Frontend: vanilla ES modules tanpa build. Hosting: hanya GitHub Pages. Backend: built-in Apps Script + Sheets. Attachment link, tidak upload Drive. Custom auth hashes, salt per user, server pepper, token 6 jam, role server, lock, chunked/gzip cache, batch/pagination, idempotency receipts.

Lihat README untuk keputusan default dan batas pengujian. Lihat ARCHITECTURE/API untuk melanjutkan pengembangan. Ubah PRD saat aturan bisnis atau scope berubah; sinkronkan Core.gs dengan shared/core.js.
