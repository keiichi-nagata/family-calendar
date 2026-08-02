/* 週表示・日表示（縦軸=日付、横軸=時間のタイムライン） */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;
  const Holidays = global.FCHolidays;

  const HOUR_WIDTH = 72; // 1時間あたりの幅(px)
  const TRACK_WIDTH = HOUR_WIDTH * 24;
  const EVENT_H = 32;
  const EVENT_GAP = 4;
  const DEFAULT_DURATION = 60; // 終了時刻未入力の場合の既定の長さ(分)
  const CORE_START = 8 * 60;
  const CORE_END = 19 * 60;

  function dateColorClass(date) {
    if (Holidays.getHolidayName(date)) return 'fc-color-holiday';
    if (date.getDay() === 0) return 'fc-color-sunday';
    if (date.getDay() === 6) return 'fc-color-saturday';
    return '';
  }

  function assignLanes(events) {
    const sorted = events
      .map((e) => ({
        evt: e,
        start: U.timeToMinutes(e.startTime),
        end: e.endTime ? U.timeToMinutes(e.endTime) : U.timeToMinutes(e.startTime) + DEFAULT_DURATION,
      }))
      .sort((a, b) => a.start - b.start);

    const laneEnds = [];
    sorted.forEach((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = Math.max(item.end, item.start + 15);
      item.lane = lane;
    });
    return { items: sorted, laneCount: Math.max(1, laneEnds.length) };
  }

  function buildEventBlock(item) {
    const evt = item.evt;
    const members = State.getMembersByIds(evt.memberIds);
    const colors = members.map((m) => m.color);
    const bg = U.buildStripedBackground(colors);
    const textColor = colors.length === 1 ? U.contrastTextColor(colors[0]) : '#ffffff';
    const namePrefix = members.length ? `[${members.map((m) => m.name).join('・')}] ` : '';

    const left = (item.start / 60) * HOUR_WIDTH;
    const width = Math.max(((item.end - item.start) / 60) * HOUR_WIDTH, 24);

    const block = document.createElement('div');
    block.className = 'fc-timed-event';
    block.style.left = `${left}px`;
    block.style.width = `${width}px`;
    block.style.top = `${item.lane * (EVENT_H + EVENT_GAP) + EVENT_GAP}px`;
    block.style.height = `${EVENT_H}px`;
    block.style.background = bg;
    block.style.color = textColor;
    block.dataset.eventId = evt.id;
    block.title = `${evt.startTime}${evt.endTime ? '〜' + evt.endTime : ''} ${namePrefix}${evt.title}`;
    block.textContent = `${namePrefix}${evt.title}`;
    return block;
  }

  function buildAllDayChip(evt) {
    const members = State.getMembersByIds(evt.memberIds);
    const colors = members.map((m) => m.color);
    const bg = U.buildStripedBackground(colors);
    const textColor = colors.length === 1 ? U.contrastTextColor(colors[0]) : '#ffffff';
    const namePrefix = members.length ? `[${members.map((m) => m.name).join('・')}] ` : '';

    const chip = document.createElement('div');
    chip.className = 'fc-allday-chip';
    chip.style.background = bg;
    chip.style.color = textColor;
    chip.dataset.eventId = evt.id;
    chip.textContent = `${namePrefix}${evt.title}`;
    return chip;
  }

  function buildHourHeader() {
    const hours = document.createElement('div');
    hours.className = 'fc-timeline-hours';
    hours.style.width = `${TRACK_WIDTH}px`;
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'fc-hour-label';
      label.style.width = `${HOUR_WIDTH}px`;
      label.textContent = `${U.pad2(h)}:00`;
      hours.appendChild(label);
    }
    return hours;
  }

  function buildRow(date, callbacks) {
    const dateKey = U.formatDateKey(date);
    const row = document.createElement('div');
    row.className = 'fc-timeline-row';

    const label = document.createElement('div');
    label.className = 'fc-timeline-row-label';
    const dateSpan = document.createElement('div');
    dateSpan.className = 'fc-timeline-row-date ' + dateColorClass(date);
    dateSpan.textContent = U.formatShortDate(date);
    label.appendChild(dateSpan);
    const holidayName = Holidays.getHolidayName(date);
    if (holidayName) {
      const holidaySpan = document.createElement('div');
      holidaySpan.className = 'fc-timeline-row-holiday';
      holidaySpan.textContent = holidayName;
      label.appendChild(holidaySpan);
    }
    row.appendChild(label);

    const main = document.createElement('div');
    main.className = 'fc-timeline-row-main';

    const allEvents = State.getEventsForDate(dateKey);
    const allDayEvents = allEvents.filter((e) => e.allDay);
    const timedEvents = allEvents.filter((e) => !e.allDay);

    if (allDayEvents.length) {
      const stripLabel = document.createElement('div');
      stripLabel.className = 'fc-allday-label';
      stripLabel.textContent = '終日';
      const stripWrap = document.createElement('div');
      stripWrap.className = 'fc-timeline-allday-strip';
      stripWrap.appendChild(stripLabel);
      allDayEvents.forEach((evt) => {
        const chip = buildAllDayChip(evt);
        chip.addEventListener('click', (ev) => {
          ev.stopPropagation();
          callbacks.onEventClick(evt.id);
        });
        stripWrap.appendChild(chip);
      });
      main.appendChild(stripWrap);
    }

    const { items, laneCount } = assignLanes(timedEvents);
    const track = document.createElement('div');
    track.className = 'fc-timeline-track';
    track.style.width = `${TRACK_WIDTH}px`;
    track.style.height = `${laneCount * (EVENT_H + EVENT_GAP) + EVENT_GAP}px`;
    track.style.backgroundSize = `${HOUR_WIDTH}px 100%`;

    const core = document.createElement('div');
    core.className = 'fc-core-hours';
    core.style.left = `${(CORE_START / 60) * HOUR_WIDTH}px`;
    core.style.width = `${((CORE_END - CORE_START) / 60) * HOUR_WIDTH}px`;
    track.appendChild(core);

    const today = new Date();
    if (U.isSameDay(date, today)) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      const nowLine = document.createElement('div');
      nowLine.className = 'fc-now-line';
      nowLine.style.left = `${(nowMinutes / 60) * HOUR_WIDTH}px`;
      track.appendChild(nowLine);
    }

    items.forEach((item) => {
      const block = buildEventBlock(item);
      block.addEventListener('click', (ev) => {
        ev.stopPropagation();
        callbacks.onEventClick(item.evt.id);
      });
      track.appendChild(block);
    });

    track.addEventListener('click', (ev) => {
      if (ev.target !== track) return;
      const rect = track.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      let minutes = Math.round((x / HOUR_WIDTH) * 60);
      minutes = Math.max(0, Math.min(23 * 60 + 30, Math.round(minutes / 30) * 30));
      callbacks.onSlotClick(dateKey, minutes);
    });

    main.appendChild(track);
    row.appendChild(main);
    return row;
  }

  function render(container, mode, refDate, callbacks) {
    container.innerHTML = '';

    const scroll = document.createElement('div');
    scroll.className = 'fc-timeline-scroll';

    const inner = document.createElement('div');
    inner.className = 'fc-timeline-inner';

    const headerRow = document.createElement('div');
    headerRow.className = 'fc-timeline-header-row';
    const corner = document.createElement('div');
    corner.className = 'fc-timeline-corner';
    corner.innerHTML = '&nbsp;';
    headerRow.appendChild(corner);
    headerRow.appendChild(buildHourHeader());
    inner.appendChild(headerRow);

    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'fc-timeline-rows';

    const dates = mode === 'week'
      ? Array.from({ length: 7 }, (_, i) => U.addDays(U.startOfWeek(refDate), i))
      : [refDate];

    dates.forEach((date) => {
      rowsWrap.appendChild(buildRow(date, callbacks));
    });

    inner.appendChild(rowsWrap);
    scroll.appendChild(inner);
    container.appendChild(scroll);

    requestAnimationFrame(() => {
      scroll.scrollLeft = CORE_START / 60 * HOUR_WIDTH;
    });
  }

  global.FCTimelineView = { render, HOUR_WIDTH };
})(window);
