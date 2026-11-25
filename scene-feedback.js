(() => {
  'use strict';
  const stage=document.getElementById('pillStage');
  stage.insertAdjacentHTML('beforeend','<div id="fireResponse" aria-hidden="true"></div><div id="refineFeedback" class="refine-feedback" role="status" hidden><strong></strong><p></p><small></small></div>');
  const box=document.getElementById('refineFeedback'),fire=document.getElementById('fireResponse');
  const sound=document.createElement('button');sound.type='button';sound.className='scene-sound';sound.setAttribute('aria-label','切换游戏音效');
  document.querySelector('.engine-nav').append(sound);
  let muted=false;try{muted=localStorage.getItem('alchemy.sound')==='off';}catch{}
  let audio=null,noise=null,timer,pulseTimer;
  function soundLabel(){sound.textContent=muted?'音效：关':'音效：开';sound.setAttribute('aria-pressed',String(!muted));}
  soundLabel();
  function unlock(){if(muted)return;try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();noise=audio.createBuffer(1,audio.sampleRate*.35,audio.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(audio.state==='suspended')void audio.resume().catch(()=>{});}catch{}}
  document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
  sound.onclick=()=>{muted=!muted;try{localStorage.setItem('alchemy.sound',muted?'off':'on');}catch{}soundLabel();if(muted)void audio?.suspend();else unlock();};
  function tone(frequency,duration,delay=0,volume=.07){if(muted||!audio||audio.state!=='running')return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.01);}
  function rush(delay=0,duration=.16,frequency=650,volume=.12){if(muted||!audio||audio.state!=='running')return;const t=audio.currentTime+delay,s=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();s.buffer=noise;f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audio.destination);s.start(t);s.stop(t+duration);}
  function pulse(kind){if(matchMedia('(prefers-reduced-motion: reduce)').matches||window.AlchemyGameFeel?.reduced)return;clearTimeout(pulseTimer);fire.className='';void fire.offsetWidth;fire.className=kind;pulseTimer=setTimeout(()=>{fire.className='';},650);}
  box.classList.add('furnace-hint');
  document.querySelector('.engine-viewport').append(box);
  let guide = '', ritualGuide = '', result = null;
  const titleNode=box.querySelector('strong'), messageNode=box.querySelector('p'), deltaNode=box.querySelector('small');
  function renderGuide() {
    const view=window.AlchemyViewState?.snapshot();
    const ritualText=view?.current==='work' && view.workMode==='furnace' ? ritualGuide : '';
    const entry=ritualText ? {title:'敕火符',message:ritualText,delta:'',kind:'neutral'} :
      result || (guide ? {title:'',message:guide,delta:'',kind:'neutral'} : null);
    // Targets name these actions already; retain their accessible description.
    // Results, ritual steps and nonredundant guidance still use the visible strip.
    box.dataset.presentation=!ritualText&&!result&&['点火门催炼','收丹入匣','收取入匣'].includes(guide)?'assistive':'visible';
    box.hidden=!entry;
    if (!entry) return;
    for(const [node,value] of [[titleNode,entry.title],[messageNode,entry.message],[deltaNode,entry.delta]]) {
      if(node.textContent!==value) node.textContent=value;
    }
    box.dataset.kind=entry.kind;
  }
  function clearResult() {
    clearTimeout(timer);
    result=null;
    renderGuide();
  }
  function show(title,message,delta,kind='neutral',duration=1800) {
    clearTimeout(timer);
    result={title,message,delta:delta||'',kind};
    renderGuide();
    timer=setTimeout(clearResult,duration);
  }
  window.addEventListener('alchemy:fanning',()=>{clearResult();unlock();pulse('fanning');rush(0);rush(.23);});
  const names={resume:'回炉续炼',big:'大成功',success:'炼化成功',hold:'火候维持',damage:'丹体受损',explode:'炸丹 · 本炉结束',complete:'百转成丹',collect:'收丹完成',submit:'丹药已提交',win:'委托完成',loss:'本单结束'};
  window.addEventListener('alchemy:feedback',e=>{const d=e.detail,k=d.event;if(k==='start'){if(window.AlchemyGame.snapshot().pillEnded){clearResult();return;}pulse('loaded');tone(180,.13);return;}if(k==='ritual-complete'){show('步罡已成',d.message,'','good',1800);tone(392,.17);tone(588,.25,.08);return;}if(!names[k])return;if(['collect','win','loss'].includes(k)&&window.AlchemyGame.snapshot().roundEnded){clearResult();tone(740,.24);return;}const bad=['explode','damage','loss'].includes(k),good=['success','big','complete','win'].includes(k);const craft=!!window.AlchemyGame.snapshot().craftKind,label=craft?'估值':'药力';const value=typeof d.value==='number'?(d.value===0?label+'未变':`${label} ${d.value>0?'+':'−'}${Math.round(Math.abs(d.value))}`):String(d.value||'');show(craft?({damage:'造物受损',explode:'炸炉 · 本炉结束',complete:'百转造物',collect:'收取完成'}[k]||names[k]):names[k],d.autoStep ? `自动催炼 ${d.autoStep} / 7` : '',value,bad?'bad':good?'good':'neutral',1800);pulse(bad?'damaged':'result');
    if(k==='explode'){rush(0,.25,220,.2);tone(90,.28);}else if(bad){rush(0,.12,420,.09);tone(155,.14,0,.045);}else if(k==='hold'){tone(240,.2,.02,.045);}else if(['collect','win'].includes(k)){tone(740,.24);tone(990,.3,.08);}else if(['big','fusion','complete'].includes(k)){tone(392,.24,0,.08);tone(588,.3,.045,.065);tone(784,.38,.10,.055);}else{tone(520,.14,0,.045);tone(780,.18,.055,.035);}
  });
  window.addEventListener('alchemy:feel',e=>{
    const d=e.detail||{};
    if(d.event==='yuan'){unlock();tone(330,.22,0,.055);tone(660,.32,.08,.05);}
    else if(d.event==='protection'){unlock();tone(260,.18,0,.045);tone(520,.28,.08,.04);}
    else if(d.event==='ritual-start'){unlock();tone(180,.24,0,.04);}
    else if(d.event==='ritual-sealed'){unlock();tone(392,.18,0,.05);tone(784,.32,.08,.045);}
    else if(d.event==='stroke'){unlock();tone(520,.07,0,.025);}
    else if(['purchase','equipment'].includes(d.event)){unlock();tone(460,.12,0,.035);}
    else if(['paid','rent-paid'].includes(d.event)){unlock();tone(620,.15,0,.04);tone(840,.22,.06,.035);}
  });
  window.addEventListener('alchemy:view-ready',clearResult);
  window.addEventListener('alchemy:order',()=>{clearResult();fire.className='';});
  window.addEventListener('alchemy:carry',e=>{if(e.detail.kind)clearResult();});
  window.AlchemyFeedback={
    setGuide(text){if(text!==guide){guide=text;renderGuide();}},
    setRitualGuide(text){if(text!==ritualGuide){ritualGuide=text;renderGuide();}},
    get muted(){return muted;},get audioState(){return audio?.state||'locked';}};
})();
