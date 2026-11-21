const assert=require('node:assert/strict'),C=require('./crafts.js'),E=require('./economy.js'),Campaign=require('./campaign.js'),Lease=require('./lease.js');
const fs=require('node:fs'),P=require('./pill-palette.js'),turns=[1,3,5,9,10,15,30,45,60,80,100],frames=JSON.parse(fs.readFileSync('./assets/crafts-v207/frames.json','utf8'));
assert.deepEqual(C.turns,turns);
for(const d of C.defs){
 assert.equal(d.forms.length,11);assert.equal(new Set(d.forms).size,11);assert.equal(frames[d.atlas].length,11);assert(fs.existsSync(C.atlas(d.atlas)));
 for(let turn=1;turn<=100;turn++){
  const expected=P.frame('tin-white',turn);assert.equal(C.stage(turn),expected);assert.equal(C.name({craftKind:d.id,turn}),d.forms[expected]);
  if(turn>1)assert(C.stage(turn)-C.stage(turn-1)<=1);
 }
 for(const rect of frames[d.atlas])assert(rect.length===4&&rect.every(Number.isInteger)&&rect[0]>=0&&rect[1]>=0&&rect[2]>0&&rect[3]>0);
}
for(const d of C.defs){
 const c=Campaign.create(),e=E.ensure(c);e.coins=5000;const orders=JSON.stringify(c.orders);
 assert(E.buy(c,'craftMaterial',d.id));assert.equal(e.coins,5000-d.price);assert.equal(e.craftStock[d.id],1);
 assert.equal(JSON.stringify(c.orders),orders);assert.equal(E.buy(c,'craftMaterial','unknown'),false);
 const p={id:'test-'+d.id,craftKind:d.id,craftCost:d.price,turn:3,quality:0,value:Math.round(48.64*d.multiplier),yuanBonus:0};assert(E.storePill(c,p));assert.equal(e.pills[0].craftKind,d.id);assert.equal(E.storePill(c,p),false);
 c.lease={terms:[],purchase:null};c.day=16;assert.equal(Lease.purchaseQuote(c,p.id),null);
 e.craftMarket={day:16,offer:{kind:d.id,minTurn:3,bonusRate:.25,status:'waiting'}};
 const before=e.coins,q=C.quote(c,p.id);assert(q.ok);assert(E.craftSale(c,p.id));assert.equal(e.coins,before+q.payout);assert.equal(e.craftStock[d.id],1);assert.equal(e.pills.length,0);assert.equal(E.craftSale(c,p.id),false);
}
const c=Campaign.create(),e=E.ensure(c);assert.equal(E.buy(c,'craftMaterial','bird'),false);assert.equal(e.coins,80);assert.equal(e.craftStock.bird,0);
let days=0;for(let day=1;day<=30;day++){c.day=day;E.ensure(c);if(e.craftMarket.offer){days++;assert(day>=3);assert.equal(e.craftMarket.offer.status,'waiting');assert.equal(e.craftMarket.offer.minTurn,3);assert.equal(JSON.stringify(e.craftMarket).includes('materials'),false);}}
assert(days>0&&days<15);console.log('PASS: six self-funded products, isolated material stock, exact buy/sale settlement, no guest materials, pharmacy exclusion, occasional daily offers, duplicate protection.');
