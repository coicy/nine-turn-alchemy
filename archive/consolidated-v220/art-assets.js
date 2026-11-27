(() => {
  const assets = [
    ['.herb-object > svg','assets/runtime/herb-parcel-v1.webp','raster-prop'],
    ['.tray-object > svg','assets/runtime/delivery-tray-v1.webp','raster-prop'],
    ['svg.hand-fan','assets/runtime/alchemy-fan-v1.webp','hand-fan raster-fan']
  ];
  for (const [selector,originalSource,classes] of assets) {
    const src=window.AlchemyWarmProps?.resolve(originalSource)||originalSource;
    const original=document.querySelector(selector);
    if (!original) continue;
    const image=new Image(); image.className=classes; image.alt=''; image.setAttribute('aria-hidden','true'); image.draggable=false;
    window.AlchemyAssets.load(src).then(ok=>{if(ok)original.replaceWith(image);});
    image.src=src;
  }
})();
