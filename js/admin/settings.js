(async () => {
  const c = await NVAdmin.init("सेटिंग्स"); if (!c) return;
  const A = NVAdmin;
  const FIELDS = [["site_name","वेबसाइट का नाम","text"],["contact_email","संपर्क ईमेल","email"],["footer_text","फ़ुटर टेक्स्ट","text"],["primary_color","मुख्य रंग","color"],["secondary_color","दूसरा रंग","color"],["breaking_color","ब्रेकिंग रंग","color"],
    ["logo_url","लोगो (फ़ोटो)","image"],["favicon_url","फ़ेविकॉन","image"],["trial_days","ट्रायल के दिन","number"],["trial_enabled","फ़्री ट्रायल चालू","bool"],["maintenance_mode","मेंटेनेंस मोड","bool"],["comments_enabled","कमेंट चालू","bool"],["push_enabled","पुश नोटिफिकेशन चालू","bool"],["video_campaign_enabled","वीडियो कैंपेन चालू","bool"],["midroll_percent","विज्ञापन कब आए (वीडियो का %, 10 से 90)","number"],["demo_payments_enabled","डेमो भुगतान चालू (असली भुगतान जोड़ने पर बंद करें)","bool"]];
  const { data } = await sb.from("site_settings").select("key,value"); const V = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  const f = NV.el("form", { class: "fm" }), I = {};
  FIELDS.forEach(([k, label, t]) => {
    if (t === "bool") { const l = A.chk(k, label); l.firstChild.checked = !!V[k]; I[k] = l.firstChild; f.append(l); return; }
    const el = t === "image" ? A.inp(k, "file", { accept: "image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon" }) : A.inp(k, t === "color" ? "color" : t, { value: V[k] ?? "" });
    I[k] = el; const w = A.fld(label, el); if (t === "image" && V[k]) w.append(NV.el("small", { class: "muted" }, "मौजूदा: " + V[k])); f.append(w);
  });
  const save = NV.el("button", { class: "ib p", type: "submit" }, "सेटिंग्स सेव करें"); f.append(save); c.append(f);
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true;
    try {
      const rows = [];
      for (const [k, , t] of FIELDS) {
        let v = t === "bool" ? I[k].checked : t === "number" ? (k === "midroll_percent" ? Math.max(10, Math.min(90, parseInt(I[k].value, 10) || 50)) : Math.max(1, Math.min(365, parseInt(I[k].value, 10) || 7))) : I[k].value;
        if (t === "image") { if (!I[k].files[0]) continue; v = await A.upload("site-assets", I[k].files[0], 2, ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/x-icon"]); }
        rows.push({ key: k, value: v });
      }
      const { error } = await sb.from("site_settings").upsert(rows, { onConflict: "key" }); if (error) throw new Error("सेटिंग्स सेव नहीं हो सकीं।");
      A.toast("सेटिंग्स सेव हो गईं।");
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; }
  };
})();
