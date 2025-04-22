document.addEventListener('DOMContentLoaded', () => {
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

    let isUKTime = true;
    let isManualDayChange = false;
    let currentWeek;
    let weekA, weekB, weekAMobile, weekBMobile, toggleTimeA, toggleTimeB, toggleTimeAMobile, toggleTimeBMobile, timeZoneA, timeZoneB, timeZoneAMobile, timeZoneBMobile;
    let isInitialLoad = true; // Indicateur pour le focus initial

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Date manuelle prioritaire, sinon auto
    const manualDate = null;
    const today = manualDate ? new Date(manualDate) : new Date();
    const bstToday = manualDate ? today : new Date(today.getTime() + 3600000); // BST seulement en auto
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

    // Fonction pour générer les plannings dynamiquement
    function generateTimetables() {
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            // Générer le planning desktop
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
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                        </tr>
                        <tr>
                            <td data-uk-time="08:40-09:40">08:40-09:40</td>
                            <td>9cd/EnE</td>
                            <td>9cd/CoE</td>
                            <td>9cd/ArE</td>
                            <td>9cd/HiE</td>
                            <td>9cd/ScR</td>
                        </tr>
                        <tr>
                            <td data-uk-time="09:40-10:40">09:40-10:40</td>
                            <td>9d/PeR</td>
                            <td>9cd/MaE</td>
                            <td>9cd/MaE</td>
                            <td>9cd/DmE</td>
                            <td>9cd/PsE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="10:55-11:55">10:55-11:55</td>
                            <td>9cd/SpE</td>
                            <td>9cd/EnE</td>
                            <td>9cd/GgE</td>
                            <td>9cd/ReE</td>
                            <td>9cd/HiE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="11:55-12:55">11:55-12:55</td>
                            <td>9cd/MaE</td>
                            <td>9cd/MuE</td>
                            <td>9cd/Mess</td>
                            <td>9cd/FrE</td>
                            <td>9cd/GgE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="12:55-13:55">12:55-13:55</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                        </tr>
                        <tr>
                            <td data-uk-time="13:55-14:55">13:55-14:55</td>
                            <td>9cd/ScR</td>
                            <td>9cd/ScR</td>
                            <td>9cd/EnE</td>
                            <td>9cd/EnE</td>
                            <td>9cd/MaE</td>
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
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                        </tr>
                        <tr>
                            <td data-uk-time="08:40-09:40">08:40-09:40</td>
                            <td>9cd/PsE</td>
                            <td>9cd/TcR</td>
                            <td>9cd/EnE</td>
                            <td>9cd/ScR</td>
                            <td>9cd/ScR</td>
                        </tr>
                        <tr>
                            <td data-uk-time="09:40-10:40">09:40-10:40</td>
                            <td>9d/MaE</td>
                            <td>9cd/GgE</td>
                            <td>9cd/Mess</td>
                            <td>9cd/EnE</td>
                            <td>9cd/HiE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="10:55-11:55">10:55-11:55</td>
                            <td>9cd/CoE</td>
                            <td>9cd/EnE</td>
                            <td>9cd/ArE</td>
                            <td>9cd/DmE</td>
                            <td>9cd/MaE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="11:55-12:55">11:55-12:55</td>
                            <td>9cd/PeR</td>
                            <td>9cd/MaE</td>
                            <td>9cd/SpE</td>
                            <td>9cd/FrE</td>
                            <td>9cd/GgE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="12:55-13:55">12:55-13:55</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                        </tr>
                        <tr>
                            <td data-uk-time="13:55-14:55">13:55-14:55</td>
                            <td>9cd/EnE</td>
                            <td>9cd/MuE</td>
                            <td>9cd/ScR</td>
                            <td>9cd/MaE</td>
                            <td>9cd/ReE</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else {
            // Générer le planning mobile
            weekAMobileContainer.innerHTML = `
                <h2>Week A</h2>
                <div class="mobile-timetable-scroll">
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
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                                <td>9PH/Tu</td>
                                <td>9PH/Tu</td>
                                <td>9PH/Tu</td>
                                <td>9PH/Tu</td>
                                <td>9PH/Tu</td>
                            </tr>
                            <tr>
                                <td data-uk-time="08:40-09:40">08:40-09:40</td>
                                <td>9cd/EnE</td>
                                <td>9cd/CoE</td>
                                <td>9cd/ArE</td>
                                <td>9cd/HiE</td>
                                <td>9cd/ScR</td>
                            </tr>
                            <tr>
                                <td data-uk-time="09:40-10:40">09:40-10:40</td>
                                <td>9d/PeR</td>
                                <td>9cd/MaE</td>
                                <td>9cd/MaE</td>
                                <td>9cd/DmE</td>
                                <td>9cd/PsE</td>
                            </tr>
                            <tr>
                                <td data-uk-time="10:55-11:55">10:55-11:55</td>
                                <td>9cd/SpE</td>
                                <td>9cd/EnE</td>
                                <td>9cd/GgE</td>
                                <td>9cd/ReE</td>
                                <td>9cd/HiE</td>
                            </tr>
                            <tr>
                                <td data-uk-time="11:55-12:55">11:55-12:55</td>
                                <td>9cd/MaE</td>
                                <td>9cd/MuE</td>
                                <td>9cd/Mess</td>
                                <td>9cd/FrE</td>
                                <td>9cd/GgE</td>
                            </tr>
                            <tr>
                                <td data-uk-time="12:55-13:55">12:55-13:55</td>
                                <td>Lunch + 9PH/Rt</td>
                                <td>Lunch + 9PH/Rt</td>
                                <td>Lunch + 9PH/Rt</td>
                                <td>Lunch + 9PH/Rt</td>
                                <td>Lunch + 9PH/Rt</td>
                            </tr>
                            <tr>
                                <td data-uk-time="13:55-14:55">13:55-14:55</td>
                                <td>9cd/ScR</td>
                                <td>9cd/ScR</td>
                                <td>9cd/EnE</td>
                                <td>9cd/EnE</td>
                                <td>9cd/MaE</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            weekBMobileContainer.innerHTML = `
                <h2>Week B</h2>
                <div class="mobile-timetable-scroll">
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
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td data-uk-time="(REG) 08:30-08:40">(REG) 08:30-08:40</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                            <td>9PH/Tu</td>
                        </tr>
                        <tr>
                            <td data-uk-time="08:40-09:40">08:40-09:40</td>
                            <td>9cd/PsE</td>
                            <td>9cd/TcR</td>
                            <td>9cd/EnE</td>
                            <td>9cd/ScR</td>
                            <td>9cd/ScR</td>
                        </tr>
                        <tr>
                            <td data-uk-time="09:40-10:40">09:40-10:40</td>
                            <td>9d/MaE</td>
                            <td>9cd/GgE</td>
                            <td>9cd/Mess</td>
                            <td>9cd/EnE</td>
                            <td>9cd/HiE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="10:55-11:55">10:55-11:55</td>
                            <td>9cd/CoE</td>
                            <td>9cd/EnE</td>
                            <td>9cd/ArE</td>
                            <td>9cd/DmE</td>
                            <td>9cd/MaE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="11:55-12:55">11:55-12:55</td>
                            <td>9cd/PeR</td>
                            <td>9cd/MaE</td>
                            <td>9cd/SpE</td>
                            <td>9cd/FrE</td>
                            <td>9cd/GgE</td>
                        </tr>
                        <tr>
                            <td data-uk-time="12:55-13:55">12:55-13:55</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                            <td>Lunch + 9PH/Rt</td>
                        </tr>
                        <tr>
                            <td data-uk-time="13:55-14:55">13:55-14:55</td>
                            <td>9cd/EnE</td>
                            <td>9cd/MuE</td>
                            <td>9cd/ScR</td>
                            <td>9cd/MaE</td>
                            <td>9cd/ReE</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // Initialiser les références après génération
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
}

// Générer les plannings au chargement
generateTimetables();

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
    // Ne pas appeler scrollToCurrentDay ici pour éviter le recentrage
}

function isHolidayOrClosure(date) {
    const holidays = [
        { start: new Date(Date.UTC(2025, 3, 4)), end: new Date(Date.UTC(2025, 3, 4)), reason: 'STAFF ONLY (INSET)' },
        { start: new Date(Date.UTC(2025, 3, 5)), end: new Date(Date.UTC(2025, 3, 20)), reason: 'Easter Holidays' },
        { start: new Date(Date.UTC(2025, 3, 21)), end: new Date(Date.UTC(2025, 3, 21)), reason: 'BANK HOLIDAY' },
        { start: new Date(Date.UTC(2025, 4, 5)), end: new Date(Date.UTC(2025, 4, 5)), reason: 'BANK HOLIDAY' },
        { start: new Date(Date.UTC(2025, 4, 23)), end: new Date(Date.UTC(2025, 5, 1)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2025, 6, 23)), end: new Date(Date.UTC(2025, 7, 31)), reason: 'Summer Holidays' },
        { start: new Date(Date.UTC(2025, 9, 24)), end: new Date(Date.UTC(2025, 10, 2)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2025, 11, 18)), end: new Date(Date.UTC(2026, 0, 4)), reason: 'Christmas Holidays' },
        { start: new Date(Date.UTC(2026, 1, 13)), end: new Date(Date.UTC(2026, 1, 22)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2026, 3, 2)), end: new Date(Date.UTC(2026, 3, 19)), reason: 'Easter Holidays' },
        { start: new Date(Date.UTC(2026, 4, 22)), end: new Date(Date.UTC(2026, 4, 31)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2026, 6, 23)), end: new Date(Date.UTC(2026, 7, 31)), reason: 'Summer Holidays' }
    ];

    const bstDate = manualDate ? date : new Date(date.getTime() + 3600000); // BST en auto uniquement
    const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));

    console.log('Holiday check:', bstDate.toISOString(), 'Date only:', dateOnly.toISOString());

    for (const holiday of holidays) {
        if (dateOnly >= holiday.start && dateOnly <= holiday.end) {
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
    let returnDate = new Date(holidayEnd);
    returnDate.setUTCDate(returnDate.getUTCDate() + 1);
    while (returnDate.getUTCDay() === 0 || returnDate.getUTCDay() === 6 || isHolidayOrClosure(returnDate)) {
        returnDate.setUTCDate(returnDate.getUTCDate() + 1);
    }
    return returnDate;
}

function scrollToCurrentDay() {
    if (window.innerWidth > 768) return; // Ne s'applique que sur mobile

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

    // Hide "No class rn" message by default
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

    // Check if it's a holiday or weekend
    const isWeekend = bstNow.getUTCDay() === 0 || bstNow.getUTCDay() === 6;
    const holidayReason = isHolidayOrClosure(now);
    if (isWeekend || holidayReason) {
        return; // Don't show "No class rn" during holidays or weekends
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
        noClassMessage.style.display = 'block'; // Show "No class rn" message
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
    const holidays = [
        { start: new Date(Date.UTC(2025, 3, 4)), end: new Date(Date.UTC(2025, 3, 4)), reason: 'STAFF ONLY (INSET)' },
        { start: new Date(Date.UTC(2025, 3, 5)), end: new Date(Date.UTC(2025, 3, 20)), reason: 'Easter Holidays' },
        { start: new Date(Date.UTC(2025, 3, 21)), end: new Date(Date.UTC(2025, 3, 21)), reason: 'BANK HOLIDAY' },
        { start: new Date(Date.UTC(2025, 4, 5)), end: new Date(Date.UTC(2025, 4, 5)), reason: 'BANK HOLIDAY' },
        { start: new Date(Date.UTC(2025, 4, 23)), end: new Date(Date.UTC(2025, 5, 1)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2025, 6, 23)), end: new Date(Date.UTC(2025, 7, 31)), reason: 'Summer Holidays' },
        { start: new Date(Date.UTC(2025, 9, 24)), end: new Date(Date.UTC(2025, 10, 2)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2025, 11, 18)), end: new Date(Date.UTC(2026, 0, 4)), reason: 'Christmas Holidays' },
        { start: new Date(Date.UTC(2026, 1, 13)), end: new Date(Date.UTC(2026, 1, 22)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2026, 3, 2)), end: new Date(Date.UTC(2026, 3, 19)), reason: 'Easter Holidays' },
        { start: new Date(Date.UTC(2026, 4, 22)), end: new Date(Date.UTC(2026, 4, 31)), reason: 'Holidays' },
        { start: new Date(Date.UTC(2026, 6, 23)), end: new Date(Date.UTC(2026, 7, 31)), reason: 'Summer Holidays' }
    ];

    const bstDate = manualDate ? date : new Date(date.getTime() + 3600000);
    const dateOnly = new Date(Date.UTC(bstDate.getUTCFullYear(), bstDate.getUTCMonth(), bstDate.getUTCDate()));
    const currentHoliday = holidays.find(h => dateOnly >= h.start && dateOnly <= h.end);
    const isSingleDay = currentHoliday.start.getTime() === currentHoliday.end.getTime();
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
            weekBMobileContainer.style.display = currentWeek === 'B' ? 'block' : 'none';
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