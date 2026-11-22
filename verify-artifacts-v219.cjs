const assert=require('node:assert/strict');
const E=require('./economy.js');
const Campaign=require('./campaign.js');

const c=Campaign.create();
const e=E.ensure(c);
e.coins=1000;e.tools=['material_scale','client_contract','余料囊','cooling_tag','ash_contract'];
e.equipped=['material_scale'];c.day=9;
assert(E.buy(c,'craftMaterial','bird'));
assert.equal(e.coins,1000-Math.round(90*.85));
assert.equal(e.craftStock.bird,1);

const matching={target:100,nature:'warm',status:'completed',returned:1,id:'match'};
e.equipped=['client_contract','cooling_tag'];
const withMatch=E.commissionRewardWithTools(c,matching,[{value:140,yuanBonus:0,nature:'warm'}]);
const withoutMatch=E.commissionRewardWithTools(c,matching,[{value:140,yuanBonus:0,nature:'cool'}]);
assert(withMatch>withoutMatch);

e.equipped=['余料囊'];
const payout={target:100,nature:'neutral',status:'completed',returned:2,id:'pouch'};
const beforeNeutral=e.herbs.neutral;
E.commission(c,payout,[{value:120,yuanBonus:0,nature:'neutral'}]);
assert.equal(e.herbs.neutral-beforeNeutral,3);

e.equipped=['hearth_pin'];
assert(E.toolRisk(e.equipped,{turn:1,refineCount:0})<1);
e.equipped=['pulse_ring'];
assert(E.toolRisk(e.equipped,{turn:8})<1);

const failed=Campaign.create();
const fe=E.ensure(failed);fe.nextOrderTargetPenalty=.1;
const oldTarget=failed.day;
assert(Campaign.settle(failed));
assert(Campaign.next(failed));
assert(failed.orders.every(o=>o.target<144+24));
assert.equal(fe.nextOrderTargetPenalty,0);
console.log('PASS: material-scale discount, contract matching, leftover pouch, stable risk hooks, and failed-order target relief');
