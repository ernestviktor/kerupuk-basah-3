// Data contoh lokal sebagai cadangan otomatis saat Google Calendar API belum diatur atau sedang offline.
// Format setiap item sama persis dengan hasil mapping dari Google Calendar API di js/calendar-service.js.

window.PortalKampus = window.PortalKampus || {};

window.PortalKampus.FALLBACK_EVENTS = [
  {
    id: 'pekan-ukm-2026',
    title: 'Pekan Terbuka & Rekrutmen UKM Semester Ganjil',
    titleEn: 'Student Club Open Week & Recruitment',
    category: 'ukm',
    status: 'closed',
    startIso: '2026-11-12T10:00:00+07:00',
    endIso: '2026-11-12T16:00:00+07:00',
    isAllDay: false,
    location: 'Plaza Mahasiswa',
    description: 'Pameran stan unit kegiatan mahasiswa bidang riset, olahraga, seni, dan pengabdian masyarakat. Mahasiswa baru maupun tingkat lanjut dapat mengenal program kerja tiap UKM secara langsung.',
    descriptionEn: 'Campus showcase of student clubs across research, sports, arts, and community service. New and returning students can explore club programs directly at the booths.',
    poster: 'assets/img/fti-attention.jpg',
    posterAlt: 'Kegiatan mahasiswa untuk Pekan Terbuka UKM',
    fee: 'Gratis untuk seluruh mahasiswa',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '10.00 - 12.00 WIB', activity: 'Pembukaan stan pameran UKM di Plaza Mahasiswa' },
      { time: '13.00 - 15.00 WIB', activity: 'Demo kegiatan dan sesi tanya jawab pengurus' }
    ],
    legacyUrl: 'event-pekan-ukm.html',
    staticIcsUrl: 'assets/ics/pekan-ukm.ics',
    htmlLink: ''
  },
  {
    id: 'seminar-ai-2026',
    title: 'Seminar Nasional AI & Etika Riset Mahasiswa',
    titleEn: 'National Seminar on AI & Student Research Ethics',
    category: 'seminar',
    status: 'open',
    startIso: '2026-11-24T09:00:00+07:00',
    endIso: '2026-11-24T12:30:00+07:00',
    isAllDay: false,
    location: 'Auditorium Utama Kampus',
    description: 'Seminar terbuka bagi seluruh mahasiswa lintas fakultas untuk memahami batasan etika sitasi, verifikasi sumber, serta penggunaan alat bantu riset secara transparan.',
    descriptionEn: 'Open seminar for students across faculties covering citation ethics, source verification, and transparent use of research tools.',
    poster: 'assets/img/fti-seminar-poster.png',
    posterAlt: 'Poster Seminar Nasional AI dan Konferensi FTI UKSW',
    fee: 'Gratis (terbuka untuk mahasiswa aktif)',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '08.30 - 09.00 WIB', activity: 'Registrasi peserta dan pembagian materi seminar' },
      { time: '09.00 - 10.30 WIB', activity: 'Sesi 1: Penerapan AI dalam Riset Akademik' },
      { time: '10.30 - 12.00 WIB', activity: 'Sesi 2: Etika Penulisan Ilmiah & Tanya Jawab' }
    ],
    legacyUrl: 'event-seminar-ai.html',
    staticIcsUrl: 'assets/ics/seminar-ai.ics',
    htmlLink: ''
  },
  {
    id: 'hackathon-kampus-2026',
    title: 'Hackathon Inovasi Kampus 2026',
    titleEn: 'Campus Innovation Hackathon 2026',
    category: 'lomba',
    status: 'open',
    startIso: '2026-11-28T08:30:00+07:00',
    endIso: '2026-11-28T17:00:00+07:00',
    isAllDay: false,
    location: 'Gedung Lab Komputer Terpadu',
    description: 'Kompetisi pengembangan prototipe aplikasi layanan mahasiswa dalam tim beranggotakan 3 orang selama satu hari penuh di hadapan juri dosen.',
    descriptionEn: 'One-day student team competition building practical campus service software prototypes presented to faculty judges.',
    poster: 'assets/img/fti-workshop-ai.jpg',
    posterAlt: 'Peserta diskusi Hackathon Inovasi Kampus FTI UKSW',
    fee: 'Rp 35.000 per tim',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '08.30 - 09.15 WIB', activity: 'Pembukaan dan pengumuman studi kasus' },
      { time: '09.15 - 15.00 WIB', activity: 'Pengerjaan prototipe & sesi mentoring' },
      { time: '15.00 - 17.00 WIB', activity: 'Demo produk dan pengumuman pemenang' }
    ],
    legacyUrl: 'event-hackathon-kampus.html',
    staticIcsUrl: 'assets/ics/hackathon-kampus.ics',
    htmlLink: ''
  },
  {
    id: 'workshop-web-2026',
    title: 'Workshop HTML & CSS Tanpa Framework',
    titleEn: 'HTML & CSS Workshop Without Frameworks',
    category: 'workshop',
    status: 'open',
    startIso: '2026-11-30T13:00:00+07:00',
    endIso: '2026-11-30T16:00:00+07:00',
    isAllDay: false,
    location: 'Ruang Studio Multimedia B2',
    description: 'Pelatihan praktik membangun antarmuka web responsif, aksesibel, dan ringan dengan HTML5 dan CSS3, termasuk pengujian kontras warna dan layout ponsel.',
    descriptionEn: 'Hands-on session on building responsive, accessible web interfaces with HTML5 and CSS3, including mobile testing and contrast checks.',
    poster: 'assets/img/fti-event.jpeg',
    posterAlt: 'Ruang kegiatan untuk Workshop Desain Web FTI UKSW',
    fee: 'Gratis (membawa laptop pribadi)',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '13.00 - 13.45 WIB', activity: 'Struktur semantik HTML5 dan variabel CSS' },
      { time: '13.45 - 15.00 WIB', activity: 'Tata letak Grid, Flexbox, dan filter kategori' },
      { time: '15.00 - 16.00 WIB', activity: 'Uji responsif 360px - 1440px dan publikasi GitHub Pages' }
    ],
    legacyUrl: 'event-workshop-web.html',
    staticIcsUrl: 'assets/ics/workshop-web.ics',
    htmlLink: ''
  },
  {
    id: 'pentas-seni-2026',
    title: 'Malam Pentas Seni & Musik UKM',
    titleEn: 'Student Arts & Music Night',
    category: 'seni',
    status: 'soon',
    startIso: '2026-12-05T18:00:00+07:00',
    endIso: '2026-12-05T22:00:00+07:00',
    isAllDay: false,
    location: 'Lapangan Terbuka Fakultas Seni',
    description: 'Acara tahunan kolaborasi UKM Musik, Tari, dan Teater sebagai ruang ekspresi kreatif mahasiswa menjelang akhir semester.',
    descriptionEn: 'Annual showcase combining student music, dance, and theater clubs ahead of finals.',
    poster: 'assets/img/fti-almamater.jpg',
    posterAlt: 'Kegiatan kemahasiswaan Malam Pentas Seni FTI UKSW',
    fee: 'Gratis dengan kartu tanda mahasiswa',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '18.00 - 19.00 WIB', activity: 'Pembukaan gerbang dan bazar karya mahasiswa' },
      { time: '19.00 - 20.30 WIB', activity: 'Pementasan tari dan teater pendek' },
      { time: '20.30 - 22.00 WIB', activity: 'Penampilan band UKM Musik' }
    ],
    legacyUrl: 'event-pentas-seni.html',
    staticIcsUrl: 'assets/ics/pentas-seni.ics',
    htmlLink: ''
  },
  {
    id: 'kuliah-umum-2026',
    title: 'Kuliah Umum Karier Teknologi & Riset Terbuka',
    titleEn: 'Public Lecture on Tech Careers & Open Research',
    category: 'seminar',
    status: 'soon',
    startIso: '2026-12-08T10:00:00+07:00',
    endIso: '2026-12-08T12:30:00+07:00',
    isAllDay: false,
    location: 'Aula Fakultas Teknik',
    description: 'Sesi berbagi bersama alumni dan dosen pembimbing mengenai cara menyusun dokumentasi proyek kampus agar siap ditinjau perekrut.',
    descriptionEn: 'Sharing session with alumni and faculty advisors on documenting campus projects for technical recruiters.',
    poster: 'assets/img/fti-sikp.png',
    posterAlt: 'Banner kegiatan akademik FTI UKSW untuk Kuliah Umum',
    fee: 'Gratis',
    contact: 'panitia@eventkampus.example',
    daftarUrl: '',
    rundown: [
      { time: '10.00 - 11.15 WIB', activity: 'Pemaparan materi portofolio & riset terbuka' },
      { time: '11.15 - 12.30 WIB', activity: 'Bedah CV dan tanya jawab peserta' }
    ],
    legacyUrl: 'event-kuliah-umum.html',
    staticIcsUrl: 'assets/ics/kuliah-umum.ics',
    htmlLink: ''
  }
];
