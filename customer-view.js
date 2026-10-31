(() => {
 'use strict';const customers=window.AlchemyCustomers;
 const probes=new Map();
 function check(src){if(window.AlchemyAssets)return AlchemyAssets.load(src);if(!probes.has(src))probes.set(src,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;}));return probes.get(src);}
 function portrait(order,{waiting=false}={}){const v=customers.visit(order),el=document.createElement('div');el.className=waiting?'waiting-person':'visitor-portrait';el.dataset.customerId=v.customerId;el.dataset.visitId=v.id;el.dataset.customerState=waiting?'waiting':v.state;el.setAttribute('role','img');el.setAttribute('aria-label',v.name+' · '+v.role+(waiting?'正在等候':''));el.title=v.name+' · '+v.role;
  const a=waiting?customers.appearance(customers.profile(order),'waiting'):v.appearance;
  function missing(){el.style.backgroundImage='none';el.classList.add('customer-art-missing');el.textContent='客人';el.dataset.artState='missing';}
  if(!a){missing();return el;}const f=a.frame;el.dataset.appearanceId=a.id;el.dataset.artState=a.actualState;el.style.backgroundImage=`url("${f.src}")`;el.style.backgroundSize=`${f.columns*100}% ${f.rows*100}%`;el.style.backgroundPosition=`${f.columns===1?0:f.column/(f.columns-1)*100}% ${f.rows===1?0:f.row/(f.rows-1)*100}%`;
  check(f.src).then(ok=>{if(!ok)missing();});return el;
 }
 window.AlchemyCustomerView={portrait};
})();
