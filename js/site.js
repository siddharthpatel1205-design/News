// Applies Admin → Settings to public pages: site name, colors, logo, favicon, footer, maintenance mode.
// site_settings is public-read by design, so it must never hold secrets.
const NVSite = {
  S: null,
  cache() { try { return JSON.parse(localStorage.getItem("nv_site") || "null"); } catch (_) { return null; } },
  async load() {
    if (this.S || !sb) return this.S;
    const { data } = await sb.from("site_settings").select("key,value");
    if (data) { this.S = Object.fromEntries(data.map(r => [r.key, r.value])); try { localStorage.setItem("nv_site", JSON.stringify(this.S)); } catch (_) {} }
    return this.S;
  },
  color(c) { return /^#[0-9a-fA-F]{6}$/.test(c || "") ? c : null; },
  https(u) { try { return new URL(u).protocol === "https:" ? u : ""; } catch (_) { return ""; } },
  apply(S) {
    S = S || this.S || this.cache(); if (!S) return;
    const root = document.documentElement.style;
    [["primary_color", "--primary"], ["secondary_color", "--secondary"], ["breaking_color", "--breaking"]].forEach(([k, v]) => { const c = this.color(S[k]); if (c) root.setProperty(v, c); });
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc && this.color(S.primary_color)) tc.setAttribute("content", S.primary_color);
    const name = typeof S.site_name === "string" && S.site_name.trim() ? S.site_name.trim().slice(0, 40) : null;
    const logo = this.https(S.logo_url);
    if (name) document.title = document.title.replace(/\|\s*NEWSVERSE\s*$/, "| " + name);
    document.querySelectorAll(".brand").forEach(b => {
      let mark = b.querySelector(".brand-mark, .brand-logo");
      if (logo) { const im = document.createElement("img"); im.className = "brand-logo"; im.src = logo; im.alt = name || ""; mark = im; }
      if (name || logo) b.replaceChildren(...(mark ? [mark] : []), document.createTextNode(name || b.textContent.trim()));
    });
    const fav = this.https(S.favicon_url);
    if (fav) { let l = document.querySelector('link[rel~="icon"]'); if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.append(l); } l.href = fav; }
    const ft = document.getElementById("footerText"); if (ft && typeof S.footer_text === "string" && S.footer_text.trim()) ft.textContent = S.footer_text.slice(0, 200);
  },
  async maintenance(S) {
    if (!S || S.maintenance_mode !== true || /login\.html$/.test(location.pathname)) return;
    const p = sb ? await NVAuth.profile() : null;
    if (p && p.role === "admin") { const b = document.createElement("div"); b.className = "msg err"; b.style.cssText = "position:sticky;top:0;z-index:99;text-align:center"; b.textContent = "मेंटेनेंस मोड चालू है — सिर्फ़ admin को साइट दिख रही है।"; document.body.prepend(b); return; }
    const d = document.createElement("main"); d.className = "wrap"; d.style.cssText = "text-align:center;padding-top:80px";
    const h = document.createElement("h1"); h.textContent = "साइट अभी रखरखाव में है"; const t = document.createElement("p"); t.className = "muted"; t.textContent = "हम जल्द वापस आएँगे। कृपया थोड़ी देर बाद आएँ।";
    const a = document.createElement("a"); a.href = "login.html"; a.className = "btn"; a.textContent = "Admin लॉगिन"; d.append(h, t, a); document.body.replaceChildren(d);
  }
};
document.addEventListener("DOMContentLoaded", async () => { NVSite.apply(); const S = await NVSite.load(); NVSite.apply(S); NVSite.maintenance(S); });
