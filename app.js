(function () {
  const C = Object.assign({ API_BASE: "", LIBRARY_PATH: "data/library.json", PAGE_SIZE: 20, SECTION_COUNT: 4, DEMO_VIDEO: "" }, window.TFP_CONFIG || {});
  const K = { users: "tfp_users", session: "tfp_session", history: "tfp_history" };
  const TABS = [
    { key: "trending", label: "Trending" },
    { key: "movie", label: "Movie" },
    { key: "series", label: "Web Series" },
    { key: "adult", label: "Adult 18+", cls: "adult" },
  ];
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M10 6H5v13h13v-5"/></svg>',
    dl: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
  };
  const S = {
    items: [], tab: "trending", view: "home", prev: "home",
    genre: "", page: 1, query: "", user: null,
    season: null, playId: null, pending: null, authMode: "login",
  };
  const $ = (s) => document.querySelector(s);
  const main = $("#main"), tabsEl = $("#tabs"), player = $("#player");

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hueOf = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const artStyle = (t) => { const h = hueOf(t); return `background:linear-gradient(135deg,hsl(${h} 55% 30%),hsl(${(h + 50) % 360} 60% 13%))`; };
  const qNum = (q) => Number(String(q || "").replace(/\D/g, "")) || 0;
  function parseCategory(str) {
    const parts = String(str || "").split(",").map((s) => s.trim()).filter(Boolean);
    const t = (parts[0] || "movie").toLowerCase();
    const type = t.includes("adult") ? "adult" : t.includes("series") ? "series" : "movie";
    return { type, genres: [...new Set(parts.slice(1).map((g) => g.charAt(0).toUpperCase() + g.slice(1)))] };
  }
  function normalize(raw) {
    return raw.map((it) => {
      const c = parseCategory(it.category);
      return { ...it, _type: c.type, _genres: c.genres, _genre: c.genres[0] || "Others" };
    });
  }
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function tile(it) {
    return `<button class="tile" data-id="${esc(it.id)}" type="button" style="${artStyle(it.title)}">
      <img class="thumb" loading="lazy" src="${esc(it.thumbnail || "")}" alt="" onerror="this.remove()">
      ${it.quality ? `<span class="q">${esc(it.quality)}</span>` : ""}
      <div class="ov"><div class="t">${esc(it.title)}</div></div></button>`;
  }
  const srcFor = (id) => (C.API_BASE ? `${C.API_BASE.replace(/\/$/, "")}/play?id=${encodeURIComponent(id)}` : C.DEMO_VIDEO);

  // ---------- data ----------
  async function loadLibrary() {
    try {
      const url = C.API_BASE ? C.API_BASE.replace(/\/$/, "") + "/library/list" : C.LIBRARY_PATH;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      S.items = normalize((await r.json()).items || []);
    } catch (e) {
      S.items = [];
      main.innerHTML = emptyState("ডেটা লোড হয়নি। ইন্টারনেট চেক করে আবার চেষ্টা করুন");
    }
  }
  const tabItems = () => (S.tab === "trending" ? S.items : S.items.filter((it) => it._type === S.tab));
  const groupsOf = (list) => {
    const m = new Map();
    for (const it of list) for (const g of (it._genres.length ? it._genres : ["Others"])) {
      if (!m.has(g)) m.set(g, []);
      m.get(g).push(it);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  };

  // ---------- লগইন (ব্রাউজারে, পাসওয়ার্ড hash করে) ----------
  const enc = new TextEncoder();
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function derive(pw, saltB64) {
    if (!window.crypto || !crypto.subtle) throw new Error("এই ব্রাউজারে সুরক্ষিত লগইন চালু নেই (HTTPS দরকার)");
    const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(saltB64), iterations: 100000, hash: "SHA-256" }, key, 256);
    return b64(bits);
  }
  const users = () => JSON.parse(localStorage.getItem(K.users) || "{}");
  function setSession(email) {
    const r = users()[email];
    S.user = { email, name: r.name };
    localStorage.setItem(K.session, JSON.stringify(S.user));
  }
  async function register(name, email, pw) {
    email = email.trim().toLowerCase();
    if (!name.trim()) throw new Error("নাম লিখুন");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("সঠিক ইমেইল লিখুন");
    if (pw.length < 6) throw new Error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    const u = users();
    if (u[email]) throw new Error("এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে");
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    u[email] = { name: name.trim(), salt, hash: await derive(pw, salt), created: Date.now() };
    localStorage.setItem(K.users, JSON.stringify(u));
    setSession(email);
  }
  async function login(email, pw) {
    email = email.trim().toLowerCase();
    const rec = users()[email];
    if (!rec) throw new Error("অ্যাকাউন্ট পাওয়া যায়নি, আগে সাইন আপ করুন");
    if ((await derive(pw, rec.salt)) !== rec.hash) throw new Error("পাসওয়ার্ড ভুল হয়েছে");
    setSession(email);
  }
  function restoreSession() {
    try {
      const s = JSON.parse(localStorage.getItem(K.session) || "null");
      if (s && users()[s.email]) S.user = { email: s.email, name: users()[s.email].name };
    } catch (e) { /* ignore */ }
  }
  function logout() { S.user = null; localStorage.removeItem(K.session); }

  // ---------- watch history (ইউজার অনুযায়ী) ----------
  const hkey = () => K.history + ":" + (S.user ? S.user.email : "guest");
  const history = () => JSON.parse(localStorage.getItem(hkey()) || "[]");
  function addHistory(it, ep) {
    const h = history().filter((x) => x.id !== it.id);
    h.unshift({ id: it.id, title: ep ? `${it.title} · ${ep.label}` : it.title, thumb: it.thumbnail || "", at: Date.now() });
    localStorage.setItem(hkey(), JSON.stringify(h.slice(0, 12)));
  }

  // ---------- views ----------
  // ডেটা আসার আগে/পরে ফাঁকা না থাকে
  function emptyState(msg) { return `<div class="empty-card"><div class="em-ico">▢</div><p>${esc(msg)}</p></div>`; }
  function renderTabs() {
    tabsEl.style.display = S.view === "home" ? "" : "none";
    tabsEl.innerHTML = TABS.map((t) =>
      `<button data-tab="${t.key}" class="${t.cls || ""} ${S.tab === t.key ? "active" : ""}">${esc(t.label)}</button>`).join("");
  }
  function renderHome() {
    const list = tabItems();
    if (!list.length) { main.innerHTML = emptyState("এখানে এখনো কোনো কনটেন্ট নেই"); return; }
    const slides = [...list].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)).filter((it) => it.thumbnail).slice(0, 6);
    const groups = groupsOf(list);
    let html = "";
    if (slides.length) {
      html += `<section class="car"><div class="car-track" id="carTrack">${slides.map((it) => `
        <button class="slide" data-id="${esc(it.id)}" type="button" style="${artStyle(it.title)}">
          <img src="${esc(it.thumbnail)}" alt="" onerror="this.remove()">
          <div class="sov"><h1>${esc(it.title)}</h1>
            <div class="chips-row">${it.quality ? `<span class="meta-chip hd">${esc(it.quality)}</span>` : ""}${it.year ? `<span class="meta-chip">${esc(it.year)}</span>` : ""}<span class="meta-chip">${esc(it._genres[0] || "")}</span></div>
            <span class="spill">${ICON.play} প্লে করুন</span></div></button>`).join("")}</div>
        <div class="dots" id="dots">${slides.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div></section>`;
    }
    html += `<div class="sec-head"><h2>ক্যাটাগরি</h2></div>
      <div class="cats">${groups.map(([g, arr]) => `
        <button class="cat" data-genre="${esc(g)}" type="button" style="${artStyle(g)}">
          <span>${esc(g)}</span><small>${arr.length} টি</small></button>`).join("")}</div>`;
    for (const [genre, arr] of groups) {
      html += `<section><div class="sec-head"><h2>${esc(genre)} <small class="cnt">${arr.length}</small></h2>
        <button data-genre="${esc(genre)}" type="button">সব দেখুন ${ICON.chev}</button></div>
        <div class="row">${arr.slice(0, C.SECTION_COUNT).map(tile).join("")}</div></section>`;
    }
    main.innerHTML = html;
    initCarousel();
  }
  let carTimer = null, carPausedUntil = 0;
  function initCarousel() {
    clearInterval(carTimer);
    const track = document.getElementById("carTrack");
    if (!track) return;
    const dots = [...document.querySelectorAll("#dots i")];
    const step = () => track.clientWidth * 0.88 + 10;
    const idx = () => Math.round(track.scrollLeft / step());
    track.addEventListener("scroll", () => {
      const i = Math.min(idx(), dots.length - 1);
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
    const pause = () => { carPausedUntil = Date.now() + 6000; };
    track.addEventListener("pointerdown", pause);
    carTimer = setInterval(() => {
      if (Date.now() < carPausedUntil || document.hidden || !dots.length) return;
      track.scrollTo({ left: ((idx() + 1) % dots.length) * step(), behavior: "smooth" });
    }, 4000);
  }
  function renderGenre() {
    const arr = tabItems().filter((it) => (it._genres.length ? it._genres : ["Others"]).includes(S.genre));
    const shown = arr.slice(0, S.page * C.PAGE_SIZE);
    const more = shown.length < arr.length ? `<button class="more" id="moreBtn" type="button">আরও ${arr.length - shown.length} টি দেখুন</button>` : "";
    main.innerHTML = `<div class="page-head"><button class="back-btn" id="backBtn" type="button" aria-label="ফিরে যান">‹</button><h2>${esc(S.genre)}</h2></div>
      <div class="grid">${shown.map(tile).join("") || '<div class="empty">কিছু পাওয়া যায়নি</div>'}</div>${more}`;
  }
  function renderSearch() {
    const q = S.query.trim().toLowerCase();
    const arr = q ? S.items.filter((it) => it.title.toLowerCase().includes(q)) : [];
    main.innerHTML = `<div class="page-head"><h2>"${esc(S.query)}" এর ফলাফল</h2></div>
      <div class="grid">${arr.slice(0, 60).map(tile).join("") || '<div class="empty">কিছু পাওয়া যায়নি</div>'}</div>`;
  }
  function renderDownloads() {
    main.innerHTML = `<div class="page-head"><h2>Downloads</h2></div>
      <div class="dl-empty">আপনার ডাউনলোড এখানে দেখাবে<br><small>ডাউনলোড ফিচার শীঘ্রই আসছে</small></div>`;
  }
  function renderMe() {
    const u = S.user;
    const h = history();
    const head = u
      ? `<div class="me-head"><div class="me-av">${esc((u.name || "U").charAt(0).toUpperCase())}</div>
          <div class="me-info"><b>${esc(u.name)}</b><small>${esc(u.email)}</small></div></div>`
      : `<div class="me-head"><div class="me-av" style="background:#2a2d38;color:var(--muted)">?</div>
          <div class="me-info"><b>অতিথি ব্যবহারকারী</b><small>প্লে করতে লগইন করুন</small></div>
          <button class="pill-btn" data-login type="button">লগইন</button></div>`;
    const hist = h.length
      ? `<div class="panel"><div class="panel-title">দেখার ইতিহাস <small>${h.length} টি</small></div>
          <div class="hist">${h.map((x) => `<button class="tile" data-id="${esc(x.id)}" type="button" style="${artStyle(x.title)}">
            <img class="thumb" src="${esc(x.thumb)}" alt="" onerror="this.remove()"><div class="ov"><div class="t">${esc(x.title)}</div></div></button>`).join("")}</div></div>`
      : `<div class="panel"><div class="panel-title">দেখার ইতিহাস <small>এখনো কিছু নেই</small></div></div>`;
    main.innerHTML = `<div class="page-head"><h2>প্রোফাইল</h2></div>
      ${head}
      ${hist}
      <div class="panel">
        <button class="menu-item" data-menu="সেটিংস" type="button"><span>সেটিংস</span>${ICON.chev}</button>
        <button class="menu-item" data-menu="ফিডব্যাক" type="button"><span>ফিডব্যাক</span>${ICON.chev}</button>
        <button class="menu-item" data-menu="অ্যাপ সম্পর্কে" type="button"><span>অ্যাপ সম্পর্কে</span>${ICON.chev}</button>
        ${u ? `<button class="menu-item danger" data-logout type="button"><span>লগআউট</span></button>` : ""}
      </div>`;
  }
  function render() {
    renderTabs();
    if (S.view === "home") renderHome();
    else if (S.view === "genre") renderGenre();
    else if (S.view === "search") renderSearch();
    else if (S.view === "downloads") renderDownloads();
    else if (S.view === "me") renderMe();
    document.querySelectorAll("[data-nav]").forEach((b) => {
      const on = b.dataset.nav === S.view || (b.dataset.nav === "home" && (S.view === "genre" || S.view === "search"));
      b.classList.toggle("active", on);
    });
  }
  function go(view) { S.view = view; render(); window.scrollTo({ top: 0 }); }

  // ---------- প্লেয়ার পেজ ----------
  function findPlayable(id) {
    for (const it of S.items) {
      if (it.id === id) return { item: it, ep: it.kind === "series" ? it.episodes[0] : null, vid: id };
      if (it.episodes) {
        const ep = it.episodes.find((e) => e.id === id);
        if (ep) return { item: it, ep, vid: id };
      }
      if (it.versions) {
        const v = it.versions.find((x) => x.id === id);
        if (v) return { item: it, ep: null, vid: id };
      }
    }
    return null;
  }
  function related(item) {
    let arr = S.items.filter((x) => x.id !== item.id && x._genre === item._genre);
    if (arr.length < 4) arr = S.items.filter((x) => x.id !== item.id);
    return arr.slice(0, 12);
  }
  function openPlayer(id) {
    if (!S.user) { S.pending = id; openLogin("ভিডিও দেখতে লগইন করুন"); return; }
    const f = findPlayable(id);
    if (!f) return;
    if (S.view !== "player") S.prev = S.view;
    S.view = "player";
    S.playId = id;
    S.season = f.ep ? f.ep.season : null;
    addHistory(f.item, f.ep);
    renderPlayer(f);
    player.classList.remove("hidden");
    document.body.classList.add("in-player");
    player.scrollTop = 0;
  }
  function renderPlayer(f) {
    const { item, ep, vid } = f;
    const label = ep ? `${item.title} · ${ep.label}` : item.title;
    const quality = ep ? ep.quality : (item.versions.find((v) => v.id === vid) || item).quality;
    const versions = !ep && item.versions && item.versions.length > 1 ? item.versions : null;
    player.innerHTML = `
      <div class="pl-top">
        <button class="back-btn" data-back type="button" aria-label="বন্ধ">${ICON.back}</button>
        <div class="pl-title">${esc(item.title)}</div>
      </div>
      <div class="pl-video">
        <video id="vid" controls playsinline preload="metadata" src="${esc(srcFor(vid))}"></video>
        ${C.API_BASE ? "" : '<div class="pl-note">ডেমো ভিডিও</div>'}
      </div>
      <div class="pl-info">
        <h1>${esc(label)}</h1>
        <div class="pl-meta">${esc(item._genres.join(" · "))}${item.year ? " · " + esc(item.year) : ""}${quality ? " · " + esc(quality) : ""}</div>
        <div class="pl-acts">
          <button type="button" data-menu="লিস্টে যোগ হয়েছে">${ICON.plus} লিস্ট</button>
          <button type="button" data-share="${esc(item.id)}">${ICON.share} শেয়ার</button>
          <button type="button" data-menu="ডাউনলোড শীঘ্রই আসছে">${ICON.dl} ডাউনলোড</button>
        </div>
      </div>
      ${item.kind === "series" ? `<div id="epWrap"></div>` : ""}
      ${versions ? `<div class="sec-head"><h2>কোয়ালিটি</h2></div><div class="vers">${versions.map((v) =>
        `<button class="chip ${v.id === vid ? "on" : ""}" data-ep="${esc(v.id)}" type="button">${esc(v.quality || "HD")}</button>`).join("")}</div>` : ""}
      <div class="sec-head"><h2>সম্পর্কিত ভিডিও</h2></div>
      <div class="grid">${related(item).map(tile).join("")}</div>`;
    if (item.kind === "series") renderEpisodes();
    const v = $("#vid");
    if (v) {
      v.addEventListener("ended", nextEpisode);
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    }
  }
  function renderEpisodes() {
    const f = findPlayable(S.playId);
    const wrap = $("#epWrap");
    if (!f || !wrap) return;
    const it = f.item;
    const seasons = it.seasons || [];
    const eps = it.episodes.filter((e) => e.season === S.season);
    wrap.innerHTML = `
      ${seasons.length > 1 ? `<div class="chips" style="margin-top:6px">${seasons.map((s) =>
        `<button class="chip ${s === S.season ? "on" : ""}" data-season="${s}" type="button">সিজন ${s}</button>`).join("")}</div>` : ""}
      <div class="sec-head"><h2>এপিসোড</h2><span style="color:var(--muted);font-size:13px">${eps.length} টি</span></div>
      <div class="ep-list">${eps.map((e) =>
        `<button class="ep ${e.id === S.playId ? "on" : ""}" data-ep="${esc(e.id)}" type="button">${esc(e.label)}<small>${esc(e.quality || "")}</small></button>`).join("")}</div>`;
  }
  function nextEpisode() {
    const f = findPlayable(S.playId);
    if (!f || f.item.kind !== "series") return;
    const list = f.item.episodes;
    const i = list.findIndex((e) => e.id === S.playId);
    if (i >= 0 && i < list.length - 1) openPlayer(list[i + 1].id);
  }
  function closePlayer() {
    const v = $("#vid"); if (v) v.pause();
    player.classList.add("hidden");
    player.innerHTML = "";
    document.body.classList.remove("in-player");
    S.view = S.prev || "home";
    render();
  }

  // ---------- লগইন শিট ----------
  function openLogin(msg) {
    const reg = S.authMode === "register";
    $("#loginSheet").innerHTML = `
      <div class="grip"></div>
      <h2>${reg ? "অ্যাকাউন্ট খুলুন" : "স্বাগতম"}</h2>
      <p class="sub">${esc(msg || "লগইন করে সব কনটেন্ট দেখুন")}</p>
      <form id="authForm" novalidate>
        ${reg ? `<label class="field"><span>নাম</span><input name="name" type="text" autocomplete="name" required></label>` : ""}
        <label class="field"><span>ইমেইল</span><input name="email" type="email" autocomplete="email" required></label>
        <label class="field"><span>পাসওয়ার্ড</span><input name="password" type="password" minlength="6" autocomplete="${reg ? "new-password" : "current-password"}" required></label>
        <p class="err" id="authErr"></p>
        <button class="btn-main" id="authBtn" type="submit">${reg ? "সাইন আপ" : "লগইন"}</button>
      </form>
      <button class="switch" id="authSwitch" type="button">${reg ? "আগে থেকে অ্যাকাউন্ট আছে? লগইন" : "নতুন অ্যাকাউন্ট খুলুন"}</button>
      <p class="legal">আপনার পাসওয়ার্ড এই ডিভাইসে নিরাপদভাবে (hash করে) সংরক্ষণ হয়।</p>`;
    $("#loginOverlay").classList.remove("hidden");
  }
  function closeLogin() { $("#loginOverlay").classList.add("hidden"); }

  // ---------- ইভেন্ট (একটাই ডেলিগেটেড হ্যান্ডলার) ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const hit = (sel) => t.closest(sel);
    if (t.id === "loginOverlay") { closeLogin(); return; }
    if (hit("[data-back]")) { closePlayer(); return; }
    if (hit("#avatarBtn")) { go("me"); return; }
    if (hit("[data-login]")) { S.authMode = "login"; openLogin(); return; }
    if (hit("[data-logout]")) { logout(); toast("লগআউট হয়েছে"); render(); return; }
    if (hit("#authSwitch")) { S.authMode = S.authMode === "login" ? "register" : "login"; openLogin(); return; }
    const season = hit("[data-season]");
    if (season) { S.season = Number(season.dataset.season); renderEpisodes(); return; }
    const ep = hit("[data-ep]");
    if (ep) { if (ep.dataset.ep !== S.playId) openPlayer(ep.dataset.ep); return; }
    const tab = hit("[data-tab]");
    if (tab) { S.tab = tab.dataset.tab; S.view = "home"; render(); window.scrollTo({ top: 0 }); return; }
    const nav = hit("[data-nav]");
    if (nav) { go(nav.dataset.nav); return; }
    const g = hit("[data-genre]");
    if (g) { S.genre = g.dataset.genre; S.page = 1; go("genre"); return; }
    if (hit("#backBtn")) { go("home"); return; }
    if (hit("#moreBtn")) { S.page++; renderGenre(); return; }
    const share = hit("[data-share]");
    if (share) {
      const url = location.href.split("#")[0];
      if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("লিংক কপি হয়েছে")).catch(() => toast("লিংক: " + url));
      else toast("লিংক: " + url);
      return;
    }
    const menu = hit("[data-menu]");
    if (menu) { toast(menu.dataset.menu); return; }
    const id = hit("[data-id]");
    if (id) { openPlayer(id.dataset.id); return; }
  });

  document.addEventListener("submit", async (e) => {
    if (e.target.id === "searchForm") {
      e.preventDefault();
      S.query = $("#searchInput").value;
      if (S.query.trim()) go("search"); else go("home");
      return;
    }
    if (e.target.id === "authForm") {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = $("#authBtn"), err = $("#authErr");
      btn.disabled = true; err.textContent = "";
      try {
        if (S.authMode === "register") await register(f.get("name"), f.get("email"), f.get("password"));
        else await login(f.get("email"), f.get("password"));
        closeLogin();
        toast("স্বাগতম, " + S.user.name);
        const pend = S.pending; S.pending = null;
        render();
        if (pend) openPlayer(pend);
      } catch (ex) {
        err.textContent = ex.message;
      } finally { btn.disabled = false; }
    }
  });

  // ---------- carousel কনটেন্ট দেখে, কোনো পেজে পরিবর্তন নেই ----------
  // ---------- শুরু ----------
  function skeleton() {
    main.innerHTML = `<section class="car"><div class="car-track"><div class="slide sk"></div></div></section>
      <div class="sec-head"><h2>&nbsp;</h2></div><div class="cats">${'<div class="cat sk"></div>'.repeat(3)}</div>
      <section><div class="sec-head"><h2>&nbsp;</h2></div><div class="row">${'<div class="tile sk"></div>'.repeat(4)}</div></section>`;
  }
  async function init() {
    restoreSession();
    skeleton();
    await loadLibrary();
    render();
    if (!S.user) { S.authMode = "login"; openLogin(); }
  }
  init();
})();
