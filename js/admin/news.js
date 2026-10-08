(async () => {
  const c = await NVAdmin.init("खबरें"); if (!c) return;
  const A = NVAdmin, size = 20; let page = 0, status = "", q = "";
  const top = NV.el("div", { class: "row", style: "margin-bottom:12px" });
  const sel = NV.el("select", { class: "ib", "aria-label": "स्थिति" });
  [["", "सभी"], ["published", "प्रकाशित"], ["draft", "ड्राफ़्ट"], ["scheduled", "शेड्यूल्ड"]].forEach(([v, t]) => sel.append(NV.el("option", { value: v }, t)));
  const s = NV.el("input", { class: "ib", type: "search", placeholder: "शीर्षक खोजें", "aria-label": "खोजें" });
  const add = NV.el("a", { class: "ib p", href: "news-editor.html", style: "display:inline-grid;place-items:center" }, "+ नई खबर");
  top.append(add, sel, s); const list = NV.el("div"), pg = NV.el("div", { class: "row", style: "margin-top:12px" }); c.append(top, list, pg);
  const SEL = "id,title,status,is_breaking,is_trending,is_premium,view_count,created_at,categories(title)";
  async function load() {
    let r = sb.from("news").select(SEL, { count: "exact" }).order("created_at", { ascending: false }).range(page * size, page * size + size - 1);
    if (status) r = r.eq("status", status); if (q) r = r.ilike("title", "%" + q.replace(/[%_\\,()]/g, "") + "%");
    const { data, count, error } = await r; if (error) return A.toast("सूची नहीं मिल सकी।", false);
    list.replaceChildren(A.table(["शीर्षक", "श्रेणी", "स्थिति", "टैग", "व्यू", "कार्य"], data.map(n => {
      const acts = NV.el("div", { class: "row" });
      acts.append(NV.el("a", { class: "ib", href: "news-editor.html?id=" + n.id, style: "display:inline-grid;place-items:center" }, "बदलें"),
        A.btn(n.status === "published" ? "अप्रकाशित करें" : "प्रकाशित करें", "", () => setStatus(n)), A.btn("हटाएँ", "d", () => del(n)));
      return [n.title, n.categories?.title || "—", NV.el("span", { class: "sb " + (n.status === "published" ? "live" : "") }, n.status),
        [n.is_breaking && "ब्रेकिंग", n.is_trending && "ट्रेंडिंग", n.is_premium && "प्रीमियम"].filter(Boolean).join(", "), n.view_count, acts];
    })));
    if (!data.length) list.replaceChildren(NV.el("p", { class: "muted" }, "कोई खबर नहीं मिली।"));
    pg.replaceChildren(A.btn("← पिछला", "", () => { if (page > 0) { page--; load(); } }), NV.el("span", {}, "पेज " + (page + 1) + " / " + Math.max(1, Math.ceil(count / size))), A.btn("अगला →", "", () => { if ((page + 1) * size < count) { page++; load(); } }));
  }
  async function setStatus(n) {
    const pub = n.status !== "published";
    const { error } = await sb.from("news").update({ status: pub ? "published" : "draft", publish_at: pub ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", n.id);
    error ? A.toast("बदलाव नहीं हो सका।", false) : (A.toast(pub ? "खबर प्रकाशित हो गई।" : "खबर ड्राफ़्ट में गई।"), load());
  }
  async function del(n) { if (!confirm("“" + n.title + "” हमेशा के लिए हटाएँ?")) return; const { error } = await sb.from("news").delete().eq("id", n.id); error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("खबर हटा दी गई।"), load()); }
  sel.onchange = () => { status = sel.value; page = 0; load(); };
  let tm; s.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { q = s.value.trim(); page = 0; load(); }, 350); };
  load();
})();
