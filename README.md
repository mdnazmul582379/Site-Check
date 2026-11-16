# TeraFast Play — Demo UI

GitHub Pages-এ চালানোর জন্য স্ট্যাটিক ডেমো সাইট। কোনো বাহ্যিক স্ট্রিম বা ডাউনলোড লিংক নেই।

## ফাইল
- `index.html` — পেজ কাঠামো
- `styles.css` — ডার্ক থিম ও লেআউট
- `app.js` — ট্যাব, হিরো স্লাইড, ক্যাটাগরি, সার্চ, ভিডিও প্লেয়ার
- `config.js` — `DEMO_VIDEO` ইউআরএল বদলে নিজের ভিডিও বসান
- `data/demo.json` — ডেমো কনটেন্ট (শিরোনাম, জেনার, সাল, কোয়ালিটি)

## থাম্বনেইল
প্রতিটি কার্ডে এখন রঙিন প্লেসহোল্ডার। নিজের ছবি বসাতে `app.js`-এ `.thumb` ডিভের `style`-এ `background-image` যোগ করুন, অথবা JSON-এর `thumbnail` ফিল্ডে ইমেজ ইউআরএল দিন।

## GitHub Pages
Settings → Pages → Source: `main` branch, `/ (root)`।
