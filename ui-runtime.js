/* Shared presentation helpers; business state stays in AlchemyGame. */
(() => {
 'use strict';
 const api=window.AlchemyGame;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function focusKey(el){if(!el)return null;if(el.id)return '#'+CSS.escape(el.id);for(const a of ['data-focus-key','data-world-view','data-pill-id','data-sell-pill','data-inspect','data-material-inspect','data-market-tab','data-world-tool','data-replace-equipment','data-slot','data-view','data-kind'])if(el.hasAttribute?.(a)){let key='['+a+'="'+CSS.escape(el.getAttribute(a))+'"]';if(a==='data-kind'&&el.dataset.id!==undefined)key+='[data-id="'+CSS.escape(el.dataset.id)+'"]';return key;}return null;}
 function html(host,content){const key=host.contains(document.activeElement)?focusKey(document.activeElement):null,scroll=host.scrollTop;host.innerHTML=content;host.scrollTop=scroll;if(key)host.querySelector(key)?.focus({preventScroll:true});}
 function revealSubmission(panel, preview, button) {
  if (!preview?.getClientRects().length || !button?.getClientRects().length) return;
  const bounds = panel.getBoundingClientRect();
  const top = bounds.top + panel.clientTop + 4;
  const bottom = top + panel.clientHeight - 8;
  const previewTop = preview.getBoundingClientRect().top;
  const buttonBottom = button.getBoundingClientRect().bottom;
  if (previewTop < top) panel.scrollTop += previewTop - top;
  else if (buttonBottom > bottom) panel.scrollTop += buttonBottom - bottom;
 }
 function submissionSummary(quote) {
  if (!quote.ok) return '';
  const progress = '交后 ' + Math.round(quote.after) + ' / ' + quote.target;
  if (!quote.complete) return progress + ' · 还需 ' + Math.ceil(quote.target - quote.after) + ' 药力';
  return progress + ' · 可交齐 · 到账 ' + quote.reward + ' 铜钱';
 }
 function restore(key,fallback){const el=key&&document.querySelector(key);(el?.checkVisibility()?el:fallback)?.focus?.({preventScroll:true});}
 function art(p){const a=window.AlchemyPillArt,d=a.describe(p),state={...(p.craftKind?{craftKind:p.craftKind}:{}),appearance:d.appearance,nature:d.nature,turn:d.turn,quality:d.quality};return '<span class="ux-pill-art" data-pill-art-state="'+esc(JSON.stringify(state))+'" data-pill-art-key="'+esc(d.key)+'"><img src="'+a.image(state)+'" alt=""></span>';}
 let blocked='',blockScope='',noticeTimer;
 function scope(){const s=api.snapshot(),c=api.campaign();return [c?.day,c?.phase,s.orderId,s.attempt,s.turn,s.pillEnded,s.roundEnded,s.busy,c?.economy?.coins].join('|');}
 function tell(message){blocked=message;blockScope=scope();const el=document.getElementById('workInstruction');if(el){el.hidden=false;el.textContent=message;}window.dispatchEvent(new Event('alchemy:ux-layout'));}
 function instruction(s,held){if(blocked&&blockScope===scope())return blocked;blocked='';if(held){if(window.AlchemyFurnaceGuidance)return '';return held==='pill'?'放入收丹盘，或按 Esc 放回。':held==='herbs'?'投入炉口，或按 Esc 放回。':'对火门使用扇子。';}if(s.busy||s.roundEnded||window.AlchemyScene2D?.busy)return '';if(!s.pillEnded&&window.AlchemyViewState?.snapshot().workMode==='room')return '';return window.AlchemyOnboarding?.instruction(s)||'';}
 function notify(el,message){clearTimeout(noticeTimer);el.textContent=message;noticeTimer=setTimeout(()=>{el.textContent='';},1800);}
 const dialog=document.createElement('dialog');dialog.className='ux-confirm';dialog.innerHTML='<h2 id="uxConfirmTitle"></h2><p></p><div><button data-confirm>确认</button><button data-cancel>取消</button></div>';dialog.setAttribute('aria-labelledby','uxConfirmTitle');document.body.append(dialog);
 let confirmation=null;
 function cancelConfirm(){if(!confirmation)return;const entry=confirmation;confirmation=null;dialog.close();restore(entry.focus,document.querySelector('.world-location-toggle'));}
 function confirm(options){cancelConfirm();confirmation={...options,scope:scope(),location:window.AlchemyViewState?.snapshot().current,focus:focusKey(document.activeElement)};dialog.querySelector('h2').textContent=options.title;dialog.querySelector('p').textContent=options.message;dialog.querySelector('[data-confirm]').textContent=options.confirmLabel||'确认';dialog.showModal();dialog.querySelector('[data-cancel]').focus();}
 dialog.querySelector('[data-cancel]').onclick=cancelConfirm;dialog.querySelector('[data-confirm]').onclick=()=>{const entry=confirmation;if(!entry)return;if(entry.scope!==scope()){cancelConfirm();return;}cancelConfirm();entry.onConfirm();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();cancelConfirm();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
 window.addEventListener('alchemy:view-ready',e=>{blocked='';if(confirmation&&e.detail.view!==confirmation.location)cancelConfirm();});window.addEventListener('alchemy:render',()=>{if(confirmation&&confirmation.scope!==scope())cancelConfirm();if(blockScope!==scope())blocked='';});window.addEventListener('alchemy:carry',()=>{blocked='';});
 window.AlchemyUX={esc,html,revealSubmission,submissionSummary,focusKey,restore,art,tell,instruction,clearInstruction:()=>{blocked='';},notify,confirm,cancelConfirm,get confirming(){return !!confirmation;}};
})();
