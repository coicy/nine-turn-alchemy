(() => {
'use strict';
const names=['furnace-v1','herb-parcel-v1','delivery-tray-v1','alchemy-fan-v1','color-04-brown','color-07-slate','color-06-olive','crack-01-single','crack-02-fork','crack-03-opposed','crack-04-arc','crack-05-fragments','crack-06-traverse'];
const cache=new Map(),decoded=new Set(),images=new Map();
function load(src){if(!cache.has(src))cache.set(src,new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>{cache.delete(src);resolve(false);},60000);img.onload=async()=>{try{await img.decode();decoded.add(src);images.set(src,img);clearTimeout(timer);resolve(true);}catch{clearTimeout(timer);cache.delete(src);resolve(false);}};img.onerror=()=>{clearTimeout(timer);cache.delete(src);resolve(false);};img.src=src;}));return cache.get(src);}
const start=document.getElementById('startButton'),status=document.createElement('p');status.setAttribute('role','status');start.after(status);
let ready=false,running=false;
async function prepare(){if(running)return;running=true;status.hidden=false;start.disabled=true;status.textContent='正在准备丹炉与药材…';const results=await Promise.all([...['room','furnace'].flatMap(view=>['desktop','mobile'].flatMap(size=>['open','closed','front'].map(state=>'assets/scene-illustrated-v128/'+view+'-'+size+'-'+state+'.webp'))),'assets/scene-art-v126/tools.webp',...['warm','neutral','cool'].map(n=>'assets/pill-mineral-v136/'+n+'.webp'),...['desktop','mobile-v2','lid-standing','lid-closed'].map(n=>'assets/furnace-view-v102/'+n+'.webp'),...names.map(n=>'assets/runtime-v10/'+n+'.webp'),...(window.AlchemyCustomers?.sources()||['assets/customers-v12/customers.webp']),'assets/workbench-v92/room-desktop.png','assets/workbench-v92/room-mobile.png','assets/workbench-v92/folio.png','assets/room-v25/room.webp','assets/object-world-v86/room-desktop.webp','assets/object-world-v86/room-mobile.webp','assets/object-world-v86/casket.webp','assets/object-world-v86/cutaway.webp','assets/object-world-v86/counter.webp','assets/object-world-v86/market.webp','assets/counter-scene-v71/counter.webp','assets/counter-props-v72/merchant.webp','assets/counter-props-v72/herb-parcel.webp','assets/scenes-v41/market.webp','assets/scene-props-v42/tools.webp','assets/scene-props-v42/merchant.webp'].map(load));ready=results.every(Boolean);running=false;start.disabled=false;status.textContent=ready?'丹坊已备妥': '素材加载未完成，点击开始重试。';status.hidden=ready;if(ready)window.dispatchEvent(new Event('alchemy:assets-ready'));}
start.addEventListener('click',e=>{if(!ready){e.preventDefault();e.stopImmediatePropagation();void prepare();}},true);
window.AlchemyAssets={load,getImage:src=>images.get(src),get loadedCount(){return decoded.size;},get ready(){return ready;}};void prepare();
})();




