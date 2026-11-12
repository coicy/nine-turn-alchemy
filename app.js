(() => {
  "use strict";

  // ForgeTax reference: grade = turn - 1; after grade 30 retain terminal risk.
  const BREAK_CURVE=[0,.018,.059,.129,.248,.297,.347,.383,.418,.443,.467,.491,.505,.519,.532,.545,.558,.576,.594,.612,.63,.639,.648,.657,.666,.675,.684,.693,.702,.711,.72];
  function qualityAtTurn(turn){return turn>=60?4:turn>=30?3:turn>=15?2:turn>=5?1:0;}
  const MAX_RUNES = 6;
  const RUNE_CHANCE={success:.25,big:.5};
  const QUALITY_NAMES = ["凡品", "良品", "上品", "极品", "绝品"];
  let ORDER_TARGET = 300;
  let MAX_PILLS = 3;
  const campaignRules = window.AlchemyCampaign;
  let campaign = null;
  const SAVE_KEY = "alchemy-days-v1";
  let saved = null;
  try {
    const raw = (window.AlchemySaves ? window.AlchemySaves.read() : JSON.parse(window.localStorage?.getItem(SAVE_KEY) || "null"));
    if (campaignRules && raw?.version === 1 && Number.isInteger(raw.campaign?.day) && raw.campaign.day >= 1 && raw.campaign.day <= 30
      && ['open','settled','finished'].includes(raw.campaign.phase)
      && Array.isArray(raw.campaign.orders) && [3,7,8].includes(raw.campaign.orders.length) && Array.isArray(raw.campaign.history)
      && raw.campaign.orders.every(o => o && typeof o.id === 'string' && Number.isFinite(o.target) && ['pending','active','completed','failed','skipped'].includes(o.status))
      && Number.isFinite(raw.target) && raw.target > 0 && [1,3].includes(raw.materials)
      && raw.state?.pill && Number.isFinite(raw.state.delivered) && Number.isInteger(raw.state.attempt)
      && Array.isArray(raw.state.collected) && Array.isArray(raw.state.logs) && Array.isArray(raw.state.discoveredRunes)
      && Array.isArray(raw.state.pill.runes) && Number.isFinite(raw.state.pill.value)
      && Number.isFinite(raw.state.riskResult?.explode)
      && raw.state.attempt >= 0 && raw.state.attempt <= 3 && raw.state.started) saved = raw;
  } catch (_) { /* Storage is optional; a fresh campaign remains playable. */ }
  const RUNE_COLORS = {
    "赤纹": "#ef8c84",
    "青纹": "#78d7cb",
    "月纹": "#bda8ff",
    "雷纹": "#f4d979",
    "金纹": "#ffd77b",
    "星痕": "#e7c8ff",
  };
  const FUSIONS = {
    "赤纹|青纹": { name: "金纹", multiplier: 2.05, message: "赤青相济，凝成金纹！" },
    "月纹|雷纹": { name: "星痕", multiplier: 2.25, message: "月雷交汇，留下星痕！" },
  };
  const BASIC_RUNES = ['赤纹','青纹','月纹','雷纹'];
  const RUNE_DEFS = {
    '赤纹':'自然维持后获得下一次护丹；炸炉转维持。护丹触发的维持不会再次蓄盾。',
    '青纹':'受损时药力仅下降10%；转数仍回落一转。',
    '月纹':'自然维持后蓄月力，下一次成功额外升一转；最多蓄一层。',
    '雷纹':'大成功额外升一转；持有期间自动生效。',
    '金纹':'赤纹与青纹融合，占一道位置，继承护丹和受损减值保护。',
    '星痕':'月纹与雷纹融合，占一道位置，继承蓄月力和大成功额外升转。'
  };
  function hasTool(id){return !!window.AlchemyEconomy?.hasTool(campaign?.economy?.equipped,id);}
  function uses(id){return state.pill.toolUses?.[id]||0;}
  function useTool(id){state.pill.toolUses ||= {};state.pill.toolUses[id]=uses(id)+1;state.pill.toolUsed=true;}
  function hasRune(...names){return names.some(n=>state.pill.runes.includes(n));}
  // Pricing owns numeric rune growth; visual branches never count as levels.
  function runeLevelsFor(pill) {
    const levels = {};
    for (const rune of pill.runes || []) {
      const n = pill.runeLevels?.[rune];
      levels[rune] = Number.isSafeInteger(n) && n > 0 ? n : (rune === '金纹' || rune === '星痕' ? 2 : 1);
    }
    return levels;
  }
  function runeValueMultiplier(pill) {
    const levels = runeLevelsFor(pill);
    return 1 + Object.values(levels).reduce((sum, n) => sum + n, 0) * .12
      + (levels['金纹'] ? .25 : 0) + (levels['星痕'] ? .35 : 0);
  }
  function valueForBase(base, pill) { return Math.round(base * runeValueMultiplier(pill)); }
  function ensurePricing() {
    const p = state.pill;
    p.runeLevels = runeLevelsFor(p);
    // Old saves keep their saved value; no retroactive rewards or repricing of stock.
    if (!Number.isFinite(p.baseValue) || p.baseValue < 0) p.baseValue = p.value / runeValueMultiplier(p);
  }
  function repricePill() { ensurePricing(); state.pill.value = valueForBase(state.pill.baseValue, state.pill); }
  function explosionProtection(){
    if(state.pill.shield)return {source:'shield',outcome:'hold',name:'丹纹护丹'};
    if(hasTool('burn')&&uses('burn')<2&&state.pill.runes.some(r=>BASIC_RUNES.includes(r)))return {source:'burn',outcome:'hold',name:'燃纹盏（消耗一道基础纹）'};
    if(hasTool('seal')&&!uses('seal'))return {source:'seal',outcome:'damage',name:'镇炉印'};
    if(hasTool('phoenix')&&!uses('phoenix'))return {source:'phoenix',outcome:'hold',name:'返生鼎符（药力持续折损40%）'};
    return null;
  }
  function refinementProbabilities(){
    const w=window.AlchemyEconomy?.outcomeWeights(campaign?.economy?.equipped)||{big:2,success:12,hold:5,damage:2},total=w.big+w.success+w.hold+w.damage,p=state.riskResult.explode;
    const outcomes={big:(1-p)*w.big/total,success:(1-p)*w.success/total,hold:(1-p)*w.hold/total,damage:(1-p)*w.damage/total,explode:p},protection=explosionProtection();
    if(protection){outcomes[protection.outcome]+=p;outcomes.explode=0;}
    return {outcomes,protection,baseExplosion:p,available:state.started&&!state.pillEnded&&!state.roundEnded&&state.pill.turn<100};
  }
  function turnBonus(outcome){return (state.pill.toolTurnBonus||0)+(['success','big'].includes(outcome)?(state.pill.moonCharge||0):0)+(outcome==='big'&&hasRune('雷纹','星痕')?1:0);}
  function triggerLog(message,tone='good'){state.pill.triggers ||= [];state.pill.triggers.push(message);addLog(message,tone);}
  function consumeBasicRune(){
    ensurePricing();
    const p=state.pill,index=p.runes.findLastIndex(r=>BASIC_RUNES.includes(r));
    if(index<0)return false;
    const [rune]=p.runes.splice(index,1),level=p.runeLevels[rune];delete p.runeLevels[rune];useTool('burn');repricePill();
    // Removing a passive also removes its stored charge/shield unless its fusion remains.
    if(!hasRune('月纹','星痕'))p.moonCharge=0;
    if(!hasRune('赤纹','金纹'))p.shield=false;
    triggerLog(`燃纹盏消耗${rune}，挡下炸炉（${uses('burn')}/2）。`,'good');
    if(hasTool('return')&&!uses('return')&&!p.returnRune){p.returnRune=rune;p.returnRuneLevel=level;triggerLog('回纹环：下一次成功补回'+rune+'。','good');}
    if(hasTool('ash')&&uses('ash')<2){const old=1+.15*uses('ash');useTool('ash');p.baseValue*=(1+.15*uses('ash'))/old;repricePill();triggerLog('烬金印：本炉药力加成 '+uses('ash')*15+'%。','good');}
    return true;
  }
  const TURN_NAMES = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  const dom = {
    attemptText: document.getElementById("attemptText"),
    restartButton: document.getElementById("restartButton"),
    attemptBadge: document.getElementById("attemptBadge"),
    turnGoalText: document.getElementById("turnGoalText"),
    turnProgressFill: document.getElementById("turnProgressFill"),
    bestTurnText: document.getElementById("bestTurnText"),
    bestValueText: document.getElementById("bestValueText"),
    explosionText: document.getElementById("explosionText"),
    completedText: document.getElementById("completedText"),
    trialHint: document.getElementById("trialHint"),
    pillName: document.getElementById("pillName"),
    riskBadge: document.getElementById("riskBadge"),
    pillStage: document.getElementById("pillStage"),
    pillAura: document.getElementById("pillAura"),
    pillVisual: document.getElementById("pillVisual"),
    eventBanner: document.getElementById("eventBanner"),
    turnValue: document.getElementById("turnValue"),
    pillValue: document.getElementById("pillValue"),
    qualityValue: document.getElementById("qualityValue"),
    runeSummary: document.getElementById("runeSummary"),
    riskResultValue: document.getElementById("riskResultValue"),
    riskDescription: document.getElementById("riskDescription"),
    outcomeList: document.getElementById("outcomeList"),
    refineButton: document.getElementById("refineButton"),
    collectButton: document.getElementById("collectButton"),
    newPillButton: document.getElementById("newPillButton"),
    actionHint: document.getElementById("actionHint"),
    runeList: document.getElementById("runeList"),
    logList: document.getElementById("logList"),
    introModal: document.getElementById("introModal"),
    startButton: document.getElementById("startButton"),
    compactOrderValue: document.getElementById("compactOrderValue"),
    compactStockValue: document.getElementById("compactStockValue"),
    eventTitle: document.getElementById("eventTitle"),
    valueChange: document.getElementById("valueChange"),
    runeOrbit: document.getElementById("runeOrbit"),
    ritualPanel: document.getElementById("ritualPanel"), ritualGrid: document.getElementById("ritualGrid"), ritualStatus: document.getElementById("ritualStatus"),
  };

  let state = null;
  let feedbackTimer = null;
  const telemetry = window.AlchemyTelemetry;
  let decisionSince = Date.now();

  function playtestSnapshot() {
    return { attempt: state.attempt, turn: state.pill.turn, quality: state.pill.quality,
      value: state.pill.value, runes: [...state.pill.runes], runeLevels:runeLevelsFor(state.pill), baseValue:state.pill.baseValue ?? state.pill.value/runeValueMultiplier(state.pill), maxRunes: MAX_RUNES, shield: state.pill.shield,
      risk: refinementProbabilities().outcomes.explode, delivered: state.delivered,
      day: campaign?.day || 1, orderId: state.orderId || null };
  }

  function randomRisk(turn=state?.pill?.turn||1) {const base=BREAK_CURVE[Math.max(0,Math.min(30,Math.floor(turn)-1))];return {explode:base*(window.AlchemyEconomy?.toolRisk(campaign?.economy?.equipped,state?.pill)||1)};}

  function freshPill() {
    return { turn: 1, quality: 0, value: 24, runes: [], runeLevels:{}, bestTurn: 1, yuanHigh: 24, yuanPool: 0, yuanBonus: 0, yuanNode: 0, ritualSafe: 0, ritualActive: false, ritualStep: 0, shield: false, toolUsed:false, damageSoftened:false, runeChoices:[] };
  }

  function createState() {
    return {
      started: false,
      busy: false,
      pillEnded: false,
      pillEndReason: "",
      roundEnded: false,
      delivered: 0,
      attempt: 0,
      explosions: 0,
      completedPills: 0, ritualStep: 0, ritualActive: false, ritualSafe: 0,
      bestTurn: 1,
      bestValue: 24,
      riskResult: randomRisk(1),
      discoveredRunes: [],
      logs: [],
      collected: [],
      pill: freshPill(),
    };
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("zh-CN");
  }

  function percentage(value) {
    return `${Math.round(value * 100)}%`;
  }

  function addLog(message, tone = "") {
    state.logs.unshift({ message, tone, day:campaign?.day||1, orderId:state.orderId||null, source:campaignRules?.active(campaign)?.self?"self":"commission", attempt:state.attempt });
    state.logs = state.logs.slice(0, 8);
  }

  function render() { window.AlchemyCustomers?.bind(campaign);
    const turnProgress = Math.min(100, (state.delivered / ORDER_TARGET) * 100);
    const explosionChance = refinementProbabilities().outcomes.explode;
    dom.attemptText.textContent = `${state.attempt} / ${MAX_PILLS}`;
    dom.compactOrderValue.textContent = `${formatNumber(state.delivered)} / ${ORDER_TARGET}`;
    dom.compactStockValue.textContent = `${MAX_PILLS - state.attempt} 包`;
    document.getElementById("orderGoalLabel").textContent = `/ ${ORDER_TARGET}`;
    if (campaign) {
      const order = campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId));
      if (order) {
        document.getElementById("trialTitle").textContent = order.name;
        document.getElementById("trialFlavor").textContent = order.self ? (state.roundEnded ? (state.pillEndReason==='explode'?'本炉炸丹，没有成丹入库。':'成丹已收入背包。') : '自有药材 · 收丹存入背包') : `${order.client}托付 ${order.materials} 包药材 · 目标药力 ${order.target} · 未成免赔`;
        document.querySelector('.order-panel .panel-kicker').textContent=order.self?'本炉自炼':'代炼委托';
        document.querySelector('.target-card').hidden=!!order.self;
        document.getElementById('trialRule').hidden=true;
      }
    }
    dom.attemptBadge.textContent = `第 ${state.attempt || 1} 炉`;
    dom.turnGoalText.textContent = formatNumber(state.delivered);
    dom.turnProgressFill.style.width = `${turnProgress}%`;
    dom.bestTurnText.textContent = `${state.bestTurn} 转`;
    dom.bestValueText.textContent = formatNumber(state.bestValue);
    dom.explosionText.textContent = `${state.explosions} 次`;
    dom.completedText.textContent = `${state.completedPills} 颗`;
    dom.trialHint.textContent = state.roundEnded
      ? (campaign ? (campaign.selfOrder?.id===state.orderId ? "本炉已结束。" : "本单已结清；可接下一单或回柜台收工。") : state.delivered >= ORDER_TARGET ? "订单完成！点击重新开始再挑战。" : "原料已用尽，订单未完成。点击重新开始再挑战。")
      : state.pillEnded ? "取一包委托药材，投入炉口开炉。" : state.pill.turn >= 100 ? "百转已成，收丹入库即可锁定价值。" : state.pill.shield
        ? "护丹已准备：下一次炸丹将转为保持。" : `下一次炸丹概率 ${percentage(explosionChance)}，可继续炼化或收丹入库。`;
    const activeOrder = campaign && (campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId)));
    if(activeOrder?.self)dom.trialHint.textContent=state.roundEnded?'':state.pillEnded?'取用本炉备料投入炉口。':state.pill.turn>=100?'百转已成，请收丹入库。':`下一次炸丹概率 ${percentage(explosionChance)}，可继续炼化或收丹入库。`;
    dom.pillName.textContent = `${({warm:'温性',cool:'寒性',neutral:'平性'}[state.pill.nature || activeOrder?.nature || 'neutral'])}灵丹`;
    dom.turnValue.textContent = (TURN_NAMES[state.pill.turn] || String(state.pill.turn));
    dom.pillValue.textContent = state.pillEnded && state.pillEndReason === "explode" ? "已损失" : formatNumber(state.pill.value);
    dom.qualityValue.textContent = QUALITY_NAMES[state.pill.quality];
    dom.runeSummary.textContent = `${state.pill.runes.length}/${MAX_RUNES} 道${state.pill.runes.length >= MAX_RUNES ? " · 已满" : ""} · ${state.pill.runes.length ? state.pill.runes.join(" / ") : "尚未显现"}${state.pill.moonCharge ? " · 月力待发" : ""}`;
    dom.riskResultValue.textContent = state.pillEnded || state.pill.turn >= 100 ? "--" : percentage(explosionChance);
    dom.pillVisual.classList.toggle("turn-nine", state.pill.turn >= 100);
    dom.pillVisual.dataset.quality = String(state.pill.quality);
    dom.pillStage.dataset.state = state.pillEnded ? state.pillEndReason : state.pill.turn >= 100 ? "complete" : "active";
    const orbitPositions = [[-88, 0], [88, 0], [-75, 55], [75, 55], [-75, -55], [75, -55]];
    dom.runeOrbit.innerHTML = state.pill.runes.map((rune, index) => {
      const [x, y] = orbitPositions[index % orbitPositions.length];
      return `<span class="orbit-rune" style="--x:${x}px;--y:${y}px;--rune-color:${RUNE_COLORS[rune]}">${rune}</span>`;
    }).join("");
    dom.pillAura.style.transform = `scale(${1 + state.pill.quality * 0.06 + state.pill.turn * 0.02})`;
    dom.pillAura.style.background = state.pill.runes.length
      ? `radial-gradient(circle, ${RUNE_COLORS[state.pill.runes[state.pill.runes.length - 1]] || "#eac8ff"}55, transparent 68%)`
      : "radial-gradient(circle, rgba(183, 204, 135, 0.22), transparent 68%)";
    dom.riskBadge.textContent = state.pillEnded ? (state.pillEndReason === "explode" ? "丹散炉息" : "已收丹") : state.pill.shield ? "护丹生效" : `${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转`;
    dom.riskBadge.className = "risk-badge";
    dom.riskDescription.textContent = state.pillEnded ? "本炉已结束" : state.pill.turn >= 100 ? "百转已成，可收丹入库" : state.pill.shield ? "护丹会挡下下一次炼化中的炸丹" : "收丹可锁定当前价值";
    const triggerStatus=document.getElementById('runeTriggerStatus');
    if(triggerStatus){triggerStatus.textContent=(state.pill.triggers||[]).slice(-3).join(' → ');triggerStatus.title=(state.pill.triggers||[]).join(' → ');}
    renderOutcomes(explosionChance);
    renderRunes();
    renderLogs();

    const canRefine = !state.pill.runeChoices?.length && state.started && !state.busy && !state.pillEnded && !state.roundEnded && state.pill.turn < 100;
    dom.refineButton.disabled = !canRefine;
    dom.collectButton.disabled = !!state.pill.runeChoices?.length || !state.started || state.busy || state.pillEnded || state.roundEnded;
    dom.newPillButton.disabled = !state.started || state.busy || !state.pillEnded || state.roundEnded;
    dom.restartButton.disabled = state.busy;
    dom.actionHint.textContent = state.pillEnded
      ? (state.roundEnded ? "本局结束，点击“重新开始”再试一次。" : "本炉已结束，点击“再开一炉”。")
      : state.pill.turn >= 100 ? "百转成丹，点击“收丹入库”。" : "炸丹概率随转数上升；收丹可锁定当前价值。";
    if (state.pillEndReason === "waiting") {
      dom.pillName.textContent = "空炉待药";
      dom.pillValue.textContent = "—";
      dom.qualityValue.textContent = "未起炉";
      dom.riskBadge.textContent = "待投药";
      dom.riskDescription.textContent = "整包投药后开始本炉";
    }
    if (campaign && state.started && !state.busy) {
      window.AlchemyEconomy?.ensure(campaign);
      try { window.AlchemySaves ? window.AlchemySaves.write({version:1,campaign,state,target:ORDER_TARGET,materials:MAX_PILLS}) : window.localStorage?.setItem(SAVE_KEY, JSON.stringify({version:1,campaign,state,target:ORDER_TARGET,materials:MAX_PILLS})); } catch (_) {}
    }
    window.dispatchEvent?.(new Event("alchemy:render"));
  }

  function renderOutcomes(chance) {
    dom.outcomeList.innerHTML = `<div class="risk-meter" aria-hidden="true"><div style="width:${state.pillEnded || state.pill.turn >= 100 ? 0 : Math.round(chance * 100)}%"></div></div>`;
  }

  function renderRunes() {
    if (!state.discoveredRunes.length) {
      dom.runeList.innerHTML = '<div class="rune-entry empty">本次尚未显纹。</div>';
      return;
    }
    dom.runeList.innerHTML = state.discoveredRunes.map((rune) => `
      <div class="rune-entry">
        <i class="rune-dot" style="color:${RUNE_COLORS[rune] || "#e7c8ff"}; background:${RUNE_COLORS[rune] || "#e7c8ff"}"></i>
        <strong>${rune}</strong>
        <span>${RUNE_DEFS[rune] || "已发现"}</span>
      </div>
    `).join("");
  }

  function renderLogs() {
    const groups=[];
    for(const entry of state.logs){const key=entry.day===undefined?'legacy':[entry.day,entry.orderId,entry.attempt].join(':');let group=groups[groups.length-1];if(!group||group.key!==key){group={key,entry,messages:[]};groups.push(group);}group.messages.push(entry);}
    dom.logList.innerHTML=groups.length?groups.map(({entry,messages})=>'<div class="log-entry"><small>'+(entry.day===undefined?'旧炉讯 · 炉次未记录':`第${entry.day}天 · ${entry.source==='self'?'自炼':'委托'} · ${entry.attempt?'第'+entry.attempt+'炉':'备料'}`)+'</small>'+messages.map(e=>'<p class="'+e.tone+'">'+e.message+'</p>').join('')+'</div>').join(''):'<p>暂无本次炉讯</p>';
  }

  function setFeedback(message, tone = "", event = "start", value = null) {
    const titles = { start: "炉火初起", big: "大成功", success: "炼化成功", hold: "火候维持", damage: "丹体受损", explode: "丹散炉息", complete: "百转成丹", collect: "收丹入匣", win: "委托已成", loss: "本局结束", shield: "护丹显灵", fusion: "丹纹融合" };
    dom.eventTitle.textContent = titles[event] || "炉火流转";
    dom.valueChange.textContent = typeof value === "number" ? (value === 0 ? "价值持平" : `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`) : value || "";
    dom.eventBanner.textContent = message;
    dom.eventBanner.classList.remove("flash");
    void dom.eventBanner.offsetWidth;
    dom.eventBanner.classList.add("flash");
    dom.pillStage.dataset.tone = tone;
    dom.pillStage.dataset.outcome = event;
    if (typeof CustomEvent !== 'undefined') window.dispatchEvent?.(new CustomEvent('alchemy:feedback', {detail:{event,message,value,turn:state.pill.turn,quality:state.pill.quality,runes:[...state.pill.runes]}}));
    dom.pillStage.classList.remove("is-feedback");
    void dom.pillStage.offsetWidth;
    dom.pillStage.classList.add("is-feedback");
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      dom.pillStage.dataset.tone = "";
      dom.pillStage.classList.remove("is-feedback");
    }, 900);
  }

  function updateRecord() {
    state.bestTurn = Math.max(state.bestTurn, state.pill.bestTurn);
    state.bestValue = Math.max(state.bestValue, state.pill.value);
    state.pill.runes.forEach((rune) => {
      if (!state.discoveredRunes.includes(rune)) state.discoveredRunes.push(rune);
    });
  }

  function alchemyBaseValue(turn, quality, factor=1, ashUses=0) {
    const t=turn-1;
    return (24+8*t+2*t*t+.08*t*t*t)*(1+quality*.08)*factor*(1+.15*ashUses);
  }
  // Read-only ordinary-success projection. Random new runes are extra, never promised.
  function successValuePreview() {
    if(!refinementProbabilities().available || state.busy || state.pill.runeChoices?.length)return null;
    const p=state.pill, next={...p,runes:[...p.runes],runeLevels:runeLevelsFor(p)};
    const chain=hasTool('chain')&&((p.successChain||0)+1)%2===0?1:(p.toolTurnBonus||0);
    next.turn=Math.min(100,p.turn+1+chain+(p.moonCharge||0));
    next.quality=Math.max(p.qualityFloor||0,qualityAtTurn(next.turn));
    if(hasTool('return')&&p.returnRune&&next.runes.length<MAX_RUNES&&!next.runes.includes(p.returnRune)){
      next.runes.push(p.returnRune);next.runeLevels[p.returnRune]=p.returnRuneLevel||1;
      for(const [key,fusion] of Object.entries(FUSIONS)){
        const needed=key.split('|');
        if(needed.every(r=>next.runes.includes(r))&&!next.runes.includes(fusion.name)){
          const level=needed.reduce((n,r)=>n+next.runeLevels[r],0);
          next.runes=next.runes.filter(r=>!needed.includes(r));needed.forEach(r=>delete next.runeLevels[r]);
          next.runes.push(fusion.name);next.runeLevels[fusion.name]=level;break;
        }
      }
    }
    next.value=valueForBase(alchemyBaseValue(next.turn,next.quality,p.valueFactor??1,uses('ash')),next);
    const E=window.AlchemyEconomy,currentSale=E.saleValue(campaign,p),sale=E.saleValue(campaign,next);
    return {turn:next.turn,value:next.value,increase:next.value-p.value,currentSale,sale,saleIncrease:sale-currentSale};
  }

  function applyAlchemy(outcome) {
    const isBigSuccess = outcome === "big";
    const turnGain = (isBigSuccess ? 2 : 1)+turnBonus(outcome);state.pill.toolTurnBonus=0;state.pill.moonCharge=0;
    state.pill.turn = Math.min(100, state.pill.turn + turnGain);
    state.pill.baseValue=alchemyBaseValue(state.pill.turn,state.pill.quality,state.pill.valueFactor??1,uses('ash'));
    repricePill();
    state.pill.bestTurn = Math.max(state.pill.bestTurn, state.pill.turn);
  }

  function applyDamage() {
    ensurePricing();
    state.pill.turn = Math.max(1, state.pill.turn - 1);
    const protectedValue = state.pill.runes.includes("青纹") || state.pill.runes.includes("金纹");
    state.pill.baseValue = Math.max(8/runeValueMultiplier(state.pill), state.pill.baseValue * (campaign?.economy?.furnace>=1&&(campaign.economy.furnace>=2||!state.pill.damageSoftened)?(state.pill.damageSoftened=true,protectedValue ? .95 : .85):(protectedValue ? 0.9 : 0.7)));
    repricePill();
  }

  function grantRune(rune,label,level=1){
    if(state.pill.runes.length>=MAX_RUNES||state.pill.runes.includes(rune))return null;
    ensurePricing();state.pill.runes.push(rune);state.pill.runeLevels[rune]=level;repricePill();
    if(label)triggerLog(label+'：显现'+rune+'。','good');
    return tryFusion()||rune;
  }
  function tryAddRune(outcome='success') {
    if (state.pill.runes.length >= MAX_RUNES) return null;
    const available=BASIC_RUNES.filter(r=>!state.pill.runes.includes(r));
    if(!available.length)return null;
    const guaranteed=(hasTool('needle')&&!uses('needle'))||(state.pill.fusionPending&&(state.pill.refineSerial||0)>(state.pill.fusionReadyAfter||0));
    if(hasTool('needle')&&!uses('needle'))useTool('needle');
    if((state.pill.refineSerial||0)>(state.pill.fusionReadyAfter||0))state.pill.fusionPending=false;
    if(state.pill.tier===2 && !state.pill.spiritUsed){state.pill.spiritUsed=true;return grantRune(window.AlchemyEconomy.pickRune(available,campaign?.economy?.equipped),'灵性药包');}
    if(!guaranteed&&Math.random()>=(RUNE_CHANCE[outcome]||RUNE_CHANCE.success))return null;
    const rune=window.AlchemyEconomy?.pickRune(available,campaign?.economy?.equipped)||available[Math.floor(Math.random()*available.length)];
    return grantRune(rune,guaranteed?'法器生纹':null);
  }

  function tryFusion() {
    if (state.pill.runes.length < 2) return null;
    for (const [key, fusion] of Object.entries(FUSIONS)) {
      const needed = key.split("|");
      if (needed.every((rune) => state.pill.runes.includes(rune)) && !state.pill.runes.includes(fusion.name)) {
        ensurePricing();
        const inherited=needed.reduce((sum,rune)=>sum+state.pill.runeLevels[rune],0);
        state.pill.runes = state.pill.runes.filter((rune) => !needed.includes(rune));
        needed.forEach(rune=>delete state.pill.runeLevels[rune]);
        state.pill.runes.push(fusion.name);
        state.pill.runeLevels[fusion.name]=inherited;repricePill();
        triggerLog(fusion.message,'good');
        if(hasTool('fusion')&&uses('fusion')<2&&!state.pill.fusionPending){useTool('fusion');state.pill.fusionPending=true;state.pill.fusionReadyAfter=state.pill.refineSerial||0;triggerLog('合璧镜：下一次成功必显基础纹。','good');}
        return fusion.message;
      }
    }
    return null;
  }

  function resolveRefine() {
    state.pill.triggers=[];
    state.pill.refineSerial=(state.pill.refineSerial||0)+1;
    const before = playtestSnapshot();
    const profile = state.riskResult;
    const safeRun = state.pill.ritualSafe > 0;
    const explode = safeRun ? false : Math.random() < profile.explode;
    const roll = Math.random();
    const tool=campaign?.economy?.equipped;
    const w=window.AlchemyEconomy?.outcomeWeights(tool)||{big:2,success:12,hold:5,damage:2};const total=w.big+w.success+w.hold+w.damage;
    let outcome=safeRun ? (roll < w.big/(w.big+w.success) ? 'big' : 'success') : (explode?'explode':roll<w.big/total?'big':roll<(w.big+w.success)/total?'success':roll<(w.big+w.success+w.hold)/total?'hold':'damage');
    if (safeRun) state.pill.ritualSafe--;
    const protection=explosionProtection();
    const usedShield=explode&&protection?.source==='shield';
    state.pill.shield=false;
    const naturalHold=outcome==='hold'&&!explode;
    const protectedByTool=explode&&!!protection&&!usedShield;
    if(explode&&protection){
      outcome=protection.outcome;
      if(protection.source==='burn')consumeBasicRune();
      if(protection.source==='seal'){useTool('seal');triggerLog('镇炉印挡下炸炉，改为丹体受损。','good');}
      if(protection.source==='phoenix'){ensurePricing();useTool('phoenix');state.pill.valueFactor=(state.pill.valueFactor??1)*.6;state.pill.baseValue*=.6;repricePill();triggerLog('返生鼎符挡下炸炉：本炉药力持续折损40%。','good');}
    }
    if(hasTool('chain')){state.pill.successChain=['big','success'].includes(outcome)?(state.pill.successChain||0)+1:0;if(state.pill.successChain>0&&state.pill.successChain%2===0){state.pill.toolTurnBonus=1;triggerLog('双仪环：连续两次成丹，额外提升一转。','good');}}
    if(hasTool('repair')&&outcome==='damage'&&!protectedByTool){state.pill.scars=Math.min(4,(state.pill.scars||0)+1);triggerLog('淬火盏：本炉炸炉率相对降低'+(state.pill.scars*15)+'%。','good');}
    if(outcome!=='explode'){const nextTurn=['big','success'].includes(outcome)?Math.min(100,state.pill.turn+(outcome==='big'?2:1)+turnBonus(outcome)):outcome==='damage'?Math.max(1,state.pill.turn-1):state.pill.turn;state.pill.quality=Math.max(state.pill.qualityFloor||0,qualityAtTurn(nextTurn));}

    let feedback = "";
    let feedbackTone = "";
    let fused = false;
    if (outcome === "big" || outcome === "success") {
      const isBigSuccess = outcome === "big";
      if(state.pill.moonCharge)triggerLog('月力释放：本次额外升一转。');
      if(outcome==='big'&&hasRune('雷纹','星痕'))triggerLog('雷纹激发：大成功额外升一转。');
      applyAlchemy(outcome);
      // Restore before the normal rune roll. Only the next refinement can consume a new fusion charge.
      let restored=null;
      if(hasTool('return')&&state.pill.returnRune&&state.pill.runes.length<MAX_RUNES){
        const rune=state.pill.returnRune,level=state.pill.returnRuneLevel||1;state.pill.returnRune=null;delete state.pill.returnRuneLevel;useTool('return');
        restored=grantRune(rune,'回纹环',level);
      }
      const runeResult = tryAddRune(outcome)||restored;
      fused = !!runeResult && runeResult.includes("！");
      const qualityName = QUALITY_NAMES[state.pill.quality];
      feedbackTone = "good";
      if (isBigSuccess) {
        feedback = runeResult && runeResult.includes("！") ? runeResult : `大成功！丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转。`;
        addLog(`<strong>大成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult && !runeResult.includes("！") ? `显现${runeResult}。` : ""}`, "good");
      } else {
        feedback = runeResult && runeResult.includes("！") ? runeResult : (state.pill.quality>before.quality ? "品质提升为"+qualityName+"。" : "药力 "+formatNumber(state.pill.value)+"。");
        addLog(`<strong>炼丹成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult ? `显现${runeResult}。` : ""}`, "good");
      }
    } else if (outcome === "hold") {
      if(naturalHold&&hasRune('赤纹','金纹'))state.pill.shield=true;
      if(naturalHold&&hasRune('月纹','星痕')){state.pill.moonCharge=1;triggerLog('月力蓄成：下一次成功额外升一转。','good');}
      feedback=usedShield?'护丹挡下炸丹，本次不再蓄盾。':protectedByTool?'法器自动护丹，火候维持。':'火候维持。';
      addLog(`<strong>火候维持</strong>：${feedback}${naturalHold&&state.pill.shield?'赤纹蓄成下一次护丹。':''}`, '');
    } else if (outcome === "damage") {
      applyDamage();
      feedback = `丹体受损，转数回落至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转。`;
      addLog(`<strong>丹体受损</strong>：转数回落至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，价值降为 ${formatNumber(state.pill.value)}。`, "bad");
    } else {
      state.explosions += 1;
      state.pillEnded = true;
      state.pillEndReason = "explode";
      feedback = "炸丹！这颗丹没能留下。";
      feedbackTone = "bad";
      updateRecord();
      addLog("<strong>炸丹</strong>：当前丹药化为炉灰，本炉结束。", "bad");
      if (state.attempt >= MAX_PILLS && campaignRules?.active(campaign)?.self) {
        state.roundEnded = true;
        addLog("<strong>订单未完成</strong>：原料已用尽。", "bad");
      }
    }

    if (!state.pillEnded && state.pill.turn >= 100) {
      state.completedPills += 1;
      updateRecord();
      feedback = "百转成丹！这颗药力得记入炉谱。";
      feedbackTone = "good";
      addLog(`<strong>百转成丹</strong>：${QUALITY_NAMES[state.pill.quality]}，价值 ${formatNumber(state.pill.value)}，请收丹入库。`, "good");
    }

    if (!state.pillEnded && state.pill.turn < 100) {
      state.riskResult = randomRisk();
      addLog("<strong>下一次风险</strong>：已按转数更新。", "");
    }
    // 首次九转归元：总药力乘以本次催炼前炉险，独立积累后在九转兑现。
    if (!state.pillEnded) {
      if (state.pill.value < before.value && before.value > 0) {
        const ratio = state.pill.value / before.value;
        state.pill.yuanPool *= ratio;
        state.pill.yuanBonus *= ratio;
      }
      if (state.pill.value > (state.pill.yuanHigh ?? 24)) {
        state.pill.yuanPool += before.value * profile.explode;
        state.pill.yuanHigh = state.pill.value;
      } else state.pill.yuanHigh = Math.max(state.pill.yuanHigh ?? 24, state.pill.value);
      const reachedNode = Math.floor(state.pill.turn / 9);
      while (reachedNode > (state.pill.yuanNode ?? 0)) {
        state.pill.yuanBonus += Math.round(state.pill.yuanPool);
        state.pill.yuanPool = 0;
        state.pill.yuanNode = (state.pill.yuanNode ?? 0) + 1;
        addLog(`<strong>${state.pill.yuanNode * 9}转归元</strong>：归元药力累计 +${formatNumber(state.pill.yuanBonus)}，收丹后计入售价。`, 'good');
      }
    }
    updateRecord();
    telemetry?.record("refine_result", playtestSnapshot(), { before, outcome, shieldUsed: usedShield });
    if (state.roundEnded) { settleOrder(); telemetry?.finish(playtestSnapshot(), state.delivered >= ORDER_TARGET ? "win" : "loss"); }
    if (!state.pillEnded && state.pill.ritualSafe === 0 && state.pill.refineSerial % 9 === 0) beginRitual();
    decisionSince = Date.now();
    const visualOutcome = state.pill.turn >= 100 && !state.pillEnded ? "complete" : fused ? "fusion" : usedShield ? "shield" : outcome;
    setFeedback(feedback, feedbackTone, visualOutcome, outcome === "explode" ? -before.value : state.pill.value - before.value);
    render();
    if(typeof CustomEvent!=='undefined')window.dispatchEvent?.(new CustomEvent('alchemy:refine-result',{detail:{outcome}}));
  }

  function refine() {
    if (!state.started || state.busy || state.pillEnded || state.roundEnded || state.pill.turn >= 100 || state.pill.runeChoices?.length || state.pill.ritualActive) return;
    telemetry?.record("refine_choice", playtestSnapshot(), { decisionMs: Date.now() - decisionSince });
    state.busy = true;
    dom.pillVisual.classList.add("resolving");
    render();
    window.setTimeout(() => {
      dom.pillVisual.classList.remove("resolving");
      state.busy = false;
      resolveRefine();
    }, typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : document.body.classList?.contains("canvas-room") ? 100 : 280);
  }

  function activeCommission(){return campaign?.orders.find(o=>o.id===campaign.activeId&&o.status==='active')||null;}
  function nextPillId(){const e=window.AlchemyEconomy.ensure(campaign);e.pillSerial=Number.isSafeInteger(e.pillSerial)&&e.pillSerial>=0?e.pillSerial:0;let id;do{id='P'+(++e.pillSerial);}while(Array.isArray(e.pills)&&e.pills.some(p=>p?.id===id));return id;}
  function lockPillIdentity(){if(!campaign)return;const o=campaignRules.active(campaign)||campaign.orders.find(o=>o.id===state.orderId)||campaign.selfOrder;state.pill.id ||= nextPillId();state.pill.nature ||= o?.nature||'neutral';state.pill.tier ??= o?.tier||0;}
  function migrateLoop(){const E=window.AlchemyEconomy,e=E.ensure(campaign),o=campaignRules.active(campaign);if(!state.pillEnded)lockPillIdentity();if(e.loopVersion!==143){const pendingSpirit=!state.pillEnded&&state.pill.tier===2&&(!state.pill.spiritUsed||state.pill.runeChoices?.length);const units=(Number.isInteger(e.stock[2])?e.stock[2]:0)+(pendingSpirit?1:0),refund=units*14;if(refund){e.coins+=refund;e.spent=Math.max(0,e.spent-refund);e.refunded=(e.refunded||0)+refund;e.last='灵性药包调价补差 '+refund+' 铜钱';addLog('<strong>药包调价补差</strong>：'+units+'包灵性药包，退回 '+refund+' 铜钱。','good');}e.loopVersion=143;}
    const choices=(state.pill.runeChoices||[]).filter(r=>BASIC_RUNES.includes(r)&&!state.pill.runes.includes(r));if(choices.length){let n=0;for(const c of state.pill.id)n=(n*31+c.charCodeAt(0))>>>0;state.pill.runeChoices=[];state.pill.spiritUsed=true;grantRune(choices[n%choices.length],'旧进度显纹');updateRecord();}else state.pill.runeChoices=[];
    if(o&&!o.self&&o.status==='active'){state.roundEnded=false;o.submitted ||= state.collected.map(p=>({...p}));}
  }
  function previewSubmission(id){const o=activeCommission(),e=campaign?.economy,p=Array.isArray(e?.pills)&&e.pills.find(p=>p.id===id);if(!o||!p||campaign.phase!=='open')return {ok:false};const after=state.delivered+p.value,complete=after>=o.target;return {ok:true,after,target:o.target,complete,reward:complete?window.AlchemyEconomy.commissionReward(o,[...(o.submitted||state.collected),p]):0};}
  function submitPill(id){if(!state.started||state.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held)return false;const q=previewSubmission(id);if(!q.ok)return false;const o=activeCommission(),e=campaign.economy,index=e.pills.findIndex(p=>p.id===id),p=e.pills[index];e.pills.splice(index,1);state.delivered=q.after;state.collected.push({...p});o.delivered=q.after;o.submitted=state.collected.map(p=>({...p}));o.used=state.attempt;if(q.complete){campaignRules.resolve(campaign,state.delivered,state.attempt);window.AlchemyEconomy.commission(campaign,o,state.collected);state.roundEnded=state.pillEnded;telemetry?.finish(playtestSnapshot(),'win');}else e.last='已提交 '+p.value+' 药力，累计 '+q.after+' / '+o.target;addLog('<strong>提交丹药</strong>：'+p.value+' 药力，累计 '+q.after+' / '+o.target+'。','good');setFeedback(q.complete?'委托已成，工钱已结。':e.last,'good',q.complete?'win':'submit');render();window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind:'submit',id,complete:q.complete}}));return true;}
  function startNewPill() {
    if (!state.started || state.busy || !state.pillEnded || state.roundEnded || state.attempt >= MAX_PILLS) return;
    state.attempt += 1;
    const own=campaignRules?.active(campaign);if(own?.self&&own.source)window.AlchemySaves?.setPreference(own.source==='gift'?'usedGift':'usedPurchased',true);
    state.pill = freshPill();
    lockPillIdentity();
    const palette=window.AlchemyPillPalette;if(palette)state.pill.appearance=palette.pick(own?.nature||'neutral',own?.id||'single',state.attempt);
    state.riskResult = randomRisk(1);
    if(state.pill.tier===1){state.pill.quality=1;state.pill.qualityFloor=1;}
    state.pillEnded = false;
    state.pillEndReason = "";
    decisionSince = Date.now();
    telemetry?.record("pill_start", playtestSnapshot());
    addLog(`<strong>再开一炉</strong>：第 ${state.attempt} 颗丹药开始炼化。`, "good");
    setFeedback("炉火重新点燃。", "good");
    render();
  }

  function startGame(event) {
    if (state && state.busy) return;
    if (saved && event?.currentTarget === dom.startButton) {
      campaign = saved.campaign; state = saved.state; state.busy = false;if(state.pill.toolUsed&&!state.pill.toolUses){state.pill.toolUses={};for(const id of window.AlchemyEconomy?.equippedIds(campaign.economy?.equipped)||[])if(['seal','phoenix','needle'].includes(id))state.pill.toolUses[id]=1;}state.riskResult=randomRisk(state.pill.turn);
      migrateLoop();ensurePricing();
      state.pill.qualityFloor=state.pill.tier===1?1:0;state.pill.quality=Math.max(state.pill.qualityFloor,qualityAtTurn(state.pill.turn));
      if (campaign.phase === 'open' && campaign.orders.length === 3) {
        const extra = campaignRules.ordersFor(campaign.day);
        campaign.orders.push(...extra.slice(3));
      }
      ORDER_TARGET = saved.target; MAX_PILLS = saved.materials; saved = null;
      document.body.dataset.screen = "playing"; dom.introModal.classList.add("hidden");
      if (!state.roundEnded) telemetry?.begin(playtestSnapshot());
      setFeedback("已回到上次停炉的位置。", "good");
      window.dispatchEvent?.(new Event("alchemy:order")); render(); return;
    }
    saved = null;
    if (state?.started && !state.roundEnded) telemetry?.finish(playtestSnapshot(), "restart");
    state = createState();
    state.started = true;
    state.attempt = 0;
    state.pillEnded = true;
    state.pillEndReason = "waiting";
    if (campaignRules) {
      campaign = campaignRules.create();
      campaignRules.accept(campaign, campaign.orders[0].id);
      state.orderId = campaign.activeId;
      ORDER_TARGET = campaignRules.active(campaign).target;
      MAX_PILLS = campaignRules.active(campaign).materials;
    }
    if(campaign)migrateLoop();
    decisionSince = Date.now();
    if (telemetry) {
      const intro = document.getElementById("introTelemetryEnabled");
      const toggle = document.getElementById("telemetryEnabled");
      if (!dom.introModal.classList.contains("hidden")) toggle.checked = intro.checked;
      telemetry.setEnabled(toggle.checked);
    }
    telemetry?.begin(playtestSnapshot());
    addLog("委托已接下，三包客料已领至药匣。", "good");
    document.body.dataset.screen = "playing";
    dom.introModal.classList.add("hidden");
    setFeedback("委托药材已备齐，等待投药。", "good", "start");
    render();
    document.getElementById("herbObject")?.focus?.({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }

  dom.startButton.addEventListener("click", startGame);
  dom.restartButton.addEventListener("click", startGame);
  function beginRitual() {
    state.pill.ritualActive = true; state.pill.ritualStep = 0; dom.ritualPanel.classList.remove('hidden');
    dom.ritualGrid.innerHTML = '';
    for (let i=0;i<9;i++) { const b=document.createElement('button'); b.type='button'; b.textContent=String(i+1); b.dataset.index=i; b.addEventListener('click',()=>{ if(Number(b.dataset.index)!==state.pill.ritualStep)return; b.classList.add('done'); state.pill.ritualStep++; if(state.pill.ritualStep<9){dom.ritualGrid.querySelector(`[data-index="${state.pill.ritualStep}"]`)?.classList.add('active');}else{state.pill.ritualActive=false;state.pill.ritualSafe=7;dom.ritualPanel.classList.add('hidden');dom.ritualStatus.textContent='步罡已成，炉息暂定';render(); for(let n=0;n<7&&!state.pillEnded&&state.pill.turn<100;n++)resolveRefine();}}); dom.ritualGrid.appendChild(b); }
    dom.ritualGrid.querySelector('[data-index="0"]')?.classList.add('active'); dom.ritualStatus.textContent='循火星落位完成步罡'; render();
  }
  dom.refineButton.addEventListener("click", refine);
  function collectPill() {
    if(!state.started||state.busy||state.pillEnded||state.pill.runeChoices?.length)return false;
    ensurePricing();lockPillIdentity();const before=playtestSnapshot(),o=campaignRules.active(campaign);
    if(!window.AlchemyEconomy.storePill(campaign,state.pill,o)){setFeedback('库存记录异常，炉内丹药已保留。','bad');render();return false;}
    const id=state.pill.id;state.pillEnded=true;state.pillEndReason='collect';if(o?.self)o.status='completed';state.roundEnded=!activeCommission();
    telemetry?.record('collect',playtestSnapshot(),{before,decisionMs:Date.now()-decisionSince});addLog('<strong>收丹入库</strong>：药力 '+formatNumber(state.pill.value+(state.pill.yuanBonus||0))+'，等待选择用途。','good');setFeedback('丹药已入库。','good','collect');render();window.dispatchEvent(new CustomEvent('alchemy:pill-stored',{detail:{id}}));window.dispatchEvent(new CustomEvent('alchemy:world-collect',{detail:{self:false,stored:true,id}}));return true;
  }
  dom.collectButton.addEventListener("click", collectPill);
  dom.newPillButton.addEventListener("click", startNewPill);
  document.addEventListener("keydown", (event) => {
    if (event.target.id === "alchemyScene") return;
    if(window.AlchemyViewState&&window.AlchemyViewState.snapshot().current!=='work')return;
    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement && ["BUTTON", "INPUT", "A", "SUMMARY", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      event.preventDefault();
      if (window.AlchemyFurnaceView) {
        if (window.AlchemyViewState.snapshot().workMode === 'furnace') window.AlchemyScene2D.refine();
        return;
      }
      refine();
    }
  });

  function settleOrder() {
    if(!campaign)return;const o=campaignRules.active(campaign);if(!o)return;
    if(o.self){o.status='completed';campaign.activeId=null;return;}
    campaignRules.resolve(campaign,state.delivered,state.attempt);window.AlchemyEconomy?.commission(campaign,o,state.collected);
  }
  function chooseOrder(id) {
    if(!campaign||state.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held||activeCommission()||campaign.phase!=='open')return false;
    if(!campaign.orders.some(o=>o.id===id&&o.status==='pending'))return false;
    const live=!state.pillEnded,previous=state;if(campaign.selfOrder?.status==='active')campaign.selfOrder.status='completed';
    if(!campaignRules.accept(campaign,id))return false;const o=activeCommission();ORDER_TARGET=o.target;MAX_PILLS=o.materials;
    state=createState();state.started=true;state.orderId=o.id;state.pillEnded=!live;state.pillEndReason=live?'':'waiting';
    if(live){state.pill=previous.pill;state.riskResult=previous.riskResult;state.logs=previous.logs;state.discoveredRunes=previous.discoveredRunes;state.bestTurn=previous.bestTurn;state.bestValue=previous.bestValue;}
    decisionSince=Date.now();telemetry?.begin(playtestSnapshot());setFeedback(o.client+'的委托已接下，药材已备齐。','good');window.dispatchEvent(new Event('alchemy:order'));render();return true;
  }
  function endDay() {
    if (!campaign || state.busy || window.AlchemyInteractionBusy || !state.pillEnded || !campaignRules.settle(campaign)) return false;
    render(); return true;
  }
  function nextDay() {
    if (!campaign || !campaignRules.next(campaign)) return false;
    state.roundEnded = true; state.pillEnded = true;
    state.delivered = 0; state.attempt = 0; state.orderId = null; state.collected = [];
    state.pill = freshPill(); state.pillEndReason = "waiting";
    window.dispatchEvent?.(new Event("alchemy:order")); render(); return true;
  }
  function abandonOrder() {
    if (!campaign || state.busy || window.AlchemyInteractionBusy || !state.pillEnded || state.roundEnded) return false;
    if (!campaignRules.resolve(campaign, state.delivered, state.attempt, true)) return false;
    state.roundEnded = true; telemetry?.finish(playtestSnapshot(), "abandoned");
    setFeedback("本单已终止，未用本单料已退还，库存丹药保留。", "", "loss"); render(); return true;
  }
  function economyAction(kind,id,nature='neutral'){if(!campaign||state.busy||window.AlchemyInteractionBusy)return false;window.AlchemyEconomy.ensure(campaign);let ok=false;
    if(kind==='submit')return submitPill(id);
    if(kind==='sell'){if(window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held)return false;ok=window.AlchemyEconomy.sale(campaign,id)!==false;if(ok)window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind:'sell',id}}));}
    else if(kind==='equip'){const e=campaign.economy;if(!state.pillEnded||(!e.tools.includes(id)&&id!==null))return false;const ids=window.AlchemyEconomy.equippedIds(e.equipped);if(id===null)e.equipped=[];else if(ids.includes(id))e.equipped=ids.filter(t=>t!==id);else{if(ids.length>=window.AlchemyEconomy.EQUIP_SLOTS)return false;const def=window.AlchemyEconomy.TOOL_DEFS.find(t=>t.id===id);if(def?.runeTarget&&window.AlchemyEconomy.runeTarget(ids))return false;e.equipped=[...ids,id];}ok=true;}
    else if(kind==='self'||kind==='herbself'){if(campaign.phase!=='open'||campaignRules.active(campaign)||!state.pillEnded||!state.roundEnded)return false;const e=campaign.economy;if(!['warm','cool','neutral'].includes(nature))return false;if(kind==='herbself'){nature=id;if(!['warm','cool','neutral'].includes(nature)||!e.herbs[nature])return false;e.herbs[nature]--;id=0;}else{if(!Number.isInteger(id)||id<0||id>2||!e.stock[id])return false;e.stock[id]--;}e.selfCount++;const o={id:'S'+e.selfCount,self:true,source:kind==='herbself'?'gift':'purchased',tier:id,status:'active',client:'自有药材自炼',name:['普通药包自炼','精选药包自炼','灵性药包自炼'][id],nature,materials:1,target:1};campaign.selfOrder=o;ORDER_TARGET=1;MAX_PILLS=1;state=createState();state.started=true;state.pillEnded=true;state.pillEndReason='waiting';state.orderId=o.id;window.dispatchEvent?.(new Event('alchemy:order'));ok=true;}
    else if(kind==='chooseRune'){if(state.pillEnded||state.pill.runes.length>=MAX_RUNES||state.pill.runes.includes(id)||!state.pill.runeChoices?.includes(id))return false;state.pill.runeChoices=[];grantRune(id,'灵性药包');updateRecord();ok=true;}
    else if(kind==='reroll')return false; // 生纹针现为自动生效，不保留额外炉内操作。
    else if(campaign.phase==='open'&&(kind!=='furnace'||state.pillEnded))ok=window.AlchemyEconomy.buy(campaign,kind,id);
    if(ok){state.riskResult=randomRisk();render();if(['material','tool','furnace'].includes(kind)&&typeof CustomEvent!=='undefined')window.dispatchEvent?.(new CustomEvent('alchemy:purchase',{detail:{kind}}));}return ok;
  }
  function canReplaceEquipment(oldId,newId){
    const fail=reason=>({ok:false,reason});
    if(!campaign||campaign.phase!=='open')return fail('今日已收工，次日再布置。');
    if(state.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy)return fail('正在炼化，请待结果落定。');
    if(window.AlchemyScene2D?.held)return fail('先放回手中物件。');
    if(!state.pillEnded)return fail('炉内有丹，收丹后可调整。');
    const E=window.AlchemyEconomy,e=E.ensure(campaign),ids=E.equippedIds(e.equipped);
    if(oldId!==null&&!ids.includes(oldId))return fail('原法器已不在此处，请重新选择。');
    if(newId!==null&&(!e.tools.includes(newId)||!E.TOOL_DEFS.some(t=>t.id===newId)))return fail('尚未持有这件法器。');
    if(oldId===newId)return {ok:true,reason:''};
    const next=[...ids],index=oldId===null?next.length:next.indexOf(oldId);
    if(newId!==null&&next.includes(newId))return fail('这件法器已在案上。');
    if(newId===null){if(oldId===null)return fail('请选择要撤下的法器。');next.splice(index,1);}else next[index]=newId;
    if(next.length>E.EQUIP_SLOTS)return fail('三个位置已满，请先点选要更换的法器。');
    if(next.filter(id=>E.TOOL_DEFS.find(t=>t.id===id)?.runeTarget).length>1)return fail('同炉只能布置一件定向法器。');
    return {ok:true,reason:'',next};
  }
  function replaceEquipment(oldId,newId){
    const result=canReplaceEquipment(oldId,newId);if(!result.ok)return false;if(oldId===newId)return true;
    campaign.economy.equipped=result.next;
    if(typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('alchemy:equipment-replaced',{detail:{oldId,newId}}));
    state.riskResult=randomRisk();render();return true;
  }
  window.AlchemyGame = { successValuePreview, submit:submitPill,previewSubmission,canReplaceEquipment, replaceEquipment, RUNE_CHANCE, RUNE_DEFS, refinementProbabilities, runeLevelsFor, runeValueMultiplier, valueForBase, load: startNewPill, refine, collect: collectPill, riskAtTurn:t=>randomRisk(t).explode, economyAction, chooseOrder, endDay, nextDay, abandonOrder,
    campaign: () => campaign ? JSON.parse(JSON.stringify(campaign)) : null,
    snapshot: () => ({ ...playtestSnapshot(), nature:state.pill.nature||(campaign?campaignRules.active(campaign)?.nature:null)||'neutral',tier:state.pill.tier||0,pillId:state.pill.id||null,commission:activeCommission(), ...(state.pill.appearance?{appearance:state.pill.appearance}:{}), started: state.started,
    busy: state.busy, pillEnded: state.pillEnded, roundEnded: state.roundEnded,
    endReason: state.pillEndReason, remaining: campaign&&campaignRules.active(campaign)?.status==='active' ? Math.max(0,MAX_PILLS-state.attempt) : 0, target: ORDER_TARGET,
    toolProgress:{uses:{...state.pill.toolUses},moonCharge:state.pill.moonCharge||0,returnRune:state.pill.returnRune||null,fusionPending:!!state.pill.fusionPending,scars:state.pill.scars||0,chain:state.pill.successChain||0,valueFactor:state.pill.valueFactor??1,triggers:[...(state.pill.triggers||[])]},runeChoices:state.pill.runeChoices||[],toolUsed:!!state.pill.toolUsed,campaignEnabled: !!campaign, collected: state.collected,
    order: campaign ? (campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId))) : null }) };
  state = createState();
  if (saved) dom.startButton.textContent = "继续经营";
  if (telemetry) {
    document.getElementById("exportDataButton").addEventListener("click", () => telemetry.download());
    document.getElementById("telemetryEnabled").addEventListener("change", event => {
      telemetry.setEnabled(event.target.checked);
      if (event.target.checked && state.started && !state.roundEnded) telemetry.begin(playtestSnapshot());
    });
    window.setInterval(() => void telemetry.flush(), 8000);
    window.addEventListener("pagehide", () => {
      if (state.started && !state.roundEnded) telemetry.record("interrupted", playtestSnapshot());
      void telemetry.flush();
    });
  }
  render();
})();
