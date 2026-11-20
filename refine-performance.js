/* Furnace heat and pill results: presentation only, driven by real actions/results. */
(() => {
  'use strict';
  const stage=document.getElementById('pillStage'),main=document.getElementById('alchemyScene');
  const layer=document.createElement('canvas');layer.id='refinePerformance';layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'15'});stage.append(layer);
  const ctx=layer.getContext('2d'),surface=document.createElement('canvas');surface.width=surface.height=256;
  const sc=surface.getContext('2d'),media=matchMedia('(prefers-reduced-motion: reduce)');
  const kinds=new Set(['success','big','hold','damage','explode','complete']);
  let heating=-10000,result=null,last=0,busyBefore=false,lid=null,openedLid=null,frames=0;
  const quiet=()=>media.matches||window.AlchemyGameFeel?.reduced;
  const clamp=x=>Math.max(0,Math.min(1,x));
  function releaseLid(){if(openedLid){openedLid.style.visibility=stage.dataset.lidState==='closed'?'visible':'hidden';openedLid=null;}}
  function stop(){heating=-10000;result=null;ctx.clearRect(0,0,layer.width,layer.height);if(lid)lid.style.transform='';releaseLid();layer.dataset.phase='idle';window.dispatchEvent(new Event('alchemy:pill-surface'));}
  function begin(){if(!quiet())heating=performance.now();}
  function visible(){return !document.hidden&&window.AlchemyViewState.snapshot().current==='work'&&document.getElementById('mainMenu').hidden;}
  function glow(x,y,rx,ry,color,alpha){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  function puff(x,y,size,alpha,color){glow(x,y,size,size*.65,color,alpha);}
  function steam(m,t,strength){
    // Thin, soft puffs rise from the back-right lid seam, never from solid clay.
    for(let i=0;i<6;i++){
      const age=(t/1050+i*.17)%1;
      const x=m.x+m.w*(.68+i*.018)+Math.sin(age*5+i)*m.w*.018;
      const y=m.y+m.h*.30-age*m.w*.18;
      puff(x,y,m.w*(.018+age*.024),Math.sin(age*Math.PI)*strength*.40,'#e7dfce');
    }
  }
  function draw(now){
    requestAnimationFrame(draw);if(now-last<30)return;last=now;
    if(layer.width!==main.width||layer.height!==main.height){layer.width=main.width;layer.height=main.height;}
    if(!visible()||quiet()){if(result||heating>-10000)stop();return;}
    ctx.clearRect(0,0,layer.width,layer.height);frames++;
    const L=window.AlchemyWorldLayout,m=L.mouth,f=L.firebox;
    const elapsed=now-heating,heat=elapsed<180?clamp(elapsed/180):clamp(1-(elapsed-180)/1250);
    lid=stage.querySelector('#lid-patch-mask')?.closest('svg');
    releaseLid();
    if(lid)lid.style.transform='';
    if(heat>0){
      // Clip reflected firelight to the furnace silhouette below its rim.
      ctx.save();ctx.beginPath();ctx.moveTo(m.x,m.y+m.h*.55);
      ctx.bezierCurveTo(m.x-m.w*.05,f.y,m.x+m.w*.08,f.y+f.h,m.x+m.w*.40,f.y+f.h);
      ctx.lineTo(m.x+m.w*.95,f.y+f.h*.7);
      ctx.quadraticCurveTo(m.x+m.w*1.08,f.y,m.x+m.w,m.y+m.h*.55);ctx.closePath();ctx.clip();
      ctx.globalCompositeOperation='soft-light';
      glow(f.x+f.w*.48,f.y+f.h*.05,m.w*.58,Math.max(f.y-m.y,m.h)*.85,'#ffa14d',heat*.65);
      glow(f.x+f.w*.5,f.y-f.h*.12,f.w*.85,f.h*1.2,'#ffc477',heat*.7);
      ctx.restore();
      steam(m,elapsed,heat);
      if(lid&&stage.dataset.lidState==='closed')lid.style.transform=`translate(${Math.sin(elapsed*.044)*heat*.6}px,${Math.sin(elapsed*.061)*heat*.4}px)`;
    }
    if(result){
      const t=clamp((now-result.start)/result.duration),fade=Math.sin(t*Math.PI),k=result.kind;
      const p=L.objects.pill,d=p.visualDiameter||p.w,x=p.x+p.w/2,y=p.y+p.h/2;
      const major=k==='big'||k==='complete';
      const concealed=stage.dataset.lidState==='closed'&&k!=='explode';
      if(k==='explode'&&lid){lid.style.visibility='hidden';openedLid=lid;}
      // No success glow for a hold. Damage smoke is local; explosion ash leaves the mouth.
      if(!concealed&&(k==='damage'||k==='explode')){
        const explosion=k==='explode',originY=explosion?m.y+m.h*.5:y;
        for(let i=0;i<(explosion?11:4);i++){
          const spread=explosion?m.w*.42:d*.28;
          puff(x+Math.sin(i*2.4)*spread*t,originY-t*(explosion?m.w*.32:d*.7)+(i%3)*d*.05,d*(.10+t*(explosion?.65:.20)),fade*(explosion?.42:.28),'#6b6256');
        }
        if(explosion)for(let i=0;i<16;i++){
          ctx.globalAlpha=fade*.8;ctx.fillStyle=i%2?'#92714a':'#594a3d';const dx=Math.sin(i*2.3)*m.w*.5*t,dy=-Math.abs(Math.cos(i*1.7))*m.w*.35*t+t*t*m.w*.35;
          ctx.fillRect(x+dx,m.y+m.h*.6+dy,Math.max(1,d*.025),Math.max(1,d*.016));
        }
        ctx.globalAlpha=1;
      }else if(!concealed&&k==='hold'){
        puff(x,y-d*.35-t*d*.6,d*(.10+t*.16),fade*.16,'#d5cdbd');
      }else if(!concealed&&major){
        for(let i=0;i<9;i++){
          const angle=i*2.4,dist=d*(.28+t*.55);
          ctx.globalAlpha=fade*.65;ctx.fillStyle='#d3ae68';ctx.beginPath();ctx.ellipse(x+Math.cos(angle)*dist,y+Math.sin(angle)*dist*.6-t*d*.22,Math.max(.8,d*.014),Math.max(.8,d*.021),angle,0,Math.PI*2);ctx.fill();
        }ctx.globalAlpha=1;
      }
      if(t>=1){result=null;releaseLid();window.dispatchEvent(new Event('alchemy:pill-surface'));}
      else window.dispatchEvent(new Event('alchemy:pill-surface'));
    }
    layer.dataset.phase=result?.kind||(heat>0?'heating':'idle');
    layer.dataset.heat=heat.toFixed(3);
  }
  window.addEventListener('alchemy:fanning',()=>{result=null;begin();});
  window.addEventListener('alchemy:render',()=>{const s=window.AlchemyGame.snapshot();if(s.busy&&!busyBefore)begin();busyBefore=s.busy;});
  window.addEventListener('alchemy:feedback',e=>{
    const k=e.detail.event;if(k==='collect'||k==='start'){stop();return;}
    if(kinds.has(k)&&visible()&&!quiet()){
      result={kind:k,start:performance.now(),duration:k==='explode'?1250:k==='hold'?800:1100};
      if(e.detail.autoStep)begin();
      window.dispatchEvent(new Event('alchemy:pill-surface'));
    }
  });
  for(const name of ['alchemy:view-ready','alchemy:order','blur'])window.addEventListener(name,stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});media.addEventListener('change',stop);
  window.AlchemyRefinePerformance={
    owns:kind=>kinds.has(kind)||kind==='fan',get phase(){return result?.kind||null;},get frames(){return frames;},
    drawPill(target,body,x,y,size){
      if(!result||quiet()||!visible()||['hold','explode'].includes(result.kind))return false;
      const t=clamp((performance.now()-result.start)/result.duration),fade=Math.sin(t*Math.PI),k=result.kind,major=['big','complete'].includes(k);
      sc.clearRect(0,0,256,256);sc.globalCompositeOperation='source-over';sc.drawImage(body,0,0,256,256);sc.globalCompositeOperation='source-atop';
      if(k==='damage'){sc.fillStyle=`rgba(37,29,23,${fade*.44})`;sc.fillRect(0,0,256,256);}
      else{
        // A narrow glint crosses only the opaque pill material, with no circular halo.
        const sx=-100+t*450,g=sc.createLinearGradient(sx-55,0,sx+55,0);
        g.addColorStop(0,'transparent');g.addColorStop(.5,`rgba(255,234,181,${fade*(major?.64:.38)})`);g.addColorStop(1,'transparent');
        sc.fillStyle=g;sc.fillRect(0,0,256,256);
      }
      sc.globalCompositeOperation='source-over';
      target.save();const lift=k==='damage'?0:-Math.sin(t*Math.PI)*size*(major?.30:.18)*(1-t);
      const shake=k==='damage'?Math.sin(t*24)*size*.045*(1-t):0;
      target.drawImage(surface,x+shake,y+lift,size,size);target.restore();return true;
    }
  };
  requestAnimationFrame(draw);
})();
