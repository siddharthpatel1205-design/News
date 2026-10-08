// Admin analytics: one RPC call, lightweight SVG charts (no external library).
(async () => {
  const c = await NVAdmin.init("एनालिटिक्स"); if (!c) return;
  const E = NV.el, N = x => Number(x ?? 0).toLocaleString("en-IN"), NS = "http://www.w3.org/2000/svg";
  const top = E("div", { class: "row", style: "margin-bottom:12px" }), sel = E("select", { class: "ib", "aria-label": "अवधि" });
  [[7, "पिछले 7 दिन"], [14, "पिछले 14 दिन"], [30, "पिछले 30 दिन"], [90, "पिछले 90 दिन"]].forEach(([v, t]) => sel.append(E("option", { value: v }, t))); sel.value = 14;
  top.append(E("b", {}, "अवधि:"), sel); const body = E("div"); c.append(top, body);
  const svg = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  function chart(title, rows, key, color) {
    const W = 600, H = 170, P = 22, max = Math.max(1, ...rows.map(r => r[key])), bw = W / Math.max(1, rows.length);
    const s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": title, style: "width:100%;height:auto" });
    rows.forEach((r, i) => {
      const h = (H - P) * r[key] / max, b = svg("rect", { x: i * bw + 2, y: H - P - h, width: Math.max(2, bw - 4), height: h, fill: color, rx: 2 }), t = svg("title", {}); t.textContent = r.day + ": " + r[key]; b.append(t); s.append(b);
      if (rows.length <= 14 || i % Math.ceil(rows.length / 8) === 0) { const x = svg("text", { x: i * bw + bw / 2, y: H - 6, "text-anchor": "middle", "font-size": 10, fill: "currentColor" }); x.textContent = r.day.slice(0, 6); s.append(x); }
    });
    const d = E("div", { class: "dc" }); d.append(E("h2", {}, title), s); return d;
  }
  const tiles = arr => { const g = E("div", { class: "stats" }); arr.forEach(([t, v]) => { const d = E("div", { class: "stat" }); d.append(E("b", {}, v), t); g.append(d); }); return g; };
  const sec = (t, ...k) => { const w = E("section", { style: "margin-bottom:18px" }); w.append(E("h2", { style: "font-size:1.15rem" }, t), ...k); return w; };
  const topList = (t, rows) => { const d = E("div", { class: "dc" }); d.append(E("h2", {}, t)); if (!rows.length) d.append(E("p", { class: "muted" }, "अभी डेटा नहीं है।")); rows.forEach((r, i) => d.append(E("p", {}, (i + 1) + ". " + r.title + " — " + N(r.cnt)))); return d; };
  async function load() {
    body.replaceChildren(E("p", { class: "muted" }, "लोड हो रहा है…"));
    const { data: a, error } = await sb.rpc("admin_analytics", { p_days: Number(sel.value) });
    if (error || !a) return body.replaceChildren(E("p", { class: "msg err" }, "आँकड़े नहीं मिल सके। 11_analytics.sql चलाया है?"));
    const u = a.users, n = a.news, v = a.video, au = a.audio, m = a.messages, no = a.notifications, s = a.subscriptions, cp = a.coupons, ca = a.campaigns;
    const g = E("div", { class: "dg" }); g.append(chart("नए यूज़र (रोज़)", a.series, "users", "#0F4C81"), chart("खबरों के व्यू (रोज़)", a.series, "views", "#2E7D6B"));
    body.replaceChildren(
      g,
      sec("यूज़र", tiles([["कुल यूज़र", N(u.total)], ["नए (" + a.days + " दिन)", N(u.new)], ["सक्रिय (" + a.days + " दिन)", N(u.active)], ["अभी ऑनलाइन", N(u.online)], ["प्रीमियम", N(u.premium)], ["चालू ट्रायल", N(u.trial)]])),
      sec("खबरें", tiles([["कुल", N(n.total)], ["प्रकाशित", N(n.published)], ["ड्राफ़्ट", N(n.draft)], ["कुल व्यू", N(n.views)]]), E("div", { class: "dg", style: "margin-top:10px" }, topList("सबसे ज़्यादा पढ़ी", n.top_viewed), topList("सबसे ज़्यादा शेयर", n.top_shared), topList("सबसे ज़्यादा सेव", n.top_saved))),
      sec("वीडियो और ऑडियो", tiles([["वीडियो प्ले", N(v.plays)], ["वीडियो पूरे देखे", N(v.completed)], ["औसत देखा गया %", v.avg_watch + "%"], ["ऑडियो प्ले", N(au.plays)], ["ऑडियो पूरे सुने", N(au.completed)], ["ऑडियो पूरा होने की दर", au.completion_rate + "%"]])),
      sec("संदेश", tiles([["कुल बातचीत", N(m.conversations)], ["अनपढ़े", N(m.unread)], ["admin के जवाब", N(m.replies)]])),
      sec("नोटिफिकेशन", tiles([["भेजे गए", N(no.sent)], ["पढ़े गए", N(no.read)], ["पुश के लिए पंजीकृत डिवाइस", N(no.push_devices)]]), E("p", { class: "muted" }, "पुश की 'डिलीवरी' ब्राउज़र की ओर से पक्की नहीं बताई जाती, इसलिए यहाँ सिर्फ़ डिवाइस की संख्या दिखती है।")),
      sec("सब्सक्रिप्शन", tiles([["चालू", N(s.active)], ["खत्म", N(s.expired)], ["मासिक", N(s.monthly)], ["सालाना", N(s.annual)], ["चालू ट्रायल", N(s.trial_active)], ["खत्म ट्रायल", N(s.trial_expired)]])),
      sec("कूपन", tiles([["कुल कूपन", N(cp.total)], ["इस्तेमाल हुए", N(cp.used)], ["कुल छूट", "₹" + N(cp.discount)]])),
      sec("वीडियो कैंपेन", tiles([["दिखाया गया", N(ca.impressions)], ["शुरू हुआ", N(ca.started)], ["पूरा देखा", N(ca.completed)], ["स्किप", N(ca.skipped)], ["पूरा होने की दर", ca.completion_rate + "%"]]))
    );
  }
  sel.onchange = load; load();
})();
