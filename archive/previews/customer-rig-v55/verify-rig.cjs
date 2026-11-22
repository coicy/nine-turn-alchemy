const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),sharp=require('sharp');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('file:///'+path.join(__dirname,'preview.html').replaceAll('\\','/'));
await page.waitForFunction(()=>window.MerchantRig?.snapshot().ready);
const {data:rgba,info}=await sharp(path.join(__dirname,'master.png')).raw().toBuffer({resolveWithObject:true});
const rig=JSON.parse(fs.readFileSync(path.join(__dirname,'rig.json'),'utf8'));
const opaque=rig.vertices.map(v=>{let x=Math.min(info.width-1,Math.round(v.xy[0])),y=Math.min(info.height-1,Math.round(v.xy[1]));return rgba[(y*info.width+x)*4+3]>=220;});
const results=await page.evaluate(opaque=>{
let api=window.MerchantRig,src=api.source,weightError=0,zeroError=0,minArea=Infinity,maxStretch=0,maxDisplacement=0;
src.vertices.forEach(v=>{weightError=Math.max(weightError,Math.abs(v.weights.reduce((s,a)=>s+a[1],0)-1));});
document.querySelector('#rest').checked=true;document.querySelector('#rest').dispatchEvent(new Event('change'));
api.skin(0).points.forEach((p,i)=>{zeroError=Math.max(zeroError,Math.hypot(p[0]-src.vertices[i].xy[0],p[1]-src.vertices[i].xy[1]));});
document.querySelector('#rest').checked=false;document.querySelector('#rest').dispatchEvent(new Event('change'));
for(let clip of ['idle','greet','test']){api.setClip(clip);for(let t=0;t<=8;t+=.05){let {points}=api.skin(t);for(let tri of src.triangles){let [a,b,c]=tri.map(i=>points[i]);let area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);minArea=Math.min(minArea,area);for(let k=0;k<3;k++){let i=tri[k],j=tri[(k+1)%3],p=points[i],q=points[j],u=src.vertices[i].xy,v=src.vertices[j].xy;if(opaque[i]&&opaque[j])maxStretch=Math.max(maxStretch,Math.abs(Math.hypot(p[0]-q[0],p[1]-q[1])/Math.hypot(u[0]-v[0],u[1]-v[1])-1));}}points.forEach((p,i)=>{if(!opaque[i])return;let q=src.vertices[i].xy;maxDisplacement=Math.max(maxDisplacement,Math.hypot(p[0]-q[0],p[1]-q[1]));});}}
api.setClip('greet');api.seek(0);return{weightError,zeroError,minArea,maxStretch,maxDisplacement,opaqueVertexCount:opaque.filter(Boolean).length};},opaque);
console.log('Measured constraints',JSON.stringify(results));
assert(results.weightError<1e-6,'weight normalization');assert(results.zeroError<1e-6,'zero pose reconstruction');assert(results.minArea>0,'no mesh flips');assert(results.maxStretch<.16,'bounded strain in small motion range');assert(results.maxDisplacement>5,'actual skin motion exists');
for(let [name,view,clip,t] of [['scene-rest','scene','greet',0],['scene-greeting','scene','greet',1.9],['scene-nod','scene','greet',4.3],['weights','weights','test',3],['comparison','compare','idle',0],['studio','studio','greet',4.3]]){
await page.evaluate(({view,clip,t})=>{let a=window.MerchantRig;a.setView(view);let r=document.querySelector('#rest');r.checked=view==='compare';r.dispatchEvent(new Event('change'));a.setClip(clip);a.seek(t);},{view,clip,t});await page.locator('#stage').screenshot({path:path.join(__dirname,name+'.png')});}
await page.evaluate(()=>{MerchantRig.setView('compare');MerchantRig.setView('scene');});assert.equal(await page.evaluate(()=>MerchantRig.snapshot().rest),false,'restore pose option after comparison');
await page.locator('#replay').click();await page.waitForTimeout(150);let before=await page.evaluate(()=>MerchantRig.snapshot().time);assert(before>0,'real playback');await page.locator('#play').click();let paused=await page.evaluate(()=>MerchantRig.snapshot().time);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>MerchantRig.snapshot().time),paused,'pause');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'mobile.png'),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
let reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto('file:///'+path.join(__dirname,'preview.html').replaceAll('\\','/'));await reduced.waitForFunction(()=>window.MerchantRig?.snapshot().ready);assert.equal(await reduced.evaluate(()=>MerchantRig.snapshot().playing),false,'reduced motion');
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'technical-check.json'),JSON.stringify({...results,browserErrors:errors,checks:['normalized weights','rest reconstruction','positive triangle area across three clips','strain bound','play/pause','mobile overflow','reduced motion'],note:'Technical constraints only. Does not establish visual quality.'},null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
