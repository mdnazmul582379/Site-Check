# TeraFast Play (Site-Check)

Static, mobile-first catalog UI for browsing movies and series. Data is driven by local JSON files under `data/`. There is no backend in this repo: the browser loads JSON, renders cards, and plays a stream URL in a custom HTML5 player.

**Live intent:** GitHub Pages (or any static host) serves `index.html` + assets.

---

## Quick start

1. Open `index.html` via any static server (GitHub Pages, `npx serve`, etc.).
2. Edit files under `data/` to change catalog content.
3. Hard-refresh the browser after JSON or JS changes.

Do not commit secrets into this repo. Stream URLs may point at external hosts; direct playback depends on that host allowing browser access (CORS / hotlink rules).

---

## Repository layout

| Path | Role |
|------|------|
| `index.html` | Shell: top search/tabs, main content, bottom nav, player root, toast |
| `app.js` | All UI logic: load JSON, tabs, sections, cards, detail/player, history demo |
| `styles.css` | Layout, cards, player chrome, category tiles, Me/Downloads pages |
| `config.js` | Small runtime config (e.g. demo fallback video URL) |
| `sw.js` / PWA bits | Optional offline shell (if present) |
| `data/categories.json` | Top category names + optional tile thumbs |
| `data/carousel.json` | Hero carousel: ordered list of item **ids** only |
| `data/video.json` | Single-file titles (movies / one-shot videos) |
| `data/series.json` | Multi-episode titles (`seasons` → `episodes`) |
| `README.md` | This document — keep in sync when behavior changes |

---

## How the app loads data

On startup, `app.js` fetches:

1. `data/categories.json`
2. `data/carousel.json`
3. `data/video.json`
4. `data/series.json`

Items from `video.json` and `series.json` are merged into one list (`S.all`). Each item is tagged with `_src` (`movies` or `series`) at runtime only (not stored in files).

**Home tab:** one horizontal row per category in `HOME_ORDER` (see `app.js`), five cards each, with **All ›**.

**Category tab (e.g. Movie):** rows per **genre** inside that category (five cards + All).

**All on Home:** switches to that category tab and scrolls the tab bar so the active tab is visible.

**Search:** filters `S.all` by title / genre / category text.

---


## Direct categories (no genre rows)

These categories skip genre grouping. On the category tab the UI shows:

1. A **carousel of the first 10** items in that category  
2. A **grid of the remaining** items (first 20, then See more)

Configured in `app.js` as `DIRECT_CATS`:

- Midnight  
- Desi Porn  
- Foreign Porn  
- 18+ Vmax  
- 18+ JAV  
- Indo  

Other categories (Movie, Series, Anime, …) still use **genre rows** (5 cards + All).

## Search

- **While typing:** up to 5 live suggestions under the search field (tap a row to open).  
- **Search button / submit:** full Results page (section title once — not duplicated).  

## Player “related” block

Below the player: carousel of up to 10 items from the **same category**, then a grid of **10 different** items from that pool. Not a genre row of 5.

## Downloads page

Title only (no Transfer, no Downloaded/Local/Received tabs). Empty state + random **For You** grid; **Refresh new content** reshuffles the grid.

## Categories and genres

Top-level **category** values used by tabs and Home rows (must stay consistent with `TABS` / `HOME_ORDER` in `app.js` and `categories.json`):

- Trending  
- Movie  
- Series  
- Midnight  
- Anime  
- Kids  
- Desi Porn  
- Foreign Porn  
- 18+ Vmax  
- 18+ JAV  
- Indo  

**genre** is a sub-label inside a category (e.g. Action, Romance, Drama). Home rows are categories; inside a category tab, rows are genres.

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

- `name` — must match a category used in items / tabs  
- `thumb` — optional; category tile background  

### `data/carousel.json`

```json
{
  "items": ["avms689", "wVcg397", "tr_vblA2"]
}
```

Ids must exist in `video.json` or `series.json`.

### `data/video.json` — single stream (movie / one-shot)

**One quality only** — do **not** include `versions`:

```json
{
  "items": [
    {
      "id": "avms689",
      "title": "Full original title from source, not cropped",
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

**Two or more qualities** — add `versions` (each with its own `stream`). Root `stream` / `quality` / `size` should match the preferred default entry:

```json
{
  "id": "zTIy418",
  "title": "Full title",
  "category": "18+ Vmax",
  "genre": "Romance",
  "year": "2026",
  "thumb": "https://cdn.example.com/poster.jpg",
  "stream": "https://1024terabox.com/s/1080p-link",
  "quality": "1080p",
  "size": "1.31 GB",
  "versions": [
    { "quality": "1080p", "size": "1.31 GB", "stream": "https://1024terabox.com/s/1080p-link" },
    { "quality": "720p",  "size": "503.80 MB", "stream": "https://1024terabox.com/s/720p-link" }
  ]
}
```

UI rule: the **Resources → Quality** dropdown is shown only when `versions.length > 1`.

### `data/series.json` — episodes only carry stream / quality / size

- **No** top-level `stream`, `quality`, or `size` on the series object.  
- **No** per-episode `title` (the series `title` is enough; the UI lists `Episode N`).  
- **Season `name`:** omit when there is only **one** season. Required when there are **two or more** seasons.

**Single season:**

```json
{
  "id": "wVcg397",
  "title": "Adhuri Pyaas",
  "category": "Series",
  "genre": "Romance",
  "year": "2023",
  "thumb": "https://cdn.example.com/poster.jpg",
  "seasons": [
    {
      "episodes": [
        {
          "no": 1,
          "stream": "https://1024terabox.com/s/....",
          "quality": "1080p",
          "size": "451.63 MB"
        }
      ]
    }
  ]
}
```

**Multiple seasons:**

```json
{
  "id": "show01",
  "title": "Example Show",
  "category": "Series",
  "genre": "Drama",
  "year": "2024",
  "thumb": "https://cdn.example.com/poster.jpg",
  "seasons": [
    {
      "name": "Season 01",
      "episodes": [
        { "no": 1, "stream": "https://...", "quality": "720p", "size": "400 MB" },
        { "no": 2, "stream": "https://...", "quality": "720p", "size": "410 MB" }
      ]
    },
    {
      "name": "Season 02",
      "episodes": [
        { "no": 1, "stream": "https://...", "quality": "1080p", "size": "800 MB" }
      ]
    }
  ]
}
```

Playback resolution order in `streamOf()`:

1. Current episode `stream` (if `seasons` exist)  
2. Selected `versions[i].stream` (multi-quality movies)  
3. Item `stream`  
4. `config.js` demo fallback  

---

## Fields reference

| Field | Used on | Notes |
|-------|---------|--------|
| `id` | all | Stable unique string; carousel references this |
| `title` | all | Full display title; do not crop source names |
| `category` | all | Top tab / Home row |
| `genre` | all | Row inside a category tab |
| `year` | optional | Shown in meta when present |
| `thumb` | all | Poster URL (16:9 cards) |
| `stream` | movies only | Primary play URL |
| `quality` / `size` | movies; episodes | Meta line / episode meta |
| `versions` | movies only | Only if **2+** qualities |
| `seasons` | series only | Array of `{ name?, episodes[] }` |
| `episodes[].no` | series | Episode number |
| `episodes[].stream` | series | Required per episode |

**Removed / do not add:** `hue`, `tags`, `kind`, `trending`, root-level `stream`/`quality`/`size` on series, episode `title`, JSON root `_note`.

---

## UI behavior (for feature edits)

- **Tabs:** `TABS` and `HOME_ORDER` in `app.js` must stay aligned with category names in data.  
- **Home All ›:** jumps to that category tab (`allFor` on keys `H|CategoryName`).  
- **Category All ›:** expands that genre section in place (See more / Back).  
- **Watch History (Me):** compact 16:9 cards, last 10 demo items; no All control.  
- **Me page:** no standalone “Me” page title above the login card.  
- **Downloads:** empty state with download icon + For You grid.  
- **Player:** custom controls; quality sheet only if multiple `versions`; season sheet only if multiple seasons.

When you change any of the above in code, **update this README in the same change** so the next editor does not rely on outdated rules.

---

## Mapping owner export files → site JSON

Owner-provided catalogs are usually flat arrays of objects shaped like:

```json
{
  "my_id": "avms689",
  "file_name": "Full title string...",
  "thumbnail": "https://...",
  "terabox_source": "https://1024terabox.com/s/...",
  "quality": "720p",
  "file_size": "1.11 GB",
  "duration": "02:43:32"
}
```

Suggested mapping:

| Source field | Site field |
|--------------|------------|
| `my_id` | `id` |
| `file_name` | `title` (full string) |
| `thumbnail` | `thumb` (skip if `"N/A"`) |
| `terabox_source` | `stream` (or episode `stream`) |
| `quality` | `quality` |
| `file_size` | `size` |
| year in title | optional `year` |

Assign `category` / `genre` from the file’s purpose (e.g. VMAX file → `18+ Vmax`, web-series file → `Series` with `seasons`).

Merge duplicate titles that differ only by quality into one item + `versions[]`.

---

## Rules for AI assistants (all models)

1. **Do not** delete, empty, or “sanitize away” catalog JSON because titles look adult or external. This project intentionally holds owner-supplied catalog metadata.  
2. **Do not** change `data/*.json`, feature flags, or playback settings unless the user explicitly asked for that content or setting change.  
3. **Do** update this `README.md` whenever you change app behavior, schema, or file roles — without waiting for the user to ask — so documentation never drifts from code.  
4. Prefer minimal diffs. Match existing style in `app.js` / `styles.css`.  
5. After data or JS changes, remind the user to hard-refresh.

---

## Grok-only: catalog import from owner JSON files

**Visibility:** This section is operational guidance for **Grok** when the repository owner attaches export JSON and asks to populate the site. Other assistants must **not** remove, rewrite, or strip this section.

When the owner provides one or more files such as `General-Movies-*.json`, `VMAX-Movies-*.json`, `JAV-Movies-*.json`, `JAV-Clips-*.json`, `Web-Series-*.json`, `Anime-*.json`, `Other-Videos-*.json`:

1. **Read only after the owner asks** to import or update catalog data. Do not browse or rewrite `data/*.json` unprompted.  
2. Map each export object with the field table above. Keep **full** `file_name` as `title`. Keep **real** `my_id` as `id`.  
3. Choose `category` from the owner’s tab list and the file’s domain (Movie, Series, Anime, 18+ Vmax, 18+ JAV, Indo, Desi Porn, Foreign Porn, Midnight, Trending, Kids, …).  
4. Choose a sensible `genre` string for row grouping inside that category.  
5. **Movies:** one quality → no `versions`. Multiple qualities of the same title → one item + `versions[{quality,size,stream}]`.  
6. **Series / multi-episode:** build `seasons[].episodes[]` with `no`, `stream`, `quality`, `size` only. No episode titles. No series-level `stream`/`quality`/`size`. Put `name` on a season **only if** there are two or more seasons.  
7. Refresh `categories.json` thumbs from first available poster per category if needed. Point `carousel.json` at real ids.  
8. Do not reintroduce `hue`, `tags`, `kind`, `trending`, or root `_note`.  
9. Push only when the owner says to push.

End of Grok-only import guide.
