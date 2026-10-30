(() => {
  'use strict';
  const stage=document.getElementById('pillStage'),canvas=document.createElement('canvas');
  canvas.id='refineAnimation';canvas.width=1600;canvas.height=900;canvas.setAttribute('aria-hidden','true');stage.append(canvas);
  const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let phase=null,raf=0,serial=0,frames=0;
  const kinds={success:'success',big:'big',fusion:'fusion',complete:'big',hold:'hold',damage:'damage',explode:'explode',shield:'shield',collect:'collect',win:'collect'};
  function stop(){cancelAnimationFrame(raf);raf=0;phase=null;ctx.clearRect(0,0,1600,900);}
  function start(kind,duration){stop();phase={kind,start:performance.now(),duration,id:++serial};raf=requestAnimationFrame(draw);}
  function glow(x,y,rx,ry,color,alpha){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  function draw(now){if(!phase)return;frames++;ctx.clearRect(0,0,1600,900);const {kind,start,duration}=phase,p=Math.min(1,(now-start)/duration),fade=Math.sin(Math.PI*p),t=(now-start)/1000;
    if(document.hidden){stop();return;}
    if(reduce){glow(kind==='fan'?550:605,kind==='fan'?675:375,95,45,kind==='damage'||kind==='explode'?'#9a5d45':'#efbd66',fade*.4);}
    else if(kind==='fan'){
      // Two directed gusts: outside the fire door, then inward. Not a fan orbiting the stove.
      const stroke=(p*2)%1;
      ctx.strokeStyle='#f2e2b4';ctx.lineWidth=2.5;ctx.globalAlpha=Math.sin(stroke*Math.PI)*.8;
      for(let i=0;i<4;i++){const y=650+i*17;ctx.beginPath();ctx.moveTo(665-stroke*80,y+12);ctx.bezierCurveTo(625-stroke*65,y-16,595-stroke*35,y+10,555,y);ctx.stroke();}
      ctx.globalAlpha=1;glow(550,685,85,100,'#ffd389',.25+.6*Math.abs(Math.sin(p*Math.PI*2)));
      ctx.save();ctx.beginPath();ctx.ellipse(548,690,44,51,0,0,Math.PI*2);ctx.clip();
      for(let i=0;i<5;i++){const x=520+i*14,y=728,h=28+22*Math.sin(t*16+i);ctx.fillStyle=i%2?'#f7b754bb':'#ffe6a2bb';ctx.beginPath();ctx.moveTo(x-9,y);ctx.quadraticCurveTo(x-13,y-h*.5,x+Math.sin(t*12+i)*7,y-h);ctx.quadraticCurveTo(x+16,y-h*.3,x+10,y);ctx.fill();}ctx.restore();
      sparks(p,14,548,665,'#ffd58c',35,60);
    }else if(kind==='damage'||kind==='explode'){
      const blast=kind==='explode';glow(605,380,blast?190:125,80,'#c2693f',fade*.65);
      for(let i=0;i<(blast?13:6);i++){const q=Math.max(0,p-i*.018);ctx.globalAlpha=(1-q)*.24;ctx.fillStyle=blast?'#534b43':'#8e7e65';ctx.beginPath();ctx.ellipse(610+Math.sin(i*7)*q*110,360-q*110,(16+q*32),(12+q*25),0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
      sparks(p,blast?25:10,605,375,'#b6744c',blast?180:80,60);
    }else{
      const color=kind==='fusion'?'#b8c8e2':kind==='shield'?'#bdd6b0':kind==='hold'?'#b9ad87':'#f5ce80';
      glow(605,380,kind==='big'?200:140,55,color,fade*(kind==='hold'?.25:.65));
      ctx.strokeStyle=color;ctx.lineWidth=kind==='big'?4:2;ctx.globalAlpha=fade;
      ctx.beginPath();ctx.ellipse(605,383,110+p*24,20+p*8,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      if(kind!=='hold')sparks(p,kind==='big'?24:12,605,375,color,100,kind==='big'?135:85);
      if(kind==='collect')glow(1420,520,100,40,'#f6d597',fade*.7);
    }
    if(p<1)raf=requestAnimationFrame(draw);else stop();
  }
  function sparks(p,n,x,y,color,spread,rise){ctx.fillStyle=color;for(let i=0;i<n;i++){const q=(p+i/n*.4)%1;ctx.globalAlpha=Math.sin(q*Math.PI)*(1-p)*.8;ctx.beginPath();ctx.ellipse(x+Math.sin(i*12.3)*spread*q,y-rise*q+Math.cos(i)*10,1.8,3,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  window.addEventListener('alchemy:fanning',()=>start('fan',500));
  window.addEventListener('alchemy:feedback',e=>{const kind=kinds[e.detail.event];if(kind)start(kind,kind==='explode'?1050:kind==='big'?1100:750);});
  window.addEventListener('alchemy:order',stop);window.addEventListener('blur',stop);
  window.AlchemyRefineAnimation={get phase(){return phase?.kind||null;},get frames(){return frames;},get serial(){return serial;}};
})();
