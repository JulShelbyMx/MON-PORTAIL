document.addEventListener('DOMContentLoaded', () => {
    // Global holidays array with one-based months (January = 1, May = 5, etc.)
    const holidays = [
        { start: { year: 2025, month: 5, day: 23 }, end: { year: 2025, month: 6, day: 1 }, reason: 'Holidays' },
        { start: { year: 2025, month: 7, day: 23 }, end: { year: 2025, month: 8, day: 31 }, reason: 'Summer Holidays' },
        { start: { year: 2025, month: 10, day: 24 }, end: { year: 2025, month: 11, day: 2 }, reason: 'Holidays' },
        { start: { year: 2025, month: 12, day: 18 }, end: { year: 2026, month: 1, day: 4 }, reason: 'Christmas Holidays' },
        { start: { year: 2026, month: 2, day: 13 }, end: { year: 2026, month: 2, day: 22 }, reason: 'Holidays' },
        { start: { year: 2026, month: 4, day: 2 }, end: { year: 2026, month: 4, day: 19 }, reason: 'Easter Holidays' },
        { start: { year: 2026, month: 5, day: 22 }, end: { year: 2026, month: 5, day: 31 }, reason: 'Holidays' },
        { start: { year: 2026, month: 7, day: 23 }, end: { year: 2026, month: 8, day: 31 }, reason: 'Summer Holidays' },

        { start: { year:'', month: '', day: '' }, end: { year: '', month: '', day: '' }, reason: 'BANK HOLIDAY' },
    ];

    const weekAContainer = document.getElementById('timetable-week-a');
    const weekBContainer = document.getElementById('timetable-week-b');
    const weekAMobileContainer = document.getElementById('timetable-week-a-mobile');
    const weekBMobileContainer = document.getElementById('timetable-week-b-mobile');
    const toggleButton = document.getElementById('toggle-button');
    const holidayMessage = document.getElementById('holiday-message');
    const holidayOptions = document.getElementById('holiday-options');
    const showReturnTimetable = document.getElementById('show-return-timetable');
    const showWeekTimetable = document.getElementById('show-week-timetable');
    const noClassMessage = document.getElementById('no-class-message');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    let isUKTime = true;
    let isManualDayChange = false;
    let currentWeek;
    let weekA, weekB, weekAMobile, weekBMobile, toggleTimeA, toggleTimeB, toggleTimeAMobile, toggleTimeBMobile, timeZoneA, timeZoneB, timeZoneAMobile, timeZoneBMobile;
    let isInitialLoad = true;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const manualDate = null;
    const today = manualDate ? new Date(manualDate) : new Date();
    const bstToday = manualDate ? today : new Date(today.getTime() + 3600000);
    const dayOfWeek = bstToday.getUTCDay();
    let currentDayIndex = dayOfWeek - 1;
    if (currentDayIndex < 0 || currentDayIndex > 4) {
        currentDayIndex = 0;
    }
    let lastKnownDay = bstToday.getUTCDate();

    console.log('Mode:', manualDate ? 'Manuel' : 'Auto', 'Today:', today.toISOString(), 'BST:', bstToday.toISOString(), 'Day:', bstToday.getUTCDate());

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        holidayMessage.textContent = "It's the weekend!";
        holidayMessage.style.display = 'block';
    }

    // Function to format dates for display
    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    // Function to populate holiday and bank holiday tables
    function populateHolidayTables() {
        const holidaysTableBody = document.querySelector('#holidays-table tbody');
        const bankHolidaysTableBody = document.querySelector('#bank-holidays-table tbody');

        const multiDayHolidays = holidays.filter(h => {
            const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
            const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
            return startDate.getTime() !== endDate.getTime() || h.reason.includes('Holidays');
        });
        const singleDayHolidays = holidays.filter(h => {
            const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
            const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
            return startDate.getTime() === endDate.getTime() && !h.reason.includes('Holidays');
        });

        // Populate Holidays table (multi-day periods)
        holidaysTableBody.innerHTML = multiDayHolidays.map(holiday => {
            const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
            const endDate = new Date(Date.UTC(holiday.end.year, holiday.end.month - 1, holiday.end.day));
            return `
                <tr>
                    <td>${formatDate(startDate)}</td>
                    <td>${formatDate(endDate)}</td>
                    <td>${holiday.reason}</td>
                </tr>
            `;
        }).join('');

        // Populate Bank Holidays table (single-day events)
        bankHolidaysTableBody.innerHTML = singleDayHolidays.map(holiday => {
            const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
            return `
                <tr>
                    <td>${formatDate(startDate)}</td>
                    <td>${holiday.reason}</td>
                </tr>
            `;
        }).join('');
    }

    // Function to generate timetables
   function generateTimetables() {
    const isMobile = window.innerWidth <= 768;
    const currentDate = new Date();
    const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    if (!isMobile) {
        weekAContainer.innerHTML = `
            <h2>Week A</h2>
            <table class="timetable-table">
                <thead>
                    <tr>
                        <th>
                            Time <span id="time-zone-a">[UK]</span>
                            <button id="toggle-time-a" class="time-toggle-button">Switch to FR</button>
                        </th>
                        <th>Monday</th>
                        <th>Tuesday</th>
                        <th>Wednesday</th>
                        <th>Thursday</th>
                        <th>Friday</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="08:40-09:40">08:40-09:40</td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                        <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">B101</span></td>
                        <td data-abbrev="ArE" data-full="ArtE">ArE<span class="classroom">B206</span></td>
                        <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">A212</span></td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="09:40-10:40">09:40-10:40</td>
                        <td data-abbrev="PeR" data-full="PeR">PeR<span class="classroom">A012</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="DmE" data-full="DramaE">DmE<span class="classroom">C101</span></td>
                        <td data-abbrev="PsE" data-full="PSHE">PsE<span class="classroom">B210</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="10:55-11:55">10:55-11:55</td>
                        <td data-abbrev="SpE" data-full="SpanishE">SpE<span class="classroom">A210</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                        <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">A109</span></td>
                        <td data-abbrev="ReE" data-full="ReligionE">ReE<span class="classroom">A110</span></td>
                        <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">B203</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="11:55-12:55">11:55-12:55</td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="MuE" data-full="MusicE">MuE<span class="classroom">B201</span></td>
                        <td data-abbrev="Mess" data-full="Mess">Mess<span class="classroom">A005</span></td>
                        <td data-abbrev="FrE" data-full="FrenchE">FrE<span class="classroom">A205</span></td>
                        <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">A211</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="12:55-13:55">12:55-13:55</td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="13:55-14:55">13:55-14:55</td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                    </tr>
                </tbody>
            </table>
        `;
        weekBContainer.innerHTML = `
            <h2>Week B</h2>
            <table class="timetable-table">
                <thead>
                    <tr>
                        <th>
                            Time <span id="time-zone-b">[UK]</span>
                            <button id="toggle-time-b" class="time-toggle-button">Switch to FR</button>
                        </th>
                        <th>Monday</th>
                        <th>Tuesday</th>
                        <th>Wednesday</th>
                        <th>Thursday</th>
                        <th>Friday</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                        <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="08:40-09:40">08:40-09:40</td>
                        <td data-abbrev="PsE" data-full="PSHE">PsE<span class="classroom">A210</span></td>
                        <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">A005</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A201</span></td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="09:40-10:40">09:40-10:40</td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">B202</span></td>
                        <td data-abbrev="Mess" data-full="Mess">Mess<span class="classroom">A013</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A202</span></td>
                        <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">B203</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="10:55-11:55">10:55-11:55</td>
                        <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">B101</span></td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A212</span></td>
                        <td data-abbrev="ArE" data-full="ArtE">ArE<span class="classroom">B205</span></td>
                        <td data-abbrev="DmE" data-full="DramaE">DmE<span class="classroom">C101</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="11:55-12:55">11:55-12:55</td>
                        <td data-abbrev="PeR" data-full="PeR">PeR<span class="classroom">A013</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="SpE" data-full="SpanishE">SpE<span class="classroom">A212</span></td>
                        <td data-abbrev="FrE" data-full="FrenchE">FrE<span class="classroom">A209</span></td>
                        <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">B207</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="12:55-13:55">12:55-13:55</td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                        <td>Lunch + R time<span class="classroom">B206</span></td>
                    </tr>
                    <tr>
                        <td data-uk-time="13:55-14:55">13:55-14:55</td>
                        <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A201</span></td>
                        <td data-abbrev="MuE" data-full="MusicE">MuE<span class="classroom">B201</span></td>
                        <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                        <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                        <td data-abbrev="ReE" data-full="ReligionE">ReE<span class="classroom">B203</span></td>
                    </tr>
                </tbody>
            </table>
        `;
    } else {
        const currentDayIndex = days.indexOf(currentDay);
        let scrollToIndex = currentDayIndex !== -1 ? currentDayIndex + 1 : 0; // +1 pour passer la colonne "Time"

        // Ajouter une colonne invisible le vendredi
        const extraColumn = currentDay === 'friday' ? `<th style="display: none;"></th><td style="display: none;"></td>` : '';

        weekAMobileContainer.innerHTML = `
            <h2 style="text-align: center;">Week A</h2>
            <div class="mobile-timetable-scroll" id="mobile-scroll-a">
                <table class="mobile-timetable-table">
                    <thead>
                        <tr>
                            <th>Time <span id="time-zone-a-mobile">[UK]</span>
                                <button id="toggle-time-a-mobile" class="time-toggle-button">Switch to FR</button>
                            </th>
                            <th>Monday</th>
                            <th>Tuesday</th>
                            <th>Wednesday</th>
                            <th>Thursday</th>
                            <th>Friday</th>
                            ${extraColumn}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="08:40-09:40">08:40-09:40</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">B101</span></td>
                            <td data-abbrev="ArE" data-full="ArtE">ArE<span class="classroom">B206</span></td>
                            <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">A212</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="09:40-10:40">09:40-10:40</td>
                            <td data-abbrev="PeR" data-full="PeR">PeR<span class="classroom">A012</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="DmE" data-full="DramaE">DmE<span class="classroom">C101</span></td>
                            <td data-abbrev="PsE" data-full="PSHE">PsE<span class="classroom">B210</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="10:55-11:55">10:55-11:55</td>
                            <td data-abbrev="SpE" data-full="SpanishE">SpE<span class="classroom">A210</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">A109</span></td>
                            <td data-abbrev="ReE" data-full="ReligionE">ReE<span class="classroom">A110</span></td>
                            <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">B203</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="11:55-12:55">11:55-12:55</td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="MuE" data-full="MusicE">MuE<span class="classroom">B201</span></td>
                            <td data-abbrev="Mess" data-full="Mess">Mess<span class="classroom">A005</span></td>
                            <td data-abbrev="FrE" data-full="FrenchE">FrE<span class="classroom">A205</span></td>
                            <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">A211</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="12:55-13:55">12:55-13:55</td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="13:55-14:55">13:55-14:55</td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A105</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            ${extraColumn}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        weekBMobileContainer.innerHTML = `
            <h2 style="text-align: center;">Week B</h2>
            <div class="mobile-timetable-scroll" id="mobile-scroll-b">
                <table class="mobile-timetable-table">
                    <thead>
                        <tr>
                            <th>Time <span id="time-zone-b-mobile">[UK]</span>
                                <button id="toggle-time-b-mobile" class="time-toggle-button">Switch to FR</button>
                            </th>
                            <th>Monday</th>
                            <th>Tuesday</th>
                            <th>Wednesday</th>
                            <th>Thursday</th>
                            <th>Friday</th>
                            ${extraColumn}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            <td data-abbrev="Tu" data-full="Tutor">Tu<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="08:40-09:40">08:40-09:40</td>
                            <td data-abbrev="PsE" data-full="PSHE">PsE<span class="classroom">A210</span></td>
                            <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">A005</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A201</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="09:40-10:40">09:40-10:40</td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">B202</span></td>
                            <td data-abbrev="Mess" data-full="Mess">Mess<span class="classroom">A013</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A202</span></td>
                            <td data-abbrev="HiE" data-full="HistoryE">HiE<span class="classroom">B203</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="10:55-11:55">10:55-11:55</td>
                            <td data-abbrev="CoE" data-full="ComputingE">CoE<span class="classroom">B101</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A212</span></td>
                            <td data-abbrev="ArE" data-full="ArtE">ArE<span class="classroom">B205</span></td>
                            <td data-abbrev="DmE" data-full="DramaE">DmE<span class="classroom">C101</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="11:55-12:55">11:55-12:55</td>
                            <td data-abbrev="PeR" data-full="PeR">PeR<span class="classroom">A013</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="SpE" data-full="SpanishE">SpE<span class="classroom">A212</span></td>
                            <td data-abbrev="FrE" data-full="FrenchE">FrE<span class="classroom">A209</span></td>
                            <td data-abbrev="GgE" data-full="GeographyE">GgE<span class="classroom">B207</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="12:55-13:55">12:55-13:55</td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            <td>Lunch + R time<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="13:55-14:55">13:55-14:55</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A201</span></td>
                            <td data-abbrev="MuE" data-full="MusicE">MuE<span class="classroom">B201</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A109</span></td>
                            <td data-abbrev="MaE" data-full="MathsE">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="ReE" data-full="ReligionE">ReE<span class="classroom">B203</span></td>
                            ${extraColumn}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

      // Centrer le jour actuel au chargement (uniquement sur mobile)
if (isMobile && scrollToIndex > 0) {
    const scrollContainerA = document.getElementById('mobile-scroll-a');
    const scrollContainerB = document.getElementById('mobile-scroll-b');
    console.log('Current Day:', currentDay, 'Current Day Index:', currentDayIndex); // Débogage
    if (scrollContainerA) {
        const cell = scrollContainerA.querySelector(`thead th:nth-child(${scrollToIndex + 1})`);
        if (cell) {
            const containerWidth = scrollContainerA.offsetWidth;
            const tableWidth = scrollContainerA.querySelector('.mobile-timetable-table').offsetWidth;
            const cellWidth = cell.offsetWidth;
            let offset = cell.offsetLeft + (cellWidth / 2) - (containerWidth / 2);
            console.log('Centering - Initial Offset:', offset); // Débogage
            if (currentDay === 'thursday') {
                const thursdayIndex = 4; // Index de Thursday (1=Time, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday)
                offset = (thursdayIndex - 1) * cellWidth + (cellWidth / 2) - (containerWidth / 2) + 100; // Centrage sur Thursday + 100px
                console.log('Centering Thursday - Adjusted Offset:', offset); // Débogage
            }
            // Ajouter un léger délai pour s'assurer que le DOM est prêt
            setTimeout(() => {
                scrollContainerA.scrollTo({
                    left: Math.max(0, offset), // Empêche un défilement négatif
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    if (scrollContainerB) {
        const cell = scrollContainerB.querySelector(`thead th:nth-child(${scrollToIndex + 1})`);
        if (cell) {
            const containerWidth = scrollContainerB.offsetWidth;
            const tableWidth = scrollContainerB.querySelector('.mobile-timetable-table').offsetWidth;
            const cellWidth = cell.offsetWidth;
            let offset = cell.offsetLeft + (cellWidth / 2) - (containerWidth / 2);
            console.log('Centering - Initial Offset:', offset); // Débogage
            if (currentDay === 'thursday') {
                const thursdayIndex = 4; // Index de Thursday
                offset = (thursdayIndex - 1) * cellWidth + (cellWidth / 2) - (containerWidth / 2) + 100; // Centrage sur Thursday + 100px
                console.log('Centering Thursday - Adjusted Offset:', offset); // Débogage
            }
            // Ajouter un léger délai pour s'assurer que le DOM est prêt
            setTimeout(() => {
                scrollContainerB.scrollTo({
                    left: Math.max(0, offset), // Empêche un défilement négatif
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
}}
    // Initialize references after generation
    weekA = weekAContainer.querySelector('.timetable-table');
    weekB = weekBContainer.querySelector('.timetable-table');
    weekAMobile = weekAMobileContainer.querySelector('.mobile-timetable-table');
    weekBMobile = weekBMobileContainer.querySelector('.mobile-timetable-table');
    toggleTimeA = document.getElementById('toggle-time-a');
    toggleTimeB = document.getElementById('toggle-time-b');
    toggleTimeAMobile = document.getElementById('toggle-time-a-mobile');
    toggleTimeBMobile = document.getElementById('toggle-time-b-mobile');
    timeZoneA = document.getElementById('time-zone-a');
    timeZoneB = document.getElementById('time-zone-b');
    timeZoneAMobile = document.getElementById('time-zone-a-mobile');
    timeZoneBMobile = document.getElementById('time-zone-b-mobile');

    // Ajouter des gestionnaires d'événements pour basculer entre abréviation et nom complet
    const cells = document.querySelectorAll('td[data-abbrev]');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const abbrev = cell.getAttribute('data-abbrev');
            const full = cell.getAttribute('data-full');
            const currentText = cell.childNodes[0].textContent;
            const classroom = cell.querySelector('.classroom').outerHTML;
            if (currentText === abbrev) {
                cell.innerHTML = `${full}${classroom}`;
            } else {
                cell.innerHTML = `${abbrev}${classroom}`;
            }
        });
    });
}

// Appeler la fonction au chargement
document.addEventListener('DOMContentLoaded', generateTimetables);

// Mettre à jour le centrage si la taille de l'écran change
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        generateTimetables();
    }
});

// Generate timetables and populate holiday tables at load
generateTimetables();
populateHolidayTables();

// Hamburger menu and sidebar functionality
hamburgerMenu.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    hamburgerMenu.classList.toggle('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    hamburgerMenu.classList.remove('active');
});

// Tab switching functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

function convertTime(timeStr) {
    if (timeStr.includes('(REG)')) {
        const times = timeStr.match(/\d{2}:\d{2}-\d{2}:\d{2}/)[0].split('-');
        const start = times[0].split(':');
        const end = times[1].split(':');
        let startHour = parseInt(start[0], 10);
        let endHour = parseInt(end[0], 10);
        const startMinutes = start[1];
        const endMinutes = end[1];

        if (!isUKTime) {
            startHour = (startHour + 1) % 24;
            endHour = (endHour + 1) % 24;
        }

        return `(REG) ${startHour.toString().padStart(2, '0')}:${startMinutes}-${endHour.toString().padStart(2, '0')}:${endMinutes}`;
    } else {
        const times = timeStr.split('-');
        const start = times[0].split(':');
        const end = times[1].split(':');
        let startHour = parseInt(start[0], 10);
        let endHour = parseInt(end[0], 10);
        const startMinutes = start[1];
        const endMinutes = end[1];

        if (!isUKTime) {
            startHour = (startHour + 1) % 24;
            endHour = (endHour + 1) % 24;
        }

        return `${startHour.toString().padStart(2, '0')}:${startMinutes}-${endHour.toString().padStart(2, '0')}:${endMinutes}`;
    }
}

function updateTimes() {
    if (weekA) {
        const timeCellsA = weekA.querySelectorAll('tbody td[data-uk-time]');
        timeCellsA.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });
        timeZoneA.textContent = isUKTime ? '[UK]' : '[FR]';
        toggleTimeA.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
    }

    if (weekB) {
        const timeCellsB = weekB.querySelectorAll('tbody td[data-uk-time]');
        timeCellsB.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });
        timeZoneB.textContent = isUKTime ? '[UK]' : '[FR]';
        toggleTimeB.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
    }

    if (weekAMobile) {
        const timeCellsAMobile = weekAMobile.querySelectorAll('tbody td[data-uk-time]');
        timeCellsAMobile.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });
        timeZoneAMobile.textContent = isUKTime ? '[UK]' : '[FR]';
        toggleTimeAMobile.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
    }

    if (weekBMobile) {
        const timeCellsBMobile = weekBMobile.querySelectorAll('tbody td[data-uk-time]');
        timeCellsBMobile.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });
        timeZoneBMobile.textContent = isUKTime ? '[UK]' : '[FR]';
        toggleTimeBMobile.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
    }

    highlightCurrentLesson();
}

function isHolidayOrClosure(date) {
    const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
    const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));

    console.log('Holiday check:', bstDate.toISOString(), 'Date only:', dateOnly.toISOString());

    for (const holiday of holidays) {
        const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
        const endDate = new Date(Date.UTC(holiday.end.year, holiday.end.month - 1, holiday.end.day));
        if (dateOnly >= startDate && dateOnly <= endDate) {
            return holiday.reason;
        }
    }
    return null;
}

function getWeekType(date) {
    const termStart = new Date(Date.UTC(2025, 2, 31));
    const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
    const diffTime = Math.abs(bstDate - termStart);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks % 2 === 0 ? 'A' : 'B';
}

function getReturnDate(holidayEnd) {
    let returnDate = new Date(Date.UTC(holidayEnd.year, holidayEnd.month - 1, holidayEnd.day));
    returnDate.setUTCDate(returnDate.getUTCDate() + 1);
    while (returnDate.getUTCDay() === 0 || returnDate.getUTCDay() === 6 || isHolidayOrClosure(returnDate)) {
        returnDate.setUTCDate(returnDate.getUTCDate() + 1);
    }
    return returnDate;
}

function scrollToCurrentDay() {
    if (window.innerWidth > 768) return;

    const activeTable = weekAMobileContainer.style.display === 'block' ? weekAMobile : weekBMobile;
    const scrollContainer = activeTable.parentElement;
    const dayColumn = scrollContainer.querySelectorAll('th')[currentDayIndex + 1];

    if (dayColumn) {
        const columnLeft = dayColumn.offsetLeft;
        const containerWidth = scrollContainer.clientWidth;
        const columnWidth = dayColumn.offsetWidth;
        const scrollPosition = columnLeft - (containerWidth / 2) + (columnWidth / 2);
        scrollContainer.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }
}

function highlightCurrentLesson() {
    const allCells = document.querySelectorAll('.timetable-table td, .mobile-timetable-table td');
    allCells.forEach(cell => cell.classList.remove('current-lesson'));

    noClassMessage.style.display = 'none';

    if (isManualDayChange || manualDate) {
        return;
    }

    const now = new Date();
    const bstNow = new Date(now.getTime() + 3600000);
    const ukHours = bstNow.getUTCHours();
    const currentMinutes = bstNow.getUTCMinutes();

    const currentTimeInMinutes = ukHours * 60 + currentMinutes;

    const currentDay = daysOfWeek[currentDayIndex];

    const activeTable = weekAContainer.style.display === 'block' ? weekA : weekB;
    const activeTableMobile = weekAMobileContainer.style.display === 'block' ? weekAMobile : weekBMobile;

    const timeCells = activeTable ? activeTable.querySelectorAll('tbody td[data-uk-time]') : [];
    const timeCellsMobile = activeTableMobile ? activeTableMobile.querySelectorAll('tbody td[data-uk-time]') : [];
    let currentLessonFound = false;

    const isWeekend = bstNow.getUTCDay() === 0 || bstNow.getUTCDay() === 6;
    const holidayReason = isHolidayOrClosure(now);
    if (isWeekend || holidayReason) {
        return;
    }

    timeCells.forEach((cell, index) => {
        const ukTime = cell.getAttribute('data-uk-time');

        let startHour, startMinutes, endHour, endMinutes;
        if (ukTime.includes('(REG)')) {
            const times = ukTime.match(/\d{2}:\d{2}-\d{2}:\d{2}/)[0].split('-');
            startHour = parseInt(times[0].split(':')[0], 10);
            startMinutes = parseInt(times[0].split(':')[1], 10);
            endHour = parseInt(times[1].split(':')[0], 10);
            endMinutes = parseInt(times[1].split(':')[1], 10);
        } else {
            const times = ukTime.split('-');
            startHour = parseInt(times[0].split(':')[0], 10);
            startMinutes = parseInt(times[0].split(':')[1], 10);
            endHour = parseInt(times[1].split(':')[0], 10);
            endMinutes = parseInt(times[1].split(':')[1], 10);
        }

        const startTimeInMinutes = startHour * 60 + startMinutes;
        const endTimeInMinutes = endHour * 60 + endMinutes;

        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
            const row = cell.parentElement;
            const cells = row.querySelectorAll('td');
            const lessonCell = cells[currentDayIndex + 1];
            if (lessonCell) {
                lessonCell.classList.add('current-lesson');
                currentLessonFound = true;
            }

            if (timeCellsMobile[index]) {
                const rowMobile = timeCellsMobile[index].parentElement;
                const cellsMobile = rowMobile.querySelectorAll('td');
                const lessonCellMobile = cellsMobile[currentDayIndex + 1];
                if (lessonCellMobile) {
                    lessonCellMobile.classList.add('current-lesson');
                }
            }
        }
    });

    timeCellsMobile.forEach((cell, index) => {
        const ukTime = cell.getAttribute('data-uk-time');

        let startHour, startMinutes, endHour, endMinutes;
        if (ukTime.includes('(REG)')) {
            const times = ukTime.match(/\d{2}:\d{2}-\d{2}:\d{2}/)[0].split('-');
            startHour = parseInt(times[0].split(':')[0], 10);
            startMinutes = parseInt(times[0].split(':')[1], 10);
            endHour = parseInt(times[1].split(':')[0], 10);
            endMinutes = parseInt(times[1].split(':')[1], 10);
        } else {
            const times = ukTime.split('-');
            startHour = parseInt(times[0].split(':')[0], 10);
            startMinutes = parseInt(times[0].split(':')[1], 10);
            endHour = parseInt(times[1].split(':')[0], 10);
            endMinutes = parseInt(times[1].split(':')[1], 10);
        }

        const startTimeInMinutes = startHour * 60 + startMinutes;
        const endTimeInMinutes = endHour * 60 + endMinutes;

        if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
            const rowMobile = cell.parentElement;
            const cellsMobile = rowMobile.querySelectorAll('td');
            const lessonCellMobile = cellsMobile[currentDayIndex + 1];
            if (lessonCellMobile) {
                lessonCellMobile.classList.add('current-lesson');
                currentLessonFound = true;
            }
        }
    });

    if (!currentLessonFound) {
        console.log('No current lesson at this time.');
        noClassMessage.style.display = 'block';
    }
}

function checkDayChange() {
    if (manualDate) return;

    const now = new Date();
    const bstNow = new Date(now.getTime() + 3600000);
    const currentDay = bstNow.getUTCDate();

    console.log('Check day:', now.toISOString(), 'BST:', bstNow.toISOString(), 'Day:', currentDay);

    if (currentDay !== lastKnownDay) {
        const dayOfWeek = bstNow.getUTCDay();
        currentDayIndex = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
        currentDayIndex = Math.min(Math.max(currentDayIndex, 0), 4);

        isManualDayChange = false;

        const isNowWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isNowWeekend) {
            holidayMessage.textContent = "It's the weekend!";
            holidayMessage.style.display = 'block';
            holidayOptions.style.display = 'none';
        } else {
            const holidayReason = isHolidayOrClosure(now);
            if (holidayReason) {
                handleHoliday(now, holidayReason);
            } else {
                holidayMessage.style.display = 'none';
                holidayOptions.style.display = 'none';
                weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
                weekAMobileContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekBMobileContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
                toggleButton.style.display = 'block';
                if (window.innerWidth <= 768) {
                    scrollToCurrentDay();
                }
            }
        }

        lastKnownDay = currentDay;
    }

    highlightCurrentLesson();
}

function handleHoliday(date, reason) {
    const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
    const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
    const currentHoliday = holidays.find(h => {
        const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
        const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
        return dateOnly >= startDate && dateOnly <= endDate;
    });
    const isSingleDay = new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() ===
                        new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();
    const nextDay = new Date(dateOnly);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const isFollowedByHoliday = isHolidayOrClosure(nextDay);

    if (!isSingleDay || (isSingleDay && isFollowedByHoliday)) {
        holidayMessage.textContent = `No classes today: ${reason}`;
        holidayMessage.style.display = 'block';
        holidayOptions.style.display = 'flex';
        showReturnTimetable.style.display = 'block';
        showWeekTimetable.style.display = 'none';
        weekAContainer.style.display = 'none';
        weekBContainer.style.display = 'none';
        weekAMobileContainer.style.display = 'none';
        weekBMobileContainer.style.display = 'none';
        toggleButton.style.display = 'none';

        showReturnTimetable.onclick = () => {
            const returnDate = getReturnDate(currentHoliday.end);
            currentWeek = getWeekType(returnDate);
            currentDayIndex = returnDate.getUTCDay() - 1;
            weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
            weekAMobileContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBMobileContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
            toggleButton.style.display = 'block';
            if (window.innerWidth <= 768) {
                scrollToCurrentDay();
            }
            holidayMessage.textContent = `Showing the timetable for the first week back, starting ${returnDate.toUTCString()} (Week ${currentWeek})`;
            holidayOptions.style.display = 'none';
        };
    } else {
        holidayMessage.textContent = `No classes today: ${reason}`;
        holidayMessage.style.display = 'block';
        holidayOptions.style.display = 'flex';
        showReturnTimetable.style.display = 'none';
        showWeekTimetable.style.display = 'block';
        weekAContainer.style.display = 'none';
        weekBContainer.style.display = 'none';
        weekAMobileContainer.style.display = 'none';
        weekBMobileContainer.style.display = 'none';
        toggleButton.style.display = 'none';

        showWeekTimetable.textContent = 'Show Timetable for Next School Day';
        showWeekTimetable.onclick = () => {
            let nextDate = new Date(dateOnly);
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            while (nextDate.getUTCDay() === 0 || nextDate.getUTCDay() === 6 || isHolidayOrClosure(nextDate)) {
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            }
            currentWeek = getWeekType(nextDate);
            currentDayIndex = nextDate.getUTCDay() - 1;
            weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
            weekAMobileContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBMobileContainer.style.display = 'block';
            toggleButton.style.display = 'block';
            if (window.innerWidth <= 768) {
                holidayMessage.textContent = `Today is ${reason}. Showing timetable for next school day: ${daysOfWeek[currentDayIndex]} (Week ${currentWeek})`;
                scrollToCurrentDay();
            }
            holidayOptions.style.display = 'none';
        };
    }
}

if (toggleTimeA) {
    toggleTimeA.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });
}

if (toggleTimeB) {
    toggleTimeB.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });
}

if (toggleTimeAMobile) {
    toggleTimeAMobile.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });
}

if (toggleTimeBMobile) {
    toggleTimeBMobile.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });
}

const holidayReason = isHolidayOrClosure(today);

if (holidayReason) {
    handleHoliday(today, holidayReason);
} else {
    currentWeek = getWeekType(today);

    if (currentWeek === 'A') {
        weekAContainer.style.display = 'block';
        weekBContainer.style.display = 'none';
        weekAMobileContainer.style.display = 'block';
        weekBMobileContainer.style.display = 'none';
        toggleButton.textContent = 'Switch to Week B';
    } else {
        weekAContainer.style.display = 'none';
        weekBContainer.style.display = 'block';
        weekAMobileContainer.style.display = 'none';
        weekBMobileContainer.style.display = 'block';
        toggleButton.textContent = 'Switch to Week A';
    }

    toggleButton.addEventListener('click', () => {
        if (currentWeek === 'A') {
            weekAContainer.style.display = 'none';
            weekBContainer.style.display = 'block';
            weekAMobileContainer.style.display = 'none';
            weekBMobileContainer.style.display = 'block';
            toggleButton.textContent = 'Switch to Week A';
            currentWeek = 'B';
        } else {
            weekAContainer.style.display = 'block';
            weekBContainer.style.display = 'none';
            weekAMobileContainer.style.display = 'block';
            weekBMobileContainer.style.display = 'none';
            toggleButton.textContent = 'Switch to Week B';
            currentWeek = 'A';
        }
    });

    window.addEventListener('resize', () => {
        generateTimetables();
        if (currentWeek === 'A') {
            weekAContainer.style.display = 'block';
            weekBContainer.style.display = 'none';
            weekAMobileContainer.style.display = 'block';
            weekBMobileContainer.style.display = 'none';
        } else {
            weekAContainer.style.display = 'none';
            weekBContainer.style.display = 'block';
            weekAMobileContainer.style.display = 'none';
            weekBMobileContainer.style.display = 'block';
        }
        populateHolidayTables(); // Re-populate holiday tables on resize
    });

    updateTimes();
    highlightCurrentLesson();
    if (isInitialLoad && window.innerWidth <= 768) {
        scrollToCurrentDay();
        isInitialLoad = false;
    }
    if (!manualDate) setInterval(checkDayChange, 1000);
}
});