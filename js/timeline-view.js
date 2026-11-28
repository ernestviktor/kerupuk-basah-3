// DI BUAT MENGGUNAKAN AI // 

// Komponen Timeline Minggu/Hari bergaya Google Calendar (dipakai bersama oleh calendar.html dan admin.html).
// Junior developer dapat mengubah rentang jam dan kelipatan snap drag di js/config.js (CONFIG.timeline).

window.PortalKampus = window.PortalKampus || {};

(function () {
  var CONFIG = window.PortalKampus.CONFIG;
  var svc = window.PortalKampus.calendarService;
  var ui = window.PortalKampus.ui;

  function padTwo(n) {
    return String(n).padStart(2, '0');
  }

  function buildDateKey(year, month, day) {
    return year + '-' + padTwo(month + 1) + '-' + padTwo(day);
  }

  function parseYmd(dateKey) {
    var parts = String(dateKey || '').split('-');
    if (parts.length !== 3) {
      return new Date();
    }
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function addDays(dateKey, deltaDays) {
    var dt = parseYmd(dateKey);
    dt.setDate(dt.getDate() + deltaDays);
    return buildDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  function formatMinutesClock(totalMinutes) {
    var clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
    var h = Math.floor(clamped / 60);
    var m = clamped % 60;
    return padTwo(h) + '.' + padTwo(m);
  }

  function formatMinutesColon(totalMinutes) {
    var clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
    return padTwo(Math.floor(clamped / 60)) + ':' + padTwo(clamped % 60);
  }

  function snapMinutes(rawMinutes, step) {
    var interval = Math.max(5, step || 15);
    return Math.round(rawMinutes / interval) * interval;
  }

  function getVisibleDates(selectedDateKey, viewMode, lang) {
    var locale = lang === 'en' ? 'en-US' : 'id-ID';
    var todayKey = svc.toLocalDateKey(new Date());
    var anchor = parseYmd(selectedDateKey);
    var startDate = new Date(anchor.getTime());
    var count = viewMode === 'week' ? 7 : 1;

    if (viewMode === 'week') {
      // Mulai minggu dari hari Senin agar sejajar dengan header kalender mini dan kalender bulanan.
      var mondayOffset = (anchor.getDay() + 6) % 7;
      startDate.setDate(anchor.getDate() - mondayOffset);
    }

    var list = [];
    for (var i = 0; i < count; i++) {
      var d = new Date(startDate.getTime());
      d.setDate(startDate.getDate() + i);
      var dk = buildDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      list.push({
        dateKey: dk,
        dateObj: d,
        dayNum: d.getDate(),
        weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d).toUpperCase(),
        isToday: dk === todayKey,
        isSelected: dk === selectedDateKey
      });
    }
    return list;
  }

  function formatRangeHeading(visibleDates, viewMode, lang) {
    var locale = lang === 'en' ? 'en-US' : 'id-ID';
    if (visibleDates.length === 1) {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(visibleDates[0].dateObj);
    }

    var first = visibleDates[0].dateObj;
    var last = visibleDates[visibleDates.length - 1].dateObj;
    var sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
    if (sameMonth) {
      var monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(first);
      return first.getDate() + ' - ' + last.getDate() + ' ' + monthYear;
    }

    var fLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(first);
    var lLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(last);
    return fLabel + ' - ' + lLabel;
  }

  function computeDayTimedLayout(events, dateKey) {
    var dayStartMs = parseYmd(dateKey).getTime();
    var timed = [];

    events.forEach(function (ev) {
      if (!ev || ev.isAllDay || ev.dateKey !== dateKey) {
        return;
      }
      var start = new Date(ev.startIso);
      var end = new Date(ev.endIso || ev.startIso);
      if (Number.isNaN(start.getTime())) {
        return;
      }
      var startMin = Math.max(0, Math.round((start.getTime() - dayStartMs) / 60000));
      var endMin = Math.min(24 * 60, Math.round((end.getTime() - dayStartMs) / 60000));
      if (Number.isNaN(endMin) || endMin <= startMin) {
        endMin = Math.min(24 * 60, startMin + 60);
      }
      timed.push({
        event: ev,
        startMin: startMin,
        endMin: endMin,
        colIdx: 0,
        maxCols: 1,
        isOverlap: false
      });
    });

    timed.sort(function (a, b) {
      if (a.startMin !== b.startMin) {
        return a.startMin - b.startMin;
      }
      return b.endMin - a.endMin;
    });

    // Kelompokkan jadwal yang bertabrakan waktunya ke dalam kluster agar bisa ditata berdampingan.
    var clusters = [];
    var currentCluster = [];
    var clusterEnd = -1;

    timed.forEach(function (item) {
      if (currentCluster.length === 0 || item.startMin < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMin;
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    var overlapCount = 0;
    clusters.forEach(function (cluster) {
      var colEnds = [];
      cluster.forEach(function (item) {
        var assigned = -1;
        for (var c = 0; c < colEnds.length; c++) {
          if (colEnds[c] <= item.startMin) {
            assigned = c;
            break;
          }
        }
        if (assigned === -1) {
          assigned = colEnds.length;
          colEnds.push(item.endMin);
        } else {
          colEnds[assigned] = item.endMin;
        }
        item.colIdx = assigned;
      });

      var totalCols = Math.max(1, colEnds.length);
      cluster.forEach(function (item) {
        item.maxCols = totalCols;
        item.isOverlap = totalCols > 1;
        if (item.isOverlap) {
          overlapCount += 1;
        }
      });
    });

    return { items: timed, overlapCount: overlapCount };
  }

  function renderMiniCalendar(year, month, selectedDateKey, visibleDateSet, eventDateSet, viewMode, lang) {
    var locale = lang === 'en' ? 'en-US' : 'id-ID';
    var monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
    var shortDays = lang === 'en'
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

    var firstDay = new Date(year, month, 1);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startOffset = (firstDay.getDay() + 6) % 7;
    var todayKey = svc.toLocalDateKey(new Date());

    var cellsHtml = '';
    for (var b = 0; b < startOffset; b++) {
      cellsHtml += '<span class="mini-cal-blank" aria-hidden="true"></span>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dk = buildDateKey(year, month, d);
      var classes = ['mini-cal-day'];
      if (viewMode === 'week' && visibleDateSet[dk]) classes.push('is-in-week');
      if (dk === selectedDateKey) classes.push('is-selected');
      if (dk === todayKey) classes.push('is-today');
      if (eventDateSet[dk]) classes.push('has-events');
      cellsHtml +=
        '<button type="button" class="' + classes.join(' ') + '" data-mini-date="' + dk + '" aria-pressed="' + (dk === selectedDateKey ? 'true' : 'false') + '">' +
          '<span>' + d + '</span>' +
          (eventDateSet[dk] ? '<span class="mini-cal-dot" aria-hidden="true"></span>' : '') +
        '</button>';
    }

    return (
      '<section class="tl-mini-cal" aria-label="' + (lang === 'en' ? 'Mini month calendar' : 'Kalender mini') + '">' +
        '<div class="tl-mini-cal__head">' +
          '<span class="tl-mini-cal__title">' + svc.escapeHtml(monthLabel) + '</span>' +
          '<div class="tl-mini-cal__nav">' +
            '<button type="button" class="tl-icon-btn" data-mini-nav="-1" aria-label="' + (lang === 'en' ? 'Previous month' : 'Bulan sebelumnya') + '">&lsaquo;</button>' +
            '<button type="button" class="tl-icon-btn" data-mini-nav="1" aria-label="' + (lang === 'en' ? 'Next month' : 'Bulan berikutnya') + '">&rsaquo;</button>' +
          '</div>' +
        '</div>' +
        '<div class="tl-mini-cal__weekdays">' +
          shortDays.map(function (wd) { return '<span>' + wd + '</span>'; }).join('') +
        '</div>' +
        '<div class="tl-mini-cal__grid">' + cellsHtml + '</div>' +
      '</section>'
    );
  }

  function renderCategoryLegend(events, hiddenCategories, overlapCount, lang) {
    var activeCats = {};
    events.forEach(function (ev) {
      activeCats[ev.category] = (activeCats[ev.category] || 0) + 1;
    });

    var rowsHtml = CONFIG.categories
      .filter(function (cat) {
        return cat.id !== 'umum' || activeCats.umum;
      })
      .map(function (cat) {
        var checked = !hiddenCategories[cat.id];
        var label = lang === 'en' ? cat.labelEn : cat.labelId;
        var count = activeCats[cat.id] || 0;
        return (
          '<label class="tl-legend-item">' +
            '<input type="checkbox" data-legend-cat="' + svc.escapeHtml(cat.id) + '"' + (checked ? ' checked' : '') + '>' +
            '<span class="tl-legend-swatch tl-swatch--' + svc.escapeHtml(cat.id) + '" aria-hidden="true"></span>' +
            '<span class="tl-legend-label">' + svc.escapeHtml(label) + '</span>' +
            '<span class="tl-legend-count">' + count + '</span>' +
          '</label>'
        );
      })
      .join('');

    var overlapLabel = lang === 'en'
      ? 'Schedule Overlap (' + overlapCount + ')'
      : 'Jadwal Bentrok / Overlap (' + overlapCount + ')';

    return (
      '<section class="tl-legend-box" aria-label="' + (lang === 'en' ? 'Category filter' : 'Filter kategori jadwal') + '">' +
        '<h3 class="tl-legend-title">' + (lang === 'en' ? 'Categories' : 'Kategori Agenda') + '</h3>' +
        '<div class="tl-legend-list">' + rowsHtml + '</div>' +
        '<div class="tl-overlap-legend' + (overlapCount > 0 ? ' is-alert' : '') + '">' +
          '<span class="tl-legend-swatch tl-swatch--overlap" aria-hidden="true"></span>' +
          '<span>' + svc.escapeHtml(overlapLabel) + '</span>' +
        '</div>' +
      '</section>'
    );
  }

  function renderEventWrapHtml(item, startHour, hourHeight, boardHeight, isAdmin, lang) {
    var ev = item.event;
    var topPx = ((item.startMin - startHour * 60) / 60) * hourHeight;
    var rawHeight = ((item.endMin - item.startMin) / 60) * hourHeight;
    var heightPx = Math.max(28, Math.min(boardHeight - topPx, rawHeight));
    var widthPct = 100 / item.maxCols;
    var leftPct = item.colIdx * widthPct;
    var title = ui.getEventTitle(ev, lang);
    var timeRange = formatMinutesClock(item.startMin) + ' - ' + formatMinutesClock(item.endMin);
    var isCompact = heightPx < 48;
    var metaParts = [timeRange];
    if (ev.location && !isCompact) {
      metaParts.push(ev.location);
    }
    var flagsHtml = '';
    if (!isCompact && (ev.isLocalDraft || item.isOverlap)) {
      flagsHtml =
        '<span class="tl-event-card__badges">' +
          (ev.isLocalDraft ? '<span class="tl-tag tl-tag--draft">' + svc.escapeHtml(ui.t('localDraftBadge')) + '</span>' : '') +
          (item.isOverlap ? '<span class="tl-tag tl-tag--overlap">' + svc.escapeHtml(ui.t('overlapLabel')) + '</span>' : '') +
        '</span>';
    }

    return (
      '<div class="tl-event-wrap" data-event-wrap-id="' + svc.escapeHtml(ev.id) + '" ' +
      'style="top:' + topPx + 'px;height:' + heightPx + 'px;left:calc(' + leftPct + '% + 2px);width:calc(' + widthPct + '% - 4px);">' +
        '<button type="button" class="tl-event-card tl-cat--' + svc.escapeHtml(ev.category) +
        (item.isOverlap ? ' is-overlap' : '') +
        (ev.isLocalDraft ? ' is-draft' : '') +
        (isCompact ? ' is-compact' : '') + '" ' +
        'data-tl-event-id="' + svc.escapeHtml(ev.id) + '" ' +
        'data-date-key="' + svc.escapeHtml(ev.dateKey) + '" ' +
        'data-start-min="' + item.startMin + '" ' +
        'data-end-min="' + item.endMin + '">' +
          '<strong class="tl-event-card__title">' + svc.escapeHtml(title) + '</strong>' +
          '<span class="tl-event-card__meta">' + svc.escapeHtml(metaParts.join(' · ')) + '</span>' +
          flagsHtml +
        '</button>' +
        (isAdmin
          ? '<span class="tl-event-resize" data-resize-event-id="' + svc.escapeHtml(ev.id) + '" ' +
            'title="' + (lang === 'en' ? 'Drag to change duration' : 'Tarik untuk ubah durasi') + '" aria-hidden="true"></span>'
          : '') +
      '</div>'
    );
  }

  function renderActiveSelectionGhost(selection, dateKey, startHour, hourHeight, boardHeight, lang) {
    if (!selection || selection.dateKey !== dateKey) {
      return '';
    }
    var topPx = ((selection.startMin - startHour * 60) / 60) * hourHeight;
    var heightPx = Math.max(15, Math.min(boardHeight - topPx, ((selection.endMin - selection.startMin) / 60) * hourHeight));
    var rangeText = formatMinutesClock(selection.startMin) + ' - ' + formatMinutesClock(selection.endMin);
    return (
      '<div class="tl-drag-ghost is-locked" style="top:' + topPx + 'px;height:' + heightPx + 'px;">' +
        '<span class="tl-drag-ghost__title">' + (lang === 'en' ? 'New Event' : 'Event Baru') + '</span>' +
        '<span class="tl-drag-ghost__time">' + svc.escapeHtml(rangeText) + '</span>' +
      '</div>'
    );
  }

  function renderTimeline(container, options) {
    if (!container) {
      return;
    }

    // Simpan posisi scroll agar grid tidak melompat kembali ke atas saat event dipindahkan atau diubah ukurannya.
    var prevScrollEl = container.querySelector('.tl-grid-scroll');
    var prevScrollTop = prevScrollEl ? prevScrollEl.scrollTop : null;
    var prevScrollLeft = prevScrollEl ? prevScrollEl.scrollLeft : 0;

    var opts = options || {};
    var lang = ui.getCurrentLang();
    var isAdmin = opts.mode === 'admin';
    var viewMode = opts.viewMode === 'day' ? 'day' : 'week';
    var allEvents = Array.isArray(opts.events) ? opts.events : [];
    var hidden = opts.hiddenCategories || {};
    var selectedDateKey = opts.selectedDateKey || svc.toLocalDateKey(new Date());

    var filteredEvents = allEvents.filter(function (ev) {
      return ev && !hidden[ev.category];
    });

    var eventDateSet = {};
    var eventsById = {};
    filteredEvents.forEach(function (ev) {
      eventsById[String(ev.id)] = ev;
      if (ev.dateKey) {
        eventDateSet[ev.dateKey] = true;
      }
    });

    var visibleDates = getVisibleDates(selectedDateKey, viewMode, lang);
    var visibleDateSet = {};
    visibleDates.forEach(function (d) {
      visibleDateSet[d.dateKey] = true;
    });

    var tlCfg = CONFIG.timeline || { startHour: 7, endHour: 22, hourHeightPx: 60, snapMinutes: 15, defaultDurationMinutes: 60 };
    var startHour = tlCfg.startHour;
    var endHour = tlCfg.endHour;
    var hourHeight = tlCfg.hourHeightPx || 60;
    var snapStep = tlCfg.snapMinutes || 15;
    var defaultDuration = tlCfg.defaultDurationMinutes || 60;

    var dayLayouts = {};
    var totalOverlapCount = 0;
    var totalVisibleEvents = 0;
    var totalAllDayVisible = 0;

    visibleDates.forEach(function (dayInfo) {
      var layout = computeDayTimedLayout(filteredEvents, dayInfo.dateKey);
      dayLayouts[dayInfo.dateKey] = layout;
      totalOverlapCount += layout.overlapCount;
      totalVisibleEvents += layout.items.length;
      layout.items.forEach(function (item) {
        startHour = Math.min(startHour, Math.floor(item.startMin / 60));
        endHour = Math.max(endHour, Math.ceil(item.endMin / 60));
      });
    });

    var allDayByDate = {};
    filteredEvents.forEach(function (ev) {
      if (ev.isAllDay && visibleDateSet[ev.dateKey]) {
        if (!allDayByDate[ev.dateKey]) {
          allDayByDate[ev.dateKey] = [];
        }
        allDayByDate[ev.dateKey].push(ev);
        totalAllDayVisible += 1;
      }
    });

    var totalHours = Math.max(1, endHour - startHour);
    var boardHeight = totalHours * hourHeight;
    var rangeHeading = formatRangeHeading(visibleDates, viewMode, lang);
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var showNowLine = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
    var nowTopPx = ((nowMinutes - startHour * 60) / 60) * hourHeight;

    var colHeadersHtml = visibleDates
      .map(function (dayInfo) {
        return (
          '<div class="tl-col-head' + (dayInfo.isToday ? ' is-today' : '') + (dayInfo.isSelected ? ' is-selected' : '') + '">' +
            '<button type="button" class="tl-col-head__date" data-mini-date="' + dayInfo.dateKey + '">' +
              '<span class="tl-day-weekday">' + svc.escapeHtml(dayInfo.weekdayShort) + '</span>' +
              '<span class="tl-col-head__num">' + dayInfo.dayNum + '</span>' +
            '</button>' +
            (isAdmin
              ? '<button type="button" class="tl-col-head__add" data-quick-day="' + dayInfo.dateKey + '" ' +
                'aria-label="' + svc.escapeHtml((lang === 'en' ? 'Add event on ' : 'Tambah event pada ') + dayInfo.dateKey) + '" ' +
                'title="' + (lang === 'en' ? 'Add event' : 'Tambah event') + '">+</button>'
              : '') +
          '</div>'
        );
      })
      .join('');

    var showAllDayRow = isAdmin || totalAllDayVisible > 0;
    var allDayRowHtml = '';
    if (showAllDayRow) {
      var allDayCellsHtml = visibleDates
        .map(function (dayInfo) {
          var pills = (allDayByDate[dayInfo.dateKey] || [])
            .map(function (ev) {
              return (
                '<button type="button" class="tl-allday-pill tl-cat--' + svc.escapeHtml(ev.category) +
                (ev.isLocalDraft ? ' is-draft' : '') + '" data-tl-event-id="' + svc.escapeHtml(ev.id) + '">' +
                  svc.escapeHtml(ui.getEventTitle(ev, lang)) +
                '</button>'
              );
            })
            .join('');

          return (
            '<div class="tl-allday-cell" data-allday-date="' + dayInfo.dateKey + '">' +
              pills +
              (isAdmin && !pills
                ? '<button type="button" class="tl-allday-add-btn" data-allday-slot="' + dayInfo.dateKey + '" ' +
                  'aria-label="' + svc.escapeHtml((lang === 'en' ? 'Add all-day event on ' : 'Tambah event sepanjang hari pada ') + dayInfo.dateKey) + '">+</button>'
                : '') +
            '</div>'
          );
        })
        .join('');

      allDayRowHtml =
        '<div class="tl-allday-row">' +
          '<div class="tl-gutter-corner tl-allday-label">' + svc.escapeHtml(ui.t('allDayLabel')) + '</div>' +
          '<div class="tl-allday-cols tl-cols--' + viewMode + '">' + allDayCellsHtml + '</div>' +
        '</div>';
    }

    var timeLabelsHtml = '';
    var hourGuideRowsHtml = '';
    for (var h = startHour; h < endHour; h++) {
      var clockLabel = padTwo(h) + ':00';
      timeLabelsHtml +=
        '<div class="tl-time-label" style="height:' + hourHeight + 'px">' +
          '<span>' + clockLabel + '</span>' +
        '</div>';
      hourGuideRowsHtml += '<div class="tl-hour-guide" style="height:' + hourHeight + 'px"></div>';
    }

    var dayColumnsHtml = visibleDates
      .map(function (dayInfo) {
        var layout = dayLayouts[dayInfo.dateKey];
        var blocksHtml = layout.items
          .map(function (item) {
            return renderEventWrapHtml(item, startHour, hourHeight, boardHeight, isAdmin, lang);
          })
          .join('');
        var selectionHtml = renderActiveSelectionGhost(opts.activeSelection, dayInfo.dateKey, startHour, hourHeight, boardHeight, lang);
        var nowLineHtml = dayInfo.isToday && showNowLine
          ? '<div class="tl-now-line" style="top:' + nowTopPx + 'px" aria-hidden="true"><span class="tl-now-dot"></span></div>'
          : '';

        return (
          '<div class="tl-day-col' + (dayInfo.isToday ? ' is-today' : '') + (isAdmin ? ' is-interactive' : '') + '" ' +
          'data-day-col="' + dayInfo.dateKey + '" style="height:' + boardHeight + 'px">' +
            '<div class="tl-day-guides" aria-hidden="true">' + hourGuideRowsHtml + '</div>' +
            nowLineHtml +
            selectionHtml +
            '<div class="tl-day-events">' + blocksHtml + '</div>' +
          '</div>'
        );
      })
      .join('');

    var emptyHintHtml = '';
    if (totalVisibleEvents === 0 && totalAllDayVisible === 0) {
      emptyHintHtml =
        '<div class="tl-empty-bar" role="status">' +
          '<span>' + svc.escapeHtml(isAdmin ? ui.t('timelineEmptyRange') : ui.t('timelineEmptyPublic')) + '</span>' +
        '</div>';
    }

    var sidebarExpanded = opts.sidebarExpanded !== false;

    container.innerHTML =
      '<div class="timeline-shell">' +
        '<aside class="timeline-sidebar">' +
          (isAdmin
            ? '<button type="button" class="btn btn-accent tl-create-btn" data-tl-create="1">' +
                svc.escapeHtml(ui.t('createEventBtn')) +
              '</button>'
            : '') +
          '<button type="button" class="btn btn-outline btn-compact tl-sidebar-toggle" data-tl-sidebar-toggle="1" ' +
          'aria-expanded="' + (sidebarExpanded ? 'true' : 'false') + '">' +
            (lang === 'en' ? 'Mini Calendar & Filters' : 'Kalender Mini & Filter') +
          '</button>' +
          '<div class="tl-sidebar-panels' + (sidebarExpanded ? ' is-open' : '') + '">' +
            renderMiniCalendar(opts.miniYear, opts.miniMonth, selectedDateKey, visibleDateSet, eventDateSet, viewMode, lang) +
            renderCategoryLegend(allEvents, hidden, totalOverlapCount, lang) +
          '</div>' +
        '</aside>' +
        '<div class="timeline-board">' +
          '<div class="tl-board-header">' +
            '<div class="tl-day-nav">' +
              '<button type="button" class="btn btn-outline btn-compact" data-range-step="-1" aria-label="' + (lang === 'en' ? 'Previous period' : 'Periode sebelumnya') + '">&lsaquo;</button>' +
              '<button type="button" class="btn btn-outline btn-compact" data-day-today="1">' + svc.escapeHtml(lang === 'en' ? 'Today' : 'Hari Ini') + '</button>' +
              '<button type="button" class="btn btn-outline btn-compact" data-range-step="1" aria-label="' + (lang === 'en' ? 'Next period' : 'Periode berikutnya') + '">&rsaquo;</button>' +
              '<span class="tl-range-heading">' + svc.escapeHtml(rangeHeading) + '</span>' +
            '</div>' +
            '<div class="tl-view-switch" role="group" aria-label="' + (lang === 'en' ? 'Calendar view mode' : 'Mode tampilan kalender') + '">' +
              '<button type="button" class="btn btn-compact' + (viewMode === 'day' ? ' is-active' : '') + '" data-tl-view="day" aria-pressed="' + (viewMode === 'day' ? 'true' : 'false') + '">' +
                svc.escapeHtml(ui.t('viewDay')) +
              '</button>' +
              '<button type="button" class="btn btn-compact' + (viewMode === 'week' ? ' is-active' : '') + '" data-tl-view="week" aria-pressed="' + (viewMode === 'week' ? 'true' : 'false') + '">' +
                svc.escapeHtml(ui.t('viewWeek')) +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tl-board-subbar">' +
            '<p class="tl-board-hint">' + svc.escapeHtml(isAdmin ? ui.t('dragHintAdmin') : ui.t('dragHintPublic')) + '</p>' +
          '</div>' +
          emptyHintHtml +
          '<div class="tl-grid-scroll">' +
            '<div class="tl-grid-canvas tl-canvas--' + viewMode + '">' +
              '<div class="tl-sticky-top">' +
                '<div class="tl-header-row">' +
                  '<div class="tl-gutter-corner tl-tz-label">WIB</div>' +
                  '<div class="tl-col-headers tl-cols--' + viewMode + '">' + colHeadersHtml + '</div>' +
                '</div>' +
                allDayRowHtml +
              '</div>' +
              '<div class="tl-grid-body" style="height:' + boardHeight + 'px">' +
                '<div class="tl-time-gutter">' + timeLabelsHtml + '</div>' +
                '<div class="tl-day-columns tl-cols--' + viewMode + '">' + dayColumnsHtml + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var newScrollEl = container.querySelector('.tl-grid-scroll');
    if (newScrollEl) {
      if (prevScrollTop !== null) {
        newScrollEl.scrollTop = prevScrollTop;
        newScrollEl.scrollLeft = prevScrollLeft;
      } else if (showNowLine) {
        newScrollEl.scrollTop = Math.max(0, nowTopPx - hourHeight * 2);
      } else {
        newScrollEl.scrollTop = Math.max(0, (8 - startHour) * hourHeight);
      }
    }

    container._tlMeta = {
      isAdmin: isAdmin,
      viewMode: viewMode,
      startHour: startHour,
      endHour: endHour,
      hourHeight: hourHeight,
      snapMinutes: snapStep,
      defaultDuration: defaultDuration,
      eventsById: eventsById
    };

    if (!container._tlBound) {
      container._tlBound = true;
      bindTimelineInteractions(container);
    }
  }

  function pointerToMinutes(clientY, colEl, meta) {
    var rect = colEl.getBoundingClientRect();
    var relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    var rawMin = meta.startHour * 60 + (relY / meta.hourHeight) * 60;
    return snapMinutes(rawMin, meta.snapMinutes);
  }

  function findColumnAtX(container, clientX) {
    var cols = container.querySelectorAll('.tl-day-col');
    for (var i = 0; i < cols.length; i++) {
      var r = cols[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) {
        return cols[i];
      }
    }
    if (cols.length > 0) {
      var firstRect = cols[0].getBoundingClientRect();
      return clientX < firstRect.left ? cols[0] : cols[cols.length - 1];
    }
    return null;
  }

  function createGhostEl(extraClass) {
    var ghost = document.createElement('div');
    ghost.className = 'tl-drag-ghost' + (extraClass ? ' ' + extraClass : '');
    ghost.innerHTML =
      '<span class="tl-drag-ghost__title"></span>' +
      '<span class="tl-drag-ghost__time"></span>';
    return ghost;
  }

  function updateGhostBox(ghost, colEl, startMin, endMin, meta, titleText) {
    if (!ghost || !colEl) {
      return;
    }
    if (ghost.parentNode !== colEl) {
      colEl.appendChild(ghost);
    }
    var minFloor = meta.startHour * 60;
    var maxCeil = meta.endHour * 60;
    var clampedStart = Math.max(minFloor, Math.min(maxCeil - meta.snapMinutes, startMin));
    var clampedEnd = Math.max(clampedStart + meta.snapMinutes, Math.min(maxCeil, endMin));
    var topPx = ((clampedStart - minFloor) / 60) * meta.hourHeight;
    var heightPx = Math.max(20, ((clampedEnd - clampedStart) / 60) * meta.hourHeight);

    ghost.style.top = topPx + 'px';
    ghost.style.height = heightPx + 'px';

    var titleEl = ghost.querySelector('.tl-drag-ghost__title');
    var timeEl = ghost.querySelector('.tl-drag-ghost__time');
    if (titleEl) titleEl.textContent = titleText || '';
    if (timeEl) timeEl.textContent = formatMinutesClock(clampedStart) + ' - ' + formatMinutesClock(clampedEnd);
  }

  function bindTimelineInteractions(container) {
    var suppressNextClick = false;
    var activeDrag = null;
    var lastTouchTap = null;

    function clearActiveDrag() {
      if (!activeDrag) {
        return;
      }
      if (activeDrag.ghost && activeDrag.ghost.parentNode) {
        activeDrag.ghost.parentNode.removeChild(activeDrag.ghost);
      }
      if (activeDrag.sourceWrap) {
        activeDrag.sourceWrap.classList.remove('is-dragging-source');
      }
      document.body.classList.remove('tl-is-dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onDragKeyDown);
      activeDrag = null;
    }

    function onDragKeyDown(e) {
      if (e.key === 'Escape') {
        clearActiveDrag();
      }
    }

    function onPointerCancel() {
      clearActiveDrag();
    }

    function onPointerMove(e) {
      if (!activeDrag) {
        return;
      }
      var meta = container._tlMeta;
      var dist = Math.hypot(e.clientX - activeDrag.startX, e.clientY - activeDrag.startY);
      if (dist >= 6) {
        activeDrag.hasDragged = true;
      }
      if (!activeDrag.hasDragged) {
        return;
      }

      document.body.classList.add('tl-is-dragging');

      if (activeDrag.type === 'create') {
        var curMin = pointerToMinutes(e.clientY, activeDrag.colEl, meta);
        var sMin = Math.min(activeDrag.anchorMin, curMin);
        var eMin = Math.max(activeDrag.anchorMin, curMin);
        if (eMin - sMin < meta.snapMinutes) {
          eMin = sMin + meta.snapMinutes;
        }
        activeDrag.curStartMin = sMin;
        activeDrag.curEndMin = eMin;
        if (!activeDrag.ghost) {
          activeDrag.ghost = createGhostEl('');
        }
        var label = ui.getCurrentLang() === 'en' ? 'New Event' : 'Event Baru';
        updateGhostBox(activeDrag.ghost, activeDrag.colEl, sMin, eMin, meta, label);
      } else if (activeDrag.type === 'move') {
        var hoverCol = findColumnAtX(container, e.clientX) || activeDrag.colEl;
        var pointerMin = pointerToMinutes(e.clientY, hoverCol, meta);
        var duration = activeDrag.origEndMin - activeDrag.origStartMin;
        var minFloor = meta.startHour * 60;
        var maxCeil = meta.endHour * 60;
        var nextStart = snapMinutes(pointerMin - activeDrag.pointerOffsetMin, meta.snapMinutes);
        nextStart = Math.max(minFloor, Math.min(maxCeil - duration, nextStart));

        activeDrag.targetDateKey = hoverCol.getAttribute('data-day-col');
        activeDrag.curStartMin = nextStart;
        activeDrag.curEndMin = nextStart + duration;
        if (activeDrag.sourceWrap) {
          activeDrag.sourceWrap.classList.add('is-dragging-source');
        }
        if (!activeDrag.ghost) {
          activeDrag.ghost = createGhostEl('tl-drag-ghost--move');
        }
        updateGhostBox(activeDrag.ghost, hoverCol, activeDrag.curStartMin, activeDrag.curEndMin, meta, activeDrag.eventTitle);
      } else if (activeDrag.type === 'resize') {
        var curEndMin = pointerToMinutes(e.clientY, activeDrag.colEl, meta);
        var clampedEnd = Math.max(activeDrag.origStartMin + meta.snapMinutes, Math.min(meta.endHour * 60, curEndMin));
        activeDrag.curEndMin = clampedEnd;
        if (activeDrag.sourceWrap) {
          activeDrag.sourceWrap.classList.add('is-dragging-source');
        }
        if (!activeDrag.ghost) {
          activeDrag.ghost = createGhostEl('tl-drag-ghost--move');
        }
        updateGhostBox(activeDrag.ghost, activeDrag.colEl, activeDrag.origStartMin, clampedEnd, meta, activeDrag.eventTitle);
      }
    }

    function onPointerUp(e) {
      if (!activeDrag) {
        return;
      }
      var drag = activeDrag;
      var meta = container._tlMeta;
      var handlers = container._tlHandlers || {};
      clearActiveDrag();

      if (!drag.hasDragged) {
        if (drag.type === 'create' && handlers.onQuickCreateSlot) {
          // Klik tunggal tanpa drag membuka slot standar berdurasi 1 jam tepat pada setengah jam yang diklik.
          var rect = drag.colEl.getBoundingClientRect();
          var relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
          var rawMin = meta.startHour * 60 + (relY / meta.hourHeight) * 60;
          var clickStart = Math.floor(rawMin / 30) * 30;
          var clickEnd = Math.min(meta.endHour * 60, clickStart + meta.defaultDuration);
          handlers.onQuickCreateSlot({
            dateKey: drag.dateKey,
            startMin: clickStart,
            endMin: clickEnd,
            isAllDay: false,
            clientX: e.clientX,
            clientY: e.clientY
          });
        }
        return;
      }

      // Cegah event click bawaan menembak tepat setelah drag selesai.
      suppressNextClick = true;
      window.setTimeout(function () {
        suppressNextClick = false;
      }, 90);

      if (drag.type === 'create' && handlers.onQuickCreateSlot) {
        handlers.onQuickCreateSlot({
          dateKey: drag.dateKey,
          startMin: drag.curStartMin,
          endMin: drag.curEndMin,
          isAllDay: false,
          clientX: e.clientX,
          clientY: e.clientY
        });
      } else if (drag.type === 'move' && handlers.onMoveEvent) {
        if (drag.targetDateKey !== drag.dateKey || drag.curStartMin !== drag.origStartMin) {
          handlers.onMoveEvent({
            eventId: drag.eventId,
            dateKey: drag.targetDateKey,
            startMin: drag.curStartMin,
            endMin: drag.curEndMin
          });
        }
      } else if (drag.type === 'resize' && handlers.onResizeEvent) {
        if (drag.curEndMin !== drag.origEndMin) {
          handlers.onResizeEvent({
            eventId: drag.eventId,
            dateKey: drag.dateKey,
            startMin: drag.origStartMin,
            endMin: drag.curEndMin
          });
        }
      }
    }

    container.addEventListener('pointerdown', function (e) {
      var meta = container._tlMeta || {};
      if (!meta.isAdmin) {
        return;
      }
      if (e.button !== 0 && e.pointerType === 'mouse') {
        return;
      }

      var resizeHandle = e.target.closest('.tl-event-resize');
      if (resizeHandle) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = resizeHandle.closest('.tl-event-wrap');
        var card = wrap ? wrap.querySelector('.tl-event-card') : null;
        var colEl = resizeHandle.closest('.tl-day-col');
        if (!wrap || !card || !colEl) {
          return;
        }
        activeDrag = {
          type: 'resize',
          eventId: resizeHandle.getAttribute('data-resize-event-id'),
          eventTitle: (card.querySelector('.tl-event-card__title') || {}).textContent || '',
          dateKey: colEl.getAttribute('data-day-col'),
          colEl: colEl,
          sourceWrap: wrap,
          origStartMin: Number(card.getAttribute('data-start-min')),
          origEndMin: Number(card.getAttribute('data-end-min')),
          curEndMin: Number(card.getAttribute('data-end-min')),
          startX: e.clientX,
          startY: e.clientY,
          hasDragged: false
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
        window.addEventListener('keydown', onDragKeyDown);
        return;
      }

      // Untuk perangkat sentuh pada area grid/kartu, catat titik sentuh awal agar scroll vertikal tetap lancar.
      if (e.pointerType === 'touch') {
        lastTouchTap = { x: e.clientX, y: e.clientY, time: Date.now() };
        return;
      }
      lastTouchTap = null;

      var eventCard = e.target.closest('.tl-event-card[data-tl-event-id]');
      if (eventCard) {
        var cardWrap = eventCard.closest('.tl-event-wrap');
        var cardCol = eventCard.closest('.tl-day-col');
        if (!cardCol) {
          return;
        }
        var origStart = Number(eventCard.getAttribute('data-start-min'));
        var origEnd = Number(eventCard.getAttribute('data-end-min'));
        var pointerStartMin = pointerToMinutes(e.clientY, cardCol, meta);
        activeDrag = {
          type: 'move',
          eventId: eventCard.getAttribute('data-tl-event-id'),
          eventTitle: (eventCard.querySelector('.tl-event-card__title') || {}).textContent || '',
          dateKey: cardCol.getAttribute('data-day-col'),
          targetDateKey: cardCol.getAttribute('data-day-col'),
          colEl: cardCol,
          sourceWrap: cardWrap,
          origStartMin: origStart,
          origEndMin: origEnd,
          curStartMin: origStart,
          curEndMin: origEnd,
          pointerOffsetMin: pointerStartMin - origStart,
          startX: e.clientX,
          startY: e.clientY,
          hasDragged: false
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
        window.addEventListener('keydown', onDragKeyDown);
        return;
      }

      var dayCol = e.target.closest('.tl-day-col');
      if (dayCol) {
        e.preventDefault();
        var anchorMin = pointerToMinutes(e.clientY, dayCol, meta);
        activeDrag = {
          type: 'create',
          dateKey: dayCol.getAttribute('data-day-col'),
          colEl: dayCol,
          anchorMin: anchorMin,
          curStartMin: anchorMin,
          curEndMin: Math.min(meta.endHour * 60, anchorMin + meta.snapMinutes),
          startX: e.clientX,
          startY: e.clientY,
          hasDragged: false
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
        window.addEventListener('keydown', onDragKeyDown);
      }
    });

    container.addEventListener('click', function (e) {
      if (suppressNextClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      var handlers = container._tlHandlers || {};
      var meta = container._tlMeta || {};

      var createBtn = e.target.closest('button[data-tl-create]');
      if (createBtn && handlers.onCreateButton) {
        handlers.onCreateButton(createBtn);
        return;
      }

      var sidebarToggle = e.target.closest('button[data-tl-sidebar-toggle]');
      if (sidebarToggle) {
        var panels = container.querySelector('.tl-sidebar-panels');
        if (panels) {
          var nextOpen = !panels.classList.contains('is-open');
          panels.classList.toggle('is-open', nextOpen);
          sidebarToggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
          if (handlers.onToggleSidebar) {
            handlers.onToggleSidebar(nextOpen);
          }
        }
        return;
      }

      var miniDateBtn = e.target.closest('button[data-mini-date]');
      if (miniDateBtn && handlers.onSelectDate) {
        handlers.onSelectDate(miniDateBtn.getAttribute('data-mini-date'));
        return;
      }

      var miniNavBtn = e.target.closest('button[data-mini-nav]');
      if (miniNavBtn && handlers.onStepMiniMonth) {
        handlers.onStepMiniMonth(Number(miniNavBtn.getAttribute('data-mini-nav')));
        return;
      }

      var rangeStepBtn = e.target.closest('button[data-range-step]');
      if (rangeStepBtn && handlers.onStepRange) {
        handlers.onStepRange(Number(rangeStepBtn.getAttribute('data-range-step')));
        return;
      }

      var todayBtn = e.target.closest('button[data-day-today]');
      if (todayBtn && handlers.onSelectToday) {
        handlers.onSelectToday();
        return;
      }

      var viewBtn = e.target.closest('button[data-tl-view]');
      if (viewBtn && handlers.onSwitchViewMode) {
        handlers.onSwitchViewMode(viewBtn.getAttribute('data-tl-view'));
        return;
      }

      var quickDayBtn = e.target.closest('button[data-quick-day]');
      if (quickDayBtn && handlers.onQuickCreateSlot) {
        handlers.onQuickCreateSlot({
          dateKey: quickDayBtn.getAttribute('data-quick-day'),
          startMin: 9 * 60,
          endMin: 10 * 60,
          isAllDay: false
        });
        return;
      }

      var allDayBtn = e.target.closest('button[data-allday-slot]');
      if (allDayBtn && handlers.onQuickCreateSlot) {
        handlers.onQuickCreateSlot({
          dateKey: allDayBtn.getAttribute('data-allday-slot'),
          startMin: 9 * 60,
          endMin: 10 * 60,
          isAllDay: true
        });
        return;
      }

      var eventBtn = e.target.closest('button[data-tl-event-id]');
      if (eventBtn && handlers.onSelectEvent) {
        handlers.onSelectEvent(eventBtn.getAttribute('data-tl-event-id'), eventBtn);
        return;
      }

      // Ketukan sentuh pada grid jam langsung membuka pembuatan slot 1 jam di area yang diketuk.
      var isTouchTap = e.pointerType === 'touch' ||
        (lastTouchTap && (Date.now() - lastTouchTap.time) < 600 &&
          Math.hypot(e.clientX - lastTouchTap.x, e.clientY - lastTouchTap.y) < 12);
      if (meta.isAdmin && isTouchTap) {
        lastTouchTap = null;
        var touchedCol = e.target.closest('.tl-day-col');
        if (touchedCol && handlers.onQuickCreateSlot) {
          var rect = touchedCol.getBoundingClientRect();
          var relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
          var rawMin = meta.startHour * 60 + (relY / meta.hourHeight) * 60;
          var touchStart = Math.floor(rawMin / 30) * 30;
          var touchEnd = Math.min(meta.endHour * 60, touchStart + meta.defaultDuration);
          handlers.onQuickCreateSlot({
            dateKey: touchedCol.getAttribute('data-day-col'),
            startMin: touchStart,
            endMin: touchEnd,
            isAllDay: false,
            clientX: e.clientX,
            clientY: e.clientY
          });
        }
      }
    });

    container.addEventListener('change', function (e) {
      var handlers = container._tlHandlers || {};
      var checkbox = e.target.closest('input[data-legend-cat]');
      if (checkbox && handlers.onToggleCategory) {
        handlers.onToggleCategory(checkbox.getAttribute('data-legend-cat'));
      }
    });
  }

  function setHandlers(container, handlers) {
    if (container) {
      container._tlHandlers = handlers || {};
    }
  }

  window.PortalKampus.timelineView = {
    renderTimeline: renderTimeline,
    setHandlers: setHandlers,
    parseYmd: parseYmd,
    addDays: addDays,
    formatMinutesColon: formatMinutesColon,
    formatMinutesClock: formatMinutesClock
  };
})();
