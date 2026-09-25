(() => {
  'use strict'

  const APP_VERSION = '2.4.0'
  const SECRET_KEY = 'lr-secret-v23'
  const POMO_KEY = 'lr-pomodoro-v23'
  const SYNC_KEY = 'lr-question-cloud-v24'
  const RETURN_KEY = 'lr-v24-return-page'
  const CLOUD_SOURCE = 'lr-github-bank-v1'
  const MANIFEST_URL = 'https://raw.githubusercontent.com/LLR6/LR-Tablet/lr-question-bank/question-bank/manifest.json'
  const $ = (s, r=document) => r.querySelector(s)
  const $$ = (s, r=document) => [...r.querySelectorAll(s)]
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  let syncing = false
  let patchQueued = false

  function readJson(key, fallback={}) {
    try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') } }
    catch { return { ...fallback } }
  }

  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
  function cloudSets(secret=readJson(SECRET_KEY,{customSets:[]})) { return (secret.customSets || []).filter(s => s.__lrCloudSource === CLOUD_SOURCE) }
  function localSets(secret=readJson(SECRET_KEY,{customSets:[]})) { return (secret.customSets || []).filter(s => s.__lrCloudSource !== CLOUD_SOURCE) }
  function syncInfo() { return readJson(SYNC_KEY,{version:'未同步',updatedAt:'',lastCheckedAt:'',packages:[],backup:null,lastError:''}) }
  function fmtDate(value) { if(!value)return '尚未同步'; try{return new Date(value).toLocaleString('zh-CN',{hour12:false})}catch{return value} }
  function countItems(sets) { return sets.reduce((n,s)=>n+(Array.isArray(s.items)?s.items.length:Object.keys(s.answers||{}).length),0) }
  function toast(message) {
    const old=$('.cloud-update-toast');if(old)old.remove()
    const box=document.createElement('div');box.className='cloud-update-toast';box.textContent=message;document.body.appendChild(box)
    setTimeout(()=>box.remove(),3200)
  }

  function snapshotScroll(target) {
    const selectors=['#content','.sec-question-scroll','.sec-seven-passage','.sec-seven-options','.sec-written']
    return {
      values: selectors.map(selector=>{const el=$(selector);return el?{selector,top:el.scrollTop,left:el.scrollLeft}:null}).filter(Boolean),
      item: target?.closest?.('[data-item]')?.dataset?.item || ''
    }
  }

  function restoreScroll(snapshot) {
    const run=()=>{
      snapshot.values.forEach(x=>{const el=$(x.selector);if(el){el.scrollTop=x.top;el.scrollLeft=x.left}})
      if(snapshot.item){const card=$(`[data-item="${CSS.escape(snapshot.item)}"]`);if(card&&$('.sec-question-scroll'))$('.sec-question-scroll').scrollTop=snapshot.values.find(x=>x.selector==='.sec-question-scroll')?.top||0}
    }
    setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(run)),0)
  }

  function bindPomodoroTaskModal() {
    const save=$('#pomo-save-task'),cancel=$('#pomo-cancel'),input=$('#pomo-title')
    if(!save||save.dataset.v24Bound)return
    save.dataset.v24Bound='1'
    if(cancel)cancel.onclick=()=>$('#modal')?.classList.remove('show')
    const commit=()=>{
      const title=input?.value.trim()
      if(!title){input?.focus();return toast('请先填写任务名称')}
      const pomo=readJson(POMO_KEY,{focus:25,short:5,long:15,mode:'focus',remaining:1500,running:false,cycles:0,tasks:[],activeTask:'',todaySessions:[]})
      pomo.tasks=Array.isArray(pomo.tasks)?pomo.tasks:[]
      const id=uid('task')
      pomo.tasks.push({id,title,done:false,pomodoros:0})
      pomo.activeTask=id
      writeJson(POMO_KEY,pomo)
      sessionStorage.setItem(RETURN_KEY,'pomodoro')
      $('#modal')?.classList.remove('show')
      location.reload()
    }
    save.onclick=event=>{event.preventDefault();event.stopImmediatePropagation();commit()}
    if(input){input.focus();input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();commit()}}}
  }

  function setSecretActive() { $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page==='secret')) }
  function backToSecret() { const b=$('.nav-btn[data-page="secret"]');if(b)b.click() }

  function renderSyncCenter() {
    const content=$('#content');if(!content)return
    setSecretActive()
    const info=syncInfo(),secret=readJson(SECRET_KEY,{customSets:[]}),remote=cloudSets(secret)
    const packages=Array.isArray(info.packages)?info.packages:[]
    const status=$('#top-status');if(status)status.textContent=`云端题库 ${info.version||'未同步'} · ${remote.length} 套`
    content.innerHTML=`<div class="sec-page cloud-sync-page"><div class="sec-head"><div><span>CLOUD QUESTION BANK</span><h2>联网题库中心</h2><p>由我把你上传的资料整理、校对并转换成标准题库；平板只负责一键同步和做题。</p></div><div class="sec-actions"><button class="btn" id="cloud-back">← 返回秘籍</button></div></div>
      <section class="cloud-sync-hero"><div><span class="cloud-sync-badge">GitHub 云端题库源</span><h3>不再让平板猜题目，改为先整理，再同步。</h3><p>每次同步会先下载清单、校验题库结构，再一次性替换旧云端版本。下载失败时保留当前题库，不会清空做题记录。</p><div class="cloud-sync-actions"><button class="btn primary-cloud" id="cloud-sync-now">↻ 一键同步题库</button><button class="btn" id="cloud-rollback" ${info.backup?.sets?.length?'':'disabled'}>恢复上一版</button><button class="btn" id="cloud-remove" ${remote.length?'':'disabled'}>移除云端题库</button></div><div id="cloud-sync-message">${info.lastError?`<div class="cloud-sync-error">上次错误：${esc(info.lastError)}</div>`:''}</div></div><div class="cloud-sync-status"><small>本机题库版本</small><b>${esc(info.version||'未同步')}</b><span>${remote.length} 套 · ${countItems(remote)} 个练习点<br>${fmtDate(info.updatedAt)}</span></div></section>
      <div class="cloud-sync-grid"><article class="cloud-sync-card"><span>云端套题</span><b>${remote.length}</b><small>只替换带云端标记的题库，不动本机学习记录。</small></article><article class="cloud-sync-card"><span>练习点</span><b>${countItems(remote)}</b><small>选择题、七选五、翻译与长难句统一统计。</small></article><article class="cloud-sync-card"><span>客户端</span><b>v${APP_VERSION}</b><small>支持清单版本、完整下载、校验和上一版回退。</small></article></div>
      <article class="cloud-source-card"><div class="cloud-source-head"><div><h3>最近同步包</h3><p>题库会按科目拆包，后续增加内容时无需重新制作APK。</p></div><span class="sec-pill">${packages.length} 个数据包</span></div><div class="cloud-package-list">${packages.length?packages.map(p=>`<div class="cloud-package"><div><b>${esc(p.title||p.id)}</b><span>${esc(p.description||'结构化题库包')}</span></div><em>${Number(p.setCount||0)} 套</em></div>`).join(''):'<div class="sec-empty">首次同步后会显示云端数据包。</div>'}</div></article>
      <div class="cloud-sync-note"><b>你以后怎么上传：</b>直接在聊天里上传 PDF、Word、Excel、图片或压缩包。我负责整理成统一 JSON、校对答案与解析，再更新云端清单。APK里点一次“同步题库”即可。公开同步源只存放结构化且允许使用的题目数据，不上传商业书籍原始PDF。</div></div>`
    $('#cloud-back').onclick=backToSecret
    $('#cloud-sync-now').onclick=syncBanks
    $('#cloud-rollback').onclick=rollbackBanks
    $('#cloud-remove').onclick=removeCloudBanks
  }

  async function fetchText(url, timeout=25000) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout)
    try { const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(`网络响应 ${response.status}`);return await response.text() }
    finally { clearTimeout(timer) }
  }

  async function sha256(text) {
    if(!crypto?.subtle)return ''
    const data=new TextEncoder().encode(text),hash=await crypto.subtle.digest('SHA-256',data)
    return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')
  }

  function validateSet(set) {
    if(!set||typeof set!=='object'||!set.id||!set.subject||!set.type||!set.title)return false
    if(set.type==='seven')return typeof set.passage==='string'&&set.options&&set.answers
    return Array.isArray(set.items)&&set.items.length>0
  }

  async function syncBanks() {
    if(syncing)return
    syncing=true
    const button=$('#cloud-sync-now'),message=$('#cloud-sync-message')
    if(button){button.disabled=true;button.innerHTML='<span class="cloud-sync-spinner"></span>正在同步'}
    if(message)message.innerHTML=''
    try {
      const manifestText=await fetchText(`${MANIFEST_URL}?t=${Date.now()}`)
      const manifest=JSON.parse(manifestText)
      if(Number(manifest.schemaVersion)!==1||!manifest.version||!Array.isArray(manifest.packages))throw new Error('云端清单格式不正确')
      const downloaded=[]
      for(const pkg of manifest.packages){
        const url=new URL(pkg.url,MANIFEST_URL).href
        const text=await fetchText(`${url}${url.includes('?')?'&':'?'}t=${Date.now()}`)
        if(pkg.sha256){const actual=await sha256(text);if(actual&&actual.toLowerCase()!==String(pkg.sha256).toLowerCase())throw new Error(`${pkg.title||pkg.id} 校验失败`)}
        const value=JSON.parse(text),sets=Array.isArray(value)?value:value.sets
        if(!Array.isArray(sets)||!sets.length||sets.some(s=>!validateSet(s)))throw new Error(`${pkg.title||pkg.id} 题库结构不完整`)
        downloaded.push(...sets)
      }
      const unique=[...new Map(downloaded.map(s=>[s.id,s])).values()]
      const stamped=unique.map(s=>({...s,source:s.source||`云端题库 ${manifest.version}`,__lrCloudSource:CLOUD_SOURCE,__lrCloudVersion:manifest.version}))
      const secret=readJson(SECRET_KEY,{customSets:[],attempts:[],favorites:{}}),current=cloudSets(secret),local=localSets(secret)
      const next={...secret,customSets:[...local,...stamped]}
      const serialized=JSON.stringify(next)
      if(serialized.length>4_300_000)throw new Error('题库总量超过本机安全存储上限，请拆分科目同步')
      writeJson(SECRET_KEY,next)
      writeJson(SYNC_KEY,{version:manifest.version,updatedAt:new Date().toISOString(),lastCheckedAt:new Date().toISOString(),packages:manifest.packages.map(p=>({id:p.id,title:p.title,description:p.description,setCount:p.setCount||0})),backup:current.length?{version:syncInfo().version,updatedAt:syncInfo().updatedAt,sets:current}:syncInfo().backup,lastError:''})
      sessionStorage.setItem(RETURN_KEY,'secret')
      toast(`同步成功：${stamped.length} 套，${countItems(stamped)} 个练习点`)
      setTimeout(()=>location.reload(),650)
    } catch(error) {
      const info=syncInfo();info.lastCheckedAt=new Date().toISOString();info.lastError=error.name==='AbortError'?'网络超时，请检查网络后重试':error.message;writeJson(SYNC_KEY,info)
      if(message)message.innerHTML=`<div class="cloud-sync-error">同步失败：${esc(info.lastError)}。本机原题库没有改变。</div>`
      toast(`同步失败：${info.lastError}`)
    } finally {
      syncing=false
      if(button){button.disabled=false;button.textContent='↻ 一键同步题库'}
    }
  }

  function rollbackBanks() {
    const info=syncInfo(),backup=info.backup
    if(!backup?.sets?.length)return toast('没有可恢复的上一版题库')
    const secret=readJson(SECRET_KEY,{customSets:[]}),current=cloudSets(secret),local=localSets(secret)
    writeJson(SECRET_KEY,{...secret,customSets:[...local,...backup.sets]})
    writeJson(SYNC_KEY,{...info,version:backup.version||'上一版',updatedAt:backup.updatedAt||new Date().toISOString(),backup:current.length?{version:info.version,updatedAt:info.updatedAt,sets:current}:null,lastError:''})
    sessionStorage.setItem(RETURN_KEY,'secret');location.reload()
  }

  function removeCloudBanks() {
    if(!confirm('移除本机已同步题库？学习记录和内置题库不会删除。'))return
    const secret=readJson(SECRET_KEY,{customSets:[]}),current=cloudSets(secret)
    writeJson(SECRET_KEY,{...secret,customSets:localSets(secret)})
    const info=syncInfo();writeJson(SYNC_KEY,{...info,version:'未同步',updatedAt:'',backup:current.length?{version:info.version,updatedAt:info.updatedAt,sets:current}:info.backup,lastError:''})
    sessionStorage.setItem(RETURN_KEY,'secret');location.reload()
  }

  function patchImportUI() {
    ['quick-import','lib-import'].forEach(id=>document.getElementById(id)?.remove())
    const bankImport=$('#bank-import')
    if(bankImport&&!bankImport.dataset.v24Patched){
      bankImport.dataset.v24Patched='1';bankImport.remove()
      const content=$('#content'),head=$('.page-head h2',content),desc=$('.page-head p',content)
      if(head)head.textContent='题库资料与备份'
      if(desc)desc.textContent='平板端自动识别已关闭；题库改为整理后联网同步。'
      const fileCard=$('#file-import')?.closest('.card'),manualCard=$('#manual-create')?.closest('.card')
      fileCard?.remove();manualCard?.remove()
      const grid=$('.grid.three',content)
      if(grid&&!$('.bank-sync-card',grid)){
        const card=document.createElement('article');card.className='card bank-sync-card';card.innerHTML='<h3>联网题库同步</h3><div class="bank-recognition-removed">PDF、Word和图片自动识别容易把题干、选项和答案对应错，现已停用。请把资料上传给我整理，整理完成后在这里一键同步。</div><div class="toolbar"><button class="btn primary" id="open-cloud-sync">打开联网题库中心</button></div>'
        grid.prepend(card);$('#open-cloud-sync').onclick=renderSyncCenter
      }
      const status=$('#top-status');if(status)status.textContent='自动识别导题已停用 · 改用联网同步'
    }
  }

  function queuePatch() { if(patchQueued)return;patchQueued=true;queueMicrotask(()=>{patchQueued=false;patchImportUI()}) }

  document.addEventListener('click',event=>{
    const option=event.target.closest?.('.sec-option')
    if(option){const snapshot=snapshotScroll(option);restoreScroll(snapshot);return}
    const add=event.target.closest?.('#pomo-add')
    if(add){setTimeout(bindPomodoroTaskModal,0);return}
    const cloud=event.target.closest?.('#sec-import,#sec-manage,#open-cloud-sync')
    if(cloud){event.preventDefault();event.stopImmediatePropagation();renderSyncCenter();return}
    const blocked=event.target.closest?.('#bank-import,#file-import,#manual-create,#quick-import,#lib-import')
    if(blocked){event.preventDefault();event.stopImmediatePropagation();renderSyncCenter()}
  },true)

  document.addEventListener('change',event=>{const gap=event.target.closest?.('.sec-gap');if(gap){const snapshot=snapshotScroll(gap);restoreScroll(snapshot)}},true)
  new MutationObserver(queuePatch).observe(document.documentElement,{childList:true,subtree:true})

  function restorePageAfterReload() {
    const page=sessionStorage.getItem(RETURN_KEY);if(!page)return
    const wait=()=>{
      const button=$(`.nav-btn[data-page="${page}"]`)
      if(!button)return setTimeout(wait,100)
      sessionStorage.removeItem(RETURN_KEY);button.click()
    }
    setTimeout(wait,150)
  }

  window.LRCloudBank={renderSyncCenter,syncBanks}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{queuePatch();restorePageAfterReload()})
  else {queuePatch();restorePageAfterReload()}
})()
