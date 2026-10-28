const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map();function el(id){if(!elements.has(id)){const classes=new Set();elements.set(id,{id,children:[],style:{},dataset:{},textContent:'',classList:{add:n=>classes.add(n),contains:n=>classes.has(n)},setAttribute(){},prepend(n){this.children.unshift(n)},append(n){this.children.push(n)},replaceChildren(){this.children=[]}})}return elements.get(id)}
const state={quality:1,runes:['赤纹'],order:{nature:'cool'}},listeners={},loaded=[];
class Image{set src(s){this.url=s;loaded.push(s);this.onload?.()}get src(){return this.url}setAttribute(){}}
const document={querySelector:q=>q==='.furnace'?el('furnace'):null,getElementById:el,createElement:()=>el('layer'),querySelectorAll:()=>[]};const window={AlchemyGame:{snapshot:()=>state},addEventListener:(n,f)=>listeners[n]=f};
vm.runInNewContext(fs.readFileSync(__dirname+'/alchemy-assets.js','utf8'),{document,window,Image});
assert.equal(el('pillVisual').dataset.nature,'cool');assert.match(el('layer').children[0].src,/pill-cracks-fine-v3/);
state.quality=4;state.runes=['金纹','星痕'];listeners['alchemy:render']();assert.equal(el('pillVisual').dataset.nature,'cool','quality does not change medicinal nature');assert.equal(el('layer').children.length,1);assert.match(el('layer').children[0].src,/pill-cracks-perfect-v3/);
state.order.nature='warm';listeners['alchemy:render']();assert.equal(el('pillVisual').dataset.nature,'warm');assert.match(el('layer').children[0].src,/perfect/);
state.quality=0;state.runes=[];listeners['alchemy:render']();assert.equal(el('layer').children.length,0);
assert.ok(!loaded.some(x=>/rune-(crimson|azure|moon|thunder|gold|star)-v1/.test(x)),'no attribute emblems loaded');
const css=fs.readFileSync(__dirname+'/alchemy-assets.css','utf8');assert.match(css,/mask:url\('assets\/alchemy\/pill-base-v1.png'\)/);
for(const name of ['common','fine','superior','premium','perfect'])assert.ok(fs.existsSync(__dirname+'/assets/alchemy/pill-cracks-'+name+'-v3.svg'));
console.log('Pill visual checks passed: nature and grade independent, crack palettes follow grade, no attribute emblems.');
