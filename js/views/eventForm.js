/* 予定の新規作成・編集フォーム（詳細確認・メモ閲覧も兼ねる） */
(function (global) {
  'use strict';

  const U = global.FCUtils;
  const State = global.FCState;

  function buildMemberCheckboxes(selectedIds) {
    return State.data.members
      .map((m) => {
        const checked = selectedIds.includes(m.id) ? 'checked' : '';
        return `
        <label class="fc-member-check">
          <input type="checkbox" value="${m.id}" ${checked} />
          <span class="fc-color-dot" style="background:${m.color}"></span>
          <span>${escapeHtml(m.name)}</span>
        </label>`;
      })
      .join('');
  }

  function buildTemplateOptions() {
    return State.data.templates
      .map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`)
      .join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  function open(options, onSaved) {
    const editing = !!options.eventId;
    const existing = editing ? State.data.events.find((e) => e.id === options.eventId) : null;

    const initial = existing || {
      title: '',
      date: options.date || U.formatDateKey(new Date()),
      allDay: !options.time,
      startTime: options.time != null ? U.minutesToTime(options.time) : '09:00',
      endTime: options.time != null ? U.minutesToTime(Math.min(options.time + 60, 23 * 60 + 59)) : '10:00',
      memberIds: [],
      memo: '',
    };

    const wrap = document.createElement('div');
    wrap.className = 'fc-event-form';
    wrap.innerHTML = `
      <div class="fc-form-row">
        <label>テンプレートから選択</label>
        <select class="fc-template-select">
          <option value="">― 自由入力 ―</option>
          ${buildTemplateOptions()}
        </select>
      </div>
      <div class="fc-form-row">
        <label>タイトル<span class="fc-required">必須</span></label>
        <input type="text" class="fc-title-input" value="${escapeHtml(initial.title)}" placeholder="予定のタイトル" />
      </div>
      <div class="fc-form-row">
        <label>日付</label>
        <input type="date" class="fc-date-input" value="${initial.date}" />
      </div>
      <div class="fc-form-row fc-form-row-checkbox">
        <label><input type="checkbox" class="fc-allday-input" ${initial.allDay ? 'checked' : ''} /> 終日</label>
      </div>
      <div class="fc-form-row fc-time-row">
        <label>開始時刻</label>
        <input type="time" class="fc-start-time-input" value="${initial.startTime || '09:00'}" />
        <label>終了時刻</label>
        <input type="time" class="fc-end-time-input" value="${initial.endTime || ''}" />
      </div>
      <div class="fc-form-row">
        <label>担当する家族</label>
        <div class="fc-member-list">${buildMemberCheckboxes(initial.memberIds || [])}</div>
      </div>
      <div class="fc-form-row">
        <label>メモ</label>
        <textarea class="fc-memo-input" rows="4" placeholder="メモを入力">${escapeHtml(initial.memo)}</textarea>
      </div>
      <div class="fc-form-actions">
        ${editing ? '<button type="button" class="fc-btn fc-btn-danger fc-delete-btn">削除</button>' : '<span></span>'}
        <div class="fc-form-actions-right">
          <button type="button" class="fc-btn fc-btn-secondary fc-cancel-btn">キャンセル</button>
          <button type="button" class="fc-btn fc-btn-primary fc-save-btn">保存</button>
        </div>
      </div>
    `;

    const templateSelect = wrap.querySelector('.fc-template-select');
    const titleInput = wrap.querySelector('.fc-title-input');
    const dateInput = wrap.querySelector('.fc-date-input');
    const allDayInput = wrap.querySelector('.fc-allday-input');
    const timeRow = wrap.querySelector('.fc-time-row');
    const startTimeInput = wrap.querySelector('.fc-start-time-input');
    const endTimeInput = wrap.querySelector('.fc-end-time-input');
    const memoInput = wrap.querySelector('.fc-memo-input');

    function syncTimeVisibility() {
      timeRow.style.display = allDayInput.checked ? 'none' : '';
    }
    syncTimeVisibility();
    allDayInput.addEventListener('change', syncTimeVisibility);

    templateSelect.addEventListener('change', () => {
      if (templateSelect.value) titleInput.value = templateSelect.value;
    });

    const modalHandle = global.FCModal.show(editing ? '予定の詳細・編集' : '予定の新規作成', wrap);

    wrap.querySelector('.fc-cancel-btn').addEventListener('click', () => modalHandle.close());

    const deleteBtn = wrap.querySelector('.fc-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('この予定を削除しますか？')) {
          State.deleteEvent(options.eventId);
          modalHandle.close();
          if (onSaved) onSaved();
        }
      });
    }

    wrap.querySelector('.fc-save-btn').addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        alert('タイトルを入力してください。');
        titleInput.focus();
        return;
      }
      const date = dateInput.value;
      if (!date) {
        alert('日付を入力してください。');
        return;
      }
      const allDay = allDayInput.checked;
      let startTime = null;
      let endTime = null;
      if (!allDay) {
        startTime = startTimeInput.value;
        endTime = endTimeInput.value || null;
        if (!startTime) {
          alert('開始時刻を入力してください。');
          return;
        }
        if (endTime && endTime <= startTime) {
          alert('終了時刻は開始時刻より後にしてください。');
          return;
        }
      }
      const memberIds = Array.from(wrap.querySelectorAll('.fc-member-list input:checked')).map((el) => el.value);
      const memo = memoInput.value;

      const payload = { title, date, allDay, startTime, endTime, memberIds, memo };
      if (editing) {
        State.updateEvent(options.eventId, payload);
      } else {
        State.addEvent(payload);
      }
      modalHandle.close();
      if (onSaved) onSaved();
    });
  }

  global.FCEventForm = { open };
})(window);
