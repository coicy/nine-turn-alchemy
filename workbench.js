/* Painted objects and transparent controls share the same camera and anchors. */
(()=>{'use strict';const stage=document.getElementById('pillStage'),books=stage.querySelector('.world-books'),bag=stage.querySelector('.world-casket'),row=stage.querySelector('.world-tool-row'),L=window.AlchemyWorldLayout;
const stack=document.createElement('button');stack.className='world-book-stack';stack.setAttribute('aria-label','打开案上书册');stack.textContent='书册';stage.append(stack);
const pick=document.createElement('div');pick.className='world-book-picker';pick.hidden=true;pick.innerHTML='<button data-book="record">经营簿</button><button data-book="manual">炉谱</button>';stage.append(pick);
stack.onclick=()=>{pick.hidden=!pick.hidden;if(!pick.hidden)pick.querySelector('button').focus({preventScroll:true});};pick.onclick=e=>{const b=e.target.closest('[data-book]');if(b){pick.hidden=true;AlchemyViewState.navigate(b.dataset.book,{anchor:stack});}};
document.addEventListener('pointerdown',e=>{if(!pick.contains(e.target)&&!stack.contains(e.target))pick.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pick.hidden){e.preventDefault();e.stopImmediatePropagation();pick.hidden=true;stack.focus({preventScroll:true});}},true);
function rect(el,x,y,w,h){for(const [k,v]of Object.entries({left:x,top:y,width:w,height:h}))el.style.setProperty(k,v+'px','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');}
function fit(){if(window.AlchemyViewState?.snapshot().workMode==='furnace')return;const mobile=L.mobile,w=parseFloat(stage.style.getPropertyValue('--world-width')),h=mobile?w*1448/1086:900;if(!w)return;
 if(mobile){Object.assign(L.toolRest,{x:w*.657-22,y:h*.54-48,w:w*.254+44,h:53,baseline:h*.54});rect(stack,w*.647-22,h*.594-22,44,44);rect(bag,w*.783-22,h*.594-22,44,44);rect(pick,Math.min(w-152,w*.647-44),h*.594+22,144,52);rect(row,w*.657-22,h*.54-48,w*.254+44,53);}
 else{rect(books,940,530,200,80);rect(bag,1175,512,165,96);rect(row,993,423,461,90);}
}
const baseFit=L.fit;L.fit=function(){const r=baseFit();fit();return r;};window.addEventListener('alchemy:view-ready',()=>{pick.hidden=true;fit();});window.addEventListener('alchemy:render',fit);window.addEventListener('resize',fit);fit();})();
