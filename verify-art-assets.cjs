const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map();
function el(id){if(!elements.has(id)){const classes=new Set();elements.set(id,{id,children:[],style:{},dataset:{},textContent:'',classList:{add:n=>classes.add(n),contains:n=>classes.has(n)},setAttribute(){},prepend(n){this.children.unshift(n)},append(n){this.children.push(n)},replaceChildren(){this.children=[]},querySelector(q){return this[q]||null},replaceWith(){throw Error('Interactive node must not be replaced')}})}return elements.get(id)}
const furnace=el('furnace'),pill=el('pillVisual'),orbit=el('orbit');orbit.textContent='赤纹';
const entry=el('entry');entry.strong={textContent:'赤纹'};entry['.rune-dot']=el('dot');
const state={runes:['赤纹']},listeners={},loaded=[];
class Image{set src(s){this.url=s;loaded.push(s);this.onload?.()}get src(){return this.url}setAttribute(){}}
const window={AlchemyGame:{snapshot:()=>state},addEventListener:(n,f)=>{listeners[n]=f}};
const document={querySelector:q=>q==='.furnace'?furnace:null,getElementById:id=>el(id),createElement:()=>el('layer'),querySelectorAll:q=>q==='.orbit-rune'?[orbit]:q==='.rune-entry'?[entry]:[]};
vm.runInNewContext(fs.readFileSync(__dirname+'/alchemy-assets.js','utf8'),{window,document,Image});
assert.equal(furnace.classList.contains('raster-furnace'),true);assert.match(furnace.style.backgroundImage,/furnace-v1/);assert.equal(pill.classList.contains('raster-pill'),true);assert.equal(el('layer').children.length,1);assert.equal(new Set(loaded.filter(f=>!f.includes('rune-'))).size,2);
state.runes=['金纹','星痕'];listeners['alchemy:render']();assert.equal(el('layer').children.length,2);assert.match(el('layer').children[0].src,/rune-gold-surface-v2/);assert.match(el('layer').children[1].src,/rune-star-surface-v2/);
state.runes=[];listeners['alchemy:render']();assert.equal(el('layer').children.length,0,'new order clears pill overlays');
for(const file of ['furnace-v1','pill-base-v1','rune-crimson-v1','rune-azure-v1','rune-moon-v1','rune-thunder-v1','rune-gold-v1','rune-star-v1'])assert.ok(loaded.includes('assets/alchemy/'+file+'.png'),file);
console.log('Alchemy art wiring passed: original furnace preserved, eight assets load, fusion layers and clearing.');

const css=fs.readFileSync(__dirname+'/alchemy-assets.css','utf8');assert.match(css,/mask:url\('assets\/alchemy\/pill-base-v1.png'\)/);assert.match(css,/\.surface-runes \.rune-orbit\{display:none\}/);
for(const name of ['crimson','azure','moon','thunder','gold','star']){const f='assets/alchemy/rune-'+name+'-surface-v2.svg';assert.ok(loaded.includes(f));assert.ok(fs.existsSync(__dirname+'/'+f))}
console.log('Surface runes passed: six etch overlays exist, pill alpha clipping enabled, external orbit hidden.');
