/* Living fire, confined to the painted firebox. No game random numbers or saved state. */
(() => {
  'use strict';
  const stage = document.getElementById('pillStage');
  const canvas = document.createElement('canvas');
  canvas.id = 'furnaceLivingFire'; canvas.width = 192; canvas.height = 144;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {position:'absolute', pointerEvents:'none', zIndex:'14'});
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  stage.append(canvas);
  const field = document.createElement('canvas'); field.width = 112; field.height = 88;
  const fx = field.getContext('2d'), pixels = fx.createImageData(112, 88);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.getElementById('mainMenu');
  let impulse = -2000, last = 0, frame = 0, running = false, geometry = '', flow = 0, wasBusy = false;
  const clamp = x => Math.max(0, Math.min(1, x));
  const hash = (x,y) => {let n = Math.imul(x,374761393) + Math.imul(y,668265263); n = Math.imul(n ^ n >>> 13,1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967295;};
  function noise(x,y) {
    const ix=Math.floor(x), iy=Math.floor(y); let u=x-ix,v=y-iy;
    u=u*u*(3-2*u);v=v*v*(3-2*v);
    const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
  }
  function paint(t, power, quiet, surge = 0) {
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.save(); ctx.scale(W,H);
    // The iron rim and foreground coals remain visible around the interior.
    ctx.beginPath(); ctx.moveTo(.035,.91); ctx.lineTo(.035,.43);
    ctx.bezierCurveTo(.035,.04,.83,-.04,.955,.40);
    ctx.lineTo(.975,.91);ctx.closePath();ctx.clip();
    const shade=ctx.createLinearGradient(0,0,0,1);
    shade.addColorStop(0,'rgba(47,25,14,.92)');shade.addColorStop(.62,'rgba(67,28,12,.86)');shade.addColorStop(1,'rgba(56,24,12,0)');
    ctx.fillStyle=shade;ctx.fillRect(0,0,1,1);
    const time=quiet?1.7:t*.001, data=pixels.data;
    for(let y=0;y<88;y++)for(let x=0;x<112;x++){
      const u=x/111,v=y/87, rise=1-v;
      const warp=noise(u*3.6+8,v*3.8-time*1.8)-.5;
      const n=noise(u*9+warp*2,v*2.7-time*2.8)*.72+noise(u*19+warp*3,v*6-time*4.8)*.28;
      const width=Math.max(.12,.40+power*.09-rise*.20), side=Math.abs(u-.5+warp*rise*.23)/width;
      const heat=clamp((1-rise/(.53+power*.42)-side*side*.68+(n-.53)*(1.15+rise*.3))*1.35);
      const i=(y*112+x)*4;
      data[i]=Math.min(255,175+heat*135); data[i+1]=Math.max(0,heat*300-42);
      data[i+2]=Math.max(0,(heat-.73)*520)+surge*heat*28;
      data[i+3]=clamp(heat*3)*clamp((1-v)*10)*clamp((v-.06)*12)*220;
    }
    fx.putImageData(pixels,0,0);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(field,0,.06,1,.83);
    // Sparse embers ride the updraft, rather than radiating out of the furnace.
    if(!quiet)for(let i=0;i<7+Math.floor(surge*10);i++){
      const age=(time*(.42+i*.019)+i*.173)%1;
      const x=.23+hash(i,4)*.52+Math.sin(age*8+i)*.035;
      const y=.82-age*.68;
      ctx.globalAlpha=Math.sin(age*Math.PI)*(.35+power*.35);
      ctx.fillStyle=i%3?'#ffc36a':'#ffe6a1';ctx.beginPath();ctx.ellipse(x,y,.0035,.008,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1; frame++;
  }
  function tick(t) {
    requestAnimationFrame(tick);
    if(t-last<33) return;
    const dt=Math.min(66,t-last);last=t;
    const s=window.AlchemyGame.snapshot(),v=window.AlchemyViewState.snapshot();
    const visible=!document.hidden && s.started && v.current==='work' && (!menu || menu.hidden);
    canvas.hidden=!visible; running=false;
    if(!visible){impulse=-2000;wasBusy=false;return;}
    const key=(v.workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
    const p=window.AlchemySceneProjection?.[key];if(!p)return;
    const width=parseFloat(stage.style.getPropertyValue('--room-base-width'));
    const height=parseFloat(stage.style.getPropertyValue('--room-base-height'));
    const top=parseFloat(stage.style.getPropertyValue('--scene-image-top'))||0;
    const r={left:p.fire.x*width,top:top+p.fire.y*height,width:p.fire.w*width,height:p.fire.h*height};
    const next=JSON.stringify(r);if(next!==geometry){geometry=next;for(const k in r)canvas.style[k]=r[k]+'px';}
    const quiet=media.matches||window.AlchemyGameFeel?.reduced;
    const busy=!s.pillEnded && (s.busy || window.AlchemyScene2D?.busy);
    if(busy&&!wasBusy)impulse=t;
    wasBusy=busy;
    const age=t-impulse;
    // Fast intake, a readable crest, then an eased fall. This outlasts the 100ms settlement.
    const pulse=age<100 ? clamp(age/100) : age<500 ? 1 : clamp(1-(age-500)/800)**2;
    const surge=quiet ? 0 : Math.max(pulse,busy ? .7 : 0);
    const power=s.pillEnded ? .20 : .40+surge*.95;
    flow+=dt*(1+surge*1.65);
    const state=[key,quiet,power,next].join(':');
    if(quiet && canvas.dataset.state===state)return;
    canvas.dataset.state=state;canvas.dataset.mode=quiet?'still':s.pillEnded?'embers':surge>.15?'stoking':'burning';
    canvas.dataset.surge=surge.toFixed(3);
    running=!quiet;paint(quiet?1700:flow,power,quiet,surge);
  }
  window.addEventListener('alchemy:fanning',()=>{impulse=performance.now();});
  window.addEventListener('alchemy:feedback',e=>{if(e.detail?.autoStep)impulse=performance.now();});
  window.AlchemyFurnaceFire={get frames(){return frame;},get running(){return running;}};
  requestAnimationFrame(tick);
})();
