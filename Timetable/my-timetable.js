/**
 * "My timetable" — live university timetable from an ICS feed.
 * The feed is fetched server-side through a Netlify function (avoids CORS
 * and keeps the calendar URL out of the client), parsed in the browser,
 * and re-fetched automatically so the page always reflects the latest data.
 */
(function () {
    const ENDPOINT = '/.netlify/functions/my-timetable';
    const REFRESH_MS = 5 * 60 * 1000; // live refresh every 5 minutes
    const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const weekEl = document.getElementById('uni-week');
    const statusEl = document.getElementById('uni-status');
    const rangeLabel = document.getElementById('uni-range-label');
    const prevBtn = document.getElementById('uni-prev-week');
    const nextBtn = document.getElementById('uni-next-week');
    const todayBtn = document.getElementById('uni-today');
    const refreshBtn = document.getElementById('uni-refresh');
    const panel = document.getElementById('tab-mine');
    const titleEl = document.getElementById('timetable-title');
    const subtitleEl = document.getElementById('timetable-subtitle');
    const switcherButtons = document.querySelectorAll('.tab-switch button[data-target]');

    if (!weekEl || !window.ICSParser) return;

    let events = [];
    let weekStart = ICSParser.startOfWeek(new Date());
    let lastFetch = null;
    let loaded = false;
    let timer = null;

    const fmtDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
    const fmtTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const fmtLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

    function setStatus(type, message) {
        statusEl.className = 'uni-status' + (type ? ' is-' + type : '');
        statusEl.textContent = message || '';
    }

    function escapeHTML(str) {
        return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function render() {
        const rangeStart = new Date(weekStart);
        const rangeEnd = new Date(weekStart);
        rangeEnd.setDate(rangeEnd.getDate() + 7);

        const lastDay = new Date(rangeEnd);
        lastDay.setDate(lastDay.getDate() - 1);
        rangeLabel.textContent = `${fmtLong.format(rangeStart)} – ${fmtLong.format(lastDay)}`;

        const occurrences = ICSParser.expandOccurrences(events, rangeStart, rangeEnd);
        const today = new Date();

        // Weekend columns only show up when they actually contain events.
        const hasWeekend = occurrences.some(o => [0, 6].includes(o.start.getDay()));
        const dayCount = hasWeekend ? 7 : 5;

        let html = '';
        for (let i = 0; i < dayCount; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dayEvents = occurrences.filter(o => isSameDay(o.start, day));
            const isToday = isSameDay(day, today);

            html += `<div class="uni-day${isToday ? ' is-today' : ''}">
                <div class="uni-day-header"><span>${DAY_LABELS[i]}</span><span class="day-num">${fmtDay.format(day)}</span></div>`;

            if (dayEvents.length === 0) {
                html += '<div class="uni-day-empty">Rien de prévu</div>';
            } else {
                dayEvents.forEach(ev => {
                    const now = today.getTime();
                    const ongoing = now >= ev.start.getTime() && now < ev.end.getTime();
                    const done = now >= ev.end.getTime();
                    html += `<div class="uni-event${ongoing ? ' is-ongoing' : ''}${done ? ' is-done' : ''}">
                        <span class="uni-event-time">${fmtTime.format(ev.start)} – ${fmtTime.format(ev.end)}${ongoing ? ' · en cours' : ''}</span>
                        <span class="uni-event-title">${escapeHTML(ev.summary || 'Sans titre')}</span>
                        ${ev.location ? `<span class="uni-event-loc"><i class="fas fa-location-dot"></i> ${escapeHTML(ev.location)}</span>` : ''}
                    </div>`;
                });
            }
            html += '</div>';
        }
        weekEl.innerHTML = html;

        if (loaded && occurrences.length === 0) {
            setStatus('empty', 'Aucun cours cette semaine.');
        } else if (loaded) {
            const time = lastFetch ? fmtTime.format(lastFetch) : '';
            setStatus('', '');
            if (subtitleEl && panel.classList.contains('active')) {
                subtitleEl.textContent = `Calendrier URCA synchronisé à ${time} · mise à jour automatique toutes les 5 min.`;
            }
        }
    }

    async function load(showLoader) {
        if (showLoader) setStatus('loading', 'Chargement de ton emploi du temps…');
        refreshBtn.disabled = true;
        try {
            const res = await fetch(ENDPOINT + '?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Flux ICS invalide');
            events = ICSParser.parse(text);
            lastFetch = new Date();
            loaded = true;
            render();
        } catch (err) {
            console.error('My timetable error:', err);
            if (!loaded) {
                weekEl.innerHTML = '';
                setStatus('error', "Impossible de charger l'emploi du temps pour le moment. Vérifie ta connexion ou réessaie via le bouton de rafraîchissement.");
            } else {
                setStatus('error', 'Mise à jour impossible, affichage des dernières données connues.');
            }
        } finally {
            refreshBtn.disabled = false;
        }
    }

    function startPolling() {
        stopPolling();
        timer = setInterval(() => { if (!document.hidden) load(false); }, REFRESH_MS);
    }
    function stopPolling() { if (timer) clearInterval(timer); timer = null; }

    prevBtn.addEventListener('click', () => { weekStart.setDate(weekStart.getDate() - 7); render(); });
    nextBtn.addEventListener('click', () => { weekStart.setDate(weekStart.getDate() + 7); render(); });
    todayBtn.addEventListener('click', () => { weekStart = ICSParser.startOfWeek(new Date()); render(); });
    refreshBtn.addEventListener('click', () => load(true));

    // Titles per tab
    function updateHeading(target) {
        if (!titleEl || !subtitleEl) return;
        if (target === 'tab-mine') {
            titleEl.textContent = 'Mon emploi du temps';
            subtitleEl.textContent = 'Synchronisé en direct avec le calendrier URCA.';
            document.title = "Mon emploi du temps - Jul's Portal";
            if (!loaded) { load(true); }
            else { load(false); render(); }
            startPolling();
        } else {
            titleEl.textContent = "Emploi du temps d'Eliya";
            subtitleEl.textContent = 'Semaine A / B, horaires UK ou FR, vacances et jours fériés.';
            document.title = "Eliya's Timetable - Jul's Portal";
            stopPolling();
        }
    }

    document.addEventListener('tab-switched', e => updateHeading(e.detail.target));

    // Remember the last tab used, and honor ?tab=mine deep links
    const params = new URLSearchParams(location.search);
    const saved = params.get('tab') === 'mine' ? 'tab-mine' : (localStorage.getItem('jp-timetable-tab') || 'tab-eliya');
    document.addEventListener('tab-switched', e => localStorage.setItem('jp-timetable-tab', e.detail.target));

    document.addEventListener('DOMContentLoaded', () => {
        updateHeading('tab-eliya');
        if (saved === 'tab-mine') {
            const btn = Array.from(switcherButtons).find(b => b.dataset.target === 'tab-mine');
            if (btn) btn.click();
        }
    });

    // Refresh immediately when the tab becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && panel.classList.contains('active')) load(false);
    });
})();
