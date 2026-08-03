/* 表示する家族メンバーの絞り込み（端末ごとの表示設定。家族データ本体とは別に保存する） */
(function (global) {
  'use strict';

  const State = global.FCState;
  const STORAGE_KEY = 'familyCalendarApp.filter.v1';

  // null は「全員表示」を意味する
  let selected = load();
  const listeners = [];

  function load() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr) : null;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      if (selected === null) {
        global.localStorage.removeItem(STORAGE_KEY);
      } else {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
      }
    } catch (e) {
      /* noop */
    }
  }

  function notify() {
    listeners.forEach((fn) => fn());
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  function isAll() {
    return selected === null;
  }

  function getAllMemberIds() {
    return State.data.members.map((m) => m.id);
  }

  function getSelectedIds() {
    return selected === null ? getAllMemberIds() : Array.from(selected);
  }

  function isSelected(memberId) {
    return selected === null ? true : selected.has(memberId);
  }

  // 現在の全メンバーちょうどを網羅していれば「全員表示」(null)に正規化する
  function normalize(idsSet) {
    const allIds = getAllMemberIds();
    if (allIds.length > 0 && idsSet.size === allIds.length && allIds.every((id) => idsSet.has(id))) {
      return null;
    }
    return idsSet;
  }

  function setSelectedIds(ids) {
    selected = normalize(new Set(ids));
    save();
    notify();
  }

  function toggle(memberId) {
    const current = new Set(selected === null ? getAllMemberIds() : selected);
    if (current.has(memberId)) {
      current.delete(memberId);
    } else {
      current.add(memberId);
    }
    setSelectedIds(Array.from(current));
  }

  function selectAll() {
    selected = null;
    save();
    notify();
  }

  global.FCFilter = {
    isAll,
    isSelected,
    getSelectedIds,
    setSelectedIds,
    toggle,
    selectAll,
    onChange,
  };
})(window);
