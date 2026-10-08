// Admin: upload and manage video / audio news. kind comes from <body data-kind>.
(async () => {
  const kind = document.body.dataset.kind, isV = kind === "video", A = NVAdmin;
  const c = await A.init(isV ? "वीडियो न्यूज़" : "ऑडियो न्यूज़"); if (!c) return;
  const types = isV ? ["video/mp4", "video/webm"] : ["audio/mpeg", "audio/mp4", "audio/ogg"], maxMB = isV ? 100 : 30;
  const { data: cats } = await sb.from("categories").select("id,title").order("sort_order");
  const f = NV.el("form", { class: "fm" });
  const T = A.inp("title", "text", { required: "", maxlength: "200" }), S = NV.el("textarea", { maxlength: "400", style: "min-height:80px" }),
        cat = NV.el("select"), file = A.inp("file", "file", { accept: types.join(","), required: "" }), img = A.inp("img", "file", { accept: "image/jpeg,image/png,image/webp" }),
        st = NV.el("select"), prem = A.chk("is_premium", "प्रीमियम");
  cat.append(NV.el("option", { value: "" }, "— कोई नहीं —")); (cats || []).forEach(x => cat.append(NV.el("option", { value: x.id }, x.title)));
  [["draft", "ड्राफ़्ट"], ["published", "अभी प्रकाशित करें"]].forEach(([v, t]) => st.append(NV.el("option", { value: v }, t)));
  const save = NV.el("button", { class: "ib p", type: "submit" }, "अपलोड करें");
  f.append(A.fld("शीर्षक", T), A.fld("छोटा विवरण", S), A.fld("श्रेणी", cat), A.fld((isV ? "वीडियो" : "ऑडियो") + " फ़ाइल (अधिकतम " + maxMB + " MB)", file), A.fld("थंबनेल फ़ोटो (अधिकतम 5 MB)", img), prem, A.fld("स्थिति", st), save);
  const list = NV.el("div", { style: "margin-top:14px" }); c.append(f, list);
  async function load() {
    const { data, error } = await sb.from("news").select("id,title,status,is_premium,view_count,created_at").eq(isV ? "has_video" : "has_audio", true).order("created_at", { ascending: false }).limit(50);
    if (error) return A.toast("सूची नहीं मिल सकी।", false);
    list.replaceChildren(data.length ? A.table(["शीर्षक", "स्थिति", "प्रीमियम", "व्यू", "कार्य"], data.map(n => {
      const a = NV.el("div", { class: "row" });
      a.append(NV.el("a", { class: "ib", href: "news-editor.html?id=" + n.id, style: "display:inline-grid;place-items:center" }, "बदलें"),
        A.btn("हटाएँ", "d", async () => { if (!confirm("“" + n.title + "” हटाएँ?")) return; const { error } = await sb.from("news").delete().eq("id", n.id); error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("हटा दिया गया।"), load()); }));
      return [n.title, n.status, n.is_premium ? "हाँ" : "नहीं", n.view_count, a];
    })) : NV.el("p", { class: "muted" }, "अभी कुछ अपलोड नहीं हुआ।"));
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true; save.textContent = "अपलोड हो रहा है… (बड़ी फ़ाइल में समय लगेगा)";
    try {
      if (!T.value.trim()) throw new Error("शीर्षक लिखें।");
      const row = { title: T.value.trim(), summary: S.value.trim(), body: S.value.trim(), category_id: cat.value || null, is_premium: prem.firstChild.checked, status: st.value, author_id: A.me.id,
        publish_at: st.value === "published" ? new Date().toISOString() : null };
      row[isV ? "video_url" : "audio_url"] = await A.upload(isV ? "news-videos" : "news-audio", file.files[0], maxMB, types);
      if (img.files[0]) row.featured_image = await A.upload("news-images", img.files[0], 5, ["image/jpeg", "image/png", "image/webp"]);
      const { error } = await sb.from("news").insert(row); if (error) throw new Error("सेव नहीं हो सका। कृपया दोबारा कोशिश करें।");
      A.toast("सफलतापूर्वक अपलोड हो गया।"); f.reset(); load();
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; save.textContent = "अपलोड करें"; }
  };
  load();
})();
