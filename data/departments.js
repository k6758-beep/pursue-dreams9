/* =====================================================================
 *  未來城市資料：departments.js
 *  ---------------------------------------------------------------------
 *  遊戲裡「未來城市」的 8 個學習世界，以及每個世界裡可以探索的正修科系。
 *  系名、介紹文字、連結有變動時，只要改這個檔案。
 *
 *  depts 每一筆：
 *    name  系名
 *    learn 一句話：在這裡會學什麼（給高中生看的白話）
 *    jobs  以後可以做什麼（2～3 個就好）
 *    url   系網頁（「了解這個系」會直接連過去；留空字串 = 連到下面的 CSU_DEPT_FALLBACK）
 *    check true = 這筆資料還沒跟學校確認過（data-check.html 會提醒）
 *  同一個系可以出現在不同世界。
 * ===================================================================== */
/* 「科系探索：把興趣與升學對焦」按鈕、正修探索鏡 */
window.CSU_DEPT_LINK = "https://recruit.csu.edu.tw/1111/";
/* 科系沒有填 url 時，「了解這個系」會連到正修官網的學術單位頁 */
window.CSU_DEPT_FALLBACK = "https://www.csu.edu.tw/p/412-1000-102.php?Lang=zh-tw";

window.CSU_WORLDS = [
  { id: "eng", icon: "🏗️", name: "工程世界", line: "把想像蓋出來、動起來。", depts: [
    { name: "土木與空間資訊系", learn: "蓋房子、造橋、用空拍和地圖資訊看城市。", jobs: ["工程師", "測量人員", "空間資訊分析"], url: "https://civil.csu.edu.tw/" },
    { name: "機械工程系", learn: "設計機器、操作加工設備、做自動化。", jobs: ["機械設計", "製造工程師", "設備維護"], url: "https://me.csu.edu.tw/" },
    { name: "工業工程與管理系", learn: "讓工廠和流程跑得更快、更省、更順。", jobs: ["生產管理", "品管工程師", "流程改善"], url: "https://iem.csu.edu.tw/" }
  ]},
  { id: "tech", icon: "💻", name: "科技世界", line: "寫程式、玩電路、讓機器變聰明。", depts: [
    { name: "資訊工程系", learn: "寫程式、做 App、嵌入式系統和網路。", jobs: ["軟體工程師", "App 開發", "系統工程師"], url: "https://csie.csu.edu.tw/" },
    { name: "電子工程系", learn: "電路、晶片、感測器，科技產品的心臟。", jobs: ["電子工程師", "半導體產業", "測試工程師"], url: "https://ee.csu.edu.tw/" },
    { name: "電機工程系", learn: "電力、馬達、自動控制，讓城市有電可用。", jobs: ["電機工程師", "自動化控制", "電力相關產業"], url: "https://electrical.csu.edu.tw/" },
    { name: "資訊管理系", learn: "用資訊科技解決企業的問題，資料分析也在這。", jobs: ["系統分析", "資料分析", "網站管理"], url: "https://mis.csu.edu.tw/" }
  ]},
  { id: "design", icon: "🎨", name: "設計世界", line: "讓別人一眼就看懂你的想法。", depts: [
    { name: "數位多媒體設計系", learn: "動畫、影像、互動設計、遊戲美術。", jobs: ["動畫師", "影像剪輯", "互動設計師"], url: "https://media.csu.edu.tw/" },
    { name: "視覺傳達設計系", learn: "海報、品牌、插畫、排版，用畫面說故事。", jobs: ["平面設計師", "品牌設計", "插畫家"], url: "https://vcd.csu.edu.tw/" },
    { name: "建築與室內設計系", learn: "設計空間：從一間房間到一棟建築。", jobs: ["室內設計師", "建築設計助理", "空間規劃"], url: "https://archi.csu.edu.tw/" },
    { name: "化妝品與時尚彩妝系", learn: "彩妝、造型、保養品，美的專業。", jobs: ["彩妝師", "造型師", "美妝品牌企劃"], url: "https://cosmetic.csu.edu.tw/" }
  ]},
  { id: "food", icon: "🍳", name: "餐旅世界", line: "用一道菜、一段服務讓人記住你。", depts: [
    { name: "餐飲管理系", learn: "廚藝、烘焙、飲調，加上開一間店需要的管理。", jobs: ["廚師", "烘焙師", "餐廳經營"], url: "https://fbm.csu.edu.tw/" },
    { name: "休閒與運動管理系", learn: "辦活動、管場館、運動產業和休閒服務。", jobs: ["活動企劃", "健身教練", "場館管理"], url: "https://csulsm.csu.edu.tw/" }
  ]},
  { id: "biz", icon: "🏢", name: "商管世界", line: "看懂錢怎麼流、生意怎麼做。", depts: [
    { name: "企業管理系", learn: "行銷、人資、創業，學會帶團隊做生意。", jobs: ["行銷企劃", "人資", "創業"], url: "https://ba.csu.edu.tw/" },
    { name: "金融管理系", learn: "理財、銀行、保險、投資的專業。", jobs: ["銀行行員", "理財專員", "保險規劃"], url: "https://fb.csu.edu.tw/" },
    { name: "資訊管理系", learn: "商業加科技：電商、資料分析、系統規劃。", jobs: ["電商營運", "資料分析", "專案管理"], url: "https://mis.csu.edu.tw/" }
  ]},
  { id: "care", icon: "🩺", name: "健康照護世界", line: "照顧人，是一種很厲害的專業。", depts: [
    { name: "護理系", learn: "照護病人、醫療知識，考取護理師執照。", jobs: ["護理師", "長照機構", "健康管理"], url: "https://nursing.csu.edu.tw/" },
    { name: "幼兒保育系", learn: "陪伴孩子成長，教保和親子相關專業。", jobs: ["教保員", "托育人員", "親子活動企劃"], url: "https://ecce.csu.edu.tw/" },
    { name: "長期照護與健康管理系", learn: "長期照護、健康促進，以及照護機構的經營管理。", jobs: ["長照機構管理", "照顧服務管理", "健康促進專員"], url: "https://lchm.csu.edu.tw/" }
  ]},
  { id: "lang", icon: "🌏", name: "觀光世界", line: "把世界當成教室。", depts: [
    { name: "觀光遊憩系", learn: "旅遊規劃、導覽、飯店與觀光產業。", jobs: ["領隊導遊", "旅行社企劃", "飯店服務"], url: "https://tourism.csu.edu.tw/" }
  ]},
  { id: "esports", icon: "🎮", name: "數位與電競世界", line: "把你熟悉的螢幕變成職業。", depts: [
    { name: "電競科技系", learn: "電競選手訓練、賽事轉播、直播與電競產業。", jobs: ["電競選手", "賽事企劃", "直播製作"], url: "https://estm.csu.edu.tw/" },
    { name: "數位多媒體設計系", learn: "遊戲美術、動畫、影音製作。", jobs: ["遊戲美術", "影音創作", "動態設計"], url: "https://media.csu.edu.tw/" }
  ]}
];
