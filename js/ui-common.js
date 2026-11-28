// DI BUAT MENGGUNAKAN AI // 

// Utilitas UI bersama: sinkronisasi bahasa ID/EN, navigasi keyboard, kartu event, dan status data.

window.PortalKampus = window.PortalKampus || {};

(function () {
  var CONFIG = window.PortalKampus.CONFIG;
  var svc = window.PortalKampus.calendarService;

  function getCurrentLang() {
    var enRadio = document.getElementById('lang-en');
    if (enRadio && enRadio.checked) {
      return 'en';
    }
    return 'id';
  }

  function t(key) {
    var lang = getCurrentLang();
    var dict = CONFIG.i18n[lang] || CONFIG.i18n.id;
    return dict[key] || CONFIG.i18n.id[key] || key;
  }

  function applyStoredLanguage() {
    var radioBa = document.getElementById('lang-ba');
    var radioEn = document.getElementById('lang-en');
    if (!radioBa || !radioEn) {
      return;
    }

    try {
      var saved = window.localStorage.getItem(CONFIG.storageKeys.lang);
      if (saved === 'en') {
        radioEn.checked = true;
        document.documentElement.lang = 'en';
      } else if (saved === 'id') {
        radioBa.checked = true;
        document.documentElement.lang = 'id';
      }
    } catch (err) {
      // Abaikan jika localStorage diblokir oleh pengaturan privasi browser.
    }

    function handleLangChange() {
      var activeLang = radioEn.checked ? 'en' : 'id';
      document.documentElement.lang = activeLang;
      try {
        window.localStorage.setItem(CONFIG.storageKeys.lang, activeLang);
      } catch (err) {
        // Abaikan kegagalan penyimpanan lokal.
      }
      window.dispatchEvent(new CustomEvent('portal:langchange', { detail: { lang: activeLang } }));
    }

    radioBa.addEventListener('change', handleLangChange);
    radioEn.addEventListener('change', handleLangChange);
  }

  function setupMobileDrawerAccessibility() {
    var toggle = document.getElementById('nav-drawer-toggle');
    var burger = document.querySelector('.hamburger-btn');
    var drawer = document.querySelector('.mobile-drawer');
    if (!toggle || !burger || !drawer) {
      return;
    }

    function syncExpanded() {
      burger.setAttribute('aria-expanded', toggle.checked ? 'true' : 'false');
    }

    toggle.addEventListener('change', syncExpanded);
    syncExpanded();

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.checked) {
        toggle.checked = false;
        syncExpanded();
        burger.focus();
      }
    });

    drawer.addEventListener('click', function (event) {
      if (event.target && event.target.closest('a')) {
        toggle.checked = false;
        syncExpanded();
      }
    });
  }

  function getStatusMeta(status) {
    if (status === 'closed') {
      return { className: 'badge--closed', label: t('statusClosed') };
    }
    if (status === 'soon') {
      return { className: 'badge--soon', label: t('statusSoon') };
    }
    return { className: 'badge--open', label: t('statusOpen') };
  }

  function getEventTitle(event, lang) {
    if (lang === 'en' && event.titleEn) {
      return event.titleEn;
    }
    return event.title || 'Event Kampus';
  }

  function getEventDescription(event, lang) {
    if (lang === 'en' && event.descriptionEn) {
      return event.descriptionEn;
    }
    return event.description || '';
  }

  function getDetailHref(event) {
    return 'event-detail.html?id=' + encodeURIComponent(event.id);
  }

  // Satu komponen kartu event terpusat agar halaman Beranda, Daftar Event, dan Pratinjau Admin selalu konsisten.
  function renderEventCard(event, options) {
    var opts = options || {};
    var lang = opts.lang || getCurrentLang();
    var catMeta = svc.getCategoryMeta(event.category);
    var catLabel = lang === 'en' ? catMeta.labelEn : catMeta.labelId;
    var statusMeta = getStatusMeta(event.status);
    var title = getEventTitle(event, lang);
    var dateText = svc.formatDisplayDate(event, lang);
    var locationText = event.location || t('locationTba');
    var detailHref = opts.previewOnly ? '#pratinjau-kartu' : getDetailHref(event);
    var animClass = opts.animClass ? ' ' + opts.animClass : '';
    var fallbackPoster = catMeta.defaultPoster;

    return (
      '<article class="event-card' + animClass + '" data-cat="' + svc.escapeHtml(event.category) + '">' +
        '<div class="event-card__media">' +
          '<img src="' + svc.escapeHtml(event.poster) + '" width="720" height="720" ' +
          'alt="' + svc.escapeHtml(event.posterAlt || title) + '" loading="lazy" decoding="async" ' +
          'data-fallback="' + svc.escapeHtml(fallbackPoster) + '">' +
        '</div>' +
        '<div class="event-card__body">' +
          '<div class="event-card__meta">' +
            '<span class="badge badge--cat">' + svc.escapeHtml(catLabel) + '</span>' +
            '<span class="badge ' + statusMeta.className + '">' + svc.escapeHtml(statusMeta.label) + '</span>' +
          '</div>' +
          '<h3 class="event-card__title">' + svc.escapeHtml(title) + '</h3>' +
          '<div class="event-card__info">' +
            '<span>' + svc.escapeHtml(dateText) + '</span>' +
            '<span>' + svc.escapeHtml(locationText) + '</span>' +
          '</div>' +
          '<div class="event-card__cta">' +
            '<a class="btn btn-outline" href="' + svc.escapeHtml(detailHref) + '"' + (opts.previewOnly ? ' tabindex="-1" aria-disabled="true"' : '') + '>' +
              svc.escapeHtml(t('viewDetails')) +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function attachImageFallbacks(root) {
    if (!root) {
      return;
    }
    var images = root.querySelectorAll('img[data-fallback]');
    images.forEach(function (img) {
      img.addEventListener('error', function handleImgError() {
        var fallback = img.getAttribute('data-fallback');
        if (fallback && img.getAttribute('src') !== fallback) {
          img.setAttribute('src', fallback);
        }
      }, { once: true });
    });
  }

  function renderStatusState(container, config) {
    if (!container) {
      return;
    }
    var type = config.type || 'empty';
    var role = type === 'error' ? 'alert' : 'status';
    var actionHtml = '';
    if (config.actionLabel && typeof config.onAction === 'function') {
      actionHtml = '<button class="btn btn-outline ui-state__btn" type="button">' + svc.escapeHtml(config.actionLabel) + '</button>';
    } else if (config.actionLabel && config.actionHref) {
      actionHtml = '<a class="btn btn-outline ui-state__btn" href="' + svc.escapeHtml(config.actionHref) + '">' + svc.escapeHtml(config.actionLabel) + '</a>';
    }

    container.innerHTML =
      '<div class="ui-state ui-state--' + svc.escapeHtml(type) + '" role="' + role + '" aria-live="polite">' +
        '<p class="ui-state__title">' + svc.escapeHtml(config.title || '') + '</p>' +
        (config.message ? '<p class="ui-state__desc">' + svc.escapeHtml(config.message) + '</p>' : '') +
        actionHtml +
      '</div>';

    if (config.actionLabel && typeof config.onAction === 'function') {
      var btn = container.querySelector('.ui-state__btn');
      if (btn) {
        btn.addEventListener('click', config.onAction);
      }
    }
  }

  function renderSourceNotice(container) {
    if (!container) {
      return;
    }
    // Banner status sumber data dinonaktifkan agar tampilan halaman tetap bersih.
    container.innerHTML = '';
    container.hidden = true;
  }

  // Aktifkan interaksi tahan-logo 2 detik di header dengan indikator progress sepanjang border logo.
  function setupLogoAdminHold() {
    var brand = document.querySelector('.site-header .brand-mark');
    if (!brand || brand.getAttribute('data-hold-init') === '1') {
      return;
    }
    brand.setAttribute('data-hold-init', '1');

    var svgNs = 'http://www.w3.org/2000/svg';
    var ringSvg = document.createElementNS(svgNs, 'svg');
    ringSvg.setAttribute('class', 'brand-hold-ring');
    ringSvg.setAttribute('aria-hidden', 'true');

    var trackRect = document.createElementNS(svgNs, 'rect');
    trackRect.setAttribute('class', 'brand-hold-ring__track');
    trackRect.setAttribute('pathLength', '100');

    var progressRect = document.createElementNS(svgNs, 'rect');
    progressRect.setAttribute('class', 'brand-hold-ring__progress');
    progressRect.setAttribute('pathLength', '100');

    ringSvg.appendChild(trackRect);
    ringSvg.appendChild(progressRect);
    brand.appendChild(ringSvg);

    var HOLD_MS = 2000;
    var SHORT_CLICK_LIMIT_MS = 380;
    var MOVE_CANCEL_PX = 14;
    var rafId = 0;
    var startTime = 0;
    var startX = 0;
    var startY = 0;
    var isHolding = false;
    var suppressNextClick = false;
    var activeKey = '';

    function syncRingGeometry() {
      var r = ringSvg.getBoundingClientRect();
      var w = Math.max(40, r.width);
      var h = Math.max(40, r.height);
      ringSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      [trackRect, progressRect].forEach(function (rect) {
        rect.setAttribute('x', '1');
        rect.setAttribute('y', '1');
        rect.setAttribute('width', String(Math.max(10, w - 2)));
        rect.setAttribute('height', String(Math.max(10, h - 2)));
        rect.setAttribute('rx', '9.5');
        rect.setAttribute('ry', '9.5');
      });
    }

    function cancelHold(shouldSuppressClick) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (isHolding && shouldSuppressClick && performance.now() - startTime >= SHORT_CLICK_LIMIT_MS) {
        suppressNextClick = true;
      }
      isHolding = false;
      activeKey = '';
      brand.classList.remove('is-holding');
      progressRect.style.strokeDashoffset = '100';
    }

    function completeHold() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      isHolding = false;
      activeKey = '';
      suppressNextClick = true;
      progressRect.style.strokeDashoffset = '0';
      brand.classList.remove('is-holding');
      brand.classList.add('is-hold-complete');
      window.setTimeout(function () {
        window.location.href = 'admin.html';
      }, 90);
    }

    function tick(now) {
      if (!isHolding) {
        return;
      }
      var elapsed = now - startTime;
      var ratio = Math.min(1, elapsed / HOLD_MS);
      progressRect.style.strokeDashoffset = String(Math.max(0, 100 - ratio * 100));
      if (ratio >= 1) {
        completeHold();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function beginHold(x, y) {
      if (isHolding) {
        return;
      }
      syncRingGeometry();
      suppressNextClick = false;
      isHolding = true;
      startTime = performance.now();
      startX = x;
      startY = y;
      progressRect.style.strokeDashoffset = '100';
      brand.classList.remove('is-hold-complete');
      brand.classList.add('is-holding');
      rafId = window.requestAnimationFrame(tick);
    }

    brand.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      beginHold(e.clientX, e.clientY);
    });

    brand.addEventListener('pointermove', function (e) {
      if (!isHolding) {
        return;
      }
      var dx = Math.abs(e.clientX - startX);
      var dy = Math.abs(e.clientY - startY);
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        cancelHold(true);
      }
    });

    brand.addEventListener('pointerup', function () {
      cancelHold(true);
    });
    brand.addEventListener('pointercancel', function () {
      cancelHold(true);
    });
    brand.addEventListener('pointerleave', function () {
      cancelHold(true);
    });

    brand.addEventListener('keydown', function (e) {
      if (e.repeat) {
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (e.key === ' ') {
          e.preventDefault();
        }
        activeKey = e.key;
        beginHold(0, 0);
      }
    });

    brand.addEventListener('keyup', function (e) {
      if (activeKey && e.key === activeKey) {
        var wasSpace = e.key === ' ';
        var heldShort = isHolding && performance.now() - startTime < SHORT_CLICK_LIMIT_MS;
        cancelHold(true);
        if (wasSpace && heldShort) {
          brand.click();
        }
      }
    });

    brand.addEventListener('contextmenu', function (e) {
      if (isHolding || suppressNextClick) {
        e.preventDefault();
      }
    });

    brand.addEventListener('click', function (e) {
      if (suppressNextClick) {
        suppressNextClick = false;
        e.preventDefault();
      }
    });

    window.addEventListener('blur', function () {
      cancelHold(false);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyStoredLanguage();
    setupMobileDrawerAccessibility();
    setupLogoAdminHold();
  });

  window.PortalKampus.ui = {
    getCurrentLang: getCurrentLang,
    t: t,
    getStatusMeta: getStatusMeta,
    getEventTitle: getEventTitle,
    getEventDescription: getEventDescription,
    getDetailHref: getDetailHref,
    renderEventCard: renderEventCard,
    attachImageFallbacks: attachImageFallbacks,
    renderStatusState: renderStatusState,
    renderSourceNotice: renderSourceNotice
  };
})();
