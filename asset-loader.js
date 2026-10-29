(() => {
'use strict';
const names=['furnace-v1','herb-parcel-v1','delivery-tray-v1','alchemy-fan-v1','color-04-brown','color-07-slate','color-06-olive','crack-01-single','crack-02-fork','crack-03-opposed','crack-04-arc','crack-05-fragments','crack-06-traverse'];
const cache=new Map(),decoded=new Set();
function load(src){if(!cache.has(src))cache.set(src,new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>{cache.delete(src);resolve(false);},15000);img.onload=async()=>{try{await img.decode();decoded.add(src);clearTimeout(timer);resolve(true);}catch{clearTimeout(timer);cache.delete(src);resolve(false);}};img.onerror=()=>{clearTimeout(timer);cache.delete(src);resolve(false);};img.src=src;}));return cache.get(src);}
const start=document.getElementById('startButton'),status=document.createElement('p');status.setAttribute('role','status');start.after(status);
let ready=false,running=false;
async function prepare(){if(running)return;running=true;start.disabled=true;status.textContent='正在准备丹炉与药材…';const results=await Promise.all([...names.map(n=>'assets/runtime-v10/'+n+'.webp'),'assets/customers-v12/customers.webp'].map(load));ready=results.every(Boolean);running=false;start.disabled=false;status.textContent=ready?'丹坊已备妥': '素材加载未完成，点击开始重试。';if(ready)window.dispatchEvent(new Event('alchemy:assets-ready'));}
start.addEventListener('click',e=>{if(!ready){e.preventDefault();e.stopImmediatePropagation();void prepare();}},true);
window.AlchemyAssets={load,get loadedCount(){return decoded.size;},get ready(){return ready;}};void prepare();
})();
