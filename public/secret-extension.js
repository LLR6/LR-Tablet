import { SUBJECTS, SETS, IMPORT_SAMPLE } from '/secret-data.js'

(() => {
  'use strict'

  const STORE_KEY = 'lr-secret-v23'
  const WRONG_KEY = 'lr-wrongbook-v23'
  const POMO_KEY = 'lr-pomodoro-v23'
  const DB_NAME = 'lr-secret-media-v23'
  const $ = (s, r=document) => r.querySelector(s)
  const $$ = (s, r=document) => [...r.querySelectorAll(s)]
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const uid = p => `${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  const today = () => new Date().toLocaleDateString('en-CA')
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v))
  const fmt = n => `${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`
  const clone = v => JSON.parse(JSON.stringify(v))

  const defaults = {customSets:[],attempts:[],favorites:{},createdAt:new Date().toISOString()}
  const wrongDefaults = {records:[],autoCollect:true}
  const pomoDefaults = {focus:25,short:5,long:15,mode:'focus',remaining:1500,running:false,cycles:0,tasks:[],activeTask:'',todaySessions:[]}

  let state = read(STORE_KEY, defaults)
  let wrong = read(WRONG_KEY, wrongDefaults)
  let pomo = read(POMO_KEY, pomoDefaults)
  let currentPage = ''
  let practice = null
  let pomoTimer = null
  let wrongFilter = 'all'

  function read(key, fallback){
    try{return {...clone(fallback),...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return clone(fallback)}
  }
  function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));localStorage.setItem(WRONG_KEY,JSON.stringify(wrong));localStorage.setItem(POMO_KEY,JSON.stringify(pomo))}
  function notify(msg){const e=$('#toast');if(!e)return; e.textContent=msg;e.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>e.classList.remove('show'),2300)}
  function top(msg){const e=$('#top-status');if(e)e.textContent=msg}
  function content(){return $('#content')}
  function modal(html){const box=$('#modal-box'),wrap=$('#modal');if(!box||!wrap)return;box.innerHTML=html;wrap.classList.add('show')}
  function closeModal(){$('#modal')?.classList.remove('show')}
  function allSets(){return [...SETS,...(state.customSets||[])]}
  function setActive(key){$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===key))}
  function pageHead(k,t,s,a=''){return `<div class="sec-head"><div><span>${k}</span><h2>${t}</h2><p>${s}</p></div><div class="sec-actions">${a}</div></div>`}
  function stat(icon,name,value,note,tone='purple'){return `<article class="sec-stat ${tone}"><i>${icon}</i><div><span>${name}</span><b>${value}</b><small>${note}</small></div></article>`}

  function boot(){
    const nav=$('.nav'),app=$('#app')
    if(!nav||!app){setTimeout(boot,100);return}
    if(!$('[data-page="secret"]')){
      const items=[['secret','秘','秘籍'],['wrongbook','错','错题'],['pomodoro','◷','番茄']]
      const bank=$('[data-page="bank"]',nav)
      items.forEach(([key,icon,text])=>{const b=document.createElement('button');b.className='nav-btn';b.dataset.page=key;b.innerHTML=`<span class="nav-icon">${icon}</span><span class="nav-text">${text}</span>`;b.onclick=()=>key==='secret'?renderSecret():key==='wrongbook'?renderWrongbook():renderPomodoro();bank?nav.insertBefore(b,bank):nav.appendChild(b)})
    }
    const brand=$('.brand h1');if(brand)brand.textContent='LR 考研秘籍'
    const small=$('.brand small');if(small)small.textContent='私人独享至尊版'
    observeReading()
    startPomoClock()
  }

  function renderSecret(){
    currentPage='secret';practice=null;setActive('secret')
    const sets=allSets(),done=state.attempts.length,questionCount=sets.reduce((n,s)=>n+(s.items?.length||Object.keys(s.answers||{}).length),0)
    top(`专项题库 ${sets.length} 套 · ${questionCount} 个练习点`)
    content().innerHTML=`<div class="sec-page">${pageHead('LR SECRET','考研独门秘籍','英语专项、专业课和政治分区训练；题库可继续导入。',`<button class="btn sec-primary" id="sec-import">＋ 导入题库</button>`)}
      <section class="sec-hero"><div><span class="sec-pill">全科训练中心</span><h3>把不同科目的练习，收进同一个安静的学习空间。</h3><p>真题考点改编与原创模拟均明确标注；答错会自动进入错题本，也可以主动收藏。</p><div class="sec-toolbar"><button class="btn sec-white" id="sec-random">随机练一组</button><button class="btn sec-glass" id="sec-to-wrong">复盘错题</button></div></div><div class="sec-hero-orb"><b>${done}</b><span>累计训练</span></div></section>
      <div class="sec-stat-grid">${stat('▤','题库套数',sets.length,'内置与我的导入')}${stat('✓','已完成',done,'专项训练记录','mint')}${stat('错','待复盘',wrong.records.filter(x=>!x.mastered).length,'自动与主动收录','peach')}${stat('◷','今日番茄',pomo.todaySessions.filter(x=>x.date===today()).length,'专注完成次数','rose')}</div>
      <div class="sec-subject-grid">${SUBJECTS.map(s=>{const count=sets.filter(x=>x.subject===s.key).length;return `<button class="sec-subject" data-subject="${s.key}"><i>${s.icon}</i><div><b>${s.title}</b><span>${s.desc}</span></div><em>${count} 套</em></button>`}).join('')}</div>
      <article class="sec-card sec-recent"><div class="sec-card-head"><div><h3>最近题库</h3><p>点击进入套题列表</p></div><button class="btn" id="sec-manage">题库管理</button></div><div class="sec-set-list">${sets.slice(0,8).map(setCard).join('')}</div></article>
    </div>`
    bindSecretHome()
  }

  function setCard(s){const last=[...state.attempts].reverse().find(a=>a.setId===s.id);return `<article class="sec-set-card"><div class="sec-set-icon">${SUBJECTS.find(x=>x.key===s.subject)?.icon||'题'}</div><div><h3>${esc(s.title)}</h3><p>${esc(s.subject)} · ${s.items?.length||Object.keys(s.answers||{}).length} 题 · ${esc(s.source||'我的导入')}</p>${last?`<span class="sec-last">上次 ${last.score}%</span>`:''}</div><button class="btn sec-start" data-set="${s.id}">${last?'再练一次':'开始练习'}</button></article>`}
  function bindSecretHome(){
    $$('.sec-subject').forEach(b=>b.onclick=()=>renderSubject(b.dataset.subject))
    $$('.sec-start').forEach(b=>b.onclick=()=>startSet(b.dataset.set))
    $('#sec-random').onclick=()=>{const a=allSets();if(a.length)startSet(a[Math.floor(Math.random()*a.length)].id)}
    $('#sec-to-wrong').onclick=renderWrongbook
    $('#sec-import').onclick=showImport
    $('#sec-manage').onclick=renderManage
  }

  function renderSubject(subject){
    currentPage='subject';setActive('secret');const sets=allSets().filter(x=>x.subject===subject),meta=SUBJECTS.find(x=>x.key===subject)
    top(`${meta?.title||subject} · ${sets.length} 套`)
    content().innerHTML=`<div class="sec-page">${pageHead('SUBJECT BANK',meta?.title||subject,meta?.desc||'',`<button class="btn" id="sec-back">← 返回秘籍</button>`)}<div class="sec-set-list">${sets.length?sets.map(setCard).join(''):'<div class="sec-empty">暂时没有题库，可从JSON文件导入。</div>'}</div></div>`
    $('#sec-back').onclick=renderSecret;$$('.sec-start').forEach(b=>b.onclick=()=>startSet(b.dataset.set))
  }

  function startSet(id){
    const set=allSets().find(x=>x.id===id);if(!set)return notify('没有找到这套题')
    practice={set,answers:{},submitted:false,index:0,revealed:{}}
    setActive('secret')
    if(set.type==='mcq')renderMCQ();else if(set.type==='seven')renderSeven();else renderWritten()
  }

  function practiceHeader(set,progress){return `<header class="sec-practice-head"><button class="btn icon" id="sec-practice-back">←</button><div><b>${esc(set.title)}</b><span>${esc(set.subject)} · ${esc(set.source||'题库')}</span></div><div class="sec-progress"><i style="width:${progress}%"></i></div><button class="btn sec-add-current">＋错题</button></header>`}

  function renderMCQ(){
    const {set,submitted}=practice,total=set.items.length,answered=Object.keys(practice.answers).length
    top(`作答进度 ${answered}/${total}`)
    content().innerHTML=`<div class="sec-practice">${practiceHeader(set,Math.round(answered/total*100))}<main class="sec-question-scroll">${submitted?scoreBanner(set):''}${set.items.map((q,i)=>mcqCard(q,i)).join('')}</main><footer class="sec-practice-foot">${submitted?'<button class="btn" id="sec-finish">返回题库</button><button class="btn sec-primary" id="sec-repeat">再做一遍</button>':`<button class="btn" id="sec-save-exit">保存退出</button><button class="btn sec-primary" id="sec-submit" ${answered<total?'disabled':''}>交卷并看解析</button>`}</footer></div>`
    bindPracticeCommon();$$('.sec-option').forEach(b=>b.onclick=()=>{practice.answers[b.dataset.q]=b.dataset.a;renderMCQ()});$('#sec-submit')?.addEventListener('click',submitMCQ);$('#sec-finish')?.addEventListener('click',()=>renderSubject(set.subject));$('#sec-repeat')?.addEventListener('click',()=>startSet(set.id));$('#sec-save-exit')?.addEventListener('click',()=>renderSubject(set.subject))
  }
  function mcqCard(q,i){const ans=practice.answers[q.id],sub=practice.submitted;return `<article class="sec-q-card" data-item="${q.id}"><div class="sec-q-head"><span class="sec-pill">${esc(q.topic||'选择题')}</span><button class="sec-heart" data-add="${q.id}">＋错题</button></div><h3>${i+1}. ${esc(q.stem)}</h3><div class="sec-options">${Object.entries(q.options).map(([k,v])=>{let c=ans===k?'selected':'';if(sub)c=k===q.answer?'correct':ans===k?'wrong':'';return `<button class="sec-option ${c}" data-q="${q.id}" data-a="${k}" ${sub?'disabled':''}><b>${k}</b><span>${esc(v)}</span></button>`}).join('')}</div>${sub?`<div class="sec-analysis"><b>答案 ${q.answer} · ${ans===q.answer?'回答正确':'你的答案 '+(ans||'未答')}</b><p>${esc(q.explanation||'暂无解析')}</p></div>`:''}</article>`}
  function submitMCQ(){
    const set=practice.set;practice.submitted=true;let correct=0
    set.items.forEach(q=>{if(practice.answers[q.id]===q.answer)correct++;else if(wrong.autoCollect)addWrongFromQuestion(set,q,practice.answers[q.id],'自动收录')})
    state.attempts.push({id:uid('attempt'),setId:set.id,subject:set.subject,date:today(),score:Math.round(correct/set.items.length*100),correct,total:set.items.length});save();renderMCQ();notify(`完成：${correct}/${set.items.length}`)
  }
  function scoreBanner(set){const a=state.attempts[state.attempts.length-1];return `<div class="sec-score"><b>${a?.score||0}%</b><div><h3>本组完成</h3><p>答对 ${a?.correct||0}/${a?.total||set.items.length}，错题已自动整理。</p></div></div>`}

  function renderSeven(){
    const set=practice.set,sub=practice.submitted,nums=Object.keys(set.answers),answered=Object.keys(practice.answers).length
    top(`七选五作答 ${answered}/${nums.length}`)
    const parts=set.passage.split(/\[\[(\d+)\]\]/g)
    const passage=parts.map((p,i)=>i%2?`<select class="sec-gap ${sub?(practice.answers[p]===set.answers[p]?'correct':'wrong'):''}" data-gap="${p}" ${sub?'disabled':''}><option value="">(${p})</option>${Object.keys(set.options).map(k=>`<option value="${k}" ${practice.answers[p]===k?'selected':''}>${k}</option>`).join('')}</select>`:esc(p)).join('')
    content().innerHTML=`<div class="sec-practice">${practiceHeader(set,Math.round(answered/nums.length*100))}<main class="sec-seven-grid"><section class="sec-seven-passage"><span class="sec-pill">文章</span><p>${passage}</p></section><section class="sec-seven-options"><span class="sec-pill">备选项</span>${Object.entries(set.options).map(([k,v])=>`<div><b>${k}</b><p>${esc(v)}</p></div>`).join('')}${sub?`<article class="sec-seven-analysis"><h3>逐空解析</h3>${nums.map(n=>`<p><b>${n}. ${set.answers[n]}</b> ${esc(set.explanations[n])}</p>`).join('')}</article>`:''}</section></main><footer class="sec-practice-foot">${sub?'<button class="btn" id="sec-finish">返回题库</button><button class="btn sec-primary" id="sec-repeat">再做一遍</button>':`<button class="btn" id="sec-save-exit">保存退出</button><button class="btn sec-primary" id="sec-seven-submit" ${answered<nums.length?'disabled':''}>交卷并看解析</button>`}</footer></div>`
    bindPracticeCommon();$$('.sec-gap').forEach(s=>s.onchange=()=>{practice.answers[s.dataset.gap]=s.value;renderSeven()});$('#sec-seven-submit')?.addEventListener('click',()=>{practice.submitted=true;let c=0;nums.forEach(n=>{if(practice.answers[n]===set.answers[n])c++;else if(wrong.autoCollect)addWrong({subject:'英语七选五',title:set.title,stem:`第${n}空：${set.passage}`,myAnswer:practice.answers[n],answer:set.answers[n],analysis:set.explanations[n],source:'自动收录',sourceKey:`${set.id}-${n}`})});state.attempts.push({id:uid('attempt'),setId:set.id,subject:set.subject,date:today(),score:Math.round(c/nums.length*100),correct:c,total:nums.length});save();renderSeven();notify(`完成：${c}/${nums.length}`)});$('#sec-finish')?.addEventListener('click',()=>renderSubject(set.subject));$('#sec-repeat')?.addEventListener('click',()=>startSet(set.id));$('#sec-save-exit')?.addEventListener('click',()=>renderSubject(set.subject))
  }

  function renderWritten(){
    const set=practice.set,item=set.items[practice.index],rev=!!practice.revealed[item.id],total=set.items.length
    top(`${set.subject} ${practice.index+1}/${total}`)
    content().innerHTML=`<div class="sec-practice">${practiceHeader(set,Math.round(practice.index/total*100))}<main class="sec-written"><article><span class="sec-pill">${esc(set.subject)}</span><h2>${esc(item.text)}</h2><textarea id="sec-my-text" placeholder="先写下自己的理解或译文……"></textarea>${rev?`<div class="sec-analysis big"><h3>参考答案</h3><p>${esc(item.reference)}</p><h3>结构分析</h3><p>${esc(item.analysis)}</p></div>`:'<button class="btn sec-primary" id="sec-reveal">显示参考与解析</button>'}</article>${rev?`<section class="sec-rating"><p>这句话掌握得怎么样？</p><div>${[['1','没看懂'],['2','有点模糊'],['3','基本掌握'],['4','很熟练']].map(([n,t])=>`<button data-rate="${n}"><b>${n}</b><span>${t}</span></button>`).join('')}</div></section>`:''}</main></div>`
    bindPracticeCommon();$('#sec-reveal')?.addEventListener('click',()=>{practice.revealed[item.id]=true;renderWritten()});$$('[data-rate]').forEach(b=>b.onclick=()=>{const rate=Number(b.dataset.rate);if(rate<3&&wrong.autoCollect)addWrong({subject:set.subject,title:set.title,stem:item.text,myAnswer:$('#sec-my-text')?.value||'',answer:item.reference,analysis:item.analysis,source:'自动收录',sourceKey:item.id});state.attempts.push({id:uid('attempt'),setId:set.id,subject:set.subject,date:today(),score:rate*25,correct:rate>=3?1:0,total:1});save();practice.index++;if(practice.index>=total)renderSubject(set.subject);else renderWritten()})
  }

  function bindPracticeCommon(){
    $('#sec-practice-back').onclick=()=>renderSubject(practice.set.subject)
    $('.sec-add-current').onclick=()=>{const set=practice.set;if(set.type==='mcq'){const q=set.items[0];addWrongFromQuestion(set,q,practice.answers[q.id],'主动加入')}else addWrong({subject:set.subject,title:set.title,stem:set.passage||set.items[practice.index]?.text||set.title,answer:set.items?.[practice.index]?.reference||'',analysis:'',source:'主动加入',sourceKey:`active-${set.id}-${practice.index}`})}
    $$('[data-add]').forEach(b=>b.onclick=()=>{const q=practice.set.items.find(x=>x.id===b.dataset.add);addWrongFromQuestion(practice.set,q,practice.answers[q.id],'主动加入')})
  }

  function addWrongFromQuestion(set,q,myAnswer,source){addWrong({subject:set.subject,title:set.title,stem:q.stem,options:q.options,myAnswer:myAnswer||'',answer:q.answer,analysis:q.explanation||'',source,sourceKey:q.id})}
  function addWrong(record){
    const old=wrong.records.find(x=>x.sourceKey&&x.sourceKey===record.sourceKey&&!x.mastered)
    if(old){old.wrongCount=(old.wrongCount||1)+1;old.updatedAt=new Date().toISOString();if(record.myAnswer)old.myAnswer=record.myAnswer;save();return notify('这道题已在错题本，错误次数已累计')}
    wrong.records.unshift({id:uid('wrong'),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),wrongCount:1,mastered:false,notes:'',tags:[],imageIds:[],...record});save();notify('已加入错题本')
  }

  function renderWrongbook(){
    currentPage='wrongbook';setActive('wrongbook');const list=filteredWrong(),pending=wrong.records.filter(x=>!x.mastered).length
    top(`错题本 ${pending} 道待复盘`)
    content().innerHTML=`<div class="sec-page">${pageHead('WRONG BOOK','全能错题本','答错自动收录，也可手动输入或拍照保存。',`<button class="btn sec-primary" id="wrong-new">＋ 新建错题</button><button class="btn" id="wrong-photo">📷 拍照上传</button>`)}
      <div class="sec-stat-grid">${stat('错','待复盘',pending,'需要再次攻克')}${stat('↻','自动收录',wrong.records.filter(x=>x.source==='自动收录').length,'来自作答结果','peach')}${stat('📷','照片错题',wrong.records.filter(x=>x.imageIds?.length).length,'相机与相册','mint')}${stat('✓','已经攻克',wrong.records.filter(x=>x.mastered).length,'可以重新复盘','rose')}</div>
      <div class="wrong-controls"><div class="sec-segmented">${[['all','全部'],['pending','待复盘'],['auto','自动'],['photo','照片'],['done','已攻克']].map(([k,t])=>`<button data-wfilter="${k}" class="${wrongFilter===k?'active':''}">${t}</button>`).join('')}</div><input id="wrong-search" placeholder="搜索科目、题干或标签"></div>
      <div class="wrong-list" id="wrong-list">${list.length?list.map(wrongCard).join(''):'<div class="sec-empty">这里暂时没有错题。做题答错后会自动出现。</div>'}</div></div>`
    $$('[data-wfilter]').forEach(b=>b.onclick=()=>{wrongFilter=b.dataset.wfilter;renderWrongbook()});$('#wrong-search').oninput=e=>{renderWrongRows(e.target.value)};$('#wrong-new').onclick=()=>showWrongEditor();$('#wrong-photo').onclick=()=>showWrongEditor(null,true);bindWrongCards();hydrateImages()
  }
  function filteredWrong(q=''){let a=wrong.records;if(wrongFilter==='pending')a=a.filter(x=>!x.mastered);if(wrongFilter==='done')a=a.filter(x=>x.mastered);if(wrongFilter==='auto')a=a.filter(x=>x.source==='自动收录');if(wrongFilter==='photo')a=a.filter(x=>x.imageIds?.length);q=q.trim().toLowerCase();if(q)a=a.filter(x=>`${x.subject} ${x.title} ${x.stem} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q));return a}
  function renderWrongRows(q){const box=$('#wrong-list'),a=filteredWrong(q);box.innerHTML=a.length?a.map(wrongCard).join(''):'<div class="sec-empty">没有匹配错题。</div>';bindWrongCards();hydrateImages()}
  function wrongCard(x){return `<article class="wrong-card ${x.mastered?'mastered':''}" data-wrong="${x.id}"><div class="wrong-head"><span class="sec-pill">${esc(x.subject||'其他')}</span><span>${esc(x.source||'手动录入')} · 错 ${x.wrongCount||1} 次</span></div><h3>${esc(x.title||'我的错题')}</h3><p class="wrong-stem">${esc(x.stem||'照片错题')}</p>${x.options?`<div class="wrong-options">${Object.entries(x.options).map(([k,v])=>`<span><b>${k}</b>${esc(v)}</span>`).join('')}</div>`:''}<div class="wrong-answer"><p><b>我的答案：</b>${esc(x.myAnswer||'未记录')}</p><p><b>正确答案：</b>${esc(x.answer||'待补充')}</p>${x.analysis?`<p><b>解析：</b>${esc(x.analysis)}</p>`:''}${x.notes?`<p><b>我的笔记：</b>${esc(x.notes)}</p>`:''}</div><div class="wrong-images">${(x.imageIds||[]).map(id=>`<img data-image-id="${id}" alt="错题照片">`).join('')}</div><div class="sec-toolbar"><button class="btn wrong-edit" data-id="${x.id}">编辑</button><button class="btn wrong-master" data-id="${x.id}">${x.mastered?'重新复盘':'标记攻克'}</button><button class="btn danger wrong-delete" data-id="${x.id}">删除</button></div></article>`}
  function bindWrongCards(){$$('.wrong-edit').forEach(b=>b.onclick=()=>showWrongEditor(wrong.records.find(x=>x.id===b.dataset.id)));$$('.wrong-master').forEach(b=>b.onclick=()=>{const x=wrong.records.find(r=>r.id===b.dataset.id);x.mastered=!x.mastered;x.updatedAt=new Date().toISOString();save();renderWrongbook()});$$('.wrong-delete').forEach(b=>b.onclick=async()=>{if(!confirm('删除这道错题？'))return;const x=wrong.records.find(r=>r.id===b.dataset.id);for(const id of x.imageIds||[])await mediaDelete(id);wrong.records=wrong.records.filter(r=>r.id!==b.dataset.id);save();renderWrongbook()})}

  function showWrongEditor(seed=null,photo=false){
    const x=seed||{subject:'其他',title:'',stem:'',myAnswer:'',answer:'',analysis:'',notes:'',tags:[],imageIds:[]}
    modal(`<h3>${seed?'编辑错题':photo?'拍照录入错题':'手动新建错题'}</h3><p>照片只保存在本机，不上传网络。</p><div class="sec-form-grid"><label>科目<select id="we-subject">${['英语阅读','英语七选五','考研翻译','长难句','408','315','415','政治','数学','其他'].map(s=>`<option ${x.subject===s?'selected':''}>${s}</option>`).join('')}</select></label><label>标题<input id="we-title" value="${esc(x.title)}" placeholder="章节或题目名称"></label></div><label class="sec-field">题干或知识点<textarea id="we-stem">${esc(x.stem)}</textarea></label><div class="sec-form-grid"><label>我的答案<textarea id="we-my">${esc(x.myAnswer)}</textarea></label><label>正确答案<textarea id="we-answer">${esc(x.answer)}</textarea></label></div><label class="sec-field">正确思路 / 错因 / 解析<textarea id="we-analysis">${esc(x.analysis||x.notes)}</textarea></label><label class="sec-field">标签<input id="we-tags" value="${esc((x.tags||[]).join(' '))}" placeholder="空格分隔，如 极限 粗心"></label><div class="wrong-photo-box"><input id="we-photo" type="file" accept="image/*" capture="environment" multiple><b>📷 点击拍照或从相册选择</b><span>最多8张，保存前自动压缩</span></div><div id="we-photo-status"></div><div class="sec-toolbar"><button class="btn sec-primary" id="we-save">保存错题</button><button class="btn" id="we-cancel">取消</button></div>`)
    let newImages=[];$('#we-photo').onchange=async e=>{const files=[...e.target.files].slice(0,Math.max(0,8-(x.imageIds?.length||0)));$('#we-photo-status').textContent='正在压缩图片…';for(const f of files){const data=await compressImage(f);const id=uid('img');await mediaPut(id,data);newImages.push(id)}$('#we-photo-status').textContent=`已加入 ${newImages.length} 张图片`};$('#we-cancel').onclick=closeModal;$('#we-save').onclick=()=>{const record={subject:$('#we-subject').value,title:$('#we-title').value.trim()||'我的错题',stem:$('#we-stem').value.trim(),myAnswer:$('#we-my').value.trim(),answer:$('#we-answer').value.trim(),analysis:$('#we-analysis').value.trim(),notes:$('#we-analysis').value.trim(),tags:$('#we-tags').value.trim().split(/\s+/).filter(Boolean),imageIds:[...(x.imageIds||[]),...newImages],updatedAt:new Date().toISOString()};if(seed)Object.assign(seed,record);else wrong.records.unshift({id:uid('wrong'),createdAt:new Date().toISOString(),wrongCount:1,mastered:false,source:photo?'照片录入':'手动录入',...record});save();closeModal();renderWrongbook();notify('错题已保存')}
  }

  async function compressImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.76))};img.onerror=reject;img.src=url})}
  function mediaDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function mediaPut(id,data){const db=await mediaDB();await new Promise((res,rej)=>{const t=db.transaction('images','readwrite');t.objectStore('images').put(data,id);t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close()}
  async function mediaGet(id){const db=await mediaDB();const v=await new Promise((res,rej)=>{const r=db.transaction('images').objectStore('images').get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();return v}
  async function mediaDelete(id){const db=await mediaDB();await new Promise((res,rej)=>{const t=db.transaction('images','readwrite');t.objectStore('images').delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close()}
  async function hydrateImages(){for(const img of $$('[data-image-id]')){try{img.src=await mediaGet(img.dataset.imageId)}catch{}}}

  function renderManage(){
    currentPage='manage';setActive('secret');const custom=state.customSets||[]
    top(`我的导入 ${custom.length} 套`)
    content().innerHTML=`<div class="sec-page">${pageHead('QUESTION BANK','统一题库管理','使用标准JSON导入，后续你发来的PDF或Word可以先转换成这一格式。',`<button class="btn sec-primary" id="manage-import">＋ 导入JSON</button><button class="btn" id="manage-template">下载模板</button>`)}<article class="sec-card"><h3>已导入题库</h3>${custom.length?`<div class="sec-table">${custom.map(s=>`<div><b>${esc(s.title)}</b><span>${esc(s.subject)} · ${s.items?.length||0}题</span><button class="btn danger manage-delete" data-id="${s.id}">删除</button></div>`).join('')}</div>`:'<div class="sec-empty">还没有导入题库。</div>'}</article><button class="btn" id="manage-back">← 返回秘籍</button></div>`
    $('#manage-import').onclick=showImport;$('#manage-template').onclick=downloadTemplate;$('#manage-back').onclick=renderSecret;$$('.manage-delete').forEach(b=>b.onclick=()=>{state.customSets=custom.filter(x=>x.id!==b.dataset.id);save();renderManage()})
  }
  function showImport(){modal(`<h3>导入LR标准题库</h3><p>支持JSON文件。题库可包含408、315、415、政治、七选五、翻译和长难句。</p><div class="wrong-photo-box"><input id="sec-json" type="file" accept=".json,application/json"><b>点击选择JSON题库</b><span>导入后只保存在本机</span></div><div id="sec-import-status"></div><div class="sec-toolbar"><button class="btn" id="sec-template">下载模板</button><button class="btn" id="sec-import-close">取消</button></div>`);$('#sec-import-close').onclick=closeModal;$('#sec-template').onclick=downloadTemplate;$('#sec-json').onchange=async e=>{try{const v=JSON.parse(await e.target.files[0].text()),sets=Array.isArray(v)?v:v.sets;if(!Array.isArray(sets)||!sets.length)throw Error('没有找到sets数组');const valid=sets.filter(s=>s.id&&s.subject&&s.type&&s.title&&(Array.isArray(s.items)||s.type==='seven')).map(s=>({...s,source:s.source||'我的导入'}));if(!valid.length)throw Error('题库结构不符合模板');state.customSets.push(...valid);save();closeModal();renderManage();notify(`成功导入 ${valid.length} 套题库`)}catch(err){$('#sec-import-status').textContent=`导入失败：${err.message}`}}}
  function downloadTemplate(){const blob=new Blob([JSON.stringify(IMPORT_SAMPLE,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='LR题库导入模板.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

  function renderPomodoro(){
    currentPage='pomodoro';setActive('pomodoro');top(`番茄钟 · ${modeName(pomo.mode)} ${fmt(pomo.remaining)}`)
    const todayList=pomo.todaySessions.filter(x=>x.date===today()),mins=todayList.reduce((n,x)=>n+x.minutes,0)
    content().innerHTML=`<div class="sec-page pomo-page">${pageHead('FOCUS TIMER','番茄专注','像番茄Todo一样，把大任务切成可以开始的一小段。',`<button class="btn" id="pomo-settings">⚙ 设置</button>`)}<section class="pomo-hero"><div class="pomo-mode">${[['focus','专注'],['short','短休'],['long','长休']].map(([k,t])=>`<button data-pmode="${k}" class="${pomo.mode===k?'active':''}">${t}</button>`).join('')}</div><div class="pomo-clock"><span>${modeName(pomo.mode)}</span><b id="pomo-big-time">${fmt(pomo.remaining)}</b><p>${pomo.activeTask?`当前任务：${esc(pomo.tasks.find(x=>x.id===pomo.activeTask)?.title||'')}`:'选择一个任务后开始专注'}</p></div><div class="pomo-actions"><button class="btn sec-primary" id="pomo-toggle">${pomo.running?'暂停':'开始'}</button><button class="btn" id="pomo-reset">重置</button><button class="btn" id="pomo-skip">跳过</button></div></section><div class="sec-stat-grid">${stat('🍅','今日番茄',todayList.length,'完成的专注阶段')}${stat('◷','今日专注',mins+' 分钟','只统计完成阶段','mint')}${stat('✓','已完成任务',pomo.tasks.filter(x=>x.done).length,'今日任务清单','peach')}${stat('↻','当前轮次',`${pomo.cycles%4}/4`,'四轮后长休','rose')}</div><article class="sec-card pomo-tasks"><div class="sec-card-head"><div><h3>专注任务</h3><p>点击任务设为当前目标</p></div><button class="btn sec-primary" id="pomo-add">＋ 添加任务</button></div><div>${pomo.tasks.length?pomo.tasks.map(t=>`<div class="pomo-task ${t.id===pomo.activeTask?'active':''} ${t.done?'done':''}" data-task="${t.id}"><button class="pomo-check" data-done="${t.id}">${t.done?'✓':''}</button><div><b>${esc(t.title)}</b><span>${t.pomodoros||0} 个番茄</span></div><button class="pomo-remove" data-remove="${t.id}">×</button></div>`).join(''):'<div class="sec-empty">添加一个今天最想推进的任务。</div>'}</div></article></div>`
    bindPomo()
  }
  function modeName(m){return m==='focus'?'专注':m==='short'?'短休息':'长休息'}
  function duration(m){return (m==='focus'?pomo.focus:m==='short'?pomo.short:pomo.long)*60}
  function bindPomo(){$$('[data-pmode]').forEach(b=>b.onclick=()=>{pomo.mode=b.dataset.pmode;pomo.remaining=duration(pomo.mode);pomo.running=false;save();renderPomodoro()});$('#pomo-toggle').onclick=()=>{pomo.running=!pomo.running;save();renderPomodoro()};$('#pomo-reset').onclick=()=>{pomo.running=false;pomo.remaining=duration(pomo.mode);save();renderPomodoro()};$('#pomo-skip').onclick=completePomo;$('#pomo-settings').onclick=showPomoSettings;$('#pomo-add').onclick=()=>modal(`<h3>添加专注任务</h3><label class="sec-field">任务名称<input id="pomo-title" placeholder="例如：数据结构链表强化"></label><div class="sec-toolbar"><button class="btn sec-primary" id="pomo-save-task">保存</button><button class="btn" id="pomo-cancel">取消</button></div>`);setTimeout(()=>{if($('#pomo-save-task')){$('#pomo-cancel').onclick=closeModal;$('#pomo-save-task').onclick=()=>{const title=$('#pomo-title').value.trim();if(!title)return;const id=uid('task');pomo.tasks.push({id,title,done:false,pomodoros:0});pomo.activeTask=id;save();closeModal();renderPomodoro()}}},0);$$('[data-task]').forEach(b=>b.onclick=e=>{if(e.target.closest('button'))return;pomo.activeTask=b.dataset.task;save();renderPomodoro()});$$('[data-done]').forEach(b=>b.onclick=()=>{const t=pomo.tasks.find(x=>x.id===b.dataset.done);t.done=!t.done;save();renderPomodoro()});$$('[data-remove]').forEach(b=>b.onclick=()=>{pomo.tasks=pomo.tasks.filter(x=>x.id!==b.dataset.remove);if(pomo.activeTask===b.dataset.remove)pomo.activeTask='';save();renderPomodoro()})}
  function showPomoSettings(){modal(`<h3>番茄钟设置</h3><div class="sec-form-grid"><label>专注分钟<input id="ps-focus" type="number" min="1" max="90" value="${pomo.focus}"></label><label>短休分钟<input id="ps-short" type="number" min="1" max="30" value="${pomo.short}"></label><label>长休分钟<input id="ps-long" type="number" min="1" max="60" value="${pomo.long}"></label></div><div class="sec-toolbar"><button class="btn sec-primary" id="ps-save">保存</button><button class="btn" id="ps-cancel">取消</button></div>`);$('#ps-cancel').onclick=closeModal;$('#ps-save').onclick=()=>{pomo.focus=clamp(Number($('#ps-focus').value)||25,1,90);pomo.short=clamp(Number($('#ps-short').value)||5,1,30);pomo.long=clamp(Number($('#ps-long').value)||15,1,60);pomo.remaining=duration(pomo.mode);pomo.running=false;save();closeModal();renderPomodoro()}}
  function startPomoClock(){if(pomoTimer)return;pomoTimer=setInterval(()=>{if(!pomo.running)return;pomo.remaining--;if(pomo.remaining<=0)completePomo();save();const big=$('#pomo-big-time');if(big)big.textContent=fmt(pomo.remaining);const topEl=$('#top-status');if(currentPage==='pomodoro'&&topEl)topEl.textContent=`番茄钟 · ${modeName(pomo.mode)} ${fmt(pomo.remaining)}`},1000)}
  function completePomo(){const was=pomo.mode;if(was==='focus'){pomo.cycles++;pomo.todaySessions.push({date:today(),minutes:pomo.focus,at:Date.now()});const t=pomo.tasks.find(x=>x.id===pomo.activeTask);if(t)t.pomodoros=(t.pomodoros||0)+1;pomo.mode=pomo.cycles%4===0?'long':'short'}else pomo.mode='focus';pomo.remaining=duration(pomo.mode);pomo.running=false;save();try{navigator.vibrate?.([180,80,180])}catch{}notify(was==='focus'?'本轮专注完成，休息一下吧':'休息结束，准备下一轮');if(currentPage==='pomodoro')renderPomodoro()}

  function observeReading(){
    const box=content();if(!box)return
    new MutationObserver(()=>{if(!box.querySelector('.q-card'))return;const title=$('.practice-title h2')?.textContent||'考研英语阅读';$$('.q-card').forEach((card,i)=>{if(!card.dataset.wrongReady){card.dataset.wrongReady='1';const head=$('.q-head',card);if(head){const b=document.createElement('button');b.className='sec-heart reading-add-wrong';b.textContent='＋错题';b.onclick=()=>captureReading(card,title,`reading-${title}-${i}`,false);head.appendChild(b)}}const analysis=$('.analysis-box',card);if(analysis&&!card.dataset.wrongChecked){card.dataset.wrongChecked='1';const h=analysis.querySelector('h4')?.textContent||'',answer=(h.match(/答案\s*([A-D])/i)||[])[1],mine=(h.match(/你的答案\s*([A-D])/i)||[])[1];if(answer&&mine&&answer!==mine&&wrong.autoCollect)captureReading(card,title,`reading-${title}-${i}`,true)}})}).observe(box,{childList:true,subtree:true})
  }
  function captureReading(card,title,key,auto){const stem=$('.q-title',card)?.textContent||'',options={};$$('.option',card).forEach(o=>{const k=$('.letter',o)?.textContent?.trim(),v=$('.option-text',o)?.textContent?.trim();if(k)options[k]=v});const h=$('.analysis-box h4',card)?.textContent||'',answer=(h.match(/答案\s*([A-D])/i)||[])[1]||'',mine=(h.match(/你的答案\s*([A-D])/i)||[])[1]||'',analysis=$('.analysis-box p',card)?.textContent||'';addWrong({subject:'英语阅读',title,stem,options,myAnswer:mine,answer,analysis,source:auto?'自动收录':'主动加入',sourceKey:key})}

  window.addEventListener('error',e=>console.warn('LR extension error',e.error||e.message))
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()
})()
