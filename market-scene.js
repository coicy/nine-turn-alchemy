(() => {
  'use strict';
  const api = window.AlchemyGame, E = window.AlchemyEconomy, UX = window.AlchemyUX;
  const catalog = window.AlchemyMarketMerchants;
  const section = document.querySelector('.economy-board');
  const consignment = section.querySelector('.consignment-board-v158');
  const packNames = ['普通药包', '精选药包'];
  const packEffects = ['基础起炉材料', '起炉至少良品'];
  let merchantId, kind, selection, notice = '', noticeTimer;
  const traySize = 3, remembered = new Map();
  let tray = 0;
  const phone = matchMedia('(max-width: 650px)');
  const shellNav = document.querySelector('.engine-nav');
  if (!shellNav.id) shellNav.id = 'danfangNavigation';

  function menuToggle() {
    return '<button type="button" class="stall-menu-toggle" data-market-menu data-focus-key="market-menu" aria-controls="' +
      shellNav.id + '" aria-expanded="' + (document.body.dataset.marketMenu === 'open') + '">菜单</button>';
  }

  function navigation(stalls, current) {
    const specialty = stall => stall.shelves.map(shelf => catalog.labels[shelf.kind]).join(' · ');
    if (phone.matches || stalls.length > 3) {
      return '<nav class="world-market-tabs" aria-label="坊市摊主"><label class="merchant-list">换摊 <select data-merchant-list data-focus-key="merchant-list">' +
        stalls.map(stall => '<option value="' + UX.esc(stall.id) + '" ' + (stall.id === current.id ? 'selected' : '') + '>' +
          UX.esc(stall.name + ' · ' + specialty(stall)) + '</option>').join('') + '</select></label>' + (phone.matches ? menuToggle() : '') + '</nav>';
    }
    return '<nav class="world-market-tabs" aria-label="坊市摊主">' + stalls.map(stall =>
      '<button type="button" data-merchant="' + UX.esc(stall.id) + '" data-focus-key="stall-' + UX.esc(stall.id) + '" aria-pressed="' + (stall.id === current.id) + '">' +
      '<b>' + UX.esc(stall.name) + '</b><small>' + specialty(stall) + '</small></button>').join('') + '</nav>';
  }

  function shelfNavigation(stall) {
    if (stall.shelves.length < 2) return '';
    return '<nav class="stall-shelves" aria-label="' + UX.esc(stall.name) + '的货架">' + stall.shelves.map(shelf =>
      '<button type="button" data-market-tab="' + shelf.kind + '" aria-pressed="' + (shelf.kind === kind) + '">' +
      catalog.labels[shelf.kind] + '</button>').join('') + '</nav>';
  }

  function ware(id, economy) {
    const parcel = '<img class="counter-parcel" src="assets/runtime-v10/herb-parcel-v1.webp" alt="">';
    let action, art, name, price;
    if (kind === 'material') {
      action = 'data-material-inspect="' + id + '"';
      art = parcel + '<i class="counter-seal tier-' + id + '" aria-hidden="true">' + ['普','精'][id] + '</i>';
      name = packNames[id]; price = E.PRICES[id];
    } else if (kind === 'tool') {
      const tool = E.TOOL_DEFS.find(t => t.id === id);
      action = 'data-inspect="' + id + '"';
      art = '<span class="tool-art" data-tool-art="' + id + '"></span>';
      name = tool.name; price = economy.tools.includes(id) ? '已持有' : tool.price;
    } else if (kind === 'craft') {
      const craft = window.AlchemyCrafts.get(id);
      action = 'data-craft-inspect="' + id + '"';
      art = UX.art({craftKind: id, turn: 1}) + parcel;
      name = craft.material; price = craft.price;
    } else {
      action = 'data-upgrade-inspect';
      art = '<span class="counter-blueprint"><span class="world-stove-diagram" aria-hidden="true"></span></span>';
      name = '改炉图样'; price = E.UPGRADES[economy.furnace + 1] ?? '已完成';
    }
    return '<button type="button" class="counter-ware" ' + action + ' data-focus-key="ware-' + kind + '-' + id +
      '" aria-pressed="' + (id === selection) + '"><span class="counter-figure">' + art +
      '</span><span class="counter-tag"><b>' + name + '</b><small>' +
      (typeof price === 'number' ? price + ' 铜钱' : price) + '</small></span></button>';
  }

  function details(s, e, blocked) {
    const id = selection;
    function ticket(name, state, description, primary, {extra = '', art = '', note = ''} = {}) {
      if (!phone.matches) {
        return {body: art + '<h3>' + name + '</h3><p>' + description + '</p>' +
          (state ? '<p>' + state + '</p>' : '') + primary + note + extra, checkout: ''};
      }
      const mark = notice ? '<span class="trade-check" aria-hidden="true">✓ </span>' : '';
      const guide = extra ? '<details class="stall-guide"><summary data-focus-key="craft-guide">详情</summary>' + extra + '</details>' : '';
      return {body: '<div class="stall-slip"><header><h3>' + name + '</h3>' +
        (state ? '<span class="stall-stock">' + mark + state + '</span>' : '') + '</header><p>' +
        description + '</p>' + note + guide + '</div>', checkout: primary};
    }
    function purchase(action, price, label, reason = '') {
      const short = e.coins < price;
      const unavailable = reason || (blocked ? '暂不可交易' : short ? '铜钱不足' : '');
      if (phone.matches) {
        const text = short && !reason && !blocked ? price + ' 铜钱 · 还差 ' + (price - e.coins) + ' 铜钱' :
          (unavailable || label) + ' · ' + price + ' 铜钱';
        return '<button class="stall-buy" data-kind="' + action + '"' + (action === 'furnace' ? '' : ' data-id="' + id + '"') +
          (unavailable ? ' disabled' : '') + '>' + text + '</button>';
      }
      return '<strong>' + price + ' 铜钱</strong><button data-kind="' + action + '"' +
        (action === 'furnace' ? '' : ' data-id="' + id + '"') + (unavailable ? ' disabled' : '') + '>' +
        (unavailable || label) + '</button>' + (short && !reason ? '<p>还差 ' + (price - e.coins) + ' 铜钱</p>' : '');
    }
    if (kind === 'material') {
      return ticket(packNames[id], '库存 ' + e.stock[id] + ' 包', packEffects[id], purchase('material', E.PRICES[id], '购入一包'));
    }
    if (kind === 'craft') {
      const d = window.AlchemyCrafts.get(id), stock = e.craftStock[id], free = !s.order && s.pillEnded && !blocked;
      const guide = '一转收取约售 ' + Math.round(24*d.multiplier) + ' 文；继续催炼可提高售价，也会承担炉险。求购客人不供料。';
      const collect = (stock ? '<button data-craft-home data-focus-key="craft-home"' + (free ? '' : ' disabled') + '>回丹房取器料</button>' : '') +
        (!free && stock ? '<p>' + (s.order ? '先结清炼丹委托，再取器料。' : !s.pillEnded ? '炉内有物，先收取。' : '当前操作完成后再取料。') + '</p>' : '');
      const terms = '<p class="craft-sale-guide">' + guide + '</p>';
      return ticket(d.material, '库存 ' + stock + ' 份', '一份炼一件' + d.name + '，炸炉损失器料。',
        purchase('craftMaterial', d.price, '购入一份', stock >= 999 ? '库存已满' : ''),
        {extra: phone.matches ? terms + collect : collect + terms, art: UX.art({craftKind: id, turn: 1})});
    }
    if (kind === 'furnace') {
      return ticket('陶炉改良', '当前：' + ['原胆','护胆改良','凝丹改良'][e.furnace],
        ['改良炉胆：每炉首次受损的价值扣减减半。','改良凝丹部件：每次受损保住当前转数，药力扣减减半。','两项改良均已完成。'][e.furnace],
        e.furnace < 2 ? purchase('furnace', E.UPGRADES[e.furnace + 1], '改良炉具', s.pillEnded ? '' : '收丹后改良') : '');
    }
    const tool = E.TOOL_DEFS.find(t => t.id === id), owned = e.tools.includes(id), equipped = E.equippedIds(e.equipped);
    if (owned) {
      const placed = equipped.includes(id);
      const arrange = !placed && [null, ...equipped].some(old => api.canReplaceEquipment(old, id).ok);
      return ticket(tool.name, placed ? '已在案上' : '已持有', tool.description,
        arrange ? '<button data-world-return-tools data-focus-key="arrange-tool">回炉布置</button>' : '',
        {note: !arrange && !placed && !s.pillEnded ? '<p>收丹后可回炉布置</p>' : ''});
    }
    const invited = e.coins < tool.price && window.AlchemyMerchantVisit?.snapshot().phase === 'market' && merchantId === 'artificer';
    return ticket(tool.name, '', tool.description, purchase('tool', tool.price, '购入法器'),
      {note: invited ? '<p class="merchant-sales-line">法器商：先认认货，攒够了再来。</p>' : ''});
  }

  function paint(content) {
    UX.html(section, content);
    if (consignment) section.prepend(consignment);
  }

  function render() {
    const c = api.campaign();
    if (!c) return;
    const e = E.ensure(c), s = api.snapshot(), stalls = catalog.openStalls(c, e);
    const stall = stalls.find(entry => entry.id === merchantId) ?? stalls[0];
    section.classList.add('painted-market', 'world-market');
    if (!stall) {
      merchantId = kind = selection = null;
      section.dataset.inspecting = 'false';
      delete section.dataset.merchant;
      delete section.dataset.marketTab;
      paint((phone.matches ? '<nav class="world-market-tabs">' + menuToggle() + '</nav>' : '') +
        '<div class="market-stage empty-market"><p>今日尚无商人出摊</p></div><footer class="market-foot"></footer>');
      observeStage();
      requestAnimationFrame(fit);
      return;
    }
    const shelf = stall.shelves.find(entry => entry.kind === kind) ?? stall.shelves[0];
    if (stall.id !== merchantId || kind !== shelf.kind || !shelf.ids.includes(selection)) selection = null;
    merchantId = stall.id;
    kind = shelf.kind;
    const sameShelf = section.dataset.merchant === merchantId && section.dataset.marketTab === kind;
    if (!sameShelf) { tray = 0; remembered.clear(); }
    const trays = Math.ceil(shelf.ids.length / traySize);
    tray = selection === null ? Math.min(tray, trays - 1) : Math.floor(shelf.ids.indexOf(selection) / traySize);
    remembered.set(tray, selection);
    const ids = shelf.ids.slice(tray * traySize, (tray + 1) * traySize);
    const blocked = s.busy || window.AlchemyInteractionBusy || window.AlchemyScene2D?.busy || c.phase !== 'open';
    const inspecting = phone.matches && selection !== null;
    const guideOpen = inspecting && sameShelf && section.dataset.item === String(selection) && section.querySelector('.stall-guide')?.open;
    section.dataset.merchant = merchantId;
    section.dataset.marketTab = kind;
    section.dataset.item = String(selection);
    section.dataset.inspecting = String(inspecting);
    const item = selection === null ? {body:'<p class="stall-prompt">点柜上的货物看用途</p>', checkout:''} : details(s, e, blocked);
    const switchTray = trays > 1 ? '<button type="button" data-next-tray data-pages="' + trays + '" data-focus-key="tray">换一盘 ' +
      (tray + 1) + '/' + trays + ' ›</button>' : '';
    paint(navigation(stalls, stall) +
      '<div class="counter-window"><div class="market-stage"><div class="counter-controls">' + shelfNavigation(stall) + switchTray +
      '</div><img class="market-merchant" loading="lazy" src="' + UX.esc(stall.portrait) +
      '" alt="' + UX.esc(stall.name) + '"><div class="market-foreground" aria-hidden="true"></div>' +
      '<div class="counter-stock" data-market-group="' + kind + '" role="group" aria-label="' + catalog.labels[kind] + '陈列">' +
      ids.map(id => ware(id, e)).join('') + '</div></div></div><aside class="world-price-tag" aria-label="当前货物详情">' + item.body + '</aside>' +
      '<footer class="market-foot"' + (item.checkout ? ' data-checkout' : '') + '><span class="merchant-wallet">现有 ' + e.coins + ' 铜钱</span>' +
      '<span class="market-receipt" role="status">' + UX.esc(notice) + '</span>' + item.checkout + '</footer>');
    window.AlchemyWorldUI?.decorateTools(section);
    if (guideOpen) section.querySelector('.stall-guide').open = true;
    observeStage();
    if (section.dataset.shellActive === 'true') fit();
    requestAnimationFrame(fit);
  }

  let observedStage;
  const stageObserver = new ResizeObserver(fit);
  function observeStage() {
    const stage = section.querySelector('.market-stage');
    if (stage === observedStage) return;
    stageObserver.disconnect();
    if (stage) stageObserver.observe(stage);
    observedStage = stage;
  }

  function placeStock(stage, w, h, scale, top, rack) {
    const stock = stage.querySelector('.counter-stock');
    const buttons = [...stock.children];
    function place(button, x, base, size) {
      button.style.left = x + 'px';
      button.style.top = Math.min(base - size, h - size - 44) + 'px';
      button.style.setProperty('--ware-size', size + 'px');
    }
    const mobile = phone.matches;
    const front = Math.min(w*.26, h*.22, mobile ? 108 : 128);
    const left = mobile ? w*.23 : rack - 64*scale;
    const right = mobile ? Math.min(w-44,w*.82) : Math.min(w-58, rack+385*scale);
    const onTable = sourceY => top + sourceY*scale;
    const ward = stock.querySelector('[data-inspect="ward"]');
    const back = ward || (buttons.length === 3 ? buttons[0] : null);
    if (back) {
      const hanging = back === ward;
      const size = Math.min(w*(hanging ? .24 : .20), (hanging ? 130 : 123)*scale, hanging ? 105 : 90);
      let x = Math.min(w-54,rack+(hanging ? Math.min(190*scale,(w-rack)*.65) : Math.min(w*.13,80*scale)));
      if (mobile && buttons.length === 3) {
        const gap = (Math.max(80,size) + Math.max(80,front))/2 + 5;
        x = Math.max(left+gap,Math.min(right-gap,x));
      }
      place(back, x, hanging ? onTable(392)+size : onTable(532), size);
      if (hanging) back.style.setProperty('--cord', 16*scale+'px');
    }
    const near = buttons.filter(button => button !== back);
    near.forEach((button,i) => {
      const x = near.length === 1 ? (back ? left + w*.07 : (left+right)/2) : i ? right : left;
      place(button, x, onTable(i ? 750 : 718), Math.min(front,(i ? 165 : 150)*scale));
    });
  }

  function fit() {
    const stage = section.querySelector('.market-stage'), foot = section.querySelector('.market-foot');
    if (!stage || !foot) return;
    for (const el of section.querySelectorAll(':scope>.world-books,:scope>.passage-home')) foot.append(el);
    const home = section.querySelector('.passage-home'), tabs = section.querySelector('.world-market-tabs');
    if (phone.matches && home && tabs && home.parentElement !== tabs) tabs.prepend(home);
    if (section.dataset.shellActive === 'true')
      section.style.setProperty('--market-top', Math.max(64, shellNav.getBoundingClientRect().bottom + 4) + 'px');
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || !merchantId) return;
    const mobile = phone.matches, scale = Math.max(w / 1672, h / 941);
    // In the stall painting, the wooden rack starts at x=716 and the tabletop at y=556.
    const rackX = 716 * scale;
    const rackStart = Math.max(w*.40, w-478*scale-w*.025);
    const left = mobile ? Math.max(w - 1672*scale, Math.min(0, rackStart-rackX)) : (w - 1672*scale)/2;
    const top = (h - 941*scale)/2, table = (mobile ? 556 : 550)*scale + top;
    stage.style.setProperty('--market-camera-left', left + 'px');
    stage.style.setProperty('--market-table-y', table + 'px');
    const merchant = stage.querySelector('.market-merchant');
    const margin = Math.min(12, w*.032), rackLeft = left + rackX;
    const personH = mobile ? Math.max(0, Math.min(h*.65, (rackLeft - 2*margin)*1.5)) : Math.min(h*.94, 460*scale);
    const personW = personH*2/3;
    const personLeft = mobile ? rackLeft - margin - personW : Math.max(4, 170*scale + left);
    const personTop = Math.max(0, table - personH*(mobile ? .84 : .86));
    for (const [name, value] of Object.entries({left:personLeft, top:personTop, height:personH, width:personW}))
      merchant.style.setProperty(name, value + 'px', 'important');
    placeStock(stage, w, h, scale, top, rackLeft);
  }

  function clearNotice() {
    clearTimeout(noticeTimer);
    notice = '';
    const label = section.querySelector('.market-receipt');
    if (label) label.textContent = '';
    section.querySelector('.trade-check')?.remove();
  }

  function visit(id) {
    if (id === merchantId) return;
    clearNotice();
    closeMenu();
    merchantId = id;
    kind = selection = null;
    render();
  }

  function closeMenu() {
    delete document.body.dataset.marketMenu;
    section.querySelector('[data-market-menu]')?.setAttribute('aria-expanded','false');
  }

  function browse() {
    const key = UX.focusKey(section.querySelector('.counter-ware[aria-pressed=true]'));
    selection = null;
    clearNotice();
    render();
    fit();
    const item = key && section.querySelector(key);
    item?.focus({preventScroll:true});
    item?.scrollIntoView({block:'nearest', inline:'nearest'});
  }

  function focusDetails() {
    const title = section.querySelector('.world-price-tag h3');
    if (!phone.matches || !title || window.AlchemyViewState.snapshot().current !== 'shop') return;
    title.tabIndex = -1;
    title.focus({preventScroll:true});
  }

  function inspectTool(id, preferredMerchant) {
    const c = api.campaign();
    if (!c) return false;
    const sellers = catalog.openStalls(c, E.ensure(c)).filter(stall =>
      stall.shelves.some(shelf => shelf.kind === 'tool' && shelf.ids.includes(id)));
    const stall = sellers.find(entry => entry.id === preferredMerchant) ?? sellers[0];
    if (!stall) return false;
    clearNotice();
    closeMenu();
    merchantId = stall.id;
    kind = 'tool';
    selection = id;
    render();
    focusDetails();
    return true;
  }

  section.addEventListener('change', event => {
    if (event.target.matches('[data-merchant-list]')) visit(event.target.value);
  });
  section.addEventListener('toggle', event => {
    if (event.target.matches('.stall-guide')) requestAnimationFrame(fit);
  }, true);
  section.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const data = button.dataset;
    if (data.marketMenu !== undefined) {
      if (document.body.dataset.marketMenu === 'open') closeMenu();
      else {
        document.body.dataset.marketMenu = 'open';
        button.setAttribute('aria-expanded','true');
        shellNav.querySelector('.world-location-toggle')?.focus({preventScroll:true});
      }
      fit();
      return;
    }
    if (data.nextTray !== undefined) {
      tray = (tray + 1) % Number(data.pages);
      selection = remembered.get(tray) ?? null;
      clearNotice(); closeMenu(); render(); return;
    }
    if (data.merchant) return visit(data.merchant);
    if (data.marketTab) {
      if (data.marketTab === kind) return;
      clearNotice();
      kind = data.marketTab;
      selection = null;
    } else if (data.inspect !== undefined) selection = data.inspect;
    else if (data.materialInspect !== undefined) selection = Number(data.materialInspect);
    else if (data.craftInspect !== undefined) selection = data.craftInspect;
    else if (data.upgradeInspect !== undefined) selection = 'upgrade';
    else if (data.craftHome !== undefined) {
      if (window.AlchemyViewState.navigate('work', {workMode: 'room'}))
        requestAnimationFrame(() => document.querySelector('.furnace-resume')?.focus());
      return;
    } else if (data.worldReturnTools !== undefined) {
      if (window.AlchemyViewState.navigate('work')) requestAnimationFrame(() => window.AlchemyEquipmentView.inspect(null));
      return;
    } else return;
    clearNotice();
    closeMenu();
    render();
  });
  window.addEventListener('alchemy:purchase', event => {
    clearNotice();
    notice = {material:'已入药匣', tool:'法器已购入', furnace:'陶炉已改良', craftMaterial:'器料已购入'}[event.detail.kind];
    render();
    if (window.AlchemyViewState.snapshot().current === 'shop' && document.activeElement === document.body) {
      const next = phone.matches && section.querySelector('.market-foot[data-checkout] button:not(:disabled):is([data-kind],[data-world-return-tools])');
      (next || section.querySelector('.counter-ware[aria-pressed=true]'))?.focus({preventScroll:true});
    }
    noticeTimer = setTimeout(clearNotice, 1800);
  });
  window.AlchemyMarketLayout = {fit, inspectTool};
  phone.addEventListener('change', () => { closeMenu(); render(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || !phone.matches || window.AlchemyViewState.snapshot().current !== 'shop' || document.querySelector('dialog[open]')) return;
    if (document.body.dataset.marketMenu === 'open') {
      closeMenu();
      fit();
      section.querySelector('[data-market-menu]')?.focus();
    } else if (selection !== null) browse();
    else return;
    event.preventDefault();
  });
  window.addEventListener('resize', fit);
  window.addEventListener('alchemy:view-ready', event => {
    if (event.detail.view !== 'shop') { clearNotice(); closeMenu(); }
    requestAnimationFrame(fit);
  });
  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  render();
})();
