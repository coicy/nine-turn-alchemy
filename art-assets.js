(() => {
  const assets = [
    ['.herb-object > svg','assets/props/herb-parcel-v1.png','raster-prop'],
    ['.tray-object > svg','assets/props/delivery-tray-v1.png','raster-prop'],
    ['svg.hand-fan','assets/props/alchemy-fan-v1.png','hand-fan raster-fan']
  ];
  for (const [selector,src,classes] of assets) {
    const original=document.querySelector(selector);
    if (!original) continue;
    const image=new Image(); image.className=classes; image.alt=''; image.setAttribute('aria-hidden','true'); image.draggable=false;
    image.onload=()=>original.replaceWith(image);
    image.src=src;
  }
})();
