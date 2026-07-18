import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { add, all, dashboard, exportAll, get, importAll, logActivity, put, remove, reviewWord, upsertWords } from './db.js'
import { analyzeVideo, downloadBlob, exportLecture, ocrPages } from './video.js'

registerSW({ immediate: true })

const today = () => new Date().toISOString().slice(0, 10)
const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const state = {
  page: 'dashboard', lectureFile: null, lecturePages: [], reviewWords: [], reviewIndex: 0,
  reading: null, readingStarted: 0, mindmap: null, selectedNode: null, pdfUrl: null
}

document.querySelector('#app').innerHTML = `
<div class="shell">
  <aside class="sidebar">
    <div class="brand">LR <small>TABLET</small></div>
    <nav class="nav">
      ${[
        ['dashboard','▦','总览'],['lecture','▶','视频讲义'],['planner','✓','计划打卡'],['mindmap','◇','思维导图'],
        ['pdf','▤','PDF'],['words','A','背单词'],['reading','R','英语阅读'],['cloud','↗','网盘'],['settings','⚙','设置']
      ].map(([key, icon, text]) => `<button data-page="${key}">${icon}　${text}</button>`).join('')}
    </nav>
    <div class="side-foot">荣耀平板横屏优化<br><b id="side-streak">连续打卡 0 天</b></div>
  </aside>
  <main class="main">
    <header class="topbar"><span id="status">准备就绪</span><span id="clock"></span></header>
    <div class="content">
      <section class="page" id="page-dashboard"></section>
      <section class="page" id="page-lecture"></section>
      <section class="page" id="page-planner"></section>
      <section class="page" id="page-mindmap"></section>
      <section class="page" id="page-pdf"></section>
      <section class="page" id="page-words"></section>
      <section class="page" id="page-reading"></section>
      <section class="page" id="page-cloud"></section>
      <section class="page" id="page-settings"></section>
    </div>
  </main>
</div>
<div class="toast" id="toast"></div>
<div class="modal" id="modal"><div class="modal-box" id="modal-box"></div></div>`

function head(title, subtitle) {
  return `<div class="page-head"><h1>${title}</h1><p>${subtitle}</p></div>`
}

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600)
}

function setStatus(message) {
  $('#status').textContent = message
}

function modal(html) {
  $('#modal-box').innerHTML = html
  $('#modal').classList.add('show')
}
function closeModal() { $('#modal').classList.remove('show') }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal() })

async function showPage(key) {
  state.page = key
  $$('.page').forEach(p => p.classList.remove('active'))
  $(`#page-${key}`).classList.add('active')
  $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.page === key))
  const render = { dashboard: renderDashboard, lecture: renderLecture, planner: renderPlanner, mindmap: renderMindmap, pdf: renderPdf, words: renderWords, reading: renderReading, cloud: renderCloud, settings: renderSettings }[key]
  await render()
  setStatus($(`.nav button[data-page="${key}"]`).textContent.trim())
}

$$('.nav button').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)))

async function renderDashboard() {
  const stats = await dashboard()
  $('#side-streak').textContent = `连续打卡 ${stats.streak} 天`
  const activities = (await all('activities')).sort((a,b) => b.id-a.id).slice(0,7)
  $('#page-dashboard').innerHTML = `${head('学习总览','所有内容都保存在这台平板本地，可导出 LR 数据文件与电脑互传。')}
  <div class="grid stats">
    <div class="card stat"><span class="muted">今日任务</span><b>${stats.done} / ${stats.total}</b><span class="muted">已完成 / 总任务</span></div>
    <div class="card stat"><span class="muted">完成率</span><b>${stats.total ? Math.round(stats.done/stats.total*100) : 0}%</b><span class="muted">今日推进</span></div>
    <div class="card stat"><span class="muted">连续打卡</span><b>${stats.streak} 天</b><span class="muted">保持节奏</span></div>
    <div class="card stat"><span class="muted">待复习单词</span><b>${stats.dueWords}</b><span class="muted">今天到期</span></div>
  </div>
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h2>快速开始</h2><div class="grid three">
      ${[['lecture','视频生成讲义'],['planner','添加今日任务'],['words','开始背单词'],['reading','练英语阅读'],['pdf','查看 PDF'],['mindmap','绘制思维导图']].map(x=>`<button class="btn" data-go="${x[0]}">${x[1]}</button>`).join('')}
    </div></div>
    <div class="card"><h2>最近记录</h2>${activities.length ? activities.map(a=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(a.title)}</b><div class="muted">${esc(a.detail)} · ${new Date(a.createdAt).toLocaleString()}</div></div>`).join('') : '<p class="muted">还没有记录。</p>'}</div>
  </div>`
  $$('[data-go]').forEach(b => b.onclick = () => showPage(b.dataset.go))
}

async function renderLecture() {
  $('#page-lecture').innerHTML = `${head('视频智能生成讲义','在平板本地分析换页和稳定画面，不会机械地按时间把每一帧塞进讲义。')}
  <div class="grid two">
    <div class="card">
      <div class="drop"><input id="lecture-file" type="file" accept="video/mp4,video/webm,video/*"><p class="muted">推荐 MP4/H.264；文件只在本机处理，不上传。</p></div>
      <video id="lecture-video" class="video-preview" controls playsinline></video>
      <div class="progress" style="margin:12px 0"><i id="lecture-progress"></i></div><div id="lecture-progress-text" class="muted">等待选择视频</div>
      <div class="thumbs" id="lecture-thumbs" style="margin-top:12px"></div>
      <div class="log" id="lecture-log" style="margin-top:12px">LR Tablet ready.</div>
    </div>
    <div class="card">
      <h2>处理与导出</h2>
      <div class="field"><label>画面分析频率（秒）</label><input id="lecture-interval" type="number" min="0.25" max="15" step="0.25" value="1"></div>
      <div class="field"><label>换页阈值（漏页调低，重复调高）</label><input id="lecture-threshold" type="number" min="5" max="40" step="1" value="12"></div>
      <label class="option"><input id="lecture-remove" type="checkbox"> 尝试去除彩色笔迹（可能影响彩色印刷内容）</label>
      <label class="option"><input id="lecture-ocr" type="checkbox"> 中英文 OCR 文字识别（首次需联网下载模型）</label>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <label class="option"><input id="lecture-word" type="checkbox" checked> 导出 Word</label>
      <label class="option"><input id="lecture-pdf" type="checkbox" checked> 导出 PDF</label>
      <label class="option"><input id="lecture-zip" type="checkbox" checked> 打包为 ZIP</label>
      <label class="option"><input id="lecture-images" type="checkbox" checked> 文档中保留课件页</label>
      <div class="toolbar" style="margin-top:14px"><button class="btn primary" id="lecture-run">开始智能生成</button><button class="btn" id="lecture-export" disabled>重新导出</button></div>
      <p class="muted">处理缓存只存在于当前页面内；导出完成或刷新页面后自动释放，不会在平板相册留下散乱截图。</p>
    </div>
  </div>`
  const input = $('#lecture-file'), video = $('#lecture-video')
  input.onchange = () => {
    state.lectureFile = input.files[0]
    if (state.lectureFile) { video.src = URL.createObjectURL(state.lectureFile); setStatus(state.lectureFile.name) }
  }
  const hooks = {
    video,
    log: text => { const el=$('#lecture-log'); el.textContent += `\n${text}`; el.scrollTop=el.scrollHeight },
    progress: (value, text) => { $('#lecture-progress').style.width=`${Math.round(value*100)}%`; $('#lecture-progress-text').textContent=text },
    page: page => {
      const url = URL.createObjectURL(page.blob)
      const item = document.createElement('div'); item.className = 'thumb'
      const image = document.createElement('img'); image.src = url; image.onload = () => URL.revokeObjectURL(url)
      const label = document.createElement('span'); label.textContent = `${page.number} · ${Math.floor(page.time/60)}:${String(Math.round(page.time)%60).padStart(2,'0')}`
      item.append(image, label); $('#lecture-thumbs').append(item)
    }
  }
  $('#lecture-run').onclick = async () => {
    if (!state.lectureFile) return toast('请先选择视频')
    const button=$('#lecture-run'); button.disabled=true; $('#lecture-thumbs').innerHTML=''; $('#lecture-log').textContent='LR Tablet processing...'
    try {
      state.lecturePages = await analyzeVideo(state.lectureFile,{interval:$('#lecture-interval').value,threshold:$('#lecture-threshold').value,removeColor:$('#lecture-remove').checked},hooks)
      if ($('#lecture-ocr').checked) await ocrPages(state.lecturePages,hooks)
      await doLectureExport(hooks)
      $('#lecture-export').disabled=false
      await logActivity('lecture','生成视频讲义',`${state.lecturePages.length} 页`)
      toast(`生成完成：${state.lecturePages.length} 页`)
    } catch(error) { console.error(error); hooks.log(`错误：${error.message}`); toast(error.message) }
    finally { button.disabled=false }
  }
  $('#lecture-export').onclick = () => doLectureExport(hooks)
}

async function doLectureExport(hooks) {
  if (!state.lecturePages.length) return
  await exportLecture(state.lectureFile.name,state.lecturePages,{word:$('#lecture-word').checked,pdf:$('#lecture-pdf').checked,zip:$('#lecture-zip').checked,includeImages:$('#lecture-images').checked},hooks)
}

async function renderPlanner() {
  const tasks = (await all('tasks')).filter(t=>t.date===today()).sort((a,b)=>(a.completed-b.completed)||(a.start||'99').localeCompare(b.start||'99'))
  const checks = await all('checkins'); const check = checks.find(c=>c.date===today())
  $('#page-planner').innerHTML = `${head('学习计划与每日打卡','触控勾选即可完成任务，关闭应用后数据仍在。')}
  <div class="grid two">
    <div class="card"><div class="toolbar"><h2 style="margin:0">今日任务</h2><button class="btn primary" id="task-add">添加任务</button></div>
      <div class="table-wrap"><table><thead><tr><th>完成</th><th>时间</th><th>科目</th><th>任务</th><th></th></tr></thead><tbody>${tasks.map(t=>`<tr><td><input class="check task-toggle" data-id="${t.id}" type="checkbox" ${t.completed?'checked':''}></td><td>${esc(t.start||'-')}–${esc(t.end||'')}</td><td>${esc(t.subject)}</td><td style="${t.completed?'text-decoration:line-through;color:var(--muted)':''}">${esc(t.title)}</td><td><button class="btn danger task-delete" data-id="${t.id}">删除</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">今天还没有任务。</td></tr>'}</tbody></table></div>
    </div>
    <div class="card"><h2>今日打卡</h2><div class="field"><label>学习时长（分钟）</label><input id="check-minutes" type="number" value="${check?.minutes??180}"></div><div class="field"><label>状态（1～5）</label><input id="check-mood" type="number" min="1" max="5" value="${check?.mood??3}"></div><div class="field"><label>总结</label><textarea id="check-summary" rows="6">${esc(check?.summary||'')}</textarea></div><button class="btn primary" id="check-save">完成今日打卡</button></div>
  </div>`
  $('#task-add').onclick = () => modal(`<h2>添加今日任务</h2><div class="field"><label>任务</label><input id="m-title"></div><div class="field"><label>科目</label><input id="m-subject" value="数学"></div><div class="grid two"><div class="field"><label>开始</label><input id="m-start" type="time" value="08:00"></div><div class="field"><label>结束</label><input id="m-end" type="time" value="09:30"></div></div><div class="toolbar"><button class="btn primary" id="m-save">保存</button><button class="btn" id="m-cancel">取消</button></div>`)
  document.addEventListener('click', async function saveTask(e){
    if(e.target.id==='m-cancel') closeModal()
    if(e.target.id==='m-save') { const title=$('#m-title').value.trim(); if(!title)return toast('请输入任务'); await add('tasks',{date:today(),title,subject:$('#m-subject').value,start:$('#m-start').value,end:$('#m-end').value,completed:false,createdAt:new Date().toISOString()}); await logActivity('plan','添加学习任务',title); closeModal(); document.removeEventListener('click',saveTask); renderPlanner() }
  })
  $$('.task-toggle').forEach(x=>x.onchange=async()=>{const t=await get('tasks',Number(x.dataset.id));await put('tasks',{...t,completed:x.checked});renderPlanner()})
  $$('.task-delete').forEach(x=>x.onclick=async()=>{await remove('tasks',Number(x.dataset.id));renderPlanner()})
  $('#check-save').onclick=async()=>{if(check)await put('checkins',{...check,minutes:Number($('#check-minutes').value),mood:Number($('#check-mood').value),summary:$('#check-summary').value,checked:true});else await add('checkins',{date:today(),minutes:Number($('#check-minutes').value),mood:Number($('#check-mood').value),summary:$('#check-summary').value,checked:true});await logActivity('checkin','完成每日打卡',`${$('#check-minutes').value} 分钟`);toast('打卡完成');renderDashboard()}
}

async function renderWords() {
  const words=(await all('words')).sort((a,b)=>a.word.localeCompare(b.word)); const due=words.filter(w=>!w.due||w.due<=today())
  $('#page-words').innerHTML=`${head('本地单词本','导入 CSV/TXT，在平板上进行间隔复习。')}
  <div class="grid two"><div class="card"><div class="toolbar"><input id="word-file" type="file" accept=".csv,.txt"><button class="btn primary" id="word-import">导入</button><input id="word-search" placeholder="搜索单词" style="margin-left:auto;max-width:220px"></div><div class="table-wrap" style="max-height:65vh"><table><thead><tr><th>单词</th><th>释义</th><th>熟悉度</th><th>复习日期</th></tr></thead><tbody id="word-list">${wordRows(words)}</tbody></table></div></div>
  <div class="card flashcard"><div class="muted" id="review-progress">待复习 ${due.length}</div><div class="word" id="review-word">点击开始复习</div><div class="muted" id="review-phonetic"></div><div class="meaning" id="review-meaning"></div><div class="toolbar" style="justify-content:center"><button class="btn primary" id="review-start">开始复习</button><button class="btn" id="review-show">显示释义</button></div><div class="toolbar" style="justify-content:center"><button class="btn danger" id="review-no">忘记了</button><button class="btn success" id="review-yes">记得</button></div></div></div>`
  $('#word-search').oninput=e=>$('#word-list').innerHTML=wordRows(words.filter(w=>(w.word+' '+w.meaning).toLowerCase().includes(e.target.value.toLowerCase())))
  $('#word-import').onclick=async()=>{const file=$('#word-file').files[0];if(!file)return toast('请选择 CSV/TXT');const rows=parseWords(await file.text());const result=await upsertWords(rows);toast(`新增 ${result.added}，更新 ${result.updated}`);renderWords()}
  $('#review-start').onclick=()=>{state.reviewWords=due;state.reviewIndex=0;showReview()};$('#review-show').onclick=()=>showReview(true);$('#review-yes').onclick=()=>answerReview(true);$('#review-no').onclick=()=>answerReview(false)
}
function wordRows(words){return words.map(w=>`<tr><td><b>${esc(w.word)}</b><div class="muted">${esc(w.phonetic||'')}</div></td><td>${esc(w.meaning)}</td><td>${w.familiarity||0}/5</td><td>${esc(w.due||today())}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">尚未导入单词。</td></tr>'}
function parseWords(text){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);let rows=lines.map(x=>x.includes('\t')?x.split('\t'):x.split(','));if(/word|单词/i.test(rows[0]?.[0]))rows.shift();return rows.filter(x=>x[0]).map(x=>({word:x[0].trim(),meaning:(x[1]||'').trim(),phonetic:(x[2]||'').trim(),example:(x[3]||'').trim(),tags:(x[4]||'').trim()}))}
function showReview(reveal=false){const w=state.reviewWords[state.reviewIndex];if(!w){$('#review-word').textContent='今日复习完成';$('#review-meaning').textContent='';return}$('#review-progress').textContent=`${state.reviewIndex+1} / ${state.reviewWords.length}`;$('#review-word').textContent=w.word;$('#review-phonetic').textContent=w.phonetic||'';$('#review-meaning').textContent=reveal?(w.meaning||'未填写释义'):'先回忆，再显示释义'}
async function answerReview(remembered){const w=state.reviewWords[state.reviewIndex];if(!w)return;await reviewWord(w,remembered);state.reviewIndex++;showReview()}

async function renderReading() {
  const papers=(await all('readings')).sort((a,b)=>b.id-a.id)
  $('#page-reading').innerHTML=`${head('英语阅读训练','文章在左、问题和选项在右，适合荣耀平板横屏作答。')}<div class="toolbar"><input id="reading-file" type="file" accept=".json"><button class="btn primary" id="reading-import">导入阅读 JSON</button><select id="reading-select"><option value="">选择试卷</option>${papers.map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select><span class="badge" id="reading-timer">00:00</span></div><div class="reading-layout"><div class="card article" id="reading-article">请导入或选择一份阅读。</div><div class="card questions" id="reading-questions"></div></div>`
  $('#reading-import').onclick=async()=>{const file=$('#reading-file').files[0];if(!file)return toast('请选择 JSON');try{const data=JSON.parse(await file.text());if(!data.passage||!Array.isArray(data.questions))throw new Error('缺少 passage/questions');await add('readings',{title:data.title||file.name,passage:data.passage,questions:data.questions,createdAt:new Date().toISOString()});await logActivity('reading','导入英语阅读',data.title||file.name);renderReading();toast('导入成功')}catch(e){toast(`格式错误：${e.message}`)}}
  $('#reading-select').onchange=async e=>{state.reading=await get('readings',Number(e.target.value));state.readingStarted=Date.now();drawReading()}
}
function drawReading(){const p=state.reading;if(!p)return;$('#reading-article').textContent=p.passage;$('#reading-questions').innerHTML=p.questions.map((q,i)=>`<div class="question"><b>${q.number||i+1}. ${esc(q.question)}</b>${Object.entries(q.options||{}).map(([k,v])=>`<label class="option"><input type="radio" name="q${i}" value="${k}"> ${k}. ${esc(v)}</label>`).join('')}</div>`).join('')+`<button class="btn primary" id="reading-submit" style="width:100%;margin-top:14px">提交答案</button>`;$('#reading-submit').onclick=submitReading}
async function submitReading(){const p=state.reading;let correct=0,known=0;const answers={};p.questions.forEach((q,i)=>{const selected=$(`input[name="q${i}"]:checked`);answers[i]=selected?.value||'';if(q.answer){known++;if(answers[i]===String(q.answer).toUpperCase())correct++}});const duration=Math.round((Date.now()-state.readingStarted)/1000);await add('attempts',{readingId:p.id,answers,correct,total:known,duration,createdAt:new Date().toISOString()});await logActivity('reading','完成英语阅读',`${correct}/${known}`);toast(`得分 ${correct}/${known}，用时 ${Math.floor(duration/60)} 分 ${duration%60} 秒`)}

async function renderMindmap() {
  const maps=await all('mindmaps'); if(!state.mindmap)state.mindmap=maps[0]||{title:'考研知识框架',nodes:[{id:1,text:'中心主题',x:360,y:260,parent:null}]}
  $('#page-mindmap').innerHTML=`${head('思维导图','单指拖动节点，选中后添加子节点；导图自动保存到本地。')}<div class="toolbar"><select id="map-select"><option value="">当前：${esc(state.mindmap.title)}</option>${maps.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('')}</select><button class="btn" id="map-new">新建</button><button class="btn primary" id="map-save">保存</button><button class="btn" id="map-export">导出 SVG</button></div><div class="card mind-wrap"><svg class="mind-canvas" id="mind-svg" viewBox="0 0 1200 760"></svg><div class="card node-editor"><div class="field"><label>节点文字</label><input id="node-text"></div><button class="btn primary" id="node-add">添加子节点</button><button class="btn danger" id="node-delete">删除节点</button></div></div>`
  drawMindmap();$('#map-select').onchange=async e=>{if(e.target.value){state.mindmap=await get('mindmaps',Number(e.target.value));state.selectedNode=null;renderMindmap()}};$('#map-new').onclick=()=>{state.mindmap={title:'新建思维导图',nodes:[{id:1,text:'中心主题',x:360,y:260,parent:null}]};state.selectedNode=1;renderMindmap()};$('#map-save').onclick=saveMindmap;$('#map-export').onclick=exportMindmap;$('#node-add').onclick=addMindNode;$('#node-delete').onclick=deleteMindNode;$('#node-text').onchange=e=>{const n=state.mindmap.nodes.find(n=>n.id===state.selectedNode);if(n){n.text=e.target.value;drawMindmap()}}
}
function drawMindmap() {
  const svg = $('#mind-svg'), map = state.mindmap
  svg.innerHTML = map.nodes.filter(n => n.parent).map(n => {
    const parent = map.nodes.find(x => x.id === n.parent)
    return parent ? `<line x1="${parent.x}" y1="${parent.y}" x2="${n.x}" y2="${n.y}" stroke="#b8c2d6" stroke-width="3"/>` : ''
  }).join('') + map.nodes.map(n => `<g data-node="${n.id}" style="cursor:grab"><rect x="${n.x-78}" y="${n.y-25}" width="156" height="50" rx="10" fill="${n.parent?'#fff':'#5668f5'}" stroke="${n.id===state.selectedNode?'#e59a21':'#cbd4e4'}" stroke-width="${n.id===state.selectedNode?4:2}"/><text x="${n.x}" y="${n.y+5}" text-anchor="middle" font-size="15" font-family="sans-serif" fill="${n.parent?'#182235':'#fff'}">${esc(n.text)}</text></g>`).join('')
  $$('g[data-node]', svg).forEach(group => {
    group.onpointerdown = event => {
      event.preventDefault()
      state.selectedNode = Number(group.dataset.node)
      const node = map.nodes.find(x => x.id === state.selectedNode)
      $('#node-text').value = node.text
      const point = svg.createSVGPoint()
      point.x = event.clientX; point.y = event.clientY
      const start = point.matrixTransform(svg.getScreenCTM().inverse())
      const origin = { x: node.x, y: node.y }
      group.setPointerCapture(event.pointerId)
      group.onpointermove = move => {
        point.x = move.clientX; point.y = move.clientY
        const current = point.matrixTransform(svg.getScreenCTM().inverse())
        const x = Math.max(85, Math.min(1115, origin.x + current.x - start.x))
        const y = Math.max(35, Math.min(725, origin.y + current.y - start.y))
        group.setAttribute('transform', `translate(${x-node.x} ${y-node.y})`)
        group.dataset.dragX = x; group.dataset.dragY = y
      }
      group.onpointerup = () => {
        node.x = Number(group.dataset.dragX || node.x)
        node.y = Number(group.dataset.dragY || node.y)
        group.onpointermove = null
        drawMindmap()
      }
    }
  })
}
function addMindNode(){if(!state.selectedNode)return toast('先选中父节点');const p=state.mindmap.nodes.find(n=>n.id===state.selectedNode),id=Math.max(0,...state.mindmap.nodes.map(n=>n.id))+1;state.mindmap.nodes.push({id,text:'新节点',x:p.x+230,y:p.y+Math.random()*100-50,parent:p.id});state.selectedNode=id;drawMindmap()}
function deleteMindNode(){const id=state.selectedNode,n=state.mindmap.nodes.find(x=>x.id===id);if(!n||!n.parent)return toast('中心节点不能删除');const ids=new Set([id]);let changed=true;while(changed){const s=ids.size;state.mindmap.nodes.forEach(x=>{if(ids.has(x.parent))ids.add(x.id)});changed=s!==ids.size}state.mindmap.nodes=state.mindmap.nodes.filter(x=>!ids.has(x.id));state.selectedNode=null;drawMindmap()}
async function saveMindmap(){const title=prompt('导图名称',state.mindmap.title)||state.mindmap.title;state.mindmap.title=title;if(state.mindmap.id)await put('mindmaps',state.mindmap);else state.mindmap.id=await add('mindmaps',state.mindmap);await logActivity('mindmap','保存思维导图',title);toast('导图已保存')}
function exportMindmap(){const svg=$('#mind-svg').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');downloadBlob(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),`${state.mindmap.title}.svg`)}

async function renderPdf() {
  $('#page-pdf').innerHTML=`${head('PDF 查看','直接选择平板本地 PDF，在 LR 内查看；浏览器不会上传文件。')}<div class="card"><div class="toolbar"><input id="pdf-file" type="file" accept="application/pdf"><button class="btn" id="pdf-open-external">用系统应用打开</button></div><iframe class="pdf-view" id="pdf-view"></iframe></div>`
  $('#pdf-file').onchange=e=>{const file=e.target.files[0];if(!file)return;if(state.pdfUrl)URL.revokeObjectURL(state.pdfUrl);state.pdfUrl=URL.createObjectURL(file);$('#pdf-view').src=state.pdfUrl;$('#pdf-open-external').onclick=()=>window.open(state.pdfUrl,'_blank')}
}

async function renderCloud() {
  const links=[['百度网盘','https://pan.baidu.com/'],['阿里云盘','https://www.alipan.com/'],['夸克网盘','https://pan.quark.cn/'],['123云盘','https://www.123pan.com/'],['中国移动云盘','https://yun.139.com/'],['OneDrive','https://onedrive.live.com/']]
  $('#page-cloud').innerHTML=`${head('网盘快速跳转','登录和下载由平板系统浏览器或网盘客户端完成。')}<div class="card"><div class="toolbar"><input id="cloud-url" placeholder="粘贴网盘分享链接"><button class="btn primary" id="cloud-open">立即打开</button></div><div class="quick-links">${links.map(x=>`<a href="${x[1]}" target="_blank">${x[0]}</a>`).join('')}</div></div>`;$('#cloud-open').onclick=()=>{let url=$('#cloud-url').value.trim();if(!/^https?:\/\//i.test(url))url='https://'+url;window.open(url,'_blank')}
}

async function renderSettings() {
  const data=await exportAll();const counts=Object.fromEntries(Object.entries(data.data).map(([k,v])=>[k,v.length]))
  $('#page-settings').innerHTML=`${head('设置与数据','LR 平板版使用 IndexedDB 本地保存，可通过 JSON 与其他设备互传。')}<div class="grid two"><div class="card"><h2>数据迁移</h2><p class="muted">计划 ${counts.tasks} · 打卡 ${counts.checkins} · 单词 ${counts.words} · 阅读 ${counts.readings} · 导图 ${counts.mindmaps}</p><div class="toolbar"><button class="btn primary" id="data-export">导出 LR 数据</button><input id="data-file" type="file" accept=".json"><button class="btn" id="data-import">导入并合并</button></div></div><div class="card"><h2>安装到荣耀平板</h2><p>使用 Chrome/Edge 打开部署地址，选择“添加到主屏幕”或“安装应用”。安装后可全屏运行并离线使用主要学习模块。</p><button class="btn primary" id="pwa-install" ${window.deferredInstall?'':'disabled'}>安装 LR</button></div></div><div class="card" style="margin-top:14px"><h2>隐私</h2><p class="muted">视频帧、计划、单词和阅读都在本机处理。OCR 首次加载语言模型时需要联网；网盘跳转由系统浏览器完成。刷新视频讲义页面后，内存中的临时截图会自动释放。</p></div>`
  $('#data-export').onclick=()=>downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`LR数据_${today()}.json`)
  $('#data-import').onclick=async()=>{const f=$('#data-file').files[0];if(!f)return toast('请选择 LR JSON');try{await importAll(JSON.parse(await f.text()),false);toast('数据导入完成');renderSettings()}catch(e){toast(e.message)}}
  $('#pwa-install').onclick=async()=>{if(window.deferredInstall){await window.deferredInstall.prompt();window.deferredInstall=null}}
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.deferredInstall=e})
setInterval(()=>{$('#clock').textContent=new Date().toLocaleString();if(state.readingStarted&&$('#reading-timer')){const s=Math.floor((Date.now()-state.readingStarted)/1000);$('#reading-timer').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}},1000)

showPage('dashboard')
