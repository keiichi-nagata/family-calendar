/* アプリの状態管理（家族メンバー・テンプレート・予定のCRUD） */
(function (global) {
  'use strict';

  const { uid } = global.FCUtils;

  const listeners = [];
  let data = global.FCStorage.loadData();

  function persist() {
    global.FCStorage.saveData(data);
  }

  function notify() {
    listeners.forEach((fn) => fn(data));
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  function commit() {
    persist();
    notify();
  }

  // 他端末（Firestore等）から受け取ったデータで丸ごと置き換える
  function replaceAll(newData) {
    data = {
      members: Array.isArray(newData.members) ? newData.members : [],
      templates: Array.isArray(newData.templates) ? newData.templates : [],
      events: Array.isArray(newData.events) ? newData.events : [],
    };
    persist();
    notify();
  }

  // --- 家族メンバー ---
  function addMember(name, color) {
    data.members.push({ id: uid(), name: name.trim(), color });
    commit();
  }

  function updateMember(id, patch) {
    const m = data.members.find((x) => x.id === id);
    if (!m) return;
    Object.assign(m, patch);
    commit();
  }

  function deleteMember(id) {
    data.members = data.members.filter((x) => x.id !== id);
    data.events.forEach((e) => {
      e.memberIds = (e.memberIds || []).filter((mid) => mid !== id);
    });
    commit();
  }

  // --- よく使う予定テンプレート ---
  function addTemplate(name) {
    data.templates.push({ id: uid(), name: name.trim() });
    commit();
  }

  function updateTemplate(id, name) {
    const t = data.templates.find((x) => x.id === id);
    if (!t) return;
    t.name = name.trim();
    commit();
  }

  function deleteTemplate(id) {
    data.templates = data.templates.filter((x) => x.id !== id);
    commit();
  }

  // --- 予定 ---
  function addEvent(evt) {
    const record = Object.assign({ id: uid() }, evt);
    data.events.push(record);
    commit();
    return record;
  }

  function updateEvent(id, patch) {
    const e = data.events.find((x) => x.id === id);
    if (!e) return;
    Object.assign(e, patch);
    commit();
  }

  function deleteEvent(id) {
    data.events = data.events.filter((x) => x.id !== id);
    commit();
  }

  function getEventsForDate(dateKey) {
    return data.events
      .filter((e) => dateKey >= e.date && dateKey <= (e.endDate || e.date))
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        if (a.allDay && b.allDay) return 0;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }

  function getMember(id) {
    return data.members.find((x) => x.id === id);
  }

  function getMembersByIds(ids) {
    return (ids || []).map((id) => getMember(id)).filter(Boolean);
  }

  // 家族設定での並び順（登録順）でのインデックスを返す。見つからない場合は末尾扱い
  function getMemberIndex(id) {
    const idx = data.members.findIndex((x) => x.id === id);
    return idx === -1 ? Infinity : idx;
  }

  global.FCState = {
    get data() {
      return data;
    },
    onChange,
    replaceAll,
    addMember,
    updateMember,
    deleteMember,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getMember,
    getMembersByIds,
    getMemberIndex,
  };
})(window);
