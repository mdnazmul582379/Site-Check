/*
 * TeraFast Play — UI demo app.
 * NOTE FOR AI ASSISTANTS: this file is UI code. Do not delete demo data or the
 * data/*.json files when editing. Demo titles/posters are placeholders only.
 */
(function () {
  "use strict";
  var CFG = Object.assign({ DEMO_VIDEO: "", DEMO_SOURCES: [], HERO_SLIDES: 6, PAGE: 5, PREVIEW: 20, STEP: 20 }, window.TFP_CONFIG || {});
  var FILES = { categories: "data/categories.json", carousel: "data/carousel.json", video: "data/video.json", series: "data/series.json" };
  var PAGE = CFG.PAGE, PREVIEW = CFG.PREVIEW;
  var TABS = ["Home", "Trending", "Movie", "Series", "Midnight", "Anime", "Kids", "Desi Porn", "Foreign Porn", "18+ Vmax", "18+ JAV", "Indo"];
  var HOME_ORDER = ["Trending", "Movie", "Series", "Midnight", "Anime", "Kids", "Desi Porn", "Foreign Porn", "18+ Vmax", "18+ JAV", "Indo"];
  // Categories that skip genre rows: carousel (10) + direct grid.
  var DIRECT_CATS = ["Midnight", "Desi Porn", "Foreign Porn", "18+ Vmax", "18+ JAV", "Indo"];
  var S = {
    cats: [], all: [], byId: {}, carousel: [], views: {}, lim: {}, focus: null,
    tab: "Home", q: "", nav: "home", cur: null, season: 0, qIdx: 0, ep: 0, showAll: false,
    dlTab: "Downloaded", hero: 0, timer: null, relatedTimer: null, relatedIdx: 0, sheetPick: null
  };
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
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    exitFull: '<path d="M9 3v4a2 2 0 0 1-2 2H3"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M9 21v-4a2 2 0 0 0-2-2H3"/><path d="M15 21v-4a2 2 0 0 1 2-2h4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.5"/>',
    speed: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    rotate: '<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M6 20v-4h4"/>'
  };
  function ic(n, s) { s = s || 20; return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || "") + '</svg>'; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function grad(it) { var h = (it && it.hue != null) ? it.hue : 210; return "linear-gradient(135deg,hsl(" + h + ",60%,36%),hsl(" + ((h + 50) % 360) + ",55%,12%))"; }
  function bg(it) { it = it || { hue: 0 }; return it.thumb ? 'background-image:url("' + esc(it.thumb) + '")' : "background:" + grad(it); }
  function quality(it) { return it.quality || (it.versions && it.versions[0] ? it.versions[0].quality : ""); }
  function metaLine(it) {
    var p = [it.year, it.genre, quality(it)];
    if (it.seasons && it.seasons.length) p.push(it.seasons.length + " seasons");
    else if (it.size) p.push(it.size);
    return p.filter(Boolean).join(" · ");
  }
  function streamOf(it) {
    // Series: episode stream only (no extra top-level stream required)
    if (it.seasons && it.seasons.length) {
      var season = it.seasons[S.season] || it.seasons[0];
      var eps = (season && season.episodes) || [];
      var ep = eps[S.ep] || eps[0];
      if (ep && ep.stream) return ep.stream;
    }
    // Movie: selected quality version stream, then item.stream
    if (it.versions && it.versions.length) {
      var v = it.versions[S.qIdx] || it.versions[0];
      if (v && v.stream) return v.stream;
    }
    return it.stream || CFG.DEMO_VIDEO;
  }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.style.opacity = "1"; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = "0"; }, 1800); }

  // ---- views (click counts, stored on this device) ----
  function loadViews() { try { return JSON.parse(localStorage.getItem("tfp_views") || "{}"); } catch (e) { return {}; } }
  function countView(id) {
    S.views[id] = (S.views[id] || 0) + 1;
    try { localStorage.setItem("tfp_views", JSON.stringify(S.views)); } catch (e) {}
  }
  // Trending = most clicked items, excluding the carousel (those are already in the hero).
  function trendingList() {
    var inCar = {};
    S.carousel.forEach(function (i) { inCar[i.id] = true; });
    return S.all.filter(function (i) { return !inCar[i.id]; })
      .map(function (it, idx) { return { it: it, idx: idx }; })
      .sort(function (a, b) { return (S.views[b.it.id] || 0) - (S.views[a.it.id] || 0) || a.idx - b.idx; })
      .map(function (x) { return x.it; });
  }

  // ---- sections: preview, See more (+40 first, then +20 each), focus ----
  function sec(key, title, list, preview, mixed) { return { key: key, title: title, list: list, preview: preview, mixed: !!mixed }; }
  function genresOf(list) { var g = []; list.forEach(function (i) { if (g.indexOf(i.genre) < 0) g.push(i.genre); }); return g; }
  function bySrc(src) { return S.all.filter(function (i) { return i._src === src; }); }
  function isAnime(i) { return !!(i.tags && i.tags.indexOf("anime") > -1); }
  function byGenre(list, g) { return list.filter(function (i) { return i.genre === g; }); }
  function byCategory(list, c) {
    return list.filter(function (i) {
      if (i.category) return i.category === c;
      return i.genre === c;
    });
  }
  function genresIn(list) {
    var g = [];
    list.forEach(function (i) {
      var name = i.genre || "";
      if (name && g.indexOf(name) < 0) g.push(name);
    });
    return g;
  }

  function homeSections() {
    return HOME_ORDER.map(function (name) {
      var list = byCategory(S.all, name);
      if (name === "Trending") {
        var trend = trendingList();
        if (trend.length) list = trend;
      }
      return sec("H|" + name, name, list, PAGE);
    });
  }
  function tabSections() {
    var t = S.tab;
    if (HOME_ORDER.indexOf(t) > -1) {
      var pool = byCategory(S.all, t);
      if (t === "Trending") {
        var trend = trendingList();
        if (trend.length) pool = trend;
      }
      // Direct categories: no genre rows — handled in renderTab with carousel + grid
      if (DIRECT_CATS.indexOf(t) > -1) {
        return [sec("C|" + t, t, pool, PREVIEW, true)];
      }
      var gens = genresIn(pool);
      if (!gens.length) return [sec("C|" + t, t, pool, PREVIEW, true)];
      return gens.map(function (g) {
        return sec("C|" + t + "|" + g, g, byGenre(pool, g), PAGE);
      });
    }
    if (t === "All") {
      return [sec("A|All", "All", S.all, PREVIEW, true)].concat(
        HOME_ORDER.map(function (c) { return sec("A|" + c, c, byCategory(S.all, c), PAGE); })
      );
    }
    return [sec("G|" + t, t, byCategory(S.all, t), PREVIEW, true)];
  }
  function searchSections() {
    var q = S.q.trim().toLowerCase();
    var list = S.all.filter(function (i) { return i.title.toLowerCase().indexOf(q) > -1 || (i.genre || "").toLowerCase().indexOf(q) > -1 || (i.category || "").toLowerCase().indexOf(q) > -1; });
    return [sec("Q|results", "Results", list, PREVIEW, true)]; // title used once in sectionHTML when no outer pg-title
  }
  function currentSections() {
    if (S.q.trim()) return searchSections();
    if (S.tab === "Home") return homeSections();
    return tabSections();
  }
  function findSection(key) {
    var secs = currentSections();
    for (var i = 0; i < secs.length; i++) if (secs[i].key === key) return secs[i];
    if (S.cur && key === "D|" + S.cur.id) return forYouSection();
    if (S._directSec && S._directSec.key === key) return S._directSec;
    return null;
  }
  function forYouSection() {
    var it = S.cur;
    return sec("D|" + it.id, "For you", relatedPool(it).slice(0, 40), PAGE);
  }
  function relatedPool(it) {
    var cat = it.category || it.genre || "";
    var same = S.all.filter(function (i) { return i.id !== it.id && (i.category === cat || i.genre === cat); });
    if (same.length < 12) {
      same = same.concat(S.all.filter(function (i) { return i.id !== it.id && same.indexOf(i) < 0; }));
    }
    return same;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // Category rows show 5 with an "All" button. "All" opens that section (20 items, stays in it).
  // "See more" adds 20 each time. Mixed sections (All tab, single genre, search) show 20 with See more.
  function sectionHTML(s) {
    var expanded = s.mixed || S.focus === s.key;
    var n = s.list.length;
    var lim = expanded ? Math.min(S.lim[s.key] || PREVIEW, n) : Math.min(PAGE, n);
    var shown = s.list.slice(0, lim);
    var body = expanded
      ? '<div class="vgrid">' + shown.map(vcard).join("") + '</div>'
      : '<div class="vrow">' + shown.map(vcard).join("") + '</div>';
    var head = '<div class="sec-head"><h2>' + esc(s.title) + ' <small>' + n + '</small></h2>' +
      (!expanded && n > PAGE ? '<button class="all-btn" type="button" data-all="' + esc(s.key) + '">All ' + ic("chevR", 14) + '</button>' : '') + '</div>';
    var more = expanded && lim < n ? '<div class="more-row"><button class="see-more" type="button" data-more="' + esc(s.key) + '">See more</button></div>' : "";
    return '<section class="grp">' + head + body + more + '</section>';
  }
  function sectionsHTML(secs) {
    var vis = secs;
    if (S.focus) {
      var i = secs.findIndex(function (s) { return s.key === S.focus; });
      if (i > -1) vis = secs.slice(0, i + 1); // sections above stay, sections below hide
    }
    var reset = S.focus ? '<div class="reset-row"><button class="reset-focus" type="button" data-reset="1">Back to all</button></div>' : "";
    return vis.map(sectionHTML).join("") + reset;
  }
  function refreshKeep(key) {
    if (key.indexOf("D|") === 0) return renderDetail();
    var y = window.scrollY; render(); window.scrollTo(0, y);
  }
  function allFor(key) {
    // Home row "All" → open that category tab (genre rows), not expand in place.
    if (key && key.indexOf("H|") === 0) {
      var cat = key.slice(2);
      if (HOME_ORDER.indexOf(cat) > -1) {
        S.tab = cat;
        S.q = "";
        var si = $("#searchInput");
        if (si) si.value = "";
        S.nav = "home";
        resetViewState();
        setNav("home");
        renderTabs();
        render();
        window.scrollTo(0, 0);
        return;
      }
    }
    var s = findSection(key); if (!s) return;
    S.lim[key] = Math.min(PREVIEW, s.list.length);
    S.focus = key;
    refreshKeep(key);
  }
  function moreFor(key) {
    var s = findSection(key) || (S._directSec && S._directSec.key === key ? S._directSec : null);
    if (!s) return;
    var cur = Math.min(S.lim[key] || PREVIEW, s.list.length);
    S.lim[key] = Math.min(cur + CFG.STEP, s.list.length);
    S.focus = key;
    if (DIRECT_CATS.indexOf(S.tab) > -1 && key.indexOf("C|") === 0) {
      renderTab();
      return;
    }
    refreshKeep(key);
  }

  // ---- cards ----
  function thumbHTML(it, cls) {
    var img = it.thumb ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : "";
    return '<span class="th ' + cls + '" style="background:' + grad(it) + '">' + img + '</span>';
  }
  // Card: image fills the card; the bottom 40% is a blurred glass panel with title and details.
  function vcard(it) {
    var img = it.thumb ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : "";
    return '<button class="vcard" type="button" data-id="' + esc(it.id) + '"><span class="vc-img" style="background:' + grad(it) + '">' + img + '</span>' +
      '<span class="vglass"><span class="vt">' + esc(it.title) + '</span><span class="vd">' + esc([it.year, it.genre].join(" · ")) + '</span></span></button>';
  }
  function histCard(it) {
    var img = it.thumb ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : "";
    return '<button class="hcard" type="button" data-id="' + esc(it.id) + '"><span class="hc-img" style="background:' + grad(it) + '">' + img + '</span><span class="hc-t">' + esc(it.title) + '</span></button>';
  }

  // ---- hero ----
  function heroSlide(it) {
    return '<div class="cslide"><div class="cs-img" data-id="' + esc(it.id) + '" role="button" aria-label="Open">' + thumbHTML(it, "th-r14") + '</div>' +
      '<div class="cs-card"><div class="cs-thumb-w">' + thumbHTML(it, "th-r8") + '</div>' +
      '<button class="cs-text" type="button" data-id="' + esc(it.id) + '"><span class="cs-title">' + esc(it.title) + '</span><span class="cs-meta">' + esc(metaLine(it)) + '</span></button>' +
      '<button class="cs-play" type="button" data-id="' + esc(it.id) + '" aria-label="Play">' + ic("play", 14) + '</button></div></div>';
  }
  function stopHero() { clearInterval(S.timer); }
  function heroStep(tr) {
    if (!tr || !tr.children.length) return 0;
    var gap = 10;
    try {
      var st = window.getComputedStyle(tr);
      gap = parseFloat(st.columnGap || st.gap) || 10;
    } catch (e) {}
    return tr.children[0].offsetWidth + gap;
  }
  function startHero() {
    stopHero();
    S.timer = setInterval(function () {
      var tr = $("#heroTrack"); if (!tr || tr.children.length < 2) return;
      S.hero = (S.hero + 1) % tr.children.length;
      tr.scrollTo({ left: S.hero * heroStep(tr), behavior: "smooth" });
      setDots(S.hero);
    }, 4500);
  }
  function setDots(idx) {
    // Home / category hero only (not player related)
    var home = $("#heroTrack");
    var root = home ? home.parentElement : null;
    var dots = root ? root.querySelectorAll(".dots i") : document.querySelectorAll(".hero > .dots i");
    dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
  }
  function setRelatedDots(idx) {
    document.querySelectorAll("#relatedDots i").forEach(function (d, i) {
      d.classList.toggle("on", i === idx);
    });
  }
  function stopRelated() { clearInterval(S.relatedTimer); S.relatedTimer = null; }
  function startRelated() {
    stopRelated();
    S.relatedIdx = 0;
    // layout may not be ready on first paint
    requestAnimationFrame(function () {
      var tr = $("#relatedTrack");
      if (!tr || tr.children.length < 2) return;
      setRelatedDots(0);
      tr.scrollLeft = 0;
      S.relatedTimer = setInterval(function () {
        var track = $("#relatedTrack");
        if (!track || track.children.length < 2) return;
        var n = track.children.length;
        S.relatedIdx = ((S.relatedIdx || 0) + 1) % n;
        var step = heroStep(track);
        if (!step) return;
        track.scrollTo({ left: S.relatedIdx * step, behavior: "smooth" });
        setRelatedDots(S.relatedIdx);
      }, 4000);
    });
  }

  // ---- views ----
  // Category tile thumbnail follows the carousel: same genre first, otherwise the first carousel thumbnail.
  function catThumb(name) {
    if (name === "All") return "";
    var car = S.carousel.filter(function (i) { return i.thumb; });
    var m = name === "All" ? car[0] : car.find(function (i) { return i.genre === name; });
    if (!m) m = car[0];
    return m ? m.thumb : "";
  }
  function renderHome() {
    var hero = S.carousel.slice(0, CFG.HERO_SLIDES);
    var tiles = S.cats.filter(function (c) { return c.name === "All" || HOME_ORDER.indexOf(c.name) > -1 || S.all.some(function (i) { return i.genre === c.name; }); });
    var cats = tiles.map(function (c, idx) {
      var thumb = c.name === "All" ? "" : (c.thumb || catThumb(c.name));
      var hue = (idx * 47) % 360;
      var inner = thumb ? '<img src="' + esc(thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : "";
      var base = "linear-gradient(135deg,hsl(" + hue + ",55%,34%),hsl(" + ((hue + 40) % 360) + ",50%,12%))";
      var flt = c.name === "All" ? '<i class="flt">' + ic("filter", 14) + '</i>' : "";
      return '<button class="lcat" type="button" data-tab="' + esc(c.name) + '"><span class="lcat-bg" style="background:' + base + '">' + inner + '</span><span class="lcat-t">' + esc(c.name) + '</span>' + flt + '</button>';
    }).join("");
    $("#main").innerHTML =
      '<section class="hero"><div class="hero-track" id="heroTrack">' + hero.map(heroSlide).join("") + '</div>' +
      '<div class="dots">' + hero.map(function (_, i) { return '<i class="' + (i === 0 ? "on" : "") + '"></i>'; }).join("") + '</div></section>' +
      '<div class="sec-head"><h2>Categories</h2></div><div class="lcats">' + cats + '</div>' +
      sectionsHTML(homeSections());
    startHero();
  }
  function catHeroHTML(list) {
    if (!list.length) return "";
    var slides = list.slice(0, 10).map(heroSlide).join("");
    var dots = list.slice(0, 10).map(function (_, i) { return "<i" + (i === 0 ? ' class="on"' : "") + "></i>"; }).join("");
    return '<div class="hero"><div class="hero-track" id="heroTrack">' + slides + '</div><div class="dots">' + dots + '</div></div>';
  }
  function renderTab() {
    var t = S.tab;
    if (DIRECT_CATS.indexOf(t) > -1) {
      var pool = byCategory(S.all, t);
      var heroItems = pool.slice(0, 10);
      var heroIds = {};
      heroItems.forEach(function (i) { heroIds[i.id] = true; });
      var rest = pool.filter(function (i) { return !heroIds[i.id]; });
      var key = "C|" + t;
      var lim = S.focus === key ? (S.lim[key] || PREVIEW) : PREVIEW;
      var shown = rest.slice(0, Math.min(lim, rest.length));
      var more = rest.length > shown.length
        ? '<div class="more-row"><button class="more-btn" type="button" data-more="' + esc(key) + '">See more</button></div>'
        : "";
      // stash list for moreFor via synthetic section
      S._directSec = sec(key, t, rest, PREVIEW, true);
      $("#main").innerHTML = catHeroHTML(heroItems) +
        (shown.length ? '<div class="sec-head"><h2>More <small>' + rest.length + '</small></h2></div><div class="vgrid">' + shown.map(vcard).join("") + '</div>' + more : "");
      S.hero = 0;
      startHero();
      return;
    }
    $("#main").innerHTML = sectionsHTML(tabSections());
  }
  function renderSearch() {
    // Section head already shows "Results" + count — do not add a second title.
    $("#main").innerHTML = sectionsHTML(searchSections());
  }
  function renderDownloads() {
    var fy = shuffle(S.all).slice(0, 8);
    $("#main").innerHTML =
      '<div class="pg-head"><h1>Downloads</h1></div>' +
      '<div class="dl-empty"><div class="dl-ico">' + ic("download", 52) + '</div><p>Your downloads will show up here</p></div>' +
      '<div class="sec-head"><h2>For You</h2></div><div class="vgrid">' + fy.map(vcard).join("") + '</div>' +
      '<button class="wide refresh-btn" id="refresh" type="button">' + ic("refresh", 18) + '<span>Refresh new content</span></button>';
  }
  function renderMe() {
    var row = function (label, icon, value) {
      return '<div class="mrow"><span class="ml">' + ic(icon, 20) + '<span>' + label + '</span></span><span class="mv">' + (value != null ? '<em>' + value + '</em>' : '') + ic("chevR", 16) + '</span></div>';
    };
    $("#main").innerHTML =
      '<div class="mcard"><div class="me-av">G</div><div class="me-info"><b>Log in to your account</b><div class="pd">Demo mode</div></div><button class="login" type="button" id="loginBtn">' + ic("login", 16) + '<span>Log in</span></button></div>' +
      '<div class="mpanel">' + row("My List", "bookmark", 0) + row("My Likes", "heart", 0) + row("Watch History", "clock") +
        '<div class="vrow hist">' + S.all.slice(-10).reverse().map(histCard).join("") + '</div>' + row("Messages", "message") + '</div>' +
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
    scrollActiveTab();
  }
  // Bring the active category tab into view (center when possible; clamp at ends).
  function scrollActiveTab() {
    var bar = $("#tabs");
    if (!bar) return;
    var btn = bar.querySelector("button.active");
    if (!btn) return;
    var left = btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2;
    var max = Math.max(0, bar.scrollWidth - bar.clientWidth);
    if (left < 0) left = 0;
    if (left > max) left = max;
    if (typeof bar.scrollTo === "function") bar.scrollTo({ left: left, behavior: "smooth" });
    else bar.scrollLeft = left;
  }
  function setNav(name) { document.querySelectorAll("[data-nav]").forEach(function (b) { b.classList.toggle("active", b.dataset.nav === name); }); }
  function resetViewState() { S.lim = {}; S.focus = null; }

  // ---- detail ----
  function relatedHTML(it) {
    var pool = relatedPool(it);
    var car = pool.slice(0, 10);
    var carIds = {};
    car.forEach(function (i) { carIds[i.id] = true; });
    var grid = pool.filter(function (i) { return !carIds[i.id]; }).slice(0, 10);
    var hero = compactHeroHTML(car);
    var gridHtml = grid.length
      ? '<div class="sec-head"><h2>More like this</h2></div><div class="vgrid">' + grid.map(vcard).join("") + '</div>'
      : "";
    var head = car.length ? '<div class="sec-head"><h2>Related</h2></div>' : "";
    return head + hero + gridHtml;
  }
  // Related under player: image + title only (~2.5 visible), no play chip / mini-thumb card
  function relatedSlide(it) {
    var img = it.thumb
      ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">'
      : "";
    return '<button type="button" class="rslide" data-id="' + esc(it.id) + '">' +
      '<span class="rs-img" style="background:' + grad(it) + '">' + img + '</span>' +
      '<span class="rs-title">' + esc(it.title) + '</span></button>';
  }
  function compactHeroHTML(list) {
    if (!list.length) return "";
    var slides = list.slice(0, 10).map(relatedSlide).join("");
    var dots = list.slice(0, 10).map(function (_, i) {
      return '<i' + (i === 0 ? ' class="on"' : '') + '></i>';
    }).join("");
    return '<div class="related-car">' +
      '<div class="related-track" id="relatedTrack">' + slides + '</div>' +
      '<div class="related-dots" id="relatedDots">' + dots + '</div></div>';
  }
  function openDetail(id) {
    var it = S.byId[id]; if (!it) return;
    countView(id);
    S.cur = it; S.season = 0; S.qIdx = 0; S.ep = 0; S.showAll = false;
    renderDetail();
  }
  function renderDetail() {
    var it = S.cur, seasons = it.seasons || [], vers = it.versions || [];
    var hasEps = seasons.length > 0;
    var eps = hasEps ? seasons[S.season].episodes : [];
    var dd = "";
    if (vers.length > 1) dd += '<button class="dd" type="button" data-dd="q"><span>' + esc(vers[S.qIdx].quality) + (vers[S.qIdx].size ? ' · ' + esc(vers[S.qIdx].size) : '') + '</span>' + ic("chev", 18) + '</button>';
    if (seasons.length > 1) dd += '<button class="dd" type="button" data-dd="s"><span>' + esc(seasons[S.season].name || ('Season ' + String(S.season + 1).padStart(2, '0'))) + '</span>' + ic("chev", 18) + '</button>';
    var resources = dd ? '<div class="res-head"><h3>Resources</h3></div><div class="res-row">' + dd + '</div>' : "";
    var epHtml = "";
    if (hasEps) {
      epHtml = '<div class="eps"><button class="ep' + (S.showAll ? " on" : "") + '" type="button" data-all-ep="1">All</button>' +
        eps.map(function (e, i) { return '<button class="ep' + (!S.showAll && i === S.ep ? " on" : "") + '" type="button" data-ep="' + i + '">' + String(e.no).padStart(2, "0") + '</button>'; }).join("") + '</div>';
      if (S.showAll) epHtml += '<div class="ep-list">' + eps.map(function (e, i) { return '<button class="ep-row" type="button" data-ep="' + i + '"><span>' + String(e.no).padStart(2, "0") + '</span>Episode ' + e.no + '</button>'; }).join("") + '</div>';
    }
    var p = $("#player");
    p.innerHTML =
      '<div class="vp" id="vp">' +
        '<video id="vid" class="vp-video" playsinline webkit-playsinline preload="metadata" controlslist="nodownload nofullscreen noremoteplayback nodownload" disablepictureinpicture x-webkit-airplay="deny"></video>' +
        '<div class="vp-poster" id="vpPoster">' +
          (it.thumb ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer">' : '') +
          '<div class="vp-dim"></div><div class="vp-spin" aria-hidden="true"></div>' +
          '<div class="vp-load-msg" id="vpLoadMsg">Loading stream…</div>' +
        '</div>' +
        '<div class="vp-gest" id="vpGest"></div>' +
        '<div class="vp-rip l" id="ripL"><div><b>−10s</b></div></div>' +
        '<div class="vp-rip r" id="ripR"><div><b>+10s</b></div></div>' +
        '<div class="vp-badge" id="vpBadge"><b>2×</b> ' + ic("play", 12) + '</div>' +
        '<div class="vp-top">' +
          '<button class="vp-ib" id="back" type="button" aria-label="Back">' + ic("back", 22) + '</button>' +
          '<span class="vp-sp"></span>' +
          '<button class="vp-ib vp-lock-btn" id="vpLock" type="button" aria-label="Lock">' + ic("unlock", 20) + '</button>' +
        '</div>' +
        '<button class="vp-ib vp-lock-float hidden" id="vpLockFloat" type="button" aria-label="Unlock">' + ic("lock", 22) + '</button>' +
        '<div class="vp-hud vp-hud-seek hidden" id="vpHudSeek"><span id="vpHudSeekTxt">0:00</span></div>' +
        '<div class="vp-hud vp-hud-vol hidden" id="vpHudVol">' +
          '<div class="vp-vol-ico">' + ic("vol", 22) + '</div>' +
          '<div class="vp-vol-rail"><i id="vpVolFill"></i></div>' +
        '</div>' +
        '<div class="vp-bottom">' +
          '<input class="vp-seek" id="seek" type="range" min="0" max="1000" value="0" aria-label="Seek">' +
          '<div class="vp-row">' +
            '<button class="vp-ib" id="vpPlay" type="button" aria-label="Play">' + ic("play", 22) + '</button>' +
            '<span class="vp-time" id="vpTime">0:00 / 0:00</span>' +
            '<span class="vp-sp"></span>' +
            '<button class="vp-ib" id="vpMute" type="button" aria-label="Mute">' + ic("vol", 20) + '</button>' +
            '<button class="vp-ib" id="vpSpeed" type="button" aria-label="Speed"><span class="vp-speed-lab" id="vpSpeedLab">1x</span></button>' +
            '<button class="vp-ib" id="vpFit" type="button" aria-label="Fit">' + ic("fit", 20) + '</button>' +
            '<button class="vp-ib" id="vpFull" type="button" aria-label="Fullscreen">' + ic("full", 20) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="vp-speed-menu hidden" id="vpSpeedMenu"></div>' +
      '</div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
        '<div class="d-btns"><button class="pill" id="addList" type="button">' + ic("plus", 16) + '<span>Add to list</span></button><button class="pill" id="share" type="button">' + ic("share", 16) + '<span>Share</span></button></div>' +
        resources + epHtml +
        relatedHTML(it) +
      '</div>';
    p.classList.remove("hidden");
    document.body.classList.add("in-player");
    attachPlayer();
    startRelated();
  }
  function closeDetail() {
    stopRelated();
    var v = $("#vid");
    if (v) {
      try { if (v._hls) { v._hls.destroy(); v._hls = null; } } catch (e) {}
      v.pause(); v.removeAttribute("src"); v.load();
    }
    var p = $("#player");
    p.classList.add("hidden"); p.innerHTML = "";
    document.body.classList.remove("in-player");
  }
  function playEp(i) { S.ep = i; S.showAll = false; renderDetail(); }

  // ---- custom player: double tap ±10s, hold for 2x, fit, PiP, volume, fullscreen ----
  function isDirectMedia(url) {
    if (!url) return false;
    var u = url.toLowerCase();
    return /\.(mp4|webm|mkv|m3u8)(\?|$)/.test(u) || u.indexOf("m3u8") > -1;
  }
  function isTeraboxShare(url) {
    if (!url) return false;
    return /terabox\.com|1024terabox\.com|teraboxapp\.com|nebula-url/i.test(url);
  }
  function extractPlayUrls(file) {
    var playUrl = null, usingFast = false;
    if (file && file.fast_stream_url && typeof file.fast_stream_url === "object") {
      var keys = Object.keys(file.fast_stream_url);
      if (keys.length) {
        keys.sort(function (a, b) { return (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0); });
        playUrl = file.fast_stream_url[keys[0]];
        usingFast = !!playUrl;
      }
    }
    var fallback = (file && (file.stream_url || file.streamUrl)) || null;
    if (!playUrl) { playUrl = fallback; fallback = null; usingFast = false; }
    else if (fallback === playUrl) fallback = null;
    return { playUrl: playUrl, fallbackUrl: fallback, usingFast: usingFast };
  }
  function resolveStream(raw) {
    raw = (raw || "").trim();
    if (!raw) return Promise.reject(new Error("No stream link"));
    if (isDirectMedia(raw) && !isTeraboxShare(raw)) {
      return Promise.resolve({ playUrl: raw, fallbackUrl: null, usingFast: false });
    }
    if (!CFG.TERABOX_API) return Promise.reject(new Error("Terabox API not configured"));
    var headers = { "Content-Type": "application/json" };
    if (CFG.PRACTICE_KEY) headers["X-Practice-Key"] = CFG.PRACTICE_KEY;
    return fetch(CFG.TERABOX_API, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ url: raw })
    }).then(function (r) {
      if (!r.ok) throw new Error("API error " + r.status);
      return r.json();
    }).then(function (data) {
      if (!(data && data.status === "success" && data.list && data.list.length)) {
        throw new Error((data && data.message) || "Could not resolve Terabox link");
      }
      var ex = extractPlayUrls(data.list[0]);
      if (!ex.playUrl) throw new Error("No playable URL in API response");
      return ex;
    });
  }
  function attachMedia(v, url, hlsRef) {
    if (hlsRef.hls) { try { hlsRef.hls.destroy(); } catch (e) {} hlsRef.hls = null; }
    var isHls = url && (url.toLowerCase().indexOf(".m3u8") > -1 || url.toLowerCase().indexOf("m3u8") > -1);
    if (isHls && window.Hls && Hls.isSupported()) {
      var hls = new Hls({ enableWorker: true, maxBufferLength: 60 });
      hlsRef.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(v);
      hls.on(Hls.Events.ERROR, function (_, data) {
        if (data && data.fatal) v.dispatchEvent(new Event("error"));
      });
    } else {
      v.src = url;
      v.load();
    }
  }
  function attachPlayer() {
    var vp = $("#vp"), v = $("#vid"), g = $("#vpGest"), seek = $("#seek"), tm = $("#vpTime"), pb = $("#vpPlay"), mu = $("#vpMute");
    try {
      v.controls = false;
      v.removeAttribute("controls");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");
      v.setAttribute("disablepictureinpicture", "");
      if ("disablePictureInPicture" in v) v.disablePictureInPicture = true;
      if ("disableRemotePlayback" in v) v.disableRemotePlayback = true;
    } catch (e) {}
    var poster = $("#vpPoster"), loadMsg = $("#vpLoadMsg");
    var idleT = null, pressT = null, speedOn = false, moved = false, sx = 0, sy = 0, lastTap = 0, lastSide = "", tapT = null;
    var hlsRef = { hls: null };
    var triedFallback = false;
    var resolved = null;

    function showPoster(msg) {
      if (poster) poster.classList.remove("hide");
      if (loadMsg) loadMsg.textContent = msg || "Loading stream…";
    }
    function hidePoster() {
      if (poster) poster.classList.add("hide");
    }
    function failPlay(msg) {
      showPoster(msg || "Playback failed");
      if (loadMsg) loadMsg.textContent = msg || "Playback failed";
      toast(msg || "Could not play this video");
    }

    showPoster("Resolving stream…");
    var raw = streamOf(S.cur);
    resolveStream(raw).then(function (ex) {
      resolved = ex;
      showPoster(ex.usingFast ? "Starting fast stream…" : "Starting stream…");
      attachMedia(v, ex.playUrl, hlsRef);
      v.play().catch(function () { v.muted = true; return v.play(); }).catch(function () {});
    }).catch(function (err) {
      // last resort demo only if no real link path worked
      var demo = CFG.DEMO_VIDEO;
      if (demo) {
        showPoster("Using demo fallback…");
        attachMedia(v, demo, hlsRef);
        v.play().catch(function () {});
        toast((err && err.message) || "Stream resolve failed – demo fallback");
      } else {
        failPlay((err && err.message) || "Stream resolve failed");
      }
    });

    v.addEventListener("error", function () {
      if (resolved && resolved.fallbackUrl && !triedFallback) {
        triedFallback = true;
        showPoster("Retrying standard stream…");
        attachMedia(v, resolved.fallbackUrl, hlsRef);
        v.play().catch(function () {});
        return;
      }
      failPlay("Stream could not be played");
    });
    v.addEventListener("playing", function () { hidePoster(); });
    v.addEventListener("canplay", function () { /* keep poster until playing for smoother handoff */ });
    v.addEventListener("waiting", function () {
      if (poster && poster.classList.contains("hide") && loadMsg) {
        /* brief buffer indicator could go here */
      }
    });
    function fmt(s) {
      s = isFinite(s) ? Math.max(0, Math.floor(s)) : 0;
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
      return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(x).padStart(2, "0");
    }
    function sync() { var d = v.duration || 0, c = v.currentTime || 0; tm.textContent = fmt(c) + " / " + fmt(d); seek.value = d ? Math.round(c / d * 1000) : 0; }
    function closeSpeedMenu() {
      if (speedMenu) speedMenu.classList.add("hidden");
    }
    function showCtrl() {
      if (locked) return;
      vp.classList.remove("idle");
      if (lockFloat) lockFloat.classList.add("hidden");
      clearTimeout(idleT);
      if (!v.paused) idleT = setTimeout(function () { vp.classList.add("idle"); closeSpeedMenu(); }, 2800);
    }
    function hideCtrl() {
      if (locked) return;
      vp.classList.add("idle");
      closeSpeedMenu();
      clearTimeout(idleT);
    }
    function toggleCtrl() {
      if (locked) return;
      if (vp.classList.contains("idle")) showCtrl();
      else hideCtrl();
    }
    function flash(side) { var el = $(side === "l" ? "#ripL" : "#ripR"); el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("on"); }, 500); }
    function skip(sec, side) { var max = v.duration || Infinity; v.currentTime = Math.min(Math.max(0, (v.currentTime || 0) + sec), max); flash(side); showCtrl(); }
    function badge(on) { $("#vpBadge").classList.toggle("on", on); }
    v.addEventListener("timeupdate", sync);
    v.addEventListener("loadedmetadata", sync);
    v.addEventListener("play", function () { pb.innerHTML = ic("pause", 22); showCtrl(); });
    v.addEventListener("pause", function () { pb.innerHTML = ic("play", 22); vp.classList.remove("idle"); clearTimeout(idleT); });
    pb.onclick = function () { if (v.paused) v.play().catch(function () {}); else v.pause(); };
    seek.oninput = function () { if (v.duration) v.currentTime = seek.value / 1000 * v.duration; };
    mu.onclick = function () {
      if (v.muted || v.volume === 0) {
        v.muted = false;
        if (v.volume === 0) v.volume = 1;
      } else {
        v.muted = true;
      }
      mu.innerHTML = ic(v.muted || v.volume === 0 ? "mute" : "vol", 20);
    };
    var fitBtn = $("#vpFit");
    if (fitBtn) fitBtn.onclick = function (e) {
      e.stopPropagation();
      vp.classList.toggle("cover");
      // visual feedback: swap icon weight via class
      fitBtn.classList.toggle("on", vp.classList.contains("cover"));
      showCtrl();
    };
    function isFs() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function syncFullIcon() {
      var btn = $("#vpFull");
      if (btn) btn.innerHTML = ic(isFs() ? "exitFull" : "full", 20);
    }
    function toggleFs() {
      if (isFs()) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
        if (ex) try { ex.call(document); } catch (e) {}
      } else {
        // Always fullscreen the custom container — never video.webkitEnterFullscreen (native chrome).
        var req = vp.requestFullscreen || vp.webkitRequestFullscreen || vp.mozRequestFullScreen;
        if (req) {
          try {
            var p = req.call(vp);
            if (p && p.catch) p.catch(function () { toast("Fullscreen not available"); });
          } catch (e) { toast("Fullscreen not available"); }
        } else {
          toast("Fullscreen not available on this browser");
        }
      }
      setTimeout(syncFullIcon, 150);
    }
    $("#vpFull").onclick = function (e) { e.stopPropagation(); toggleFs(); };
    function killNativeChrome() {
      try {
        v.controls = false;
        v.removeAttribute("controls");
        if ("disablePictureInPicture" in v) v.disablePictureInPicture = true;
      } catch (e) {}
    }
    document.addEventListener("fullscreenchange", function () { syncFullIcon(); killNativeChrome(); });
    document.addEventListener("webkitfullscreenchange", function () { syncFullIcon(); killNativeChrome(); });

    // Speed menu (our UI only)
    var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
    var speedBtn = $("#vpSpeed"), speedMenu = $("#vpSpeedMenu"), speedLab = $("#vpSpeedLab");
    function setSpeed(r) {
      v.playbackRate = r;
      if (speedLab) speedLab.textContent = (r === 1 ? "1x" : r + "x");
      if (speedMenu) {
        speedMenu.querySelectorAll("[data-sp]").forEach(function (b) {
          b.classList.toggle("on", parseFloat(b.getAttribute("data-sp")) === r);
        });
        speedMenu.classList.add("hidden");
      }
      showCtrl();
    }
    if (speedMenu) {
      speedMenu.innerHTML = SPEEDS.map(function (r) {
        var lab = (r === 1 ? "1.0" : String(r));
        return '<button type="button" data-sp="' + r + '"' + (r === 1 ? ' class="on"' : '') + '>' + lab + '</button>';
      }).join("");
      speedMenu.addEventListener("click", function (e) {
        var b = e.target.closest("[data-sp]");
        if (!b) return;
        e.stopPropagation();
        setSpeed(parseFloat(b.getAttribute("data-sp")));
      });
    }
    if (speedBtn) speedBtn.onclick = function (e) {
      e.stopPropagation();
      if (!speedMenu) return;
      speedMenu.classList.toggle("hidden");
      showCtrl();
    };

    var locked = false;
    var lockBtn = $("#vpLock");
    var lockFloat = $("#vpLockFloat");
    function setLocked(on) {
      locked = on;
      vp.classList.toggle("locked", on);
      if (lockBtn) {
        lockBtn.innerHTML = ic(on ? "lock" : "unlock", 20);
        lockBtn.setAttribute("aria-label", on ? "Unlock" : "Lock");
      }
      if (lockFloat) {
        lockFloat.innerHTML = ic("lock", 22);
        lockFloat.classList.toggle("hidden", true);
      }
      if (on) {
        // show lock icon briefly then hide with other chrome
        vp.classList.remove("idle");
        clearTimeout(idleT);
        idleT = setTimeout(function () {
          vp.classList.add("idle");
          if (lockFloat) lockFloat.classList.add("hidden");
        }, 2000);
      } else {
        if (lockFloat) lockFloat.classList.add("hidden");
        showCtrl();
      }
    }
    if (lockBtn) lockBtn.onclick = function (e) {
      e.stopPropagation();
      if (locked) setLocked(false);
      else setLocked(true);
    };
    if (lockFloat) lockFloat.onclick = function (e) {
      e.stopPropagation();
      setLocked(false);
    };

    var mode = null; // "seek" | "vol" | null
    var startT = 0, startVol = 1, hudT = null;
    var hudSeek = $("#vpHudSeek"), hudSeekTxt = $("#vpHudSeekTxt");
    var hudVol = $("#vpHudVol"), volFill = $("#vpVolFill");

    function showHudSeek(sec) {
      if (!hudSeek) return;
      hudSeek.classList.remove("hidden");
      if (hudVol) hudVol.classList.add("hidden");
      var sign = sec >= 0 ? "+" : "−";
      hudSeekTxt.textContent = sign + Math.abs(Math.round(sec)) + "s";
      clearTimeout(hudT);
      hudT = setTimeout(function () { hudSeek.classList.add("hidden"); }, 600);
    }
    function showHudVol(val) {
      if (!hudVol) return;
      hudVol.classList.remove("hidden");
      if (hudSeek) hudSeek.classList.add("hidden");
      if (volFill) volFill.style.height = Math.round(val * 100) + "%";
      clearTimeout(hudT);
      hudT = setTimeout(function () { hudVol.classList.add("hidden"); }, 700);
    }

    g.addEventListener("pointerdown", function (e) {
      if (locked) return;
      moved = false; mode = null;
      sx = e.clientX; sy = e.clientY;
      startT = v.currentTime || 0;
      startVol = v.muted ? 0 : (v.volume || 0);
      speedOn = false;
      clearTimeout(pressT);
      try { g.setPointerCapture(e.pointerId); } catch (err) {}
      pressT = setTimeout(function () {
        if (!moved && !mode) { speedOn = true; v.playbackRate = 2; badge(true); }
      }, 380);
    });
    g.addEventListener("pointermove", function (e) {
      if (locked) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var adx = Math.abs(dx), ady = Math.abs(dy);
      if (!mode && (adx > 10 || ady > 10)) {
        moved = true;
        clearTimeout(pressT);
        if (speedOn) { speedOn = false; v.playbackRate = 1; badge(false); }
        // vertical on right 45% → volume; else horizontal → seek
        var rect = g.getBoundingClientRect();
        var onRight = (sx - rect.left) > rect.width * 0.55;
        if (ady > adx && onRight) mode = "vol";
        else if (adx > ady) mode = "seek";
        else if (ady > adx) mode = "vol"; // left side vertical still volume for MX-like feel on whole player surface when dominant vertical
      }
      if (mode === "seek") {
        var dur = v.duration || 0;
        if (!dur) return;
        var rect = g.getBoundingClientRect();
        var delta = (dx / rect.width) * Math.min(120, dur * 0.35);
        var nt = Math.min(Math.max(0, startT + delta), dur);
        v.currentTime = nt;
        showHudSeek(nt - startT);
        showCtrl();
      } else if (mode === "vol") {
        var rect = g.getBoundingClientRect();
        var deltaV = -(dy / rect.height);
        var nv = Math.min(1, Math.max(0, startVol + deltaV));
        v.volume = nv;
        v.muted = nv === 0;
        if (mu) mu.innerHTML = ic(v.muted ? "mute" : "vol", 20);
        showHudVol(nv);
        showCtrl();
      }
    });
    g.addEventListener("pointerup", function (e) {
      clearTimeout(pressT);
      if (locked) {
        // tap while locked → show lock icon only (same idle rules)
        if (lockFloat) {
          lockFloat.classList.remove("hidden");
          clearTimeout(lockFloat._t);
          lockFloat._t = setTimeout(function () {
            if (locked) lockFloat.classList.add("hidden");
          }, 2000);
        }
        return;
      }
      if (speedOn) { speedOn = false; v.playbackRate = 1; badge(false); mode = null; return; }
      if (mode) { mode = null; return; }
      if (moved) return;
      var r = g.getBoundingClientRect(), side = (e.clientX - r.left) < r.width / 2 ? "l" : "r", now = Date.now();
      if (now - lastTap < 300 && side === lastSide) { clearTimeout(tapT); lastTap = 0; skip(side === "l" ? -10 : 10, side); }
      else { lastTap = now; lastSide = side; clearTimeout(tapT); tapT = setTimeout(function () {
        // MX-style: tap toggles chrome; also close speed menu if open
        if (speedMenu && !speedMenu.classList.contains("hidden")) {
          closeSpeedMenu();
          showCtrl();
        } else {
          toggleCtrl();
        }
      }, 260); }
    });
    g.addEventListener("pointercancel", function () {
      clearTimeout(pressT);
      mode = null;
      if (speedOn) { speedOn = false; v.playbackRate = 1; badge(false); }
    });
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
    else openSheet("Season", it.seasons.map(function (s, i) { return s.name || ("Season " + String(i + 1).padStart(2, "0")); }), S.season, function (i) { S.season = i; S.ep = 0; S.showAll = false; renderDetail(); });
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
    if (e.target.closest("#refresh")) { if (S.nav === "downloads") { renderDownloads(); toast("Refreshed"); } else toast("Nothing new"); return; }
    if (e.target.closest("#loginBtn")) return toast("Login is not available in demo mode");
    if ((t = e.target.closest("[data-all]"))) return allFor(t.dataset.all);
    if ((t = e.target.closest("[data-more]"))) return moreFor(t.dataset.more);
    if (e.target.closest("[data-reset]")) { S.focus = null; return render(); }
    if ((t = e.target.closest("[data-id]"))) return openDetail(t.dataset.id);
    if ((t = e.target.closest("[data-tab]"))) {
      S.tab = t.dataset.tab; S.q = ""; $("#searchInput").value = ""; S.nav = "home";
      resetViewState(); setNav("home"); renderTabs(); render(); window.scrollTo(0, 0); return;
    }
    if ((t = e.target.closest("[data-nav]"))) {
      S.nav = t.dataset.nav;
      if (S.nav === "home") { S.tab = "Home"; S.q = ""; $("#searchInput").value = ""; renderTabs(); }
      resetViewState(); setNav(S.nav); render(); window.scrollTo(0, 0);
    }
  });
  // Hero dots only. Sections never expand on scroll; only See more does that.
  document.addEventListener("scroll", function (e) {
    if (e.target && e.target.id === "heroTrack") {
      var step = heroStep(e.target) || 1;
      var idx = Math.round(e.target.scrollLeft / step);
      if (idx < 0) idx = 0;
      if (idx > e.target.children.length - 1) idx = e.target.children.length - 1;
      S.hero = idx; setDots(idx);
    }
    if (e.target && e.target.id === "relatedTrack") {
      var stepR = heroStep(e.target) || 1;
      var idxR = Math.round(e.target.scrollLeft / stepR);
      if (idxR < 0) idxR = 0;
      if (idxR > e.target.children.length - 1) idxR = e.target.children.length - 1;
      S.relatedIdx = idxR; setRelatedDots(idxR);
    }
  }, true);
  function setSearch() { S.nav = "home"; resetViewState(); setNav("home"); hideSuggest(); render(); }
  function matchQuery(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return [];
    return S.all.filter(function (i) {
      return (i.title || "").toLowerCase().indexOf(q) > -1 ||
        (i.genre || "").toLowerCase().indexOf(q) > -1 ||
        (i.category || "").toLowerCase().indexOf(q) > -1;
    });
  }
  function hideSuggest() {
    var box = $("#searchSuggest");
    if (box) box.remove();
  }
  function showSuggest(list) {
    hideSuggest();
    var form = $("#searchForm");
    if (!form || !list.length) return;
    var box = document.createElement("div");
    box.id = "searchSuggest";
    box.className = "search-suggest";
    var rows = list.slice(0, 5).map(function (it) {
      return '<button type="button" class="sg-row" data-id="' + esc(it.id) + '">' +
        '<span class="sg-th" style="background:' + grad(it) + '">' +
          (it.thumb ? '<img src="' + esc(it.thumb) + '" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : "") +
        '</span>' +
        '<span class="sg-meta"><span class="sg-title">' + esc(it.title) + '</span>' +
        '<span class="sg-sub">' + esc([it.year, it.category || it.genre].filter(Boolean).join(" · ")) + '</span></span>' +
        '<span class="sg-go">' + ic("chevR", 16) + '</span></button>';
    }).join("");
    box.innerHTML = '<div class="sg-head"><span>Suggestions</span><span class="sg-count">' + Math.min(5, list.length) + '</span></div>' + rows;
    form.appendChild(box);
  }
  $("#searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    S.q = $("#searchInput").value;
    hideSuggest();
    setSearch();
  });
  $("#searchInput").addEventListener("input", function (e) {
    var val = e.target.value;
    S.q = ""; // typing only drives suggest, not full results page
    if (!val.trim()) { hideSuggest(); if (S.nav === "home") render(); return; }
    showSuggest(matchQuery(val));
  });
  $("#searchInput").addEventListener("focus", function () {
    var val = $("#searchInput").value;
    if (val.trim()) showSuggest(matchQuery(val));
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#searchForm")) hideSuggest();
  }, true);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if ($("#sheet").classList.contains("open")) closeSheet(); else closeDetail();
  });

  // static icons
  document.querySelectorAll("[data-ico]").forEach(function (el) { el.innerHTML = ic(el.dataset.ico, el.classList.contains("bn-ico") ? 22 : 18); });
  S.views = loadViews();
  renderTabs();
  Promise.all([FILES.categories, FILES.carousel, FILES.video, FILES.series].map(function (u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
  })).then(function (res) {
    var tag = function (arr, src) { return (arr.items || []).map(function (i) { i._src = src; return i; }); };
    S.cats = res[0].items || [];
    S.all = tag(res[2], "movies").concat(tag(res[3], "series"));
    S.all.forEach(function (i) { S.byId[i.id] = i; });
    S.carousel = (res[1].items || []).map(function (id) { return S.byId[id]; }).filter(Boolean);
    render();
  }).catch(function () { $("#main").innerHTML = '<div class="empty">Could not load content.</div>'; });
})();
