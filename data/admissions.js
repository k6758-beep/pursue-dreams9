/* =====================================================================
 *  升學資料層：admissions.js
 *  ---------------------------------------------------------------------
 *  這是整個遊戲「唯一」需要每年更新的招生資訊檔。
 *  遊戲程式（js/game.js）只會讀這個檔案，不會寫死任何管道、資格或日期。
 *
 *  每年更新流程（詳見 README.md）：
 *   1. 改 meta：cycle（學年度）、updated（更新日期）、note。
 *   2. 改各管道 events 的日期；確認過正式簡章的日期，加上 confirmed:true。
 *      全部確認完後，把該管道的 status 改成 "confirmed"。
 *   3. 若資格有變，改 rules（判斷規則）與 who / conditions（給學生看的文字）。
 *   4. 用瀏覽器打開 data-check.html，畫面沒有紅字就可以上傳 GitHub。
 *
 *  日期格式一律 "YYYY-MM-DD"（西元）。
 * ===================================================================== */
window.ADMISSION_DATA = {

  /* ---------- 基本資訊 ---------- */
  meta: {
    cycle: "116學年度",
    // 遊戲劇情的時間軸：高三開學日與預估畢業典禮日（各校畢業日不同，抓大約即可）
    schoolYear: { start: "2026-09-01", graduation: "2027-06-10" },
    updated: "2026-10-08",
    // 只要還有任何管道 status 不是 "confirmed"，遊戲就會顯示這段提醒
    note: "標示「推估」的日期依 115 學年度簡章推算，正式日期以各招生簡章公告為準。",
    sameEducationNote: "沒拿到畢業證書也別慌：修滿高中職規定年限（六學期）、持有歷年成績單，就具「同等學力」，大部分管道一樣能報名。"
  },

  /* ---------- 正修聯絡資訊 ---------- */
  contact: {
    site: "https://visit.csu.edu.tw/",
    line: "https://line.me/R/ti/p/@csu1111",
    lineId: "@csu1111",
    tel: "招生處專線電話 (07)7310203",
    telLink: "tel:077310203",
    visit: "https://recruit.csu.edu.tw/1111/",   // 「參訪通行證」裝備的連結
    // 需要「學習歷程備審資料」的道路（portfolio: true）會顯示這段提醒
    briefing: {
      text: "要準備學習歷程備審資料嗎？報名參加正修舉辦的說明會，就會知道要怎麼準備。",
      url: "https://visit.csu.edu.tw/"     // 說明會報名頁（有專屬網址時請改這裡）
    },
    addr: "高雄市鳥松區澄清路 840 號"
  },

  /* ---------- 每個時間點「要做什麼」的小提示 ----------
   * 時間軸會用事件名稱比對 match（由上往下，第一個符合的就用），顯示 tip。
   */
  tips: [
    { match: "學測報名|統測報名", tip: "向考試中心報名考試，錯過就不能考，請提早和導師確認。" },
    { match: "考試", tip: "帶准考證、身分證應試，前一天先確認考場。" },
    { match: "學習歷程|修課紀錄", tip: "上網檢查學習歷程檔案，有錯要在期限內向學校反映。" },
    { match: "複試報名", tip: "到正修系統登錄基本資料，並繳交複試報名費。" },
    { match: "上傳", tip: "把資料做成 PDF 上傳，請提早完成，不要拖到最後一天。" },
    { match: "結果|成績|榜單|放榜|公告", tip: "上網查詢結果；有疑問要在複查期限內提出。" },
    { match: "資格審查", tip: "確認報名資格並上網登錄；應屆生多由學校協助辦理。" },
    { match: "推薦名單", tip: "由你的學校登錄推薦名單，請先通過校內遴選。" },
    { match: "繳費", tip: "完成繳費後，一定要上網查到「繳費成功」。" },
    { match: "報名", tip: "上網填寫資料、上傳文件並繳費，送出後再確認一次。" },
    { match: "甄試|甄審|術科|面試", tip: "依學校公告的時間地點參加，記得帶證件。" },
    { match: "志願", tip: "上網登記志願順序，送出後就不能修改。" },
    { match: "報到|註冊", tip: "依錄取學校規定完成報到，逾期視同放棄。" }
  ],

  /* ---------- 身分問題 ----------
   * stage: "create" = 遊戲一開始「建立角色」時問
   *        "backpack" = DAY 15 學長「背包檢查」時問（成績、證照、特殊經歷）
   * when:  符合條件才會問（條件寫法見檔案最下方說明）
   * set:   選了這個選項後，順便改寫其他欄位（例如「不確定」→ 判斷出學校類型）
   * multi: 可複選；值為 "none" 的選項會與其他選項互斥
   */
  questions: [
    { id: "type", stage: "create", text: "你現在讀的是？", opts: [
      { v: "gen",  icon: "📘", label: "高中普通科", hint: "國英數社自為主" },
      { v: "comp", icon: "🔀", label: "綜合高中", hint: "有學術學程或專門學程" },
      { v: "voc",  icon: "🔧", label: "高職（技術型高中）", hint: "有專業科目和實習課" },
      { v: "gen",  icon: "🏫", label: "高職附設普通科", set: { vgen: "yes" } },
      { v: "unk",  icon: "❓", label: "我不太確定" }
    ]},
    { id: "h1", stage: "create", when: { type: "unk" }, text: "你的學校有分「學術學程」和「專門學程」嗎？", opts: [
      { v: "y", icon: "✅", label: "有，聽過", set: { type: "comp" } },
      { v: "n", icon: "❌", label: "沒聽過" }
    ]},
    { id: "h2", stage: "create", when: { type: "unk", h1: "n" }, text: "你的課表裡有很多實習課、專業科目嗎？（例：電子學、會計、餐飲實務）", opts: [
      { v: "y", icon: "🛠️", label: "有，很多", set: { type: "voc" } },
      { v: "n", icon: "📚", label: "沒有，大多是國英數社自", set: { type: "gen" } }
    ]},
    { id: "track", stage: "create", when: { type: "comp" }, text: "你選的是哪一種學程？", opts: [
      { v: "pro", icon: "🛠️", label: "專門學程", hint: "偏技職" },
      { v: "aca", icon: "📚", label: "學術學程", hint: "偏普通高中" },
      { v: "unk", icon: "🤔", label: "還不確定" }
    ]},
    { id: "cred", stage: "create", when: { type: "comp" }, text: "到高三上，你修的「專門學程科目」有到 25 學分嗎？", opts: [
      { v: "yes", icon: "✅", label: "有", hint: "專門學程通常都有" },
      { v: "no",  icon: "❌", label: "沒有" },
      { v: "unk", icon: "🤔", label: "不知道" }
    ]},
    { id: "art", stage: "create", when: { type: "voc" }, text: "你的科別是「藝術群」嗎？（多媒體動畫、美術、影劇、音樂、舞蹈…）", opts: [
      { v: "yes", icon: "🎨", label: "是" },
      { v: "no",  icon: "🔧", label: "不是" }
    ]},
    { id: "cross", stage: "create", when: { type: "gen" }, text: "高三上以前，你有跨選專業群科課程到 25 學分嗎？", opts: [
      { v: "yes", icon: "✅", label: "有" },
      { v: "no",  icon: "❌", label: "沒有" },
      { v: "unk", icon: "🤔", label: "不知道" }
    ]},
    { id: "grad", stage: "create", text: "你是今年要畢業的高三生嗎？", opts: [
      { v: "now",  icon: "🎒", label: "是，應屆畢業生" },
      { v: "past", icon: "🎓", label: "我已經畢業了" }
    ]},

    { id: "rank", stage: "backpack", when: { grad: "now", any: [{ type: "voc" }, { type: "comp", cred: { not: "no" } }] },
      text: "你的在校成績，大概在本科前 30% 嗎？", opts: [
      { v: "yes",   icon: "📈", label: "是" },
      { v: "maybe", icon: "🤏", label: "差一點，在邊緣" },
      { v: "no",    icon: "🌱", label: "還沒有" }
    ]},
    { id: "coop", stage: "backpack", text: "你是「產學攜手合作專班」的學生嗎？", opts: [
      { v: "yes", icon: "🏭", label: "是" },
      { v: "no",  icon: "❌", label: "不是" },
      { v: "unk", icon: "🤔", label: "不知道" }
    ]},
    { id: "skills", stage: "backpack", multi: true, text: "背包裡有哪些戰績？（可複選）", opts: [
      { v: "cert2",   icon: "🏅", label: "乙級以上技術士證" },
      { v: "contest", icon: "🥇", label: "全國高中職技藝競賽得名" },
      { v: "worldskill", icon: "🏆", label: "全國或國際技能競賽得名" },
      { v: "c3",      icon: "📄", label: "目前只有丙級" },
      { v: "none",    icon: "🌱", label: "都還沒有" }
    ]},
    { id: "special", stage: "backpack", multi: true, text: "還有這些特別的東西嗎？（可複選）", opts: [
      { v: "talent", icon: "⭐", label: "特殊才能、作品", hint: "設計、程式、表演、發明…" },
      { v: "exp",    icon: "🧭", label: "實驗教育／自學" },
      { v: "youth",  icon: "💰", label: "青年儲蓄帳戶方案" },
      { v: "sport",  icon: "⚾", label: "運動成績優良", hint: "全國賽得名、代表隊" },
      { v: "unsure", icon: "🤔", label: "不確定算不算" },
      { v: "none",   icon: "🌱", label: "都沒有" }
    ]}
  ],

  /* ---------- 「你還願意準備什麼？」----------
   * id 會對應到各管道的 tags，用來推薦「最適合探索的道路」
   */
  willing: [
    { id: "xue",       icon: "📚", label: "考學測" },
    { id: "tong",      icon: "⚙️", label: "考統測" },
    { id: "grade",     icon: "📈", label: "顧好在校成績" },
    { id: "port",      icon: "📁", label: "整理學習歷程、備審" },
    { id: "cert",      icon: "🏅", label: "考證照、參加競賽" },
    { id: "art",       icon: "🎨", label: "準備作品集" },
    { id: "interview", icon: "👔", label: "準備面試" },
    { id: "skilltest", icon: "🏃", label: "準備術科測驗" },
    { id: "work",      icon: "💼", label: "邊工作邊讀書" }
  ],

  /* ---------- 升學道路（管道）----------
   * status: "estimated"（日期推估中）或 "confirmed"（已對照正式簡章）
   * portfolio: true = 需要學習歷程備審資料（會提醒參加正修說明會）
   * later: "work" = 玩家沒有選這個意願（willing 的 id）時，推薦順序排在最後
   * exam.need: true = 要考試；false = 免考試
   * rules: 由上往下比對，第一條符合的就是結果
   *        st: "g" 可以走 / "y" 需要確認 / "r" 目前不符合
   * otherwise: 都不符合時的結果
   * events.key: true = 這條路最重要的時間點（倒數提醒、時間小遊戲會用）
   */
  paths: [
    {
      id: "caac", road: "學測之路", name: "四技申請入學", icon: "🏰", color: "#4EA8FF",
      status: "estimated", portfolio: true,
      url: "https://visit.csu.edu.tw/p/412-1072-2191.php?Lang=zh-tw",
      exam: { need: true, label: "要考學測", detail: "第一階段看學測篩選；正修第二階段只審學習歷程備審，不面試、不用到校。" },
      who: "普通科、綜合高中、高職藝術群的同學",
      conditions: ["普通高中普通科、綜合高中（學術或專門學程）", "高職藝術群也可以", "應屆、非應屆都可以"],
      prep: ["學測成績", "學習歷程備審（修課紀錄、學習成果、多元表現）", "學習歷程自述", "正修複試報名費"],
      pitfalls: ["學測報名在高三上 10 月底就開始，很多人以為 1 月才要管。", "每人最多申請 6 個校系，要先排好順序。"],
      csu: "正修第二階段只看學習歷程備審資料，不面試、不用到校。可以報名參加正修的備審說明會。",
      intel: "普通科也能進科技大學！",
      tags: ["xue", "port"],
      events: [
        { from: "2026-10-28", to: "2026-11-11", what: "學測報名", key: true },
        { from: "2027-01-22", to: "2027-01-24", what: "學測考試", confirmed: true },
        { from: "2027-02-25", what: "學測成績公布" },
        { from: "2027-03-19", to: "2027-03-25", what: "第一階段網路報名＋繳費" },
        { from: "2027-03-31", what: "第一階段篩選結果公告" },
        { from: "2027-03-31", to: "2027-05-06", what: "正修第二階段複試報名＋繳費" },
        { from: "2027-04-30", to: "2027-05-06", what: "上傳資格審查＋學習歷程備審" },
        { from: "2027-05-21", what: "正修榜單公告" },
        { from: "2027-06-12", what: "正取生報到截止" }
      ],
      rules: [
        { when: { type: "gen" }, st: "g", why: "普通科學生可以參加。" },
        { when: { type: "comp" }, st: "g", why: "綜合高中學生（學術或專門學程）都可以參加。" },
        { when: { type: "voc", art: "yes" }, st: "g", why: "高職藝術群學生也可以參加。" }
      ],
      otherwise: { st: "r", why: "限普通科、綜合高中、藝術群。你的主戰場在統測和免試的路！" }
    },
    {
      id: "apply", road: "統測甄選之路", name: "四技甄選入學", icon: "⚔️", color: "#FF9F43",
      status: "estimated", portfolio: true,
      url: "https://www.jctv.ntut.edu.tw/enter42/apply/",
      exam: { need: true, label: "要考統測", detail: "第一階段用統測篩選，第二階段依各系指定項目甄試。" },
      who: "高職專業群科、綜合高中專門學程的同學",
      conditions: ["高職專業群科", "綜合高中修畢專門學程科目 25 學分以上", "普通科畢業滿 1 年", "另有青年儲蓄帳戶組"],
      prep: ["統測成績", "專題實作／實習科目學習成果（至少 1 件）", "學習歷程備審", "證照、競賽得獎（可加分）", "指定項目甄試（面試、實作等）"],
      pitfalls: ["116 學年度起統測改「自主選考」：至少考 2 科、須含 1 科專業科目，要先查目標校系採計哪些科。", "很多人以為統測只能拿來分發，其實甄選 7 月中就放榜。"],
      csu: "最多申請 6 個校系；證照或得獎可以在總成績加分。",
      intel: "統測不只拿來分發，7 月中就可能透過甄選拿到學校。",
      tags: ["tong", "port", "interview"],
      events: [
        { from: "2026-12-05", to: "2026-12-17", what: "統測報名", key: true },
        { from: "2027-04-16", to: "2027-04-29", what: "報名資格審查登錄" },
        { from: "2027-04-25", to: "2027-04-26", what: "統測考試" },
        { from: "2027-05-15", to: "2027-05-22", what: "第一階段報名＋繳費" },
        { from: "2027-06-01", what: "第一階段篩選結果公告" },
        { from: "2027-06-05", to: "2027-06-12", what: "第二階段報名＋上傳備審" },
        { from: "2027-06-13", to: "2027-06-28", what: "第二階段指定項目甄試" },
        { from: "2027-07-08", to: "2027-07-10", what: "登記就讀志願序" },
        { from: "2027-07-14", what: "統一分發放榜" }
      ],
      rules: [
        { when: { special: { any: ["youth"] } }, st: "g", why: "你可以報名「青年儲蓄帳戶組」。" },
        { when: { type: "voc" }, st: "g", why: "專業群科學生可以參加。" },
        { when: { type: "comp", cred: "yes" }, st: "g", why: "綜合高中專門學程 25 學分以上，可以參加。" },
        { when: { type: "comp", cred: "unk" }, st: "y", why: "要修畢專門學程科目 25 學分以上，請向學校確認學分。" },
        { when: { type: "comp" }, st: "r", why: "需要專門學程科目 25 學分；你可以走學測或登記分發。" },
        { when: { type: "gen", grad: "past" }, st: "g", why: "普通科畢業滿 1 年可以參加。" },
        { when: { type: "gen", cross: "yes" }, st: "y", why: "跨選專業群科達 25 學分可比照綜高生，需學校認定。" }
      ],
      otherwise: { st: "r", why: "普通科應屆生還不能報名；畢業滿 1 年後就可以。" }
    },
    {
      id: "union", road: "統測分發之路", name: "聯合登記分發", icon: "🗺️", color: "#FF7A45",
      status: "estimated",
      url: "https://www.jctv.ntut.edu.tw/union42/",
      exam: { need: true, label: "要考統測", detail: "完全依統測成績和志願順序分發。" },
      who: "高職專業群科、綜合高中的同學",
      conditions: ["高職專業群科", "綜合高中（學術或專門學程）", "普通科畢業滿 1 年"],
      prep: ["統測成績", "5 月資格審查登錄（應屆生多由學校集體辦理）", "繳登記費並查到「繳費成功」", "網路選填志願"],
      pitfalls: ["報名其實從 5 月的資格審查登錄就開始，不是放榜後才報。", "7 月繳完費一定要查到「繳費成功」；志願送出後不能改。"],
      csu: "填正修為第一志願入學，有入學獎 5 千元（以當年公告為準）。",
      intel: "報名從 5 月資格審查就開始了。",
      tags: ["tong"],
      events: [
        { from: "2026-12-05", to: "2026-12-17", what: "統測報名" },
        { from: "2027-04-25", to: "2027-04-26", what: "統測考試" },
        { from: "2027-05-04", to: "2027-05-08", what: "資格審查登錄（學校集體）", key: true },
        { from: "2027-05-14", to: "2027-06-03", what: "資格審查登錄（個別）" },
        { from: "2027-07-17", to: "2027-07-22", what: "個別繳費＋查繳費狀態" },
        { from: "2027-07-28", to: "2027-07-31", what: "網路選填志願" },
        { from: "2027-08-06", what: "錄取公告" }
      ],
      rules: [
        { when: { type: "voc" }, st: "g", why: "專業群科學生可以參加。" },
        { when: { type: "comp" }, st: "g", why: "綜合高中學生都可以參加。" },
        { when: { type: "gen", grad: "past" }, st: "g", why: "普通科畢業滿 1 年可以參加。" }
      ],
      otherwise: { st: "r", why: "普通科應屆生還不能登記；畢業滿 1 年後就可以。" }
    },
    {
      id: "star", road: "繁星之路", name: "科技繁星", icon: "🌟", color: "#FF6FB5",
      status: "estimated",
      url: "https://www.jctv.ntut.edu.tw/star/",
      exam: { need: false, label: "免考試", detail: "免統測、免學測，用在校成績比序，由你的學校推薦。" },
      who: "成績在前 30% 的高職、綜高專門學程應屆生",
      conditions: ["高職專業群科、綜高專門學程 25 學分以上", "限應屆畢業生", "科（組）成績前 30%", "高一到高三都在同一所學校"],
      prep: ["高一～高三上的在校成績", "通過校內遴選推薦", "競賽、證照、語檢（比序加分）", "幹部、志工、社團經歷"],
      pitfalls: ["校內遴選時間各校不同，寒假前就要去問導師。", "普通科不在科技繁星推薦範圍內。"],
      csu: "正修科技繁星名額 67 名（以當年簡章為準）。",
      intel: "平常的在校成績就是門票，5 月就放榜。",
      tags: ["grade"],
      events: [
        { from: "2027-02-23", to: "2027-03-10", what: "學校登錄推薦名單", key: true },
        { from: "2027-03-11", to: "2027-03-18", what: "網路報名" },
        { from: "2027-04-22", to: "2027-04-28", what: "選填志願" },
        { from: "2027-05-05", what: "錄取放榜" }
      ],
      rules: [
        { when: { grad: "past" }, st: "r", why: "科技繁星只限應屆畢業生。" },
        { when: { type: "gen" }, st: "r", why: "科技繁星推薦的是專業群科和綜高專門學程，不含普通科。" },
        { when: { type: "comp", cred: "no" }, st: "r", why: "綜合高中要修畢專門學程科目 25 學分以上，才能被推薦。" },
        { when: { rank: "yes", type: "comp", cred: "unk" }, st: "y", why: "成績夠了！再向學校確認專門學程學分。" },
        { when: { rank: "yes" }, st: "g", why: "在校成績前 30%，記得向學校爭取校內推薦！" },
        { when: { rank: "maybe" }, st: "y", why: "就在 30% 邊緣，高三上的成績很關鍵。" }
      ],
      otherwise: { st: "r", why: "需要在校成績科（組）前 30%，且三年都在同一所學校。" }
    },
    {
      id: "skillrev", road: "技優之路", name: "技優甄審", icon: "🏅", color: "#9C6BFF",
      status: "estimated", portfolio: true,
      url: "https://www.jctv.ntut.edu.tw/enter42/skill/",
      exam: { need: false, label: "免統測", detail: "資格審查＋學習歷程備審＋各校指定項目甄審。" },
      who: "有乙級證照或技藝競賽得名的同學",
      conditions: ["乙級以上技術士證或專技普考及格", "或全國技能競賽、全國高中職技藝競賽等得名"],
      prep: ["乙級以上證照或競賽獎狀", "學習歷程備審", "指定項目甄審費", "指定項目甄審（依各系規定）"],
      pitfalls: ["丙級還不夠，要乙級以上。", "和甄選入學同時錄取時，只能選一個報到。"],
      csu: "最多報名 5 個校系；可以參加正修的備審說明會。",
      intel: "一張乙級證照，就多一條免統測的路。",
      tags: ["cert", "port", "interview"],
      events: [
        { from: "2027-04-29", to: "2027-05-06", what: "繳報名費＋資格審查登錄", key: true },
        { from: "2027-05-18", to: "2027-05-22", what: "網路報名選校系" },
        { from: "2027-06-04", to: "2027-06-09", what: "上傳備審＋繳甄審費" },
        { from: "2027-06-12", to: "2027-06-21", what: "指定項目甄審" },
        { from: "2027-07-07", what: "統一分發放榜" }
      ],
      rules: [
        { when: { skills: { any: ["cert2", "contest", "worldskill"] } }, st: "g", why: "你的證照或競賽成績可以報名！" },
        { when: { skills: { any: ["c3"] } }, st: "r", why: "丙級還差一步，拚到乙級就能打開這條路。" }
      ],
      otherwise: { st: "r", why: "需要乙級以上技術士證，或技藝技能競賽得名。" }
    },
    {
      id: "special", road: "特殊選才之路", name: "四技特殊選才", icon: "⭐", color: "#3FD0D4",
      status: "estimated",
      url: "https://visit.csu.edu.tw/p/412-1072-1352.php?Lang=zh-tw",
      exam: { need: false, label: "免考試", detail: "不採計統測、學測；正修「技職特才及實驗教育組」以備審資料 100% 計分。" },
      who: "有特殊才能、作品、經歷，或參加青年儲蓄帳戶方案的同學",
      conditions: ["技職特才及實驗教育組：符合正修各系訂的專長、經歷或成就條件", "青年儲蓄帳戶組：參加方案滿 2 年或 3 年", "兩組只能擇一報名"],
      prep: ["作品集或專業成就證明", "特殊經歷、專長說明", "備審資料（1 月上傳）", "指定項目甄審費"],
      pitfalls: ["這是四技最早的一條路，12 月中就報名，很多人發現時已經過了。", "各系條件不同，要先看正修特殊選才的招生系別表。"],
      csu: "正修各系的報名條件，請看正修招生網「特殊選才」頁。",
      intel: "高三上 12 月就能報名，2 月就知道結果。",
      tags: ["art", "port"],
      events: [
        { from: "2026-12-15", to: "2026-12-19", what: "網路報名＋資格審查", key: true },
        { from: "2027-01-12", to: "2027-01-16", what: "上傳備審＋繳甄審費" },
        { from: "2027-01-23", to: "2027-01-31", what: "指定項目甄審" },
        { from: "2027-02-11", what: "統一分發放榜" }
      ],
      rules: [
        { when: { special: { any: ["youth"] } }, st: "g", why: "你可以報名「青年儲蓄帳戶組」！" },
        { when: { special: { any: ["talent", "exp"] } }, st: "g", why: "你可能符合「技職特才及實驗教育組」，請對照正修各系條件！" },
        { when: { special: { any: ["unsure"] } }, st: "y", why: "看看正修各系指定的才能或經歷，說不定你就符合。" }
      ],
      otherwise: { st: "r", why: "需要符合各系訂的專長、經歷或成就條件，或參加青年儲蓄帳戶方案。" }
    },
    {
      id: "sport", road: "運動績優之路", name: "運動績優單獨招生", icon: "⚾", color: "#5BD17A",
      status: "estimated",
      url: "https://visit.csu.edu.tw/",
      exam: { need: false, label: "免學測統測", detail: "書面審查 70%＋術科測驗 30%。" },
      who: "運動成績優良的同學",
      conditions: ["高中職畢業或具同等學力", "全國性運動賽事得名、代表隊經歷等（依簡章認定）"],
      prep: ["運動成績證明", "書面審查資料（70%）", "術科測驗（30%）：折返跑、仰臥起坐、立定跳遠"],
      pitfalls: ["只能選 1 個系報名。"],
      csu: "正修自辦！休閒與運動管理系、電競科技系等有名額。",
      intel: "運動場上的努力，也能變成升學門票。",
      tags: ["skilltest", "port"],
      events: [
        { from: "2027-05-15", what: "網路報名截止", key: true },
        { from: "2027-05-23", what: "術科測驗" },
        { from: "2027-06-03", what: "放榜" }
      ],
      rules: [
        { when: { special: { any: ["sport"] } }, st: "g", why: "你的運動成績可能符合資格，請對照簡章認定項目。" }
      ],
      otherwise: { st: "r", why: "需要運動相關資格（例如全國性賽事得名）。" }
    },
    {
      id: "solo", road: "正修直達之路", name: "日四技單獨招生", icon: "🚪", color: "#2EC4B6",
      status: "estimated",
      url: "https://visit.csu.edu.tw/",
      exam: { need: false, label: "免考試", detail: "純書審：在校成績 30%＋書面資料 70%，免筆試、免面試。" },
      who: "所有高中職畢業生（普通科應屆也可以）",
      conditions: ["高中職畢業生或具同等學力", "普通科應屆生也可以"],
      prep: ["畢業證書或學生證", "在校歷年成績單正本", "自傳 500 字內", "證照、獎狀、推薦函（選繳）"],
      pitfalls: ["只能選 1 個系，要先想好最想讀的。"],
      csu: "正修自辦，是暑假最後一波日間部機會。",
      intel: "前面的路都沒上，8 月還有一扇門。",
      tags: ["port"],
      events: [
        { from: "2027-08-06", to: "2027-08-12", what: "網路報名＋上傳資料＋繳費", key: true },
        { from: "2027-08-19", what: "放榜" },
        { from: "2027-08-20", what: "正取生報到" }
      ],
      rules: [],
      otherwise: { st: "g", why: "高中職畢業生都可以報名，普通科應屆生也可以。" }
    },
    {
      id: "industry", road: "產學攜手之路", name: "產學攜手合作專班", icon: "🤝", color: "#F4B63F",
      status: "estimated",
      url: "https://recruit.csu.edu.tw/industryPFT/",
      exam: { need: false, label: "免考試", detail: "書面資料＋合作企業面試。" },
      who: "產學攜手合作高職專班的同學為主",
      conditions: ["以原產學攜手合作高職專班學生為主", "需通過合作企業面試"],
      prep: ["2 吋大頭照", "學歷證明、身分證", "歷年成績單", "企業面試"],
      pitfalls: ["不是一般報名就好，企業面試才是關鍵。"],
      csu: "66 輪調：半年上課、半年在公司；421 模式：每週工作 4 天、上課 2 天。",
      intel: "讀大學，也能同時累積工作經驗和收入。",
      tags: ["work", "interview"],
      events: [
        { from: "2027-03-02", to: "2027-07-06", what: "網路報名＋上傳資料", key: true },
        { from: "2027-07-08", to: "2027-07-10", what: "企業面試" },
        { from: "2027-07-14", what: "公告錄取名單" }
      ],
      rules: [
        { when: { coop: "yes" }, st: "g", why: "你可能已經站在一條很特別的路上！" }
      ],
      otherwise: { st: "y", why: "以原合作專班學生為主，需要通過企業面試。" }
    },
    {
      id: "night", road: "進修夜讀之路", name: "四技二專進修部", icon: "🌙", color: "#7C83FF",
      // later: "work" = 玩家沒有選「邊工作邊讀書」（willing 的 work）時，推薦順序排在最後
      status: "estimated", later: "work",
      url: "https://visit.csu.edu.tw/",
      exam: { need: false, label: "免考試", detail: "書面資料審查 100%。" },
      who: "想邊工作邊讀書的高中職畢業生",
      conditions: ["高中職畢業生", "普通科應屆可報四技；二專需取得學歷滿 1 年"],
      prep: ["身分證、大頭照", "學生證或成績單", "書審資料（選繳）"],
      pitfalls: ["以普通科學歷報二專，需要畢業滿 1 年。"],
      csu: "平日班 18:50～22:05；週間班、假日班每週到校 2 天。畢業一樣拿學士學位。",
      intel: "白天工作、晚上讀書，一樣拿學士學位。",
      tags: ["work", "port"],
      events: [
        { from: "2027-03-02", to: "2027-08-12", what: "網路報名＋上傳資料", key: true },
        { from: "2027-08-19", what: "甄選結果" },
        { from: "2027-08-22", what: "正取生報到註冊" }
      ],
      rules: [
        { when: { type: "gen", grad: "now" }, st: "g", why: "可以報名四技進修部（二專需畢業滿 1 年）。" }
      ],
      otherwise: { st: "g", why: "高中職畢業生都可以報名四技或二專進修部。" }
    }
  ]
};

/* =====================================================================
 *  條件（when）寫法說明
 *  { type: "gen" }                       type 等於 gen
 *  { type: ["voc","comp"] }              type 是 voc 或 comp
 *  { cred: { not: "no" } }               cred 不是 no
 *  { skills: { any: ["cert2","c3"] } }   複選題 skills 裡有其中一個
 *  { any: [ {...}, {...} ] }             符合其中一組就算
 *  同一個 { } 裡的多個欄位 = 全部都要符合
 *
 *  可用欄位：type(gen/comp/voc/unk)、vgen、track、cred、art、cross、grad(now/past)、
 *           rank、coop、skills、special
 * ===================================================================== */
