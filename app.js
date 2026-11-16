(function () {
  "use strict";
  var CFG = Object.assign({ DATA_PATH: "data/library.json", DEMO_VIDEO: "", HERO_SLIDES: 5 }, window.TFP_CONFIG || {});
  var TABS = ["Home", "Movies", "Web Series", "Anime", "Action", "Drama", "Comedy", "Horror"];
  var S = { items: [], tab: "Home", q: "", nav: "home", cur: null, season: 0, ep: 0, timer: null, hero: 0 };
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bgStyle(it, land) {
    var img = land ? (it.thumb || "") : (it.poster || "");
    if (img) return 'background-image:url("' + esc(img) + '")';
    return "background:linear-gradient(135deg,hsl(" + it.hue + ",65%,40%),hsl(" + ((it.hue + 50) % 360) + ",60%,14%))";
  }
  function metaLine(it) {
    var p = [it.year, it.genre, it.quality];
    if (it.kind === "series") p.push((it.seasons || []).length + " seasons");
    else if (it.size) p.push(it.size);
    return p.filter(Boolean).join(" · ");
  }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.style.opacity = "1"; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = "0"; }, 1800); }

  function matches(it) {
    var q = S.q.trim().toLowerCase();
    if (!q && S.tab === "All") return true;
    if (q) return it.title.toLowerCase().indexOf(q) > -1 || it.genre.toLowerCase().indexOf(q) > -1;
    if (S.tab === "Home") return true;
    if (S.tab === "Movies") return it.kind === "movie";
    if (S.tab === "Web Series") return it.kind === "series";
    return it.genre === S.tab;
  }

  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + esc(t) + '" class="' + (t === S.tab ? "active" : "") + '">' + esc(t) + '</button>';
    }).join("");
  }

  function landCard(it) {
    return '<button class="hslide" type="button" data-id="' + esc(it.id) + '"><div class="ph" style="' + bgStyle(it, true) + '">' +
      (it.thumb ? "" : '<div class="ph-title">' + esc(it.title) + '</div>') + '</div>' +
      '<div class="ov"><h1>' + esc(it.title) + '</h1><div class="chips"><span class="chip hd">' + esc(it.quality) + '</span><span class="chip">' + esc(it.year) + '</span><span class="chip">' + esc(it.genre) + '</span></div><span class="play-pill">▶ Play</span></div></button>';
  }
  function infoCard(it) {
    return '<div class="icard"><button class="ic-poster" type="button" data-id="' + esc(it.id) + '" style="' + bgStyle(it, false) + '"></button>' +
      '<button class="ic-text" type="button" data-id="' + esc(it.id) + '"><span class="ic-title">' + esc(it.title) + '</span><span class="ic-meta">' + esc(metaLine(it)) + '</span></button>' +
      '<button class="ic-play" type="button" data-id="' + esc(it.id) + '" aria-label="Play">▶</button></div>';
  }
  function pCard(it) {
    return '<button class="pcard" type="button" data-id="' + esc(it.id) + '"><div class="pposter" style="' + bgStyle(it, false) + '">' +
      (it.poster ? "" : '<div class="ph-title">' + esc(it.title) + '</div>') + '</div>' +
      '<div class="pt">' + esc(it.title) + '</div><div class="pd">' + esc(it.year) + ' · ' + esc(it.genre) + '</div></button>';
  }
  function pGrid(it) {
    return '<button class="pcard g" type="button" data-id="' + esc(it.id) + '"><div class="pposter" style="' + bgStyle(it, false) + '">' +
      (it.poster ? "" : '<div class="ph-title">' + esc(it.title) + '</div>') + '</div>' +
      '<div class="pt">' + esc(it.title) + '</div><div class="pd">' + esc(it.year) + ' · ' + esc(it.genre) + '</div></button>';
  }

  function renderHome() {
    var hero = S.items.filter(function (i) { return i.trending; }).slice(0, CFG.HERO_SLIDES);
    var series = S.items.filter(function (i) { return i.kind === "series"; });
    var movies = S.items.filter(function (i) { return i.kind === "movie"; });
    var genres = [];
    S.items.forEach(function (i) { if (genres.indexOf(i.genre) < 0) genres.push(i.genre); });
    var cats = '<button class="lcat lcat-all" type="button" data-genre="All"><span>All</span><i class="flt">⧩</i></button>' + genres.map(function (g, i) {
      return '<button class="lcat" type="button" data-genre="' + esc(g) + '" style="background:linear-gradient(135deg,hsl(' + (i * 47) % 360 + ',55%,36%),hsl(' + ((i * 47 + 40) % 360) + ',50%,14%))"><span>' + esc(g) + '</span></button>';
    }).join("");
    var infos = S.items.slice(0, 6).map(infoCard).join("");
    $("#main").innerHTML =
      '<section class="hero"><div class="hero-track" id="heroTrack">' + hero.map(landCard).join("") + '</div>' +
      '<div class="dots">' + hero.map(function (_, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + '</div></section>' +
      '<section class="info-strip">' + infos + '</section>' +
      '<div class="sec-head"><h2>Categories</h2></div><div class="lcats">' + cats + '</div>' +
      '<div class="sec-head"><h2>Classic Series</h2><button data-tab="Web Series" type="button">All ›</button></div><div class="prow">' + series.map(pCard).join("") + '</div>' +
      '<div class="sec-head"><h2>Trending Movies</h2><button data-tab="Movies" type="button">All ›</button></div><div class="prow">' + movies.map(pCard).join("") + '</div>';
    startHero();
  }
  function renderList() {
    var list = S.items.filter(matches);
    var title = S.q ? "Results" : S.tab;
    $("#main").innerHTML = '<div class="sec-head"><h2>' + esc(title) + ' <small>' + list.length + '</small></h2></div>' +
      (list.length ? '<div class="pgrid">' + list.map(pGrid).join("") + '</div>' : '<div class="empty">No items found.</div>');
  }
  function renderSimple(html) { $("#main").innerHTML = html; }
  function render() {
    stopHero();
    if (S.nav === "downloads") return renderSimple('<div class="empty">Downloads are not available in demo mode.</div>');
    if (S.nav === "me") return renderSimple('<div class="me"><div class="me-av">G</div><div><b>Guest</b><div class="pd">Demo mode</div></div></div>');
    if (S.q || S.tab !== "Home") return renderList();
    renderHome();
  }

  function stopHero() { clearInterval(S.timer); }
  function startHero() {
    stopHero();
    S.timer = setInterval(function () {
      var tr = $("#heroTrack"); if (!tr || tr.children.length < 2) return;
      S.hero = (S.hero + 1) % tr.children.length;
      tr.scrollTo({ left: S.hero * (tr.children[0].offsetWidth + 10), behavior: "smooth" });
      document.querySelectorAll(".dots i").forEach(function (d, i) { d.className = i === S.hero ? "on" : ""; });
    }, 5000);
  }

  // ---- detail / player ----
  function openDetail(id) {
    var it = S.items.find(function (i) { return i.id === id; }); if (!it) return;
    S.cur = it; S.season = 0; S.ep = 0;
    renderDetail();
  }
  function renderDetail() {
    var it = S.cur, seasons = it.seasons || [];
    var eps = seasons.length ? seasons[S.season].episodes : [];
    var versions = it.versions || [{ quality: it.quality, size: it.size }];
    var qual = '<select class="sel" id="selQual">' + versions.map(function (v) { return '<option>' + esc(v.quality) + (v.size ? ' · ' + esc(v.size) : '') + '</option>'; }).join("") + '</select>';
    var seas = seasons.length > 1 ? '<select class="sel" id="selSeason">' + seasons.map(function (s, i) { return '<option value="' + i + '"' + (i === S.season ? " selected" : "") + '>' + esc(s.name) + '</option>'; }).join("") + '</select>' : "";
    var epHtml = eps.length ? '<div class="eps">' + eps.map(function (e, i) { return '<button class="ep' + (i === S.ep ? " on" : "") + '" type="button" data-ep="' + i + '">' + String(e.no).padStart(2, "0") + '</button>'; }).join("") + '</div>' : "";
    var others = S.items.filter(function (i) { return i.id !== it.id; }).slice(0, 9);
    var p = $("#player");
    p.innerHTML =
      '<div class="pl-top"><button class="back-btn" id="back" type="button" aria-label="Back">&#8592;</button></div>' +
      '<div class="pl-stage"><video id="vid" class="pl-video" controls playsinline preload="metadata"' + (CFG.DEMO_VIDEO ? ' src="' + esc(CFG.DEMO_VIDEO) + '"' : "") + '></video></div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
      '<div class="d-btns"><button class="pill" id="addList" type="button">+ Add to list</button><button class="pill" id="share" type="button">Share</button></div>' +
      '<div class="res-head"><h3>Resources</h3></div><div class="selects">' + qual + seas + '</div>' + epHtml +
      '<div class="sec-head"><h2>For you</h2></div><div class="pgrid">' + others.map(pGrid).join("") + '</div></div>';
    p.classList.remove("hidden");
    document.body.classList.add("in-player");
    var v = $("#vid");
    if (CFG.DEMO_VIDEO && v) v.play().catch(function () {});
  }
  function closeDetail() {
    var p = $("#player"), v = p.querySelector("video");
    if (v) v.pause();
    p.classList.add("hidden"); p.innerHTML = "";
    document.body.classList.remove("in-player");
  }

  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("#back"))) return closeDetail();
    if ((t = e.target.closest("#addList"))) return toast("Added to list");
    if ((t = e.target.closest("#share"))) { if (navigator.share) navigator.share({ title: S.cur.title }).catch(function () {}); else toast("Share is not available here"); return; }
    if ((t = e.target.closest("[data-ep]"))) {
      S.ep = +t.dataset.ep;
      document.querySelectorAll(".ep").forEach(function (b, i) { b.classList.toggle("on", i === S.ep); });
      var v = $("#vid"); if (v && CFG.DEMO_VIDEO) { v.currentTime = 0; v.play().catch(function () {}); }
      return;
    }
    if ((t = e.target.closest("[data-id]"))) return openDetail(t.dataset.id);
    if ((t = e.target.closest("[data-tab]"))) { S.tab = t.dataset.tab; S.q = ""; $("#searchInput").value = ""; S.nav = "home"; setNav("home"); renderTabs(); render(); window.scrollTo(0, 0); return; }
    if ((t = e.target.closest("[data-genre]"))) { S.tab = t.dataset.genre; S.q = ""; renderTabs(); render(); window.scrollTo(0, 0); return; }
    if ((t = e.target.closest("[data-nav]"))) {
      S.nav = t.dataset.nav;
      if (S.nav === "home") { S.tab = "Home"; S.q = ""; $("#searchInput").value = ""; renderTabs(); }
      setNav(S.nav); render(); window.scrollTo(0, 0);
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "selSeason") { S.season = +e.target.value; S.ep = 0; renderDetail(); }
  });
  function setNav(name) { document.querySelectorAll("[data-nav]").forEach(function (b) { b.classList.toggle("active", b.dataset.nav === name); }); }
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); S.q = $("#searchInput").value; S.nav = "home"; setNav("home"); render(); });
  $("#searchInput").addEventListener("input", function (e) { S.q = e.target.value; S.nav = "home"; setNav("home"); render(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDetail(); });

  renderTabs();
  fetch(CFG.DATA_PATH).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { S.items = d.items || []; render(); })
    .catch(function () { $("#main").innerHTML = '<div class="empty">Could not load content.</div>'; });
})();
