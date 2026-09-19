import './style.css';

const PALETTE = [
['奶白','#F7F4EA'],['白','#FFFFFF'],['浅灰','#D9D9D9'],['灰','#9E9E9E'],['深灰','#5E5E5E'],['黑','#202124'],
['樱粉','#F8BBD0'],['粉','#F48FB1'],['玫红','#E91E63'],['红','#E53935'],['砖红','#B84A42'],['橙红','#FF7043'],
['橙','#FB8C00'],['浅橙','#FFCC80'],['黄','#FDD835'],['奶黄','#FFF3B0'],['柠檬黄','#FFF176'],
['浅绿','#C5E1A5'],['绿','#66BB6A'],['墨绿','#2E7D32'],['薄荷','#A5D6A7'],['青','#4DB6AC'],
['浅蓝','#90CAF9'],['天蓝','#42A5F5'],['蓝','#1E88E5'],['深蓝','#283593'],['藏蓝','#1A237E'],
['浅紫','#CE93D8'],['紫','#8E24AA'],['深紫','#5E35B1'],['薰衣草','#B39DDB'],
['棕','#8D6E63'],['浅棕','#BCAAA4'],['咖啡','#5D4037'],['肤色','#F3C6A5'],['蜜桃','#F6B38A']
];

const state = {
  cols: 40, rows: 40, cells: [], source: null, selected: PALETTE[9][1],
  tool: 'paint', history: [], redo: [], projectName: '我的拼豆',
};

const app = document.querySelector('#app');
app.innerHTML = `
<header class="topbar">
  <div>
    <div class="brand">LR 拼豆</div>
    <div class="sub">把喜欢的照片，一颗一颗拼出来 ✦</div>
  </div>
  <button class="ghost" id="saveBtn">保存</button>
</header>

<main class="layout">
  <section class="panel controls">
    <label class="upload">
      <input id="fileInput" type="file" accept="image/*" />
      <span>＋ 上传图片</span>
      <small>照片 / 动漫图 / 拼豆参考图</small>
    </label>

    <div class="row2">
      <label>宽度<input id="colsInput" type="number" min="8" max="104" value="40"></label>
      <label>高度<input id="rowsInput" type="number" min="8" max="104" value="40"></label>
    </div>

    <button class="primary" id="generateBtn">生成拼豆网格</button>

    <div class="toolrow">
      <button class="tool active" data-tool="paint">✎ 上色</button>
      <button class="tool" data-tool="picker">◉ 吸管</button>
      <button class="tool" data-tool="erase">⌫ 橡皮</button>
    </div>
    <div class="toolrow">
      <button class="tool" id="undoBtn">↶ 撤销</button>
      <button class="tool" id="redoBtn">↷ 重做</button>
      <button class="tool" id="clearBtn">清空</button>
    </div>

    <label class="range">参考图透明度
      <input id="opacityInput" type="range" min="0" max="100" value="32">
    </label>

    <h3>颜色</h3>
    <div id="palette" class="palette"></div>
  </section>

  <section class="workspace">
    <div class="workspaceHead">
      <div>
        <input id="nameInput" value="我的拼豆" />
        <span id="sizeText">40 × 40</span>
      </div>
      <div class="actions">
        <button class="ghost" id="exportBtn">导出 PNG</button>
      </div>
    </div>
    <div id="stage" class="stage">
      <div class="hint" id="hint">先上传一张图片，然后点「生成拼豆网格」</div>
      <div class="boardWrap" id="boardWrap">
        <img id="reference" alt="" />
        <div id="board" class="board"></div>
      </div>
    </div>
  </section>

  <aside class="panel stats">
    <h3>材料统计</h3>
    <div id="total" class="big">0 颗</div>
    <div id="statsList" class="statsList"><div class="muted">开始拼以后这里会统计颜色数量</div></div>
    <button class="ghost full" id="copyStatsBtn">复制清单</button>
  </aside>
</main>
`;

const $ = s => document.querySelector(s);
const board = $('#board'), reference = $('#reference'), hint = $('#hint');
const hexToRgb = hex => {
  const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255];
};
const dist=(a,b)=>Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2)+Math.pow(a[2]-b[2],2);
function nearest(rgb){ let best=PALETTE[0],d=1e9; for(const p of PALETTE){const nd=dist(rgb,hexToRgb(p[1])); if(nd<d){d=nd;best=p;}} return best[1]; }

function renderPalette(){
  $('#palette').innerHTML = PALETTE.map(([n,c])=>`<button class="swatch ${c===state.selected?'selected':''}" data-color="${c}" title="${n}">
    <i style="background:${c}"></i><span>${n}</span>
  </button>`).join('');
  document.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>{state.selected=b.dataset.color;state.tool='paint';syncTools();renderPalette();});
}
function syncTools(){ document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===state.tool)); }
function snapshot(){ state.history.push([...state.cells]); if(state.history.length>50) state.history.shift(); state.redo=[]; }
function applyCell(i,color){
  if(i<0||i>=state.cells.length) return;
  state.cells[i]=color;
  const el=board.children[i];
  el.style.background=color||'transparent';
  el.classList.toggle('empty',!color);
}
function renderBoard(){
  board.style.gridTemplateColumns=`repeat(${state.cols},1fr)`;
  board.innerHTML = state.cells.map((c,i)=>`<button class="cell ${c?'':'empty'}" data-i="${i}" style="background:${c||'transparent'}"></button>`).join('');
  $('#sizeText').textContent=`${state.cols} × ${state.rows}`;
  hint.hidden=true; $('#boardWrap').classList.add('show');
  updateStats();
}
let dragging=false, changedInDrag=false;
board.addEventListener('pointerdown',e=>{ const c=e.target.closest('.cell'); if(!c)return; dragging=true;changedInDrag=false; board.setPointerCapture?.(e.pointerId); handleCell(c);});
board.addEventListener('pointermove',e=>{ if(!dragging)return; const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell'); if(el&&board.contains(el)) handleCell(el);});
window.addEventListener('pointerup',()=>dragging=false);
function handleCell(el){
  const i=+el.dataset.i, old=state.cells[i];
  if(state.tool==='picker'){ if(old){state.selected=old;state.tool='paint';renderPalette();syncTools();} return; }
  const next=state.tool==='erase'?null:state.selected;
  if(old===next)return;
  if(!changedInDrag){snapshot();changedInDrag=true;}
  applyCell(i,next); updateStats();
}

$('#fileInput').onchange=e=>{
  const f=e.target.files?.[0]; if(!f)return;
  const url=URL.createObjectURL(f); state.source=url; reference.src=url; hint.textContent='图片已载入，设置尺寸后生成网格';
};
$('#generateBtn').onclick=async()=>{
  if(!state.source){alert('先上传图片哦');return;}
  state.cols=Math.max(8,Math.min(104,+$('#colsInput').value||40));
  state.rows=Math.max(8,Math.min(104,+$('#rowsInput').value||40));
  const img=new Image(); img.src=state.source; await img.decode();
  const cv=document.createElement('canvas'); cv.width=state.cols;cv.height=state.rows;
  const ctx=cv.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,state.cols,state.rows);
  const data=ctx.getImageData(0,0,state.cols,state.rows).data;
  state.cells=[];
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<40){state.cells.push(null);continue;}
    state.cells.push(nearest([data[i],data[i+1],data[i+2]]));
  }
  state.history=[];state.redo=[]; renderBoard();
};
$('#opacityInput').oninput=e=>reference.style.opacity=(+e.target.value/100);
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{state.tool=b.dataset.tool;syncTools();});
$('#undoBtn').onclick=()=>{if(!state.history.length)return;state.redo.push([...state.cells]);state.cells=state.history.pop();renderBoard();};
$('#redoBtn').onclick=()=>{if(!state.redo.length)return;state.history.push([...state.cells]);state.cells=state.redo.pop();renderBoard();};
$('#clearBtn').onclick=()=>{if(!state.cells.length)return;snapshot();state.cells=state.cells.map(()=>null);renderBoard();};

function updateStats(){
  const counts={}; let total=0;
  state.cells.forEach(c=>{if(c){counts[c]=(counts[c]||0)+1;total++;}});
  $('#total').textContent=`${total} 颗`;
  const items=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  $('#statsList').innerHTML=items.length?items.map(([c,n])=>{
    const name=PALETTE.find(p=>p[1]===c)?.[0]||c;
    return `<div class="stat"><i style="background:${c}"></i><span>${name}</span><b>${n}</b></div>`;
  }).join(''):'<div class="muted">开始拼以后这里会统计颜色数量</div>';
}
function save(){
  const data={cols:state.cols,rows:state.rows,cells:state.cells,name:$('#nameInput').value,source:state.source};
  localStorage.setItem('lr-pindou-project',JSON.stringify(data)); alert('已保存到本机');
}
$('#saveBtn').onclick=save;
window.addEventListener('load',()=>{
  try{const d=JSON.parse(localStorage.getItem('lr-pindou-project'));if(d?.cells){state.cols=d.cols;state.rows=d.rows;state.cells=d.cells;$('#colsInput').value=d.cols;$('#rowsInput').value=d.rows;$('#nameInput').value=d.name||'我的拼豆';renderBoard();}}catch{}
});
$('#copyStatsBtn').onclick=async()=>{
  const counts={};state.cells.forEach(c=>{if(c)counts[c]=(counts[c]||0)+1;});
  const txt=Object.entries(counts).map(([c,n])=>`${PALETTE.find(p=>p[1]===c)?.[0]||c}：${n}颗`).join('\n');
  await navigator.clipboard.writeText(txt||'暂无'); alert('清单已复制');
};
$('#exportBtn').onclick=()=>{
  if(!state.cells.length)return;
  const cell=28, cv=document.createElement('canvas');cv.width=state.cols*cell;cv.height=state.rows*cell;
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  state.cells.forEach((c,i)=>{const x=i%state.cols,y=Math.floor(i/state.cols);ctx.fillStyle=c||'#fff';ctx.fillRect(x*cell,y*cell,cell,cell);ctx.strokeStyle='rgba(0,0,0,.18)';ctx.strokeRect(x*cell,y*cell,cell,cell);if(c){ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(x*cell+cell*.37,y*cell+cell*.35,cell*.13,0,Math.PI*2);ctx.fill();}});
  const a=document.createElement('a');a.download=(($('#nameInput').value||'LR拼豆')+'.png');a.href=cv.toDataURL('image/png');a.click();
};
renderPalette(); syncTools(); updateStats();
