/* 月表示 */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;
  const Holidays = global.FCHolidays;

  function dateColorClass(date) {
    if (Holidays.getHolidayName(date)) return 'fc-color-holiday';
    if (date.getDay() === 0) return 'fc-color-sunday';
    if (date.getDay() === 6) return 'fc-color-saturday';
    return '';
  }

  function buildEventChip(evt) {
    const members = State.getMembersByIds(evt.memberIds);
    const colors = members.map((m) => m.color);
    const bg = U.buildStripedBackground(colors);
    const textColor = colors.length === 1 ? U.contrastTextColor(colors[0]) : '#ffffff';
    const namePrefix = members.length ? `[${members.map((m) => m.name).join('・')}] ` : '';
    const timePrefix = !evt.allDay && evt.startTime ? `${evt.startTime} ` : '';

    const chip = document.createElement('div');
    chip.className = 'fc-event-chip';
    chip.style.background = bg;
    chip.style.color = textColor;
    chip.dataset.eventId = evt.id;
    chip.title = `${namePrefix}${evt.title}`;
    chip.textContent = `${timePrefix}${namePrefix}${evt.title}`;
    return chip;
  }

  function render(container, refDate, callbacks) {
    container.innerHTML = '';
    const view = document.createElement('div');
    view.className = 'fc-month-view';

    const header = document.createElement('div');
    header.className = 'fc-month-header';
    U.WEEKDAY_LABELS.forEach((label, i) => {
      const cell = document.createElement('div');
      cell.className = 'fc-month-header-cell';
      if (i === 0) cell.classList.add('fc-color-sunday');
      if (i === 6) cell.classList.add('fc-color-saturday');
      cell.textContent = label;
      header.appendChild(cell);
    });
    view.appendChild(header);

    const body = document.createElement('div');
    body.className = 'fc-month-body';

    const monthStart = U.startOfMonth(refDate);
    const monthEnd = U.endOfMonth(refDate);
    const gridStart = U.startOfWeek(monthStart);
    const gridEnd = U.addDays(U.startOfWeek(monthEnd), 6);
    const totalCells = Math.round((gridEnd - gridStart) / 86400000) + 1;

    const today = new Date();

    for (let i = 0; i < totalCells; i++) {
      const date = U.addDays(gridStart, i);
      const dateKey = U.formatDateKey(date);
      const outside = date.getMonth() !== refDate.getMonth();
      const isToday = U.isSameDay(date, today);

      const cell = document.createElement('div');
      cell.className = 'fc-month-cell' + (outside ? ' fc-outside-month' : '') + (isToday ? ' fc-today' : '');
      cell.dataset.date = dateKey;

      const cellHeader = document.createElement('div');
      cellHeader.className = 'fc-month-cell-header';

      const dateLabel = document.createElement('span');
      dateLabel.className = 'fc-month-cell-date ' + dateColorClass(date);
      dateLabel.textContent = String(date.getDate());
      cellHeader.appendChild(dateLabel);

      const holidayName = Holidays.getHolidayName(date);
      if (holidayName) {
        const holidaySpan = document.createElement('span');
        holidaySpan.className = 'fc-month-cell-holiday-name';
        holidaySpan.textContent = holidayName;
        cellHeader.appendChild(holidaySpan);
      }

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'fc-add-event-btn';
      addBtn.textContent = '+';
      addBtn.title = '予定を追加';
      addBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        callbacks.onDayClick(dateKey);
      });
      cellHeader.appendChild(addBtn);

      cell.appendChild(cellHeader);

      const eventsWrap = document.createElement('div');
      eventsWrap.className = 'fc-month-cell-events';
      State.getEventsForDate(dateKey).forEach((evt) => {
        const chip = buildEventChip(evt);
        chip.addEventListener('click', (ev) => {
          ev.stopPropagation();
          callbacks.onEventClick(evt.id);
        });
        eventsWrap.appendChild(chip);
      });
      cell.appendChild(eventsWrap);

      cell.addEventListener('click', () => callbacks.onDayClick(dateKey));

      body.appendChild(cell);
    }

    view.appendChild(body);
    container.appendChild(view);
  }

  global.FCMonthView = { render };
})(window);
