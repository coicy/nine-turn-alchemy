(() => {
 const UX=window.AlchemyUX,source=document.getElementById('uxDataSettingsSource'),dialog=document.createElement('dialog');dialog.className='ux-data-settings';dialog.setAttribute('aria-labelledby','uxDataTitle');dialog.innerHTML='<header><h2 id="uxDataTitle">试玩数据设置</h2><button data-close-data>关闭</button></header>';document.body.append(dialog);source.hidden=false;dialog.append(source);
 const intro=document.getElementById('introTelemetryEnabled'),main=document.getElementById('telemetryEnabled');let origin=null;
 function openData(){origin=UX.focusKey(document.activeElement);dialog.showModal();dialog.querySelector('[data-close-data]').focus();}
 function closeData(){dialog.close();UX.restore(origin,document.querySelector('.world-settings-toggle'));}
 main.addEventListener('change',()=>{intro.checked=main.checked;});intro.addEventListener('change',()=>{main.checked=intro.checked;main.dispatchEvent(new Event('change'));});intro.checked=main.checked;
 dialog.querySelector('[data-close-data]').onclick=closeData;dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeData();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
 for(const [host,key]of[[document.querySelector('.opening-launch'),'title-data'],[document.getElementById('worldSettings'),'settings-data']]){const b=document.createElement('button');b.type='button';b.dataset.focusKey=key;b.className='ux-data-open';b.textContent='试玩数据设置';b.onclick=openData;host.append(b);}
 document.querySelector('.opening-consent').hidden=true;document.querySelector('.opening-prose').hidden=true;document.querySelector('.opening-tagline').textContent='一炉烟火，百转成丹。';
 const help=document.querySelector('.opening-help');help.innerHTML='<summary>试炉要诀</summary><ol><li>取一包药。</li><li>投入炉口，点火门炼化。</li><li>取丹落盘，按归属交付或入匣。</li></ol><button data-title-rules data-focus-key="title-rules">查阅详细要诀</button>';
 const rules=document.createElement('dialog');rules.className='ux-title-rules';rules.innerHTML='<header><h2>试炉要诀</h2><button data-close-rules>关闭</button></header><div></div>';document.body.append(rules);
 help.querySelector('button').onclick=()=>{origin=UX.focusKey(document.activeElement);const page=document.querySelector('.side-panel .journal-page:nth-of-type(2)');rules.querySelector('div').innerHTML=page?.innerHTML||'';rules.showModal();rules.querySelector('button').focus();};
 const closeRules=()=>{rules.close();UX.restore(origin,help.querySelector('summary'));};rules.querySelector('button').onclick=closeRules;rules.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeRules();});rules.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
})();
