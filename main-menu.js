(() => {
  'use strict';

  const root = document.getElementById('mainMenu');
  if (!root) return;
  const primary = document.getElementById('mainMenuPrimary');
  const savesButton = document.getElementById('mainMenuSaves');
  const settingsButton = document.getElementById('mainMenuSettings');
  const settingsPanel = document.getElementById('mainMenuSettingsPanel');
  const settingsBack = document.getElementById('mainMenuSettingsBack');
  const dataButton = document.getElementById('mainMenuDataSettings');
  const rulesButton = document.getElementById('mainMenuRules');
  const label = primary.querySelector('.main-menu__button-label');
  const context = primary.querySelector('.main-menu__button-context');
  const status = document.getElementById('mainMenuStatus');
  const intro = document.getElementById('introModal');
  const start = document.getElementById('startButton');
  const loadingPage = document.getElementById('openingLoad');
  const loadingTitle = document.getElementById('openingLoadTitle');
  const loadingStatus = document.getElementById('openingLoadStatus');
  const loadingProgress = document.getElementById('openingLoadProgress');
  const loadingRetry = document.getElementById('openingLoadRetry');
  const loadingBack = document.getElementById('openingLoadBack');
  const saves = window.AlchemySaves;
  let menuState = 'loading';
  let statusOverride = '';
  let returningFromGame = false;
  let openingAttempt = 0;
  let openingController;
  let loading = false;
  let returnButton = null;

  function setView(view) {
    root.hidden = view !== 'menu';
    loadingPage.hidden = view !== 'loading';
    const visible = view !== 'game';
    document.body.classList.toggle('entry-screen-open', visible);
    const shell = document.querySelector('.app-shell');
    if (shell) {
      shell.inert = visible;
      shell.setAttribute('aria-hidden', String(visible));
    }
    if (intro) {
      intro.inert = visible;
      intro.setAttribute('aria-hidden', String(visible));
    }
  }

  function storageReadable() {
    try {
      window.localStorage?.getItem('alchemy-active-slot-v1');
      return true;
    } catch (_) {
      return false;
    }
  }

  function formatSavedAt(value) {
    if (!value) return '较早保存';
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return '较早保存';
    const delta = Math.max(0, Date.now() - time);
    if (delta < 60 * 1000) return '刚刚保存';
    if (delta < 60 * 60 * 1000) return `${Math.max(1, Math.floor(delta / 60000))}分钟前保存`;
    return new Date(time).toLocaleString('zh-CN', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'});
  }

  function readState() {
    if (!saves || !storageReadable()) {
      return {kind:'storage', entries:[], active:1, message:'无法使用本地存档，请允许浏览器存储后重试。'};
    }
    const entries = [1, 2, 3].map(id => {
      try { return {id, entry:saves.slot(id)}; }
      catch (_) { return {id, entry:{corrupt:true, data:null}}; }
    });
    const active = Number(saves.active) || 1;
    const activeEntry = entries.find(item => item.id === active)?.entry;
    const valid = entries.filter(item => item.entry?.data);
    const corrupt = entries.filter(item => item.entry?.corrupt);
    const error = String(saves.error || '');
    if (error.includes('未允许读取') || error.includes('浏览器未允许')) {
      return {kind:'storage', entries, active, message:'无法使用本地存档，请允许浏览器存储后重试。'};
    }
    if (activeEntry?.data) return {kind:'active', entries, active, current:activeEntry.data};
    if (corrupt.length) return {kind:'corrupt', entries, active, message:'存档无法读取，原始数据保留。'};
    if (valid.length) {
      const newest = [...valid].sort((a,b) => {
        const at = Date.parse(a.entry.updatedAt || '') || 0;
        const bt = Date.parse(b.entry.updatedAt || '') || 0;
        return bt - at || (b.entry.data?.campaign?.day || 0) - (a.entry.data?.campaign?.day || 0);
      })[0];
      return {kind:'other', entries, active, newest:newest.id};
    }
    return {kind:'empty', entries, active};
  }

  function render(state) {
    menuState = state.kind;
    context.textContent = '';
    status.textContent = statusOverride;
    primary.disabled = false;
    primary.classList.toggle('is-primary', state.kind === 'active' || state.kind === 'empty');
    if (state.kind === 'active') {
      label.textContent = '继续经营';
      const day = state.current?.campaign?.day || 1;
      const entry = state.entries.find(item => item.id === state.active)?.entry;
      context.textContent = `第 ${day} 日 · ${formatSavedAt(entry?.updatedAt)}`;
      primary.setAttribute('aria-label', `继续经营，${context.textContent}`);
    } else if (state.kind === 'other') {
      label.textContent = '选择存档';
      context.textContent = '已有存档可继续';
      primary.setAttribute('aria-label', '选择存档，已有存档可继续');
    } else if (state.kind === 'corrupt') {
      label.textContent = '存档管理';
      context.textContent = state.message;
      primary.setAttribute('aria-label', '存档管理，存档无法读取，原始数据保留');
      if (!statusOverride) status.textContent = state.message;
    } else if (state.kind === 'storage') {
      label.textContent = '重新检查';
      context.textContent = state.message;
      primary.setAttribute('aria-label', '重新检查本地存档');
      if (!statusOverride) status.textContent = state.message;
    } else {
      label.textContent = '开始营业';
      primary.setAttribute('aria-label', '开始营业');
    }
  }

  function refresh(options = {}) {
    if (options.feedback !== undefined) statusOverride = options.feedback;
    const state = readState();
    render(state);
    return state;
  }

  function focusSlot(id) {
    window.setTimeout(() => {
      const button = document.querySelector(`#savePicker [data-slot="${id}"]`);
      if (button && !button.disabled) button.focus({preventScroll:true});
    }, 0);
  }

  function openSaves(preferredId = null) {
    const button = document.querySelector('.opening-launch .save-open') || document.querySelector('.engine-nav .save-open');
    if (!button) {
      statusOverride = '存档管理尚未准备好，请稍后重试。';
      refresh();
      primary.focus({preventScroll:true});
      return;
    }
    button.click();
    if (preferredId) focusSlot(preferredId);
  }

  function openSettings() {
    settingsPanel.hidden = false;
    settingsButton.setAttribute('aria-expanded', 'true');
    settingsBack.focus({preventScroll:true});
  }

  function closeSettings() {
    settingsPanel.hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.focus({preventScroll:true});
  }

  function returnToMenu() {
    openingAttempt++;
    openingController?.abort();
    openingController = undefined;
    loading = false;
    setView('menu');
    refresh();
    primary.focus({preventScroll:true});
  }

  function updateProgress() {
    if (loading) loadingProgress.value = window.AlchemyAssets.entryProgress;
  }

  async function prepareEntry() {
    if (loading) return;
    const attempt = ++openingAttempt;
    const controller = new AbortController();
    openingController = controller;
    loading = true;
    loadingPage.dataset.state = 'loading';
    loadingTitle.textContent = '正在加载…';
    loadingStatus.textContent = '';
    loadingProgress.hidden = false;
    loadingRetry.hidden = true;
    updateProgress();
    setView('loading');
    loadingTitle.focus({preventScroll:true});

    await new Promise(resolve => requestAnimationFrame(resolve));
    if (attempt !== openingAttempt) return;
    const ready = await window.AlchemyAssets.prepare(controller.signal);
    if (attempt !== openingAttempt) return;
    openingController = undefined;
    loading = false;
    if (!ready) {
      loadingPage.dataset.state = 'failed';
      loadingTitle.textContent = '加载失败';
      loadingStatus.textContent = '请重试，或返回主菜单。';
      loadingProgress.hidden = true;
      loadingRetry.hidden = false;
      loadingRetry.focus({preventScroll:true});
      return;
    }
    setView('game');
    start.click();
  }

  function enterGame() {
    if (returningFromGame) {
      setView('game');
      returningFromGame = false;
      return;
    }
    if (menuState === 'storage') {
      statusOverride = '';
      const next = refresh();
      if (next.kind === 'storage') primary.focus({preventScroll:true});
      return;
    }
    if (menuState === 'other' || menuState === 'corrupt') {
      openSaves(menuState === 'other' ? readState().newest : null);
      return;
    }
    void prepareEntry();
  }

  start.addEventListener('click', event => {
    if (window.AlchemyAssets.ready) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void prepareEntry();
  }, true);
  window.addEventListener('alchemy:entry-progress', updateProgress);
  loadingRetry.addEventListener('click', prepareEntry);
  loadingBack.addEventListener('click', returnToMenu);
  loadingPage.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    returnToMenu();
  });

  primary.addEventListener('click', enterGame);
  savesButton.addEventListener('click', () => openSaves());
  settingsButton.addEventListener('click', openSettings);
  settingsBack.addEventListener('click', closeSettings);
  dataButton.addEventListener('click', () => document.querySelector('.opening-launch .ux-data-open')?.click());
  rulesButton.addEventListener('click', () => document.querySelector('.opening-help [data-title-rules]')?.click());
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsPanel.hidden) {
      event.preventDefault();
      closeSettings();
    }
  });

  function addReturnButton() {
    const nav = document.querySelector('.engine-nav');
    const settings = document.body.classList.contains('warm-cinnabar-experiment')
      ? nav?.querySelector('#worldSettings')
      : null;
    const host = settings || nav;
    if (!host || nav.querySelector('.main-menu-return')) return;
    returnButton = document.createElement('button');
    returnButton.type = 'button';
    returnButton.className = 'main-menu-return';
    returnButton.dataset.focusKey = 'main-menu-return';
    returnButton.textContent = '返回主菜单';
    returnButton.addEventListener('click', () => {
      if (returnButton.disabled) return;
      const gate = window.AlchemyGame?.canLeave?.() || {ok:false, reason:'当前经营状态暂不能返回主菜单。'};
      if (!gate.ok) {
        window.AlchemyUX?.tell(gate.reason);
        return;
      }
      returnButton.disabled = true;
      returnButton.textContent = '保存中…';
      window.requestAnimationFrame(() => {
        const result = window.AlchemyGame?.saveNow?.() || {ok:false, reason:'存档未能保存，请稍后重试。'};
        if (!result.ok) {
          returnButton.disabled = false;
          returnButton.textContent = '重试保存';
          window.AlchemyUX?.tell(result.reason);
          return;
        }
        returningFromGame = true;
        statusOverride = '已保存';
        if (settings && !settings.hidden) nav.querySelector('.world-settings-toggle').click();
        setView('menu');
        refresh();
        status.textContent = '已保存';
        primary.focus({preventScroll:true});
        returnButton.disabled = false;
        returnButton.textContent = '返回主菜单';
      });
    });
    host.append(returnButton);
  }

  setView('menu');
  refresh();
  addReturnButton();
  window.addEventListener('alchemy:render', () => {
    if (!root.hidden && !returningFromGame) refresh();
    addReturnButton();
  });
  window.addEventListener('alchemy:view-ready', addReturnButton);
  window.addEventListener('alchemy:opening-finished', addReturnButton);
  primary.focus({preventScroll:true});
})();
