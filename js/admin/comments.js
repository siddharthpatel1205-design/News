(async () => {
  const c = await NVAdmin.init("कमेंट मॉडरेशन"); if (!c) return;
  const A = NVAdmin, E = NV.el; let only = false;
  const chk = A.chk("only", "सिर्फ़ रिपोर्ट किए गए कमेंट दिखाएँ"), list = E("div", { style: "margin-top:12px" }); c.append(chk, list);
  chk.firstChild.onchange = () => { only = chk.firstChild.checked; load(); };
  async function load() {
    const { data, error } = await sb.from("comments").select("id,body,is_hidden,created_at,profiles(full_name,email),news(title),comment_reports(count)").order("created_at", { ascending: false }).limit(60);
    if (error) return list.replaceChildren(E("p", { class: "msg err" }, "कमेंट नहीं मिले। 12_audit.sql चलाया है?"));
    const rows = data.filter(r => !only || (r.comment_reports?.[0]?.count || 0) > 0);
    list.replaceChildren(rows.length ? A.table(["यूज़र", "खबर", "कमेंट", "रिपोर्ट", "स्थिति", "कार्य"], rows.map(r => {
      const a = E("div", { class: "row" });
      a.append(A.btn(r.is_hidden ? "दिखाएँ" : "छुपाएँ", "", async () => { const { error } = await sb.from("comments").update({ is_hidden: !r.is_hidden }).eq("id", r.id); error ? A.toast("बदलाव नहीं हो सका।", false) : load(); }),
        A.btn("हटाएँ", "d", async () => { if (!confirm("यह कमेंट हमेशा के लिए हटाएँ?")) return; const { error } = await sb.from("comments").delete().eq("id", r.id); error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("कमेंट हटा दिया गया।"), load()); }));
      return [r.profiles?.full_name || r.profiles?.email || "—", r.news?.title || "—", r.body.slice(0, 200), r.comment_reports?.[0]?.count || 0, E("span", { class: "sb " + (r.is_hidden ? "" : "live") }, r.is_hidden ? "छुपा" : "दिख रहा"), a];
    })) : E("p", { class: "muted" }, "कोई कमेंट नहीं मिला।"));
  }
  load();
})();
