/* 日付・時間・色に関する共通ユーティリティ */
(function (global) {
  'use strict';

  const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  // ローカルタイムでの 'YYYY-MM-DD' キーを生成する（UTC変換によるズレを防ぐ）
  function formatDateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function addMonths(date, n) {
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return d;
  }

  function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${pad2(h)}:${pad2(m)}`;
  }

  function formatMonthTitle(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  function formatDayTitle(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAY_LABELS[date.getDay()]})`;
  }

  function formatShortDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]})`;
  }

  function uid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // 背景色に対して読みやすい文字色 (黒/白) を返す
  function contrastTextColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return yiq >= 150 ? '#1a1a1a' : '#ffffff';
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    const m = hex.replace('#', '');
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const num = parseInt(full, 16);
    if (Number.isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  // 複数メンバーの色をストライプ状のグラデーション背景にする
  function buildStripedBackground(colors) {
    if (!colors || colors.length === 0) return '#9e9e9e';
    if (colors.length === 1) return colors[0];
    const step = 100 / colors.length;
    const stops = [];
    colors.forEach((c, i) => {
      stops.push(`${c} ${i * step}%`, `${c} ${(i + 1) * step}%`);
    });
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  global.FCUtils = {
    WEEKDAY_LABELS,
    pad2,
    formatDateKey,
    parseDateKey,
    isSameDay,
    addDays,
    addMonths,
    startOfWeek,
    startOfMonth,
    endOfMonth,
    timeToMinutes,
    minutesToTime,
    formatMonthTitle,
    formatDayTitle,
    formatShortDate,
    uid,
    contrastTextColor,
    hexToRgb,
    buildStripedBackground,
  };
})(window);
