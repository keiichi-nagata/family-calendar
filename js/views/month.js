/* 月表示 */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;
  const Holidays = global.FCHolidays;
  const Filter = global.FCFilter;

  function dateColorClass(date) {
    if (Holidays.getHolidayName(date)) return 'fc-color-holiday';
    if (date.getDay() === 0) return 'fc-color-sunday';
    if (date.getDay() === 6) return 'fc-color-saturday';
    return '';
  }

  function buildEventChip(evt, member) {
    const bg = member ? member.color : '#9e9e9e';
    const textColor = member ? U.contrastTextColor(member.color) : '#ffffff';
    const namePrefix = member ? `[${member.name}] ` : '';
    const timePrefix = evt.allDay
      ? '終日 '
      : evt.startTime
        ? `${evt.startTime}${evt.endTime ? '〜' + evt.endTime : ''} `
        : '';

    const chip = document.createElement('div');
    chip.className = 'fc-event-chip';
    chip.style.background = bg;
    chip.style.color = textColor;
    chip.dataset.eventId = evt.id;
    chip.title = `${timePrefix}${namePrefix}${evt.title}`;
    chip.textContent = `${namePrefix}${evt.title}`;
    return chip;
  }

  // 担当家族が複数いる予定は家族ごとに1行ずつに分解し、家族設定の並び順で表示する
  function getSortedInstances(dateKey) {
    const instances = [];
    State.getEventsForDate(dateKey).forEach((evt) => {
      const assignedMembers = State.getMembersByIds(evt.memberIds);
      if (assignedMembers.length === 0) {
        instances.push({ evt, member: null });
      } else {
        assignedMembers
          .filter((member) => Filter.isSelected(member.id))
          .forEach((member) => instances.push({ evt, member }));
      }
    });
    instances.sort((a, b) => {
      const ia = a.member ? State.getMemberIndex(a.member.id) : Infinity;
      const ib = b.member ? State.getMemberIndex(b.member.id) : Infinity;
      if (ia !== ib) return ia - ib;
      if (a.evt.allDay && !b.evt.allDay) return -1;
      if (!a.evt.allDay && b.evt.allDay) return 1;
      return (a.evt.startTime || '').localeCompare(b.evt.startTime || '');
    });
    return instances;
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
      getSortedInstances(dateKey).forEach(({ evt, member }) => {
        const chip = buildEventChip(evt, member);
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
