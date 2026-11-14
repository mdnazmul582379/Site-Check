#!/usr/bin/env python3
"""
JSON ফাইল (প্রতিটি ভিডিও আলাদা রেকর্ড) → এপিসোড গ্রুপ করা লাইব্রেরি।

ব্যবহার:
  python3 tools/build_library.py <json_dir> <public_out.json> <private_out.json>

public_out  : সাইটের জন্য। শুধু শিরোনাম, থাম্বনেইল, ক্যাটাগরি, এপিসোড তালিকা। কোনো লিংক নেই।
private_out : শুধু Worker-এর জন্য। my_id → terabox লিংক। এটা কখনো GitHub-এ commit করবেন না।
"""
import json, re, sys, os, glob
from collections import defaultdict

EP_RE = re.compile(r"\bS(\d{1,2})E(\d{1,3})", re.I)
YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
TAG_RE = re.compile(
    r"\b(UNRATED|HDRip|HDRIP|WEB[-\s]?DL|WEB[-\s]?Rip|BluRay|HEVC|x26[45]|1080p|720p|480p|4K|"
    r"ESub|ESUB|VMAX|VIVAMAX|Hindi|Hot|Korean|Chinese|Turkish|Tagalog|Multi|HDTC|HDCAM|HDTS|"
    r"AMZN|DSNP|DDP|10bit|KatM\w*|Katmovie\w*|PrimeShots|FeniApp|MoodX|DigimoviePlex|Tabii|Netflix)\b",
    re.I,
)
ADULT_RE = re.compile(
    r"\[18\+\]|UNRATED|\bHot\b|VMAX|VIVAMAX|\bSex\w*|Erotic|Moaning|Kissing|Shirtless|Hot Series|Hot Web",
    re.I,
)

def clean_title(name):
    s = re.sub(r"\[[^\]]*\]", " ", name)          # [18+], [Animedubhindi com], [@YKD ...]
    cuts = []
    for rx in (EP_RE, YEAR_RE, TAG_RE):
        m = rx.search(s)
        if m:
            cuts.append(m.start())
    m = re.search(r"\s[|(]|\sll\s|\s\|", s)
    if m:
        cuts.append(m.start())
    t = s[: min(cuts)] if cuts else s
    t = re.sub(r"\s+", " ", t).strip(" -–|:,.(")
    return t or name.strip()

def norm_key(t):
    return re.sub(r"[^a-z0-9]", "", t.lower())

def year_of(name):
    m = YEAR_RE.search(name)
    return m.group(0) if m else ""

def genre_of(name, source, adult):
    if adult:
        n = name.lower()
        if re.search(r"tagalog|vivamax|filipino|pinoy|pilipino|\bang\b|\bng\b|\bkay\b|\bmga\b", n):
            return "Filipino"
        if re.search(r"korean|cashero|doctor stranger|\bk-?drama", n):
            return "Korean"
        if "chinese" in n:
            return "Chinese"
        if re.search(r"hindi|lovely ladies|araro|bandi|locust", n):
            return "Hindi"
        return "Adult"
    n = name.lower()
    if "anime" in source.lower():
        return "Anime"
    if "korean" in n or "k-drama" in n or "ykd" in n:
        return "Korean Drama"
    if "turkish" in n or "archer" in n:
        return "Turkish"
    if "chinese" in n:
        return "Chinese"
    if re.search(r"jailer|tamil|telugu|kannada|malayalam", n):
        return "South Indian"
    if re.search(r"hindi|bollywood|drishyam", n):
        return "Bollywood"
    if re.search(r"hulk|iron man|thor|english|hollywood", n):
        return "Hollywood"
    if "horror" in n:
        return "Horror"
    return "Drama" if source.lower().find("episode") >= 0 or source.lower().find("web") >= 0 else "General"

def main():
    src_dir, pub_out, priv_out = sys.argv[1:4]
    overrides_path = sys.argv[4] if len(sys.argv) > 4 else None
    cats_out = os.path.join(os.path.dirname(os.path.abspath(pub_out)), "categories.csv")
    records = []
    for f in sorted(glob.glob(os.path.join(src_dir, "*.json"))):
        src = os.path.basename(f)
        for r in json.load(open(f, encoding="utf-8")):
            r["_source"] = src
            records.append(r)

    # প্রাইভেট ম্যাপ (শুধু Worker-এর জন্য)
    private = {}
    for r in records:
        if r.get("terabox_source"):
            private[r["my_id"]] = {
                "file_name": r.get("file_name", ""),
                "terabox_source": r["terabox_source"],
            }

    groups = defaultdict(list)
    for r in records:
        name = r.get("file_name", "")
        title = clean_title(name)
        m = EP_RE.search(name)
        season = int(m.group(1)) if m else None
        episode = int(m.group(2)) if m else None
        adult = bool(ADULT_RE.search(name)) or "[18+]" in name
        groups[norm_key(title)].append({
            "rec": r, "title": title, "season": season, "episode": episode,
            "adult": adult, "name": name,
        })

    items = []
    for key, members in groups.items():
        ep_members = [m for m in members if m["episode"] is not None]
        plain = [m for m in members if m["episode"] is None]
        title = members[0]["title"]
        adult = any(m["adult"] for m in members)
        source = members[0]["rec"]["_source"]
        genre = genre_of(members[0]["name"], source, adult)

        def version(m):
            r = m["rec"]
            return {"id": r["my_id"], "quality": r.get("quality", ""),
                    "size": r.get("file_size", ""), "duration": r.get("duration", "")}

        if ep_members:
            # একই সিজন+এপিসোড একাধিকবার থাকলে একটাই এপিসোড, বাকিগুলো ভার্সন হিসেবে
            eps = {}
            for m in ep_members:
                k = (m["season"], m["episode"])
                eps.setdefault(k, []).append(m)
            episodes = []
            for (s, e) in sorted(eps):
                vers = sorted((version(m) for m in eps[(s, e)]),
                              key=lambda v: -int(re.sub(r"\D", "", v["quality"]) or 0))
                episodes.append({
                    "season": s, "episode": e, "label": f"S{s:02d}E{e:02d}",
                    "id": vers[0]["id"], "quality": vers[0]["quality"],
                    "size": vers[0]["size"], "duration": vers[0]["duration"],
                    "versions": vers,
                })
            # সিরিজের বাইরে থাকা কিন্তু একই নামের বাকি ফাইল (এপিসোড নম্বর নেই) আলাদা কার্ড হবে
            for m in plain:
                items.append(make_movie(m, title, adult, genre, version))
            first = episodes[0]
            items.append({
                "id": first["id"], "kind": "series", "title": title,
                "category": f"{'adult' if adult else 'series'},{genre}",
                "thumbnail": members[0]["rec"].get("thumbnail", ""),
                "year": year_of(members[0]["name"]),
                "quality": max((e["quality"] for e in episodes), key=lambda q: int(re.sub(r"\D","",q) or 0)),
                "seasons": sorted({e["season"] for e in episodes}),
                "episodes": episodes,
            })
        else:
            items.append(make_movie_group(plain, title, adult, genre, version))

    # ম্যানুয়াল ওভাররাইড: categories.csv-এ title,type,genre — আপনি এখানে জেনার বদলাতে পারবেন
    if overrides_path and os.path.exists(overrides_path):
        import csv
        ov = {}
        with open(overrides_path, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                t = (row.get("title") or "").strip().lower()
                if t and (row.get("genre") or "").strip():
                    ov[t] = ((row.get("type") or "movie").strip().lower(), row["genre"].strip())
        applied = 0
        for it in items:
            key = it["title"].strip().lower()
            if key in ov:
                typ, genre = ov[key]
                it["category"] = f"{typ},{genre}"
                applied += 1
        print(f"ওভাররাইড প্রয়োগ: {applied}")

    items.sort(key=lambda it: (it["category"].split(",")[0], it["title"].lower()))
    for i, it in enumerate(items):
        it["trending"] = i % 9 == 0   # একটা সাধারণ ট্রেন্ডিং নমুনা (পরে বদলানো যাবে)
        it["cid"] = f"c{i+1:04d}"

    # পাবলিক ফাইল: লিংক একদম নেই
    public = {"items": items}
    dump = json.dumps(public, ensure_ascii=False, indent=2)
    assert "terabox" not in dump.lower(), "লিংক পাবলিক ফাইলে ঢুকে গেছে!"
    with open(pub_out, "w", encoding="utf-8") as f:
        f.write(dump)
    with open(priv_out, "w", encoding="utf-8") as f:
        json.dump(private, f, ensure_ascii=False, indent=2)

    import csv
    with open(cats_out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["title", "type", "genre", "kind", "cards_count_hint"])
        seen = set()
        for it in items:
            key = it["title"].strip().lower()
            if key in seen:
                continue
            seen.add(key)
            typ, genre = it["category"].split(",", 1)
            w.writerow([it["title"], typ, genre, it["kind"], len(it.get("episodes", it.get("versions", [])))])
    print(f"ক্যাটাগরি ফাইল: {cats_out}")

    series = [i for i in items if i["kind"] == "series"]
    movies = [i for i in items if i["kind"] == "movie"]
    print(f"records: {len(records)} → cards: {len(items)} (series {len(series)}, movies {len(movies)})")
    print(f"episodes total: {sum(len(s['episodes']) for s in series)}")
    print(f"private links: {len(private)}")

def make_movie(m, title, adult, genre, version):
    r = m["rec"]
    return {
        "id": r["my_id"], "kind": "movie", "title": clean_title(m["name"]),
        "category": f"{'adult' if adult else 'movie'},{genre}",
        "thumbnail": r.get("thumbnail", ""), "year": year_of(m["name"]),
        "quality": r.get("quality", ""), "duration": r.get("duration", ""),
        "versions": [version(m)],
    }

def make_movie_group(plain, title, adult, genre, version):
    vers = sorted((version(m) for m in plain),
                  key=lambda v: -int(re.sub(r"\D", "", v["quality"]) or 0))
    best = plain[0]
    return {
        "id": vers[0]["id"], "kind": "movie", "title": title,
        "category": f"{'adult' if adult else 'movie'},{genre}",
        "thumbnail": best["rec"].get("thumbnail", ""),
        "year": year_of(best["name"]),
        "quality": vers[0]["quality"], "duration": vers[0]["duration"],
        "versions": vers,
    }

if __name__ == "__main__":
    main()
