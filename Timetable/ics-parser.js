/**
 * Minimal ICS (RFC 5545) parser + weekly-recurrence expander.
 * Built specifically to render a university timetable feed (VEVENT blocks,
 * simple WEEKLY/DAILY RRULEs, EXDATE, RECURRENCE-ID overrides).
 * Not a full RFC5545 implementation — good enough for real-world .ics
 * timetable exports (Celcat/ADE/CalDAV caches).
 */
window.ICSParser = (function () {
    const DAY_MAP = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };

    function unfold(text) {
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
    }

    function unescapeICS(v) {
        return (v || '')
            .replace(/\\n/gi, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }

    function parseICSDateValue(value) {
        if (!value) return null;
        value = value.trim();
        if (/^\d{8}$/.test(value)) {
            const y = +value.slice(0, 4), m = +value.slice(4, 6), d = +value.slice(6, 8);
            return { date: new Date(y, m - 1, d, 0, 0, 0), allDay: true };
        }
        const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
        if (!m) return null;
        const [, y, mo, d, h, mi, s, z] = m;
        if (z) {
            return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
        }
        // Floating / TZID time: treated as local wall-clock time.
        return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay: false };
    }

    function parseLine(line) {
        const idx = line.indexOf(':');
        if (idx === -1) return null;
        const left = line.slice(0, idx);
        const value = line.slice(idx + 1);
        const [name, ...paramParts] = left.split(';');
        const params = {};
        paramParts.forEach(p => {
            const eq = p.indexOf('=');
            if (eq > -1) params[p.slice(0, eq)] = p.slice(eq + 1);
        });
        return { name: name.toUpperCase(), params, value };
    }

    function parseRRule(value) {
        const parts = {};
        value.split(';').forEach(p => {
            const eq = p.indexOf('=');
            if (eq > -1) parts[p.slice(0, eq)] = p.slice(eq + 1);
        });
        return parts;
    }

    function parse(icsText) {
        const text = unfold(icsText || '');
        const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const events = [];
        let current = null;

        rawLines.forEach(line => {
            if (line === 'BEGIN:VEVENT') { current = {}; return; }
            if (line === 'END:VEVENT') { if (current) events.push(current); current = null; return; }
            if (!current) return;
            const parsed = parseLine(line);
            if (!parsed) return;
            const { name, value } = parsed;
            switch (name) {
                case 'DTSTART': current.start = parseICSDateValue(value); break;
                case 'DTEND': current.end = parseICSDateValue(value); break;
                case 'SUMMARY': current.summary = unescapeICS(value); break;
                case 'LOCATION': current.location = unescapeICS(value); break;
                case 'DESCRIPTION': current.description = unescapeICS(value); break;
                case 'UID': current.uid = value; break;
                case 'RRULE': current.rrule = parseRRule(value); break;
                case 'EXDATE':
                    current.exdates = (current.exdates || []).concat(
                        value.split(',').map(v => { const d = parseICSDateValue(v); return d ? d.date : null; }).filter(Boolean)
                    );
                    break;
                case 'RECURRENCE-ID': {
                    const d = parseICSDateValue(value);
                    current.recurrenceId = d ? d.date : null;
                    break;
                }
                case 'STATUS': current.status = value.toUpperCase(); break;
                default: break;
            }
        });

        return events;
    }

    function startOfWeek(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = d.getDay(); // 0 = Sunday
        const diff = day === 0 ? -6 : 1 - day; // shift to Monday
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function sameDay(a, b) {
        return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function occurrenceFrom(ev, startDate, durationMs, overrides) {
        const key = ev.uid + '|' + startDate.toDateString();
        const override = overrides.get(key);
        if (override) {
            const start = override.start ? override.start.date : startDate;
            const end = override.end ? override.end.date : new Date(start.getTime() + durationMs);
            return {
                uid: ev.uid,
                start,
                end,
                summary: override.summary || ev.summary,
                location: override.location || ev.location,
                description: override.description || ev.description
            };
        }
        return {
            uid: ev.uid,
            start: startDate,
            end: new Date(startDate.getTime() + durationMs),
            summary: ev.summary,
            location: ev.location,
            description: ev.description
        };
    }

    /**
     * Expand parsed VEVENTs into concrete occurrences within [rangeStart, rangeEnd).
     */
    function expandOccurrences(events, rangeStart, rangeEnd) {
        const occurrences = [];
        const overrides = new Map();

        events.forEach(ev => {
            if (ev.recurrenceId && ev.uid) {
                overrides.set(ev.uid + '|' + ev.recurrenceId.toDateString(), ev);
            }
        });

        events.forEach(ev => {
            try {
                if (ev.recurrenceId) return; // pure override entry, handled via overrides map
                if (!ev.start || !ev.start.date) return;
                if (ev.status === 'CANCELLED') return;

                const durationMs = ev.end && ev.end.date ? (ev.end.date - ev.start.date) : 60 * 60000;

                if (!ev.rrule) {
                    const occEnd = ev.end && ev.end.date ? ev.end.date : ev.start.date;
                    if (ev.start.date < rangeEnd && occEnd > rangeStart) {
                        occurrences.push(occurrenceFrom(ev, ev.start.date, durationMs, overrides));
                    }
                    return;
                }

                const freq = ev.rrule.FREQ;
                const interval = parseInt(ev.rrule.INTERVAL || '1', 10) || 1;
                const until = ev.rrule.UNTIL ? (parseICSDateValue(ev.rrule.UNTIL) || {}).date : null;
                const count = ev.rrule.COUNT ? parseInt(ev.rrule.COUNT, 10) : null;
                const byday = ev.rrule.BYDAY ? ev.rrule.BYDAY.split(',') : null;

                let occCount = 0;
                let safety = 0;

                if (freq === 'WEEKLY') {
                    let weekCursor = startOfWeek(ev.start.date);
                    const days = (byday && byday.length ? byday.map(d => DAY_MAP[d]) : [ev.start.date.getDay()])
                        .filter(d => d !== undefined);

                    while (weekCursor < rangeEnd && safety < 2000) {
                        safety++;
                        for (const dow of days) {
                            const offset = dow === 0 ? 6 : dow - 1;
                            const occDate = new Date(weekCursor);
                            occDate.setDate(occDate.getDate() + offset);
                            occDate.setHours(ev.start.date.getHours(), ev.start.date.getMinutes(), ev.start.date.getSeconds(), 0);

                            if (occDate < ev.start.date) continue;
                            if (until && occDate > until) continue;
                            if (count && occCount >= count) continue;
                            if (ev.exdates && ev.exdates.some(ex => sameDay(ex, occDate))) { occCount++; continue; }

                            if (occDate >= rangeStart && occDate < rangeEnd) {
                                occurrences.push(occurrenceFrom(ev, occDate, durationMs, overrides));
                            }
                            occCount++;
                        }
                        weekCursor.setDate(weekCursor.getDate() + 7 * interval);
                    }
                } else if (freq === 'DAILY') {
                    let cursor = new Date(ev.start.date);
                    while (cursor < rangeEnd && safety < 3000) {
                        safety++;
                        if (until && cursor > until) break;
                        if (count && occCount >= count) break;
                        if (!(ev.exdates && ev.exdates.some(ex => sameDay(ex, cursor)))) {
                            if (cursor >= rangeStart && cursor < rangeEnd) {
                                occurrences.push(occurrenceFrom(ev, new Date(cursor), durationMs, overrides));
                            }
                        }
                        occCount++;
                        cursor = new Date(cursor.getTime() + interval * 86400000);
                    }
                } else {
                    // Unsupported frequency: fall back to the first occurrence only.
                    if (ev.start.date >= rangeStart && ev.start.date < rangeEnd) {
                        occurrences.push(occurrenceFrom(ev, ev.start.date, durationMs, overrides));
                    }
                }
            } catch (err) {
                console.error('ICS expand error for event', ev && ev.uid, err);
            }
        });

        occurrences.sort((a, b) => a.start - b.start);
        return occurrences;
    }

    return { parse, expandOccurrences, startOfWeek };
})();
