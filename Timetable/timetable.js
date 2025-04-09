document.addEventListener('DOMContentLoaded', () => {
    const weekA = document.getElementById('timetable-week-a');
    const weekB = document.getElementById('timetable-week-b');
    const toggleButton = document.getElementById('toggle-button');
    const holidayMessage = document.getElementById('holiday-message');
    const dayNavigation = document.getElementById('day-navigation');
    const prevDayButton = document.getElementById('prev-day');
    const nextDayButton = document.getElementById('next-day');
    const currentDaySpan = document.getElementById('current-day');
    const toggleTimeA = document.getElementById('toggle-time-a');
    const toggleTimeB = document.getElementById('toggle-time-b');
    const timeZoneA = document.getElementById('time-zone-a');
    const timeZoneB = document.getElementById('time-zone-b');
    const holidayOptions = document.getElementById('holiday-options');
    const showReturnTimetable = document.getElementById('show-return-timetable');
    const showWeekTimetable = document.getElementById('show-week-timetable');

    let isUKTime = true;
    let isManualDayChange = false;
    let currentWeek;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Date manuelle prioritaire, sinon auto
    const manualDate = null;
    // Pour auto, mets : const manualDate = null;
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
        const timeCellsA = weekA.querySelectorAll('tbody td[data-uk-time]');
        const timeCellsB = weekB.querySelectorAll('tbody td[data-uk-time]');

        timeCellsA.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });

        timeCellsB.forEach(cell => {
            const ukTime = cell.getAttribute('data-uk-time');
            cell.textContent = isUKTime ? ukTime : convertTime(ukTime);
        });

        timeZoneA.textContent = isUKTime ? '[UK]' : '[FR]';
        timeZoneB.textContent = isUKTime ? '[UK]' : '[FR]';
        toggleTimeA.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';
        toggleTimeB.textContent = isUKTime ? 'Switch to FR' : 'Switch to UK';

        highlightCurrentLesson();
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

    function updateDayDisplay() {
        const currentDay = daysOfWeek[currentDayIndex];
        currentDaySpan.textContent = currentDay;

        const tables = document.querySelectorAll('.timetable-table');
        tables.forEach(table => {
            const headers = table.querySelectorAll('th');
            const rows = table.querySelectorAll('tbody tr');
            headers.forEach((th, index) => {
                th.classList.remove('current-day');
                if (th.textContent.includes(currentDay)) {
                    th.classList.add('current-day');
                }
            });
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((td, index) => {
                    td.classList.remove('current-day');
                    if (index === currentDayIndex + 1) {
                        td.classList.add('current-day');
                    }
                });
            });
        });

        highlightCurrentLesson();
    }

    function highlightCurrentLesson() {
        const allCells = document.querySelectorAll('.timetable-table td');
        allCells.forEach(cell => cell.classList.remove('current-lesson'));

        if (isManualDayChange || manualDate) {
            return;
        }

        const now = new Date();
        const bstNow = new Date(now.getTime() + 3600000);
        const ukHours = bstNow.getUTCHours();
        const currentMinutes = bstNow.getUTCMinutes();

        const currentTimeInMinutes = ukHours * 60 + currentMinutes;

        const currentDay = daysOfWeek[currentDayIndex];

        const activeTable = weekA.style.display === 'block' ? weekA : weekB;

        const timeCells = activeTable.querySelectorAll('tbody td[data-uk-time]');
        let currentLessonFound = false;

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
                    weekA.style.display = currentWeek === 'A' ? 'block' : 'none';
                    weekB.style.display = currentWeek === 'B' ? 'block' : 'none';
                    toggleButton.style.display = 'block';
                    if (window.innerWidth <= 768) {
                        dayNavigation.style.display = 'flex';
                    }
                }
            }

            if (window.innerWidth <= 768) {
                updateDayDisplay();
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
            weekA.style.display = 'none';
            weekB.style.display = 'none';
            toggleButton.style.display = 'none';
            dayNavigation.style.display = 'none';

            showReturnTimetable.onclick = () => {
                const returnDate = getReturnDate(currentHoliday.end);
                currentWeek = getWeekType(returnDate);
                currentDayIndex = returnDate.getUTCDay() - 1;
                weekA.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekB.style.display = currentWeek === 'B' ? 'block' : 'none';
                toggleButton.style.display = 'block';
                if (window.innerWidth <= 768) {
                    dayNavigation.style.display = 'flex';
                    updateDayDisplay();
                }
                holidayMessage.textContent = `Show the timetable for the first week back, starting ${returnDate.toUTCString()} (Week ${currentWeek})`;
                holidayOptions.style.display = 'none';
            };
        } else {
            holidayMessage.textContent = `No classes today: ${reason}`;
            holidayMessage.style.display = 'block';
            holidayOptions.style.display = 'flex';
            showReturnTimetable.style.display = 'none';
            showWeekTimetable.style.display = 'block';
            weekA.style.display = 'none';
            weekB.style.display = 'none';
            toggleButton.style.display = 'none';
            dayNavigation.style.display = 'none';

            showWeekTimetable.textContent = window.innerWidth <= 768 ? 'Show Next Day' : 'Show Timetable for This Week';
            showWeekTimetable.onclick = () => {
                currentWeek = getWeekType(date);
                weekA.style.display = currentWeek === 'A' ? 'block' : 'none';
                weekB.style.display = currentWeek === 'B' ? 'block' : 'none';
                toggleButton.style.display = 'block';
                if (window.innerWidth <= 768) {
                    currentDayIndex = (currentDayIndex + 1) % 5;
                    dayNavigation.style.display = 'flex';
                    updateDayDisplay();
                    holidayMessage.textContent = `Today is ${reason}. Showing timetable for ${daysOfWeek[currentDayIndex]}`;
                } else {
                    holidayMessage.textContent = `Today is ${reason}. Showing timetable for this week (Week ${currentWeek})`;
                }
                holidayOptions.style.display = 'none';
            };
        }
    }

    toggleTimeA.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });

    toggleTimeB.addEventListener('click', () => {
        isUKTime = !isUKTime;
        updateTimes();
    });

    const holidayReason = isHolidayOrClosure(today);

    if (holidayReason) {
        handleHoliday(today, holidayReason);
    } else {
        currentWeek = getWeekType(today);

        if (currentWeek === 'A') {
            weekA.style.display = 'block';
            weekB.style.display = 'none';
            toggleButton.textContent = 'Switch to Week B';
        } else {
            weekA.style.display = 'none';
            weekB.style.display = 'block';
            toggleButton.textContent = 'Switch to Week A';
        }

        toggleButton.addEventListener('click', () => {
            if (currentWeek === 'A') {
                weekA.style.display = 'none';
                weekB.style.display = 'block';
                toggleButton.textContent = 'Switch to Week A';
                currentWeek = 'B';
            } else {
                weekA.style.display = 'block';
                weekB.style.display = 'none';
                toggleButton.textContent = 'Switch to Week B';
                currentWeek = 'A';
            }
            if (window.innerWidth <= 768) {
                updateDayDisplay();
            } else {
                highlightCurrentLesson();
            }
        });

        if (window.innerWidth <= 768) {
            dayNavigation.style.display = 'flex';
            updateDayDisplay();
        }

        prevDayButton.addEventListener('click', () => {
            currentDayIndex = Math.max(0, currentDayIndex - 1);
            isManualDayChange = true;
            updateDayDisplay();
        });

        nextDayButton.addEventListener('click', () => {
            currentDayIndex = Math.min(daysOfWeek.length - 1, currentDayIndex + 1);
            isManualDayChange = true;
            updateDayDisplay();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                dayNavigation.style.display = 'flex';
                updateDayDisplay();
            } else {
                dayNavigation.style.display = 'none';
                highlightCurrentLesson();
            }
        });

        updateTimes();
        highlightCurrentLesson();
        if (!manualDate) setInterval(checkDayChange, 1000);
    }
});