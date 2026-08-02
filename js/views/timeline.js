/* 週表示・日表示（縦軸=日付、横軸=時間のタイムライン） */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;
  const Holidays = global.FCHolidays;

  const ROW_LABEL_WIDTH = 96; // css の .fc-timeline-corner / .fc-timeline-row-label と一致させる
  const MIN_HOUR_WIDTH = 48; // 画面が狭い場合でも最低限これ以上は確保する
  const CORE_START_HOUR = 8;
  const CORE_END_HOUR = 19;
  const CORE_HOURS_COUNT = CORE_END_HOUR - CORE_START_HOUR; // 8:00〜19:00 のちょうど11時間
  const EVENT_H = 32;
  const EVENT_GAP = 4;
  const ALLDAY_BAR_H = 26;
  const ALLDAY_GAP = 3;
  const DEFAULT_DURATION = 60; // 終了時刻未入力の場合の既定の長さ(分)

  function dateColorClass(date) {
    if (Holidays.getHolidayName(date)) return 'fc-color-holiday';
    if (date.getDay() === 0) return 'fc-color-sunday';
    if (date.getDay() === 6) return 'fc-color-saturday';
    return '';
  }

  // 担当家族が複数いる予定は、家族ごとに1件ずつのインスタンスに展開する
  function explodeByMember(events) {
    const out = [];
    events.forEach((evt) => {
      const members = State.getMembersByIds(evt.memberIds);
      if (members.length === 0) {
        out.push({ evt, member: null });
      } else {
        members.forEach((member) => out.push({ evt, member }));
      }
    });
    return out;
  }

  function assignLanes(instances) {
    const sorted = instances
      .map((inst) => ({
        inst,
        start: U.timeToMinutes(inst.evt.startTime),
        end: inst.evt.endTime
          ? U.timeToMinutes(inst.evt.endTime)
          : U.timeToMinutes(inst.evt.startTime) + DEFAULT_DURATION,
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

  function buildEventBlock(item, hourWidth) {
    const { evt, member } = item.inst;
    const bg = member ? member.color : '#9e9e9e';
    const textColor = member ? U.contrastTextColor(member.color) : '#ffffff';
    const namePrefix = member ? `[${member.name}] ` : '';

    const left = (item.start / 60) * hourWidth;
    const width = Math.max(((item.end - item.start) / 60) * hourWidth, 24);

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

  function buildAllDayBar(inst) {
    const { evt, member } = inst;
    const bg = member ? member.color : '#9e9e9e';
    const textColor = member ? U.contrastTextColor(member.color) : '#ffffff';
    const namePrefix = member ? `[${member.name}] ` : '';

    const bar = document.createElement('div');
    bar.className = 'fc-allday-bar';
    bar.style.background = bg;
    bar.style.color = textColor;
    bar.dataset.eventId = evt.id;
    bar.title = `${namePrefix}${evt.title}`;
    bar.textContent = `${namePrefix}${evt.title}`;
    return bar;
  }

  function buildHourHeader(hourWidth, trackWidth) {
    const hours = document.createElement('div');
    hours.className = 'fc-timeline-hours';
    hours.style.width = `${trackWidth}px`;
    for (let h = 0; h < 24; h++) {
      const label = document.createElement('div');
      label.className = 'fc-hour-label';
      label.style.width = `${hourWidth}px`;
      label.textContent = `${U.pad2(h)}:00`;
      hours.appendChild(label);
    }
    return hours;
  }

  function buildRow(date, callbacks, hourWidth, trackWidth) {
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
    const allDayInstances = explodeByMember(allEvents.filter((e) => e.allDay));
    const timedInstances = explodeByMember(allEvents.filter((e) => !e.allDay));

    if (allDayInstances.length) {
      const stripWrap = document.createElement('div');
      stripWrap.className = 'fc-timeline-allday-strip';
      stripWrap.style.width = `${trackWidth}px`;
      allDayInstances.forEach((inst) => {
        const bar = buildAllDayBar(inst);
        bar.addEventListener('click', (ev) => {
          ev.stopPropagation();
          callbacks.onEventClick(inst.evt.id);
        });
        stripWrap.appendChild(bar);
      });
      main.appendChild(stripWrap);
    }

    const { items, laneCount } = assignLanes(timedInstances);
    const track = document.createElement('div');
    track.className = 'fc-timeline-track';
    track.style.width = `${trackWidth}px`;
    track.style.height = `${laneCount * (EVENT_H + EVENT_GAP) + EVENT_GAP}px`;
    track.style.backgroundSize = `${hourWidth}px 100%`;

    const core = document.createElement('div');
    core.className = 'fc-core-hours';
    core.style.left = `${CORE_START_HOUR * hourWidth}px`;
    core.style.width = `${CORE_HOURS_COUNT * hourWidth}px`;
    track.appendChild(core);

    const today = new Date();
    if (U.isSameDay(date, today)) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      const nowLine = document.createElement('div');
      nowLine.className = 'fc-now-line';
      nowLine.style.left = `${(nowMinutes / 60) * hourWidth}px`;
      track.appendChild(nowLine);
    }

    items.forEach((item) => {
      const block = buildEventBlock(item, hourWidth);
      block.addEventListener('click', (ev) => {
        ev.stopPropagation();
        callbacks.onEventClick(item.inst.evt.id);
      });
      track.appendChild(block);
    });

    track.addEventListener('click', (ev) => {
      if (ev.target !== track) return;
      const rect = track.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      let minutes = Math.round((x / hourWidth) * 60);
      minutes = Math.max(0, Math.min(23 * 60 + 30, Math.round(minutes / 30) * 30));
      callbacks.onSlotClick(dateKey, minutes);
    });

    main.appendChild(track);
    row.appendChild(main);
    return row;
  }

  function render(container, mode, refDate, callbacks) {
    container.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'fc-timeline-view';
    container.appendChild(view);

    // 8:00〜19:00のちょうど11時間が既定でぴったり収まるよう、幅から時間単価を逆算する
    const availableWidth = view.clientWidth || container.clientWidth;
    const hourWidth = Math.max(MIN_HOUR_WIDTH, Math.floor((availableWidth - ROW_LABEL_WIDTH) / CORE_HOURS_COUNT));
    const trackWidth = hourWidth * 24;

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
    headerRow.appendChild(buildHourHeader(hourWidth, trackWidth));
    inner.appendChild(headerRow);

    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'fc-timeline-rows';

    const dates = mode === 'week'
      ? Array.from({ length: 7 }, (_, i) => U.addDays(U.startOfWeek(refDate), i))
      : [refDate];

    dates.forEach((date) => {
      rowsWrap.appendChild(buildRow(date, callbacks, hourWidth, trackWidth));
    });

    inner.appendChild(rowsWrap);
    scroll.appendChild(inner);
    view.appendChild(scroll);

    requestAnimationFrame(() => {
      scroll.scrollLeft = CORE_START_HOUR * hourWidth;
    });
  }

  global.FCTimelineView = { render };
})(window);
