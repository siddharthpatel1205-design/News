(async () => {
  const c = await NVAdmin.init("प्लान"); if (!c) return;
  const A = NVAdmin, E = NV.el; let editing = null, rows = [];
  const f = E("form", { class: "fm" });
  const N = A.inp("name", "text", { required: "", maxlength: "60" }), D = A.inp("description", "text", { maxlength: "160" }), MP = A.inp("monthly", "number", { min: "0", step: "0.01", required: "" }), AP = A.inp("annual", "number", { min: "0", step: "0.01", required: "" }),
        FT = E("textarea", { style: "min-height:90px", placeholder: "हर फ़ीचर नई लाइन में" }), SO = A.inp("sort", "number", { value: "0" }), PR = A.chk("is_premium", "प्रीमियम खबरों की पहुँच"), AC = A.chk("is_active", "चालू (यूज़र को दिखे)");
  PR.firstChild.checked = AC.firstChild.checked = true;
  const save = E("button", { class: "ib p", type: "submit" }, "प्लान जोड़ें"), neu = A.btn("नया प्लान", "", () => reset());
  const rw = E("div", { class: "row" }); rw.append(save, neu);
  f.append(A.fld("प्लान का नाम", N), A.fld("विवरण", D), A.fld("मासिक कीमत (₹)", MP), A.fld("सालाना कीमत (₹)", AP), A.fld("फ़ीचर", FT), A.fld("क्रम", SO), PR, AC, rw);
  const list = E("div"); c.append(f, list);
  function reset(r) { editing = r || null; N.value = r?.name || ""; D.value = r?.description || ""; MP.value = r?.monthly_price ?? ""; AP.value = r?.annual_price ?? ""; FT.value = (r?.features || []).join("\n"); SO.value = r?.sort_order ?? rows.length + 1; PR.firstChild.checked = r ? r.is_premium : true; AC.firstChild.checked = r ? r.is_active : true; save.textContent = r ? "बदलाव सेव करें" : "प्लान जोड़ें"; }
  async function load() {
    const { data, error } = await sb.from("plans").select("*").order("sort_order"); if (error) return A.toast("सूची नहीं मिल सकी।", false); rows = data;
    list.replaceChildren(A.table(["क्रम", "नाम", "मासिक", "सालाना", "प्रीमियम", "स्थिति", "कार्य"], rows.map(r => {
      const a = E("div", { class: "row" }); a.append(A.btn("बदलें", "", () => { reset(r); scrollTo(0, 0); }), A.btn(r.is_active ? "बंद करें" : "चालू करें", "", async () => { await sb.from("plans").update({ is_active: !r.is_active }).eq("id", r.id); load(); }),
        A.btn("हटाएँ", "d", async () => { if (!confirm("“" + r.name + "” हटाएँ? पुराने सब्सक्रिप्शन बने रहेंगे।")) return; const { error } = await sb.from("plans").delete().eq("id", r.id); error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("प्लान हटा दिया गया।"), load()); }));
      return [r.sort_order, r.name, "₹" + r.monthly_price, "₹" + r.annual_price, r.is_premium ? "हाँ" : "नहीं", E("span", { class: "sb " + (r.is_active ? "live" : "") }, r.is_active ? "चालू" : "बंद"), a];
    })));
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true;
    try {
      const row = { name: N.value.trim(), description: D.value.trim(), monthly_price: Number(MP.value), annual_price: Number(AP.value), features: FT.value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 12), sort_order: Number(SO.value) || 0, is_premium: PR.firstChild.checked, is_active: AC.firstChild.checked };
      if (!row.name) throw new Error("प्लान का नाम लिखें।"); if (!(row.monthly_price >= 0) || !(row.annual_price >= 0)) throw new Error("कीमत सही लिखें।");
      const { error } = editing ? await sb.from("plans").update(row).eq("id", editing.id) : await sb.from("plans").insert(row); if (error) throw new Error("प्लान सेव नहीं हो सका।");
      A.toast("प्लान सेव हो गया।"); reset(); load();
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; }
  };
  await load(); reset();
})();
