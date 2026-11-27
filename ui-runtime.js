/* === Consolidated source: pill-body.js === */
(() => {
  'use strict';
  const BODIES = Object.freeze({warm:'assets/pill-mineral/warm.webp',neutral:'assets/pill-mineral/neutral.webp',cool:'assets/pill-mineral/cool.webp'});
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
    if (window.AlchemyWarmStyle) {
      // Missing artwork remains a readable matte placeholder in the experiment palette.
      ctx.fillStyle=shade[nature]||shade.neutral;ctx.strokeStyle='#62452f';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(42,132);ctx.bezierCurveTo(35,83,76,39,126,41);ctx.bezierCurveTo(177,37,216,79,213,131);ctx.bezierCurveTo(214,180,170,218,124,213);ctx.bezierCurveTo(79,217,43,180,42,132);ctx.closePath();ctx.fill();ctx.stroke();ctx.save();ctx.clip();
      ctx.fillStyle='#d3ad75';ctx.beginPath();ctx.moveTo(34,99);ctx.lineTo(105,47);ctx.lineTo(174,40);ctx.lineTo(201,82);ctx.lineTo(119,125);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#62452f';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(66+i*18,167);ctx.lineTo(79+i*18,185);ctx.stroke();}ctx.restore();
      const entry={canvas,url:canvas.toDataURL('image/png')};fallback.set(nature,entry);return entry;
    }
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
  const craftFrames={"bird":[[43,173,220,187],[320,120,275,239],[639,71,272,289],[953,131,287,229],[27,446,264,321],[321,518,320,231],[650,455,284,315],[961,472,284,271],[27,860,272,344],[311,844,304,358],[622,870,412,325]],"lion":[[90,158,160,188],[347,92,211,257],[640,93,260,256],[956,90,270,260],[34,443,256,281],[317,484,306,220],[652,426,225,290],[942,442,288,277],[15,888,273,253],[315,861,286,275],[623,811,321,345]],"home":[[8,175,300,245],[324,165,295,258],[637,157,282,277],[942,168,303,261],[18,494,283,268],[318,508,302,242],[629,528,307,220],[955,472,283,299],[15,841,294,237],[313,840,313,235],[626,824,308,259]],"beast":[[21,133,259,222],[313,105,291,249],[632,92,299,262],[946,103,305,250],[9,448,297,307],[305,500,298,255],[624,492,318,261],[955,501,271,231],[14,884,293,286],[307,895,304,269],[624,879,321,294]],"tower":[[52,117,223,289],[353,135,236,269],[672,91,226,316],[1005,60,194,352],[13,498,285,259],[320,483,297,281],[624,549,313,202],[945,492,303,257],[4,904,305,283],[311,878,315,311],[624,874,320,315]],"spring":[[37,126,231,264],[304,153,309,235],[631,84,271,319],[915,148,329,242],[11,476,279,280],[294,556,330,190],[626,518,310,212],[946,448,295,314],[4,926,314,238],[319,847,298,310],[623,884,344,291]]};
  function describe(p={}){
    const craft=window.AlchemyCrafts?.get(p.craftKind);if(craft){const turn=Math.max(1,Math.min(100,Number(p.turn)||1));return {craftKind:craft.id,appearance:'craft-'+craft.id,nature:'neutral',quality:p.quality||0,turn,key:craft.id+'/'+window.AlchemyCrafts.stage(turn)}}

    const nature=p.nature||p.order?.nature||'neutral';
    const scars=Math.max(0,Math.min(4,Number(p.scars)||0));
    const appearance=palettes.resolve(nature,p.appearance);
    const turn=Math.max(1,Math.min(100,Number(p.turn)||1));
    const quality=Math.max(0,Math.min(4,Number(p.quality)||0));
    return {nature,appearance,quality,turn,scars,key:appearance+'/'+palettes.frame(appearance,turn)+'/scars-'+scars};
  }
  function make(p) {
    const d=describe(p);if(cache.has(d.key)){const hit=cache.get(d.key);cache.delete(d.key);cache.set(d.key,hit);return {...hit,description:d};}
    if(d.craftKind){
      const def=window.AlchemyCrafts.get(d.craftKind),source=window.AlchemyCrafts.atlas(def.atlas),im=window.AlchemyAssets.getImage(source);
      if(!im){loadAppearance(source);const c=document.createElement('canvas');c.width=c.height=SIZE;return {canvas:c,url:c.toDataURL(),description:d};}
      const index=window.AlchemyCrafts.stage(d.turn),[x,y,w,h]=(window.AlchemyWarmGrowth?.frames[def.atlas]||craftFrames[def.atlas])[index];
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
    if(d.scars>0){
      const cracks=[
        [[90,66],[108,94],[99,118],[118,144]],
        [[164,74],[148,100],[158,128],[138,158]],
        [[78,128],[102,140],[114,168]],
        [[154,148],[172,170],[150,188]]
      ];
      ctx.save();
      ctx.globalCompositeOperation='source-atop';
      ctx.lineCap='round';ctx.lineJoin='round';
      for(let i=0;i<d.scars&&i<cracks.length;i++){
        const pts=cracks[i];
        ctx.strokeStyle='#ead7b8';ctx.lineWidth=3.8;ctx.globalAlpha=.42;
        ctx.beginPath();ctx.moveTo(pts[0][0]+1,pts[0][1]+1);for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k][0]+1,pts[k][1]+1);ctx.stroke();
        ctx.strokeStyle='#4b2a1c';ctx.lineWidth=2.5;ctx.globalAlpha=Math.min(.88,.55+d.scars*.1);
        ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k][0],pts[k][1]);ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    const entry={canvas:c,url:c.toDataURL('image/png'),description:d};cache.set(d.key,entry);if(cache.size>48)cache.delete(cache.keys().next().value);return entry;
  }
  const image=p=>make(p).url;
  function geometry(p){const d=describe(p);if(!d.craftKind)return null;const def=window.AlchemyCrafts.get(d.craftKind),rect=(window.AlchemyWarmGrowth?.frames[def.atlas]||craftFrames[def.atlas])[window.AlchemyCrafts.stage(d.turn)],scale=236/Math.max(rect[2],rect[3]);return {w:rect[2]*scale/SIZE,h:rect[3]*scale/SIZE};}
  let current=null,previous=null,feedback=null;
  function draw(ctx,x,y,size,p){
    const rendered=make(p),d=rendered.description;
    const motion=window.AlchemyGameFeel?.sample();
    ctx.save();
    if(motion){ctx.translate(x+size/2,y+size/2+motion.lift*size);ctx.scale(motion.sx,motion.sy);ctx.translate(-x-size/2,-y-size/2);}
    const performanceActive=(!d.craftKind||window.AlchemyWarmGrowth)&&window.AlchemyRefinePerformance?.drawPill(ctx,rendered.canvas,x,y,size);
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
  window.AlchemyPillArt={image,draw,describe,geometry,selection,hydrate,bodySource:BODY,bodySources:BODIES,paletteSources:palettes.sources,hues:['#D5DEE1','#91B78B','#74A9D4','#B091CC','#DFB87C'],get cacheSize(){return cache.size;},get feedback(){return feedback;}};
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();});
  window.addEventListener('alchemy:render',()=>{const d=describe(window.AlchemyGame.snapshot());if(current?.key!==d.key){previous=current;current=d;}});
  window.addEventListener('alchemy:refine-result',e=>{const d=describe(window.AlchemyGame.snapshot());feedback={key:d.key,start:performance.now(),outcome:e.detail.outcome,previous:previous?.key||null};window.dispatchEvent(new Event('alchemy:pill-surface'));});
  window.addEventListener('alchemy:view-ready',()=>{feedback=null;});
  window.addEventListener('alchemy:assets-ready',()=>hydrate());
})();
;
/* === Consolidated source: ui-runtime.js === */
/* Shared presentation helpers; business state stays in AlchemyGame. */
(() => {
 'use strict';
 const api=window.AlchemyGame;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function focusKey(el){if(!el)return null;if(el.id)return '#'+CSS.escape(el.id);for(const a of ['data-focus-key','data-world-view','data-pill-id','data-sell-pill','data-inspect','data-material-inspect','data-market-tab','data-world-tool','data-replace-equipment','data-slot','data-view','data-kind'])if(el.hasAttribute?.(a)){let key='['+a+'="'+CSS.escape(el.getAttribute(a))+'"]';if(a==='data-kind'&&el.dataset.id!==undefined)key+='[data-id="'+CSS.escape(el.dataset.id)+'"]';return key;}return null;}
 function html(host,content){const key=host.contains(document.activeElement)?focusKey(document.activeElement):null,scroll=host.scrollTop;host.innerHTML=content;host.scrollTop=scroll;if(key)host.querySelector(key)?.focus({preventScroll:true});}
 function revealSubmission(panel, preview, button) {
  if (!preview?.getClientRects().length || !button?.getClientRects().length) return;
  const bounds = panel.getBoundingClientRect();
  const top = bounds.top + panel.clientTop + 4;
  const bottom = top + panel.clientHeight - 8;
  const previewTop = preview.getBoundingClientRect().top;
  const buttonBottom = button.getBoundingClientRect().bottom;
  if (previewTop < top) panel.scrollTop += previewTop - top;
  else if (buttonBottom > bottom) panel.scrollTop += buttonBottom - bottom;
 }
 function submissionSummary(quote) {
  if (!quote.ok) return '';
  const progress = '交丹后 ' + Math.round(quote.after) + ' / ' + quote.target;
  if (!quote.complete) return progress + ' · 还需 ' + Math.ceil(quote.target - quote.after) + ' 药力';
  return progress + ' · 可交齐 · 到账 ' + quote.reward + ' 铜钱';
 }
 function restore(key,fallback){const el=key&&document.querySelector(key);(el?.isConnected&&!el.inert&&el.getClientRects().length?el:fallback)?.focus?.({preventScroll:true});}
 function art(p){const a=window.AlchemyPillArt,d=a.describe(p),state={...(p.craftKind?{craftKind:p.craftKind}:{}),appearance:d.appearance,nature:d.nature,turn:d.turn,quality:d.quality};return '<span class="ux-pill-art" data-pill-art-state="'+esc(JSON.stringify(state))+'" data-pill-art-key="'+esc(d.key)+'"><img src="'+a.image(state)+'" alt=""></span>';}
 let blocked='',blockScope='',noticeTimer;
 function scope(){const s=api.snapshot(),c=api.campaign();return [c?.day,c?.phase,s.orderId,s.attempt,s.turn,s.pillEnded,s.roundEnded,s.busy,c?.economy?.coins].join('|');}
 function tell(message){blocked=message;blockScope=scope();const el=document.getElementById('workInstruction');if(el){el.hidden=false;el.textContent=message;}window.dispatchEvent(new Event('alchemy:ux-layout'));}
 function instruction(s,held){if(blocked&&blockScope===scope())return blocked;blocked='';if(held){if(window.AlchemyFurnaceGuidance)return '';return held==='pill'?'放入收丹盘，或按 Esc 放回。':held==='herbs'?'投入炉口，或按 Esc 放回。':'对火门使用扇子。';}if(s.busy||s.roundEnded||window.AlchemyScene2D?.busy)return '';if(!s.pillEnded&&window.AlchemyViewState?.snapshot().workMode==='room')return '';return window.AlchemyOnboarding?.instruction(s)||'';}
 function notify(el,message){clearTimeout(noticeTimer);el.textContent=message;noticeTimer=setTimeout(()=>{el.textContent='';},1800);}
 const dialog=document.createElement('dialog');dialog.className='ux-confirm';dialog.innerHTML='<h2 id="uxConfirmTitle"></h2><p></p><div><button data-confirm>确认</button><button data-cancel>取消</button></div>';dialog.setAttribute('aria-labelledby','uxConfirmTitle');document.body.append(dialog);
 let confirmation=null;
 function cancelConfirm(){if(!confirmation)return;const entry=confirmation;confirmation=null;dialog.close();restore(entry.focus,document.querySelector('.world-location-toggle'));}
 function confirm(options){cancelConfirm();confirmation={...options,scope:scope(),location:window.AlchemyViewState?.snapshot().current,focus:focusKey(document.activeElement)};dialog.querySelector('h2').textContent=options.title;dialog.querySelector('p').textContent=options.message;dialog.querySelector('[data-confirm]').textContent=options.confirmLabel||'确认';dialog.showModal();dialog.querySelector('[data-cancel]').focus();}
 dialog.querySelector('[data-cancel]').onclick=cancelConfirm;dialog.querySelector('[data-confirm]').onclick=()=>{const entry=confirmation;if(!entry)return;if(entry.scope!==scope()){cancelConfirm();return;}cancelConfirm();entry.onConfirm();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();cancelConfirm();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
 window.addEventListener('alchemy:view-ready',e=>{blocked='';if(confirmation&&e.detail.view!==confirmation.location)cancelConfirm();});window.addEventListener('alchemy:render',()=>{if(confirmation&&confirmation.scope!==scope())cancelConfirm();if(blockScope!==scope())blocked='';});window.addEventListener('alchemy:carry',()=>{blocked='';});
 window.AlchemyUX={esc,html,revealSubmission,submissionSummary,focusKey,restore,art,tell,instruction,clearInstruction:()=>{blocked='';},notify,confirm,cancelConfirm,get confirming(){return !!confirmation;}};
})();
