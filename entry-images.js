(() => {
  'use strict';

  // Resources referenced by the live game's entry point and its scene renderers.
  const paintedScenes = ['room', 'furnace'].flatMap(scene =>
    ['desktop', 'mobile'].flatMap(size =>
      ['open', 'closed', 'front'].map(layer =>
        'assets/scene-illustrated-v128/' + scene + '-' + size + '-' + layer + '.webp'
      )
    )
  );

  window.AlchemyEntryImages = Object.freeze([...new Set([
    ...paintedScenes,
    'assets/ritual/bronze-dial.webp',
    ...Object.values(window.AlchemyPillPalette.sources),
    ...window.AlchemyCustomers.sources(),
    ...Object.values(window.AlchemyCustomers.catalog.notes).map(note => note.src),
    'assets/counter-props-v72/herb-parcel.webp',
    'assets/counter-props-v72/merchant.webp',
    'assets/counter-scene-v71/counter.webp',
    'assets/furnace-view-v102/desktop.webp',
    'assets/furnace-view-v102/lid-closed.webp',
    'assets/furnace-view-v102/lid-standing.webp',
    'assets/furnace-view-v102/mobile-v2.webp',
    'assets/herb-cabinet-v38/cubby.webp',
    'assets/object-world-v86/casket.webp',
    'assets/object-world-v86/counter.webp',
    'assets/object-world-v86/cutaway.webp',
    'assets/object-world-v86/market.webp',
    'assets/object-world-v86/room-desktop.webp',
    'assets/object-world-v86/room-mobile.webp',
    'assets/pill-mineral-v136/cool.webp',
    'assets/pill-mineral-v136/neutral.webp',
    'assets/pill-mineral-v136/warm.webp',
    'assets/room-v25/room.webp',
    'assets/runtime-v10/alchemy-fan-v1.webp',
    'assets/runtime-v10/delivery-tray-v1.webp',
    'assets/runtime-v10/furnace-v1.webp',
    'assets/runtime-v10/herb-parcel-v1.webp',
    'assets/scene-art-v126/tools.webp',
    'assets/scene-props-v42/merchant.webp',
    'assets/scene-props-v42/tools.webp',
    'assets/scenes-v41/market.webp',
    'assets/uiux-v158/consign-mark-v158.svg',
    'assets/uiux-v158/danfang-wordmark-v158.svg',
    'assets/uiux-v158/sale-mark-v158.svg',
    'assets/uiux-v158/submit-mark-v158.svg',
    'assets/workbench-v92/folio.png',
    'assets/workbench-v92/room-desktop.png',
    'assets/workbench-v92/room-mobile.png',
  ])]);
})();
