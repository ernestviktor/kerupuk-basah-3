# Tugas Rancang Asistensi PTI-B Semester 1 Tahun 2026/2027

Portal Event Kampus
Tugas PTI: Pembuatan Web, Kelompok Kerupuk Basah - 3

Anggota Kelompok
Agaphe Abel (672024084)
Reza Dwi Saputra (672026080)
Ernest Limbong (672026071)
Wellprina Grace (672026085)

Teknologi HTML5, CSS3, & Vanilla JavaScript (tanpa framework, tanpa bundler, siap jalan di file:// maupun GitHub Pages)

Integrasi Google Calendar API v3 (pembacaan publik via API Key + Create/Edit/Delete langsung di Admin via Google OAuth 2.0) dengan fallback otomatis ke data lokal
Google Fonts: Playfair Display, Archivo, Manrope
Logo Matriks Kalender Editorial (assets/img/logo-event-kampus.svg, assets/img/favicon.svg)

Struktur Halaman
index.html : Beranda, hero, 3 event unggulan dinamis, daftar kategori, dan ajakan kalender
events.html : Direktori event dengan pencarian teks, filter kategori, dan filter status
calendar.html : Kalender bulanan interaktif, Timeline Harian dengan deteksi bentrok (Overlap), Daftar Agenda, panel tanggal terpilih, dan langganan Google Calendar
event-detail.html : Halaman detail dinamis (?id=...) lengkap dengan rundown, generator .ics, simpan ke Google Calendar, WhatsApp share, dan pendaftaran
admin.html : Panel admin dengan login Google OAuth 2.0 (Create/Edit/Delete langsung ke Google Calendar), Timeline Harian untuk memilih slot kosong, deteksi Overlap otomatis, pratinjau kartu, dan panduan aktivasi 

API & OAuth
about.html : Profil kelompok, tautan LinkedIn, kontak, dan peta kampus
event-*.html : Halaman detail statis warisan tetap dipertahankan agar tautan lama tidak putus
Dokumentasi Pengembang & Deploy (Vercel)
Untuk pengembangan lokal, salin js/config.example.js menjadi js/config.js (file js/config.js tidak ikut ter-commit ke GitHub karena masuk .gitignore).
Untuk hosting di Vercel, tambahkan 4 Environment Variables di Project Settings -> Environment Variables (GCAL_CALENDAR_ID, GCAL_API_KEY, GCAL_OAUTH_CLIENT_ID, dan ADMIN_EMAILS sesuai .env.example). Konfigurasi vercel.json akan menjalankan scripts/build-vercel.mjs saat deploy.
Lihat JUNIOR_DEV_GUIDE.md untuk peta file JS, cara mengisi kredensial, serta panduan menambah kategori atau tag metadata baru.
