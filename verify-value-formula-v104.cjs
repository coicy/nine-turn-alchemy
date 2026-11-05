const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const base=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split('const click=id=>')[0]
 .replace('getState:()=>state,render','getState:()=>state,getCampaign:()=>campaign,applyAlchemy,applyDamage,grantRune,tryFusion,consumeBasicRune,resolveRefine,freshPill,render')
 .replace('vm.runInContext(source,context);',"window.localStorage=storage;vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(source,context);");
function env(){const o={require,__dirname,console,storage};vm.createContext(o);vm.runInContext(base+';globalThis.env={window,el,context,testMath,timers};',o);o.env.el('startButton').emit('click',{currentTarget:o.env.el('startButton')});return o.env;}
let e=env(),w=e.window,a=e.context.testApi,s=a.getState(),c=a.getCampaign();
const checks=[];function check(name,fn){fn();checks.push(name);}
function reset(runes=[],runeLevels,baseValue=100){Object.assign(s,{pill:a.freshPill(),pillEnded:false,roundEnded:false,attempt:1});Object.assign(s.pill,{turn:5,runes:[...runes],runeLevels:runeLevels||{},baseValue});s.pill.value=w.AlchemyGame.valueForBase(baseValue,s.pill);c.economy.equipped=[];s.riskResult={explode:0};}
check('approved seven numeric examples',()=>{
 const rows=[[{},100],[{'赤纹':1},112],[{'赤纹':2},124],[{'赤纹':2,'青纹':1},136],[{'金纹':3},161],[{'赤纹':1,'青纹':1,'月纹':1,'雷纹':1,'金纹':2,'星痕':2},256],[{'赤纹':2,'青纹':1,'月纹':1,'雷纹':1,'金纹':2,'星痕':2},268]];
 for(const [levels,value]of rows)assert.equal(w.AlchemyGame.valueForBase(100,{runes:Object.keys(levels),runeLevels:levels}),value);
});
check('new rune +12%, duplicate still rejected in formula-only scope',()=>{reset();a.grantRune('赤纹');assert.equal(s.pill.value,112);assert.equal(s.pill.runeLevels['赤纹'],1);const before=JSON.stringify(s.pill);assert.equal(a.grantRune('赤纹'),null);assert.equal(JSON.stringify(s.pill),before);});
check('fusion preserves levels without extra 18% or 8%',()=>{reset(['赤纹'],{'赤纹':2});a.grantRune('青纹');assert.deepEqual(Array.from(s.pill.runes),['金纹']);assert.equal(s.pill.runeLevels['金纹'],3);assert.equal(s.pill.value,161);assert.equal(s.pill.baseValue,100);assert.equal(a.tryFusion(),null);assert.equal(s.pill.value,161);});
check('fusion value remains after subsequent refinements',()=>{for(let i=0;i<3;i++){a.applyAlchemy('success');assert.equal(s.pill.runeLevels['金纹'],3);assert.equal(s.pill.value,Math.round(s.pill.baseValue*1.61));}});
check('damage retains levels and applies once before rounding',()=>{reset(['赤纹'],{'赤纹':2});a.applyDamage();assert.equal(s.pill.value,87);assert.equal(s.pill.baseValue,70);assert.equal(s.pill.runeLevels['赤纹'],2);a.applyDamage();assert.equal(s.pill.value,61);});
check('fractional base is not rounded before rune multiplier',()=>{reset(['赤纹'],{'赤纹':1},24.49);assert.equal(s.pill.value,27);a.grantRune('月纹');assert.equal(s.pill.value,30);assert.equal(s.pill.baseValue,24.49);});
check('burn removes complete contribution, ash applies to base, return restores original level',()=>{
 reset(['赤纹','月纹'],{'赤纹':2,'月纹':3});c.economy.equipped=['burn','return','ash'];a.consumeBasicRune();assert.equal(s.pill.value,143);assert.equal(s.pill.returnRuneLevel,3);assert(Math.abs(s.pill.baseValue-115)<1e-10);
});
check('return and persistent ash use same formula',()=>{let draws=[.99,.5,.999];e.testMath.random=()=>draws.length?draws.shift():.999;a.resolveRefine();assert.equal(s.pill.runeLevels['月纹'],3);assert.equal(s.pill.value,Math.round(s.pill.baseValue*1.6));assert.equal(s.pill.toolUses.return,1);});
check('legacy levels default only from known rune identities',()=>{assert.deepEqual(JSON.parse(JSON.stringify(w.AlchemyGame.runeLevelsFor({runes:['赤纹','金纹','星痕']}))),{'赤纹':1,'金纹':2,'星痕':2});});
check('live reload keeps exact base, levels and value',()=>{a.render();const before=JSON.parse(JSON.stringify(s.pill));e=env();w=e.window;a=e.context.testApi;s=a.getState();c=a.getCampaign();assert.equal(s.pill.baseValue,before.baseValue);assert.deepEqual(JSON.parse(JSON.stringify(s.pill.runeLevels)),before.runeLevels);assert.equal(s.pill.value,before.value);});
check('old live save keeps saved value and stored stock is not repriced',()=>{
 a.render();const old=JSON.parse(store.get('alchemy-days-v1'));delete old.state.pill.baseValue;delete old.state.pill.runeLevels;old.state.pill.runes=['金纹'];old.state.pill.value=777;old.campaign.economy.pills=[{id:'old-stock',value:123,turn:5,quality:1,runes:['金纹']}];store.set('alchemy-days-v1',JSON.stringify(old));e=env();w=e.window;a=e.context.testApi;s=a.getState();c=a.getCampaign();assert.equal(s.pill.value,777);assert.equal(s.pill.runeLevels['金纹'],2);assert.equal(Math.round(s.pill.baseValue*1.49),777);assert.equal(c.economy.pills[0].value,123);
});
check('collection stores levels/base without coins and cannot settle twice',()=>{
 w.AlchemyGame.collect();w.AlchemyGame.abandonOrder();c.economy.herbs.neutral=1;assert(w.AlchemyGame.economyAction('herbself','neutral'));w.AlchemyGame.load();s=a.getState();a.grantRune('赤纹');a.grantRune('青纹');const coins=c.economy.coins,value=s.pill.value;w.AlchemyGame.collect();w.AlchemyGame.collect();const p=c.economy.pills.find(p=>p.id===s.orderId);assert(p);assert.equal(p.runeLevels['金纹'],2);assert.equal(p.baseValue,s.pill.baseValue);assert.equal(p.value,value);assert.equal(c.economy.coins,coins);s.pill.runeLevels['金纹']=99;assert.equal(p.runeLevels['金纹'],2);
});
check('hundredth turn settles real rune before completion',()=>{reset();s.pill.turn=99;c.economy.equipped=['needle'];let draws=[.99,.5,.9];e.testMath.random=()=>draws.length?draws.shift():.9;a.resolveRefine();assert.equal(s.pill.turn,100);assert.equal(s.pill.runes.length,1);assert.equal(s.pill.value,Math.round(s.pill.baseValue*1.12));});
const report={status:'PASS',date:new Date().toISOString(),checks};const out=path.resolve(__dirname,'../../Evidence/ValueFormulaV104');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'formula.json'),JSON.stringify(report,null,2));console.log('PASS '+checks.length+' value formula groups');
