(async () => {
  const c = await NVAdmin.init("यूज़र"); if (!c) return;
  const A = NVAdmin; let q = "";
  const s = NV.el("input", { class: "ib", type: "search", placeholder: "नाम या ईमेल खोजें", "aria-label": "खोजें", style: "margin-bottom:12px;width:100%" });
  const list = NV.el("div"); c.append(s, list);
  async function load() {
    let r = sb.from("profiles").select("id,full_name,email,mobile,age,role,created_at").order("created_at", { ascending: false }).limit(50);
    if (q) { const k = q.replace(/[%_\\,()]/g, ""); r = r.or("full_name.ilike.%" + k + "%,email.ilike.%" + k + "%"); }
    const { data, error } = await r; if (error) return A.toast("सूची नहीं मिल सकी।", false);
    const ids = data.map(u => u.id);
    const [{ data: tr }, { data: sb2 }] = ids.length ? await Promise.all([sb.from("trial_usage").select("user_id,expires_at").in("user_id", ids),
      sb.from("subscriptions").select("user_id,expires_at").in("user_id", ids).eq("status", "active").gt("expires_at", new Date().toISOString())]) : [{ data: [] }, { data: [] }];
    const now = Date.now(), T = Object.fromEntries((tr || []).map(x => [x.user_id, x])), P = new Set((sb2 || []).map(x => x.user_id));
    list.replaceChildren(A.table(["नाम", "ईमेल", "मोबाइल", "ट्रायल", "सब्सक्रिप्शन", "रोल"], data.map(u => {
      const t = T[u.id], role = NV.el("select", { class: "ib", "aria-label": "रोल" });
      ["user", "admin"].forEach(r => role.append(NV.el("option", { value: r }, r))); role.value = u.role; role.disabled = u.id === A.me.id;
      role.onchange = async () => { const { error } = await sb.from("profiles").update({ role: role.value }).eq("id", u.id); error ? (A.toast("रोल नहीं बदला।", false), role.value = u.role) : A.toast("रोल बदल गया।"); };
      return [u.full_name || "—", u.email, u.mobile || "—", t ? (new Date(t.expires_at) > now ? "चालू" : "खत्म") : "नहीं लिया", P.has(u.id) ? "चालू" : "—", role];
    })));
    if (!data.length) list.replaceChildren(NV.el("p", { class: "muted" }, "कोई यूज़र नहीं मिला।"));
  }
  let tm; s.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { q = s.value.trim(); load(); }, 350); };
  load();
})();
