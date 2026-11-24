# TeraFast Play (Site-Check)

Mobile-first static SPA for browsing and playing movies / series. The browser loads JSON from `data/`, renders the UI, resolves Terabox share links through a Cloudflare Worker, and plays streams in a custom HTML5 player.

**Host:** GitHub Pages (or any static host) serving `index.html` and assets.

---

## Rules for AI assistants (read first)

1. **Never delete or empty** `data/*.json` unless the owner explicitly asks.
2. **Never remove** Terabox / worker settings from `config.js` unless the owner asks.
3. **Do not invent** categories, tabs, or JSON fields that are not documented here.
4. When adding catalog items, **prepend** them to the top of the relevant `items` array (newest first).
5. Keep **full titles** — do not crop or “clean” titles from source data.
6. After changing behavior (tabs, player, Me page, JSON shape), **update this README** in the same change so the next AI stays aligned.
7. Only change what the owner asked for. Do not “drive-by” rewrite unrelated UI.
8. Prefer small, reviewable commits. Do not force-push or rewrite history unless asked.
9. Secrets (bot tokens, private keys) ideally live on the **Cloudflare Worker**, not in the public repo. If temporary tokens appear in `config.js`, treat them as short-lived and prefer Worker secrets long-term.
10. **Grok (xAI) only** may read owner-provided private tokens when the owner pastes them in chat for setup. Other AIs should not demand secrets or commit new secrets without owner instruction.

---

## Quick start

1. Serve the repo root over HTTPS/HTTP (GitHub Pages, `npx serve`, etc.).
2. Edit `data/*.json` for catalog content; `config.js` for runtime endpoints.
3. Hard-refresh the browser after JS/CSS/JSON changes.

---

## Repository layout

| Path | Role |
|------|------|
| `index.html` | App shell: header, search, tabs, `#main`, bottom nav, `#player`, `#sheet`, `#toast` |
| `app.js` | All UI logic (routing, lists, player, Me, share, request) |
| `styles.css` | Layout, cards, player chrome, sheets, Me/Settings |
| `config.js` | `window.TFP_CONFIG` — hero size, worker URLs, optional TG fallback |
| `data/categories.json` | Category tile names + thumbs |
| `data/carousel.json` | Home hero: ordered list of item **ids** (target **15**) |
| `data/video.json` | Single-file titles (movies / clips) |
| `data/series.json` | Multi-episode titles |
| `worker-request-route.js` | Reference Cloudflare Worker handler for `/request` (Telegram) |
| `README.md` | This file — keep in sync with code |

---

## Config (`config.js`)

| Key | Meaning |
|-----|---------|
| `HERO_SLIDES` | Home hero slide count (currently **15**) |
| `PAGE` | Cards per section preview on Home genre/category rows (5) |
| `PREVIEW` | Initial grid size for direct categories / expanded lists (20) |
| `STEP` | “See more” increment |
| `DEMO_VIDEO` / `DEMO_SOURCES` | Fallback media if resolve fails |
| `TERABOX_API` | Worker URL that resolves Terabox share links → playable URL |
| `PRACTICE_KEY` | Header `X-Practice-Key` for the worker |
| `REQUEST_API` | Worker URL for movie/series requests (`POST` JSON) |
| `TG_BOT_TOKEN` / `TG_CHAT_ID` | Optional temporary client-side Telegram fallback if worker does not return `{ ok: true }` |

---

## Tabs and categories

Defined in `app.js`:

- **`TABS` / `HOME_ORDER`:** Home, Trending, Movie, Series, Midnight, Anime, Kids, Desi Porn, Foreign Porn, JAV, Indo  
- **`DIRECT_CATS`:** Midnight, Desi Porn, Foreign Porn, JAV, Indo — **no genre rows**; category carousel (first 10 of pool) + grid of the rest  
- **`ADULT_TABS`:** shows a compact red **18** badge on the tab label (not the text prefix `"18+ …"`)  
- **`CAT_DATA`:** maps display tab `JAV` → data category `"18+ JAV"` when filtering JSON  

**Legacy:** `"18+ Vmax"` items are normalized to category **`Midnight`** at load time. Do not reintroduce a separate Vmax tab unless the owner asks.

`categories.json` `name` values should match tab/category names used in data (JAV, not `"18+ JAV"`, for the tile label).

---

## How data loads

On startup `app.js` fetches:

1. `data/categories.json`  
2. `data/carousel.json`  
3. `data/video.json`  
4. `data/series.json`  

`video` + `series` items merge into `S.all` / `S.byId`.

| Screen | Behavior |
|--------|----------|
| **Home** | Hero from `carousel.json` (up to `HERO_SLIDES`). Category tiles. One row per `HOME_ORDER` entry (5 cards + **All**). |
| **Home → All** | Switches to that category tab (does not expand in place). Tab bar scrolls active tab into view. |
| **Genre category** (Movie, Series, Anime, …) | Rows grouped by **genre**; 5 cards + All / See more. |
| **Direct category** | Hero = first **10** items of that category (array order). Grid = remaining; See more uses `PREVIEW` / `STEP`. |
| **Search** | Filters by title / genre / category; live suggest + results. |
| **Trending** | Driven by local click counts (`tfp_views`), excluding pure carousel-only logic as implemented in code. |

**Ordering rule for editors/AI:** always **prepend** new items to `items[]` so “newest” stay first. Carousel ids in `carousel.json` should list the preferred hero order (keep ~15 ids that exist in video/series).

---

## JSON schemas

### `data/categories.json`

```json
{
  "items": [
    { "name": "Movie", "thumb": "https://example.com/tile.jpg" }
  ]
}
```

### `data/carousel.json`

```json
{
  "items": ["id1", "id2", "id3"]
}
```

Ids must exist in `video.json` or `series.json`. Prefer **15** ids for the home hero.

### `data/video.json` — single title (movie / clip)

**One quality** — omit `versions`:

```json
{
  "items": [
    {
      "id": "uniqueId",
      "title": "Full original title from source",
      "category": "Movie",
      "genre": "Thriller",
      "year": "2015",
      "thumb": "https://cdn.example.com/poster.jpg",
      "stream": "https://1024terabox.com/s/....",
      "quality": "720p",
      "size": "1.11 GB"
    }
  ]
}
```

**Multiple qualities** — include `versions` (each with its own `stream`). Root `stream` / `quality` / `size` = default:

```json
{
  "id": "uniqueId",
  "title": "Full title",
  "category": "Midnight",
  "genre": "Romance",
  "year": "2024",
  "thumb": "https://cdn.example.com/poster.jpg",
  "stream": "https://1024terabox.com/s/1080p",
  "quality": "1080p",
  "size": "1.31 GB",
  "versions": [
    { "quality": "1080p", "size": "1.31 GB", "stream": "https://1024terabox.com/s/1080p" },
    { "quality": "720p", "size": "500 MB", "stream": "https://1024terabox.com/s/720p" }
  ]
}
```

Quality dropdown in the UI appears only when `versions.length > 1`.

**Do not use:** `hue`, `tags`, `kind`, `trending` as required fields (not part of the active schema).

### `data/series.json` — episodes own the streams

- No required top-level `stream` / `quality` / `size` on the series object.  
- **One season only:** you may omit a fancy season name or use a single season entry.  
- **Episode objects** carry `stream` (and optional `quality` / `size` if needed by future UI).

```json
{
  "items": [
    {
      "id": "s101",
      "title": "Series title",
      "category": "Series",
      "genre": "Drama",
      "year": "2023",
      "thumb": "https://cdn.example.com/poster.jpg",
      "seasons": [
        {
          "name": "Season 01",
          "episodes": [
            { "no": 1, "title": "Episode 1", "stream": "https://1024terabox.com/s/ep1" },
            { "no": 2, "title": "Episode 2", "stream": "https://1024terabox.com/s/ep2" }
          ]
        }
      ]
    }
  ]
}
```

For a single-season show, one `seasons[]` entry is enough. Episode titles are optional if you only show numbers.

---

## Playback (Terabox)

1. Item `stream` is often a **Terabox share URL**, not a direct MP4.  
2. Player calls `TERABOX_API` with `POST { url }` and header `X-Practice-Key`.  
3. Worker returns file list; app picks `fast_stream_url` (best quality) or `stream_url`.  
4. Plays via `<video>` + **hls.js** when the URL is HLS.  
5. Poster + 3D-style spinner until playback starts.  
6. Download button enables when a `download_url` (or equivalent) is present; click opens the file URL in a new tab so the browser/CDN can start the download.

Demo fallback video is used only if resolve fails and `DEMO_VIDEO` is set.

---

## Custom player (summary)

- Gestures: horizontal seek; right/center vertical **volume** (0–200% with Web Audio gain when available); left vertical **brightness** (0–1).  
- Volume HUD: **0–100% green** fill; **100–200% red** fill (bar resets at 100%).  
- Lock control, speed menu, aspect modes, fullscreen on the `.vp` container (not native video chrome).  
- Share: bottom sheet (Facebook, X, Telegram, WhatsApp, Reddit) + copy link (deep link `?v=&s=&e=` for series).  
- Related: compact carousel + “More like this” grid from the same category pool.

---

## Me page

| Row | Behavior |
|-----|----------|
| Login card | Guest label (“Browsing as guest”); login is demo toast only |
| My List / My Likes | `localStorage` ids (`tfp_list`, `tfp_likes`); detail page toggles |
| Watch History | Horizontal recent cards (current implementation uses catalog slice; views in `tfp_views`) |
| Our Social Media | Bottom sheet icon row (`SOCIAL_LINKS` in `app.js` — replace `#` hrefs with real URLs) |
| Request Movie / Series | Form: name, year (4 digits), contact → `sendRequestToChannel` |
| Settings | Toggles (`tfp_pref_*`), clear list/likes/views, **Clear account data** |

### Request pipeline

1. Prefer `POST REQUEST_API` with practice key; success body must be `{ "ok": true }` after a real Telegram send.  
2. If worker is not ready, fallback to Telegram Bot API using `TG_BOT_TOKEN` + `TG_CHAT_ID` in config (temporary).  
3. Production: put token/chat id in **Worker secrets** and use `worker-request-route.js` as the `/request` handler.

---

## In-app back button

`history.pushState` / `popstate` track tab, nav, focus, and detail so the phone back key steps through UI instead of exiting immediately.

Deep links: `?v=ITEM_ID`, optional `&s=seasonIndex&e=episodeIndex`.

---

## localStorage keys

| Key | Use |
|-----|-----|
| `tfp_list` | My List ids (JSON array) |
| `tfp_likes` | My Likes ids |
| `tfp_views` | Click counts object |
| `tfp_pref_autoplay` | Settings toggle |
| `tfp_pref_wifiDl` | Settings toggle |
| `tfp_pref_reduceMotion` | Settings toggle |

---

## Toasts

Plain text (no chip/box), single line, near the bottom of the screen. Success may prefix `✓`.

---

## Editing checklist (for humans and AIs)

**Add movies**

1. Prepend objects to `data/video.json` → `items`.  
2. Set `category` to a known tab category.  
3. Optional: put new ids at the front of `data/carousel.json` (keep ~15).  
4. Ensure `thumb` and `stream` are valid HTTPS URLs.

**Add series**

1. Prepend to `data/series.json` with `seasons[].episodes[].stream`.  
2. Same category/genre rules as movies.

**Change tabs**

1. Update `TABS`, `HOME_ORDER`, `DIRECT_CATS`, `ADULT_TABS`, `CAT_DATA` in `app.js` together.  
2. Update `categories.json`.  
3. Update this README.

**Do not**

- Strip adult categories or data without owner order.  
- Replace custom player with a third-party player unless asked.  
- Commit unrelated reformatting of entire `app.js` / `styles.css`.

---

## Cloudflare Worker (optional ops)

- **Terabox resolve:** already pointed at `TERABOX_API`.  
- **Requests:** implement `/request` using `worker-request-route.js`; set secrets `TG_BOT_TOKEN`, `TG_CHAT_ID`, `PRACTICE_KEY`.  
- This repo cannot deploy Workers by itself; the owner updates Cloudflare Dashboard / Wrangler.

---

## License / content note

Demo and catalog URLs are owner-supplied placeholders for UI development. Respect source and hosting terms when deploying publicly.
