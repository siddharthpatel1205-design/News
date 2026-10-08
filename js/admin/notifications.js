(async () => {
  const c = await NVAdmin.init("नोटिफिकेशन"); if (!c) return;
  const A = NVAdmin, E = NV.el;
  const f = E("form", { class: "fm" });
  const T = A.inp("title", "text", { required: "", maxlength: "120" }), M = E("textarea", { maxlength: "500", style: "min-height:100px" }), L = A.inp("link", "text", { placeholder: "article.html?id=… या https://…" }),
        img = A.inp("img", "file", { accept: "image/jpeg,image/png,image/webp" }), aud = E("select");
  [["all", "सभी यूज़र"], ["selected", "चुने हुए यूज़र (एक या ज़्यादा)"]].forEach(([v, t]) => aud.append(E("option", { value: v }, t)));
  const picker = NVPicker.create(), pw = E("div"); pw.hidden = true; pw.append(picker.el);
  const push = A.chk("push", "ब्राउज़र/फ़ोन पुश भी भेजें (जहाँ चालू हो)"); push.firstChild.checked = true;
  const go = E("button", { class: "ib p", type: "submit" }, "सूचना भेजें");
  f.append(A.fld("शीर्षक", T), A.fld("संदेश", M), A.fld("लिंक (वैकल्पिक)", L), A.fld("फ़ोटो (वैकल्पिक, अधिकतम 5 MB)", img), A.fld("किसे भेजें", aud), pw, push, go);
  const hist = E("div", { style: "margin-top:14px" }); c.append(f, hist);
  aud.onchange = () => pw.hidden = aud.value !== "selected";
  async function load() {
    const { data, error } = await sb.rpc("admin_notifications"); if (error) return hist.replaceChildren(E("p", { class: "msg err" }, "इतिहास नहीं मिला। 08_notifications.sql चलाया है?"));
    hist.replaceChildren(data.length ? A.table(["शीर्षक", "किसे", "समय", "लक्षित", "पढ़ा"], data.map(n => [n.title, n.audience === "all" ? "सभी" : "चुने हुए", new Date(n.created_at).toLocaleString("hi-IN"), n.targets, n.reads])) : E("p", { class: "muted" }, "अभी कोई सूचना नहीं भेजी गई।"));
  }
  f.onsubmit = async e => {
    e.preventDefault(); go.disabled = true; go.textContent = "भेज रहे हैं…";
    try {
      if (!T.value.trim()) throw new Error("शीर्षक लिखें।");
      if (aud.value === "selected" && !picker.ids().length) throw new Error("कम से कम एक यूज़र चुनें।");
      const image = img.files[0] ? await A.upload("news-images", img.files[0], 5, ["image/jpeg", "image/png", "image/webp"]) : "";
      const { data: id, error } = await sb.rpc("send_notification", { p_title: T.value, p_message: M.value, p_image: image, p_link: L.value.trim(), p_audience: aud.value, p_users: aud.value === "selected" ? picker.ids() : [] });
      if (error) throw new Error(/link/.test(error.message) ? "लिंक सही नहीं है।" : "सूचना नहीं भेजी जा सकी। कृपया दोबारा कोशिश करें।");
      let note = "सूचना भेज दी गई (ऐप के अंदर)।";
      if (push.firstChild.checked) {
        const { data: r, error: pe } = await sb.functions.invoke("send-push", { body: { notification_id: id } });
        note += pe ? " पुश अभी चालू नहीं है (Edge Function सेट करनी होगी)।" : r && r.skipped ? " पुश सेटिंग्स में बंद है।" : " पुश: " + (r?.sent ?? 0) + " डिवाइस पर भेजा गया।";
      }
      A.toast(note); f.reset(); picker.clear(); pw.hidden = true; load();
    } catch (er) { A.toast(er.message, false); } finally { go.disabled = false; go.textContent = "सूचना भेजें"; }
  };
  load();
})();
