(() => {
  "use strict";

  const RISK_RESULTS = [
    { explode: 0.02 }, { explode: 0.04 }, { explode: 0.05 }, { explode: 0.07 },
    { explode: 0.09 }, { explode: 0.12 }, { explode: 0.15 }, { explode: 0.18 },
    { explode: 0.21 }, { explode: 0.24 },
  ];

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
      value: state.pill.value, runes: [...state.pill.runes], shield: state.pill.shield,
      risk: state.pill.shield ? 0 : state.riskResult.explode, delivered: state.delivered,
      day: campaign?.day || 1, orderId: state.orderId || null };
  }

  function randomRisk() {
    return RISK_RESULTS[Math.floor(Math.random() * RISK_RESULTS.length)];
  }

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
      riskResult: randomRisk(),
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
      : state.pillEnded ? "取一包委托药材，投入炉口开炉。" : state.pill.turn >= 9 ? "九转已成，收丹交付即可锁定价值。" : state.pill.shield
        ? "护丹已准备：下一次炸丹将转为保持。" : `下一次炸丹概率 ${percentage(explosionChance)}，可继续炼化或收丹交付。`;
    const activeOrder = campaign && (campaignRules.active(campaign) || (campaign.selfOrder?.id===state.orderId?campaign.selfOrder:campaign.orders.find(o => o.id === state.orderId)));
    dom.pillName.textContent = `${({warm:'温性',cool:'寒性',neutral:'平性'}[activeOrder?.nature || 'neutral'])}灵丹`;
    dom.turnValue.textContent = TURN_NAMES[state.pill.turn];
    dom.pillValue.textContent = state.pillEnded && state.pillEndReason === "explode" ? "已损失" : formatNumber(state.pill.value);
    dom.qualityValue.textContent = QUALITY_NAMES[state.pill.quality];
    dom.runeSummary.textContent = state.pill.runes.length ? state.pill.runes.join(" / ") : "尚未显现";
    dom.riskResultValue.textContent = state.pillEnded || state.pill.turn >= 9 ? "--" : percentage(explosionChance);
    dom.pillVisual.classList.toggle("turn-nine", state.pill.turn >= 9);
    dom.pillVisual.dataset.quality = String(state.pill.quality);
    dom.pillStage.dataset.state = state.pillEnded ? state.pillEndReason : state.pill.turn >= 9 ? "complete" : "active";
    const orbitPositions = [[-88, 0], [88, 0], [-75, 55], [75, 55], [-75, -55], [75, -55]];
    dom.runeOrbit.innerHTML = state.pill.runes.map((rune, index) => {
      const [x, y] = orbitPositions[index % orbitPositions.length];
      return `<span class="orbit-rune" style="--x:${x}px;--y:${y}px;--rune-color:${RUNE_COLORS[rune]}">${rune}</span>`;
    }).join("");
    dom.pillAura.style.transform = `scale(${1 + state.pill.quality * 0.06 + state.pill.turn * 0.02})`;
    dom.pillAura.style.background = state.pill.runes.length
      ? `radial-gradient(circle, ${RUNE_COLORS[state.pill.runes[state.pill.runes.length - 1]] || "#eac8ff"}55, transparent 68%)`
      : "radial-gradient(circle, rgba(183, 204, 135, 0.22), transparent 68%)";
    dom.riskBadge.textContent = state.pillEnded ? (state.pillEndReason === "explode" ? "丹散炉息" : "已收丹") : state.pill.shield ? "护丹生效" : `${TURN_NAMES[state.pill.turn]}转`;
    dom.riskBadge.className = "risk-badge";
    dom.riskDescription.textContent = state.pillEnded ? "本炉已结束" : state.pill.turn >= 9 ? "九转已成，可收丹交付" : state.pill.shield ? "护丹会挡下下一次炼化中的炸丹" : "收丹可锁定当前价值";
    renderOutcomes(explosionChance);
    renderRunes();
    renderLogs();

    const canRefine = !state.pill.runeChoices?.length && state.started && !state.busy && !state.pillEnded && !state.roundEnded && state.pill.turn < 9;
    dom.refineButton.disabled = !canRefine;
    dom.collectButton.disabled = !!state.pill.runeChoices?.length || !state.started || state.busy || state.pillEnded || state.roundEnded;
    dom.newPillButton.disabled = !state.started || state.busy || !state.pillEnded || state.roundEnded;
    dom.restartButton.disabled = state.busy;
    dom.actionHint.textContent = state.pillEnded
      ? (state.roundEnded ? "本局结束，点击“重新开始”再试一次。" : "本炉已结束，点击“再开一炉”。")
      : state.pill.turn >= 9 ? "九转成丹，点击“收丹交付”。" : "每次炼丹后重新生成炸丹概率；收丹可锁定当前价值。";
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
    dom.outcomeList.innerHTML = `<div class="risk-meter" aria-hidden="true"><div style="width:${state.pillEnded || state.pill.turn >= 9 ? 0 : Math.round(chance * 100)}%"></div></div>`;
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
        <span>已发现</span>
      </div>
    `).join("");
  }

  function renderLogs() {
    dom.logList.innerHTML = state.logs.length
      ? state.logs.map((entry) => `<div class="log-entry ${entry.tone}">${entry.message}</div>`).join("")
      : '<div class="log-entry">炉火等待第一道指令。</div>';
  }

  function setFeedback(message, tone = "", event = "start", value = null) {
    const titles = { start: "炉火初起", big: "大成功", success: "炼化成功", hold: "火候维持", damage: "丹体受损", explode: "丹散炉息", complete: "九转成丹", collect: "收丹入匣", win: "委托已成", loss: "本局结束", shield: "护丹显灵", fusion: "丹纹融合" };
    dom.eventTitle.textContent = titles[event] || "炉火流转";
    dom.valueChange.textContent = typeof value === "number" ? (value === 0 ? "价值持平" : `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value))}`) : value || "";
    dom.eventBanner.textContent = message;
    dom.eventBanner.classList.remove("flash");
    void dom.eventBanner.offsetWidth;
    dom.eventBanner.classList.add("flash");
    dom.pillStage.dataset.tone = tone;
    dom.pillStage.dataset.outcome = event;
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
    const turnGain = isBigSuccess ? 2 : 1;
    const valueMultiplier = isBigSuccess ? 2.5 : 1.5;
    state.pill.turn = Math.min(9, state.pill.turn + turnGain);
    const qualityValueBoost = 1 + state.pill.quality * 0.03;
    state.pill.value = Math.max(8, Math.round(state.pill.value * valueMultiplier * qualityValueBoost));
    state.pill.bestTurn = Math.max(state.pill.bestTurn, state.pill.turn);
  }

  function applyDamage() {
    state.pill.turn = Math.max(1, state.pill.turn - 1);
    const protectedValue = state.pill.runes.includes("青纹") || state.pill.runes.includes("金纹");
    state.pill.value = Math.max(8, Math.round(state.pill.value * (campaign?.economy?.furnace>=1&&!state.pill.damageSoftened?(state.pill.damageSoftened=true,protectedValue ? .95 : .85):(protectedValue ? 0.9 : 0.7))));
  }

  function tryAddRune() {
    if(campaignRules?.active(campaign)?.tier===2 && !state.pill.spiritUsed){const choices=['赤纹','青纹','月纹','雷纹'].filter(r=>!state.pill.runes.includes(r));state.pill.spiritUsed=true;if(choices.length){state.pill.runeChoices=choices.sort(()=>Math.random()-.5).slice(0,2);return null;}}
    const chance = 0.25;
    if (Math.random() > chance) return null;
    const pool = ["赤纹", "青纹", "月纹", "雷纹"];
    const available = pool.filter((rune) => !state.pill.runes.includes(rune));
    if (!available.length) return null;
    const rune = available[Math.floor(Math.random() * available.length)];
    state.pill.runes.push(rune);
    state.pill.value = Math.round(state.pill.value * 1.18);
    return tryFusion() || rune;
  }

  function tryFusion() {
    if (state.pill.runes.length < 2) return null;
    for (const [key, fusion] of Object.entries(FUSIONS)) {
      const needed = key.split("|");
      if (needed.every((rune) => state.pill.runes.includes(rune)) && !state.pill.runes.includes(fusion.name)) {
        state.pill.runes = state.pill.runes.filter((rune) => !needed.includes(rune));
        state.pill.runes.push(fusion.name);
        state.pill.value = Math.round(state.pill.value * fusion.multiplier);
        return fusion.message;
      }
    }
    return null;
  }

  function resolveRefine() {
    const before = playtestSnapshot();
    const profile = state.riskResult;
    const explode = Math.random() < profile.explode;
    const roll = Math.random();
    let outcome = explode ? "explode" : roll < 0.12 ? "big" : roll < 0.67 ? "success" : roll < 0.87 ? "hold" : "damage";
    let usedShield = false;
    if (state.pill.shield) {
      state.pill.shield = false;
      if (outcome === "explode") { outcome = "hold"; usedShield = true; }
    }
    if(outcome==='explode'&&campaign?.economy?.equipped==='seal'&&!state.pill.toolUsed){state.pill.toolUsed=true;outcome='damage';addLog('镇炉印挡下炸炉，改为丹体受损。','good');}
    if (outcome !== "explode") state.pill.quality = Math.min(4, state.pill.quality + 1);

    let feedback = "";
    let feedbackTone = "";
    let fused = false;
    if (outcome === "big" || outcome === "success") {
      const isBigSuccess = outcome === "big";
      applyAlchemy(outcome);
      const runeResult = tryAddRune();
      fused = !!runeResult && runeResult.includes("！");
      const qualityName = QUALITY_NAMES[state.pill.quality];
      feedbackTone = "good";
      if (isBigSuccess) {
        feedback = runeResult && runeResult.includes("！") ? runeResult : `大成功！丹转提升至${TURN_NAMES[state.pill.turn]}转。`;
        addLog(`<strong>大成功</strong>：丹转提升至${TURN_NAMES[state.pill.turn]}转，品质提升为${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult && !runeResult.includes("！") ? `显现${runeResult}。` : ""}`, "good");
      } else {
        feedback = runeResult && runeResult.includes("！") ? runeResult : "炼丹成功，品质提升。";
        addLog(`<strong>炼丹成功</strong>：丹转提升至${TURN_NAMES[state.pill.turn]}转，品质提升为${qualityName}，价值 ${formatNumber(state.pill.value)}。${runeResult ? `显现${runeResult}。` : ""}`, "good");
      }
    } else if (outcome === "hold") {
      if (state.pill.runes.includes("赤纹") || state.pill.runes.includes("金纹")) state.pill.shield = true;
      feedback = usedShield ? "护丹挡下炸丹，火候维持。" : "火候维持，转数和价值不变。";
      addLog(`<strong>火候维持</strong>：转数和价值不变，品质提升。${usedShield ? "护丹挡下炸丹。" : ""}${state.pill.shield ? "赤纹凝成下一次护丹。" : ""}`, "");
    } else if (outcome === "damage") {
      applyDamage();
      feedback = `丹体受损，转数回落至${TURN_NAMES[state.pill.turn]}转。`;
      addLog(`<strong>丹体受损</strong>：转数回落至${TURN_NAMES[state.pill.turn]}转，价值降为 ${formatNumber(state.pill.value)}。`, "bad");
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

    if (!state.pillEnded && state.pill.turn >= 9) {
      state.completedPills += 1;
      updateRecord();
      feedback = "九转成丹！这颗丹值得记入炉谱。";
      feedbackTone = "good";
      addLog(`<strong>九转成丹</strong>：${QUALITY_NAMES[state.pill.quality]}，价值 ${formatNumber(state.pill.value)}，请收丹交付。`, "good");
    }

    if (!state.pillEnded && state.pill.turn < 9) {
      state.riskResult = randomRisk();
      addLog("<strong>下一次风险</strong>：已重新生成。", "");
    }
    updateRecord();
    telemetry?.record("refine_result", playtestSnapshot(), { before, outcome, shieldUsed: usedShield });
    if (state.roundEnded) { settleOrder(); telemetry?.finish(playtestSnapshot(), state.delivered >= ORDER_TARGET ? "win" : "loss"); }
    decisionSince = Date.now();
    const visualOutcome = state.pill.turn >= 9 && !state.pillEnded ? "complete" : fused ? "fusion" : usedShield ? "shield" : outcome;
    setFeedback(feedback, feedbackTone, visualOutcome, outcome === "explode" ? -before.value : state.pill.value - before.value);
    render();
  }

  function refine() {
    if (!state.started || state.busy || state.pillEnded || state.roundEnded || state.pill.turn >= 9 || state.pill.runeChoices?.length) return;
    telemetry?.record("refine_choice", playtestSnapshot(), { decisionMs: Date.now() - decisionSince });
    state.busy = true;
    dom.pillVisual.classList.add("resolving");
    render();
    window.setTimeout(() => {
      dom.pillVisual.classList.remove("resolving");
      state.busy = false;
      resolveRefine();
    }, 280);
  }

  function startNewPill() {
    if (!state.started || state.busy || !state.pillEnded || state.roundEnded || state.attempt >= MAX_PILLS) return;
    state.attempt += 1;
    state.riskResult = randomRisk();
    state.pill = freshPill();
    if(campaignRules?.active(campaign)?.tier===1)state.pill.quality=1;
    state.pillEnded = false;
    state.pillEndReason = "";
    decisionSince = Date.now();
    telemetry?.record("pill_start", playtestSnapshot());
    addLog(`<strong>再开一炉</strong>：第 ${state.attempt} 颗丹药开始炼化。下一次风险已生成。`, "good");
    setFeedback("炉火重新点燃。下一次风险已生成。", "good");
    render();
  }

  function startGame(event) {
    if (state && state.busy) return;
    if (saved && event?.currentTarget === dom.startButton) {
      campaign = saved.campaign; state = saved.state; state.busy = false;
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
  dom.collectButton.addEventListener("click", () => {
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
  });
  dom.newPillButton.addEventListener("click", startNewPill);
  document.addEventListener("keydown", (event) => {
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
    if(kind==='equip'){const e=campaign.economy;if(!state.pillEnded||(!e.tools.includes(id)&&id!==null))return false;e.equipped=id;ok=true;}
    else if(kind==='self'||kind==='herbself'){if(campaign.phase!=='open'||campaignRules.active(campaign)||!state.pillEnded||!state.roundEnded)return false;const e=campaign.economy;if(!['warm','cool','neutral'].includes(nature))return false;if(kind==='herbself'){nature=id;if(!['warm','cool','neutral'].includes(nature)||!e.herbs[nature])return false;e.herbs[nature]--;id=0;}else{if(!Number.isInteger(id)||id<0||id>2||!e.stock[id])return false;e.stock[id]--;}e.selfCount++;const o={id:'S'+e.selfCount,self:true,tier:id,status:'active',client:'自炼自售',name:['普通药包自炼','精选药包自炼','灵性药包自炼'][id],nature,materials:1,target:1};campaign.selfOrder=o;ORDER_TARGET=1;MAX_PILLS=1;state=createState();state.started=true;state.pillEnded=true;state.pillEndReason='waiting';state.orderId=o.id;window.dispatchEvent?.(new Event('alchemy:order'));ok=true;}
    else if(kind==='chooseRune'){if(!state.pill.runeChoices?.includes(id))return false;state.pill.runes.push(id);state.pill.runeChoices=[];state.pill.value=Math.round(state.pill.value*1.18);tryFusion();updateRecord();ok=true;}
    else if(kind==='reroll'){if(state.pillEnded||campaign.economy.equipped!=='needle'||state.pill.toolUsed||!state.pill.runes.length||state.pill.runeChoices?.length)return false;const old=state.pill.runes.pop();const pool=['赤纹','青纹','月纹','雷纹'].filter(r=>r!==old&&!state.pill.runes.includes(r));if(!pool.length){state.pill.runes.push(old);return false;}state.pill.runes.push(pool[Math.floor(Math.random()*pool.length)]);state.pill.toolUsed=true;tryFusion();updateRecord();ok=true;}
    else if(campaign.phase==='open'&&(kind!=='furnace'||state.pillEnded))ok=window.AlchemyEconomy.buy(campaign,kind,id);
    if(ok)render();return ok;
  }
  window.AlchemyGame = { economyAction, chooseOrder, endDay, nextDay, abandonOrder,
    campaign: () => campaign ? JSON.parse(JSON.stringify(campaign)) : null,
    snapshot: () => ({ ...playtestSnapshot(), started: state.started,
    busy: state.busy, pillEnded: state.pillEnded, roundEnded: state.roundEnded,
    endReason: state.pillEndReason, remaining: campaign && !state.orderId ? 0 : MAX_PILLS - state.attempt, target: ORDER_TARGET,
    runeChoices:state.pill.runeChoices||[],toolUsed:!!state.pill.toolUsed,campaignEnabled: !!campaign, collected: state.collected,
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


