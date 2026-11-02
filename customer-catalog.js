(function(root){
 'use strict';
 // Art catalogue: a frame is one transparent, consistently framed half-body portrait.
 const sheet='assets/customers-v12/customers.webp';
 const assets=[['merchant',0],['traveller',1],['herbalist',2]].map(([id,column])=>({
  id,canvas:{width:400,height:675},anchor:'bottom-center',
  states:{neutral:{src:sheet,columns:3,rows:1,column,row:0}},
  source:'customers-v12',notes:'现有三人图集；其他状态暂用默认立绘'
 }));
 assets.push({id:'clothier-v61',canvas:{width:400,height:675},anchor:'bottom-center',layout:'native-v61',states:{neutral:{src:'assets/customers-v61/clothier.webp',columns:1,rows:1,column:0,row:0}},source:'CustomerBatchV61',notes:'陆绣完整同源母稿；静态柜台接入'});
 for(const [id,file] of [['merchant','merchant'],['traveller','scholar'],['herbalist','herbalist']]){const a=assets.find(a=>a.id===id);a.layout='native-v61';a.states.neutral={src:'assets/customers-v61/'+file+'.png',columns:1,rows:1,column:0,row:0};a.source='V59/V60';a.notes='统一已校准画风，原有身份保持兼容；静态状态共用母稿';}
 // Several profiles currently share a placeholder appearance. Identity never depends on image index.
 const profiles=[
  ['clothier-lu','陆绣','坊市行商','clothier-v61','布庄近日要进些远货，替赶路的伙计备些丹药。'],
  ['merchant-zhou','周掌柜','坊市行商','merchant','这趟行商要备些丹药，烦请掌柜代炼。'],
  ['courier-shen','沈七','驿路信使','merchant','驿路上的备用丹，就托付掌柜了。'],
  ['boat-luo','罗船客','渡口船客','merchant','过江之前来备些丹药，求个稳妥。'],
  ['traveller-lin','林行舟','远行修士','traveller','远行在即，想请掌柜替我备丹。'],
  ['watch-qin','秦守夜','守夜修士','traveller','这几晚轮到我守夜，先来备些丹药。'],
  ['student-wen','闻溪','游学弟子','traveller','在外游学，行囊里总得备些丹药。'],
  ['recluse-gu','顾静山','闭关散修','traveller','近日准备闭关，劳烦掌柜照看这炉药。'],
  ['explorer-yan','晏寻','探洞修士','traveller','过几日要进山探洞，先来托炼一单。'],
  ['herbalist-he','何采药','采药散修','herbalist','这是进山采来的药，想请掌柜代炼。'],
  ['farmer-lu','陆药农','山间药农','herbalist','我不擅守炉，炼丹的事就劳烦掌柜了。']
 ].map(([id,name,role,appearanceId,request])=>({id,name,role,appearanceId,request}));
 const notes=Object.fromEntries(['merchant','herbal','scholar','courier','guard','recluse'].map(id=>[id,{id,src:'assets/counter-props-v72/'+id+'.png'}]));
 const noteRoles={'坊市行商':'merchant','采药散修':'herbal','山间药农':'herbal','游学弟子':'scholar','驿路信使':'courier','渡口船客':'courier','远行修士':'courier','守夜修士':'guard','探洞修士':'guard','闭关散修':'recluse','布庄行商':'merchant','客栈掌柜':'merchant','食摊掌勺':'herbal','炉坊学徒':'herbal','采石工':'herbal','采药人':'herbal','山居散修':'recluse','退隐散修':'recluse','私塾先生':'scholar','游学书生':'scholar','商队护卫':'guard','行脚护送':'guard','山路跑腿':'courier','渡口船工':'courier'};
 for(const p of profiles)p.noteStyle=noteRoles[p.role]||'recluse';
 const catalog={version:2,assets,profiles,notes,noteRoles};
 if(typeof module!=='undefined'&&module.exports)module.exports=catalog;else root.AlchemyCustomerCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis);

