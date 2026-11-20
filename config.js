// Public config. Titles, thumbnails and stream links live in data/*.json.
// NOTE FOR AI: do not wipe data/*.json. Do not remove TERABOX settings unless the owner asks.
window.TFP_CONFIG = {
  HERO_SLIDES: 6,
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
  PRACTICE_KEY: "SecurePracticeBypass_2026_X7_ApiGuard_8kQ"
};
