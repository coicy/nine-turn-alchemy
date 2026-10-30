const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function node(tag='DIV'){return {tagName:tag,dataset:{},style:{},hidden:false,inert:false,listeners:{},clientWidth:900,clientHeight:700,offsetHeight:800,classList:{add(){},toggle(){},contains(){return false}},append(){},after(){},setAttribute(k,v){this[k]=v},focus(){},addEventListener(k,f){this.listeners[k]=f},querySelectorAll(){return buttons}};}
const buttons=['work','orders','shop','record','manual','equipment'].map(view=>{const b=node('BUTTON');b.dataset.view=view;return b});
const forge=node(),layout=node(),board=node(),shop=node(),record=node('DETAILS'),manual=node('DETAILS'),equipment=node(),top=node(),wallet=node();
const nodes={'.forge-panel':forge,'.game-layout':layout,'.daily-board:not(.economy-board)':board,'.economy-board':shop,'.order-panel':record,'.side-panel':manual,'.topbar':top,'.equipment-drawer':equipment};
const made=[];const document={body:node(),querySelector:k=>nodes[k],getElementById:()=>wallet,createElement:tag=>{const n=node(tag.toUpperCase());made.push(n);return n},addEventListener(){}};
const events={};const window={addEventListener:(k,f)=>events[k]=f,AlchemyGame:{campaign:()=>({day:1,economy:{coins:80}}),snapshot:()=>({runeChoices:[]})}};
vm.runInNewContext(fs.readFileSync(__dirname+'/game-shell.js','utf8'),{document,window,requestAnimationFrame:f=>f()});
const nav=made.find(n=>n.className==='engine-nav');
function pick(i){nav.listeners.click({target:{closest:()=>buttons[i]}})}
assert.equal(shop.hidden,true);assert.equal(shop.dataset.shellActive,'false');
pick(2);assert.equal(shop.hidden,false);assert.equal(shop.dataset.shellActive,'true');assert.equal(made[0].inert,false);
pick(0);events['alchemy:render']();assert.equal(shop.hidden,true);assert.equal(shop.dataset.shellActive,'false');assert.equal(made[0].style.visibility,'visible');
pick(1);assert.equal(board.hidden,false);assert.equal(shop.hidden,true);events['alchemy:order']();assert.equal(board.hidden,true);assert.equal(shop.hidden,true);
assert.match(fs.readFileSync(__dirname+'/game-shell.css','utf8'),/data-shell-active="false"/);
assert.ok(!fs.readFileSync(__dirname+'/economy-ui.js','utf8').includes('return;}section.hidden=false'));
console.log('PASS: tab visibility remains authoritative after render, order changes and market navigation');

pick(5);assert.equal(equipment.hidden,false);assert.equal(shop.hidden,true);assert.equal(made[0].inert,false);assert.equal(made[0].style.visibility,'visible');events['alchemy:render']();assert.equal(equipment.dataset.shellActive,'true');events['alchemy:work']();assert.equal(equipment.hidden,true);events['alchemy:equipment']();assert.equal(equipment.hidden,false);events['alchemy:market']();assert.equal(equipment.hidden,true);assert.equal(shop.hidden,false);events['alchemy:order']();assert.equal(equipment.hidden,true);assert.equal(shop.hidden,true);
console.log('PASS: equipment drawer keeps forge active, closes across navigation and reopens without stale overlays');
