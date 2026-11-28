// DI BUAT MENGGUNAKAN AI // 
// Skrip halaman Admin (admin.html): kalender drag & drop ala Google Calendar, Quick Modal, OAuth CRUD, & form lengkap.

window.PortalKampus = window.PortalKampus || {};

(function () {
  var CONFIG = window.PortalKampus.CONFIG;
  var svc = window.PortalKampus.calendarService;
  var ics = window.PortalKampus.ics;
  var ui = window.PortalKampus.ui;
  var tl = window.PortalKampus.timelineView;

  var TEMPLATE_EVENT_PRESETS = [
    {
      slot: 1,
      title: '[Template 1] Judul Seminar',
      categoryId: 'seminar',
      statusValue: 'open',
      dayOffset: 1,
      startTime: '09:00',
      endTime: '12:00',
      description: '[Tulis deskripsi singkat mengenai tujuan, materi, dan sasaran peserta Event 1 di sini.]',
      rundownRaw: '09.00 - 09.30 | [Registrasi & Pembukaan]\n09.30 - 11.00 | [Sesi Materi Utama]\n11.00 - 12.00 | [Tanya Jawab & Penutupan]'
    },
    {
      slot: 2,
      title: '[Template 2] Judul Workshop',
      categoryId: 'workshop',
      statusValue: 'open',
      dayOffset: 2,
      startTime: '09:00',
      endTime: '12:00',
      description: '[Tulis deskripsi singkat mengenai tujuan, materi, dan sasaran peserta Event 2 di sini.]',
      rundownRaw: '09.00 - 09.30 | [Registrasi Peserta]\n09.30 - 11.15 | [Sesi Praktik / Demo]\n11.15 - 12.00 | [Review Karya & Penutupan]'
    },
    {
      slot: 3,
      title: '[Template 3] Judul Lomba',
      categoryId: 'lomba',
      statusValue: 'open',
      dayOffset: 3,
      startTime: '08:30',
      endTime: '15:00',
      description: '[Tulis deskripsi singkat mengenai ketentuan lomba, kategori peserta, dan hadiah Event 3 di sini.]',
      rundownRaw: '08.30 - 09.00 | [Daftar Ulang & Briefing]\n09.00 - 13.00 | [Pelaksanaan Lomba]\n13.00 - 15.00 | [Presentasi, Penjurian & Pengumuman]'
    },
    {
      slot: 4,
      title: '[Template 4] Judul Pentas Seni',
      categoryId: 'seni',
      statusValue: 'soon',
      dayOffset: 4,
      startTime: '18:00',
      endTime: '21:00',
      description: '[Tulis deskripsi singkat mengenai pengisi acara, konsep pertunjukan, dan informasi tiket Event 4 di sini.]',
      rundownRaw: '18.00 - 18.30 | [Open Gate]\n18.30 - 20.30 | [Penampilan Utama]\n20.30 - 21.00 | [Penutupan]'
    },
    {
      slot: 5,
      title: '[Template 5] Judul Kegiatan UKM',
      categoryId: 'ukm',
      statusValue: 'open',
      dayOffset: 5,
      startTime: '10:00',
      endTime: '14:00',
      description: '[Tulis deskripsi singkat mengenai kegiatan UKM, manfaat bergabung, dan persyaratan Event 5 di sini.]',
      rundownRaw: '10.00 - 10.30 | [Pembukaan & Pengenalan UKM]\n10.30 - 13.00 | [Sesi Interaktif / Expo Booth]\n13.00 - 14.00 | [Pendaftaran Anggota Baru]'
    },
    {
      slot: 6,
      title: '[Template 6] Judul Agenda Kampus',
      categoryId: 'umum',
      statusValue: 'soon',
      dayOffset: 6,
      startTime: '09:00',
      endTime: '11:30',
      description: '[Tulis deskripsi singkat mengenai agenda resmi fakultas/kampus dan peserta yang diundang pada Event 6 di sini.]',
      rundownRaw: '09.00 - 09.30 | [Registrasi & Pembukaan]\n09.30 - 11.00 | [Agenda Utama]\n11.00 - 11.30 | [Penutupan]'
    },
    {
      slot: 7,
      title: '[Template 7] Judul Seminar Tambahan',
      categoryId: 'seminar',
      statusValue: 'open',
      dayOffset: 7,
      startTime: '13:00',
      endTime: '16:00',
      description: '[Tulis deskripsi singkat mengenai topik, pembicara/fasilitator, dan fasilitas peserta Event 7 di sini.]',
      rundownRaw: '13.00 - 13.30 | [Registrasi]\n13.30 - 15.15 | [Pemaparan & Diskusi]\n15.15 - 16.00 | [Dokumentasi & Penutupan]'
    }
  ];

  var today = new Date();
  var state = {
    editingEventId: '',
    selectedDateKey: svc.toLocalDateKey(today),
    miniYear: today.getFullYear(),
    miniMonth: today.getMonth(),
    viewMode: window.innerWidth >= 768 ? 'week' : 'day',
    sidebarExpanded: window.innerWidth >= 900,
    hiddenCategories: {},
    activeSelection: null,
    isSaving: false,
    payload: null,
    localDrafts: loadStoredDrafts(),
    lastUndo: null,
    posterUrl: '',
    qmCategory: 'seminar',
    qmPosterUrl: '',
    qmEditingEventId: '',
    qmBaseEvent: null,
    sessionTimerId: null,
    workspaceInitialized: false
  };

  var el = {};
  var applyAuthGate = function () {};

  function padTwo(n) {
    return String(n).padStart(2, '0');
  }

  function formatDateInput(dateObj) {
    return (
      dateObj.getFullYear() +
      '-' +
      padTwo(dateObj.getMonth() + 1) +
      '-' +
      padTwo(dateObj.getDate())
    );
  }

  function formatTimeInput(dateObj) {
    return padTwo(dateObj.getHours()) + ':' + padTwo(dateObj.getMinutes());
  }

  function loadStoredDrafts() {
    try {
      var key = CONFIG.storageKeys && CONFIG.storageKeys.adminDrafts;
      var raw = key ? window.sessionStorage.getItem(key) : '';
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveStoredDrafts() {
    try {
      var key = CONFIG.storageKeys && CONFIG.storageKeys.adminDrafts;
      if (key) {
        window.sessionStorage.setItem(key, JSON.stringify(state.localDrafts));
      }
    } catch (err) {
      // Abaikan jika sessionStorage dibatasi browser.
    }
  }

  function getCombinedEvents() {
    var baseList = (state.payload && Array.isArray(state.payload.events)) ? state.payload.events : [];
    var overrideByBaseId = {};
    var createdDrafts = [];

    state.localDrafts.forEach(function (draft) {
      if (draft.baseEventId) {
        overrideByBaseId[String(draft.baseEventId)] = draft;
      } else {
        createdDrafts.push(draft);
      }
    });

    var merged = baseList.map(function (ev) {
      return overrideByBaseId[String(ev.id)] || ev;
    });

    return merged.concat(createdDrafts).sort(function (a, b) {
      return new Date(a.startIso).getTime() - new Date(b.startIso).getTime();
    });
  }

  function findEventById(eventId) {
    return getCombinedEvents().find(function (ev) {
      return String(ev.id) === String(eventId);
    }) || null;
  }

  function findPresetPoster(posterPath) {
    if (!posterPath || !Array.isArray(CONFIG.presetPosters)) {
      return null;
    }
    for (var i = 0; i < CONFIG.presetPosters.length; i++) {
      if (CONFIG.presetPosters[i].path === posterPath) {
        return CONFIG.presetPosters[i];
      }
    }
    return null;
  }

  function getExplicitEventPoster(ev) {
    if (!ev) {
      return '';
    }
    if (ev.explicitPoster !== undefined) {
      return svc.normalizePosterUrl(ev.explicitPoster);
    }
    var catMeta = svc.getCategoryMeta(ev.category || 'seminar');
    var poster = svc.normalizePosterUrl(ev.poster || '');
    return poster && poster !== catMeta.defaultPoster ? poster : '';
  }

  function renderPosterGalleryGrid(container, activePosterUrl, catMeta) {
    if (!container) {
      return;
    }
    var renderKey = String(catMeta.id) + '|' + String(activePosterUrl || '');
    if (container.getAttribute('data-render-key') === renderKey) {
      return;
    }
    container.setAttribute('data-render-key', renderKey);

    var tiles = [
      '<button type="button" class="poster-thumb-btn' + (!activePosterUrl ? ' is-active' : '') + '" ' +
      'data-poster-path="" aria-pressed="' + (!activePosterUrl ? 'true' : 'false') + '">' +
        '<img class="poster-thumb-btn__img" src="' + svc.escapeHtml(catMeta.defaultPoster) + '" alt="" width="120" height="75" loading="lazy" decoding="async">' +
        '<span class="poster-thumb-btn__label">Ikuti Kategori (' + svc.escapeHtml(catMeta.labelId) + ')</span>' +
      '</button>'
    ];

    (CONFIG.presetPosters || []).forEach(function (preset) {
      var isActive = activePosterUrl === preset.path;
      tiles.push(
        '<button type="button" class="poster-thumb-btn' + (isActive ? ' is-active' : '') + '" ' +
        'data-poster-path="' + svc.escapeHtml(preset.path) + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
          '<img class="poster-thumb-btn__img" src="' + svc.escapeHtml(preset.path) + '" alt="" width="120" height="75" loading="lazy" decoding="async">' +
          '<span class="poster-thumb-btn__label">' + svc.escapeHtml(preset.label) + '</span>' +
        '</button>'
      );
    });

    container.innerHTML = tiles.join('');
  }

  function syncPosterPickerUi(opts) {
    var catMeta = svc.getCategoryMeta(opts.categoryId || 'seminar');
    var rawInput = opts.customInputEl ? opts.customInputEl.value.trim() : '';
    var rawUrl = rawInput || opts.posterUrl || '';
    var normalizedUrl = svc.normalizePosterUrl(rawUrl);
    var effectiveUrl = normalizedUrl || catMeta.defaultPoster;
    var matchedPreset = findPresetPoster(normalizedUrl);
    var isDriveLink = Boolean(rawInput && svc.isGoogleDriveUrl(rawInput));

    if (opts.previewImgEl) {
      if (opts.previewImgEl.getAttribute('src') !== effectiveUrl) {
        opts.previewImgEl.setAttribute('src', effectiveUrl);
      }
      opts.previewImgEl.setAttribute('data-fallback', catMeta.defaultPoster);
      ui.attachImageFallbacks(opts.previewImgEl.parentElement);
    }

    if (opts.previewLabelEl) {
      if (!normalizedUrl) {
        opts.previewLabelEl.textContent = 'Default Kategori: ' + catMeta.labelId;
      } else if (matchedPreset) {
        opts.previewLabelEl.textContent = 'Galeri: ' + matchedPreset.label;
      } else if (isDriveLink || svc.isGoogleDriveUrl(normalizedUrl)) {
        opts.previewLabelEl.textContent = 'Google Drive (konversi otomatis)';
      } else {
        opts.previewLabelEl.textContent = 'URL Poster Custom';
      }
    }

    if (opts.clearBtnEl) {
      opts.clearBtnEl.hidden = !normalizedUrl;
    }

    if (opts.hintEl) {
      if (isDriveLink) {
        opts.hintEl.textContent = 'Link Google Drive terdeteksi dan otomatis dikonversi ke URL gambar langsung. Pastikan akses file diset ke "Anyone with the link".';
      } else {
        opts.hintEl.textContent = opts.defaultHint;
      }
    }

    renderPosterGalleryGrid(opts.galleryEl, normalizedUrl, catMeta);
  }

  function bindPosterPickerEvents(opts) {
    if (opts.galleryEl) {
      opts.galleryEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-poster-path]');
        if (!btn) {
          return;
        }
        var chosen = btn.getAttribute('data-poster-path') || '';
        opts.setPosterUrl(chosen);
        if (opts.customInputEl) {
          opts.customInputEl.value = '';
        }
        opts.onUpdate();
      });
    }

    if (opts.clearBtnEl) {
      opts.clearBtnEl.addEventListener('click', function () {
        opts.setPosterUrl('');
        if (opts.customInputEl) {
          opts.customInputEl.value = '';
        }
        opts.onUpdate();
      });
    }

    if (opts.customInputEl) {
      opts.customInputEl.addEventListener('input', function () {
        opts.setPosterUrl(svc.normalizePosterUrl(opts.customInputEl.value));
        opts.onUpdate();
      });
      opts.customInputEl.addEventListener('change', function () {
        var raw = opts.customInputEl.value.trim();
        var normalized = svc.normalizePosterUrl(raw);
        if (normalized && svc.isGoogleDriveUrl(raw) && normalized !== raw) {
          opts.customInputEl.value = normalized;
        }
        opts.setPosterUrl(normalized);
        opts.onUpdate();
      });
    }
  }

  function populateSelectOptions() {
    if (el.category) {
      el.category.innerHTML = CONFIG.categories
        .map(function (cat) {
          return '<option value="' + svc.escapeHtml(cat.id) + '">' + svc.escapeHtml(cat.labelId) + '</option>';
        })
        .join('');
    }
  }

  function setDefaultDateInputs(forceReset) {
    var base = new Date();
    base.setDate(base.getDate() + 3);
    var dateStr = formatDateInput(base);
    if (el.startDate && (forceReset || !el.startDate.value)) el.startDate.value = dateStr;
    if (el.endDate && (forceReset || !el.endDate.value)) el.endDate.value = dateStr;
    if (el.startTime && (forceReset || !el.startTime.value)) el.startTime.value = '09:00';
    if (el.endTime && (forceReset || !el.endTime.value)) el.endTime.value = '12:00';
  }

  function buildFormattedDetails(values) {
    var lines = [];
    if (values.description) {
      lines.push(values.description.trim());
      lines.push('');
    }
    lines.push('Kategori: ' + values.categoryLabel);
    if (values.statusLabel) {
      lines.push('Status: ' + values.statusLabel);
    }
    if (values.fee) {
      lines.push('Biaya: ' + values.fee.trim());
    }
    if (values.contact) {
      lines.push('Kontak: ' + values.contact.trim());
    }
    if (values.daftarUrl) {
      lines.push('Daftar: ' + values.daftarUrl.trim());
    }
    if (values.posterUrl) {
      lines.push('Poster: ' + values.posterUrl.trim());
    }
    if (values.rundownRaw) {
      var rundownRows = values.rundownRaw
        .split(/\r?\n/)
        .map(function (r) { return r.trim(); })
        .filter(Boolean);
      if (rundownRows.length > 0) {
        lines.push('Rundown:');
        rundownRows.forEach(function (row) {
          lines.push('- ' + row);
        });
      }
    }
    return lines.join('\n').trim();
  }

  // Bangun struktur data event terpadu untuk simpan ke Google Calendar, URL template, pratinjau, maupun draft lokal.
  function buildEventPayloadData(fields) {
    var catMeta = svc.getCategoryMeta(fields.categoryId || 'seminar');
    var statusValue = fields.statusValue || 'open';
    var statusLabelMap = {
      open: 'Pendaftaran Dibuka',
      soon: 'Segera Hadir',
      closed: 'Selesai'
    };
    var isAllDay = Boolean(fields.isAllDay);
    var sDate = fields.startDate || formatDateInput(new Date());
    var eDate = fields.endDate || sDate;
    var sTime = fields.startTime || '09:00';
    var eTime = fields.endTime || '10:00';
    var startIso = isAllDay ? sDate + 'T00:00:00+07:00' : sDate + 'T' + sTime + ':00+07:00';
    var endIso = isAllDay ? eDate + 'T00:00:00+07:00' : eDate + 'T' + eTime + ':00+07:00';
    var chosenPoster = fields.posterUrl || catMeta.defaultPoster;

    var values = {
      title: (fields.title || '').trim() || 'Judul Event Kampus',
      categoryId: catMeta.id,
      categoryLabel: catMeta.labelId,
      statusValue: statusValue,
      statusLabel: statusLabelMap[statusValue] || 'Pendaftaran Dibuka',
      isAllDay: isAllDay,
      startDate: sDate,
      endDate: eDate,
      startTime: sTime,
      endTime: eTime,
      startIso: startIso,
      endIso: endIso,
      location: (fields.location || '').trim(),
      description: (fields.description || '').trim(),
      fee: (fields.fee || '').trim(),
      contact: (fields.contact || '').trim(),
      daftarUrl: (fields.daftarUrl || '').trim(),
      posterUrl: fields.posterUrl || '',
      rundownRaw: (fields.rundownRaw || '').trim()
    };

    values.formattedDetails = buildFormattedDetails(values);
    values.previewEvent = {
      id: fields.eventId || 'preview-draft',
      title: values.title,
      titleEn: values.title,
      category: values.categoryId,
      status: values.statusValue,
      startIso: startIso,
      endIso: endIso,
      isAllDay: isAllDay,
      dateKey: sDate,
      location: values.location,
      description: values.description || 'Deskripsi event akan tampil di halaman detail.',
      rawDescription: values.description,
      poster: chosenPoster,
      explicitPoster: values.posterUrl,
      posterAlt: 'Pratinjau poster ' + values.title,
      fee: values.fee || CONFIG.defaultFee.id,
      explicitFee: values.fee,
      contact: values.contact || CONFIG.defaultContactEmail,
      explicitContact: values.contact,
      daftarUrl: values.daftarUrl,
      rundown: parseRundownLines(values.rundownRaw),
      rawTemplateDetails: values.formattedDetails
    };
    return values;
  }

  function parseRundownLines(rundownRaw) {
    if (!rundownRaw) {
      return [];
    }
    return rundownRaw
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line, idx) {
        var parts = line.split('|');
        if (parts.length >= 2) {
          return { time: parts[0].trim(), activity: parts.slice(1).join('|').trim() };
        }
        return { time: 'Sesi ' + (idx + 1), activity: line };
      });
  }

  // Gunakan nilai eksplisit dari tag deskripsi jika ada agar default tampilan tidak ikut tertulis balik ke Google Calendar.
  function getExplicitField(ev, explicitKey, fallbackKey) {
    if (!ev) {
      return '';
    }
    if (ev[explicitKey] !== undefined) {
      return ev[explicitKey] || '';
    }
    return ev[fallbackKey] || '';
  }

  function buildEventPayloadFromExisting(ev, overrides) {
    var ov = overrides || {};
    var startDt = new Date(ev.startIso);
    var endDt = new Date(ev.endIso || ev.startIso);
    var origEndDate = formatDateInput(endDt);
    if (ev.isAllDay && !Number.isNaN(endDt.getTime())) {
      var inclusive = new Date(endDt.getTime());
      inclusive.setDate(inclusive.getDate() - 1);
      if (inclusive >= startDt) {
        origEndDate = formatDateInput(inclusive);
      }
    }

    var fallbackPoster = ev.poster && ev.poster.indexOf('assets/') !== 0 ? ev.poster : '';
    return buildEventPayloadData({
      eventId: ev.id,
      title: ov.title !== undefined ? ov.title : ev.title,
      categoryId: ov.categoryId !== undefined ? ov.categoryId : ev.category,
      statusValue: ov.statusValue !== undefined ? ov.statusValue : ev.status,
      isAllDay: ov.isAllDay !== undefined ? ov.isAllDay : ev.isAllDay,
      startDate: ov.startDate !== undefined ? ov.startDate : (ev.dateKey || formatDateInput(startDt)),
      endDate: ov.endDate !== undefined ? ov.endDate : origEndDate,
      startTime: ov.startTime !== undefined ? ov.startTime : formatTimeInput(startDt),
      endTime: ov.endTime !== undefined ? ov.endTime : formatTimeInput(endDt),
      location: ov.location !== undefined ? ov.location : ev.location,
      description: ov.description !== undefined ? ov.description : getExplicitField(ev, 'rawDescription', 'description'),
      fee: ov.fee !== undefined ? ov.fee : getExplicitField(ev, 'explicitFee', 'fee'),
      contact: ov.contact !== undefined ? ov.contact : getExplicitField(ev, 'explicitContact', 'contact'),
      daftarUrl: ov.daftarUrl !== undefined ? ov.daftarUrl : ev.daftarUrl,
      posterUrl: ov.posterUrl !== undefined ? ov.posterUrl : (ev.explicitPoster !== undefined ? ev.explicitPoster : fallbackPoster),
      rundownRaw: ov.rundownRaw !== undefined
        ? ov.rundownRaw
        : (Array.isArray(ev.rundown) ? ev.rundown.map(function (r) { return r.time + ' | ' + r.activity; }).join('\n') : '')
    });
  }

  function readFormState() {
    var customPoster = el.posterCustom ? svc.normalizePosterUrl(el.posterCustom.value.trim()) : '';
    var chosenPoster = customPoster || state.posterUrl || '';
    return buildEventPayloadData({
      eventId: state.editingEventId,
      title: el.title ? el.title.value : '',
      categoryId: el.category ? el.category.value : 'seminar',
      statusValue: el.status ? el.status.value : 'open',
      isAllDay: Boolean(el.allDay && el.allDay.checked),
      startDate: el.startDate ? el.startDate.value : '',
      endDate: el.endDate ? el.endDate.value : '',
      startTime: el.startTime ? el.startTime.value : '09:00',
      endTime: el.endTime ? el.endTime.value : '12:00',
      location: el.location ? el.location.value : '',
      description: el.description ? el.description.value : '',
      fee: el.fee ? el.fee.value : '',
      contact: el.contact ? el.contact.value : '',
      daftarUrl: el.daftarUrl ? el.daftarUrl.value : '',
      posterUrl: chosenPoster,
      rundownRaw: el.rundown ? el.rundown.value : ''
    });
  }

  function renderOverlapWarningInto(warnEl, data, excludeId) {
    if (!warnEl) {
      return;
    }
    var conflicts = svc.findOverlappingEvents(
      getCombinedEvents(),
      data.startIso,
      data.endIso,
      data.isAllDay,
      excludeId
    );
    if (conflicts.length === 0) {
      warnEl.className = 'admin-overlap-warn';
      warnEl.innerHTML = '';
      return;
    }

    var summary = conflicts
      .map(function (ev) {
        return svc.escapeHtml(ev.title) + ' (' + svc.escapeHtml(svc.formatDisplayDate(ev, 'id')) + ')';
      })
      .join(', ');

    warnEl.className = 'admin-overlap-warn is-visible';
    warnEl.innerHTML =
      '<strong>Peringatan Overlap (' + conflicts.length + ' jadwal bentrok):</strong> ' + summary;
  }

  function syncFormModeControls() {
    var auth = svc.getAdminAuthStatus();
    var isEditing = Boolean(state.editingEventId);

    if (el.formHeading) {
      el.formHeading.textContent = isEditing ? 'Edit Jadwal Terpilih' : 'Buat & Kirim Jadwal ke Google Calendar';
    }
    if (el.editBanner) {
      if (isEditing) {
        el.editBanner.className = 'admin-edit-banner is-visible';
        el.editBanner.innerHTML =
          '<span>Sedang mengedit jadwal ID: <code>' + svc.escapeHtml(state.editingEventId) + '</code></span>' +
          '<button type="button" class="btn btn-outline btn-compact" id="adm-cancel-edit-btn">Batal Edit</button>';
        var cancelBtn = document.getElementById('adm-cancel-edit-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', cancelEditMode);
        }
      } else {
        el.editBanner.className = 'admin-edit-banner';
        el.editBanner.innerHTML = '';
      }
    }

    if (el.submitBtn) {
      if (state.isSaving) {
        el.submitBtn.textContent = 'Menyimpan ke Google Calendar...';
        el.submitBtn.disabled = true;
      } else if (auth.signedIn) {
        el.submitBtn.textContent = isEditing ? 'Simpan Perubahan ke Google Calendar' : 'Simpan Langsung ke Google Calendar';
        el.submitBtn.disabled = false;
      } else {
        el.submitBtn.textContent = isEditing ? 'Buka Salinan Template Google Calendar' : 'Buka & Simpan di Google Calendar';
        el.submitBtn.disabled = false;
      }
    }

    if (el.deleteBtn) {
      el.deleteBtn.hidden = !isEditing;
      var target = isEditing ? findEventById(state.editingEventId) : null;
      var canDelete = Boolean(isEditing && ((target && target.isLocalDraft) || auth.signedIn));
      el.deleteBtn.disabled = state.isSaving || !canDelete;
      el.deleteBtn.title = !canDelete && isEditing
        ? 'Login admin Google OAuth terlebih dahulu untuk menghapus jadwal Google Calendar langsung.'
        : '';
    }
  }

  function syncFullPosterPicker() {
    syncPosterPickerUi({
      categoryId: el.category ? el.category.value : 'seminar',
      posterUrl: state.posterUrl,
      customInputEl: el.posterCustom,
      previewImgEl: el.posterPreviewImg,
      previewLabelEl: el.posterPreviewLabel,
      clearBtnEl: el.posterClearBtn,
      hintEl: el.posterHint,
      galleryEl: el.posterGallery,
      defaultHint: 'Kosongkan URL dan pilih "Ikuti Kategori" untuk memakai foto bawaan kategori. Jika memakai link Google Drive, pastikan akses file diset ke "Anyone with the link".'
    });
  }

  function updatePreview() {
    syncFullPosterPicker();
    var data = readFormState();
    if (el.startTime && el.endTime) {
      el.startTime.disabled = data.isAllDay;
      el.endTime.disabled = data.isAllDay;
    }
    if (el.detailsOutput) {
      el.detailsOutput.value = data.formattedDetails;
    }
    if (el.cardPreview) {
      el.cardPreview.innerHTML = ui.renderEventCard(data.previewEvent, {
        lang: ui.getCurrentLang(),
        previewOnly: true
      });
      ui.attachImageFallbacks(el.cardPreview);
    }
    renderOverlapWarningInto(el.overlapWarn, data, state.editingEventId);
    syncFormModeControls();
  }

  function showActionFeedback(message, isError, fallbackHref) {
    if (!el.feedback) {
      return;
    }
    el.feedback.className = 'admin-feedback ' + (isError ? 'admin-feedback--error' : 'admin-feedback--ok');
    if (fallbackHref) {
      el.feedback.innerHTML =
        svc.escapeHtml(message) +
        ' <a class="inline-link" href="' + svc.escapeHtml(fallbackHref) + '" target="_blank" rel="noopener">Buka tautan Google Calendar</a>';
    } else {
      el.feedback.textContent = message;
    }
  }

  function showToast(message, options) {
    if (!el.toast) {
      return;
    }
    var opts = options || {};
    el.toast.hidden = false;
    el.toast.className = 'admin-toast' + (opts.isError ? ' is-error' : '');

    var actionsHtml = '';
    if (opts.undoAvailable && state.lastUndo) {
      actionsHtml += '<button type="button" class="btn btn-outline btn-compact" id="admin-toast-undo">Urungkan</button>';
    }
    if (opts.gcalHref) {
      actionsHtml += '<a class="btn btn-outline btn-compact" href="' + svc.escapeHtml(opts.gcalHref) + '" target="_blank" rel="noopener">Buka di Google Calendar</a>';
    }
    actionsHtml += '<button type="button" class="tl-icon-btn admin-toast__close" id="admin-toast-close" aria-label="Tutup notifikasi">&times;</button>';

    el.toast.innerHTML =
      '<span class="admin-toast__msg">' + svc.escapeHtml(message) + '</span>' +
      '<div class="admin-toast__actions">' + actionsHtml + '</div>';

    var undoBtn = document.getElementById('admin-toast-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', handleUndoLastAction);
    }
    var closeBtn = document.getElementById('admin-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        el.toast.hidden = true;
      });
    }
  }

  function validateEventTiming(title, data) {
    if (!String(title || '').trim()) {
      return 'Isi Judul Event terlebih dahulu sebelum menyimpan.';
    }
    if (!data.startDate || !data.endDate) {
      return 'Tanggal mulai dan tanggal selesai wajib diisi.';
    }
    var startMs = new Date(data.startIso).getTime();
    var endMs = new Date(data.endIso).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
      return 'Waktu selesai tidak boleh lebih awal dari waktu mulai.';
    }
    if (!data.isAllDay && data.startDate === data.endDate && endMs === startMs) {
      return 'Jam selesai harus lebih lambat dari jam mulai.';
    }
    return '';
  }

  function applyEventToFullForm(ev) {
    if (!ev) {
      return;
    }
    state.editingEventId = ev.id;
    state.selectedDateKey = ev.dateKey || state.selectedDateKey;

    if (el.title) el.title.value = ev.title || '';
    if (el.category) el.category.value = ev.category || 'umum';
    if (el.status) el.status.value = ev.status || 'open';
    if (el.allDay) el.allDay.checked = Boolean(ev.isAllDay);
    if (el.location) el.location.value = ev.location || '';
    if (el.description) el.description.value = getExplicitField(ev, 'rawDescription', 'description');
    if (el.fee) el.fee.value = getExplicitField(ev, 'explicitFee', 'fee');
    if (el.contact) el.contact.value = getExplicitField(ev, 'explicitContact', 'contact');
    if (el.daftarUrl) el.daftarUrl.value = ev.daftarUrl || '';

    var startDt = new Date(ev.startIso);
    var endDt = new Date(ev.endIso || ev.startIso);
    if (!Number.isNaN(startDt.getTime())) {
      el.startDate.value = formatDateInput(startDt);
      el.startTime.value = formatTimeInput(startDt);
    }
    if (!Number.isNaN(endDt.getTime())) {
      if (ev.isAllDay) {
        var inclusiveEnd = new Date(endDt.getTime());
        inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
        el.endDate.value = inclusiveEnd >= startDt ? formatDateInput(inclusiveEnd) : formatDateInput(startDt);
      } else {
        el.endDate.value = formatDateInput(endDt);
        el.endTime.value = formatTimeInput(endDt);
      }
    }

    var explicitPoster = getExplicitEventPoster(ev);
    state.posterUrl = explicitPoster;
    var matchedPreset = findPresetPoster(explicitPoster);
    if (el.posterCustom) {
      el.posterCustom.value = explicitPoster && !matchedPreset ? explicitPoster : '';
    }

    if (el.rundown) {
      el.rundown.value = Array.isArray(ev.rundown)
        ? ev.rundown.map(function (r) { return r.time + ' | ' + r.activity; }).join('\n')
        : '';
    }
    updatePreview();
  }

  function loadEventIntoFullForm(eventId, options) {
    var opts = options || {};
    var ev = findEventById(eventId);
    if (!ev) {
      return;
    }
    applyEventToFullForm(ev);
    renderAdminTimeline();
    showActionFeedback(
      opts.focusPoster
        ? 'Jadwal "' + ev.title + '" dimuat. Pilih foto galeri atau tempel link thumbnail di bawah.'
        : 'Jadwal "' + ev.title + '" dimuat ke formulir lengkap.',
      false
    );
    if (opts.focusPoster && el.posterSection) {
      el.posterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.posterCustom) {
        el.posterCustom.focus();
      }
      return;
    }
    if (el.title) {
      el.title.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.title.focus();
    }
  }

  function cancelEditMode() {
    state.editingEventId = '';
    state.posterUrl = '';
    el.form.reset();
    setDefaultDateInputs(true);
    updatePreview();
    showActionFeedback('Mode edit dibatalkan. Formulir siap untuk membuat jadwal baru.', false);
  }

  function buildGoogleTemplateHref(data) {
    var preview = Object.assign({}, data.previewEvent);
    if (preview.isAllDay) {
      var exclusiveEnd = new Date(data.endDate + 'T00:00:00');
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      preview.endIso = formatDateInput(exclusiveEnd) + 'T00:00:00+07:00';
    }
    return ics.buildGoogleCalendarAddUrl(preview);
  }

  function upsertLocalDraft(data, existingEvent, customDraftId, options) {
    var opts = options || {};
    var prevSnapshot = state.localDrafts.slice();
    var isExistingBase = existingEvent && !existingEvent.isLocalDraft;
    var draftId = existingEvent ? existingEvent.id : (customDraftId || ('draft-' + Date.now()));
    var draftObj = Object.assign({}, existingEvent || {}, data.previewEvent, {
      id: draftId,
      baseEventId: existingEvent ? (existingEvent.baseEventId || (isExistingBase ? existingEvent.id : '')) : '',
      isLocalDraft: true,
      dateKey: data.startDate,
      displayDate: svc.formatDisplayDate(data.previewEvent, 'id')
    });

    if (data.isAllDay) {
      var exc = new Date(data.endDate + 'T00:00:00');
      exc.setDate(exc.getDate() + 1);
      draftObj.endIso = formatDateInput(exc) + 'T00:00:00+07:00';
    }

    var idx = state.localDrafts.findIndex(function (d) {
      return String(d.id) === String(draftId);
    });
    if (idx >= 0) {
      state.localDrafts[idx] = draftObj;
    } else {
      state.localDrafts.push(draftObj);
    }
    if (!opts.deferSave) {
      saveStoredDrafts();
    }

    if (!opts.skipUndo) {
      state.lastUndo = {
        type: 'draft',
        previousDrafts: prevSnapshot
      };
    }
    return draftObj;
  }

  // Tambahkan hingga 7 slot template ke draft lokal secara idempoten agar siap diedit dan dikirim ke Google Calendar.
  function seedSevenTemplateDrafts() {
    var prevSnapshot = state.localDrafts.slice();
    var addedCount = 0;

    TEMPLATE_EVENT_PRESETS.forEach(function (preset) {
      var draftId = 'draft-template-' + preset.slot;
      var exists = state.localDrafts.some(function (d) {
        return String(d.id) === draftId;
      });
      if (exists) {
        return;
      }

      var slotDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + preset.dayOffset);
      var dateStr = formatDateInput(slotDate);
      var data = buildEventPayloadData({
        eventId: draftId,
        title: preset.title,
        categoryId: preset.categoryId,
        statusValue: preset.statusValue,
        isAllDay: false,
        startDate: dateStr,
        endDate: dateStr,
        startTime: preset.startTime,
        endTime: preset.endTime,
        location: '[Isi Nama Ruangan / Gedung]',
        description: preset.description,
        fee: '[Gratis / Rp ...]',
        contact: '[Nama CP / 08xxx / email@domain.com]',
        daftarUrl: '',
        posterUrl: '',
        rundownRaw: preset.rundownRaw
      });
      upsertLocalDraft(data, null, draftId, { deferSave: true, skipUndo: true });
      addedCount += 1;
    });

    if (addedCount === 0) {
      showToast('Ke-7 template draft sudah ada di sesi ini.');
      return;
    }

    saveStoredDrafts();
    state.lastUndo = {
      type: 'draft',
      previousDrafts: prevSnapshot
    };
    renderConnectedList();
    renderAdminTimeline();
    showToast(
      addedCount + ' template draft dimuat. Klik Edit pada tiap baris untuk mengisi detail lalu kirim ke Google Calendar.',
      { undoAvailable: true }
    );
  }

  function renderQuickCategoryChips() {
    if (!el.qmCatChips) {
      return;
    }
    el.qmCatChips.innerHTML = CONFIG.categories
      .map(function (cat) {
        var active = state.qmCategory === cat.id;
        return (
          '<button type="button" class="qm-cat-chip' + (active ? ' is-active' : '') + '" ' +
          'data-qm-cat="' + svc.escapeHtml(cat.id) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
            '<span class="tl-legend-swatch tl-swatch--' + svc.escapeHtml(cat.id) + '" aria-hidden="true"></span>' +
            '<span>' + svc.escapeHtml(cat.labelId) + '</span>' +
          '</button>'
        );
      })
      .join('');
  }

  function syncQuickPosterPicker() {
    syncPosterPickerUi({
      categoryId: state.qmCategory,
      posterUrl: state.qmPosterUrl,
      customInputEl: el.qmPosterCustom,
      previewImgEl: el.qmPosterPreviewImg,
      previewLabelEl: el.qmPosterPreviewLabel,
      clearBtnEl: el.qmPosterClearBtn,
      hintEl: el.qmPosterHint,
      galleryEl: el.qmPosterGallery,
      defaultHint: 'Untuk link Google Drive, pastikan akses diset ke "Anyone with the link".'
    });
  }

  function setQuickPosterDrawerOpen(isOpen) {
    if (el.qmPosterDrawer) {
      el.qmPosterDrawer.hidden = !isOpen;
    }
    if (el.qmPosterToggleBtn) {
      el.qmPosterToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      el.qmPosterToggleBtn.textContent = isOpen ? 'Tutup Galeri' : 'Ganti Foto';
    }
  }

  function readQuickModalPayload() {
    var base = state.qmBaseEvent;
    var customPoster = el.qmPosterCustom ? svc.normalizePosterUrl(el.qmPosterCustom.value.trim()) : '';
    var chosenPoster = customPoster || state.qmPosterUrl || '';
    return buildEventPayloadData({
      eventId: state.qmEditingEventId,
      title: el.qmTitle ? el.qmTitle.value : '',
      categoryId: state.qmCategory,
      statusValue: base ? base.status : 'open',
      isAllDay: Boolean(el.qmAllDay && el.qmAllDay.checked),
      startDate: el.qmStartDate ? el.qmStartDate.value : state.selectedDateKey,
      endDate: el.qmEndDate ? el.qmEndDate.value : state.selectedDateKey,
      startTime: el.qmStartTime ? el.qmStartTime.value : '09:00',
      endTime: el.qmEndTime ? el.qmEndTime.value : '10:00',
      location: el.qmLocation ? el.qmLocation.value : '',
      description: el.qmDescription ? el.qmDescription.value : '',
      fee: getExplicitField(base, 'explicitFee', 'fee'),
      contact: getExplicitField(base, 'explicitContact', 'contact'),
      daftarUrl: base ? base.daftarUrl : '',
      posterUrl: chosenPoster,
      rundownRaw: base && Array.isArray(base.rundown)
        ? base.rundown.map(function (r) { return r.time + ' | ' + r.activity; }).join('\n')
        : ''
    });
  }

  function syncQuickModalState() {
    if (!el.qmForm) {
      return;
    }
    var isAllDay = Boolean(el.qmAllDay && el.qmAllDay.checked);
    if (el.qmStartTime && el.qmEndTime) {
      el.qmStartTime.disabled = isAllDay;
      el.qmEndTime.disabled = isAllDay;
    }
    if (el.qmDurationBar) {
      el.qmDurationBar.hidden = isAllDay;
    }

    syncQuickPosterPicker();
    var data = readQuickModalPayload();
    renderOverlapWarningInto(el.qmOverlapWarn, data, state.qmEditingEventId);

    if (el.qmGcalLink) {
      el.qmGcalLink.href = buildGoogleTemplateHref(data);
    }

    var auth = svc.getAdminAuthStatus();
    if (el.qmSyncNote) {
      el.qmSyncNote.textContent = auth.signedIn
        ? 'Login OAuth Google aktif: perubahan langsung tersimpan ke Google Calendar.'
        : 'Mode Pratinjau Lokal (OAuth belum login): tombol Simpan mencatat draft di kalender ini; klik "Buka di Google Calendar" untuk menerbitkan.';
    }
    if (el.qmSaveBtn) {
      if (auth.signedIn) {
        el.qmSaveBtn.textContent = state.qmBaseEvent && state.qmBaseEvent.isLocalDraft
          ? 'Kirim Draft ke Google Calendar'
          : (state.qmEditingEventId ? 'Simpan Perubahan' : 'Simpan ke Google Calendar');
      } else {
        el.qmSaveBtn.textContent = state.qmEditingEventId ? 'Simpan Perubahan Draft' : 'Simpan Draft di Kalender';
      }
    }
  }

  function openQuickModalForCreate(slot) {
    if (!el.qmDialog) {
      return;
    }
    var dateKey = (slot && slot.dateKey) || state.selectedDateKey;
    var startMin = slot && typeof slot.startMin === 'number' ? slot.startMin : 9 * 60;
    var endMin = slot && typeof slot.endMin === 'number' ? slot.endMin : 10 * 60;
    var isAllDay = Boolean(slot && slot.isAllDay);

    state.selectedDateKey = dateKey;
    state.qmEditingEventId = '';
    state.qmBaseEvent = null;
    state.qmCategory = 'seminar';
    state.qmPosterUrl = '';
    if (el.qmPosterCustom) el.qmPosterCustom.value = '';
    setQuickPosterDrawerOpen(false);
    state.activeSelection = isAllDay ? null : { dateKey: dateKey, startMin: startMin, endMin: endMin };

    if (el.qmHeading) el.qmHeading.textContent = 'Buat Event Baru';
    if (el.qmDraftBadge) el.qmDraftBadge.hidden = true;
    if (el.qmDeleteBtn) el.qmDeleteBtn.hidden = true;
    if (el.qmError) {
      el.qmError.className = 'admin-feedback';
      el.qmError.textContent = '';
    }

    if (el.qmTitle) el.qmTitle.value = '';
    if (el.qmAllDay) el.qmAllDay.checked = isAllDay;
    if (el.qmStartDate) el.qmStartDate.value = dateKey;
    if (el.qmEndDate) el.qmEndDate.value = dateKey;
    if (el.qmStartTime) el.qmStartTime.value = tl.formatMinutesColon(startMin);
    if (el.qmEndTime) el.qmEndTime.value = tl.formatMinutesColon(endMin);
    if (el.qmLocation) el.qmLocation.value = '';
    if (el.qmDescription) el.qmDescription.value = '';

    renderQuickCategoryChips();
    syncQuickModalState();
    renderAdminTimeline();

    if (!el.qmDialog.open && typeof el.qmDialog.showModal === 'function') {
      el.qmDialog.showModal();
    }
    if (el.qmTitle) {
      el.qmTitle.focus();
    }
  }

  function openQuickModalForEdit(eventId) {
    var ev = findEventById(eventId);
    if (!ev || !el.qmDialog) {
      return;
    }
    state.qmEditingEventId = ev.id;
    state.qmBaseEvent = ev;
    state.qmCategory = ev.category || 'seminar';
    var explicitQmPoster = getExplicitEventPoster(ev);
    state.qmPosterUrl = explicitQmPoster;
    var matchedQmPreset = findPresetPoster(explicitQmPoster);
    if (el.qmPosterCustom) {
      el.qmPosterCustom.value = explicitQmPoster && !matchedQmPreset ? explicitQmPoster : '';
    }
    setQuickPosterDrawerOpen(false);
    state.activeSelection = null;

    var startDt = new Date(ev.startIso);
    var endDt = new Date(ev.endIso || ev.startIso);
    var endDateVal = formatDateInput(endDt);
    if (ev.isAllDay && !Number.isNaN(endDt.getTime())) {
      var inclusive = new Date(endDt.getTime());
      inclusive.setDate(inclusive.getDate() - 1);
      if (inclusive >= startDt) {
        endDateVal = formatDateInput(inclusive);
      }
    }

    if (el.qmHeading) el.qmHeading.textContent = 'Edit Jadwal';
    if (el.qmDraftBadge) el.qmDraftBadge.hidden = !ev.isLocalDraft;
    if (el.qmDeleteBtn) {
      var auth = svc.getAdminAuthStatus();
      el.qmDeleteBtn.hidden = !(ev.isLocalDraft || auth.signedIn);
    }
    if (el.qmError) {
      el.qmError.className = 'admin-feedback';
      el.qmError.textContent = '';
    }

    if (el.qmTitle) el.qmTitle.value = ev.title || '';
    if (el.qmAllDay) el.qmAllDay.checked = Boolean(ev.isAllDay);
    if (el.qmStartDate) el.qmStartDate.value = formatDateInput(startDt);
    if (el.qmEndDate) el.qmEndDate.value = endDateVal;
    if (el.qmStartTime) el.qmStartTime.value = formatTimeInput(startDt);
    if (el.qmEndTime) el.qmEndTime.value = formatTimeInput(endDt);
    if (el.qmLocation) el.qmLocation.value = ev.location || '';
    if (el.qmDescription) el.qmDescription.value = getExplicitField(ev, 'rawDescription', 'description');

    renderQuickCategoryChips();
    syncQuickModalState();

    if (!el.qmDialog.open && typeof el.qmDialog.showModal === 'function') {
      el.qmDialog.showModal();
    }
    if (el.qmTitle) {
      el.qmTitle.focus();
    }
  }

  function closeQuickModal() {
    state.activeSelection = null;
    if (el.qmDialog && el.qmDialog.open) {
      el.qmDialog.close();
    }
    renderAdminTimeline();
  }

  function adjustQuickModalDuration(deltaMinutes) {
    if (!el.qmStartDate || !el.qmStartTime || !el.qmEndDate || !el.qmEndTime) {
      return;
    }
    var startMs = new Date(el.qmStartDate.value + 'T' + (el.qmStartTime.value || '09:00') + ':00').getTime();
    var endMs = new Date(el.qmEndDate.value + 'T' + (el.qmEndTime.value || '10:00') + ':00').getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return;
    }
    var nextEndMs = Math.max(startMs + 15 * 60000, endMs + deltaMinutes * 60000);
    var nextEndDt = new Date(nextEndMs);
    el.qmEndDate.value = formatDateInput(nextEndDt);
    el.qmEndTime.value = formatTimeInput(nextEndDt);
    syncQuickModalState();
  }

  function redirectToAuthGateIfSignedOut(err, beforeGateFn) {
    if (svc.getAdminAuthStatus().signedIn) {
      return false;
    }
    if (typeof beforeGateFn === 'function') {
      beforeGateFn();
    }
    applyAuthGate(err && err.message ? err.message : '');
    return true;
  }

  async function handleQuickModalSubmit(e) {
    e.preventDefault();
    var data = readQuickModalPayload();
    var rawTitle = el.qmTitle ? el.qmTitle.value : '';
    var errMsg = validateEventTiming(rawTitle, data);
    if (errMsg) {
      if (el.qmError) {
        el.qmError.className = 'admin-feedback admin-feedback--error';
        el.qmError.textContent = errMsg;
      }
      return;
    }

    var auth = svc.getAdminAuthStatus();
    if (auth.signedIn) {
      state.isSaving = true;
      if (el.qmSaveBtn) el.qmSaveBtn.disabled = true;
      try {
        var liveTargetId = state.qmBaseEvent
          ? (state.qmBaseEvent.baseEventId || (!state.qmBaseEvent.isLocalDraft ? state.qmEditingEventId : ''))
          : '';
        if (liveTargetId) {
          await svc.updateGoogleEvent(liveTargetId, data);
          if (state.qmBaseEvent && state.qmBaseEvent.isLocalDraft) {
            removeDraftById(state.qmEditingEventId);
          }
          showToast('Perubahan "' + data.title + '" disimpan ke Google Calendar.');
        } else {
          await svc.createGoogleEvent(data);
          if (state.qmEditingEventId) {
            removeDraftById(state.qmEditingEventId);
          }
          showToast('Jadwal baru "' + data.title + '" disimpan ke Google Calendar.');
        }
        state.selectedDateKey = data.startDate;
        closeQuickModal();
        await loadConnectedSchedule(true);
      } catch (err) {
        if (redirectToAuthGateIfSignedOut(err, closeQuickModal)) {
          return;
        }
        renderStatusSummary();
        if (el.qmError) {
          el.qmError.className = 'admin-feedback admin-feedback--error';
          el.qmError.textContent = 'Gagal menyimpan: ' + (err && err.message ? err.message : 'Error');
        }
      } finally {
        state.isSaving = false;
        if (el.qmSaveBtn) el.qmSaveBtn.disabled = false;
      }
      return;
    }

    var savedDraft = upsertLocalDraft(data, state.qmBaseEvent);
    applyEventToFullForm(savedDraft);
    state.selectedDateKey = data.startDate;
    closeQuickModal();
    renderConnectedList();
    renderAdminTimeline();
    showToast('Draft lokal "' + data.title + '" tersimpan di kalender.', {
      undoAvailable: true,
      gcalHref: buildGoogleTemplateHref(data)
    });
  }

  function removeDraftById(draftId) {
    var prev = state.localDrafts.slice();
    state.localDrafts = state.localDrafts.filter(function (d) {
      return String(d.id) !== String(draftId);
    });
    saveStoredDrafts();
    return prev;
  }

  async function handleDirectTimeChange(info, actionLabel) {
    var ev = findEventById(info.eventId);
    if (!ev) {
      return;
    }
    var newStartTime = tl.formatMinutesColon(info.startMin);
    var newEndTime = tl.formatMinutesColon(info.endMin);
    var data = buildEventPayloadFromExisting(ev, {
      startDate: info.dateKey,
      endDate: info.dateKey,
      startTime: newStartTime,
      endTime: newEndTime,
      isAllDay: false
    });

    var prevData = buildEventPayloadFromExisting(ev);
    var auth = svc.getAdminAuthStatus();
    var gcalHref = buildGoogleTemplateHref(data);
    var msg = actionLabel + ': "' + ev.title + '" -> ' + info.dateKey + ' (' + newStartTime + ' - ' + newEndTime + ').';

    if (auth.signedIn && !ev.isLocalDraft) {
      state.lastUndo = { type: 'google-update', eventId: ev.id, previousData: prevData };
      try {
        await svc.updateGoogleEvent(ev.id, data);
        await loadConnectedSchedule(true);
        showToast(msg, { undoAvailable: true });
      } catch (err) {
        if (redirectToAuthGateIfSignedOut(err)) {
          return;
        }
        renderStatusSummary();
        showToast('Gagal memperbarui Google Calendar: ' + (err && err.message ? err.message : 'Error'), { isError: true });
      }
      return;
    }

    upsertLocalDraft(data, ev);
    if (String(state.editingEventId) === String(ev.id)) {
      applyEventToFullForm(findEventById(ev.id));
    }
    renderConnectedList();
    renderAdminTimeline();
    showToast(msg + ' (Draft Lokal)', {
      undoAvailable: true,
      gcalHref: gcalHref
    });
  }

  async function handleUndoLastAction() {
    var undo = state.lastUndo;
    if (!undo) {
      return;
    }
    state.lastUndo = null;
    if (undo.type === 'draft') {
      state.localDrafts = undo.previousDrafts || [];
      saveStoredDrafts();
      renderConnectedList();
      renderAdminTimeline();
      showToast('Perubahan draft dibatalkan.');
      return;
    }
    if (undo.type === 'google-update') {
      try {
        await svc.updateGoogleEvent(undo.eventId, undo.previousData);
        await loadConnectedSchedule(true);
        showToast('Perubahan jadwal dikembalikan ke waktu semula.');
      } catch (err) {
        showToast('Gagal membatalkan perubahan: ' + (err && err.message ? err.message : 'Error'), { isError: true });
      }
    }
  }

  function renderAdminTimeline() {
    if (!el.timelineMount || !state.payload || !tl) {
      return;
    }
    tl.setHandlers(el.timelineMount, {
      onSelectDate: function (dateKey) {
        state.selectedDateKey = dateKey;
        var dt = tl.parseYmd(dateKey);
        state.miniYear = dt.getFullYear();
        state.miniMonth = dt.getMonth();
        renderAdminTimeline();
      },
      onStepMiniMonth: function (delta) {
        var next = new Date(state.miniYear, state.miniMonth + delta, 1);
        state.miniYear = next.getFullYear();
        state.miniMonth = next.getMonth();
        renderAdminTimeline();
      },
      onStepRange: function (delta) {
        var stepDays = state.viewMode === 'week' ? delta * 7 : delta;
        var nextKey = tl.addDays(state.selectedDateKey, stepDays);
        var dt = tl.parseYmd(nextKey);
        state.selectedDateKey = nextKey;
        state.miniYear = dt.getFullYear();
        state.miniMonth = dt.getMonth();
        renderAdminTimeline();
      },
      onSelectToday: function () {
        var now = new Date();
        state.selectedDateKey = svc.toLocalDateKey(now);
        state.miniYear = now.getFullYear();
        state.miniMonth = now.getMonth();
        renderAdminTimeline();
      },
      onSwitchViewMode: function (mode) {
        state.viewMode = mode === 'day' ? 'day' : 'week';
        renderAdminTimeline();
      },
      onToggleSidebar: function (isOpen) {
        state.sidebarExpanded = Boolean(isOpen);
      },
      onToggleCategory: function (catId) {
        state.hiddenCategories[catId] = !state.hiddenCategories[catId];
        renderAdminTimeline();
      },
      onCreateButton: function () {
        openQuickModalForCreate({
          dateKey: state.selectedDateKey,
          startMin: 9 * 60,
          endMin: 10 * 60,
          isAllDay: false
        });
      },
      onQuickCreateSlot: function (slot) {
        openQuickModalForCreate(slot);
      },
      onSelectEvent: function (eventId) {
        openQuickModalForEdit(eventId);
      },
      onMoveEvent: function (info) {
        handleDirectTimeChange(info, 'Jadwal dipindahkan');
      },
      onResizeEvent: function (info) {
        handleDirectTimeChange(info, 'Durasi jadwal diubah');
      }
    });

    tl.renderTimeline(el.timelineMount, {
      events: getCombinedEvents(),
      selectedDateKey: state.selectedDateKey,
      miniYear: state.miniYear,
      miniMonth: state.miniMonth,
      viewMode: state.viewMode,
      sidebarExpanded: state.sidebarExpanded,
      hiddenCategories: state.hiddenCategories,
      activeSelection: state.activeSelection,
      mode: 'admin'
    });
  }

  function formatSessionCountdown(remainingMs) {
    var totalSeconds = Math.max(0, Math.ceil(Number(remainingMs || 0) / 1000));
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return padTwo(mins) + ':' + padTwo(secs);
  }

  function syncSessionCountdown() {
    if (state.sessionTimerId) {
      window.clearInterval(state.sessionTimerId);
      state.sessionTimerId = null;
    }
    var authStatus = svc.getAdminAuthStatus();
    if (!authStatus.signedIn) {
      return;
    }
    state.sessionTimerId = window.setInterval(function () {
      var currentAuth = svc.getAdminAuthStatus();
      if (!currentAuth.signedIn) {
        window.clearInterval(state.sessionTimerId);
        state.sessionTimerId = null;
        svc.signOutAdmin({ revoke: false });
        applyAuthGate('Sesi berakhir, silakan masuk lagi.');
        return;
      }
      var badge = document.getElementById('admin-session-countdown');
      if (badge) {
        badge.textContent = 'Sesi: ' + formatSessionCountdown(currentAuth.remainingMs);
      }
    }, 1000);
  }

  function renderAllowedAccountsList() {
    if (!el.accountsList) {
      return;
    }
    var accounts = svc.getAllowedAdminAccounts();
    var auth = svc.getAdminAuthStatus();

    if (accounts.length === 0) {
      el.accountsList.innerHTML =
        '<p class="table-sub">Belum ada email admin yang dikunci. Akun Google pertama yang masuk akan otomatis terdaftar sebagai admin utama.</p>';
      return;
    }

    el.accountsList.innerHTML = accounts
      .map(function (acc) {
        var isCurrent = Boolean(auth.signedIn && auth.emailHash && acc.emailHash === auth.emailHash);
        var label = acc.email
          ? svc.escapeHtml(acc.email) + ' (' + svc.escapeHtml(acc.emailMasked) + ')'
          : svc.escapeHtml(acc.emailMasked);
        var sourceLabel = acc.source === 'config' ? 'Konfigurasi / Vercel' : 'Ditambahkan di Panel';
        var canRemove = acc.removable && accounts.length > 1;
        return (
          '<div class="admin-account-item">' +
            '<div class="admin-account-item__info">' +
              '<span class="admin-account-item__email">' + label + '</span>' +
              '<div class="admin-account-item__badges">' +
                (isCurrent ? '<span class="badge badge--open">Sedang Login</span>' : '') +
                '<span class="badge badge--cat">' + svc.escapeHtml(sourceLabel) + '</span>' +
              '</div>' +
            '</div>' +
            (canRemove
              ? '<button type="button" class="btn btn-outline btn-compact btn-danger-outline" data-remove-admin-hash="' +
                svc.escapeHtml(acc.emailHash) + '">Hapus Akses</button>'
              : '') +
          '</div>'
        );
      })
      .join('');
  }

  function renderStatusSummary() {
    if (!el.statusSummary || !state.payload) {
      return;
    }
    var events = getCombinedEvents();
    var draftCount = state.localDrafts.length;
    var isLive = state.payload.source === 'google';
    var auth = svc.getAdminAuthStatus();

    var statusLabel = isLive
      ? 'Terhubung Live ke Google Calendar API'
      : (state.payload.source === 'fallback-error'
        ? 'Gagal Terhubung ke Google Calendar (Memakai Data Contoh Lokal)'
        : 'Mode Siap Pakai (Data Contoh Lokal)');

    var authNote = '';
    var authBtnHtml = '';
    var sessionBadgeHtml = '';
    if (!auth.protocolSupported) {
      authNote = 'Login OAuth Google butuh Live Server / GitHub Pages (http/https); mode template & draft lokal aktif.';
    } else if (!auth.configured) {
      authNote = 'OAuth Admin belum aktif: drag & quick-edit tersimpan sebagai Draft Lokal, atau klik Buka di Google Calendar untuk terbitkan.';
      authBtnHtml = '<a class="btn btn-outline btn-compact" href="#setup-gcal">Setup OAuth Client ID</a>';
    } else if (auth.signedIn) {
      var who = auth.emailMasked ? ' (' + auth.emailMasked + ')' : '';
      authNote = 'Sesi Google SSO aktif' + who + ' · Create, Drag Move/Resize, dan Delete langsung aktif.';
      sessionBadgeHtml =
        ' <span id="admin-session-countdown" class="admin-session-badge">Sesi: ' +
        svc.escapeHtml(formatSessionCountdown(auth.remainingMs)) +
        '</span>';
      authBtnHtml =
        '<button type="button" class="btn btn-outline btn-compact" id="admin-oauth-switch-btn">Ganti Akun Google</button>' +
        '<button type="button" class="btn btn-outline btn-compact" id="admin-oauth-logout-btn">Keluar</button>';
    } else {
      var currentOrigin = window.location && window.location.origin ? window.location.origin : '';
      authNote = 'Klik Masuk dengan Google untuk memilih akun admin. Pastikan origin saat ini (' + currentOrigin + ') terdaftar persis di Authorized JavaScript origins Google Cloud Console.';
      authBtnHtml = '<button type="button" class="btn btn-accent btn-compact" id="admin-oauth-login-btn">Masuk dengan Google</button>';
    }

    el.statusSummary.innerHTML =
      '<div class="admin-status-row">' +
        '<div>' +
          '<p class="admin-status-title">' + svc.escapeHtml(statusLabel) + '</p>' +
          '<p class="admin-status-meta">' +
            'Total agenda terbaca: <strong>' + events.length + '</strong> event' +
            (draftCount > 0 ? ' (' + draftCount + ' draft lokal)' : '') +
            ' · Akun admin terdaftar: <strong>' + auth.allowedCount + '</strong>' +
            (state.payload.errorMessage ? ' · Error: ' + svc.escapeHtml(state.payload.errorMessage) : '') +
          '</p>' +
          '<p class="admin-status-meta">' + svc.escapeHtml(authNote) + sessionBadgeHtml + '</p>' +
        '</div>' +
        '<div class="admin-status-actions">' +
          authBtnHtml +
          '<button type="button" class="btn btn-outline btn-compact" id="admin-seed-templates-btn">Muat 7 Template Draft</button>' +
          (auth.signedIn && draftCount > 0
            ? '<button type="button" class="btn btn-accent btn-compact" id="admin-publish-drafts-btn">Kirim ' + draftCount + ' Draft ke Google Calendar</button>'
            : '') +
          (draftCount > 0
            ? '<button type="button" class="btn btn-outline btn-compact" id="admin-clear-drafts-btn">Bersihkan Draft Lokal</button>'
            : '') +
          '<button type="button" class="btn btn-outline btn-compact" id="admin-refresh-btn">Muat Ulang Data</button>' +
          '<a class="btn btn-outline btn-compact" href="https://calendar.google.com/" target="_blank" rel="noopener">Buka Google Calendar</a>' +
        '</div>' +
      '</div>';

    var seedTemplatesBtn = document.getElementById('admin-seed-templates-btn');
    if (seedTemplatesBtn) {
      seedTemplatesBtn.addEventListener('click', seedSevenTemplateDrafts);
    }

    var refreshBtn = document.getElementById('admin-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        loadConnectedSchedule(true);
      });
    }

    var clearDraftsBtn = document.getElementById('admin-clear-drafts-btn');
    if (clearDraftsBtn) {
      clearDraftsBtn.addEventListener('click', function () {
        state.localDrafts = [];
        saveStoredDrafts();
        renderConnectedList();
        renderAdminTimeline();
        showToast('Semua draft lokal dihapus dari sesi ini.');
      });
    }

    var publishDraftsBtn = document.getElementById('admin-publish-drafts-btn');
    if (publishDraftsBtn) {
      publishDraftsBtn.addEventListener('click', publishAllLocalDrafts);
    }

    var loginBtn = document.getElementById('admin-oauth-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        handleAdminLogin({ selectAccount: false });
      });
    }

    var switchBtn = document.getElementById('admin-oauth-switch-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', function () {
        handleAdminLogin({ selectAccount: true });
      });
    }

    var logoutBtn = document.getElementById('admin-oauth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        svc.signOutAdmin({ revoke: true });
        syncSessionCountdown();
        applyAuthGate('Sesi admin Google telah ditutup.');
      });
    }

    renderAllowedAccountsList();
    syncSessionCountdown();
  }

  async function publishAllLocalDrafts() {
    if (!svc.getAdminAuthStatus().signedIn || state.localDrafts.length === 0 || state.isSaving) {
      return;
    }
    state.isSaving = true;
    var drafts = state.localDrafts.slice();
    var sentCount = 0;
    try {
      for (var i = 0; i < drafts.length; i++) {
        var draft = drafts[i];
        var payload = buildEventPayloadFromExisting(draft);
        if (draft.baseEventId) {
          await svc.updateGoogleEvent(draft.baseEventId, payload);
        } else {
          await svc.createGoogleEvent(payload);
        }
        removeDraftById(draft.id);
        sentCount += 1;
      }
      showToast(sentCount + ' draft lokal berhasil dikirim ke Google Calendar.');
      await loadConnectedSchedule(true);
    } catch (err) {
      if (redirectToAuthGateIfSignedOut(err)) {
        return;
      }
      showToast('Sebagian draft gagal dikirim (' + sentCount + ' terkirim): ' + (err && err.message ? err.message : 'Error'), { isError: true });
      renderConnectedList();
      renderAdminTimeline();
    } finally {
      state.isSaving = false;
      syncFormModeControls();
    }
  }

  async function handleAdminLogin(options) {
    var opts = options || {};
    if (el.ssoLoginBtn) el.ssoLoginBtn.disabled = true;
    if (el.ssoSelectBtn) el.ssoSelectBtn.disabled = true;
    try {
      var authResult = await svc.requestAdminToken({
        selectAccount: Boolean(opts.selectAccount)
      });
      applyAuthGate('');
      renderStatusSummary();
      syncFormModeControls();
      var draftCount = state.localDrafts.length;
      var bootstrapNote = authResult && authResult.bootstrapped
        ? ' Akun Anda otomatis didaftarkan sebagai admin pertama.'
        : '';
      showToast(
        (draftCount > 0
          ? 'Login Google SSO berhasil (' + (authResult.emailMasked || 'Admin') + '). Klik "Kirim ' + draftCount + ' Draft ke Google Calendar" di atas.'
          : 'Login Google SSO berhasil (' + (authResult.emailMasked || 'Admin') + '). Create, Drag Move/Resize, dan Delete langsung aktif.') +
          bootstrapNote
      );
      await loadConnectedSchedule(true);
    } catch (err) {
      var rawMsg = err && err.message ? String(err.message) : 'Login dibatalkan.';
      var msg = rawMsg;
      if (rawMsg.indexOf('origin_mismatch') !== -1 || rawMsg.indexOf('The given origin is not allowed') !== -1) {
        msg = 'Domain ini (' + (window.location && window.location.origin ? window.location.origin : 'trpti.vercel.app') + ') belum didaftarkan di "Authorized JavaScript origins" pada Google Cloud Console.';
      } else if (rawMsg.indexOf('access_denied') !== -1) {
        msg = 'Akses ditolak oleh Google. Jika status OAuth di Google Cloud masih "Testing", pastikan email admin sudah dimasukkan ke daftar "Test users".';
      } else if (rawMsg.indexOf('popup_closed') !== -1) {
        msg = 'Jendela login Google ditutup sebelum proses selesai.';
      } else if (rawMsg.indexOf('popup_failed_to_open') !== -1) {
        msg = 'Jendela pop-up login Google diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
      }
      if (!svc.getAdminAuthStatus().signedIn) {
        applyAuthGate(msg);
      } else {
        showToast('Login Google gagal: ' + msg, { isError: true });
      }
    } finally {
      var authNow = svc.getAdminAuthStatus();
      var canLogin = authNow.protocolSupported && authNow.configured;
      if (el.ssoLoginBtn) el.ssoLoginBtn.disabled = !canLogin;
      if (el.ssoSelectBtn) el.ssoSelectBtn.disabled = !canLogin;
    }
  }

  async function handleDeleteEvent(eventId) {
    var target = findEventById(eventId);
    var label = target ? target.title : eventId;

    if (target && target.isLocalDraft) {
      if (!window.confirm('Hapus draft lokal "' + label + '" dari pratinjau kalender?')) {
        return;
      }
      var prev = removeDraftById(eventId);
      state.lastUndo = { type: 'draft', previousDrafts: prev };
      if (state.editingEventId === eventId) {
        state.editingEventId = '';
        state.posterUrl = '';
        el.form.reset();
        setDefaultDateInputs(true);
      }
      closeQuickModal();
      renderConnectedList();
      renderAdminTimeline();
      updatePreview();
      showToast('Draft lokal "' + label + '" dihapus.', { undoAvailable: true });
      return;
    }

    if (!svc.getAdminAuthStatus().signedIn) {
      showActionFeedback('Silakan klik "Masuk dengan Google (Admin)" terlebih dahulu untuk menghapus jadwal.', true);
      return;
    }
    if (!window.confirm('Hapus jadwal "' + label + '" dari Google Calendar? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    state.isSaving = true;
    syncFormModeControls();
    try {
      await svc.deleteGoogleEvent(eventId);
      if (state.editingEventId === eventId) {
        state.editingEventId = '';
        state.posterUrl = '';
        el.form.reset();
        setDefaultDateInputs(true);
      }
      closeQuickModal();
      showToast('Jadwal "' + label + '" berhasil dihapus dari Google Calendar.');
      await loadConnectedSchedule(true);
    } catch (err) {
      if (redirectToAuthGateIfSignedOut(err)) {
        return;
      }
      renderStatusSummary();
      showActionFeedback('Gagal menghapus jadwal: ' + (err && err.message ? err.message : 'Error'), true);
    } finally {
      state.isSaving = false;
      updatePreview();
    }
  }

  function renderConnectedList() {
    if (!el.connectedList || !state.payload) {
      return;
    }
    var lang = ui.getCurrentLang();
    var events = getCombinedEvents();
    var auth = svc.getAdminAuthStatus();
    renderStatusSummary();

    if (events.length === 0) {
      ui.renderStatusState(el.connectedList, {
        type: 'empty',
        title: 'Belum ada event terjadwal di kalender.',
        message: 'Seret pada kalender di atas atau klik tombol "+ Buat Event" untuk membuat jadwal pertama.'
      });
      return;
    }

    el.connectedList.innerHTML =
      '<div class="admin-event-table-wrap">' +
        '<table class="admin-event-table">' +
          '<thead><tr>' +
            '<th scope="col">Judul Event</th>' +
            '<th scope="col">Waktu</th>' +
            '<th scope="col">Kategori</th>' +
            '<th scope="col">Aksi</th>' +
          '</tr></thead>' +
          '<tbody>' +
            events.map(function (ev) {
              var catMeta = svc.getCategoryMeta(ev.category);
              var statusMeta = ui.getStatusMeta(ev.status);
              var canDelete = Boolean(ev.isLocalDraft || auth.signedIn);
              var customPoster = getExplicitEventPoster(ev);
              var thumbSrc = ev.poster || catMeta.defaultPoster;
              var thumbTag = customPoster
                ? '<span class="admin-table-thumb-tag">' + (svc.isGoogleDriveUrl(customPoster) ? 'Drive' : 'Custom') + '</span>'
                : '';
              return (
                '<tr>' +
                  '<td>' +
                    '<div class="admin-table-event">' +
                      '<button type="button" class="admin-table-thumb-btn" data-edit-poster-id="' + svc.escapeHtml(ev.id) + '" ' +
                      'aria-label="Ubah foto thumbnail untuk ' + svc.escapeHtml(ui.getEventTitle(ev, lang)) + '" ' +
                      'title="Klik untuk mengganti thumbnail event ini">' +
                        '<img class="admin-table-thumb" src="' + svc.escapeHtml(thumbSrc) + '" data-fallback="' + svc.escapeHtml(catMeta.defaultPoster) + '" ' +
                        'alt="" width="56" height="42" loading="lazy" decoding="async">' +
                      '</button>' +
                      '<div>' +
                        '<strong>' + svc.escapeHtml(ui.getEventTitle(ev, lang)) + '</strong>' +
                        (ev.isLocalDraft ? ' <span class="tl-tag tl-tag--draft">Draft Lokal</span>' : '') +
                        thumbTag +
                        '<br><span class="table-sub">' + svc.escapeHtml(ev.location || '-') + '</span>' +
                      '</div>' +
                    '</div>' +
                  '</td>' +
                  '<td>' + svc.escapeHtml(svc.formatDisplayDate(ev, lang)) + '</td>' +
                  '<td><span class="badge badge--cat">' + svc.escapeHtml(catMeta.labelId) + '</span> <span class="badge ' + statusMeta.className + '">' + svc.escapeHtml(statusMeta.label) + '</span></td>' +
                  '<td>' +
                    '<div class="table-actions">' +
                      '<button type="button" class="btn btn-outline btn-compact" data-edit-id="' + svc.escapeHtml(ev.id) + '">Edit</button>' +
                      (!ev.isLocalDraft
                        ? '<a class="btn btn-outline btn-compact" href="' + svc.escapeHtml(ui.getDetailHref(ev)) + '">Detail</a>'
                        : '<a class="btn btn-outline btn-compact" href="' + svc.escapeHtml(ics.buildGoogleCalendarAddUrl(ev)) + '" target="_blank" rel="noopener">Google Calendar</a>') +
                      (canDelete
                        ? '<button type="button" class="btn btn-outline btn-compact btn-danger-outline" data-delete-id="' + svc.escapeHtml(ev.id) + '">Hapus</button>'
                        : '') +
                    '</div>' +
                  '</td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
    ui.attachImageFallbacks(el.connectedList);
  }

  async function loadConnectedSchedule(forceRefresh) {
    if (el.connectedList) {
      ui.renderStatusState(el.connectedList, {
        type: 'loading',
        title: ui.t('loadingEvents')
      });
    }
    state.payload = await svc.getEvents({ forceRefresh: Boolean(forceRefresh) });
    renderConnectedList();
    renderAdminTimeline();
    updatePreview();
  }

  function bindQuickModalEvents() {
    if (!el.qmDialog || !el.qmForm) {
      return;
    }
    if (el.qmCloseBtn) {
      el.qmCloseBtn.addEventListener('click', closeQuickModal);
    }
    el.qmDialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeQuickModal();
    });
    el.qmDialog.addEventListener('click', function (e) {
      if (e.target !== el.qmDialog || (e.clientX === 0 && e.clientY === 0)) {
        return;
      }
      var card = el.qmDialog.querySelector('.qm-card');
      if (!card) {
        closeQuickModal();
        return;
      }
      var r = card.getBoundingClientRect();
      var insideCard = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!insideCard) {
        closeQuickModal();
      }
    });
    if (el.qmCatChips) {
      el.qmCatChips.addEventListener('click', function (e) {
        var chip = e.target.closest('button[data-qm-cat]');
        if (!chip) {
          return;
        }
        state.qmCategory = chip.getAttribute('data-qm-cat') || 'seminar';
        renderQuickCategoryChips();
        syncQuickModalState();
      });
    }
    if (el.qmDurationBar) {
      el.qmDurationBar.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-qm-dur]');
        if (!btn) {
          return;
        }
        adjustQuickModalDuration(Number(btn.getAttribute('data-qm-dur')));
      });
    }
    if (el.qmPosterToggleBtn && el.qmPosterDrawer) {
      el.qmPosterToggleBtn.addEventListener('click', function () {
        setQuickPosterDrawerOpen(el.qmPosterDrawer.hidden);
      });
    }
    bindPosterPickerEvents({
      galleryEl: el.qmPosterGallery,
      clearBtnEl: el.qmPosterClearBtn,
      customInputEl: el.qmPosterCustom,
      setPosterUrl: function (nextUrl) {
        state.qmPosterUrl = nextUrl;
      },
      onUpdate: syncQuickModalState
    });
    el.qmForm.addEventListener('input', syncQuickModalState);
    el.qmForm.addEventListener('change', syncQuickModalState);
    el.qmForm.addEventListener('submit', handleQuickModalSubmit);

    if (el.qmMoreBtn) {
      el.qmMoreBtn.addEventListener('click', function () {
        var data = readQuickModalPayload();
        var mergedPreview = Object.assign({}, state.qmBaseEvent || {}, data.previewEvent, {
          id: state.qmEditingEventId || ''
        });
        applyEventToFullForm(mergedPreview);
        state.editingEventId = state.qmEditingEventId;
        updatePreview();
        closeQuickModal();
        var section = document.getElementById('admin-full-form-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (el.title) {
          el.title.focus();
        }
      });
    }

    if (el.qmDeleteBtn) {
      el.qmDeleteBtn.addEventListener('click', function () {
        if (state.qmEditingEventId) {
          handleDeleteEvent(state.qmEditingEventId);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.form = document.getElementById('admin-event-form');
    el.formHeading = document.getElementById('admin-form-heading');
    el.editBanner = document.getElementById('admin-edit-banner');
    el.overlapWarn = document.getElementById('adm-overlap-warning');
    el.title = document.getElementById('adm-title');
    el.category = document.getElementById('adm-category');
    el.status = document.getElementById('adm-status');
    el.allDay = document.getElementById('adm-allday');
    el.startDate = document.getElementById('adm-start-date');
    el.startTime = document.getElementById('adm-start-time');
    el.endDate = document.getElementById('adm-end-date');
    el.endTime = document.getElementById('adm-end-time');
    el.location = document.getElementById('adm-location');
    el.description = document.getElementById('adm-description');
    el.fee = document.getElementById('adm-fee');
    el.contact = document.getElementById('adm-contact');
    el.daftarUrl = document.getElementById('adm-daftar');
    el.posterSection = document.getElementById('adm-poster-section');
    el.posterPreviewImg = document.getElementById('adm-poster-preview-img');
    el.posterPreviewLabel = document.getElementById('adm-poster-preview-label');
    el.posterClearBtn = document.getElementById('adm-poster-clear-btn');
    el.posterCustom = document.getElementById('adm-poster-custom');
    el.posterHint = document.getElementById('adm-poster-hint');
    el.posterGallery = document.getElementById('adm-poster-gallery');
    el.rundown = document.getElementById('adm-rundown');
    el.detailsOutput = document.getElementById('adm-details-output');
    el.cardPreview = document.getElementById('adm-card-preview');
    el.feedback = document.getElementById('adm-feedback');
    el.submitBtn = document.getElementById('adm-submit-btn');
    el.saveDraftBtn = document.getElementById('adm-save-draft-btn');
    el.deleteBtn = document.getElementById('adm-delete-btn');
    el.copyBtn = document.getElementById('adm-copy-btn');
    el.icsBtn = document.getElementById('adm-ics-btn');
    el.resetBtn = document.getElementById('adm-reset-btn');
    el.statusSummary = document.getElementById('admin-status-summary');
    el.toast = document.getElementById('admin-toast');
    el.connectedList = document.getElementById('admin-connected-list');
    el.timelineMount = document.getElementById('admin-timeline-mount');

    el.qmDialog = document.getElementById('admin-quick-modal');
    el.qmHeading = document.getElementById('qm-heading');
    el.qmDraftBadge = document.getElementById('qm-draft-badge');
    el.qmCloseBtn = document.getElementById('qm-close-btn');
    el.qmForm = document.getElementById('qm-form');
    el.qmTitle = document.getElementById('qm-title');
    el.qmCatChips = document.getElementById('qm-cat-chips');
    el.qmAllDay = document.getElementById('qm-allday');
    el.qmStartDate = document.getElementById('qm-start-date');
    el.qmStartTime = document.getElementById('qm-start-time');
    el.qmEndDate = document.getElementById('qm-end-date');
    el.qmEndTime = document.getElementById('qm-end-time');
    el.qmDurationBar = document.getElementById('qm-duration-bar');
    el.qmLocation = document.getElementById('qm-location');
    el.qmDescription = document.getElementById('qm-description');
    el.qmPosterPreviewImg = document.getElementById('qm-poster-preview-img');
    el.qmPosterPreviewLabel = document.getElementById('qm-poster-preview-label');
    el.qmPosterClearBtn = document.getElementById('qm-poster-clear-btn');
    el.qmPosterToggleBtn = document.getElementById('qm-poster-toggle-btn');
    el.qmPosterDrawer = document.getElementById('qm-poster-drawer');
    el.qmPosterCustom = document.getElementById('qm-poster-custom');
    el.qmPosterHint = document.getElementById('qm-poster-hint');
    el.qmPosterGallery = document.getElementById('qm-poster-gallery');
    el.qmOverlapWarn = document.getElementById('qm-overlap-warn');
    el.qmSyncNote = document.getElementById('qm-sync-note');
    el.qmError = document.getElementById('qm-error');
    el.qmSaveBtn = document.getElementById('qm-save-btn');
    el.qmGcalLink = document.getElementById('qm-gcal-link');
    el.qmMoreBtn = document.getElementById('qm-more-btn');
    el.qmDeleteBtn = document.getElementById('qm-delete-btn');

    if (!el.form) {
      return;
    }

    el.authGate = document.getElementById('admin-auth-gate');
    el.workspaceShell = document.getElementById('admin-workspace-shell');
    el.authError = document.getElementById('admin-auth-error');
    el.authDesc = document.getElementById('admin-auth-desc');
    el.ssoLoginBtn = document.getElementById('admin-sso-login-btn');
    el.ssoSelectBtn = document.getElementById('admin-sso-select-btn');
    el.accountsList = document.getElementById('admin-accounts-list');
    el.addAccountForm = document.getElementById('admin-add-account-form');
    el.newAdminEmail = document.getElementById('adm-new-admin-email');
    el.copyEnvEmailsBtn = document.getElementById('adm-copy-env-emails-btn');
    el.accountFeedback = document.getElementById('adm-account-feedback');

    function setAuthGateFeedback(message, isError) {
      if (!el.authError) {
        return;
      }
      if (!message) {
        el.authError.className = 'admin-feedback';
        el.authError.textContent = '';
        return;
      }
      el.authError.className = 'admin-feedback ' + (isError ? 'admin-feedback--error' : 'admin-feedback--ok');
      el.authError.textContent = message;
    }

    function setAccountFeedback(message, isError) {
      if (!el.accountFeedback) {
        return;
      }
      if (!message) {
        el.accountFeedback.className = 'admin-feedback';
        el.accountFeedback.textContent = '';
        return;
      }
      el.accountFeedback.className = 'admin-feedback ' + (isError ? 'admin-feedback--error' : 'admin-feedback--ok');
      el.accountFeedback.textContent = message;
    }

    function ensureWorkspaceInitialized() {
      if (state.workspaceInitialized) {
        return;
      }
      state.workspaceInitialized = true;
      populateSelectOptions();
      setDefaultDateInputs(false);
      bindPosterPickerEvents({
        galleryEl: el.posterGallery,
        clearBtnEl: el.posterClearBtn,
        customInputEl: el.posterCustom,
        setPosterUrl: function (nextUrl) {
          state.posterUrl = nextUrl;
        },
        onUpdate: updatePreview
      });
      bindQuickModalEvents();
      updatePreview();
      loadConnectedSchedule(false);
    }

    applyAuthGate = function (reasonMessage) {
      var authStatus = svc.getAdminAuthStatus();
      if (authStatus.signedIn) {
        if (el.authGate) el.authGate.hidden = true;
        if (el.workspaceShell) el.workspaceShell.hidden = false;
        setAuthGateFeedback('', false);
        ensureWorkspaceInitialized();
        renderStatusSummary();
        syncSessionCountdown();
        return;
      }

      if (el.workspaceShell) el.workspaceShell.hidden = true;
      if (el.authGate) el.authGate.hidden = false;
      syncSessionCountdown();

      var canLogin = authStatus.protocolSupported && authStatus.configured && (authStatus.allowListConfigured || authStatus.canBootstrapLocal);
      if (el.ssoLoginBtn) el.ssoLoginBtn.disabled = !canLogin;
      if (el.ssoSelectBtn) el.ssoSelectBtn.disabled = !canLogin;

      if (!authStatus.protocolSupported) {
        setAuthGateFeedback('Login Google OAuth membutuhkan Live Server atau hosting http:// / https:// (bukan file://).', true);
      } else if (!authStatus.configured) {
        setAuthGateFeedback('oauthClientId belum diatur pada Environment Variable Vercel atau js/config.js.', true);
      } else if (!authStatus.allowListConfigured && !authStatus.canBootstrapLocal) {
        setAuthGateFeedback('Daftar admin (ADMIN_EMAILS) belum diatur pada Environment Variable Vercel.', true);
      } else if (reasonMessage) {
        setAuthGateFeedback(reasonMessage, true);
      } else if (!authStatus.allowListConfigured && authStatus.canBootstrapLocal) {
        setAuthGateFeedback('Mode setup lokal: login Google pertama Anda akan otomatis didaftarkan sebagai admin utama.', false);
      } else {
        setAuthGateFeedback('', false);
      }
    };

    if (el.ssoLoginBtn) {
      el.ssoLoginBtn.addEventListener('click', function () {
        handleAdminLogin({ selectAccount: false });
      });
    }

    if (el.ssoSelectBtn) {
      el.ssoSelectBtn.addEventListener('click', function () {
        handleAdminLogin({ selectAccount: true });
      });
    }

    if (el.addAccountForm) {
      el.addAccountForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var rawEmail = el.newAdminEmail ? el.newAdminEmail.value : '';
        var res = svc.addAllowedAdminEmail(rawEmail);
        if (!res.ok) {
          setAccountFeedback(res.error || 'Gagal menambahkan email admin.', true);
          return;
        }
        if (el.newAdminEmail) {
          el.newAdminEmail.value = '';
        }
        renderAllowedAccountsList();
        renderStatusSummary();
        setAccountFeedback('Akun ' + res.entry.email + ' berhasil ditambahkan sebagai admin.', false);
      });
    }

    if (el.accountsList) {
      el.accountsList.addEventListener('click', function (event) {
        var rmBtn = event.target.closest('button[data-remove-admin-hash]');
        if (!rmBtn) {
          return;
        }
        var targetHash = rmBtn.getAttribute('data-remove-admin-hash');
        var res = svc.removeAllowedAdminEmail(targetHash);
        if (!res.ok) {
          setAccountFeedback(res.error || 'Gagal menghapus akun admin.', true);
          return;
        }
        if (!svc.getAdminAuthStatus().signedIn) {
          applyAuthGate('Akses akun Anda telah dicabut.');
          return;
        }
        renderAllowedAccountsList();
        renderStatusSummary();
        setAccountFeedback('Akses akun admin berhasil dihapus.', false);
      });
    }

    if (el.copyEnvEmailsBtn) {
      el.copyEnvEmailsBtn.addEventListener('click', function () {
        var emails = svc.getAllowedAdminAccounts()
          .map(function (acc) { return acc.email; })
          .filter(Boolean);
        var auth = svc.getAdminAuthStatus();
        if (auth.email && emails.indexOf(auth.email) === -1) {
          emails.push(auth.email);
        }
        if (emails.length === 0) {
          setAccountFeedback('Belum ada alamat email plain yang bisa disalin.', true);
          return;
        }
        var envLine = 'ADMIN_EMAILS=' + emails.join(',');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(envLine).then(function () {
            setAccountFeedback('Tersalin ke clipboard: ' + envLine, false);
          }).catch(function () {
            setAccountFeedback('Salin manual: ' + envLine, false);
          });
        } else {
          setAccountFeedback('Salin manual: ' + envLine, false);
        }
      });
    }

    applyAuthGate('');

    el.form.addEventListener('input', updatePreview);
    el.form.addEventListener('change', updatePreview);

    function validateFullForm(data) {
      var errorMsg = validateEventTiming(el.title ? el.title.value : '', data);
      if (!errorMsg && data.daftarUrl && !/^https?:\/\//i.test(data.daftarUrl)) {
        return 'Link pendaftaran harus diawali dengan https:// atau http://.';
      }
      return errorMsg;
    }

    el.form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var data = readFormState();
      var errorMsg = validateFullForm(data);
      if (errorMsg) {
        showActionFeedback(errorMsg, true);
        return;
      }

      if (svc.getAdminAuthStatus().signedIn) {
        state.isSaving = true;
        syncFormModeControls();
        try {
          var existing = state.editingEventId ? findEventById(state.editingEventId) : null;
          if (state.editingEventId && existing && !existing.isLocalDraft) {
            await svc.updateGoogleEvent(state.editingEventId, data);
            showActionFeedback('Perubahan jadwal "' + data.title + '" berhasil disimpan ke Google Calendar.', false);
          } else {
            await svc.createGoogleEvent(data);
            if (state.editingEventId) {
              removeDraftById(state.editingEventId);
            }
            showActionFeedback('Jadwal baru "' + data.title + '" berhasil dibuat langsung di Google Calendar.', false);
          }
          state.selectedDateKey = data.startDate;
          state.editingEventId = '';
          state.posterUrl = '';
          el.form.reset();
          setDefaultDateInputs(true);
          await loadConnectedSchedule(true);
        } catch (err) {
          if (redirectToAuthGateIfSignedOut(err)) {
            return;
          }
          renderStatusSummary();
          showActionFeedback('Gagal menyimpan ke Google Calendar: ' + (err && err.message ? err.message : 'Error'), true);
        } finally {
          state.isSaving = false;
          updatePreview();
        }
        return;
      }

      var gcalUrl = buildGoogleTemplateHref(data);
      window.open(gcalUrl, '_blank', 'noopener');
      showActionFeedback(
        'Tab Google Calendar siap dibuka. Klik tombol Save di Google Calendar (atau hubungkan OAuth Client ID agar simpan langsung tanpa tab baru).',
        false,
        gcalUrl
      );
    });

    if (el.saveDraftBtn) {
      el.saveDraftBtn.addEventListener('click', function () {
        var data = readFormState();
        var errorMsg = validateFullForm(data);
        if (errorMsg) {
          showActionFeedback(errorMsg, true);
          return;
        }
        var existing = state.editingEventId ? findEventById(state.editingEventId) : null;
        upsertLocalDraft(data, existing);
        state.selectedDateKey = data.startDate;
        state.editingEventId = '';
        state.posterUrl = '';
        el.form.reset();
        setDefaultDateInputs(true);
        renderConnectedList();
        renderAdminTimeline();
        updatePreview();
        showActionFeedback(
          'Draft "' + data.title + '" disimpan ke daftar lokal. Edit template lain atau klik "Kirim Draft ke Google Calendar" di atas.',
          false
        );
      });
    }

    if (el.deleteBtn) {
      el.deleteBtn.addEventListener('click', function () {
        if (state.editingEventId) {
          handleDeleteEvent(state.editingEventId);
        }
      });
    }

    if (el.connectedList) {
      el.connectedList.addEventListener('click', function (event) {
        var posterBtn = event.target.closest('button[data-edit-poster-id]');
        if (posterBtn) {
          loadEventIntoFullForm(posterBtn.getAttribute('data-edit-poster-id'), { focusPoster: true });
          return;
        }
        var editBtn = event.target.closest('button[data-edit-id]');
        if (editBtn) {
          loadEventIntoFullForm(editBtn.getAttribute('data-edit-id'));
          return;
        }
        var delBtn = event.target.closest('button[data-delete-id]');
        if (delBtn) {
          handleDeleteEvent(delBtn.getAttribute('data-delete-id'));
        }
      });
    }

    if (el.copyBtn) {
      el.copyBtn.addEventListener('click', function () {
        var text = el.detailsOutput ? el.detailsOutput.value : '';
        if (!text) {
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showActionFeedback('Teks deskripsi terformat berhasil disalin ke clipboard.', false);
          }).catch(function () {
            el.detailsOutput.select();
            document.execCommand('copy');
            showActionFeedback('Teks deskripsi disalin ke clipboard.', false);
          });
        } else {
          el.detailsOutput.select();
          document.execCommand('copy');
          showActionFeedback('Teks deskripsi disalin ke clipboard.', false);
        }
      });
    }

    if (el.icsBtn) {
      el.icsBtn.addEventListener('click', function () {
        var data = readFormState();
        var errorMsg = validateEventTiming(el.title ? el.title.value : '', data);
        if (errorMsg) {
          showActionFeedback(errorMsg, true);
          return;
        }
        ics.downloadEventIcs(data.previewEvent);
        showActionFeedback('Draft file .ics berhasil diunduh.', false);
      });
    }

    if (el.resetBtn) {
      el.resetBtn.addEventListener('click', function () {
        state.editingEventId = '';
        state.posterUrl = '';
        el.form.reset();
        setDefaultDateInputs(true);
        updatePreview();
        showActionFeedback('Formulir dikembalikan ke kondisi awal.', false);
      });
    }

    // Sinkronkan sesi Google SSO dan daftar akun admin antar-tab saat status berubah.
    window.addEventListener('storage', function (event) {
      if (!event.key || event.key === svc.getAdminSessionKey() || event.key === svc.getAdminAllowedEmailsKey()) {
        svc.reloadAdminSession();
        if (!svc.getAdminAuthStatus().signedIn) {
          applyAuthGate('Sesi admin berakhir atau diubah di tab lain.');
        } else {
          renderStatusSummary();
          syncFormModeControls();
          renderConnectedList();
        }
      }
    });

    window.addEventListener('portal:langchange', function () {
      if (!state.workspaceInitialized) {
        return;
      }
      updatePreview();
      renderConnectedList();
      renderAdminTimeline();
    });
  });
})();
