/* アプリ全体のコントローラー：表示切替・ナビゲーション・イベント配線 */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;

  let currentView = 'month';
  let currentDate = new Date();

  const periodTitleEl = document.getElementById('periodTitle');
  const periodTitleMobileEl = document.getElementById('periodTitleMobile');
  const calendarBodyEl = document.getElementById('calendarBody');
  const tabButtons = Array.from(document.querySelectorAll('.fc-tab-btn'));

  function updatePeriodTitle() {
    let text;
    if (currentView === 'month') {
      text = U.formatMonthTitle(currentDate);
    } else if (currentView === 'day') {
      text = U.formatDayTitle(currentDate);
    } else {
      const start = U.startOfWeek(currentDate);
      const end = U.addDays(start, 6);
      const sameMonth = start.getMonth() === end.getMonth();
      text = sameMonth
        ? `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 〜 ${end.getDate()}日`
        : `${start.getMonth() + 1}月${start.getDate()}日 〜 ${end.getMonth() + 1}月${end.getDate()}日`;
    }
    periodTitleEl.textContent = text;
    periodTitleMobileEl.textContent = text;
  }

  const eventCallbacks = {
    onDayClick(dateKey) {
      global.FCEventForm.open({ date: dateKey }, renderCalendar);
    },
    onSlotClick(dateKey, minutes) {
      global.FCEventForm.open({ date: dateKey, time: minutes }, renderCalendar);
    },
    onEventClick(eventId) {
      global.FCEventForm.open({ eventId }, renderCalendar);
    },
  };

  function renderCalendar() {
    updatePeriodTitle();
    if (currentView === 'month') {
      global.FCMonthView.render(calendarBodyEl, currentDate, eventCallbacks);
    } else {
      global.FCTimelineView.render(calendarBodyEl, currentView, currentDate, eventCallbacks);
    }
  }

  function setView(view) {
    currentView = view;
    tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
    renderCalendar();
  }

  function navigate(direction) {
    if (currentView === 'month') {
      currentDate = U.addMonths(currentDate, direction);
    } else if (currentView === 'week') {
      currentDate = U.addDays(currentDate, direction * 7);
    } else {
      currentDate = U.addDays(currentDate, direction);
    }
    renderCalendar();
  }

  function goToday() {
    currentDate = new Date();
    renderCalendar();
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
  document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
  document.getElementById('todayBtn').addEventListener('click', goToday);

  document.getElementById('addEventBtn').addEventListener('click', () => {
    global.FCEventForm.open({ date: U.formatDateKey(currentDate) }, renderCalendar);
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    global.FCSettings.open();
  });

  State.onChange(renderCalendar);
  if (global.FCSync) {
    global.FCSync.onStatusChange((status, message) => {
      if (status === 'error') console.warn('オンライン同期エラー:', message);
    });
    // 再接続時はプロンプトを出さず常にクラウド側のデータを正として取り込む
    global.FCSync.autoConnectIfConfigured(() => true);
  }

  renderCalendar();
})(window);
