/* localStorage への永続化レイヤー */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'familyCalendarApp.v1';

  // JIS慣用色名に基づく基本10色パレット
  const JIS_COLORS = [
    { name: '赤', hex: '#E60033' },
    { name: '黄赤', hex: '#F08300' },
    { name: '黄', hex: '#FFF100' },
    { name: '黄緑', hex: '#8FC31F' },
    { name: '緑', hex: '#009944' },
    { name: '青緑', hex: '#00A497' },
    { name: '青', hex: '#0068B7' },
    { name: '青紫', hex: '#1D2088' },
    { name: '紫', hex: '#920783' },
    { name: '赤紫', hex: '#E4007F' },
  ];

  function defaultData() {
    return {
      members: [
        { id: 'm-all', name: '全員', color: '#E60033' },
        { id: 'm-father', name: '父', color: '#F08300' },
        { id: 'm-mother', name: '母', color: '#009944' },
        { id: 'm-child1', name: '子供1', color: '#00A497' },
        { id: 'm-child2', name: '子供2', color: '#E4007F' },
      ],
      templates: [
        { id: 't-1', name: '休み' },
        { id: 't-2', name: '歯医者' },
        { id: 't-3', name: 'プール' },
        { id: 't-4', name: 'ロボット教室' },
      ],
      events: [],
    };
  }

  function loadData() {
    let raw = null;
    try {
      raw = global.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('localStorage を利用できません。データは保存されません。', e);
    }
    if (!raw) return defaultData();
    try {
      const parsed = JSON.parse(raw);
      return {
        members: Array.isArray(parsed.members) ? parsed.members : [],
        templates: Array.isArray(parsed.templates) ? parsed.templates : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
      };
    } catch (e) {
      console.warn('保存データの読み込みに失敗しました。初期データを使用します。', e);
      return defaultData();
    }
  }

  function saveData(data) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('データの保存に失敗しました。', e);
    }
  }

  global.FCStorage = { loadData, saveData, defaultData, JIS_COLORS };
})(window);
