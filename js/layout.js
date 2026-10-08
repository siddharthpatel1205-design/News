// Shared header / category bar / bottom nav / message button for inner pages.
document.addEventListener("DOMContentLoaded", async () => {
  const E = NV.el, home = document.body.dataset.page === "home";
  const top = E("header", { class: "top" });
  const brand = E("a", { class: "brand", href: "index.html" }); brand.append(E("span", { class: "brand-mark" }, "N"), "न्यूज़वर्स");
  const form = E("form", { class: "search", action: "search.html", role: "search" });
  form.append(E("label", { class: "sr", for: "hq" }, "खोजें"), E("input", { id: "hq", name: "q", type: "search", placeholder: "खबर खोजें…", autocomplete: "off" }));
  top.append(brand, form, E("a", { class: "btn", href: "login.html", id: "loginBtn" }, "लॉगिन"));
  const nav = E("nav", { class: "cats", "aria-label": "श्रेणियाँ" });
  const bottom = E("nav", { class: "bottom", "aria-label": "मुख्य मेनू" });
  [["index.html", "होम"], ["category.html", "श्रेणी"], ["video.html", "वीडियो"], ["search.html", "खोज"], ["dashboard.html", "मेरा खाता"]]
    .forEach(([h, t]) => { const a = E("a", { href: h }, t); if (location.pathname.endsWith(h)) a.className = "on"; bottom.append(a); });
  document.body.prepend(nav); document.body.prepend(top);
  document.body.append(bottom, E("a", { class: "fab", href: "messages.html", "aria-label": "संदेश भेजें" }, "💬"));
  nav.append(E("a", { href: "index.html" }, "होम"));
  (await NVNews.categories()).forEach(c => nav.append(E("a", { href: "category.html?c=" + encodeURIComponent(c.slug) }, c.title)));
  NVAuth.refreshHeader();
  if (!document.querySelector(".foot")) {
    const f = E("footer", { class: "foot" }), links = E("p");
    [["about.html", "हमारे बारे में"], ["contact.html", "संपर्क"], ["privacy.html", "प्राइवेसी"], ["terms.html", "नियम"]].forEach(([h, t], i) => { if (i) links.append(" • "); links.append(E("a", { href: h }, t)); });
    f.append(links, E("p", { id: "footerText" }, "© NEWSVERSE")); document.body.insertBefore(f, bottom);
  }
  if (window.NVSite) NVSite.apply();
});
