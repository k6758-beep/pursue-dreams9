/* =====================================================================
 *  《畢業之後 我的夢想之旅》遊戲引擎：game.js
 *  這支程式不寫死任何招生資訊，全部從 data/ 讀取：
 *    window.ADMISSION_DATA  管道、資格規則、日期     （data/admissions.js）
 *    window.CSU_WORLDS      未來城市與科系           （data/departments.js）
 *    window.STORY           劇情、NPC、裝備、結局    （js/story.js）
 * ===================================================================== */
(() => {
"use strict";
const D = window.ADMISSION_DATA, W = window.CSU_WORLDS, T = window.STORY;
const PATHS = D.paths, PMAP = Object.fromEntries(PATHS.map(p => [p.id, p]));
const SAVE_KEY = "grad-journey-v3";
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const stage = $("#stage");
const wait = ms => new Promise(r => setTimeout(r, RM ? Math.min(ms, 80) : ms));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------------- 狀態與存檔 ---------------- */
const STAT_KEYS = [["goal", "🎯", "目標明確度"], ["intel", "🧭", "升學情報"], ["prep", "🎒", "準備程度"], ["time", "⏰", "時間意識"], ["explore", "🔍", "探索力"]];
const fresh = () => ({ v: 3, ch: 1, mon: 9, name: "", p: {}, mind: "", stats: { goal: 0, intel: 0, prep: 0, time: 0, explore: 0 },
  frags: [], unlocked: [], known: false, fork: "", world: "", target: "", npc: "", rechose: false, later: false,
  willing: [], equip: [], main: "", backup: "", alt: "", ending: "" });
let S = fresh();
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
const load = () => { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.v === 3 ? d : null; } catch (e) { return null; } };
const wipe = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };

/* ---------------- 資料層：條件比對與資格判斷 ---------------- */
function match(cond, p) {
  if (!cond) return true;
  return Object.entries(cond).every(([k, want]) => {
    if (k === "any") return want.some(c => match(c, p));
    if (k === "not") return !match(want, p);
    const have = p[k];
    if (Array.isArray(want)) return want.includes(have);
    if (want && typeof want === "object") {
      if ("any" in want) return Array.isArray(have) && have.some(x => want.any.includes(x));
      if ("not" in want) return Array.isArray(want.not) ? !want.not.includes(have) : have !== want.not;
    }
    return have === want;
  });
}
function elig(id) {
  const P = PMAP[id];
  for (const r of P.rules || []) if (match(r.when, S.p)) return { st: r.st, why: r.why };
  return P.otherwise || { st: "y", why: "" };
}
const ST_TXT = { g: "可以走", y: "需要確認", r: "目前不符合" };
const passable = () => PATHS.filter(P => elig(P.id).st !== "r").map(P => P.id);

/* 日期 */
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const toDate = s => s ? new Date(s + "T00:00:00") : null;
const md = d => `${d.getMonth() + 1}/${d.getDate()}`;
const daysBetween = (a, b) => Math.round((b - a) / 864e5);
const evRange = e => e.to ? `${md(toDate(e.from))}～${md(toDate(e.to))}` : md(toDate(e.from));
const keyEvent = P => P.events.find(e => e.key) || P.events[0];
function nextEvent(P, ref = TODAY) {
  for (const e of P.events) {
    const s = toDate(e.from), en = toDate(e.to || e.from);
    if (ref < s) return { e, live: false, days: daysBetween(ref, s) };
    if (ref <= en) return { e, live: true, days: daysBetween(ref, en) };
  }
  return null;
}
/* 劇情時間：高三這一年 */
const SY = D.meta.schoolYear, START = toDate(SY.start), GRAD = toDate(SY.graduation);
const storyDate = mmdd => { const [m, d] = mmdd.split("-").map(Number); return new Date(m >= START.getMonth() + 1 ? START.getFullYear() : START.getFullYear() + 1, m - 1, d); };
const MONTHS = Array.from({ length: 12 }, (_, i) => { const d = new Date(START.getFullYear(), START.getMonth() + i, 1); return { y: d.getFullYear(), m: d.getMonth() + 1 }; });
const monthIdx = d => Math.max(0, Math.min(11, (d.getFullYear() - START.getFullYear()) * 12 + d.getMonth() - START.getMonth()));
const GRAD_IDX = monthIdx(GRAD);
const tipFor = what => ((D.tips || []).find(t => new RegExp(t.match).test(what)) || {}).tip || "";
const myRoads = () => [S.main, S.backup, S.alt].filter(Boolean);
const ROLE = ["主攻", "備選", "備援"];
const briefingHTML = (ids, cls = "") => {
  const b = D.contact.briefing, need = ids.filter(id => PMAP[id] && PMAP[id].portfolio);
  return b && need.length ? `<div class="brief ${cls}">💡 ${need.map(id => PMAP[id].icon).join("")} ${esc(b.text)} <a href="${esc(b.url)}" target="_blank" rel="noopener">看說明會資訊 ›</a></div>` : "";
};
const QR = window.QR_CODES || {};
const qrHTML = (url, cap) => QR[url] ? `<figure class="qr"><div class="qrimg">${QR[url]}</div><figcaption>${esc(cap)}</figcaption></figure>` : "";
const deptLink = d => d.url || window.CSU_DEPT_FALLBACK || window.CSU_DEPT_LINK || D.contact.site;
function guideQRs() {
  const list = [], seen = new Set(), add = (u, cap) => { if (u && QR[u] && !seen.has(u)) { seen.add(u); list.push([u, cap]); } };
  myRoads().forEach((id, i) => { if (i < 2) add(PMAP[id].url, `${ROLE[i]}・${PMAP[id].road}`); });
  add(D.contact.line, "正修招生 LINE");
  if (list.length < 3) add(window.CSU_DEPT_LINK, "正修科系介紹");
  return list.slice(0, 3);
}
const allConfirmed = () => PATHS.every(P => P.status === "confirmed");

/* ---------------- HUD ---------------- */
function hud() {
  $("#hud").hidden = S.ch < 2 && !S.mind;
  $("#dayNum").textContent = S.mon;
  $("#stats").innerHTML = STAT_KEYS.map(([k, ic, nm]) =>
    `<div class="stat" data-k="${k}" title="${nm}"><span aria-hidden="true">${ic}</span><span class="sr">${nm}</span>
      <div class="bar"><i style="width:${S.stats[k]}%"></i></div></div>`).join("");
  $("#fragN").textContent = S.frags.length;
  $("#btnDex").disabled = S.frags.length < T.unlockAt;
  $("#btnCity").disabled = S.ch < 3;
  $("#btnBag").disabled = !S.equip.length;
}
function statUp(o) {
  for (const [k, v] of Object.entries(o)) {
    S.stats[k] = Math.max(0, Math.min(100, S.stats[k] + v));
    const nm = STAT_KEYS.find(x => x[0] === k);
    if (v) toast(`${nm[1]} ${nm[2]} ${v > 0 ? "+" : ""}${v}`);
  }
  hud();
  for (const k of Object.keys(o)) { const el = document.querySelector(`.stat[data-k="${k}"]`); if (el) { el.classList.add("bump"); setTimeout(() => el.classList.remove("bump"), 900); } }
}
function toast(t) { const box = $("#toasts"); while (box.children.length >= 3) box.firstElementChild.remove(); const el = document.createElement("div"); el.className = "toast"; el.textContent = t; $("#toasts").append(el); setTimeout(() => el.remove(), 1900); }

/* ---------------- 對話與選擇 ---------------- */
function faceOf(who) {
  if (who === "me") return { face: "🙋", name: S.name || "你", color: "#BFE6FF" };
  if (who === "sys") return { face: "📣", name: "", color: "#FFD84A" };
  const n = T.npcs[who]; return n ? { face: n.face, name: n.name, color: n.color } : { face: "💬", name: "", color: "#ddd" };
}
function sayBox() { let b = stage.querySelector(".dlgwrap"); if (!b) { b = document.createElement("div"); b.className = "dlgwrap"; stage.append(b); } return b; }
async function say(lines) {
  for (const [who, raw] of lines) {
    const text = raw.replace(/\{name\}/g, S.name || "你");
    const f = faceOf(who), box = sayBox();
    box.innerHTML = `<div class="dlg tap ${who === "me" ? "me" : who === "sys" ? "sys" : ""}" role="button" tabindex="0" aria-label="繼續">
      ${f.name ? `<div class="who"><span class="face" style="background:${f.color}">${f.face}</span>${esc(f.name)}</div>` : ""}
      <div class="txt" aria-live="polite"></div><span class="next" aria-hidden="true">▼</span></div>`;
    const d = box.firstElementChild, tx = d.querySelector(".txt");
    d.focus({ preventScroll: true });
    await new Promise(res => {
      let i = 0, full = false, timer;
      const finish = () => { full = true; clearInterval(timer); tx.textContent = text; };
      if (RM) finish(); else timer = setInterval(() => { tx.textContent = text.slice(0, ++i); if (i >= text.length) finish(); }, 28);
      const go = e => { if (e.type === "keydown" && !["Enter", " "].includes(e.key)) return; e.preventDefault(); if (!full) finish(); else { d.removeEventListener("click", go); d.removeEventListener("keydown", go); res(); } };
      d.addEventListener("click", go); d.addEventListener("keydown", go);
    });
  }
}
function clearDlg() { const b = stage.querySelector(".dlgwrap"); if (b) b.remove(); }
async function choose(prompt, opts, cfg = {}) {
  if (prompt) await sayPrompt(cfg.who || "sys", prompt);
  const box = document.createElement("div"); box.className = "choices" + (cfg.two ? " two" : "");
  stage.append(box);
  const sel = new Set();
  box.innerHTML = opts.map((o, i) => `<button class="opt ${o.cls || ""}" data-i="${i}" ${cfg.multi ? 'aria-pressed="false"' : ""}>
    ${o.icon ? `<span class="ic" aria-hidden="true">${o.icon}</span>` : ""}<span>${esc(o.label)}${o.hint ? `<span class="hint">${esc(o.hint)}</span>` : ""}</span>${o.tag ? `<span class="sttag ${o.tag.st}">${o.tag.st === "g" ? "✔" : "！"} ${esc(o.tag.text)}</span>` : ""}</button>`).join("")
    + (cfg.multi ? `<button class="cta" data-ok disabled>${esc(cfg.okLabel || "就這些，出發")}</button>` : "");
  box.querySelector("button").focus({ preventScroll: true });
  box.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "nearest" });
  return new Promise(res => {
    box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-ok")) { box.remove(); clearDlg(); return res([...sel].map(i => opts[i].v)); }
      const i = +b.dataset.i;
      if (!cfg.multi) { box.remove(); clearDlg(); return res(opts[i].v); }
      const o = opts[i];
      if (sel.has(i)) sel.delete(i); else {
        if (o.v === "none") sel.clear(); else opts.forEach((x, j) => { if (x.v === "none") sel.delete(j); });
        sel.add(i);
      }
      box.querySelectorAll(".opt").forEach(el => { const on = sel.has(+el.dataset.i); el.classList.toggle("sel", on); el.setAttribute("aria-pressed", on); });
      box.querySelector("[data-ok]").disabled = !sel.size;
    });
  });
}
async function sayPrompt(who, text) { // 問題用：顯示後不必點擊
  const f = faceOf(who), box = sayBox();
  box.innerHTML = `<div class="dlg ${who === "sys" ? "sys" : who === "me" ? "me" : ""}">${f.name ? `<div class="who"><span class="face" style="background:${f.color}">${f.face}</span>${esc(f.name)}</div>` : ""}<div class="txt">${esc(text.replace(/\{name\}/g, S.name || "你"))}</div></div>`;
}
async function askText(prompt, ph, okLabel = "確定", skipLabel = "先跳過") {
  await sayPrompt("sys", prompt);
  const box = document.createElement("div"); box.className = "choices";
  box.innerHTML = `<input class="input" maxlength="20" placeholder="${esc(ph)}" aria-label="${esc(prompt)}"><div class="row-btns"><button class="cta" data-ok>${esc(okLabel)}</button><button class="cta ghost" data-skip>${esc(skipLabel)}</button></div>`;
  stage.append(box); const inp = box.querySelector("input"); inp.focus();
  return new Promise(res => {
    const done = v => { box.remove(); clearDlg(); res(v); };
    box.querySelector("[data-ok]").onclick = () => done(inp.value.trim());
    box.querySelector("[data-skip]").onclick = () => done("");
    inp.onkeydown = e => { if (e.key === "Enter") done(inp.value.trim()); };
  });
}
function tapBtn(html, cls = "cta") {
  const b = document.createElement("button"); b.className = cls; b.innerHTML = html; stage.append(b); b.focus({ preventScroll: true });
  return new Promise(r => b.onclick = () => { b.remove(); r(); });
}

/* ---------------- 畫面元件 ---------------- */
// 一條路分成三條：藍、綠、黃，對應下方三個選項
const FORK_SVG = `<svg class="fork" viewBox="0 0 300 150" role="img" aria-label="一條路分岔成藍、綠、黃三條路">
  <g fill="none" stroke-linecap="round">
    <path d="M150 150 L150 100" stroke="#B8C6B9" stroke-width="26"/>
    <path d="M150 104 C150 70 70 70 46 18" stroke="#7CC8FF" stroke-width="20"/>
    <path d="M150 104 L150 14" stroke="#6FE0B0" stroke-width="20"/>
    <path d="M150 104 C150 70 230 70 254 18" stroke="#FFD84A" stroke-width="20"/>
    <g stroke="#1D3A2E" stroke-width="2.5" stroke-dasharray="6 7" opacity=".7">
      <path d="M150 150 L150 104"/><path d="M150 104 C150 70 70 70 46 18"/><path d="M150 104 L150 14"/><path d="M150 104 C150 70 230 70 254 18"/>
    </g>
  </g>
  <g stroke="#F3F1E6" stroke-width="3"><circle cx="46" cy="18" r="9" fill="#7CC8FF"/><circle cx="150" cy="14" r="9" fill="#6FE0B0"/><circle cx="254" cy="18" r="9" fill="#FFD84A"/></g>
</svg>`;
function setScene(html) { stage.innerHTML = `<div class="scene">${html}</div>`; window.scrollTo(0, 0); }
const trayHTML = () => `<div class="tray" aria-hidden="true"><i class="chalk w"></i><i class="chalk y"></i><i class="chalk p"></i><i class="eraser"></i></div>`;
const boardHTML = (inner, cls = "") => `<div class="board ${cls}">${inner}</div>${trayHTML()}`;
const daysToGrad = d => daysBetween(d, GRAD);
let NOW = START; // 劇情中的「今天」
async function station(i) {
  const st = T.stations[i]; NOW = storyDate(st.date); S.mon = NOW.getMonth() + 1; hud();
  setScene(boardHTML(`<div class="label">${esc(st.title)}・${NOW.getMonth() + 1}/${NOW.getDate()}　距離畢業典禮</div><div class="big chalk-in">${daysToGrad(NOW)}<span class="unit">天</span></div>
    ${st.sub ? `<div class="sub">${esc(st.sub)}</div>` : ""}`));
  await wait(1400);
}
function piecesHTML() { return `<div class="pieces">${Array.from({ length: Object.keys(T.fragments).length }, (_, i) => `<i class="${i < S.frags.length ? "on" : ""}"></i>`).join("")}</div>`; }
async function gainFragment(key) {
  if (S.frags.includes(key)) return;
  S.frags.push(key); save(); hud();
  await modal(`<div class="frag"><div class="icon">🧩</div><div class="num">情報碎片 ${S.frags.length}</div><p>${esc(T.fragments[key])}</p>${piecesHTML()}</div>`, "收下");
  if (S.frags.length === T.unlockAt) {
    await modal(`<div class="frag"><div class="icon">🗺️</div><div class="num">新功能解鎖</div><p>升學路線圖鑑</p><p class="small" style="font-family:var(--sans);font-size:15px;color:var(--ink-2)">畫面上方的 🗺️ 隨時可以打開。<br>走到哪、看到哪，道路會一條條亮起來。</p></div>`, "好");
  }
}
function unlock(ids) { let n = 0; for (const id of ids) if (PMAP[id] && !S.unlocked.includes(id)) { S.unlocked.push(id); n++; } if (n) { toast(`🗺️ 解鎖 ${n} 條道路`); save(); } }
function roadRow(id, opt = {}) {
  const P = PMAP[id], open = S.unlocked.includes(id) || opt.force;
  if (!open) return `<button class="road locked" data-road="${id}" disabled><span class="ic">🔒</span><span class="t"><b>？？？之路</b><span>繼續旅程就會解鎖</span></span></button>`;
  const e = S.known ? elig(id) : null;
  return `<button class="road ${opt.pop ? "pop" : ""}" style="--c:${P.color};${opt.delay ? `animation-delay:${opt.delay}ms` : ""}" data-road="${id}">
    <span class="ic">${P.icon}</span><span class="t"><b>${opt.role ? `<span class="role">${opt.role}</span>` : ""}${esc(P.road)}</b><span>${esc(opt.why && e ? e.why : `${P.name}・${P.exam.label}`)}</span></span>
    ${e ? `<span class="light ${e.st}" title="${ST_TXT[e.st]}" aria-label="${ST_TXT[e.st]}"></span>` : `<span class="light u" aria-hidden="true"></span>`}</button>`;
}

/* ---------------- 可拖曳的一年時間軸 ----------------
 * yearTimeline(host, ids, { idx, onMove })
 * 月份橫向排列，可以左右拖曳；下方滑桿移動「現在」的月份，顯示這個月要做什麼。
 */
function yearTimeline(host, ids, cfg = {}) {
  const evs = ids.flatMap(id => PMAP[id].events.map(e => ({ P: PMAP[id], e, mi: monthIdx(toDate(e.from)) })));
  const cell = (id, mi) => PMAP[id].events.filter(e => monthIdx(toDate(e.from)) === mi)
    .map(e => `<span class="mk" style="--c:${PMAP[id].color}" title="${esc(e.what)}">${esc(e.what)}</span>`).join("");
  host.innerHTML = `<div class="ytl">
    <div class="ystrip" tabindex="0" aria-label="一年時間軸，可以左右拖曳">
      <div class="ygrid" style="grid-template-columns:86px repeat(12,112px)">
        <div class="yh lab">月份</div>${MONTHS.map((M, i) => `<button class="yh" data-mi="${i}">${M.m}月${i === GRAD_IDX ? " 🎓" : ""}</button>`).join("")}
        ${ids.map(id => `<div class="yl lab" style="--c:${PMAP[id].color}">${PMAP[id].icon} ${esc(PMAP[id].road.replace("之路", ""))}</div>${MONTHS.map((M, i) => `<div class="yc" data-mi="${i}">${cell(id, i)}</div>`).join("")}`).join("")}
      </div>
    </div>
    <div class="yslider-wrap"><span class="small">${MONTHS[0].m}月</span><input type="range" class="yslider" min="0" max="11" step="1" value="${cfg.idx || 0}" aria-label="拖曳選擇月份"><span class="small">${MONTHS[11].m}月</span></div>
    <div class="ymonth" aria-live="polite"></div></div>`;
  const strip = host.querySelector(".ystrip"), slider = host.querySelector(".yslider"), out = host.querySelector(".ymonth");
  const set = (i, fromUser) => {
    i = +i; slider.value = i;
    host.querySelectorAll("[data-mi]").forEach(el => { const mi = +el.dataset.mi; el.classList.toggle("on", mi === i); el.classList.toggle("past", mi < i); });
    const col = host.querySelector(`.yh[data-mi="${i}"]`);
    if (col) strip.scrollTo({ left: col.offsetLeft - 86 - (strip.clientWidth - 86 - 112) / 2, behavior: RM ? "auto" : "smooth" });
    const list = evs.filter(x => x.mi === i).sort((a, b) => a.e.from.localeCompare(b.e.from));
    out.innerHTML = `<div class="ym-h">${MONTHS[i].y}年 ${MONTHS[i].m}月${i === GRAD_IDX ? "・🎓 畢業典禮" : ""}</div>` + (list.length ? list.map(x =>
      `<div class="ym-e" style="--c:${x.P.color}"><div class="dt">${evRange(x.e)}</div><div><b>${x.P.icon} ${esc(x.e.what)}</b> <span class="small muted">${esc(x.P.road)}</span>${tipFor(x.e.what) ? `<div class="tip">👉 ${esc(tipFor(x.e.what))}</div>` : ""}</div></div>`).join("")
      : `<div class="small muted">這個月，你的道路沒有重要時程。${i === GRAD_IDX ? "好好享受畢業典禮！" : ""}</div>`);
    cfg.onMove && cfg.onMove(i, fromUser);
  };
  slider.addEventListener("input", () => set(slider.value, true));
  host.querySelectorAll(".yh[data-mi]").forEach(b => b.onclick = () => set(b.dataset.mi, true));
  // 滑鼠拖曳捲動（手機用手指本來就能滑）
  let down = false, sx = 0, sl = 0;
  strip.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add("drag"); });
  addEventListener("pointermove", e => { if (down) strip.scrollLeft = sl - (e.clientX - sx); });
  addEventListener("pointerup", () => { down = false; strip.classList.remove("drag"); });
  requestAnimationFrame(() => set(cfg.idx || 0, false));
  return { set };
}
/* 直式完整時間軸（以真實的今天計算） */
function eventListHTML(ids) {
  const all = ids.flatMap(id => PMAP[id].events.map(e => ({ P: PMAP[id], e }))).sort((a, b) => a.e.from.localeCompare(b.e.from));
  let marked = false;
  return `<div class="tlv">${all.map(({ P, e }) => {
    const s = toDate(e.from), en = toDate(e.to || e.from); let cls = "", tag = "";
    if (TODAY > en) { cls = "past"; tag = "已結束"; }
    else if (TODAY >= s) { cls = "now"; tag = `進行中・剩 ${daysBetween(TODAY, en)} 天`; }
    else { tag = `還有 ${daysBetween(TODAY, s)} 天`; if (!marked) { cls = "next"; marked = true; tag = "下一步・" + tag; } }
    return `<div class="tli ${cls}" style="--c:${P.color}"><div class="d">${evRange(e)}<span class="s">${tag}</span></div><div class="w">${P.icon} ${esc(e.what)} <span class="small muted">${esc(P.road)}</span></div>${tipFor(e.what) ? `<div class="h">👉 ${esc(tipFor(e.what))}</div>` : ""}</div>`;
  }).join("")}</div>`;
}
/* 加入手機行事曆（.ics） */
function downloadICS(ids) {
  const pad = n => String(n).padStart(2, "0"), ymd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const escI = t => String(t).replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CSU//grad-journey//ZH-TW", "CALSCALE:GREGORIAN", `X-WR-CALNAME:我的升學時間軸 ${D.meta.cycle}`];
  ids.forEach(id => { const P = PMAP[id]; P.events.forEach((e, k) => {
    const s = toDate(e.from), en = toDate(e.to || e.from); en.setDate(en.getDate() + 1);
    const est = !(e.confirmed || P.status === "confirmed");
    lines.push("BEGIN:VEVENT", `UID:${id}-${k}-${e.from}@grad-journey`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(s)}`, `DTEND;VALUE=DATE:${ymd(en)}`,
      `SUMMARY:${escI(`${P.icon} ${P.road}：${e.what}${est ? "（推估）" : ""}`)}`,
      `DESCRIPTION:${escI(`${tipFor(e.what)}\n${est ? D.meta.note + "\n" : ""}${P.url}`)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:升學提醒", "TRIGGER:-P3D", "END:VALARM", "END:VEVENT"); }); });
  lines.push("END:VCALENDAR");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  a.download = "我的升學時間軸.ics"; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast("📅 已下載行事曆檔，點開即可加入手機");
}

/* ---------------- Overlay：圖鑑、未來城市、通用 modal ---------------- */
const ov = $("#overlay");
function sheet(title, body, onClose) {
  ov.hidden = false; ov.style.alignItems = "";
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${title}</h2><button class="x" aria-label="關閉">✕</button></header><div class="sb">${body}</div></div>`;
  const close = () => { ov.hidden = true; ov.innerHTML = ""; onClose && onClose(); };
  ov.querySelector(".x").onclick = close;
  ov.onclick = e => { if (e.target === ov) close(); };
  ov.querySelector(".x").focus();
  return { el: ov.querySelector(".sb"), close, top: () => { ov.querySelector(".sheet").scrollTop = 0; } };
}
function modal(html, btn = "好") {
  return new Promise(res => {
    ov.hidden = false;
    ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" style="background:transparent;border:none">${html}<div style="height:12px"></div><button class="cta">${esc(btn)}</button></div>`;
    ov.style.alignItems = "center";
    const b = ov.querySelector(".cta"); b.focus();
    b.onclick = () => { ov.hidden = true; ov.innerHTML = ""; ov.style.alignItems = ""; res(); };
  });
}
const estNote = () => allConfirmed() ? "" : `<div class="note-est">📅 ${esc(D.meta.cycle)}：${esc(D.meta.note)}</div>`;
function openDex(focusId, tab = "cards") {
  const known = S.known, st = { tab, mine: false };
  const ids = () => PATHS.map(P => P.id).filter(id => !st.mine || elig(id).st !== "r");
  const tabs = () => `<div class="tabs"><button class="tab" data-t="cards" aria-pressed="${st.tab === "cards"}">📇 道路卡</button><button class="tab" data-t="cal" aria-pressed="${st.tab === "cal"}">📅 一年時間軸</button>${known ? `<button class="tab" data-m aria-pressed="${st.mine}">${st.mine ? "✅" : "☐"} 只看我能走的</button>` : ""}</div>`;
  const list = () => {
    if (st.tab === "cal") { const open = ids().filter(id => S.unlocked.includes(id)); s.el.innerHTML = `${estNote()}${tabs()}${open.length ? `<p class="small muted" style="margin:0 0 6px">左右拖曳看整年；拉動下方滑桿，看每個月要做什麼。</p><div id="dexTl"></div>` : `<p class="muted">還沒有解鎖的道路。</p>`}`; if (open.length) yearTimeline($("#dexTl"), open, { idx: monthIdx(TODAY) }); }
    else s.el.innerHTML = `${estNote()}${tabs()}<p class="small muted" style="margin:0 0 8px">已解鎖 ${S.unlocked.length}／${PATHS.length} 條道路${known ? "　🟢可以走 🟡需要確認 🔴目前不符合" : ""}</p><div class="roads">${ids().map(id => roadRow(id)).join("")}</div>`;
  };
  const s = sheet("🗺️ 升學路線圖鑑", "");
  const showDetail = id => {
    const P = PMAP[id], e = known ? elig(id) : null, nx = nextEvent(P);
    s.el.innerHTML = `<button class="opt quiet" data-back style="margin-bottom:10px">← 回到所有道路</button>
      <div class="card" style="border-left:8px solid ${P.color}"><h3>${P.icon} ${esc(P.road)}</h3><div class="meta">${esc(P.name)}</div></div>
      ${e ? `<div class="status"><span class="light ${e.st}"></span><span><b>${ST_TXT[e.st]}</b>　${esc(e.why)}</span></div>` : ""}
      <div class="detail">
        <section><h4>適合誰</h4>${esc(P.who)}</section>
        <section><h4>基本條件</h4><ul>${P.conditions.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>
        <section><h4>要考試嗎？</h4><b>${esc(P.exam.label)}</b>　${esc(P.exam.detail)}</section>
        <section><h4>要準備什麼</h4><ul>${P.prep.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>
        <section><h4>重要時間 ${P.status !== "confirmed" ? `<span class="badge" style="color:var(--note)">推估</span>` : ""}<span class="small muted" style="font-weight:400">　倒數以今天日期計算</span></h4>
          ${P.events.map(ev => { const past = toDate(ev.to || ev.from) < TODAY, isNext = nx && nx.e === ev;
            return `<div class="ev ${isNext ? "next" : ""} ${past ? "past" : ""}"><span class="dt">${evRange(ev)}</span><span>${esc(ev.what)}${ev.confirmed ? `<span class="badge">已公告</span>` : ""}${isNext ? `<span class="badge">${nx.live ? `進行中・剩 ${nx.days} 天` : `還有 ${nx.days} 天`}</span>` : ""}</span></div>`; }).join("")}</section>
        <section><h4>可能遇到的問題</h4><ul>${P.pitfalls.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>
        <section><h4>在正修</h4>${esc(P.csu)}${briefingHTML([id])}</section>
      </div>
      <div style="height:14px"></div><a class="cta" style="text-align:center;text-decoration:none" href="${esc(P.url)}" target="_blank" rel="noopener">查看完整資訊</a>
      ${QR[P.url] ? `<div class="qrrow" style="margin-top:12px">${qrHTML(P.url, "用手機掃描，看完整資訊")}</div>` : ""}`;
    s.top();
  };
  s.el.addEventListener("click", ev => {
    const t = ev.target.closest("[data-t]"), m = ev.target.closest("[data-m]"), back = ev.target.closest("[data-back]"), b = ev.target.closest("[data-road]");
    if (t) { st.tab = t.dataset.t; list(); } else if (m) { st.mine = !st.mine; list(); } else if (back) list(); else if (b && !b.disabled) showDetail(b.dataset.road);
  });
  if (focusId) showDetail(focusId); else list();
}
function worldHTML(w) {
  return `<p class="muted" style="margin:0 0 8px">${w.icon} ${esc(w.line)}</p><div class="roads">${w.depts.map(d =>
    `<div class="dept"><b>${esc(d.name)}</b>${d.check ? ` <span class="chip warn">資料確認中</span>` : ""}<p>${esc(d.learn)}</p><div class="jobs">${d.jobs.map(j => `<span class="chip">${esc(j)}</span>`).join("")}</div>
     <div style="margin-top:6px"><a href="${esc(deptLink(d))}" target="_blank" rel="noopener" class="small deptlink">了解這個系 ›</a></div></div>`).join("")}</div>`;
}
function openCity() {
  const link = window.CSU_DEPT_LINK || D.contact.site;
  const grid = () => `<p class="city-lead">了解正修的科系選擇</p><div class="worlds">${W.map(w =>
    `<button class="world ${S.world === w.id ? "on" : ""}" data-w="${w.id}"><span class="ic">${w.icon}</span><b>${esc(w.name)}</b><span>${w.depts.length} 個科系</span></button>`).join("")}</div>
    <div style="height:14px"></div><a class="cta" style="display:block;text-align:center;text-decoration:none" href="${esc(link)}" target="_blank" rel="noopener">科系探索：把興趣與升學對焦</a>
    <figure class="cityart"><img src="assets/future-city.jpg" alt="未來城市的學科交織：工程、科技、設計、餐旅、商管、照護、觀光與電競的人們" loading="lazy" width="384" height="575"></figure>`;
  const s = sheet("🏙️ 未來城市", grid());
  s.el.addEventListener("click", e => {
    const b = e.target.closest("[data-w]"), back = e.target.closest("[data-back]"), pick = e.target.closest("[data-pick]");
    if (back) { s.el.innerHTML = grid(); return; }
    if (pick) { S.world = pick.dataset.pick; save(); toast("🎯 已設成夢想方向"); s.el.innerHTML = grid(); return; }
    if (b) { const w = W.find(x => x.id === b.dataset.w); s.el.innerHTML = `<button class="opt quiet" data-back style="margin-bottom:10px">← 回到未來城市</button><h3 style="margin:0 0 4px;font-family:var(--hand);font-size:22px">${w.icon} ${esc(w.name)}</h3>${worldHTML(w)}
      <div style="height:12px"></div>${S.ch >= 3 ? `<button class="cta" data-pick="${w.id}">${S.world === w.id ? "✔ 這是我的夢想方向" : "設成我的夢想方向"}</button>` : ""}`; s.top(); }
  });
}
function openFrags() {
  sheet("🧩 情報碎片", `${piecesHTML()}<div class="roads" style="margin-top:12px">${S.frags.length ? S.frags.map((k, i) => `<div class="card"><span class="meta">碎片 ${i + 1}</span><div style="font-family:var(--hand);font-size:19px">${esc(T.fragments[k])}</div></div>`).join("") : `<p class="muted">還沒有碎片。和同學、學長姐聊聊天就會出現。</p>`}</div>
    ${S.frags.length < T.unlockAt ? `<p class="small muted">再收集 ${T.unlockAt - S.frags.length} 片，就能解鎖升學路線圖鑑。</p>` : ""}`);
}

/* ---------------- 裝備：每一件都能用 ---------------- */
const LINKS = { dept: () => window.CSU_DEPT_LINK || D.contact.site, visit: () => D.contact.visit || D.contact.site, line: () => D.contact.line };
const EQ = id => T.equipment.find(e => e.id === id);
function useEquip(id) {
  const e = EQ(id); if (!e) return;
  const [kind, arg] = e.use.split(":");
  if (kind === "link") {
    if (arg === "line") return sheet(`${e.icon} ${e.item}`, `<p>有問題請提出！加入正修官方 LINE@（不是群組）將有一對一的專人回答。</p>
      <a class="cta" style="display:block;text-align:center;text-decoration:none;background:#06C755;color:#fff;box-shadow:0 4px 0 #04913E" href="${esc(LINKS.line())}" target="_blank" rel="noopener">💬 加入正修官方 LINE@ ${esc(D.contact.lineId)}</a>
      <a class="cta ghost" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${esc(D.contact.telLink || "#")}">📞 ${esc(D.contact.tel)}</a>
      <div class="qrrow">${qrHTML(LINKS.line(), "掃描加入 LINE@")}</div>`);
    return window.open(LINKS[arg](), "_blank", "noopener");
  }
  if (kind === "dex") return openDex();
  if (kind === "city") return openCity();
  if (kind === "elig") return openElig();
  if (kind === "time") return openTime();
  if (kind === "seniors") return openSeniors();
}
function openBag() {
  const all = T.equipment, mine = all.filter(e => S.equip.includes(e.id)), rest = all.filter(e => !S.equip.includes(e.id));
  const row = e => `<button class="tool" data-eq="${e.id}"><span class="ic">${e.icon}</span><span class="t"><b>${esc(e.item)}</b><span>${esc(e.label)}</span></span><span class="go">使用 ›</span></button>`;
  const s = sheet("🎒 我的背包", `${mine.length ? `<div class="roads">${mine.map(row).join("")}</div>` : `<p class="muted">背包是空的。</p>`}
    ${rest.length ? `<p class="small muted" style="margin:14px 0 6px">沒帶出門的裝備，也可以先借來用：</p><div class="roads dim">${rest.map(row).join("")}</div>` : ""}`);
  s.el.addEventListener("click", ev => { const b = ev.target.closest("[data-eq]"); if (b) useEquip(b.dataset.eq); });
}
function openElig() {
  if (!S.known) return sheet("📜 資格卷軸", `<p>完成「背包檢查」之後，卷軸上就會出現你可以走的路。</p>`);
  const order = { g: 0, y: 1, r: 2 }, ids = PATHS.map(P => P.id).sort((a, b) => order[elig(a).st] - order[elig(b).st]);
  const s = sheet("📜 資格卷軸", `<p class="small muted" style="margin:0 0 8px">${esc(idName())}　🟢可以走 🟡需要確認 🔴目前不符合</p><div class="roads">${ids.map(id => roadRow(id, { force: true, why: true })).join("")}</div>
    <p class="small muted">${esc(D.meta.sameEducationNote)}</p>`);
  s.el.addEventListener("click", ev => { const b = ev.target.closest("[data-road]"); if (b) openDex(b.dataset.road); });
}
function openTime() {
  const ids = myRoads().length ? myRoads() : (S.known ? recommend().slice(0, 3) : PATHS.slice(0, 3).map(P => P.id));
  const s = sheet("⏰ 時間警報器", `${estNote()}<p class="small muted" style="margin:0 0 6px">${myRoads().length ? "你選的道路" : "建議先看的道路"}：拖曳看整年，拉滑桿看每個月要做什麼。</p><div id="tmTl"></div>
    <button class="cta" id="ics" style="margin-top:12px">📅 全部加入手機行事曆（提前 3 天提醒）</button>
    <h3 class="subh">完整時間軸</h3>${eventListHTML(ids)}`);
  yearTimeline($("#tmTl"), ids, { idx: monthIdx(TODAY) });
  $("#ics").onclick = () => downloadICS(ids);
}
function openSeniors() {
  const s = sheet("🧭 學長姐的手繪地圖", `<div class="roads">${T.seniorStories.map(x => `<div class="card"><div style="font-size:32px">${x.face}</div><div class="meta">${esc(x.who)}</div>
    <p style="font-family:var(--hand);font-size:19px;margin:4px 0 8px">「${esc(x.text)}」</p>${x.paths.map(id => `<button class="opt quiet" style="color:var(--ink);border-color:#bbb" data-road="${id}">${PMAP[id].icon} 看看${esc(PMAP[id].road)}</button>`).join("")}</div>`).join("")}</div>`);
  s.el.addEventListener("click", ev => { const b = ev.target.closest("[data-road]"); if (b) { unlock([b.dataset.road]); openDex(b.dataset.road); } });
}

/* ---------------- 身分 ---------------- */
function idName() {
  const p = S.p;
  let n = p.vgen === "yes" ? "高職附設普通科" : { gen: "高中普通科", comp: "綜合高中", voc: "高職" }[p.type] || "高中職";
  if (p.type === "comp") n += p.track === "pro" ? "（專門學程）" : p.track === "aca" ? "（學術學程）" : "";
  if (p.art === "yes") n += "（藝術群）";
  return n + (p.grad === "past" ? "・已畢業" : "・應屆");
}
async function askStage(stg, who) {
  for (const q of D.questions.filter(q => q.stage === stg)) {
    if (q.when && !match(q.when, S.p)) continue;
    if (q.multi) { S.p[q.id] = await choose(q.text, q.opts.map(o => ({ ...o })), { multi: true, who, okLabel: "好了" }); continue; }
    const j = await choose(q.text, q.opts.map((o, i) => ({ ...o, v: i })), { who });
    const o = q.opts[j]; S.p[q.id] = o.v; if (o.set) Object.assign(S.p, o.set);
  }
}

/* ===================================================================
 *  章節
 * =================================================================== */
async function title() {
  S = load() || fresh();
  hud(); $("#hud").hidden = true;
  setScene(`<header class="marquee">
      <div class="sign"><h1 class="logo"><span class="l1">畢業之後</span><span class="l2">我的夢想之旅</span></h1></div>
      <div class="sticker">高中職畢業生的<b>升學 RPG</b></div>
    </header>
    ${boardHTML(`<div class="label">高三開學第一天・距離畢業典禮</div><div class="big chalk-in">${daysToGrad(START)}<span class="unit">天</span></div>
      <div class="chatter">${T.openingChatter.map(c => `<div class="line"><b>${esc(T.npcs[c.who].name)}</b>${esc(c.text)}</div>`).join("")}</div>`, "hero")}`);
  for (const l of stage.querySelectorAll(".chatter .line")) { await wait(650); l.classList.add("on"); }
  await wait(400);
  stage.insertAdjacentHTML("beforeend", `<p class="ask-big">你呢？<br>畢業之後，你要去哪裡？</p>`);
  const resumable = load();
  const box = document.createElement("div"); stage.append(box);
  const done = resumable && resumable.ch >= CHAPTERS.length;
  box.innerHTML = resumable && resumable.ch > 1 && !done
    ? `<button class="cta" data-go="resume">繼續旅程（${resumable.mon}月）</button><button class="cta ghost" data-go="new">重新開始</button>`
    : done ? `<button class="cta" data-go="guide">查看我的畢業冒險攻略</button><button class="cta ghost" data-go="new">重新開始</button>`
    : `<button class="cta" data-go="new">開始我的旅程</button>`;
  box.querySelector("button").focus({ preventScroll: true });
  const go = await new Promise(r => box.onclick = e => { const b = e.target.closest("[data-go]"); if (b) r(b.dataset.go); });
  if (go === "new") { wipe(); S = fresh(); }
  if (go === "guide") { S = resumable; hud(); return guideCard(); }
  run();
}

const CHAPTERS = [null, ch1, ch2, ch3, ch4, ch5, ch6, ch7, chSkip, ch8];
async function run() {
  hud();
  while (S.ch < CHAPTERS.length) { await CHAPTERS[S.ch](); S.ch++; save(); }
  guideCard();
}

/* 9月 高三開學：建立你的角色 */
async function ch1() {
  await station(0);
  S.p = {}; S.unlocked = [];
  await say([["sys", "在出發之前，先確認你的身分。"]]);
  S.name = await askText("同學都叫你什麼？", "例如：阿翔、小魚", "就叫我這個", "隨便啦");
  await askStage("create");
  const m = await choose("說真的，畢業之後要去哪，你現在比較像哪一種？", T.mindsets.map(x => ({ v: x.id, icon: x.icon, label: x.label, hint: `「${x.quote}」` })));
  const M = T.mindsets.find(x => x.id === m); S.mind = m;
  S.stats = { ...M.stats };
  if (m === "A" || m === "E") S.target = await askText(m === "A" ? "想去的學校或科系是？（可以不填）" : "爸媽希望你讀的是？（可以不填）", "例如：正修 數位多媒體設計系");
  hud(); $("#hud").hidden = false;
  setScene(`<div class="card center"><div class="meta">角色建立完成</div><h3 style="font-family:var(--hand);font-size:26px;margin:6px 0">${M.icon} ${esc(S.name || "你")}</h3>
    <div>${esc(idName())}</div><div class="meta" style="margin-top:4px">「${esc(M.title)}」</div>
    <div class="sbars" style="display:grid;gap:6px;margin-top:12px;text-align:left">${STAT_KEYS.map(([k, ic, nm]) => `<div style="display:grid;grid-template-columns:100px 1fr 30px;gap:8px;align-items:center;font-size:14px"><span>${ic} ${nm}</span><div style="height:8px;background:#ECE9DB;border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${S.stats[k]}%;background:var(--board-2)"></i></div><span>${S.stats[k]}</span></div>`).join("")}</div></div>`);
  await say([["sys", "數值不是分數，只是你出發時的樣子。"], ["sys", "接下來的高三這一年，你做的每個選擇，都會讓上面的數值成長。"]]);
}

/* 9月：班群 */
async function ch2() {
  await station(1);
  setScene(`<div class="phone"><div class="bar"><span class="room">三年八班 🎓（42）</span><span>22:47</span></div><div class="msgs" id="msgs"></div></div>`);
  const msgs = $("#msgs");
  const add = (who, text, mine) => { const f = faceOf(who); const el = document.createElement("div"); el.className = "msg" + (mine ? " mine" : "");
    el.innerHTML = `${mine ? "" : `<span class="face" style="background:${f.color}">${f.face}</span>`}<div>${mine ? "" : `<div class="n">${esc(f.name)}</div>`}<div class="b">${esc(text)}</div></div>`;
    msgs.append(el); msgs.scrollTop = msgs.scrollHeight; requestAnimationFrame(() => el.classList.add("on")); };
  for (const m of T.groupChat) { await wait(800); add(m.who, m.text); }
  await wait(600);
  const who = await choose("你要點開誰的訊息？", T.groupChat.map(m => ({ v: m.who, icon: T.npcs[m.who].face, label: T.npcs[m.who].name, hint: m.text })));
  S.npc = who;
  const g = T.groupChat.find(m => m.who === who);
  add("me", g.opener, true); await wait(700); add(who, g.reply); await wait(900);
  const k = await choose(`你想回${T.npcs[who].name}什麼？`, g.options.map((o, i) => ({ v: i, icon: o.icon, label: o.label })));
  const o = g.options[k];
  add("me", o.label, true); await wait(700);
  add(who, o.resp);
  await wait(900);
  statUp(o.stat || { explore: 4 });
  await say([["sys", `你和${T.npcs[who].name}聊到很晚。`], ["sys", "原來，每個人對「畢業之後」的想法都不一樣。"]]);
  statUp({ time: 5 });
}

/* 10月：第一次遇到升學問題＋岔路 */
async function ch3() {
  await station(2);
  setScene(`<div class="board" style="padding:16px"><div class="sub">放學的走廊</div><div style="font-size:52px;margin-top:6px">🧢</div></div>`);
  const first = PATHS.map(keyEvent).map(e => toDate(e.from)).sort((a, b) => a - b)[0];
  await say([["senior", "欸，學弟妹！高三了喔？"], ["senior", "我以前以為成績好就可以，畢業前再想就好。"], ["senior", `結果最早的報名，在畢業典禮前 ${Math.round(daysBetween(first, GRAD) / 30)} 個月就開始了，我差點錯過，超危險。`]]);
  await gainFragment("grade");
  const a = await choose("學長問你：你知道高中職畢業，可以走幾條路到科大嗎？", [
    { v: 1, icon: "1️⃣", label: "大概一兩條吧" }, { v: 2, icon: "📝", label: "應該只有考試吧" }, { v: 3, icon: "🤷", label: "不知道" }], { who: "senior" });
  await say([["senior", a === 3 ? "沒關係，我當時也不知道。" : "哈，我以前也這樣想。"], ["senior", `其實光是到正修，就有大概 ${PATHS.length} 條路。`], ["senior", "要先往哪裡走，你自己選。"]]);
  setScene(boardHTML(`<div class="sub">前面有三條路</div>${FORK_SVG}`));
  const f = await choose("", [
    { v: "blue", cls: "blue", icon: "🟦", label: "我已經知道我要去哪裡" },
    { v: "green", cls: "green", icon: "🟩", label: "我想先探索" },
    { v: "yellow", cls: "yellow", icon: "🟨", label: "我想看看別人怎麼選" }]);
  S.fork = f; save();
  if (f === "blue") await forkBlue(); else if (f === "green") await forkGreen(); else await forkYellow();
  setScene(`<div class="board" style="padding:16px"><div class="sub">🔔 下課鐘響</div></div>`);
  await say([["sys", "不管走了哪條岔路，下課鐘響，大家又回到同一條走廊。"]]);
}
async function forkBlue() {
  if (!S.target) S.target = await askText("你想去的學校或科系是？（可以不填）", "例如：正修 餐飲管理系");
  await say([["senior", S.target ? `${S.target}？不錯欸。` : "有目標就很好。"], ["senior", "那你知道要走哪條路到那裡嗎？"]]);
  const r = await choose("", [{ v: "exam", icon: "📝", label: "考試啊，不然咧" }, { v: "idk", icon: "🤷", label: "不知道耶" }, { v: "many", icon: "🛣️", label: "應該不只一條吧？" }]);
  await say([["senior", r === "many" ? "對！你很敏銳。" : "考試是其中一條，但不是唯一一條。"], ["senior", "同一個系，可能有申請、甄選、繁星、單招……看你是什麼身分、準備了什麼。"]]);
  statUp({ goal: 10, intel: 8 });
  await gainFragment("manyRoads");
}
async function forkGreen() {
  await say([["sys", "你推開走廊盡頭的門，眼前是一座「未來城市」。"]]);
  for (let round = 0; round < 3; round++) {
    const wid = await choose(round ? "還想去哪個世界看看？" : "你想先逛哪個世界？", W.map(w => ({ v: w.id, icon: w.icon, label: w.name, hint: w.line })), { two: true });
    const w = W.find(x => x.id === wid);
    setScene(`<h3 class="title" style="font-size:24px;margin-bottom:8px">${w.icon} ${esc(w.name)}</h3>${worldHTML(w)}`);
    const d = await choose("", [{ v: "pick", icon: "✨", label: "這個世界有點意思", hint: "設成我的夢想方向" }, ...(round < 2 ? [{ v: "more", icon: "🚶", label: "再看看別的世界" }] : [])]);
    if (d === "pick" || round === 2) { S.world = wid; break; }
    setScene(`<div class="board" style="padding:16px"><div class="sub">🏙️ 未來城市</div></div>`);
  }
  statUp({ explore: 15, goal: 6 });
  await gainFragment("explore");
}
async function forkYellow() {
  await say([["sys", "你在學生餐廳遇到幾個回來看老師的學長姐。"]]);
  for (const s of T.seniorStories) {
    setScene(`<div class="card"><div style="font-size:40px">${s.face}</div><div class="meta">${esc(s.who)}</div><p style="font-family:var(--hand);font-size:21px;margin:6px 0 0">「${esc(s.text)}」</p></div>`);
    unlock(s.paths);
    await tapBtn("下一位");
  }
  statUp({ intel: 12, explore: 5 });
  await gainFragment("others");
}

/* 10月底：背包檢查＋不同身分不同路 */
async function ch4() {
  await station(3);
  setScene(`<div class="board" style="padding:16px"><div style="font-size:52px">🎒</div><div class="sub">背包檢查</div></div>`);
  await say([["senior", "來，把你的背包倒出來看看。"], ["senior", "成績、證照、比賽、特別的經歷，這些都會決定你能走哪幾條路。"]]);
  await askStage("backpack", "senior");
  S.known = true;
  const ids = PATHS.map(P => P.id);
  unlock(ids.filter(id => elig(id).st !== "r"));
  setScene(`<p class="center muted" style="margin:0">${esc(idName())}・你的升學路線</p><div class="roads">${ids.map((id, i) => roadRow(id, { force: true, pop: true, delay: i * 160 })).join("")}</div>`);
  stage.querySelectorAll("[data-road]").forEach(b => b.onclick = () => openDex(b.dataset.road));
  await wait(ids.length * 160 + 400);
  const g = ids.filter(id => elig(id).st === "g").length, y = ids.filter(id => elig(id).st === "y").length;
  statUp({ intel: 20 });
  await say([["senior", `你現在有 ${g} 條路可以直接走，${y} 條要再確認。`], ["senior", "紅燈不是你不行，是那條路現在不屬於你。有些路以後還會打開，例如考到乙級證照。"], ["sys", "點任何一條路，都能看它的細節。"]]);
  await gainFragment("identity");
  await say([["yu", "欸…如果我最後沒拿到畢業證書怎麼辦？"], ["senior", D.meta.sameEducationNote]]);
  await gainFragment("sameEdu");
}

/* 11月：倒數計時＋時間排序 */
async function ch5() {
  await station(4);
  setScene(`<div class="board" style="padding:16px"><div style="font-size:48px">🏀</div></div>`);
  const r = await choose("欸，週末去打球啦！升學的事之後再說～", [{ v: "later", icon: "👌", label: "好啊，之後再決定" }, { v: "check", icon: "📅", label: "我先看一下時間" }], { who: "datou" });
  S.later = r === "later";
  if (S.later) await say([["sys", "你繼續往前走。"], ["sys", "只是你突然發現，前面的路開始出現倒數計時。"]]);
  else await say([["sys", "你打開手機行事曆，把升學的時間一個一個找出來。"]]);
  const mine = passable().map(id => ({ P: PMAP[id], n: nextEvent(PMAP[id], NOW) })).filter(x => x.n).sort((a, b) => a.n.days - b.n.days).slice(0, 5);
  setScene(`<p class="center muted small" style="margin:0">今天是 ${NOW.getMonth() + 1}/${NOW.getDate()}，距離畢業典禮還有 ${daysToGrad(NOW)} 天</p><div class="countdown">${mine.length ? mine.map(({ P, n }) => `<div class="cd ${n.days <= 30 ? "hot" : ""}"><div class="d">${n.days}<small> 天</small></div><div class="w">${P.icon} ${esc(P.road)}<span>${n.live ? "進行中・剩下" : "距離"}「${esc(n.e.what)}」（${evRange(n.e)}）</span></div></div>`).join("") : `<div class="cd"><div class="w">本學年度的時程都已經過了，下一年度的日期公告後會更新。</div></div>`}</div>`);
  await say([["sys", S.later ? "原來時間真的會影響選擇。" : "原來有些路，比想像中早很多就開始了。"]]);
  statUp({ time: S.later ? 22 : 18 });
  await timelineGame();
  await gainFragment("timing");
}
async function timelineGame() {
  let pool = passable().map(id => PMAP[id]);
  if (pool.length < 3) pool = pool.concat(PATHS.filter(P => !pool.includes(P)));
  const evs = pool.slice(0, 6).map(P => ({ P, e: keyEvent(P) })).filter((x, i, a) => a.findIndex(y => y.e.from === x.e.from) === i);
  const pick = shuffle(evs).slice(0, 4), order = pick.slice().sort((a, b) => toDate(a.e.from) - toDate(b.e.from));
  setScene(`<h3 class="title" style="font-size:22px">⏰ 時間排序挑戰</h3><p class="center muted small" style="margin:4px 0 10px">照時間先後，依序點下去</p>
    <div class="tl">${pick.map((x, i) => `<button class="tlbtn" data-i="${i}"><span class="o"></span><span>${x.P.icon} ${esc(x.e.what)}<small>${esc(x.P.road)}</small></span></button>`).join("")}</div>`);
  let step = 0, miss = 0;
  await new Promise(res => stage.querySelector(".tl").addEventListener("click", e => {
    const b = e.target.closest(".tlbtn"); if (!b || b.classList.contains("done")) return;
    const x = pick[+b.dataset.i];
    if (toDate(x.e.from).getTime() === toDate(order[step].e.from).getTime()) {
      b.classList.add("done"); b.querySelector(".o").textContent = ++step;
      b.querySelector("small").textContent = `${x.P.road}・${evRange(x.e)}`;
      if (step === order.length) res();
    } else { miss++; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); }
  }));
  await wait(400);
  await say([["sys", miss === 0 ? "全對！你對時間很有感覺。" : "排好了！就算一開始搞錯也沒關係，現在你知道順序了。"]]);
  statUp({ time: Math.max(4, 12 - miss * 3) });
}

/* 11月：重新檢視＋願意準備＋推薦道路 */
async function ch6() {
  await station(5);
  const M = T.mindsets.find(x => x.id === S.mind);
  setScene(`<div class="card"><div class="meta">開學時的你</div><div style="font-family:var(--hand);font-size:22px">${M.icon} 「${esc(M.quote)}」</div></div>`);
  // 開學時「還有很多時間」「到時候再看看」「完全不知道」的人，沒有「更確定了」可以選
  const canSure = !["C", "D", "F"].includes(S.mind);
  const r = await choose("現在的你，想法有變嗎？", [...(canSure ? [{ v: "same", icon: "📌", label: "沒變，我更確定了" }] : []), { v: "change", icon: "🔄", label: "有變，我想重新選" }, { v: "thinking", icon: "💭", label: "我還在想" }]);
  if (r === "change") {
    S.rechose = true;
    const wid = await choose("那你現在比較想往哪個世界走？", W.map(w => ({ v: w.id, icon: w.icon, label: w.name })), { two: true });
    S.world = wid; statUp({ explore: 10, goal: 8 });
    await say([["sys", "改變想法不是倒退，是你看得更清楚了。"]]);
  } else if (r === "same") { statUp({ goal: 10 }); } else { statUp({ explore: 5 }); await say([["sys", "還在想也很好，至少你現在知道有哪些升學的道路。"]]); }
  S.willing = await choose("為了提早拿到入學門票或增加錄取機會，你還願意準備什麼呢？（可複選）", D.willing.map(w => ({ v: w.id, icon: w.icon, label: w.label })), { multi: true, okLabel: "就這些" });
  statUp({ prep: 6 + S.willing.length * 2 });
  const rec = recommend().slice(0, 3);
  unlock(rec);
  setScene(`<p class="center muted" style="margin:0">最適合你探索的道路</p><div class="roads">${rec.map((id, i) => roadRow(id, { pop: true, delay: i * 200 })).join("")}</div>`);
  stage.querySelectorAll("[data-road]").forEach(b => b.onclick = () => openDex(b.dataset.road));
  await wait(800);
  await say([["datou", "欸我聽說，就算前面的都沒趕上，畢業後的 8 月還有單獨招生跟進修部？"], ["sys", "大頭難得說對了一次。"]]);
  await gainFragment("later");
}
function recommend() {
  const fit = id => { const t = PMAP[id].tags || []; return t.length && S.willing.length ? t.filter(x => S.willing.includes(x)).length / t.length : 0; };
  // later: true 的道路（例如進修部），玩家沒選相關意願時排到最後
  const pushBack = id => { const l = PMAP[id].later; return !!l && !(typeof l === "string" ? S.willing.includes(l) : fit(id)); };
  return passable().map(id => ({ id, s: (elig(id).st === "g" ? 2 : 1) + fit(id) * 3 - (pushBack(id) ? 10 : 0) })).sort((a, b) => b.s - a.s).map(x => x.id);
}

/* 11月底：出發前，你願意帶什麼？＋升學策略（主攻、備選、備援） */
async function ch7() {
  await station(6);
  setScene(boardHTML(`<div style="font-size:48px">🎒</div><div class="sub">出發前，你願意帶什麼？</div>`));
  S.equip = await choose("", T.equipment.map(e => ({ v: e.id, icon: e.icon, label: e.label, hint: `裝備：${e.item}` })), { multi: true, okLabel: "裝進背包" });
  const add = {}; for (const id of S.equip) for (const [k, v] of Object.entries(EQ(id).stat)) add[k] = (add[k] || 0) + v;
  statUp(add);
  await say([["sys", "裝備已放進背包。點畫面上方的 🎒，或攻略卡上的裝備，就能真的拿來用。"]]);
  const rec = recommend();
  setScene(boardHTML(`<div class="sub">你在筆記本上寫下高三的升學策略……</div>`));
  const opt = id => ({ v: id, icon: PMAP[id].icon, label: PMAP[id].road, hint: PMAP[id].name, tag: { st: elig(id).st, text: ST_TXT[elig(id).st] } });
  S.main = await choose("🥇 我的主攻道路是？", [...rec.map(opt), { v: "", icon: "🔭", label: "我還想再探索，先不決定", cls: "quiet" }]);
  S.backup = S.alt = "";
  if (S.main) {
    const r2 = rec.filter(id => id !== S.main);
    if (r2.length) S.backup = await choose("🥈 如果主攻沒走通，備選是？", [...r2.slice(0, 5).map(opt), { v: "", icon: "⏭️", label: "先不設備選", cls: "quiet" }]);
    const r3 = r2.filter(id => id !== S.backup);
    if (S.backup && r3.length) S.alt = await choose("🥉 再加一條備援，多一份保險？", [...r3.slice(0, 5).map(opt), { v: "", icon: "⏭️", label: "先不設備援", cls: "quiet" }]);
    unlock(myRoads());
    setScene(`<p class="center muted" style="margin:0">我的升學策略</p><div class="roads">${myRoads().map((id, i) => roadRow(id, { role: ROLE[i], pop: true, delay: i * 200 })).join("")}</div>`);
    stage.querySelectorAll("[data-road]").forEach(b => b.onclick = () => openDex(b.dataset.road));
    statUp({ goal: 10, prep: 4 + myRoads().length * 2 });
    if (myRoads().some(id => PMAP[id].portfolio)) stage.querySelector(".scene").insertAdjacentHTML("beforeend", briefingHTML(myRoads()));
    await say([["sys", myRoads().length >= 3 ? "主攻、備選、備援都有了，這一年你不會只押一條路。" : "策略寫好了，之後隨時可以再補。"]]);
  }
}

/* 時光快轉：拖曳一年時間軸 */
async function chSkip() {
  await station(7);
  const ids = myRoads().length ? myRoads() : recommend().slice(0, 3);
  const startIdx = monthIdx(NOW);
  setScene(`<h3 class="title" style="font-size:24px">⏩ 時光快轉</h3>
    <p class="center muted small" style="margin:4px 0 10px">把下方滑桿一路拖到 ${MONTHS[GRAD_IDX].m} 月畢業典禮 🎓，看看你將經過哪些關卡。</p>
    <div id="skipTl"></div><button class="cta" id="toGrad" disabled style="margin-top:12px">再往後拖到 ${MONTHS[GRAD_IDX].m} 月畢業典禮</button>`);
  const btn = $("#toGrad");
  await new Promise(res => {
    yearTimeline($("#skipTl"), ids, { idx: startIdx, onMove: (i, user) => {
      S.mon = MONTHS[i].m; hud();
      if (i >= GRAD_IDX) { btn.disabled = false; btn.textContent = "🎓 前往畢業典禮"; }
    } });
    btn.onclick = res;
  });
  statUp({ time: 8 });
}

/* 6月：畢業典禮與結局 */
function decideEnding() {
  if (S.rechose || (S.later && ["C", "D"].includes(S.mind))) return "C";
  if (!S.main) return "D";
  if (S.mind === "A" || (S.target && S.stats.goal >= 60)) return "A";
  if (S.equip.length >= 4 && S.stats.time >= 50) return "E";
  return S.world ? "B" : "E";
}
async function ch8() {
  NOW = GRAD; S.mon = GRAD.getMonth() + 1; hud();
  S.ending = decideEnding(); unlock(PATHS.map(P => P.id)); save();
  setScene(`<div class="ceremony"><div class="gate">🏫</div><div style="font-family:var(--hand);font-size:22px;margin-top:6px">畢業典禮</div><div class="crowd">🎓🧑‍🎓👩‍🎓🎓🧑‍🎓👩‍🎓</div></div>
    <div id="fins" class="fins">${T.finale.map((t, i, a) => `<p class="fin${i === a.length - 1 ? " strong" : ""}" style="font-size:${(16 + i * (14 / Math.max(1, a.length - 1))).toFixed(1)}px">${esc(t)}</p>`).join("")}</div>`);
  for (const p of stage.querySelectorAll(".fin")) { await wait(1100); p.classList.add("on"); }
  await wait(900);
  if (S.npc) await say([[S.npc, T.farewell[S.npc]]]);
  clearDlg();
  const E = T.endings[S.ending];
  setScene(`<div class="ending"><div class="k">ENDING ${S.ending}</div><h2>${esc(E.title)}</h2><p style="margin:6px 0 0">${esc(E.line)}</p></div>
    <p class="motto">${esc(T.motto)}</p>
    <button class="cta" data-go="guide">🏆 查看我的畢業冒險攻略</button><button class="cta ghost" data-go="city">🏙️ 探索正修科技大學</button><button class="cta ghost" data-go="again">重新開始</button>`);
  S.ch = CHAPTERS.length; save();
  for (;;) {
    const go = await new Promise(r => stage.onclick = e => { const b = e.target.closest("[data-go]"); if (b) r(b.dataset.go); });
    if (go === "city") { openCity(); continue; }
    stage.onclick = null;
    if (go === "again") { wipe(); S = fresh(); return title().then(() => new Promise(() => {})); }
    return;
  }
}

/* 🏆 我的畢業冒險攻略 */
/* 我要準備：依主攻、備選、備援分開；後面的道路只列「前面沒有的」項目，減輕壓力 */
function prepGroups(ids) {
  const seen = new Set(), chosen = myRoads().length > 0, key = t => t.replace(/（.*?）/g, "").trim();
  let briefed = false;
  return ids.map((id, i) => {
    const P = PMAP[id], items = P.prep.filter(t => !seen.has(key(t))), shared = P.prep.length - items.length;
    P.prep.forEach(t => seen.add(key(t)));
    const brief = !!P.portfolio && !briefed; if (brief) briefed = true;
    return { id, P, role: chosen ? ROLE[i] : "建議", items, shared, first: i === 0, brief };
  });
}
function guideData() {
  const E = T.endings[S.ending] || T.endings.D, M = T.mindsets.find(x => x.id === S.mind) || T.mindsets[5];
  const w = W.find(x => x.id === S.world), roads = myRoads(), main = PMAP[S.main];
  const ids = roads.length ? roads : (S.known ? recommend().slice(0, 3) : []);
  const nx = ids.map(id => ({ P: PMAP[id], n: nextEvent(PMAP[id]) })).filter(x => x.n).sort((a, b) => a.n.days - b.n.days)[0];
  return { E, M, w, ids, main,
    rows: [
      ["我的角色", `${idName()}\n${M.title}`],
      ["夢想方向", w ? `${w.icon} ${w.name}` : "還在探索中"],
      ["我的目標", S.target || "還沒設定，沒關係"],
      ["升學情報", `解鎖 ${S.unlocked.length}／${PATHS.length} 條道路、${S.frags.length} 片情報`],
      ["升學道路", roads.length ? roads.map((id, i) => `${ROLE[i]}：${PMAP[id].icon} ${PMAP[id].road}（${PMAP[id].name}）`).join("\n") : "繼續探索中（建議先看下方道路）"],
      ["下一步", nx ? `${nx.n.live ? `進行中・剩 ${nx.n.days} 天` : `${nx.n.days} 天後`}：${nx.P.icon} ${nx.P.road}「${nx.n.e.what}」（${evRange(nx.n.e)}）` : ids.length ? "本學年度時程已過，留意下一年度簡章" : "先打開圖鑑，挑一條路看看"],
      ["我的裝備", S.equip.length ? S.equip.map(id => `${EQ(id).icon} ${EQ(id).item}`).join("、") : "輕裝出發"]
    ] };
}
function guideCard() {
  hud(); $("#hud").hidden = false; stage.onclick = null;
  const g = guideData(), groups = prepGroups(g.ids);
  setScene(`<div class="guide" id="guide"><h2>🏆 我的畢業冒險攻略</h2><p class="center" style="margin:0 0 8px;color:var(--ink-2)">${esc(S.name || "我")}・ENDING ${S.ending}「${esc(g.E.title)}」</p>
    ${g.rows.map(([k, v]) => k === "我的裝備" && S.equip.length
      ? `<div class="row"><b>${k}</b><div class="eqs">${S.equip.map(id => `<button class="eqbtn" data-eq="${id}">${EQ(id).icon} ${esc(EQ(id).item)} <small>使用 ›</small></button>`).join("")}</div></div>`
      : `<div class="row"><b>${k}</b><span>${esc(v).replace(/\n/g, "<br>")}${k === "下一步" ? `<small class="note">以今天 ${md(TODAY)} 計算</small>` : ""}</span></div>`).join("")}
    <div class="row"><b>我的能力</b><div class="sbars">${STAT_KEYS.slice(0, 4).map(([k, ic, nm]) => `<div class="sb"><span>${ic} ${nm}</span><div class="bar"><i style="width:${S.stats[k]}%"></i></div><span>${S.stats[k]}</span></div>`).join("")}</div></div>
    ${g.ids.length ? `<h3 class="gh">📋 我要準備</h3><p class="prep-lead">先把${groups[0].role === "建議" ? "第一條路" : "主攻"}準備好就好；其他道路只列出還需要「額外」準備的東西。</p>
    ${groups.map(gp => `<div class="pgroup ${gp.first ? "main" : "sub"}" style="--c:${gp.P.color}">
      <div class="pg-h"><span class="role">${gp.role}</span>${gp.P.icon} ${esc(gp.P.road)}${gp.first ? "" : `<span class="pg-n">${gp.items.length ? `再多 ${gp.items.length} 項` : "不用另外準備"}</span>`}</div>
      ${gp.items.length ? `<ul class="preps">${gp.items.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${gp.shared ? `<div class="pg-shared">✔ 另有 ${gp.shared} 項和前面的道路共用，不用重複準備</div>` : ""}
      ${gp.brief ? briefingHTML(g.ids, "in-paper") : ""}</div>`).join("")}
    <h3 class="gh">🗓️ 完整時間軸 ${allConfirmed() ? "" : `<span class="badge" style="color:#8a6a00">含推估</span>`}</h3>
    <div id="gTl" class="on-paper"></div>${eventListHTML(g.ids)}
    <button class="cta small-cta" id="ics">📅 全部加入手機行事曆</button>` : ""}
    <p class="close">${esc(g.E.line)}</p>
    ${guideQRs().length ? `<div class="qrrow">${guideQRs().map(([u, c]) => qrHTML(u, c)).join("")}</div>` : ""}
    <p class="foot">${esc(D.meta.cycle)}${allConfirmed() ? "" : "・日期含推估，以正式簡章為準"}　正修招生 LINE ${esc(D.contact.lineId)}・${esc(D.contact.tel)}</p></div>
    <div style="height:6px"></div>
    <button class="cta" id="dl">下載攻略卡圖片</button>
    <div class="row-btns" style="margin-top:10px"><button class="cta ghost" id="dex">🗺️ 升學路線圖鑑</button><button class="cta ghost" id="city">🏙️ 探索正修科技大學</button></div>
    <button class="cta ghost" id="again" style="margin-top:10px">重新開始</button>`);
  if (g.ids.length) { yearTimeline($("#gTl"), g.ids, { idx: monthIdx(TODAY) }); $("#ics").onclick = () => downloadICS(g.ids); }
  stage.querySelectorAll("[data-eq]").forEach(b => b.onclick = () => useEquip(b.dataset.eq));
  $("#dl").onclick = downloadCard; $("#dex").onclick = () => openDex(S.main || undefined); $("#city").onclick = openCity;
  $("#again").onclick = () => { if (confirm("確定要重新開始嗎？目前的攻略會被清除。")) { wipe(); S = fresh(); title(); } };
}
/* 攻略卡轉圖片（Canvas）：先畫內容，再依實際高度裝框 */
async function downloadCard() {
  const g = guideData(), Wd = 1080, pad = 80, c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = Wd; c.height = 9000;
  const hand = getComputedStyle(document.body).getPropertyValue("--hand"), sans = getComputedStyle(document.body).getPropertyValue("--sans");
  const wrap = (t, maxW, font) => { x.font = font; const out = []; for (const para of String(t).split("\n")) { let line = ""; for (const ch of para) { if (x.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; } out.push(line); } return out; };
  const dash = y => { x.strokeStyle = "#DAD6C5"; x.setLineDash([8, 8]); x.beginPath(); x.moveTo(pad, y); x.lineTo(Wd - pad, y); x.stroke(); x.setLineDash([]); };
  const head = (t, y) => { x.textAlign = "left"; x.fillStyle = "#1D3A2E"; x.font = `bold 40px ${hand}`; x.fillText(t, pad, y); return y + 56; };
  x.fillStyle = "#1F2A25"; x.textAlign = "center"; x.font = `bold 64px ${hand}`; x.fillText("🏆 我的畢業冒險攻略", Wd / 2, 150);
  x.font = `34px ${sans}`; x.fillStyle = "#4F5D56"; x.fillText(`${S.name || "我"}・ENDING ${S.ending}「${g.E.title}」`, Wd / 2, 214);
  let y = 290; x.textAlign = "left";
  for (const [k, v] of g.rows) {
    const lines = wrap(v, Wd - pad * 2 - 200, `32px ${sans}`);
    x.fillStyle = "#4F5D56"; x.font = `bold 28px ${sans}`; x.fillText(k, pad, y);
    x.fillStyle = "#1F2A25"; x.font = `32px ${sans}`; lines.forEach((l, i) => x.fillText(l, pad + 200, y + i * 46));
    y += lines.length * 46 + 10; dash(y); y += 42;
  }
  for (const [k, ic, nm] of STAT_KEYS.slice(0, 4)) {
    x.fillStyle = "#1F2A25"; x.font = `30px ${sans}`; x.fillText(`${ic} ${nm}`, pad, y);
    x.fillStyle = "#ECE9DB"; x.fillRect(pad + 300, y - 22, 520, 20); x.fillStyle = "#24483A"; x.fillRect(pad + 300, y - 22, 5.2 * S.stats[k], 20);
    x.fillStyle = "#1F2A25"; x.fillText(String(S.stats[k]), pad + 850, y); y += 56;
  }
  if (g.ids.length) {
    y += 30; y = head("📋 我要準備", y);
    for (const gp of prepGroups(g.ids)) {
      const big = gp.first, fs = big ? 30 : 26, lh = big ? 42 : 36;
      x.fillStyle = gp.P.color; x.fillRect(pad, y - 30, 10, 40);
      x.fillStyle = "#1F2A25"; x.font = `bold ${big ? 32 : 28}px ${sans}`;
      x.fillText(`${gp.role}｜${gp.P.icon} ${gp.P.road}${gp.first ? "" : gp.items.length ? `（再多 ${gp.items.length} 項）` : "（不用另外準備）"}`, pad + 24, y); y += lh + 4;
      for (const t of gp.items) { const ls = wrap(t, Wd - pad * 2 - 80, `${fs}px ${sans}`); x.font = `${fs}px ${sans}`; x.fillStyle = big ? "#1F2A25" : "#4F5D56"; x.fillText("□", pad + 24, y); ls.forEach((l, i) => x.fillText(l, pad + 64, y + i * lh)); y += ls.length * lh + 4; }
      if (gp.shared) { x.font = `24px ${sans}`; x.fillStyle = "#1D7A4E"; x.fillText(`✔ 另有 ${gp.shared} 項和前面的道路共用`, pad + 24, y); y += 36; }
      if (gp.brief && D.contact.briefing) { const ls = wrap(`💡 ${D.contact.briefing.text}`, Wd - pad * 2 - 40, `24px ${sans}`); x.font = `24px ${sans}`; x.fillStyle = "#8A5A00"; ls.forEach((l, i) => x.fillText(l, pad + 24, y + i * 34)); y += ls.length * 34; }
      y += 22;
    }
    y += 30; y = head(`🗓️ 完整時間軸${allConfirmed() ? "" : "（含推估）"}`, y);
    const all = g.ids.flatMap(id => PMAP[id].events.map(e => ({ P: PMAP[id], e }))).sort((a, b) => a.e.from.localeCompare(b.e.from));
    for (const { P, e } of all) {
      const past = toDate(e.to || e.from) < TODAY;
      x.fillStyle = P.color; x.fillRect(pad, y - 26, 10, 34);
      x.fillStyle = past ? "#A8A79E" : "#4F5D56"; x.font = `bold 28px ${sans}`; x.fillText(evRange(e), pad + 26, y);
      const ls = wrap(`${P.icon} ${e.what}`, Wd - pad * 2 - 260, `28px ${sans}`); x.fillStyle = past ? "#A8A79E" : "#1F2A25"; x.font = `28px ${sans}`;
      ls.forEach((l, i) => x.fillText(l, pad + 250, y + i * 38)); y += ls.length * 38 + 10;
    }
  }
  y += 50; x.textAlign = "center"; x.fillStyle = "#1F2A25"; x.font = `44px ${hand}`; wrap(g.E.line, Wd - pad * 2 - 40, `44px ${hand}`).forEach(l => { x.fillText(l, Wd / 2, y); y += 64; });
  const qrs = guideQRs(), imgs = await Promise.all(qrs.map(([u]) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(QR[u]); })));
  if (qrs.length) {
    // 一列最多兩個 QR Code，間距拉開，避免手機相機同時掃到兩個
    const sz = 220, gap = 200, rowH = sz + 110; y += 10;
    for (let r = 0; r < qrs.length; r += 2) {
      const row = qrs.slice(r, r + 2), tot = row.length * sz + (row.length - 1) * gap; let qx = (Wd - tot) / 2;
      row.forEach(([u, cap], j) => { const im = imgs[r + j]; if (im) x.drawImage(im, qx, y, sz, sz); x.font = `24px ${sans}`; x.fillStyle = "#4F5D56";
        wrap(cap, sz + 60, `24px ${sans}`).forEach((l, k) => x.fillText(l, qx + sz / 2, y + sz + 36 + k * 30)); qx += sz + gap; });
      y += rowH;
    }
    y += 10;
  }
  x.font = `24px ${sans}`; x.fillStyle = "#4F5D56"; x.fillText(`${D.meta.cycle}${allConfirmed() ? "" : "・日期含推估，以正式簡章為準"}　正修招生 LINE ${D.contact.lineId}`, Wd / 2, y + 10);
  const H = y + 90, out = document.createElement("canvas"), o = out.getContext("2d");
  out.width = Wd; out.height = H;
  o.fillStyle = "#1D3A2E"; o.fillRect(0, 0, Wd, H); o.fillStyle = "#FFD84A"; o.fillRect(30, 30, Wd - 60, H - 60); o.fillStyle = "#FFFEF8"; o.fillRect(46, 46, Wd - 92, H - 92);
  o.drawImage(c, 0, 0);
  const a = document.createElement("a"); a.download = "我的畢業冒險攻略.png"; a.href = out.toDataURL("image/png"); a.click();
}

/* ---------------- 啟動 ---------------- */
$("#btnDex").onclick = () => openDex();
$("#btnCity").onclick = openCity;
$("#btnFrag").onclick = openFrags;
$("#btnBag").onclick = openBag;
document.addEventListener("keydown", e => { if (e.key === "Escape" && !ov.hidden) { const x = ov.querySelector(".x"); if (x) x.click(); } });
async function boot() {
  if (!D || !W || !T) { stage.innerHTML = `<div class="card">資料檔沒有載入成功。請確認 data/admissions.js、data/departments.js、js/story.js 都有上傳。</div>`; return; }
  await title();
}
boot();
})();
