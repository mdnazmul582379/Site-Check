(function () {
  "use strict";
  var CFG = Object.assign({ DEMO_VIDEO: "", HERO_SLIDES: 6, PAGE: 5 }, window.TFP_CONFIG || {});
  var FILES = Object.assign({ carousel: "data/carousel.json", movies: "data/movies.json", series: "data/series.json", anime: "data/anime.json" }, CFG.FILES || {});
  var PAGE = CFG.PAGE;
  var TABS = ["Home", "Movies", "Web Series", "Anime", "Action", "Drama", "Comedy", "Horror"];
  var S = { all: [], byId: {}, carousel: [], reg: {}, expanded: {}, tab: "Home", q: "", nav: "home", cur: null, season: 0, qIdx: 0, ep: 0, showAll: false, dlTab: "Downloaded", hero: 0, timer: null, sheetPick: null };
  var $ = function (s) { return document.querySelector(s); };

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

  // Row of max PAGE cards; "All" button or scrolling past the end expands to a full grid.
  function rowSection(key, title, list) {
    S.reg[key] = { title: title, list: list };
    var exp = !!S.expanded[key];
    var body = exp
      ? '<div class="vgrid">' + list.map(vcard).join("") + '</div>'
      : '<div class="vrow grow" data-key="' + esc(key) + '">' + list.slice(0, PAGE).map(vcard).join("") + '</div>';
    var more = (!exp && list.length > PAGE) ? '<button class="all-btn" type="button" data-all="' + esc(key) + '">All ›</button>' : "";
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
      '<button class="cs-play" type="button" data-id="' + esc(it.id) + '" aria-label="Play">▶</button></div></div>';
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
    var cats = '<button class="lcat" type="button" data-tab="All"><span class="lcat-bg" style="' + bg(S.all[0]) + '"></span><span class="lcat-t">All</span><i class="flt">⧩</i></button>' +
      genresOf(S.all).map(function (g) {
        var rep = S.all.find(function (i) { return i.genre === g; });
        return '<button class="lcat" type="button" data-tab="' + esc(g) + '"><span class="lcat-bg" style="' + bg(rep) + '"></span><span class="lcat-t">' + esc(g) + '</span></button>';
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
      '<div class="dl-empty"><div class="dl-box" aria-hidden="true">▢</div><p>Your downloads will show up here</p></div>' +
      '<div class="sec-head"><h2>For You</h2></div><div class="vgrid">' + S.all.slice(0, 6).map(vcard).join("") + '</div>' +
      '<button class="wide" id="refresh" type="button">↻ Refresh new content</button>';
  }
  function renderMe() {
    var row = function (l, v) { return '<div class="mrow"><span>' + l + '</span><span class="mv">' + (v == null ? "" : v) + '<i>›</i></span></div>'; };
    $("#main").innerHTML =
      '<div class="pg-head"><h1>Me</h1></div>' +
      '<div class="mcard"><div class="me-av">G</div><div class="me-info"><b>Log in to your account</b><div class="pd">Demo mode</div></div><button class="login" type="button" id="loginBtn">Log in</button></div>' +
      '<div class="mpanel">' + row("My List", 0) + row("My Likes", 0) + row("Watch History") + '<div class="vrow hist">' + S.all.slice(0, 4).map(vcard).join("") + '</div>' + row("Messages") + '</div>' +
      '<div class="mpanel">' + row("Community", 0) + row("Posts", 0) + row("My Comments", 0) + '</div>' +
      '<div class="mpanel">' + row("Settings") + row("Study Mode") + row("Feedback") + '</div>';
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

  // ---- detail / player ----
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
    if (vers.length) dd += '<button class="dd" type="button" data-dd="q"><span>' + esc(vers[S.qIdx].quality) + (vers[S.qIdx].size ? ' · ' + esc(vers[S.qIdx].size) : '') + '</span><i>⌄</i></button>';
    if (seasons.length > 1) dd += '<button class="dd" type="button" data-dd="s"><span>' + esc(seasons[S.season].name) + '</span><i>⌄</i></button>';
    var resources = dd ? '<div class="res-head"><h3>Resources</h3></div><div class="res-row">' + dd + '</div>' : "";
    var epHtml = "";
    if (hasEps) {
      epHtml = '<div class="eps"><button class="ep' + (S.showAll ? " on" : "") + '" type="button" data-all-ep="1">All</button>' +
        eps.map(function (e, i) { return '<button class="ep' + (!S.showAll && i === S.ep ? " on" : "") + '" type="button" data-ep="' + i + '">' + String(e.no).padStart(2, "0") + '</button>'; }).join("") + '</div>';
      if (S.showAll) epHtml += '<div class="ep-list">' + eps.map(function (e, i) { return '<button class="ep-row" type="button" data-ep="' + i + '"><span>' + String(e.no).padStart(2, "0") + '</span>' + esc(e.title) + '</button>'; }).join("") + '</div>';
    }
    var others = S.all.filter(function (i) { return i.id !== it.id; }).slice(0, 6);
    var src = streamOf(it);
    var p = $("#player");
    p.innerHTML =
      '<div class="pl-top"><button class="back-btn" id="back" type="button" aria-label="Back">&#8592;</button></div>' +
      '<div class="pl-stage"><video id="vid" class="pl-video" controls playsinline preload="metadata"' + (src ? ' src="' + esc(src) + '"' : "") + '></video></div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
      '<div class="d-btns"><button class="pill" id="addList" type="button">+ Add to list</button><button class="pill" id="share" type="button">Share</button></div>' +
      resources + epHtml +
      '<div class="sec-head sec-d"><h2>For you</h2></div><div class="vgrid">' + others.map(vcard).join("") + '</div></div>';
    p.classList.remove("hidden");
    document.body.classList.add("in-player");
    var v = $("#vid"); if (src && v) v.play().catch(function () {});
  }
  function closeDetail() {
    var p = $("#player"), v = p.querySelector("video");
    if (v) v.pause();
    p.classList.add("hidden"); p.innerHTML = "";
    document.body.classList.remove("in-player");
  }
  function playEp(i) { S.ep = i; S.showAll = false; renderDetail(); }

  // ---- bottom sheet (replaces native dropdowns) ----
  function openSheet(title, opts, sel, pick) {
    S.sheetPick = pick;
    var sh = $("#sheet");
    sh.innerHTML = '<div class="sh-bd" data-sh="1"></div><div class="sh-panel"><div class="grip"></div><div class="sh-t">' + esc(title) + '</div>' +
      opts.map(function (o, i) { return '<button class="sh-o" type="button" data-si="' + i + '"><span>' + esc(o) + '</span><b>' + (i === sel ? "✓" : "") + '</b></button>'; }).join("") + '</div>';
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
  document.addEventListener("scroll", function (e) {
    var el = e.target;
    if (!el || !el.classList) return;
    if (el.id === "heroTrack") {
      var idx = Math.round(el.scrollLeft / (el.children[0].offsetWidth + 10));
      S.hero = idx; setDots(idx);
    } else if (el.classList.contains("grow")) {
      var key = el.dataset.key, r = S.reg[key];
      if (r && r.list.length > PAGE && el.scrollLeft + el.clientWidth >= el.scrollWidth - 16) expandKey(key);
    }
  }, true);
  function setSearch() { S.nav = "home"; setNav("home"); render(); }
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); S.q = $("#searchInput").value; setSearch(); });
  $("#searchInput").addEventListener("input", function (e) { S.q = e.target.value; setSearch(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($("#sheet").classList.contains("open")) closeSheet(); else closeDetail();
  });

  renderTabs();
  Promise.all([FILES.carousel, FILES.movies, FILES.series, FILES.anime].map(function (u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
  })).then(function (res) {
    var tag = function (arr, src) { return (arr.items || []).map(function (i) { i._src = src; return i; }); };
    S.all = tag(res[1], "movies").concat(tag(res[2], "series"), tag(res[3], "anime"));
    S.all.forEach(function (i) { S.byId[i.id] = i; });
    S.carousel = (res[0].items || []).map(function (id) { return S.byId[id]; }).filter(Boolean);
    render();
  }).catch(function () { $("#main").innerHTML = '<div class="empty">Could not load content.</div>'; });
})();
