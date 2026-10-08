// Admin shell: guard + layout + shared helpers. UI guard only; real security is RLS/is_admin().
const NVAdmin = {
  me: null,
  LINKS: [["dashboard","डैशबोर्ड"],["news","खबरें"],["comments","कमेंट"],["categories","श्रेणियाँ"],["users","यूज़र"],["videos","वीडियो"],["audio","ऑडियो"],["messages","संदेश"],["notifications","नोटिफिकेशन"],["video-ads","वीडियो विज्ञापन"],["plans","प्लान"],["subscriptions","सब्सक्रिप्शन"],["coupons","कूपन"],["analytics","एनालिटिक्स"],["settings","सेटिंग्स"]],
  async init(title) {
    if (!sb) { document.body.classList.remove("pending"); document.body.textContent = "Supabase अभी सेट नहीं है (js/supabase.js)।"; return null; }
    this.me = await NVAuth.requireAdmin(); if (!this.me) return null;
    const E = NV.el, cur = location.pathname.split("/").pop().replace(".html", "");
    const side = E("aside", { class: "side", id: "side" }); side.append(E("h2", {}, "NEWSVERSE Admin"));
    this.LINKS.forEach(([k, t]) => { const a = E("a", { href: k + ".html" }, t); if (cur === k || (k === "news" && cur === "news-editor")) a.className = "on"; side.append(a); });
    const side2 = E("a", { href: "../index.html" }, "← वेबसाइट देखें"); side.append(side2);
    const bar = E("div", { class: "bar" }), menu = E("button", { class: "ib", id: "menu", type: "button", "aria-label": "मेन्यू" }, "☰");
    menu.onclick = () => side.classList.toggle("open");
    const out = E("button", { class: "ib", type: "button" }, "लॉगआउट"); out.onclick = async () => { await sb.auth.signOut(); location.href = "index.html"; };
    bar.append(menu, E("h1", {}, title), out);
    const main = E("div", { class: "mainad" }), content = E("main", { id: "content" }); main.append(bar, content);
    const root = E("div", { class: "ad" }); root.append(side, main);
    document.body.replaceChildren(root); document.body.classList.remove("pending");
    return content;
  },
  toast(text, ok = true) { const t = NV.el("div", { class: "toast " + (ok ? "ok" : "err"), role: "status" }, text); document.body.append(t); setTimeout(() => t.remove(), 3500); },
  // Validates type/size, uploads to a bucket, returns public URL
  async upload(bucket, file, maxMB, types) {
    if (!types.includes(file.type)) throw new Error("यह फ़ाइल प्रकार स्वीकार नहीं है।");
    if (file.size > maxMB * 1048576) throw new Error("फ़ाइल " + maxMB + " MB से बड़ी है।");
    const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
    const path = crypto.randomUUID() + "." + ext;
    const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) throw new Error("अपलोड नहीं हो सका। कृपया दोबारा कोशिश करें।");
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
  // Same checks, but returns the storage PATH (for private buckets such as ad-videos)
  async uploadPath(bucket, file, maxMB, types) {
    if (!types.includes(file.type)) throw new Error("यह फ़ाइल प्रकार स्वीकार नहीं है।");
    if (file.size > maxMB * 1048576) throw new Error("फ़ाइल " + maxMB + " MB से बड़ी है।");
    const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
    const path = crypto.randomUUID() + "." + ext;
    const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) throw new Error("अपलोड नहीं हो सका। कृपया दोबारा कोशिश करें।");
    return path;
  },
  // form helpers
  fld(label, input) { const l = NV.el("label"); l.append(label, input); return l; },
  inp(name, type = "text", attrs = {}) { return NV.el("input", { name, type, ...attrs }); },
  chk(name, label) { const l = NV.el("label", { class: "ck" }); l.append(NV.el("input", { type: "checkbox", name }), label); return l; },
  btn(text, cls, fn) { const b = NV.el("button", { class: "ib " + (cls || ""), type: "button" }, text); b.onclick = fn; return b; },
  table(heads, rows) {
    const w = NV.el("div", { class: "tw" }), t = NV.el("table"), h = NV.el("tr");
    heads.forEach(x => h.append(NV.el("th", {}, x))); t.append(h);
    rows.forEach(r => { const tr = NV.el("tr"); r.forEach(c => { const td = NV.el("td"); td.append(c instanceof Node ? c : String(c ?? "")); tr.append(td); }); t.append(tr); });
    w.append(t); return w;
  },
  localDT(iso) { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
};
