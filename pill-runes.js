/* V145: mineral brush veins on the approved B bodies, shared across all pill views.
 * Growth is derived from saved turn/quality; it never awards runes or changes a roll. */
(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral-v136/warm.webp',neutral:'assets/pill-mineral-v136/neutral.webp',cool:'assets/pill-mineral-v136/cool.webp'});
  const BODY = BODIES.neutral;
  const palettes = window.AlchemyPillPalette;
  const SIZE = 256;
  const cache = new Map();
  let bounds = new WeakMap();
  const definitions = {
    '赤纹': {color:'#cd8d65', light:'#ce9870', kind:'fire'},
    '青纹': {color:'#608477', light:'#91ac95', kind:'water'},
    '月纹': {color:'#c2b38c', light:'#d2c29b', kind:'moon'},
    '雷纹': {color:'#b69a60', light:'#ceb17a', kind:'thunder'},
    '金纹': {color:'#b18b50', light:'#c3a06a', kind:'gold'},
    '星痕': {color:'#a197ac', light:'#b9acbf', kind:'star'}
  };
  // Open, slightly uneven brush spines preserve the six motifs without flat logo fills.
  const veins = {
    fire:['M29 76C19 68 27 56 43 49C57 43 65 31 66 19','M29 70C39 61 55 64 66 56C75 50 75 44 85 41','M37 55C37 42 45 38 44 26','M56 48C70 43 73 28 83 24'],
    water:['M14 48C31 60 39 47 52 37C68 24 78 27 86 32','M17 68C36 79 47 62 59 55C72 48 81 51 87 55','M30 36C39 35 44 24 48 20','M62 76C73 74 79 69 88 74'],
    moon:['M66 17C36 21 23 43 30 63C37 83 61 87 78 76','M58 23C43 38 39 49 48 62C54 71 63 76 75 76','M20 45C16 61 23 76 33 81','M54 90C70 92 83 81 88 73'],
    thunder:['M63 15L31 49L50 47L39 83L74 43L56 45','M42 46L25 35L31 47L18 50','M55 58L74 61L69 72L84 77','M67 27L80 16L76 30L84 28'],
    gold:['M15 44C28 33 42 35 54 40C69 47 80 37 80 25','M15 63C29 52 43 56 56 63C70 70 82 64 88 55','M32 35C22 31 25 20 33 22C40 25 36 30 32 28','M66 75C78 76 82 83 74 89'],
    star:['M48 20C27 30 23 53 37 68C48 80 64 83 77 75','M64 25C64 44 58 47 46 48C60 49 64 57 64 71M64 48C71 46 77 49 83 48','M24 45C20 59 27 75 39 80','M69 30C78 27 83 29 89 23']
  };
  const brushPaths = new Map();
  function brush(shape) {
    if(brushPaths.has(shape))return brushPaths.get(shape);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',shape);
    const length=path.getTotalLength(),points=[];
    for(let n=0;n<=Math.ceil(length/1.2);n++){const t=n/Math.ceil(length/1.2),p=path.getPointAtLength(t*length);points.push({x:p.x,y:p.y,t});}
    brushPaths.set(shape,points);return points;
  }
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  const smooth = (a,b,n) => {const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t);};
  function describe(p={}) {
    const turn=clamp(p.turn??1,1,100),quality=clamp(p.quality??0,0,4);
    const runes=[...new Set(p.runes||[])].filter(name=>definitions[name]).slice(0,6);
    const nature=p.nature||p.order?.nature||'neutral';
    const shield=!!p.shield,moonCharge=!!(p.moonCharge||p.toolProgress?.moonCharge);
    const stage=turn>=60?3:turn>=30?2:turn>=10?1:0;
    const growth=(turn-1)/99;
    const appearance=palettes.resolve(nature,p.appearance);
    const key=JSON.stringify([appearance,nature,turn,quality,runes]);
    return {appearance,nature,turn,quality,runes,shield,moonCharge,stage,growth,key,
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
    const stages=veins[def.kind];
    ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(angle);ctx.scale(size/100*(secondary?.77:.96),size/100);ctx.translate(-50,-50);
    ctx.translate(28,73);ctx.scale(scale,scale);ctx.translate(-28,-73);
    ctx.lineJoin='round';ctx.lineCap='round';
    const strengths=[1,smooth(.04,.28,g),smooth(.22,.58,g),smooth(.55,1,g)];
    // A crescent/star or double wave is one semantic mark, including its initial companion stroke.
    if(['water','gold','star'].includes(def.kind))strengths[1]=.68+.32*e;
    stages.forEach((shape,i)=>{
      const strength=strengths[i];if(strength<.015||(secondary&&i>1))return;
      ctx.save();ctx.globalAlpha=(secondary?.80:1)*(.76+d.quality*.06);
      if(i>0){ctx.translate(36,53);ctx.scale(.45+.55*strength,.45+.55*strength);ctx.translate(-36,-53);ctx.globalAlpha*=strength;}
      const points=brush(shape),redOnRed=['lead-red','copper-red'].includes(d.appearance)&&def.kind==='fire';
      // A thin earth seam under the pigment reads as a vein; no uniform bright outline.
      ctx.strokeStyle='#46372b';ctx.globalAlpha*=.40;ctx.lineWidth=4.3+g*.7;ctx.stroke(new Path2D(shape));ctx.globalAlpha/=.40;
      for(let j=1;j<points.length;j++){
        const a=points[j-1],b=points[j];if(Math.hypot(b.x-a.x,b.y-a.y)>5)continue;
        const taper=.45+.55*Math.pow(Math.sin(Math.PI*b.t),.45),grain=.90+.10*Math.sin(j*1.73+i*2);
        const lightBody=['lead-yellow','tin-white'].includes(d.appearance),earth={fire:'#a75b3c',moon:'#8e7954',thunder:'#94703d',gold:'#8c6434',star:'#76667c'};
        ctx.lineWidth=(3.6+g*.8)*taper*grain;ctx.strokeStyle=redOnRed?'#ce9870':lightBody?(earth[def.kind]||def.color):def.color;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return hit;}
    const c=document.createElement('canvas');c.width=c.height=SIZE;const ctx=c.getContext('2d');
    const im=window.AlchemyAssets?.getImage(palettes.sources[d.appearance]);if(!im?.naturalWidth)return {canvas:c,url:c.toDataURL(),description:d};
    const b=bodyBounds(im),cx=128,cy=128,r=124;
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    ctx.drawImage(im,b.x,b.y,b.w,b.h,4,4,248,248);
    // Colors are painted into the mineral bodies. Do not tint them back to the old blue/olive palette.
    const sheen=ctx.createRadialGradient(82,70,0,88,80,145);sheen.addColorStop(0,'#fff5d8'+Math.round(8+d.quality*4).toString(16).padStart(2,'0'));sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.fillRect(0,0,SIZE,SIZE);
    const marks=d.runes,primary=marks[marks.length-1],others=marks.slice(0,-1);
    const surface=document.createElement('canvas');surface.width=surface.height=SIZE;const ink=surface.getContext('2d');
    const slots=others.length<=2?[[.23,.23,-.22],[.77,.77,.18]]:[[.20,.26,-.35],[.50,.15,.08],[.81,.29,.35],[.79,.73,.32],[.27,.79,-.2]];
    others.forEach((name,i)=>{const [x,y,a]=slots[i];const size=SIZE*.30;glyph(ink,name,SIZE*x-size/2,SIZE*y-size/2,size,a,d,true);});
    if(primary){const size=SIZE*.78;glyph(ink,primary,128-size/2,130-size/2,size,0,d);}
    // Borrow the actual painted body's patches and light direction inside the pigment only.
    ink.globalCompositeOperation='source-atop';ink.globalAlpha=.24;ink.drawImage(im,b.x,b.y,b.w,b.h,4,4,248,248);
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
  window.addEventListener('alchemy:assets-ready',()=>{bounds=new WeakMap();cache.clear();});
  window.addEventListener('alchemy:render',()=>{const d=describe(window.AlchemyGame.snapshot());if(current?.key!==d.key){previous=current;current=d;}});
  window.addEventListener('alchemy:refine-result',e=>{const d=describe(window.AlchemyGame.snapshot());feedback={key:d.key,start:performance.now(),outcome:e.detail.outcome,previous:previous?.key||null};window.dispatchEvent(new Event('alchemy:pill-surface'));});
  window.addEventListener('alchemy:view-ready',()=>{feedback=null;});
  window.addEventListener('alchemy:assets-ready',()=>hydrate());
})();
