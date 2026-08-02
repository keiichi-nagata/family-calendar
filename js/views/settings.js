/* 設定モーダル：家族メンバー管理・よく使う予定テンプレート管理 */
(function (global) {
  'use strict';

  const State = global.FCState;
  const JIS_COLORS = global.FCStorage.JIS_COLORS;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function buildColorPalette(selectedColor) {
    const wrap = document.createElement('div');
    wrap.className = 'fc-color-palette';
    JIS_COLORS.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fc-color-swatch' + (c.hex === selectedColor ? ' fc-color-swatch-selected' : '');
      btn.style.background = c.hex;
      btn.title = c.name;
      btn.dataset.color = c.hex;
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function renderMembers(container) {
    container.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'fc-settings-list';
    State.data.members.forEach((m) => {
      const row = document.createElement('div');
      row.className = 'fc-settings-row';
      row.innerHTML = `
        <span class="fc-color-dot" style="background:${m.color}"></span>
        <input type="text" class="fc-member-name-input" value="${escapeHtml(m.name)}" />
        <button type="button" class="fc-btn fc-btn-small fc-member-color-btn">色を変更</button>
        <button type="button" class="fc-btn fc-btn-small fc-btn-danger fc-member-delete-btn">削除</button>
      `;
      const nameInput = row.querySelector('.fc-member-name-input');
      nameInput.addEventListener('change', () => {
        const val = nameInput.value.trim();
        if (val) State.updateMember(m.id, { name: val });
      });

      const colorBtn = row.querySelector('.fc-member-color-btn');
      colorBtn.addEventListener('click', () => {
        const existingPalette = row.querySelector('.fc-color-palette');
        if (existingPalette) {
          existingPalette.remove();
          return;
        }
        const palette = buildColorPalette(m.color);
        palette.addEventListener('click', (ev) => {
          const swatch = ev.target.closest('.fc-color-swatch');
          if (!swatch) return;
          State.updateMember(m.id, { color: swatch.dataset.color });
        });
        row.appendChild(palette);
      });

      row.querySelector('.fc-member-delete-btn').addEventListener('click', () => {
        if (confirm(`「${m.name}」を削除しますか？関連する予定の担当からも外れます。`)) {
          State.deleteMember(m.id);
        }
      });

      list.appendChild(row);
    });
    container.appendChild(list);

    const addRow = document.createElement('div');
    addRow.className = 'fc-settings-add-row';
    addRow.innerHTML = `
      <input type="text" class="fc-new-member-name" placeholder="新しい家族の名前" />
      <button type="button" class="fc-btn fc-btn-primary fc-new-member-add">追加</button>
    `;
    const nameInput = addRow.querySelector('.fc-new-member-name');
    const paletteHolder = document.createElement('div');
    const defaultColor = JIS_COLORS[State.data.members.length % JIS_COLORS.length].hex;
    let selectedColor = defaultColor;
    const palette = buildColorPalette(selectedColor);
    palette.addEventListener('click', (ev) => {
      const swatch = ev.target.closest('.fc-color-swatch');
      if (!swatch) return;
      selectedColor = swatch.dataset.color;
      palette.querySelectorAll('.fc-color-swatch').forEach((s) => s.classList.remove('fc-color-swatch-selected'));
      swatch.classList.add('fc-color-swatch-selected');
    });
    paletteHolder.appendChild(palette);
    addRow.appendChild(paletteHolder);

    addRow.querySelector('.fc-new-member-add').addEventListener('click', () => {
      const val = nameInput.value.trim();
      if (!val) {
        alert('名前を入力してください。');
        return;
      }
      State.addMember(val, selectedColor);
      nameInput.value = '';
    });
    container.appendChild(addRow);
  }

  function renderTemplates(container) {
    container.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'fc-settings-list';
    State.data.templates.forEach((t) => {
      const row = document.createElement('div');
      row.className = 'fc-settings-row';
      row.innerHTML = `
        <input type="text" class="fc-template-name-input" value="${escapeHtml(t.name)}" />
        <button type="button" class="fc-btn fc-btn-small fc-btn-danger fc-template-delete-btn">削除</button>
      `;
      const nameInput = row.querySelector('.fc-template-name-input');
      nameInput.addEventListener('change', () => {
        const val = nameInput.value.trim();
        if (val) State.updateTemplate(t.id, val);
      });
      row.querySelector('.fc-template-delete-btn').addEventListener('click', () => {
        if (confirm(`テンプレート「${t.name}」を削除しますか？`)) {
          State.deleteTemplate(t.id);
        }
      });
      list.appendChild(row);
    });
    container.appendChild(list);

    const addRow = document.createElement('div');
    addRow.className = 'fc-settings-add-row';
    addRow.innerHTML = `
      <input type="text" class="fc-new-template-name" placeholder="例：休み、歯医者、プール" />
      <button type="button" class="fc-btn fc-btn-primary fc-new-template-add">追加</button>
    `;
    const nameInput = addRow.querySelector('.fc-new-template-name');
    addRow.querySelector('.fc-new-template-add').addEventListener('click', () => {
      const val = nameInput.value.trim();
      if (!val) {
        alert('テンプレート名を入力してください。');
        return;
      }
      State.addTemplate(val);
      nameInput.value = '';
    });
    container.appendChild(addRow);
  }

  function open() {
    const wrap = document.createElement('div');
    wrap.className = 'fc-settings';
    wrap.innerHTML = `
      <section class="fc-settings-section">
        <h3>家族メンバー</h3>
        <div class="fc-members-container"></div>
      </section>
      <section class="fc-settings-section">
        <h3>よく使う予定テンプレート</h3>
        <div class="fc-templates-container"></div>
      </section>
    `;

    const membersContainer = wrap.querySelector('.fc-members-container');
    const templatesContainer = wrap.querySelector('.fc-templates-container');

    function refresh() {
      renderMembers(membersContainer);
      renderTemplates(templatesContainer);
    }
    refresh();

    const unsubscribe = State.onChange(refresh);
    global.FCModal.show('設定', wrap, unsubscribe);
  }

  global.FCSettings = { open };
})(window);
