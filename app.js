(function () {
  "use strict";
  var CFG = Object.assign({ DATA_PATH: "data/demo.json", DEMO_VIDEO: "", HERO_SLIDES: 4 }, window.TFP_CONFIG || {});
  var TABS = ["Home", "Movies", "Web Series", "Anime", "Action", "Drama", "Comedy", "Horror"];
  var GENRES = ["Action", "Drama", "Comedy", "Horror", "Thriller", "Anime"];
  var state = { items: [], tab: "Home", query: "", nav: "home", heroIdx: 0, timer: null };
  var $ = function (s) { return document.querySelector(s); };
  var main = function () { return $("#main"); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function bg(it) {
    return "background:linear-gradient(135deg,hsl(" + it.hue + ",70%,42%),hsl(" + ((it.hue + 50) % 360) + ",65%,16%))";
  }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = "0"; }, 1800);
  }

  function card(it) {
    return '<button class="card" type="button" data-id="' + esc(it.id) + '">' +
      '<div class="card-media"><div class="thumb" style="' + bg(it) + '"></div>' +
      '<div class="ph-title">' + esc(it.title) + '</div></div>' +
      '<div class="card-title">' + esc(it.title) + '</div>' +
      '<div class="card-sub">' + esc(it.year) + ' · ' + esc(it.genre) + '</div></button>';
  }
  function slide(it) {
    return '<button class="slide" type="button" data-id="' + esc(it.id) + '">' +
      '<div class="thumb" style="' + bg(it) + '"></div>' +
      '<div class="sov"><h1>' + esc(it.title) + '</h1>' +
      '<div class="chips-row"><span class="meta-chip hd">' + esc(it.quality) + '</span>' +
      '<span class="meta-chip">' + esc(it.year) + '</span><span class="meta-chip">' + esc(it.genre) + '</span></div>' +
      '<span class="spill">▶ Play</span></div></button>';
  }
  function section(title, count, inner, cls) {
    return '<div class="sec-head"><h2>' + esc(title) + (count != null ? ' <span class="cnt">' + count + '</span>' : '') + '</h2></div>' +
      '<div class="' + cls + '">' + inner + '</div>';
  }

  function matches(it) {
    var q = state.query.trim().toLowerCase();
    if (q) return it.title.toLowerCase().indexOf(q) > -1 || it.genre.toLowerCase().indexOf(q) > -1;
    if (state.tab === "Home") return true;
    if (state.tab === "Movies") return it.kind === "movie";
    if (state.tab === "Web Series") return it.kind === "series";
    return it.genre === state.tab;
  }

  function renderTabs() {
    $("#tabs").innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + esc(t) + '" class="' + (t === state.tab ? "active" : "") + '">' + esc(t) + '</button>';
    }).join("");
  }

  function renderHome() {
    var hero = state.items.filter(function (i) { return i.trending; }).slice(0, CFG.HERO_SLIDES);
    var cats = GENRES.map(function (g, i) {
      return '<button class="cat" type="button" data-genre="' + esc(g) + '" style="' + bg({ hue: i * 55 }) + '"><span>' + esc(g) + '</span></button>';
    }).join("");
    var movies = state.items.filter(function (i) { return i.kind === "movie"; });
    var series = state.items.filter(function (i) { return i.kind === "series"; });
    var row = function (list) { return list.map(card).join(""); };

    main().innerHTML =
      '<section class="car"><div class="car-track" id="heroTrack">' + hero.map(slide).join("") + '</div>' +
      '<div class="dots">' + hero.map(function (_, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + '</div></section>' +
      section("Browse by genre", null, cats, "cats") +
      section("Movies", movies.length, row(movies), "row") +
      section("Web Series", series.length, row(series), "row");
  }

  function renderList() {
    var list = state.items.filter(matches);
    var title = state.query ? "Results" : state.tab;
    main().innerHTML = section(title, list.length,
      list.length ? list.map(card).join("") : '<div class="empty">No items found.</div>', "grid");
  }

  function renderDownloads() {
    main().innerHTML = '<div class="dl-empty">Downloads are not available in demo mode.</div>';
  }

  function renderMe() {
    main().innerHTML =
      '<div class="me-hero"><div class="me-av">G</div><div class="me-info"><div><b>Guest</b></div>' +
      '<span class="me-badge">Demo</span></div></div>' +
      '<div class="panel"><div class="panel-title">Account</div>' +
      '<div class="menu-item">Settings <span>›</span></div>' +
      '<div class="menu-item">Help <span>›</span></div></div>';
  }

  function render() {
    if (state.nav === "downloads") return renderDownloads();
    if (state.nav === "me") return renderMe();
    stopHero();
    if (state.query || state.tab !== "Home") renderList(); else renderHome();
    if (!state.query && state.tab === "Home") startHero();
  }

  function stopHero() { clearInterval(state.timer); }
  function startHero() {
    stopHero();
    state.timer = setInterval(function () {
      var tr = $("#heroTrack");
      if (!tr || tr.children.length < 2) return;
      state.heroIdx = (state.heroIdx + 1) % tr.children.length;
      tr.scrollTo({ left: state.heroIdx * (tr.children[0].offsetWidth + 12), behavior: "smooth" });
      document.querySelectorAll(".dots i").forEach(function (d, i) { d.className = i === state.heroIdx ? "on" : ""; });
    }, 5000);
  }

  function openPlayer(id) {
    var it = state.items.find(function (i) { return i.id === id; });
    if (!it) return;
    var p = $("#player");
    var src = CFG.DEMO_VIDEO ? ' src="' + esc(CFG.DEMO_VIDEO) + '"' : "";
    p.innerHTML =
      '<div class="pl-top"><button class="back-btn" id="plBack" type="button" aria-label="Back">&#8592;</button></div>' +
      '<div class="pl-stage"><video class="pl-video" controls playsinline preload="metadata"' + src + '></video></div>' +
      '<div class="pl-body"><div class="pl-info"><h2>' + esc(it.title) + '</h2>' +
      '<div class="pl-meta">' + esc(it.year) + ' · ' + esc(it.genre) + ' · ' + esc(it.quality) + ' · ' + esc(it.duration) + '</div>' +
      (CFG.DEMO_VIDEO ? '' : '<p class="legal">Set DEMO_VIDEO in config.js to play a video.</p>') +
      '</div></div>';
    p.classList.remove("hidden");
    document.body.classList.add("in-player");
    $("#plBack").addEventListener("click", closePlayer);
    var v = p.querySelector("video");
    if (CFG.DEMO_VIDEO && v) v.play().catch(function () {});
  }
  function closePlayer() {
    var p = $("#player");
    var v = p.querySelector("video");
    if (v) v.pause();
    p.classList.add("hidden");
    p.innerHTML = "";
    document.body.classList.remove("in-player");
  }

  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; state.query = ""; $("#searchInput").value = ""; renderTabs(); state.nav = "home"; setNav("home"); render(); return; }
    var genre = e.target.closest("[data-genre]");
    if (genre) { state.tab = genre.dataset.genre; state.query = ""; renderTabs(); render(); window.scrollTo(0, 0); return; }
    var c = e.target.closest(".card, .slide");
    if (c) { openPlayer(c.dataset.id); return; }
    var n = e.target.closest("[data-nav]");
    if (n) {
      state.nav = n.dataset.nav;
      if (state.nav === "home") { state.tab = "Home"; state.query = ""; $("#searchInput").value = ""; renderTabs(); }
      setNav(state.nav); render(); window.scrollTo(0, 0);
    }
  });

  function setNav(name) {
    document.querySelectorAll("[data-nav]").forEach(function (b) { b.classList.toggle("active", b.dataset.nav === name); });
  }

  $("#searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    state.query = $("#searchInput").value;
    state.nav = "home"; setNav("home");
    if (!state.query.trim()) toast("Type a title to search");
    render();
  });
  $("#searchInput").addEventListener("input", function (e) {
    state.query = e.target.value; state.nav = "home"; setNav("home"); render();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePlayer(); });

  renderTabs();
  fetch(CFG.DATA_PATH)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { state.items = d.items || []; render(); })
    .catch(function () { main().innerHTML = '<div class="empty-card">Could not load content.</div>'; });
})();
