(function(root){
 'use strict';
 // Art catalogue: a frame is one transparent, consistently framed half-body portrait.
 const sheet='assets/customers-v12/customers.webp';
 const assets=[['merchant',0],['traveller',1],['herbalist',2]].map(([id,column])=>({
  id,canvas:{width:400,height:675},anchor:'bottom-center',
  states:{neutral:{src:sheet,columns:3,rows:1,column,row:0}},
  source:'customers-v12',notes:'现有三人图集；其他状态暂用默认立绘'
 }));
 // Several profiles currently share a placeholder appearance. Identity never depends on image index.
 const profiles=[
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
 const catalog={version:1,assets,profiles};
 if(typeof module!=='undefined'&&module.exports)module.exports=catalog;else root.AlchemyCustomerCatalog=catalog;
})(typeof window!=='undefined'?window:globalThis);
