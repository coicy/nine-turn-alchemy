(() => {
'use strict';
const c=document.getElementById('scene'),ctx=c.getContext('2d'),D=9,load=src=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(Error(src));im.src=src;});
let images,loaded=false,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,t=0,raf=0,last=0,info={};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},mix=(a,b,s)=>a+(b-a)*s;
const S={x:738,y:380},A=145,B=210,hold={x:910,y:520},contact={x:970,y:560},rest={x:865,y:535};
function sprite(im,bw,bh,r,x,y,w,h){ctx.drawImage(im,r[0]/bw*im.width,r[1]/bh*im.height,r[2]/bw*im.width,r[3]/bh*im.height,x,y,w,h);}
function solve(p){const dx=p.x-S.x,dy=p.y-S.y,d=Math.hypot(dx,dy),base=Math.atan2(dy,dx),a=base+Math.acos(Math.max(-1,Math.min(1,(A*A+d*d-B*B)/(2*A*d))));const e={x:S.x+A*Math.cos(a),y:S.y+A*Math.sin(a)};return{elbow:e,upper:a,lower:Math.atan2(p.y-e.y,p.x-e.x)};}
function head(frame,x,y,angle=0){ctx.save();ctx.translate(x+92,y+175);ctx.rotate(angle);ctx.translate(-92,-175);sprite(images[2],2048,780,[frame*2048/3,0,2048/3,780],0,0,184,210);ctx.restore();}
function draw(time){if(!loaded)return;const p=smooth((time-2)/1.6),q=smooth((time-4.45)/1.35),onTable=time>=3.6,open=time>=4.2;
 let wrist={x:mix(hold.x,contact.x,p),y:mix(hold.y,contact.y,p)};if(time>=4.45)wrist={x:mix(contact.x,rest.x,q),y:mix(contact.y,rest.y,q)};
 const ik=solve(wrist),breath=time<2?Math.sin(time*2)*.8:0,nod=time>=6.2&&time<7.3?Math.sin((time-6.2)/1.1*Math.PI)*.027:0;
 const phase=time<2?'等候':time<3.6?'递药':time<4.2?'放稳':time<4.45?'松手':time<5.8?'收臂':time<6.2?'等候确认':time<7.4?'确认托付':'完成';
 ctx.drawImage(images[0],0,0,1600,900);sprite(images[1],2172,724,[325,10,525,700],700,340+breath,350,467);
 head(time>=6.2?2:0,738,169+breath,nod);if(time>1.1&&time<1.23){ctx.save();ctx.beginPath();ctx.ellipse(849,254+breath,52,24,0,0,Math.PI*2);ctx.clip();head(1,738,169+breath);ctx.restore();}
 ctx.save();ctx.beginPath();ctx.rect(0,510,1600,390);ctx.clip();ctx.drawImage(images[0],0,0,1600,900);ctx.restore();
 // Shoulder -> elbow. Source joint vector is (10,430), hidden inside the sleeve overlap.
 ctx.save();ctx.translate(S.x,S.y);ctx.rotate(ik.upper-Math.atan2(430,10));const su=A/Math.hypot(10,430);sprite(images[3],2048,683,[80,20,330,650],-150*su,-100*su,330*su,650*su);ctx.restore();
 // Elbow -> palm. Same wrist registration for supporting and open-finger poses.
 ctx.save();ctx.translate(ik.elbow.x,ik.elbow.y);ctx.rotate(ik.lower-Math.atan2(115,500));const sl=B/Math.hypot(500,115),rect=open?[1300,190,745,410]:[530,190,735,410];sprite(images[3],2048,683,rect,-(open?90:85)*sl,-135*sl,rect[2]*sl,410*sl);ctx.restore();
 const anchor=onTable?contact:wrist,bag={x:anchor.x-56,y:anchor.y-97};
 if(onTable){ctx.save();ctx.fillStyle='#4a321d25';ctx.beginPath();ctx.ellipse(contact.x,contact.y+1,50,7,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 sprite(images[1],2172,724,[1665,340,225,200],bag.x,bag.y,112,100);
 const text={等候:'这包药材，劳烦代炼。',递药:'药材在这里。',放稳:'先放稳药包。',松手:'药包已在柜上。',收臂:'劳烦掌柜。',等候确认:'药材就托付给你了。',确认托付:'多谢掌柜。',完成:'交接结束，客人静候；不演示步行离场。'};
 document.getElementById('phase').textContent=phase;document.getElementById('dialogue').textContent=text[phase];document.getElementById('timeline').value=time;document.getElementById('time').textContent=time.toFixed(2)+' 秒';
 info={time,phase,loaded,playing,packetOnTable:onTable,fingersOpen:open,shoulder:S,elbow:ik.elbow,palm:wrist,bagContact:anchor,upperLength:Math.hypot(ik.elbow.x-S.x,ik.elbow.y-S.y),lowerLength:Math.hypot(wrist.x-ik.elbow.x,wrist.y-ik.elbow.y)};
}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing){t+=dt;if(t>=D){if(document.getElementById('loop').checked)t%=D;else{t=D;playing=false;}}}draw(t);document.getElementById('play').textContent=playing?'暂停':'播放';if(playing)raf=requestAnimationFrame(tick);}
function run(){cancelAnimationFrame(raf);last=performance.now();draw(t);if(playing)raf=requestAnimationFrame(tick);document.getElementById('play').textContent=playing?'暂停':'播放';}
function seek(v){t=Math.max(0,Math.min(D,v));playing=false;run();}
document.getElementById('play').onclick=()=>{playing=!playing;if(t>=D)t=0;run();};document.getElementById('replay').onclick=()=>{t=0;playing=true;run();};document.getElementById('timeline').oninput=e=>seek(+e.target.value);document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>seek(+b.dataset.time));document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;run();}});
window.MerchantAnimation={seek,snapshot:()=>info};
Promise.all([load('../../assets/scenes-v41/counter.png'),load('../customer-animation-v52/body-arm-parcel.png'),load('../customer-animation-v52/expressions.png'),load('arm-two-joint.png')]).then(v=>{images=v;loaded=true;if(!playing)t=1;run();}).catch(e=>{document.getElementById('phase').textContent='加载失败 '+e.message;});
})();
