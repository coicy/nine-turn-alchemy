(() => {
  'use strict';
  const api = window.AlchemyGame, stage = document.getElementById('pillStage');
  const nav = document.querySelector('.engine-nav');
  const expand = document.createElement('button');
  expand.type = 'button'; expand.className = 'onboarding-expand';
  expand.textContent = '查看全部功能';
  expand.setAttribute('aria-label', '结束简洁引导，显示全部经营功能');
  nav.append(expand);
  let expanded = false;
  try { expanded = localStorage.getItem('alchemy-onboarding-expanded-v53') === 'true'; } catch {}
  expand.onclick = () => {
    expanded = true;
    try { localStorage.setItem('alchemy-onboarding-expanded-v53', 'true'); } catch {}
    update();
  };
  // Detailed rune effects are available on demand, after the player actually discovers one.
  const runes = document.getElementById('roomRunes');
  const details = document.createElement('details'); details.className = 'observation-details';
  const summary = document.createElement('summary'); summary.textContent = '查看丹纹效果';
  const effects = document.createElement('p');
  runes.before(details); details.append(summary, runes, effects);
  function update() {
    const s = api.snapshot(), c = api.campaign();
    const guided = !!(s.started && c && c.day === 1 && !c.history.length &&
      !c.orders.some(o => ['completed', 'failed', 'skipped'].includes(o.status)) &&
      !c.economy?.selfCount && !c.economy?.tools?.length && !s.order?.self && !s.roundEnded && !expanded);
    document.body.classList.toggle('guided-opening', guided);
    expand.hidden = !guided;
    details.hidden = !s.runes?.length;
    effects.textContent = (s.runes || []).map(name => `${name}：${api.RUNE_DEFS[name] || ''}`).join('；');
    if (!guided) return;
    const text = instruction(s);
    if (text) document.getElementById('workInstruction').textContent = text;
  }
  function instruction(s) {
    if (!document.body.classList.contains('guided-opening') || window.AlchemyInteractionBusy || s.busy || stage.dataset.held || window.AlchemyScene2D?.held || s.runeChoices?.length) return '';
    return s.pillEnded
      ? (s.endReason === 'explode' ? '这一炉没炼成，免赔。取下一包药材，再试一次。' : s.attempt > 0 ? '这颗丹已交付。取下一包药材，继续完成本单。' : '先点药包，再点炉口，把第一包药材投入炉中。')
      : s.turn >= 100 ? '百转已成。点丹药拿起，再点收丹盘交付。'
      : s.turn === 1 ? '点炉膛炼化一次，看看丹药会发生什么。也可取丹放入收丹盘。'
      : s.delivered + s.value >= s.target ? '这颗丹已够完成委托。取丹放入收丹盘即可交付；继续炼化仍有风险。'
      : '看一眼炸丹概率：点炉膛继续炼化，或取丹放入收丹盘，保住这颗丹。';
  }
  window.AlchemyOnboarding = { instruction };
  window.addEventListener('alchemy:render', update);
  window.addEventListener('alchemy:interaction', update);
  new MutationObserver(update).observe(stage, { attributes: true, attributeFilter: ['data-held'] });
  update();
})();
