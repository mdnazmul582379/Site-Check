// আসল Worker API URL এখানে বসান, যেমন: "https://terafastplay.<sub>.workers.dev"
// খালি থাকলে সাইট ডেমো ডেটা দেখাবে, আর লগইন বাটন "সার্ভার সংযুক্ত নয়" বলবে।
window.TFP_CONFIG = {
  API_BASE: "",
  LIBRARY_PATH: "data/library.json", // API_BASE থাকলে /library/list ব্যবহার হবে
  PAGE_SIZE: 20,                    // See more-এ প্রতিবার কতটি
  SECTION_COUNT: 4,                 // হোমে প্রতি সেকশনে কতটি
};
