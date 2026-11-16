(function () {
  "use strict";
  var CFG = Object.assign({ DATA_PATH: "data/library.json", DEMO_VIDEO: "", HERO_SLIDES: 5 }, window.TFP_CONFIG || {});
  var TABS = ["Home", "Movies", "Web Series", "Anime", "Action", "Drama", "Comedy", "Horror"];
  var S = { items: [], tab: "Home", q: "", nav: "home", cur: null, season: 0, ep: 0, showAll: false, timer: null, hero: 0 };
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function grad(it) { return "linear-gradient(135deg,hsl(" + it.hue + ",60%,36%),hsl(" + ((it.hue + 50) % 360) + ",55%,12%))"; }
  function bgImg(url, it) { return url ? 'background-image:url("' + esc(url) + '")' : "background:" + grad(it); }
  function quality(it) { return it.quality || (it.versions && it.versions[0] ? it.versions[0].quality : ""); }
  function metaLine(it) {
    var p = [it.year, it.genre, quality(it)];
    if (it.kind === "series") p.push((it.seasons || []).length + " seasons");
    else if (it.size) p.push(it.size);
    return p.filter(Boolean).join(" · ");
  }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.style.opacity = "1"; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = "0"; }, 1800); }

  function matches(it) {
    var q = S.q.trim().toLowerCase();
    if (q) return it.title.toLowerCase().indexOf(q) > -1 || it.genre.toLowerCase().indexOf(q) > -1;
    if (S.tab === "Home" || S.tab === "All") return true;
    if (S.tab === "Movies") return it.kind === "movie";
    if (S.tab === "Web Series") return it.kind === "series";
    return it.genre === S.tab;
  }
  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + esc(t) + '" class="' + (t === S.tab ? "active" : "") + '">' + esc(t) + '</button>';
    }).join("");
  }

  // Hero slide = one unit: 16:9 image (no text) + card below with poster, title once, details, play
  function heroSlide(it) {
    return '<div class="cslide">' +
      '<button class="cs-img" type="button" data-id="' + esc(it.id) + '" style="' + bgImg(it.thumb, it) + '" aria-label="Open"></button>' +
      '<div class="cs-card">' +
      '<button class="cs-poster" type="button" data-id="' + esc(it.id) + '" style="' + bgImg(it.poster, it) + '" aria-label="Open"></button>' +
      '<button class="cs-text" type="button" data-id="' + esc(it.id) + '"><span class="cs-title">' + esc(it.title) + '</span><span class="cs-meta">' + esc(metaLine(it)) + '</span></button>' +
      '<button class="cs-play" type="button" data-id="' + esc(it.id) + '" aria-label="Play">▶</button>' +
      '</div></div>';
  }
  function pCard(it) {
    return '<button class="pcard" type="button" data-id="' + esc(it.id) + '"><div class="pposter" style="' + bgImg(it.poster, it) + '"></div>' +
      '<div class="pt">' + esc(it.title) + '</div><div class="pd">' + esc(it.year) + ' · ' + esc(it.genre) + '</div></button>';
  }
  function pGrid(it) { return pCard(it).replace('class="pcard"', 'class="pcard g"'); }
  function catTile(g, rep, icon) {
    return '<button class="lcat" type="button" data-genre="' + esc(g) + '"><span class="lcat-bg" style="' + bgImg(rep && rep.thumb, rep || {hue:0}) + '"></span><span class="lcat-t">' + esc(g) + '</span>' + (icon ? '<i class="flt">⧩</i>' : '') + '</button>';
  }

  function renderHome() {
    var hero = S.items.filter(function (i) { return i.trending; }).slice(0, CFG.HERO_SLIDES);
    var series = S.items.filter(function (i) { return i.kind === "series"; });
    var movies = S.items.filter(function (i) { return i.kind === "movie"; });
    var genres = [];
    S.items.forEach(function (i) { if (genres.indexOf(i.genre) < 0) genres.push(i.genre); });
    var cats = catTile("All", S.items[0], true) + genres.map(function (g) {
      return catTile(g, S.items.find(function (i) { return i.genre === g; }), false);
    }).join("");
    $("#main").innerHTML =
      '<section class="hero"><div class="hero-track" id="heroTrack">' + hero.map(heroSlide).join("") + '</div>' +
      '<div class="dots">' + hero.map(function (_, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + '</div></section>' +
      '<div class="sec-head"><h2>Categories</h2></div><div class="lcats">' + cats + '</div>' +
      '<div class="sec-head"><h2>Classic Series</h2><button data-tab="Web Series" type="button">All ›</button></div><div class="prow">' + series.map(pCard).join("") + '</div>' +
      '<div class="sec-head"><h2>Trending Movies</h2><button data-tab="Movies" type="button">All ›</button></div><div class="prow">' + movies.map(pCard).join("") + '</div>';
    startHero();
  }
  function renderList() {
    var list = S.items.filter(matches);
    $("#main").innerHTML = '<div class="sec-head"><h2>' + esc(S.q ? "Results" : S.tab) + ' <small>' + list.length + '</small></h2></div>' +
      (list.length ? '<div class="pgrid">' + list.map(pGrid).join("") + '</div>' : '<div class="empty">No items found.</div>');
  }
  function render() {
    stopHero();
    if (S.nav === "downloads") { $("#main").innerHTML = '<div class="empty">Downloads are not available in demo mode.</div>'; return; }
    if (S.nav === "me") { $("#main").innerHTML = '<div class="me"><div class="me-av">G</div><div><b>Guest</b><div class="pd">Demo mode</div></div></div>'; return; }
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
  document.addEventListener("scroll", function (e) {
    if (!e.target || e.target.id !== "heroTrack") return;
    var tr = e.target, step = tr.children[0].offsetWidth + 10;
    var idx = Math.round(tr.scrollLeft / step);
    S.hero = idx;
    document.querySelectorAll(".dots i").forEach(function (d, i) { d.className = i === idx ? "on" : ""; });
  }, true);

  // ---- detail / player ----
  function streamOf(it) { return it.stream || CFG.DEMO_VIDEO; }
  function openDetail(id) {
    var it = S.items.find(function (i) { return i.id === id; }); if (!it) return;
    S.cur = it; S.season = 0; S.ep = 0; S.showAll = false; renderDetail();
  }
  function renderDetail() {
    var it = S.cur, seasons = it.seasons || [], vers = it.versions || [];
    var hasEps = seasons.length > 0;
    var eps = hasEps ? seasons[S.season].episodes : [];
    var qual = vers.length ? '<select class="sel" id="selQual">' + vers.map(function (v) { return '<option>' + esc(v.quality) + (v.size ? ' · ' + esc(v.size) : '') + '</option>'; }).join("") + '</select>' : "";
    var seas = seasons.length > 1 ? '<select class="sel" id="selSeason">' + seasons.map(function (s, i) { return '<option value="' + i + '"' + (i === S.season ? " selected" : "") + '>' + esc(s.name) + '</option>'; }).join("") + '</select>' : "";
    var resources = (qual || seas) ? '<div class="res-head"><h3>Resources</h3></div><div class="res-row">' + qual + seas + '</div>' : "";
    var epHtml = "";
    if (hasEps) {
      epHtml = '<div class="eps"><button class="ep' + (S.showAll ? " on" : "") + '" type="button" data-all="1">All</button>' +
        eps.map(function (e, i) { return '<button class="ep' + (!S.showAll && i === S.ep ? " on" : "") + '" type="button" data-ep="' + i + '">' + String(e.no).padStart(2, "0") + '</button>'; }).join("") + '</div>';
      if (S.showAll) epHtml += '<div class="ep-list">' + eps.map(function (e, i) { return '<button class="ep-row" type="button" data-ep="' + i + '"><span>' + String(e.no).padStart(2, "0") + '</span>' + esc(e.title) + '</button>'; }).join("") + '</div>';
    }
    var others = S.items.filter(function (i) { return i.id !== it.id; }).slice(0, 9);
    var src = streamOf(it);
    var p = $("#player");
    p.innerHTML =
      '<div class="pl-top"><button class="back-btn" id="back" type="button" aria-label="Back">&#8592;</button></div>' +
      '<div class="pl-stage"><video id="vid" class="pl-video" controls playsinline preload="metadata"' + (src ? ' src="' + esc(src) + '"' : "") + '></video></div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
      '<div class="d-btns"><button class="pill" id="addList" type="button">+ Add to list</button><button class="pill" id="share" type="button">Share</button></div>' +
      resources + epHtml +
      '<div class="sec-head sec-d"><h2>For you</h2></div><div class="pgrid">' + others.map(pGrid).join("") + '</div></div>';
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
  function playEp(i) {
    S.ep = i; S.showAll = false;
    renderDetail();
    var v = $("#vid"); if (v && streamOf(S.cur)) { v.currentTime = 0; v.play().catch(function () {}); }
  }

  document.addEventListener("click", function (e) {
    var t;
    if (e.target.closest("#back")) return closeDetail();
    if (e.target.closest("#addList")) return toast("Added to list");
    if (e.target.closest("#share")) { if (navigator.share) navigator.share({ title: S.cur.title }).catch(function () {}); else toast("Share is not available here"); return; }
    if (e.target.closest("[data-all]")) { S.showAll = !S.showAll; renderDetail(); return; }
    if ((t = e.target.closest("[data-ep]"))) return playEp(+t.dataset.ep);
    if ((t = e.target.closest("[data-id]"))) return openDetail(t.dataset.id);
    if ((t = e.target.closest("[data-tab]"))) { S.tab = t.dataset.tab; S.q = ""; $("#searchInput").value = ""; S.nav = "home"; setNav("home"); renderTabs(); render(); window.scrollTo(0, 0); return; }
    if ((t = e.target.closest("[data-genre]"))) { S.tab = t.dataset.genre; S.q = ""; S.nav = "home"; setNav("home"); renderTabs(); render(); window.scrollTo(0, 0); return; }
    if ((t = e.target.closest("[data-nav]"))) {
      S.nav = t.dataset.nav;
      if (S.nav === "home") { S.tab = "Home"; S.q = ""; $("#searchInput").value = ""; renderTabs(); }
      setNav(S.nav); render(); window.scrollTo(0, 0);
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "selSeason") { S.season = +e.target.value; S.ep = 0; S.showAll = false; renderDetail(); }
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
