(() => {
 'use strict';
 const stage=document.getElementById('pillStage'),canvas=document.createElement('canvas');canvas.id='refineAnimation';canvas.setAttribute('aria-hidden','true');stage.append(canvas);const ctx=canvas.getContext('2d');let phase=null,raf=0,serial=0,frames=0;
 function stop(){cancelAnimationFrame(raf);raf=0;phase=null;ctx.clearRect(0,0,canvas.width,canvas.height);}
 function fit(){const main=document.getElementById('alchemyScene');if(main&&(canvas.width!==main.width||canvas.height!==main.height)){stop();canvas.width=main.width;canvas.height=main.height;}}
 function start(kind,duration){stop();fit();const s=window.AlchemyGame.snapshot();if(matchMedia('(prefers-reduced-motion: reduce)').matches||s.pillEnded||s.runeChoices?.length||window.AlchemyViewState.snapshot().current!=='work')return;phase={kind,start:performance.now(),duration};serial++;raf=requestAnimationFrame(draw);}
 function glow(x,y,rx,ry,color,alpha){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
 function draw(now){if(!phase)return;if(document.hidden){stop();return;}frames++;ctx.clearRect(0,0,canvas.width,canvas.height);const p=Math.min(1,(now-phase.start)/phase.duration),fade=Math.sin(Math.PI*p),l=window.AlchemyWorldLayout,o=l.objects.pill,f=l.firebox;
  if(phase.kind==='fan'){ctx.save();ctx.strokeStyle='#f2e2b4';ctx.lineWidth=2;ctx.globalAlpha=fade*.65;for(let i=0;i<3;i++){const y=f.y+f.h*(.3+i*.2);ctx.beginPath();ctx.moveTo(f.x+f.w*1.4-p*f.w*.2,y);ctx.quadraticCurveTo(f.x+f.w*.9,y-f.h*.08,f.x+f.w*.55,y);ctx.stroke();}ctx.restore();}
  else{const bad=['damage','explode'].includes(phase.kind),color=bad?'#b66b43':phase.kind==='shield'?'#bdd6b0':'#efd18d';glow(o.x+o.w/2,o.y+o.h/2,o.w*.7,o.h*.65,color,fade*(bad?.35:.22));}
  if(p<1)raf=requestAnimationFrame(draw);else stop();
 }
 window.addEventListener('alchemy:fanning',()=>start('fan',500));window.addEventListener('alchemy:feedback',e=>{const k=e.detail.event;if(['collect','win','loss'].includes(k)){stop();return;}if(['success','big','hold','damage','explode','shield','fusion','complete'].includes(k))start(k,600);});
 for(const name of ['alchemy:order','alchemy:view-ready','blur'])window.addEventListener(name,stop);window.addEventListener('alchemy:world-layout',()=>{stop();fit();});fit();window.AlchemyRefineAnimation={get phase(){return phase?.kind||null;},get frames(){return frames;},get serial(){return serial;}};
})();
