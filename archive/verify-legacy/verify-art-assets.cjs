const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={addEventListener(){}};const document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
vm.runInNewContext(fs.readFileSync(__dirname+'/alchemy-assets.js','utf8'),{window,document,Image:class{}});
const art=window.AlchemyPillArt;
for(const nature of ['warm','cool','neutral'])for(let q=0;q<5;q++)for(const rune of Object.keys(art.patterns)){
 const a=art.selection(nature,q,[rune]);assert.ok(fs.existsSync(__dirname+'/'+a.body));assert.ok(fs.existsSync(__dirname+'/'+a.crack));assert.equal(a.q,q);
 assert.equal(art.selection(nature,0,[rune]).body,art.selection(nature,4,[rune]).body,'grade must not change body');
}
assert.equal(Object.keys(art.patterns).length,6);assert.equal(art.hues.length,5);
console.log('PASS: nature/grade/rune combinations resolve real assets; grade changes crack color only');

assert.equal(art.selection('neutral',0,[]).cracks.length,0,'unmarked pills have no decorative rune');
const full=art.selection('neutral',4,Object.keys(art.patterns));
assert.equal(full.cracks.length,6);
assert.equal(new Set(full.cracks).size,6);
for(const src of full.cracks)assert.ok(fs.existsSync(__dirname+'/'+src));
console.log('PASS: zero-to-six simultaneous generated crack layers');
