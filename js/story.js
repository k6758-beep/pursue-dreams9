/* =====================================================================
 *  故事內容：story.js
 *  NPC 台詞、情報碎片、裝備、結局文字都在這裡，改文案不用動 game.js。
 *  （招生管道、資格、日期請改 data/admissions.js）
 * ===================================================================== */
window.STORY = {

  /* 劇情站點：高三這一年（日期只寫月-日，年份由 admissions.js 的 schoolYear 推算） */
  stations: [
    { date: "09-01", title: "高三開學", sub: "建立你的角色" },
    { date: "09-20", title: "九月", sub: "有人已經決定學校了" },
    { date: "10-15", title: "十月", sub: "第一次遇到升學管道問題" },
    { date: "10-25", title: "十月底", sub: "不同的人，有不同的路" },
    { date: "11-05", title: "十一月", sub: "有些事要提前準備" },
    { date: "11-20", title: "十一月", sub: "重新檢視自己的選擇" },
    { date: "11-30", title: "十一月底", sub: "寫下我的升學策略" },
    { date: "12-01", title: "時光快轉", sub: "拖曳時間軸，走過高三這一年" },
    { date: "06-10", title: "畢業典禮", sub: "" }
  ],

  /* 開場教室裡的聲音 */
  openingChatter: [
    { who: "zhe",   text: "欸，你畢業後去哪？" },
    { who: "datou", text: "反正應該有學校可以念吧？" },
    { who: "yu",    text: "我還沒想好……" },
    { who: "an",    text: "你知道你要走哪個升學管道嗎？" }
  ],

  /* NPC 同學 */
  npcs: {
    zhe:   { name: "阿哲", face: "😎", color: "#4EA8FF", type: "早就決定型" },
    datou: { name: "大頭", face: "😆", color: "#FFB547", type: "反正有學校型" },
    yu:    { name: "品妤", face: "🙂", color: "#FF7AA2", type: "家長決定型" },
    an:    { name: "小安", face: "🤔", color: "#5BD17A", type: "有興趣但不知道怎麼走型" },
    mo:    { name: "阿默", face: "😶", color: "#A59CFF", type: "完全迷惘型" },
    senior:{ name: "去年畢業的學長", face: "🧢", color: "#F2F0E6", type: "學長" }
  },

  /* 角色建立：現在的狀態（六種，沒有對錯） */
  mindsets: [
    { id: "A", icon: "📍", label: "我已經知道要讀哪間學校", quote: "目標早就鎖定了。", title: "已鎖定目的地的人",
      stats: { goal: 70, intel: 30, prep: 30, time: 40, explore: 25 } },
    { id: "B", icon: "🧭", label: "有想讀的方向，但不知道怎麼走", quote: "我想讀設計／餐飲／資訊，可是不知道怎麼進。", title: "握著羅盤的旅人",
      stats: { goal: 50, intel: 20, prep: 20, time: 30, explore: 40 } },
    { id: "C", icon: "🛋️", label: "現在不用急吧", quote: "還有很多時間啦。", title: "慢慢來派",
      stats: { goal: 30, intel: 20, prep: 10, time: 10, explore: 30 } },
    { id: "D", icon: "🎲", label: "反正一定有學校可以念", quote: "到時候再看看就好。", title: "隨遇而安派",
      stats: { goal: 20, intel: 20, prep: 10, time: 20, explore: 25 } },
    { id: "E", icon: "🗺️", label: "爸媽已經幫我決定了", quote: "我爸媽叫我讀這間。", title: "拿著別人畫的地圖的人",
      stats: { goal: 45, intel: 20, prep: 20, time: 30, explore: 15 } },
    { id: "F", icon: "☁️", label: "我真的不知道未來要去哪", quote: "我真的不知道。", title: "白紙冒險者",
      stats: { goal: 10, intel: 10, prep: 10, time: 20, explore: 40 } }
  ],

  /* 9月 班群：每個 NPC 的訊息 → 你點開後說的第一句（opener）→ 他的回覆（reply）
   * → 你可以怎麼回（options：label 你說的話、resp 他的回應、stat 加分）
   * 每位同學的選項都針對他自己的狀況設計，回應要接得上。 */
  groupChat: [
    { who: "zhe", text: "欸我已經決定了，要讀資工 💻",
      opener: "你已經決定要讀資工了喔？",
      reply: "對啊！我學長說同一個系可以走好幾條路，我在想要先拚哪一條。",
      options: [
        { icon: "😮", label: "同一個系可以走好幾條路？", resp: "對啊，像申請入學、甄選入學、技優甄審，都可能進到同一個系。我也是最近才知道的。", stat: { intel: 6 } },
        { icon: "👍", label: "好厲害，你都想好了", resp: "也還好啦，只是比較早開始查。你也可以先查查看你想讀什麼啊。", stat: { goal: 4 } },
        { icon: "😅", label: "我連要讀什麼都還沒想…", resp: "那就先從你有興趣的東西開始找，不用一次就決定。", stat: { explore: 6 } }
      ] },
    { who: "datou", text: "蛤？現在就要決定喔？反正先畢業再說啦 🏀",
      opener: "你真的打算畢業後再想喔？",
      reply: "我是覺得一定有學校可以念啦……應該吧？",
      options: [
        { icon: "🤝", label: "我也是這樣想耶", resp: "對嘛！……不過我好像有聽說，有些報名高三上就開始了，真的假的？", stat: { time: 4 } },
        { icon: "⏰", label: "可是聽說有些報名很早就開始了", resp: "蛤？真的假的？那我是不是該查一下……", stat: { time: 6 } },
        { icon: "🤔", label: "有學校念，但不一定是你想念的", resp: "……這句有點痛。好啦，我會想一下。", stat: { goal: 4 } }
      ] },
    { who: "yu", text: "我爸叫我去讀那間。",
      opener: "那間是你自己也想讀的嗎？",
      reply: "其實我也不知道我想不想。可是我也說不出我想讀什麼。",
      options: [
        { icon: "💬", label: "你有跟爸媽說你的想法嗎？", resp: "還沒……我怕說了他們會不高興。也許我先想清楚，再找時間跟他們聊。", stat: { goal: 4 } },
        { icon: "🔍", label: "要不要先找找看自己喜歡什麼？", resp: "嗯……我可以先查查看有哪些科系，說不定會找到喜歡的。", stat: { explore: 6 } },
        { icon: "🫂", label: "我也常常不知道自己想要什麼", resp: "原來不是只有我這樣，好像沒那麼慌了。", stat: { explore: 4 } }
      ] },
    { who: "an", text: "我想讀設計，可是我不知道怎麼進 😵",
      opener: "你想讀設計喔？",
      reply: "對啊！可是聽說要準備作品集，那要什麼時候交啊……",
      options: [
        { icon: "🙋", label: "我也不知道，一起去問學長姐吧", resp: "好啊！學長姐一定比我們清楚，問完我們再一起整理。", stat: { intel: 6 } },
        { icon: "📁", label: "有些升學管道會看作品，先把作品存起來", resp: "對耶，我先把以前畫的東西整理起來好了！", stat: { goal: 4 } },
        { icon: "✋", label: "我也有想讀的，但也不知道怎麼進", resp: "那我們一起找方法！兩個人查比較快。", stat: { explore: 6 } }
      ] },
    { who: "mo", text: "……我真的不知道。",
      opener: "你還好嗎？看到你的訊息。",
      reply: "大家好像都知道自己要幹嘛，只有我沒有。",
      options: [
        { icon: "🫂", label: "其實我也還不知道", resp: "真的嗎？……那我好像沒那麼奇怪了。", stat: { explore: 4 } },
        { icon: "🌱", label: "不知道也沒關係，可以慢慢找", resp: "嗯……謝謝你。我會試著找找看。", stat: { explore: 6 } },
        { icon: "🎮", label: "那你平常喜歡做什麼？", resp: "我喜歡打電動……這也算嗎？原來電競也有科系喔？", stat: { explore: 8 } }
      ] }
  ],

  /* 情報碎片：收集到 3 片解鎖升學路線圖鑑 */
  fragments: {
    grade:    "升學不只看成績，還要知道適合自己的管道以及報名的期程。",
    identity: "你的學制，加上背包裡的成績、證照與特殊經歷，會決定你能走哪幾條升學道路。",
    timing:   "不同的升學道路，大多有不同的時程與準備要求。",
    manyRoads:"一個科系，通常不只一條路可以到。",
    explore:  "興趣可以先從「世界」開始找，不用一次就決定科系。",
    others:   "別人的路可以參考，但不用照抄。",
    sameEdu:  "沒拿到畢業證書，修滿六學期也有「同等學力」。",
    later:    "建議預先規劃路程掌握先機取得門票。如果前面升學管道真的沒趕上，後面千萬別再錯過。"
  },
  unlockAt: 3,

  /* 岔路：🟨 看看別人怎麼選（學長姐的故事；paths 會解鎖對應道路） */
  seniorStories: [
    { face: "👩‍🍳", who: "高職餐飲科學姊", text: "我高二就去考乙級證照，後來走技優甄審，根本沒考統測。", paths: ["skillrev"] },
    { face: "🧑‍💻", who: "普通科學長", text: "我一直以為普通科不能讀科大，結果學測完就走申請入學進入正修科大了。", paths: ["caac"] },
    { face: "🧑‍🔧", who: "先工作的學長", text: "我白天在工廠上班，晚上讀進修部，畢業一樣是學士。", paths: ["night"] },
    { face: "🎨", who: "喜歡畫畫的學姊", text: "我 12 月就用作品集報特殊選才，寒假前就知道結果了。", paths: ["special"] }
  ],

  /* 🎒 出發前，你願意帶什麼？
   * use：裝備的功能
   *   dex 打開升學路線圖鑑／city 打開未來城市／elig 我的資格卷軸
   *   time 我的時間軸＋加入手機行事曆／seniors 學長姐經驗
   *   link:dept 正修科系介紹／link:visit 預約參訪／link:line 正修招生 LINE@
   */
  equipment: [
    { id: "moreRoad",  icon: "🧭", item: "升學地圖",       label: "再了解一個升學管道", stat: { intel: 8, prep: 5 }, use: "dex" },
    { id: "dept",      icon: "🔍", item: "科系探索鏡",     label: "查一個想讀的科系", stat: { explore: 8, goal: 5 }, use: "city" },
    { id: "checkMe",   icon: "📜", item: "資格卷軸",       label: "確認自己可以走哪些管道", stat: { intel: 8, prep: 5 }, use: "elig" },
    { id: "dates",     icon: "⏰", item: "時間警報器",     label: "了解重要報名時間", stat: { time: 12, prep: 5 }, use: "time" },
    { id: "seniors",   icon: "🧭", item: "學長姐的手繪地圖", label: "參考學長姐經驗", stat: { intel: 6, explore: 4 }, use: "seniors" },
    { id: "csuDept",   icon: "🔍", item: "正修探索鏡",     label: "了解正修相關科系", stat: { explore: 6, goal: 4 }, use: "link:dept" },
    { id: "visit",     icon: "🎒", item: "參訪通行證",     label: "預約參訪", stat: { prep: 8, explore: 4 }, use: "link:visit" },
    { id: "ask",       icon: "🎒", item: "求助對講機",     label: "詢問老師／學長姐", stat: { prep: 8, intel: 4 }, use: "link:line" }
  ],

  /* 結局 */
  endings: {
    A: { title: "目標明確的冒險者", line: "你已經知道目的地，現在最重要的是確認正確的道路。" },
    B: { title: "找到方向的探索者", line: "你出發時還看不清方向，現在你知道該往哪個世界走了。" },
    C: { title: "勇敢轉彎的旅人",   line: "你原本以為還有時間，現在你知道真正重要的是：先知道有哪些選擇。" },
    D: { title: "開始探索未來的人", line: "你還沒有決定目的地，但你已經開始探索，這就是你的第一步。" },
    E: { title: "知道自己下一步要做什麼的人", line: "你不只知道路在哪，還知道明天要先做哪一件事。" }
  },

  /* 畢業典禮上，你在 DAY 25 回覆的那位同學會對你說 */
  farewell: {
    zhe:   "欸，一起加油。說不定我們會走不同的路，到同一個地方。",
    datou: "被你嚇到，我回去也要查一下報名時間了啦。",
    yu:    "我決定回家，跟我爸好好聊一次我想讀什麼。",
    an:    "我要開始整理作品集了！你也要加油喔。",
    mo:    "我還是不太知道……但我好像知道要從哪裡開始找了。"
  },

  /* 畢業典禮 */
  /* 一行一行出現，字越來越大 */
  finale: [
    "有人已經知道下一站。",
    "有人還在尋找。",
    "有人正在重新選擇。",
    "沒有一條路適合所有人。",
    "但從今天開始，你可以開始選擇自己的路。",
    "甚至提早拿到入學門票或增加錄取機會。"
  ],
  motto: "未來不是選出來的答案，而是走出來的路。"
};
