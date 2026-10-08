(async () => {
  const c = await NVAdmin.init("श्रेणियाँ"); if (!c) return;
  const A = NVAdmin; let editing = null, rows = [];
  const f = NV.el("form", { class: "fm" });
  const title = A.inp("title", "text", { required: "", maxlength: "80" }), slug = A.inp("slug", "text", { maxlength: "60", placeholder: "खाली छोड़ें तो अपने-आप बनेगा" }),
        order = A.inp("sort_order", "number", { value: "0" }), file = A.inp("img", "file", { accept: "image/jpeg,image/png,image/webp" }), act = A.chk("is_active", "चालू (दिखे)");
  act.firstChild.checked = true;
  const save = NV.el("button", { class: "ib p", type: "submit" }, "सेव करें"), clr = A.btn("नई श्रेणी", "", () => reset());
  f.append(A.fld("श्रेणी का नाम", title), A.fld("स्लग (URL)", slug), A.fld("क्रम संख्या", order), A.fld("फ़ोटो (अधिकतम 2 MB)", file), act, NV.el("div", { class: "row" }));
  f.lastChild.append(save, clr);
  const list = NV.el("div"); c.append(f, list);
  function reset(r) { editing = r || null; title.value = r?.title || ""; slug.value = r?.slug || ""; order.value = r?.sort_order ?? rows.length + 1; file.value = ""; act.firstChild.checked = r ? r.is_active : true; save.textContent = r ? "बदलाव सेव करें" : "श्रेणी जोड़ें"; if (r) title.focus(); }
  async function load() {
    const { data, error } = await sb.from("categories").select("*").order("sort_order"); if (error) return A.toast("सूची नहीं मिल सकी।", false);
    rows = data;
    list.replaceChildren(A.table(["क्रम", "नाम", "स्लग", "स्थिति", "कार्य"], rows.map((r, i) => {
      const acts = NV.el("div", { class: "row" });
      acts.append(A.btn("↑", "", () => swap(i, i - 1)), A.btn("↓", "", () => swap(i, i + 1)), A.btn("बदलें", "", () => { reset(r); scrollTo(0, 0); }), A.btn("हटाएँ", "d", () => del(r)));
      return [r.sort_order, r.title, r.slug, NV.el("span", { class: "sb " + (r.is_active ? "live" : "") }, r.is_active ? "चालू" : "बंद"), acts];
    })));
    if (!editing) order.value = rows.length + 1;
  }
  async function swap(i, j) {
    if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j], ao = a.sort_order, bo = b.sort_order === a.sort_order ? ao + (j > i ? 1 : -1) : b.sort_order;
    await sb.from("categories").update({ sort_order: bo }).eq("id", a.id); await sb.from("categories").update({ sort_order: ao }).eq("id", b.id); load();
  }
  async function del(r) {
    if (!confirm("“" + r.title + "” हटाएँ? इसकी खबरें बनी रहेंगी, पर बिना श्रेणी के।")) return;
    const { error } = await sb.from("categories").delete().eq("id", r.id);
    error ? A.toast("हटाया नहीं जा सका।", false) : (A.toast("श्रेणी हटा दी गई।"), load());
  }
  f.onsubmit = async e => {
    e.preventDefault(); save.disabled = true;
    try {
      const t = title.value.trim(); if (!t) throw new Error("नाम लिखें।");
      let s = slug.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "c-" + Date.now().toString(36);
      const row = { title: t, slug: s, sort_order: Number(order.value) || 0, is_active: act.firstChild.checked };
      if (file.files[0]) row.image_url = await A.upload("news-images", file.files[0], 2, ["image/jpeg", "image/png", "image/webp"]);
      const { error } = editing ? await sb.from("categories").update(row).eq("id", editing.id) : await sb.from("categories").insert(row);
      if (error) throw new Error(error.code === "23505" ? "यह स्लग पहले से है। कोई दूसरा लिखें।" : "सेव नहीं हो सका।");
      A.toast("श्रेणी सेव हो गई।"); reset(); load();
    } catch (er) { A.toast(er.message, false); } finally { save.disabled = false; }
  };
  await load(); reset();
})();
