import './styles.css';

const app=document.querySelector('#app');
app.innerHTML=`
<div class="app-shell">
<header class="topbar"><div class="brand"><div class="logo">🧩</div><div><h1>LR拼豆</h1><p>把喜欢的图片，变成一颗颗能完成的拼豆</p></div></div><div class="top-actions"><label class="btn primary" for="imageInput">📷 上传图片</label><input id="imageInput" class="file-input" type="file" accept="image/*"><button id="saveBtn" class="btn">💾 保存</button><button id="exportBtn" class="btn">🖼️ 导出</button></div></header>
<main class="layout">
<section class="panel workspace">
<div class="toolbar"><div class="mode-tabs"><button data-mode="follow" class="active">照图拼</button><button data-mode="draw">自由画</button></div><button id="penTool" class="tool active">✏️ 拼豆</button><button id="pickTool" class="tool">💧 吸管</button><button id="eraseTool" class="tool">🧽 橡皮</button><button id="undoBtn" class="tool">↶ 撤销</button><button id="redoBtn" class="tool">↷ 重做</button><button id="resetBtn" class="tool">↺ 重置</button></div>
<div id="emptyState" class="empty-state"><div class="empty-card"><div class="empty-icon">🧸</div><h2>先选一张她喜欢的图片</h2><p>上传后会自动变成拼豆网格。选中颜色，再点格子就能一颗颗拼；也可以进入自由画模式自己改图。</p><label class="btn primary" for="imageInput">开始做拼豆图</label></div></div>
<div id="canvasWrap" class="canvas-wrap" hidden><canvas id="gridCanvas"></canvas></div>
</section>
<aside class="side">
<section class="panel card"><h3>图纸设置</h3><div class="field"><label><span>宽度（豆）</span><b id="widthText">52</b></label><input id="gridWidth" class="range" type="range" min="16" max="104" step="1" value="52"></div><div class="field"><label><span>颜色数量</span><b id="colorText">16</b></label><input id="colorCount" class="range" type="range" min="4" max="32" step="1" value="16"></div><div class="field"><label><span>显示缩放</span><b id="zoomText">100%</b></label><input id="zoomRange" class="range" type="range" min="45" max="220" step="5" value="100"></div><div class="row between"><span class="muted">自动保持原图比例</span><button id="rebuildBtn" class="btn ghost">重新生成</button></div></section>
<section class="panel card"><div class="row between"><h3>颜色盘</h3><span id="selectedHex" class="muted">未选择</span></div><div id="palette" class="palette"></div></section>
<section class="panel card"><div class="row between"><h3>完成进度</h3><b id="progressText">0%</b></div><div class="progress-track"><div id="progressFill" class="progress-fill"></div></div><div class="stats"><div class="stat"><b id="placedCount">0</b><span>已拼</span></div><div class="stat"><b id="totalCount">0</b><span>总豆数</span></div><div class="stat"><b id="remainCount">0</b><span>剩余</span></div></div></section>
<section class="panel card legend"><b>小技巧</b><br>照图拼模式下，选一个颜色后，对应目标格会更醒目；点中正确位置就会打上完成标记。长按拖动也可以连续拼。所有数据默认保存在本机。</section>
</aside></main></div><div id="toast" class="toast"></div>`;

const ids=['imageInput','saveBtn','exportBtn','gridCanvas','canvasWrap','emptyState','gridWidth','widthText','colorCount','colorText','zoomRange','zoomText','rebuildBtn','palette','selectedHex','progressText','progressFill','placedCount','totalCount','remainCount','penTool','pickTool','eraseTool','undoBtn','redoBtn','resetBtn','toast'];
const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
const ctx=el.gridCanvas.getContext('2d',{alpha:false});
const state={sourceDataUrl:null,sourceImage:null,cols:52,rows:52,maxColors:16,target:[],work:[],placed:[],palette:[],selected:null,mode:'follow',tool:'pen',zoom:1,baseCell:12,history:[],future:[],pointerDown:false,lastCell:-1};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex=(r,g,b)=>'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const dist2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
const textColor=h=>{const [r,g,b]=rgb(h);return(r*299+g*587+b*114)/1000>150?'#3f3540':'#fff'};
function toast(msg){el.toast.textContent=msg;el.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.toast.classList.remove('show'),1300)}
function snapshot(){state.history.push({work:[...state.work],placed:[...state.placed],selected:state.selected});if(state.history.length>80)state.history.shift();state.future=[]}
function restore(s){if(!s)return;state.work=[...s.work];state.placed=[...s.placed];state.selected=s.selected;renderAll()}
function undo(){if(!state.history.length)return;state.future.push({work:[...state.work],placed:[...state.placed],selected:state.selected});restore(state.history.pop())}
function redo(){if(!state.future.length)return;state.history.push({work:[...state.work],placed:[...state.placed],selected:state.selected});restore(state.future.pop())}

function quantize(data,k){
 const pts=[],stride=Math.max(1,Math.floor((data.length/4)/7000));
 for(let i=0;i<data.length;i+=4*stride){if(data[i+3]<40)continue;pts.push([data[i],data[i+1],data[i+2]])}
 if(!pts.length)return['#FFFFFF'];
 let centers=[];for(let i=0;i<k;i++)centers.push([...pts[Math.floor(i*(pts.length-1)/Math.max(1,k-1))]]);
 for(let it=0;it<7;it++){const sums=Array.from({length:k},()=>[0,0,0,0]);for(const p of pts){let best=0,bd=Infinity;for(let c=0;c<centers.length;c++){const d=dist2(p,centers[c]);if(d<bd){bd=d;best=c}}const s=sums[best];s[0]+=p[0];s[1]+=p[1];s[2]+=p[2];s[3]++}centers=centers.map((c,i)=>sums[i][3]?[sums[i][0]/sums[i][3],sums[i][1]/sums[i][3],sums[i][2]/sums[i][3]]:c)}
 return[...new Set(centers.map(c=>hex(...c)))];
}
function nearestHex(r,g,b,pal){const p=[r,g,b];let best=pal[0],bd=Infinity;for(const h of pal){const d=dist2(p,rgb(h));if(d<bd){bd=d;best=h}}return best}
function loadImage(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{state.sourceDataUrl=reader.result;const img=new Image();img.onload=()=>{state.sourceImage=img;buildPattern()};img.src=reader.result};reader.readAsDataURL(file)}
function buildPattern(){
 const img=state.sourceImage;if(!img)return toast('请先上传图片');
 state.cols=Number(el.gridWidth.value);state.maxColors=Number(el.colorCount.value);state.rows=clamp(Math.round(state.cols*img.naturalHeight/img.naturalWidth),8,140);
 const c=document.createElement('canvas');c.width=state.cols;c.height=state.rows;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.drawImage(img,0,0,c.width,c.height);
 const image=x.getImageData(0,0,c.width,c.height),pal=quantize(image.data,state.maxColors),target=[];
 for(let i=0;i<image.data.length;i+=4){if(image.data[i+3]<35){target.push(null);continue}target.push(nearestHex(image.data[i],image.data[i+1],image.data[i+2],pal))}
 const counts=new Map();target.forEach(h=>h&&counts.set(h,(counts.get(h)||0)+1));
 state.palette=[...counts.keys()].sort((a,b)=>counts.get(b)-counts.get(a));state.target=target;state.work=[...target];state.placed=target.map(h=>!h);state.selected=state.palette[0]||null;state.history=[];state.future=[];
 el.emptyState.hidden=true;el.canvasWrap.hidden=false;saveProject(false);renderAll();toast(`已生成 ${state.cols}×${state.rows} 图纸`);
}
const cellSize=()=>Math.max(5,Math.round(state.baseCell*state.zoom));
function renderCanvas(){
 if(!state.target.length)return;const cell=cellSize(),dpr=Math.min(window.devicePixelRatio||1,2),cssW=state.cols*cell,cssH=state.rows*cell;
 el.gridCanvas.width=Math.round(cssW*dpr);el.gridCanvas.height=Math.round(cssH*dpr);el.gridCanvas.style.width=cssW+'px';el.gridCanvas.style.height=cssH+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff';ctx.fillRect(0,0,cssW,cssH);
 for(let y=0;y<state.rows;y++)for(let x=0;x<state.cols;x++){const i=y*state.cols+x,t=state.target[i],w=state.work[i],h=state.mode==='draw'?w:t;ctx.fillStyle=h||'#fff';ctx.fillRect(x*cell,y*cell,cell,cell);
  if(state.mode==='follow'&&state.selected&&t&&t!==state.selected&&!state.placed[i]){ctx.fillStyle='rgba(255,255,255,.62)';ctx.fillRect(x*cell,y*cell,cell,cell)}
  if(state.mode==='follow'&&state.placed[i]&&t&&cell>=9){ctx.strokeStyle=textColor(t);ctx.globalAlpha=.65;ctx.lineWidth=Math.max(1,cell*.08);ctx.beginPath();ctx.moveTo(x*cell+cell*.28,y*cell+cell*.53);ctx.lineTo(x*cell+cell*.45,y*cell+cell*.70);ctx.lineTo(x*cell+cell*.75,y*cell+cell*.30);ctx.stroke();ctx.globalAlpha=1}
  ctx.strokeStyle=cell>=10?'rgba(70,55,65,.20)':'rgba(70,55,65,.11)';ctx.lineWidth=.55;ctx.strokeRect(x*cell+.25,y*cell+.25,cell-.5,cell-.5)}
 if(cell>=18){ctx.font=`${Math.max(8,Math.floor(cell*.34))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';for(let y=0;y<state.rows;y++)for(let x=0;x<state.cols;x++){const i=y*state.cols+x,h=state.mode==='draw'?state.work[i]:state.target[i];if(!h)continue;ctx.fillStyle=textColor(h);ctx.globalAlpha=.58;ctx.fillText(String((state.palette.indexOf(h)+1)||''),x*cell+cell/2,y*cell+cell/2);ctx.globalAlpha=1}}
}
function renderPalette(){
 const counts=new Map(),done=new Map();state.target.forEach((h,i)=>{if(!h)return;counts.set(h,(counts.get(h)||0)+1);if(state.placed[i])done.set(h,(done.get(h)||0)+1)});el.palette.innerHTML='';
 state.palette.forEach((h,idx)=>{const b=document.createElement('button');b.className='swatch'+(state.selected===h?' selected':'');b.style.background=h;b.title=`${idx+1}. ${h}`;b.innerHTML=`<span class="check" style="color:${textColor(h)}">${idx+1}</span><span class="count">${done.get(h)||0}/${counts.get(h)||0}</span>`;b.onclick=()=>{state.selected=h;state.tool='pen';renderAll()};el.palette.appendChild(b)});el.selectedHex.textContent=state.selected||'未选择';
}
function renderStats(){const total=state.target.filter(Boolean).length,placed=state.target.reduce((n,h,i)=>n+(h&&state.placed[i]?1:0),0),pct=total?Math.round(placed/total*100):0;el.progressText.textContent=pct+'%';el.progressFill.style.width=pct+'%';el.placedCount.textContent=placed;el.totalCount.textContent=total;el.remainCount.textContent=total-placed}
function renderTools(){['pen','pick','erase'].forEach(t=>({pen:el.penTool,pick:el.pickTool,erase:el.eraseTool}[t].classList.toggle('active',state.tool===t)));document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode))}
function renderAll(){renderCanvas();renderPalette();renderStats();renderTools()}
function eventCell(ev){const r=el.gridCanvas.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/r.width*state.cols),y=Math.floor((ev.clientY-r.top)/r.height*state.rows);return x<0||y<0||x>=state.cols||y>=state.rows?-1:y*state.cols+x}
function applyCell(i,record=true){
 if(i<0||i===state.lastCell)return;state.lastCell=i;const target=state.target[i];
 if(state.tool==='pick'){const h=state.mode==='draw'?state.work[i]:target;if(h){state.selected=h;state.tool='pen';renderAll();toast('已取色 '+h)}return}
 if(record)snapshot();
 if(state.mode==='follow'){if(!target)return;if(state.tool==='erase')state.placed[i]=false;else if(state.selected===target)state.placed[i]=true;else{return toast('这个格子不是当前颜色')}}
 else{if(state.tool==='erase')state.work[i]=null;else if(state.selected)state.work[i]=state.selected}
 renderAll();
}
el.gridCanvas.addEventListener('pointerdown',e=>{state.pointerDown=true;state.lastCell=-1;el.gridCanvas.setPointerCapture?.(e.pointerId);applyCell(eventCell(e),true)});
el.gridCanvas.addEventListener('pointermove',e=>{if(!state.pointerDown||state.tool==='pick')return;applyCell(eventCell(e),true)});
window.addEventListener('pointerup',()=>{state.pointerDown=false;state.lastCell=-1;saveProject(false)});
function saveProject(show=true){if(!state.target.length)return;const p={v:1,sourceDataUrl:state.sourceDataUrl,cols:state.cols,rows:state.rows,maxColors:state.maxColors,target:state.target,work:state.work,placed:state.placed,palette:state.palette,selected:state.selected,mode:state.mode};try{localStorage.setItem('lr-pindou-project',JSON.stringify(p));if(show)toast('已保存到本机')}catch{if(show)toast('保存失败：存储空间不足')}}
function loadSaved(){try{const raw=localStorage.getItem('lr-pindou-project');if(!raw)return;const p=JSON.parse(raw);Object.assign(state,{...p,history:[],future:[]});el.gridWidth.value=state.cols;el.widthText.textContent=state.cols;el.colorCount.value=state.maxColors;el.colorText.textContent=state.maxColors;el.emptyState.hidden=true;el.canvasWrap.hidden=false;if(p.sourceDataUrl){const img=new Image();img.onload=()=>state.sourceImage=img;img.src=p.sourceDataUrl}renderAll()}catch{}}
function exportPng(){
 if(!state.target.length)return toast('请先上传图片');const cell=24,margin=70,footer=150,out=document.createElement('canvas');out.width=state.cols*cell+margin*2;out.height=state.rows*cell+margin*2+footer;const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,out.width,out.height);o.fillStyle='#3f3340';o.font='bold 30px system-ui';o.fillText('LR拼豆图纸',margin,42);o.font='18px system-ui';o.fillStyle='#7a6874';o.fillText(`${state.cols} × ${state.rows} · ${state.palette.length} 色`,margin,68);
 for(let y=0;y<state.rows;y++)for(let x=0;x<state.cols;x++){const i=y*state.cols+x,h=state.target[i];if(!h)continue;const px=margin+x*cell,py=margin+y*cell;o.fillStyle=h;o.fillRect(px,py,cell,cell);o.strokeStyle='rgba(40,30,40,.18)';o.strokeRect(px+.5,py+.5,cell-1,cell-1);o.fillStyle=textColor(h);o.globalAlpha=.7;o.font='10px system-ui';o.textAlign='center';o.textBaseline='middle';o.fillText(String(state.palette.indexOf(h)+1),px+cell/2,py+cell/2);o.globalAlpha=1}
 o.textAlign='left';o.textBaseline='alphabetic';let xx=margin,yy=margin+state.rows*cell+40;state.palette.forEach((h,i)=>{o.fillStyle=h;o.fillRect(xx,yy,20,20);o.strokeStyle='rgba(0,0,0,.18)';o.strokeRect(xx+.5,yy+.5,19,19);o.fillStyle='#4a3b45';o.font='14px system-ui';o.fillText(`${i+1} ${h}`,xx+26,yy+16);xx+=110;if(xx+100>out.width-margin){xx=margin;yy+=30}});
 const a=document.createElement('a');a.download=`LR拼豆_${state.cols}x${state.rows}.png`;a.href=out.toDataURL('image/png');a.click();toast('图纸已导出');
}
el.imageInput.addEventListener('change',e=>loadImage(e.target.files?.[0]));el.gridWidth.oninput=()=>el.widthText.textContent=el.gridWidth.value;el.colorCount.oninput=()=>el.colorText.textContent=el.colorCount.value;el.zoomRange.oninput=()=>{state.zoom=Number(el.zoomRange.value)/100;el.zoomText.textContent=el.zoomRange.value+'%';renderCanvas()};el.rebuildBtn.onclick=buildPattern;el.saveBtn.onclick=()=>saveProject(true);el.exportBtn.onclick=exportPng;el.undoBtn.onclick=undo;el.redoBtn.onclick=redo;el.penTool.onclick=()=>{state.tool='pen';renderTools()};el.pickTool.onclick=()=>{state.tool='pick';renderTools()};el.eraseTool.onclick=()=>{state.tool='erase';renderTools()};el.resetBtn.onclick=()=>{if(!state.target.length)return;snapshot();if(state.mode==='follow')state.placed=state.target.map(h=>!h);else state.work=[...state.target];renderAll();saveProject(false);toast('已重置')};document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;renderAll();saveProject(false)});window.addEventListener('resize',renderCanvas);loadSaved();
