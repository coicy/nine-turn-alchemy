/* Transactional, versioned dialogue graph runner. No eval and no economy commands. */
(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const safeKey=k=>typeof k==='string'&&/^[a-zA-Z0-9_.:-]{1,120}$/.test(k)&&!['__proto__','prototype','constructor'].some(s=>k.split('.').includes(s));
  const scalar=x=>['string','number','boolean'].includes(typeof x)&&(typeof x!=='number'||Number.isFinite(x));
  const template=(text,context)=>String(text||'').replace(/\{\{([\w.:-]+)\}\}/g,(_,k)=>scalar(context[k])?String(context[k]):'');
  function validate(content){
    const errors=[];
    for(const [id,g] of Object.entries(content.graphs||{})){
      if(g.id!==id||!g.nodes?.[g.start])errors.push(id+': missing start');
      for(const [nid,n] of Object.entries(g.nodes||{})){
        for(const [key,value] of Object.entries(n.set||{}))if(!safeKey(key.replace(/\{\{[\w.:-]+\}\}/g,'context'))||!scalar(value))errors.push(id+'/'+nid+': invalid flag');
        if(!n.end&&!n.line)errors.push(id+'/'+nid+': missing line');
        if(n.line&&!content.strings?.[content.locale]?.[n.line])errors.push(id+'/'+nid+': missing localized line');
        if(!n.end&&!n.next&&!n.choices?.length)errors.push(id+'/'+nid+': dead end');
        for(const target of [n.next,...(n.choices||[]).map(c=>c.to)].filter(Boolean))if(!g.nodes[target])errors.push(id+'/'+nid+': missing target '+target);
        const ids=new Set();for(const c of n.choices||[]){if(ids.has(c.id))errors.push(id+'/'+nid+': duplicate choice');ids.add(c.id);if(!content.strings?.[content.locale]?.[c.text])errors.push(id+'/'+nid+': missing choice text');}
        if(n.action&&!['letter'].includes(n.action))errors.push(id+'/'+nid+': unknown action');
        if(n.scene&&!['work','orders'].includes(n.scene))errors.push(id+'/'+nid+': unknown scene');
      }
      const reached=new Set(),walk=n=>{if(reached.has(n)||!g.nodes[n])return;reached.add(n);const node=g.nodes[n];if(node.next)walk(node.next);for(const c of node.choices||[])walk(c.to);};walk(g.start);
      for(const nid of Object.keys(g.nodes||{}))if(!reached.has(nid))errors.push(id+'/'+nid+': unreachable');
    }return errors;
  }
  function create(content,storage,onChange=()=>{}){
    const errors=validate(content);if(errors.length)throw Error(errors.join('\n'));
    const fresh=()=>({version:1,cursor:null,flags:{},seen:{},history:[],settings:{speed:32,autoDelay:1200}});
    let state=fresh(),active=false,error='',sequence=0;
    function valid(s){return s?.version===1&&s.flags&&s.seen&&!Array.isArray(s.flags)&&!Array.isArray(s.seen)&&Array.isArray(s.history)&&s.history.length<=200&&s.settings&&[0,18,32,55].includes(s.settings.speed)&&[800,1200,2000].includes(s.settings.autoDelay)&&Object.keys(s.flags).every(safeKey)&&Object.values(s.flags).every(scalar)&&Object.keys(s.seen).length<=1000&&Object.values(s.seen).every(v=>v===true)&&s.history.every(r=>typeof r.text==='string'&&r.text.length<=4000)&&(!s.cursor||(content.graphs[s.cursor.graph]?.nodes[s.cursor.node]&&s.cursor.context&&Object.values(s.cursor.context).every(scalar)&&typeof s.cursor.read==='boolean'));}
    const stored=storage.read();if(stored!=null){if(valid(stored))state=clone(stored);else error='对话记录暂不能读取，原记录已保留。';}
    let corrupt=stored!=null&&!valid(stored);
    const strings=()=>content.strings[content.locale]||content.strings['zh-CN'];
    function text(key,context=state.cursor?.context||{}){return template(strings()[key]||key,context);}
    function condition(c,context=state.cursor?.context||{},flags=state.flags){
      if(!c)return true;if(c.all)return c.all.every(x=>condition(x,context,flags));if(c.any)return c.any.some(x=>condition(x,context,flags));if(c.not)return !condition(c.not,context,flags);
      const key=template(c.key,context),v=c.source==='flag'?flags[key]:context[key];
      return {eq:()=>v===c.value,ne:()=>v!==c.value,gte:()=>typeof v==='number'&&v>=c.value,lte:()=>typeof v==='number'&&v<=c.value,gt:()=>typeof v==='number'&&v>c.value,lt:()=>typeof v==='number'&&v<c.value}[c.op]?.()||false;
    }
    function commit(candidate,notify=true){
      if(corrupt){error='对话记录损坏，未覆盖原记录。可关闭对话，经营存档保持原样。';onChange();return false;}
      if(storage.write(clone(candidate))===false){error='对话进度未能保存，请检查存储后重试。';onChange();return false;}
      state=candidate;error='';if(notify)onChange();return true;
    }
    function apply(flags,sets,context){for(const [raw,value] of Object.entries(sets||{})){const key=template(raw,context);if(!safeKey(key)||!scalar(value))throw Error('Invalid dialogue flag');flags[key]=value;}}
    function enter(candidate,gid,nid,context){
      const graph=content.graphs[gid];let steps=0;
      while(steps++<64){const n=graph.nodes[nid];if(!n)throw Error('Missing dialogue node');apply(candidate.flags,n.set,context);
        if(n.end){candidate.cursor=null;return {ended:true,graph:gid,action:n.action||null,context};}
        if(n.line){const lineKey=content.locale+':'+gid+':'+n.line+':'+graph.version;candidate.cursor={graph:gid,node:nid,context:clone(context),read:false,lineKey,token:++sequence,wasSeen:!!candidate.seen[lineKey]};
          const speaker=content.speakers[n.speaker]||{name:n.speaker};candidate.history.push({speaker:template(speaker.name,context),text:text(n.line,context),day:context.day||1,graph:gid,node:nid,kind:'line'});candidate.history=candidate.history.slice(-200);return {ended:false};}
        nid=n.next;
      }throw Error('Dialogue automatic cycle limit');
    }
    function move(target){const c=state.cursor;if(!active||!c)return false;const candidate=clone(state),ending=enter(candidate,c.graph,target,c.context);if(!commit(candidate,false))return false;if(ending.ended)active=false;onChange(ending);return true;}
    function present(){const c=state.cursor;if(!c)return null;const n=content.graphs[c.graph].nodes[c.node],context=c.context;
      const speaker=content.speakers[n.speaker]||{name:n.speaker};
      return {...clone(c),title:content.graphs[c.graph].title,kind:content.graphs[c.graph].kind,text:text(n.line,context),speaker:{...speaker,name:template(speaker.name,context),role:template(speaker.role,context)},expression:n.expression||'neutral',scene:n.scene||null,facts:!!n.facts,nextText:text(n.nextText||'opt_continue',context),choices:(n.choices||[]).filter(c=>condition(c.if)||c.lockedText).map(c=>({id:c.id,text:text(c.text,context),enabled:condition(c.if),reason:c.lockedText?text(c.lockedText,context):''}))};
    }
    return {
      get active(){return active;},get error(){return error;},get pending(){return clone(state.cursor);},get flags(){return clone(state.flags);},get history(){return clone(state.history);},get settings(){return clone(state.settings);},snapshot:()=>clone(state),present,text,condition,
      start(gid,context={},options={}){if(active||!content.graphs[gid])return false;const safe={};for(const [k,v]of Object.entries(context))if(safeKey(k)&&scalar(v))safe[k]=typeof v==='string'?v.slice(0,2000):v;
        if(state.cursor&&state.cursor.graph===gid&&state.cursor.context.orderId===safe.orderId){active=true;onChange();return true;}
        if(state.cursor){error='上次交谈尚未结束，请先继续或结束那段交谈。';onChange();return false;}
        const target=options.node||content.graphs[gid].start;if(!content.graphs[gid].nodes[target])return false;const candidate=clone(state),ending=enter(candidate,gid,target,safe);if(!commit(candidate,false))return false;active=!ending.ended;onChange(ending);return true;},
      resume(){if(!state.cursor||active||corrupt)return false;active=true;onChange();return true;},
      suspend(){active=false;onChange({suspended:true});return true;},
      markRead(){if(!active||!state.cursor)return false;if(state.cursor.read)return true;const next=clone(state);next.cursor.read=true;next.seen[next.cursor.lineKey]=true;const keys=Object.keys(next.seen);while(keys.length>1000)delete next.seen[keys.shift()];return commit(next,false);},
      advance(token){const c=state.cursor;if(!active||!c||!c.read||(token!==undefined&&token!==c.token))return false;const n=content.graphs[c.graph].nodes[c.node];if(n.choices)return false;return move(n.next);},
      choose(id,token){const c=state.cursor;if(!active||!c?.read||(token!==undefined&&token!==c.token))return false;const choice=content.graphs[c.graph].nodes[c.node].choices?.find(x=>x.id===id);if(!choice||!condition(choice.if))return false;const candidate=clone(state);candidate.history.push({speaker:'你',text:text(choice.text),day:c.context.day||1,graph:c.graph,node:c.node,kind:'choice'});candidate.history=candidate.history.slice(-200);const ending=enter(candidate,c.graph,choice.to,c.context);if(!commit(candidate,false))return false;if(ending.ended)active=false;onChange(ending);return true;},
      end(skip=false){if(!state.cursor)return false;const gid=state.cursor.graph,context=state.cursor.context,next=clone(state);if(skip&&gid==='opening')next.flags.openingComplete=true;next.cursor=null;if(!commit(next,false))return false;active=false;onChange({ended:true,graph:gid,context,skipped:skip});return true;},
      setSettings(patch){const next=clone(state);if([0,18,32,55].includes(patch.speed))next.settings.speed=patch.speed;if([800,1200,2000].includes(patch.autoDelay))next.settings.autoDelay=patch.autoDelay;return commit(next);}
    };
  }
  const api={create,validate,template};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlchemyDialogueEngine=api;
})(typeof window!=='undefined'?window:globalThis);
