(() => {
  "use strict";

  // ForgeTax reference: grade = turn - 1; after grade 30 retain terminal risk.
  const BREAK_CURVE=[0,.018,.059,.129,.248,.297,.347,.383,.418,.443,.467,.491,.505,.519,.532,.545,.558,.576,.594,.612,.63,.639,.648,.657,.666,.675,.684,.693,.702,.711,.72];
  const RITUAL_CHARGE_TARGET = 9, RITUAL_SAFE_STEPS = 5, GREAT_VALUE_MULT = 1.11;
  function qualityAtTurn(turn){return turn>=60?4:turn>=30?3:turn>=15?2:turn>=5?1:0;}
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
      && Array.isArray(raw.campaign.orders) && [0,2,3,4,5,6,7,8].includes(raw.campaign.orders.length) && Array.isArray(raw.campaign.history)
      && raw.campaign.orders.every(o => o && typeof o.id === 'string' && Number.isFinite(o.target) && ['pending','active','completed','failed','skipped'].includes(o.status))
      && Number.isFinite(raw.target) && (raw.target > 0 || (raw.target === 0 && raw.materials === 1)) && [1,3].includes(raw.materials)
      && raw.state?.pill && Number.isFinite(raw.state.delivered) && Number.isInteger(raw.state.attempt)
      && Array.isArray(raw.state.collected) && Array.isArray(raw.state.logs)
      && Number.isFinite(raw.state.pill.value)
      && Number.isFinite(raw.state.riskResult?.explode)
      && raw.state.attempt >= 0 && raw.state.attempt <= 3 && raw.state.started) saved = raw;
  } catch (_) { /* Storage is optional; a fresh campaign remains playable. */ }
  function hasTool(id){return !!window.AlchemyEconomy?.hasTool(campaign?.economy?.equipped,id);}
  function uses(id){return state.pill.toolUses?.[id]||0;}
  function useTool(id){state.pill.toolUses ||= {};state.pill.toolUses[id]=uses(id)+1;state.pill.toolUsed=true;}
  function valueForBase(base) { return Math.round(base); }
  function ensurePricing() {
    const p = state.pill;
    // Old saves keep their saved value; no retroactive rewards or repricing of stock.
    if (!Number.isFinite(p.baseValue) || p.baseValue < 0) p.baseValue = p.value;
  }
  function repricePill() { ensurePricing(); state.pill.value = valueForBase(state.pill.baseValue); }
  function explosionProtection(){
    if(hasTool('seal')&&!uses('seal'))return {source:'seal',outcome:'damage',name:'镇炉印'};
    if(hasTool('phoenix')&&!uses('phoenix'))return {source:'phoenix',outcome:'hold',name:'返生鼎符（药力×0.6）'};
    return null;
  }
  function refinementProbabilities(){
    const w=window.AlchemyEconomy?.outcomeWeights(campaign?.economy?.equipped)||{big:2,success:12,hold:5,damage:2},total=w.big+w.success+w.hold+w.damage,p=state.riskResult.explode,safeRefines=state.pill.ritualSafe||0,safeRun=safeRefines>0;
    const rulerShift=safeRun?0:(Number(state.riskResult.rulerShift)||0);
    const rawOutcomes={big:(1-p)*w.big/total,success:(1-p)*w.success/total,hold:(1-p)*w.hold/total,damage:(1-p)*w.damage/total,explode:p};
    const outcomes=safeRun?{big:w.big/total,success:w.success/total,hold:w.hold/total,damage:w.damage/total,explode:0}:{...rawOutcomes};
    const protection=explosionProtection();
    if(!safeRun&&protection){outcomes[protection.outcome]+=p;outcomes.explode=0;}
    return {outcomes,rawOutcomes,protection,baseExplosion:p,rulerShift,safeRun,safeRefines,available:state.started&&!state.pillEnded&&!state.roundEnded&&state.pill.turn<100};
  }
  function protectedOutcomeLabel(protection){return protection?.outcome==='damage'?'受损':'维持';}
  function riskDescription(probabilities){
    if(!probabilities.available)return '本炉已结束';
    if(probabilities.safeRun)return `符火护炉，自动连炼剩余 ${probabilities.safeRefines} 次，期间不会炸炉`;
    if(probabilities.protection)return `${probabilities.protection.name}：抽中炸炉时转为${protectedOutcomeLabel(probabilities.protection)}`;
    return '无护炉效果，抽中炉险将炸炉';
  }
  function turnBonus(){return state.pill.toolTurnBonus || 0;}
  function triggerLog(message,tone='good'){state.pill.triggers ||= [];state.pill.triggers.push(message);addLog(message,tone);}
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
    riskResultValue: document.getElementById("riskResultValue"),
    riskDescription: document.getElementById("riskDescription"),
    outcomeList: document.getElementById("outcomeList"),
    refineButton: document.getElementById("refineButton"),
    collectButton: document.getElementById("collectButton"),
    newPillButton: document.getElementById("newPillButton"),
    actionHint: document.getElementById("actionHint"),
    logList: document.getElementById("logList"),
    introModal: document.getElementById("introModal"),
    startButton: document.getElementById("startButton"),
    compactOrderValue: document.getElementById("compactOrderValue"),
    compactStockValue: document.getElementById("compactStockValue"),
    eventTitle: document.getElementById("eventTitle"),
    valueChange: document.getElementById("valueChange"),
    ritualPanel: document.getElementById("ritualPanel"), ritualGrid: document.getElementById("ritualGrid"), ritualStatus: document.getElementById("ritualStatus"),
  };

  let state = null;
  let feedbackTimer = null;
  const telemetry = window.AlchemyTelemetry;
  let decisionSince = Date.now();

  function playtestSnapshot() {
    return { attempt: state.attempt, turn: state.pill.turn, quality: state.pill.quality,
      value: state.pill.value, baseValue:state.pill.baseValue ?? state.pill.value,
      risk: refinementProbabilities().outcomes.explode, delivered: state.delivered,
      day: campaign?.day || 1, orderId: state.orderId || null };
  }

  function randomRisk(turn=state?.pill?.turn||1) {const base=BREAK_CURVE[Math.max(0,Math.min(30,Math.floor(turn)-1))];const pill=state?.pill,E=window.AlchemyEconomy;let risk=base*(E?.toolRisk(campaign?.economy?.equipped,pill)||1);if(pill?.riskDampNext){risk*=pill.riskDampNext;pill.riskDampNext=0;}const raw=Math.max(0,Math.min(.95,risk));const rulerShift=E?.riskRulerShift?.(campaign?.economy?.equipped,pill,raw)||0;return {explode:Math.max(0,raw-rulerShift),rawExplode:raw,rulerShift};}

  function getRitualCharge() {
    const raw = campaign?.economy ? campaign.economy.ritualCharge : state?.ritualCharge;
    return Number.isFinite(raw) ? Math.max(0, Math.min(RITUAL_CHARGE_TARGET, Math.floor(raw))) : 0;
  }
  function setRitualCharge(n) {
    const clamped = Math.max(0, Math.min(RITUAL_CHARGE_TARGET, Math.floor(Number(n) || 0)));
    if (campaign?.economy) campaign.economy.ritualCharge = clamped;
    if (state) state.ritualCharge = clamped;
    return clamped;
  }

  function freshPill() {
    const e=campaign?.economy,carry=e?.ashPool||0,buffer=e?.nextRiskBuffer?1:0;
    if(e){e.ashPool=0;e.nextRiskBuffer=0;}
    return { turn: 1, quality: 0, value: 24, bestTurn: 1, yuanHigh: 24, yuanPool: carry, yuanBonus: 0, yuanNode: 0, ritualSafe: buffer, ritualTotal: 0, ritualActive: false, ritualStep: 0, toolUsed:false, damageSoftened:false, refineCount:0, safeStreak:0, riskPeak:0, fissureTriggers:0, guardCasketUsed:false, yuanFloorUsed:false, riskRulerConverted:0, riskRulerBonus:0 };
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
      completedPills: 0, ritualStep: 0, ritualActive: false, ritualSafe: 0, ritualCharge: 0,
      bestTurn: 1,
      bestValue: 24,
      riskResult: randomRisk(1),
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
    state.logs.unshift({ message, tone, day:campaign?.day||1, orderId:state.orderId||null, source:campaignRules?.active(campaign)?"commission":"forge", attempt:state.attempt });
    state.logs = state.logs.slice(0, 8);
  }

  function render() {
    if(campaign?.phase==='finished'){state.roundEnded=true;state.pillEnded=true;} window.AlchemyCustomers?.bind(campaign);
    const activeOrderForProgress = campaign ? campaignRules.active(campaign) : null;
    const turnProgress = activeOrderForProgress && ORDER_TARGET > 0 ? Math.min(100, (state.delivered / ORDER_TARGET) * 100) : 0;
    const explosionChance = refinementProbabilities().outcomes.explode;
    dom.attemptText.textContent = `${state.attempt} / ${MAX_PILLS}`;
    const activeOrder = campaign ? campaignRules.active(campaign) : null;
    dom.compactOrderValue.textContent = activeOrder ? `${formatNumber(state.delivered)} / ${ORDER_TARGET}` : "—";
    dom.compactStockValue.textContent = activeOrder ? `${Math.max(0, MAX_PILLS - state.attempt)} 包` : "备料";
    document.getElementById("orderGoalLabel").textContent = `/ ${ORDER_TARGET}`;
    if (campaign) {
      const order = activeOrder;
      if (order) {
        document.getElementById("trialTitle").textContent = order.name;
        document.getElementById("trialFlavor").textContent = `${order.client}托付 ${order.materials} 包药材 · 目标药力 ${order.target} · 未成免赔`;
        document.querySelector('.order-panel .panel-kicker').textContent='代炼委托';
        document.querySelector('.target-card').hidden=false;
        document.getElementById('trialRule').hidden=true;
      } else {
        document.getElementById("trialTitle").textContent = "丹药炼制记录";
        document.getElementById("trialFlavor").textContent = "丹药统一收入丹匣，可保留、提交或处理。";
        document.querySelector('.order-panel .panel-kicker').textContent='炼丹记录';
        document.querySelector('.target-card').hidden=true;
        document.getElementById('trialRule').hidden=false;
        document.getElementById('trialRule').textContent='继续炼丹可提高药力。收丹先入匣，再选择交丹、出售或寄售。';
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
      ? (campaign ? (activeOrder ? "本单已结清；可接下一单或回柜台收工。" : "本炉已结束，丹药已留在丹匣中。") : state.delivered >= ORDER_TARGET ? "订单完成！点击重新开始再挑战。" : "原料已用尽，订单未完成。点击重新开始再挑战。")
      : state.pillEnded ? (activeOrder ? "取一包本单药材，投入炉口开炉。" : "取一份储备药材，投入炉口开炉。") : state.pill.turn >= 100 ? "百转已成，收丹入匣即可锁定价值。" : state.pill.ritualSafe > 0
        ? `符火护炉，自动连炼剩余 ${state.pill.ritualSafe} 次，期间不会炸炉。`
        : `动作前炉险 ${percentage(refinementProbabilities().baseExplosion)}，可继续炼化或收丹入匣。`;
    dom.pillName.textContent = state.pill.craftKind?window.AlchemyCrafts.name(state.pill):`${({warm:'温性',cool:'寒性',neutral:'平性'}[state.pill.nature || activeOrder?.nature || 'neutral'])}灵丹`;
    dom.turnValue.textContent = (TURN_NAMES[state.pill.turn] || String(state.pill.turn));
    dom.pillValue.textContent = state.pillEnded && state.pillEndReason === "explode" ? "已损失" : formatNumber(state.pill.value);
    dom.qualityValue.textContent = QUALITY_NAMES[state.pill.quality];
    dom.riskResultValue.textContent = state.pillEnded || state.pill.turn >= 100 ? "--" : percentage(refinementProbabilities().baseExplosion);
    dom.pillVisual.classList.toggle("turn-nine", state.pill.turn >= 100);
    dom.pillVisual.dataset.quality = String(state.pill.quality);
    dom.pillStage.dataset.state = state.pillEnded ? state.pillEndReason : state.pill.turn >= 100 ? "complete" : "active";
    dom.pillAura.style.transform = `scale(${1 + state.pill.quality * 0.06 + state.pill.turn * 0.02})`;
    dom.riskBadge.textContent = state.pillEnded ? (state.pillEndReason === "explode" ? "丹散炉息" : "已收丹") : state.pill.ritualSafe > 0 ? "自动催炼" : `${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转`;
    dom.riskBadge.className = "risk-badge";
    dom.riskDescription.textContent = state.pillEnded ? "本炉已结束" : state.pill.turn >= 100 ? "百转已成，可收丹入匣" : riskDescription(refinementProbabilities());
    const triggerStatus=document.getElementById('toolTriggerStatus');
    if(triggerStatus){triggerStatus.textContent=(state.pill.triggers||[]).slice(-3).join(' → ');triggerStatus.title=(state.pill.triggers||[]).join(' → ');}
    renderOutcomes(explosionChance);
    renderLogs();

    const canRefine = state.started && !state.busy && !state.pillEnded && !state.roundEnded && state.pill.turn < 100;
    dom.refineButton.disabled = !canRefine;
    dom.collectButton.disabled = !state.started || state.busy || state.pillEnded || state.roundEnded;
    dom.newPillButton.disabled = !state.started || state.busy || !state.pillEnded || state.roundEnded;
    dom.restartButton.disabled = state.busy;
    dom.actionHint.textContent = state.pillEnded
      ? (state.roundEnded ? "本局结束，点击“重新开始”再试一次。" : "本炉已结束，点击“再开一炉”。")
      : state.pill.turn >= 100 ? "百转成丹，点击“收丹入匣”。" : state.pill.ritualSafe > 0 ? `符火护炉，自动连炼剩余 ${state.pill.ritualSafe} 次，完成后可收丹。` : "炉险随转数上升；收丹入匣可锁定当前价值。";
    if (state.pillEndReason === "waiting") {
      dom.pillName.textContent = "空炉待药";
      dom.pillValue.textContent = "—";
      dom.qualityValue.textContent = "未起炉";
      dom.riskBadge.textContent = "待投药";
      dom.riskDescription.textContent = "整包投药后开始本炉";
    }
    if (campaign && state.started && (!state.busy || state.pill.ritualSafe > 0)) {
      window.AlchemyEconomy?.ensure(campaign);
      window.AlchemyCounterTrade?.ensure(campaign, campaign.sellers ? null : window.AlchemySaves?.preference('merchant-visit-v205'));
      persistProgress();
    }
    window.dispatchEvent?.(new Event("alchemy:render"));
  }

  function renderOutcomes(chance) {
    dom.outcomeList.innerHTML = `<div class="risk-meter" aria-hidden="true"><div style="width:${state.pillEnded || state.pill.turn >= 100 ? 0 : Math.round(chance * 100)}%"></div></div>`;
  }


  function renderLogs() {
    const groups=[];
    for(const entry of state.logs){const key=entry.day===undefined?'legacy':[entry.day,entry.orderId,entry.attempt].join(':');let group=groups[groups.length-1];if(!group||group.key!==key){group={key,entry,messages:[]};groups.push(group);}group.messages.push(entry);}
    dom.logList.innerHTML=groups.length?groups.map(({entry,messages})=>'<div class="log-entry"><small>'+(entry.day===undefined?'旧炉讯 · 炉次未记录':`第${entry.day}天 · ${entry.source==='commission'?'委托':'炼丹'} · ${entry.attempt?'第'+entry.attempt+'炉':'备料'}`)+'</small>'+messages.map(e=>'<p class="'+e.tone+'">'+e.message+'</p>').join('')+'</div>').join(''):'<p>暂无本次炉讯</p>';
  }

  function setFeedback(message, tone = "", event = "start", value = null, autoStep = 0, autoTotal = 0) {
    const titles = { resume:"回炉续炼", "ritual-complete": "敕火符已成", start: "炉火初起", big: "大成功", success: "炼化成功", hold: "火候维持", damage: "丹体受损", explode: "丹散炉息", complete: "百转成丹", collect: "收丹入匣", win: "委托已成", loss: "本局结束" };
    dom.eventTitle.textContent = (state.pill.craftKind?{damage:"造物受损",explode:"炸炉",complete:"百转造物",collect:"收取入匣"}[event]:null)||titles[event]||"炉火流转";
    dom.valueChange.textContent = typeof value === "number" ? (value === 0 ? "价值持平" : `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`) : value || "";
    dom.eventBanner.textContent = message;
    dom.eventBanner.classList.remove("flash");
    void dom.eventBanner.offsetWidth;
    dom.eventBanner.classList.add("flash");
    dom.pillStage.dataset.tone = tone;
    dom.pillStage.dataset.outcome = event;
    const detail={event,message,value,autoStep,autoTotal,turn:state.pill.turn,quality:state.pill.quality,pillId:state.pill.id||null};
    if (typeof CustomEvent !== 'undefined') window.dispatchEvent?.(new CustomEvent('alchemy:feedback', {detail}));
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
  }

  function alchemyBaseValue(turn, quality, factor=1) {
    const t=turn-1;
    return (24+9*t+2.4*t*t+.09*t*t*t)*(1+quality*.08)*factor;
  }
  function successValuePreview() {
    if(!refinementProbabilities().available || state.busy)return null;
    const p=state.pill, next={...p};
    const bonusTurns=(hasTool('chain')&&((p.successChain||0)+1)%2===0?1:0)+(p.toolTurnBonus||0);
    next.turn=Math.min(100,p.turn+1+bonusTurns);
    next.quality=Math.max(p.qualityFloor||0,qualityAtTurn(next.turn));
    let nextFactor=p.valueFactor??1;
    const peak=Math.max(p.riskPeak||0,state.riskResult?.explode||0);
    if(hasTool('fissure_cone')&&peak>=.3&&(p.fissureTriggers||0)<3)nextFactor*=1.05;
    if(hasTool('slow_plate')&&next.turn>=30)nextFactor*=.92;
    next.value=valueForBase(alchemyBaseValue(next.turn,next.quality,nextFactor));
    const E=window.AlchemyEconomy,currentSale=E.saleValue(campaign,p),sale=E.saleValue(campaign,next);
    const yuanBonus=Number.isFinite(p.yuanBonus)?p.yuanBonus:0;
    return {turn:next.turn,value:next.value,grossValue:E.grossValue(next),yuanBonus,increase:next.value-p.value,currentSale,sale,saleIncrease:sale-currentSale};
  }

  function applyAlchemy(outcome) {
    const isBigSuccess = outcome === "big";
    const turnGain = (isBigSuccess ? 2 : 1)+turnBonus(outcome);state.pill.toolTurnBonus=0;
    state.pill.turn = Math.min(100, state.pill.turn + turnGain);
    if(isBigSuccess)state.pill.valueFactor=(state.pill.valueFactor??1)*GREAT_VALUE_MULT;
    if(hasTool('fissure_cone')&&state.pill.riskPeak>=.3&&state.pill.fissureTriggers<3){state.pill.valueFactor=(state.pill.valueFactor??1)*1.05;state.pill.fissureTriggers++;triggerLog('裂炉锥 · 药力 +5%（'+state.pill.fissureTriggers+'/3）','good');}
    let factor=state.pill.valueFactor??1;
    if(hasTool('slow_plate')&&state.pill.turn>=30)factor*=.92;
    state.pill.baseValue=alchemyBaseValue(state.pill.turn,state.pill.quality,factor);
    repricePill();
    state.pill.bestTurn = Math.max(state.pill.bestTurn, state.pill.turn);
  }

  function applyDamage() {
    ensurePricing();
    const guarded=hasTool('guard_casket')&&!state.pill.guardCasketUsed;
    if(guarded){state.pill.guardCasketUsed=true;triggerLog('护胆匣 · 不退转 · 药力 ×0.92','good');}
    if (campaign?.economy?.furnace !== 2&&!guarded) state.pill.turn = Math.max(1, state.pill.turn - 1);
    const softened=campaign?.economy?.furnace>=1&&(campaign.economy.furnace>=2||!state.pill.damageSoftened);
    if(softened)state.pill.damageSoftened=true;
    state.pill.baseValue=Math.max(8,state.pill.baseValue*(guarded ? .92 : softened ? .85 : .7));
    repricePill();
  }


  function resolveRefine() {
    state.pill.triggers=[];
    state.pill.refineSerial=(state.pill.refineSerial||0)+1;
    state.pill.refineCount=(state.pill.refineCount||0)+1;
    const before = playtestSnapshot();
    const profile = state.riskResult;
    state.pill.riskPeak=Math.max(state.pill.riskPeak||0,profile.explode||0);
    const safeRun = state.pill.ritualSafe > 0;
    if (!safeRun) setRitualCharge(getRitualCharge() + 1);
    const isRitualAuto = safeRun && (state.pill.ritualTotal || 0) > 0;
    const autoStep = isRitualAuto ? Math.max(1, (state.pill.ritualTotal + 1) - state.pill.ritualSafe) : 0;
    const autoTotal = isRitualAuto ? state.pill.ritualTotal : 0;
    const explode = safeRun ? false : Math.random() < profile.explode;
    const roll = Math.random();
    const tool=campaign?.economy?.equipped;
    const w=window.AlchemyEconomy?.outcomeWeights(tool)||{big:2,success:12,hold:5,damage:2};const total=w.big+w.success+w.hold+w.damage;
    let outcome=explode?'explode':roll<w.big/total?'big':roll<(w.big+w.success)/total?'success':roll<(w.big+w.success+w.hold)/total?'hold':'damage';
    if (safeRun) state.pill.ritualSafe--;
    const protection=explosionProtection();
    const protectedByTool=explode&&!!protection;
    if (protectedByTool) window.AlchemyGameFeel?.emit('protection', {source:protection.source, outcome:protection.outcome, tier:'large'});
    if(explode&&protection){
      outcome=protection.outcome;
      if(protection.source==='seal'){useTool('seal');triggerLog('镇炉印 · 挡下炸炉转为受损','good');}
      if(protection.source==='phoenix'){ensurePricing();useTool('phoenix');state.pill.valueFactor=(state.pill.valueFactor??1)*.6;state.pill.baseValue*=.6;repricePill();triggerLog('返生鼎符 · 挡下炸炉转为维持 · 药力 ×0.6','good');}
    }
    if(['big','success','hold'].includes(outcome))state.pill.safeStreak=(state.pill.safeStreak||0)+1;else state.pill.safeStreak=0;
    if(outcome==='hold'&&hasTool('still_incense')){state.pill.riskDampNext=.72;triggerLog('定息香 · 下次炸炉率 -28%','good');}
    if(hasTool('reverse_lamp')&&(protectedByTool||outcome==='damage')){const lampGain=Math.round(before.value*(profile.explode||0)*.35);state.pill.yuanPool=(state.pill.yuanPool||0)+lampGain;triggerLog('逆命灯 · 余火 +'+lampGain,'good');}
    if(outcome==='explode'&&hasTool('ash_box')){
      ensurePricing();
      const ashGain=Math.round(state.pill.baseValue*.25);
      campaign.economy.ashPool=(campaign.economy.ashPool||0)+ashGain;
      triggerLog('灰烬匣 · 下炉余火 +'+ashGain,'good');
    }
    if(hasTool('chain')){state.pill.successChain=['big','success'].includes(outcome)?(state.pill.successChain||0)+1:((hasTool('broken_link')&&outcome==='hold')?(state.pill.successChain||0):0);if(state.pill.successChain>0&&state.pill.successChain%2===0){state.pill.toolTurnBonus=(state.pill.toolTurnBonus||0)+1;triggerLog('双仪环 · 当次多升 1 转','good');}}
    // Real damage marks the pill regardless of equipment; scar-school tools and client preferences read this record.
    if(outcome==='damage'&&!protectedByTool){
      state.pill.scars=Math.min(4,(state.pill.scars||0)+1);
      if(hasTool('repair'))triggerLog('淬火盏 · 本炉炸炉率 -'+(state.pill.scars*15)+'%','good');
      if(hasTool('reverse_fire')){state.pill.toolTurnBonus=Math.max(1,state.pill.toolTurnBonus||0);triggerLog('逆火符 · 下次成丹多升 1 转','good');}
    }
    const guardCasketActive=outcome==='damage'&&hasTool('guard_casket')&&!state.pill.guardCasketUsed;
    if(outcome!=='explode'){const nextTurn=['big','success'].includes(outcome)?Math.min(100,state.pill.turn+(outcome==='big'?2:1)+turnBonus(outcome)):outcome==='damage'&&campaign?.economy?.furnace!==2&&!guardCasketActive?Math.max(1,state.pill.turn-1):state.pill.turn;state.pill.quality=Math.max(state.pill.qualityFloor||0,qualityAtTurn(nextTurn));}

    let feedback = "";
    let feedbackTone = "";
    if (outcome === "big" || outcome === "success") {
      const isBigSuccess = outcome === "big";
      applyAlchemy(outcome);
      const qualityName = QUALITY_NAMES[state.pill.quality];
      feedbackTone = "good";
      if (isBigSuccess) {
        feedback = `大成功！丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转。`;
        addLog(`<strong>大成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质${qualityName}，价值 ${formatNumber(state.pill.value)}。`, "good");
      } else {
        feedback = (state.pill.quality>before.quality ? "品质提升为"+qualityName+"。" : "药力 "+formatNumber(state.pill.value)+"。");
        addLog(`<strong>炼丹成功</strong>：丹转提升至${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，品质${qualityName}，价值 ${formatNumber(state.pill.value)}。`, "good");
      }
    } else if (outcome === "hold") {
      feedback=protectedByTool?'法器自动护丹，火候维持。':'火候维持。';
      addLog('<strong>火候维持</strong>：'+feedback,'');
    } else if (outcome === "damage") {
      applyDamage();
      const turnResult = campaign?.economy?.furnace === 2 ? "凝丹炉保住" : "转数回落至";
      feedback = `丹体受损，${turnResult}${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转。`;
      addLog(`<strong>丹体受损</strong>：${turnResult}${(TURN_NAMES[state.pill.turn] || String(state.pill.turn))}转，价值降为 ${formatNumber(state.pill.value)}。`, "bad");
    } else {
      state.explosions += 1;
      state.pillEnded = true;
      state.pillEndReason = "explode";
      feedback = state.pill.craftKind?"炸炉，器料已损失，未能收取造物。":"炸炉！这颗丹没能留下。";
      feedbackTone = "bad";
      updateRecord();
      addLog("<strong>炸炉</strong>：当前丹药化为炉灰，本炉结束。", "bad");
      if (!activeCommission()) state.roundEnded = true;
    }

    if (!state.pillEnded && state.pill.turn >= 100) {
      state.completedPills += 1;
      updateRecord();
      feedback = "百转成丹！这颗药力得记入炉谱。";
      feedbackTone = "good";
      addLog(`<strong>百转成丹</strong>：${QUALITY_NAMES[state.pill.quality]}，价值 ${formatNumber(state.pill.value)}，请收丹入匣。`, "good");
    }

    if (!state.pillEnded && !safeRun && hasTool('risk_ruler') && (Number(profile.rulerShift) || 0) > 0) {
      const rulerCfg = window.AlchemyEconomy?.RISK_RULER || { ratio: 2, cap: 0.3 };
      const prevConverted = Math.max(0, Number(state.pill.riskRulerConverted) || 0);
      const added = Math.min(Math.max(0, rulerCfg.cap - prevConverted), Number(profile.rulerShift) || 0);
      if (added > 0) {
        const nextConverted = prevConverted + added;
        state.pill.riskRulerConverted = nextConverted >= rulerCfg.cap - 1e-6 ? rulerCfg.cap : nextConverted;
        state.pill.riskRulerBonus = (Number(state.pill.riskRulerBonus) || 0) + added * rulerCfg.ratio;
        const pct = (added * 100).toFixed(1).replace(/\.0$/, '');
        const multStr = (1 + state.pill.riskRulerBonus).toFixed(2);
        const hitCap = state.pill.riskRulerConverted >= rulerCfg.cap - 1e-6;
        triggerLog('归险尺 · 转险 ' + pct + '% → 归元倍率 ×' + multStr + (hitCap ? '（已达上限，本炉失效）' : ''), 'good');
      }
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
      if (outcome === 'damage' && !protectedByTool) {
        if (hasTool('crack_bowl')) { state.pill.yuanPool = (state.pill.yuanPool || 0) + 6; triggerLog('裂纹钵 · 余火 +6', 'good'); }
        if (hasTool('scar_ruler')) { const gain = 3 * (state.pill.scars || 1); state.pill.yuanPool = (state.pill.yuanPool || 0) + gain; triggerLog('伤痕尺 · 余火 +' + gain, 'good'); }
      }
      if (state.pill.value > (state.pill.yuanHigh ?? 24)) {
        let riskYield=profile.explode;
        if(hasTool('pressure_plate'))riskYield*=1.18;
        if(hasTool('red_nail')&&before.value>=120)riskYield*=1.22;
        if(hasTool('fissure_cone')&&before.value>=180)riskYield*=1.15;
        if(hasTool('scorch_seal')&&state.pill.scars)riskYield*=1+.08*Math.min(4,state.pill.scars);
        if(hasTool('ignite_pearl'))riskYield*=1+.05*Math.min(5,state.pill.safeStreak||0);
        state.pill.yuanPool += before.value * riskYield;
        state.pill.yuanHigh = state.pill.value;
      } else state.pill.yuanHigh = Math.max(state.pill.yuanHigh ?? 24, state.pill.value);
      const reachedNode = Math.floor(state.pill.turn / 9);
      while (reachedNode > (state.pill.yuanNode ?? 0)) {
        const rulerBonus = Number(state.pill.riskRulerBonus) || 0;
        if (rulerBonus > 0 && state.pill.yuanPool > 0) {
          const rulerMult = 1 + rulerBonus;
          const payout = Math.round(state.pill.yuanPool * rulerMult);
          state.pill.yuanBonus += payout;
          state.pill.yuanPool = 0;
          state.pill.riskRulerBonus = 0;
          triggerLog('归险尺 · 归元药力 ×' + rulerMult.toFixed(2) + '（+' + formatNumber(payout) + '）', 'good');
        } else {
          state.pill.yuanBonus += Math.round(state.pill.yuanPool);
          state.pill.yuanPool = 0;
        }
        if(hasTool('steady_talisman')&&!state.pill.yuanFloorUsed&&state.pill.yuanBonus<12){state.pill.yuanBonus=12;state.pill.yuanFloorUsed=true;addLog('<strong>稳元符</strong> · 九转归元保底 +12 药力','good');}
        state.pill.yuanNode = (state.pill.yuanNode ?? 0) + 1;
        addLog(`<strong>${state.pill.yuanNode * 9}转归元</strong>：归元药力累计 +${formatNumber(state.pill.yuanBonus)}，收丹后计入售价。`, 'good');
        window.AlchemyGameFeel?.emit('yuan', {node:state.pill.yuanNode, value:state.pill.yuanBonus, tier:'large'});
      }
    }
    if (safeRun) {
      if (state.pill.turn >= 100) state.pill.ritualSafe = 0;
      state.busy = state.pill.ritualSafe > 0;
    }
    updateRecord();
    telemetry?.record("refine_result", playtestSnapshot(), { before, outcome, autoStep });
    if (state.roundEnded) { settleOrder(); telemetry?.finish(playtestSnapshot(), state.delivered >= ORDER_TARGET ? "win" : "loss"); }
    if (ritualDue()) beginRitual();
    decisionSince = Date.now();
    const visualOutcome = state.pill.turn >= 100 && !state.pillEnded ? "complete" : outcome;
    if (autoStep) window.AlchemyGameFeel?.emit('auto', {step:autoStep, outcome:visualOutcome, remaining:state.pill.ritualSafe, tier:'medium'});
    window.AlchemyGameFeel?.emit('refine', {outcome:visualOutcome, tier:visualOutcome==='explode'||visualOutcome==='complete'?'large':'medium'});
    setFeedback(feedback, feedbackTone, visualOutcome, outcome === "explode" ? -before.value : state.pill.value - before.value, autoStep, autoTotal);
    render();
    if(typeof CustomEvent!=='undefined')window.dispatchEvent?.(new CustomEvent('alchemy:refine-result',{detail:{outcome,autoStep,autoTotal}}));
    if (safeRun) {
      if (state.busy) scheduleRitualRefine();
      else document.querySelector('.furnace-fire')?.focus?.({preventScroll:true});
    }
  }

  function refine() {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!state.started || state.busy || state.pillEnded || state.roundEnded || state.pill.turn >= 100 || state.pill.ritualActive) return;
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
  function migrateLegacyState(){if(!activeCommission()&&typeof state.orderId==='string'&&state.orderId.startsWith('S'))state.orderId=null;}
  function nextPillId(){const e=window.AlchemyEconomy.ensure(campaign);e.pillSerial=Number.isSafeInteger(e.pillSerial)&&e.pillSerial>=0?e.pillSerial:0;let id;do{id='P'+(++e.pillSerial);}while(Array.isArray(e.pills)&&e.pills.some(p=>p?.id===id));return id;}
  function lockPillIdentity(){if(!campaign)return;const o=campaignRules.active(campaign);state.pill.id ||= nextPillId();state.pill.nature ||= o?.nature||state.materialNature||'neutral';state.pill.tier ??= o?.tier||state.materialTier||0;}
  function retireLegacyEffects(e) {
    if(e.rulesRevision===164)return;
    const prices={needle:300,burn:360,return:380,ash:400,fusion:440,six:520,guide_red:260,guide_blue:260,guide_moon:260,guide_thunder:260};
    const retired=new Set((e.tools||[]).filter(id=>Object.prototype.hasOwnProperty.call(prices,id)));
    e.tools=(e.tools||[]).filter(id=>!retired.has(id));
    const p=state.pill;
    let refund=[...retired].reduce((sum,id)=>sum+prices[id],0);
    refund+=(e.stock[2]||0)*56;
    e.stock=e.stock.slice(0,2);
    if(state.materialTier===2){
      if((state.pillEnded&&state.pillEndReason==='waiting')||(!state.pillEnded&&!p.spiritUsed))refund+=38;
      state.materialTier=0;
    }
    if(!state.pillEnded && ((p.runes||[]).length||p.toolUses?.ash)){
      const marks=new Set(p.runes||[]);
      let levels=0;
      for(const name of marks)levels+=p.runeLevels?.[name]||(['金纹','星痕'].includes(name)?2:1);
      const legacyBonus=1+levels*.12+(marks.has('金纹') ? .25 : 0)+(marks.has('星痕') ? .35 : 0);
      p.valueFactor=(p.valueFactor??1)*legacyBonus*(1+.15*(p.toolUses?.ash||0));
      p.baseValue=p.value;
    }
    function clean(pill){
      if(!pill)return;
      for(const key of ['runes','runeLevels','runeChoices','returnRune','returnRuneLevel','shield','moonCharge','fusionPending','spiritUsed','fused'])delete pill[key];
      if(pill.tier===2)pill.tier=0;
      if(pill.toolUses)for(const id of Object.keys(prices))delete pill.toolUses[id];
    }
    clean(p);
    delete state.discoveredRunes;
    for(const item of [...(e.pills||[]),...(state.collected||[])])clean(item);
    for(const order of campaign.orders)for(const item of order.submitted||[])clean(item);
    for(const entry of e.consignments||[]){
      clean(entry.pillSnapshot);
      if(entry.tier==='fusion')entry.tierName='旧寄售约定';
    }
    if(refund){e.coins+=refund;e.spent=Math.max(0,e.spent-refund);e.refunded=(e.refunded||0)+refund;window.AlchemyEconomy.recordCash(campaign,'旧法器及药包退款',e.coins-refund,164);addLog('旧法器及药包退回 '+refund+' 铜钱。','good');}
    e.rulesRevision=164;
  }
  function migrateLoop(){const E=window.AlchemyEconomy,e=E.ensure(campaign),o=campaignRules.active(campaign);if(!state.pillEnded)lockPillIdentity();if(e.loopVersion!==143){const pendingSpirit=!state.pillEnded&&state.pill.tier===2&&(!state.pill.spiritUsed);const units=(Number.isInteger(e.stock[2])?e.stock[2]:0)+(pendingSpirit?1:0),refund=units*14;if(refund){e.coins+=refund;e.spent=Math.max(0,e.spent-refund);e.refunded=(e.refunded||0)+refund;E.recordCash(campaign,'药包调价补差',e.coins-refund,143);e.last='灵性药包调价补差 '+refund+' 铜钱';addLog('<strong>药包调价补差</strong>：'+units+'包灵性药包，退回 '+refund+' 铜钱。','good');}e.loopVersion=143;}
    retireLegacyEffects(e);
    window.AlchemyLease?.ensure(campaign);
    if(o&&o.status==='active'){state.roundEnded=false;o.submitted ||= state.collected.map(p=>({...p}));}
  }
  function previewSubmission(id){const o=activeCommission(),e=campaign?.economy,p=Array.isArray(e?.pills)&&e.pills.find(p=>p.id===id);if(!o||!p||p.craftKind||campaign.phase!=='open')return {ok:false};const E=window.AlchemyEconomy,potency=E?.grossValue?E.grossValue(p):Math.round(p.value+(Number.isFinite(p.yuanBonus)?p.yuanBonus:0)),after=state.delivered+potency,complete=after>=o.target;let reward=0;if(complete){const pills=[...(o.submitted||state.collected),p],probe={...o,riskPeak:Math.max(Number(o.riskPeak)||0,...pills.map(x=>Number(x?.riskPeak)||0))};reward=E.commissionRewardWithTools(campaign,probe,pills)+(E.evaluateSpecialTrait(probe,pills)?.bonus||0);}return {ok:true,potency,after,target:o.target,complete,reward};}
  function previewConsignment(id){const e=campaign?.economy,p=e?.pills?.find(p=>p?.id===id);if(!p||!window.AlchemyEconomy?.consignmentEligibility)return {ok:false,reason:'丹药不在丹匣中。'};const q=window.AlchemyEconomy.consignmentEligibility(campaign,p);return {...q,pill:{id:p.id,turn:p.turn,value:window.AlchemyEconomy.grossValue(p)}};}
  function submitPill(id) {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!state.started || state.busy || window.AlchemyInteractionBusy || window.AlchemyScene2D?.busy || window.AlchemyScene2D?.held) return false;
    const quote = previewSubmission(id);
    if (!quote.ok) return false;
    const order = activeCommission();
    const economy = campaign.economy;
    const before = playtestSnapshot();
    const [pill] = economy.pills.splice(economy.pills.findIndex(p => p.id === id), 1);
    state.delivered = quote.after;
    state.collected.push({...pill});
    order.delivered = quote.after;
    order.submitted = state.collected.map(p => ({...p}));
    order.used = state.attempt;
    telemetry?.record('submit', playtestSnapshot(), {before});
    if (quote.complete) {
      campaignRules.resolve(campaign, state.delivered, state.attempt);
      window.AlchemyEconomy.commission(campaign, order, state.collected);
      state.roundEnded = state.pillEnded;
      telemetry?.finish(playtestSnapshot(), 'win');
    } else {
      economy.last = '本次药力 +'+quote.potency+'，本单累计 '+quote.after+' / '+order.target;
    }
    addLog('<strong>交丹</strong>：'+quote.potency+' 药力，累计 '+quote.after+' / '+order.target+'。','good');
    setFeedback(quote.complete?'委托已成，工钱已结。':economy.last,'good',quote.complete?'win':'submit');
    render();
    window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind:'submit',id,complete:quote.complete}}));
    window.AlchemyGameFeel?.emit(quote.complete?'win':'submit',{kind:'submit',id,complete:quote.complete,tier:quote.complete?'large':'medium'});
    return true;
  }
  function startNewPill() {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!state.started || state.busy || !state.pillEnded || state.roundEnded || state.attempt >= MAX_PILLS) return;
    state.attempt += 1;
    state.pill = freshPill();
    const craft=window.AlchemyCrafts?.get(state.craftKind);if(craft){state.pill.craftKind=craft.id;state.pill.craftCost=craft.price;state.pill.valueFactor=craft.multiplier;state.pill.baseValue=24*craft.multiplier;state.pill.value=Math.round(state.pill.baseValue);state.pill.yuanHigh=state.pill.value;}
    if (activeCommission()) state.pill.materialAdvance = state.pill.value;
    lockPillIdentity();
    const palette=window.AlchemyPillPalette;if(palette)state.pill.appearance=palette.pick(state.materialNature||campaignRules?.active(campaign)?.nature||'neutral',campaignRules?.active(campaign)?.id||'stock',state.attempt);
    state.riskResult = randomRisk(1);
    if(state.pill.tier===1){state.pill.quality=1;state.pill.qualityFloor=1;}
    state.pillEnded = false;
    state.pillEndReason = "";
    decisionSince = Date.now();
    telemetry?.record("pill_start", playtestSnapshot());
    addLog(`<strong>再开一炉</strong>：${state.pill.craftKind?window.AlchemyCrafts.name(state.pill):"第 "+state.attempt+" 颗丹药"}开始炼化。`, "good");
    setFeedback("炉火重新点燃。", "good");
    window.AlchemyGameFeel?.emit('furnace-start', {pillId:state.pill.id, tier:'medium'});
    render();
  }

  function startGame(event) {
    if (state && state.busy) return;
    if (saved && event?.currentTarget === dom.startButton) {
      campaign = saved.campaign; campaignRules?.ensure(campaign); campaignRules?.failIfExhausted(campaign); state = saved.state; state.busy = false; window.AlchemyEconomy?.settleConsignments?.(campaign); if(state.pill.toolUsed&&!state.pill.toolUses){state.pill.toolUses={};for(const id of window.AlchemyEconomy?.equippedIds(campaign.economy?.equipped)||[])if(['seal','phoenix'].includes(id))state.pill.toolUses[id]=1;}state.riskResult=randomRisk(state.pill.turn);
      if (state.pillEnded || state.roundEnded || state.pill.turn >= 100) {
        state.pill.ritualActive = false;
        state.pill.ritualSafe = 0;
      }
      const resumedOldFurnace=!state.pillEnded && campaign.economy?.rulesRevision!==164;
      migrateLoop();migrateLegacyState();ensurePricing();
      state.pill.qualityFloor=state.pill.tier===1?1:0;state.pill.quality=Math.max(state.pill.qualityFloor,qualityAtTurn(state.pill.turn));
      ORDER_TARGET = saved.target; MAX_PILLS = saved.materials; saved = null;
      document.body.dataset.screen = "playing"; dom.introModal.classList.add("hidden");
      if (!state.roundEnded) telemetry?.begin(playtestSnapshot());
      setFeedback(resumedOldFurnace ? "旧炉药力已保留。可立即收丹，继续炼化按当前炉险结算。" : "已回到上次停炉的位置。", "good");
      window.dispatchEvent?.(new Event("alchemy:order")); render();
      if (state.pill.ritualActive) beginRitual(true);
      else if (state.pill.ritualSafe > 0 && (state.pill.ritualTotal || 0) > 0 && !state.pillEnded && !state.roundEnded && state.pill.turn < 100) {
        startRitualRefines();
      } else if (ritualDue()) beginRitual();
      return;
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
    if(campaign){migrateLoop();migrateLegacyState();}
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
  function ritualDue() {
    const {ritualSafe} = state.pill;
    return !state.pillEnded && state.pill.turn < 100 && ritualSafe === 0 && getRitualCharge() >= RITUAL_CHARGE_TARGET;
  }
  // Each timeout settles one result. The saved remainder always describes the next turn.
  function scheduleRitualRefine() {
    const pill = state.pill;
    window.setTimeout(() => {
      if (state.pill === pill && state.busy && pill.ritualSafe > 0) resolveRefine();
    }, 850);
  }
  function startRitualRefines() {
    mountRitual();
    window.AlchemyRitualBrush.seal(state.pill);
    dom.ritualPanel.classList.add('hidden');
    state.busy = true;
    setFeedback(`符火护炉，自动连炼剩余 ${state.pill.ritualSafe} 次，期间不会炸炉。`, 'good', 'ritual-complete');
    render();
    scheduleRitualRefine();
  }
  function mountRitual() {
    const host = document.querySelector('.engine-viewport');
    if (host && dom.ritualPanel.parentElement !== host && typeof host.append === 'function') host.append(dom.ritualPanel);
  }

  function beginRitual(resume = false) {
    const pill = state.pill;
    mountRitual();
    window.AlchemyGameFeel?.emit('ritual', {resume, tier:'large'});
    if (!window.AlchemyRitualBrush?.begin) {
      // Logic-only harnesses do not mount the brush UI; keep the simulation testable.
      pill.ritualActive = false;
      pill.ritualSafe = 0;
      pill.ritualTotal = 0;
      setRitualCharge(0);
      return;
    }
    pill.ritualActive = true;
    if (!resume) {
      delete pill.ritualInk;
      pill.ritualStep = 0;
    }
    dom.ritualPanel.classList.remove('hidden');
    window.AlchemyRitualBrush.begin(pill, persistProgress, () => {
      if (state.pill !== pill || !pill.ritualActive || state.pillEnded) return;
      pill.ritualActive = false;
      setRitualCharge(0);
      pill.ritualSafe = RITUAL_SAFE_STEPS;
      pill.ritualTotal = RITUAL_SAFE_STEPS;
      window.AlchemyGameFeel?.emit('ritual-complete', {tier:'large'});
      startRitualRefines();
    });
    render();
  }
  dom.refineButton.addEventListener("click", refine);
  function collectPill() {
    if(window.AlchemyDialogue?.blocking)return false;
    if(!state.started||state.busy||state.pillEnded||state.pill.ritualActive)return false;
    ensurePricing();
    if(!state.pill.craftKind&&hasTool('breath_pearl')&&(state.pill.yuanPool||0)>0){const converted=Math.min(18,Math.max(1,Math.round(state.pill.yuanPool*.2)));state.pill.baseValue+=converted;state.pill.yuanPool=0;repricePill();triggerLog('纳息珠 · 余火转药力 +'+converted,'good');}
    lockPillIdentity();const before=playtestSnapshot(),o=campaignRules.active(campaign);
    if(!window.AlchemyEconomy.storePill(campaign,state.pill,o)){setFeedback('丹匣记录异常，炉内丹药已保留。','bad');render();return false;}
    if(!state.pill.craftKind&&hasTool('pattern_tray')&&(state.pill.scars||0)>0&&!state.pill.patternTrayUsed){state.pill.patternTrayUsed=true;campaign.economy.nextRiskBuffer=1;triggerLog('回纹托 · 下炉首炼免炸炉','good');}
    const stored=campaign.economy.pills.find(p=>p.id===state.pill.id);
    if(stored)stored.refinement={version:1,pill:JSON.parse(JSON.stringify(state.pill)),nextRisk:state.riskResult.explode,nextRulerShift:Number.isFinite(state.riskResult.rulerShift)?state.riskResult.rulerShift:0,equipped:window.AlchemyEconomy.equippedIds(campaign.economy.equipped)};
    const id=state.pill.id;state.pillEnded=true;state.pillEndReason='collect';state.roundEnded=o? !activeCommission() : true;
    telemetry?.record('collect',playtestSnapshot(),{before,decisionMs:Date.now()-decisionSince});addLog('<strong>收丹入匣</strong>：药力 '+formatNumber(state.pill.value+(state.pill.yuanBonus||0))+'，可在丹匣选丹交付、出售或寄售。','good');setFeedback(state.pill.craftKind?'造物已收纳，可保留或出售。':o?'丹药已收入丹匣。交丹后才计入委托。':'丹药已收入丹匣，可出售或寄售。','good','collect');render();window.AlchemyGameFeel?.emit('collect',{id,tier:'medium'});if(typeof CustomEvent!=='undefined'){window.dispatchEvent(new CustomEvent('alchemy:pill-stored',{detail:{stored:true,id}}));window.dispatchEvent(new CustomEvent('alchemy:world-collect',{detail:{stored:true,id}}));}return true;
  }
  dom.collectButton.addEventListener("click", collectPill);
  function canReturnPill(id) {
    const fail=reason=>({ok:false,reason});
    if(!campaign||!state.started||campaign.phase!=='open')return fail('营业中才能回炉。');
    if(window.AlchemyDialogue?.blocking||state.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy)return fail('正在处理当前动作，请稍候。');
    if(window.AlchemyScene2D?.held)return fail('先放回手中物件。');
    if(!state.pillEnded)return fail('先收取炉内丹药，空炉后才能回炉。');
    const list=campaign.economy?.pills;
    if(!Array.isArray(list))return fail('药匣记录异常，暂不能回炉。');
    const p=list.find(p=>p?.id===id);
    if(!p)return fail('这颗丹已不在药匣中。');
    if(p.craftKind)return fail('目前仅丹药支持回炉。');
    if(!Number.isInteger(p.turn)||p.turn<1||p.turn>=100)return fail(p.turn>=100?'百转已成，无需回炉。':'丹药记录不完整。');
    if(!Number.isFinite(p.value)||p.value<=0)return fail('丹药记录异常，暂不能回炉。');
    return {ok:true,reason:''};
  }
  function returnPill(id) {
    if(!canReturnPill(id).ok)return false;
    const e=campaign.economy,index=e.pills.findIndex(p=>p.id===id),stored=e.pills[index],clone=p=>JSON.parse(JSON.stringify(p));
    let history=stored.refinement;
    // The last collected pill in an older save still has its full furnace record.
    if(!history&&state.pill.id===id&&state.pillEndReason==='collect')history={version:1,pill:state.pill,nextRisk:state.riskResult.explode,nextRulerShift:Number.isFinite(state.riskResult.rulerShift)?state.riskResult.rulerShift:0,equipped:window.AlchemyEconomy.equippedIds(e.equipped)};
    const exact=history?.version===1&&history.pill?.id===id&&history.pill.turn===stored.turn;
    let pill;
    if(exact)pill=clone(history.pill);
    else {
      // Legacy inventory has no complete trigger history. Do not grant old one-shot benefits again.
      pill={turn:stored.turn,quality:stored.quality,value:stored.value,baseValue:Number.isFinite(stored.baseValue)?stored.baseValue:stored.value,valueFactor:Math.max(.001,Math.min(1,(Number.isFinite(stored.baseValue)&&stored.baseValue>0?stored.baseValue:stored.value)/alchemyBaseValue(stored.turn,stored.quality||0))),bestTurn:stored.turn,
        yuanHigh:Number.isFinite(stored.baseValue)?stored.baseValue:stored.value,yuanPool:0,yuanNode:Math.floor(stored.turn/9),yuanBonus:stored.yuanBonus||0,
        ritualSafe:0,ritualActive:false,ritualStep:0,refineSerial:0,refineCount:0,toolUsed:true,toolUses:{seal:1,phoenix:1},
        damageSoftened:true,guardCasketUsed:true,yuanFloorUsed:true,patternTrayUsed:true,fissureTriggers:3,safeStreak:0,successChain:0,scars:stored.scars||0,riskPeak:stored.riskPeak||0,riskRulerConverted:window.AlchemyEconomy?.RISK_RULER?.cap??.3,riskRulerBonus:0};
    }
    // Inventory is authoritative for identity and visible values, including material advances.
    for(const key of ['id','turn','quality','value','nature','appearance','materialAdvance','tier'])if(stored[key]!==undefined)pill[key]=stored[key];
    if(!Number.isFinite(pill.baseValue))pill.baseValue=stored.value;
    if(!Number.isFinite(pill.valueFactor)||pill.valueFactor<=0)pill.valueFactor=1;
    pill.yuanBonus=Number.isFinite(stored.yuanBonus)?stored.yuanBonus:0;
    pill.ritualActive=false;pill.ritualSafe=0;pill.ritualTotal=0;delete pill.craftKind;delete pill.craftCost;
    const order=activeCommission();
    e.pills.splice(index,1);state.pill=pill;state.pillEnded=false;state.pillEndReason='';state.roundEnded=false;state.busy=false;state.craftKind=null;
    state.materialNature=pill.nature||'neutral';state.materialTier=pill.tier||0;
    if(!order){ORDER_TARGET=0;MAX_PILLS=1;state.orderId=null;state.attempt=1;state.delivered=0;state.collected=[];}
    const equipped=window.AlchemyEconomy.equippedIds(e.equipped);
    state.riskResult=exact&&Number.isFinite(history.nextRisk)&&history.nextRisk>=0&&history.nextRisk<=.95&&JSON.stringify(equipped)===JSON.stringify(history.equipped)
      ?{explode:history.nextRisk,rulerShift:Number.isFinite(history.nextRulerShift)?history.nextRulerShift:0}:randomRisk();
    decisionSince=Date.now();updateRecord();
    addLog('<strong>回炉续炼</strong>：'+pill.turn+'转丹药回到炉中，药力 '+formatNumber(pill.value+(pill.yuanBonus||0))+'，未消耗新药材。','good');
    setFeedback('丹药已回炉，可继续炼制。','good','resume',0);render();
    window.AlchemyViewState?.navigate('work',{workMode:'furnace',internal:true});
    window.AlchemyGameFeel?.emit('loaded',{kind:'pill',resumed:true,tier:'medium'});
    window.dispatchEvent?.(new CustomEvent('alchemy:pill-returned',{detail:{id,legacy:!exact}}));
    (typeof requestAnimationFrame==='function'?requestAnimationFrame:window.setTimeout)(()=>document.querySelector('.furnace-fire')?.focus?.({preventScroll:true}),0);
    return true;
  }
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

  function applyFailedContract(o){
    if(!o||o.status!=='failed'||!window.AlchemyEconomy?.hasTool(campaign?.economy?.equipped,'failed_contract'))return;
    const refund=Math.max(0,Math.floor((o.returned||0)*4));
    if(refund>0)window.AlchemyEconomy.credit(campaign,refund,'败炉契返还',o.id);
    campaign.economy.failedContractRelief=(campaign.economy.failedContractRelief||0)+1;
    campaign.economy.nextOrderTargetPenalty=Math.min(.25,(campaign.economy.nextOrderTargetPenalty||0)+.1);
    campaign.economy.last='败炉契：'+(refund>0?'返还 '+refund+' 铜钱，':'')+'次日委托目标降10%（累计降'+Math.round(campaign.economy.nextOrderTargetPenalty*100)+'%）。';
    addLog('<strong>败炉契</strong> · '+(refund>0?'未用客料返 '+refund+' 铜钱，':'')+'次日委托目标降10%（上限25%）。','good');
  }

  function settleOrder() {
    if(!campaign)return;const o=campaignRules.active(campaign);if(!o)return;
    campaignRules.resolve(campaign,state.delivered,state.attempt);
    applyFailedContract(o);
    window.AlchemyEconomy?.commission(campaign,o,state.collected);
  }
  function chooseOrder(id) {
    if(window.AlchemyDialogue?.blocking)return false;
    if(window.AlchemyMerchantVisit?.atCounter||window.AlchemyCraftBuyer?.atCounter||(!state.pillEnded&&state.pill.craftKind))return false;
    if(!campaign||state.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held||activeCommission()||campaign.phase!=='open')return false;
    if(!campaign.orders.some(o=>o.id===id&&o.status==='pending'))return false;
    const live=!state.pillEnded,previous=state;
    if(!campaignRules.accept(campaign,id))return false;const o=activeCommission();ORDER_TARGET=o.target;MAX_PILLS=o.materials;
    state=createState();state.started=true;state.orderId=o.id;state.pillEnded=!live;state.pillEndReason=live?'':'waiting';
    if(live){state.pill=previous.pill;state.riskResult=previous.riskResult;state.logs=previous.logs;state.bestTurn=previous.bestTurn;state.bestValue=previous.bestValue;}
    decisionSince=Date.now();telemetry?.begin(playtestSnapshot());setFeedback(o.client+'的委托已接下，药材已备齐。','good');window.AlchemyGameFeel?.emit('order',{orderId:o.id,tier:'medium'});window.dispatchEvent(new Event('alchemy:order'));render();return true;
  }
  function endDay() {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!campaign || state.busy || window.AlchemyInteractionBusy || !state.pillEnded || !campaignRules.settle(campaign)) return false;
    const receipt = window.AlchemyLease?.collectRent(campaign);
    if (receipt) campaign.history[campaign.history.length - 1].rent = receipt;
    render(); window.AlchemyGameFeel?.emit('settle',{day:campaign.day,tier:'medium'}); return true;
  }
  function nextDay() {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!campaign || !campaignRules.next(campaign)) return false;
    state.roundEnded = true; state.pillEnded = true;
    state.delivered = 0; state.attempt = 0; state.orderId = null; state.collected = [];
    state.pill = freshPill(); state.pillEndReason = "waiting";
    window.dispatchEvent?.(new Event("alchemy:order")); window.AlchemyGameFeel?.emit('day-next',{day:campaign.day,tier:'medium'}); render(); return true;
  }
  function abandonOrder() {
    if(window.AlchemyDialogue?.blocking)return false;
    if (!campaign || state.busy || window.AlchemyInteractionBusy || !state.pillEnded || state.roundEnded) return false;
    const o = activeCommission();
    if (!campaignRules.resolve(campaign, state.delivered, state.attempt, true)) return false;
    applyFailedContract(o);
    state.roundEnded = true; telemetry?.finish(playtestSnapshot(), "abandoned");
    setFeedback("本单已终止，未用本单料已退还，丹匣丹药保留。", "", "loss"); window.AlchemyGameFeel?.emit('loss',{tier:'medium'}); render(); return true;
  }
  function merchantAction(action,index) {
    if (!campaign || campaign.phase==='finished' || !state.started || state.busy || window.AlchemyInteractionBusy || window.AlchemyScene2D?.held || window.AlchemyScene2D?.busy || window.AlchemyDialogue?.blocking) return false;
    if (['arrive','recall','call'].includes(action) && (!state.pillEnded || window.AlchemyCraftBuyer?.atCounter)) return false;
    if (!window.AlchemyCounterTrade.change(campaign,action,index)) return false;
    render();
    return true;
  }
  function economyAction(kind,id,nature='neutral'){
    if(window.AlchemyDialogue?.blocking)return false;if(!campaign||campaign.phase==='finished'||state.busy||window.AlchemyInteractionBusy)return false;window.AlchemyEconomy.ensure(campaign);let ok=false;
    if(kind==='submit')return submitPill(id);
    if(kind==='claimPostscript'){ok=!!window.AlchemyEconomy.claimPostscript?.(campaign,id);if(ok){persistProgress();render();}return ok;}
    if(kind==='dismissReaction'){const o=campaign.orders?.find(x=>x.id===id);if(!o)return false;o.reactionDismissed=true;persistProgress();render();return true;}
    if(kind==='craftVisit'||kind==='craftInspect'){const o=campaign.economy.craftMarket?.offer;if(campaign.phase!=='open'||campaign.activeId||!state.pillEnded||!o||o.status!=='waiting'||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held)return false;o.phase=kind==='craftVisit'?'counter':'trade';render();return true;}
    if(kind==='craftSale'||kind==='craftDismiss'){if(window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held||campaign.activeId||!state.pillEnded)return false;ok=kind==='craftSale'?window.AlchemyEconomy.craftSale(campaign,id):window.AlchemyEconomy.dismissCraftOffer(campaign);if(ok){render();window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind,id}}));}return ok;}
    if(kind==='useCraft'){const d=window.AlchemyCrafts?.get(id),e=campaign.economy;if(!d||campaign.phase!=='open'||campaign.activeId||!state.pillEnded||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held||!e.craftStock[id])return false;e.craftStock[id]--;ORDER_TARGET=0;MAX_PILLS=1;state=createState();state.started=true;state.roundEnded=false;state.pillEnded=true;state.pillEndReason='waiting';state.orderId=null;state.craftKind=id;window.dispatchEvent(new Event('alchemy:order'));render();return true;}

    if(kind==='sell'){if(window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held)return false;ok=window.AlchemyEconomy.sale(campaign,id)!==false;if(ok)window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind:'sell',id}}));}
    else if(kind==='consign'){if(window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held)return false;ok=!!window.AlchemyEconomy.consign(campaign,id);if(ok)window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind:'consign',id}}));}
    else if (kind === 'leasePurchase') {
      if (window.AlchemyScene2D?.busy || window.AlchemyScene2D?.held ||
          !window.AlchemyLease?.buyPill(campaign, id)) return false;
      render();
      window.dispatchEvent(new CustomEvent('alchemy:inventory-action',{detail:{kind,id}}));
      return true;
    }
    else if(kind==='equip'){const e=campaign.economy;if(!state.pillEnded||(!e.tools.includes(id)&&id!==null))return false;const ids=window.AlchemyEconomy.equippedIds(e.equipped);if(id===null)e.equipped=[];else if(ids.includes(id))e.equipped=ids.filter(t=>t!==id);else{if(ids.length>=window.AlchemyEconomy.EQUIP_SLOTS)return false;e.equipped=[...ids,id];}ok=true;}
    else if(kind==='reservePack'||kind==='reserveHerb'){if(campaign.phase!=='open'||campaignRules.active(campaign)||!state.pillEnded)return false;const e=campaign.economy;if(kind==='reserveHerb'){nature=id;if(!['warm','cool','neutral'].includes(nature)||!e.herbs[nature])return false;e.herbs[nature]--;id=0;}else{if(!Number.isInteger(id)||id<0||id>=window.AlchemyEconomy.PRICES.length||!e.stock[id])return false;e.stock[id]--;}ORDER_TARGET=0;MAX_PILLS=1;state=createState();state.started=true;state.roundEnded=false;state.pillEnded=true;state.pillEndReason='waiting';state.orderId=null;state.materialTier=kind==='reservePack'?id:0;state.materialNature=nature;window.dispatchEvent?.(new Event('alchemy:order'));ok=true;}
    else if(campaign.phase==='open'&&(kind!=='furnace'||state.pillEnded)){
      const trade=window.AlchemyCounterTrade;
      if (trade && (!trade.offered(campaign,kind,id) || window.AlchemyScene2D?.held || window.AlchemyScene2D?.busy)) return false;
      ok=window.AlchemyEconomy.buy(campaign,kind,id);
      if (ok) trade?.bought(campaign,kind,id);
    }
    if(ok){state.riskResult=randomRisk();render();if(['material','tool','furnace','craftMaterial'].includes(kind)&&typeof CustomEvent!=='undefined')window.dispatchEvent?.(new CustomEvent('alchemy:purchase',{detail:{kind}}));if(ok)window.AlchemyGameFeel?.emit(kind==='equip'?'equipment':kind==='reservePack'||kind==='reserveHerb'?'material':'purchase',{kind,id,tier:kind==='furnace'||kind==='equip'?'medium':'small'});}return ok;
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
    return {ok:true,reason:'',next};
  }
  function replaceEquipment(oldId,newId){
    if(window.AlchemyDialogue?.blocking)return false;
    const result=canReplaceEquipment(oldId,newId);if(!result.ok)return false;if(oldId===newId)return true;
    campaign.economy.equipped=result.next;
    if(typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent('alchemy:equipment-replaced',{detail:{oldId,newId}}));
    state.riskResult=randomRisk();render();return true;
  }
  function canLeaveMainMenu() {
    if (!state?.started || !campaign) return {ok:true, reason:''};
    const viewPhase = window.AlchemyViewState?.snapshot?.().phase;
    if (window.AlchemyDialogue?.blocking || state.busy || window.AlchemyInteractionBusy || window.AlchemyScene2D?.busy || window.AlchemyScene2D?.held || window.AlchemyOpening?.active || (viewPhase && viewPhase !== 'idle')) {
      return {ok:false, reason:'当前操作完成后才能返回主菜单。'};
    }
    return {ok:true, reason:''};
  }
  function saveNow() {
    const gate = canLeaveMainMenu();
    if (!gate.ok) return {...gate, saved:false};
    if (!campaign || !state?.started) return {ok:true, saved:false, reason:''};
    return persistProgress() ? {ok:true, saved:true, reason:''} : {ok:false, saved:false, reason:window.AlchemySaves?.error || '存档未能保存，请检查浏览器存储空间或隐私设置。'};
  }
  function persistProgress() {
    const progress = {version:1,campaign,state,target:ORDER_TARGET,materials:MAX_PILLS};
    try {
      if (window.AlchemySaves) return window.AlchemySaves.write(progress);
      if (!window.localStorage) return false;
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
      return true;
    } catch (_) {
      return false;
    }
  }
  window.AlchemyGame = { merchantAction, canReturnPill, returnPill, successValuePreview, submit:submitPill,previewSubmission,previewConsignment,canReplaceEquipment, replaceEquipment, canLeave:canLeaveMainMenu, saveNow, refinementProbabilities, valueForBase, load: startNewPill, refine, collect: collectPill, riskAtTurn:t=>randomRisk(t).explode, economyAction, chooseOrder, endDay, nextDay, abandonOrder,
    campaign: () => campaign ? JSON.parse(JSON.stringify(campaign)) : null,
    snapshot: () => {
      const E=window.AlchemyEconomy,rulerCfg=E?.RISK_RULER||{cap:.3};
      const rulerConverted=Math.max(0,Number(state.pill.riskRulerConverted)||0);
      const yuanBonus=Number.isFinite(state.pill.yuanBonus)?state.pill.yuanBonus:0;
      const grossValue=E?.grossValue?E.grossValue(state.pill):Math.round(state.pill.value+yuanBonus);
      return { ...playtestSnapshot(), yuanBonus, yuanPool:Math.round(state.pill.yuanPool||0), grossValue, scars:state.pill.scars||0, ...(state.pill.craftKind?{craftKind:state.pill.craftKind,craftCost:state.pill.craftCost}:{}), materialAdvance:state.pill.materialAdvance||0, nature:state.pill.nature||(campaign?campaignRules.active(campaign)?.nature:null)||'neutral',tier:state.pill.tier||0,pillId:state.pill.id||null,commission:activeCommission(), ...(state.pill.appearance?{appearance:state.pill.appearance}:{}), started: state.started,
      busy: state.busy, ritualActive: !!state.pill.ritualActive, ritualRemaining: state.pill.ritualSafe || 0, ritualTotal: state.pill.ritualTotal || 0, ritualCharge: getRitualCharge(), ritualChargeTarget: RITUAL_CHARGE_TARGET, pillEnded: state.pillEnded, roundEnded: state.roundEnded,
      endReason: state.pillEndReason, remaining: campaign&&campaignRules.active(campaign)?.status==='active' ? Math.max(0,MAX_PILLS-state.attempt) : 0, target: ORDER_TARGET,
      toolProgress:{uses:{...state.pill.toolUses},scars:state.pill.scars||0,chain:state.pill.successChain||0,valueFactor:state.pill.valueFactor??1,triggers:[...(state.pill.triggers||[])],guardCasketUsed:!!state.pill.guardCasketUsed,yuanFloorUsed:!!state.pill.yuanFloorUsed,fissureTriggers:state.pill.fissureTriggers||0,refineCount:state.pill.refineCount||0,riskRulerConverted:rulerConverted,riskRulerBonus:Number(state.pill.riskRulerBonus)||0,riskRulerCap:rulerCfg.cap,riskRulerExpired:rulerConverted>=rulerCfg.cap-1e-6},toolUsed:!!state.pill.toolUsed,campaignEnabled: !!campaign, collected: state.collected,
      order: campaign ? campaignRules.active(campaign) : null };
    } };
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
