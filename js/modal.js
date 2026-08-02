/* 汎用モーダルダイアログの土台 */
(function (global) {
  'use strict';

  let activeOverlay = null;
  let activeOnClose = null;

  function close() {
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
      document.removeEventListener('keydown', onKeydown);
      const cb = activeOnClose;
      activeOnClose = null;
      if (cb) cb();
    }
  }

  function onKeydown(ev) {
    if (ev.key === 'Escape') close();
  }

  function show(titleText, contentEl, onClose) {
    close();

    const overlay = document.createElement('div');
    overlay.className = 'fc-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'fc-modal-dialog';

    const header = document.createElement('div');
    header.className = 'fc-modal-header';
    const title = document.createElement('h2');
    title.textContent = titleText;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'fc-modal-close';
    closeBtn.setAttribute('aria-label', '閉じる');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);
    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'fc-modal-body';
    body.appendChild(contentEl);

    dialog.appendChild(header);
    dialog.appendChild(body);
    overlay.appendChild(dialog);

    overlay.addEventListener('mousedown', (ev) => {
      if (ev.target === overlay) close();
    });

    document.body.appendChild(overlay);
    activeOverlay = overlay;
    activeOnClose = onClose || null;
    document.addEventListener('keydown', onKeydown);

    return { close };
  }

  global.FCModal = { show, close };
})(window);
