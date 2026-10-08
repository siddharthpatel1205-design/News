// Homepage: live data from Supabase when configured, otherwise fictional sample data.
const SAMPLE = [
  ["India News", "नए शहरी बस नेटवर्क की शुरुआत, पहले चरण में 12 रूट"], ["Technology", "स्थानीय स्टार्टअप ने किसानों के लिए मौसम ऐप पेश किया"],
  ["खेल", "ज़िला स्तरीय क्रिकेट टूर्नामेंट का रोमांचक फाइनल"], ["शिक्षा", "सरकारी स्कूलों में डिजिटल कक्षाओं का विस्तार"],
  ["International News", "जलवायु सम्मेलन में नए समझौते पर चर्चा तेज़"], ["मनोरंजन", "क्षेत्रीय फ़िल्म महोत्सव में नई फ़िल्मों का प्रदर्शन"]
].map((s, i) => ({ id: "sample" + i, title: s[1], category_title: s[0], created_at: new Date().toISOString() }));

(async function () {
  const nav = document.getElementById("catNav"), tk = document.getElementById("ticker"), lead = document.getElementById("lead"), secs = document.getElementById("sections");
  const live = !!sb;
  nav.append(NV.el("a", { href: "index.html" }, "होम"));
  const cats = live ? await NVNews.categories() : [];
  cats.forEach(c => nav.append(NV.el("a", { href: "category.html?c=" + encodeURIComponent(c.slug) }, c.title)));
  const section = (title, rows, href) => {
    if (!rows.length) return;
    const s = NV.el("section", { class: "sec" }), g = NV.el("div", { class: "grid" });
    rows.forEach((n, i) => g.append(NVNews.card(n, i + 2)));
    const h = NV.el("h2", {}); h.append(href ? NV.el("a", { href }, title + " ›") : title);
    s.append(h, g); secs.append(s);
  };
  const latest = live ? await NVNews.list({ limit: 9 }) : SAMPLE;
  if (!latest.length) { lead.replaceChildren(NV.el("p", { class: "muted" }, "अभी कोई खबर प्रकाशित नहीं है।")); return; }
  lead.replaceChildren(...latest.slice(0, 3).map((n, i) => NVNews.card(n, i)));
  const brk = live ? await NVNews.list({ breaking: true, limit: 6 }) : SAMPLE.slice(0, 4);
  (brk.length ? brk : latest.slice(0, 5)).forEach(n => tk.append(NV.el("a", { href: "article.html?id=" + encodeURIComponent(n.id) }, n.title)));
  section("ताज़ा खबरें", latest.slice(3), "category.html");
  if (!live) return;
  section("ट्रेंडिंग", await NVNews.list({ trending: true, limit: 6 }));
  section("वीडियो न्यूज़", await NVNews.list({ video: true, limit: 3 }), "video.html");
  section("ऑडियो न्यूज़", await NVNews.list({ audio: true, limit: 3 }), "audio.html");
  section("प्रीमियम न्यूज़", await NVNews.list({ premium: true, limit: 3 }));
  for (const c of cats.slice(0, 6)) section(c.title, await NVNews.list({ categoryId: c.id, limit: 3 }), "category.html?c=" + encodeURIComponent(c.slug));
})();
