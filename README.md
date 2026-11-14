# TeraFastPlay Site (Preview)

মোবাইল-ফার্স্ট রেসপন্সিভ সাইট। ডেমো ডেটা দিয়ে UI দেখা যায়।

## ফাইল
- `index.html` — পেজ কাঠামো, লগইন শিট, নিচের মেনু
- `styles.css` — মোবাইল ও ডেস্কটপ লেআউট
- `app.js` — ট্যাব, সেকশন, See more (২০টি করে), লগইন ও প্লে গেটিং
- `config.js` — API URL এবং সেটিংস
- `data/library.json` — ডেমো ডেটা

## ক্যাটাগরি ফরম্যাট
`category` ফিল্ড: প্রথমে মেইন টাইপ, তারপর কমা দিয়ে জেনার।
- `movie,Drama,Adult,Horror`
- `web series,Crime`
- `adult,Adult`

## আসল সার্ভার যুক্ত করা
`config.js`-এর `API_BASE`-এ Worker URL বসান। দরকারি রুট:
- `GET  /library/list` — পাবলিক তালিকা (শিরোনাম, থাম্বনেইল, ক্যাটাগরি; লিংক নয়)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET  /play?id=` — লগইন করা ব্যবহারকারীর জন্য স্ট্রিম

## লাইব্রেরি তৈরি (JSON → সাইট)
প্রতিটি ভিডিও আলাদা রেকর্ডে থাকলে build script এপিসোড গ্রুপ করে:
```
python3 tools/build_library.py <json_ফোল্ডার> data/library.json <private_প্রাইভেট_ফাইল>
```
- `S01E01` ধরনের নাম থাকলে এক সিরিজে গ্রুপ হয়, কার্ড একটাই।
- একই মুভির একাধিক কোয়ালিটি একসাথে থাকে।
- পাবলিক ফাইলে কোনো লিংক থাকে না। লিংক শুধু প্রাইভেট ফাইলে, যেটা Worker-এ যাবে এবং GitHub-এ যাবে না।
