/* Experiment-only character and fully redrawn growth sources. */
(() => {
  'use strict';
  if (!document.body.classList.contains('warm-cinnabar-experiment')) return;
  const root='assets/warm-cinnabar/';
  const portraits={merchant:'merchant',traveller:'scholar',herbalist:'herbalist','clothier-v61':'clothier'};
  for(const asset of window.AlchemyCustomerCatalog.assets){
    const name=portraits[asset.id];if(!name)continue;
    for(const state of Object.values(asset.states))state.src=root+name+'.webp';
  }
  const previous=window.AlchemyPillPalette;
  const sources=Object.freeze(Object.fromEntries(Object.keys(previous.sources).map(id=>[id,root+'growth/pill-'+id+'.webp'])));
  window.AlchemyPillPalette=Object.freeze({...previous,sources});
  const replacements=new Map(Object.entries(previous.sources).map(([id,src])=>[src,sources[id]]));
  window.AlchemyEntryImages=Object.freeze([...new Set(window.AlchemyEntryImages.map(src=>replacements.get(src)||src))]);
  window.AlchemyWarmStyle={pillAtlasSources:sources,portraits};
})();
