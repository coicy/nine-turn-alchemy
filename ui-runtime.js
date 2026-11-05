/* Shared presentation helpers; business state stays in AlchemyGame. */
(() => {
 'use strict';
 const api=window.AlchemyGame;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function focusKey(el){if(!el)return null;if(el.id)return '#'+CSS.escape(el.id);for(const a of ['data-focus-key','data-world-view','data-pill-id','data-sell-pill','data-inspect','data-material-inspect','data-market-tab','data-world-tool','data-replace-equipment','data-slot','data-view','data-kind'])if(el.hasAttribute?.(a)){let key='['+a+'="'+CSS.escape(el.getAttribute(a))+'"]';if(a==='data-kind'&&el.dataset.id!==undefined)key+='[data-id="'+CSS.escape(el.dataset.id)+'"]';return key;}return null;}
 function html(host,content){const key=host.contains(document.activeElement)?focusKey(document.activeElement):null,scroll=host.scrollTop;host.innerHTML=content;host.scrollTop=scroll;if(key)host.querySelector(key)?.focus({preventScroll:true});}
 function restore(key,fallback){const el=key&&document.querySelector(key);(el?.checkVisibility()?el:fallback)?.focus?.({preventScroll:true});}
 function art(p){const a=window.AlchemyPillArt.selection(p.nature,p.quality,p.runes||[]);return '<span class="ux-pill-art"><img src="'+a.body+'" alt="">'+a.cracks.map(src=>'<i style="background-color:'+window.AlchemyPillArt.hues[a.q]+';mask-image:url('+src+');-webkit-mask-image:url('+src+')"></i>').join('')+'</span>';}
 function runeArt(name){return art({nature:'neutral',quality:3,runes:[name]});}
 let blocked='',blockScope='',noticeTimer;
 function scope(){const s=api.snapshot(),c=api.campaign();return [c?.day,c?.phase,s.orderId,s.attempt,s.turn,s.pillEnded,s.roundEnded,s.busy,c?.economy?.coins].join('|');}
 function tell(message){blocked=message;blockScope=scope();const el=document.getElementById('workInstruction');if(el){el.hidden=false;el.textContent=message;}window.dispatchEvent(new Event('alchemy:ux-layout'));}
 function instruction(s,held){if(blocked&&blockScope===scope())return blocked;blocked='';if(held)return held==='pill'?'放入收丹盘，或按 Esc 放回。':held==='herbs'?'投入炉口，或按 Esc 放回。':'对火门使用扇子。';if(s.runeChoices?.length||s.busy||s.roundEnded||window.AlchemyScene2D?.busy)return '';if(!s.pillEnded&&window.AlchemyViewState?.snapshot().workMode==='room')return '';return window.AlchemyOnboarding?.instruction(s)||'';}
 function notify(el,message){clearTimeout(noticeTimer);el.textContent=message;noticeTimer=setTimeout(()=>{el.textContent='';},1800);}
 const dialog=document.createElement('dialog');dialog.className='ux-confirm';dialog.innerHTML='<h2 id="uxConfirmTitle"></h2><p></p><div><button data-confirm>确认</button><button data-cancel>取消</button></div>';dialog.setAttribute('aria-labelledby','uxConfirmTitle');document.body.append(dialog);
 let confirmation=null;
 function cancelConfirm(){if(!confirmation)return;const entry=confirmation;confirmation=null;dialog.close();restore(entry.focus,document.querySelector('.world-location-toggle'));}
 function confirm(options){cancelConfirm();confirmation={...options,scope:scope(),location:window.AlchemyViewState?.snapshot().current,focus:focusKey(document.activeElement)};dialog.querySelector('h2').textContent=options.title;dialog.querySelector('p').textContent=options.message;dialog.querySelector('[data-confirm]').textContent=options.confirmLabel||'确认';dialog.showModal();dialog.querySelector('[data-cancel]').focus();}
 dialog.querySelector('[data-cancel]').onclick=cancelConfirm;dialog.querySelector('[data-confirm]').onclick=()=>{const entry=confirmation;if(!entry)return;if(entry.scope!==scope()){cancelConfirm();return;}cancelConfirm();entry.onConfirm();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();cancelConfirm();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
 window.addEventListener('alchemy:view-ready',e=>{blocked='';if(confirmation&&e.detail.view!==confirmation.location)cancelConfirm();});window.addEventListener('alchemy:render',()=>{if(confirmation&&confirmation.scope!==scope())cancelConfirm();if(blockScope!==scope())blocked='';});window.addEventListener('alchemy:carry',()=>{blocked='';});
 window.AlchemyUX={esc,html,focusKey,restore,art,runeArt,tell,instruction,clearInstruction:()=>{blocked='';},notify,confirm,cancelConfirm,get confirming(){return !!confirmation;}};
})();
