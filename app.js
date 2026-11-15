(function () {
  const C = Object.assign(
    { API_BASE: "", LIBRARY_PATH: "data/library.json", PAGE_SIZE: 20, SECTION_COUNT: 4, MAX_HOME_SECTIONS: 4, HERO_SLIDES: 4, DEMO_VIDEO: "", PLAY_PATHS: ["/play","/stream","/api/play"] },
    window.TFP_CONFIG || {}
  );
  const K = { users: "tfp_users_v2", session: "tfp_session_v2", history: "tfp_history_v2" };
  const TABS = [
    { key: "trending", label: "Trending" },
    { key: "movie", label: "Movie" },
    { key: "series", label: "TV" },
    { key: "anime", label: "Anime" },
    { key: "adult", label: "Midnight" },
  ];
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M10 6H5v13h13v-5"/></svg>',
    dl: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>',
  };
  const S = { kindFilter: "", topTab: "trending",
    items: [], tab: "trending", view: "home", prev: "home",
    genre: "", page: 1, query: "", user: null,
    season: null, playId: null, pending: null, authMode: "login", playlinks: {},
  };
  const $ = (s) => document.querySelector(s);
  const main = $("#main"), tabsEl = $("#tabs"), player = $("#player");
  let artPlayer = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hueOf = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const artStyle = (t) => { const h = hueOf(t); return `background:linear-gradient(135deg,hsl(${h} 50% 28%),hsl(${(h + 48) % 360} 55% 12%))`; };
  function parseCategory(str, kind) {
    const parts = String(str || "").split(",").map((s) => s.trim()).filter(Boolean);
    const blob = (parts.join(" ") + " " + (kind || "")).toLowerCase();
    let type = "movie";
    if (/adult|vivamax|erotic|hot web/.test(blob)) type = "adult";
    else if (/anime/.test(blob)) type = "anime";
    else if (/series|episode|tv|drama/.test(blob) || /s\d+e\d+/i.test(blob)) type = "series";
    const genres = [...new Set(parts.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).filter((g) => !/^(movie|series|adult|anime)$/i.test(g)))];
    return { type, genres };
  }
  function normalize(raw) {
    return (raw || []).map((it) => {
      const c = parseCategory(it.category, it.kind);
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

  function authHeaders() {
    const h = { "Accept": "application/json" };
    const key = (window.TFP_SECRETS && window.TFP_SECRETS.practiceKey) || "";
    if (key) h["X-Practice-Key"] = key;
    return h;
  }

  function extractPlayUrl(data) {
    if (!data) return null;
    // Direct fields
    if (typeof data.url === "string" && data.url) return { url: data.url, fallback: data.fallbackUrl || data.fallback || null, thumb: data.thumbnail || "" };
    if (typeof data.playUrl === "string" && data.playUrl) return { url: data.playUrl, fallback: data.fallbackUrl || null, thumb: data.thumbnail || "" };
    // Terabox-style list response
    const file = (data.list && data.list[0]) || data.file || data;
    if (!file || typeof file !== "object") return null;
    let playUrl = null;
    let usingFast = false;
    if (file.fast_stream_url && typeof file.fast_stream_url === "object") {
      const qualities = Object.keys(file.fast_stream_url);
      if (qualities.length) {
        qualities.sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0));
        playUrl = file.fast_stream_url[qualities[0]];
        usingFast = !!playUrl;
      }
    }
    const fallback = file.stream_url || file.streamUrl || file.download_url || null;
    if (!playUrl) playUrl = fallback;
    if (!playUrl && typeof file.url === "string") playUrl = file.url;
    if (!playUrl) return null;
    return { url: playUrl, fallback: (fallback && fallback !== playUrl) ? fallback : null, thumb: file.thumbnail || "", usingFast };
  }

  async function resolveStream(id) {
    const base = (C.API_BASE || "").replace(/\/$/, "");
    if (!base) {
      if (C.DEMO_VIDEO) return { url: C.DEMO_VIDEO, fallback: null, demo: true };
      throw new Error("Stream API is not configured");
    }

    // Prefer direct Terabox share link for this id (fast path)
    const shareEarly = findShareLink(id);
    if (shareEarly && base) {
      try {
        const data = await callTeraboxApi(shareEarly);
        const extracted = extractPlayUrl(data);
        if (extracted && extracted.url) return extracted;
      } catch (e) {
        console.warn("Terabox early resolve failed", e);
      }
    }

    // 1) Id-based play routes (if Worker has private link map)
    const paths = C.PLAY_PATHS || ["/play", "/stream", "/api/play"];
    let lastErr = null;
    for (const path of paths) {
      const getUrl = base + path + (path.includes("?") ? "&" : "?") + "id=" + encodeURIComponent(id);
      try {
        const r = await fetch(getUrl, { headers: authHeaders(), cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          const extracted = extractPlayUrl(data);
          if (extracted && extracted.url) return extracted;
          lastErr = "No playable URL in response";
        } else if (r.status !== 404) {
          lastErr = "HTTP " + r.status;
        }
      } catch (e) {
        lastErr = e.message || lastErr;
      }
      try {
        const r = await fetch(base + path, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
          cache: "no-store",
        });
        if (r.ok) {
          const data = await r.json();
          const extracted = extractPlayUrl(data);
          if (extracted && extracted.url) return extracted;
        } else if (r.status !== 404) {
          lastErr = "HTTP " + r.status;
        }
      } catch (e) {
        lastErr = e.message || lastErr;
      }
    }

    // 2) Direct Terabox resolve when the catalog entry carries a share URL
    const link = findShareLink(id);
    if (link) {
      const data = await callTeraboxApi(link);
      const extracted = extractPlayUrl(data);
      if (extracted && extracted.url) return extracted;
      lastErr = "Terabox response had no stream URL";
    }

    if (C.DEMO_VIDEO) return { url: C.DEMO_VIDEO, fallback: null, demo: true };
    throw new Error(lastErr || "Stream not available for this title (Worker needs /play?id= or a Terabox link)");
  }

  function findShareLink(id) {
    if (S.playlinks && S.playlinks[id]) return S.playlinks[id];
    for (const it of S.items) {
      if (it.id === id) {
        const u = it.url || it.terabox || it.link || it.share || null;
        if (u) return u;
      }
      if (it.versions) {
        for (const v of it.versions) {
          if (v.id === id) return v.url || v.terabox || v.link || it.url || it.terabox || null;
        }
      }
      if (it.episodes) {
        for (const e of it.episodes) {
          if (e.id === id) {
            const u = e.url || e.terabox || e.link || null;
            if (u) return u;
            if (e.versions) {
              for (const v of e.versions) {
                if (v.id === id) return v.url || v.terabox || v.link || null;
              }
            }
          }
          if (e.versions) {
            for (const v of e.versions) {
              if (v.id === id) return v.url || v.terabox || v.link || null;
            }
          }
        }
      }
    }
    return null;
  }

  async function callTeraboxApi(link) {
    const base = (C.API_BASE || "").replace(/\/$/, "");
    const path = C.TERABOX_PATH || "/terabox";
    const headers = { ...authHeaders(), "Content-Type": "application/json" };
    const r = await fetch(base + path, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: link }),
      cache: "no-store",
    });
    if (!r.ok) throw new Error("Terabox API HTTP " + r.status);
    const data = await r.json();
    if (data.status && data.status !== "success") {
      throw new Error(data.error || data.message || "Terabox resolve failed");
    }
    if (!(data.list && data.list.length) && !data.url && !data.playUrl) {
      throw new Error(data.message || data.error || "No files in Terabox response");
    }
    return data;
  }


  
  function isHls(url) {
    return /\.m3u8($|\?)/i.test(url || "") || /m3u8/i.test(url || "");
  }

  
  let chromeTimer = null;
  function showPlayerChrome() {
    const top = document.querySelector(".pl-top");
    if (!top) return;
    top.classList.add("show");
    top.classList.remove("hide");
    clearTimeout(chromeTimer);
    chromeTimer = setTimeout(function () {
      top.classList.add("hide");
      top.classList.remove("show");
    }, 3000);
  }
  function bindPlayerChrome(stage) {
    if (!stage) return;
    showPlayerChrome();
    stage.addEventListener("click", function (e) {
      // ignore pure control clicks inside artplayer controls if possible
      showPlayerChrome();
    });
  }

  
  function getArtVideo() {
    try {
      if (artPlayer && artPlayer.video) return artPlayer.video;
    } catch (_) {}
    return document.querySelector("#art-player-box video");
  }

  function flashGesture(side, text) {
    const el = document.getElementById(side === "left" ? "gzFlashL" : "gzFlashR");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 450);
  }

  function bindSeekGestures(stage) {
    if (!stage) return;
    const layer = stage.querySelector(".pl-gestures") || stage;
    let lastTap = 0;
    let lastSide = "";
    let holdTimer = null;
    let holding = false;
    let startRate = 1;

    function sideFromEvent(e) {
      const rect = layer.getBoundingClientRect();
      const x = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : e.clientX) - rect.left;
      const ratio = x / Math.max(1, rect.width);
      if (ratio < 0.4) return "left";
      if (ratio > 0.6) return "right";
      return "mid";
    }

    function doSkip(side) {
      const v = getArtVideo();
      if (!v) return;
      const delta = side === "right" ? 10 : -10;
      try {
        const dur = isFinite(v.duration) ? v.duration : 1e9;
        v.currentTime = Math.max(0, Math.min(dur, (v.currentTime || 0) + delta));
      } catch (_) {}
      flashGesture(side, side === "right" ? "+10s" : "-10s");
      showPlayerChrome();
    }

    function onPointerUp(e) {
      const side = sideFromEvent(e);
      if (side === "mid") return;
      const now = Date.now();
      if (lastSide === side && now - lastTap < 320) {
        e.preventDefault();
        e.stopPropagation();
        doSkip(side);
        lastTap = 0;
        lastSide = "";
      } else {
        lastTap = now;
        lastSide = side;
      }
    }

    function onHoldStart(e) {
      const side = sideFromEvent(e);
      if (side === "mid") return;
      holding = false;
      startRate = 1;
      holdTimer = setTimeout(function () {
        const v = getArtVideo();
        if (!v) return;
        holding = true;
        try { startRate = v.playbackRate || 1; v.playbackRate = 2; } catch (_) {}
        const badge = document.getElementById("speedBadge");
        if (badge) { badge.textContent = "2× Speed"; badge.classList.add("show"); }
      }, 320);
    }
    function onHoldEnd() {
      clearTimeout(holdTimer);
      if (holding) {
        const v = getArtVideo();
        if (v) { try { v.playbackRate = startRate || 1; } catch (_) {} }
        const badge = document.getElementById("speedBadge");
        if (badge) badge.classList.remove("show");
        holding = false;
      }
    }

    layer.addEventListener("click", onPointerUp, true);
    layer.addEventListener("touchend", onPointerUp, true);
    layer.addEventListener("touchstart", onHoldStart, { passive: true, capture: true });
    layer.addEventListener("mousedown", onHoldStart, true);
    layer.addEventListener("touchend", onHoldEnd, true);
    layer.addEventListener("touchcancel", onHoldEnd, true);
    layer.addEventListener("mouseup", onHoldEnd, true);
  }

  function destroyArt() {
    if (artPlayer) {
      try { artPlayer.destroy(false); } catch (_) {}
      artPlayer = null;
    }
    const box = document.getElementById("art-player-box");
    if (box) box.innerHTML = "";
  }

  async function attachStream(container, stream) {
    if (!container || !stream || !stream.url) return;
    destroyArt();
    const url = stream.url;
    const poster = stream.thumb || "";
    const hls = isHls(url);

    if (typeof Artplayer === "undefined") {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.cssText = "width:100%;height:100%;background:#000;object-fit:contain";
      video.src = url;
      container.innerHTML = "";
      container.appendChild(video);
      try { await video.play(); } catch (_) {}
      return;
    }

    const options = {
      container: container,
      url: url,
      poster: poster || "",
      autoplay: true,
      muted: false,
      volume: 0.85,
      setting: true,
      playbackRate: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      autoSize: false,
      autoOrientation: true,
      hotkey: false,
      lang: "en",
      theme: "#1ed760",
      type: hls ? "m3u8" : "auto",
    };

    if (hls) {
      options.customType = {
        m3u8: function (video, u, art) {
          if (typeof Hls !== "undefined" && Hls.isSupported()) {
            if (art.hls) { try { art.hls.destroy(); } catch (_) {} }
            const hlsInst = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 60,
              maxMaxBufferLength: 120,
            });
            hlsInst.loadSource(u);
            hlsInst.attachMedia(video);
            art.hls = hlsInst;
            art.on("destroy", function () {
              try { hlsInst.destroy(); } catch (_) {}
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = u;
          } else {
            art.notice.show = "HLS not supported on this device";
          }
        },
      };
    }

    artPlayer = new Artplayer(options);
    artPlayer.on("ready", function () {
      try { artPlayer.play().catch(function () {}); } catch (_) {}
    });
    artPlayer.on("video:ended", function () {
      try { nextEpisode(); } catch (_) {}
    });
    artPlayer.on("error", function () {
      if (stream.fallback && stream.fallback !== url) {
        toast("Retrying fallback stream…");
        attachStream(container, { url: stream.fallback, thumb: poster });
      }
    });
  }

  async function loadPlaylinks() {
    try {
      const r = await fetch("data/playlinks.json", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      S.playlinks = data && typeof data === "object" ? data : {};
    } catch (_) { S.playlinks = S.playlinks || {}; }
  }

  async function loadLibrary() {
    const paths = [];
    if (C.API_BASE) paths.push(C.API_BASE.replace(/\/$/, "") + "/library/list");
    paths.push(C.LIBRARY_PATH || "data/library.json");
    let lastErr = null;
    for (const url of paths) {
      try {
        const r = await fetch(url, { cache: "no-store", headers: authHeaders() });
        if (!r.ok) { lastErr = "HTTP " + r.status; continue; }
        const data = await r.json();
        const items = normalize(data.items || data || []);
        if (items.length) { S.items = items; return; }
        lastErr = "Empty library";
      } catch (e) {
        lastErr = e.message || String(e);
      }
    }
    S.items = [];
    main.innerHTML = emptyState("Could not load library. " + (lastErr || ""));
  }
  const tabItems = () => {
    if (S.tab === "trending") return S.items;
    if (S.tab === "anime") return S.items.filter((it) => /anime/i.test(it.category || "") || /anime/i.test(it._type || "") || /anime/i.test(it.title || ""));
    if (S.tab === "adult") return S.items.filter((it) => it._type === "adult" || /adult|vivamax|hot|erotic/i.test(it.category || ""));
    return S.items.filter((it) => it._type === S.tab);
  };
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
    if (!tabsEl) return;
    tabsEl.style.display = S.view === "home" ? "" : "none";
    tabsEl.innerHTML = TABS.map((t) =>
      `<button data-tab="${t.key}" type="button" class="ttab ${t.cls || ""} ${S.tab === t.key ? "on" : ""}">${esc(t.label)}</button>`
    ).join("");
  }

  function renderHome() {
    const list = tabItems();
    if (!list.length) { main.innerHTML = emptyState("No titles in this category yet."); return; }
    const slides = [...list].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)).filter((it) => it.thumbnail).slice(0, C.HERO_SLIDES || 5);
    const groups = groupsOf(list);
    let html = "";
        if (slides.length) {
      html += `<section class="car"><div class="car-track" id="carTrack">${slides.map((it, hi) => {
        const next = slides[(hi + 1) % slides.length];
        const thumb = it.thumbnail || "";
        const nextThumb = (next && next.thumbnail) || thumb;
        const meta = [it.year, (it.category || "").split(",")[0] || it.quality].filter(Boolean).join(" | ");
        return `<button class="slide" data-id="${esc(it.id)}" type="button">
          <div class="slide-bg" style="background-image:url('${esc(thumb)}')"></div>
          <div class="slide-float">
            <div class="sf-card">
              ${thumb ? `<img class="sf-thumb" src="${esc(thumb)}" alt="" loading="${hi ? "lazy" : "eager"}" onerror="this.style.opacity=0">` : `<div class="sf-thumb"></div>`}
              <div class="sf-meta"><b>${esc(it.title)}</b><small>${esc(meta)}</small></div>
              <span class="sf-play" aria-hidden="true">${ICON.play}</span>
            </div>
            <div class="sf-next" style="background-image:url('${esc(nextThumb)}')"></div>
          </div>
        </button>`;
      }).join("")}</div></section>`;
    }
    html += `<div class="sec-head"><h2>Categories</h2></div>
      <div class="cat-row">
        <button class="cat-pill on" data-genre="" type="button"><span>All</span><span class="filter-ico" aria-hidden="true">☰</span></button>
        ${groups.slice(0, 14).map(([g, arr]) => {
          const thumb = (arr.find(x => x.thumbnail) || {}).thumbnail || "";
          const style = thumb ? `background-image:url('${esc(thumb)}')` : artStyle(g);
          return `<button class="cat-pill pic" data-genre="${esc(g)}" type="button" style="${style}"><span>${esc(g)}</span></button>`;
        }).join("")}
      </div>`;
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
      <div class="pl-stage" id="plStage">
        <div class="pl-top show" id="plTop">
          <button class="back-btn" data-back type="button" aria-label="Back">${ICON.back}</button>
        </div>
        <div class="pl-video">
          <div id="art-player-box"></div>
          <div class="pl-load" id="plLoad"><div class="spin"></div><div>Loading stream…</div></div>
          <div class="pl-gestures" id="plGestures">
            <div class="gz gz-left"><div class="gz-flash" id="gzFlashL">-10s</div></div>
            <div class="gz gz-mid"></div>
            <div class="gz gz-right"><div class="gz-flash" id="gzFlashR">+10s</div></div>
          </div>
          <div class="speed-badge" id="speedBadge">2× Speed</div>
        </div>
      </div>
      <div class="pl-body">
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
        <div class="related-grid">${rel.map((it) => mediaCard(it)).join("") || '<div class="empty">No related titles</div>'}</div>
      </div>`;
    if (item.kind === "series") renderEpisodes();
    bindPlayerChrome(document.getElementById("plStage"));
    bindSeekGestures(document.getElementById("plStage"));
    const box = document.getElementById("art-player-box");
    (async () => {
      const loadEl = $("#plLoad");
      try {
        const stream = await resolveStream(vid);
        if (loadEl) loadEl.remove();
        if (stream.demo) toast("Demo stream");
        await attachStream(box, stream);
        showPlayerChrome();
      } catch (err) {
        if (loadEl) loadEl.innerHTML = `<div class="pl-err">Could not load stream.<br>${esc(err.message || err)}</div>`;
        toast("Stream unavailable");
      }
    })();
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
    clearTimeout(chromeTimer);
    destroyArt();
    player.classList.add("hidden"); player.innerHTML = "";
    document.body.classList.remove("in-player");
    S.view = S.prev || "home"; render();
  }

  function openLogin(msg) {
    const reg = S.authMode === "register";
    $("#loginSheet").innerHTML = `
      <div class="grip"></div>
      <h2 id="authTitle">${reg ? "Create account" : "Welcome back"}</h2>
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
    if (g) {
      const gen = g.dataset.genre || "";
      if (!gen) { S.genre = ""; S.page = 1; go("home"); return; }
      S.genre = gen; S.page = 1; go("genre"); return;
    }
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

  function loadSecrets() {
    return new Promise((resolve) => {
      if (window.TFP_SECRETS) return resolve();
      const s = document.createElement("script");
      s.src = "secrets.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve(); // missing is fine
      document.head.appendChild(s);
      setTimeout(resolve, 800);
    });
  }
  async function init() {
    await loadSecrets();
    restoreSession();
    skeleton();
    await loadLibrary();
    await loadPlaylinks();
    render();
  }
  init();
})();
