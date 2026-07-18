import './style.css'
import JSZip from 'jszip'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { registerSW } from 'virtual:pwa-register'
import { BUILTIN_EXERCISES } from './data.js'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
registerSW({ immediate: true })

const STORAGE_KEY = 'lr-english-reading-v1'
const today = () => new Date().toLocaleDateString('en-CA')
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
const fmtTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`
const parseDate = value => new Date(`${value}T12:00:00`)
const dateKey = date => date.toLocaleDateString('en-CA')

const defaults = {
  version: 1,
  customExercises: [],
  attempts: [],
  hearts: {},
  annotations: {},
  notes: {},
  drafts: {},
  plan: { dailyArticles:2, dailyMinutes:60, weeklyArticles:10, days:[1,2,3,4,5,6], reminder:'20:00' },
  settings: { theme:'cream', fontSize:18, timer:true, autoNext:false },
  checkins: [],
  createdAt: new Date().toISOString()
}

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { ...structuredClone(defaults), ...raw, plan:{...defaults.plan,...raw.plan}, settings:{...defaults.settings,...raw.settings} }
  } catch { return structuredClone(defaults) }
}

let db = loadStore()
let page = 'dashboard'
let practice = null
let timerId = null
let importPayload = null
let analyticsRange = 7
let libraryFilter = '全部'

const $ = (selector, root=document) => root.querySelector(selector)
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)]
const exercises = () => [...BUILTIN_EXERCISES, ...db.customExercises]
const findExercise = id => exercises().find(x => x.id === id)

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  applySettings()
}

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => el.classList.remove('show'), 2400)
}

function modal(html) {
  $('#modal-box').innerHTML = html
  $('#modal').classList.add('show')
}
function closeModal() { $('#modal').classList.remove('show'); importPayload = null }

function applySettings() {
  document.documentElement.style.setProperty('--reading-font', `${clamp(Number(db.settings.fontSize)||18,14,26)}px`)
  document.body.classList.remove('theme-mint','theme-lilac')
  if (db.settings.theme === 'mint') document.body.classList.add('theme-mint')
  if (db.settings.theme === 'lilac') document.body.classList.add('theme-lilac')
}

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><img class="brand-avatar" src="./icon.png" alt="LR"><div><h1>LR 英语特训</h1><small>独家私人版</small></div></div>
      <nav class="nav">
        ${[
          ['dashboard','⌂','今日'],['library','▤','真题'],['plan','✓','计划'],['hearts','♥','心结本'],['analytics','⌁','统计'],['bank','＋','题库']
        ].map(([key,icon,text])=>`<button class="nav-btn" data-page="${key}"><span class="nav-icon">${icon}</span><span class="nav-text">${text}</span></button>`).join('')}
      </nav>
      <div class="side-card"><b id="side-streak">0 天</b><p>连续训练<br>慢慢来，比较快。</p></div>
    </aside>
    <main class="workspace">
      <header class="topbar">
        <div class="top-title"><i class="status-dot"></i><span id="top-status">今日状态很好，开始一篇吧</span></div>
        <div class="top-actions"><span class="clock" id="clock"></span><button class="btn icon" id="settings-btn" title="设置">⚙</button></div>
      </header>
      <section class="content" id="content"></section>
    </main>
  </div>
  <div class="modal" id="modal"><div class="modal-box" id="modal-box"></div></div>
  <div class="toast" id="toast"></div>`

applySettings()
setInterval(() => { $('#clock').textContent = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) }, 1000)
$('#clock').textContent = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
$('#modal').addEventListener('click', event => { if (event.target.id === 'modal') closeModal() })
$$('.nav-btn').forEach(btn => btn.onclick = () => showPage(btn.dataset.page))
$('#settings-btn').onclick = showSettings

function setActiveNav(key) {
  $$('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === key))
}

function showPage(key) {
  stopTimer()
  page = key
  setActiveNav(key)
  const renderers = { dashboard:renderDashboard, library:renderLibrary, plan:renderPlan, hearts:renderHearts, analytics:renderAnalytics, bank:renderBank }
  renderers[key]?.()
  $('#content').scrollTop = 0
}

function pageHead(kicker, title, subtitle, actions='') {
  return `<div class="page-head"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2><p>${subtitle}</p></div><div class="toolbar">${actions}</div></div>`
}

function attemptsOn(day) { return db.attempts.filter(a => a.date === day) }
function questionTotal(list=db.attempts) { return list.reduce((s,a)=>s+(a.total||0),0) }
function correctTotal(list=db.attempts) { return list.reduce((s,a)=>s+(a.correct||0),0) }
function accuracy(list=db.attempts) { const total=questionTotal(list); return total ? Math.round(correctTotal(list)/total*100) : 0 }

function streak() {
  const days = new Set(db.attempts.map(a=>a.date))
  let n = 0
  const d = new Date()
  if (!days.has(dateKey(d))) d.setDate(d.getDate()-1)
  while (days.has(dateKey(d))) { n++; d.setDate(d.getDate()-1) }
  return n
}

function lastAttempt(exerciseId) {
  return [...db.attempts].reverse().find(a=>a.exerciseId===exerciseId)
}

function renderDashboard() {
  const todays = attemptsOn(today())
  const done = todays.length
  const target = db.plan.dailyArticles
  const pct = clamp(Math.round(done/Math.max(1,target)*100),0,100)
  const totalMinutes = Math.round(db.attempts.reduce((s,a)=>s+(a.elapsed||0),0)/60)
  const recent = [...db.attempts].reverse().slice(0,4)
  const recommendation = exercises().find(e=>!lastAttempt(e.id)) || exercises().sort((a,b)=>(lastAttempt(a.id)?.accuracy||0)-(lastAttempt(b.id)?.accuracy||0))[0]
  $('#side-streak').textContent = `${streak()} 天`
  $('#top-status').textContent = done >= target ? '今日计划完成，复盘一下会更稳' : `今天还差 ${Math.max(0,target-done)} 篇完成计划`
  $('#content').innerHTML = `
    ${pageHead('LR DAILY','今天也要稳稳进步','阅读能力不是突然变强，是每天多看懂一点。',`<button class="btn peach" id="quick-import">＋ 导入试题</button>`)}
    <div class="hero">
      <article class="card hero-main">
        <span class="pill" style="background:rgba(255,255,255,.15);color:white">为荣耀平板横屏优化</span>
        <h2>${done ? '保持手感，再来一篇真题。' : '从一篇真题开始，把今天变得扎实一点。'}</h2>
        <p>左边精读文章，右边选择作答；计时、批注、心结、解析和数据分析全部留在本机。</p>
        <button class="btn" id="hero-start">开始 ${esc(recommendation.title)}</button>
      </article>
      <article class="card hero-side">
        <div><h3>今日完成量</h3><div class="daily-ring"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div><div><strong style="font-size:24px">${done}/${target} 篇</strong><p class="muted" style="margin:5px 0">${done>=target?'计划已完成 ✨':'稳稳做，不赶进度'}</p></div></div></div>
        <div class="mini-plan"><div><b>${todays.reduce((s,a)=>s+a.correct,0)}</b><span>今日答对</span></div><div><b>${Math.round(todays.reduce((s,a)=>s+a.elapsed,0)/60)}</b><span>今日分钟</span></div></div>
      </article>
    </div>
    <div class="grid four">
      ${statCard('◎','累计正确率',`${accuracy()}%`,'所有已完成真题','--accent:#7665d8;--accent-soft:#eeeaff')}
      ${statCard('✓','完成阅读',`${db.attempts.length} 篇`,'含反复训练','--accent:#e47f60;--accent-soft:#fff0e8')}
      ${statCard('◷','专注时长',`${totalMinutes} 分`,'真实做题计时','--accent:#4ea989;--accent-soft:#e8faf3')}
      ${statCard('♥','做题心结',`${Object.values(db.hearts).filter(Boolean).length} 题`,'等待复盘','--accent:#e26478;--accent-soft:#fff0f2')}
    </div>
    <div class="grid two" style="margin-top:17px">
      <article class="card"><div class="toolbar between"><h3>最近训练</h3><button class="btn" id="all-papers">查看真题</button></div>
        ${recent.length ? recent.map(a=>{const e=findExercise(a.exerciseId);return `<div class="insight"><div class="insight-icon">${a.accuracy>=80?'🌱':'📝'}</div><div style="flex:1"><b>${esc(e?.title||a.title)}</b><p>${a.date} · ${a.correct}/${a.total} · ${fmtTime(a.elapsed)} · ${a.mode==='repeat'?'反复练':'首练'}</p></div><strong style="color:${a.accuracy>=80?'var(--mint)':'var(--peach)'}">${a.accuracy}%</strong></div>`}).join('') : `<div class="empty" style="min-height:170px"><div><div class="empty-emoji">☁</div><b>还没有训练记录</b><p>第一篇完成后，成长轨迹会从这里开始。</p></div></div>`}
      </article>
      <article class="card"><h3>今日小建议</h3>${insights().slice(0,3).map((x,i)=>`<div class="insight"><div class="insight-icon">${['💡','⏱','📌'][i]}</div><div><b>${x.title}</b><p>${x.text}</p></div></div>`).join('')}</article>
    </div>`
  $('#hero-start').onclick = () => startExercise(recommendation.id,'new')
  $('#quick-import').onclick = showImporter
  $('#all-papers').onclick = () => showPage('library')
}

function statCard(icon,label,value,detail,style) {
  return `<article class="card stat" style="${style}"><div class="stat-label"><span class="stat-icon">${icon}</span>${label}</div><strong>${value}</strong><small>${detail}</small></article>`
}

function renderLibrary() {
  const list = exercises().filter(e=>libraryFilter==='全部'||e.paper===libraryFilter||e.source===libraryFilter)
  $('#top-status').textContent = `题库共 ${exercises().length} 篇，内置 2025 真题 20 题`
  $('#content').innerHTML = `
    ${pageHead('PAST PAPERS','真题特训','先限时做，再精读复盘；同一篇可以无限次反复练。',`<button class="btn primary" id="lib-import">＋ 导入试题</button>`)}
    <div class="filter-row"><div class="segmented">${['全部','英语一','英语二','我的导入'].map(x=>`<button data-filter="${x}" class="${x===libraryFilter?'active':''}">${x}</button>`).join('')}</div><input class="search" id="paper-search" placeholder="搜索年份、主题或标题"></div>
    <div class="exercise-list" id="exercise-list">${list.map(exerciseCard).join('')}</div>`
  $$('[data-filter]').forEach(b=>b.onclick=()=>{libraryFilter=b.dataset.filter;renderLibrary()})
  $('#lib-import').onclick = showImporter
  $('#paper-search').oninput = event => {
    const q=event.target.value.trim().toLowerCase()
    $('#exercise-list').innerHTML=list.filter(e=>`${e.title} ${e.topic} ${e.year}`.toLowerCase().includes(q)).map(exerciseCard).join('') || emptyCard('没有找到匹配试题','换个关键词或导入你自己的题目。')
    bindExerciseCards()
  }
  bindExerciseCards()
}

function exerciseCard(e) {
  const last=lastAttempt(e.id)
  return `<article class="exercise-card"><div class="year-badge"><span>${e.year||'自建'}</span><small>TEXT ${e.textNo||1}</small></div><div class="exercise-info"><h3>${esc(e.title)}</h3><p>${esc(e.paper)} · ${esc(e.topic||'阅读理解')} · ${e.questions.length} 题</p><div class="toolbar"><span class="stars">${'★'.repeat(e.difficulty||3)}${'☆'.repeat(5-(e.difficulty||3))}</span><span class="pill ${e.source==='内置真题'?'primary':'peach'}">${esc(e.source||'我的导入')}</span>${last?`<span class="last-score">上次 ${last.accuracy}%</span>`:''}</div></div><div class="toolbar"><button class="btn primary start-exercise" data-id="${e.id}">${last?'再练一次':'开始作答'}</button>${last?`<button class="btn repeat-exercise" data-id="${e.id}">反复练</button>`:''}</div></article>`
}
function bindExerciseCards() {
  $$('.start-exercise').forEach(b=>b.onclick=()=>startExercise(b.dataset.id,'new'))
  $$('.repeat-exercise').forEach(b=>b.onclick=()=>startExercise(b.dataset.id,'repeat'))
}

function startExercise(exerciseId, mode='new') {
  const exercise=findExercise(exerciseId)
  if(!exercise) return toast('没有找到这篇试题')
  stopTimer()
  page='practice';setActiveNav('library')
  const draft=db.drafts[exerciseId]
  practice={
    exerciseId, mode, answers:mode==='repeat'&&lastAttempt(exerciseId)?{...lastAttempt(exerciseId).answers}:{...(draft?.answers||{})},
    elapsed:mode==='repeat'?0:(draft?.elapsed||0), paused:false, submitted:false, result:null
  }
  renderPractice()
  startTimer()
}

function startTimer() {
  stopTimer()
  if (!practice || practice.paused || practice.submitted) return
  timerId=setInterval(()=>{practice.elapsed++; const el=$('#practice-timer'); if(el)el.textContent=fmtTime(practice.elapsed); if(practice.elapsed%10===0)saveDraft()},1000)
}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function saveDraft(){if(!practice||practice.submitted)return;db.drafts[practice.exerciseId]={answers:practice.answers,elapsed:practice.elapsed,updatedAt:new Date().toISOString()};save()}

function renderPractice() {
  const e=findExercise(practice.exerciseId)
  const total=e.questions.length
  const answered=Object.keys(practice.answers).length
  const annotations=db.annotations[e.id]||[]
  const result=practice.result
  $('#top-status').textContent = result ? `完成：${result.correct}/${result.total}，正确率 ${result.accuracy}%` : `作答进度 ${answered}/${total}`
  $('#content').innerHTML=`<div class="practice-wrap">
    <header class="practice-head">
      <div class="toolbar"><button class="btn icon" id="practice-back">←</button><div class="practice-title"><h2>${esc(e.title)}</h2><p>${esc(e.topic)} · ${practice.mode==='repeat'?'反复训练':'限时训练'}</p></div></div>
      <div style="min-width:200px;max-width:330px;flex:1"><div class="progress"><i style="width:${Math.round(answered/total*100)}%"></i></div></div>
      <div class="toolbar"><div class="timer">◷ <span id="practice-timer">${fmtTime(practice.elapsed)}</span></div>${!result?`<button class="btn icon" id="pause-timer">${practice.paused?'▶':'Ⅱ'}</button>`:''}</div>
    </header>
    <div class="practice-main">
      <section class="passage-pane">
        <div class="pane-toolbar"><div class="toolbar"><span class="pill primary">左栏 · 文章</span><span class="pill">${wordCount(e.passage)} words</span></div><div class="toolbar"><button class="btn icon font-down">A−</button><button class="btn icon font-up">A＋</button></div></div>
        <div class="toolbar" style="margin-bottom:13px"><span class="muted" style="font-size:12px">选中文字后批注：</span><button class="btn icon highlight" data-color="yellow" title="黄色高亮">🟡</button><button class="btn icon highlight" data-color="mint" title="绿色高亮">🟢</button><button class="btn icon highlight" data-color="purple" title="紫色高亮">🟣</button><button class="btn add-note">✎ 写批注</button>${annotations.length?`<button class="btn danger clear-marks">清空批注</button>`:''}</div>
        <h3 class="passage-title">${esc(e.title)} — ${esc(e.topic)}</h3>
        <div class="passage-text" id="passage-text">${renderPassage(e.passage,annotations)}</div>
        ${annotations.length?`<div class="annotation-drawer"><b>我的文章批注 · ${annotations.length}</b>${annotations.map((a,i)=>`<div class="annotation-item"><q>${esc(a.quote)}</q>${a.note?`<span>${esc(a.note)}</span>`:''}<button class="btn danger remove-mark" data-i="${i}" style="float:right;min-height:29px;padding:4px 8px">删除</button></div>`).join('')}</div>`:''}
      </section>
      <section class="question-pane">
        <div class="question-jump"><span class="pill">右栏 · 作答</span>${e.questions.map(q=>`<button class="q-dot ${result?(practice.answers[q.id]===q.answer?'correct':'wrong'):(practice.answers[q.id]?'done':'')}" data-jump="${q.id}">${q.number}</button>`).join('')}</div>
        ${result?scoreBanner(result):''}
        ${e.questions.map(q=>questionCard(q,result)).join('')}
      </section>
    </div>
    <div class="practice-foot">${result?`<button class="btn" id="back-library">返回题库</button><button class="btn peach" id="repeat-now">再做一遍</button>`:`<button class="btn" id="save-exit">保存退出</button><button class="btn primary" id="submit-paper" ${answered<total?'disabled':''}>交卷并查看解析</button>`}</div>
  </div>`
  bindPractice()
}

function wordCount(text){return text.trim().split(/\s+/).length}

function renderPassage(text, annotations) {
  const ranges=[]
  annotations.forEach(a=>{const start=text.indexOf(a.quote);if(start>=0&&!ranges.some(r=>start<r.end&&start+a.quote.length>r.start))ranges.push({start,end:start+a.quote.length,color:a.color})})
  ranges.sort((a,b)=>a.start-b.start)
  let pos=0,html=''
  ranges.forEach(r=>{html+=esc(text.slice(pos,r.start));html+=`<mark class="mark-${r.color}">${esc(text.slice(r.start,r.end))}</mark>`;pos=r.end})
  html+=esc(text.slice(pos))
  return html.split(/\n\s*\n/).map(p=>`<p>${p.replace(/\n/g,' ')}</p>`).join('')
}

function questionCard(q,result) {
  const selected=practice.answers[q.id]
  const heart=!!db.hearts[q.id]
  return `<article class="q-card" id="question-${q.id}"><div class="q-head"><div><span class="pill ${q.type.includes('推断')?'peach':'primary'}">${esc(q.type||'阅读题')}</span><h3 class="q-title" style="margin-top:9px">${q.number}. ${esc(q.prompt)}</h3></div><button class="heart ${heart?'active':''}" data-heart="${q.id}" title="加入做题心结">♥</button></div>
    <div class="options">${Object.entries(q.options).map(([key,value])=>{let cls=selected===key?'selected':'';if(result){if(key===q.answer)cls='correct';else if(selected===key)cls='wrong'}return `<button class="option ${cls}" data-q="${q.id}" data-answer="${key}" ${result?'disabled':''}><span class="letter">${key}</span><span class="option-text">${esc(value)}</span>${result&&key===q.answer?'<span>✓</span>':''}</button>`}).join('')}</div>
    ${result?`<div class="analysis-box"><h4>答案 ${q.answer} · ${selected===q.answer?'回答正确':'你的答案 '+(selected||'未答')}</h4><p>${esc(q.explanation||'暂无解析')}</p>${q.evidence?`<p class="evidence"><b>定位句：</b>${esc(q.evidence)}</p>`:''}${q.trap?`<p><b>易错点：</b>${esc(q.trap)}</p>`:''}</div>`:''}
    <textarea class="q-note" data-note="${q.id}" placeholder="记录你的思路、陌生词或为什么纠结……">${esc(db.notes[q.id]||'')}</textarea></article>`
}

function scoreBanner(result){
  const level=result.accuracy>=90?'状态极佳':result.accuracy>=75?'稳步提升':result.accuracy>=60?'基础可用':'需要精读复盘'
  return `<div class="score-banner"><div class="toolbar between"><div><span class="pill" style="background:rgba(255,255,255,.16);color:white">${level}</span><div><strong>${result.score}</strong> / 10 分</div><p>答对 ${result.correct}/${result.total} · 用时 ${fmtTime(result.elapsed)} · 阅读得分力约 ${Math.round(result.accuracy*.4)}/40</p></div><div style="font-size:42px">${result.accuracy>=80?'🌟':'🌱'}</div></div></div>`
}

function bindPractice() {
  const e=findExercise(practice.exerciseId)
  $('#practice-back').onclick=()=>{saveDraft();showPage('library')}
  $('#pause-timer')?.addEventListener('click',()=>{practice.paused=!practice.paused;practice.paused?stopTimer():startTimer();renderPractice()})
  $$('.option').forEach(b=>b.onclick=()=>{practice.answers[b.dataset.q]=b.dataset.answer;saveDraft();renderPractice();startTimer()})
  $$('.heart').forEach(b=>b.onclick=()=>{db.hearts[b.dataset.heart]=!db.hearts[b.dataset.heart];save();b.classList.toggle('active',db.hearts[b.dataset.heart]);toast(db.hearts[b.dataset.heart]?'已加入做题心结':'已移出心结本')})
  $$('.q-note').forEach(t=>t.onchange=()=>{db.notes[t.dataset.note]=t.value;save();toast('思路已保存')})
  $$('.q-dot').forEach(b=>b.onclick=()=>$('#question-'+b.dataset.jump).scrollIntoView({behavior:'smooth',block:'start'}))
  $$('.font-down').forEach(b=>b.onclick=()=>{db.settings.fontSize=clamp(db.settings.fontSize-1,14,26);save()})
  $$('.font-up').forEach(b=>b.onclick=()=>{db.settings.fontSize=clamp(db.settings.fontSize+1,14,26);save()})
  $$('.highlight').forEach(b=>b.onpointerdown=event=>{event.preventDefault();addAnnotation(e,b.dataset.color,false)})
  $('.add-note')?.addEventListener('pointerdown',event=>{event.preventDefault();addAnnotation(e,'yellow',true)})
  $('.clear-marks')?.addEventListener('click',()=>{if(confirm('清空这篇文章的全部批注？')){db.annotations[e.id]=[];save();renderPractice();startTimer()}})
  $$('.remove-mark').forEach(b=>b.onclick=()=>{db.annotations[e.id].splice(Number(b.dataset.i),1);save();renderPractice();startTimer()})
  $('#save-exit')?.addEventListener('click',()=>{saveDraft();toast('进度已保存');showPage('library')})
  $('#submit-paper')?.addEventListener('click',submitPractice)
  $('#back-library')?.addEventListener('click',()=>showPage('library'))
  $('#repeat-now')?.addEventListener('click',()=>startExercise(e.id,'repeat'))
}

function addAnnotation(exercise,color,withNote) {
  const selection=window.getSelection()
  const quote=selection?.toString().trim()
  const passage=$('#passage-text')
  if(!quote || !selection.anchorNode || !passage.contains(selection.anchorNode)) return toast('请先在左侧文章中选中文字')
  if(quote.length>260)return toast('一次批注请不要超过 260 个字符')
  const finish=note=>{db.annotations[exercise.id]=db.annotations[exercise.id]||[];db.annotations[exercise.id].push({quote,color,note,createdAt:new Date().toISOString()});save();selection.removeAllRanges();renderPractice();startTimer()}
  if(withNote){modal(`<h3>写下这处批注</h3><p>“${esc(quote)}”</p><div class="field"><label>我的理解 / 生词 / 逻辑关系</label><textarea id="annotation-note" autofocus></textarea></div><div class="toolbar"><button class="btn primary" id="save-annotation">保存批注</button><button class="btn" id="cancel-modal">取消</button></div>`);$('#save-annotation').onclick=()=>{const note=$('#annotation-note').value.trim();closeModal();finish(note)};$('#cancel-modal').onclick=closeModal}else finish('')
}

function submitPractice() {
  const e=findExercise(practice.exerciseId)
  if(e.questions.some(q=>!q.answer)) return toast('这篇导入题尚未录入标准答案，请先在题库补充答案')
  if(e.questions.some(q=>!practice.answers[q.id])) return toast('还有题目没有作答')
  stopTimer()
  const correct=e.questions.filter(q=>practice.answers[q.id]===q.answer).length
  const result={id:uid('attempt'),date:today(),createdAt:new Date().toISOString(),exerciseId:e.id,title:e.title,mode:practice.mode,answers:{...practice.answers},correct,total:e.questions.length,accuracy:Math.round(correct/e.questions.length*100),score:Math.round(correct/e.questions.length*10*10)/10,elapsed:practice.elapsed,errorsByType:{}}
  e.questions.filter(q=>practice.answers[q.id]!==q.answer).forEach(q=>result.errorsByType[q.type]=(result.errorsByType[q.type]||0)+1)
  db.attempts.push(result);delete db.drafts[e.id];save()
  practice.submitted=true;practice.result=result
  renderPractice()
  toast(`交卷完成：${correct}/${e.questions.length}`)
}

function renderPlan() {
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=dateKey(d);return{key,label:['日','一','二','三','四','五','六'][d.getDay()],count:attemptsOn(key).length}})
  const weekTotal=last7.reduce((s,x)=>s+x.count,0)
  $('#top-status').textContent = `本周完成 ${weekTotal}/${db.plan.weeklyArticles} 篇`
  $('#content').innerHTML=`${pageHead('STUDY PLAN','完成量与训练计划','计划不必挤满，留一点余地才更容易坚持。')}
    <div class="grid two"><article class="card"><h3>我的阅读计划</h3>
      <div class="grid two"><div class="field"><label>每日目标（篇）</label><input id="daily-articles" type="number" min="1" max="8" value="${db.plan.dailyArticles}"></div><div class="field"><label>每日目标（分钟）</label><input id="daily-minutes" type="number" min="10" max="240" step="5" value="${db.plan.dailyMinutes}"></div></div>
      <div class="field"><label>每周目标（篇）</label><input id="weekly-articles" type="number" min="1" max="40" value="${db.plan.weeklyArticles}"></div>
      <div class="field"><label>训练日</label><div class="toolbar">${['日','一','二','三','四','五','六'].map((x,i)=>`<label class="check-row"><input type="checkbox" class="plan-day" value="${i}" ${db.plan.days.includes(i)?'checked':''}>周${x}</label>`).join('')}</div></div>
      <div class="field"><label>计划提醒时间</label><input id="plan-reminder" type="time" value="${db.plan.reminder}"></div>
      <button class="btn primary" id="save-plan">保存计划</button>
    </article><article class="card plan-preview"><div class="toolbar between"><h3>本周完成情况</h3><span class="pill primary">${weekTotal}/${db.plan.weeklyArticles} 篇</span></div>
      ${last7.map(x=>`<div class="day-row"><b>周${x.label}</b><div class="progress"><i style="width:${clamp(x.count/Math.max(1,db.plan.dailyArticles)*100,0,100)}%"></i></div><span>${x.count} 篇</span></div>`).join('')}
      <p class="muted" style="margin-top:17px">${weekTotal>=db.plan.weeklyArticles?'本周目标已经完成，做一次错题复盘吧。':'距本周目标还差 '+Math.max(0,db.plan.weeklyArticles-weekTotal)+' 篇。'}</p>
    </article></div>
    <article class="card" style="margin-top:16px"><h3>计划执行原则</h3><div class="grid three"><div class="insight"><div class="insight-icon">①</div><div><b>首练限时</b><p>先完整作答，交卷前不看解析。</p></div></div><div class="insight"><div class="insight-icon">②</div><div><b>精读复盘</b><p>定位句、错误选项和生词都留下批注。</p></div></div><div class="insight"><div class="insight-icon">③</div><div><b>间隔重做</b><p>心结题和低分文章 3～7 天后反复练。</p></div></div></div></article>`
  $('#save-plan').onclick=()=>{db.plan.dailyArticles=clamp(Number($('#daily-articles').value),1,8);db.plan.dailyMinutes=clamp(Number($('#daily-minutes').value),10,240);db.plan.weeklyArticles=clamp(Number($('#weekly-articles').value),1,40);db.plan.days=$$('.plan-day:checked').map(x=>Number(x.value));db.plan.reminder=$('#plan-reminder').value;save();toast('计划已保存');renderPlan()}
}

function renderHearts() {
  const heartIds=Object.entries(db.hearts).filter(([,v])=>v).map(([k])=>k)
  const items=[]
  exercises().forEach(e=>e.questions.forEach(q=>{if(heartIds.includes(q.id))items.push({e,q})}))
  $('#top-status').textContent = `心结本中有 ${items.length} 道题`
  $('#content').innerHTML=`${pageHead('KNOT BOOK','做题心结本','这里不是错题惩罚区，是你最值得突破的地方。')}
    ${items.length?`<div class="grid two">${items.map(({e,q})=>`<article class="card"><div class="toolbar between"><span class="pill primary">${esc(e.title)}</span><button class="heart active remove-heart" data-id="${q.id}">♥</button></div><h3 style="font-family:Georgia,serif;line-height:1.6;margin-top:14px">${q.number}. ${esc(q.prompt)}</h3><p class="muted">${esc(q.type)} · 标准答案 ${q.answer||'待补充'}</p>${db.notes[q.id]?`<div class="analysis-box"><b>我的思路</b><p>${esc(db.notes[q.id])}</p></div>`:''}<div class="toolbar" style="margin-top:13px"><button class="btn primary heart-practice" data-ex="${e.id}">练习整篇</button><button class="btn heart-analysis" data-ex="${e.id}" data-q="${q.id}">查看解析</button></div></article>`).join('')}</div>`:emptyCard('暂时没有做题心结','作答时点击题目右上角的 ♥，就能把纠结题收进来。')}`
  $$('.remove-heart').forEach(b=>b.onclick=()=>{db.hearts[b.dataset.id]=false;save();renderHearts()})
  $$('.heart-practice').forEach(b=>b.onclick=()=>startExercise(b.dataset.ex,'repeat'))
  $$('.heart-analysis').forEach(b=>b.onclick=()=>{const e=findExercise(b.dataset.ex);const q=e.questions.find(x=>x.id===b.dataset.q);modal(`<h3>${q.number}. ${esc(q.prompt)}</h3><p>${esc(e.title)}</p><div class="analysis-box"><h4>答案 ${q.answer||'待补充'}</h4><p>${esc(q.explanation||'暂无解析')}</p>${q.evidence?`<p class="evidence"><b>定位句：</b>${esc(q.evidence)}</p>`:''}${q.trap?`<p><b>易错点：</b>${esc(q.trap)}</p>`:''}</div><button class="btn" id="cancel-modal">关闭</button>`);$('#cancel-modal').onclick=closeModal})
}

function renderAnalytics() {
  const days=Array.from({length:analyticsRange},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(analyticsRange-1-i));const key=dateKey(d),list=attemptsOn(key);return{key,label:analyticsRange===7?['日','一','二','三','四','五','六'][d.getDay()]:`${d.getMonth()+1}/${d.getDate()}`,count:list.length,accuracy:accuracy(list)}})
  const rangeAttempts=db.attempts.filter(a=>days.some(d=>d.key===a.date))
  const max=Math.max(1,...days.map(d=>d.count))
  const repeat=Math.round(rangeAttempts.filter(a=>a.mode==='repeat').length/Math.max(1,rangeAttempts.length)*100)
  const types={}
  rangeAttempts.forEach(a=>{const e=findExercise(a.exerciseId);e?.questions.forEach(q=>{types[q.type]=types[q.type]||{correct:0,total:0};types[q.type].total++;if(a.answers[q.id]===q.answer)types[q.type].correct++})})
  $('#top-status').textContent = `${analyticsRange===7?'近 7 天':'近 30 天'}正确率 ${accuracy(rangeAttempts)}%`
  $('#content').innerHTML=`${pageHead('ANALYTICS','学习统计与分数分析','看趋势，不盯单次波动；找到真正拖分的题型。',`<div class="segmented"><button class="range-btn ${analyticsRange===7?'active':''}" data-range="7">周</button><button class="range-btn ${analyticsRange===30?'active':''}" data-range="30">月</button></div>`)}
    <div class="grid four">${statCard('◎','区间正确率',`${accuracy(rangeAttempts)}%`,`${correctTotal(rangeAttempts)}/${questionTotal(rangeAttempts)} 题`,'--accent:#7665d8;--accent-soft:#eeeaff')}${statCard('↻','反复率',`${repeat}%`,'重复训练占比','--accent:#e47f60;--accent-soft:#fff0e8')}${statCard('▤','完成量',`${rangeAttempts.length} 篇`,`${questionTotal(rangeAttempts)} 道题`,'--accent:#4ea989;--accent-soft:#e8faf3')}${statCard('◷','平均用时',`${rangeAttempts.length?Math.round(rangeAttempts.reduce((s,a)=>s+a.elapsed,0)/60/rangeAttempts.length):0} 分`,'每篇阅读','--accent:#e26478;--accent-soft:#fff0f2')}</div>
    <div class="grid two" style="margin-top:17px"><article class="card"><div class="toolbar between"><h3>每日完成量</h3><span class="pill">${analyticsRange} 天</span></div><div class="chart">${days.map((d,i)=>`<div class="bar-col" title="${d.key}：${d.count} 篇"><div class="bar" style="height:${Math.max(3,d.count/max*145)}px"></div><span>${analyticsRange===30?(i%5===0?d.label:''):d.label}</span></div>`).join('')}</div></article><article class="card"><h3>题型正确率</h3>${Object.keys(types).length?Object.entries(types).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total).map(([name,v])=>{const p=Math.round(v.correct/v.total*100);return`<div class="type-row"><b>${esc(name)}</b><div class="progress"><i style="width:${p}%"></i></div><span>${p}%</span></div>`}).join(''):'<div class="empty" style="min-height:170px">完成真题后生成题型画像。</div>'}</article></div>
    <div class="grid two" style="margin-top:17px"><article class="card"><h3>分数测评</h3><div class="daily-ring"><div class="ring" style="--p:${accuracy(rangeAttempts)}"><b>${Math.round(accuracy(rangeAttempts)*.4)}</b></div><div><strong style="font-size:24px">阅读得分力 / 40</strong><p class="muted">按当前客观题正确率估算，仅用于观察自己的趋势。</p></div></div><div class="analysis-box" style="margin-top:15px"><b>当前阶段：${levelText(accuracy(rangeAttempts))}</b><p>${scoreAdvice(accuracy(rangeAttempts))}</p></div></article><article class="card"><h3>LR 诊断建议</h3>${insights(rangeAttempts,types).map((x,i)=>`<div class="insight"><div class="insight-icon">${['🔎','🧠','↻'][i]}</div><div><b>${x.title}</b><p>${x.text}</p></div></div>`).join('')}</article></div>`
  $$('.range-btn').forEach(b=>b.onclick=()=>{analyticsRange=Number(b.dataset.range);renderAnalytics()})
}

function levelText(p){return p>=90?'高分稳定区':p>=75?'提分加速区':p>=60?'基础巩固区':p>0?'精读重建区':'等待首次测评'}
function scoreAdvice(p){return p>=90?'保持限时节奏，重点复盘偶发失误和选项边界。':p>=75?'基础已经成形，集中攻克正确率最低的两类题。':p>=60?'先保证定位准确，再训练段落逻辑和同义改写。':p>0?'暂时放慢速度，逐句梳理主干并记录错误选项的偷换方式。':'完成至少两篇真题后，会给出更可靠的分数分析。'}

function insights(list=db.attempts,types=null){
  if(!list.length)return[{title:'先建立基线',text:'完成两篇不查词的限时阅读，系统才能判断真实正确率。'},{title:'计时不催促',text:'首练建议每篇 18～22 分钟，精读时间不计入首练。'},{title:'批注要有目的',text:'优先标逻辑词、定位句和选项偷换，不必把整段涂满。'}]
  const acc=accuracy(list), avg=Math.round(list.reduce((s,a)=>s+a.elapsed,0)/60/list.length), repeat=Math.round(list.filter(a=>a.mode==='repeat').length/list.length*100)
  let weakest='推断题'
  if(types&&Object.keys(types).length)weakest=Object.entries(types).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total)[0][0]
  return[{title:`重点突破 ${weakest}`,text:'复盘时先回原文找证据，再解释错误选项具体偷换了什么。'},{title:avg>24?'速度可以再收紧':'当前节奏较稳',text:`平均每篇约 ${avg} 分钟；首练尽量控制在 18～22 分钟。`},{title:repeat<25?'安排间隔重做':'反复练比例合理',text:`当前反复率 ${repeat}%，低分篇建议 3～7 天后无提示重做。`},{title:'正确率趋势',text:`当前区间正确率 ${acc}%，${scoreAdvice(acc)}`}]
}

function renderBank() {
  const custom=db.customExercises
  $('#top-status').textContent = `我的导入 ${custom.length} 篇 · 支持 PDF / DOCX / TXT / JSON / ZIP`
  $('#content').innerHTML=`${pageHead('QUESTION BANK','我的题库与导入','试题和记录只保存在这台平板；建议定期导出 LR 备份。',`<button class="btn primary" id="bank-import">＋ 导入试题</button>`)}
    <div class="grid three"><article class="card"><h3>通用文件导入</h3><p class="muted">PDF、DOCX、TXT 会先提取文字并尝试识别 Text 1～4；JSON 可完整导入题目、答案与解析。</p><button class="btn primary" id="file-import">选择文件</button></article><article class="card"><h3>手动新建一篇</h3><p class="muted">适合自己整理的阅读、模拟题或经过校对的真题。</p><button class="btn peach" id="manual-create">打开编辑器</button></article><article class="card"><h3>数据备份</h3><p class="muted">导出全部题库、计划、批注、心结与学习记录，可在另一台设备恢复。</p><div class="toolbar"><button class="btn mint" id="backup-export">导出备份</button><button class="btn" id="backup-import">恢复备份</button><input id="backup-file" type="file" accept=".json" hidden></div></article></div>
    <article class="card" style="margin-top:17px"><div class="toolbar between"><h3>已导入试题</h3><span class="pill">${custom.length} 篇</span></div>${custom.length?`<div class="table-wrap"><table><thead><tr><th>标题</th><th>类型</th><th>题数</th><th>答案状态</th><th>操作</th></tr></thead><tbody>${custom.map(e=>`<tr><td><b>${esc(e.title)}</b><br><span class="muted">${esc(e.topic||'自定义阅读')}</span></td><td>${esc(e.paper)}</td><td>${e.questions.length}</td><td>${e.questions.every(q=>q.answer)?'<span class="pill mint">可判分</span>':'<span class="pill peach">待补答案</span>'}</td><td><div class="toolbar"><button class="btn bank-start" data-id="${e.id}">练习</button><button class="btn edit-key" data-id="${e.id}">答案</button><button class="btn danger delete-ex" data-id="${e.id}">删除</button></div></td></tr>`).join('')}</tbody></table></div>`:emptyCard('还没有导入试题','你上传的历年真题 PDF、Word 或整理好的 JSON 都可以放进来。')}</article>`
  $('#bank-import').onclick=showImporter;$('#file-import').onclick=showImporter;$('#manual-create').onclick=showManualCreator
  $('#backup-export').onclick=exportBackup;$('#backup-import').onclick=()=>$('#backup-file').click();$('#backup-file').onchange=importBackup
  $$('.bank-start').forEach(b=>b.onclick=()=>startExercise(b.dataset.id,'new'))
  $$('.edit-key').forEach(b=>b.onclick=()=>editAnswerKey(b.dataset.id))
  $$('.delete-ex').forEach(b=>b.onclick=()=>{const e=findExercise(b.dataset.id);if(confirm(`删除“${e.title}”？相关历史成绩仍保留。`)){db.customExercises=db.customExercises.filter(x=>x.id!==b.dataset.id);save();renderBank()}})
}

function emptyCard(title,text){return`<div class="empty"><div><div class="empty-emoji">📖</div><b>${title}</b><p>${text}</p></div></div>`}

function showImporter() {
  modal(`<h3>导入你的试题</h3><p>支持 PDF、DOCX、TXT、JSON 和 ZIP。普通文档会自动提取文字并尝试识别阅读 Text 1～4；导入后可补充答案与解析。</p><div class="dropzone"><input id="paper-file" type="file" accept=".pdf,.docx,.txt,.json,.zip"><div><b>点击选择文件</b><span>或把整理好的试题包拖到这里</span></div></div><div id="import-progress" class="muted" style="margin:13px 0"></div><div class="toolbar"><button class="btn" id="cancel-modal">取消</button></div>`)
  $('#cancel-modal').onclick=closeModal
  $('#paper-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;$('#import-progress').textContent='正在读取并识别，请稍候…';try{await handlePaperFile(file)}catch(error){console.error(error);$('#import-progress').textContent=`导入失败：${error.message}`}}
}

async function handlePaperFile(file) {
  const ext=file.name.split('.').pop().toLowerCase()
  if(ext==='json')return importJsonExercises(JSON.parse(await file.text()),file.name)
  if(ext==='zip')return importZip(file)
  let text=''
  if(ext==='pdf')text=await extractPdf(await file.arrayBuffer())
  else if(ext==='docx'){const mod=await import('mammoth/mammoth.browser');const mammoth=mod.default||mod;text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value}
  else text=await file.text()
  const parsed=parseExamText(text,file.name)
  if(parsed.length)return reviewParsedExercises(parsed,file.name)
  showRawEditor(text,file.name)
}

async function importZip(file) {
  const zip=await JSZip.loadAsync(file)
  const entries=Object.values(zip.files).filter(x=>!x.dir&&/\.(json|txt|pdf|docx)$/i.test(x.name)).slice(0,30)
  if(!entries.length)throw new Error('压缩包中没有可识别的 JSON、TXT、PDF 或 DOCX')
  const collected=[]
  for(const entry of entries){
    const ext=entry.name.split('.').pop().toLowerCase()
    if(ext==='json'){try{const value=JSON.parse(await entry.async('text'));const arr=normalizeImportedJson(value,entry.name);collected.push(...arr)}catch{}}
    else if(ext==='txt'){collected.push(...parseExamText(await entry.async('text'),entry.name))}
    else if(ext==='pdf'){collected.push(...parseExamText(await extractPdf(await entry.async('arraybuffer')),entry.name))}
  }
  if(!collected.length)throw new Error('找到了文档，但没有识别出完整阅读题；建议先导出为 TXT/JSON 再导入')
  reviewParsedExercises(collected,file.name)
}

async function extractPdf(buffer) {
  const doc=await pdfjs.getDocument({data:new Uint8Array(buffer)}).promise
  const pages=[]
  for(let i=1;i<=doc.numPages;i++){
    $('#import-progress') && ($('#import-progress').textContent=`正在提取 PDF：${i}/${doc.numPages} 页`)
    const p=await doc.getPage(i),content=await p.getTextContent()
    pages.push(content.items.map(x=>x.str).join(' '))
  }
  return pages.join('\n')
}

function parseExamText(raw,filename='导入试题') {
  const text=raw.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n')
  const paper=/英语\s*\(?一\)?|English\s*I/i.test(filename+' '+text.slice(0,500))?'英语一':/英语\s*\(?二\)?|English\s*II/i.test(filename+' '+text.slice(0,500))?'英语二':'自定义'
  const year=Number((filename.match(/20\d{2}/)||text.slice(0,300).match(/20\d{2}/)||[])[0])||new Date().getFullYear()
  const found=[]
  for(let n=1;n<=4;n++){
    const heading=new RegExp(`(?:^|\\n|\\s)Text\\s*${n}(?:\\s|$)`,'i').exec(text)
    if(!heading)continue
    const start=heading.index+heading[0].length
    const next=new RegExp(`(?:^|\\n|\\s)Text\\s*${n+1}(?:\\s|$)`,'i').exec(text.slice(start))
    const segment=text.slice(start,next?start+next.index:undefined)
    const firstNo=21+(n-1)*5
    const qStart=new RegExp(`(?:^|\\n|\\s)${firstNo}\\s*[.．]`).exec(segment)
    if(!qStart)continue
    const passage=cleanExtracted(segment.slice(0,qStart.index))
    const qBlock=segment.slice(qStart.index)
    const questions=[]
    for(let num=firstNo;num<firstNo+5;num++){
      const begin=new RegExp(`(?:^|\\n|\\s)${num}\\s*[.．]`).exec(qBlock)
      if(!begin)continue
      const after=begin.index+begin[0].length
      const end=num<firstNo+4?new RegExp(`(?:^|\\n|\\s)${num+1}\\s*[.．]`).exec(qBlock.slice(after)):null
      const chunk=qBlock.slice(after,end?after+end.index:undefined)
      const matches=[...chunk.matchAll(/(?:\[([A-D])\]|(?:^|\s)([A-D])[.、)])\s*([\s\S]*?)(?=(?:\s*\[[A-D]\]|\s+[A-D][.、)])|$)/g)]
      if(matches.length<4)continue
      const optionStart=chunk.search(/\[[A-D]\]|(?:^|\s)[A-D][.、)]/)
      questions.push({id:uid('q'),number:num,prompt:cleanExtracted(chunk.slice(0,optionStart)),options:Object.fromEntries(matches.slice(0,4).map(m=>[m[1]||m[2],cleanExtracted(m[3])])),answer:'',type:'阅读题',explanation:'',evidence:'',trap:''})
    }
    if(passage.length>180&&questions.length>=3)found.push({id:uid('import'),year,paper,textNo:n,source:'我的导入',title:`${year} ${paper} · Text ${n}`,topic:'导入阅读',difficulty:3,passage,questions})
  }
  return found
}

function cleanExtracted(text){return text.replace(/\f/g,' ').replace(/\s*\n\s*/g,' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/g,'')}

function normalizeImportedJson(value,filename='JSON') {
  const list=Array.isArray(value)?value:value.exercises||[value]
  return list.filter(x=>x&&x.passage&&Array.isArray(x.questions)).map((x,index)=>({id:uid('import'),year:x.year||Number((filename.match(/20\d{2}/)||[])[0])||new Date().getFullYear(),paper:x.paper||'自定义',textNo:x.textNo||index+1,source:'我的导入',title:x.title||`${filename} · Text ${index+1}`,topic:x.topic||'导入阅读',difficulty:x.difficulty||3,passage:String(x.passage),questions:x.questions.map((q,i)=>({id:uid('q'),number:q.number||21+i,prompt:q.prompt||q.question||'',options:Array.isArray(q.options)?Object.fromEntries(q.options.slice(0,4).map((v,j)=>['ABCD'[j],v])):q.options||{},answer:String(q.answer||'').toUpperCase(),type:q.type||'阅读题',explanation:q.explanation||q.analysis||'',evidence:q.evidence||'',trap:q.trap||''}))}))
}

function importJsonExercises(value,filename){const list=normalizeImportedJson(value,filename);if(!list.length)throw new Error('JSON 中没有找到 passage 和 questions');reviewParsedExercises(list,filename)}

function reviewParsedExercises(list,filename) {
  importPayload=list
  modal(`<h3>识别完成：${list.length} 篇阅读</h3><p>${esc(filename)}。请检查标题与识别数量；可在下方粘贴答案，如“21C 22A 23B…”。未填答案也可保存，之后在题库补充。</p><div class="table-wrap"><table><thead><tr><th>导入</th><th>标题</th><th>题数</th></tr></thead><tbody>${list.map((e,i)=>`<tr><td><input class="import-check" type="checkbox" value="${i}" checked></td><td><input class="search import-title" data-i="${i}" value="${esc(e.title)}"></td><td>${e.questions.length}</td></tr>`).join('')}</tbody></table></div><div class="field" style="margin-top:14px"><label>答案表（可留空）</label><textarea id="import-keys" placeholder="21C 22A 23B 24D 25A ..."></textarea></div><div class="toolbar"><button class="btn primary" id="confirm-import">保存到我的题库</button><button class="btn" id="cancel-modal">取消</button></div>`)
  $('#cancel-modal').onclick=closeModal
  $('#confirm-import').onclick=()=>{
    const keys=parseAnswerKey($('#import-keys').value)
    $$('.import-title').forEach(x=>importPayload[Number(x.dataset.i)].title=x.value.trim()||importPayload[Number(x.dataset.i)].title)
    const selected=$$('.import-check:checked').map(x=>importPayload[Number(x.value)])
    selected.forEach(e=>e.questions.forEach(q=>{if(keys[q.number])q.answer=keys[q.number]}))
    db.customExercises.push(...selected);save();closeModal();toast(`已导入 ${selected.length} 篇阅读`);showPage('bank')
  }
}

function parseAnswerKey(text){const map={};for(const m of text.toUpperCase().matchAll(/(\d{1,3})\s*[-.:：]?\s*([A-D])/g))map[Number(m[1])]=m[2];return map}

function showRawEditor(text,filename) {
  modal(`<h3>没有自动识别出完整题目</h3><p>文件文字已经提取。你可以把一篇文章和 5 道题分别整理后再保存，或先使用下方文章创建器。</p><div class="field"><label>标题</label><input id="raw-title" value="${esc(filename.replace(/\.[^.]+$/,''))}"></div><div class="field"><label>文章正文</label><textarea id="raw-passage" style="min-height:240px">${esc(text.slice(0,30000))}</textarea></div><div class="toolbar"><button class="btn primary" id="raw-next">作为文章继续建题</button><button class="btn" id="cancel-modal">取消</button></div>`)
  $('#cancel-modal').onclick=closeModal
  $('#raw-next').onclick=()=>showManualCreator({title:$('#raw-title').value,passage:$('#raw-passage').value})
}

function showManualCreator(seed={}) {
  modal(`<h3>新建一篇阅读</h3><p>先保存文章与题干；答案和详细解析可在题库中继续补充。</p><div class="grid two"><div class="field"><label>标题</label><input id="new-title" value="${esc(seed.title||'我的阅读训练')}"></div><div class="field"><label>类型</label><select id="new-paper"><option>英语一</option><option>英语二</option><option>自定义</option></select></div></div><div class="field"><label>文章正文</label><textarea id="new-passage" style="min-height:180px">${esc(seed.passage||'')}</textarea></div><div class="field"><label>题目（每题格式：题干 | A选项 | B选项 | C选项 | D选项 | 答案）</label><textarea id="new-questions" style="min-height:170px" placeholder="What does the author suggest? | option A | option B | option C | option D | B"></textarea></div><div class="toolbar"><button class="btn primary" id="save-new">保存试题</button><button class="btn" id="cancel-modal">取消</button></div>`)
  $('#cancel-modal').onclick=closeModal
  $('#save-new').onclick=()=>{const passage=$('#new-passage').value.trim(),lines=$('#new-questions').value.split(/\n/).filter(Boolean);if(passage.length<100)return toast('文章正文至少需要 100 个字符');const qs=lines.map((line,i)=>line.split('|').map(x=>x.trim())).filter(x=>x.length>=5).map((x,i)=>({id:uid('q'),number:21+i,prompt:x[0],options:{A:x[1],B:x[2],C:x[3],D:x[4]},answer:(x[5]||'').toUpperCase(),type:'阅读题',explanation:'',evidence:'',trap:''}));if(!qs.length)return toast('至少按格式填写 1 道题');db.customExercises.push({id:uid('custom'),year:new Date().getFullYear(),paper:$('#new-paper').value,textNo:1,source:'我的导入',title:$('#new-title').value.trim()||'我的阅读训练',topic:'自建阅读',difficulty:3,passage,questions:qs});save();closeModal();toast('试题已保存');showPage('bank')}
}

function editAnswerKey(id) {
  const e=findExercise(id)
  const current=e.questions.filter(q=>q.answer).map(q=>`${q.number}${q.answer}`).join(' ')
  modal(`<h3>补充答案与基础解析</h3><p>${esc(e.title)}。答案格式示例：21C 22A 23B 24D 25A。</p><div class="field"><label>答案表</label><textarea id="key-value">${current}</textarea></div><div class="field"><label>统一备注（可选）</label><textarea id="key-note" placeholder="答案来源、校对日期等"></textarea></div><div class="toolbar"><button class="btn primary" id="save-key">保存答案</button><button class="btn" id="cancel-modal">取消</button></div>`)
  $('#cancel-modal').onclick=closeModal
  $('#save-key').onclick=()=>{const keys=parseAnswerKey($('#key-value').value);e.questions.forEach(q=>{if(keys[q.number])q.answer=keys[q.number]});save();closeModal();toast('答案已保存');renderBank()}
}

function exportBackup() {
  const blob=new Blob([JSON.stringify({app:'LR-考研英语真题特训（独家私人版）',exportedAt:new Date().toISOString(),data:db},null,2)],{type:'application/json'})
  download(blob,`LR英语特训_备份_${today()}.json`)
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importBackup(event){const file=event.target.files[0];if(!file)return;try{const value=JSON.parse(await file.text()),data=value.data||value;if(!data.attempts||!data.customExercises)throw new Error('不是有效的 LR 英语特训备份');if(confirm('恢复备份会替换本机现有记录，是否继续？')){db={...structuredClone(defaults),...data,plan:{...defaults.plan,...data.plan},settings:{...defaults.settings,...data.settings}};save();toast('备份已恢复');renderBank()}}catch(error){toast(error.message)}}

function showSettings() {
  modal(`<h3>显示与训练设置</h3><p>设置会自动保存在这台平板。</p><div class="field"><label>界面配色</label><select id="set-theme"><option value="cream" ${db.settings.theme==='cream'?'selected':''}>奶油紫（默认）</option><option value="mint" ${db.settings.theme==='mint'?'selected':''}>清新薄荷</option><option value="lilac" ${db.settings.theme==='lilac'?'selected':''}>轻柔丁香</option></select></div><div class="field"><label>文章字号：<span id="font-value">${db.settings.fontSize}px</span></label><input id="set-font" type="range" min="14" max="26" value="${db.settings.fontSize}"></div><label class="check-row"><input id="set-timer" type="checkbox" ${db.settings.timer?'checked':''}> 做题时显示计时器</label><div class="toolbar" style="margin-top:17px"><button class="btn primary" id="save-settings">保存设置</button><button class="btn" id="cancel-modal">取消</button></div><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><p>应用名称：LR-考研英语真题特训（独家私人版）<br>数据位置：仅本机存储，不上传试题和学习记录。</p>`)
  $('#set-font').oninput=e=>$('#font-value').textContent=`${e.target.value}px`
  $('#cancel-modal').onclick=closeModal
  $('#save-settings').onclick=()=>{db.settings.theme=$('#set-theme').value;db.settings.fontSize=Number($('#set-font').value);db.settings.timer=$('#set-timer').checked;save();closeModal();toast('设置已保存')}
}

showPage('dashboard')
