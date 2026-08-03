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

  function renderSync(container) {
    container.innerHTML = '';
    const Sync = global.FCSync;
    if (!Sync) {
      container.textContent = '同期機能は利用できません。';
      return;
    }

    if (Sync.isConnected()) {
      const cfg = Sync.loadSyncConfig();
      const box = document.createElement('div');
      box.className = 'fc-sync-status';
      box.innerHTML = `
        <p>🟢 共有コード「<strong>${escapeHtml(cfg ? cfg.familyCode : '')}</strong>」でオンライン同期中です。</p>
        <p class="fc-sync-hint">他の端末でもこの共有コードを入力して接続すると、予定がリアルタイムに共有されます。</p>
        <button type="button" class="fc-btn fc-btn-danger fc-sync-disconnect">切断してこの端末だけで使う</button>
      `;
      box.querySelector('.fc-sync-disconnect').addEventListener('click', () => {
        if (confirm('オンライン共有を切断しますか？以降はこの端末内のデータのみで動作します。')) {
          Sync.disconnect();
        }
      });
      container.appendChild(box);
      return;
    }

    const form = document.createElement('div');
    form.className = 'fc-sync-form';
    form.innerHTML = `
      <p class="fc-sync-hint">共有コード（家族で共通の合言葉）を入力すると、家族のスマホ・PC間で予定をリアルタイム共有できます（任意）。未設定の場合はこの端末内のみの保存になります。</p>
      <div class="fc-form-row">
        <label>共有コード（家族で共通の合言葉）</label>
        <div class="fc-sync-code-row">
          <input type="text" class="fc-sync-familyCode" placeholder="例: yamada-family-2026" />
          <button type="button" class="fc-btn fc-btn-secondary fc-sync-generate-code">自動生成</button>
        </div>
      </div>
      <button type="button" class="fc-btn fc-btn-primary fc-sync-connect">接続する</button>
      <p class="fc-sync-error"></p>
    `;

    form.querySelector('.fc-sync-generate-code').addEventListener('click', () => {
      const code = `${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`;
      form.querySelector('.fc-sync-familyCode').value = code;
    });

    const errorEl = form.querySelector('.fc-sync-error');
    form.querySelector('.fc-sync-connect').addEventListener('click', async () => {
      const familyCode = form.querySelector('.fc-sync-familyCode').value.trim();
      if (!familyCode) {
        errorEl.textContent = '共有コードは必須です。';
        return;
      }
      const btn = form.querySelector('.fc-sync-connect');
      btn.disabled = true;
      btn.textContent = '接続中...';
      errorEl.textContent = '';
      try {
        await Sync.connect(familyCode, (remoteData) => {
          const remoteCount = (remoteData.events || []).length;
          const localCount = State.data.events.length;
          return confirm(
            `共有コード「${familyCode}」には既にデータがあります（予定${remoteCount}件）。\n\n` +
              `[OK] 共有データを使う（この端末のローカルデータ${localCount}件は破棄されます）\n` +
              `[キャンセル] この端末のデータで共有データを上書きする`
          );
        });
      } catch (err) {
        errorEl.textContent = '接続に失敗しました: ' + err.message;
        btn.disabled = false;
        btn.textContent = '接続する';
      }
    });

    container.appendChild(form);
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
      <section class="fc-settings-section">
        <h3>オンライン共有（複数端末で同期）</h3>
        <div class="fc-sync-container"></div>
      </section>
    `;

    const membersContainer = wrap.querySelector('.fc-members-container');
    const templatesContainer = wrap.querySelector('.fc-templates-container');
    const syncContainer = wrap.querySelector('.fc-sync-container');

    function refresh() {
      renderMembers(membersContainer);
      renderTemplates(templatesContainer);
      renderSync(syncContainer);
    }
    refresh();

    const unsubscribeState = State.onChange(refresh);
    const unsubscribeSync = global.FCSync ? global.FCSync.onStatusChange(refresh) : null;
    global.FCModal.show('設定', wrap, () => {
      unsubscribeState();
      if (unsubscribeSync) unsubscribeSync();
    });
  }

  global.FCSettings = { open };
})(window);
