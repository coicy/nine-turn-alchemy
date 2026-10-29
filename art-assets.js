(() => {
  const assets = [
    ['.herb-object > svg','assets/runtime-v10/herb-parcel-v1.webp','raster-prop'],
    ['.tray-object > svg','assets/runtime-v10/delivery-tray-v1.webp','raster-prop'],
    ['svg.hand-fan','assets/runtime-v10/alchemy-fan-v1.webp','hand-fan raster-fan']
  ];
  for (const [selector,src,classes] of assets) {
    const original=document.querySelector(selector);
    if (!original) continue;
    const image=new Image(); image.className=classes; image.alt=''; image.setAttribute('aria-hidden','true'); image.draggable=false;
    window.AlchemyAssets.load(src).then(ok=>{if(ok)original.replaceWith(image);});
    image.src=src;
  }
})();
