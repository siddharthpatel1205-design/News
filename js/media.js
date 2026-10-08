// Shared video/audio news page. Premium media URL comes only from get_article (server checks access).
// Phase 10 hook: if window.NVAds exists, NVAds.attach(element, {news, kind}) enables mid-roll campaigns.
const NVMedia = {
  async page(kind) {
    const E = NV.el, $ = i => document.getElementById(i), id = new URLSearchParams(location.search).get("id");
    const player = $("player"), grid = $("grid"), state = $("state"), more = $("more");
    $("ptitle").textContent = kind === "video" ? "वीडियो न्यूज़" : "ऑडियो न्यूज़";
    if (!sb) { state.textContent = "Supabase अभी सेट नहीं है।"; return; }
    const sess = await NVAuth.session(), uid = sess ? sess.user.id : null;
    if (id) {
      const { data: n } = await sb.rpc("get_article", { p_id: id });
      if (!n) player.append(E("p", { class: "muted" }, "यह खबर नहीं मिली।"));
      else if (n.locked) {
        const box = E("div", { class: "lock" }); box.append(E("h3", {}, n.title), E("p", {}, "यह प्रीमियम सामग्री है।"));
        box.append(E("a", { class: "btn", href: uid ? "subscription.html" : "login.html?next=" + encodeURIComponent(kind + ".html?id=" + id) }, uid ? "सब्सक्रिप्शन लें / ट्रायल शुरू करें" : "लॉगिन करें"));
        player.append(box);
      } else {
        const src = NVNews.safeUrl(n[kind + "_url"]);
        if (!src) player.append(E("p", { class: "muted" }, "इस खबर में " + (kind === "video" ? "वीडियो" : "ऑडियो") + " नहीं है।"));
        else {
          const at = { controls: "", preload: "metadata", src, playsinline: "" }, poster = NVNews.safeUrl(n.featured_image);
          if (kind === "video" && poster) at.poster = poster;
          const el = E(kind, at); let played = false;
          const log = ev => { const pct = el.duration ? Math.min(100, Math.round(el.currentTime / el.duration * 100)) : 0;
            sb.from("media_events").insert({ news_id: n.id, user_id: uid, kind, event_type: ev, percent: pct }).then(() => {}); };
          el.addEventListener("play", () => { if (!played) { played = true; log("play"); } });
          el.addEventListener("pause", () => { if (!el.ended && played) log("pause"); });
          el.addEventListener("ended", () => log("complete"));
          el.addEventListener("error", () => { state.textContent = "प्लेयर चल नहीं सका। कृपया दोबारा कोशिश करें।"; });
          player.append(el, E("h2", {}, n.title), E("a", { class: "btn", href: "article.html?id=" + encodeURIComponent(n.id) }, "पूरी खबर पढ़ें"));
          if (window.NVAds) NVAds.attach(el, { news: n, kind });
        }
      }
    }
    let off = 0; const size = 12;
    async function load() {
      state.textContent = "लोड हो रहा है…"; more.hidden = true;
      const rows = await NVNews.list({ [kind]: true, limit: size, offset: off, exclude: id || undefined });
      rows.forEach((n, i) => { const c = NVNews.card(n, off + i + 1); c.href = kind + ".html?id=" + encodeURIComponent(n.id); grid.append(c); });
      off += rows.length; state.textContent = grid.children.length ? "" : "अभी कोई " + (kind === "video" ? "वीडियो" : "ऑडियो") + " खबर नहीं है।";
      more.hidden = rows.length < size;
    }
    more.addEventListener("click", load); load();
  }
};
