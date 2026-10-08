(async () => {
  const c = await NVAdmin.init("खबर एडिटर"); if (!c) return;
  const A = NVAdmin, id = new URLSearchParams(location.search).get("id"); let cur = {};
  const { data: cats } = await sb.from("categories").select("id,title").order("sort_order");
  const f = NV.el("form", { class: "fm" });
  const T = A.inp("title", "text", { required: "", maxlength: "200" }), S = NV.el("textarea", { name: "summary", maxlength: "400", style: "min-height:80px" }), B = NV.el("textarea", { name: "body" }),
        cat = NV.el("select", { name: "category_id" }), tags = A.inp("tags", "text", { placeholder: "कॉमा से अलग करें: चुनाव, मौसम" }),
        img = A.inp("img", "file", { accept: "image/jpeg,image/png,image/webp" }), vf = A.inp("vf", "file", { accept: "video/mp4,video/webm" }), af = A.inp("af", "file", { accept: "audio/mpeg,audio/mp4,audio/ogg" }),
        st = NV.el("select", { name: "status" }), pa = A.inp("publish_at", "datetime-local"), lang = NV.el("select", { name: "language" });
  cat.append(NV.el("option", { value: "" }, "— कोई नहीं —")); (cats || []).forEach(x => cat.append(NV.el("option", { value: x.id }, x.title)));
  [["draft", "ड्राफ़्ट"], ["published", "प्रकाशित"], ["scheduled", "शेड्यूल (बाद में)"]].forEach(([v, t]) => st.append(NV.el("option", { value: v }, t)));
  [["hi", "हिंदी"], ["en", "English"]].forEach(([v, t]) => lang.append(NV.el("option", { value: v }, t)));
  const ck = { is_breaking: A.chk("is_breaking", "ब्रेकिंग न्यूज़"), is_trending: A.chk("is_trending", "ट्रेंडिंग"), is_premium: A.chk("is_premium", "प्रीमियम"), comments_enabled: A.chk("comments_enabled", "कमेंट चालू") };
  ck.comments_enabled.firstChild.checked = true;
  const save = NV.el("button", { class: "ib p", type: "submit" }, "सेव करें");
  f.append(A.fld("शीर्षक", T), A.fld("छोटा विवरण", S), A.fld("पूरी खबर (खाली लाइन से नया अनुच्छेद)", B), A.fld("श्रेणी", cat), A.fld("टैग", tags), A.fld("भाषा", lang),
    A.fld("मुख्य फ़ोटो (अधिकतम 5 MB)", img), A.fld("वीडियो (अधिकतम 100 MB)", vf), A.fld("ऑडियो (अधिकतम 30 MB)", af), ...Object.values(ck), A.fld("स्थिति", st), A.fld("प्रकाशन समय (शेड्यूल के लिए)", pa), save);
  c.append(f);
  if (id) {
    const { data } = await sb.rpc("get_article", { p_id: id }); if (!data) return A.toast("खबर नहीं मिली।", false);
    cur = data; T.value = data.title; S.value = data.summary || ""; B.value = data.body || ""; cat.value = data.category_id || ""; tags.value = (data.tags || []).join(", ");
    lang.value = data.language || "hi"; st.value = data.status; pa.value = A.localDT(data.publish_at);
    Object.keys(ck).forEach(k => ck[k].firstChild.checked = !!data[k]);
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true; save.textContent = "सेव हो रहा है…";
    try {
      if (!T.value.trim()) throw new Error("शीर्षक लिखें।");
      const row = { title: T.value.trim(), summary: S.value.trim(), body: B.value, category_id: cat.value || null, language: lang.value, status: st.value, updated_at: new Date().toISOString(),
        tags: tags.value.split(",").map(x => x.trim()).filter(Boolean).slice(0, 10) };
      Object.keys(ck).forEach(k => row[k] = ck[k].firstChild.checked);
      if (row.status === "scheduled" && !pa.value) throw new Error("शेड्यूल के लिए प्रकाशन समय चुनें।");
      row.publish_at = pa.value ? new Date(pa.value).toISOString() : (row.status === "published" ? (cur.publish_at || new Date().toISOString()) : null);
      if (img.files[0]) row.featured_image = await A.upload("news-images", img.files[0], 5, ["image/jpeg", "image/png", "image/webp"]);
      if (vf.files[0]) row.video_url = await A.upload("news-videos", vf.files[0], 100, ["video/mp4", "video/webm"]);
      if (af.files[0]) row.audio_url = await A.upload("news-audio", af.files[0], 30, ["audio/mpeg", "audio/mp4", "audio/ogg"]);
      if (!id) row.author_id = A.me.id;
      const { error } = id ? await sb.from("news").update(row).eq("id", id) : await sb.from("news").insert(row);
      if (error) throw new Error("खबर सेव नहीं हो सकी। कृपया दोबारा कोशिश करें।");
      A.toast("खबर सेव हो गई।"); setTimeout(() => location.href = "news.html", 700);
    } catch (er) { A.toast(er.message, false); save.disabled = false; save.textContent = "सेव करें"; }
  };
})();
