// Proxy for the URCA CalDAV .ics feed.
// - Avoids browser CORS restrictions (the university server does not send CORS headers)
// - Keeps the private calendar URL out of the client bundle
//
// To avoid keeping the URL in the repo, define the environment variable
// TIMETABLE_ICS_URL in Netlify (Site settings > Environment variables).
const fetch = require('node-fetch');

const DEFAULT_ICS_URL = 'https://caldav.univ-reims.fr/URCA/cache/VA3AYJQY1767119.ics';

exports.handler = async () => {
    const url = process.env.TIMETABLE_ICS_URL || DEFAULT_ICS_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'text/calendar, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (compatible; JulsPortal/2.0)'
            },
            redirect: 'follow',
            signal: controller.signal
        });

        if (!response.ok) {
            return {
                statusCode: 502,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: `Le serveur du calendrier a répondu ${response.status}` })
            };
        }

        const body = await response.text();

        if (!body.includes('BEGIN:VCALENDAR')) {
            return {
                statusCode: 502,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Réponse inattendue (pas un fichier ICS)' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                // Short edge cache: near-live data while shielding the university server
                'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
                'Access-Control-Allow-Origin': '*'
            },
            body
        };
    } catch (err) {
        console.error('my-timetable error:', err.message);
        return {
            statusCode: 504,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Impossible de joindre le calendrier' })
        };
    } finally {
        clearTimeout(timeout);
    }
};
