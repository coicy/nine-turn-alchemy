(() => {
  const game = window.AlchemyGame;
  const economy = window.AlchemyEconomy;
  const board = document.querySelector('.economy-board');
  if (!game || !economy || !board) return;
  const panel = document.createElement('section');
  panel.className = 'consignment-board-v158';
  panel.setAttribute('aria-live', 'polite');
  board.prepend(panel);

  function render() {
    const campaign = game.campaign();
    if (!campaign) { panel.hidden = true; return; }
    if (panel.parentElement !== board) board.prepend(panel);
    const e = economy.ensure(campaign);
    const listed = (e.consignments || []).filter(x => x?.status === 'listed' && x.pillSnapshot);
    const paid = (e.consignments || []).filter(x => x?.status === 'paid' && x.pillSnapshot).slice(-3).reverse();
    const rows = listed.map(x => `<li><strong>${x.pillSnapshot.turn}转 · 药力 ${Math.round(x.pillSnapshot.value)}</strong><span>${x.tierName} · 第${x.settleDay}天回款 ${x.guaranteedPayout} 铜钱</span></li>`).join('');
    const paidRows = paid.map(x => `<li><strong>第${x.paidDay}天已到账</strong><span>${x.guaranteedPayout} 铜钱 · ${x.tierName}</span></li>`).join('');
    panel.hidden = !listed.length && !paid.length;
    panel.innerHTML = listed.length
      ? `<div class="consignment-heading"><strong>寄售中 ${listed.length}/3</strong><span>回款按丹药快照结算</span></div><ul>${rows}</ul>`
      : `<div class="consignment-heading"><strong>最近寄售回款</strong><span>可继续查看丹匣</span></div><ul>${paidRows}</ul>`;

  }

  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  window.addEventListener('alchemy:view-ready', render);
  render();
})();
