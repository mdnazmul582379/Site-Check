(function () {
  "use strict";
  var CFG = Object.assign({ DEMO_VIDEO: "", DEMO_SOURCES: [], HERO_SLIDES: 6, PAGE: 5 }, window.TFP_CONFIG || {});
  var FILES = { categories: "data/categories.json", carousel: "data/carousel.json", movies: "data/movies.json", series: "data/series.json", anime: "data/anime.json" };
  var PAGE = CFG.PAGE;
  var TABS = ["Home", "Movies", "Web Series", "Anime", "Action", "Drama", "Comedy", "Horror"];
  var S = { cats: [], all: [], byId: {}, carousel: [], reg: {}, expanded: {}, tab: "Home", q: "", nav: "home", cur: null, season: 0, qIdx: 0, ep: 0, showAll: false, dlTab: "Downloaded", hero: 0, timer: null, sheetPick: null };
  var $ = function (s) { return document.querySelector(s); };

  // ---- icons (stroke icons, 24px grid) ----
  var IC = {
    home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    pip: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="6" height="5" rx="1" fill="currentColor" stroke="none"/>',
    full: '<path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M21 9V5a2 2 0 0 0-2-2h-4"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.9l7.6-4.4M8.2 13.1l7.6 4.4"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4-6 4z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    message: '<path d="M4 5h16v11H8l-4 4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>',
    login: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4"/><path d="M14 12H4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V22h16"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    feedback: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M12 8v5M12 16h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>'
  };
  function ic(n, s) { s = s || 20; return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || "") + '</svg>'; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function grad(it) { return "linear-gradient(135deg,hsl(" + it.hue + ",60%,36%),hsl(" + ((it.hue + 50) % 360) + ",55%,12%))"; }
  function bg(it) { it = it || { hue: 0 }; return it.thumb ? 'background-image:url("' + esc(it.thumb) + '")' : "background:" + grad(it); }
  function quality(it) { return it.quality || (it.versions && it.versions[0] ? it.versions[0].quality : ""); }
  function metaLine(it) {
    var p = [it.year, it.genre, quality(it)];
    if (it.kind === "series") p.push((it.seasons || []).length + " seasons");
    else if (it.size) p.push(it.size);
    return p.filter(Boolean).join(" · ");
  }
  function streamOf(it) { return it.stream || CFG.DEMO_VIDEO; }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.style.opacity = "1"; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = "0"; }, 1800); }

  function vcard(it) {
    return '<button class="vcard" type="button" data-id="' + esc(it.id) + '"><div class="vthumb" style="' + bg(it) + '"></div>' +
      '<div class="vt">' + esc(it.title) + '</div><div class="vd">' + esc([it.year, it.genre].join(" · ")) + '</div></button>';
  }

  // Row of PAGE cards. "All" or scrolling to the end expands to a full grid.
  function rowSection(key, title, list) {
    S.reg[key] = { title: title, list: list };
    var exp = !!S.expanded[key];
    var body = exp
      ? '<div class="vgrid">' + list.map(vcard).join("") + '</div>'
      : '<div class="vrow grow" data-key="' + esc(key) + '">' + list.slice(0, PAGE).map(vcard).join("") + '</div>';
    var more = (!exp && list.length > PAGE) ? '<button class="all-btn" type="button" data-all="' + esc(key) + '">All ' + ic("chevR", 16) + '</button>' : "";
    return '<section class="grp" data-key="' + esc(key) + '"><div class="sec-head"><h2>' + esc(title) + ' <small>' + list.length + '</small></h2>' + more + '</div>' + body + '</section>';
  }
  function expandKey(key) {
    if (S.expanded[key] || !S.reg[key]) return;
    S.expanded[key] = true;
    var old = document.querySelector('.grp[data-key="' + key + '"]');
    if (!old) return;
    var r = S.reg[key];
    var tmp = document.createElement("div");
    tmp.innerHTML = rowSection(key, r.title, r.list);
    old.replaceWith(tmp.firstElementChild);
  }
  function groupBy(list, prefix) {
    var order = [], map = {};
    list.forEach(function (it) { if (!map[it.genre]) { map[it.genre] = []; order.push(it.genre); } map[it.genre].push(it); });
    return order.map(function (g) { return rowSection(prefix + g, g, map[g]); }).join("");
  }
  function genresOf(list) { var g = []; list.forEach(function (i) { if (g.indexOf(i.genre) < 0) g.push(i.genre); }); return g; }

  // ---- hero ----
  function heroSlide(it) {
    return '<div class="cslide"><button class="cs-img" type="button" data-id="' + esc(it.id) + '" style="' + bg(it) + '" aria-label="Open"></button>' +
      '<div class="cs-card"><div class="cs-thumb" style="' + bg(it) + '"></div>' +
      '<button class="cs-text" type="button" data-id="' + esc(it.id) + '"><span class="cs-title">' + esc(it.title) + '</span><span class="cs-meta">' + esc(metaLine(it)) + '</span></button>' +
      '<button class="cs-play" type="button" data-id="' + esc(it.id) + '" aria-label="Play">' + ic("play", 14) + '</button></div></div>';
  }
  function stopHero() { clearInterval(S.timer); }
  function startHero() {
    stopHero();
    S.timer = setInterval(function () {
      var tr = $("#heroTrack"); if (!tr || tr.children.length < 2) return;
      S.hero = (S.hero + 1) % tr.children.length;
      tr.scrollTo({ left: S.hero * (tr.children[0].offsetWidth + 10), behavior: "smooth" });
      setDots(S.hero);
    }, 5000);
  }
  function setDots(idx) { document.querySelectorAll(".dots i").forEach(function (d, i) { d.className = i === idx ? "on" : ""; }); }

  // ---- views ----
  function renderHome() {
    var hero = S.carousel.slice(0, CFG.HERO_SLIDES);
    var tiles = S.cats.filter(function (c) { return c.name === "All" || S.all.some(function (i) { return i.genre === c.name; }); });
    var cats = tiles.map(function (c, idx) {
      var rep = c.name === "All" ? S.all[0] : S.all.find(function (i) { return i.genre === c.name; });
      var thumb = c.thumb || (rep && rep.thumb) || "";
      var icon = c.name === "All" ? '<i class="flt">' + ic("filter", 16) + '</i>' : "";
      return '<button class="lcat" type="button" data-tab="' + esc(c.name) + '"><span class="lcat-bg" style="' + bg({ thumb: thumb, hue: (idx * 47) % 360 }) + '"></span><span class="lcat-t">' + esc(c.name) + '</span>' + icon + '</button>';
    }).join("");
    $("#main").innerHTML =
      '<section class="hero"><div class="hero-track" id="heroTrack">' + hero.map(heroSlide).join("") + '</div>' +
      '<div class="dots">' + hero.map(function (_, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + '</div></section>' +
      '<div class="sec-head"><h2>Categories</h2></div><div class="lcats">' + cats + '</div>' +
      rowSection("H|trend", "Trending", S.all.filter(function (i) { return i.trending; })) +
      rowSection("H|series", "TV Series", S.all.filter(function (i) { return i._src === "series"; })) +
      rowSection("H|anime", "Anime", S.all.filter(function (i) { return i._src === "anime"; }));
    startHero();
  }
  function renderTab() {
    var t = S.tab, html;
    if (t === "Movies") html = groupBy(S.all.filter(function (i) { return i._src === "movies"; }), "Movies|");
    else if (t === "Web Series") html = groupBy(S.all.filter(function (i) { return i._src === "series"; }), "Series|");
    else if (t === "Anime") html = groupBy(S.all.filter(function (i) { return i._src === "anime"; }), "Anime|");
    else if (t === "All") html = groupBy(S.all, "All|");
    else html = rowSection("G|" + t, t, S.all.filter(function (i) { return i.genre === t; }));
    $("#main").innerHTML = '<div class="pg-title">' + esc(t) + '</div>' + html;
  }
  function renderSearch() {
    var q = S.q.trim().toLowerCase();
    var list = S.all.filter(function (i) { return i.title.toLowerCase().indexOf(q) > -1 || i.genre.toLowerCase().indexOf(q) > -1; });
    $("#main").innerHTML = '<div class="pg-title">Results <small>' + list.length + '</small></div>' +
      (list.length ? '<div class="vgrid">' + list.map(vcard).join("") + '</div>' : '<div class="empty">No items found.</div>');
  }
  function renderDownloads() {
    var pick = S.dlTab;
    $("#main").innerHTML =
      '<div class="pg-head"><h1>Downloads</h1><button class="pill-s" id="transfer" type="button">Transfer</button></div>' +
      '<div class="seg">' + ["Downloaded", "Local files", "Received"].map(function (t) { return '<button type="button" data-dltab="' + t + '" class="' + (t === pick ? "on" : "") + '">' + t + '</button>'; }).join("") + '</div>' +
      '<div class="dl-empty"><div class="dl-box">' + ic("download", 28) + '</div><p>Your downloads will show up here</p></div>' +
      '<div class="sec-head"><h2>For You</h2></div><div class="vgrid">' + S.all.slice(0, 6).map(vcard).join("") + '</div>' +
      '<button class="wide" id="refresh" type="button">' + ic("refresh", 16) + '<span>Refresh new content</span></button>';
  }
  function renderMe() {
    var row = function (label, icon, value) {
      return '<div class="mrow"><span class="ml">' + ic(icon, 20) + '<span>' + label + '</span></span><span class="mv">' + (value != null ? '<em>' + value + '</em>' : '') + ic("chevR", 16) + '</span></div>';
    };
    $("#main").innerHTML =
      '<div class="pg-head"><h1>Me</h1></div>' +
      '<div class="mcard"><div class="me-av">G</div><div class="me-info"><b>Log in to your account</b><div class="pd">Demo mode</div></div><button class="login" type="button" id="loginBtn">' + ic("login", 16) + '<span>Log in</span></button></div>' +
      '<div class="mpanel">' + row("My List", "bookmark", 0) + row("My Likes", "heart", 0) + row("Watch History", "clock") +
        '<div class="vrow hist">' + S.all.slice(0, 4).map(vcard).join("") + '</div>' + row("Messages", "message") + '</div>' +
      '<div class="mpanel">' + row("Community", "users", 0) + row("Posts", "plus", 0) + row("My Comments", "message", 0) + '</div>' +
      '<div class="mpanel">' + row("Settings", "settings") + row("Study Mode", "book") + row("Feedback", "feedback") + '</div>';
  }
  function render() {
    stopHero();
    $("#top").classList.toggle("hidden", S.nav !== "home");
    if (S.nav === "downloads") return renderDownloads();
    if (S.nav === "me") return renderMe();
    if (S.q.trim()) return renderSearch();
    if (S.tab === "Home") return renderHome();
    renderTab();
  }
  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + esc(t) + '" class="' + (t === S.tab ? "active" : "") + '">' + esc(t) + '</button>';
    }).join("");
  }
  function setNav(name) { document.querySelectorAll("[data-nav]").forEach(function (b) { b.classList.toggle("active", b.dataset.nav === name); }); }

  // ---- detail ----
  function openDetail(id) {
    var it = S.byId[id]; if (!it) return;
    S.cur = it; S.season = 0; S.qIdx = 0; S.ep = 0; S.showAll = false;
    renderDetail();
  }
  function renderDetail() {
    var it = S.cur, seasons = it.seasons || [], vers = it.versions || [];
    var hasEps = seasons.length > 0;
    var eps = hasEps ? seasons[S.season].episodes : [];
    var dd = "";
    if (vers.length) dd += '<button class="dd" type="button" data-dd="q"><span>' + esc(vers[S.qIdx].quality) + (vers[S.qIdx].size ? ' · ' + esc(vers[S.qIdx].size) : '') + '</span>' + ic("chev", 18) + '</button>';
    if (seasons.length > 1) dd += '<button class="dd" type="button" data-dd="s"><span>' + esc(seasons[S.season].name) + '</span>' + ic("chev", 18) + '</button>';
    var resources = dd ? '<div class="res-head"><h3>Resources</h3></div><div class="res-row">' + dd + '</div>' : "";
    var epHtml = "";
    if (hasEps) {
      epHtml = '<div class="eps"><button class="ep' + (S.showAll ? " on" : "") + '" type="button" data-all-ep="1">All</button>' +
        eps.map(function (e, i) { return '<button class="ep' + (!S.showAll && i === S.ep ? " on" : "") + '" type="button" data-ep="' + i + '">' + String(e.no).padStart(2, "0") + '</button>'; }).join("") + '</div>';
      if (S.showAll) epHtml += '<div class="ep-list">' + eps.map(function (e, i) { return '<button class="ep-row" type="button" data-ep="' + i + '"><span>' + String(e.no).padStart(2, "0") + '</span>' + esc(e.title) + '</button>'; }).join("") + '</div>';
    }
    var others = S.all.filter(function (i) { return i.id !== it.id; }).slice(0, 12);
    var p = $("#player");
    p.innerHTML =
      '<div class="vp" id="vp">' +
        '<video id="vid" class="vp-video" playsinline preload="metadata"></video>' +
        '<div class="vp-gest" id="vpGest"></div>' +
        '<div class="vp-rip l" id="ripL"><div><b>−10s</b></div></div>' +
        '<div class="vp-rip r" id="ripR"><div><b>+10s</b></div></div>' +
        '<div class="vp-badge" id="vpBadge"><b>2×</b> ' + ic("play", 12) + '</div>' +
        '<div class="vp-top"><button class="vp-ib" id="back" type="button" aria-label="Back">' + ic("back", 22) + '</button></div>' +
        '<div class="vp-bottom">' +
          '<input class="vp-seek" id="seek" type="range" min="0" max="1000" value="0" aria-label="Seek">' +
          '<div class="vp-row">' +
            '<button class="vp-ib" id="vpPlay" type="button" aria-label="Play">' + ic("play", 22) + '</button>' +
            '<span class="vp-time" id="vpTime">0:00 / 0:00</span>' +
            '<span class="vp-sp"></span>' +
            '<button class="vp-ib" id="vpMute" type="button" aria-label="Mute">' + ic("vol", 20) + '</button>' +
            '<input class="vp-vol" id="vpVol" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">' +
            '<button class="vp-ib" id="vpFit" type="button" aria-label="Fit">' + ic("fit", 20) + '</button>' +
            '<button class="vp-ib" id="vpPip" type="button" aria-label="Picture in picture">' + ic("pip", 20) + '</button>' +
            '<button class="vp-ib" id="vpFull" type="button" aria-label="Fullscreen">' + ic("full", 20) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
        '<div class="d-btns"><button class="pill" id="addList" type="button">' + ic("plus", 16) + '<span>Add to list</span></button><button class="pill" id="share" type="button">' + ic("share", 16) + '<span>Share</span></button></div>' +
        resources + epHtml +
        rowSection("D|" + it.id, "For you", others) +
      '</div>';
    p.classList.remove("hidden");
    document.body.classList.add("in-player");
    attachPlayer();
  }
  function closeDetail() {
    var v = $("#vid");
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    var p = $("#player");
    p.classList.add("hidden"); p.innerHTML = "";
    document.body.classList.remove("in-player");
  }
  function playEp(i) { S.ep = i; S.showAll = false; renderDetail(); }

  // ---- custom player: double tap ±10s, hold for 2x, fit, PiP, volume, fullscreen ----
  function attachPlayer() {
    var vp = $("#vp"), v = $("#vid"), g = $("#vpGest"), seek = $("#vpSeek") || $("#seek"), tm = $("#vpTime"), pb = $("#vpPlay"), vol = $("#vpVol"), mu = $("#vpMute"), fit = $("#vpFit");
    var list = [streamOf(S.cur)].concat(CFG.DEMO_SOURCES || []).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    var si = 0, idleT = null, pressT = null, speedOn = false, moved = false, sx = 0, sy = 0, lastTap = 0, lastSide = "", tapT = null;
    v.src = list[si]; v.load();
    v.addEventListener("error", function () {
      if (si < list.length - 1) { si++; v.src = list[si]; v.load(); v.play().catch(function () {}); }
      else toast("Demo video could not be loaded");
    });
    function fmt(s) {
      s = isFinite(s) ? Math.max(0, Math.floor(s)) : 0;
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
      return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0");
    }
    function sync() { var d = v.duration || 0, c = v.currentTime || 0; tm.textContent = fmt(c) + " / " + fmt(d); seek.value = d ? Math.round(c / d * 1000) : 0; }
    function showCtrl() { vp.classList.remove("idle"); clearTimeout(idleT); if (!v.paused) idleT = setTimeout(function () { vp.classList.add("idle"); }, 2800); }
    function flash(side) { var el = $(side === "l" ? "#ripL" : "#ripR"); el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("on"); }, 500); }
    function skip(sec, side) { var max = v.duration || Infinity; v.currentTime = Math.min(Math.max(0, (v.currentTime || 0) + sec), max); flash(side); showCtrl(); }
    function badge(on) { $("#vpBadge").classList.toggle("on", on); }
    v.addEventListener("timeupdate", sync);
    v.addEventListener("loadedmetadata", sync);
    v.addEventListener("play", function () { pb.innerHTML = ic("pause", 22); showCtrl(); });
    v.addEventListener("pause", function () { pb.innerHTML = ic("play", 22); vp.classList.remove("idle"); clearTimeout(idleT); });
    pb.onclick = function () { if (v.paused) v.play().catch(function () {}); else v.pause(); };
    seek.oninput = function () { if (v.duration) v.currentTime = seek.value / 1000 * v.duration; };
    vol.oninput = function () { v.volume = +vol.value; v.muted = +vol.value === 0; mu.innerHTML = ic(v.muted ? "mute" : "vol", 20); };
    mu.onclick = function () { v.muted = !v.muted; if (!v.muted && v.volume === 0) v.volume = 1; vol.value = v.muted ? 0 : v.volume; mu.innerHTML = ic(v.muted ? "mute" : "vol", 20); };
    fit.onclick = function () { vp.classList.toggle("cover"); };
    $("#vpPip").onclick = function () { if (v.requestPictureInPicture) v.requestPictureInPicture().catch(function () { toast("Picture-in-picture is not available"); }); else toast("Picture-in-picture is not supported here"); };
    $("#vpFull").onclick = function () { var fn = vp.requestFullscreen || vp.webkitRequestFullscreen; if (fn) fn.call(vp); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); };

    g.addEventListener("pointerdown", function (e) {
      moved = false; sx = e.clientX; sy = e.clientY; speedOn = false;
      clearTimeout(pressT);
      pressT = setTimeout(function () { speedOn = true; v.playbackRate = 2; badge(true); }, 380);
    });
    g.addEventListener("pointermove", function (e) {
      if (Math.abs(e.clientX - sx) > 12 || Math.abs(e.clientY - sy) > 12) { moved = true; clearTimeout(pressT); }
    });
    g.addEventListener("pointerup", function (e) {
      clearTimeout(pressT);
      if (speedOn) { speedOn = false; v.playbackRate = 1; badge(false); return; }
      if (moved) return;
      var r = g.getBoundingClientRect(), side = (e.clientX - r.left) < r.width / 2 ? "l" : "r", now = Date.now();
      if (now - lastTap < 300 && side === lastSide) { clearTimeout(tapT); lastTap = 0; skip(side === "l" ? -10 : 10, side); }
      else { lastTap = now; lastSide = side; clearTimeout(tapT); tapT = setTimeout(showCtrl, 260); }
    });
    g.addEventListener("pointercancel", function () { clearTimeout(pressT); if (speedOn) { speedOn = false; v.playbackRate = 1; badge(false); } });
    showCtrl();
    v.play().catch(function () {});
  }

  // ---- bottom sheet ----
  function openSheet(title, opts, sel, pick) {
    S.sheetPick = pick;
    var sh = $("#sheet");
    sh.innerHTML = '<div class="sh-bd" data-sh="1"></div><div class="sh-panel"><div class="grip"></div><div class="sh-t">' + esc(title) + '</div>' +
      opts.map(function (o, i) { return '<button class="sh-o' + (i === sel ? " on" : "") + '" type="button" data-si="' + i + '"><span>' + esc(o) + '</span>' + (i === sel ? ic("check", 18) : "") + '</button>'; }).join("") + '</div>';
    sh.classList.remove("hidden");
    requestAnimationFrame(function () { sh.classList.add("open"); });
  }
  function closeSheet() {
    var sh = $("#sheet");
    sh.classList.remove("open");
    setTimeout(function () { sh.classList.add("hidden"); sh.innerHTML = ""; }, 260);
  }
  function openDD(kind) {
    var it = S.cur;
    if (kind === "q") openSheet("Quality", it.versions.map(function (v) { return v.quality + (v.size ? " · " + v.size : ""); }), S.qIdx, function (i) { S.qIdx = i; renderDetail(); });
    else openSheet("Season", it.seasons.map(function (s) { return s.name; }), S.season, function (i) { S.season = i; S.ep = 0; S.showAll = false; renderDetail(); });
  }

  // ---- events ----
  document.addEventListener("click", function (e) {
    var t;
    if (e.target.closest("#back")) return closeDetail();
    if ((t = e.target.closest("[data-si]"))) { var f = S.sheetPick; closeSheet(); if (f) f(+t.dataset.si); return; }
    if (e.target.closest("[data-sh]")) return closeSheet();
    if (e.target.closest("#addList")) return toast("Added to list");
    if (e.target.closest("#share")) { if (navigator.share) navigator.share({ title: S.cur.title }).catch(function () {}); else toast("Share is not available here"); return; }
    if ((t = e.target.closest("[data-dd]"))) return openDD(t.dataset.dd);
    if (e.target.closest("[data-all-ep]")) { S.showAll = !S.showAll; return renderDetail(); }
    if ((t = e.target.closest("[data-ep]"))) return playEp(+t.dataset.ep);
    if ((t = e.target.closest("[data-dltab]"))) { S.dlTab = t.dataset.dltab; return renderDownloads(); }
    if (e.target.closest("#transfer")) return toast("Transfer is not available in demo mode");
    if (e.target.closest("#refresh")) return toast("Nothing new in demo mode");
    if (e.target.closest("#loginBtn")) return toast("Login is not available in demo mode");
    if ((t = e.target.closest("[data-all]"))) return expandKey(t.dataset.all);
    if ((t = e.target.closest("[data-id]"))) return openDetail(t.dataset.id);
    if ((t = e.target.closest("[data-tab]"))) {
      S.tab = t.dataset.tab; S.q = ""; $("#searchInput").value = ""; S.nav = "home";
      setNav("home"); renderTabs(); render(); window.scrollTo(0, 0); return;
    }
    if ((t = e.target.closest("[data-nav]"))) {
      S.nav = t.dataset.nav;
      if (S.nav === "home") { S.tab = "Home"; S.q = ""; $("#searchInput").value = ""; renderTabs(); }
      setNav(S.nav); render(); window.scrollTo(0, 0);
    }
  });
  // Hero dots only. Rows expand ONLY when the "All" button is pressed.
  document.addEventListener("scroll", function (e) {
    if (e.target && e.target.id === "heroTrack") {
      var idx = Math.round(e.target.scrollLeft / (e.target.children[0].offsetWidth + 10));
      S.hero = idx; setDots(idx);
    }
  }, true);
  function setSearch() { S.nav = "home"; setNav("home"); render(); }
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); S.q = $("#searchInput").value; setSearch(); });
  $("#searchInput").addEventListener("input", function (e) { S.q = e.target.value; setSearch(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($("#sheet").classList.contains("open")) closeSheet(); else closeDetail();
  });

  // static icons
  document.querySelectorAll("[data-ico]").forEach(function (el) { el.innerHTML = ic(el.dataset.ico, el.classList.contains("bn-ico") ? 22 : 18); });
  renderTabs();
  Promise.all([FILES.carousel, FILES.movies, FILES.series, FILES.anime, FILES.categories].map(function (u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
  })).then(function (res) {
    var tag = function (arr, src) { return (arr.items || []).map(function (i) { i._src = src; return i; }); };
    S.all = tag(res[1], "movies").concat(tag(res[2], "series"), tag(res[3], "anime"));
    S.all.forEach(function (i) { S.byId[i.id] = i; });
    S.carousel = (res[0].items || []).map(function (id) { return S.byId[id]; }).filter(Boolean);
    S.cats = res[4].items || [];
    render();
  }).catch(function () { $("#main").innerHTML = '<div class="empty">Could not load content.</div>'; });
})();
