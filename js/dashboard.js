// User dashboard: account, subscription/trial, saved news, recent news, notifications, messages.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, root = document.getElementById("dash");
  if (!sb) { root.append(E("p", { class: "muted" }, "Supabase अभी सेट नहीं है।")); return; }
  const s = await NVAuth.session();
  if (!s) { root.append(E("p", {}, "अपना खाता देखने के लिए लॉगिन करें।"), E("a", { class: "btn", href: "login.html?next=dashboard.html" }, "लॉगिन")); return; }
  const uid = s.user.id, dt = d => new Date(d).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  const [prof, { data: st }, { data: nu }, { count: mu }, { data: sv }] = await Promise.all([NVAuth.profile(), sb.rpc("my_status"), sb.rpc("my_unread_count"),
    sb.from("messages").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_admin_sender", true).is("read_at", null),
    sb.from("saved_news").select("news_id,news(id,title)").eq("user_id", uid).order("created_at", { ascending: false }).limit(20)]);
  const card = (t, ...kids) => { const d = E("div", { class: "dc" }); d.append(E("h2", {}, t), ...kids); return d; };
  const P = (a, b) => { const p = E("p"); p.append(E("b", {}, a + ": "), b); return p; };
  const S = st || {};
  const g = E("div", { class: "dg" });
  g.append(card("मेरी जानकारी", P("नाम", prof?.full_name || "—"), P("ईमेल", s.user.email), P("मोबाइल", prof?.mobile || "—"), E("a", { class: "btn", href: "profile.html" }, "प्रोफ़ाइल बदलें")));
  g.append(card("सब्सक्रिप्शन",
    P("प्लान", S.sub_active ? (S.plan || "—") + (S.billing === "annual" ? " (सालाना)" : " (मासिक)") : "कोई नहीं"),
    P("सब्सक्रिप्शन खत्म", S.sub_active ? dt(S.sub_expires) : "—"),
    P("ट्रायल", S.trial_active ? "चालू" : S.trial_used ? "समाप्त" : "अभी नहीं लिया"),
    P("ट्रायल खत्म", S.trial_expires ? dt(S.trial_expires) : "—"),
    E("a", { class: "btn", href: "subscription.html" }, S.has_access ? "प्लान देखें / बदलें" : "प्लान लें")));
  g.append(card("सूचनाएँ और संदेश", P("अनपढ़ी सूचनाएँ", String(nu || 0)), P("नए संदेश", String(mu || 0)),
    E("a", { class: "btn", href: "notifications.html" }, "सूचनाएँ"), " ", E("a", { class: "btn", href: "messages.html" }, "संदेश")));
  let rec = []; try { rec = JSON.parse(localStorage.getItem("nv_recent_news") || "[]"); } catch {}
  const rl = E("div"); rec.forEach(r => rl.append(E("p", {}, E("a", { href: "article.html?id=" + encodeURIComponent(r.id) }, r.title))));
  if (!rec.length) rl.append(E("p", { class: "muted" }, "अभी कोई खबर नहीं पढ़ी।"));
  g.append(card("हाल में पढ़ी खबरें (इसी ब्राउज़र में)", rl));
  const sl = E("div");
  (sv || []).filter(x => x.news).forEach(x => { const r = E("p", { class: "row2" }); const rm = E("button", { class: "btn", type: "button" }, "हटाएँ");
    rm.onclick = async () => { await sb.from("saved_news").delete().eq("user_id", uid).eq("news_id", x.news_id); r.remove(); };
    r.append(E("a", { href: "article.html?id=" + encodeURIComponent(x.news.id), style: "flex:1" }, x.news.title), rm); sl.append(r); });
  if (!sl.children.length) sl.append(E("p", { class: "muted" }, "अभी कोई खबर सेव नहीं की है।"));
  g.append(card("सेव की हुई खबरें", sl));
  const out = E("button", { class: "btn", type: "button" }, "लॉगआउट"); out.onclick = () => NVAuth.signOut();
  root.append(g, out);
});
