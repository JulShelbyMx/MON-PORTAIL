document.addEventListener('DOMContentLoaded', () => {
    const holidays = [
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
        { start: { year: 2028, month: 12, day: 18 }, end: { year: 2029, month: 1, day: 2 }, reason: 'Christmas Holidays' },
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
    const noClassMessage = document.getElementById('no-class-message');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    let isUKTime = true;
    let isManualDayChange = false;
    let currentWeek;
    let weekA, weekB;
    let isInitialLoad = true;
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const manualDate = null;

    function isBST(date) {
        const year = date.getFullYear();
        const lastSundayMarch = new Date(year, 2, 31);
        lastSundayMarch.setDate(31 - (lastSundayMarch.getDay() || 7) + 1);
        lastSundayMarch.setHours(1, 0, 0, 0);
        const lastSundayOctober = new Date(year, 9, 31);
        lastSundayOctober.setDate(31 - (lastSundayOctober.getDay() || 7) + 1);
        lastSundayOctober.setHours(1, 0, 0, 0);
        return date >= lastSundayMarch && date < lastSundayOctober;
    }

    function getUKTime(date = new Date()) {
        const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
        const ukOffset = isBST(date) ? 1 : 0;
        return new Date(utcTime + (3600000 * ukOffset));
    }

    const today = manualDate ? new Date(manualDate) : new Date();
    const bstToday = manualDate ? today : getUKTime(today);
    const dayOfWeek = bstToday.getDay();
    let currentDayIndex = dayOfWeek - 1;
    if (currentDayIndex < 0 || currentDayIndex > 4) {
        currentDayIndex = 0;
    }
    let lastKnownDay = bstToday.getDate();

    console.log('Mode:', manualDate ? 'Manuel' : 'Auto', 'Today:', today.toISOString(), 'UK Time:', bstToday.toISOString(), 'Day:', bstToday.getDate(), 'BST:', isBST(today));

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        holidayMessage.textContent = "It's the weekend!";
        holidayMessage.style.display = 'block';
    }

    function formatDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    function populateHolidayTables() {
        const holidaysTableBody = document.querySelector('#holidays-table tbody');
        const bankHolidaysTableBody = document.querySelector('#bank-holidays-table tbody');

        const multiDayHolidays = holidays.filter(h => {
            const startDate = new Date(h.start.year, h.start.month - 1, h.start.day);
            const endDate = new Date(h.end.year, h.end.month - 1, h.end.day);
            return startDate.getTime() !== endDate.getTime() || h.reason.includes('Holidays');
        });
        const singleDayHolidays = holidays.filter(h => {
            const startDate = new Date(h.start.year, h.start.month - 1, h.start.day);
            const endDate = new Date(h.end.year, h.end.month - 1, h.end.day);
            return startDate.getTime() === endDate.getTime() && !h.reason.includes('Holidays');
        });

        try {
            holidaysTableBody.innerHTML = multiDayHolidays.map(holiday => {
                const startDate = new Date(holiday.start.year, holiday.start.month - 1, holiday.start.day);
                const endDate = new Date(holiday.end.year, holiday.end.month - 1, holiday.end.day);
                return `<tr><td>${formatDate(startDate)}</td><td>${formatDate(endDate)}</td><td>${holiday.reason}</td></tr>`;
            }).join('');

            bankHolidaysTableBody.innerHTML = singleDayHolidays.map(holiday => {
                const startDate = new Date(holiday.start.year, holiday.start.month - 1, holiday.start.day);
                return `<tr><td>${formatDate(startDate)}</td><td>${holiday.reason}</td></tr>`;
            }).join('');
        } catch (error) {
            console.error('Erreur dans populateHolidayTables:', error);
        }
    }

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
                            <td data-uk-time="(CLASS) 08:25-08:30">(CLASS) 08:30-08:30</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P1) 08:30-09:40">(P1) 08:30-09:40</td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A001</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P2) 09:45-10:40">(P2) 09:45-10:40</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Pe" data-full="Pe">Pe<span class="classroom">A009</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="PsE" data-full="PSCHE">PsE<span class="classroom">A212</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P3) 10:55-11:50">(P3) 10:55-11:50</td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A101</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P4) 11:50-12:50">(P4) 11:50-12:50</td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A101</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(FORM) 12:50-13:15">(FORM) 12:50-13:15</td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(LUNCH) 13:15-13:55 '?' ">(LUNCH) 13:15-13:55 '?'</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
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
                            <td data-uk-time="(CLASS) 08:25-08:30">(CLASS) 08:30-08:30</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            <td data-abbrev="Be in the classroom" data-full="Be in the classroom">Be in the classroom</td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P1) 08:30-09:40">(P1) 08:30-09:40</td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P2) 09:45-10:40">(P2) 09:45-10:40</td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="PsE" data-full="PSCHE">PsE<span class="classroom">B201</span></td>
                            <td data-abbrev="Pe" data-full="Pe">Pe<span class="classroom">A008</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P3) 10:55-11:50">(P3) 10:55-11:50</td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="Ho" data-full="Cooking">Ho<span class="classroom">A005</span></td>
                            <td data-abbrev="Hs" data-full="Health and Social">Hs<span class="classroom">B101</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(P4) 11:50-12:50">(P4) 11:50-12:50</td>
                            <td data-abbrev="ScR" data-full="SciencesR">ScR<span class="classroom">A106</span></td>
                            <td data-abbrev="Gg" data-full="Geography">Gg<span class="classroom">B207</span></td>
                            <td data-abbrev="MaE" data-full="Maths">MaE<span class="classroom">B110</span></td>
                            <td data-abbrev="Sp" data-full="Spanish">Sp<span class="classroom">A204</span></td>
                            <td data-abbrev="EnE" data-full="EnglishE">EnE<span class="classroom">A206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(FORM) 12:50-13:15">(FORM) 12:50-13:15</td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            <td>Form<span class="classroom">B206</span></td>
                            ${extraColumn}
                        </tr>
                        <tr>
                            <td data-uk-time="(LUNCH) 13:15-13:55 '?' ">(LUNCH) 13:15-13:55 '?'</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
                            <td>Lunch</td>
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

     weekA = weekAContainer.querySelector('.timetable-table');
        weekB = weekBContainer.querySelector('.timetable-table');

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

        const toggleTimeA = document.getElementById('toggle-time-a');
        const toggleTimeB = document.getElementById('toggle-time-b');
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

    try {
        generateTimetables();
        populateHolidayTables();
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }

    hamburgerMenu.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
        console.log('Hamburger clicked, sidebar active:', sidebar.classList.contains('active'));
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        console.log('Close sidebar clicked');
    });

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
            console.log('Tab switched to:', button.dataset.tab);
        });
    });

    function convertTime(timeStr) {
        const match = timeStr.match(/(\(\w+\)\s*)?(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (match) {
            const label = match[1] || '';
            const start = match[2].split(':');
            const end = match[3].split(':');
            let startHour = parseInt(start[0], 10);
            let endHour = parseInt(end[0], 10);
            if (!isUKTime) {
                startHour = (startHour + 1) % 24;
                endHour = (endHour + 1) % 24;
            }
            return `${label}${startHour.toString().padStart(2, '0')}:${start[1]}-${endHour.toString().padStart(2, '0')}:${end[1]}`;
        }
        return timeStr;
    }

    function updateTimes() {
        const now = new Date();
        const ukNow = getUKTime(now);
        const frNow = new Date(ukNow.getTime() + 3600000); // FR = UK + 1h

        const formatTime = (date) => {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        };

        const ukTime = formatTime(ukNow);
        const frTime = formatTime(frNow);

        const timeZoneA = document.getElementById('time-zone-a');
        const timeZoneB = document.getElementById('time-zone-b');
        const toggleTimeA = document.getElementById('toggle-time-a');
        const toggleTimeB = document.getElementById('toggle-time-b');

        if (weekA) {
            weekA.querySelectorAll('tbody td[data-uk-time]').forEach(cell => {
                cell.textContent = isUKTime ? cell.getAttribute('data-uk-time') : convertTime(cell.getAttribute('data-uk-time'));
            });
            if (timeZoneA) timeZoneA.textContent = isUKTime ? `[UK] ${ukTime}` : `[FR] ${frTime}`;
            if (toggleTimeA) toggleTimeA.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }
        if (weekB) {
            weekB.querySelectorAll('tbody td[data-uk-time]').forEach(cell => {
                cell.textContent = isUKTime ? cell.getAttribute('data-uk-time') : convertTime(cell.getAttribute('data-uk-time'));
            });
            if (timeZoneB) timeZoneB.textContent = isUKTime ? `[UK] ${ukTime}` : `[FR] ${frTime}`;
            if (toggleTimeB) toggleTimeB.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }
        highlightCurrentLesson();
        console.log('Times updated, isUKTime:', isUKTime, 'UK:', ukTime, 'FR:', frTime);
    }

    function isHolidayOrClosure(date) {
        const bstDate = manualDate ? date : getUKTime(date);
        const dateOnly = new Date(bstDate.getFullYear(), bstDate.getMonth(), bstDate.getDate());
        console.log('Holiday check:', bstDate.toISOString(), 'Date only:', dateOnly.toISOString());
        for (const holiday of holidays) {
            if (!holiday.start.year || !holiday.start.month || !holiday.start.day) continue;
            const startDate = new Date(holiday.start.year, holiday.start.month - 1, holiday.start.day);
            const endDate = new Date(holiday.end.year, holiday.end.month - 1, holiday.end.day);
            if (dateOnly >= startDate && dateOnly <= endDate) {
                return holiday.reason;
            }
        }
        return null;
    }

    function getWeekType(date) {
        const bstDate = manualDate ? date : getUKTime(date);
        const dateOnly = new Date(bstDate.getFullYear(), bstDate.getMonth(), bstDate.getDate());

        // Vérifier si on est dans une période de vacances (multi-jours)
        const currentHoliday = holidays.find(h => {
            if (!h.start.year || !h.start.month || !h.start.day) return false;
            const startDate = new Date(h.start.year, h.start.month - 1, h.start.day);
            const endDate = new Date(h.end.year, h.end.month - 1, h.end.day);
            // Vacances = multi-jours uniquement
            const isMultiDay = startDate.getTime() !== endDate.getTime();
            return isMultiDay && dateOnly >= startDate && dateOnly <= endDate;
        });

        // Si on est en vacances, trouver la semaine de retour (toujours Week A après vacances)
        if (currentHoliday) {
            const returnDate = getReturnDate(currentHoliday.end);
            console.log('En vacances, retour:', returnDate.toISOString(), '=> Week A');
            return 'A';
        }

        // Définir les points de départ Week A (début de terme et lendemains de vacances)
        const weekAStartDates = [
            
            new Date(2026, 2, 16), // 23 février 2026 = Week A (après Feb holidays)
            new Date(2026, 4, 20), // 20 avril 2026 = Week A (après Easter)
            new Date(2026, 6, 1),  // 1 juin 2026 = Week A (après May holidays)
            new Date(2026, 9, 2),  // 2 septembre 2026 = Week A (après Summer)
            new Date(2026, 11, 2), // 2 novembre 2026 = Week A (après Oct holidays)
            new Date(2027, 1, 4),  // 4 janvier 2027 = Week A (après Christmas)
            new Date(2027, 2, 22), // 22 février 2027 = Week A (après Feb holidays)
            new Date(2027, 4, 19), // 19 avril 2027 = Week A (après Easter)
            new Date(2027, 6, 7),  // 7 juin 2027 = Week A (après May holidays)
            new Date(2027, 9, 8),  // 8 septembre 2027 = Week A (après Summer)
            new Date(2027, 11, 1), // 1 novembre 2027 = Week A (après Oct holidays)
            new Date(2028, 1, 3),  // 3 janvier 2028 = Week A (après Christmas)
        ];

        // Trouver le point de départ Week A le plus proche avant ou égal à la date actuelle
        let nearestWeekAStart = weekAStartDates[0];
        for (const startDate of weekAStartDates) {
            if (startDate <= dateOnly && startDate > nearestWeekAStart) {
                nearestWeekAStart = startDate;
            }
        }

        // Normaliser au lundi de la semaine
        const dayOfWeek = dateOnly.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const mondayDate = new Date(dateOnly);
        mondayDate.setDate(dateOnly.getDate() - daysToMonday);

        // Calculer les jours d'école depuis le dernier Week A start
        const diffTime = mondayDate - nearestWeekAStart;
        let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Soustraire les jours de vacances multi-jours uniquement (pas les bank holidays)
        let vacationDays = 0;
        for (const holiday of holidays) {
            if (!holiday.start.year || !holiday.start.month || !holiday.start.day) continue;
            const startDate = new Date(holiday.start.year, holiday.start.month - 1, holiday.start.day);
            const endDate = new Date(holiday.end.year, holiday.end.month - 1, holiday.end.day);
            
            // Ne compter que les vacances multi-jours (pas les bank holidays)
            if (startDate.getTime() !== endDate.getTime()) {
                const vacationStart = startDate < nearestWeekAStart ? nearestWeekAStart : startDate;
                const vacationEnd = endDate > mondayDate ? mondayDate : endDate;
                if (vacationEnd >= vacationStart) {
                    const days = Math.floor((vacationEnd - vacationStart) / (1000 * 60 * 60 * 24)) + 1;
                    vacationDays += days;
                }
            }
        }

        const schoolDays = totalDays - vacationDays;
        const diffWeeks = Math.floor(schoolDays / 7);
        const weekType = diffWeeks % 2 === 0 ? 'A' : 'B';

        console.log('getWeekType debug:', {
            inputDate: bstDate.toISOString(),
            mondayDate: mondayDate.toISOString(),
            nearestWeekAStart: nearestWeekAStart.toISOString(),
            totalDays,
            vacationDays,
            schoolDays,
            diffWeeks,
            weekType
        });

        return weekType;
    }

    function getReturnDate(holidayEnd) {
        let returnDate = new Date(holidayEnd.year, holidayEnd.month - 1, holidayEnd.day);
        returnDate.setDate(returnDate.getDate() + 1);
        while (returnDate.getDay() === 0 || returnDate.getDay() === 6 || isHolidayOrClosure(returnDate)) {
            returnDate.setDate(returnDate.getDate() + 1);
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
            console.log('Scrolled to current day:', daysOfWeek[currentDayIndex]);
        }
    }

    function highlightCurrentLesson() {
        const allCells = document.querySelectorAll('.timetable-table td');
        allCells.forEach(cell => cell.classList.remove('current-lesson'));
        noClassMessage.style.display = 'none';
        if (isManualDayChange || manualDate) return;

        const now = new Date();
        const bstNow = getUKTime(now);
        const ukHours = bstNow.getHours();
        const currentMinutes = bstNow.getMinutes();
        const currentTimeInMinutes = ukHours * 60 + currentMinutes;

        const activeTable = weekAContainer.style.display === 'block' ? weekAContainer : weekBContainer;
        if (!activeTable) return;

        const holidayReason = isHolidayOrClosure(now);
        console.log('highlightCurrentLesson:', { holidayReason, isWeekend: bstNow.getDay() === 0 || bstNow.getDay() === 6 });

        if (holidayReason) {
            const currentHoliday = holidays.find(h => {
                const startDate = new Date(h.start.year, h.start.month - 1, h.start.day);
                const endDate = new Date(h.end.year, h.end.month - 1, h.end.day);
                const bstDate = getUKTime(now);
                const dateOnly = new Date(bstDate.getFullYear(), bstDate.getMonth(), bstDate.getDate());
                return dateOnly >= startDate && dateOnly <= endDate;
            });

            const isSingleDay = currentHoliday && new Date(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day).getTime() === new Date(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day).getTime();

            noClassMessage.textContent = isSingleDay ? `No classes today: Bank Holiday` : `No classes today: Holidays (${formatDate(new Date(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day))} - ${formatDate(new Date(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day))})`;
            noClassMessage.style.display = 'block';
            console.log('highlightCurrentLesson holiday:', { holidayReason, isSingleDay });
            return;
        }

        const isWeekend = bstNow.getDay() === 0 || bstNow.getDay() === 6;
        if (isWeekend) {
            noClassMessage.textContent = "It's the weekend!";
            noClassMessage.style.display = 'block';
            console.log('highlightCurrentLesson weekend');
            return;
        }

        const timeCells = activeTable.querySelectorAll('tbody td[data-uk-time]');
        let currentLessonFound = false;

        timeCells.forEach((cell) => {
            const ukTime = cell.getAttribute('data-uk-time');
            const timeMatch = ukTime.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
            if (timeMatch) {
                const times = timeMatch[0].split('-');
                const startHour = parseInt(times[0].split(':')[0], 10);
                const startMinutes = parseInt(times[0].split(':')[1], 10);
                const endHour = parseInt(times[1].split(':')[0], 10);
                const endMinutes = parseInt(times[1].split(':')[1], 10);

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
                }
            }
        });

        if (!currentLessonFound) {
            console.log('No current lesson at this time.');
            noClassMessage.textContent = 'No class right now';
            noClassMessage.style.display = 'block';
        }
        console.log('Highlight current lesson checked, found:', currentLessonFound);
    }

    function checkDayChange() {
        if (manualDate) return;

        const now = new Date();
        const bstNow = getUKTime(now);
        const currentDay = bstNow.getDate();

        console.log('Check day:', now.toISOString(), 'UK Time:', bstNow.toISOString(), 'Day:', currentDay, 'Last known day:', lastKnownDay);

        if (currentDay !== lastKnownDay) {
            const dayOfWeek = bstNow.getDay();
            currentDayIndex = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
            currentDayIndex = Math.min(Math.max(currentDayIndex, 0), 4);

            isManualDayChange = false;

            const holidayReason = isHolidayOrClosure(now);
            console.log('checkDayChange:', { holidayReason, currentDay, lastKnownDay, currentWeek });

            if (holidayReason) {
                handleHoliday(now, holidayReason);
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
                currentWeek = getWeekType(now);
            } else {
                currentWeek = getWeekType(now);
            }

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
        const bstDate = manualDate ? date : getUKTime(date);
        const dateOnly = new Date(bstDate.getFullYear(), bstDate.getMonth(), bstDate.getDate());
        const currentHoliday = holidays.find(h => {
            if (!h.start.year || !h.start.month || !h.start.day) return false;
            const startDate = new Date(h.start.year, h.start.month - 1, h.start.day);
            const endDate = new Date(h.end.year, h.end.month - 1, h.end.day);
            return dateOnly >= startDate && dateOnly <= endDate;
        });

        const isSingleDay = currentHoliday && new Date(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day).getTime() === new Date(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day).getTime();

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
            noClassMessage.textContent = `No classes today: Holidays (${formatDate(new Date(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day))} - ${formatDate(new Date(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day))})`;
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
        lastKnownDay = dateOnly.getDate();
        console.log('handleHoliday:', { reason, isSingleDay, currentWeek, weekADisplay: weekAContainer.style.display, weekBDisplay: weekBContainer.style.display });
    }

    const holidayReason = isHolidayOrClosure(today);
    console.log('Initialization:', { holidayReason, currentWeek, lastKnownDay });

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
        if (currentWeek === 'A') {
            weekAContainer.style.display = 'none';
            weekBContainer.style.display = 'block';
            toggleButton.textContent = 'Switch to Week A';
            currentWeek = 'B';
        } else {
            weekAContainer.style.display = 'block';
            weekBContainer.style.display = 'none';
            toggleButton.textContent = 'Switch to Week B';
            currentWeek = 'A';
        }
        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
        console.log('Toggle button clicked, current week:', currentWeek);
    });

    window.addEventListener('resize', () => {
        generateTimetables();
        if (currentWeek === 'A') {
            weekAContainer.style.display = 'block';
            weekBContainer.style.display = 'none';
        } else {
            weekAContainer.style.display = 'none';
            weekBContainer.style.display = 'block';
        }
        populateHolidayTables();
        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
        console.log('Window resized, width:', window.innerWidth);
    });

    updateTimes();
    highlightCurrentLesson();
    if (isInitialLoad && window.innerWidth <= 768) {
        scrollToCurrentDay();
        isInitialLoad = false;
    }
    
    // Mettre à jour l'heure affichée toutes les secondes
    setInterval(updateTimes, 1000);
    
    // Vérifier le changement de jour toutes les secondes
    if (!manualDate) setInterval(checkDayChange, 1000);

    console.log('Script fully loaded');
});