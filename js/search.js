// Search with recent searches (kept only in this browser) and suggestions.
document.addEventListener("DOMContentLoaded", async () => {
  const f = document.getElementById("sf"), q = document.getElementById("q2"), out = document.getElementById("grid"),
        st = document.getElementById("state"), rc = document.getElementById("recent"), dl = document.getElementById("sugg"), more = document.getElementById("more");
  const KEY = "nv_recent"; let term = "", off = 0; const size = 20;
  const recents = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const remember = t => { try { localStorage.setItem(KEY, JSON.stringify([t, ...recents().filter(x => x !== t)].slice(0, 6))); } catch {} };
  function paintRecent() {
    rc.replaceChildren(); const r = recents(); if (!r.length) return;
    rc.append(NV.el("span", { class: "muted" }, "हाल की खोज: "));
    r.forEach(t => { const b = NV.el("button", { class: "btn", type: "button" }, t); b.onclick = () => { q.value = t; run(true); }; rc.append(b, " "); });
  }
  (await NVNews.categories()).forEach(c => dl.append(NV.el("option", { value: c.title })));
  recents().forEach(t => dl.append(NV.el("option", { value: t })));
  async function run(fresh) {
    if (fresh) { term = q.value.trim().slice(0, 80); off = 0; out.replaceChildren(); }
    if (!term) { st.textContent = "कुछ लिखकर खोजें।"; return; }
    if (!sb) { st.textContent = "Supabase अभी सेट नहीं है।"; return; }
    st.textContent = "खोज रहे हैं…"; more.hidden = true;
    const { data, error } = await sb.rpc("search_news", { p_q: term, p_limit: size, p_offset: off });
    if (error) { st.textContent = "खोज नहीं हो सकी। कृपया दोबारा कोशिश करें।"; return; }
    (data || []).forEach((n, i) => out.append(NVNews.card(n, off + i)));
    off += (data || []).length;
    st.textContent = out.children.length ? "" : "“" + term + "” के लिए कोई खबर नहीं मिली। दूसरा शब्द आज़माएँ।";
    if (fresh && out.children.length) { remember(term); paintRecent(); }
    more.hidden = (data || []).length < size;
  }
  f.addEventListener("submit", e => { e.preventDefault(); run(true); });
  more.addEventListener("click", () => run(false));
  paintRecent();
  const init = new URLSearchParams(location.search).get("q"); if (init) { q.value = init; run(true); }
});
