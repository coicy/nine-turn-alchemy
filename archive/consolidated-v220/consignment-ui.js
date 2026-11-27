(() => {
  const game = window.AlchemyGame;
  const economy = window.AlchemyEconomy;
  const board = document.querySelector('.order-panel .journal-page:last-child');
  if (!game || !economy || !board) return;
  const panel = document.createElement('section');
  panel.className = 'consignment-board-v158';
  panel.setAttribute('aria-live', 'polite');
  board.prepend(panel);
  const phone = matchMedia('(max-width: 650px)');
  const disclosure = document.createElement('details');
  const summary = document.createElement('summary');
  const list = document.createElement('ul');
  const heading = document.createElement('div');
  heading.className = 'consignment-heading';
  disclosure.append(summary);
  function layout() {
    if (phone.matches) {
      disclosure.open = false;
      disclosure.append(list);
      panel.replaceChildren(disclosure);
    } else panel.replaceChildren(heading, list);
  }
  layout();
  phone.addEventListener('change', layout);


  function render() {
    const campaign = game.campaign();
    if (!campaign) { panel.hidden = true; return; }
    if (panel.parentElement !== board) board.prepend(panel);
    const e = economy.ensure(campaign);
    const listed = (e.consignments || []).filter(x => x?.status === 'listed' && x.pillSnapshot);
    const paid = (e.consignments || []).filter(x => x?.status === 'paid' && x.pillSnapshot).slice(-3).reverse();
    const rows = listed.map(x => `<li><strong>${x.pillSnapshot.turn}转 · 药力 ${economy.grossValue(x.pillSnapshot)}</strong><span>${x.tierName} · 第${x.settleDay}天回款 ${x.guaranteedPayout} 铜钱</span></li>`).join('');
    const paidRows = paid.map(x => `<li><strong>第${x.paidDay}天已到账</strong><span>${x.guaranteedPayout} 铜钱 · ${x.tierName}</span></li>`).join('');
    panel.hidden = !listed.length && !paid.length;
    summary.textContent = listed.length ? `寄售中 ${listed.length}/3` : '最近寄售回款';
    heading.innerHTML = '<strong>' + summary.textContent + '</strong><span>' +
      (listed.length ? '回款按丹药快照结算' : '可继续查看丹匣') + '</span>';
    list.innerHTML = listed.length ? rows : paidRows;

  }

  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  window.addEventListener('alchemy:view-ready', render);
  render();
})();
