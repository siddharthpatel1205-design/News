// Shared helpers. All text is inserted with textContent (XSS-safe).
const NV = {
  el(tag, attrs = {}, text = "") {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text) e.textContent = text;
    return e;
  },
  img(seed) { // placeholder image (inline SVG, no external request)
    const c = ["#0F4C81", "#2E7D6B", "#8E3B6E", "#B5651D", "#3D5A80"][seed % 5];
    return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='${c}'/><text x='50%' y='52%' fill='#fff' font-size='34' text-anchor='middle' font-family='sans-serif'>NEWSVERSE</text></svg>`);
  }
};
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
