(() => {
  'use strict';
  if (!document.body.classList.contains('warm-cinnabar-experiment')) return;
  const merchants=window.AlchemyCounterTrade.merchants;
  for (const [id,file] of Object.entries({artificer:'artificer',trader:'merchant',herbalist:'herbalist'})) {
    merchants[id].portrait='assets/warm-cinnabar/'+file+'.webp';
  }
})();
