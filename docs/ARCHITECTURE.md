# Arsitektur v1.0.0

GitHub Pages menyajikan aset statis. JavaScript melakukan GET untuk baca dan POST text/plain untuk login/tulis ke Apps Script. ContentService mengembalikan envelope `{ok,data,error,meta}`. Google Sheets adalah satu sumber data produksi.

| Lapisan | File | Tanggung jawab |
|---|---|---|
| Router / interaksi | js/app.js | Hash router, drawer, submit, debounce, AbortController, infinite scroll |
| Presentasi | js/views.js, js/forms.js, js/ui.js, css/styles.css | Template yang di-escape, formulir, chart SVG, CSV dan print |
| API client | js/api.js | Fetch, in-flight dedup, SWR cache, TTL, invalidasi domain, token sesi |
| Aturan domain | shared/core.js, apps-script/Core.gs | Skor, scope tim, cuti, onboarding, percakapan, plan, attrition, laporan |
| Demo | js/demo.js, shared/seed.js | Database lokal demo dan data sintetis 40 NC |
| API server | apps-script/Code.gs | HTTP, salt/hash, token, role, rate limit, request receipts, batch |
| Repository | apps-script/Storage.gs | Request memo, sheet maps, batch range writes, cache gzip/chunk |
| Lifecycle | apps-script/Admin.gs, Seed.gs | Setup, data contoh, cleanup, trigger harian |

Satu sheet dibaca dengan `getDataRange().getValues()` paling banyak sekali dalam setiap request, kemudian hasilnya dipakai kembali. Roster risiko memakai memo per request dan map untuk join supervisor/training/log/izin. Writes dibuffer; rentang baris yang berdekatan dikirim dalam satu `setValues`. Tidak ada `getValue`/`setValue` di loop, `appendRow` berulang, atau Advanced Services.

Hasil olahan disimpan 5 menit di CacheService. JSON digzip, base64, lalu dibagi menjadi chunk 85.000 karakter. Manifest chunk memakai ID unik agar pembaca tidak mencampur chunk dua versi. Chunk hilang berarti cache miss, bukan error data. Domain epochs di Script properties memastikan invalidasi terarah. Scope user menjadi bagian key cache.

Client menyimpan token dan cache non-sensitif di sessionStorage. Catatan percakapan tidak disimpan di sessionStorage; tab percakapan detail hanya di memory. Cache selalu dipisahkan per token/user. Logout membersihkan session/cache. Sesi diperiksa lagi di server menggunakan akun aktif, role terkini, dan hash password; perubahan role/password mencabut sesi sebelumnya.

Tiap submit membawa `requestId`. Server memeriksa akses saat ini sebelum mengembalikan receipt, lalu mencari receipt dari cache atau sheet permanen. Fingerprint memastikan ID yang sama tidak dipakai untuk isi berbeda. Aksi batch maksimal 20; import maksimal 200 baris; list default 15/maksimal 50. Sebelum commit, seluruh aksi harus lolos validasi.

Tidak ada upload Drive. Lampiran adalah URL HTTPS. WhatsApp hanya tautan `wa.me`, tidak memakai API dan tidak mengirim otomatis. PDF memakai stylesheet A4 + `window.print()`.

Tambahan kolom/sheet untuk kebutuhan riwayat dan keamanan:

- ActionPlans: `initial_score`, `final_score`, `closed_at`, `akar_masalah` untuk hasil yang tidak bergeser setelah plan ditutup.
- Requests: `supervisor_approver` untuk approval dua user berbeda.
- Onboarding_CheckIns: check-in hari 30/60/90 terpisah dari plan.
- Risk_Events: waktu deteksi High Risk tetap tersimpan meskipun snapshot minggu yang sama turun.
- Request_Receipts: idempotency yang bertahan ketika CacheService hilang.

Seed frontend dan server tidak berisi kontak nyata atau password produksi. Versi awal tidak memiliki login Google, integrasi HRIS, upload file, dan antrean perubahan offline karena tidak diminta pada brief.
