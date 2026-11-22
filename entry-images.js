(() => {
  'use strict';

  // Resources referenced by the live game's entry point and its scene renderers.
  const paintedScenes = ['room', 'furnace'].flatMap(scene =>
    ['desktop', 'mobile'].flatMap(size =>
      ['open', 'closed', 'front'].map(layer =>
        'assets/scene-illustrated/' + scene + '-' + size + '-' + layer + '.webp'
      )
    )
  );

  window.AlchemyEntryImages = Object.freeze([...new Set([
    ...paintedScenes,
    ...Object.values(window.AlchemyPillPalette.sources),
    ...window.AlchemyCustomers.sources(),
    ...Object.values(window.AlchemyCustomers.catalog.notes).map(note => note.src),
    'assets/counter-props/herb-parcel.webp',
    'assets/counter-props/merchant.webp',
    'assets/counter-scene/counter.webp',
    'assets/furnace-view/desktop.webp',
    'assets/furnace-view/lid-closed.webp',
    'assets/furnace-view/lid-standing.webp',
    'assets/furnace-view/mobile-v2.webp',
    'assets/herb-cabinet/cubby.webp',
    'assets/object-world/casket.webp',
    'assets/object-world/counter.webp',
    'assets/object-world/cutaway.webp',
    'assets/object-world/market.webp',
    'assets/object-world/room-desktop.webp',
    'assets/object-world/room-mobile.webp',
    'assets/pill-mineral/cool.webp',
    'assets/pill-mineral/neutral.webp',
    'assets/pill-mineral/warm.webp',
    'assets/room/room.webp',
    'assets/runtime/alchemy-fan-v1.webp',
    'assets/runtime/delivery-tray-v1.webp',
    'assets/runtime/furnace-v1.webp',
    'assets/runtime/herb-parcel-v1.webp',
    'assets/scene-art/tools.webp',
    'assets/scene-props/merchant.webp',
    'assets/scene-props/tools.webp',
    'assets/scenes/market.webp',
    'assets/ui/consign-mark.svg',
    'assets/ui/danfang-wordmark.svg',
    'assets/ui/sale-mark.svg',
    'assets/ui/submit-mark.svg',
    'assets/workbench/folio.png',
    'assets/workbench/room-desktop.png',
    'assets/workbench/room-mobile.png',
  ])]);
})();
