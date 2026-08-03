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
    function renderPanel() {
      panelEl.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'fc-btn fc-btn-small fc-member-filter-all';
      allBtn.textContent = 'すべて表示';
      allBtn.addEventListener('click', () => Filter.selectAll());
      panelEl.appendChild(allBtn);

      State.data.members.forEach((m) => {
        const label = document.createElement('label');
        label.className = 'fc-member-filter-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
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

    function refresh() {
      buttonEl.textContent = computeButtonLabel();
      if (!panelEl.hidden) renderPanel();
    }

    refresh();
    State.onChange(refresh);
    Filter.onChange(refresh);

    buttonEl.addEventListener('click', (ev) => {
      ev.stopPropagation();
      panelEl.hidden = !panelEl.hidden;
      if (!panelEl.hidden) renderPanel();
    });

    document.addEventListener('click', (ev) => {
      if (panelEl.hidden) return;
      if (panelEl.contains(ev.target) || ev.target === buttonEl) return;
      panelEl.hidden = true;
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') panelEl.hidden = true;
    });
  }

  global.FCMemberFilter = { init };
})(window);
