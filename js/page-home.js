// Skrip halaman Beranda (index.html): menampilkan 3 event terdekat di bagian Event Unggulan.

window.PortalKampus = window.PortalKampus || {};

(function () {
  var svc = window.PortalKampus.calendarService;
  var ui = window.PortalKampus.ui;

  var gridEl = null;
  var noticeEl = null;
  var lastPayload = null;

  function pickFeaturedEvents(events) {
    var upcoming = events.filter(function (ev) {
      return ev.status !== 'closed';
    });
    if (upcoming.length >= 3) {
      return upcoming.slice(0, 3);
    }
    var remaining = events.filter(function (ev) {
      return ev.status === 'closed';
    });
    return upcoming.concat(remaining).slice(0, 3);
  }

  function renderHomeEvents() {
    if (!gridEl || !lastPayload) {
      return;
    }
    var lang = ui.getCurrentLang();
    var featured = pickFeaturedEvents(lastPayload.events);

    ui.renderSourceNotice(noticeEl, lastPayload.source, lastPayload.errorMessage, loadHomeEvents);

    if (featured.length === 0) {
      gridEl.innerHTML = '';
      var emptyWrap = document.getElementById('home-events-state');
      ui.renderStatusState(emptyWrap, {
        type: 'empty',
        title: ui.t('noEventsInMonth'),
        message: lang === 'en'
          ? 'No campus events are currently available in the schedule.'
          : 'Belum ada jadwal event kampus yang tersedia saat ini.'
      });
      return;
    }

    var stateWrap = document.getElementById('home-events-state');
    if (stateWrap) {
      stateWrap.innerHTML = '';
    }

    var delays = ['card-anim card-d1', 'card-anim card-d2', 'card-anim card-d3'];
    gridEl.innerHTML = featured
      .map(function (ev, idx) {
        return ui.renderEventCard(ev, { lang: lang, animClass: delays[idx] || 'card-anim' });
      })
      .join('');
    ui.attachImageFallbacks(gridEl);
  }

  async function loadHomeEvents() {
    var stateWrap = document.getElementById('home-events-state');
    if (stateWrap) {
      ui.renderStatusState(stateWrap, {
        type: 'loading',
        title: ui.t('loadingEvents')
      });
    }
    lastPayload = await svc.getEvents({ forceRefresh: Boolean(lastPayload) });
    renderHomeEvents();
  }

  document.addEventListener('DOMContentLoaded', function () {
    gridEl = document.getElementById('featured-events-grid');
    noticeEl = document.getElementById('home-source-notice');
    if (!gridEl) {
      return;
    }
    loadHomeEvents();
    window.addEventListener('portal:langchange', renderHomeEvents);
  });
})();
