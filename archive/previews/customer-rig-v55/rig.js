(()=>{'use strict';
const src=window.MerchantRigSource;if(!src)return;
const el=id=>document.getElementById(id),canvas=el('skin'),debug=el('debug'),ctx=debug.getContext('2d');
const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true});
if(!gl){el('status').textContent='此浏览器未启用 WebGL，保留完整母稿；动画未加载。';return;}
const vs=`attribute vec2 p;attribute vec4 ids;attribute vec4 weights;uniform mat3 bones[11];uniform vec4 placement;varying vec2 uv;void main(){uv=p/vec2(1024.,1536.);vec3 a=vec3(0.);for(int i=0;i<4;i++){int b=int(ids[i]);a+=bones[b]*vec3(p,1.)*weights[i];}vec2 world=a.xy*placement.zw+placement.xy;gl_Position=vec4(world.x/800.-1.,1.-world.y/450.,0.,1.);}`;
const fs=`precision mediump float;varying vec2 uv;uniform sampler2D image;void main(){gl_FragColor=texture2D(image,uv);}`;
function shader(type,text){let s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
function attribute(name,data,size){let b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);let l=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);}
attribute('p',src.vertices.flatMap(v=>v.xy),2);
attribute('ids',src.vertices.flatMap(v=>Array.from({length:4},(_,i)=>v.weights[i]?.[0]||0)),4);
attribute('weights',src.vertices.flatMap(v=>Array.from({length:4},(_,i)=>v.weights[i]?.[1]||0)),4);
let indices=src.triangles.flat(),ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
// One shared surface, no overlapping layers: preserve the PNG's straight alpha.
gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.viewport(0,0,1600,900);
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const pulse=(t,start,duration)=>{let p=(t-start)/duration;return p>0&&p<1?Math.sin(p*Math.PI)**2:0;};
let ready=false,playing=false,time=0,last=0,raf=0,view='scene',clip='greet',rest=false,restBeforeCompare=false,snapshot={};
function pose(t){let angles=Array(11).fill(0),offsetY=Array(11).fill(0),bob=0;if(rest)return{angles,bob,offsetY};
 const breath=Math.sin(t*Math.PI/2);angles[2]=breath*.0025;bob=breath*1.2;
 for(let [bone,property,value,start,duration] of src.clips[clip].channels){let v=pulse(t,start,duration)*value;if(property==='rotation')angles[bone]+=v;else if(property==='y')offsetY[bone]+=v;}
 return{angles,bob,offsetY};}
function skin(t){let {angles,bob,offsetY}=pose(t),world=[],palette=[],joints=[];
 src.bones.forEach((b,i)=>{const parent=b.parent>=0?src.bones[b.parent]:null,dx=b.bind[0]-(parent?parent.bind[0]:0),dy=b.bind[1]-(parent?parent.bind[1]:0),a=angles[i],m=[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),dx,dy+offsetY[i]+(i===0?bob:0)];world[i]=parent?multiply(world[b.parent],m):m;palette[i]=multiply(world[i],[1,0,0,1,-b.bind[0],-b.bind[1]]);joints[i]=point(world[i],[0,0]);});
 const points=src.vertices.map(v=>v.weights.reduce((p,[i,w])=>{let q=point(palette[i],v.xy);return[p[0]+q[0]*w,p[1]+q[1]*w];},[0,0]));return{palette,joints,points,angles};}
const colors=['#937e68','#d5a636','#de7947','#65a987','#45b9c1','#7e88d2','#aa7abf','#dd5a75','#78af52','#c6aa42','#dc8363'];
function placement(){if(view==='compare')return[880,27,544/1024,819/1536];if(view==='scene')return[704,54,448/1024,666/1536];return[528,27,544/1024,819/1536];}
function render(t){if(!ready)return;const data=skin(t),p=placement();
 gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform4fv(gl.getUniformLocation(program,'placement'),p);
 gl.uniformMatrix3fv(gl.getUniformLocation(program,'bones[0]'),false,new Float32Array(data.palette.flatMap(m=>[m[0],m[1],0,m[2],m[3],0,m[4],m[5],1])));gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 ctx.clearRect(0,0,1600,900);const screen=q=>[p[0]+q[0]*p[2],p[1]+q[1]*p[3]];
 if(view==='weights'){
  for(let i=0;i<src.vertices.length;i++){let q=screen(data.points[i]),v=src.vertices[i],id=v.weights.reduce((a,b)=>a[1]>b[1]?a:b)[0];ctx.fillStyle=colors[id];ctx.beginPath();ctx.arc(q[0],q[1],1.7,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#50361b20';ctx.lineWidth=.6;for(let i=0;i<src.triangles.length;i+=2){ctx.beginPath();src.triangles[i].forEach((id,j)=>{let q=screen(data.points[id]);j?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.stroke();}
 }
 if(el('rig').checked||view==='weights')src.bones.forEach((b,i)=>{let q=screen(data.joints[i]);if(b.parent>=0){let from=screen(data.joints[b.parent]);ctx.strokeStyle=colors[i];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...from);ctx.lineTo(...q);ctx.stroke();}ctx.fillStyle=colors[i];ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q[0],q[1],4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='13px sans-serif';ctx.fillStyle='#342815';ctx.fillText(b.name,q[0]+7,q[1]);});
 let phase=rest?'零姿态':clip==='test'?'关节范围检查':clip==='idle'?'静候':t<.5?'静候':t<3.3?'招呼':t<3.4?'停顿':t<5.2?'点头致意':'回到静候';
 el('phase').textContent=phase;el('line').textContent=view==='compare'?'左：完整母稿 / 右：零姿态蒙皮复原':phase==='招呼'?'掌柜，今日生意可好？':phase==='点头致意'?'有劳。':'同源画稿、连续网格，不进行肩颈硬拼。';el('time').value=t;el('clock').textContent=t.toFixed(2)+' 秒';
 snapshot={ready,time:t,clip,view,rest,playing,bones:11,vertices:src.vertices.length,triangles:src.triangles.length,angles:data.angles,placement:p};
}
function tick(now){let dt=Math.min((now-last)/1000,.05);last=now;if(playing)time=(time+dt)%8;render(time);if(playing)raf=requestAnimationFrame(tick);}
function run(){cancelAnimationFrame(raf);last=performance.now();render(time);el('play').textContent=playing?'暂停':'播放';if(playing)raf=requestAnimationFrame(tick);}
function seek(t){time=Math.max(0,Math.min(8,t));playing=false;run();}
el('play').onclick=()=>{playing=!playing;run();};el('replay').onclick=()=>{time=0;playing=true;run();};el('time').oninput=e=>seek(+e.target.value);
el('motion').onchange=e=>{clip=e.target.value;time=0;run();};el('view').onchange=e=>{const previous=view;view=e.target.value;el('stage').className='stage '+view;el('master').hidden=view!=='compare';if(view==='compare'){restBeforeCompare=rest;rest=true;playing=false;}else if(previous==='compare'){rest=restBeforeCompare;}el('rest').checked=rest;el('rest').disabled=view==='compare';run();};el('rest').onchange=e=>{rest=e.target.checked;run();};el('rig').onchange=()=>run();
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;run();}});
window.MerchantRig={seek,snapshot:()=>snapshot,skin,source:src,setView:v=>{el('view').value=v;el('view').dispatchEvent(new Event('change'));},setClip:v=>{el('motion').value=v;el('motion').dispatchEvent(new Event('change'));}};
const image=new Image();image.onload=()=>{let tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);ready=true;canvas.hidden=false;el('master').hidden=true;el('status').textContent='11 根骨骼 · 1617 个顶点 · 3072 个三角形 · 每点最多 4 根骨骼权重';playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;run();};image.onerror=()=>{el('status').textContent='素材加载失败';};image.src=window.MerchantTexture;
})();
