# QA — Add-on Talent 2.1.0

11 Oktober 2026. Pengujian dijalankan pada source lengkap hasil integrasi.

## Pengujian otomatis

`node --test tests/*.test.mjs`: **56 lulus, 0 gagal**.

- 20 tes V1 tetap lulus tanpa perubahan file tes asli: risiko, scope, izin/cuti, onboarding, percakapan, action plan, resign, laporan, cache, hash login dan idempotensi.
- 18 tes domain/API tambahan: 19 industri/5 sektor, import 1.000 profil, update/pagination/filter, validasi sebelum commit, duplikasi kontak/ID, konversi NC, verifikasi/otorisasi, pengalaman kompetitor, sumber pasar, satuan nominal, matching, redaksi AI, storage/cache, receipt, foto privat, integrasi AI mock, setup tambahan, perubahan data terverifikasi dan lock selama permintaan AI.
- 8 tes parser/render: CSV/TSV dengan kutip/baris baru, tiga menu baru, empty state, profil/escaping, Viewer, serta analytics/status AI, tab laporan TL, tinjauan HR, cetak dengan identitas dan akses Viewer.
- 2 tes gateway demo: dua konversi/invalidasi cache NC, serta laporan TL dan tinjauan HR yang tetap tersimpan antar sesi.
- 8 tes laporan harian: pemilik/tanggal, draft/input hari sebelumnya, validasi sebelum commit, duplikasi tanggal/area, workflow perbaikan/kirim ulang/tinjauan, revisi usang, batas akses/POST, receipt durable, rekap/cakupan dan redaksi AI, setup upgrade, pembacaan memo, serta ekspor CSV/form.

Tes import HTTP 1.000 profil menunjukkan setiap sheet yang dipakai dibaca maksimum sekali dalam request tersebut dan SPG_Database ditulis dengan satu setValues. Pemeriksaan sesi/receipt AI dilakukan kembali setelah jaringan selesai, menggunakan pembacaan baru pada tahap commit.

## Pemeriksaan source

25 dari 30 file V1 identik dengan V1 asli. Seluruh 30 file V1 identik dengan paket add-on 2.0.0; pembaruan harian tidak mengubah lagi lima sambungan lama. Lima file penghubung hanya menerima tambahan router, invalidasi/idempotensi demo, penjagaan form baru dan scope Drive/HTTP. Seluruh perubahan tercatat dalam diff dan checksum.

Logo PNG identik dengan V1; SHA-256:

`e26400ee0757d73fdb41f96372a4a2e5972e75fcc50a0c485a2273214cb03bed`

`shared/core.js` / `apps-script/Core.gs` V1 tidak berubah. `shared/talent-core.js` dan `apps-script/TalentCore.gs` identik. Seluruh JavaScript dan Apps Script lolos parsing, manifest valid JSON. ZIP diperiksa terhadap CRC dan tidak berisi data SPG asli/key. Installer diuji pada V1 dan add-on 2.0.0, dapat diulang, mempertahankan config serta file lama, dan berhenti tanpa menulis bila ada perubahan khusus.

## Batas verifikasi

- Backend diuji dengan mock SpreadsheetApp, DriveApp, CacheService, PropertiesService, LockService, UrlFetchApp dan ContentService. Pengujian tidak menggunakan akun Google, Drive, GitHub atau penyedia AI pengguna.
- Render diuji dengan DOM minimal dan hasil HTML; pengujian browser visual/perangkat nyata belum dilakukan pada pembaruan ini.
- Belum ada deployment tambahan pada akun pengguna. Otorisasi scope, akses folder Drive, koneksi dari Pages ke Apps Script, kuota serta format endpoint/model AI nyata perlu diuji setelah pemasangan.
- Foto dikompresi menggunakan API gambar/canvas browser; pengujian API memeriksa signature/otorisasi/penyimpanan, bukan mutu kompresi visual foto pengguna.
- Test case memuat data sintetis khusus pengujian, yang tidak dipakai untuk mengisi database produksi maupun demo add-on.

Panduan smoke test setelah deployment tersedia pada TALENT_ADDON_GUIDE.md.
