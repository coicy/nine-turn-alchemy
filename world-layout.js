/* === Consolidated source: equipment-ui.js === */
(() => {
 const api=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,panel=document.createElement('aside');panel.id='equipmentDrawer';panel.className='equipment-drawer';panel.hidden=true;panel.setAttribute('aria-label','炉旁法器说明');document.querySelector('.game-layout').append(panel);
 let selected=null,changing=false,notice='',timer;let anchor=null;
 const progress=(id,s)=>{const n=s.toolProgress.uses[id]||0;if(['seal','phoenix'].includes(id))return n?'本炉已用尽':'本炉剩余 1 次';if(id==='repair')return '本炉受损 '+s.toolProgress.scars+' 次';if(id==='chain')return '当前连续成功 '+s.toolProgress.chain+' 次';if(id==='guard_casket')return s.toolProgress.guardCasketUsed?'本炉已用尽（0 / 1）':'本炉剩余 1 次护丹';if(id==='steady_talisman')return s.toolProgress.yuanFloorUsed?'本炉已用尽（0 / 1）':'首次满 9 转归元保底待命';if(id==='fissure_cone')return '炉险≥30%药力+5% 已触发 '+(s.toolProgress.fissureTriggers||0)+' / 3 次';if(id==='hearth_pin'){const rem=Math.max(0,3-(s.toolProgress.refineCount||0));return rem?'前3次降险剩余 '+rem+' / 3 次':'本炉前3次已过';}if(id==='risk_ruler'){const tp=s.toolProgress||{},conv=tp.riskRulerConverted||0,cap=tp.riskRulerCap||.3,bonus=tp.riskRulerBonus||0,mult=(1+bonus).toFixed(2);return tp.riskRulerExpired?(bonus>0?'已达上限失效（30% / 30%）· 待归元 ×'+mult:'本炉已达上限失效（30% / 30%）'):'已转险 '+(conv*100).toFixed(1).replace(/\.0$/,'')+'% / '+Math.round(cap*100)+'% · 归元倍率 ×'+mult;}if(id==='ward')return '本炉炸炉率 -10%';if(id==='stone')return '基础成功率 57%→67%';if(id==='lucky')return '基础大成功 9.5%→17.4%';return '本炉持续生效';};
 function render(){const c=api.campaign();if(!c)return;const e=E.ensure(c),s=api.snapshot(),ids=E.equippedIds(e.equipped),atWork=!window.AlchemyViewState||window.AlchemyViewState.snapshot().location==='work',locked=!s.pillEnded||s.busy||!!window.AlchemyInteractionBusy||!!window.AlchemyScene2D?.busy||!atWork||window.AlchemyViewState?.snapshot().workMode==='furnace',tool=E.TOOL_DEFS.find(t=>t.id===selected);
  const readOnly=window.AlchemyViewState?.snapshot().workMode==='furnace'?'':!atWork?'到炼丹房才能布置。':!s.pillEnded?'炉内有丹，收丹后可调整。':c.phase!=='open'?'今日已收工。':'';
  const choices=E.TOOL_DEFS.filter(t=>e.tools.includes(t.id)).map(t=>{const result=api.canReplaceEquipment(selected,t.id);return '<button class="equipment-card" data-replace-equipment="'+t.id+'" '+(!result.ok?'disabled':'')+'><span data-tool-art="'+t.id+'"></span><strong>'+t.name+'</strong><small>'+UX.esc(t.description)+'</small>'+(!result.ok?'<small>'+result.reason+'</small>':'')+'</button>';}).join('');
  const selector=!tool&&ids.length?'<div class="equipment-targets"><p>点选案上法器以查看或更换</p>'+ids.map(id=>'<button data-inspect-placed="'+id+'">'+E.TOOL_DEFS.find(t=>t.id===id).name+'</button>').join('')+'</div>':'';
  UX.html(panel,'<header class="equipment-heading"><h2>'+(tool?.name||'炉旁法器')+'</h2><button data-close-equipment data-focus-key="close-equipment">合上 ×</button></header><p role="status">'+UX.esc(notice)+'</p>'+(tool?'<div class="world-tool-portrait" data-tool-art="'+tool.id+'"></div><p>'+UX.esc(tool.description)+'</p><p>'+(s.pillEnded?'尚未开炉':progress(tool.id,s))+'</p>':selector)+(readOnly?'<p>'+readOnly+'</p>':'')+(tool&&!locked?'<div class="equipment-actions"><button data-change-equipment data-focus-key="change-equipment">更换</button><button data-remove-equipment data-focus-key="remove-equipment">撤下</button></div>':'')+((changing||!tool)&&e.tools.length&&!locked?'<div class="equipment-library"><h3>'+(selected?'替换为':'布置藏品')+'</h3>'+choices+'</div>':'')+(!e.tools.length?'<p>法器商会带货来丹坊，可在柜台选购。</p>':'')+(!atWork?'<button data-go-arrange>回炉布置</button>':''));
  window.AlchemyWorldUI?.decorateTools(panel);window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 function inspect(id,element){selected=id;changing=false;notice='';anchor=element||document.querySelector('[data-world-tool="'+CSS.escape(id||'empty-0')+'"]');render();window.AlchemyViewState.navigate('equipment',{objectId:id,anchor});}
 panel.addEventListener('click',e=>{if(e.target.closest('[data-close-equipment]')){window.AlchemyViewState.close();return;}if(e.target.closest('[data-go-arrange]')){window.AlchemyViewState.navigate('work');inspect(null);return;}const pick=e.target.closest('[data-inspect-placed]');if(pick){inspect(pick.dataset.inspectPlaced,document.querySelector('[data-world-tool="'+pick.dataset.inspectPlaced+'"]'));return;}if(e.target.closest('[data-change-equipment]')){changing=true;render();panel.querySelector('[data-replace-equipment]:not(:disabled)')?.focus();return;}const remove=e.target.closest('[data-remove-equipment]'),replace=e.target.closest('[data-replace-equipment]');if(remove||replace){const next=remove?null:replace.dataset.replaceEquipment,old=selected,result=api.canReplaceEquipment(old,next);if(result.ok&&api.replaceEquipment(old,next)){selected=next;changing=false;notice=next?(old?'已更换':'已放置'):'已撤下';window.AlchemyGameFeel?.emit('equipment',{oldId:old,newId:next,tier:'medium'});clearTimeout(timer);timer=setTimeout(()=>{notice='';render();},1800);}else notice=result.reason||'状态已变化，请重新查看。';render();panel.querySelector('[data-focus-key="close-equipment"]')?.focus({preventScroll:true});}});
 window.AlchemyEquipmentView={inspect};window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view==='equipment')render();else {notice='';changing=false;clearTimeout(timer);}});window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
;
/* === Consolidated source: pill-bag.js === */
(() => {
 const api=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,panel=document.createElement('section');panel.className='pill-bag-panel';panel.setAttribute('aria-labelledby','pillBagTitle');panel.innerHTML='<header class="pill-bag-heading"><div><h2 id="pillBagTitle">收纳匣</h2><p id="pillBagCount"></p></div><button data-bag-return data-focus-key="close-bag">合上收纳匣</button></header><p id="pillBagStatus" role="status"></p><p id="pillBagLeaseOffer" class="pill-bag-lease-offer" hidden></p><div id="pillBagList" tabindex="-1"></div><section id="pillBagSelected" aria-label="选中丹药详情"></section>';document.querySelector('.game-layout').append(panel);
 let selected=null,vacancy=null;const nature={warm:'温性',cool:'寒性',neutral:'平性'},quality=['凡品','良品','上品','极品','绝品'];
 const lease=window.AlchemyLease;
 const offerNote=panel.querySelector('#pillBagLeaseOffer');
 function updateLeaseOffer(c) {
   const fromLease=window.AlchemyViewState?.snapshot().context?.objectId==='lease-purchase';
   panel.classList.toggle('lease-purchase-view',fromLease);
   if (fromLease || matchMedia("(max-width: 360px)").matches) {
     const nav=document.querySelector('.engine-nav');
     panel.style.setProperty('--lease-bag-top',Math.ceil(nav.getBoundingClientRect().bottom+8)+'px');
   }
   offerNote.hidden=!c || !fromLease || !lease.canOffer(c);
   if (!offerNote.hidden) {
     UX.html(offerNote,UX.art({turn:lease.procurement.featuredTurn,quality:1,nature:'warm',appearance:'lead-red'})+'药铺采购 · 第 '+lease.procurement.lastDay+' 天收工前交付一颗药力至少 '+lease.procurement.minimum+' 的丹，按售价加 '+lease.procurement.premium+' 文；九转及以上加 '+lease.procurement.featuredPremium+' 文。限购一颗。');
   }
 }
 function render(){const c=api.campaign();if(!c){panel.hidden=true;return;}const e=E.ensure(c),s=api.snapshot(),list=panel.querySelector('#pillBagList'),detail=panel.querySelector('#pillBagSelected');if(!Array.isArray(e.pills)){panel.querySelector('#pillBagCount').textContent='记录异常，原数据已保留';return;}panel.querySelector('#pillBagCount').textContent=e.pills.length?e.pills.length+' 件':'';
  updateLeaseOffer(c);
  if(!e.pills.some(p=>p.id===selected))selected=null;
  const cards=e.pills.map(p=>'<button class="pill-bag-card quality-'+p.quality+'" data-pill-id="'+p.id+'" aria-pressed="'+(selected===p.id)+'" aria-label="查看'+p.turn+'转'+(p.craftKind?window.AlchemyCrafts.name(p):quality[p.quality]+nature[p.nature]+'灵丹')+'，估值'+E.grossValue(p)+'">'+UX.art(p)+'<span>'+p.turn+'转 · '+(p.craftKind?window.AlchemyCrafts.name(p):quality[p.quality])+'</span>'+'</button>');
  if(vacancy)cards.splice(Math.min(vacancy.index,cards.length),0,'<div tabindex="-1" class="pill-bag-card empty-pill-place" data-focus-key="sold-place" aria-label="刚售出丹药的空丹位">空位</div>');
  const occupied=cards.length;while(cards.length<Math.max(6,Math.ceil(occupied/3)*3))cards.push('<div class="pill-bag-place" aria-hidden="true"></div>');UX.html(list,(occupied?'':'<p class="pill-bag-empty">收纳匣尚空</p>')+cards.join(''));
  const p=e.pills.find(p=>p.id===selected);detail.hidden=!p;if(!p){detail.replaceChildren();return;}
  const preview=UX.submissionSummary(api.previewSubmission(p.id));
  const purchase=lease.purchaseQuote(c,p.id);
  const blocked=s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held;
  const purchaseAction=purchase?'<button type="button" class="pill-bag-action pill-bag-lease-purchase" data-lease-purchase="'+UX.esc(p.id)+'" '+(blocked?'disabled':'')+'>药铺收购 · '+purchase.payout+' 铜钱</button>':'';
  UX.html(detail,UX.art(p)+'<h3>'+p.turn+'转 · '+(p.craftKind?window.AlchemyCrafts.name(p):quality[p.quality]+'灵丹')+'</h3><p>'+(p.craftKind?'自购器料 · 成本 '+p.craftCost+' 文 · 估值 ':nature[p.nature]+' · 药力 ')+E.grossValue(p)+' · 第 '+p.day+' 天收取</p>'
   +(p.materialAdvance?'<p>交易报价已抵客料款，最多24文。</p>':'')+(preview?'<p class="pill-bag-submit-preview">'+preview+'</p>':'')+'<div class="pill-bag-detail-actions" aria-label="丹药处理动作">'
   +(preview?'<button data-submit-pill="'+p.id+'" '+(s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held?'disabled':'')+'>交丹</button>':'')
   +'<button data-sell-pill="'+p.id+'" '+(s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy?'disabled':'')+'>出售 · '+E.saleValue(c,p)+' 铜钱</button>'+purchaseAction+'</div>');
 }
 panel.addEventListener('click',e=>{if(e.target.closest('[data-bag-return]')){window.AlchemyViewState.close();return;}const pick=e.target.closest('[data-pill-id]');if(pick){
  selected=pick.dataset.pillId;
  render();
  requestAnimationFrame(()=>UX.revealSubmission(panel,panel.querySelector('.pill-bag-submit-preview'),panel.querySelector('[data-submit-pill]')));
  return;
 }const submit=e.target.closest('[data-submit-pill]');if(submit&&!submit.disabled){const id=submit.dataset.submitPill;selected=null;if(!api.submit(id))selected=id;render();return;}const sell=e.target.closest('[data-sell-pill]'),purchase=e.target.closest('[data-lease-purchase]'),trade=sell||purchase;if(trade&&!trade.disabled){const id=trade.dataset.sellPill||trade.dataset.leasePurchase,pills=api.campaign().economy.pills,index=pills.findIndex(p=>p.id===id),ok=api.economyAction(sell?'sell':'leasePurchase',id);if(ok){selected=null;vacancy={index};render();panel.querySelector('[data-focus-key="sold-place"]')?.focus({preventScroll:true});}UX.notify(panel.querySelector('#pillBagStatus'),ok?api.campaign().economy.last:'交易未完成，请重新选择丹药。');}});
 window.addEventListener('resize', () => {
   if (panel.classList.contains('lease-purchase-view')) requestAnimationFrame(()=>updateLeaseOffer(api.campaign()));
 });
 window.addEventListener('alchemy:view-ready', event => {
   if (event.detail.view === 'bag') {
     updateLeaseOffer(api.campaign());
   } else if (!window.AlchemyViewState.snapshot().stack.includes('bag')) {
     selected = null;
     vacancy = null;
     panel.querySelector('#pillBagStatus').textContent = '';
     render();
   }
 });window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
;
/* === Consolidated source: consignment-bag.js === */
(() => {
  const game = window.AlchemyGame;
  const economy = window.AlchemyEconomy;
  const detail = document.getElementById('pillBagSelected');
  if (!game || !economy || !detail) return;

  const icons = {
    submit: 'submit-mark.svg',
    sell: 'sale-mark.svg',
    consign: 'consign-mark.svg'
  };

  function setActionContent(button, kind, label) {
    if (!button) return;
    button.classList.add('pill-bag-action', `pill-bag-action-${kind}`);
    button.replaceChildren();
    const icon = document.createElement('img');
    const src = `assets/ui/${icons[kind]}`;
    icon.src = window.AlchemyWarmProps?.resolve(src) || src;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'pill-bag-action-label';
    text.textContent = label;
    button.append(icon, text);
  }

  function render() {
    const selected = document.querySelector('.pill-bag-card[aria-pressed="true"]');
    const id = selected?.dataset.pillId;
    const pill = id ? game.campaign()?.economy?.pills?.find(p => p.id === id) : null;
    detail.querySelector('[data-consignment-pill]')?.remove();
    detail.querySelector('.pill-bag-consignment-note')?.remove();
    const actions = detail.querySelector('.pill-bag-detail-actions');
    setActionContent(detail.querySelector('[data-submit-pill]'), 'submit', '交丹');
    const sale = detail.querySelector('[data-sell-pill]');
    if (sale && pill) setActionContent(sale, 'sell', `${pill.materialAdvance ? '抵料后出售' : '立即出售'} · ${economy.saleValue(game.campaign(), pill)} 铜钱`);
    if (!pill || pill.craftKind || !game.previewConsignment) return;
    const result = game.previewConsignment(id);
    const note = document.createElement('p');
    note.className = 'pill-bag-consignment-note';
    note.textContent = result.ok
      ? `寄售${result.quote.waitDays}天后回款 ${result.quote.guaranteedPayout} 铜钱 · ${result.quote.tierName}`
      : result.reason || '当前丹药不可寄售。';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.consignmentPill = id;
    setActionContent(button, 'consign', '寄售');
    button.disabled = !result.ok || !!game.snapshot().busy || !!window.AlchemyInteractionBusy || !!window.AlchemyScene2D?.busy;
    detail.append(note);
    (actions || detail).append(button);
  }

  detail.addEventListener('click', event => {
    const button = event.target.closest('[data-consignment-pill]');
    if (!button || button.disabled) return;
    const id = button.dataset.consignmentPill;
    if (game.economyAction('consign', id)) {
      window.AlchemyUX?.notify(document.getElementById('pillBagStatus'), '已寄售，等待回款。');
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.pill-bag-card')) return;
    queueMicrotask(render);
  });
  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  render();
})();
;
/* === Consolidated source: world-layout.js === */
/* Geometry is shared by art, anchors and hit targets. Reserve only visible reading surfaces. */
(() => {
 const objects={herbs:{},tool:{src:'alchemy-fan-v1',flat:true},tray:{src:'delivery-tray-v1',flat:true},pill:{}},mouth={},firebox={},cutaway={},bookRest={},toolRest={},judgment={};let key='',lastViewport='';
 function fit(){const viewport=document.querySelector('.engine-viewport'),forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');if(!viewport)return;
  if(window.AlchemyViewState?.snapshot().workMode==='furnace'&&window.AlchemyFurnaceView)return window.AlchemyFurnaceView.fit();
  const mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,compact=!mobile&&w<1280,vkey=w+':'+h;
  if(window.AlchemyScene2D?.held&&lastViewport===vkey)return true;
  const visibleHeight=selector=>{const el=document.querySelector(selector);return el&&!el.hidden&&el.checkVisibility()?el.getBoundingClientRect().height:0;};
  const reading=window.AlchemyViewState?.snapshot(),top=mobile?Math.max(visibleHeight('.world-readout'),visibleHeight('.world-empty-readout')):0;
  let reserve=mobile?Math.max(visibleHeight('#refineOdds'),visibleHeight('.refine-odds-toggle'),visibleHeight('#roomSettlement')):0;
  if(mobile&&reading?.short)reserve=Math.max(reserve,visibleHeight(reading.current==='pill'?'.pill-detail-panel':'.equipment-drawer'));
  const width=mobile?w:1600,height=mobile?Math.max(330,Math.floor(h-top-reserve-20)):900;
  // The room is a fixed physical plane. Reading changes the camera window, never its aspect.
  const s=window.AlchemyGame.snapshot(),near=mobile&&s.started&&s.pillEnded&&!s.roundEnded&&!window.AlchemyOpening?.active;
  const cameraScale=1,roomWidth=mobile?width*cameraScale:width,roomHeight=mobile?roomWidth*1448/1086:900,cameraLeft=mobile?(width-roomWidth)/2:0;
  const project=o=>({x:o.x*cameraScale+cameraLeft,y:o.y*cameraScale,w:o.w*cameraScale,h:o.h*cameraScale});
  const baseHeight=width*1448/1086;
  const next=[mobile,width,height,w,h,top,reserve,cameraScale].join(':');lastViewport=vkey;
  document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',compact);viewport.style.setProperty('--work-top',top+'px');
  Object.assign(cutaway,mobile?{x:width-150,y:baseHeight*.15,w:140,h:114,source:{x:width*.4083,y:baseHeight*.3708,rx:16,ry:12}}:{x:760,y:230,w:210,h:170,source:{x:600,y:440,rx:28,ry:20}});
  Object.assign(objects.pill,{x:cutaway.x+(mobile?38:58),y:cutaway.y+(mobile?28:38),w:mobile?64:94,h:mobile?64:94});
  // The ledge remains in reach while its joint follows the painted table leg through the camera.
  Object.assign(bookRest,{x:width-152,y:roomHeight*.85,w:152,h:10,legX:width*.614*cameraScale+cameraLeft,legY:roomHeight*.89});
  Object.assign(toolRest,{x:width*.59,y:roomHeight*.535-48,w:width*.4,h:53,baseline:roomHeight*.535});
  Object.assign(mouth,mobile?project({x:width*.22,y:baseHeight*.15,w:width*.42,h:baseHeight*.23}):{x:470,y:285,w:310,h:150});
  Object.assign(firebox,mobile?project({x:width*.26,y:baseHeight*.59,w:width*.24,h:baseHeight*.20}):{x:455,y:600,w:210,h:145});
  Object.assign(objects.tray,mobile?{x:width*.907-Math.max(44,width*.12)/2,y:baseHeight*.567,w:Math.max(44,width*.12),h:44}:{x:1370,y:523,w:180,h:78});
  Object.assign(objects.tool,mobile?project({x:width*.52,y:baseHeight*.66,w:58,h:74}):{x:710,y:590,w:110,h:145});Object.assign(objects.herbs,mobile?{x:8,y:roomHeight*.47,w:64,h:65}:{x:80,y:470,w:115,h:100});
  stage.style.setProperty('--scene-scale',mobile?'1':String(Math.min(1,w/width,h/height)));
  for(const el of [stage,forge]){el.style.setProperty('--world-width',width+'px');el.style.setProperty('--world-height',height+'px');el.style.setProperty('--room-base-height',roomHeight+'px');el.style.setProperty('--room-base-width',roomWidth+'px');el.style.setProperty('--room-camera-left',cameraLeft+'px');}
  stage.dataset.camera=near?'near':'work';
  stage.dataset.cameraCropped=String(mobile&&height<bookRest.legY+6);
  for(const [name,value] of Object.entries({x:bookRest.x,y:bookRest.y,postX:bookRest.legX-bookRest.x,postHeight:bookRest.legY-bookRest.y+19,braceLength:Math.hypot(bookRest.legX-bookRest.x+2,bookRest.legY-bookRest.y-9)}))stage.style.setProperty('--book-rest-'+name,value+'px');
  stage.style.setProperty('--book-rest-angle',Math.atan2(bookRest.legY-bookRest.y-9,bookRest.legX-bookRest.x+2)*180/Math.PI+'deg');
  for(const name of ['x','y','w'])stage.style.setProperty('--tool-rest-'+name,toolRest[name]+'px');
  if(mobile){forge.style.transform='none';forge.style.left='0';forge.style.top=top+'px';}else{forge.style.left='50%';forge.style.top='50%';forge.style.transform=`translate(-50%,-50%) scale(${Math.min(1,w/width,h/height)})`;}
  const canvas=document.getElementById('alchemyScene');if(canvas){if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;}
  const observation=document.querySelector('.room-observation');if(observation){observation.style.left=cutaway.x+'px';observation.style.top=cutaway.y+'px';observation.style.setProperty('--inspect-x',8-cutaway.x+'px');observation.style.setProperty('--inspect-y',8-cutaway.y+'px');}
  document.body.style.setProperty('--work-reserve',reserve+'px');if(key!==next){key=next;window.dispatchEvent(new Event('alchemy:world-layout'));}return true;
 }
 window.AlchemyWorldLayout={objects,mouth,firebox,cutaway,bookRest,toolRest,judgment,fit,get mobile(){return innerWidth<=650;}};
})();
