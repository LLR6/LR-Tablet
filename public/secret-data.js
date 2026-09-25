export const SUBJECTS = [
  {key:'英语七选五',icon:'⑦',title:'考研七选五',desc:'段落逻辑、指代与衔接'},
  {key:'考研翻译',icon:'译',title:'考研翻译',desc:'拆主干、理从句、译顺中文'},
  {key:'长难句',icon:'句',title:'长难句训练',desc:'主干、从句、修饰成分'},
  {key:'408',icon:'408',title:'计算机408',desc:'数据结构、计组、操作系统、计网'},
  {key:'315',icon:'315',title:'化学（农）',desc:'无机分析与有机化学'},
  {key:'415',icon:'415',title:'动物生理与生化',desc:'动物生理学与动物生物化学'},
  {key:'政治',icon:'政',title:'考研政治',desc:'马原、史纲、思修与新思想'}
]

export const SETS = [
  {
    id:'408-starter',subject:'408',type:'mcq',title:'408核心判断·入门组',source:'真题考点改编',
    items:[
      {id:'408-1',stem:'在长度为 n 的顺序表中随机选择一个合法位置插入元素，平均移动元素个数约为',options:{A:'1',B:'log₂n',C:'n/2',D:'n'},answer:'C',explanation:'各插入位置等概率时，移动个数从0到n变化，平均值约为n/2。',topic:'数据结构'},
      {id:'408-2',stem:'Cache采用写回法时，脏位的作用是',options:{A:'记录是否命中',B:'记录该块是否被CPU修改',C:'记录替换次数',D:'记录是否为指令'},answer:'B',explanation:'被修改的块在替换时才需要写回主存。',topic:'计算机组成原理'},
      {id:'408-3',stem:'进程从运行态转为阻塞态通常是因为',options:{A:'时间片用完',B:'被高优先级进程抢占',C:'等待I/O或某个事件',D:'调度程序选中它'},answer:'C',explanation:'等待事件会主动阻塞；时间片用完或被抢占通常转为就绪态。',topic:'操作系统'},
      {id:'408-4',stem:'TCP连接建立采用三次握手的核心目的之一是',options:{A:'分配IP地址',B:'同步双方初始序号并确认收发能力',C:'避免路由环路',D:'协商MAC地址'},answer:'B',explanation:'三次握手确认双向通信能力并同步初始序列号。',topic:'计算机网络'},
      {id:'408-5',stem:'无向图采用邻接表存储，若有e条边，则边结点总数为',options:{A:'e',B:'2e',C:'e+1',D:'n+e'},answer:'B',explanation:'每条无向边在两个顶点的边表中各出现一次。',topic:'数据结构'},
      {id:'408-6',stem:'请求分页系统中发生页面置换的必要条件是',options:{A:'TLB命中',B:'进程创建',C:'缺页且没有空闲页框',D:'每次地址转换'},answer:'C',explanation:'有空闲页框时直接装入，无需置换。',topic:'操作系统'}
    ]
  },
  {
    id:'315-starter',subject:'315',type:'mcq',title:'315化学（农）·基础组',source:'原创模拟',
    items:[
      {id:'315-1',stem:'在25℃时，纯水中[H⁺]与[OH⁻]的关系是',options:{A:'[H⁺]>[OH⁻]',B:'[H⁺]<[OH⁻]',C:'[H⁺]=[OH⁻]=1.0×10⁻⁷ mol·L⁻¹',D:'二者均为0'},answer:'C',explanation:'25℃时Kw=1.0×10⁻¹⁴，纯水中两者相等。',topic:'酸碱平衡'},
      {id:'315-2',stem:'缓冲溶液抵抗少量强酸强碱影响的主要原因是',options:{A:'完全不发生反应',B:'含有弱酸及其共轭碱等缓冲对',C:'溶液温度不变',D:'离子强度恒为0'},answer:'B',explanation:'缓冲对分别消耗外加H⁺或OH⁻。',topic:'分析化学'},
      {id:'315-3',stem:'下列化合物中通常最容易发生亲电加成的是',options:{A:'烷烃',B:'烯烃',C:'苯',D:'醚'},answer:'B',explanation:'烯烃π键电子云丰富，易与亲电试剂发生加成。',topic:'有机化学'},
      {id:'315-4',stem:'EDTA配位滴定中常加入缓冲溶液，主要是为了',options:{A:'改变指示剂颜色',B:'控制金属离子与EDTA反应所需pH',C:'提高温度',D:'除去EDTA'},answer:'B',explanation:'配位平衡和条件稳定常数受pH显著影响。',topic:'配位滴定'}
    ]
  },
  {
    id:'415-starter',subject:'415',type:'mcq',title:'415动物生理与生化·基础组',source:'原创模拟',
    items:[
      {id:'415-1',stem:'动作电位去极化阶段的主要离子机制是',options:{A:'K⁺快速外流',B:'Na⁺快速内流',C:'Cl⁻快速内流',D:'Ca²⁺全部外流'},answer:'B',explanation:'电压门控Na⁺通道开放导致Na⁺内流。',topic:'动物生理学'},
      {id:'415-2',stem:'血红蛋白氧解离曲线右移通常意味着',options:{A:'对氧亲和力增强',B:'更不利于组织释放氧',C:'对氧亲和力降低并利于组织释氧',D:'血红蛋白含量必然增加'},answer:'C',explanation:'pH下降、CO₂升高、温度升高等可使曲线右移。',topic:'呼吸生理'},
      {id:'415-3',stem:'糖酵解过程中产生ATP的方式主要是',options:{A:'氧化磷酸化',B:'底物水平磷酸化',C:'光合磷酸化',D:'化学渗透'},answer:'B',explanation:'糖酵解在细胞质中通过底物水平磷酸化生成ATP。',topic:'生物化学'},
      {id:'415-4',stem:'酶的竞争性抑制通常表现为',options:{A:'Km增大，Vmax不变',B:'Km不变，Vmax降低',C:'Km与Vmax均降低',D:'Km与Vmax均不变'},answer:'A',explanation:'增加底物浓度可克服竞争性抑制，因此Vmax不变而表观Km增大。',topic:'酶学'}
    ]
  },
  {
    id:'politics-starter',subject:'政治',type:'mcq',title:'政治核心概念·基础组',source:'真题考点改编',
    items:[
      {id:'pol-1',stem:'马克思主义认识论认为，认识发展的根本动力是',options:{A:'主观愿望',B:'社会实践',C:'形式逻辑',D:'个人天赋'},answer:'B',explanation:'实践是认识的来源、动力、目的和检验标准。',topic:'马克思主义基本原理'},
      {id:'pol-2',stem:'中国共产党成立的年份是',options:{A:'1911年',B:'1919年',C:'1921年',D:'1927年'},answer:'C',explanation:'中国共产党于1921年成立。',topic:'史纲'},
      {id:'pol-3',stem:'社会主义核心价值观中，属于个人层面的价值准则是',options:{A:'富强、民主、文明、和谐',B:'自由、平等、公正、法治',C:'爱国、敬业、诚信、友善',D:'改革、发展、稳定、开放'},answer:'C',explanation:'爱国、敬业、诚信、友善是公民个人层面的价值准则。',topic:'思想道德与法治'},
      {id:'pol-4',stem:'推进中国式现代化必须坚持的最高原则是',options:{A:'资本主导',B:'中国共产党领导',C:'封闭发展',D:'单一所有制'},answer:'B',explanation:'坚持中国共产党领导是推进中国式现代化的最高原则。',topic:'新时代中国特色社会主义思想'}
    ]
  },
  {
    id:'seven-starter',subject:'英语七选五',type:'seven',title:'七选五·逻辑衔接训练',source:'原创模拟',
    passage:'Effective study plans are not lists of every task a student could possibly do. [[1]] A useful plan begins by identifying the few outcomes that matter most. It then divides them into actions small enough to start without hesitation. [[2]] This is why a plan should include review time rather than only new material. Students also need room for unexpected delays. [[3]] When a schedule is too tight, one missed session can make the whole week feel like a failure. A flexible plan, by contrast, makes it easier to return. [[4]] Progress becomes more visible when completed work is recorded. That evidence can strengthen motivation during difficult weeks. [[5]]',
    options:{A:'Learning also depends on returning to material before it is completely forgotten.',B:'They are decisions about what deserves attention now and what can wait.',C:'A small amount of unused time is therefore not waste but protection.',D:'The aim is not to create a perfect week but a repeatable one.',E:'Without such evidence, students may underestimate how much they have already done.',F:'Some students prefer studying in the morning.',G:'Every subject should receive exactly the same amount of time.'},
    answers:{'1':'B','2':'A','3':'C','4':'E','5':'D'},
    explanations:{'1':'前句否定“任务清单”，B说明计划本质是优先级决策。','2':'后句出现This is why review time，A正好说明需要间隔复习。','3':'后句解释计划过紧的风险，C提出预留空白时间。','4':'后句说记录完成量带来的证据，E先引出“evidence”。','5':'末句总结整段，D强调可重复而非完美。'}
  },
  {
    id:'translation-starter',subject:'考研翻译',type:'translation',title:'考研翻译·拆句训练',source:'原创模拟',
    items:[
      {id:'tr-1',text:'The assumption that more information automatically produces better decisions overlooks the fact that decision-makers must still judge which evidence is relevant.',reference:'认为信息越多就必然带来更好决策的假设，忽视了这样一个事实：决策者仍必须判断哪些证据是相关的。',analysis:'主干：The assumption overlooks the fact；两个that从句分别说明assumption与fact。'},
      {id:'tr-2',text:'Because attention is limited, choosing what not to study can be as important as deciding what deserves immediate effort.',reference:'由于注意力有限，决定不学什么，可能和决定什么值得立即投入精力同样重要。',analysis:'Because引导原因状语；两个动名词短语作比较。'},
      {id:'tr-3',text:'What makes a habit difficult to change is not simply its frequency but the way it has become connected with particular places and expectations.',reference:'使一种习惯难以改变的，不只是它出现得频繁，还在于它与特定地点和预期建立联系的方式。',analysis:'What从句作主语；not simply A but B为核心结构。'}
    ]
  },
  {
    id:'sentence-starter',subject:'长难句',type:'sentence',title:'长难句·主干与从句训练',source:'用户资料结构参考+原创模拟',
    items:[
      {id:'ls-1',text:'While digital tools can reduce the cost of communication, they may also increase the number of messages that people feel obliged to answer, leaving less time for concentrated work.',reference:'数字工具虽然可以降低沟通成本，却也可能增加人们觉得必须回复的信息数量，从而减少专注工作的时间。',analysis:'While引导让步状语；that修饰messages；leaving表示结果。'},
      {id:'ls-2',text:'The fact that a computer system produces the correct output for several test cases does not guarantee that its algorithm is correct for every valid input.',reference:'计算机系统在若干测试用例上产生正确输出这一事实，并不能保证其算法对每个合法输入都正确。',analysis:'第一个that为同位语从句，第二个that为宾语从句。'},
      {id:'ls-3',text:'Authors and agents worry that market concentration could lead to an excessive focus on bestsellers at the expense of niche titles that are no less worthy.',reference:'作者和经纪人担心，市场集中可能导致过度关注畅销书，从而牺牲同样有价值的小众图书。',analysis:'worry后接宾语从句；that are no less worthy修饰niche titles。'},
      {id:'ls-4',text:'Although the experiment did not confirm the original hypothesis, it narrowed the range of plausible explanations and therefore made the next question easier to ask.',reference:'尽管实验没有证实最初的假设，但它缩小了合理解释的范围，因此使下一个问题更容易提出。',analysis:'Although让步从句；主句含narrowed与made两个并列谓语。'}
    ]
  }
]

export const IMPORT_SAMPLE = {
  format:'lr-secret-bank-v1',
  sets:[{
    id:'my-set',subject:'408',type:'mcq',title:'我的题库',source:'我的导入',items:[
      {id:'q1',stem:'题干',options:{A:'选项A',B:'选项B',C:'选项C',D:'选项D'},answer:'A',explanation:'答案解析',topic:'章节'}
    ]
  }]
}
