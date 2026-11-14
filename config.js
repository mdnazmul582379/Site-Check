// Public config only. Never put API keys here.
window.TFP_CONFIG = {
  // Your Cloudflare Worker base (no trailing slash). Holds secrets server-side when possible.
  API_BASE: "https://movie-proxy.adsterrapremium00001.workers.dev",
  LIBRARY_PATH: "data/library.json",
  PAGE_SIZE: 20,
  SECTION_COUNT: 4,
  MAX_HOME_SECTIONS: 4,
  HERO_SLIDES: 4,
  // Used only if API fails and you still want a smoke-test player
  DEMO_VIDEO: "",
  // Play endpoint paths tried in order
  PLAY_PATHS: ["/play", "/stream", "/api/play"]
};
