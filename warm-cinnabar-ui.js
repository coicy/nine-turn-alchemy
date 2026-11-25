/* Measure navigation on layout changes; page state remains owned by the existing UI stack. */
(() => {
 'use strict';
 if(!document.body.classList.contains('warm-cinnabar-experiment')) return;
 const nav=document.querySelector('.engine-nav'); let queued=false,last='';
 const sound=document.querySelector('.scene-sound'),settings=document.getElementById('worldSettings');
 if(sound&&settings){
  settings.append(sound);
  const host=document.querySelector('#mainMenuSettingsPanel .main-menu__settings-actions');
  if(host){
   const proxy=document.createElement('button');proxy.type='button';proxy.className='game-feel-setting warm-sound-setting';
   const sync=()=>{proxy.textContent=sound.textContent;proxy.setAttribute('aria-pressed',sound.getAttribute('aria-pressed'));};
   proxy.onclick=()=>{sound.click();sync();};host.append(proxy);sync();
   new MutationObserver(sync).observe(sound,{childList:true,attributes:true,attributeFilter:['aria-pressed']});
  }
 }
 function update(){queued=false;const bottom=Math.max(0,Math.ceil(nav.getBoundingClientRect().bottom)),value=bottom+'px';if(last===value)return;last=value;document.body.style.setProperty('--warm-nav-bottom',value);window.AlchemyViewState?.fit();}
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 const observer=new ResizeObserver(schedule);observer.observe(nav);
 window.addEventListener('resize',schedule);window.addEventListener('alchemy:view-ready',schedule);window.addEventListener('alchemy:opening-finished',schedule);
 window.AlchemyWarmUI=Object.freeze({reference:'1440x900',navigation:'adaptive flow',refresh:schedule});schedule();
})();
