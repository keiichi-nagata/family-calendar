/* 表示メンバー絞り込みボタン・ドロップダウン */
(function (global) {
  'use strict';

  const State = global.FCState;
  const Filter = global.FCFilter;

  function computeButtonLabel() {
    if (Filter.isAll()) return '👪 全員';
    const ids = Filter.getSelectedIds();
    if (ids.length === 0) return '👪 表示なし';
    const names = ids.map((id) => State.getMember(id)).filter(Boolean).map((m) => m.name);
    if (names.length <= 2) return `👪 ${names.join('・')}`;
    return `👪 ${names.length}人`;
  }

  function init(buttonEl, panelEl) {
    function close() {
      panelEl.hidden = true;
    }

    function renderPanel() {
      panelEl.innerHTML = '';

      const header = document.createElement('div');
      header.className = 'fc-member-filter-panel-header';

      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'fc-btn fc-btn-small fc-member-filter-all';
      allBtn.textContent = 'すべて表示';
      allBtn.addEventListener('click', () => Filter.selectAll());

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'fc-member-filter-close';
      closeBtn.setAttribute('aria-label', '閉じる');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', close);

      header.appendChild(allBtn);
      header.appendChild(closeBtn);
      panelEl.appendChild(header);

      State.data.members.forEach((m) => {
        const label = document.createElement('label');
        label.className = 'fc-member-filter-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.memberId = m.id;
        checkbox.checked = Filter.isSelected(m.id);
        checkbox.addEventListener('change', () => Filter.toggle(m.id));

        const dot = document.createElement('span');
        dot.className = 'fc-color-dot';
        dot.style.background = m.color;

        const name = document.createElement('span');
        name.textContent = m.name;

        label.appendChild(checkbox);
        label.appendChild(dot);
        label.appendChild(name);
        panelEl.appendChild(label);
      });
    }

    // チェックのオン/オフだけの変化ではパネル全体を作り直さず、チェック状態のみ更新する
    // (開いている間に要素を丸ごと差し替えると、操作中の閉じる判定が不安定になるため)
    function syncCheckedStates() {
      panelEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = Filter.isSelected(cb.dataset.memberId);
      });
    }

    function refreshButtonLabel() {
      buttonEl.textContent = computeButtonLabel();
    }

    refreshButtonLabel();

    State.onChange(() => {
      refreshButtonLabel();
      if (!panelEl.hidden) renderPanel();
    });
    Filter.onChange(() => {
      refreshButtonLabel();
      if (!panelEl.hidden) syncCheckedStates();
    });

    buttonEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const opening = panelEl.hidden;
      panelEl.hidden = !panelEl.hidden;
      if (opening) renderPanel();
    });

    document.addEventListener('click', (ev) => {
      if (panelEl.hidden) return;
      if (panelEl.contains(ev.target) || ev.target === buttonEl) return;
      close();
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });
  }

  global.FCMemberFilter = { init };
})(window);
