// Public config. Titles, thumbnails and stream links live in data/*.json.
window.TFP_CONFIG = {
  // Used when an item has no "stream". Also the first fallback for every item.
  DEMO_VIDEO: "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",
  // Tried in order if the current video fails to load.
  DEMO_SOURCES: [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://www.w3schools.com/html/mov_bbb.mp4"
  ],
  HERO_SLIDES: 6,
  PAGE: 5
};
