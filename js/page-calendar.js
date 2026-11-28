// DI BUAT MENGGUNAKAN AI // 

// Skrip halaman Kalender (calendar.html): mendukung Grid Bulanan, Timeline Harian, dan Daftar Agenda.
window.PortalKampus = window.PortalKampus || {};

(function () {
  var CONFIG = window.PortalKampus.CONFIG;
  var svc = window.PortalKampus.calendarService;
  var ics = window.PortalKampus.ics;
  var ui = window.PortalKampus.ui;
  var tl = window.PortalKampus.timelineView;

  var today = new Date();
  var state = {
    year: today.getFullYear(),
    month: today.getMonth(),
    view: 'grid',
    timelineViewMode: window.innerWidth >= 768 ? 'week' : 'day',
    sidebarExpanded: window.innerWidth >= 900,
    selectedDateKey: svc.toLocalDateKey(today),
    hiddenCategories: {},
    payload: null
  };

  var el = {};

  function getWeekdayNames(lang) {
    return lang === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  }

  function formatMonthHeading(year, month, lang) {
    var locale = lang === 'en' ? 'en-US' : 'id-ID';
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric'
    }).format(new Date(year, month, 1));
  }

  function buildDateKey(year, month, day) {
    return (
      year +
      '-' +
      String(month + 1).padStart(2, '0') +
      '-' +
      String(day).padStart(2, '0')
    );
  }

  function groupEventsByDate(events) {
    var map = {};
    events.forEach(function (ev) {
      if (!ev.dateKey) {
        return;
      }
      if (!map[ev.dateKey]) {
        map[ev.dateKey] = [];
      }
      map[ev.dateKey].push(ev);
    });
    return map;
  }

  function getEventsForMonth(events, year, month) {
    var prefix = year + '-' + String(month + 1).padStart(2, '0') + '-';
    return events.filter(function (ev) {
      return ev.dateKey && ev.dateKey.indexOf(prefix) === 0;
    });
  }

  function renderSelectedDatePanel(eventsByDate) {
    if (!el.agendaPanel) {
      return;
    }
    var lang = ui.getCurrentLang();

    if (!state.selectedDateKey) {
      el.agendaPanel.innerHTML =
        '<div class="agenda-panel__empty">' +
          '<h3>' + (lang === 'en' ? 'Selected Date Details' : 'Detail Agenda Tanggal Terpilih') + '</h3>' +
          '<p>' + svc.escapeHtml(ui.t('selectDateHint')) + '</p>' +
        '</div>';
      return;
    }

    var dateObj = tl.parseYmd(state.selectedDateKey);
    var dateHeading = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);

    var dayEvents = eventsByDate[state.selectedDateKey] || [];
    if (dayEvents.length === 0) {
      var actionMarkup = state.view !== 'timeline'
        ? '<div class="agenda-item__actions">' +
            '<button type="button" class="btn btn-outline btn-compact" data-open-timeline="1">' + (lang === 'en' ? 'Open Day Timeline' : 'Lihat Timeline Jam') + '</button>' +
          '</div>'
        : '';
      el.agendaPanel.innerHTML =
        '<div class="agenda-panel__empty">' +
          '<h3>' + svc.escapeHtml(dateHeading) + '</h3>' +
          '<p>' + svc.escapeHtml(ui.t('noEventsOnDate')) + '</p>' +
          actionMarkup +
        '</div>';
      return;
    }

    var cardsHtml = dayEvents
      .map(function (ev) {
        var title = ui.getEventTitle(ev, lang);
        var catMeta = svc.getCategoryMeta(ev.category);
        var catLabel = lang === 'en' ? catMeta.labelEn : catMeta.labelId;
        var gcalAdd = ics.buildGoogleCalendarAddUrl(ev);
        return (
          '<article class="agenda-item">' +
            '<div class="agenda-item__head">' +
              '<span class="badge badge--cat">' + svc.escapeHtml(catLabel) + '</span>' +
              '<span class="agenda-item__time">' + svc.escapeHtml(svc.formatDisplayDateRange(ev, lang)) + '</span>' +
            '</div>' +
            '<h4 class="agenda-item__title">' + svc.escapeHtml(title) + '</h4>' +
            '<p class="agenda-item__meta">' + svc.escapeHtml(ev.location || ui.t('locationTba')) + '</p>' +
            '<div class="agenda-item__actions">' +
              '<a class="btn btn-accent btn-compact" href="' + svc.escapeHtml(ui.getDetailHref(ev)) + '">' + svc.escapeHtml(ui.t('viewDetails')) + '</a>' +
              '<a class="btn btn-outline btn-compact" href="' + svc.escapeHtml(gcalAdd) + '" target="_blank" rel="noopener">Google Calendar</a>' +
              '<button type="button" class="btn btn-outline btn-compact" data-ics-id="' + svc.escapeHtml(ev.id) + '">.ics</button>' +
            '</div>' +
          '</article>'
        );
      })
      .join('');

    el.agendaPanel.innerHTML =
      '<div class="agenda-panel__head">' +
        '<h3>' + svc.escapeHtml(dateHeading) + '</h3>' +
        '<div class="agenda-item__actions">' +
          '<span>' + dayEvents.length + (lang === 'en' ? ' event(s)' : ' agenda') + '</span>' +
          (state.view !== 'timeline'
            ? '<button type="button" class="btn btn-outline btn-compact" data-open-timeline="1">' + (lang === 'en' ? 'Open Day Timeline' : 'Lihat Timeline Jam') + '</button>'
            : '') +
        '</div>' +
      '</div>' +
      '<div class="agenda-items">' + cardsHtml + '</div>';
  }

  function renderGridCalendar(eventsByDate) {
    var lang = ui.getCurrentLang();
    var weekdays = getWeekdayNames(lang);
    var firstDay = new Date(state.year, state.month, 1);
    var daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    var startOffset = (firstDay.getDay() + 6) % 7;
    var todayKey = svc.toLocalDateKey(new Date());

    var headHtml = weekdays
      .map(function (dayName) {
        return '<th scope="col">' + svc.escapeHtml(dayName) + '</th>';
      })
      .join('');

    var rowsHtml = '';
    var cells = [];

    for (var blank = 0; blank < startOffset; blank++) {
      cells.push('<td class="cal-outside"></td>');
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateKey = buildDateKey(state.year, state.month, day);
      var dayEvents = eventsByDate[dateKey] || [];
      var isToday = dateKey === todayKey;
      var isSelected = dateKey === state.selectedDateKey;
      var cellClasses = [];
      if (dayEvents.length > 0) cellClasses.push('cal-has-event');
      if (isToday) cellClasses.push('cal-today');
      if (isSelected) cellClasses.push('cal-selected');

      var eventsHtml = dayEvents
        .map(function (ev) {
          var title = ui.getEventTitle(ev, lang);
          return (
            '<button type="button" class="cal-event-link cal-event-btn" data-date="' + dateKey + '" data-event-id="' + svc.escapeHtml(ev.id) + '">' +
              svc.escapeHtml(title) +
            '</button>'
          );
        })
        .join('');

      cells.push(
        '<td class="' + cellClasses.join(' ') + '">' +
          '<button type="button" class="cal-day-btn" data-date="' + dateKey + '" aria-label="' + svc.escapeHtml(dateKey) + '">' +
            '<span class="cal-day">' + day + '</span>' +
          '</button>' +
          '<div class="cal-cell-events">' + eventsHtml + '</div>' +
        '</td>'
      );
    }

    while (cells.length % 7 !== 0) {
      cells.push('<td class="cal-outside"></td>');
    }

    for (var i = 0; i < cells.length; i += 7) {
      rowsHtml += '<tr>' + cells.slice(i, i + 7).join('') + '</tr>';
    }

    el.calendarMount.innerHTML =
      '<div class="calendar-wrap">' +
        '<table class="calendar-table">' +
          '<thead><tr>' + headHtml + '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderAgendaListView(monthEvents) {
    var lang = ui.getCurrentLang();
    if (monthEvents.length === 0) {
      var allEvents = state.payload.events || [];
      var nearest = allEvents.find(function (ev) {
        return ev.status !== 'closed';
      }) || allEvents[0];

      ui.renderStatusState(el.calendarMount, {
        type: 'empty',
        title: ui.t('noEventsInMonth'),
        message: nearest
          ? (lang === 'en'
            ? 'You can jump directly to the nearest scheduled event month.'
            : 'Anda dapat melompat langsung ke bulan yang memiliki jadwal terdekat.')
          : '',
        actionLabel: nearest
          ? (lang === 'en' ? 'Jump to Nearest Event' : 'Ke Bulan Jadwal Terdekat')
          : '',
        onAction: nearest
          ? function () {
              var d = new Date(nearest.startIso);
              state.year = d.getFullYear();
              state.month = d.getMonth();
              state.selectedDateKey = nearest.dateKey;
              renderCalendarPage();
            }
          : null
      });
      return;
    }

    el.calendarMount.innerHTML =
      '<div class="agenda-list-view">' +
        monthEvents
          .map(function (ev) {
            var catMeta = svc.getCategoryMeta(ev.category);
            var catLabel = lang === 'en' ? catMeta.labelEn : catMeta.labelId;
            var statusMeta = ui.getStatusMeta(ev.status);
            var title = ui.getEventTitle(ev, lang);
            return (
              '<article class="agenda-list-row">' +
                '<div class="agenda-list-row__main">' +
                  '<div class="agenda-item__head">' +
                    '<span class="badge badge--cat">' + svc.escapeHtml(catLabel) + '</span>' +
                    '<span class="badge ' + statusMeta.className + '">' + svc.escapeHtml(statusMeta.label) + '</span>' +
                  '</div>' +
                  '<h3 class="agenda-item__title">' + svc.escapeHtml(title) + '</h3>' +
                  '<p class="agenda-item__meta">' +
                    svc.escapeHtml(svc.formatDisplayDateRange(ev, lang)) + ' &middot; ' +
                    svc.escapeHtml(ev.location || ui.t('locationTba')) +
                  '</p>' +
                '</div>' +
                '<div class="agenda-item__actions">' +
                  '<a class="btn btn-accent btn-compact" href="' + svc.escapeHtml(ui.getDetailHref(ev)) + '">' + svc.escapeHtml(ui.t('viewDetails')) + '</a>' +
                  '<a class="btn btn-outline btn-compact" href="' + svc.escapeHtml(ics.buildGoogleCalendarAddUrl(ev)) + '" target="_blank" rel="noopener">Google Calendar</a>' +
                '</div>' +
              '</article>'
            );
          })
          .join('') +
      '</div>';
  }

  function renderTimelineView(events) {
    tl.setHandlers(el.calendarMount, {
      onSelectDate: function (dateKey) {
        state.selectedDateKey = dateKey;
        var dt = tl.parseYmd(dateKey);
        state.year = dt.getFullYear();
        state.month = dt.getMonth();
        renderCalendarPage();
      },
      onStepMiniMonth: function (delta) {
        stepMonth(delta);
      },
      onStepRange: function (delta) {
        var stepDays = state.timelineViewMode === 'week' ? delta * 7 : delta;
        var nextKey = tl.addDays(state.selectedDateKey, stepDays);
        var dt = tl.parseYmd(nextKey);
        state.selectedDateKey = nextKey;
        state.year = dt.getFullYear();
        state.month = dt.getMonth();
        renderCalendarPage();
      },
      onSelectToday: function () {
        var now = new Date();
        state.selectedDateKey = svc.toLocalDateKey(now);
        state.year = now.getFullYear();
        state.month = now.getMonth();
        renderCalendarPage();
      },
      onSwitchViewMode: function (mode) {
        state.timelineViewMode = mode === 'day' ? 'day' : 'week';
        renderCalendarPage();
      },
      onToggleSidebar: function (isOpen) {
        state.sidebarExpanded = Boolean(isOpen);
      },
      onToggleCategory: function (catId) {
        state.hiddenCategories[catId] = !state.hiddenCategories[catId];
        renderCalendarPage();
      },
      onSelectEvent: function (eventId) {
        window.location.href = 'event-detail.html?id=' + encodeURIComponent(eventId);
      }
    });

    tl.renderTimeline(el.calendarMount, {
      events: events,
      selectedDateKey: state.selectedDateKey,
      miniYear: state.year,
      miniMonth: state.month,
      viewMode: state.timelineViewMode,
      sidebarExpanded: state.sidebarExpanded,
      hiddenCategories: state.hiddenCategories,
      mode: 'public'
    });
  }

  function syncViewButtons() {
    var mapping = [
      { btn: el.viewGridBtn, key: 'grid' },
      { btn: el.viewTimelineBtn, key: 'timeline' },
      { btn: el.viewListBtn, key: 'list' }
    ];
    mapping.forEach(function (item) {
      if (!item.btn) return;
      var active = state.view === item.key;
      item.btn.classList.toggle('is-active', active);
      item.btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderCalendarPage() {
    if (!state.payload) {
      return;
    }
    var lang = ui.getCurrentLang();
    var events = state.payload.events || [];
    var eventsByDate = groupEventsByDate(events);
    var monthEvents = getEventsForMonth(events, state.year, state.month);

    if (el.monthHeading) {
      el.monthHeading.textContent = formatMonthHeading(state.year, state.month, lang);
    }
    if (el.monthSubtext) {
      el.monthSubtext.textContent = lang === 'en'
        ? monthEvents.length + ' scheduled event(s) in this month.'
        : monthEvents.length + ' agenda kegiatan pada bulan ini.';
    }

    syncViewButtons();
    ui.renderSourceNotice(el.notice, state.payload.source, state.payload.errorMessage, function () {
      loadCalendarEvents(true);
    });

    if (state.view === 'list') {
      renderAgendaListView(monthEvents);
    } else if (state.view === 'timeline') {
      renderTimelineView(events);
    } else {
      renderGridCalendar(eventsByDate);
    }
    renderSelectedDatePanel(eventsByDate);
  }

  function stepMonth(delta) {
    var next = new Date(state.year, state.month + delta, 1);
    state.year = next.getFullYear();
    state.month = next.getMonth();
    state.selectedDateKey = buildDateKey(state.year, state.month, 1);
    renderCalendarPage();
  }

  async function loadCalendarEvents(forceRefresh) {
    ui.renderStatusState(el.calendarMount, {
      type: 'loading',
      title: ui.t('loadingEvents')
    });
    state.payload = await svc.getEvents({ forceRefresh: Boolean(forceRefresh) });

    var monthEvents = getEventsForMonth(state.payload.events, state.year, state.month);
    if (!state.selectedDateKey && monthEvents.length > 0) {
      state.selectedDateKey = monthEvents[0].dateKey;
    }
    renderCalendarPage();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el.calendarMount = document.getElementById('calendar-mount');
    el.agendaPanel = document.getElementById('selected-date-panel');
    el.notice = document.getElementById('calendar-source-notice');
    el.monthHeading = document.getElementById('calendar-month-label');
    el.monthSubtext = document.getElementById('calendar-month-subtext');
    el.prevBtn = document.getElementById('cal-prev-btn');
    el.todayBtn = document.getElementById('cal-today-btn');
    el.nextBtn = document.getElementById('cal-next-btn');
    el.viewGridBtn = document.getElementById('cal-view-grid');
    el.viewTimelineBtn = document.getElementById('cal-view-timeline');
    el.viewListBtn = document.getElementById('cal-view-list');

    if (!el.calendarMount) {
      return;
    }

    if (el.prevBtn) el.prevBtn.addEventListener('click', function () { stepMonth(-1); });
    if (el.nextBtn) el.nextBtn.addEventListener('click', function () { stepMonth(1); });
    if (el.todayBtn) {
      el.todayBtn.addEventListener('click', function () {
        var now = new Date();
        state.year = now.getFullYear();
        state.month = now.getMonth();
        state.selectedDateKey = svc.toLocalDateKey(now);
        renderCalendarPage();
      });
    }

    if (el.viewGridBtn) {
      el.viewGridBtn.addEventListener('click', function () {
        state.view = 'grid';
        renderCalendarPage();
      });
    }
    if (el.viewTimelineBtn) {
      el.viewTimelineBtn.addEventListener('click', function () {
        state.view = 'timeline';
        renderCalendarPage();
      });
    }
    if (el.viewListBtn) {
      el.viewListBtn.addEventListener('click', function () {
        state.view = 'list';
        renderCalendarPage();
      });
    }

    el.calendarMount.addEventListener('click', function (event) {
      var target = event.target.closest('[data-date]');
      if (!target) {
        return;
      }
      state.selectedDateKey = target.getAttribute('data-date') || '';
      renderCalendarPage();
    });

    if (el.agendaPanel) {
      el.agendaPanel.addEventListener('click', function (event) {
        var openTl = event.target.closest('button[data-open-timeline]');
        if (openTl) {
          state.view = 'timeline';
          renderCalendarPage();
          return;
        }
        var icsBtn = event.target.closest('button[data-ics-id]');
        if (!icsBtn || !state.payload) {
          return;
        }
        var id = icsBtn.getAttribute('data-ics-id');
        var found = state.payload.events.find(function (item) {
          return String(item.id) === String(id);
        });
        if (found) {
          ics.downloadEventIcs(found);
        }
      });
    }

    window.addEventListener('portal:langchange', renderCalendarPage);
    loadCalendarEvents(false);
  });
})();
