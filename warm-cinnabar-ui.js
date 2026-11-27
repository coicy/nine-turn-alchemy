/* === Consolidated source: warm-cinnabar-ui.js === */
/* Measure navigation on layout changes; page state remains owned by the existing UI stack. */
(() => {
 'use strict';
 if(!document.body.classList.contains('warm-cinnabar-experiment')) return;
 const nav=document.querySelector('.engine-nav'); let queued=false,last='';
 const sound=document.querySelector('.scene-sound'),settings=document.getElementById('worldSettings');
 if(sound&&settings){
  settings.append(sound);
  const host=document.querySelector('#mainMenuSettingsPanel .main-menu__settings-actions');
  if(host){
   const proxy=document.createElement('button');proxy.type='button';proxy.className='game-feel-setting warm-sound-setting';
   const sync=()=>{proxy.textContent=sound.textContent;proxy.setAttribute('aria-pressed',sound.getAttribute('aria-pressed'));};
   proxy.onclick=()=>{sound.click();sync();};host.append(proxy);sync();
   new MutationObserver(sync).observe(sound,{childList:true,attributes:true,attributeFilter:['aria-pressed']});
  }
 }
 function update(){queued=false;const bottom=Math.max(0,Math.ceil(nav.getBoundingClientRect().bottom)),value=bottom+'px';if(last===value)return;last=value;document.body.style.setProperty('--warm-nav-bottom',value);window.AlchemyViewState?.fit();}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 const observer=new ResizeObserver(schedule);observer.observe(nav);
 window.addEventListener('resize',schedule);window.addEventListener('alchemy:view-ready',schedule);window.addEventListener('alchemy:opening-finished',schedule);
 window.AlchemyWarmUI=Object.freeze({reference:'1440x900',navigation:'adaptive flow',refresh:schedule});schedule();
})();

/* === Merged from warm-cinnabar-stock.js (warm-cinnabar stock panel & interactions) === */
(() => {
 'use strict';
 const game=window.AlchemyGame,route=window.AlchemyViewState,UX=window.AlchemyUX;
 const {TOOL_DEFS,EQUIP_SLOTS,equippedIds}=window.AlchemyEconomy;
 const stock=document.querySelector('.scene-stock'),nav=stock.querySelector('.scene-stock-nav');
 const title=document.createElement('div');
 title.className='warm-stock-title';
 title.innerHTML='<span>药匣</span>';
 title.append(nav.querySelector('.scene-balance'));
 nav.before(title);
 nav.innerHTML='<button type="button" data-stock-filter="materials">原料</button><button type="button" data-stock-filter="products">成品</button><button type="button" data-stock-filter="tools">法器</button>';
 nav.setAttribute('role','group');
 nav.setAttribute('aria-label','药匣筛选');
 const tools=document.createElement('section');
 tools.className='warm-stock-tools';
 tools.setAttribute('aria-label','已拥有的法器');
 stock.querySelector('.scene-pill-stock').after(tools);
 let toolsKey='',selectedTool=null;
 function renderTools(){
  const economy=game.campaign()?.economy;
  if(!economy||stock.dataset.filter!=='tools')return;
  const equipped=equippedIds(economy.equipped),state=game.snapshot(),tp=state.toolProgress||{};
  const owned=TOOL_DEFS.filter(tool=>economy.tools.includes(tool.id));
  if(!owned.some(tool=>tool.id===selectedTool))selectedTool=null;
  const key=JSON.stringify([owned.map(tool=>tool.id),equipped,tp.uses,tp.riskRulerConverted,tp.riskRulerBonus,tp.guardCasketUsed,tp.yuanFloorUsed,tp.fissureTriggers,tp.refineCount,state.pillEnded,selectedTool]);
  if(toolsKey===key)return;
  toolsKey=key;
  UX.html(tools,owned.length?'<p class="warm-tool-count"><span>已布置 '+equipped.length+' / '+EQUIP_SLOTS+'</span><span>勾选即生效</span></p><ul>'+owned.map(tool=>{
   const id=UX.esc(tool.id),name=UX.esc(tool.name);
   const placed=equipped.includes(tool.id);
   const expanded=selectedTool===tool.id;
   const spent=placed&&!state.pillEnded&&['seal','phoenix'].includes(tool.id)&&tp.uses[tool.id];
   const rulerStatus=placed&&!state.pillEnded&&tool.id==='risk_ruler'
    ?(tp.riskRulerExpired
     ?(tp.riskRulerBonus>0?'已达上限失效（30% / 30%）· 待归元 ×'+(1+tp.riskRulerBonus).toFixed(2):'本炉已达上限失效（30% / 30%）')
     :'已转险 '+((tp.riskRulerConverted||0)*100).toFixed(1).replace(/\.0$/,'')+'% / '+Math.round((tp.riskRulerCap||.3)*100)+'% · 归元 ×'+(1+(tp.riskRulerBonus||0)).toFixed(2))
    :'';
   const limitStatus=placed&&!state.pillEnded
    ?(tool.id==='guard_casket'?(tp.guardCasketUsed?'本炉已用尽':'本炉剩余 1 次护丹')
     :tool.id==='steady_talisman'?(tp.yuanFloorUsed?'本炉已用尽':'9转归元保底待命')
     :tool.id==='fissure_cone'?'已触发 '+(tp.fissureTriggers||0)+' / 3 次'
     :tool.id==='hearth_pin'?(Math.max(0,3-(tp.refineCount||0))?'前3次降险余 '+Math.max(0,3-(tp.refineCount||0))+' 次':'前3次降险已用完')
     :'')
    :'';
   return '<li><button type="button" class="warm-tool-pick" data-stock-tool="'+id+'" data-focus-key="tool-detail-'+id+'" aria-expanded="'+expanded+'" aria-controls="warm-tool-'+id+'"><span data-tool-art="'+id+'"></span><span>'+name+'</span></button>'
    +'<label class="warm-tool-check"><input type="checkbox" data-equip-tool="'+id+'" data-focus-key="tool-equip-'+id+'" aria-label="布置'+name+'"'+(placed?' checked':'')+'></label>'
    +'<div class="warm-tool-detail" id="warm-tool-'+id+'"'+(expanded?'':' hidden')+'><p>'+UX.esc(tool.description)+'</p>'+(spent?'<p>本炉已用尽</p>':'')+(rulerStatus?'<p>'+UX.esc(rulerStatus)+'</p>':'')+(limitStatus?'<p>'+UX.esc(limitStatus)+'</p>':'')+'</div>'
    +'<div class="warm-tool-notice" role="alert" hidden></div></li>';
  }).join('')+'</ul>':'<p class="warm-stock-empty">暂无法器</p>');
  window.AlchemyWorldUI.decorateTools(tools);
 }
 function select(filter){
  stock.dataset.filter=filter;
  nav.querySelectorAll('[data-stock-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.stockFilter===filter)));
  renderTools();
  window.AlchemyWorldLayout.fit();
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-stock-filter]');
  if(button)select(button.dataset.stockFilter);
 });
 tools.addEventListener('click',event=>{
  const button=event.target.closest('[data-stock-tool]');
  if(!button)return;
  const id=button.dataset.stockTool;
  selectedTool=selectedTool===id?null:id;
  renderTools();
  window.AlchemyWorldLayout.fit();
  if(selectedTool)document.getElementById('warm-tool-'+id).scrollIntoView({block:'nearest'});
 });
 tools.addEventListener('change',event=>{
  const checkbox=event.target.closest('[data-equip-tool]');
  if(!checkbox)return;
  const id=checkbox.dataset.equipTool;
  const checked=checkbox.checked;
  const oldId=checked?null:id,newId=checked?id:null;
  const result=game.canReplaceEquipment(oldId,newId);
  let reason=result.reason;
  if(result.ok){
   if(route.snapshot().workMode!=='room')reason='请返回工坊后调整法器。';
   else if(game.replaceEquipment(oldId,newId)){
    window.AlchemyGameFeel?.emit('equipment',{oldId,newId,tier:'medium'});
    return;
   }else reason='当前无法调整法器，请稍后再试。';
  }else if(checked&&reason.startsWith('三个位置已满'))reason='同时只能有三个法器生效。';
  checkbox.checked=equippedIds(game.campaign()?.economy?.equipped).includes(id);
  tools.querySelectorAll('.warm-tool-notice:not([hidden])').forEach(notice=>{notice.hidden=true;notice.textContent='';});
  const notice=checkbox.closest('li').querySelector('.warm-tool-notice');
  notice.hidden=false;
  notice.textContent=reason;
  window.AlchemyWorldLayout.fit();
  notice.scrollIntoView({block:'nearest'});
 });
 window.addEventListener('alchemy:pill-stored',()=>select('products'));
 window.addEventListener('alchemy:reserve-select',()=>select('materials'));
 window.addEventListener('alchemy:render',renderTools);
 window.addEventListener('alchemy:view-ready',renderTools);
 select('materials');

 const canvas=document.getElementById('alchemyScene'),viewport=document.querySelector('.engine-viewport');
 const marker=document.createElement('div');
 marker.className='warm-stock-drop';
 marker.setAttribute('aria-hidden','true');
 marker.hidden=true;
 document.body.append(marker);
 let drag=null,suppressClick=false;
 function mouthRect(){
  const box=canvas.getBoundingClientRect(),view=viewport.getBoundingClientRect();
  const mouth=window.AlchemyScene2D.mouth;
  const sx=box.width/canvas.width,sy=box.height/canvas.height;
  const left=Math.max(view.left,box.left+mouth.x*sx),top=Math.max(view.top,box.top+mouth.y*sy);
  const right=Math.min(view.right,box.left+(mouth.x+mouth.w)*sx),bottom=Math.min(view.bottom,box.top+(mouth.y+mouth.h)*sy);
  return {left,top,right,bottom};
 }
 function overMouth(event,box){
  const {clientX:x,clientY:y}=event;
  const hit=document.elementFromPoint(x,y);
  return x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom
   &&viewport.contains(hit)&&!hit?.closest('.scene-stock,button:not(.furnace-resume):not(.workbench-hotspot)');
 }
 function cancelDrag(){
  if(!drag)return;
  const {card,pointer,ghost}=drag;
  drag=null;
  ghost?.remove();
  marker.hidden=true;
  if(card.hasPointerCapture(pointer))card.releasePointerCapture(pointer);
 }
 stock.addEventListener('dragstart',event=>{
  if(event.target.closest('[data-stock-pill]'))event.preventDefault();
 });
 stock.addEventListener('pointerdown',event=>{
  const card=event.target.closest('[data-stock-pill]');
  if(!card||event.button!==0||!event.isPrimary||drag)return;
  suppressClick=false;
  drag={card,id:card.dataset.stockPill,pointer:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
  card.setPointerCapture(event.pointerId);
 });
 stock.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  if(!drag.ghost){
   if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;
   const ghost=document.createElement('div');
   ghost.className='warm-stock-ghost';
   ghost.setAttribute('aria-hidden','true');
   const art=drag.card.querySelector('img');
   if(art)ghost.append(art.cloneNode());
   document.body.append(ghost);
   drag.ghost=ghost;
  }
  drag.ghost.style.transform='translate('+event.clientX+'px,'+event.clientY+'px) translate(-50%,-50%)';
  const box=mouthRect();
  const eligible=game.canReturnPill(drag.id).ok;
  marker.hidden=!eligible;
  if(eligible){
   Object.assign(marker.style,{left:box.left+'px',top:box.top+'px',width:Math.max(0,box.right-box.left)+'px',height:Math.max(0,box.bottom-box.top)+'px'});
   marker.classList.toggle('is-targeted',overMouth(event,box));
  }
 });
 stock.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  const {id,ghost}=drag;
  const target=ghost&&route.snapshot().current==='work'&&overMouth(event,mouthRect());
  suppressClick=!!ghost;
  cancelDrag();
  if(!target)return;
  const result=game.canReturnPill(id);
  if(!result.ok){UX.tell(result.reason);return;}
  if(game.returnPill(id)&&route.snapshot().workMode==='room')route.navigate('work',{workMode:'furnace'});
 });
 stock.addEventListener('lostpointercapture',cancelDrag);
 stock.addEventListener('pointercancel',cancelDrag);
 document.addEventListener('click',event=>{
  if(!suppressClick||!event.detail)return;
  suppressClick=false;
  if(event.target.closest('[data-stock-pill]')){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 window.addEventListener('blur',cancelDrag);
 window.addEventListener('alchemy:view-ready',cancelDrag);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&drag){event.preventDefault();event.stopPropagation();cancelDrag();}
 },true);
})();
;
/* === Consolidated source: main-menu.js === */
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
;
/* === Consolidated source: game-feel.js === */
/* Presentation only: deterministic impulses never consume the alchemy random stream. */
(() => {
  'use strict';
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const presets = Object.freeze({
    success: {duration:340, amount:.065, lift:.025},
    big: {duration:510, amount:.13, lift:.065},
    complete: {duration:600, amount:.15, lift:.08},
    damage: {duration:380, amount:-.09, lift:0},
    hold: {duration:280, amount:0, lift:0},
    explode: {duration:640, amount:-.18, lift:-.02}
  });
  let quiet = false, impulse = null, flight = null, landing = null, serial = 0;
  try { quiet = localStorage.getItem('alchemy.reducedFeedback') === 'on'; } catch {}
  const reduced = () => quiet || media.matches;
  const controls = [];
  const tierFor = name => ({
    picked:'small', dropped:'small', loaded:'medium', start:'medium', refine:'medium', material:'small', cancel:'small',
    success:'medium', hold:'small', damage:'medium', explode:'large',
    protection:'large', big:'large', complete:'large', collect:'medium',
    ritual:'large', 'ritual-start':'large', 'ritual-sealed':'large', 'ritual-complete':'large',
    yuan:'large', stroke:'small', auto:'medium', submit:'medium', order:'medium',
    win:'large', purchase:'small', equipment:'medium', settle:'medium', 'day-next':'medium',
    paid:'medium', consign:'medium', sell:'medium', 'rent-paid':'medium', loss:'medium', campaign:'large'
  }[name] || 'small');
  function emit(event, detail = {}) {
    const payload = {event, tier: detail.tier || tierFor(event), serial: ++serial, ...detail};
    window.dispatchEvent(new CustomEvent('alchemy:feel', {detail:payload}));
    return payload;
  }
  function animate(selector, className, duration = 500) {
    if (reduced()) return;
    const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!node) return;
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
    window.setTimeout(() => node.classList.remove(className), duration);
  }
  function clear() {
    impulse = null;
    flight?.getAnimations().forEach(a => a.cancel());
    flight?.remove(); flight = null;
    landing?.cancel(); landing = null;
    window.dispatchEvent(new Event('alchemy:pill-surface'));
  }
  function sync() {
    document.body.classList.toggle('reduced-feedback', reduced());
    for (const b of controls) {
      b.textContent = reduced() ? '动态反馈：轻简' : '动态反馈：完整';
      b.setAttribute('aria-pressed', String(reduced()));
      b.disabled = media.matches;
      b.title = media.matches ? '已跟随系统减少动态效果' : '减少丹体弹动、飞入丹匣与粒子效果';
    }
  }
  for (const selector of ['#worldSettings', '#mainMenuSettingsPanel .main-menu__settings-actions']) {
    const host = document.querySelector(selector);
    if (!host) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'game-feel-setting';
    b.onclick = () => {
      quiet = !quiet;
      try { localStorage.setItem('alchemy.reducedFeedback', quiet ? 'on' : 'off'); } catch {}
      clear(); sync();
    };
    controls.push(b); host.append(b);
  }
  media.addEventListener('change', () => { clear(); sync(); });
  document.addEventListener('click', e => {
    if (e.target.closest('#mainMenuSettings,.world-settings-toggle')) sync();
  }, true);
  sync();
  function collect(id) {
    clear();
    const route = window.AlchemyViewState.snapshot();
    if (reduced() || route.current !== 'work' || route.workMode !== 'furnace') return;
    const canvas = document.querySelector('#alchemyScene');
    const target = document.querySelector('.scene-pill-stock [data-stock-pill="'+CSS.escape(String(id))+'"]');
    if (!target?.checkVisibility() || !canvas?.checkVisibility()) return;
    const r = canvas.getBoundingClientRect(), dest = target.getBoundingClientRect();
    const p = window.AlchemyWorldLayout.objects.pill;
    const size = (p.visualDiameter || p.w) * r.width / canvas.width;
    const x = r.left + (p.x+p.w/2)*r.width/canvas.width-size/2;
    const y = r.top + (p.y+p.h/2)*r.height/canvas.height-size/2;
    const dx = dest.left + dest.width/2 - size/2 - x;
    const dy = dest.top + dest.height/2 - size/2 - y;
    const im = document.createElement('img');
    im.src = window.AlchemyPillArt.image(window.AlchemyGame.snapshot());
    im.alt = ''; im.setAttribute('aria-hidden','true'); im.className = 'pill-collection-flight';
    Object.assign(im.style, {left:x+'px', top:y+'px', width:size+'px', height:size+'px'});
    document.body.append(im); flight = im;
    const a = im.animate([
      {transform:'translate(0,0) scale(1)', opacity:1},
      {transform:`translate(${dx*.35}px,${dy*.25-24}px) scale(1.06)`, opacity:1, offset:.38},
      {transform:`translate(${dx}px,${dy}px) scale(.3)`, opacity:.8, offset:.9},
      {transform:`translate(${dx}px,${dy}px) scale(.2)`, opacity:0}
    ], {duration:560, easing:'cubic-bezier(.2,.7,.25,1)'});
    a.onfinish = () => {
      im.remove(); if (flight !== im) return; flight = null;
      landing = target.animate([{boxShadow:'inset 0 0 0 2px #bc965b'}, {boxShadow:'inset 0 0 0 0 transparent'}], {duration:260,easing:'ease-out'});
    };
  }
  window.addEventListener('alchemy:feedback', e => {
    const kind = e.detail.event;
    emit(kind, e.detail);
    if (kind === 'collect') { clear(); return; }
    const preset = presets[kind];
    impulse = !reduced() && preset ? {...preset, start:performance.now(), kind} : null;
    window.dispatchEvent(new Event('alchemy:pill-surface'));
  });
  window.addEventListener('alchemy:feel', e => {
    const d = e.detail || {};
    const stage = document.getElementById('pillStage');
    const map = {
      picked: ['.herb-tray,.scene-pill-stock,.scene-tool-stock', 'feel-picked'],
      dropped: ['#alchemyScene,.furnace-tray', 'feel-dropped'],
      cancel: ['#alchemyScene,.furnace-tray', 'feel-dropped'],
      loaded: ['#pillStage', 'feel-loaded'],
      start: ['#pillStage,.furnace-panel', 'feel-loaded'],
      'furnace-start': ['#pillStage,.furnace-panel', 'feel-loaded'],
      refine: ['#fireObject,.furnace-fire', 'feel-refine'],
      protection: ['#pillStage,.world-tool-row', 'feel-protection'],
      ritual: ['#ritualPanel,#pillStage', 'feel-ritual'],
      'ritual-start': ['#ritualPanel,#pillStage', 'feel-ritual'],
      'ritual-sealed': ['#ritualPanel,#pillStage', 'feel-ritual'],
      'ritual-complete': ['#ritualPanel,#pillStage', 'feel-win'],
      yuan: ['#pillStage,#refineFeedback', 'feel-protection'],
      stroke: ['#ritualGrid', 'feel-stroke'],
      auto: ['#pillStage,#refineFeedback', 'feel-auto'],
      submit: ['.pill-bag-panel,.room-loop-card', 'feel-submit'],
      win: ['.room-loop-card,.counter-board', 'feel-win'],
      purchase: ['.market-board,.herb-tray', 'feel-purchase'],
      material: ['.market-board,.herb-tray', 'feel-purchase'],
      equipment: ['#equipmentDrawer,.world-tool-row', 'feel-equipment'],
      settle: ['#dailySummary,.counter-board', 'feel-settle'],
      'day-next': ['#dailySummary,.counter-board', 'feel-settle'],
      paid: ['.consignment-board-v158,.economy-board', 'feel-paid'],
      consign: ['.pill-bag-panel,.consignment-board-v158', 'feel-paid'],
      sell: ['.pill-bag-panel,.economy-board', 'feel-submit'],
      'rent-paid': ['#dailySummary,.economy-board', 'feel-settle'],
      order: ['#counterNote,.counter-board', 'feel-win'],
      loss: ['#counterNote,.room-loop-card', 'feel-submit'],
      campaign: ['#dailySummary,.counter-board', 'feel-campaign']
    };
    const entry = map[d.event];
    if (entry) animate(entry[0], entry[1], d.tier === 'large' ? 900 : 520);
    if (stage && d.tier === 'large' && !reduced()) {
      stage.dataset.feelTier = d.event;
      window.setTimeout(() => { if (stage.dataset.feelTier === d.event) stage.dataset.feelTier = ''; }, 900);
    }
  });
  // Inventory is painted after the feedback event. Wait for that real storage hook.
  window.addEventListener('alchemy:pill-stored', e => requestAnimationFrame(() => collect(e.detail.id)));
  for (const event of ['alchemy:view-ready','alchemy:order','blur']) window.addEventListener(event, clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  window.AlchemyGameFeel = {
    get reduced() { return reduced(); },
    get active() { return impulse ? impulse.kind : null; },
    emit,
    sample(now = performance.now()) {
      if (!impulse || reduced()) return null;
      const t = Math.max(0, (now-impulse.start)/impulse.duration);
      if (t >= 1) { impulse = null; return null; }
      // Damped recoil, volume-preserving scale; only the painted pill is moved.
      const wave = Math.cos(t*Math.PI*3)*(1-t)**3;
      const sx = 1 + impulse.amount*wave;
      return {sx, sy:1/sx, lift:-Math.sin(Math.PI*t)*(1-t)*impulse.lift};
    }
  };
})();
;
/* === Consolidated source: furnace-fire.js === */
/* Living fire, confined to the painted firebox. No game random numbers or saved state. */
(() => {
  'use strict';
  const stage = document.getElementById('pillStage');
  const canvas = document.createElement('canvas');
  canvas.id = 'furnaceLivingFire'; canvas.width = 192; canvas.height = 144;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {position:'absolute', pointerEvents:'none', zIndex:'14'});
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  stage.append(canvas);
  const field = document.createElement('canvas'); field.width = 112; field.height = 88;
  const fx = field.getContext('2d'), pixels = fx.createImageData(112, 88);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.getElementById('mainMenu');
  const painted = document.body.classList.contains('warm-cinnabar-experiment');
  const fireSource = 'assets/warm-cinnabar/motion/fire.webp';
  // The atlas includes a painted stone bed below this row. The scene provides its own coals.
  const flameRows = 186;
  if (painted) window.AlchemyAssets.load(fireSource).then(() => { delete canvas.dataset.state; });
  canvas.dataset.style = painted ? 'painted' : 'procedural';
  let impulse = -2000, last = 0, frame = 0, running = false, geometry = '', flow = 0, wasBusy = false;
  const clamp = x => Math.max(0, Math.min(1, x));
  const hash = (x,y) => {let n = Math.imul(x,374761393) + Math.imul(y,668265263); n = Math.imul(n ^ n >>> 13,1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967295;};
  function noise(x,y) {
    const ix=Math.floor(x), iy=Math.floor(y); let u=x-ix,v=y-iy;
    u=u*u*(3-2*u);v=v*v*(3-2*v);
    const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
  }
  function paint(t, power, quiet, surge = 0) {
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.save(); ctx.scale(W,H);
    // The iron rim and foreground coals remain visible around the interior.
    ctx.beginPath(); ctx.moveTo(.035,.91); ctx.lineTo(.035,.43);
    ctx.bezierCurveTo(.035,.04,.83,-.04,.955,.40);
    ctx.lineTo(.975,.91);ctx.closePath();ctx.clip();
    if (painted) {
      // Alpha artwork only: the scene already supplies the dark firebox and iron rim.
      const atlas = window.AlchemyAssets.getImage(fireSource);
      if (atlas) {
        const index = quiet ? 0 : Math.floor(t / 95) % 8;
        const height = .66 + .28 * clamp(power / 1.35);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(atlas, index * 256, 0, 256, flameRows, .02, .91 - height, .96, height);
        ctx.globalCompositeOperation = 'destination-in';
        const fade=ctx.createLinearGradient(0,.82,0,.91);
        fade.addColorStop(0,'#fff');
        fade.addColorStop(1,'transparent');
        ctx.fillStyle=fade;
        ctx.fillRect(0,0,1,1);
        canvas.dataset.frame = String(index);
        canvas.dataset.source = fireSource;
      }
      ctx.restore(); frame++; return;
    }
    const shade=ctx.createLinearGradient(0,0,0,1);
    shade.addColorStop(0,'rgba(47,25,14,.92)');shade.addColorStop(.62,'rgba(67,28,12,.86)');shade.addColorStop(1,'rgba(56,24,12,0)');
    ctx.fillStyle=shade;ctx.fillRect(0,0,1,1);
    const time=quiet?1.7:t*.001, data=pixels.data;
    for(let y=0;y<88;y++)for(let x=0;x<112;x++){
      const u=x/111,v=y/87, rise=1-v;
      const warp=noise(u*3.6+8,v*3.8-time*1.8)-.5;
      const n=noise(u*9+warp*2,v*2.7-time*2.8)*.72+noise(u*19+warp*3,v*6-time*4.8)*.28;
      const width=Math.max(.12,.40+power*.09-rise*.20), side=Math.abs(u-.5+warp*rise*.23)/width;
      const heat=clamp((1-rise/(.53+power*.42)-side*side*.68+(n-.53)*(1.15+rise*.3))*1.35);
      const i=(y*112+x)*4;
      data[i]=Math.min(255,175+heat*135); data[i+1]=Math.max(0,heat*300-42);
      data[i+2]=Math.max(0,(heat-.73)*520)+surge*heat*28;
      data[i+3]=clamp(heat*3)*clamp((1-v)*10)*clamp((v-.06)*12)*220;
    }
    fx.putImageData(pixels,0,0);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(field,0,.06,1,.83);
    // Sparse embers ride the updraft, rather than radiating out of the furnace.
    if(!quiet)for(let i=0;i<7+Math.floor(surge*10);i++){
      const age=(time*(.42+i*.019)+i*.173)%1;
      const x=.23+hash(i,4)*.52+Math.sin(age*8+i)*.035;
      const y=.82-age*.68;
      ctx.globalAlpha=Math.sin(age*Math.PI)*(.35+power*.35);
      ctx.fillStyle=i%3?'#ffc36a':'#ffe6a1';ctx.beginPath();ctx.ellipse(x,y,.0035,.008,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1; frame++;
  }
  function tick(t) {
    requestAnimationFrame(tick);
    if(t-last<33) return;
    const dt=Math.min(66,t-last);last=t;
    const s=window.AlchemyGame.snapshot(),v=window.AlchemyViewState.snapshot();
    const visible=!document.hidden && s.started && v.current==='work' && (!menu || menu.hidden);
    canvas.hidden=!visible; running=false;
    if(!visible){impulse=-2000;wasBusy=false;return;}
    const key=(v.workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
    const p=window.AlchemySceneProjection?.[key];if(!p)return;
    const width=parseFloat(stage.style.getPropertyValue('--room-base-width'));
    const height=parseFloat(stage.style.getPropertyValue('--room-base-height'));
    const top=parseFloat(stage.style.getPropertyValue('--scene-image-top'))||0;
    const fire=(painted&&window.AlchemyWarmFireProjection[key])||p.fire;
    const r={left:fire.x*width,top:top+fire.y*height,width:fire.w*width,height:fire.h*height};
    const next=JSON.stringify(r);if(next!==geometry){geometry=next;for(const k in r)canvas.style[k]=r[k]+'px';}
    const quiet=media.matches||window.AlchemyGameFeel?.reduced;
    const busy=!s.pillEnded && (s.busy || window.AlchemyScene2D?.busy);
    if(busy&&!wasBusy)impulse=t;
    wasBusy=busy;
    const age=t-impulse;
    // Fast intake, a readable crest, then an eased fall. This outlasts the 100ms settlement.
    const pulse=age<100 ? clamp(age/100) : age<500 ? 1 : clamp(1-(age-500)/800)**2;
    const surge=quiet ? 0 : Math.max(pulse,busy ? .7 : 0);
    const power=s.pillEnded ? .20 : .40+surge*.95;
    flow+=dt*(1+surge*1.65);
    const state=[key,quiet,power,next].join(':');
    if(quiet && canvas.dataset.state===state)return;
    canvas.dataset.state=state;canvas.dataset.mode=quiet?'still':s.pillEnded?'embers':surge>.15?'stoking':'burning';
    canvas.dataset.surge=surge.toFixed(3);
    running=!quiet;paint(quiet?1700:flow,power,quiet,surge);
  }
  window.addEventListener('alchemy:fanning',()=>{impulse=performance.now();});
  window.addEventListener('alchemy:feedback',e=>{if(e.detail?.autoStep)impulse=performance.now();});
  window.AlchemyFurnaceFire={get frames(){return frame;},get running(){return running;}};
  requestAnimationFrame(tick);
})();
;
/* === Consolidated source: refine-performance.js === */
/* Furnace heat and pill results: presentation only, driven by real actions/results. */
(() => {
  'use strict';
  const stage=document.getElementById('pillStage'),main=document.getElementById('alchemyScene');
  const layer=document.createElement('canvas');layer.id='refinePerformance';layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'15'});stage.append(layer);
  const ctx=layer.getContext('2d'),surface=document.createElement('canvas');surface.width=surface.height=256;
  const sc=surface.getContext('2d'),media=matchMedia('(prefers-reduced-motion: reduce)');
  const kinds=new Set(['success','big','hold','damage','explode','complete']);
  const painted=document.body.classList.contains('warm-cinnabar-experiment');
  layer.dataset.style=painted?'painted':'soft-light';
  let heating=-10000,result=null,last=0,busyBefore=false,lid=null,openedLid=null,frames=0;
  const quiet=()=>media.matches||window.AlchemyGameFeel?.reduced;
  const clamp=x=>Math.max(0,Math.min(1,x));
  function releaseLid(){if(openedLid){openedLid.style.visibility=stage.dataset.lidState==='closed'?'visible':'hidden';openedLid=null;}}
  function stop(){heating=-10000;result=null;ctx.clearRect(0,0,layer.width,layer.height);if(lid)lid.style.transform='';releaseLid();layer.dataset.phase='idle';window.dispatchEvent(new Event('alchemy:pill-surface'));}
  function begin(){if(!quiet())heating=performance.now();}
  function visible(){return !document.hidden&&window.AlchemyViewState.snapshot().current==='work'&&document.getElementById('mainMenu').hidden;}
  function glow(x,y,rx,ry,color,alpha){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  function puff(x,y,size,alpha,color){
    if(!painted){glow(x,y,size,size*.65,color,alpha);return;}
    // Tapered pigment strokes, leaving the original scene visible between curls.
    ctx.save();ctx.translate(x,y);ctx.scale(size,size*.65);ctx.globalAlpha=alpha*.7;ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(-1,.3);ctx.bezierCurveTo(-.75,-.55,-.1,-.9,.44,-.52);ctx.bezierCurveTo(.84,-.34,.48,-.04,1,.16);ctx.bezierCurveTo(.35,.05,-.15,.76,-1,.3);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=.055;ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(-.65,.1);ctx.bezierCurveTo(-.33,-.32,.09,-.5,.38,-.28);ctx.stroke();ctx.restore();
  }
  function steam(m,t,strength){
    // Thin, soft puffs rise from the back-right lid seam, never from solid clay.
    for(let i=0;i<6;i++){
      const age=(t/1050+i*.17)%1;
      const x=m.x+m.w*(.68+i*.018)+Math.sin(age*5+i)*m.w*.018;
      const y=m.y+m.h*.30-age*m.w*.18;
      puff(x,y,m.w*(.018+age*.024),Math.sin(age*Math.PI)*strength*.40,'#e7dfce');
    }
  }
  function draw(now){
    requestAnimationFrame(draw);if(now-last<30)return;last=now;
    if(layer.width!==main.width||layer.height!==main.height){layer.width=main.width;layer.height=main.height;}
    if(!visible()||quiet()){if(result||heating>-10000)stop();return;}
    ctx.clearRect(0,0,layer.width,layer.height);frames++;
    const L=window.AlchemyWorldLayout,m=L.mouth,f=L.firebox;
    const elapsed=now-heating,heat=elapsed<180?clamp(elapsed/180):clamp(1-(elapsed-180)/1250);
    lid=stage.querySelector('#lid-patch-mask')?.closest('svg');
    releaseLid();
    if(lid)lid.style.transform='';
    if(heat>0){
      // Clip reflected firelight to the furnace silhouette below its rim.
      ctx.save();ctx.beginPath();ctx.moveTo(m.x,m.y+m.h*.55);
      ctx.bezierCurveTo(m.x-m.w*.05,f.y,m.x+m.w*.08,f.y+f.h,m.x+m.w*.40,f.y+f.h);
      ctx.lineTo(m.x+m.w*.95,f.y+f.h*.7);
      ctx.quadraticCurveTo(m.x+m.w*1.08,f.y,m.x+m.w,m.y+m.h*.55);ctx.closePath();ctx.clip();
      if(painted){
        ctx.globalAlpha=heat*.08;ctx.fillStyle='#c7773e';ctx.fillRect(m.x,m.y,m.w,f.y+f.h-m.y);
      }else{
        ctx.globalCompositeOperation='soft-light';
        glow(f.x+f.w*.48,f.y+f.h*.05,m.w*.58,Math.max(f.y-m.y,m.h)*.85,'#ffa14d',heat*.65);
        glow(f.x+f.w*.5,f.y-f.h*.12,f.w*.85,f.h*1.2,'#ffc477',heat*.7);
      }
      ctx.restore();
      steam(m,elapsed,heat);
      if(lid&&stage.dataset.lidState==='closed')lid.style.transform=`translate(${Math.sin(elapsed*.044)*heat*.6}px,${Math.sin(elapsed*.061)*heat*.4}px)`;
    }
    if(result){
      const t=clamp((now-result.start)/result.duration),fade=Math.sin(t*Math.PI),k=result.kind;
      const p=L.objects.pill,d=p.visualDiameter||p.w,x=p.x+p.w/2,y=p.y+p.h/2;
      const major=k==='big'||k==='complete';
      const concealed=stage.dataset.lidState==='closed'&&k!=='explode';
      if(k==='explode'&&lid){lid.style.visibility='hidden';openedLid=lid;}
      // No success glow for a hold. Damage smoke is local; explosion ash leaves the mouth.
      if(!concealed&&(k==='damage'||k==='explode')){
        const explosion=k==='explode',originY=explosion?m.y+m.h*.5:y;
        for(let i=0;i<(explosion?11:4);i++){
          const spread=explosion?m.w*.42:d*.28;
          puff(x+Math.sin(i*2.4)*spread*t,originY-t*(explosion?m.w*.32:d*.7)+(i%3)*d*.05,d*(.10+t*(explosion?.65:.20)),fade*(explosion?.42:.28),'#6b6256');
        }
        if(explosion)for(let i=0;i<16;i++){
          ctx.globalAlpha=fade*.8;ctx.fillStyle=i%2?'#92714a':'#594a3d';const dx=Math.sin(i*2.3)*m.w*.5*t,dy=-Math.abs(Math.cos(i*1.7))*m.w*.35*t+t*t*m.w*.35;
          ctx.fillRect(x+dx,m.y+m.h*.6+dy,Math.max(1,d*.025),Math.max(1,d*.016));
        }
        ctx.globalAlpha=1;
      }else if(!concealed&&k==='hold'){
        puff(x,y-d*.35-t*d*.6,d*(.10+t*.16),fade*.16,'#d5cdbd');
      }else if(!concealed&&major){
        for(let i=0;i<(painted?5:9);i++){
          const angle=i*2.4,dist=d*(.28+t*.55);
          ctx.globalAlpha=fade*.65;ctx.fillStyle='#d3ae68';ctx.beginPath();ctx.ellipse(x+Math.cos(angle)*dist,y+Math.sin(angle)*dist*.6-t*d*.22,Math.max(.8,d*.014),Math.max(.8,d*.021),angle,0,Math.PI*2);ctx.fill();
        }ctx.globalAlpha=1;
      }
      if(t>=1){result=null;releaseLid();window.dispatchEvent(new Event('alchemy:pill-surface'));}
      else window.dispatchEvent(new Event('alchemy:pill-surface'));
    }
    layer.dataset.phase=result?.kind||(heat>0?'heating':'idle');
    layer.dataset.heat=heat.toFixed(3);
  }
  window.addEventListener('alchemy:fanning',()=>{result=null;begin();});
  window.addEventListener('alchemy:render',()=>{const s=window.AlchemyGame.snapshot();if(s.busy&&!busyBefore)begin();busyBefore=s.busy;});
  window.addEventListener('alchemy:feedback',e=>{
    const k=e.detail.event;if(k==='collect'||k==='start'){stop();return;}
    if(kinds.has(k)&&visible()&&!quiet()){
      result={kind:k,start:performance.now(),duration:k==='explode'?1250:k==='hold'?800:1100};
      if(e.detail.autoStep)begin();
      window.dispatchEvent(new Event('alchemy:pill-surface'));
    }
  });
  for(const name of ['alchemy:view-ready','alchemy:order','blur'])window.addEventListener(name,stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});media.addEventListener('change',stop);
  window.AlchemyRefinePerformance={
    owns:kind=>kinds.has(kind)||kind==='fan',get phase(){return result?.kind||null;},get frames(){return frames;},
    drawPill(target,body,x,y,size){
      if(!result||quiet()||!visible()||['hold','explode'].includes(result.kind))return false;
      const t=clamp((performance.now()-result.start)/result.duration),fade=Math.sin(t*Math.PI),k=result.kind,major=['big','complete'].includes(k);
      sc.clearRect(0,0,256,256);sc.globalCompositeOperation='source-over';sc.drawImage(body,0,0,256,256);sc.globalCompositeOperation='source-atop';
      if(k==='damage'){sc.fillStyle=`rgba(37,29,23,${fade*.44})`;sc.fillRect(0,0,256,256);}
      else{
        if(painted){
          // A restrained, flat pigment sweep across opaque material, without a glossy halo.
          sc.fillStyle=`rgba(238,197,118,${fade*(major?.24:.14)})`;
          sc.beginPath();sc.moveTo(-60+t*360,0);sc.lineTo(-24+t*360,0);sc.lineTo(96+t*360,256);sc.lineTo(60+t*360,256);sc.closePath();sc.fill();
        }else{
        // A narrow glint crosses only the opaque pill material, with no circular halo.
        const sx=-100+t*450,g=sc.createLinearGradient(sx-55,0,sx+55,0);
        g.addColorStop(0,'transparent');g.addColorStop(.5,`rgba(255,234,181,${fade*(major?.64:.38)})`);g.addColorStop(1,'transparent');
        sc.fillStyle=g;sc.fillRect(0,0,256,256);
        }
      }
      sc.globalCompositeOperation='source-over';
      target.save();const lift=k==='damage'?0:-Math.sin(t*Math.PI)*size*(major?.30:.18)*(1-t);
      const shake=k==='damage'?Math.sin(t*24)*size*.045*(1-t):0;
      target.drawImage(surface,x+shake,y+lift,size,size);target.restore();return true;
    }
  };
  requestAnimationFrame(draw);
})();
