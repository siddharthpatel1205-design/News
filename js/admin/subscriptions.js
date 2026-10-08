(async () => {
  const c = await NVAdmin.init("सब्सक्रिप्शन और ट्रायल"); if (!c) return;
  const A = NVAdmin, E = NV.el, now = new Date().toISOString(), dt = d => new Date(d).toLocaleDateString("hi-IN");
  const cnt = async (t, fn) => { const { count } = await fn(sb.from(t).select("*", { count: "exact", head: true })); return count || 0; };
  const [as, at, et] = await Promise.all([cnt("subscriptions", q => q.eq("status", "active").gt("expires_at", now)), cnt("trial_usage", q => q.gt("expires_at", now)), cnt("trial_usage", q => q.lte("expires_at", now))]);
  const g = E("div", { class: "stats" }); [["चालू सब्सक्रिप्शन", as], ["चालू ट्रायल", at], ["खत्म ट्रायल", et]].forEach(([t, n]) => { const d = E("div", { class: "stat" }); d.append(E("b", {}, String(n)), t); g.append(d); });
  const h1 = E("h2", {}, "सब्सक्रिप्शन"), subs = E("div"), h2 = E("h2", { style: "margin-top:18px" }, "ट्रायल लेने वाले यूज़र"), tri = E("div"); c.append(g, h1, subs, h2, tri);
  async function loadSubs() {
    const { data, error } = await sb.from("subscriptions").select("id,billing,amount_paid,status,is_demo,expires_at,created_at,profiles(full_name,email),plans(name)").order("created_at", { ascending: false }).limit(50);
    if (error) return subs.replaceChildren(E("p", { class: "msg err" }, "सूची नहीं मिली।"));
    subs.replaceChildren(data.length ? A.table(["यूज़र", "प्लान", "बिलिंग", "रकम", "खत्म", "स्थिति", "कार्य"], data.map(r => {
      const live = r.status === "active" && r.expires_at > now, a = E("div", { class: "row" });
      if (live) a.append(A.btn("रद्द करें", "d", async () => { if (!confirm("यह सब्सक्रिप्शन रद्द करें?")) return; const { error } = await sb.from("subscriptions").update({ status: "cancelled" }).eq("id", r.id); error ? A.toast("रद्द नहीं हुआ।", false) : (A.toast("सब्सक्रिप्शन रद्द हुआ।"), loadSubs()); }));
      return [(r.profiles?.full_name || "—") + " (" + (r.profiles?.email || "") + ")", r.plans?.name || "—", r.billing === "annual" ? "सालाना" : "मासिक", "₹" + r.amount_paid + (r.is_demo ? " (डेमो)" : ""), dt(r.expires_at), E("span", { class: "sb " + (live ? "live" : "") }, r.status === "cancelled" ? "रद्द" : live ? "चालू" : "खत्म"), a];
    })) : E("p", { class: "muted" }, "अभी कोई सब्सक्रिप्शन नहीं है।"));
  }
  async function loadTrials() {
    const { data, error } = await sb.from("trial_usage").select("started_at,expires_at,profiles(full_name,email)").order("started_at", { ascending: false }).limit(50);
    if (error) return tri.replaceChildren(E("p", { class: "msg err" }, "सूची नहीं मिली।"));
    tri.replaceChildren(data.length ? A.table(["यूज़र", "शुरू", "खत्म", "स्थिति"], data.map(r => [(r.profiles?.full_name || "—") + " (" + (r.profiles?.email || "") + ")", dt(r.started_at), dt(r.expires_at), E("span", { class: "sb " + (r.expires_at > now ? "live" : "") }, r.expires_at > now ? "चालू" : "खत्म")])) : E("p", { class: "muted" }, "अभी किसी ने ट्रायल नहीं लिया।"));
  }
  loadSubs(); loadTrials();
})();
