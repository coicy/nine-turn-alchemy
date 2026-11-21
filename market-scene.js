(() => {
  'use strict';
  const api = window.AlchemyGame, E = window.AlchemyEconomy, UX = window.AlchemyUX;
  const catalog = window.AlchemyMarketMerchants;
  const section = document.querySelector('.economy-board');
  const consignment = section.querySelector('.consignment-board-v158');
  const packNames = ['普通药包', '精选药包'];
  const packEffects = ['基础起炉材料', '起炉至少良品'];
  let merchantId, kind, selection, notice = '', noticeTimer;
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

  function wares(shelf, economy) {
    const buttons = shelf.ids.map(id => {
      const pressed = ' aria-pressed="' + (id === selection) + '"';
      if (shelf.kind === 'material') {
        return '<button class="world-parcel tier-' + id + '" data-material-inspect="' + id + '"' + pressed +
          '><img src="assets/runtime-v10/herb-parcel-v1.webp" alt=""><span class="parcel-seal">' + ['普', '精'][id] +
          '</span><span>' + packNames[id] + '</span><small>' + E.PRICES[id] + ' 铜钱</small></button>';
      }
      if (shelf.kind === 'tool') {
        const tool = E.TOOL_DEFS.find(t => t.id === id);
        return '<button data-inspect="' + id + '"' + pressed + '><span data-tool-art="' + id + '"></span><span>' +
          tool.name + '</span><small>' + (economy.tools.includes(id) ? '已持有' : tool.price + ' 铜钱') + '</small></button>';
      }
      if (shelf.kind === 'craft') {
        const craft = window.AlchemyCrafts.get(id);
        return '<button data-craft-inspect="' + id + '" data-focus-key="ware-' + id + '"' + pressed + '>' +
          UX.art({craftKind: id, turn: 1}) + '<span>' + craft.name + '</span><small>' + craft.price + ' 铜钱</small></button>';
      }
      return '<button class="world-upgrade-plan" data-upgrade-inspect data-focus-key="upgrade-plan"' + pressed +
        '><span class="world-stove-diagram" aria-hidden="true"></span><span>陶炉改良图样</span></button>';
    });
    const classes = {material: ['market-goods','package-display'], tool: ['market-artifacts','artifact-picker'],
      furnace: ['market-upgrade','plan-display'], craft: ['market-craft-goods','craft-picker']};
    const [area, list] = classes[shelf.kind];
    return '<section class="' + area + '" data-market-group="' + shelf.kind + '" aria-label="' + catalog.labels[shelf.kind] +
      '陈列"><div class="' + list + ' stall-wares">' + buttons.join('') + '</div></section>';
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
      requestAnimationFrame(fit);
      return;
    }
    const shelf = stall.shelves.find(entry => entry.kind === kind) ?? stall.shelves[0];
    if (stall.id !== merchantId || kind !== shelf.kind || !shelf.ids.includes(selection)) selection = null;
    merchantId = stall.id;
    kind = shelf.kind;
    const sameShelf = section.dataset.merchant === merchantId && section.dataset.marketTab === kind;
    const scroll = sameShelf ? section.querySelector('.stall-wares')?.scrollLeft || 0 : 0;
    const blocked = s.busy || window.AlchemyInteractionBusy || window.AlchemyScene2D?.busy || c.phase !== 'open';
    const inspecting = phone.matches && selection !== null;
    const guideOpen = inspecting && sameShelf && section.dataset.item === String(selection) && section.querySelector('.stall-guide')?.open;
    section.dataset.merchant = merchantId;
    section.dataset.marketTab = kind;
    section.dataset.item = String(selection);
    section.dataset.inspecting = String(inspecting);
    const item = selection === null ? {body:'', checkout:''} : details(s, e, blocked);
    paint(navigation(stalls, stall) +
      '<div class="market-stage">' +
      (inspecting ? '<button class="stall-back" type="button" data-back-to-wares data-focus-key="stall-back">‹ 货架</button>' : '') +
      shelfNavigation(stall) + '<img class="market-merchant" loading="lazy" src="' + UX.esc(stall.portrait) +
      '" alt="' + UX.esc(stall.name) + '"><div class="market-foreground" aria-hidden="true"></div><div class="market-stalls"' + (inspecting ? ' inert' : '') + '>' +
      wares(shelf, e) + '</div></div><aside class="world-price-tag" aria-label="当前货物详情"' +
      (selection === null ? ' hidden' : '') + '>' + item.body + '</aside>' +
      '<footer class="market-foot"' + (item.checkout ? ' data-checkout' : '') + '><span class="merchant-wallet">现有 ' + e.coins + ' 铜钱</span>' +
      '<span class="market-receipt" role="status">' + UX.esc(notice) + '</span>' + item.checkout + '</footer>');
    window.AlchemyWorldUI?.decorateTools(section);
    if (guideOpen) section.querySelector('.stall-guide').open = true;
    section.querySelector('.stall-wares').scrollLeft = scroll;
    requestAnimationFrame(fit);
  }

  function fit() {
    const stage = section.querySelector('.market-stage'), foot = section.querySelector('.market-foot');
    if (!stage || !foot) return;
    for (const el of section.querySelectorAll(':scope>.world-books,:scope>.passage-home')) foot.append(el);
    if (section.dataset.shellActive === 'true')
      section.style.setProperty('--market-top', Math.max(64, shellNav.getBoundingClientRect().bottom + 4) + 'px');
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h || !merchantId) return;
    const mobile = phone.matches, scale = Math.max(w / 1672, h / 941);
    // In the stall painting, the wooden rack starts at x=716 and the tabletop at y=556.
    const rackX = 716 * scale;
    const left = mobile ? Math.max(w - 1672*scale, Math.min(0, w*.43 - rackX)) : (w - 1672*scale)/2;
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
    const group = stage.querySelector('[data-market-group]'), list = group.querySelector('.stall-wares');
    const sample = section.dataset.inspecting === 'true';
    if (sample) stage.style.setProperty('--stall-sample-size', Math.min(86, Math.max(48, h*.24)) + 'px');
    const x = sample ? Math.round(w*.55) : mobile ? 12 : Math.round(w*.40);
    const width = sample ? Math.round(w*.40) : mobile ? w-24 : Math.round(w*.55);
    group.style.left = x + 'px';
    group.style.width = width + 'px';
    const shelfTop = sample ? table + h*.18 - list.offsetHeight : table + (mobile ? 12 : 0);
    group.style.top = Math.max(0, Math.min(shelfTop, h - list.offsetHeight - 4)) + 'px';
    const chosen = list.querySelector('[aria-pressed=true]');
    if (chosen && list.clientWidth && list.scrollWidth > list.clientWidth) {
      const a = chosen.getBoundingClientRect(), b = list.getBoundingClientRect();
      if (a.right > b.right) list.scrollLeft += a.right - b.right;
      else if (a.left < b.left) list.scrollLeft += a.left - b.left;
    }
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
    const key = UX.focusKey(section.querySelector('.stall-wares [aria-pressed=true]'));
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
    if (data.backToWares !== undefined) return browse();
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
    closeMenu();
    render();
    if (selection !== null) focusDetails();
  });
  window.addEventListener('alchemy:purchase', event => {
    clearNotice();
    notice = {material:'已入药匣', tool:'法器已购入', furnace:'陶炉已改良', craftMaterial:'器料已购入'}[event.detail.kind];
    render();
    if (window.AlchemyViewState.snapshot().current === 'shop' && document.activeElement === document.body) {
      const next = phone.matches && section.querySelector('.market-foot[data-checkout] button:not(:disabled):is([data-kind],[data-world-return-tools])');
      (next || section.querySelector(phone.matches ? '.stall-back' : '.stall-wares [aria-pressed=true]'))?.focus({preventScroll:true});
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
