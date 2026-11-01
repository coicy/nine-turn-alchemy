(() => {
 const board=document.querySelector('.counter-board');if(!board||board.querySelector('.counter-decor'))return;
 for(const id of ['jars','tools']){const im=new Image();im.className='counter-decor counter-decor-'+id;im.alt='';im.setAttribute('aria-hidden','true');im.draggable=false;im.hidden=true;im.onload=()=>{im.hidden=false;};im.src='assets/counter-decor-v70/'+id+'.png';board.append(im);}
})();

