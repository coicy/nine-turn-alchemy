(() => {
'use strict';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),duration=11;
let loaded=false,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,t=0,last=0,raf=0,phase='',packetOnTable=false;
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('加载失败：'+src));im.src=src;});
let bg,rig,faces;
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},lerp=(a,b,x)=>a+(b-a)*x;
function sprite(im,bw,bh,r,x,y,w,h){ctx.drawImage(im,r[0]/bw*im.width,r[1]/bh*im.height,r[2]/bw*im.width,r[3]/bh*im.height,x,y,w,h);}
function backdrop(){ctx.drawImage(bg,0,0,1600,900);}
function face(frame,x,y,nod){ctx.save();ctx.translate(x+92,y+170);ctx.rotate(nod);ctx.translate(-92,-170);sprite(faces,2048,780,[frame*682.6667,0,682.6667,780],0,0,184,210);ctx.restore();}
function draw(time){if(!loaded)return;time=Math.max(0,Math.min(duration,time));backdrop();
 const enter=ease(time/.9),exit=ease((time-9)/1.2),offset=lerp(-190,0,enter)+lerp(0,220,exit),alpha=enter*(1-exit),breath=Math.sin(time*2.1)*1.2;
 const offer=ease((time-3.5)/1.25),release=ease((time-4.75)/.5),withdraw=ease((time-5.25)/.8),response=ease((time-7.5)/.4),nod=time>=7.5&&time<8.6?Math.sin((time-7.5)/1.1*Math.PI)*.035:0;
 const angle=lerp(-.10,.08,offer)+withdraw*.20;
 const pivot={x:737+offset,y:368+breath};
 const palm={x:pivot.x+Math.cos(angle)*220-Math.sin(angle)*177,y:pivot.y+Math.sin(angle)*220+Math.cos(angle)*177};
 packetOnTable=time>=5.25;phase=time<.9?'入位':time<3.5?'等候':time<5.25?'递药':time<7.5?'候丹':time<9?'满意回应':time<10.2?'离场':'离柜';
 // Only upper torso/head breathe; the entire figure never stretches.
 ctx.save();ctx.globalAlpha=alpha;sprite(rig,2172,724,[325,10,525,700],700+offset,340+breath,350,467);
 const blink=(time>2.15&&time<2.29)||(time>6.25&&time<6.39);
 const headX=738+offset,headY=169+breath;
 face(response>.3?2:0,headX,headY,nod);
 if(blink){ctx.save();ctx.beginPath();ctx.ellipse(headX+111,headY+85,52,24,0,0,Math.PI*2);ctx.clip();face(1,headX,headY,nod);ctx.restore();}
 ctx.restore();
 // Repaint the exact painted tabletop, then draw the near arm on top of it.
 ctx.save();ctx.beginPath();ctx.rect(0,510,1600,390);ctx.clip();backdrop();ctx.restore();
 if(alpha>0){ctx.save();ctx.globalAlpha=alpha;ctx.translate(pivot.x,pivot.y);ctx.rotate(angle);sprite(rig,2172,724,[943,88,600,570],-65,-23,330,314);ctx.restore();}
 const handBag={x:palm.x-56,y:palm.y-94},land={x:970,y:520},flight=ease((time-4.75)/.5);
 if(time<5.25&&time<10.2){const x=lerp(handBag.x,land.x,flight),y=lerp(handBag.y,land.y,flight)-Math.sin(flight*Math.PI)*12;ctx.save();ctx.globalAlpha=alpha;sprite(rig,2172,724,[1635,325,230,220],x,y,112,107);ctx.restore();}
 else if(time>=5.25){ctx.save();ctx.fillStyle='#4a321d25';ctx.beginPath();ctx.ellipse(1026,624,54,10,0,0,Math.PI*2);ctx.fill();sprite(rig,2172,724,[1635,325,230,220],land.x,land.y,112,107);ctx.restore();}
 document.getElementById('phase').textContent=phase;
 document.getElementById('dialogue').textContent=({入位:'掌柜，叨扰了。',等候:'这包药材，劳烦代炼。',递药:'药材在这里，请收好。',候丹:'不急，掌柜量力而行。',满意回应:'多谢掌柜，药材就托付给你了。',离场:'告辞，下回再来。',离柜:'药包交接演示结束。'})[phase];
 document.getElementById('timeline').value=time;document.getElementById('time').textContent=time.toFixed(1)+' 秒';
}
function tick(now){if(!loaded)return;const dt=Math.min((now-last)/1000,.05);last=now;if(playing){t+=dt;if(t>duration){if(document.getElementById('loop').checked)t%=duration;else{t=duration;playing=false;}}}draw(t);document.getElementById('play').textContent=playing?'暂停':'播放';if(playing)raf=requestAnimationFrame(tick);}
function start(){cancelAnimationFrame(raf);last=performance.now();if(playing)raf=requestAnimationFrame(tick);else draw(t);}
function seek(time){playing=false;t=Math.max(0,Math.min(duration,time));start();document.getElementById('play').textContent='播放';}
document.getElementById('play').onclick=()=>{playing=!playing;if(t>=duration)t=0;start();};document.getElementById('replay').onclick=()=>{t=0;playing=true;start();};document.getElementById('timeline').oninput=e=>seek(+e.target.value);document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>seek(+b.dataset.time));
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;cancelAnimationFrame(raf);document.getElementById('play').textContent='播放';}});
window.MerchantAnimation={seek,play:()=>{playing=true;start();},snapshot:()=>({time:t,phase,playing,loaded,packetOnTable})};
Promise.all([load('../../assets/scenes-v41/counter.png'),load('body-arm-parcel.png'),load('expressions.png')]).then(images=>{[bg,rig,faces]=images;loaded=true;if(!playing)t=1.5;draw(t);start();}).catch(e=>{document.getElementById('phase').textContent=e.message;});
})();
