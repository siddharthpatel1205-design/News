// Subscription page: trial, plans (from Supabase), Monthly/Annual, coupon preview. Prices are always confirmed by the server.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, $ = i => document.getElementById(i), M = NVPayment.money, root = $("sub");
  if (!sb) { root.append(E("p", { class: "muted" }, "Supabase अभी सेट नहीं है।")); return; }
  const s = await NVAuth.session();
  if (!s) { root.append(E("p", {}, "सब्सक्रिप्शन के लिए पहले लॉगिन करें।"), E("a", { class: "btn", href: "login.html?next=subscription.html" }, "लॉगिन")); return; }
  let st = {}, plans = [], billing = "monthly", planId = null, code = "", quote = null;
  const dt = d => new Date(d).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  const status = $("status"), trial = $("trial"), plansEl = $("plans"), summary = $("summary"), cmsg = $("cmsg");

  async function loadStatus() { const { data } = await sb.rpc("my_status"); st = data || {}; paintStatus(); paintTrial(); }
  function paintStatus() {
    status.className = "dc"; status.replaceChildren();
    if (st.sub_active) status.append(E("p", {}, "✅ आपका " + (st.plan || "") + " सब्सक्रिप्शन चालू है — " + dt(st.sub_expires) + " तक।" + (st.sub_demo ? " (डेमो)" : "")));
    else if (st.trial_active) status.append(E("p", {}, "✅ आपका मुफ़्त ट्रायल चालू है — " + dt(st.trial_expires) + " तक।"));
    else status.append(E("p", {}, st.trial_used ? "आपका ट्रायल समाप्त हो चुका है। प्रीमियम खबरों के लिए प्लान चुनें।" : "अभी आपके पास कोई सक्रिय प्लान नहीं है।"));
  }
  function paintTrial() {
    trial.replaceChildren(); trial.className = "";
    if (st.sub_active || st.trial_active) return;
    if (st.trial_used) { trial.className = "dc"; trial.append(E("p", { class: "muted" }, "आपका मुफ़्त ट्रायल पहले ही इस्तेमाल हो चुका है। ट्रायल हर खाते के लिए सिर्फ़ एक बार मिलता है।")); return; }
    if (!st.trial_enabled) return;
    trial.className = "dc"; const b = E("button", { class: "bigbtn", type: "button" }, st.trial_days + " दिन का मुफ़्त ट्रायल शुरू करें"), m = E("p", { class: "msg", role: "alert" });
    b.onclick = async () => { b.disabled = true; const { data, error } = await sb.rpc("start_trial"); b.disabled = false;
      if (error || !data) { m.className = "msg err"; m.textContent = "ट्रायल शुरू नहीं हो सका। कृपया दोबारा कोशिश करें।"; return; }
      m.className = "msg " + (data.ok ? "ok" : "err"); m.textContent = data.message; if (data.ok) loadStatus(); };
    trial.append(E("h2", {}, "मुफ़्त ट्रायल"), E("p", {}, "पूरे " + st.trial_days + " दिन प्रीमियम खबरें, बिना भुगतान।"), b, m);
  }
  function paintPlans() {
    plansEl.replaceChildren(...plans.map(p => {
      const price = billing === "annual" ? p.annual_price : p.monthly_price, save = billing === "annual" ? p.monthly_price * 12 - p.annual_price : 0;
      const l = E("label", { class: "plan" + (p.id === planId ? " on" : "") }), r = E("input", { type: "radio", name: "plan", class: "sr" }); r.checked = p.id === planId;
      r.onchange = () => { planId = p.id; paintPlans(); requote(); };
      l.append(r, E("b", {}, p.name), E("div", { class: "muted" }, p.description || ""), E("div", { class: "pr" }, M(price) + (billing === "annual" ? " / साल" : " / माह")));
      if (save > 0) l.append(E("small", { class: "tag" }, M(save) + " की बचत"));
      const ul = E("ul"); (Array.isArray(p.features) ? p.features : []).forEach(x => ul.append(E("li", {}, String(x)))); l.append(ul); return l;
    }));
    if (!plans.length) plansEl.append(E("p", { class: "muted" }, "अभी कोई प्लान उपलब्ध नहीं है।"));
  }
  async function requote() {
    if (!planId) return;
    let { data: q } = await sb.rpc("preview_coupon", { p_plan: planId, p_billing: billing, p_code: code || null }); cmsg.className = "msg"; cmsg.textContent = "";
    if (q && !q.ok && code) { cmsg.className = "msg err"; cmsg.textContent = q.message; ({ data: q } = await sb.rpc("preview_coupon", { p_plan: planId, p_billing: billing, p_code: null })); }
    else if (q && q.ok && code) { cmsg.className = "msg ok"; cmsg.textContent = "कूपन लागू हो गया ✓"; }
    quote = q; paintSummary();
  }
  function paintSummary() {
    summary.replaceChildren(); if (!quote || !quote.ok) { summary.append(E("p", { class: "msg err" }, quote ? quote.message : "कीमत नहीं मिल सकी।")); return; }
    const row = (a, b, c) => { const d = E("div", { class: "sumrow " + (c || "") }); d.append(E("span", {}, a), E("span", {}, b)); return d; };
    summary.append(row("प्लान की कीमत", M(quote.original)), row("कूपन छूट", "− " + M(quote.discount)), row("कुल देय", M(quote.final), "tot"));
    const applied = quote.coupon_id ? code : "", free = Number(quote.final) === 0;
    const go = E("button", { class: "bigbtn", type: "button" }, free ? "मुफ़्त में चालू करें" : "डेमो भुगतान के लिए आगे बढ़ें →"), m = E("p", { class: "msg", role: "alert" });
    go.onclick = async () => {
      if (!free) { location.href = "demo-payment.html?plan=" + planId + "&billing=" + billing + "&code=" + encodeURIComponent(applied); return; }
      go.disabled = true; const r = await NVPayment.pay({ planId, billing, code: applied }); go.disabled = false;
      m.className = "msg " + (r.ok ? "ok" : "err"); m.textContent = r.message; if (r.ok) { loadStatus(); requote(); }
    };
    summary.append(go, m);
  }
  $("billing").onchange = e => { billing = e.target.value; paintPlans(); requote(); };
  $("apply").onclick = () => { code = $("code").value.trim().toUpperCase(); requote(); };
  await loadStatus();
  const { data } = await sb.from("plans").select("*").eq("is_active", true).order("sort_order"); plans = data || [];
  if (plans.length) planId = (plans.find(p => p.is_premium) || plans[0]).id; paintPlans(); requote();
});
