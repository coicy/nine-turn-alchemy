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
    const raw = JSON.parse(window.localStorage?.getItem(SAVE_KEY) || "null");
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
    '青纹':'受损时丹值仅下降10%；转数仍回落一转。',
    '月纹':'自然维持后蓄月力，下一次成功额外升一转；最多蓄一层。',
    '雷纹':'大成功额外升一转；持有期间自动生效。',
    '金纹':'赤纹与青纹融合，占一道位置，继承护丹和受损减值保护。',
    '星痕':'月纹与雷纹融合，占一道位置，继承蓄月力和大成功额外升转。'
  };
  function hasTool(id){return !!window.AlchemyEconomy?.hasTool(campaign?.economy?.equipped,id);}
  function uses(id){return state.pill.toolUses?.[id]||0;}
  function useTool(id){state.pill.toolUses ||= {};state.pill.toolUses[id]=uses(id)+1;state.pill.toolUsed=true;}
  function hasRune(...names){return names.some(n=>state.pill.runes.includes(n));}
  function turnBonus(outcome){return (state.pill.toolTurnBonus||0)+(['success','big'].includes(outcome)?(state.pill.moonCharge||0):0)+(outcome==='big'&&hasRune('雷纹','星痕')?1:0);}
  function triggerLog(message,tone='good'){state.pill.triggers ||= [];state.pill.triggers.push(message);addLog(message,tone);}
  function consumeBasicRune(){
    const p=state.pill,index=p.runes.findLastIndex(r=>BASIC_RUNES.includes(r));
    if(index<0)return false;
    const [rune]=p.runes.splice(index,1);useTool('burn');
    // Removing a passive also removes its stored charge/shield unless its fusion remains.
    if(!hasRune('月纹','星痕'))p.moonCharge=0;
    if(!hasRune('赤纹','金纹'))p.shield=false;
    triggerLog(`燃纹盏消耗${rune}，挡下炸炉（${uses('burn')}/2）。`,'good');
    if(hasTool('return')&&!uses('return')&&!p.returnRune){p.returnRune=rune;triggerLog('回纹环：下一次成功补回'+rune+'。','good');}
    if(hasTool('ash')&&uses('ash')<2){const old=1+.15*uses('ash');useTool('ash');p.value=Math.round(p.value*(1+.15*uses('ash'))/old);triggerLog('烬金印：本炉丹值加成 '+uses('ash')*15+'%。','good');}
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
  };

  let state = null;
  let feedbackTimer = null;
  const telemetry = window.AlchemyTelemetry;
  let decisionSince = Date.now();

  function playtestSnapshot() {
    return { attempt: state.attempt, turn: state.pill.turn, quality: state.pill.quality,
      value: state.pill.value, runes: [...state.pill.runes], maxRunes: MAX_RUNES, shield: state.pill.shield,
      risk: state.pill.shield ? 0 : state.riskResult.explode, delivered: state.delivered,
      day: campaign?.day || 1, orderId: state.orderId || null };
  }

  function randomRisk(turn=state?.pill?.turn||1) {const base=BREAK_CURVE[Math.max(0,Math.min(30,Math.floor(turn)-1))];return {explode:base*(window.AlchemyEconomy?.toolRisk(campaign?.economy?.equipped,state?.pill)||1)};}

  function freshPill() {
    return { turn: 1, quality: 0, value: 24, runes: [], bestTurn: 1, shield: false, toolUsed:false, damageSoftened:false, runeChoices:[] };
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
      completedPills: 0,
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
    state.logs.unshift({ message, tone });
    state.logs = state.logs.slice(0, 8);
  }

  function render() {
    const profile = state.riskResult;
    const turnProgress = Math.min(100, (state.delivered / ORDER_TARGET) * 100);
    const explosionChance = state.pill.shield ? 0 : profile.explode;
    dom.attemptText.textContent = `${state.attempt} / ${MAX_PILLS}`;
    dom.compactOrderValue.textContent = `${formatNumber(state.delivered)} / ${ORDER_TARGET}`;
    dom.compactStockValue.textContent = `${MAX_PILLS - state.attempt} 包`;
    document.getElementById("orderGoalLabel").textContent = `/ ${ORDER_TARGET}`;
    if (campaign) {
      const order = campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId));
      if (order) {
        document.getElementById("trialTitle").textContent = order.name;
        document.getElementById("trialFlavor").textContent = `${order.client}提供 ${order.materials} 包药材，交付价值达到 ${order.target}；失败免赔。`;
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
      ? (campaign ? "本单已结清，请选择下一份委托；全部订单处理后可结束今日。" : state.delivered >= ORDER_TARGET ? "订单完成！点击重新开始再挑战。" : "原料已用尽，订单未完成。点击重新开始再挑战。")
      : state.pillEnded ? "取一包委托药材，投入炉口开炉。" : state.pill.turn >= 100 ? "百转已成，收丹交付即可锁定价值。" : state.pill.shield
        ? "护丹已准备：下一次炸丹将转为保持。" : `下一次炸丹概率 ${percentage(explosionChance)}，可继续炼化或收丹交付。`;
    const activeOrder = campaign && (campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId)));
    dom.pillName.textContent = `${({warm:'温性',cool:'寒性',neutral:'平性'}[activeOrder?.nature || 'neutral'])}灵丹`;
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
    dom.riskDescription.textContent = state.pillEnded ? "本炉已结束" : state.pill.turn >= 100 ? "百转已成，可收丹交付" : state.pill.shield ? "护丹会挡下下一次炼化中的炸丹" : "收丹可锁定当前价值";
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
      : state.pill.turn >= 100 ? "百转成丹，点击“收丹交付”。" : "炸丹概率随转数上升；收丹可锁定当前价值。";
    if (state.pillEndReason === "waiting") {
      dom.pillName.textContent = "空炉待药";
      dom.pillValue.textContent = "—";
      dom.qualityValue.textContent = "未起炉";
      dom.riskBadge.textContent = "待投药";
      dom.riskDescription.textContent = "整包投药后开始本炉";
    }
    if (campaign && state.started && !state.busy) {
      window.AlchemyEconomy?.ensure(campaign);
      try { window.localStorage?.setItem(SAVE_KEY, JSON.stringify({version:1,campaign,state,target:ORDER_TARGET,materials:MAX_PILLS})); } catch (_) {}
    }
    window.dispatchEvent?.(new Event("alchemy:render"));
  }

  function renderOutcomes(chance) {
    dom.outcomeList.innerHTML = `<div class="risk-meter" aria-hidden="true"><div style="width:${state.pillEnded || state.pill.turn >= 100 ? 0 : Math.round(chance * 100)}%"></div></div>`;
  }

  function renderRunes() {
    if (!state.discoveredRunes.length) {
      dom.runeList.innerHTML = '<div class="rune-entry empty">本轮还没有发现丹纹。炼丹时有机会显现。</div>';
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
    dom.logList.innerHTML = state.logs.length
      ? state.logs.map((entry) => `<div class="log-entry ${entry.tone}">${entry.message}</div>`).join("")
      : '<div class="log-entry">炉火等待第一道指令。</div>';
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

  function applyAlchemy(outcome) {
    const isBigSuccess = outcome === "big";
    const turnGain = (isBigSuccess ? 2 : 1)+turnBonus(outcome);state.pill.toolTurnBonus=0;state.pill.moonCharge=0;
    const priceFor = (turn,quality,runes) => {const t=Math.max(0,Math.min(100,turn)-1);return Math.round((24+8*t+2*t*t+.08*t*t*t)*(1+quality*.08+runes.length*.12+(runes.includes('金纹')?.25:0)+(runes.includes('星痕')?.35:0)));};
    state.pill.turn = Math.min(100, state.pill.turn + turnGain);
    const qualityValueBoost = 1 + state.pill.quality * 0.03;
    state.pill.value = Math.round(priceFor(state.pill.turn,state.pill.quality,state.pill.runes)*(state.pill.valueFactor??1)*(1+.15*uses('ash')));
    state.pill.bestTurn = Math.max(state.pill.bestTurn, state.pill.turn);
  }

  function applyDamage() {
    state.pill.turn = Math.max(1, state.pill.turn - 1);
    const protectedValue = state.pill.runes.includes("青纹") || state.pill.runes.includes("金纹");
    state.pill.value = Math.max(8, Math.round(state.pill.value * (campaign?.economy?.furnace>=1&&!state.pill.damageSoftened?(state.pill.damageSoftened=true,protectedValue ? .95 : .85):(protectedValue ? 0.9 : 0.7))));
  }

  function grantRune(rune,label){
    if(state.pill.runes.length>=MAX_RUNES||state.pill.runes.includes(rune))return null;
    state.pill.runes.push(rune);state.pill.value=Math.round(state.pill.value*1.18);
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
    if(campaignRules?.active(campaign)?.tier===2 && !state.pill.spiritUsed){state.pill.spiritUsed=true;state.pill.runeChoices=window.AlchemyEconomy?.runeCandidates(available,campaign?.economy?.equipped)||available.slice(0,2);return null;}
    if(!guaranteed&&Math.random()>=(RUNE_CHANCE[outcome]||RUNE_CHANCE.success))return null;
    const rune=window.AlchemyEconomy?.pickRune(available,campaign?.economy?.equipped)||available[Math.floor(Math.random()*available.length)];
    return grantRune(rune,guaranteed?'法器生纹':null);
  }

  function tryFusion() {
    if (state.pill.runes.length < 2) return null;
    for (const [key, fusion] of Object.entries(FUSIONS)) {
      const needed = key.split("|");
      if (needed.every((rune) => state.pill.runes.includes(rune)) && !state.pill.runes.includes(fusion.name)) {
        state.pill.runes = state.pill.runes.filter((rune) => !needed.includes(rune));
        state.pill.runes.push(fusion.name);
        state.pill.value = Math.round(state.pill.value * 1.08);
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
    const explode = Math.random() < profile.explode;
    const roll = Math.random();
    const tool=campaign?.economy?.equipped;
    const w=window.AlchemyEconomy?.outcomeWeights(tool)||{big:2,success:12,hold:5,damage:2};const total=w.big+w.success+w.hold+w.damage;
    let outcome=explode?'explode':roll<w.big/total?'big':roll<(w.big+w.success)/total?'success':roll<(w.big+w.success+w.hold)/total?'hold':'damage';
    let usedShield = false;
    if (state.pill.shield) {
      state.pill.shield = false;
      if (outcome === "explode") { outcome = "hold"; usedShield = true; }
    }
    const naturalHold=outcome==='hold'&&!explode;
    let protectedByTool=false;
    if(outcome==='explode'&&hasTool('burn')&&uses('burn')<2&&consumeBasicRune()){outcome='hold';protectedByTool=true;}
    if(outcome==='explode'&&hasTool('seal')&&!uses('seal')){useTool('seal');outcome='damage';protectedByTool=true;triggerLog('镇炉印挡下炸炉，改为丹体受损。','good');}
    if(outcome==='explode'&&hasTool('phoenix')&&!uses('phoenix')){useTool('phoenix');state.pill.valueFactor=(state.pill.valueFactor??1)*.6;state.pill.value=Math.max(1,Math.round(state.pill.value*.6));outcome='hold';protectedByTool=true;triggerLog('返生鼎符挡下炸炉：本炉丹值持续折损40%。','good');}
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
        const rune=state.pill.returnRune;state.pill.returnRune=null;useTool('return');
        restored=grantRune(rune,'回纹环');
      }
      const runeResult = tryAddRune(outcome)||restored;
      fused = !!runeResult && runeResult.includes("！");
      const qualityName = QUALITY_NAMES[state.pill.quality];
      feedbackTone = "good";
      if (isBigSuccess) {
        feedback = runeResult && runeResult.includes("！") ? runeResult : `大成功！丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转。`;
        addLog(`<strong>大成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质提升为${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult && !runeResult.includes("！") ? `显现${runeResult}。` : ""}`, "good");
      } else {
        feedback = runeResult && runeResult.includes("！") ? runeResult : "炼丹成功，品质提升。";
        addLog(`<strong>炼丹成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质提升为${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult ? `显现${runeResult}。` : ""}`, "good");
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
      if (state.attempt >= MAX_PILLS) {
        state.roundEnded = true;
        addLog("<strong>订单未完成</strong>：原料已用尽。", "bad");
      }
    }

    if (!state.pillEnded && state.pill.turn >= 100) {
      state.completedPills += 1;
      updateRecord();
      feedback = "百转成丹！这颗丹值得记入炉谱。";
      feedbackTone = "good";
      addLog(`<strong>百转成丹</strong>：${QUALITY_NAMES[state.pill.quality]}，价值 ${formatNumber(state.pill.value)}，请收丹交付。`, "good");
    }

    if (!state.pillEnded && state.pill.turn < 100) {
      state.riskResult = randomRisk();
      addLog("<strong>下一次风险</strong>：已按转数更新。", "");
    }
    updateRecord();
    telemetry?.record("refine_result", playtestSnapshot(), { before, outcome, shieldUsed: usedShield });
    if (state.roundEnded) { settleOrder(); telemetry?.finish(playtestSnapshot(), state.delivered >= ORDER_TARGET ? "win" : "loss"); }
    decisionSince = Date.now();
    const visualOutcome = state.pill.turn >= 100 && !state.pillEnded ? "complete" : fused ? "fusion" : usedShield ? "shield" : outcome;
    setFeedback(feedback, feedbackTone, visualOutcome, outcome === "explode" ? -before.value : state.pill.value - before.value);
    render();
  }

  function refine() {
    if (!state.started || state.busy || state.pillEnded || state.roundEnded || state.pill.turn >= 100 || state.pill.runeChoices?.length) return;
    telemetry?.record("refine_choice", playtestSnapshot(), { decisionMs: Date.now() - decisionSince });
    state.busy = true;
    dom.pillVisual.classList.add("resolving");
    render();
    window.setTimeout(() => {
      dom.pillVisual.classList.remove("resolving");
      state.busy = false;
      resolveRefine();
    }, document.body.classList?.contains("canvas-room") ? 100 : 280);
  }

  function startNewPill() {
    if (!state.started || state.busy || !state.pillEnded || state.roundEnded || state.attempt >= MAX_PILLS) return;
    state.attempt += 1;
    state.pill = freshPill();
    state.riskResult = randomRisk(1);
    if(campaignRules?.active(campaign)?.tier===1){state.pill.quality=1;state.pill.qualityFloor=1;}
    state.pillEnded = false;
    state.pillEndReason = "";
    decisionSince = Date.now();
    telemetry?.record("pill_start", playtestSnapshot());
    addLog(`<strong>再开一炉</strong>：第 ${state.attempt} 颗丹药开始炼化。下一次风险按转数更新。`, "good");
    setFeedback("炉火重新点燃。下一次风险按转数更新。", "good");
    render();
  }

  function startGame(event) {
    if (state && state.busy) return;
    if (saved && event?.currentTarget === dom.startButton) {
      campaign = saved.campaign; state = saved.state; state.busy = false;if(state.pill.toolUsed&&!state.pill.toolUses){state.pill.toolUses={};for(const id of window.AlchemyEconomy?.equippedIds(campaign.economy?.equipped)||[])if(['seal','phoenix','needle'].includes(id))state.pill.toolUses[id]=1;}state.riskResult=randomRisk(state.pill.turn);
      state.pill.qualityFloor=campaignRules.active(campaign)?.tier===1?1:0;state.pill.quality=Math.max(state.pill.qualityFloor,qualityAtTurn(state.pill.turn));
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
    decisionSince = Date.now();
    if (telemetry) {
      const intro = document.getElementById("introTelemetryEnabled");
      const toggle = document.getElementById("telemetryEnabled");
      if (!dom.introModal.classList.contains("hidden")) toggle.checked = intro.checked;
      telemetry.setEnabled(toggle.checked);
    }
    telemetry?.begin(playtestSnapshot());
    addLog("委托已接下，三包药材放在案上。取一包投入炉口，开始第一炉。", "good");
    document.body.dataset.screen = "playing";
    dom.introModal.classList.add("hidden");
    setFeedback("委托药材已备齐，等待投药。", "good", "start");
    render();
    document.getElementById("herbObject")?.focus?.({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }

  dom.startButton.addEventListener("click", startGame);
  dom.restartButton.addEventListener("click", startGame);
  dom.refineButton.addEventListener("click", refine);
  function collectPill() {
    if (!state.started || state.busy || state.pillEnded || state.roundEnded || state.pill.runeChoices?.length) return;
    const before = playtestSnapshot();
    const isSelf=!!campaignRules?.active(campaign)?.self;
    if(isSelf)window.AlchemyEconomy.sale(campaign,state.pill);
    state.delivered += state.pill.value;
    state.collected.push({value:state.pill.value,quality:state.pill.quality,turn:state.pill.turn,runes:[...state.pill.runes],nature:campaignRules?.active(campaign)?.nature || 'neutral'});
    state.pillEnded = true;
    state.pillEndReason = "collect";
    state.roundEnded = state.delivered >= ORDER_TARGET || state.attempt >= MAX_PILLS;
    telemetry?.record("collect", playtestSnapshot(), { before, decisionMs: Date.now() - decisionSince });
    if (state.roundEnded) { settleOrder(); telemetry?.finish(playtestSnapshot(), state.delivered >= ORDER_TARGET ? "win" : "loss"); }
    else void telemetry?.flush();
    addLog(`<strong>${isSelf?"自炼出售":"收丹交付"}</strong>：获得 ${formatNumber(state.pill.value)}，订单累计 ${formatNumber(state.delivered)} / ${ORDER_TARGET}。`, "good");
    if (state.roundEnded && !isSelf) addLog(state.delivered >= ORDER_TARGET ? "<strong>订单完成</strong>：客人已收下丹药！" : "<strong>订单未完成</strong>：原料已用尽。", state.delivered >= ORDER_TARGET ? "good" : "bad");
    const won = state.delivered >= ORDER_TARGET;
    if(isSelf)setFeedback(campaign.economy.last,"good","collect");
    else setFeedback(state.roundEnded ? (won ? "订单完成！客人已收下你的丹药。" : "原料用尽，订单未完成。") : "收丹交付，价值已锁定。", state.roundEnded && !won ? "bad" : "good", state.roundEnded ? (won ? "win" : "loss") : "collect", `已交付 +${formatNumber(state.pill.value)}`);
    render();
  }
  dom.collectButton.addEventListener("click", collectPill);
  dom.newPillButton.addEventListener("click", startNewPill);
  document.addEventListener("keydown", (event) => {
    if (event.target.id === "alchemyScene") return;
    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement && ["BUTTON", "INPUT"].includes(document.activeElement.tagName)) return;
      event.preventDefault();
      refine();
    }
  });

  function settleOrder() {
    if(!campaign)return;const o=campaignRules.active(campaign);if(!o)return;
    if(o.self){o.status='completed';campaign.activeId=null;return;}
    campaignRules.resolve(campaign,state.delivered,state.attempt);window.AlchemyEconomy?.commission(campaign,o,state.collected);
  }
  function chooseOrder(id) {
    if (!campaign || state.busy || window.AlchemyInteractionBusy || !state.pillEnded || !state.roundEnded) return false;
    if (!campaignRules.accept(campaign, id)) return false;
    const o = campaignRules.active(campaign);
    ORDER_TARGET = o.target; MAX_PILLS = o.materials;
    state = createState(); state.started = true; state.pillEnded = true; state.pillEndReason = "waiting"; state.orderId = o.id;
    decisionSince = Date.now(); telemetry?.begin(playtestSnapshot());
    setFeedback(`${o.client}送来 ${o.materials} 包药材，请投药开炉。`, "good");
    window.dispatchEvent?.(new Event("alchemy:order")); render(); return true;
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
    setFeedback("本单已终止。已有成丹及未用药材交还客人，免赔。", "", "loss"); render(); return true;
  }
  function economyAction(kind,id,nature='neutral'){if(!campaign||state.busy||window.AlchemyInteractionBusy)return false;window.AlchemyEconomy.ensure(campaign);let ok=false;
    if(kind==='equip'){const e=campaign.economy;if(!state.pillEnded||(!e.tools.includes(id)&&id!==null))return false;const ids=window.AlchemyEconomy.equippedIds(e.equipped);if(id===null)e.equipped=[];else if(ids.includes(id))e.equipped=ids.filter(t=>t!==id);else{if(ids.length>=window.AlchemyEconomy.EQUIP_SLOTS)return false;const def=window.AlchemyEconomy.TOOL_DEFS.find(t=>t.id===id);if(def?.runeTarget&&window.AlchemyEconomy.runeTarget(ids))return false;e.equipped=[...ids,id];}ok=true;}
    else if(kind==='self'||kind==='herbself'){if(campaign.phase!=='open'||campaignRules.active(campaign)||!state.pillEnded||!state.roundEnded)return false;const e=campaign.economy;if(!['warm','cool','neutral'].includes(nature))return false;if(kind==='herbself'){nature=id;if(!['warm','cool','neutral'].includes(nature)||!e.herbs[nature])return false;e.herbs[nature]--;id=0;}else{if(!Number.isInteger(id)||id<0||id>2||!e.stock[id])return false;e.stock[id]--;}e.selfCount++;const o={id:'S'+e.selfCount,self:true,tier:id,status:'active',client:'自炼自售',name:['普通药包自炼','精选药包自炼','灵性药包自炼'][id],nature,materials:1,target:1};campaign.selfOrder=o;ORDER_TARGET=1;MAX_PILLS=1;state=createState();state.started=true;state.pillEnded=true;state.pillEndReason='waiting';state.orderId=o.id;window.dispatchEvent?.(new Event('alchemy:order'));ok=true;}
    else if(kind==='chooseRune'){if(state.pillEnded||state.pill.runes.length>=MAX_RUNES||state.pill.runes.includes(id)||!state.pill.runeChoices?.includes(id))return false;state.pill.runeChoices=[];grantRune(id,'灵性药包');updateRecord();ok=true;}
    else if(kind==='reroll')return false; // 生纹针现为自动生效，不保留额外炉内操作。
    else if(campaign.phase==='open'&&(kind!=='furnace'||state.pillEnded))ok=window.AlchemyEconomy.buy(campaign,kind,id);
    if(ok){state.riskResult=randomRisk();render();}return ok;
  }
  window.AlchemyGame = { RUNE_CHANCE, RUNE_DEFS, load: startNewPill, refine, collect: collectPill, riskAtTurn:t=>randomRisk(t).explode, economyAction, chooseOrder, endDay, nextDay, abandonOrder,
    campaign: () => campaign ? JSON.parse(JSON.stringify(campaign)) : null,
    snapshot: () => ({ ...playtestSnapshot(), started: state.started,
    busy: state.busy, pillEnded: state.pillEnded, roundEnded: state.roundEnded,
    endReason: state.pillEndReason, remaining: campaign && !state.orderId ? 0 : MAX_PILLS - state.attempt, target: ORDER_TARGET,
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





