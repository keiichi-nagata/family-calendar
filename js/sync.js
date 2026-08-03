/* Firebase Firestore を使った複数端末間のオンライン同期（任意設定・未設定時はlocalStorageのみで動作） */
(function (global) {
  'use strict';

  const State = global.FCState;
  const SYNC_KEY = 'familyCalendarApp.sync.v1';
  const FIREBASE_SDK_VERSION = '10.12.2';
  const FIREBASE_SDK_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

  let docRef = null;
  let unsubscribeSnapshot = null;
  let unsubscribeStateChange = null;
  let applyingRemote = false;
  let connected = false;
  const statusListeners = [];

  function loadSyncConfig() {
    try {
      const raw = global.localStorage.getItem(SYNC_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSyncConfig(cfg) {
    try {
      global.localStorage.setItem(SYNC_KEY, JSON.stringify(cfg));
    } catch (e) {
      console.warn('同期設定の保存に失敗しました。', e);
    }
  }

  function clearSyncConfig() {
    try {
      global.localStorage.removeItem(SYNC_KEY);
    } catch (e) {
      /* noop */
    }
  }

  function notifyStatus(status, message) {
    statusListeners.forEach((fn) => fn(status, message));
  }

  function onStatusChange(fn) {
    statusListeners.push(fn);
    return () => {
      const idx = statusListeners.indexOf(fn);
      if (idx !== -1) statusListeners.splice(idx, 1);
    };
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`SDKの読み込みに失敗しました: ${src}`));
      document.head.appendChild(script);
    });
  }

  let sdkLoadPromise = null;
  function loadFirebaseSdk() {
    if (global.firebase && global.firebase.firestore) return Promise.resolve();
    if (sdkLoadPromise) return sdkLoadPromise;
    sdkLoadPromise = loadScript(`${FIREBASE_SDK_BASE}/firebase-app-compat.js`)
      .then(() => loadScript(`${FIREBASE_SDK_BASE}/firebase-auth-compat.js`))
      .then(() => loadScript(`${FIREBASE_SDK_BASE}/firebase-firestore-compat.js`));
    return sdkLoadPromise;
  }

  function sanitizeForFirestore(data) {
    // FirestoreはundefinedフィールドをNGとするため、JSON化して除去する
    return JSON.parse(JSON.stringify(data));
  }

  function teardown() {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    if (unsubscribeStateChange) {
      unsubscribeStateChange();
      unsubscribeStateChange = null;
    }
    docRef = null;
    connected = false;
  }

  // familyCode: 家族で共通の合言葉。Firebaseプロジェクトの接続情報自体は
  // js/firebaseConfig.js に固定値として埋め込まれている
  // onConflict(remoteData) は、ローカルとリモート両方にデータがある場合に呼ばれ、
  // true を返すとリモート優先、false を返すとローカルでリモートを上書きする
  async function connect(familyCode, onConflict) {
    await loadFirebaseSdk();

    const firebaseConfig = global.FC_FIREBASE_CONFIG;
    const app = global.firebase.apps && global.firebase.apps.length
      ? global.firebase.app()
      : global.firebase.initializeApp(firebaseConfig);

    const auth = global.firebase.auth(app);
    await auth.signInAnonymously();

    const db = global.firebase.firestore(app);
    const ref = db.collection('families').doc(familyCode);
    const snap = await ref.get();

    if (snap.exists) {
      const remoteData = snap.data();
      const useRemote = await onConflict(remoteData);
      if (useRemote) {
        applyingRemote = true;
        State.replaceAll(remoteData);
        applyingRemote = false;
      } else {
        await ref.set(sanitizeForFirestore(State.data));
      }
    } else {
      await ref.set(sanitizeForFirestore(State.data));
    }

    docRef = ref;
    unsubscribeSnapshot = ref.onSnapshot(
      (doc) => {
        if (!doc.exists) return;
        applyingRemote = true;
        State.replaceAll(doc.data());
        applyingRemote = false;
      },
      (err) => notifyStatus('error', err.message)
    );

    unsubscribeStateChange = State.onChange((data) => {
      if (applyingRemote || !connected || !docRef) return;
      docRef.set(sanitizeForFirestore(data)).catch((err) => notifyStatus('error', err.message));
    });

    connected = true;
    saveSyncConfig({ familyCode });
    notifyStatus('connected');
  }

  function disconnect() {
    teardown();
    clearSyncConfig();
    notifyStatus('disconnected');
  }

  function autoConnectIfConfigured(onConflict) {
    const cfg = loadSyncConfig();
    if (!cfg || !cfg.familyCode) return;
    connect(cfg.familyCode, onConflict).catch((err) => notifyStatus('error', err.message));
  }

  function isConnected() {
    return connected;
  }

  global.FCSync = {
    connect,
    disconnect,
    autoConnectIfConfigured,
    isConnected,
    onStatusChange,
    loadSyncConfig,
  };
})(window);
