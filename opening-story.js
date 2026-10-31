(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.getElementById('introModal');
  const scene = document.createElement('section');
  scene.className = 'story-prologue';
  scene.setAttribute('aria-label','开场故事');
  scene.innerHTML = `<div class="prologue-mist" aria-hidden="true"></div><p class="prologue-date">坊市清晨 · 丹坊开张第一日</p><div class="prologue-table" aria-hidden="true"><div class="prologue-sign">九转丹坊</div><div class="prologue-furnace">丹<span class="prologue-fire"></span></div><div class="prologue-parcels"><i>药</i><i>药</i><i>药</i></div><div class="prologue-letter">代炼委托</div></div><div class="prologue-copy" aria-live="polite"><h2 id="prologueTitle"></h2><p id="prologueText"></p></div><div class="prologue-actions"><span id="prologueStep"></span><button type="button" id="prologueNext">下一幕 →</button><button type="button" id="prologueSkip">跳过演出</button></div>`;
  intro.before(scene); scene.hidden = true;
  const start = document.getElementById('startButton');
  const shots = [
    ['一张新招牌','你带着一只旧丹炉，在坊市租下临街的小屋。今日，你的丹坊开张了。'],
    ['第一位客人','一位行商将三包药材放上案台：‘请你替我代炼。成丹归我，若未炼成，不必赔药。’'],
    ['点起第一炉火','你接下来笺，走到炉前。先取一包药材投入炉口，这笔生意就从亲手开炉开始。']
  ];
  let index = 0, timer = null, closed = false;
  function finish() {
    if (closed) return;
    closed = true; clearTimeout(timer); scene.remove(); intro.hidden = false;
    start.click();
  }
  function show() {
    clearTimeout(timer); scene.dataset.shot = String(index);
    document.getElementById('prologueTitle').textContent = shots[index][0];
    document.getElementById('prologueText').textContent = shots[index][1];
    document.getElementById('prologueStep').textContent = `${index+1} / ${shots.length}`;
    document.getElementById('prologueNext').textContent = index === shots.length - 1 ? '取药开炉 →' : '下一幕 →';
    // Manual advance keeps reading time in the player's hands; scenery animates independently.
  }
  document.getElementById('prologueNext').addEventListener('click',()=>{if(index<shots.length - 1){index++;show();}else finish();});
  document.getElementById('prologueSkip').addEventListener('click',finish);
  scene.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}});
  if (reduced) scene.classList.add('reduce-motion');
  start.addEventListener('click', event => {
    if (start.textContent.includes('继续经营')) return;
    if (closed) return;
    event.preventDefault(); event.stopImmediatePropagation();
    intro.hidden = true; scene.hidden = false; show();
    document.getElementById('prologueNext').focus({preventScroll:true});
  }, true);
})();
