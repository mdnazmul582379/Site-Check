// Public config. Titles, thumbnails and stream links live in data/*.json.
// NOTE FOR AI: do not wipe data/*.json. Do not remove TERABOX settings unless the owner asks.
window.TFP_CONFIG = {
  HERO_SLIDES: 15,
  PAGE: 5,
  PREVIEW: 20,
  STEP: 20,
  // Fallback only if a title has no stream and API fails
  DEMO_VIDEO: "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",
  DEMO_SOURCES: [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  ],
  // Terabox share links are resolved through this worker before playback
  TERABOX_API: "https://movie-proxy.adsterrapremium00001.workers.dev/terabox",
  PRACTICE_KEY: "SecurePracticeBypass_2026_X7_ApiGuard_8kQ",
  // Temporary (owner will revoke): request bot — prefer moving to Worker secrets later
  REQUEST_API: "https://movie-proxy.adsterrapremium00001.workers.dev/request",
  TG_BOT_TOKEN: "7122933139:AAEI_4V2N9rkgerqJRecSaZ3OGo70-6JxKA",
  TG_CHAT_ID: "-1003998959961"
};
