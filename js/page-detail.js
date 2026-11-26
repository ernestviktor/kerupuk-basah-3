// Skrip halaman Detail Event Dinamis (event-detail.html?id=...).

window.PortalKampus = window.PortalKampus || {};

(function () {
  var svc = window.PortalKampus.calendarService;
  var ics = window.PortalKampus.ics;
  var ui = window.PortalKampus.ui;

  var state = {
    eventId: '',
    payload: null
  };

  var el = {};

  function formatContactHtml(contact) {
    var val = String(contact || '').trim();
    if (!val) {
      return '-';
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return '<a href="mailto:' + svc.escapeHtml(val) + '">' + svc.escapeHtml(val) + '</a>';
    }
    var safeUrl = svc.sanitizeUrl(val);
    if (safeUrl) {
      return '<a href="' + svc.escapeHtml(safeUrl) + '" target="_blank" rel="noopener">' + svc.escapeHtml(val) + '</a>';
    }
    return svc.escapeHtml(val);
  }

  function renderParagraphs(text) {
    var blocks = String(text || '')
      .split(/\n+/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);

    if (blocks.length === 0) {
      return '<p>-</p>';
    }
    return blocks
      .map(function (line) {
        return '<p>' + svc.escapeHtml(line) + '</p>';
      })
      .join('');
  }

  function renderRegistrationBlock(ev, lang) {
    if (ev.daftarUrl) {
      return (
        '<div class="action-stack">' +
          '<a class="btn btn-accent" href="' + svc.escapeHtml(ev.daftarUrl) + '" target="_blank" rel="noopener">' +
            (lang === 'en' ? 'Register via Official Link' : 'Daftar via Formulir Resmi') +
          '</a>' +
        '</div>' +
        '<p class="placeholder-note">' +
          (lang === 'en'
            ? 'Registration opens in the official organizer form linked from Google Calendar.'
            : 'Pendaftaran dibuka melalui tautan formulir resmi yang dicantumkan panitia di Google Calendar.') +
        '</p>'
      );
    }

    if (ev.status === 'closed') {
      return (
        '<div class="ui-state ui-state--empty" role="status">' +
          '<p class="ui-state__title">' + (lang === 'en' ? 'Registration Closed' : 'Pendaftaran Ditutup') + '</p>' +
          '<p class="ui-state__desc">' +
            (lang === 'en'
              ? 'This event has ended. Contact the organizer if you need archive materials.'
              : 'Kegiatan ini telah selesai dilaksanakan. Hubungi kontak panitia bila memerlukan arsip materi.') +
          '</p>' +
        '</div>'
      );
    }

    return (
      '<form class="reg-form" id="dynamic-reg-form" novalidate>' +
        '<div class="form-field">' +
          '<label for="reg-nama">' + (lang === 'en' ? 'Full Name' : 'Nama Lengkap') + '</label>' +
          '<input id="reg-nama" name="nama" type="text" required placeholder="' + (lang === 'en' ? 'Your full name' : 'Nama lengkap mahasiswa') + '">' +
        '</div>' +
        '<div class="form-field">' +
          '<label for="reg-nim">NIM</label>' +
          '<input id="reg-nim" name="nim" type="text" required placeholder="672024084">' +
        '</div>' +
        '<div class="form-field">' +
          '<label for="reg-email">' + (lang === 'en' ? 'Campus Email' : 'Email Kampus') + '</label>' +
          '<input id="reg-email" name="email" type="email" required placeholder="nim@student.uksw.edu">' +
        '</div>' +
        '<div class="form-field">' +
          '<label for="reg-prodi">' + (lang === 'en' ? 'Study Program' : 'Program Studi') + '</label>' +
          '<select id="reg-prodi" name="prodi" required>' +
            '<option value="">' + (lang === 'en' ? 'Choose study program' : 'Pilih program studi') + '</option>' +
            '<option value="S1 Teknik Informatika">S1 Teknik Informatika</option>' +
            '<option value="S1 Sistem Informasi">S1 Sistem Informasi</option>' +
            '<option value="S1 Desain Komunikasi Visual">S1 Desain Komunikasi Visual</option>' +
            '<option value="Lainnya">' + (lang === 'en' ? 'Other' : 'Lainnya') + '</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-field">' +
          '<label for="reg-wa">' + (lang === 'en' ? 'WhatsApp Number' : 'Nomor WhatsApp') + '</label>' +
          '<input id="reg-wa" name="whatsapp" type="tel" required placeholder="08xxxxxxxxxx">' +
        '</div>' +
        '<button class="btn btn-accent" type="submit">' + (lang === 'en' ? 'Submit Registration' : 'Kirim Pendaftaran') + '</button>' +
      '</form>' +
      '<div id="dynamic-reg-feedback" class="form-status" role="status" aria-live="polite"></div>' +
      '<p class="placeholder-note">' +
        (lang === 'en'
          ? '[LOCAL DEMO MODE] No external registration link was set in Google Calendar. Submissions validate locally without a backend.'
          : '[MODE DEMO LOKAL] Panitia belum mencantumkan link Daftar di Google Calendar. Form ini memvalidasi isian secara lokal.') +
      '</p>'
    );
  }

  function attachRegistrationHandlers(eventTitle, lang) {
    var form = document.getElementById('dynamic-reg-form');
    var feedback = document.getElementById('dynamic-reg-feedback');
    if (!form || !feedback) {
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var nameVal = (form.elements.nama && form.elements.nama.value || '').trim();
      var nimVal = (form.elements.nim && form.elements.nim.value || '').trim();
      feedback.style.display = 'block';
      feedback.textContent = lang === 'en'
        ? 'Demo submission recorded for ' + nameVal + ' (' + nimVal + ') on "' + eventTitle + '".'
        : 'Pendaftaran demo tercatat untuk ' + nameVal + ' (' + nimVal + ') pada acara "' + eventTitle + '".';
      form.reset();
    });
  }

  function renderDetail() {
    if (!state.payload || !el.contentWrap) {
      return;
    }
    var lang = ui.getCurrentLang();
    var ev = state.payload.event;

    if (!ev) {
      el.title.textContent = lang === 'en' ? 'Event Not Found' : 'Event Tidak Ditemukan';
      el.subtitle.textContent = lang === 'en'
        ? 'The requested event ID is missing or no longer listed on the schedule.'
        : 'ID event tidak ditemukan atau jadwal sudah dihapus dari kalender.';
      document.title = el.title.textContent + ' | Portal Event Kampus';
      el.contentWrap.innerHTML = '';
      ui.renderStatusState(el.stateWrap, {
        type: 'empty',
        title: el.title.textContent,
        message: el.subtitle.textContent,
        actionLabel: lang === 'en' ? 'Back to Events Directory' : 'Kembali ke Daftar Event',
        actionHref: 'events.html'
      });
      return;
    }

    el.stateWrap.innerHTML = '';
    var title = ui.getEventTitle(ev, lang);
    var desc = ui.getEventDescription(ev, lang);
    var catMeta = svc.getCategoryMeta(ev.category);
    var catLabel = lang === 'en' ? catMeta.labelEn : catMeta.labelId;
    var statusMeta = ui.getStatusMeta(ev.status);
    var dateRange = svc.formatDisplayDateRange(ev, lang);
    var gcalAddUrl = ics.buildGoogleCalendarAddUrl(ev);
    var waUrl = ics.buildWhatsAppShareUrl(ev, window.location.href);

    document.title = title + ' | Portal Event Kampus';
    el.title.textContent = title;
    el.subtitle.textContent = dateRange + ' · ' + (ev.location || ui.t('locationTba'));

    var rundownHtml = '';
    if (Array.isArray(ev.rundown) && ev.rundown.length > 0) {
      rundownHtml =
        '<div class="rundown-list">' +
          ev.rundown
            .map(function (row) {
              return (
                '<div class="rundown-item">' +
                  '<span class="rundown-time">' + svc.escapeHtml(row.time) + '</span>' +
                  '<span>' + svc.escapeHtml(row.activity) + '</span>' +
                '</div>'
              );
            })
            .join('') +
        '</div>';
    } else {
      rundownHtml =
        '<p class="placeholder-note">' +
          (lang === 'en'
            ? 'Detailed session rundown has not been listed in Google Calendar for this event.'
            : 'Susunan sesi terperinci belum ditambahkan oleh panitia di deskripsi Google Calendar.') +
        '</p>';
    }

    el.contentWrap.innerHTML =
      '<div class="detail-layout">' +
        '<article class="detail-panel">' +
          '<figure class="detail-poster">' +
            '<img src="' + svc.escapeHtml(ev.poster) + '" width="1280" height="800" alt="' + svc.escapeHtml(ev.posterAlt || title) + '" loading="eager" decoding="async" data-fallback="' + svc.escapeHtml(catMeta.defaultPoster) + '">' +
          '</figure>' +
          '<div class="event-card__meta" style="margin-bottom: 14px;">' +
            '<span class="badge badge--cat">' + svc.escapeHtml(catLabel) + '</span>' +
            '<span class="badge ' + statusMeta.className + '">' + svc.escapeHtml(statusMeta.label) + '</span>' +
          '</div>' +
          '<h2 class="footer-title">' + (lang === 'en' ? 'Description & Schedule' : 'Deskripsi & Rundown Acara') + '</h2>' +
          renderParagraphs(desc) +
          rundownHtml +
        '</article>' +
        '<aside class="detail-panel">' +
          '<h2 class="footer-title">' + (lang === 'en' ? 'Details & Registration' : 'Informasi & Pendaftaran') + '</h2>' +
          '<dl class="info-dl">' +
            '<div><dt>' + (lang === 'en' ? 'Date & Time' : 'Tanggal & Waktu') + '</dt><dd>' + svc.escapeHtml(dateRange) + '</dd></div>' +
            '<div><dt>' + (lang === 'en' ? 'Venue' : 'Lokasi') + '</dt><dd>' + svc.escapeHtml(ev.location || ui.t('locationTba')) + '</dd></div>' +
            '<div><dt>' + (lang === 'en' ? 'Fee' : 'Biaya') + '</dt><dd>' + svc.escapeHtml(ev.fee || '-') + '</dd></div>' +
            '<div><dt>' + (lang === 'en' ? 'Contact' : 'Kontak Panitia') + '</dt><dd>' + formatContactHtml(ev.contact) + '</dd></div>' +
          '</dl>' +
          '<div class="action-stack">' +
            '<button type="button" class="btn btn-outline" id="detail-ics-btn">' + (lang === 'en' ? 'Download Calendar (.ics)' : 'Unduh Kalender (.ics)') + '</button>' +
            '<a class="btn btn-outline" href="' + svc.escapeHtml(gcalAddUrl) + '" target="_blank" rel="noopener">' + (lang === 'en' ? 'Save to Google Calendar' : 'Simpan ke Google Calendar') + '</a>' +
            '<a class="btn btn-outline" href="' + svc.escapeHtml(waUrl) + '" target="_blank" rel="noopener">' + (lang === 'en' ? 'Share via WhatsApp' : 'Bagikan via WhatsApp') + '</a>' +
            (ev.htmlLink
              ? '<a class="btn btn-outline" href="' + svc.escapeHtml(ev.htmlLink) + '" target="_blank" rel="noopener">' + (lang === 'en' ? 'Open Source Event in Google Calendar' : 'Buka Acara Asli di Google Calendar') + '</a>'
              : '') +
          '</div>' +
          '<hr class="detail-divider">' +
          '<h3 class="footer-title">' + (lang === 'en' ? 'Registration' : 'Pendaftaran Peserta') + '</h3>' +
          renderRegistrationBlock(ev, lang) +
        '</aside>' +
      '</div>';

    ui.attachImageFallbacks(el.contentWrap);
    var icsBtn = document.getElementById('detail-ics-btn');
    if (icsBtn) {
      icsBtn.addEventListener('click', function () {
        ics.downloadEventIcs(ev);
      });
    }
    attachRegistrationHandlers(title, lang);
  }

  async function loadDetail() {
    var params = new URLSearchParams(window.location.search);
    state.eventId = (params.get('id') || '').trim();

    if (!state.eventId) {
      state.payload = { event: null, source: 'fallback', errorMessage: '' };
      renderDetail();
      return;
    }

    ui.renderStatusState(el.stateWrap, {
      type: 'loading',
      title: ui.t('loadingEvents')
    });
    state.payload = await svc.getEventById(state.eventId);
    renderDetail();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.title = document.getElementById('detail-title');
    el.subtitle = document.getElementById('detail-subtitle');
    el.stateWrap = document.getElementById('detail-state');
    el.contentWrap = document.getElementById('detail-content');

    if (!el.contentWrap) {
      return;
    }
    loadDetail();
    window.addEventListener('portal:langchange', renderDetail);
  });
})();
