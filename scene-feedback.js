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
  function pulse(kind){clearTimeout(pulseTimer);fire.className='';void fire.offsetWidth;fire.className=kind;pulseTimer=setTimeout(()=>{fire.className='';},650);}
  function show(title,message,delta,kind='neutral',duration=1500){clearTimeout(timer);box.hidden=false;box.dataset.kind=kind;box.querySelector('strong').textContent=title;box.querySelector('p').textContent=message;box.querySelector('small').textContent=delta||'';timer=setTimeout(()=>{box.hidden=true;},duration);}
  window.addEventListener('alchemy:fanning',()=>{unlock();pulse('fanning');rush(0);rush(.23);show('扇风催火','炉火正旺，正在炼化…','', 'working',1100);});
  const names={big:'大成功',success:'炼化成功',hold:'火候维持',damage:'丹体受损',explode:'炸丹 · 本炉结束',shield:'护丹生效',fusion:'丹纹融合',complete:'百转成丹',collect:'收丹完成',win:'委托完成',loss:'本单结束'};
  window.addEventListener('alchemy:feedback',e=>{const d=e.detail,k=d.event;if(k==='start'){if(window.AlchemyGame.snapshot().pillEnded){box.hidden=true;return;}pulse('loaded');show('药材已入炉','点击火门扇风炼化','', 'neutral');tone(180,.13);return;}if(!names[k])return;const bad=['explode','damage','loss'].includes(k),good=['success','big','fusion','complete','win','shield'].includes(k);const value=typeof d.value==='number'?`价值 ${d.value>0?'+':''}${Math.round(d.value)}`:String(d.value||'');show(names[k],d.message,value,bad?'bad':good?'good':'neutral',k==='explode'?2400:1800);pulse(bad?'damaged':'result');
    if(bad){rush(0,.25,220,.2);tone(110,.26);}else if(k==='hold'){tone(240,.2,.02,.045);}else if(['collect','win'].includes(k)){tone(740,.24);tone(990,.3,.08);}else{tone(520,.2);tone(780,.3,.08);if(['big','fusion','complete'].includes(k))tone(1040,.4,.17);}
  });
  window.addEventListener('alchemy:order',()=>{clearTimeout(timer);box.hidden=true;fire.className='';});
  window.AlchemyFeedback={get muted(){return muted;},get audioState(){return audio?.state||'locked';}};
})();
