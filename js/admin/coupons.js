(async () => {
  const c = await NVAdmin.init("कूपन"); if (!c) return;
  const A = NVAdmin, E = NV.el; let editing = null;
  const f = E("form", { class: "fm" });
  const CD = A.inp("code", "text", { required: "", maxlength: "30", placeholder: "जैसे SAVE100", style: "text-transform:uppercase" }), TY = E("select"), VA = A.inp("value", "number", { min: "0.01", step: "0.01", required: "" }),
        MU = A.inp("max_uses", "number", { min: "1", placeholder: "खाली = असीमित" }), PU = A.inp("per_user", "number", { min: "1", value: "1" }), SD = A.inp("starts", "datetime-local"), ED = A.inp("expires", "datetime-local"), AC = A.chk("is_active", "चालू");
  [["fixed", "फ़िक्स्ड रकम (₹)"], ["percent", "प्रतिशत (%)"]].forEach(([v, t]) => TY.append(E("option", { value: v }, t))); AC.firstChild.checked = true;
  const save = E("button", { class: "ib p", type: "submit" }, "कूपन बनाएँ"), neu = A.btn("नया कूपन", "", () => reset()), rw = E("div", { class: "row" }); rw.append(save, neu);
  f.append(A.fld("कूपन कोड", CD), A.fld("छूट का प्रकार", TY), A.fld("छूट की मात्रा", VA), A.fld("कुल अधिकतम उपयोग", MU), A.fld("प्रति यूज़र सीमा", PU), A.fld("शुरू होने का समय", SD), A.fld("समाप्ति का समय", ED), AC, rw);
  const list = E("div"); c.append(f, list);
  function reset(r) { editing = r || null; CD.value = r?.code || ""; TY.value = r?.discount_type || "fixed"; VA.value = r?.discount_value ?? ""; MU.value = r?.max_uses ?? ""; PU.value = r?.per_user_limit ?? 1; SD.value = A.localDT(r?.starts_at); ED.value = A.localDT(r?.expires_at); AC.firstChild.checked = r ? r.is_active : true; save.textContent = r ? "बदलाव सेव करें" : "कूपन बनाएँ"; }
  async function load() {
    const { data, error } = await sb.from("coupons").select("*, coupon_usage(count)").order("created_at", { ascending: false }); if (error) return A.toast("सूची नहीं मिल सकी।", false);
    list.replaceChildren(data.length ? A.table(["कोड", "छूट", "उपयोग", "प्रति यूज़र", "समाप्ति", "स्थिति", "कार्य"], data.map(r => {
      const used = r.coupon_usage?.[0]?.count ?? 0, a = E("div", { class: "row" });
      a.append(A.btn("बदलें", "", () => { reset(r); scrollTo(0, 0); }), A.btn(r.is_active ? "बंद करें" : "चालू करें", "", async () => { await sb.from("coupons").update({ is_active: !r.is_active }).eq("id", r.id); load(); }),
        A.btn("हटाएँ", "d", async () => { if (!confirm("कूपन “" + r.code + "” हटाएँ?")) return; const { error } = await sb.from("coupons").delete().eq("id", r.id); error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("कूपन हटा दिया गया।"), load()); }));
      return [r.code, r.discount_type === "percent" ? r.discount_value + "%" : "₹" + r.discount_value, used + (r.max_uses ? " / " + r.max_uses : ""), r.per_user_limit, r.expires_at ? new Date(r.expires_at).toLocaleDateString("hi-IN") : "—", E("span", { class: "sb " + (r.is_active ? "live" : "") }, r.is_active ? "चालू" : "बंद"), a];
    })) : E("p", { class: "muted" }, "अभी कोई कूपन नहीं है।"));
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true;
    try {
      const code = CD.value.trim().toUpperCase(); if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error("कोड में सिर्फ़ A-Z, 0-9, - और _ (3 से 30 अक्षर) रखें।");
      const val = Number(VA.value); if (!(val > 0)) throw new Error("छूट की मात्रा सही लिखें."); if (TY.value === "percent" && val > 100) throw new Error("प्रतिशत 100 से ज़्यादा नहीं हो सकता।");
      if (SD.value && ED.value && new Date(ED.value) <= new Date(SD.value)) throw new Error("समाप्ति का समय शुरू होने के बाद का रखें।");
      const row = { code, discount_type: TY.value, discount_value: val, max_uses: MU.value ? Number(MU.value) : null, per_user_limit: Number(PU.value) || 1, starts_at: SD.value ? new Date(SD.value).toISOString() : null, expires_at: ED.value ? new Date(ED.value).toISOString() : null, is_active: AC.firstChild.checked };
      const { error } = editing ? await sb.from("coupons").update(row).eq("id", editing.id) : await sb.from("coupons").insert(row);
      if (error) throw new Error(error.code === "23505" ? "यह कोड पहले से मौजूद है।" : "कूपन सेव नहीं हो सका।");
      A.toast("कूपन सेव हो गया।"); reset(); load();
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; }
  };
  await load(); reset();
})();
