(() => {
 const board=document.querySelector('.counter-board');if(!board)return;
 // Use the same cover transform as the 1672 × 941 counter painting.
 function fit(){const w=board.clientWidth,h=board.clientHeight;if(!w||!h)return;const scale=Math.max(w/1672,h/941);board.style.setProperty('--counter-scale',scale+'px');board.style.setProperty('--counter-origin-x',(w-1672*scale)/2+'px');board.style.setProperty('--counter-origin-y',(h-941*scale)/2+'px');}
 new ResizeObserver(fit).observe(board);fit();
})();
