// Admin inbox with realtime. RLS lets admins read all conversations; users still only see their own.
(async () => {
  const c = await NVAdmin.init("संदेश"); if (!c) return;
  const A = NVAdmin, E = NV.el, me = A.me.id; let open = null, seen = new Set(), convs = [], q = "";
  const wrap = E("div", { class: "cw" }), left = E("div"), cl = E("div", { class: "cl" }), cp = E("div", { class: "cp" });
  const search = E("input", { class: "ib", type: "search", placeholder: "यूज़र खोजें", "aria-label": "यूज़र खोजें", style: "width:100%;margin-bottom:8px" });
  left.append(search, cl);
  const head = E("div", { class: "row", style: "margin-bottom:8px" }), back = A.btn("← सूची", "back", () => wrap.classList.remove("showchat")), who = E("b", {}, "किसी यूज़र को चुनें");
  head.append(back, who);
  const box = E("div", { class: "msgs" }), st = E("div", { class: "cs", role: "status" });
  const form = E("form", { class: "sendbar" }), ta = E("textarea", { maxlength: "2000", rows: "1", placeholder: "जवाब लिखें…", "aria-label": "जवाब" }), sendb = E("button", { type: "submit" }, "भेजें");
  form.append(ta, sendb); form.hidden = true;
  const chat = E("div", { class: "chat" }); chat.append(box, st, form); cp.append(head, chat); wrap.append(left, cp); c.append(wrap);
  const fmt = d => new Date(d).toLocaleString("hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function add(m) {
    if (seen.has(m.id)) return; seen.add(m.id);
    const d = E("div", { class: "bub " + (m.is_admin_sender ? "me" : "them") }); d.append(E("span", {}, m.body), E("small", {}, fmt(m.created_at))); box.append(d); box.scrollTop = box.scrollHeight;
  }
  async function loadList() {
    const { data, error } = await sb.rpc("admin_conversations"); if (error) { cl.replaceChildren(E("p", { class: "msg err" }, "सूची नहीं मिली। 07_chat.sql चलाया है?")); return; }
    convs = data || []; paint();
  }
  function paint() {
    const k = q.toLowerCase(), rows = convs.filter(x => !k || (x.name || "").toLowerCase().includes(k) || (x.email || "").toLowerCase().includes(k));
    cl.replaceChildren(...(rows.length ? rows.map(x => {
      const b = E("button", { class: "ci" + (open && open.uid === x.uid ? " on" : ""), type: "button" }), l = E("div");
      l.append(E("b", {}, x.name || x.email || "यूज़र"), E("small", {}, x.last_body)); b.append(l);
      if (Number(x.unread)) b.append(E("span", { class: "badge", style: "position:static" }, String(x.unread)));
      b.onclick = () => openConv(x); return b;
    }) : [E("p", { class: "muted", style: "padding:12px" }, "अभी कोई बातचीत नहीं है।")]));
  }
  async function openConv(u) {
    open = u; seen = new Set(); box.replaceChildren(); who.textContent = u.name || u.email || "यूज़र"; form.hidden = false; wrap.classList.add("showchat");
    const { data } = await sb.from("messages").select("id,body,is_admin_sender,created_at").eq("user_id", u.uid).order("created_at", { ascending: true }).limit(200);
    (data || []).forEach(add); await sb.rpc("mark_messages_read", { p_user: u.uid }); loadList(); ta.focus();
  }
  let tm; const refresh = () => { clearTimeout(tm); tm = setTimeout(loadList, 400); };
  sb.channel("admin-chat").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, p => {
    const m = p.new;
    if (open && m.user_id === open.uid) { add(m); if (!m.is_admin_sender) sb.rpc("mark_messages_read", { p_user: open.uid }); }
    refresh();
  }).subscribe(s => { st.textContent = s === "SUBSCRIBED" ? "लाइव जुड़ा है" : (s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "लाइव कनेक्शन नहीं है — रीफ़्रेश करें" : ""); });
  form.addEventListener("submit", async e => {
    e.preventDefault(); const body = ta.value.trim(); if (!body || !open) return; sendb.disabled = true;
    const { data, error } = await sb.from("messages").insert({ user_id: open.uid, sender_id: me, is_admin_sender: true, body }).select("id,body,is_admin_sender,created_at").single();
    sendb.disabled = false; if (error) return A.toast("जवाब नहीं भेजा जा सका।", false);
    ta.value = ""; add(data); refresh();
  });
  search.oninput = () => { q = search.value.trim(); paint(); };
  loadList();
})();
