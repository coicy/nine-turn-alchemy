const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),E=require('./economy.js');
const base=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split('const click=id=>')[0].replace('getState:()=>state,render','getState:()=>state,getCampaign:()=>campaign,resolveRefine,freshPill,render').replace('vm.runInContext(source,context);',"vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(source,context);");
const outer={require,__dirname,console};vm.createContext(outer);vm.runInContext(base+';globalThis.env={window,el,context,testMath,timers};',outer);const {window:w,el,context,testMath,timers}=outer.env;el('startButton').click();const a=context.testApi,s=a.getState(),c=a.getCampaign();
function reset(tool){c.economy.equipped=tool;Object.assign(s,{pill:a.freshPill(),pillEnded:false,roundEnded:false,attempt:1});s.pill.turn=5;s.pill.value=100;s.riskResult={explode:w.AlchemyGame.riskAtTurn(5)};}
function result(x,y){let seq=[x,y];testMath.random=()=>seq.length?seq.shift():.9;a.resolveRefine();timers.clear();}
assert.equal(E.TOOL_DEFS.length,13);c.economy.coins=9999;assert.equal(w.AlchemyGame.economyAction('tool','phoenix'),false,'day gating');
reset('ward');assert.ok(Math.abs(s.riskResult.explode-.248*.9)<1e-10);
reset('stone');result(.9,.7);assert.equal(s.pill.turn,6,'hold tickets become success');
reset('lucky');result(.9,.12);assert.equal(s.pill.turn,7,'greater chance weight');
reset('chain');result(.9,.5);assert.equal(s.pill.turn,6);result(.9,.5);assert.equal(s.pill.turn,8);result(.9,.8);result(.9,.5);assert.equal(s.pill.turn,9,'hold resets streak');
reset('repair');result(.9,.99);assert.equal(s.pill.scars,1);assert.ok(Math.abs(s.riskResult.explode-.129*.85)<1e-10);for(let i=0;i<5;i++)result(.9,.99);assert.equal(s.pill.scars,4);assert.equal(E.toolRisk('repair',s.pill),.4);
reset('phoenix');result(0,.5);assert.equal(s.pillEnded,false);assert.equal(s.pill.value,60);assert.equal(s.pill.toolUsed,true);result(0,.5);assert.equal(s.pillEnded,true,'second explosion ends furnace');
reset('phoenix');result(0,.5);result(.9,.5);const reduced=s.pill.value;reset(null);result(.9,.5);assert.ok(Math.abs(reduced-s.pill.value*.6)<=1,'phoenix penalty persists through success');
reset('seal');result(0,.5);assert.equal(s.pillEnded,false);assert.equal(s.pill.toolUsed,true);result(0,.5);assert.equal(s.pillEnded,true);
reset('repair');assert.equal(s.pill.scars,undefined,'new pill resets stacks');
c.day=6;for(const t of E.TOOL_DEFS){if(!c.economy.tools.includes(t.id))assert.ok(w.AlchemyGame.economyAction('tool',t.id));}assert.equal(c.economy.tools.length,13);assert.equal(w.AlchemyGame.economyAction('equip','ward'),false,'cannot change equipment on live pill');
console.log('PASS: thirteen tools, availability, effective risk, weighted outcomes, streak reset, capped scars, once-only protections, persistent value penalty, equipment lock');
