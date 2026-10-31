(() => {
  'use strict';
  const prefix='alchemy-slot-v1-', activeKey='alchemy-active-slot-v1';
  let error='', active=1;
  const validId=id=>Number.isInteger(id)&&id>=1&&id<=3;
  function get(key){try{return localStorage.getItem(key);}catch{error='浏览器未允许读取存档。';return null;}}
  function put(key,value){try{localStorage.setItem(key,value);error='';return true;}catch{error='存档未能保存，请检查浏览器存储空间或隐私设置。';return false;}}
  function valid(d){return !!(d?.version===1&&Number.isInteger(d.campaign?.day)&&d.campaign.day>=1&&d.campaign.day<=30
    &&['open','settled','finished'].includes(d.campaign.phase)&&Array.isArray(d.campaign.orders)&&[3,7,8].includes(d.campaign.orders.length)
    &&Array.isArray(d.campaign.history)&&d.campaign.orders.every(o=>o&&typeof o.id==='string'&&Number.isFinite(o.target)&&['pending','active','completed','failed','skipped'].includes(o.status))
    &&Number.isFinite(d.target)&&d.target>0&&[1,3].includes(d.materials)&&d.state?.started&&d.state.pill
    &&Number.isFinite(d.state.delivered)&&Number.isInteger(d.state.attempt)&&d.state.attempt>=0&&d.state.attempt<=3
    &&Array.isArray(d.state.collected)&&Array.isArray(d.state.logs)&&Array.isArray(d.state.discoveredRunes)
    &&Array.isArray(d.state.pill.runes)&&Number.isFinite(d.state.pill.value)&&Number.isFinite(d.state.riskResult?.explode));}
  // Copy the old save once. Never remove the original or re-import over a reset slot.
  if(get(prefix+1)===null){
    const legacy=get('alchemy-days-v1');
    if(legacy!==null){try{const data=JSON.parse(legacy);if(valid(data))put(prefix+1,JSON.stringify({version:1,data,updatedAt:null,preferences:{expanded:get('alchemy-onboarding-expanded-v53')==='true'}}));
      else error='旧进度暂不能读取，原始数据已保留。';}catch{error='旧进度暂不能读取，原始数据已保留。';}}
  }
  const selected=Number(get(activeKey));if(validId(selected))active=selected;
  function slot(id){
    if(!validId(id))throw Error('Invalid save slot');
    const raw=get(prefix+id);if(raw===null)return {version:1,data:null,preferences:{}};
    try{const entry=JSON.parse(raw);if(entry?.version===1&&(entry.data===null||valid(entry.data)))return entry;}catch{}
    return {corrupt:true,data:null,preferences:{}};
  }
  function write(data){
    if(!valid(data)){error='当前进度不完整，未覆盖存档。';return false;}
    const entry=slot(active);if(entry.corrupt){error='当前存档无法读取，未覆盖原始数据。';return false;}
    return put(prefix+active,JSON.stringify({version:1,data,updatedAt:new Date().toISOString(),preferences:entry.preferences||{}}));
  }
  function select(id){if(!validId(id)||slot(id).corrupt)return false;return put(activeKey,String(id));}
  function reset(id){if(!validId(id))return false;return put(prefix+id,JSON.stringify({version:1,data:null,preferences:{}}));}
  window.AlchemySaves={
    get active(){return active;},get error(){return error;},valid,slot,write,select,reset,
    read:()=>slot(active).data,
    preference:name=>slot(active).preferences?.[name],
    setPreference(name,value){const entry=slot(active);if(entry.corrupt)return false;entry.preferences={...entry.preferences,[name]:value};return put(prefix+active,JSON.stringify(entry));}
  };
})();
