# Kontrak API

GET `/exec?action=...&params=<JSON-URL-encoded>&token=<token>` untuk baca. POST `/exec` dengan `Content-Type: text/plain;charset=UTF-8` dan JSON untuk login/tulis. Semua endpoint kecuali `health` dan `login` membutuhkan token. Tidak ada rahasia yang dikirim melalui query login.

```json
{"action":"signals.save","token":"TOKEN_SESI","requestId":"UUID_UNIK","params":{"nc_id":"NC001","periode":"2026-10-05","attendance":2,"commitment":1,"performance":2,"execution":0,"engagement":1,"support":1}}
```

| Aksi baca | Params penting |
|---|---|
| health | Tidak memerlukan token |
| bootstrap | user, config, dashboard, lookups dalam satu panggilan |
| dashboard | Agregat terpisah dari list |
| nc.list | page, pageSize, sort, direction, q, status, area, supervisor_id, category, onboarding_status, criticalOnly |
| onboarding.list | Filter/pagination sama seperti NC |
| nc.detail | nc_id, tab: summary/signals/conversations/plans/requests/onboarding, page/pageSize |
| requests.list | tipe, status, nc_id, pagination |
| calendar | month: YYYY-MM |
| plans.list | status, pagination |
| conversations.list | Metadata percakapan, pagination; isi catatan melalui profil |
| attrition | month untuk KPI; tabel riwayat dengan pagination |
| leaderboard | period: 30/60/90/year, group: supervisor/area |
| report | month, page/pageSize untuk detail High Risk |
| reminders | Pagination |
| balance | nc_id, year |
| users.list / audit | Admin; pagination |

| Aksi tulis | Role / isi |
|---|---|
| login | username, password; mengembalikan token, expires, user publik |
| logout | Token sesi |
| nc.save | Admin/HR; nc_id opsional, nama, area, supervisor_id, tanggal_join, no_hp, catatan |
| signals.save / signals.import | Admin/HR/Supervisor; sinyal satu NC atau rows array |
| onboarding.save | nc_id, status, jadwal_training, trainer, tanggal_assessment, skor_assessment, catatan |
| checklist.set | nc_id, item, selesai boolean |
| onboarding.checkin | nc_id, hari_ke: 30/60/90, status, catatan |
| request.submit | nc_id, tipe, jenis, mulai, selesai, alasan, lampiran_link |
| request.decide | req_id, decision: Disetujui/Ditolak, catatan; level kedua HR/Admin |
| conversation.save | nc_id, tanggal, akar_masalah, catatan, sensitif boolean |
| plan.create | nc_id, mulai, target_score, akar_masalah, items[1..5] |
| item.set | item_id, selesai boolean |
| plan.checkin | plan_id, hari_ke: 7/14/21/30, status, catatan |
| plan.close | plan_id, hasil_akhir: Pulih/Tetap |
| attrition.create | Admin/HR; nc_id, tgl_resign, tgl_efektif, alasan, catatan |
| config.save | Admin; konfigurasi yang tervalidasi |
| user.save | Admin; user_id opsional, username, nama, role, area, aktif, password opsional pada update |
| batch | actions array maksimal 20 aksi tulis; tidak termasuk login/logout |

Supervisor dibatasi oleh `NC.supervisor_id === user.user_id`, pada baca, tulis, dan replay receipt. Role di body frontend tidak dipakai sebagai otoritas. Viewer tidak dapat menulis. Pesan error dalam bahasa Indonesia; kode utama AUTH, FORBIDDEN, VALIDATION, BUSY, RATE_LIMIT, SETUP_REQUIRED, METHOD, NOT_FOUND, SERVER.

Daftar berbentuk `{rows,total,page,pageSize}`. Daftar pada detail dan attrition dapat berada di property `rows` sesuai kontrak halaman. Response HTML dari Google bukan response API valid; periksa deployment bila terjadi error parse JSON.
