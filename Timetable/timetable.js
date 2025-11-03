document.addEventListener('DOMContentLoaded', () => {
    // Global holidays array with one-based months (January = 1, May = 5, etc.)
    const holidays = [
        { start: { year: 2025, month: 10, day: 25 }, end: { year: 2025, month: 11, day: 2 }, reason: 'Holidays' },
        { start: { year: 2025, month: 12, day: 19 }, end: { year: 2026, month: 1, day: 4 }, reason: 'Christmas Holidays' },
        { start: { year: 2026, month: 2, day: 14 }, end: { year: 2026, month: 2, day: 22 }, reason: 'Holidays' },
        { start: { year: 2026, month: 4, day: 3 }, end: { year: 2026, month: 4, day: 19 }, reason: 'Easter Holidays' },
        { start: { year: 2026, month: 5, day: 23 }, end: { year: 2026, month: 5, day: 31 }, reason: 'Holidays' },
        { start: { year: 2026, month: 7, day: 18 }, end: { year: 2026, month: 9, day: 1 }, reason: 'Summer Holidays' },
        { start: { year: 2026, month: 10, day: 24 }, end: { year: 2026, month: 11, day: 1 }, reason: 'Holidays' },
        { start: { year: 2026, month: 12, day: 19 }, end: { year: 2027, month: 1, day: 3 }, reason: 'Christmas Holidays' },
        { start: { year: 2027, month: 2, day: 13 }, end: { year: 2027, month: 2, day: 21 }, reason: 'Holidays' },
        { start: { year: 2027, month: 4, day: 3 }, end: { year: 2027, month: 4, day: 18 }, reason: 'Easter Holidays' },
        { start: { year: 2027, month: 5, day: 3 }, end: { year: 2027, month: 5, day: 3 }, reason: 'BANK HOLIDAY: May Day' },
        { start: { year: 2027, month: 5, day: 29 }, end: { year: 2027, month: 6, day: 6 }, reason: 'Holidays' },
        { start: { year: 2027, month: 7, day: 23 }, end: { year: 2027, month: 9, day: 7 }, reason: 'Summer Holidays' },
        { start: { year: 2027, month: 10, day: 23 }, end: { year: 2028, month: 10, day: 31 }, reason: 'Holidays' },
        { start: { year: 2028, month: 12, day: 18 }, end: { year: 2028, month: 1, day: 2 }, reason: 'Christmas Holidays' },
        { start: { year: 2028, month: 2, day: 19 }, end: { year: 2028, month: 2, day: 27 }, reason: 'Holidays' },
        { start: { year: 2028, month: 4, day: 1 }, end: { year: 2028, month: 4, day: 19 }, reason: 'Easter Holidays' },
        { start: { year: 2028, month: 5, day: 3 }, end: { year: 2028, month: 5, day: 3 }, reason: 'BANK HOLIDAY: May Day' },
        { start: { year: 2028, month: 5, day: 27 }, end: { year: 2028, month: 6, day: 4 }, reason: 'Holidays' },
        { start: { year: 2028, month: 7, day: 27 }, end: { year: 2028, month: 9, day: '?' }, reason: 'Summer Holidays' },
    ];

    const weekAContainer = document.getElementById('timetable-week-a');
    const weekBContainer = document.getElementById('timetable-week-b');
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
    let weekA, weekB, toggleTimeA, toggleTimeB, timeZoneA, timeZoneB;
    let isInitialLoad = true;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const manualDate = null;
    const today = manualDate ? new Date(Date.UTC(manualDate.getFullYear(), manualDate.getMonth(), manualDate.getDate())) : new Date();
    const bstToday = getUKTime(today); // Heure UK automatique
    const dayOfWeek = bstToday.getUTCDay();
    let currentDayIndex = dayOfWeek - 1;
    if (currentDayIndex < 0 || currentDayIndex > 4) {
        currentDayIndex = 0;
    }
    let lastKnownDay = bstToday.getUTCDate();

    console.log('Mode:', manualDate ? 'Manuel' : 'Auto', 'Today (FR):', today.toISOString(), 'UK Time:', bstToday.toISOString(), 'Day:', bstToday.getUTCDate());

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        holidayMessage.textContent = "It's the weekend!";
        holidayMessage.style.display = 'block';
    }

    // === FONCTION CLÉ : Convertit une date locale (FR) en heure UK (BST/GMT) ===
    function getUKTime(date) {
        const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
        const ukOffset = getUKOffset(date);
        return new Date(utc + ukOffset * 3600000);
    }

    // Retourne le décalage UK en heures (BST = +1, GMT = 0)
    function getUKOffset(date) {
        const year = date.getFullYear();
        const bstStart = new Date(Date.UTC(year, 2, 31)); // Dernier dimanche de mars
        const bstEnd = new Date(Date.UTC(year, 9, 31));   // Dernier dimanche d'octobre
        const lastSunday = d => {
            const day = d.getUTCDay();
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
        };
        bstStart = lastSunday(bstStart);
        bstEnd = lastSunday(bstEnd);
        return (date >= bstStart && date < bstEnd) ? 1 : 0;
    }

    // === Fonction pour obtenir l'heure actuelle en UK ===
    function getCurrentUKTime() {
        return getUKTime(new Date());
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

        console.log('Multi-day holidays:', JSON.stringify(multiDayHolidays, null, 2));
        console.log('Single-day holidays:', JSON.stringify(singleDayHolidays, null, 2));

        try {
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

            bankHolidaysTableBody.innerHTML = singleDayHolidays.map(holiday => {
                const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
                return `
                    <tr>
                        <td>${formatDate(startDate)}</td>
                        <td>${holiday.reason}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Erreur dans populateHolidayTables:', error);
        }
    }

    // Function to generate timetables
    function generateTimetables() {
        const currentDate = new Date();
        const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const currentDayIndex = days.indexOf(currentDay);
        let scrollToIndex = currentDayIndex !== -1 ? currentDayIndex + 1 : 0;

        // Add an invisible column on Friday for mobile to prevent cutoff
        const extraColumn = window.innerWidth <= 768 && currentDay === 'friday' ? `<th style="display: none;"></th><td style="display: none;"></td>` : '';

        weekAContainer.innerHTML = `
            <h2>Week A</h2>
            <div class="timetable-scroll">
                <table class="timetable-table">
                    <thead>
                        <tr>
                            <th>Time <span id="time-zone-a">[UK]</span>
                                <button id="toggle-time-a" class="time-toggle-button">Switch to FR</button>
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
                            <td data-uk-time="(ST) 08:30-08:40">(ST) 08:30-08:40</td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P1) 08:40-09:40">(P1) 08:40-09:40</td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A001</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P2) 09:40-10:40">(P2) 09:40-10:40</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Pe" data-full="Pe">Pe<span class="classroom">A009</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="PsE" data-full="PSCHE">PsE<span class="classroom">A212</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P3) 10:55-11:55">(P3) 10:55-11:55</td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A101</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P4) 11:55-12:55">(P4) 11:55-12:55</td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A101</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(RT) 12:55-13:55">(RT) 12:55-13:55</td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P5) 13:55-14:55">(P5) 13:55-14:55</td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A101</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A208</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="ScR" data-full="ScienceR">ScR<span class="classroom">A103</span></td>
                            ${extraColumn}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        weekBContainer.innerHTML = `
            <h2>Week B</h2>
            <div class="timetable-scroll">
                <table class="timetable-table">
                    <thead>
                        <tr>
                            <th>Time <span id="time-zone-b">[UK]</span>
                                <button id="toggle-time-b" class="time-toggle-button">Switch to FR</button>
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
                            <td data-uk-time="(ST) 08:30-08:40">(ST) 08:30-08:40</td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            <td data-abbrev="St" data-full="Form">St<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P1) 08:40-09:40">(P1) 08:40-09:40</td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P2) 09:40-10:40">(P2) 09:40-10:40</td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="PsE" data-full="PSCHE">PsE<span class="classroom">B201</span></td>
                            <td data-abbrev="Pe" data-full="Pe">Pe<span class="classroom">A008</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P3) 10:55-11:55">(P3) 10:55-11:55</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P4) 11:55-12:55">(P4) 11:55-12:55</td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(RT) 12:55-13:55">(RT) 12:55-13:55</td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            <td> R time then Lunch<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P5) 13:55-14:55">(P5) 13:55-14:55</td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A001</span></td>
                            ${extraColumn}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    // === FONCTION CLÉ : Convertit une date locale (FR) en heure UK (BST/GMT) ===
    function getUKTime(date) {
        const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
        const ukOffset = getUKOffset(date);
        return new Date(utc + ukOffset * 3600000);
    }

    // Retourne le décalage UK en heures (BST = +1, GMT = 0)
    function getUKOffset(date) {
        const year = date.getFullYear();
        const marchLast = new Date(Date.UTC(year, 2, 31)); // 31 mars
        const octoberLast = new Date(Date.UTC(year, 9, 31)); // 31 octobre

        const lastSunday = d => {
            const day = d.getUTCDay();
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
        };

        const bstStart = lastSunday(marchLast);
        const bstEnd = lastSunday(octoberLast);

        return (date >= bstStart && date < bstEnd) ? 1 : 0;
    }

    // === Fonction pour obtenir l'heure actuelle en UK ===
    function getCurrentUKTime() {
        return getUKTime(new Date());
    }

    // Initialize references after generation
    weekA = weekAContainer.querySelector('.timetable-table');
    weekB = weekBContainer.querySelector('.timetable-table');
    toggleTimeA = document.getElementById('toggle-time-a');
    toggleTimeB = document.getElementById('toggle-time-b');
    timeZoneA = document.getElementById('time-zone-a');
    timeZoneB = document.getElementById('time-zone-b');
    const timetableMessage = document.getElementById('timetable-message');

    // Add event listeners for toggling between abbreviation and full name
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

    // === Mise à jour des heures affichées (UK/FR) avec labels dynamiques BST/GMT, CEST/CET ===
    function updateTimes() {
        const isBST = getUKOffset(new Date()) === 1;
        const ukLabel = isBST ? 'BST' : 'GMT';
        const frLabel = isBST ? 'CEST' : 'CET';

        if (weekA) {
            const timeCellsA = weekA.querySelectorAll('tbody td[data-uk-time]');
            timeCellsA.forEach(cell => {
                const ukTime = cell.getAttribute('data-uk-time');
                cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
            });
            if (timeZoneA) timeZoneA.textContent = `[${isUKTime ? ukLabel : frLabel}]`;
            if (toggleTimeA) toggleTimeA.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }

        if (weekB) {
            const timeCellsB = weekB.querySelectorAll('tbody td[data-uk-time]');
            timeCellsB.forEach(cell => {
                const ukTime = cell.getAttribute('data-uk-time');
                cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
            });
            if (timeZoneB) timeZoneB.textContent = `[${isUKTime ? ukLabel : frLabel}]`;
            if (toggleTimeB) toggleTimeB.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }

        highlightCurrentLesson();
    }

    // === Conversion d'une heure UK → FR (toujours +1h) ===
    function convertTime(timeStr) {
        const match = timeStr.match(/(\(\w+\)\s*)?(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (!match) return timeStr;

        const label = match[1] || '';
        const startTimeStr = match[2];
        const endTimeStr = match[3];

        let startHour = parseInt(startTimeStr.split(':')[0], 10);
        let endHour = parseInt(endTimeStr.split(':')[0], 10);
        const startMinutes = startTimeStr.split(':')[1];
        const endMinutes = endTimeStr.split(':')[1];

        if (!isUKTime) {
            startHour = (startHour + 1) % 24;
            endHour = (endHour + 1) % 24;
        }

        const newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinutes}`;
        const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinutes}`;

        return `${label}${newStartTime}-${newEndTime}`;
    }

    // Add event listeners for time toggle buttons
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

    // Center the current day on mobile
    if (window.innerWidth <= 768 && scrollToIndex > 0) {
        const scrollContainerA = weekAContainer.querySelector('.timetable-scroll');
        const scrollContainerB = weekBContainer.querySelector('.timetable-scroll');
        if (scrollContainerA) {
            const cell = scrollContainerA.querySelector(`thead th:nth-child(${scrollToIndex + 1})`);
            if (cell) {
                const containerWidth = scrollContainerA.offsetWidth;
                const cellWidth = cell.offsetWidth;
                const offset = cell.offsetLeft + (cellWidth / 2) - (containerWidth / 2);
                scrollContainerA.scrollTo({ left: offset, behavior: 'smooth' });
            }
        }
        if (scrollContainerB) {
            const cell = scrollContainerB.querySelector(`thead th:nth-child(${scrollToIndex + 1})`);
            if (cell) {
                const containerWidth = scrollContainerB.offsetWidth;
                const cellWidth = cell.offsetWidth;
                const offset = cell.offsetLeft + (cellWidth / 2) - (containerWidth / 2);
                scrollContainerB.scrollTo({ left: offset, behavior: 'smooth' });
            }
        }
    }

    console.log('generateTimetables completed');
}

    // Generate timetables and populate holiday tables at load
    try {
        generateTimetables();
        populateHolidayTables();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }

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

    function isHolidayOrClosure(date) {
        const bstDate = getUKTime(date);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        for (const holiday of holidays) {
            if (!holiday.start.year || !holiday.start.month || !holiday.start.day) continue;
            const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
            const endDate = new Date(Date.UTC(holiday.end.year, holiday.end.month - 1, holiday.end.day));
            if (dateOnly >= startDate && dateOnly <= endDate) return holiday.reason;
        }
        return null;
    }

    function getWeekType(date) {
        const termStart = new Date(Date.UTC(2025, 8, 25));
        const bstDate = getUKTime(date);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        const dayOfWeek = dateOnly.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mondayDate = new Date(dateOnly);
        mondayDate.setUTCDate(dateOnly.getUTCDate() - daysToMonday);
        const diffTime = mondayDate - termStart;
        let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let vacationDays = 0;
        for (const holiday of holidays) {
            if (!holiday.start.year || !holiday.start.month || !holiday.start.day) continue;
            const startDate = new Date(Date.UTC(holiday.start.year, holiday.start.month - 1, holiday.start.day));
            const endDate = new Date(Date.UTC(holiday.end.year, holiday.end.month - 1, holiday.end.day));
            if (startDate.getTime() !== endDate.getTime()) {
                const vacationStart = startDate < termStart ? termStart : startDate;
                const vacationEnd = endDate > mondayDate ? mondayDate : endDate;
                if (vacationEnd >= vacationStart) {
                    const days = Math.floor((vacationEnd - vacationStart) / (1000 * 60 * 60 * 24)) + 1;
                    vacationDays += days;
                }
            }
        }
        const schoolDays = totalDays - vacationDays;
        const diffWeeks = Math.floor(schoolDays / 7);
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
        const activeTable = weekAContainer.style.display === 'block' ? weekA : weekB;
        if (!activeTable) return;
        const scrollContainer = activeTable.parentElement;
        const dayColumn = scrollContainer.querySelectorAll('th')[currentDayIndex + 1];
        if (dayColumn) {
            const columnLeft = dayColumn.offsetLeft;
            const containerWidth = scrollContainer.clientWidth;
            const columnWidth = dayColumn.offsetWidth;
            const scrollPosition = columnLeft - (containerWidth / 2) + (columnWidth / 2);
            scrollContainer.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    }

    function highlightCurrentLesson() {
        document.querySelectorAll('.timetable-table td').forEach(cell => cell.classList.remove('current-lesson'));
        noClassMessage.style.display = 'none';
        if (isManualDayChange || manualDate) return;

        const bstNow = getCurrentUKTime();
        const ukHours = bstNow.getUTCHours();
        const currentMinutes = bstNow.getUTCMinutes();
        const currentTimeInMinutes = ukHours * 60 + currentMinutes;

        const activeTable = weekAContainer.style.display === 'block' ? weekAContainer : weekBContainer;
        if (!activeTable) return;

        const holidayReason = isHolidayOrClosure(bstNow);
        if (holidayReason) {
            const currentHoliday = holidays.find(h => {
                const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
                const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
                const dateOnly = new Date(Date.UTC(bstNow.getUTCFullYear(), bstNow.getUTCMonth(), bstNow.getUTCDate()));
                return dateOnly >= startDate && dateOnly <= endDate;
            });
            const isSingleDay = currentHoliday && new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() === new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();
            noClassMessage.textContent = isSingleDay ? `No classes today: Bank Holiday` : `No classes today: Holidays (${formatDate(new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)))} - ${formatDate(new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)))})`;
            noClassMessage.style.display = 'block';
            return;
        }

        const isWeekend = bstNow.getUTCDay() === 0 || bstNow.getUTCDay() === 6;
        if (isWeekend) {
            noClassMessage.textContent = "It's the weekend!";
            noClassMessage.style.display = 'block';
            return;
        }

        const timeCells = activeTable.querySelectorAll('tbody td[data-uk-time]');
        let currentLessonFound = false;

        timeCells.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            const timeMatch = ukTime.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
            if (timeMatch) {
                const [start, end] = timeMatch[0].split('-');
                const startHour = parseInt(start.split(':')[0], 10);
                const startMinutes = parseInt(start.split(':')[1], 10);
                const endHour = parseInt(end.split(':')[0], 10);
                const endMinutes = parseInt(end.split(':')[1], 10);
                const startTimeInMinutes = startHour * 60 + startMinutes;
                const endTimeInMinutes = endHour * 60 + endMinutes;

                if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
                    const row = cell.parentElement;
                    const lessonCell = row.querySelectorAll('td')[currentDayIndex + 1];
                    if (lessonCell) {
                        lessonCell.classList.add('current-lesson');
                        currentLessonFound = true;
                    }
                }
            }
        });

        if (!currentLessonFound) {
            noClassMessage.textContent = 'No class right now';
            noClassMessage.style.display = 'block';
        }
    }

    function checkDayChange() {
        if (manualDate) return;
        const bstNow = getCurrentUKTime();
        const currentDay = bstNow.getUTCDate();
        if (currentDay !== lastKnownDay) {
            const dayOfWeek = bstNow.getUTCDay();
            currentDayIndex = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
            currentDayIndex = Math.min(Math.max(currentDayIndex, 0), 4);
            isManualDayChange = false;

            const holidayReason = isHolidayOrClosure(bstNow);
            if (holidayReason) {
                handleHoliday(bstNow, holidayReason);
                lastKnownDay = currentDay;
                return;
            }

            const timetableMessage = document.getElementById('timetable-message');
            timetableMessage.style.display = 'none';
            noClassMessage.style.display = 'none';
            holidayOptions.style.display = 'none';

            const isNowWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            if (isNowWeekend) {
                noClassMessage.textContent = "It's the weekend!";
                noClassMessage.style.display = 'block';
                currentWeek = getWeekType(bstNow);
            } else {
                currentWeek = getWeekType(bstNow);
            }

            weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
            toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
            toggleButton.style.display = 'block';

            generateTimetables();
            if (window.innerWidth <= 768) scrollToCurrentDay();
            lastKnownDay = currentDay;
        }
        highlightCurrentLesson();
    }

    function handleHoliday(date, reason) {
        const bstDate = getUKTime(date);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        const currentHoliday = holidays.find(h => {
            if (!h.start.year || !h.start.month || !h.start.day) return false;
            const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
            const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
            return dateOnly >= startDate && dateOnly <= endDate;
        });

        const isSingleDay = currentHoliday && new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() ===
                            new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();

        const timetableMessage = document.getElementById('timetable-message');

        if (isSingleDay) {
            timetableMessage.style.display = 'none';
            noClassMessage.textContent = `No classes today: Bank Holiday`;
            noClassMessage.style.display = 'block';
            holidayOptions.style.display = 'none';
            currentWeek = getWeekType(bstDate);
        } else {
            const returnDate = getReturnDate(currentHoliday.end);
            currentWeek = getWeekType(returnDate);
            timetableMessage.textContent = `Showing timetable for the first week back, starting ${formatDate(returnDate)} (Week ${currentWeek})`;
            timetableMessage.style.display = 'block';
            noClassMessage.textContent = `No classes today: Holidays (${formatDate(new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)))} - ${formatDate(new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)))})`;
            noClassMessage.style.display = 'block';
            holidayOptions.style.display = 'none';
        }

        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
        toggleButton.style.display = 'block';
        generateTimetables();
        if (window.innerWidth <= 768) scrollToCurrentDay();
        lastKnownDay = dateOnly.getUTCDate();
    }

    // Initialize timetable
    const holidayReason = isHolidayOrClosure(today);
    if (holidayReason) {
        handleHoliday(today, holidayReason);
    } else {
        currentWeek = getWeekType(today);
        document.getElementById('timetable-message').style.display = 'none';
        noClassMessage.style.display = 'none';
        holidayOptions.style.display = 'none';
        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
        toggleButton.style.display = 'block';
        generateTimetables();
        if (window.innerWidth <= 768) scrollToCurrentDay();
    }

    toggleButton.addEventListener('click', () => {
        currentWeek = currentWeek === 'A' ? 'B' : 'A';
        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
        if (window.innerWidth <= 768) scrollToCurrentDay();
    });

    window.addEventListener('resize', () => {
        generateTimetables();
        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        populateHolidayTables();
        if (window.innerWidth <= 768) scrollToCurrentDay();
    });

    updateTimes();
    highlightCurrentLesson();
    if (isInitialLoad && window.innerWidth <= 768) {
        scrollToCurrentDay();
        isInitialLoad = false;
    }
    if (!manualDate) setInterval(checkDayChange, 1000);

    console.log('Script fully loaded');
});