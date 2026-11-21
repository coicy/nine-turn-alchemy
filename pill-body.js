(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral-v136/warm.webp',neutral:'assets/pill-mineral-v136/neutral.webp',cool:'assets/pill-mineral-v136/cool.webp'});
  const BODY = BODIES.neutral;
  const palettes = window.AlchemyPillPalette;
  const SIZE = 256;
  const cache = new Map();
  const fallback = new Map();
  const loading = new Set();
  const retryAfter = new Map();

  function fallbackArt(nature) {
    if (fallback.has(nature)) return fallback.get(nature);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const shade = {warm: '#9b5943', cool: '#526967', neutral: '#83684c'};
    const gradient = ctx.createRadialGradient(104, 94, 8, 129, 128, 89);
    gradient.addColorStop(0, '#d7bea0');
    gradient.addColorStop(.57, shade[nature] || shade.neutral);
    gradient.addColorStop(1, '#372b24');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(128, 128, 86, 0, 2 * Math.PI);
    ctx.fill();
    const entry = {canvas, url: canvas.toDataURL('image/png')};
    fallback.set(nature, entry);
    return entry;
  }

  function loadAppearance(src) {
    if (loading.has(src) || Date.now() < (retryAfter.get(src) || 0)) return;
    loading.add(src);
    window.AlchemyAssets.load(src).then(ok => {
      loading.delete(src);
      if (ok) {
        retryAfter.delete(src);
        hydrate();
        window.dispatchEvent(new Event('alchemy:pill-art-ready'));
      } else {
        retryAfter.set(src, Date.now() + 15000);
      }
    });
  }
  const craftFrames={"bird":[[49,122,231,192],[342,99,255,217],[643,97,275,220],[960,89,272,229],[31,488,259,242],[335,485,267,244],[641,474,286,260],[944,479,293,280],[25,878,264,290],[326,873,279,305],[625,864,303,328]],"lion":[[81,142,166,198],[358,108,198,233],[664,79,226,258],[953,65,278,277],[20,458,280,290],[332,455,279,301],[645,444,285,315],[960,438,276,324],[20,834,292,367],[329,831,296,371],[633,825,348,389]],"home":[[28,113,261,240],[342,113,257,236],[642,104,277,251],[954,93,284,267],[18,476,282,287],[335,493,273,265],[632,477,303,291],[959,488,276,276],[19,899,284,254],[322,867,294,300],[629,862,307,320]],"beast":[[25,85,276,230],[342,86,271,227],[651,76,271,240],[956,55,279,263],[13,418,290,290],[328,418,289,294],[640,415,287,301],[952,408,287,305],[15,840,286,303],[329,827,286,320],[642,801,286,353]],"tower":[[82,120,169,259],[376,126,188,250],[688,64,188,318],[998,48,201,336],[40,448,241,335],[330,472,281,300],[641,470,283,295],[953,489,284,272],[15,907,282,262],[318,880,298,303],[631,868,307,315]],"spring":[[49,48,232,334],[345,50,245,331],[644,49,253,331],[938,47,285,333],[25,459,279,311],[338,447,271,322],[632,472,275,289],[936,446,299,325],[21,862,300,304],[344,861,256,322],[624,855,310,333]]};
  function describe(p={}){
    const craft=window.AlchemyCrafts?.get(p.craftKind);if(craft){const turn=Math.max(1,Math.min(100,Number(p.turn)||1));return {craftKind:craft.id,appearance:'craft-'+craft.id,nature:'neutral',quality:p.quality||0,turn,key:craft.id+'/'+window.AlchemyCrafts.stage(turn)}}

    const nature=p.nature||p.order?.nature||'neutral';
    const appearance=palettes.resolve(nature,p.appearance);
    const turn=Math.max(1,Math.min(100,Number(p.turn)||1));
    const quality=Math.max(0,Math.min(4,Number(p.quality)||0));
    return {nature,appearance,quality,turn,key:appearance+'/'+palettes.frame(appearance,turn)};
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return {...hit,description:d};}
    if(d.craftKind){
      const def=window.AlchemyCrafts.get(d.craftKind),source=window.AlchemyCrafts.atlas(def.atlas),im=window.AlchemyAssets.getImage(source);
      if(!im){loadAppearance(source);const c=document.createElement('canvas');c.width=c.height=SIZE;return {canvas:c,url:c.toDataURL(),description:d};}
      const index=window.AlchemyCrafts.stage(d.turn),[x,y,w,h]=craftFrames[def.atlas][index];
      const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d'),scale=Math.min(236/w,236/h),dw=w*scale,dh=h*scale;ctx.drawImage(im,x,y,w,h,(SIZE-dw)/2,(SIZE-dh)/2,dw,dh);const entry={canvas:c,url:c.toDataURL(),description:d};cache.set(d.key,entry);return entry;
    }
    const source = palettes.sources[d.appearance];
    const im = window.AlchemyAssets.getImage(source);
    if (!im) {
      loadAppearance(source);
      return {...fallbackArt(d.nature), description: d};
    }
    const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d');
    const frame=palettes.frame(d.appearance,d.turn), sx=frame*SIZE;
    ctx.save();
    ctx.drawImage(im,sx,0,SIZE,SIZE,0,0,SIZE,SIZE);
    ctx.restore();
    const entry={canvas:c,url:c.toDataURL('image/png'),description:d};cache.set(d.key,entry);if(cache.size>48)cache.delete(cache.keys().next().value);return entry;
  }
  const image=p=>make(p).url;
  let current=null,previous=null,feedback=null;
  function draw(ctx,x,y,size,p){
    const rendered=make(p),d=rendered.description;
    const motion=window.AlchemyGameFeel?.sample();
    ctx.save();
    if(motion){ctx.translate(x+size/2,y+size/2+motion.lift*size);ctx.scale(motion.sx,motion.sy);ctx.translate(-x-size/2,-y-size/2);}
    const performanceActive=!d.craftKind&&window.AlchemyRefinePerformance?.drawPill(ctx,rendered.canvas,x,y,size);
    if(!performanceActive)ctx.drawImage(rendered.canvas,x,y,size,size);
    const elapsed=feedback&&performance.now()-feedback.start;
    const animating=!!(feedback&&feedback.key===d.key&&elapsed<650&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!window.AlchemyGameFeel?.reduced);
    if(animating&&!performanceActive){
      const t=elapsed/650;ctx.save();ctx.translate(x,y);ctx.scale(size/SIZE,size/SIZE);ctx.beginPath();ctx.arc(128,128,124,0,Math.PI*2);ctx.clip();ctx.globalAlpha=Math.sin(t*Math.PI)*.5;
      if(feedback.outcome==='damage'){ctx.fillStyle='#23180e';ctx.fillRect(0,0,SIZE,SIZE);}
      ctx.restore();
    }
    ctx.restore();
    return {...d,animating:animating||!!motion||!!performanceActive};
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
