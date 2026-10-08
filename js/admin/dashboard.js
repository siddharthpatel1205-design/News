(async () => {
  const c = await NVAdmin.init("डैशबोर्ड"); if (!c) return;
  c.append(NV.el("p", { class: "muted" }, "लोड हो रहा है…"));
  const { data: s, error } = await sb.rpc("admin_stats");
  if (error) return c.replaceChildren(NV.el("p", { class: "msg err" }, "आँकड़े नहीं मिल सके। 05_admin.sql चलाया है?"));
  const cards = [["users","कुल यूज़र"],["online","अभी ऑनलाइन"],["news","कुल खबरें"],["published","प्रकाशित"],["drafts","ड्राफ़्ट"],["views","कुल व्यू"],["premium_users","प्रीमियम यूज़र"],["active_trials","चालू ट्रायल"],["active_campaigns","चालू कैंपेन"],["unread_messages","अनपढ़े संदेश"]];
  const g = NV.el("div", { class: "stats" });
  cards.forEach(([k, t]) => { const d = NV.el("div", { class: "stat" }); d.append(NV.el("b", {}, Number(s[k]).toLocaleString("en-IN")), t); g.append(d); });
  c.replaceChildren(g);
})();
