/* V138: cosmetic mineral palettes. Selection never consumes gameplay randomness. */
(function(root){
 'use strict';
 const sources=Object.freeze({
  'lead-red':'assets/pill-mineral-v136/warm.webp',
  'ochre-brown':'assets/pill-mineral-v136/neutral.webp',
  'magnetite-black':'assets/pill-mineral-v136/cool.webp',
  'lead-yellow':'assets/pill-mineral-v138/lead-yellow.webp',
  'ochre-violet':'assets/pill-mineral-v138/ochre-violet.webp',
  'copper-red':'assets/pill-mineral-v138/copper-red.webp',
  'tin-white':'assets/pill-mineral-v138/tin-white.webp'
 });
 const groups=Object.freeze({warm:Object.freeze(['lead-red','lead-yellow','copper-red']),neutral:Object.freeze(['ochre-brown','ochre-violet']),cool:Object.freeze(['magnetite-black','tin-white'])});
 function resolve(nature,appearance){const group=groups[nature]||groups.neutral;return group.includes(appearance)?appearance:group[0];}
 function pick(nature,identity,attempt){const group=groups[nature]||groups.neutral;let hash=2166136261;for(const c of String(identity)+'/'+String(attempt))hash=Math.imul(hash^c.charCodeAt(0),16777619);return group[(hash>>>0)%group.length];}
 const api=Object.freeze({sources,groups,resolve,pick});if(typeof module!=='undefined')module.exports=api;else root.AlchemyPillPalette=api;
})(typeof window!=='undefined'?window:globalThis);
