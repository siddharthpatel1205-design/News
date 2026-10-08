// User notification centre: read/unread, delete, and optional browser push.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, list = document.getElementById("list"), st = document.getElementById("state"), more = document.getElementById("more"), pb = document.getElementById("push"), all = document.getElementById("readall");
  if (!sb) { st.textContent = "Supabase अभी सेट नहीं है।"; return; }
  const s = await NVAuth.session();
  if (!s) { list.append(E("p", {}, "सूचनाएँ देखने के लिए पहले लॉगिन करें।"), E("a", { class: "btn", href: "login.html?next=notifications.html" }, "लॉगिन")); pb.hidden = true; all.hidden = true; return; }
  const uid = s.user.id; let off = 0; const size = 20, ids = [];
  const mark = async (id, extra = {}) => { await sb.from("notification_reads").upsert({ notification_id: id, user_id: uid, read_at: new Date().toISOString(), ...extra }, { onConflict: "notification_id,user_id" }); NVAuth.updateBell(); };
  const safeLink = l => { if (!l) return ""; try { const u = new URL(l, location.href); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
  function card(n) {
    ids.push(n.id);
    const d = E("div", { class: "nt" + (n.is_read ? "" : " un") }), im = NVNews.safeUrl(n.image_url); if (im) d.append(E("img", { src: im, alt: "", loading: "lazy" }));
    const t = E("div", { class: "tx" }); t.append(E("h3", {}, n.title), E("div", {}, n.message || ""), E("small", { class: "muted" }, new Date(n.created_at).toLocaleString("hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })));
    const a = E("div", { class: "acts" }), lk = safeLink(n.link);
    if (lk) { const o = E("button", { type: "button" }, "खोलें"); o.onclick = async () => { await mark(n.id); location.href = lk; }; a.append(o); }
    if (!n.is_read) { const r = E("button", { type: "button" }, "पढ़ा हुआ"); r.onclick = async () => { await mark(n.id); d.classList.remove("un"); r.remove(); }; a.append(r); }
    const x = E("button", { type: "button" }, "हटाएँ"); x.onclick = async () => { await mark(n.id, { is_deleted: true }); d.remove(); }; a.append(x);
    t.append(a); d.append(t); return d;
  }
  async function load() {
    st.textContent = "लोड हो रहा है…"; more.hidden = true;
    const { data, error } = await sb.rpc("my_notifications", { p_limit: size, p_offset: off });
    if (error) { st.textContent = "सूचनाएँ लोड नहीं हो सकीं। 08_notifications.sql चलाया है?"; return; }
    (data || []).forEach(n => list.append(card(n))); off += (data || []).length;
    st.textContent = list.children.length ? "" : "अभी कोई सूचना नहीं है।"; more.hidden = (data || []).length < size;
  }
  more.onclick = load; load();
  all.onclick = async () => { const rows = ids.map(id => ({ notification_id: id, user_id: uid, read_at: new Date().toISOString() })); if (rows.length) await sb.from("notification_reads").upsert(rows, { onConflict: "notification_id,user_id" }); list.querySelectorAll(".un").forEach(e => e.classList.remove("un")); NVAuth.updateBell(); };
  // push toggle
  const msg = E("p", { class: "muted" }), tg = E("button", { class: "btn", type: "button" });
  pb.append(E("b", {}, "फ़ोन/ब्राउज़र पर सूचनाएँ"), msg, tg);
  async function paint() {
    if (!NVPush.supported()) { msg.textContent = "इस ब्राउज़र में पुश उपलब्ध नहीं है। सूचनाएँ यहीं ऐप के अंदर मिलेंगी।"; tg.hidden = true; return; }
    const cur = await NVPush.current(); tg.hidden = false;
    msg.textContent = cur ? "चालू है — साइट बंद होने पर भी सूचना मिल सकती है।" : "बंद है। चालू करने पर नई खबर की सूचना सीधे मिलेगी।"; tg.textContent = cur ? "बंद करें" : "चालू करें";
    tg.onclick = async () => { tg.disabled = true; try { cur ? await NVPush.disable() : await NVPush.enable(); } catch (e) { msg.textContent = e.message; tg.disabled = false; return; } tg.disabled = false; paint(); };
  }
  paint();
});
