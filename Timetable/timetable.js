document.addEventListener('DOMContentLoaded', () => {
    // Global holidays array with one-based months (January = 1, May = 5, etc.)
    const holidays = [
        { start: { year: 2025, month: 5, day: 24 }, end: { year: 2025, month: 6, day: 1 }, reason: 'Holidays' },
        { start: { year: 2025, month: 7, day: 24 }, end: { year: 2025, month: 9, day: 2 }, reason: 'Summer Holidays' },
        { start: { year: 2025, month: 10, day: 25 }, end: { year: 2025, month: 11, day: 2 }, reason: 'Holidays' },
        { start: { year: 2025, month: 12, day: 19 }, end: { year: 2026, month: 1, day: 4 }, reason: 'Christmas Holidays' },
        { start: { year: 2026, month: 2, day: 14 }, end: { year: 2026, month: 2, day: 22 }, reason: 'Holidays' },
        { start: { year: 2026, month: 4, day: 3 }, end: { year: 2026, month: 4, day: 19 }, reason: 'Easter Holidays' },
        { start: { year: 2026, month: 5, day: 23 }, end: { year: 2026, month: 5, day: 31 }, reason: 'Holidays' },
        { start: { year: 2026, month: 7, day: 24 }, end: { year: 2026, month: 9, day: 2 }, reason: 'Summer Holidays' }
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

        // Séparer les jours fériés multi-jours et single-day
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

        console.log('Multi-day holidays:', multiDayHolidays);
        console.log('Single-day holidays:', singleDayHolidays);

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
                const startDate = new Date(Date.UTC(holiday.start.year, h.start.month - 1, h.start.day));
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
                            <td data-abbrev="TcE" data-full="TechE">TcE<span class="classroom">A005</span></td>
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
                scrollContainerA.scrollTo({
                    left: offset,
                    behavior: 'smooth'
                });
            }
        }
        if (scrollContainerB) {
            const cell = scrollContainerB.querySelector(`thead th:nth-child(${scrollToIndex + 1})`);
            if (cell) {
                const containerWidth = scrollContainerB.offsetWidth;
                const cellWidth = cell.offsetWidth;
                const offset = cell.offsetLeft + (cellWidth / 2) - (containerWidth / 2);
                scrollContainerB.scrollTo({
                    left: offset,
                    behavior: 'smooth'
                });
            }
        }
    }

    // Generate timetables and populate holiday tables at load
    try {
        generateTimetables();
        console.log('generateTimetables called at init');
        populateHolidayTables();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }

    // Hamburger menu and sidebar functionality
    hamburgerMenu.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
        console.log('Hamburger menu clicked, sidebar active:', sidebar.classList.contains('active'));
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        console.log('Close sidebar clicked');
    });

    // Tab switching functionality
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
            if (timeZoneA) timeZoneA.textContent = isUKTime ? '[UK]' : '[FR]';
            if (toggleTimeA) toggleTimeA.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }

        if (weekB) {
            const timeCellsB = weekB.querySelectorAll('tbody td[data-uk-time]');
            timeCellsB.forEach(cell => {
                const ukTime = cell.getAttribute('data-uk-time');
                cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
            });
            if (timeZoneB) timeZoneB.textContent = isUKTime ? '[UK]' : '[FR]';
            if (toggleTimeB) toggleTimeB.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        }

        highlightCurrentLesson();
        console.log('Times updated, isUKTime:', isUKTime);
    }

    function isHolidayOrClosure(date) {
        const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));

        console.log('Holiday check:', bstDate.toISOString(), 'Date only:', dateOnly.toISOString());

        for (const holiday of holidays) {
            if (!holiday.start.year || !holiday.start.month || !holiday.start.day) continue;
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
        const weekType = diffWeeks % 2 === 0 ? 'A' : 'B';
        console.log('Week type calculated:', weekType, 'Date:', bstDate.toISOString());
        return weekType;
    }

    function getReturnDate(holidayEnd) {
        let returnDate = new Date(Date.UTC(holidayEnd.year, holidayEnd.month - 1, holidayEnd.day));
        returnDate.setUTCDate(returnDate.getUTCDate() + 1);
        while (returnDate.getUTCDay() === 0 || returnDate.getUTCDay() === 6 || isHolidayOrClosure(returnDate)) {
            returnDate.setUTCDate(returnDate.getUTCDate() + 1);
        }
        return returnDate;
    }

    function isLastWeekendOfHoliday(date, holiday) {
        const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        const endDate = new Date(Date.UTC(holiday.end.year, holiday.end.month - 1, holiday.end.day));
        const returnDate = getReturnDate(holiday.end);
        const isWeekend = bstDate.getUTCDay() === 0 || bstDate.getUTCDay() === 6;
        const isLastDay = dateOnly.getTime() === endDate.getTime();
        const isDayBeforeLast = dateOnly.getTime() === endDate.getTime() - 86400000;
        return isWeekend && (isLastDay || isDayBeforeLast) && returnDate.getUTCDay() !== 0 && returnDate.getUTCDay() !== 6;
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
            scrollContainer.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
            console.log('Scrolled to current day:', daysOfWeek[currentDayIndex]);
        }
    }

    function highlightCurrentLesson() {
        const allCells = document.querySelectorAll('.timetable-table td');
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

        const activeTable = weekAContainer.style.display === 'block' ? weekA : weekB;
        if (!activeTable) return;

        const timeCells = activeTable.querySelectorAll('tbody td[data-uk-time]');
        let currentLessonFound = false;

        const holidayReason = isHolidayOrClosure(now);
        if (holidayReason) {
            const currentHoliday = holidays.find(h => {
                const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
                const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
                const dateOnly = new Date(Date.UTC(bstNow.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
                return dateOnly >= startDate && dateOnly <= endDate;
            });

            const isSingleDay = currentHoliday && new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() ===
                                new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();

            if (isSingleDay) {
                noClassMessage.textContent = `No classes today: Bank Holiday`;
                noClassMessage.style.display = 'block';
            } else if (isLastWeekendOfHoliday(now, currentHoliday)) {
                noClassMessage.textContent = "It's the weekend!";
                noClassMessage.style.display = 'block';
            } else {
                noClassMessage.textContent = `No classes today: Holidays (${formatDate(new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)))} - ${formatDate(new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)))})`;
                noClassMessage.style.display = 'block';
            }
            console.log('highlightCurrentLesson holiday:', { holidayReason, isSingleDay });
            return;
        }

        const isWeekend = bstNow.getUTCDay() === 0 || bstNow.getUTCDay() === 6;
        if (isWeekend) {
            noClassMessage.textContent = "It's the weekend!";
            noClassMessage.style.display = 'block';
            console.log('highlightCurrentLesson weekend');
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
        const bstNow = new Date(now.getTime() + 3600000);
        const currentDay = bstNow.getUTCDate();

        console.log('Check day:', now.toISOString(), 'BST:', bstNow.toISOString(), 'Day:', currentDay);

        if (currentDay !== lastKnownDay) {
            const dayOfWeek = bstNow.getUTCDay();
            currentDayIndex = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
            currentDayIndex = Math.min(Math.max(currentDayIndex, 0), 4);
            isManualDayChange = false;

            const holidayReason = isHolidayOrClosure(now);
            if (holidayReason) {
                handleHoliday(now, holidayReason);
                return;
            }

            timetableMessage.style.display = 'none';
            const isNowWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            if (isNowWeekend) {
                noClassMessage.textContent = "It's the weekend!";
                noClassMessage.style.display = 'block';
                holidayOptions.style.display = 'none';
                currentWeek = getWeekType(now);
                weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
                toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
                toggleButton.style.display = 'block';
            } else {
                noClassMessage.style.display = 'none';
                holidayOptions.style.display = 'none';
                currentWeek = getWeekType(now);
                weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
                toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
                toggleButton.style.display = 'block';
            }

            generateTimetables();
            if (window.innerWidth <= 768) {
                scrollToCurrentDay();
            }
            lastKnownDay = currentDay;
        }

        highlightCurrentLesson();
    }

    function handleHoliday(date, reason) {
        const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
        const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
        const currentHoliday = holidays.find(h => {
            if (!h.start.year || !h.start.month || !h.start.day) return false;
            const startDate = new Date(Date.UTC(h.start.year, h.start.month - 1, h.start.day));
            const endDate = new Date(Date.UTC(h.end.year, h.end.month - 1, h.end.day));
            return dateOnly >= startDate && dateOnly <= endDate;
        });

        const isSingleDay = currentHoliday && new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)).getTime() ===
                            new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)).getTime();

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
            if (isLastWeekendOfHoliday(date, currentHoliday)) {
                noClassMessage.textContent = "It's the weekend!";
            } else {
                noClassMessage.textContent = `No classes today: Holidays (${formatDate(new Date(Date.UTC(currentHoliday.start.year, currentHoliday.start.month - 1, currentHoliday.start.day)))} - ${formatDate(new Date(Date.UTC(currentHoliday.end.year, currentHoliday.end.month - 1, currentHoliday.end.day)))})`;
            }
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
        console.log('handleHoliday:', { reason, isSingleDay, isLastWeekend: isLastWeekendOfHoliday(date, currentHoliday), currentWeek, weekADisplay: weekAContainer.style.display, weekBDisplay: weekBContainer.style.display });
    }

    // Initialize timetable
    const today = new Date();
    const holidayReason = isHolidayOrClosure(today);
    console.log('Initialization:', { holidayReason, currentWeek, lastKnownDay });

    if (holidayReason) {
        handleHoliday(today, holidayReason);
    } else {
        currentWeek = getWeekType(today);
        timetableMessage.style.display = 'none';
        noClassMessage.style.display = 'none';
        holidayOptions.style.display = 'none';
        weekAContainer.style.display = currentWeek === 'A' ? 'block' : 'none';
        weekBContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
        toggleButton.textContent = currentWeek === 'A' ? 'Switch to Week B' : 'Switch to Week A';
        toggleButton.style.display = 'block';

        const isWeekend = today.getUTCDay() === 0 || today.getUTCDay() === 6;
        if (isWeekend) {
            noClassMessage.textContent = "It's the weekend!";
            noClassMessage.style.display = 'block';
        }

        generateTimetables();
        if (window.innerWidth <= 768) {
            scrollToCurrentDay();
        }
    }

    // Toggle button event listener
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

    // Resize event listener
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
    if (!manualDate) setInterval(checkDayChange, 1000);
}
}); // Closing the document.addEventListener('DOMContentLoaded', () => {