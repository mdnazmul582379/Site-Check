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
  var TABS = ["Home", "Trending", "Movie", "Series", "Midnight", "Anime", "Kids", "Desi Porn", "Foreign Porn", "JAV", "Indo"];
  var HOME_ORDER = ["Trending", "Movie", "Series", "Midnight", "Anime", "Kids", "Desi Porn", "Foreign Porn", "JAV", "Indo"];
  // Categories that skip genre rows: carousel (10) + direct grid.
  var DIRECT_CATS = ["Midnight", "Desi Porn", "Foreign Porn", "JAV", "Indo"];
  // Tabs that show a compact 18+ badge (no "18+" text in the name).
  var ADULT_TABS = { "Midnight": 1, "Desi Porn": 1, "Foreign Porn": 1, "JAV": 1, "Indo": 1 };
  // Map display tab → data category (legacy names in JSON).
  var CAT_DATA = { "JAV": "18+ JAV" };
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
    play: '<path d="M8 5.2v13.6a1 1 0 0 0 1.54.84l10.4-6.8a1 1 0 0 0 0-1.68L9.54 4.36A1 1 0 0 0 8 5.2z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    vol: '<path d="M4 9v6h3.5L12 19V5L7.5 9H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a3.5 3.5 0 0 1 0 6"/><path d="M18 6.5a6.5 6.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9v6h3.5L12 19V5L7.5 9H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    pip: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="6" height="5" rx="1" fill="currentColor" stroke="none"/>',
    full: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9"/><path d="M20 9V5.5A1.5 1.5 0 0 0 18.5 4H15"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9"/><path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15"/>',
    exitFull: '<path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4"/><path d="M15 4v3.5A1.5 1.5 0 0 0 16.5 9H20"/><path d="M9 20v-3.5A1.5 1.5 0 0 0 7.5 15H4"/><path d="M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20"/>',
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
    adult: '<circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor" stroke="none" font-family="Inter,system-ui,sans-serif">18</text>',
    speed: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    rotate: '<path d="M7 20.5H4.5A1.5 1.5 0 0 1 3 19v-2.5"/><path d="M3 16.5 6.5 20.5"/><path d="M17 3.5h2.5A1.5 1.5 0 0 1 21 5v2.5"/><path d="M21 7.5 17.5 3.5"/><rect x="7.5" y="7" width="9" height="10" rx="1.5"/>'
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
  function toast(msg) {
      var t = $("#toast");
      if (!t) return;
      t.classList.remove("toast-ok", "show");
      t.innerHTML = '<span class="toast-msg">' + esc(msg) + '</span>';
      // reflow for animation restart
      void t.offsetWidth;
      t.classList.add("show");
      clearTimeout(t._h);
      t._h = setTimeout(function () { t.classList.remove("show"); }, 2000);
    }
    function toastOk(msg) {
      var t = $("#toast");
      if (!t) return;
      t.classList.remove("show");
      t.classList.add("toast-ok");
      t.innerHTML =
        '<span class="toast-check" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
        '</span>' +
        '<span class="toast-msg">' + esc(msg || "Link copied") + '</span>';
      void t.offsetWidth;
      t.classList.add("show");
      clearTimeout(t._h);
      t._h = setTimeout(function () {
        t.classList.remove("show");
        setTimeout(function () { t.classList.remove("toast-ok"); }, 280);
      }, 2200);
    }

  // ---- views (click counts, stored on this device) ----
  function loadViews() { try { return JSON.parse(localStorage.getItem("tfp_views") || "{}"); } catch (e) { return {}; } }
  function countView(id) {
    S.views[id] = (S.views[id] || 0) + 1;
    try { localStorage.setItem("tfp_views", JSON.stringify(S.views)); } catch (e) {}
  }
  function loadIdArr(key) {
    try {
      var a = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function saveIdArr(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }
  function inList(id) { return loadIdArr("tfp_list").indexOf(id) > -1; }
  function inLikes(id) { return loadIdArr("tfp_likes").indexOf(id) > -1; }
  function toggleList(id) {
    var a = loadIdArr("tfp_list");
    var i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else a.unshift(id);
    saveIdArr("tfp_list", a);
    return i === -1;
  }
  function toggleLike(id) {
    var a = loadIdArr("tfp_likes");
    var i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else a.unshift(id);
    saveIdArr("tfp_likes", a);
    return i === -1;
  }
  function itemsFromIds(ids) {
    return ids.map(function (id) { return S.byId[id]; }).filter(Boolean);
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
  function dataCat(name) { return CAT_DATA[name] || name; }
  function byCategory(list, c) {
    c = dataCat(c);
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
        pushHist(false);
        return;
      }
    }
    var s = findSection(key); if (!s) return;
    S.lim[key] = Math.min(PREVIEW, s.list.length);
    S.focus = key;
    refreshKeep(key);
    pushHist(false);
  }
  function moreFor(key) {
    var s = findSection(key) || (S._directSec && S._directSec.key === key ? S._directSec : null);
    if (!s) return;
    var cur = Math.min(S.lim[key] || PREVIEW, s.list.length);
    S.lim[key] = Math.min(cur + CFG.STEP, s.list.length);
    S.focus = key;
    if (DIRECT_CATS.indexOf(S.tab) > -1 && key.indexOf("C|") === 0) {
      renderTab();
      pushHist(false);
      return;
    }
    refreshKeep(key);
    pushHist(false);
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
    var listN = loadIdArr("tfp_list").length;
    var likeN = loadIdArr("tfp_likes").length;
    var row = function (label, icon, value, action) {
      var act = action ? ' data-me="' + action + '"' : "";
      return '<button type="button" class="mrow"' + act + '><span class="ml">' + ic(icon, 20) + '<span>' + label + '</span></span><span class="mv">' + (value != null ? '<em>' + value + '</em>' : '') + ic("chevR", 16) + '</span></button>';
    };
    $("#main").innerHTML =
      '<div class="me"><div class="me-card"><div class="av">G</div><div><b>Log in to your account</b><span>Demo mode</span></div><button class="login" id="loginBtn" type="button">' + ic("login", 16) + ' Log in</button></div>' +
      '<div class="mpanel">' + row("My List", "bookmark", listN, "list") + row("My Likes", "heart", likeN, "likes") + row("Watch History", "clock") +
        '<div class="vrow hist">' + S.all.slice(0, 10).map(histCard).join("") + '</div>' + row("Messages", "message") + '</div>' +
      '<div class="mpanel">' + row("Community", "users", 0) + row("Posts", "plus", 0) + row("My Comments", "message", 0) + '</div>' +
      '<div class="mpanel">' + row("Settings", "settings") + '</div></div>';
  }
  function renderSaved(kind) {
    var ids = loadIdArr(kind === "likes" ? "tfp_likes" : "tfp_list");
    var items = itemsFromIds(ids);
    var title = kind === "likes" ? "My Likes" : "My List";
    var empty = kind === "likes" ? "No liked videos yet" : "Your list is empty";
    $("#main").innerHTML =
      '<div class="pg-head saved-head"><button type="button" class="back-inline" data-me-back="1" aria-label="Back">' + ic("back", 20) + '</button><h1>' + esc(title) + '</h1><span class="saved-n">' + items.length + '</span></div>' +
      (items.length
        ? '<div class="vgrid saved-grid">' + items.map(vcard).join("") + '</div>'
        : '<div class="empty">' + esc(empty) + '</div>');
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
      var badge = ADULT_TABS[t] ? '<span class="tab-18" aria-label="18 plus">18</span>' : "";
      return '<button type="button" data-tab="' + esc(t) + '" class="' + (t === S.tab ? "active" : "") + (ADULT_TABS[t] ? " tab-adult" : "") + '">' + badge + '<span class="tab-lab">' + esc(t) + '</span></button>';
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

  // ---- app history (phone back = previous in-app step) ----
  var HIST_SKIP = false;
  function snapshot() {
    return {
      nav: S.nav,
      tab: S.tab,
      q: S.q || "",
      focus: S.focus,
      lim: Object.assign({}, S.lim),
      detail: !!(S.cur && document.body.classList.contains("in-player")),
      id: S.cur ? S.cur.id : null,
      season: S.season || 0,
      ep: S.ep || 0
    };
  }
  function routeUrl(st) {
    try {
      var u = new URL(location.href);
      u.search = "";
      if (st.detail && st.id) {
        u.searchParams.set("v", st.id);
        if (st.season) u.searchParams.set("s", String(st.season));
        if (st.ep) u.searchParams.set("e", String(st.ep));
      } else if (st.nav && st.nav !== "home") {
        u.searchParams.set("nav", st.nav);
      } else if (st.tab && st.tab !== "Home") {
        u.searchParams.set("tab", st.tab);
      }
      if (st.focus) u.searchParams.set("focus", st.focus);
      return u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : "");
    } catch (e) {
      return location.pathname;
    }
  }
  function pushHist(replace) {
    if (HIST_SKIP) return;
    var st = snapshot();
    var url = routeUrl(st);
    try {
      if (replace) history.replaceState(st, "", url);
      else history.pushState(st, "", url);
    } catch (e) {}
  }
  function applySnapshot(st) {
    if (!st) return;
    HIST_SKIP = true;
    try {
      S.nav = st.nav || "home";
      S.tab = st.tab || "Home";
      S.q = st.q || "";
      S.focus = st.focus || null;
      S.lim = st.lim || {};
      if ($("#searchInput")) $("#searchInput").value = S.q;
      setNav(S.nav);
      renderTabs();
      if (st.detail && st.id && S.byId[st.id]) {
        S.cur = S.byId[st.id];
        S.season = st.season || 0;
        S.ep = st.ep || 0;
        S.qIdx = 0;
        S.showAll = false;
        renderDetail();
      } else {
        if (document.body.classList.contains("in-player")) {
          // soft close without pushing history
          stopRelated();
          var v = $("#vid");
          if (v) {
            try { if (v._hls) { v._hls.destroy(); v._hls = null; } } catch (e) {}
            v.pause(); v.removeAttribute("src"); v.load();
          }
          var p = $("#player");
          if (p) { p.classList.add("hidden"); p.innerHTML = ""; }
          document.body.classList.remove("in-player");
          S.cur = null;
        }
        render();
      }
      window.scrollTo(0, 0);
    } finally {
      HIST_SKIP = false;
    }
  }
  window.addEventListener("popstate", function (e) {
    if (e.state) applySnapshot(e.state);
    else {
      // no state — leave site level; ensure player closed
      if (document.body.classList.contains("in-player")) {
        applySnapshot({ nav: "home", tab: "Home", q: "", focus: null, lim: {}, detail: false });
      }
    }
  });


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

  // Deep-link / share: always current host + path, never hard-coded domain.
  // Series: ?v=SERIES_ID&s=SEASON_INDEX&e=EPISODE_INDEX (0-based).
  function videoShareUrl(id, season, ep) {
    id = id || (S.cur && S.cur.id);
    if (!id) return location.href;
    var path = location.pathname || "/";
    path = path.replace(/\/index\.html$/i, "/");
    if (path.slice(-1) !== "/") path += "/";
    var u = new URL(path, location.origin);
    u.searchParams.set("v", id);
    var it = S.byId[id];
    if (it && it.seasons && it.seasons.length) {
      var si = season != null ? season : (S.cur && S.cur.id === id ? S.season : 0);
      var ei = ep != null ? ep : (S.cur && S.cur.id === id ? S.ep : 0);
      if (si > 0) u.searchParams.set("s", String(si));
      else u.searchParams.delete("s");
      if (ei > 0) u.searchParams.set("e", String(ei));
      else u.searchParams.delete("e");
    } else {
      u.searchParams.delete("s");
      u.searchParams.delete("e");
    }
    return u.toString();
  }
  function syncWatchUrl() {
    try {
      if (!S.cur) return;
      var next = videoShareUrl(S.cur.id, S.season, S.ep);
      var cur = location.pathname + location.search;
      var n = new URL(next);
      var want = n.pathname + n.search;
      if (cur !== want) history.replaceState(null, "", want);
    } catch (e) {}
  }
  function openFromQuery() {
    try {
      var q = new URLSearchParams(location.search);
      var id = q.get("v") || q.get("id");
      if (!id && location.hash) {
        var m = location.hash.match(/[#&?]v=([^&]+)/);
        if (m) id = decodeURIComponent(m[1]);
      }
      if (!id || !S.byId[id]) return;
      var si = parseInt(q.get("s") || "0", 10) || 0;
      var ei = parseInt(q.get("e") || "0", 10) || 0;
      openDetail(id, si, ei);
    } catch (e) {}
  }
  function openDetail(id, season, ep) {
    var it = S.byId[id]; if (!it) return;
    countView(id);
    S.cur = it;
    S.qIdx = 0;
    S.showAll = false;
    var seasons = it.seasons || [];
    if (seasons.length) {
      S.season = Math.max(0, Math.min(season || 0, seasons.length - 1));
      var eps = (seasons[S.season] && seasons[S.season].episodes) || [];
      S.ep = Math.max(0, Math.min(ep || 0, Math.max(0, eps.length - 1)));
    } else {
      S.season = 0;
      S.ep = 0;
    }
    syncWatchUrl();
    renderDetail();
    pushHist(false);
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
      '<div class="vp loading idle" id="vp">' +
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
        '<div class="vp-hud vp-hud-bri hidden" id="vpHudBri">' +
          '<div class="vp-bri-ico">☀</div>' +
          '<div class="vp-vol-rail"><i id="vpBriFill"></i></div>' +
        '</div>' +
        '<div class="vp-aspect-toast hidden" id="vpAspectToast"></div>' +
        '<div class="vp-bottom">' +
          '<input class="vp-seek" id="seek" type="range" min="0" max="1000" value="0" aria-label="Seek">' +
          '<div class="vp-row">' +
            '<button class="vp-ib" id="vpPlay" type="button" aria-label="Play">' + ic("play", 22) + '</button>' +
            '<span class="vp-time" id="vpTime">0:00 / 0:00</span>' +
            '<span class="vp-sp"></span>' +
            '<button class="vp-ib" id="vpMute" type="button" aria-label="Mute">' + ic("vol", 20) + '</button>' +
            '<button class="vp-ib" id="vpSpeed" type="button" aria-label="Speed"><span class="vp-speed-lab" id="vpSpeedLab">1x</span></button>' +
            '<button class="vp-ib" id="vpFit" type="button" aria-label="Fit">' + ic("fit", 20) + '</button>' +
            '<button class="vp-ib vp-orient" id="vpOrient" type="button" aria-label="Orientation">' + ic("rotate", 20) + '</button>' +
            '<button class="vp-ib" id="vpFull" type="button" aria-label="Fullscreen">' + ic("full", 20) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="vp-speed-menu hidden" id="vpSpeedMenu"></div>' +
      '</div>' +
      '<div class="d-body"><h2 class="d-title">' + esc(it.title) + '</h2><div class="d-meta">' + esc(metaLine(it)) + '</div>' +
        '<div class="d-btns">' +
          '<button class="pill' + (inList(it.id) ? ' on pill-on' : '') + '" id="addList" type="button">' + ic(inList(it.id) ? "check" : "plus", 16) + '<span>' + (inList(it.id) ? "In list" : "Add to list") + '</span></button>' +
          '<button class="pill' + (inLikes(it.id) ? ' on pill-heart' : '') + '" id="likeBtn" type="button">' + ic("heart", 16) + '<span>' + (inLikes(it.id) ? "Liked" : "Like") + '</span></button>' +
          '<button class="pill" id="share" type="button">' + ic("share", 16) + '<span>Share</span></button>' +
          '<button class="pill dl-btn is-off" id="dlBtn" type="button" aria-label="Download" disabled>' + ic("download", 16) + '<span>Download</span></button></div>' +
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
    S.cur = null;
    pushHist(false);
  }
  function playEp(i) { S.ep = i; S.showAll = false; syncWatchUrl(); renderDetail(); pushHist(true); }

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
    // download link from API (common field names) — fall back to best stream URL
    var downloadUrl = (file && (file.download_url || file.downloadUrl || file.dlink || file.download || file.direct_link)) || null;
    if (!downloadUrl) downloadUrl = playUrl || fallback || null;
    return { playUrl: playUrl, fallbackUrl: fallback, usingFast: usingFast, downloadUrl: downloadUrl };
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
      // reveal Download after API returns (subtle animation)
      var dlBtn = $("#dlBtn");
      if (dlBtn && ex.downloadUrl) {
        dlBtn.dataset.href = ex.downloadUrl;
        dlBtn.disabled = false;
        dlBtn.classList.remove("is-off");
        dlBtn.classList.add("is-on");
      }
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
    v.addEventListener("playing", function () {
      vp.classList.remove("loading");
      if (poster) poster.classList.add("hide");
      pb.innerHTML = ic("pause", 22);
      showCtrl();
    });
    v.addEventListener("play", function () { pb.innerHTML = ic("pause", 22); });
    v.addEventListener("pause", function () {
      pb.innerHTML = ic("play", 22);
      if (!vp.classList.contains("loading")) {
        vp.classList.remove("idle");
        clearTimeout(idleT);
      }
    });
    v.addEventListener("waiting", function () {
      // buffering mid-play: keep controls, optional spinner only on poster if still visible
    });
    v.addEventListener("loadstart", function () {
      vp.classList.add("loading");
    });
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
    // Aspect cycle: 100% (contain) → CROP (cover) → STRETCH (fill)
    var fitBtn = $("#vpFit");
    var aspectModes = ["contain", "cover", "fill"];
    var aspectLabels = { contain: "100%", cover: "CROP", fill: "STRETCH" };
    var aspectIdx = 0;
    function applyAspect(idx) {
      aspectIdx = ((idx % 3) + 3) % 3;
      vp.classList.remove("cover", "stretch");
      if (aspectModes[aspectIdx] === "cover") vp.classList.add("cover");
      if (aspectModes[aspectIdx] === "fill") vp.classList.add("stretch");
      if (fitBtn) fitBtn.classList.toggle("on", aspectIdx !== 0);
      var toastEl = $("#vpAspectToast");
      if (toastEl) {
        toastEl.textContent = aspectLabels[aspectModes[aspectIdx]];
        toastEl.classList.remove("hidden");
        clearTimeout(toastEl._t);
        toastEl._t = setTimeout(function () { toastEl.classList.add("hidden"); }, 900);
      }
    }
    if (fitBtn) fitBtn.onclick = function (e) {
      e.stopPropagation();
      applyAspect(aspectIdx + 1);
      showCtrl();
    };

    // Orientation: try Screen Orientation API; if blocked, CSS-rotate video (always works)
    var orientBtn = $("#vpOrient");
    var orientMode = "landscape"; // landscape | portrait
    function applyOrient() {
      var nextIsPortrait = orientMode === "landscape";
      var nextLock = nextIsPortrait ? "portrait-primary" : "landscape-primary";
      var o = screen.orientation;
      function done(ok, via) {
        orientMode = nextIsPortrait ? "portrait" : "landscape";
        // CSS rotate only when OS lock unavailable (avoid double-rotate)
        vp.classList.toggle("rot90", via === "css" && orientMode === "portrait"); // CSS uses -90deg
        if (orientBtn) orientBtn.classList.toggle("on", orientMode === "portrait");
        toast(orientMode === "portrait" ? "Portrait" : "Landscape");
      }
      if (o && typeof o.lock === "function") {
        var p = o.lock(nextLock);
        if (p && p.then) {
          p.then(function () { done(true, "api"); }).catch(function () {
            // API blocked — visual rotate still applies
            done(false, "css");
          });
          return;
        }
      }
      done(false, "css");
    }
    if (orientBtn) orientBtn.onclick = function (e) {
      e.stopPropagation();
      if (!isFs()) {
        toggleFs();
        setTimeout(applyOrient, 400);
      } else {
        applyOrient();
      }
      showCtrl();
    };
    function isFs() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function syncFullIcon() {
      var btn = $("#vpFull");
      if (btn) btn.innerHTML = ic(isFs() ? "exitFull" : "full", 20);
      // leaving FS → clear visual rotate
      if (!isFs()) {
        vp.classList.remove("rot90");
        orientMode = "landscape";
        if (orientBtn) orientBtn.classList.remove("on");
      }
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

    var mode = null; // "seek" | "vol" | "bri" | null
    var startT = 0, startVol = 1, startBri = 1, hudT = null;
    var briLevel = 1; // 0 .. 1
    var hudSeek = $("#vpHudSeek"), hudSeekTxt = $("#vpHudSeekTxt");
    var hudVol = $("#vpHudVol"), volFill = $("#vpVolFill");
    var hudBri = $("#vpHudBri"), briFill = $("#vpBriFill");
    function hideAllHud() {
      if (hudSeek) hudSeek.classList.add("hidden");
      if (hudVol) hudVol.classList.add("hidden");
      if (hudBri) hudBri.classList.add("hidden");
    }
    function showHudSeek(sec) {
      if (!hudSeek) return;
      hideAllHud();
      hudSeek.classList.remove("hidden");
      var sign = sec >= 0 ? "+" : "−";
      hudSeekTxt.textContent = sign + Math.abs(Math.round(sec)) + "s";
      clearTimeout(hudT);
      hudT = setTimeout(hideAllHud, 600);
    }
    function showHudVol(val) {
      if (!hudVol) return;
      hideAllHud();
      hudVol.classList.remove("hidden");
      if (volFill) volFill.style.height = Math.round(val * 100) + "%";
      clearTimeout(hudT);
      hudT = setTimeout(hideAllHud, 700);
    }
    function showHudBri() {
      hideAllHud();
      if (hudBri) {
        hudBri.classList.remove("hidden");
        if (briFill) briFill.style.height = Math.round(briLevel * 100) + "%";
      }
      clearTimeout(hudT);
      hudT = setTimeout(hideAllHud, 800);
    }
    function setBrightness(val) {
      briLevel = Math.min(1, Math.max(0, val));
      v.style.filter = briLevel >= 0.995 ? "none" : ("brightness(" + briLevel + ")");
    }

    g.addEventListener("pointerdown", function (e) {
      if (locked) return;
      moved = false; mode = null;
      sx = e.clientX; sy = e.clientY;
      startT = v.currentTime || 0;
      startVol = v.muted ? 0 : (v.volume || 0);
      startBri = briLevel;
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
        // MX-style: right third vertical → volume; left third vertical → brightness; horizontal → seek
        var rect = g.getBoundingClientRect();
        var xRatio = (sx - rect.left) / rect.width;
        if (ady > adx) {
          if (xRatio > 0.6) mode = "vol";
          else if (xRatio < 0.4) mode = "bri";
          else mode = "vol"; // center vertical still volume
        } else {
          mode = "seek";
        }
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
      } else if (mode === "bri") {
        var rect = g.getBoundingClientRect();
        var deltaB = -(dy / rect.height);
        var nb = Math.min(1, Math.max(0, startBri + deltaB));
        setBrightness(nb);
        showHudBri();
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
    // stay idle+loading until first 'playing' — only poster spinner visible
    v.play().catch(function () {});
  }

  // ---- bottom sheet ----
  function openShareSheet() {
    if (!S.cur) return toast("Nothing to share");
    var url = videoShareUrl(S.cur.id, S.season, S.ep);
    var title = S.cur.title || "TeraFast Play";
    var text = title + " — TeraFast Play";
    var encU = encodeURIComponent(url);
    var encT = encodeURIComponent(text);
    var channels = [
      { id: "fb", label: "Facebook", color: "#1877F2", href: "https://www.facebook.com/sharer/sharer.php?u=" + encU,
        svg: '<path fill="currentColor" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.09 24 18.1 24 12.07z"/>' },
      { id: "x", label: "X", color: "#000000", href: "https://twitter.com/intent/tweet?url=" + encU + "&text=" + encT,
        svg: '<path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.849L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>' },
      { id: "tg", label: "Telegram", color: "#2AABEE", href: "https://t.me/share/url?url=" + encU + "&text=" + encT,
        svg: '<path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.2l-1.86 8.77c-.14.62-.5.77-1.02.48l-2.82-2.08-1.36 1.31c-.15.15-.28.28-.57.28l.2-2.86 5.22-4.71c.23-.2-.05-.31-.35-.12l-6.45 4.06-2.78-.87c-.6-.19-.61-.6.13-.89l10.86-4.19c.5-.19.94.12.82.82z"/>' },
      { id: "wa", label: "WhatsApp", color: "#25D366", href: "https://wa.me/?text=" + encodeURIComponent(text + "\n" + url),
        svg: '<path fill="currentColor" d="M12 2a10 10 0 0 0-8.67 15.06L2 22l5.1-1.33A10 10 0 1 0 12 2zm0 18.2a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.03.79.81-2.95-.2-.31A8.2 8.2 0 1 1 12 20.2zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8s-.39-.12-.56.12-.64.8-.79.97-.29.19-.54.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5s.25-.29.37-.44.16-.25.25-.41.04-.31-.02-.43-.56-1.35-.77-1.85c-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.66.31s-.86.84-.86 2.05.88 2.38 1 2.54 1.73 2.64 4.19 3.7c.59.25 1.04.41 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.67-1.17s.21-1.07.15-1.17-.22-.18-.47-.3z"/>' },
      { id: "rd", label: "Reddit", color: "#FF4500", href: "https://www.reddit.com/submit?url=" + encU + "&title=" + encT,
        svg: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.05 10.1c0 .9-.5 1.68-1.22 2.12-.1 3.02-3.27 5.16-6.83 5.16s-6.73-2.14-6.83-5.16A2.44 2.44 0 0 1 4 12.1c0-.9.5-1.68 1.22-2.12a3.6 3.6 0 0 1 3.55-2.9c.7 0 1.36.18 1.95.49L12 5.4l1.28 2.17c.59-.31 1.25-.49 1.95-.49a3.6 3.6 0 0 1 3.55 2.9c.72.44 1.27 1.22 1.27 2.12z"/>' }
    ];
    var sh = $("#sheet");
    var icons = channels.map(function (c) {
      return '<button type="button" class="share-ico-btn" data-share-href="' + esc(c.href) + '" aria-label="' + esc(c.label) + '" title="' + esc(c.label) + '">' +
        '<span class="share-ico" style="background:' + c.color + '">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' + c.svg + '</svg></span></button>';
    }).join("");
    sh.innerHTML =
      '<div class="sh-bd" data-sh="1"></div>' +
      '<div class="sh-panel share-panel">' +
        '<div class="grip"></div>' +
        '<div class="share-icons">' + icons + '</div>' +
        '<button type="button" class="share-copy" id="shareCopy">' +
          '<span class="share-copy-ico">' + ic("share", 18) + '</span>' +
          '<span>Copy link</span></button>' +
      '</div>';
    sh.classList.remove("hidden");
    requestAnimationFrame(function () { sh.classList.add("open"); });
    // bind once per open via dataset on panel
    var copyBtn = $("#shareCopy");
    if (copyBtn) copyBtn.onclick = function (e) {
      e.stopPropagation();
      function copyText(str) {
        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
          return navigator.clipboard.writeText(str);
        }
        return new Promise(function (resolve, reject) {
          try {
            var ta = document.createElement("textarea");
            ta.value = str;
            ta.setAttribute("readonly", "");
            ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, str.length);
            var ok = document.execCommand("copy");
            document.body.removeChild(ta);
            if (ok) resolve(); else reject(new Error("copy failed"));
          } catch (err) { reject(err); }
        });
      }
      copyText(url).then(function () {
        closeSheet();
        // after sheet starts closing so toast is visible above player
        setTimeout(function () { toastOk("Link copied"); }, 80);
      }).catch(function () {
        closeSheet();
        setTimeout(function () { toast(url); }, 80);
      });
    };
  }
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
    else openSheet("Season", it.seasons.map(function (s, i) { return s.name || ("Season " + String(i + 1).padStart(2, "0")); }), S.season, function (i) { S.season = i; S.ep = 0; S.showAll = false; syncWatchUrl(); renderDetail(); });
  }

  // ---- events ----
  document.addEventListener("click", function (e) {
    var t;
    if (e.target.closest("#back")) return closeDetail();
    if ((t = e.target.closest("[data-si]"))) { var f = S.sheetPick; closeSheet(); if (f) f(+t.dataset.si); return; }
    if (e.target.closest("[data-sh]")) return closeSheet();
    if (e.target.closest("#addList")) {
      if (!S.cur) return;
      var on = toggleList(S.cur.id);
      var btn = $("#addList");
      if (btn) {
        btn.classList.toggle("on", on);
        btn.classList.toggle("pill-on", on);
        btn.innerHTML = ic(on ? "check" : "plus", 16) + "<span>" + (on ? "In list" : "Add to list") + "</span>";
      }
      toastOk(on ? "Added to My List" : "Removed from list");
      return;
    }
    if (e.target.closest("#likeBtn")) {
      if (!S.cur) return;
      var liked = toggleLike(S.cur.id);
      var lb = $("#likeBtn");
      if (lb) {
        lb.classList.toggle("on", liked);
        lb.classList.toggle("pill-heart", liked);
        lb.innerHTML = ic("heart", 16) + "<span>" + (liked ? "Liked" : "Like") + "</span>";
      }
      toastOk(liked ? "Added to My Likes" : "Removed from likes");
      return;
    }
    if ((t = e.target.closest("[data-me]"))) {
      var kind = t.getAttribute("data-me");
      if (kind === "list" || kind === "likes") { renderSaved(kind); pushHist(false); return; }
      toast("Coming soon");
      return;
    }
    if (e.target.closest("[data-me-back]")) { renderMe(); pushHist(false); return; }
    if (e.target.closest("#share")) { openShareSheet(); return; }
    if ((t = e.target.closest("[data-share-href]"))) {
      var href = t.getAttribute("data-share-href");
      closeSheet();
      if (href) window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (e.target.closest("#dlBtn")) {
      var db = e.target.closest("#dlBtn");
      var href = db && db.dataset.href;
      if (!href) return toast("Download not ready");
      // open download URL (browser handles file)
      var a = document.createElement("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.download = "";
      document.body.appendChild(a); a.click(); a.remove();
      toast("Download started");
      return;
    }
    if ((t = e.target.closest("[data-dd]"))) return openDD(t.dataset.dd);
    if (e.target.closest("[data-all-ep]")) { S.showAll = !S.showAll; return renderDetail(); }
    if ((t = e.target.closest("[data-ep]"))) return playEp(+t.dataset.ep);
    if ((t = e.target.closest("[data-dltab]"))) { S.dlTab = t.dataset.dltab; return renderDownloads(); }
    if (e.target.closest("#transfer")) return toast("Transfer is not available in demo mode");
    if (e.target.closest("#refresh")) { if (S.nav === "downloads") { renderDownloads(); toast("Refreshed"); } else toast("Nothing new"); return; }
    if (e.target.closest("#loginBtn")) return toast("Login is not available in demo mode");
    if ((t = e.target.closest("[data-all]"))) return allFor(t.dataset.all);
    if ((t = e.target.closest("[data-more]"))) return moreFor(t.dataset.more);
    if (e.target.closest("[data-reset]")) { S.focus = null; render(); pushHist(false); return; }
    if ((t = e.target.closest("[data-id]"))) return openDetail(t.dataset.id);
    if ((t = e.target.closest("[data-tab]"))) {
      S.tab = t.dataset.tab; S.q = ""; $("#searchInput").value = ""; S.nav = "home";
      resetViewState(); setNav("home"); renderTabs(); render(); window.scrollTo(0, 0);
      pushHist(false); return;
    }
    if ((t = e.target.closest("[data-nav]"))) {
      S.nav = t.dataset.nav;
      if (S.nav === "home") { S.tab = "Home"; S.q = ""; $("#searchInput").value = ""; renderTabs(); }
      resetViewState(); setNav(S.nav); render(); window.scrollTo(0, 0);
      pushHist(false);
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
    S.all.forEach(function (i) {
      if (i.category === "18+ Vmax") i.category = "Midnight";
      if (i.category === "18+ JAV") { /* keep data name; tab maps via CAT_DATA */ }
      S.byId[i.id] = i;
    });
    S.carousel = (res[1].items || []).map(function (id) { return S.byId[id]; }).filter(Boolean);
    render();
    openFromQuery();
    pushHist(true);
  }).catch(function () { $("#main").innerHTML = '<div class="empty">Could not load content.</div>'; });
})();
