(() => {
  const board = document.querySelector('.economy-board');
  if (!board) return;
  let secondaryOpen = false;
  let bound = false;

  function render() {
    if (!board.querySelector('.market-secondary-toggle')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'market-secondary-toggle';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = '展开备料与法器';
      const orders = board.querySelector('.daily-orders');
      if (orders) orders.before(button);
    }
    const button = board.querySelector('.market-secondary-toggle');
    const orders = board.querySelector('.daily-orders');
    const help = board.querySelector('.market-help');
    const nature = board.querySelector('label[for="materialNature"]') || board.querySelector('#materialNature')?.closest('label');
    if (!button || !orders) return;
    button.setAttribute('aria-expanded', String(secondaryOpen));
    button.textContent = secondaryOpen ? '收起备料与法器' : '展开备料与法器';
    orders.hidden = !secondaryOpen;
    if (help) help.hidden = !secondaryOpen;
    if (nature) nature.hidden = !secondaryOpen;
    if (!bound) {
      board.addEventListener('click', event => {
        if (!event.target.closest('.market-secondary-toggle')) return;
        secondaryOpen = !secondaryOpen;
        render();
      });
      bound = true;
    }
  }

  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  render();
})();
