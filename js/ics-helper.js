// Helper untuk membuat tautan Google Calendar, file .ics, dan tautan berbagi WhatsApp.
// Dipakai oleh halaman Kalender, Detail Event, dan Halaman Admin.

window.PortalKampus = window.PortalKampus || {};

(function () {
  function padTwo(num) {
    return String(num).padStart(2, '0');
  }

  function formatUtcCompact(dateInput) {
    var date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return (
      date.getUTCFullYear() +
      padTwo(date.getUTCMonth() + 1) +
      padTwo(date.getUTCDate()) +
      'T' +
      padTwo(date.getUTCHours()) +
      padTwo(date.getUTCMinutes()) +
      padTwo(date.getUTCSeconds()) +
      'Z'
    );
  }

  function formatDateOnlyCompact(isoString) {
    var match = String(isoString || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return match[1] + match[2] + match[3];
    }
    var date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return (
      date.getFullYear() +
      padTwo(date.getMonth() + 1) +
      padTwo(date.getDate())
    );
  }

  function escapeIcsText(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function buildSlug(title) {
    return (
      String(title || 'event-kampus')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'event-kampus'
    );
  }

  // Menghasilkan URL Google Calendar render template untuk pengunjung maupun admin.
  function buildGoogleCalendarAddUrl(event) {
    var params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', event.title || 'Event Kampus');

    if (event.isAllDay) {
      var startDay = formatDateOnlyCompact(event.startIso);
      var endDay = formatDateOnlyCompact(event.endIso || event.startIso);
      params.set('dates', startDay + '/' + endDay);
    } else {
      var startUtc = formatUtcCompact(event.startIso);
      var endUtc = formatUtcCompact(event.endIso || event.startIso);
      if (startUtc && endUtc) {
        params.set('dates', startUtc + '/' + endUtc);
      }
    }

    if (event.location) {
      params.set('location', event.location);
    }
    if (event.rawTemplateDetails || event.description) {
      params.set('details', event.rawTemplateDetails || event.description);
    }
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function buildGoogleCalendarSubscribeUrl(calendarId) {
    if (!calendarId) {
      return 'https://calendar.google.com/';
    }
    return 'https://calendar.google.com/calendar/u/0/r?cid=' + encodeURIComponent(calendarId);
  }

  function buildIcsContent(event) {
    var nowStamp = formatUtcCompact(new Date());
    var uid = (event.id || buildSlug(event.title)) + '@portaleventkampus.local';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Portal Event Kampus//ID',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + escapeIcsText(uid),
      'DTSTAMP:' + nowStamp
    ];

    if (event.isAllDay) {
      lines.push('DTSTART;VALUE=DATE:' + formatDateOnlyCompact(event.startIso));
      lines.push('DTEND;VALUE=DATE:' + formatDateOnlyCompact(event.endIso || event.startIso));
    } else {
      lines.push('DTSTART:' + formatUtcCompact(event.startIso));
      lines.push('DTEND:' + formatUtcCompact(event.endIso || event.startIso));
    }

    lines.push('SUMMARY:' + escapeIcsText(event.title));
    if (event.location) {
      lines.push('LOCATION:' + escapeIcsText(event.location));
    }
    if (event.description) {
      lines.push('DESCRIPTION:' + escapeIcsText(event.description));
    }
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
  }

  function downloadEventIcs(event) {
    var content = buildIcsContent(event);
    var blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    var objectUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = objectUrl;
    link.download = buildSlug(event.title) + '.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  function buildWhatsAppShareUrl(event, pageUrl) {
    var parts = [
      'Agenda Kampus: ' + (event.title || 'Event Kampus'),
      event.displayDate ? 'Waktu: ' + event.displayDate : '',
      event.location ? 'Lokasi: ' + event.location : '',
      pageUrl ? 'Detail: ' + pageUrl : ''
    ].filter(Boolean);
    return 'https://wa.me/?text=' + encodeURIComponent(parts.join('\n'));
  }

  window.PortalKampus.ics = {
    buildGoogleCalendarAddUrl: buildGoogleCalendarAddUrl,
    buildGoogleCalendarSubscribeUrl: buildGoogleCalendarSubscribeUrl,
    buildIcsContent: buildIcsContent,
    downloadEventIcs: downloadEventIcs,
    buildWhatsAppShareUrl: buildWhatsAppShareUrl
  };
})();
