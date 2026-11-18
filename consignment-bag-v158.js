(() => {
  const game = window.AlchemyGame;
  const economy = window.AlchemyEconomy;
  const detail = document.getElementById('pillBagSelected');
  if (!game || !economy || !detail) return;

  const icons = {
    submit: 'submit-mark-v158.svg',
    sell: 'sale-mark-v158.svg',
    consign: 'consign-mark-v158.svg'
  };

  function setActionContent(button, kind, label) {
    if (!button) return;
    button.classList.add('pill-bag-action', `pill-bag-action-${kind}`);
    button.replaceChildren();
    const icon = document.createElement('img');
    icon.src = `assets/uiux-v158/${icons[kind]}`;
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
    setActionContent(detail.querySelector('[data-submit-pill]'), 'submit', '提交委托');
    const sale = detail.querySelector('[data-sell-pill]');
    if (sale && pill) setActionContent(sale, 'sell', `立即出售 · ${economy.saleValue(game.campaign(), pill)} 铜钱`);
    if (!pill || !game.previewConsignment) return;
    const result = game.previewConsignment(id);
    const note = document.createElement('p');
    note.className = 'pill-bag-consignment-note';
    note.textContent = result.quote
      ? `寄售${result.quote.waitDays}天后回款 ${result.quote.guaranteedPayout} 铜钱 · ${result.quote.tierName}${result.ok ? '' : ` · ${result.reason}`}`
      : '当前丹药不可寄售。';
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
