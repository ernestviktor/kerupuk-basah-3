// Template konfigurasi Portal Event Kampus (aman untuk GitHub).
// Salin file ini menjadi js/config.js untuk pengembangan lokal, atau biarkan Vercel mengisinya saat build dari Environment Variables.

window.PortalKampus = window.PortalKampus || {};

window.PortalKampus.CONFIG = {
  // Isi calendarId, apiKey, dan oauthClientId di js/config.js lokal atau lewat Vercel Environment Variables.
  // Biarkan kosong ('') jika ingin memakai data contoh lokal di js/fallback-events.js.
  googleCalendar: {
    calendarId: 'c64ad70f4b23a46fd4b44275cf120781adc583021a499804c67eae226710bf9a@group.calendar.google.com',
    apiKey: 'AIzaSyCqXccYdXekX492wdwUQFCTlDFvp5Nt0Ho',
    oauthClientId: '251576873112-too02l0gc7k03j46ja7amn6gp43v5b5r.apps.googleusercontent.com',
    timeZone: 'Asia/Jakarta',
    maxResults: 100,
    cacheMinutes: 5
  },

  // Kredensial SSO Google untuk gerbang panel admin (hash SHA-256 diisi otomatis dari Env Var ADMIN_EMAILS saat build Vercel).
  adminAuth: {
    allowedEmailHashes: [],
    allowedEmails: [
      'ernestviktor23@gmail.com',
      'rdwi57815@gmail.com',
      'abelagaphe2007@gmail.com',
      'welprina23@gmail.com'
    ],
    maxSessionMinutes: 55
  },

  // Pengaturan rentang jam dan grid drag untuk Timeline Minggu/Hari (dipakai di calendar.html dan admin.html).
  timeline: {
    startHour: 7,
    endHour: 22,
    hourHeightPx: 60,
    snapMinutes: 15,
    defaultDurationMinutes: 60
  },

  // Daftar kategori resmi event kampus beserta poster bawaan saat admin tidak menyertakan link poster di Google Calendar.
  categories: [
    {
      id: 'seminar',
      labelId: 'Seminar',
      labelEn: 'Seminar',
      defaultPoster: 'assets/img/fti-event-720.jpg',
      defaultPosterAlt: 'Suasana seminar akademik mahasiswa kampus'
    },
    {
      id: 'lomba',
      labelId: 'Lomba',
      labelEn: 'Competition',
      defaultPoster: 'assets/img/fti-workshop-ai-720.jpg',
      defaultPosterAlt: 'Kolaborasi tim peserta lomba inovasi kampus'
    },
    {
      id: 'workshop',
      labelId: 'Workshop',
      labelEn: 'Workshop',
      defaultPoster: 'assets/img/fti-event.jpeg',
      defaultPosterAlt: 'Ruang kegiatan pelatihan dan workshop mahasiswa'
    },
    {
      id: 'seni',
      labelId: 'Pentas Seni',
      labelEn: 'Arts Night',
      defaultPoster: 'assets/img/fti-almamater-720.jpg',
      defaultPosterAlt: 'Dokumentasi kegiatan seni dan kemahasiswaan kampus'
    },
    {
      id: 'ukm',
      labelId: 'UKM',
      labelEn: 'Student Club',
      defaultPoster: 'assets/img/fti-attention.jpg',
      defaultPosterAlt: 'Aktivitas unit kegiatan mahasiswa di area kampus'
    },
    {
      id: 'umum',
      labelId: 'Agenda Kampus',
      labelEn: 'Campus Event',
      defaultPoster: 'assets/img/fti-campus-640.jpg',
      defaultPosterAlt: 'Kegiatan resmi di lingkungan kampus'
    }
  ],

  // Pilihan foto & poster siap pakai pada galeri visual Admin (diambil dari folder assets/img/).
  presetPosters: [
    { label: 'Poster Seminar AI (FTI)', path: 'assets/img/fti-seminar-poster.png' },
    { label: 'Ruang Seminar Utama', path: 'assets/img/fti-event-720.jpg' },
    { label: 'Hackathon & Lab', path: 'assets/img/fti-workshop-ai-720.jpg' },
    { label: 'Workshop Studio', path: 'assets/img/fti-event.jpeg' },
    { label: 'Kegiatan Almamater & Seni', path: 'assets/img/fti-almamater-720.jpg' },
    { label: 'Aktivitas UKM', path: 'assets/img/fti-attention.jpg' },
    { label: 'Banner Kuliah Umum', path: 'assets/img/fti-sikp.png' },
    { label: 'Gedung Kampus Utama', path: 'assets/img/fti-campus-1280.jpg' },
    { label: 'Halaman Gedung Kampus', path: 'assets/img/fti-campus-640.jpg' },
    { label: 'Dokumentasi Mahasiswa 1', path: 'assets/img/ig-fti-1.jpg' },
    { label: 'Dokumentasi Mahasiswa 2', path: 'assets/img/ig-fti-2.jpg' },
    { label: 'Aula Kuliah Umum', path: 'assets/img/photo-f149049984-960.jpg' },
    { label: 'Kolaborasi Workshop', path: 'assets/img/photo-f162011448-960.jpg' },
    { label: 'Panggung Pentas Seni', path: 'assets/img/photo-f190017879-960.jpg' },
    { label: 'Gedung Perkuliahan', path: 'assets/img/photo-f195725672-500.jpg' },
    { label: 'Kampus Malam Hari', path: 'assets/img/photo-f198863015-960.jpg' },
    { label: 'Plaza & Campus Hub', path: 'assets/img/photo-f199815252-1280.jpg' },
    { label: 'Gedung Akademik', path: 'assets/img/photo-f63196043-960.jpg' }
  ],

  defaultContactEmail: 'panitia@eventkampus.example',
  defaultFee: {
    id: 'Gratis (konfirmasi panitia jika ada perubahan)',
    en: 'Free (confirm with organizer if updated)'
  },

  storageKeys: {
    lang: 'portal_kampus_lang',
    eventsCache: 'portal_kampus_gcal_cache_v1',
    adminDrafts: 'portal_kampus_admin_drafts_v1',
    adminSession: 'portal_kampus_admin_session_v1',
    adminAllowedEmails: 'portal_kampus_admin_allowed_emails_v1'
  },

  // Kamus teks singkat untuk elemen yang dibuat oleh JavaScript agar tombol bahasa ID / EN tetap konsisten.
  i18n: {
    id: {
      statusOpen: 'Pendaftaran Dibuka',
      statusSoon: 'Segera Hadir',
      statusClosed: 'Selesai',
      viewDetails: 'Buka Detail Event',
      allCategories: 'Semua',
      allStatuses: 'Semua Status',
      upcomingOnly: 'Akan Datang',
      closedOnly: 'Selesai',
      loadingEvents: 'Memuat jadwal event...',
      noMatchingEvents: 'Tidak ada event yang cocok dengan filter atau pencarian saat ini.',
      resetFilter: 'Reset Filter',
      modeFallback: 'Mode Data Contoh Lokal: Google Calendar API belum dikonfigurasi di js/config.js.',
      modeLive: 'Terhubung langsung ke Google Calendar kampus.',
      modeError: 'Gagal mengambil jadwal terbaru dari Google Calendar. Menampilkan data contoh lokal.',
      retry: 'Coba Muat Ulang',
      locationTba: 'Lokasi diumumkan panitia',
      allDayLabel: 'Sepanjang hari',
      noEventsOnDate: 'Belum ada jadwal kegiatan pada tanggal ini.',
      selectDateHint: 'Klik tanggal bertanda biru di kalender untuk melihat rincian agenda pada hari tersebut.',
      noEventsInMonth: 'Belum ada agenda terjadwal pada bulan ini.',
      addEventPrompt: 'Tambah Jadwal via Admin',
      timelineEmptyDay: 'Belum ada agenda terjadwal pada tanggal ini.',
      timelineEmptyRange: 'Belum ada agenda pada rentang tanggal ini. Klik atau seret di grid jam untuk membuat jadwal.',
      timelineEmptyPublic: 'Belum ada agenda terjadwal pada rentang tanggal ini.',
      viewWeek: 'Minggu',
      viewDay: 'Hari',
      createEventBtn: '+ Buat Event',
      dragHintAdmin: 'Seret di grid jam untuk buat event, seret blok untuk pindah, atau tarik tepi bawah untuk ubah durasi.',
      dragHintPublic: 'Klik blok acara untuk melihat rincian lengkap jadwal kampus.',
      localDraftBadge: 'Draft Lokal',
      undoLabel: 'Urungkan',
      overlapLabel: 'Overlap'
    },
    en: {
      statusOpen: 'Open',
      statusSoon: 'Coming Soon',
      statusClosed: 'Completed',
      viewDetails: 'View Details',
      allCategories: 'All',
      allStatuses: 'All Statuses',
      upcomingOnly: 'Upcoming',
      closedOnly: 'Completed',
      loadingEvents: 'Loading campus schedule...',
      noMatchingEvents: 'No events match your current search or filter selection.',
      resetFilter: 'Reset Filters',
      modeFallback: 'Local Sample Mode: Google Calendar API is not yet configured in js/config.js.',
      modeLive: 'Connected live to the campus Google Calendar.',
      modeError: 'Could not reach Google Calendar API. Showing local sample events instead.',
      retry: 'Retry Sync',
      locationTba: 'Venue to be announced',
      allDayLabel: 'All day',
      noEventsOnDate: 'No events scheduled on this date.',
      selectDateHint: 'Select a highlighted date on the calendar to inspect its schedule.',
      noEventsInMonth: 'No campus events are scheduled for this month.',
      addEventPrompt: 'Schedule via Admin Helper',
      timelineEmptyDay: 'No timed events scheduled for this date.',
      timelineEmptyRange: 'No events in this date range. Click or drag on the time grid to schedule one.',
      timelineEmptyPublic: 'No events scheduled in this date range.',
      viewWeek: 'Week',
      viewDay: 'Day',
      createEventBtn: '+ Create Event',
      dragHintAdmin: 'Drag on the time grid to create, drag an event to move, or drag its bottom edge to resize.',
      dragHintPublic: 'Click an event block to view complete schedule details.',
      localDraftBadge: 'Local Draft',
      undoLabel: 'Undo',
      overlapLabel: 'Overlap'
    }
  }
};
