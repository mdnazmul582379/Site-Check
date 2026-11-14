(function () {
  const C = Object.assign({ API_BASE: "", LIBRARY_PATH: "data/library.json", PAGE_SIZE: 20, SECTION_COUNT: 4 }, window.TFP_CONFIG || {});
  const TOKEN_KEY = "tfp_token";
  const TABS = [
    { key: "trending", label: "Trending" },
    { key: "movie", label: "Movie" },
    { key: "series", label: "Web Series" },
    { key: "adult", label: "Adult 18+", cls: "adult" },
  ];

  const S = {
    items: [],
    tab: "trending",
    view: "home",        // home | genre | search | downloads | me
    genre: "",
    page: 1,
    query: "",
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || "",
    loginMode: "login",
    loginDismissed: false,
  };

  const $ = (s) => document.querySelector(s);
  const main = $("#main"), tabsEl = $("#tabs");

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function hueOf(str) { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; }
  function artStyle(title) {
    const h = hueOf(title), h2 = (h + 50) % 360;
    return `background:linear-gradient(135deg,hsl(${h} 55% 32%),hsl(${h2} 60% 14%))`;
  }
  function parseCategory(str) {
    const parts = String(str || "").split(",").map((s) => s.trim()).filter(Boolean);
    const t = (parts[0] || "movie").toLowerCase();
    const type = t.includes("adult") ? "adult" : (t.includes("series") ? "series" : "movie");
    const genres = [...new Set(parts.slice(1).map((g) => g.charAt(0).toUpperCase() + g.slice(1)))];
    return { type, genres };
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
  const PLAY_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>';

  function card(it) {
    return `<button class="card" data-id="${esc(it.id)}" type="button">
      <div class="art" style="${artStyle(it.title)}">
        <span>${esc(it.quality || "HD")}</span>
        <em>${esc((it.title || "?").charAt(0))}</em>
      </div>
      <div class="title">${esc(it.title)}</div>
      <div class="sub">${esc(it._genre)} · ${esc(it.year || "")}</div>
    </button>`;
  }

  // ---------- data ----------
  async function loadLibrary() {
    try {
      const url = C.API_BASE ? C.API_BASE.replace(/\/$/, "") + "/library/list" : C.LIBRARY_PATH;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      S.items = normalize(j.items || []);
    } catch (e) {
      S.items = [];
      main.innerHTML = `<div class="empty">ডেটা লোড হয়নি (${esc(e.message)})</div>`;
    }
  }

  function inTab(it) {
    if (S.tab === "trending") return !!it.trending;
    return it._type === S.tab;
  }
  function tabItems() {
    const base = S.items.filter(inTab);
    return base.length || S.tab !== "trending" ? base : S.items;
  }

  // ---------- render: tabs ----------
  function renderTabs() {
    tabsEl.innerHTML = TABS.map((t) =>
      `<button data-tab="${t.key}" class="${t.cls || ""} ${S.tab === t.key && S.view === "home" ? "active" : ""}">${esc(t.label)}</button>`
    ).join("");
  }

  // ---------- render: home ----------
  function renderHome() {
    const list = tabItems();
    if (!list.length) { main.innerHTML = `<div class="empty">এখানে এখনো কোনো কনটেন্ট নেই</div>`; return; }
    const hero = list[0];
    let html = `<section class="hero" style="margin:12px 14px 0">
      <div class="art" style="${artStyle(hero.title)}"></div>
      <div class="info">
        <h1>${esc(hero.title)}</h1>
        <div class="meta">${esc(hero._genres.join(" · "))} ${hero.year ? "· " + hero.year : ""}</div>
        <button class="play" data-id="${esc(hero.id)}" type="button">${PLAY_ICON} Play</button>
      </div></section>`;

    const groups = new Map();
    for (const it of list) {
      const keys = it._genres.length ? it._genres : ["Others"];
      for (const g of keys) { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(it); }
    }
    for (const [genre, arr] of groups) {
      html += `<section class="section">
        <div class="sec-head"><h2>${esc(genre)}</h2>
          <button data-genre="${esc(genre)}" type="button">All ${CHEV}</button></div>
        <div class="row">${arr.slice(0, C.SECTION_COUNT).map(card).join("")}</div>
      </section>`;
    }
    main.innerHTML = html;
  }

  // ---------- render: genre grid (20 per page) ----------
  function renderGenre() {
    const arr = tabItems().filter((it) => (it._genres.length ? it._genres : ["Others"]).includes(S.genre));
    const shown = arr.slice(0, S.page * C.PAGE_SIZE);
    const more = shown.length < arr.length
      ? `<button class="more" id="moreBtn" type="button">See more (${arr.length - shown.length} বাকি)</button>` : "";
    main.innerHTML = `
      <div class="page-head"><button class="back" id="backBtn" type="button" aria-label="Back">‹</button><h2>${esc(S.genre)}</h2></div>
      <div class="grid">${shown.map(card).join("") || '<div class="empty">কিছু পাওয়া যায়নি</div>'}</div>
      ${more}`;
  }

  // ---------- render: search ----------
  function renderSearch() {
    const q = S.query.trim().toLowerCase();
    const arr = q ? S.items.filter((it) => it.title.toLowerCase().includes(q)) : [];
    main.innerHTML = `<div class="page-head"><h2>"${esc(S.query)}" এর ফলাফল</h2></div>
      <div class="grid">${arr.slice(0, 60).map(card).join("") || '<div class="empty">কিছু পাওয়া যায়নি</div>'}</div>`;
  }

  // ---------- render: downloads / me ----------
  function renderDownloads() {
    main.innerHTML = `<div class="page-head"><h2>Downloads</h2></div>
      <div class="empty">আপনার ডাউনলোড এখানে দেখাবে</div>`;
  }
  function renderMe() {
    const u = S.user;
    const head = u
      ? `<div class="panel"><div class="row-item"><div><b>${esc(u.name || "ব্যবহারকারী")}</b><br><small>${esc(u.email || "")}</small></div></div></div>
         <div class="panel"><button class="row-item" id="logoutBtn" type="button" style="width:100%">লগআউট</button></div>`
      : `<div class="panel" style="padding:16px">
           <p style="color:var(--muted);font-size:14px;margin-bottom:12px">প্লে ও সেভ করতে লগইন করুন</p>
           <button class="btn-primary" id="meLogin" type="button">লগইন করুন</button></div>`;
    main.innerHTML = `<div class="page-head"><h2>Me</h2></div>${head}
      <div class="panel">
        <div class="row-item"><span>সেটিংস</span>${CHEV}</div>
        <div class="row-item"><span>ফিডব্যাক</span>${CHEV}</div>
      </div>`;
  }

  function render() {
    renderTabs();
    if (S.view === "home") renderHome();
    else if (S.view === "genre") renderGenre();
    else if (S.view === "search") renderSearch();
    else if (S.view === "downloads") renderDownloads();
    else if (S.view === "me") renderMe();
    setBottom();
  }
  function setBottom() {
    document.querySelectorAll("[data-nav]").forEach((b) => {
      const on = (b.dataset.nav === "home" && (S.view === "home" || S.view === "genre" || S.view === "search")) ||
                 (b.dataset.nav === S.view);
      b.classList.toggle("active", on);
    });
  }

  // ---------- detail ----------
  function openDetail(id) {
    const it = S.items.find((x) => x.id === id);
    if (!it) return;
    $("#detailSheet").innerHTML = `
      <div class="dart" style="${artStyle(it.title)}"></div>
      <h2>${esc(it.title)}</h2>
      <div class="meta">${esc(it._genres.join(" · "))} ${it.year ? "· " + it.year : ""} ${it.duration ? "· " + esc(it.duration) : ""}</div>
      <div class="acts">
        <button class="btn-primary" data-play="${esc(it.id)}" type="button">${PLAY_ICON} প্লে</button>
        <button class="ghost" type="button" data-close>বন্ধ</button>
      </div>`;
    $("#detailOverlay").classList.remove("hidden");
  }
  function closeDetail() { $("#detailOverlay").classList.add("hidden"); }

  // ---------- play (লগইন ছাড়া প্লে নয়) ----------
  function play(id) {
    if (!S.user) { openLogin("প্লে করতে লগইন করুন"); return; }
    if (!C.API_BASE) { toast("প্লেয়ার সার্ভার এখনো সংযুক্ত নয়"); return; }
    window.open(C.API_BASE.replace(/\/$/, "") + "/play?id=" + encodeURIComponent(id), "_blank", "noopener");
  }

  // ---------- auth ----------
  function openLogin(msg) {
    $("#loginSub").textContent = msg || "প্লে করতে লগইন দরকার। লগইন ছাড়া ব্রাউজ করতে পারবেন।";
    $("#loginErr").textContent = "";
    S.loginDismissed = false;
    $("#loginOverlay").classList.remove("hidden");
  }
  function closeLogin() { $("#loginOverlay").classList.add("hidden"); S.loginDismissed = true; }
  function setLoginMode(mode) {
    S.loginMode = mode;
    const reg = mode === "register";
    $("#nameField").style.display = reg ? "block" : "none";
    $("#loginTitle").textContent = reg ? "অ্যাকাউন্ট খুলুন" : "লগইন করুন";
    $("#loginSubmit").textContent = reg ? "রেজিস্টার" : "লগইন";
    $("#toggleMode").textContent = reg ? "আগে থেকে অ্যাকাউন্ট আছে? লগইন" : "নতুন অ্যাকাউন্ট খুলুন";
  }
  async function api(path, body) {
    if (!C.API_BASE) throw new Error("লগইন সার্ভার এখনো সংযুক্ত নয়");
    const r = await fetch(C.API_BASE.replace(/\/$/, "") + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...(S.token ? { Authorization: "Bearer " + S.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || j.error || "ব্যর্থ হয়েছে (" + r.status + ")");
    return j;
  }
  async function restoreSession() {
    if (!S.token || !C.API_BASE) return;
    try { S.user = (await api("/auth/me")).user || null; } catch { S.token = ""; localStorage.removeItem(TOKEN_KEY); }
  }

  // ---------- events ----------
  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    S.tab = b.dataset.tab; S.view = "home"; render(); window.scrollTo({ top: 0 });
  });

  document.querySelector("#bottomNav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav]"); if (!b) return;
    const v = b.dataset.nav;
    if (v === "home") S.view = "home";
    else S.view = v;
    render(); window.scrollTo({ top: 0 });
  });

  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    S.query = $("#searchInput").value;
    S.view = S.query.trim() ? "search" : "home";
    render();
  });
  $("#searchInput").addEventListener("input", (e) => {
    if (!e.target.value.trim() && S.view === "search") { S.view = "home"; render(); }
  });

  $("#avatarBtn").addEventListener("click", () => {
    if (S.user) { S.view = "me"; render(); } else openLogin();
  });

  main.addEventListener("click", (e) => {
    const g = e.target.closest("[data-genre]");
    if (g) { S.genre = g.dataset.genre; S.view = "genre"; S.page = 1; render(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest("#backBtn")) { S.view = "home"; render(); return; }
    if (e.target.closest("#moreBtn")) { S.page++; renderGenre(); return; }
    if (e.target.closest("#meLogin")) { openLogin(); return; }
    if (e.target.closest("#logoutBtn")) {
      S.token = ""; S.user = null; localStorage.removeItem(TOKEN_KEY); render(); toast("লগআউট হয়েছে"); return;
    }
    const pl = e.target.closest("[data-play]");
    if (pl) { play(pl.dataset.play); return; }
    const playBtn = e.target.closest(".hero .play");
    if (playBtn) { play(playBtn.dataset.id); return; }
    const c = e.target.closest(".card");
    if (c) openDetail(c.dataset.id);
  });

  // ডিটেইল শিট: বাইরে ক্লিক বা "বন্ধ" দিলে বন্ধ, প্লে বাটন
  $("#detailOverlay").addEventListener("click", (e) => {
    if (e.target.id === "detailOverlay" || e.target.closest("[data-close]")) { closeDetail(); return; }
    const p = e.target.closest("[data-play]");
    if (p) { closeDetail(); play(p.dataset.play); }
  });

  // লগইন মডাল: ক্রস নেই; বাইরে ক্লিক করলে বন্ধ হবে
  $("#loginOverlay").addEventListener("click", (e) => {
    if (e.target.id === "loginOverlay") closeLogin();
  });
  $("#toggleMode").addEventListener("click", () => setLoginMode(S.loginMode === "login" ? "register" : "login"));
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = $("#loginSubmit");
    btn.disabled = true; $("#loginErr").textContent = "";
    try {
      const reg = S.loginMode === "register";
      const body = reg
        ? { name: f.get("name"), email: f.get("email"), password: f.get("password") }
        : { email: f.get("email"), password: f.get("password") };
      const j = await api(reg ? "/auth/register" : "/auth/login", body);
      S.token = j.token; S.user = j.user;
      localStorage.setItem(TOKEN_KEY, j.token);
      closeLogin(); toast("স্বাগতম, " + (S.user.name || S.user.email));
      render();
    } catch (err) {
      $("#loginErr").textContent = err.message;
    } finally { btn.disabled = false; }
  });

  // শুরুতে: লগইন না থাকলে লগইন UI আসবে
  async function init() {
    setLoginMode("login");
    await loadLibrary();
    await restoreSession();
    render();
    if (!S.user) openLogin();
  }
  init();
})();
