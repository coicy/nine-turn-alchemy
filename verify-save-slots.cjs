const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync(__dirname+'/save-slots.js','utf8');
const store=new Map();let fail=false;
const storage={getItem:k=>store.get(k)??null,setItem(k,v){if(fail)throw Error('quota');store.set(k,v);}};
function load(){const window={};vm.runInNewContext(script,{window,localStorage:storage});return window.AlchemySaves;}
const data={version:1,campaign:{day:4,phase:'open',history:[],orders:Array.from({length:7},(_,i)=>({id:'D4-'+i,target:120,status:'pending'}))},target:120,materials:3,state:{started:true,delivered:0,attempt:1,collected:[],logs:[],discoveredRunes:[],pill:{value:24,runes:[]},riskResult:{explode:0}}};
store.set('alchemy-days-v1',JSON.stringify(data));store.set('alchemy-onboarding-expanded-v53','true');
let saves=load();assert.equal(saves.read().campaign.day,4);assert.equal(saves.preference('expanded'),true);
const original=store.get('alchemy-days-v1'),first=store.get('alchemy-slot-v1-1');
assert.equal(saves.select(2),true);saves=load();assert.equal(saves.read(),null);assert.equal(saves.preference('expanded'),undefined);
assert.equal(saves.write({...data,campaign:{...data.campaign,day:1}}),true);assert.equal(store.get('alchemy-slot-v1-1'),first);
assert.equal(saves.setPreference('expanded',true),true);assert.equal(saves.reset(2),true);saves=load();assert.equal(saves.read(),null);assert.equal(saves.preference('expanded'),undefined);
assert.equal(store.get('alchemy-days-v1'),original);
store.set('alchemy-slot-v1-2','broken');saves=load();assert.equal(saves.slot(2).corrupt,true);assert.equal(saves.write(data),false);assert.equal(store.get('alchemy-slot-v1-2'),'broken');assert.equal(saves.select(2),false);
saves.reset(2);fail=true;assert.equal(saves.write(data),false);assert.ok(saves.error);assert.equal(saves.select(3),false);fail=false;
// Resetting slot 1 leaves a tombstone so the retained legacy backup cannot return.
saves.reset(1);saves.select(1);saves=load();assert.equal(saves.read(),null);assert.equal(store.get('alchemy-days-v1'),original);
console.log('PASS save slots: legacy copy, slot isolation, independent preferences, reset/reload, corrupt-data protection and failed-write reporting');
