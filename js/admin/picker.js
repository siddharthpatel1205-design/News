// Reusable user picker (search, select, remove, select all, clear all). Reused by video campaigns.
const NVPicker = {
  create() {
    const E = NV.el, sel = new Map(); let rows = [];
    const root = E("div"), q = E("input", { class: "ib", type: "search", placeholder: "नाम या ईमेल से खोजें", "aria-label": "यूज़र खोजें", style: "width:100%" }),
          list = E("div", { style: "max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:10px;margin:8px 0" }), chips = E("div", { class: "row", style: "margin-top:8px" }), cnt = E("small", { class: "muted" });
    const bar = E("div", { class: "row" });
    const all = E("button", { class: "ib", type: "button" }, "सब चुनें"), none = E("button", { class: "ib", type: "button" }, "सब हटाएँ");
    bar.append(all, none, cnt); root.append(q, list, bar, chips);
    const name = u => u.full_name || u.email || "यूज़र";
    function paintChips() {
      chips.replaceChildren(...[...sel].map(([id, n]) => { const b = E("button", { class: "ib", type: "button" }, n + " ✕"); b.onclick = () => { sel.delete(id); paintChips(); paintList(); }; return b; }));
      cnt.textContent = sel.size + " चुने गए";
    }
    function paintList() {
      list.replaceChildren(...(rows.length ? rows.map(u => {
        const l = E("label", { class: "ck", style: "padding:8px 10px;display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--line)" }), c = E("input", { type: "checkbox", style: "width:22px;height:22px" });
        c.checked = sel.has(u.id); c.onchange = () => { c.checked ? sel.set(u.id, name(u)) : sel.delete(u.id); paintChips(); };
        l.append(c, E("span", {}, name(u) + (u.email && u.full_name ? " (" + u.email + ")" : ""))); return l;
      }) : [E("p", { class: "muted", style: "padding:10px" }, "कोई यूज़र नहीं मिला।")]));
    }
    async function find() {
      let r = sb.from("profiles").select("id,full_name,email").order("created_at", { ascending: false }).limit(30);
      const k = q.value.trim().replace(/[%_\\,()]/g, ""); if (k) r = r.or("full_name.ilike.%" + k + "%,email.ilike.%" + k + "%");
      const { data } = await r; rows = data || []; paintList();
    }
    let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(find, 300); };
    all.onclick = () => { rows.forEach(u => sel.set(u.id, name(u))); paintChips(); paintList(); };
    none.onclick = () => { sel.clear(); paintChips(); paintList(); };
    find(); paintChips();
    return { el: root, set: entries => { sel.clear(); entries.forEach(([id, n]) => sel.set(id, n)); paintChips(); paintList(); }, ids: () => [...sel.keys()], clear: () => { sel.clear(); paintChips(); paintList(); } };
  }
};
