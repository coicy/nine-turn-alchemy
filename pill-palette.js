/* V138: cosmetic mineral palettes. Selection never consumes gameplay randomness. */
(function(root){
 'use strict';
 const sources=Object.freeze({
  'tin-white':'assets/pill-growth/metal.webp',
  'ochre-brown':'assets/pill-growth/wood.webp',
  'magnetite-black':'assets/pill-growth/water.webp',
  'lead-red':'assets/pill-growth/fire.webp',
  'lead-yellow':'assets/pill-growth/earth.webp',
  'ochre-violet':'assets/pill-growth/yin.webp',
  'copper-red':'assets/pill-growth/yang.webp',
  'plain':'assets/pill-growth/plain.webp'
 });
 const turns=Object.freeze([1,3,5,9,10,15,30,45,60,80,100]);
 function frame(appearance,turn){
  const index=turns.filter(minimum=>turn>=minimum).length-1;
  return Math.max(0,appearance==='plain'?Math.min(index,1):index);
 }
 const groups=Object.freeze({warm:Object.freeze(['lead-red','lead-yellow','copper-red']),neutral:Object.freeze(['ochre-brown','ochre-violet']),cool:Object.freeze(['magnetite-black','tin-white'])});
 function resolve(nature,appearance){return Object.prototype.hasOwnProperty.call(sources,appearance)?appearance:'plain';}
 function pick(nature,identity,attempt){const group=groups[nature]||groups.neutral;let hash=2166136261;for(const c of String(identity)+'/'+String(attempt))hash=Math.imul(hash^c.charCodeAt(0),16777619);return group[(hash>>>0)%group.length];}
 const api=Object.freeze({sources,groups,resolve,pick,frame});if(typeof module!=='undefined')module.exports=api;else root.AlchemyPillPalette=api;
})(typeof window!=='undefined'?window:globalThis);
