(() => {
  'use strict'
  const STUDY_KEY='lr-vocab-study-v2',CACHE_KEY='lr-vocab-redbook-cache-v1',REMOTE_WORDS_URL='https://raw.githubusercontent.com/3056810551/2027-kaoyan-english-redbook-json/main/words.json',SOURCE_NOTE='公开整理的考研红宝书参考词库，仅用于个人学习；非出版社或“不背单词”官方授权版本。'
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],today=()=>new Date().toLocaleDateString('en-CA'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),clamp=(v,a,b)=>Math.min(b,Math.max(a,v))
  const FALLBACK_TEXT=`radiate|v. 散发；发出（光、热等）；呈辐射状伸展
radiant|adj. 容光焕发的；灿烂的；辐射的
radical|adj. 根本的；彻底的；激进的 n. 激进分子
objective|n. 目标；目的 adj. 客观的
objection|n. 反对；异议；反对的理由
obligation|n. 义务；责任
oblige|v. 迫使；使负有义务；帮忙
obscure|adj. 鲜为人知的；难理解的 v. 掩盖
observation|n. 观察；观测；评论
observe|v. 观察；注意到；遵守
obsession|n. 痴迷；着魔
obsolete|adj. 过时的；淘汰的
obtain|v. 获得；实现
obvious|adj. 明显的；显然的
ideal|adj. 理想的；最佳的 n. 理想
ideology|n. 思想体系；意识形态
identical|adj. 完全相同的
identification|n. 识别；确认；身份证明
identify|v. 认出；确认；查明
identity|n. 身份；特性；同一性
journal|n. 期刊；报纸；日志
journalist|n. 记者；新闻工作者
journey|n. 旅行；旅程 v. 旅行
judge|n. 法官；裁判 v. 判断；评价
judgement|n. 判断；评价；判断力
judicial|adj. 司法的；审判的
jury|n. 陪审团；评审团
jurisdiction|n. 管辖权；司法权
justice|n. 公平；正义；司法制度
justify|v. 证明……有理；为……辩解
label|n. 标签；称谓 v. 贴标签；把……称为
lag|v. 落后；滞后 n. 时间间隔
largely|adv. 在很大程度上；主要地
lateral|adj. 侧面的；横向的
latter|adj. 后者的；后期的
lawsuit|n. 诉讼；官司
magnitude|n. 巨大；重要性；震级
magnify|v. 放大；夸大；加重
magnificent|adj. 宏伟的；壮丽的
maintain|v. 维持；保养；坚称；供养
maintenance|n. 维护；保养；维持
majority|n. 大多数；多数票
mechanism|n. 机制；机械装置
mediate|v. 调停；调解；影响
meditation|n. 冥想；沉思
medium|n. 媒介；手段 adj. 中等的
media|n. 媒体；传播媒介
elaborate|adj. 复杂精细的 v. 详细阐述
elegant|adj. 优雅的；简洁巧妙的
element|n. 要素；元素；基本部分
elementary|adj. 基本的；初级的
eliminate|v. 消除；淘汰
abolish|v. 废止；取消
absence|n. 缺席；缺乏；不存在
absent|adj. 缺席的；心不在焉的
abroad|adv. 在国外；广为流传地
absolute|adj. 绝对的；完全的
absorb|v. 吸收；理解；使全神贯注
abstract|adj. 抽象的 n. 摘要 v. 提取
academic|adj. 学术的；学院的 n. 学者
accelerate|v. 加速；促进
access|n. 进入；使用权 v. 获取
accommodate|v. 容纳；适应；为……提供方便
accompany|v. 陪伴；伴随
accomplish|v. 完成；实现
accumulate|v. 积累；堆积
accurate|adj. 准确的；精确的
acknowledge|v. 承认；确认；致谢
acquire|v. 获得；习得
adapt|v. 适应；改编
adequate|adj. 足够的；适当的
adjacent|adj. 邻近的；毗连的
advocate|v. 提倡；拥护 n. 倡导者
allocate|v. 分配；拨给
alter|v. 改变；修改
alternative|n. 可替代方案 adj. 可供选择的
ambiguous|adj. 含糊的；有歧义的
anticipate|v. 预期；预料；提前做
apparent|adj. 显然的；表面上的
appeal|n. 呼吁；吸引力 v. 呼吁；吸引
apply|v. 申请；应用；适用
approach|n. 方法；接近 v. 接近；处理
appropriate|adj. 合适的 v. 拨款；占用
arbitrary|adj. 任意的；武断的
assess|v. 评估；评价
assign|v. 分配；指派；布置
assume|v. 假定；承担；呈现
attain|v. 达到；获得
attribute|n. 属性；特征 v. 归因于
authentic|adj. 真实的；可信的
authority|n. 权威；当局；权限
available|adj. 可获得的；有空的
aware|adj. 意识到的；知道的
barrier|n. 障碍；屏障
beneficial|adj. 有益的；有利的
bias|n. 偏见；偏向 v. 使有偏见
capacity|n. 能力；容量；身份
cease|v. 停止；终止
challenge|n. 挑战；质疑 v. 挑战；质疑
characteristic|n. 特征 adj. 典型的
clarify|v. 澄清；阐明
coherent|adj. 连贯的；一致的
coincide|v. 同时发生；相符
collapse|v. 倒塌；崩溃 n. 崩溃
commence|v. 开始；着手
commit|v. 犯；承诺；投入
compatible|adj. 兼容的；相容的
compensate|v. 补偿；弥补
compile|v. 汇编；编纂
complement|v. 补充 n. 补充物
complex|adj. 复杂的 n. 综合体
component|n. 组成部分；部件
comprehensive|adj. 全面的；综合的
conceal|v. 隐藏；隐瞒
concede|v. 承认；让步
conceive|v. 构想；认为；怀孕
concentrate|v. 集中；浓缩
conclude|v. 得出结论；结束
concrete|adj. 具体的 n. 混凝土
conduct|v. 进行；引导 n. 行为
confer|v. 授予；商议
confine|v. 限制；使局限
confirm|v. 证实；确认
conflict|n. 冲突 v. 冲突
conform|v. 遵守；符合
confront|v. 面对；对抗
consent|n. 同意 v. 同意
consequence|n. 结果；重要性
considerable|adj. 相当大的；重要的
consistent|adj. 一致的；持续的
constitute|v. 构成；组成；设立
constrain|v. 限制；约束
consult|v. 咨询；查阅；商议
consume|v. 消耗；消费
contemplate|v. 深思；考虑
contemporary|adj. 当代的；同时代的
contradict|v. 反驳；与……矛盾
controversial|adj. 有争议的
conventional|adj. 传统的；常规的
convert|v. 转换；使改变信仰
convince|v. 使确信；说服
cooperate|v. 合作；配合
coordinate|v. 协调 n. 坐标
crucial|adj. 至关重要的
cultivate|v. 培养；耕作；陶冶
cumulative|adj. 累积的
decline|v. 下降；拒绝 n. 下降
deduce|v. 推断；演绎
define|v. 定义；界定
demonstrate|v. 证明；展示；示威
deny|v. 否认；拒绝给予
depict|v. 描绘；描述
derive|v. 获得；起源于
detect|v. 发现；察觉
deteriorate|v. 恶化；退化
deviate|v. 偏离；违背
diminish|v. 减少；削弱
discriminate|v. 区分；歧视
dismiss|v. 解雇；不予考虑；解散
distinct|adj. 明显不同的；清楚的
distort|v. 歪曲；扭曲
diverse|adj. 多样的；不同的
domestic|adj. 国内的；家庭的
dominant|adj. 占主导的；显著的
draft|n. 草稿；征兵 v. 起草
dramatic|adj. 戏剧性的；巨大的
efficient|adj. 高效的；有能力的
empirical|adj. 以观察或实验为依据的
enhance|v. 提高；增强
ensure|v. 确保；保证
equivalent|adj. 等同的 n. 等价物
essential|adj. 必要的；本质的 n. 要素
establish|v. 建立；证实
evaluate|v. 评估；评价
eventually|adv. 最终；终于
evident|adj. 明显的；清楚的
exclude|v. 排除；不包括
explicit|adj. 明确的；直率的
facilitate|v. 促进；使便利
feasible|adj. 可行的
fluctuate|v. 波动；起伏
fundamental|adj. 基本的；根本的 n. 基本原理
generate|v. 产生；生成
highlight|v. 强调；突出 n. 最精彩部分
hypothesis|n. 假设；假说
illustrate|v. 说明；给……加插图
implement|v. 实施；执行 n. 工具
imply|v. 暗示；意味着
incentive|n. 激励；刺激
inevitable|adj. 不可避免的
infer|v. 推断；推论
inhibit|v. 抑制；阻止
initial|adj. 最初的 n. 首字母
innovative|adj. 创新的
integrate|v. 使结合；融入
interpret|v. 解释；口译
intervene|v. 干预；介入
intrinsic|adj. 固有的；内在的
investigate|v. 调查；研究
legitimate|adj. 合法的；合理的
manifest|v. 表明；显现 adj. 明显的
marginal|adj. 边缘的；微小的
modify|v. 修改；改变
notion|n. 概念；看法
orient|v. 使适应；确定方向
perceive|v. 察觉；理解
persist|v. 坚持；持续存在
perspective|n. 观点；视角；透视
plausible|adj. 看似合理的
precede|v. 先于；在……之前
precise|adj. 精确的；严谨的
predict|v. 预测；预言
preliminary|adj. 初步的 n. 预备步骤
presume|v. 假定；推测
prevail|v. 盛行；占优势
prohibit|v. 禁止；阻止
prominent|adj. 突出的；著名的
proportion|n. 比例；部分
prospect|n. 前景；可能性
reinforce|v. 加强；强化
reluctant|adj. 不情愿的
relevant|adj. 相关的；切题的
reliable|adj. 可靠的
retain|v. 保留；保持
reveal|v. 揭示；显示
rigid|adj. 僵硬的；严格的
significant|adj. 重要的；显著的
simulate|v. 模拟；假装
sophisticated|adj. 复杂精密的；老练的
subsequent|adj. 随后的；后来的
substantial|adj. 大量的；实质的
sustain|v. 维持；支撑；遭受
tentative|adj. 暂定的；试探性的
transform|v. 改变；转化
underlying|adj. 潜在的；根本的
valid|adj. 有效的；合理的
verify|v. 核实；证实
viable|adj. 可行的；能存活的
vulnerable|adj. 脆弱的；易受伤害的`
  const FALLBACK_WORDS=FALLBACK_TEXT.split('\n').map((l,i)=>{const p=l.indexOf('|');return{id:l.slice(0,p).trim().toLowerCase(),word:l.slice(0,p).trim(),meaning:l.slice(p+1).trim(),index:i+1,page:Math.floor(i/20)+1,source:'内置考研核心词汇'}})
  const defaults={version:2,mode:'order',dailyGoal:50,orderCursor:0,progress:{},favorites:{},history:[],sourceCount:FALLBACK_WORDS.length,sourceName:'内置考研核心词汇',sourceUpdatedAt:'',session:null,preferences:{autoSpeak:true,showIndex:true}}
  let state=loadState(),words=loadCache()||FALLBACK_WORDS,activeView='home',searchTimer=null,remoteLoading=false
  function loadState(){try{const r=JSON.parse(localStorage.getItem(STUDY_KEY)||'{}');return{...structuredClone(defaults),...r,preferences:{...defaults.preferences,...(r.preferences||{})},progress:r.progress||{},favorites:r.favorites||{},history:Array.isArray(r.history)?r.history.slice(-12000):[]}}catch{return structuredClone(defaults)}}
  function save(){localStorage.setItem(STUDY_KEY,JSON.stringify(state))}
  function normalize(list,source='公开红宝书参考词库'){const seen=new Set;return list.map((x,i)=>{const word=String(x.word||x.name||'').trim(),meaning=String(x.meaning||x.translation||x.trans||'').trim(),id=word.toLowerCase();if(!word||!meaning||seen.has(id))return null;seen.add(id);return{id,word,meaning,index:Number(x.index)||i+1,page:Number(x.page)||Math.floor(i/20)+1,source}}).filter(Boolean)}
  function loadCache(){try{const r=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');return Array.isArray(r)&&r.length>=100?normalize(r):null}catch{return null}}
  function notify(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),2400)}
  function closeModal(){$('#modal')?.classList.remove('show')}
  function modal(html){const b=$('#modal-box'),m=$('#modal');if(!b||!m)return;b.innerHTML=html;m.classList.add('show')}
  function top(t){const e=$('#top-status');if(e)e.textContent=t}
  function active(){$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page==='vocab'))}
  function nav(){const n=$('.nav');if(!n||$('[data-page="vocab"]',n))return!!n;const b=document.createElement('button');b.className='nav-btn vocab-nav-btn';b.dataset.page='vocab';b.innerHTML='<span class="nav-icon">Aa</span><span class="nav-text">单词</span>';b.onclick=renderHome;const bank=$('[data-page="bank"]',n);bank?n.insertBefore(b,bank):n.appendChild(b);return true}
  function boot(){if(!nav()){setTimeout(boot,120);return}document.addEventListener('keydown',keys);if(words.length===FALLBACK_WORDS.length)sync(false)}
  const rec=id=>state.progress[id]||null,stage=r=>Number(r?.stage||0),mastered=r=>stage(r)>=4||r?.level==='easy',weak=r=>r&&(r.level==='unknown'||r.level==='fuzzy'||stage(r)<2)
  function todays(){const d=today();return state.history.filter(x=>x.date===d)}function todayCount(){return new Set(todays().map(x=>x.wordId)).size}function learned(){return Object.values(state.progress).filter(x=>(x.seen||0)>0).length}function masterCount(){return Object.values(state.progress).filter(mastered).length}function weakCount(){return Object.values(state.progress).filter(weak).length}function favCount(){return Object.values(state.favorites).filter(Boolean).length}
  function streak(){const ds=new Set(state.history.map(x=>x.date));let n=0,d=new Date;if(!ds.has(d.toLocaleDateString('en-CA')))d.setDate(d.getDate()-1);while(ds.has(d.toLocaleDateString('en-CA'))){n++;d.setDate(d.getDate()-1)}return n}
  function week(){return Array.from({length:7},(_,i)=>{const d=new Date;d.setDate(d.getDate()-(6-i));const k=d.toLocaleDateString('en-CA');return{key:k,label:['日','一','二','三','四','五','六'][d.getDay()],count:new Set(state.history.filter(x=>x.date===k).map(x=>x.wordId)).size}})}
  const short=m=>{const t=String(m).replace(/\s+/g,' ');return t.length>36?t.slice(0,36)+'…':t}
  function seeded(list,s){const a=[...list];let z=2166136261;for(const c of s)z=Math.imul(z^c.charCodeAt(0),16777619);const r=()=>{z+=0x6D2B79F5;let v=z;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return((v^v>>>14)>>>0)/4294967296};for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function preview(){if(state.mode==='order'){const s=clamp(state.orderCursor,0,Math.max(0,words.length-1));return Array.from({length:4},(_,i)=>words[(s+i)%words.length])}return seeded(words.filter(w=>!mastered(rec(w.id))),today()+'-preview').slice(0,4)}
  function stat(icon,label,value,detail,tone){return`<article class="vocab-stat ${tone}"><span>${icon}</span><div><small>${label}</small><strong>${value}</strong><p>${detail}</p></div></article>`}
  function renderHome(){activeView='home';state.session=null;save();active();const c=$('#content');if(!c)return;const n=todayCount(),g=state.dailyGoal,p=clamp(Math.round(n/Math.max(1,g)*100),0,100),w=week(),mx=Math.max(1,...w.map(x=>x.count));top(n>=g?'今日单词计划完成，记得回看生词':`今日已学 ${n}/${g} 个单词`);c.innerHTML=`<div class="vocab-page"><div class="vocab-page-head"><div><span class="vocab-eyebrow">LR VOCABULARY</span><h2>背单词</h2><p>顺序打基础，乱序验掌握；每天一点点，把陌生词变成熟面孔。</p></div><div class="vocab-head-actions"><button class="btn vocab-soft" id="vocab-wordbook">♡ 单词本</button><button class="btn" id="vocab-settings">⚙ 学习设置</button></div></div><section class="vocab-hero-card"><div class="vocab-hero-copy"><span class="vocab-source-pill"><i></i>${esc(state.sourceName)} · ${words.length} 词</span><h3>${n>=g?'今天的词已经稳稳拿下。':'先认识，再理解，最后让它变成你的词。'}</h3><p>大卡片沉浸学习 · 点击显示释义 · 认识程度分级 · 自动生成生词复习队列。</p><div class="vocab-hero-actions"><button class="btn vocab-primary" id="vocab-start">${n?'继续今日学习':'开始今日学习'}</button><button class="btn vocab-glass" id="vocab-review">复习生词 ${weakCount()?`· ${weakCount()}`:''}</button></div></div><div class="vocab-goal-panel"><div class="vocab-goal-ring" style="--vocab-p:${p}"><b>${p}%</b><small>今日</small></div><div><strong>${n}<span> / ${g}</span></strong><p>${n>=g?'计划已完成 ✨':`还差 ${Math.max(0,g-n)} 个`}</p></div></div><div class="vocab-orbit orbit-one">A</div><div class="vocab-orbit orbit-two">词</div><div class="vocab-orbit orbit-three">Aa</div></section><div class="vocab-control-row"><div class="vocab-mode-card"><div><b>学习顺序</b><span>可随时切换，不影响已学进度</span></div><div class="vocab-segmented" id="vocab-mode"><button data-mode="order" class="${state.mode==='order'?'active':''}">顺序版</button><button data-mode="random" class="${state.mode==='random'?'active':''}">乱序版</button></div></div><button class="vocab-source-card" id="vocab-sync"><span class="vocab-source-icon">↻</span><span><b>${remoteLoading?'正在同步完整词库…':'同步完整参考词库'}</b><small>${state.sourceUpdatedAt?`上次同步 ${new Date(state.sourceUpdatedAt).toLocaleDateString('zh-CN')}`:'联网后自动缓存到本机'}</small></span></button></div><div class="vocab-stat-grid">${stat('◉','累计已学',`${learned()} 个`,'至少出现过一次','purple')}${stat('✓','已经掌握',`${masterCount()} 个`,'熟练度达到稳定区','mint')}${stat('↺','需要复习',`${weakCount()} 个`,'不认识与模糊词','peach')}${stat('♡','我的收藏',`${favCount()} 个`,'重点词与喜欢的词','rose')}</div><div class="vocab-lower-grid"><article class="vocab-card vocab-week-card"><div class="vocab-card-head"><div><h3>近 7 天学习量</h3><p>只统计当天接触过的不同单词</p></div><span class="vocab-chip">连续 ${streak()} 天</span></div><div class="vocab-week-chart">${w.map(d=>`<div class="vocab-bar-col"><div class="vocab-bar-value">${d.count||''}</div><div class="vocab-bar-track"><i style="height:${Math.max(5,d.count/mx*100)}%"></i></div><span>周${d.label}</span></div>`).join('')}</div></article><article class="vocab-card vocab-next-card"><div class="vocab-card-head"><div><h3>下一组词</h3><p>${state.mode==='order'?'按词库顺序继续推进':'从未掌握词中随机抽取'}</p></div><span class="vocab-chip ${state.mode==='random'?'peach':''}">${state.mode==='order'?'顺序版':'乱序版'}</span></div><div class="vocab-preview-list">${preview().map(x=>`<div><span>${esc(x.word)}</span><small>${esc(short(x.meaning))}</small></div>`).join('')}</div><button class="btn vocab-wide" id="vocab-start-bottom">开始这一组</button></article></div><article class="vocab-card vocab-search-card"><div class="vocab-card-head"><div><h3>查词与词库浏览</h3><p>输入英文或中文释义，快速定位；结果不会打乱学习进度。</p></div><span class="vocab-chip">离线可用</span></div><div class="vocab-search-wrap"><span>⌕</span><input id="vocab-search" placeholder="搜索单词或中文释义，例如 objective / 客观"></div><div id="vocab-search-results" class="vocab-search-results"><div class="vocab-search-hint">输入关键词开始查词，或打开“单词本”查看收藏与生词。</div></div></article><p class="vocab-source-note">${SOURCE_NOTE}</p></div>`;bindHome()}
  function bindHome(){$('#vocab-start')?.addEventListener('click',()=>start('daily'));$('#vocab-start-bottom')?.addEventListener('click',()=>start('daily'));$('#vocab-review')?.addEventListener('click',()=>start('review'));$('#vocab-wordbook')?.addEventListener('click',()=>book('weak'));$('#vocab-settings')?.addEventListener('click',settings);$('#vocab-sync')?.addEventListener('click',()=>sync(true));$$('#vocab-mode button').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;save();renderHome();notify(state.mode==='order'?'已切换为顺序版':'已切换为乱序版')});$('#vocab-search')?.addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>search(e.target.value),120)})}
  function label(r){if(!r)return'未学';return r.level==='unknown'?'不认识':r.level==='fuzzy'?'模糊':r.level==='known'?(stage(r)>=4?'已掌握':'认识'):r.level==='easy'?'很熟':'已学'}
  function row(x){const r=rec(x.id),f=!!state.favorites[x.id];return`<div class="vocab-word-row"><button class="vocab-row-main" data-open-word="${esc(x.id)}"><b>${esc(x.word)}</b><span>${esc(x.meaning)}</span></button>${r?`<span class="vocab-level ${r.level||'new'}">${label(r)}</span>`:'<span class="vocab-level new">未学</span>'}<button class="vocab-row-fav ${f?'active':''}" data-toggle-fav="${esc(x.id)}">${f?'♥':'♡'}</button></div>`}
  function bindRows(){$$('[data-toggle-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();favorite(b.dataset.toggleFav);b.classList.toggle('active',!!state.favorites[b.dataset.toggleFav]);b.textContent=state.favorites[b.dataset.toggleFav]?'♥':'♡'});$$('[data-open-word]').forEach(b=>b.onclick=()=>single(b.dataset.openWord))}
  function search(q){const box=$('#vocab-search-results');if(!box)return;const k=q.trim().toLowerCase();if(!k){box.innerHTML='<div class="vocab-search-hint">输入关键词开始查词，或打开“单词本”查看收藏与生词。</div>';return}const m=words.filter(x=>x.word.toLowerCase().includes(k)||x.meaning.toLowerCase().includes(k)).slice(0,24);box.innerHTML=m.length?m.map(row).join(''):'<div class="vocab-search-hint">没有找到匹配词，换一个关键词试试。</div>';bindRows()}
  function single(id){if(!words.some(x=>x.id===id))return;state.session={kind:'single',queue:[id],position:0,revealed:true,repeats:{},startedAt:new Date().toISOString()};save();study()}
  function dailyQueue(){const seen=new Set(todays().map(x=>x.wordId)),n=Math.max(10,state.dailyGoal-seen.size);let pool=[];if(state.mode==='order'){let cur=clamp(state.orderCursor,0,Math.max(0,words.length-1)),guard=0;while(pool.length<n&&guard<words.length*2){const x=words[cur%words.length];if(!seen.has(x.id))pool.push(x);cur++;guard++}}else{const c=words.filter(x=>!seen.has(x.id)&&!mastered(rec(x.id))),b=words.filter(x=>!seen.has(x.id));pool=seeded(c.length>=n?c:b,today()+'-'+Date.now()).slice(0,n)}return pool.map(x=>x.id)}
  function reviewQueue(){const now=Date.now(),due=words.filter(x=>{const r=rec(x.id);return r&&(weak(r)||Number(r.dueAt||0)<=now)}).sort((a,b)=>(rec(a.id).dueAt||0)-(rec(b.id).dueAt||0)||stage(rec(a.id))-stage(rec(b.id))),fav=words.filter(x=>state.favorites[x.id]);return(due.length?due:fav).slice(0,Math.max(20,state.dailyGoal)).map(x=>x.id)}
  function start(kind){const q=kind==='review'?reviewQueue():dailyQueue();if(!q.length)return notify(kind==='review'?'暂时没有需要复习的词':'词库里暂时没有可学习的词');state.session={kind,queue:q,position:0,revealed:false,repeats:{},startedAt:new Date().toISOString()};save();study()}
  function current(){const s=state.session;if(!s)return null;const id=s.queue[s.position];return words.find(x=>x.id===id)||null}
  function study(){activeView='study';active();const c=$('#content'),s=state.session;if(!c||!s)return renderHome();if(s.position>=s.queue.length)return done();const x=current();if(!x){s.position++;save();return study()}const rev=!!s.revealed,p=Math.round(s.position/Math.max(1,s.queue.length)*100),f=!!state.favorites[x.id],r=rec(x.id);top(`${s.kind==='review'?'生词复习':state.mode==='order'?'顺序学习':'乱序学习'} · ${s.position+1}/${s.queue.length}`);c.innerHTML=`<div class="vocab-study-page"><header class="vocab-study-head"><button class="btn icon" id="vocab-study-back">←</button><div class="vocab-study-meta"><b>${s.kind==='review'?'生词复习':state.mode==='order'?'顺序版':'乱序版'}</b><span>${s.position+1} / ${s.queue.length}</span></div><div class="vocab-study-progress"><i style="width:${p}%"></i></div><button class="btn vocab-soft" id="vocab-exit-session">保存退出</button></header><main class="vocab-study-stage"><div class="vocab-study-decor decor-a">A</div><div class="vocab-study-decor decor-b">词</div><article class="vocab-flash-card ${rev?'revealed':''}" id="vocab-flash-card"><div class="vocab-card-topline"><span>${state.preferences.showIndex?`NO. ${x.index||words.indexOf(x)+1}`:'LR WORD'}</span><div><button class="vocab-round-btn" id="vocab-speak">♪</button><button class="vocab-round-btn ${f?'active':''}" id="vocab-favorite">${f?'♥':'♡'}</button></div></div><div class="vocab-word-zone"><span class="vocab-word-kicker">KAOYAN ENGLISH</span><h1>${esc(x.word)}</h1><button class="vocab-pronounce" id="vocab-pronounce">点击发音 <span>›</span></button></div><div class="vocab-meaning-zone ${rev?'show':''}"><div class="vocab-divider"><i></i><span>释义</span><i></i></div><p>${esc(x.meaning)}</p>${r?`<span class="vocab-history-tag">上次：${label(r)} · 已见 ${r.seen||0} 次</span>`:'<span class="vocab-history-tag">第一次遇见它</span>'}</div>${rev?'':'<button class="vocab-reveal" id="vocab-reveal"><span>轻触显示释义</span><small>也可以按空格键</small></button>'}</article>${rev?`<section class="vocab-rating-panel"><p>你对这个词的熟悉程度？</p><div class="vocab-rating-grid"><button data-rating="unknown" class="unknown"><b>1</b><span>不认识<small>很快再出现</small></span></button><button data-rating="fuzzy" class="fuzzy"><b>2</b><span>有点模糊<small>明天复习</small></span></button><button data-rating="known" class="known"><b>3</b><span>认识<small>间隔复习</small></span></button><button data-rating="easy" class="easy"><b>4</b><span>太熟了<small>降低频率</small></span></button></div></section>`:'<div class="vocab-study-tip"><span>⌨</span><p><b>小提示</b><br>先在脑中回忆含义，再点击卡片。不要急着“眼熟式背词”。</p></div>'}</main></div>`;bindStudy();if(state.preferences.autoSpeak&&!rev)setTimeout(()=>speak(x.word,false),260)}
  function bindStudy(){$('#vocab-study-back')?.addEventListener('click',renderHome);$('#vocab-exit-session')?.addEventListener('click',()=>{save();renderHome();notify('学习进度已保存')});$('#vocab-flash-card')?.addEventListener('click',e=>{if(!e.target.closest('button'))reveal()});$('#vocab-reveal')?.addEventListener('click',reveal);$('#vocab-speak')?.addEventListener('click',()=>speak(current()?.word));$('#vocab-pronounce')?.addEventListener('click',()=>speak(current()?.word));$('#vocab-favorite')?.addEventListener('click',()=>{const x=current();if(x){favorite(x.id);study()}});$$('[data-rating]').forEach(b=>b.onclick=()=>rate(b.dataset.rating))}
  function reveal(){if(!state.session||state.session.revealed)return;state.session.revealed=true;save();study()}
  function rate(level){const x=current(),s=state.session;if(!x||!s)return;const old=rec(x.id)||{stage:0,seen:0,correct:0},now=Date.now(),day=864e5,rules={unknown:{stage:Math.max(0,stage(old)-1),due:now+48e4,interval:0,correct:0},fuzzy:{stage:Math.max(1,stage(old)),due:now+day,interval:1,correct:0},known:{stage:Math.min(6,stage(old)+1),due:now+day*Math.max(2,Math.pow(2,stage(old))),interval:Math.max(2,Math.pow(2,stage(old))),correct:1},easy:{stage:Math.min(8,stage(old)+2),due:now+day*Math.max(7,Math.pow(2.2,stage(old)+1)),interval:Math.max(7,Math.round(Math.pow(2.2,stage(old)+1))),correct:1}},rule=rules[level];state.progress[x.id]={...old,level,stage:rule.stage,seen:(old.seen||0)+1,correct:(old.correct||0)+rule.correct,lastAt:now,dueAt:rule.due,intervalDays:rule.interval};state.history.push({wordId:x.id,word:x.word,rating:level,date:today(),at:now});state.history=state.history.slice(-12000);if(state.mode==='order'&&s.kind==='daily'){const i=words.findIndex(w=>w.id===x.id);if(i>=0)state.orderCursor=(i+1)%words.length}const n=s.repeats[x.id]||0;if(level==='unknown'&&n<2){s.queue.splice(Math.min(s.queue.length,s.position+5),0,x.id);s.repeats[x.id]=n+1}else if(level==='fuzzy'&&n<1&&s.queue.length<90){s.queue.splice(Math.min(s.queue.length,s.position+9),0,x.id);s.repeats[x.id]=n+1}s.position++;s.revealed=false;save();study()}
  function done(){activeView='done';active();const c=$('#content'),s=state.session;if(!c||!s)return renderHome();const t=new Date(s.startedAt).getTime(),rs=state.history.filter(x=>x.at>=t),u=new Set(rs.map(x=>x.wordId)).size,k=rs.filter(x=>x.rating==='known'||x.rating==='easy').length,w=rs.filter(x=>x.rating==='unknown'||x.rating==='fuzzy').length,a=rs.length?Math.round(k/rs.length*100):0;top(`本组完成 · 学习 ${u} 个词`);c.innerHTML=`<div class="vocab-done-page"><section class="vocab-done-card"><div class="vocab-done-stars">✦ <span>✦</span> ✦</div><div class="vocab-done-mascot">📚</div><span class="vocab-eyebrow">SESSION COMPLETE</span><h2>这一组，拿下了。</h2><p>真正的掌握不靠一次记住，而靠每次遗忘后重新认出。</p><div class="vocab-done-stats"><div><b>${u}</b><span>本组词数</span></div><div><b>${k}</b><span>认识 / 很熟</span></div><div><b>${w}</b><span>进入复习</span></div><div><b>${a}%</b><span>本组熟悉率</span></div></div><div class="vocab-done-actions"><button class="btn vocab-primary" id="vocab-done-home">返回单词首页</button><button class="btn vocab-soft" id="vocab-done-review">趁热复习生词</button></div></section></div>`;$('#vocab-done-home').onclick=renderHome;$('#vocab-done-review').onclick=()=>start('review')}
  function tab(id,name,n,a){return`<button class="vocab-book-tab ${id===a?'active':''}" data-tab="${id}"><span>${name}</span><b>${n}</b></button>`}
  function book(t='weak'){activeView='wordbook';active();const c=$('#content');if(!c)return;const lists={weak:words.filter(x=>weak(rec(x.id))),favorite:words.filter(x=>state.favorites[x.id]),mastered:words.filter(x=>mastered(rec(x.id))),all:words.filter(x=>rec(x.id))},cur=lists[t]||lists.weak;top(`单词本 · ${cur.length} 个词`);c.innerHTML=`<div class="vocab-page vocab-wordbook-page"><div class="vocab-page-head"><div><button class="vocab-back-link" id="vocab-book-back">← 返回背单词</button><span class="vocab-eyebrow">MY WORD BOOK</span><h2>我的单词本</h2><p>把陌生词集中突破，也把已经掌握的词看得见。</p></div><button class="btn vocab-primary" id="vocab-book-review">复习当前分类</button></div><div class="vocab-book-tabs">${tab('weak','生词',lists.weak.length,t)}${tab('favorite','收藏',lists.favorite.length,t)}${tab('mastered','已掌握',lists.mastered.length,t)}${tab('all','全部已学',lists.all.length,t)}</div><article class="vocab-card"><div class="vocab-search-wrap"><span>⌕</span><input id="vocab-book-search" placeholder="在当前分类中搜索"></div><div class="vocab-book-list" id="vocab-book-list">${cur.length?cur.slice(0,300).map(row).join(''):'<div class="vocab-empty"><span>☁</span><b>这里暂时是空的</b><p>开始学习后，系统会自动整理。</p></div>'}</div>${cur.length>300?`<p class="vocab-list-note">当前先显示前 300 个，共 ${cur.length} 个。</p>`:''}</article></div>`;$('#vocab-book-back').onclick=renderHome;$$('.vocab-book-tab').forEach(b=>b.onclick=()=>book(b.dataset.tab));$('#vocab-book-review').onclick=()=>{if(!cur.length)return notify('当前分类没有可复习的单词');state.session={kind:'review',queue:cur.slice(0,Math.max(20,state.dailyGoal)).map(x=>x.id),position:0,revealed:false,repeats:{},startedAt:new Date().toISOString()};save();study()};$('#vocab-book-search').oninput=e=>{const q=e.target.value.trim().toLowerCase(),f=q?cur.filter(x=>x.word.toLowerCase().includes(q)||x.meaning.toLowerCase().includes(q)):cur;$('#vocab-book-list').innerHTML=f.slice(0,300).map(row).join('')||'<div class="vocab-empty"><span>⌕</span><b>没有匹配结果</b></div>';bindRows()};bindRows()}
  function settings(){modal(`<div class="vocab-modal-title"><span>⚙</span><div><h3>单词学习设置</h3><p>设置与学习记录仅保存在这台平板。</p></div></div><div class="vocab-setting-section"><label>每日新词目标</label><div class="vocab-goal-options">${[20,30,50,80,100].map(v=>`<button data-goal="${v}" class="${state.dailyGoal===v?'active':''}">${v}<small>词</small></button>`).join('')}</div></div><div class="vocab-setting-section"><label class="vocab-switch-row"><span><b>进入卡片时自动朗读</b><small>使用系统英文语音，离线能力取决于平板语音包</small></span><input type="checkbox" id="vocab-auto-speak" ${state.preferences.autoSpeak?'checked':''}></label><label class="vocab-switch-row"><span><b>显示词库序号</b><small>顺序版时更容易定位学习位置</small></span><input type="checkbox" id="vocab-show-index" ${state.preferences.showIndex?'checked':''}></label></div><div class="vocab-setting-section"><label>词库管理</label><div class="vocab-modal-actions"><button class="btn vocab-soft" id="vocab-import-json">导入 JSON 词库</button><button class="btn vocab-soft" id="vocab-refresh-words">重新同步公开词库</button><input type="file" id="vocab-json-file" accept=".json" hidden></div><p class="vocab-setting-note">兼容格式：[{"word":"example","meaning":"n. 例子"}]。导入只替换词库，不删除学习记录。</p></div><div class="vocab-setting-section danger-zone"><label>数据管理</label><button class="btn danger" id="vocab-clear-progress">清空单词学习进度</button></div><div class="vocab-modal-footer"><button class="btn vocab-primary" id="vocab-save-settings">保存设置</button><button class="btn" id="vocab-cancel-settings">取消</button></div>`);$$('.vocab-goal-options button').forEach(b=>b.onclick=()=>{$$('.vocab-goal-options button').forEach(x=>x.classList.remove('active'));b.classList.add('active')});$('#vocab-cancel-settings').onclick=closeModal;$('#vocab-save-settings').onclick=()=>{const s=$('.vocab-goal-options button.active');if(s)state.dailyGoal=Number(s.dataset.goal);state.preferences.autoSpeak=!!$('#vocab-auto-speak')?.checked;state.preferences.showIndex=!!$('#vocab-show-index')?.checked;save();closeModal();renderHome();notify('单词设置已保存')};$('#vocab-refresh-words').onclick=()=>{closeModal();sync(true)};$('#vocab-import-json').onclick=()=>$('#vocab-json-file').click();$('#vocab-json-file').onchange=importJson;$('#vocab-clear-progress').onclick=()=>{if(!confirm('确定清空全部单词学习进度、收藏和历史记录吗？词库本身不会删除。'))return;const keep={mode:state.mode,dailyGoal:state.dailyGoal,preferences:state.preferences,sourceCount:state.sourceCount,sourceName:state.sourceName,sourceUpdatedAt:state.sourceUpdatedAt};state={...structuredClone(defaults),...keep};save();closeModal();renderHome();notify('单词学习进度已清空')}}
  async function importJson(e){const f=e.target.files?.[0];if(!f)return;try{const v=JSON.parse(await f.text()),list=normalize(Array.isArray(v)?v:v.words||[],`我的词库：${f.name}`);if(list.length<10)throw Error('至少需要 10 个有效单词');localStorage.setItem(CACHE_KEY,JSON.stringify(list));words=list;state.sourceName=`我的词库：${f.name.replace(/\.json$/i,'')}`;state.sourceCount=list.length;state.sourceUpdatedAt=new Date().toISOString();state.orderCursor=clamp(state.orderCursor,0,list.length-1);save();closeModal();renderHome();notify(`已导入 ${list.length} 个单词`)}catch(err){notify(`导入失败：${err.message}`)}}
  async function sync(force=false){if(remoteLoading)return;const fresh=state.sourceUpdatedAt&&Date.now()-new Date(state.sourceUpdatedAt).getTime()<2592e6;if(!force&&fresh&&words.length>1000)return;remoteLoading=true;if(activeView==='home')renderHome();const ctrl=new AbortController,to=setTimeout(()=>ctrl.abort(),18000);try{const res=await fetch(REMOTE_WORDS_URL,{cache:'no-store',signal:ctrl.signal});if(!res.ok)throw Error(`网络响应 ${res.status}`);const list=normalize(await res.json());if(list.length<1000)throw Error('词库内容不完整');try{localStorage.setItem(CACHE_KEY,JSON.stringify(list))}catch{throw Error('本机存储空间不足，无法缓存完整词库')}words=list;state.sourceName='公开红宝书参考词库';state.sourceCount=list.length;state.sourceUpdatedAt=new Date().toISOString();state.orderCursor=clamp(state.orderCursor,0,list.length-1);save();if(force)notify(`完整词库已同步：${list.length} 词`)}catch(err){if(force)notify(err.name==='AbortError'?'同步超时，已继续使用本机词库':`同步失败：${err.message}`)}finally{clearTimeout(to);remoteLoading=false;if(activeView==='home')renderHome()}}
  function favorite(id){state.favorites[id]=!state.favorites[id];save();notify(state.favorites[id]?'已收藏这个单词':'已取消收藏')}
  function speak(word,msg=true){if(!word||!('speechSynthesis'in window)){if(msg)notify('当前系统暂不支持语音朗读');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang='en-US';u.rate=.86;u.pitch=1;speechSynthesis.speak(u)}
  function keys(e){if(activeView!=='study'||!state.session||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(e.code==='Space'){e.preventDefault();return reveal()}if(e.key.toLowerCase()==='s')return speak(current()?.word);if(e.key.toLowerCase()==='f'){const x=current();if(x){favorite(x.id);study()}return}const m={'1':'unknown','2':'fuzzy','3':'known','4':'easy'};if(state.session.revealed&&m[e.key])rate(m[e.key])}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()
})()
