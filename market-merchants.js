/* Each stall can carry whole product lines or a subset of their existing IDs. */
(() => {
  'use strict';
  const merchants = [
    {id: 'herbalist', name: '何采药', portrait: 'assets/customers-v61/herbalist.png',
      shelves: [{kind: 'material'}]},
    {id: 'artificer', name: '法器商', portrait: 'assets/scene-props-v42/merchant.webp',
      shelves: [{kind: 'tool'}, {kind: 'furnace'}]},
    {id: 'trader', name: '周掌柜', portrait: 'assets/customers-v61/merchant.png',
      shelves: [{kind: 'craft'}]}
  ];
  const labels = {material: '药包', tool: '法器', furnace: '改炉', craft: '器料'};

  function openStalls(campaign, economy) {
    const E = window.AlchemyEconomy;
    const available = {
      material: E.PRICES.map((_, index) => index),
      tool: E.TOOL_DEFS.filter(tool => tool.day <= campaign.day || economy.tools.includes(tool.id)).map(tool => tool.id),
      furnace: ['upgrade'],
      craft: window.AlchemyCrafts.defs.map(craft => craft.id)
    };
    return merchants.filter(merchant => (merchant.fromDay ?? 1) <= campaign.day).map(merchant => {
      const shelves = merchant.shelves.map(({kind, ids}) => ({
        kind, ids: (ids ?? available[kind]).filter(id => available[kind].includes(id))
      })).filter(shelf => shelf.ids.length);
      return {...merchant, shelves};
    }).filter(stall => stall.shelves.length);
  }

  window.AlchemyMarketMerchants = {merchants, labels, openStalls};
})();
