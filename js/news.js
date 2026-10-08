// Data layer + article/category pages. All text goes in via textContent (XSS-safe).
const NVNews = {
  SEL: "id,title,summary,featured_image,category_id,tags,is_breaking,is_trending,is_premium,has_video,has_audio,created_at,view_count,categories(title,slug)",
  fmt(d) { return new Date(d).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }); },
  safeUrl(u) { try { const x = new URL(u, location.href); return ["http:", "https:"].includes(x.protocol) ? x.href : ""; } catch { return ""; } },
  card(n, i = 1) {
    const a = NV.el("a", { class: "card", href: "article.html?id=" + encodeURIComponent(n.id) });
    const src = this.safeUrl(n.featured_image) || NV.img(i);
    const b = NV.el("div", { class: "b" });
    const t = n.categories?.title || n.category_title;
    if (t) b.append(NV.el("span", { class: "tag" }, t));
    if (n.is_premium) b.append(NV.el("span", { class: "tag" }, "प्रीमियम"));
    b.append(NV.el("h3", {}, n.title), NV.el("small", {}, this.fmt(n.created_at)));
    a.append(NV.el("img", { src, alt: "", loading: i > 1 ? "lazy" : "eager" }), b);
    return a;
  },
  async categories() {
    if (!sb) return [];
    const { data } = await sb.from("categories").select("id,title,slug,image_url").eq("is_active", true).order("sort_order");
    return data || [];
  },
  async list(o = {}) {
    if (!sb) return [];
    const { limit = 12, offset = 0 } = o;
    let q = sb.from("news").select(this.SEL).eq("status", "published").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (o.categoryId) q = q.eq("category_id", o.categoryId);
    if (o.breaking) q = q.eq("is_breaking", true);
    if (o.trending) q = q.eq("is_trending", true);
    if (o.premium) q = q.eq("is_premium", true);
    if (o.video) q = q.eq("has_video", true);
    if (o.audio) q = q.eq("has_audio", true);
    if (o.exclude) q = q.neq("id", o.exclude);
    const { data } = await q; return data || [];
  }
};

// ---- Category page ----
async function pageCategory() {
  const slug = new URLSearchParams(location.search).get("c");
  const grid = document.getElementById("grid"), state = document.getElementById("state"), more = document.getElementById("more");
  const cats = await NVNews.categories(); const cat = cats.find(c => c.slug === slug);
  document.getElementById("title").textContent = cat ? cat.title : "सभी खबरें";
  let off = 0; const size = 12;
  async function load() {
    state.textContent = "लोड हो रहा है…"; more.hidden = true;
    const rows = await NVNews.list({ categoryId: cat?.id, limit: size, offset: off });
    rows.forEach((n, i) => grid.append(NVNews.card(n, off + i)));
    off += rows.length;
    state.textContent = grid.children.length ? "" : (sb ? "इस श्रेणी में अभी कोई खबर नहीं है।" : "Supabase अभी सेट नहीं है।");
    more.hidden = rows.length < size;
  }
  more.addEventListener("click", load); load();
}

// ---- Article page ----
async function pageArticle() {
  const id = new URLSearchParams(location.search).get("id"), root = document.getElementById("article");
  if (!sb || !id) return root.replaceChildren(NV.el("p", { class: "muted" }, "खबर उपलब्ध नहीं है।"));
  const { data: n } = await sb.rpc("get_article", { p_id: id });
  if (!n) return root.replaceChildren(NV.el("p", { class: "muted" }, "यह खबर नहीं मिली या हटा दी गई है।"));
  document.title = n.title + " | NEWSVERSE";
  try { const r = JSON.parse(localStorage.getItem("nv_recent_news") || "[]").filter(x => x.id !== id); r.unshift({ id, title: n.title }); localStorage.setItem("nv_recent_news", JSON.stringify(r.slice(0, 8))); } catch {}
  sb.rpc("increment_view", { p_id: id });
  const meta = [n.category_title, n.author_name, NVNews.fmt(n.created_at), (n.view_count || 0) + " बार पढ़ी गई"].filter(Boolean).join(" • ");
  root.replaceChildren(NV.el("h1", {}, n.title), NV.el("div", { class: "meta" }, meta));
  const img = NVNews.safeUrl(n.featured_image); if (img) root.append(NV.el("img", { class: "hero", src: img, alt: n.title }));
  const sess = await NVAuth.session();
  if (n.locked) {
    const box = NV.el("div", { class: "lock" });
    box.append(NV.el("h3", {}, "यह प्रीमियम खबर है"), NV.el("p", {}, n.summary || ""));
    const go = sess ? "subscription.html" : "login.html?next=" + encodeURIComponent("article.html?id=" + id);
    box.append(NV.el("a", { class: "btn", href: go }, sess ? "सब्सक्रिप्शन लें / ट्रायल शुरू करें" : "लॉगिन करें"));
    root.append(box);
  } else {
    const v = NVNews.safeUrl(n.video_url), a = NVNews.safeUrl(n.audio_url);
    if (v) { const ve = NV.el("video", { controls: "", preload: "metadata", src: v, playsinline: "" }); root.append(ve); if (window.NVAds) NVAds.attach(ve, { news: n, kind: "video" }); }
    if (a) root.append(NV.el("audio", { controls: "", preload: "none", src: a }));
    const body = NV.el("div", { class: "body" });
    (n.body || n.summary || "").split(/\n{2,}/).forEach(p => body.append(NV.el("p", {}, p)));
    root.append(body);
  }
  // actions: share / copy / save
  const acts = NV.el("div", { class: "acts" });
  const share = NV.el("button", { type: "button" }, "शेयर");
  share.onclick = () => navigator.share ? navigator.share({ title: n.title, url: location.href }).then(() => sb.rpc("increment_share", { p_id: id })).catch(() => {}) : copy.click();
  const copy = NV.el("button", { type: "button" }, "लिंक कॉपी करें");
  copy.onclick = async () => { try { await navigator.clipboard.writeText(location.href); copy.textContent = "कॉपी हो गया ✓"; sb.rpc("increment_share", { p_id: id }); } catch { copy.textContent = "कॉपी नहीं हुआ"; } };
  const save = NV.el("button", { type: "button" }, "सेव करें");
  acts.append(share, copy, save); root.append(acts);
  if (sess) {
    const uid = sess.user.id;
    const { data: ex } = await sb.from("saved_news").select("news_id").eq("user_id", uid).eq("news_id", id).maybeSingle();
    let saved = !!ex; const paint = () => save.textContent = saved ? "सेव है ✓" : "सेव करें"; paint();
    save.onclick = async () => {
      saved ? await sb.from("saved_news").delete().eq("user_id", uid).eq("news_id", id) : await sb.from("saved_news").insert({ user_id: uid, news_id: id });
      saved = !saved; paint();
    };
  } else save.onclick = () => location.href = "login.html?next=" + encodeURIComponent("article.html?id=" + id);
  // comments
  if (n.comments_enabled) {
    const sec = NV.el("section", { class: "sec" }); sec.append(NV.el("h2", {}, "कमेंट"));
    const list = NV.el("div"); const msg = NV.el("p", { class: "msg", role: "alert" });
    const load = async () => {
      const { data } = await sb.rpc("get_comments", { p_news: id });
      list.replaceChildren(...((data || []).map(c => {
        const d = NV.el("div", { class: "cm" }); d.append(NV.el("b", {}, c.author), NV.el("span", {}, c.body));
        if (sess && !c.mine) { const r = NV.el("button", { type: "button", class: "ib", style: "min-height:36px;margin-top:4px;font-size:.8rem" }, "रिपोर्ट करें");
          r.onclick = async () => { r.disabled = true; const { error } = await sb.from("comment_reports").insert({ comment_id: c.id, user_id: sess.user.id }); r.textContent = error ? (error.code === "23505" ? "पहले ही रिपोर्ट की" : "रिपोर्ट नहीं हो सकी") : "रिपोर्ट हो गई ✓"; }; d.append(r); }
        return d; })));
      if (!list.children.length) list.append(NV.el("p", { class: "muted" }, "अभी कोई कमेंट नहीं है।"));
    };
    if (sess) {
      const f = NV.el("form", { class: "cmform" }); const t = NV.el("textarea", { maxlength: "1000", "aria-label": "आपका कमेंट", placeholder: "अपनी राय लिखें…" });
      const b = NV.el("button", { class: "btn", type: "submit" }, "कमेंट भेजें"); f.append(t, b);
      f.onsubmit = async e => { e.preventDefault(); const text = t.value.trim(); if (!text) return;
        const { error } = await sb.from("comments").insert({ news_id: id, user_id: sess.user.id, body: text });
        if (error) { msg.className = "msg err"; msg.textContent = "कमेंट नहीं भेजा जा सका।"; } else { t.value = ""; msg.className = ""; msg.textContent = ""; load(); } };
      sec.append(f, msg);
    } else sec.append(NV.el("p", {}, "कमेंट करने के लिए लॉगिन करें।"));
    sec.append(list); root.append(sec); load();
  }
  // related
  const rel = await NVNews.list({ categoryId: n.category_id, exclude: id, limit: 3 });
  if (rel.length) { const s = NV.el("section", { class: "sec" }), g = NV.el("div", { class: "grid" }); rel.forEach((r, i) => g.append(NVNews.card(r, i + 2))); s.append(NV.el("h2", {}, "संबंधित खबरें"), g); root.append(s); }
}
document.addEventListener("DOMContentLoaded", () => {
  const p = document.body.dataset.page;
  if (p === "category") pageCategory(); else if (p === "article") pageArticle();
});
