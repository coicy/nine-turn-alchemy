/* V162: glazed mineral seals on the approved B bodies, shared across all pill views.
 * Growth is derived from saved turn/quality; it never awards runes or changes a roll. */
(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral-v136/warm.webp',neutral:'assets/pill-mineral-v136/neutral.webp',cool:'assets/pill-mineral-v136/cool.webp'});
  const BODY = BODIES.neutral;
  const palettes = window.AlchemyPillPalette;
  const SIZE = 256;
  const cache = new Map();
  const definitions = {
    '赤纹': {color:'#d96545', light:'#ffc08c', ink:'#5e2d25', kind:'fire'},
    '青纹': {color:'#3b8b7a', light:'#b0e1be', ink:'#173f3a', kind:'water'},
    '月纹': {color:'#b69b58', light:'#ffe4a1', ink:'#5c4a2c', kind:'moon'},
    '雷纹': {color:'#c38330', light:'#ffe09a', ink:'#5a3a1f', kind:'thunder'},
    '金纹': {color:'#c38a25', light:'#ffe9a8', ink:'#604114', kind:'gold'},
    '星痕': {color:'#8c6fb1', light:'#e5d2ff', ink:'#3c2d55', kind:'star'}
  };
  // These are deliberately broad, closed silhouettes. Each rune should be remembered by
  // its contour first, then by its color: cinnabar flame, twin water ribbons, moon crescent,
  // split thunder, paired gold waves, and the crescent/star seal.
  const seals = {
    fire: ['M22 76C12 66 20 55 36 49C50 44 54 35 48 23C62 29 67 39 60 49C69 43 78 44 85 51C73 51 71 61 65 68C58 78 44 84 31 81C26 80 23 78 22 76Z'],
    water: ['M10 47C25 58 39 54 52 42C65 30 76 28 90 34C78 37 69 43 60 51C44 65 28 68 13 57Z','M17 68C30 75 43 72 54 63C66 53 77 52 87 57C77 59 70 64 63 70C49 82 30 83 18 74Z'],
    moon: ['M73 15C47 18 29 35 29 56C29 77 49 88 70 80C55 78 44 69 42 56C39 39 51 24 73 15Z'],
    thunder: ['M59 12L28 47L49 46L37 86L76 41L55 42Z'],
    gold: ['M10 45C23 31 38 29 51 37C65 46 78 40 81 26C87 39 81 53 67 57C52 61 41 45 31 44C21 43 17 51 10 59Z','M15 64C30 53 42 56 53 64C66 73 78 66 88 56C83 72 71 79 58 79C44 79 37 66 28 66C23 66 19 71 15 76Z'],
    star: ['M70 20C48 23 35 38 36 55C37 72 53 82 72 77C58 75 49 67 48 55C46 41 55 29 70 20Z']
  };
  const detailPaths = {
    fire: ['M30 69C24 62 35 58 43 55C52 52 54 46 49 40C62 46 58 57 48 63C40 68 37 73 43 76C37 77 31 74 30 69Z'],
    water: [],
    moon: ['M57 24C48 34 45 44 48 54C51 64 60 71 71 73'],
    thunder: [],
    gold: ['M19 45C29 37 38 38 47 43','M22 65C32 59 40 62 49 68'],
    star: []
  };
  const flecks = {
    fire:['M34 62L39 60','M54 31L58 35','M50 75L55 72'],
    water:['M23 51L29 52','M69 38L75 37','M28 72L34 73','M65 64L70 62'],
    moon:['M39 49L42 48','M61 72L66 74','M54 28L58 25'],
    thunder:['M35 50L42 49','M54 62L60 56','M65 31L69 29'],
    gold:['M20 45L25 42','M42 38L47 40','M24 67L29 65','M64 73L69 71'],
    star:['M43 42L47 40','M55 71L60 72','M63 34L67 32']
  };
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  function describe(p={}) {
    const turn=clamp(p.turn??1,1,100),quality=clamp(p.quality??0,0,4);
    const runes=[...new Set(p.runes||[])].filter(name=>definitions[name]).slice(0,6);
    const runeLevels=Object.fromEntries(runes.map(name=>[name,Math.max(1,Number(p.runeLevels?.[name])||((name==='金纹'||name==='星痕')?2:1))]));
    const nature=p.nature||p.order?.nature||'neutral';
    const shield=!!p.shield,moonCharge=!!(p.moonCharge||p.toolProgress?.moonCharge);
    const stage=turn>=60?3:turn>=30?2:turn>=10?1:0;
    const growth=(turn-1)/99;
    const appearance=palettes.resolve(nature,p.appearance);
    const key=JSON.stringify([appearance,nature,turn,quality,runes,runeLevels]);
    return {appearance,nature,turn,quality,runes,runeLevels,shield,moonCharge,stage,growth,key,
      stageName:['初显','凝实','分枝','贯通'][stage]};
  }
  function sealPath(ctx,shape,fill,ink,scaleFactor,alpha,highlight) {
    const path=new Path2D(shape);
    ctx.globalAlpha=alpha*.96;ctx.fillStyle=ink;ctx.fill(path);
    ctx.globalAlpha=alpha;ctx.strokeStyle=ink;ctx.lineWidth=2.4*scaleFactor;ctx.lineJoin='round';ctx.stroke(path);
    ctx.fillStyle=fill;ctx.fill(path);
    if(highlight){ctx.globalAlpha=alpha*.72;ctx.strokeStyle=highlight;ctx.lineWidth=1.55*scaleFactor;ctx.stroke(path);}
  }
  function starNode(ctx,fill,ink,scaleFactor,alpha) {
    const path=new Path2D('M66 25L69 39L83 42L69 46L66 62L62 47L48 43L62 39Z');
    ctx.globalAlpha=alpha*.96;ctx.fillStyle=ink;ctx.fill(path);ctx.strokeStyle=ink;ctx.lineWidth=2.2*scaleFactor;ctx.stroke(path);
    ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fill(path);ctx.globalAlpha=alpha*.72;ctx.strokeStyle='#fff0d0';ctx.lineWidth=1.25*scaleFactor;ctx.stroke(path);
  }
  function thunderNode(ctx,fill,ink,scaleFactor,alpha) {
    const path=new Path2D('M71 22L78 29L71 36L64 29Z');
    ctx.globalAlpha=alpha*.9;ctx.fillStyle=ink;ctx.fill(path);ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fill(path);
  }
  function waterDrop(ctx,fill,ink,scaleFactor,alpha) {
    const path=new Path2D('M79 71C84 65 88 65 91 71C91 77 87 80 84 80C81 80 79 77 79 71Z');
    ctx.globalAlpha=alpha*.9;ctx.fillStyle=ink;ctx.fill(path);ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fill(path);
  }
  function levelAccent(ctx,kind,fill,ink,scaleFactor,alpha) {
    const shapes={
      fire:'M69 30C75 25 81 26 84 31C78 30 75 34 72 38Z',
      water:'M33 27C38 22 43 22 47 25C42 26 40 29 38 33Z',
      moon:'M28 63C22 67 20 72 22 76C26 72 29 70 33 68Z',
      thunder:'M74 62L83 66L78 72L70 68Z',
      gold:'M78 27C84 22 88 24 90 29C85 28 83 31 81 35Z',
      star:'M30 60L36 64L31 70L25 66Z'
    };
    const shape=shapes[kind];if(!shape)return;
    const path=new Path2D(shape);ctx.globalAlpha=alpha*.92;ctx.fillStyle=ink;ctx.fill(path);ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.fill(path);
    ctx.globalAlpha=alpha*.7;ctx.strokeStyle='#fff0d0';ctx.lineWidth=1.2*scaleFactor;ctx.stroke(path);
  }
  function sealFlecks(ctx,kind,color,alpha,scaleFactor) {
    (flecks[kind]||[]).forEach((shape,i)=>{
      const path=new Path2D(shape);ctx.globalAlpha=alpha*(i%2?.5:.34);ctx.strokeStyle=i%2?'#fff0d0':color;ctx.lineWidth=1.35*scaleFactor;ctx.lineCap='round';ctx.stroke(path);
    });
  }
  function stackSlots(marks) {
    const others=marks.slice(0,-1),primary=definitions[marks[marks.length-1]]?.kind;
    if(others.length===1){
      if(['moon','star'].includes(primary))return [[.24,.72,-.22]];
      if(['water','gold'].includes(primary))return [[.78,.72,.22]];
      return [[.23,.23,-.22]];
    }
    if(others.length===2)return [[.23,.23,-.22],[.77,.77,.18]];
    return [[.20,.26,-.35],[.50,.15,.08],[.81,.29,.35],[.79,.73,.32],[.27,.79,-.2]];
  }
  function glyph(ctx,name,x,y,size,angle,d,secondary=false) {
    const def=definitions[name];if(!def)return;
    const g=d.growth,e=Math.sqrt(g),scale=.64+.36*e;
    const stage=d.stage;
    const level=Math.max(1,Number(d.runeLevels?.[name])||((name==='金纹'||name==='星痕')?2:1));
    const shapes=seals[def.kind]||[];
    const details=detailPaths[def.kind]||[];
    ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(angle);ctx.scale(size/100*(secondary?.88:.96),size/100);ctx.translate(-50,-50);
    ctx.translate(28,73);ctx.scale(scale,scale);ctx.translate(-28,-73);
    ctx.lineJoin='round';ctx.lineCap='round';
    const strength=.38+.62*e,alpha=(secondary?.76:1)*(.82+d.quality*.045)*(secondary?.9:1),scaleFactor=secondary?.72:1;
    const redOnRed=['lead-red','copper-red'].includes(d.appearance)&&def.kind==='fire';
    const lightBody=['lead-yellow','tin-white'].includes(d.appearance),earth={fire:'#a75b3c',moon:'#8e7954',thunder:'#94703d',gold:'#8c6434',star:'#76667c'};
    const fill=redOnRed?'#efaa79':lightBody?(earth[def.kind]||def.color):def.color;
    const sealScale=.92+.08*strength;
    ctx.save();ctx.translate(50,52);ctx.scale(sealScale,sealScale);ctx.translate(-50,-52);
    shapes.forEach((shape,i)=>{
      const localAlpha=alpha*(i===0?1:Math.max(.42,strength));
      sealPath(ctx,shape,fill,def.ink||'#46372b',scaleFactor,localAlpha,def.light);
    });
    const detailAlpha=alpha*(.18+.27*stage+.18*strength);
    details.forEach(shape=>sealPath(ctx,shape,fill,def.ink||'#46372b',scaleFactor,detailAlpha,def.light));
    if(stage>=1&&def.kind==='water')waterDrop(ctx,fill,def.ink||'#46372b',scaleFactor,alpha*(.22+.18*stage+.16*strength));
    if(stage>=1&&def.kind==='thunder')thunderNode(ctx,fill,def.ink||'#46372b',scaleFactor,alpha*(.22+.18*stage+.16*strength));
    if(stage>=1&&def.kind==='star')starNode(ctx,fill,def.ink||'#46372b',scaleFactor,alpha*(.22+.18*stage+.16*strength));
    if(stage>=2)sealFlecks(ctx,def.kind,def.light,alpha*(.35+.18*stage+.20*strength),scaleFactor);
    if(level>=2)levelAccent(ctx,def.kind,fill,def.ink||'#46372b',scaleFactor,alpha*(.44+.12*stage));
    ctx.restore();
    ctx.restore();
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return hit;}
    const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d');
    const im=window.AlchemyAssets?.getImage(palettes.sources[d.appearance]);if(!im?.naturalWidth)return {canvas:c,url:c.toDataURL(),description:d};
    const frame=palettes.frame(d.appearance,d.turn), sx=frame*SIZE;
    ctx.save();
    ctx.drawImage(im,sx,0,SIZE,SIZE,0,0,SIZE,SIZE);
    // Keep pigment and light within the painted pill's irregular outline.
    ctx.globalCompositeOperation='source-atop';
    const marks=d.runes,primary=marks[marks.length-1],others=marks.slice(0,-1);
    const surface=document.createElement('canvas');surface.width=surface.height=SIZE;const ink=surface.getContext('2d');
    const slots=stackSlots(marks);
    const secondarySize=others.length<=2?.42:others.length<=4?.32:.28;
    others.forEach((name,i)=>{const [x,y,a]=slots[i];const size=SIZE*secondarySize;glyph(ink,name,SIZE*x-size/2,SIZE*y-size/2,size,a,d,true);});
    if(primary){const primaryScale=marks.length>=5?.68:marks.length>=3?.73:.78;const size=SIZE*primaryScale;glyph(ink,primary,128-size/2,130-size/2,size,0,d);}
    // Borrow the actual painted body's patches and light direction inside the pigment only.
    ink.globalCompositeOperation='source-atop';ink.globalAlpha=.24;ink.drawImage(im,sx,0,SIZE,SIZE,0,0,SIZE,SIZE);
    ink.globalAlpha=1;const shade=ink.createLinearGradient(30,30,210,235);shade.addColorStop(0,'#30231b00');shade.addColorStop(1,'#30231b40');ink.fillStyle=shade;ink.fillRect(0,0,SIZE,SIZE);ctx.drawImage(surface,0,0);
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
  window.AlchemyPillArt={image,draw,describe,selection,hydrate,definitions,bodySource:BODY,bodySources:BODIES,paletteSources:palettes.sources,hues:['#D5DEE1','#91B78B','#74A9D4','#B091CC','#DFB87C'],get cacheSize(){return cache.size;},get feedback(){return feedback;}};
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();});
  window.addEventListener('alchemy:render',()=>{const d=describe(window.AlchemyGame.snapshot());if(current?.key!==d.key){previous=current;current=d;}});
  window.addEventListener('alchemy:refine-result',e=>{const d=describe(window.AlchemyGame.snapshot());feedback={key:d.key,start:performance.now(),outcome:e.detail.outcome,previous:previous?.key||null};window.dispatchEvent(new Event('alchemy:pill-surface'));});
  window.addEventListener('alchemy:view-ready',()=>{feedback=null;});
  window.addEventListener('alchemy:assets-ready',()=>hydrate());
})();
