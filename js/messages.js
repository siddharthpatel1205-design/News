// User chat with admin. One private conversation per user (enforced by RLS). Text via textContent only.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, box = document.getElementById("msgs"), form = document.getElementById("mf"), inp = document.getElementById("mt"), st = document.getElementById("cs"), btn = form.querySelector("button");
  if (!sb) { box.append(E("p", { class: "muted" }, "Supabase अभी सेट नहीं है।")); form.hidden = true; return; }
  const s = await NVAuth.session();
  if (!s) { box.append(E("p", {}, "संदेश भेजने के लिए पहले लॉगिन करें।"), E("a", { class: "btn", href: "login.html?next=messages.html" }, "लॉगिन")); form.hidden = true; return; }
  const uid = s.user.id, seen = new Set(); let empty = null;
  const fmt = d => new Date(d).toLocaleString("hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function add(m) {
    if (seen.has(m.id)) return; seen.add(m.id); if (empty) { empty.remove(); empty = null; }
    const d = E("div", { class: "bub " + (m.is_admin_sender ? "them" : "me") }); d.append(E("span", {}, m.body), E("small", {}, (m.is_admin_sender ? "NEWSVERSE टीम • " : "") + fmt(m.created_at)));
    box.append(d); box.scrollTop = box.scrollHeight;
  }
  const { data, error } = await sb.from("messages").select("id,body,is_admin_sender,created_at").eq("user_id", uid).order("created_at", { ascending: true }).limit(200);
  if (error) st.textContent = "संदेश लोड नहीं हो सके। कृपया पेज दोबारा खोलें।";
  (data || []).forEach(add);
  if (!seen.size) { empty = E("p", { class: "muted" }, "अभी कोई संदेश नहीं है। नीचे लिखकर भेजें।"); box.append(empty); }
  sb.rpc("mark_messages_read", { p_user: null });
  sb.channel("chat-" + uid).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "user_id=eq." + uid }, p => {
    add(p.new); if (p.new.is_admin_sender) sb.rpc("mark_messages_read", { p_user: null });
  }).subscribe(status => { if (status === "SUBSCRIBED") st.textContent = "लाइव जुड़ा है"; else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") st.textContent = "लाइव कनेक्शन नहीं है। नए जवाब के लिए पेज रीफ़्रेश करें।"; });
  form.addEventListener("submit", async e => {
    e.preventDefault(); const body = inp.value.trim(); if (!body) return;
    btn.disabled = true;
    const { data: m, error } = await sb.from("messages").insert({ user_id: uid, sender_id: uid, is_admin_sender: false, body }).select("id,body,is_admin_sender,created_at").single();
    btn.disabled = false;
    if (error) { st.textContent = "संदेश नहीं भेजा जा सका। कृपया दोबारा कोशिश करें।"; return; }
    inp.value = ""; add(m); inp.focus();
  });
});
