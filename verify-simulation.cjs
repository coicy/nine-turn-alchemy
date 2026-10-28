const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),timers=new Map();let seq=0;
function el(id){if(!elements.has(id)){const classes=new Set();const obj={id,disabled:false,checked:false,hidden:false,style:{},dataset:{},attrs:{},listeners:{},textContent:'',innerHTML:'',offsetWidth:1,classList:{add(...ns){ns.forEach(n=>classes.add(n))},remove(...ns){ns.forEach(n=>classes.delete(n))},toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n)},contains:n=>classes.has(n)},addEventListener(n,f){(this.listeners[n]??=[]).push(f)},setAttribute(n,v){this.attrs[n]=v},insertAdjacentHTML(){},appendChild(){},setPointerCapture(){},focus(){document.activeElement=this},closest(){return ['fireObject','herbObject','trayObject','pillVisual'].includes(id)?this:null},getBoundingClientRect(){return id==='trayObject'?{left:300,right:420,top:450,bottom:570}:{left:100,right:250,top:300,bottom:450}},click(){if(!this.disabled)this.emit('click')},emit(n,e={}){e.type??=n;e.target??=this;e.preventDefault??=()=>{};e.stopPropagation??=()=>{};e.stopImmediatePropagation??=()=>{};for(const f of this.listeners[n]??[])f(e)}};elements.set(id,obj)}return elements.get(id)}
const document=el('document');document.body={dataset:{screen:'opening'}};document.getElementById=el;document.querySelector=s=>el(s);document.activeElement=null;
const window=el('window');window.dispatchEvent=e=>window.emit(e.type,e);window.scrollTo=()=>{};
function schedule(fn,delay){let id=++seq;timers.set(id,{fn,delay});return id}window.setTimeout=schedule;
function flush(delay){for(const [id,t]of [...timers])if(t.delay===delay){timers.delete(id);t.fn()}}
// Fixed draws keep interaction assertions independent of random alchemy outcomes.
// Outcome branches are separately covered by verify-mvp.cjs.
const testMath=Object.create(Math);testMath.random=()=>0.5;
const context={document,window,Math:testMath,setTimeout:schedule,clearTimeout:id=>timers.delete(id),Event:class{constructor(type){this.type=type}}};
vm.createContext(context);
let source=fs.readFileSync(__dirname+'/app.js','utf8').replace(/\}\)\(\);\s*$/,'globalThis.testApi={getState:()=>state,render};})();');
vm.runInContext(source,context);vm.runInContext(fs.readFileSync(__dirname+'/simulation.js','utf8'),context);
const click=id=>el(id).click(),s=()=>window.AlchemyGame.snapshot();
click('startButton');assert.equal(s().attempt,0);assert.equal(s().remaining,3);assert.equal(el('fireObject').disabled,true);assert.equal(el('pillVisual').attrs['aria-disabled'],'true');
click('herbObject');assert.equal(s().attempt,0,'picking does not consume');assert.equal(el('pillStage').dataset.held,'herbs');
document.emit('keydown',{key:'Escape',target:el('document')});assert.equal(el('pillStage').dataset.held,'');
click('herbObject');click('fireObject');click('fireObject');assert.equal(s().attempt,0,'pour is not instant');flush(720);assert.equal(s().attempt,1);assert.equal(s().remaining,2);
assert.equal(el('herbObject').disabled,true,'cannot load a second pack during a furnace');
click('fireObject');assert.equal(s().busy,true);click('fireObject');flush(280);assert.equal(s().turn,2,'one click gives one result despite fast second click');
click('pillVisual');assert.equal(s().delivered,0,'taking a pill is not delivery');document.emit('keydown',{key:'Escape',target:el('document')});assert.equal(s().delivered,0);
click('pillVisual');click('trayObject');click('trayObject');flush(320);const first=s().delivered;assert.ok(first>24);assert.equal(s().pillEnded,true);assert.equal(el('fireObject').disabled,true);assert.ok(el('deliverySeals').innerHTML.includes(String(first)));
function drag(kind,x,y,type='pointerup'){const object=el(kind==='herbs'?'herbObject':'pillVisual');object.emit('pointerdown',{button:0,pointerId:7,clientX:20,clientY:20});object.emit('pointermove',{pointerId:7,clientX:x,clientY:y});object.emit(type,{clientX:x,clientY:y});object.emit('click');flush(0)}
drag('herbs',500,100);flush(720);assert.equal(s().attempt,1,'invalid drop returns the pack');
drag('herbs',170,350,'pointercancel');flush(720);assert.equal(s().attempt,1,'cancelled gesture consumes no pack');
drag('herbs',170,350);flush(720);assert.equal(s().attempt,2,'valid drag loads one pack');
drag('pill',500,100);flush(320);assert.equal(s().delivered,first,'invalid pill drop preserves pill');
drag('pill',350,500);flush(320);assert.equal(s().delivered,first+24,'valid pill drop delivers exactly once');
click('herbObject');click('fireObject');click('restartButton');flush(720);assert.equal(s().attempt,0,'restart cancels pending pour');assert.equal(s().delivered,0);assert.equal(el('trayPills').innerHTML,'');
for(let i=0;i<3;i++){click('herbObject');click('fireObject');flush(720);click('pillVisual');click('trayObject');flush(320)}
assert.equal(s().roundEnded,true);assert.equal(s().remaining,0);assert.equal(s().delivered,72);assert.equal(el('herbObject').disabled,true);
click('restartButton');click('herbObject');click('fireObject');flush(720);
context.testApi.getState().pill.value=300;context.testApi.getState().pill.turn=9;context.testApi.render();assert.equal(el('fireObject').disabled,true);click('pillVisual');click('trayObject');flush(320);assert.equal(s().roundEnded,true);assert.equal(s().delivered,300);assert.equal(el('herbObject').disabled,true,'victory locks remaining packs');
console.log('Workbench integration passed: first-pack preparation, click/drag pouring, cancellation, single refine, carry/return/delivery, restart during pour, three-pack loss, nine-turn victory.');
