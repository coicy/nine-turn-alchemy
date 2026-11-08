/* V136: approved B painting with mineral oxide palettes, shared across all pill views.
 * Growth is derived from saved turn/quality; it never awards runes or changes a roll. */
(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral-v136/warm.webp',neutral:'assets/pill-mineral-v136/neutral.webp',cool:'assets/pill-mineral-v136/cool.webp'});
  const BODY = BODIES.neutral;
  const SIZE = 256;
  const cache = new Map();
  let bounds = new WeakMap();
  const definitions = {
    '赤纹': {color:'#c64e32', light:'#ffc087', kind:'fire'},
    '青纹': {color:'#4e9a8f', light:'#c0e6ce', kind:'water'},
    '月纹': {color:'#d9cb9a', light:'#fff0ca', kind:'moon'},
    '雷纹': {color:'#d9aa44', light:'#ffe5a0', kind:'thunder'},
    '金纹': {color:'#c59137', light:'#f9dfa1', kind:'gold'},
    '星痕': {color:'#a99ac5', light:'#e4d9f0', kind:'star'}
  };
  const paths = {
    fire: [
      'M29 79C12 79 12 58 30 49C47 41 60 35 66 17C71 35 60 48 42 55C29 60 22 62 24 69C26 76 34 74 32 68C30 64 25 67 28 71C34 68 38 74 33 78Z',
      'M35 55C52 54 62 55 73 43C78 38 83 37 88 39C75 41 78 61 50 63L31 65Z',
      'M30 54C33 39 42 35 43 21C50 35 41 46 37 57Z',
      'M56 46C70 40 73 24 88 18C79 33 88 39 77 47C70 53 62 55 48 59Z'
    ],
    water: [
      'M10 45C28 53 34 47 48 33C64 16 78 20 91 32C75 28 69 33 56 47C40 64 24 65 10 55Z',
      'M13 66C31 73 38 66 50 56C67 42 80 44 92 53C76 51 71 58 59 69C44 82 26 82 13 74Z',
      'M27 33C39 32 43 20 51 13C52 24 45 35 33 40Z',
      'M67 69C81 64 86 68 91 74C78 72 74 86 58 87L49 83Z'
    ],
    moon: [
      'M69 12C39 15 20 37 26 62C32 88 63 94 85 72C57 84 31 56 44 31C49 22 58 16 69 12Z',
      'M72 21C84 23 91 33 88 46C86 34 80 28 69 29Z',
      'M18 39C11 58 19 83 39 91C23 89 9 69 13 49Z',
      'M51 92C72 97 87 85 94 72C92 89 77 101 57 99Z'
    ],
    thunder: [
      'M63 9L23 54L46 52L34 91L80 39L55 42Z',
      'M48 44L22 31L29 45L10 49L34 58L30 49Z',
      'M57 59L76 62L68 75L91 78L78 67L86 56L66 51Z',
      'M67 21L83 9L77 25L90 22L74 39L78 27L65 31Z'
    ],
    gold: [
      'M10 46C25 27 42 29 54 34C68 41 76 33 79 17C91 37 76 54 58 48C40 42 27 38 10 46Z',
      'M10 65C26 47 44 49 59 57C72 64 85 60 93 45C94 68 76 80 59 72C40 62 26 58 10 65Z',
      'M25 35C17 25 24 14 37 18C28 18 25 24 31 28C37 32 42 25 39 20C47 31 38 40 29 38Z',
      'M72 70C84 77 85 87 71 94C79 84 71 79 63 81L52 78Z'
    ],
    star: [
      'M49 15C22 25 16 56 35 74C48 88 68 86 81 72C58 81 33 63 35 42C36 29 41 22 49 15Z',
      'M64 21C62 42 59 45 42 48C59 50 62 54 64 76C67 54 70 50 88 48C70 45 67 42 64 21Z',
      'M24 42C16 57 24 77 42 86C23 83 12 65 18 48Z',
      'M64 27C77 20 83 24 93 16C88 29 78 35 65 35Z'
    ]
  };
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  const smooth = (a,b,n) => {const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
  function describe(p={}) {
    const turn=clamp(p.turn??1,1,100),quality=clamp(p.quality??0,0,4);
    const runes=[...new Set(p.runes||[])].filter(name=>definitions[name]).slice(0,6);
    const nature=p.nature||p.order?.nature||'neutral';
    const shield=!!p.shield,moonCharge=!!(p.moonCharge||p.toolProgress?.moonCharge);
    const stage=turn>=60?3:turn>=30?2:turn>=10?1:0;
    const growth=(turn-1)/99;
    const key=JSON.stringify([nature,turn,quality,runes]);
    return {nature,turn,quality,runes,shield,moonCharge,stage,growth,key,
      stageName:['初显','凝实','分枝','贯通'][stage]};
  }
  function bodyBounds(im) {
    if(bounds.has(im))return bounds.get(im);
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
    const data=ctx.getImageData(0,0,c.width,c.height).data;
    let x0=c.width,y0=c.height,x1=0,y1=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>200){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
    const result={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};bounds.set(im,result);return result;
  }
  function glyph(ctx,name,x,y,size,angle,d,secondary=false) {
    const def=definitions[name];if(!def)return;
    const g=d.growth,e=Math.sqrt(g),scale=.64+.36*e;
    const stages=paths[def.kind];
    ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(angle);ctx.scale(size/100*(secondary?.77:.96),size/100);ctx.translate(-50,-50);
    ctx.translate(28,73);ctx.scale(scale,scale);ctx.translate(-28,-73);
    const tone=ctx.createLinearGradient(20,10,80,90);tone.addColorStop(0,def.light);tone.addColorStop(.24,def.color);tone.addColorStop(.72,def.color);tone.addColorStop(1,def.light);
    ctx.lineJoin='round';ctx.lineCap='round';
    const strengths=[1,smooth(.04,.28,g),smooth(.22,.58,g),smooth(.55,1,g)];
    // A crescent/star or double wave is one semantic mark, including its initial companion stroke.
    if(['water','gold','star'].includes(def.kind))strengths[1]=.68+.32*e;
    stages.forEach((shape,i)=>{
      const strength=strengths[i];if(strength<.015||(secondary&&i>1))return;
      ctx.save();ctx.globalAlpha=(secondary?.80:1)*(.76+d.quality*.06);
      if(i>0){ctx.translate(36,53);ctx.scale(.45+.55*strength,.45+.55*strength);ctx.translate(-36,-53);ctx.globalAlpha*=strength;}
      const path=new Path2D(shape),redOnRed=d.nature==='warm'&&def.kind==='fire';
      ctx.strokeStyle=redOnRed?'#46291eee':'#4a2c1c9c';ctx.lineWidth=(redOnRed?4:1.8)+g*.6;ctx.stroke(path);
      ctx.fillStyle=tone;ctx.fill(path);
      const body=window.AlchemyAssets?.getImage(BODY);
      if(body?.naturalWidth){const b=bodyBounds(body);ctx.save();ctx.clip(path);ctx.globalCompositeOperation='multiply';ctx.globalAlpha*=.25;ctx.drawImage(body,b.x,b.y,b.w,b.h,0,0,100,100);ctx.restore();}
      ctx.strokeStyle=def.light;ctx.lineWidth=.35+d.quality*.08;ctx.stroke(path);ctx.restore();
    });
    ctx.restore();
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return hit;}
    const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d');
    const im=window.AlchemyAssets?.getImage(BODIES[d.nature]||BODY);if(!im?.naturalWidth)return {canvas:c,url:c.toDataURL(),description:d};
    const b=bodyBounds(im),cx=128,cy=128,r=124;
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    ctx.drawImage(im,b.x,b.y,b.w,b.h,4,4,248,248);
    // Colors are painted into the mineral bodies. Do not tint them back to the old blue/olive palette.
    const sheen=ctx.createRadialGradient(82,70,0,88,80,145);sheen.addColorStop(0,'#fff5d8'+Math.round(8+d.quality*4).toString(16).padStart(2,'0'));sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.fillRect(0,0,SIZE,SIZE);
    const marks=d.runes,primary=marks[marks.length-1],others=marks.slice(0,-1);
    const slots=others.length<=2?[[.23,.23,-.22],[.77,.77,.18]]:[[.20,.26,-.35],[.50,.15,.08],[.81,.29,.35],[.79,.73,.32],[.27,.79,-.2]];
    others.forEach((name,i)=>{const [x,y,a]=slots[i];const size=SIZE*.30;glyph(ctx,name,SIZE*x-size/2,SIZE*y-size/2,size,a,d,true);});
    if(primary){const size=SIZE*.78;glyph(ctx,primary,128-size/2,130-size/2,size,0,d);}
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
      else if(d.runes.length){ctx.beginPath();ctx.rect(0,0,SIZE*Math.min(1,t*1.6),SIZE);ctx.clip();const s=SIZE*.78;glyph(ctx,d.runes[d.runes.length-1],128-s/2,130-s/2,s,0,{...d,quality:4});}
      ctx.restore();
    }
    return {...d,animating};
  }
  function selection(nature,quality,runes=[]){return {body:image({nature,quality,runes,turn:60}),cracks:[],q:clamp(quality,0,4)};}
  function hydrate(scope=document){scope.querySelectorAll('[data-pill-art-state]').forEach(el=>{const p=JSON.parse(el.dataset.pillArtState);el.querySelector('img').src=image(p);el.dataset.pillArtKey=describe(p).key;});}
  window.AlchemyPillArt={image,draw,describe,selection,hydrate,definitions,bodySource:BODY,bodySources:BODIES,hues:['#D5DEE1','#91B78B','#74A9D4','#B091CC','#DFB87C'],get cacheSize(){return cache.size;},get feedback(){return feedback;}};
  window.addEventListener('alchemy:assets-ready',()=>{bounds=new WeakMap();cache.clear();});
  window.addEventListener('alchemy:render',()=>{const d=describe(window.AlchemyGame.snapshot());if(current?.key!==d.key){previous=current;current=d;}});
  window.addEventListener('alchemy:refine-result',e=>{const d=describe(window.AlchemyGame.snapshot());feedback={key:d.key,start:performance.now(),outcome:e.detail.outcome,previous:previous?.key||null};window.dispatchEvent(new Event('alchemy:pill-surface'));});
  window.addEventListener('alchemy:view-ready',()=>{feedback=null;});
  window.addEventListener('alchemy:assets-ready',()=>hydrate());
})();
