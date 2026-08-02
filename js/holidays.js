/* 日本の祝日計算（1980〜2099年の近似天文計算式に基づく振替休日・国民の休日を含む） */
(function (global) {
  'use strict';

  const { pad2 } = global.FCUtils;

  const cache = new Map();

  function dateKey(y, m, d) {
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  function equinoxDay(year, kind) {
    if (kind === 'spring') {
      return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  // 指定月の n 番目の月曜日の日付を返す（ハッピーマンデー制度）
  function nthMonday(year, month, n) {
    let count = 0;
    const lastDay = new Date(year, month, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      if (new Date(year, month - 1, day).getDay() === 1) {
        count++;
        if (count === n) return day;
      }
    }
    return null;
  }

  function computeYear(year) {
    const holidays = {};
    const add = (m, d, name) => {
      if (!m || !d) return;
      holidays[dateKey(year, m, d)] = name;
    };

    add(1, 1, '元日');
    add(1, nthMonday(year, 1, 2), '成人の日');
    add(2, 11, '建国記念の日');
    if (year >= 2020) add(2, 23, '天皇誕生日');
    add(3, equinoxDay(year, 'spring'), '春分の日');
    if (year >= 1989) add(4, 29, '昭和の日');
    add(5, 3, '憲法記念日');
    add(5, 4, 'みどりの日');
    add(5, 5, 'こどもの日');

    // 海の日・山の日・スポーツの日は2020/2021年に東京オリンピック特例で移動している
    if (year === 2020) {
      add(7, 23, '海の日');
      add(7, 24, 'スポーツの日');
      add(8, 10, '山の日');
    } else if (year === 2021) {
      add(7, 22, '海の日');
      add(7, 23, 'スポーツの日');
      add(8, 8, '山の日');
    } else {
      if (year >= 2003) add(7, nthMonday(year, 7, 3), '海の日');
      if (year >= 2016) add(8, 11, '山の日');
      if (year >= 2020) {
        add(10, nthMonday(year, 10, 2), 'スポーツの日');
      } else if (year >= 2000) {
        add(10, nthMonday(year, 10, 2), '体育の日');
      }
    }

    add(9, nthMonday(year, 9, 3), '敬老の日');
    add(9, equinoxDay(year, 'autumn'), '秋分の日');
    add(11, 3, '文化の日');
    add(11, 23, '勤労感謝の日');

    // 国民の休日：前後を祝日に挟まれた（日曜でない）平日
    const sortedEntries = Object.keys(holidays).sort();
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const d1 = new Date(sortedEntries[i]);
      const d2 = new Date(sortedEntries[i + 1]);
      const diffDays = Math.round((d2 - d1) / 86400000);
      if (diffDays === 2) {
        const mid = new Date(d1);
        mid.setDate(d1.getDate() + 1);
        const midKey = dateKey(mid.getFullYear(), mid.getMonth() + 1, mid.getDate());
        if (!holidays[midKey] && mid.getDay() !== 0) {
          holidays[midKey] = '国民の休日';
        }
      }
    }

    // 振替休日：祝日が日曜に重なった場合、直後の祝日でない日を休日にする
    const baseKeys = Object.keys(holidays);
    for (const key of baseKeys) {
      const d = new Date(key);
      if (d.getDay() === 0) {
        const sub = new Date(d);
        do {
          sub.setDate(sub.getDate() + 1);
        } while (holidays[dateKey(sub.getFullYear(), sub.getMonth() + 1, sub.getDate())]);
        holidays[dateKey(sub.getFullYear(), sub.getMonth() + 1, sub.getDate())] = '振替休日';
      }
    }

    return holidays;
  }

  function getHolidaysForYear(year) {
    if (!cache.has(year)) {
      cache.set(year, computeYear(year));
    }
    return cache.get(year);
  }

  function getHolidayName(date) {
    const holidays = getHolidaysForYear(date.getFullYear());
    return holidays[dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate())] || null;
  }

  global.FCHolidays = { getHolidayName, getHolidaysForYear };
})(window);
