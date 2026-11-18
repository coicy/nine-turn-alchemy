(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral-v136/warm.webp',neutral:'assets/pill-mineral-v136/neutral.webp',cool:'assets/pill-mineral-v136/cool.webp'});
  const BODY = BODIES.neutral;
  const palettes = window.AlchemyPillPalette;
  const SIZE = 256;
  const cache = new Map();
  function describe(p={}){
    const nature=p.nature||p.order?.nature||'neutral';
    const appearance=palettes.resolve(nature,p.appearance);
    const turn=Math.max(1,Math.min(100,Number(p.turn)||1));
    const quality=Math.max(0,Math.min(4,Number(p.quality)||0));
    return {nature,appearance,quality,turn,key:appearance+'/'+palettes.frame(appearance,turn)};
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return {...hit,description:d};}
    const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d');
    const im=window.AlchemyAssets?.getImage(palettes.sources[d.appearance]);if(!im?.naturalWidth)return {canvas:c,url:c.toDataURL(),description:d};
    const frame=palettes.frame(d.appearance,d.turn), sx=frame*SIZE;
    ctx.save();
    ctx.drawImage(im,sx,0,SIZE,SIZE,0,0,SIZE,SIZE);
    ctx.restore();
    const entry={canvas:c,url:c.toDataURL('image/png'),description:d};cache.set(d.key,entry);if(cache.size>48)cache.delete(cache.keys().next().value);return entry;
  }
  const image=p=>make(p).url;
  let current=null,previous=null,feedback=null;
  function draw(ctx,x,y,size,p){
    const rendered=make(p),d=rendered.description;ctx.drawImage(rendered.canvas,x,y,size,size);
    const elapsed=feedback&&performance.now()-feedback.start;
    const animating=!!(feedback&&feedback.key===d.key&&elapsed<650&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(animating){
      const t=elapsed/650;ctx.save();ctx.translate(x,y);ctx.scale(size/SIZE,size/SIZE);ctx.beginPath();ctx.arc(128,128,124,0,Math.PI*2);ctx.clip();ctx.globalAlpha=Math.sin(t*Math.PI)*.5;
      if(feedback.outcome==='damage'){ctx.fillStyle='#23180e';ctx.fillRect(0,0,SIZE,SIZE);}
      ctx.restore();
    }
    return {...d,animating};
  }
  function selection(nature,quality){return {body:image({nature,quality,turn:60}),cracks:[],q:describe({quality}).quality};}
  function hydrate(scope=document){scope.querySelectorAll('[data-pill-art-state]').forEach(el=>{const p=JSON.parse(el.dataset.pillArtState);el.querySelector('img').src=image(p);el.dataset.pillArtKey=describe(p).key;});}
  window.AlchemyPillArt={image,draw,describe,selection,hydrate,bodySource:BODY,bodySources:BODIES,paletteSources:palettes.sources,hues:['#D5DEE1','#91B78B','#74A9D4','#B091CC','#DFB87C'],get cacheSize(){return cache.size;},get feedback(){return feedback;}};
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();});
  window.addEventListener('alchemy:render',()=>{const d=describe(window.AlchemyGame.snapshot());if(current?.key!==d.key){previous=current;current=d;}});
  window.addEventListener('alchemy:refine-result',e=>{const d=describe(window.AlchemyGame.snapshot());feedback={key:d.key,start:performance.now(),outcome:e.detail.outcome,previous:previous?.key||null};window.dispatchEvent(new Event('alchemy:pill-surface'));});
  window.addEventListener('alchemy:view-ready',()=>{feedback=null;});
  window.addEventListener('alchemy:assets-ready',()=>hydrate());
})();
