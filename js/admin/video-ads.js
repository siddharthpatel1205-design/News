// Admin → Video campaigns: create/edit, target audience, timing, live control, analytics.
(async () => {
  const c = await NVAdmin.init("वीडियो विज्ञापन / कैंपेन"); if (!c) return;
  const A = NVAdmin, E = NV.el; let editing = null, byId = {};
  c.append(E("p", { class: "muted" }, "ध्यान दें: विज्ञापन सिर्फ़ उन लॉगिन यूज़र को दिखता है जो उस समय वेबसाइट पर कोई वीडियो देख रहे हों। जो यूज़र साइट पर नहीं हैं, उन्हें नोटिफिकेशन भेजा जा सकता है।"));
  const f = E("form", { class: "fm" });
  const T = A.inp("title", "text", { required: "", maxlength: "120" }), D = E("textarea", { maxlength: "400", style: "min-height:70px" }), VF = A.inp("vf", "file", { accept: "video/mp4,video/webm" }),
        TF = A.inp("tf", "file", { accept: "image/jpeg,image/png,image/webp" }), SD = A.inp("s", "datetime-local", { required: "" }), ED = A.inp("e", "datetime-local", { required: "" }),
        DUR = A.inp("dur", "number", { min: "1", placeholder: "अपने-आप भरेगा" }), AU = E("select"), FQ = E("select"), FV = A.inp("fv", "number", { min: "1", value: "15" }),
        SK = A.chk("skip", "स्किप की अनुमति"), DU = A.inp("dest", "text", { placeholder: "https://…" }), NT = A.chk("notify", "सूचना (नोटिफिकेशन) भी भेजें — नया कैंपेन बनाते समय"), ST = E("select");
  [["all", "सभी यूज़र"], ["online", "ऑनलाइन यूज़र"], ["logged_in", "लॉगिन किए हुए यूज़र"], ["premium", "प्रीमियम यूज़र (ट्रायल सहित)"], ["free", "फ़्री यूज़र"], ["selected", "चुने हुए यूज़र"]].forEach(([v, t]) => AU.append(E("option", { value: v }, t)));
  [["every_x_minutes", "हर X मिनट में एक बार"], ["once_per_session", "हर सेशन में एक बार"], ["max_per_day", "दिन में अधिकतम X बार"]].forEach(([v, t]) => FQ.append(E("option", { value: v }, t)));
  [["draft", "ड्राफ़्ट (अभी लाइव नहीं)"], ["live", "लाइव (समय-सीमा के भीतर चलेगा)"]].forEach(([v, t]) => ST.append(E("option", { value: v }, t)));
  SK.firstChild.checked = true; const picker = NVPicker.create(), pw = E("div"); pw.hidden = true; pw.append(picker.el);
  const save = E("button", { class: "ib p", type: "submit" }, "कैंपेन बनाएँ"), neu = A.btn("नया कैंपेन", "", () => reset()), rw = E("div", { class: "row" }); rw.append(save, neu);
  f.append(A.fld("कैंपेन का शीर्षक", T), A.fld("विवरण", D), A.fld("वीडियो फ़ाइल (MP4/WebM, अधिकतम 50 MB)", VF), A.fld("थंबनेल (वैकल्पिक)", TF),
    A.fld("कैंपेन शुरू (तारीख व समय)", SD), A.fld("कैंपेन खत्म (तारीख व समय)", ED), A.fld("वीडियो की अवधि (सेकंड)", DUR), A.fld("दर्शक (Target)", AU), pw,
    A.fld("फ्रीक्वेंसी", FQ), A.fld("फ्रीक्वेंसी की संख्या (मिनट / बार)", FV), SK, A.fld("क्लिक पर खुलने वाला लिंक (वैकल्पिक)", DU), NT, A.fld("स्थिति", ST), rw);
  const list = E("div", { style: "margin-top:14px" }); c.append(f, list);
  AU.onchange = () => pw.hidden = AU.value !== "selected";
  VF.onchange = () => { const x = VF.files[0]; if (!x) return; const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => { DUR.value = Math.round(v.duration); URL.revokeObjectURL(v.src); }; v.src = URL.createObjectURL(x); };
  async function reset(r) {
    editing = r || null; T.value = r?.title || ""; D.value = r?.description || ""; VF.value = ""; TF.value = ""; SD.value = A.localDT(r?.starts_at); ED.value = A.localDT(r?.ends_at); DUR.value = r?.video_duration_sec || "";
    AU.value = r?.audience || "all"; FQ.value = r?.frequency_type || "every_x_minutes"; FV.value = r?.frequency_value || 15; SK.firstChild.checked = r ? r.skip_allowed : true; DU.value = r?.destination_url || "";
    ST.value = r && r.status === "live" ? "live" : "draft"; NT.firstChild.checked = false; NT.hidden = !!r; pw.hidden = AU.value !== "selected"; save.textContent = r ? "बदलाव सेव करें" : "कैंपेन बनाएँ"; picker.clear();
    if (r && r.audience === "selected") { const { data } = await sb.from("video_campaign_targets").select("user_id,profiles(full_name,email)").eq("campaign_id", r.id); picker.set((data || []).map(x => [x.user_id, x.profiles?.full_name || x.profiles?.email || "यूज़र"])); }
  }
  const setStatus = async (id, status, msg) => { const { error } = await sb.from("video_campaigns").update({ status }).eq("id", id); error ? A.toast("बदलाव नहीं हो सका।", false) : (A.toast(msg), loadList()); };
  async function loadList() {
    const [{ data: st, error }, { data: rows }] = await Promise.all([sb.rpc("admin_campaign_stats"), sb.from("video_campaigns").select("*")]);
    if (error) return list.replaceChildren(E("p", { class: "msg err" }, "कैंपेन की सूची नहीं मिली। 10_campaigns.sql चलाया है?"));
    byId = Object.fromEntries((rows || []).map(r => [r.id, r])); const now = Date.now();
    list.replaceChildren(st.length ? A.table(["कैंपेन", "दर्शक", "लक्षित", "ऑनलाइन", "दिखाया", "शुरू", "पूरा", "स्किप", "पूरा %", "समय", "स्थिति", "कार्य"], st.map(s => {
      const live = s.status === "live", lab = !live ? ({ draft: "ड्राफ़्ट", paused: "रुका हुआ", stopped: "बंद" })[s.status] : now < new Date(s.starts_at) ? "शेड्यूल्ड" : now > new Date(s.ends_at) ? "समाप्त" : "LIVE";
      const a = E("div", { class: "row" });
      if (!live) a.append(A.btn(s.status === "paused" ? "फिर चालू" : "शुरू करें", "p", () => setStatus(s.id, "live", "कैंपेन लाइव हो गया।")));
      if (live) a.append(A.btn("रोकें", "", () => setStatus(s.id, "paused", "कैंपेन रोक दिया गया।")));
      if (live || s.status === "paused") a.append(A.btn("बंद करें", "", () => confirm("कैंपेन पूरी तरह बंद करें?") && setStatus(s.id, "stopped", "कैंपेन बंद हो गया।")));
      a.append(A.btn("बदलें", "", () => { reset(byId[s.id]); scrollTo(0, 0); }), A.btn("हटाएँ", "d", async () => {
        if (!confirm("“" + s.title + "” और इसके आँकड़े हमेशा के लिए हटाएँ?")) return; const r = byId[s.id];
        const { error } = await sb.from("video_campaigns").delete().eq("id", s.id); if (error) return A.toast("हटाया नहीं जा सका।", false);
        if (r?.video_path) sb.storage.from("ad-videos").remove([r.video_path]); A.toast("कैंपेन हटा दिया गया।"); loadList(); }));
      const fmt = d => new Date(d).toLocaleString("hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      return [s.title, ({ all: "सभी", online: "ऑनलाइन", logged_in: "लॉगिन", premium: "प्रीमियम", free: "फ़्री", selected: "चुने हुए" })[s.audience], s.target_count, s.online_now, s.impressions, s.started, s.completed, s.skipped, s.completion_rate + "%", fmt(s.starts_at) + " → " + fmt(s.ends_at), E("span", { class: "sb " + (lab === "LIVE" ? "live" : "") }, lab), a];
    })) : E("p", { class: "muted" }, "अभी कोई कैंपेन नहीं है।"));
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true; save.textContent = "सेव हो रहा है… (वीडियो अपलोड में समय लग सकता है)";
    try {
      const title = T.value.trim(); if (!title) throw new Error("शीर्षक लिखें।");
      if (!SD.value || !ED.value || new Date(ED.value) <= new Date(SD.value)) throw new Error("कैंपेन का खत्म होने का समय शुरू होने के बाद का रखें।");
      if (!editing && !VF.files[0]) throw new Error("वीडियो फ़ाइल चुनें।");
      const dur = Number(DUR.value); if (!(dur > 0)) throw new Error("वीडियो की अवधि (सेकंड) लिखें।");
      const fv = parseInt(FV.value, 10); if (!(fv >= 1)) throw new Error("फ्रीक्वेंसी की संख्या सही लिखें।");
      const dest = DU.value.trim(); if (dest && !/^https?:\/\//i.test(dest)) throw new Error("लिंक http:// या https:// से शुरू होना चाहिए।");
      if (AU.value === "selected" && !picker.ids().length) throw new Error("कम से कम एक यूज़र चुनें।");
      const row = { title, description: D.value.trim(), starts_at: new Date(SD.value).toISOString(), ends_at: new Date(ED.value).toISOString(), video_duration_sec: dur, audience: AU.value, frequency_type: FQ.value, frequency_value: fv, skip_allowed: SK.firstChild.checked, destination_url: dest || null, status: ST.value };
      let oldPath = null;
      if (VF.files[0]) { row.video_path = await A.uploadPath("ad-videos", VF.files[0], 50, ["video/mp4", "video/webm"]); oldPath = editing?.video_path; }
      if (TF.files[0]) row.thumbnail_url = await A.upload("news-images", TF.files[0], 5, ["image/jpeg", "image/png", "image/webp"]);
      if (!editing) row.created_by = A.me.id;
      let id = editing?.id;
      if (editing) { const { error } = await sb.from("video_campaigns").update(row).eq("id", id); if (error) throw new Error("कैंपेन सेव नहीं हो सका।"); }
      else { const { data, error } = await sb.from("video_campaigns").insert(row).select("id").single(); if (error) throw new Error("कैंपेन सेव नहीं हो सका।"); id = data.id; }
      await sb.from("video_campaign_targets").delete().eq("campaign_id", id);
      if (AU.value === "selected") { const { error } = await sb.from("video_campaign_targets").insert(picker.ids().map(u => ({ campaign_id: id, user_id: u }))); if (error) throw new Error("चुने हुए यूज़र सेव नहीं हो सके।"); }
      if (oldPath) sb.storage.from("ad-videos").remove([oldPath]);
      let note = "कैंपेन सेव हो गया।";
      if (!editing && NT.firstChild.checked) {
        const { data: nid, error } = await sb.rpc("send_notification", { p_title: "नया वीडियो: " + title, p_message: row.description.slice(0, 200), p_image: "", p_link: "video.html", p_audience: AU.value === "selected" ? "selected" : "all", p_users: AU.value === "selected" ? picker.ids() : [] });
        if (!error) { note += " सूचना भेजी गई।"; sb.functions.invoke("send-push", { body: { notification_id: nid } }).catch(() => {}); }
      }
      A.toast(note); reset(); loadList();
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; save.textContent = editing ? "बदलाव सेव करें" : "कैंपेन बनाएँ"; }
  };
  await reset(); loadList(); setInterval(loadList, 15000);
})();
