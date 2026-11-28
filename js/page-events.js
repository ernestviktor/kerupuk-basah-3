// DI BUAT MENGGUNAKAN AI // 

// Skrip halaman Daftar Event (events.html): pencarian, filter kategori, dan filter status.

window.PortalKampus = window.PortalKampus || {};

(function () {
  var CONFIG = window.PortalKampus.CONFIG;
  var svc = window.PortalKampus.calendarService;
  var ui = window.PortalKampus.ui;

  var state = {
    category: 'all',
    status: 'all',
    query: '',
    payload: null
  };

  var elements = {};

  function readInitialCategoryFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var cat = (params.get('cat') || '').trim().toLowerCase();
    if (!cat) {
      return 'all';
    }
    var known = CONFIG.categories.some(function (item) {
      return item.id === cat;
    });
    return known ? cat : 'all';
  }

  function renderFilterChips() {
    if (!elements.filterBar) {
      return;
    }
    var lang = ui.getCurrentLang();
    var usedCategories = {};
    if (state.payload && Array.isArray(state.payload.events)) {
      state.payload.events.forEach(function (ev) {
        usedCategories[ev.category] = true;
      });
    }

    var buttons = [
      { id: 'all', label: ui.t('allCategories') }
    ];

    CONFIG.categories.forEach(function (cat) {
      if (cat.id !== 'umum' || usedCategories.umum) {
        buttons.push({
          id: cat.id,
          label: lang === 'en' ? cat.labelEn : cat.labelId
        });
      }
    });

    elements.filterBar.innerHTML = buttons
      .map(function (btn) {
        var isActive = state.category === btn.id;
        return (
          '<button type="button" class="filter-chip' + (isActive ? ' is-active' : '') + '" ' +
          'data-cat="' + svc.escapeHtml(btn.id) + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
            svc.escapeHtml(btn.label) +
          '</button>'
        );
      })
      .join('');
  }

  function syncToolbarText() {
    var lang = ui.getCurrentLang();
    if (elements.searchInput) {
      elements.searchInput.placeholder = lang === 'en'
        ? 'Search event title, venue, or topic...'
        : 'Cari judul event, lokasi, atau topik...';
    }
    if (elements.statusSelect) {
      var optAll = elements.statusSelect.querySelector('option[value="all"]');
      var optUpcoming = elements.statusSelect.querySelector('option[value="upcoming"]');
      var optClosed = elements.statusSelect.querySelector('option[value="closed"]');
      if (optAll) optAll.textContent = ui.t('allStatuses');
      if (optUpcoming) optUpcoming.textContent = ui.t('upcomingOnly');
      if (optClosed) optClosed.textContent = ui.t('closedOnly');
    }
  }

  function getFilteredEvents() {
    if (!state.payload || !Array.isArray(state.payload.events)) {
      return [];
    }
    var needle = state.query.trim().toLowerCase();

    return state.payload.events.filter(function (ev) {
      if (state.category !== 'all' && ev.category !== state.category) {
        return false;
      }
      if (state.status === 'upcoming' && ev.status === 'closed') {
        return false;
      }
      if (state.status === 'closed' && ev.status !== 'closed') {
        return false;
      }
      if (needle) {
        var haystack = [
          ev.title,
          ev.titleEn,
          ev.location,
          ev.description,
          ev.descriptionEn
        ]
          .join(' ')
          .toLowerCase();
        if (haystack.indexOf(needle) === -1) {
          return false;
        }
      }
      return true;
    });
  }

  function resetAllFilters() {
    state.category = 'all';
    state.status = 'all';
    state.query = '';
    if (elements.searchInput) {
      elements.searchInput.value = '';
    }
    if (elements.statusSelect) {
      elements.statusSelect.value = 'all';
    }
    renderPage();
  }

  function renderPage() {
    if (!state.payload) {
      return;
    }
    var lang = ui.getCurrentLang();
    syncToolbarText();
    renderFilterChips();
    ui.renderSourceNotice(elements.notice, state.payload.source, state.payload.errorMessage, function () {
      loadEvents(true);
    });

    var filtered = getFilteredEvents();
    if (elements.countText) {
      elements.countText.textContent = lang === 'en'
        ? 'Showing ' + filtered.length + ' of ' + state.payload.events.length + ' events'
        : 'Menampilkan ' + filtered.length + ' dari ' + state.payload.events.length + ' event';
    }

    if (filtered.length === 0) {
      elements.grid.innerHTML = '';
      var hasActiveFilter = state.category !== 'all' || state.status !== 'all' || state.query.trim() !== '';
      ui.renderStatusState(elements.stateWrap, {
        type: 'empty',
        title: hasActiveFilter ? ui.t('noMatchingEvents') : ui.t('noEventsInMonth'),
        message: hasActiveFilter
          ? (lang === 'en' ? 'Try another keyword or clear the active category filter.' : 'Coba kata kunci lain atau kembalikan semua kategori.')
          : (lang === 'en' ? 'No events have been added yet.' : 'Belum ada event yang tercatat di kalender.'),
        actionLabel: hasActiveFilter ? ui.t('resetFilter') : '',
        onAction: hasActiveFilter ? resetAllFilters : null
      });
      return;
    }

    elements.stateWrap.innerHTML = '';
    elements.grid.innerHTML = filtered
      .map(function (ev) {
        return ui.renderEventCard(ev, { lang: lang });
      })
      .join('');
    ui.attachImageFallbacks(elements.grid);
  }

  async function loadEvents(forceRefresh) {
    ui.renderStatusState(elements.stateWrap, {
      type: 'loading',
      title: ui.t('loadingEvents')
    });
    elements.grid.innerHTML = '';
    state.payload = await svc.getEvents({ forceRefresh: Boolean(forceRefresh) });
    renderPage();
  }

  document.addEventListener('DOMContentLoaded', function () {
    elements.grid = document.getElementById('events-grid');
    elements.stateWrap = document.getElementById('events-state');
    elements.notice = document.getElementById('events-source-notice');
    elements.filterBar = document.getElementById('events-filter-bar');
    elements.searchInput = document.getElementById('event-search');
    elements.statusSelect = document.getElementById('event-status-filter');
    elements.countText = document.getElementById('events-count');

    if (!elements.grid) {
      return;
    }

    state.category = readInitialCategoryFromUrl();

    if (elements.filterBar) {
      elements.filterBar.addEventListener('click', function (event) {
        var btn = event.target.closest('button[data-cat]');
        if (!btn) {
          return;
        }
        state.category = btn.getAttribute('data-cat') || 'all';
        renderPage();
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', function (event) {
        state.query = event.target.value || '';
        renderPage();
      });
    }

    if (elements.statusSelect) {
      elements.statusSelect.addEventListener('change', function (event) {
        state.status = event.target.value || 'all';
        renderPage();
      });
    }

    window.addEventListener('portal:langchange', renderPage);
    loadEvents(false);
  });
})();
