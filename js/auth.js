// Authentication helpers. Passwords are handled only by Supabase Auth.
const NVAuth = {
  msgs: {
    "Invalid login credentials": "ईमेल या पासवर्ड सही नहीं है।",
    "Email not confirmed": "पहले अपने ईमेल में आया लिंक खोलकर ईमेल की पुष्टि करें।",
    "User already registered": "इस ईमेल से खाता पहले से बना है। कृपया लॉगिन करें।",
    "Password should be at least 6 characters": "पासवर्ड कम से कम 8 अक्षर का रखें।"
  },
  friendly(e) { return this.msgs[e?.message] || "कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।"; },
  async session() { if (!sb) return null; const { data } = await sb.auth.getSession(); return data.session; },
  async profile() {
    const s = await this.session(); if (!s) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", s.user.id).single();
    return data;
  },
  // Only same-site relative paths are allowed as redirect targets (prevents open redirect).
  safeNext(d) { const n = new URLSearchParams(location.search).get("next"); return n && /^[\w\-./?=&]+$/.test(n) && !n.startsWith("//") ? n : d; },
  async requireLogin() { if (!(await this.session())) location.replace("login.html?next=" + encodeURIComponent(location.pathname.split("/").pop())); },
  // UI guard only. Real protection is RLS + is_admin() in the database.
  async requireAdmin() { const p = await this.profile(); if (!p || p.role !== "admin") location.replace("../index.html"); return p; },
  async signOut() { await sb.auth.signOut(); location.href = "index.html"; },
  async refreshHeader() {
    if (!sb) return;
    const s = await this.session(); if (!s) return;
    const b = document.getElementById("loginBtn"); if (b) { b.textContent = "मेरा खाता"; b.href = "dashboard.html"; }
    this.startPresence(s.user.id); this.fabBadge(s.user.id); this.bell(s.user.id);
  },
  _pres: false,
  // Online presence: heartbeat every 60s while the tab is visible (admin counts users seen in the last 2 min)
  startPresence(uid) {
    if (this._pres) return; this._pres = true;
    const beat = on => sb.from("user_presence").upsert({ user_id: uid, last_seen: new Date().toISOString(), is_online: on, current_page: location.pathname.split("/").pop() || "index.html" }).then(() => {});
    beat(true); setInterval(() => { if (!document.hidden) beat(true); }, 60000);
    document.addEventListener("visibilitychange", () => beat(!document.hidden));
  },
  async fabBadge(uid) {
    const f = document.querySelector(".fab"); if (!f || f.querySelector(".badge")) return;
    const { count } = await sb.from("messages").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_admin_sender", true).is("read_at", null);
    if (count) { const b = document.createElement("span"); b.className = "badge"; b.textContent = count > 9 ? "9+" : count; f.append(b); }
  },
  // Notification bell with unread badge (updates live)
  async bell(uid) {
    const b = document.getElementById("loginBtn"); if (!b || document.getElementById("bell")) return;
    const a = document.createElement("a"); a.id = "bell"; a.className = "bell"; a.href = "notifications.html"; a.setAttribute("aria-label", "सूचनाएँ"); a.textContent = "🔔";
    b.before(a); await this.updateBell();
    sb.channel("bell-" + uid).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => setTimeout(() => this.updateBell(), 800)).subscribe();
  },
  async updateBell() {
    const a = document.getElementById("bell"); if (!a) return;
    const { data } = await sb.rpc("my_unread_count"); let s = a.querySelector(".badge");
    if (!data) { if (s) s.remove(); return; }
    if (!s) { s = document.createElement("span"); s.className = "badge"; a.append(s); }
    s.textContent = data > 9 ? "9+" : data;
  }
};
function showMsg(el, text, ok) { el.textContent = text; el.className = "msg " + (ok ? "ok" : "err"); }
function busy(btn, on, label) { btn.disabled = on; btn.textContent = on ? "कृपया रुकें…" : label; }

document.addEventListener("DOMContentLoaded", () => {
  NVAuth.refreshHeader();
  const msg = document.getElementById("msg");

  const login = document.getElementById("loginForm");
  if (login) login.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = login.querySelector(".go");
    if (!sb) return showMsg(msg, "Supabase अभी सेट नहीं है। js/supabase.js में URL और key डालें।");
    busy(btn, true);
    const { error } = await sb.auth.signInWithPassword({ email: login.email.value.trim(), password: login.password.value });
    if (error) { busy(btn, false, "लॉगिन करें"); return showMsg(msg, NVAuth.friendly(error)); }
    showMsg(msg, "लॉगिन सफल हुआ।", true);
    location.href = NVAuth.safeNext("index.html");
  });

  const signup = document.getElementById("signupForm");
  if (signup) signup.addEventListener("submit", async e => {
    e.preventDefault();
    const f = signup, btn = f.querySelector(".go");
    const name = f.full_name.value.trim(), email = f.email.value.trim(), age = Number(f.age.value),
          mobile = f.mobile.value.replace(/\s+/g, ""), pw = f.password.value;
    if (name.length < 2) return showMsg(msg, "कृपया अपना पूरा नाम लिखें।");
    if (!(age >= 5 && age <= 120)) return showMsg(msg, "कृपया सही उम्र लिखें।");
    if (!/^[6-9]\d{9}$/.test(mobile)) return showMsg(msg, "10 अंकों का सही मोबाइल नंबर लिखें।");
    if (pw.length < 8) return showMsg(msg, "पासवर्ड कम से कम 8 अक्षर का रखें।");
    if (pw !== f.confirm.value) return showMsg(msg, "दोनों पासवर्ड एक जैसे नहीं हैं।");
    if (!sb) return showMsg(msg, "Supabase अभी सेट नहीं है। js/supabase.js में URL और key डालें।");
    busy(btn, true);
    const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name, age, mobile } } });
    busy(btn, false, "खाता बनाएँ");
    if (error) return showMsg(msg, NVAuth.friendly(error));
    if (data.user && data.user.identities && data.user.identities.length === 0)
      return showMsg(msg, NVAuth.msgs["User already registered"]);
    if (data.session) { showMsg(msg, "खाता बन गया।", true); location.href = "subscription.html"; }
    else showMsg(msg, "खाता बन गया। अपने ईमेल में आया लिंक खोलकर पुष्टि करें, फिर लॉगिन करें।", true);
  });
});
