document.addEventListener("DOMContentLoaded", async () => {
  const f = document.getElementById("pf"), msg = document.getElementById("msg"), E = NV.el;
  if (!sb) return showMsg(msg, "Supabase अभी सेट नहीं है।");
  const s = await NVAuth.session(); if (!s) { f.replaceWith(E("a", { class: "btn", href: "login.html?next=profile.html" }, "लॉगिन करें")); return; }
  const p = await NVAuth.profile() || {}; f.full_name.value = p.full_name || ""; f.age.value = p.age || ""; f.mobile.value = p.mobile || ""; f.email.value = s.user.email;
  f.addEventListener("submit", async e => {
    e.preventDefault(); const name = f.full_name.value.trim(), age = Number(f.age.value), mobile = f.mobile.value.replace(/\s+/g, "");
    if (name.length < 2) return showMsg(msg, "कृपया अपना पूरा नाम लिखें।");
    if (!(age >= 5 && age <= 120)) return showMsg(msg, "कृपया सही उम्र लिखें।");
    if (!/^[6-9]\d{9}$/.test(mobile)) return showMsg(msg, "10 अंकों का सही मोबाइल नंबर लिखें।");
    const b = f.querySelector(".go"); busy(b, true);
    const { error } = await sb.from("profiles").update({ full_name: name, age, mobile }).eq("id", s.user.id);
    busy(b, false, "सेव करें"); error ? showMsg(msg, "सेव नहीं हो सका। कृपया दोबारा कोशिश करें।") : showMsg(msg, "प्रोफ़ाइल सेव हो गई।", true);
  });
});
