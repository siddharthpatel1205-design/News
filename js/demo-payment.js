// DEMO payment page. No card details are collected and no real money is charged.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, M = NVPayment.money, box = document.getElementById("box"), p = new URLSearchParams(location.search);
  const planId = p.get("plan"), billing = p.get("billing") === "annual" ? "annual" : "monthly", code = (p.get("code") || "").slice(0, 30);
  if (!sb || !(await NVAuth.session())) { box.append(E("p", {}, "पहले लॉगिन करें।"), E("a", { class: "btn", href: "login.html?next=subscription.html" }, "लॉगिन")); return; }
  const { data: q } = await sb.rpc("preview_coupon", { p_plan: planId, p_billing: billing, p_code: code || null });
  if (!q || !q.ok) { box.append(E("p", { class: "msg err" }, (q && q.message) || "प्लान नहीं मिला।"), E("a", { class: "btn", href: "subscription.html" }, "← वापस")); return; }
  const row = (a, b, c) => { const d = E("div", { class: "sumrow " + (c || "") }); d.append(E("span", {}, a), E("span", {}, b)); return d; };
  const go = E("button", { class: "bigbtn", type: "button" }, "डेमो भुगतान पूरा करें"), m = E("p", { class: "msg", role: "alert" });
  box.append(row("कीमत", M(q.original)), row("छूट", "− " + M(q.discount)), row("कुल (डेमो)", M(q.final), "tot"), go, m, E("p", { class: "alt" }, E("a", { href: "subscription.html" }, "← वापस जाएँ")));
  go.onclick = async () => {
    go.disabled = true; go.textContent = "कृपया रुकें…";
    const r = await NVPayment.pay({ planId, billing, code: q.coupon_id ? code : "" });
    if (r.ok) { box.replaceChildren(E("p", { class: "msg ok" }, r.message + " कोई असली पैसा नहीं कटा।"), E("a", { class: "btn", href: "dashboard.html" }, "मेरा खाता देखें")); return; }
    m.className = "msg err"; m.textContent = r.message; go.disabled = false; go.textContent = "डेमो भुगतान पूरा करें";
  };
});
