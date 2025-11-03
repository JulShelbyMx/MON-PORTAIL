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

    let isUKTime = true; // Uniquement pour l'affichage (visuel)
    let isManualDayChange = false;
    let currentWeek;
    let weekA, weekB, toggleTimeA, toggleTimeB, timeZoneA, timeZoneB;
    let isInitialLoad = true;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const manualDate = null;

    // === Gestion du changement d'heure UK (BST / GMT) ===
    function isBST(date) {
        const year = date.getUTCFullYear();
        const lastSundayMarch = new Date(Date.UTC(year, 2, 31));
        while (lastSundayMarch.getUTCDay() !== 0) lastSundayMarch.setUTCDate(lastSundayMarch.getUTCDate() - 1);
        const lastSundayOctober = new Date(Date.UTC(year, 9, 31));
        while (lastSundayOctober.getUTCDay() !== 0) lastSundayOctober.setUTCDate(lastSundayOctober.getUTCDate() - 1);
        return date >= lastSundayMarch && date < lastSundayOctober;
    }

    function getUKOffset(date) {
        return isBST(date) ? 3600000 : 0; // BST = +1h, GMT = +0h
    }

    // Date de base (UTC)
    const today = manualDate ? new Date(manualDate) : new Date();
    const ukOffset = getUKOffset(today);
    const bstToday = manualDate ? today : new Date(today.getTime() + ukOffset);
    const dayOfWeek = bstToday.getUTCDay();
    let currentDayIndex = dayOfWeek - 1;
    if (currentDayIndex < 0 || currentDayIndex > 4) {
        currentDayIndex = 0;
    }
    let lastKnownDay = bstToday.getUTCDate();

    console.log('Mode:', manualDate ? 'Manuel' : 'Auto', 'Today:', today.toISOString(), 'UK Time:', bstToday.toISOString(), 'Day:', bstToday.getUTCDate(), 'UK Offset:', ukOffset / 3600000 + 'h');

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

        // Réattacher les boutons
        document.getElementById('toggle-time-a')?.addEventListener('click', () => {
            isUKTime = !isUKTime;
            updateTimes();
        });
        document.getElementById('toggle-time-b')?.addEventListener('click', () => {
            isUKTime = !isUKTime;
            updateTimes();
        });

        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
    }

    // === Mise à jour visuelle de l'heure (UK / FR) ===
    function updateTimes() {
        const now = new Date();
        const ukOffset = getUKOffset(now);
        const bstNow = new Date(now.getTime() + ukOffset); // Heure UK réelle
        const frNow = new Date(bstNow.getTime() + 3600000); // Heure FR = UK + 1h

        const formatTime = (date) => {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        const ukTime = formatTime(bstNow);
        const frTime = formatTime(frNow);

        document.querySelectorAll('#time-zone-a, #time-zone-b').forEach(el => {
            el.textContent = isUKTime ? `[UK] ${ukTime}` : `[FR] ${frTime}`;
        });
    }

    // === Fonction pour détecter vacances ===
    function isHolidayOrClosure(date) {
        const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        return holidays.find(h => {
            const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
            const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
            return dateOnly >= startDate && dateOnly <= endDate;
        });
    }

    // === Date de retour après vacances ===
    function getReturnDate(endDateObj) {
        const endDate = new Date(Date.UTC(endDateObj.year, endDateObj.month - 1, endDateObj.day));
        let returnDate = new Date(endDate);
        returnDate.setUTCDate(returnDate.getUTCDate() + 1);
        while (returnDate.getUTCDay() === 0 || returnDate.getUTCDay() === 6) {
            returnDate.setUTCDate(returnDate.getUTCDate() + 1);
        }
        return returnDate;
    }

    // === Week A ou B (3 nov 2025 = Week A) ===
    function getWeekType(date) {
        const termStart = new Date(Date.UTC(2025, 11, 3)); // 
        const ukOffset = getUKOffset(date);
        const bstDate = new Date(date.getTime() + ukOffset);
        const diffTime = Math.abs(bstDate - termStart);
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        const weekType = diffWeeks % 2 === 0 ? 'A' : 'B';
        return weekType;
    }

    // === Mise en surbrillance du cours actuel (utilise heure UK réelle) ===
    function highlightCurrentLesson() {
        const now = new Date();
        const ukOffset = getUKOffset(now);
        const bstNow = new Date(now.getTime() + ukOffset);
        const currentTimeInMinutes = bstNow.getUTCHours() * 60 + bstNow.getUTCMinutes();

        const activeTable = currentWeek === 'A' ? weekAContainer.querySelector('.timetable-table') : weekBContainer.querySelector('.timetable-table');
        if (!activeTable) return;

        const currentHoliday = isHolidayOrClosure(now);
        if (currentHoliday) {
            const isSingleDay = new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() ===
                                new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();

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

        timeCells.forEach((cell) => {
            const ukTime = cell.getAttribute('data-uk-time');
            const timeMatch = ukTime.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
            if (timeMatch) {
                const [start, end] = timeMatch[0].split('-');
                const [startHour, startMin] = start.split(':').map(Number);
                const [endHour, endMin] = end.split(':').map(Number);
                const startMins = startHour * 60 + startMin;
                const endMins = endHour * 60 + endMin;

                if (currentTimeInMinutes >= startMins && currentTimeInMinutes <= endMins) {
                    const row = cell.parentElement;
                    const cells = row.querySelectorAll('td');
                    const lessonCell = cells[currentDayIndex + 1];
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

        const now = new Date();
        const ukOffset = getUKOffset(now);
        const bstNow = new Date(now.getTime() + ukOffset);
        const currentDay = bstNow.getUTCDate();

        if (currentDay !== lastKnownDay) {
            const dayOfWeek = bstNow.getUTCDay();
            currentDayIndex = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
            currentDayIndex = Math.min(Math.max(currentDayIndex, 0), 4);

            const holidayReason = isHolidayOrClosure(now);
            if (holidayReason) {
                handleHoliday(now, holidayReason);
                lastKnownDay = currentDay;
                return;
            }

            const timetableMessage = document.getElementById('timetable-message');
            timetableMessage.style.display = 'none';
            noClassMessage.style.display = 'none';
            holidayOptions.style.display = 'none';

            currentWeek = getWeekType(now);

            weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
            weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
            toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
            toggleButton.style.display = 'block';

            generateTimetables();
            if (window.innerWidth <= 768) {
                scrollToCurrentDay();
            }
            lastKnownDay = currentDay;
        }

        highlightCurrentLesson();
    }

    function handleHoliday(date, reason) {
        const ukOffset = getUKOffset(date);
        const bstDate = manualDate ? date : new Date(date.getTime() + ukOffset);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        const currentHoliday = holidays.find(h => {
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
            currentWeek = getWeekType(date);
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
        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
        lastKnownDay = dateOnly.getUTCDate();
    }

    // === Initialisation ===
    const holidayReason = isHolidayOrClosure(today);

    if (holidayReason) {
        handleHoliday(today, holidayReason);
    } else {
        const timetableMessage = document.getElementById('timetable-message');
        currentWeek = getWeekType(today);
        timetableMessage.style.display = 'none';
        noClassMessage.style.display = 'none';
        holidayOptions.style.display = 'none';
        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
        toggleButton.style.display = 'block';
        generateTimetables();
        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
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

    // === Boucle principale ===
    updateTimes();
    highlightCurrentLesson();
    if (isInitialLoad && window.innerWidth <= 768) {
        scrollToCurrentDay();
        isInitialLoad = false;
    }
    if (!manualDate) {
        setInterval(() => {
            updateTimes();
            checkDayChange();
        }, 1000);
    }

    console.log('Script fully loaded');
});