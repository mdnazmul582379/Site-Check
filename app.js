(function () {
  const C = Object.assign(
    { API_BASE: "", LIBRARY_PATH: "data/library.json", PAGE_SIZE: 20, SECTION_COUNT: 4, MAX_HOME_SECTIONS: 5, HERO_SLIDES: 5, DEMO_VIDEO: "" },
    window.TFP_CONFIG || {}
  );
  const K = { users: "tfp_users_v2", session: "tfp_session_v2", history: "tfp_history_v2" };
  const TABS = [
    { key: "trending", label: "Trending" },
    { key: "movie", label: "Movies" },
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

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hueOf = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const artStyle = (t) => { const h = hueOf(t); return `background:linear-gradient(135deg,hsl(${h} 50% 28%),hsl(${(h + 48) % 360} 55% 12%))`; };
  function parseCategory(str) {
    const parts = String(str || "").split(",").map((s) => s.trim()).filter(Boolean);
    const t = (parts[0] || "movie").toLowerCase();
    const type = t.includes("adult") ? "adult" : t.includes("series") ? "series" : "movie";
    return { type, genres: [...new Set(parts.slice(1).map((g) => g.charAt(0).toUpperCase() + g.slice(1)))] };
  }
  function normalize(raw) {
    return (raw || []).map((it) => {
      const c = parseCategory(it.category);
      return { ...it, _type: c.type, _genres: c.genres, _genre: c.genres[0] || "Others" };
    });
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function mediaCard(it) {
    const sub = [it.year, it.quality, it._genres[0]].filter(Boolean).join(" · ");
    return `<button class="card" data-id="${esc(it.id)}" type="button">
      <div class="card-media" style="${artStyle(it.title)}">
        <img loading="lazy" decoding="async" src="${esc(it.thumbnail || "")}" alt="" onerror="this.remove()">
        ${it.quality ? `<span class="q">${esc(it.quality)}</span>` : ""}
      </div>
      <div class="card-title">${esc(it.title)}</div>
      ${sub ? `<div class="card-sub">${esc(sub)}</div>` : ""}
    </button>`;
  }

  const srcFor = (id) => (C.API_BASE ? `${C.API_BASE.replace(/\/$/, "")}/play?id=${encodeURIComponent(id)}` : C.DEMO_VIDEO);

  async function loadLibrary() {
    try {
      const url = C.API_BASE ? C.API_BASE.replace(/\/$/, "") + "/library/list" : C.LIBRARY_PATH;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      S.items = normalize((await r.json()).items || []);
    } catch (e) {
      S.items = [];
      main.innerHTML = emptyState("Could not load library. Check your connection and try again.");
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

  const enc = new TextEncoder();
  function bytesToB64(buf) {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function b64ToBytes(s) {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function derive(pw, saltB64) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: b64ToBytes(saltB64), iterations: 120000, hash: "SHA-256" },
        key, 256
      );
      return bytesToB64(bits);
    }
    let h = 0;
    const mix = saltB64 + "|" + pw;
    for (let i = 0; i < mix.length; i++) h = ((h << 5) - h + mix.charCodeAt(i)) | 0;
    return "fb:" + (h >>> 0).toString(16) + ":" + mix.length;
  }
  const users = () => { try { return JSON.parse(localStorage.getItem(K.users) || "{}"); } catch { return {}; } };
  function setSession(email) {
    const r = users()[email];
    if (!r) return;
    S.user = { email, name: r.name };
    localStorage.setItem(K.session, JSON.stringify(S.user));
    updateAvatar();
  }
  async function register(name, email, pw) {
    email = String(email || "").trim().toLowerCase();
    name = String(name || "").trim();
    pw = String(pw || "");
    if (!name) throw new Error("Please enter your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    if (pw.length < 6) throw new Error("Password must be at least 6 characters");
    const u = users();
    if (u[email]) throw new Error("An account with this email already exists");
    const salt = bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
    u[email] = { name, salt, hash: await derive(pw, salt), created: Date.now() };
    localStorage.setItem(K.users, JSON.stringify(u));
    setSession(email);
  }
  async function login(email, pw) {
    email = String(email || "").trim().toLowerCase();
    pw = String(pw || "");
    const rec = users()[email];
    if (!rec) throw new Error("Account not found. Please sign up first.");
    if ((await derive(pw, rec.salt)) !== rec.hash) throw new Error("Incorrect password");
    setSession(email);
  }
  function restoreSession() {
    try {
      const s = JSON.parse(localStorage.getItem(K.session) || "null");
      if (s && s.email && users()[s.email]) S.user = { email: s.email, name: users()[s.email].name };
    } catch {}
    updateAvatar();
  }
  function logout() { S.user = null; localStorage.removeItem(K.session); updateAvatar(); }
  function updateAvatar() {
    const btn = $("#avatarBtn");
    if (btn) btn.classList.toggle("on", !!S.user);
  }

  const hkey = () => K.history + ":" + (S.user ? S.user.email : "guest");
  const history = () => { try { return JSON.parse(localStorage.getItem(hkey()) || "[]"); } catch { return []; } };
  function addHistory(it, ep) {
    const h = history().filter((x) => x.id !== it.id);
    h.unshift({ id: it.id, title: ep ? `${it.title} · ${ep.label}` : it.title, thumb: it.thumbnail || "", at: Date.now() });
    localStorage.setItem(hkey(), JSON.stringify(h.slice(0, 16)));
  }

  function emptyState(msg) { return `<div class="empty-card"><div class="em-ico">▢</div><p>${esc(msg)}</p></div>`; }
  function renderTabs() {
    tabsEl.style.display = S.view === "home" ? "" : "none";
    tabsEl.innerHTML = TABS.map((t) =>
      `<button data-tab="${t.key}" type="button" class="${t.cls || ""} ${S.tab === t.key ? "active" : ""}">${esc(t.label)}</button>`
    ).join("");
  }

  function renderHome() {
    const list = tabItems();
    if (!list.length) { main.innerHTML = emptyState("No titles in this category yet."); return; }
    const slides = [...list].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)).filter((it) => it.thumbnail).slice(0, C.HERO_SLIDES || 5);
    const groups = groupsOf(list);
    let html = "";
    if (slides.length) {
      html += `<section class="car"><div class="car-track" id="carTrack">${slides.map((it, hi) => `
        <button class="slide" data-id="${esc(it.id)}" type="button" style="${artStyle(it.title)}">
          <img src="${esc(it.thumbnail)}" alt="" loading="${hi === 0 ? "eager" : "lazy"}" decoding="async" onerror="this.remove()">
          <div class="sov"><h1>${esc(it.title)}</h1>
            <div class="chips-row">${it.quality ? `<span class="meta-chip hd">${esc(it.quality)}</span>` : ""}${it.year ? `<span class="meta-chip">${esc(it.year)}</span>` : ""}${it._genres[0] ? `<span class="meta-chip">${esc(it._genres[0])}</span>` : ""}</div>
            <span class="spill">${ICON.play} Play</span></div></button>`).join("")}</div>
        <div class="dots" id="dots">${slides.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div></section>`;
    }
    html += `<div class="sec-head"><h2>Categories</h2></div>
      <div class="cats">${groups.slice(0, 12).map(([g, arr]) => `
        <button class="cat" data-genre="${esc(g)}" type="button" style="${artStyle(g)}">
          <span>${esc(g)}</span><small>${arr.length} titles</small></button>`).join("")}</div>`;
    const maxSec = C.MAX_HOME_SECTIONS || 5;
    const shownGroups = groups.slice(0, maxSec);
    for (const [genre, arr] of shownGroups) {
      html += `<section><div class="sec-head"><h2>${esc(genre)} <small class="cnt">${arr.length}</small></h2>
        <button data-genre="${esc(genre)}" type="button">See all ${ICON.chev}</button></div>
        <div class="row">${arr.slice(0, C.SECTION_COUNT).map((it) => mediaCard(it)).join("")}</div></section>`;
    }
    if (groups.length > maxSec) {
      html += `<button class="more" id="moreHomeSec" type="button" data-more-home>Show more categories</button>`;
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
    const step = () => track.clientWidth * 0.92 + 12;
    const idx = () => Math.round(track.scrollLeft / Math.max(1, step()));
    track.addEventListener("scroll", () => {
      const i = Math.min(Math.max(0, idx()), dots.length - 1);
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
    track.addEventListener("pointerdown", () => { carPausedUntil = Date.now() + 6000; });
    carTimer = setInterval(() => {
      if (Date.now() < carPausedUntil || document.hidden || !dots.length) return;
      track.scrollTo({ left: ((idx() + 1) % dots.length) * step(), behavior: "smooth" });
    }, 4500);
  }

  function renderGenre() {
    const arr = tabItems().filter((it) => (it._genres.length ? it._genres : ["Others"]).includes(S.genre));
    const shown = arr.slice(0, S.page * C.PAGE_SIZE);
    const more = shown.length < arr.length ? `<button class="more" id="moreBtn" type="button">Load ${arr.length - shown.length} more</button>` : "";
    main.innerHTML = `<div class="page-head"><button class="back-btn" id="backBtn" type="button" aria-label="Back">${ICON.back}</button><h2>${esc(S.genre)}</h2></div>
      <div class="grid">${shown.map((it) => mediaCard(it)).join("") || '<div class="empty">Nothing found</div>'}</div>${more}`;
  }
  function renderSearch() {
    const q = S.query.trim().toLowerCase();
    const arr = q ? S.items.filter((it) => it.title.toLowerCase().includes(q)) : [];
    main.innerHTML = `<div class="page-head"><h2>Results for “${esc(S.query)}”</h2></div>
      <div class="grid">${arr.slice(0, 60).map((it) => mediaCard(it)).join("") || '<div class="empty">No matches</div>'}</div>`;
  }
  function renderDownloads() {
    main.innerHTML = `<div class="page-head"><h2>Downloads</h2></div>
      <div class="dl-empty">Your offline downloads will appear here.<br><small>Download feature coming soon.</small></div>`;
  }
  function renderMe() {
    const u = S.user;
    const h = history();
    const head = u
      ? `<div class="me-hero"><div class="me-av">${esc((u.name || "U").charAt(0).toUpperCase())}</div>
          <div class="me-info"><b>${esc(u.name)}</b><small>${esc(u.email)}</small><span class="me-badge">Member</span></div></div>`
      : `<div class="me-hero"><div class="me-av guest">?</div>
          <div class="me-info"><b>Guest</b><small>Sign in to play and sync history</small></div>
          <button class="pill-btn" data-login type="button">Sign in</button></div>`;
    const hist = h.length
      ? `<div class="panel"><div class="panel-title">Continue watching <small>${h.length}</small></div>
          <div class="hist">${h.map((x) => `<button class="card" data-id="${esc(x.id)}" type="button">
            <div class="card-media" style="${artStyle(x.title)}"><img class="thumb" src="${esc(x.thumb)}" alt="" onerror="this.remove()"></div>
            <div class="card-title">${esc(x.title)}</div></button>`).join("")}</div></div>`
      : `<div class="panel"><div class="panel-title">Continue watching <small>Empty</small></div>
          <div style="padding:0 16px 16px;color:var(--muted);font-size:13px">Titles you play will show up here.</div></div>`;
    main.innerHTML = `<div class="page-head"><h2>Profile</h2></div>${head}${hist}
      <div class="panel">
        <button class="menu-item" data-menu="Settings" type="button"><span>Settings</span>${ICON.chev}</button>
        <button class="menu-item" data-menu="Feedback" type="button"><span>Feedback</span>${ICON.chev}</button>
        <button class="menu-item" data-menu="About TeraFast Play" type="button"><span>About</span>${ICON.chev}</button>
        ${u ? `<button class="menu-item danger" data-logout type="button"><span>Sign out</span></button>` : `<button class="menu-item" data-login type="button"><span>Sign in / Sign up</span>${ICON.chev}</button>`}
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

  function findPlayable(id) {
    for (const it of S.items) {
      if (it.id === id) return { item: it, ep: it.kind === "series" && it.episodes ? it.episodes[0] : null, vid: id };
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
    if (arr.length < 6) arr = S.items.filter((x) => x.id !== item.id);
    return arr.slice(0, 12);
  }

  function openPlayer(id) {
    if (!S.user) { S.pending = id; S.authMode = "login"; openLogin("Sign in to watch this title"); return; }
    const f = findPlayable(id);
    if (!f) return;
    if (S.view !== "player") S.prev = S.view;
    S.view = "player"; S.playId = id; S.season = f.ep ? f.ep.season : null;
    addHistory(f.item, f.ep);
    renderPlayer(f);
    player.classList.remove("hidden");
    document.body.classList.add("in-player");
    player.scrollTop = 0;
  }

  function renderPlayer(f) {
    const { item, ep, vid } = f;
    const label = ep ? `${item.title} · ${ep.label}` : item.title;
    const quality = ep ? ep.quality : ((item.versions || []).find((v) => v.id === vid) || item).quality;
    const versions = !ep && item.versions && item.versions.length > 1 ? item.versions : null;
    const rel = related(item);
    player.innerHTML = `
      <div class="pl-top"><button class="back-btn" data-back type="button" aria-label="Close">${ICON.back}</button>
        <div class="pl-title">${esc(item.title)}</div></div>
      <div class="pl-video"><video id="vid" controls playsinline preload="metadata" src="${esc(srcFor(vid))}"></video>
        ${C.API_BASE ? "" : '<div class="pl-note">Demo video</div>'}</div>
      <div class="pl-info"><h1>${esc(label)}</h1>
        <div class="pl-meta">${esc((item._genres || []).join(" · "))}${item.year ? " · " + esc(item.year) : ""}${quality ? " · " + esc(quality) : ""}</div>
        <div class="pl-acts">
          <button type="button" data-menu="Added to list">${ICON.plus} My List</button>
          <button type="button" data-share="${esc(item.id)}">${ICON.share} Share</button>
          <button type="button" data-menu="Downloads coming soon">${ICON.dl} Download</button>
        </div></div>
      ${item.kind === "series" ? `<div id="epWrap"></div>` : ""}
      ${versions ? `<div class="sec-head"><h2>Quality</h2></div><div class="vers">${versions.map((v) =>
        `<button class="chip ${v.id === vid ? "on" : ""}" data-ep="${esc(v.id)}" type="button">${esc(v.quality || "HD")}</button>`).join("")}</div>` : ""}
      <div class="sec-head"><h2>Related</h2></div>
      <div class="related-grid">${rel.map((it) => mediaCard(it)).join("") || '<div class="empty">No related titles</div>'}</div>`;
    if (item.kind === "series") renderEpisodes();
    const v = $("#vid");
    if (v) { v.addEventListener("ended", nextEpisode); const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  }

  function renderEpisodes() {
    const f = findPlayable(S.playId);
    const wrap = $("#epWrap");
    if (!f || !wrap || !f.item.episodes) return;
    const it = f.item;
    const seasons = it.seasons || [];
    const eps = it.episodes.filter((e) => e.season === S.season);
    wrap.innerHTML = `
      ${seasons.length > 1 ? `<div class="chips" style="margin-top:6px">${seasons.map((s) =>
        `<button class="chip ${s === S.season ? "on" : ""}" data-season="${s}" type="button">Season ${s}</button>`).join("")}</div>` : ""}
      <div class="sec-head"><h2>Episodes</h2><span style="color:var(--muted);font-size:13px">${eps.length}</span></div>
      <div class="ep-list">${eps.map((e) =>
        `<button class="ep ${e.id === S.playId ? "on" : ""}" data-ep="${esc(e.id)}" type="button">${esc(e.label)}<small>${esc(e.quality || "")}</small></button>`).join("")}</div>`;
  }
  function nextEpisode() {
    const f = findPlayable(S.playId);
    if (!f || f.item.kind !== "series" || !f.item.episodes) return;
    const list = f.item.episodes;
    const i = list.findIndex((e) => e.id === S.playId);
    if (i >= 0 && i < list.length - 1) openPlayer(list[i + 1].id);
  }
  function closePlayer() {
    const v = $("#vid"); if (v) v.pause();
    player.classList.add("hidden"); player.innerHTML = "";
    document.body.classList.remove("in-player");
    S.view = S.prev || "home"; render();
  }

  function openLogin(msg) {
    const reg = S.authMode === "register";
    $("#loginSheet").innerHTML = `
      <div class="grip"></div>
      <h2>${reg ? "Create account" : "Welcome back"}</h2>
      <p class="sub">${esc(msg || "Sign in to watch titles and keep your history.")}</p>
      <form id="authForm" novalidate>
        ${reg ? `<label class="field"><span>Name</span><input name="name" type="text" autocomplete="name" required placeholder="Your name"></label>` : ""}
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="you@email.com"></label>
        <label class="field"><span>Password</span><input name="password" type="password" minlength="6" autocomplete="${reg ? "new-password" : "current-password"}" required placeholder="At least 6 characters"></label>
        <p class="err" id="authErr"></p>
        <button class="btn-main" id="authBtn" type="submit">${reg ? "Sign up" : "Sign in"}</button>
      </form>
      <button class="switch" id="authSwitch" type="button">${reg ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      <p class="legal">Passwords are hashed and stored only on this device.</p>`;
    $("#loginOverlay").classList.remove("hidden");
  }
  function closeLogin() { $("#loginOverlay").classList.add("hidden"); }

  document.addEventListener("click", (e) => {
    const t = e.target;
    const hit = (sel) => t.closest(sel);
    if (t.id === "loginOverlay") { closeLogin(); return; }
    if (hit("[data-back]")) { closePlayer(); return; }
    if (hit("#avatarBtn")) { go("me"); return; }
    if (hit("[data-login]")) { S.authMode = "login"; openLogin(); return; }
    if (hit("[data-logout]")) { logout(); toast("Signed out"); render(); return; }
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
    if (hit("[data-more-home]") || hit("#moreHomeSec")) {
      C.MAX_HOME_SECTIONS = 99;
      C.SECTION_COUNT = Math.max(C.SECTION_COUNT, 6);
      renderHome();
      return;
    }
    const share = hit("[data-share]");
    if (share) {
      const url = location.href.split("#")[0];
      if (navigator.share) navigator.share({ title: document.title, url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copied")).catch(() => toast(url));
      else toast(url);
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
        toast("Welcome, " + S.user.name);
        const pend = S.pending; S.pending = null;
        render();
        if (pend) openPlayer(pend);
      } catch (ex) {
        err.textContent = ex.message || "Something went wrong";
      } finally { btn.disabled = false; }
    }
  });

  function skeleton() {
    main.innerHTML = `<section class="car"><div class="car-track"><div class="slide skel" style="flex:0 0 92%"></div></div></section>
      <div class="sec-head"><h2>&nbsp;</h2></div><div class="cats">${'<div class="cat skel"></div>'.repeat(3)}</div>
      <section><div class="sec-head"><h2>&nbsp;</h2></div><div class="row">${'<div class="card-media skel"></div>'.repeat(4)}</div></section>`;
  }

  async function init() {
    restoreSession();
    skeleton();
    await loadLibrary();
    render();
  }
  init();
})();
