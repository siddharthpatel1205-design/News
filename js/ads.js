// Mid-roll video campaigns. In-site only: runs while a LOGGED-IN user watches a news video.
// The server (claim_campaign) decides eligibility, window and frequency; this file only plays the ad and reports events.
const NVAds = {
  sid: (() => { try { let s = sessionStorage.getItem("nv_sid"); if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("nv_sid", s); } return s; } catch (_) { return "nosession"; } })(),
  async attach(main, o) {
    if (!sb || !o || o.kind !== "video") return;
    if (!(await NVAuth.session())) return;
    const wrap = document.createElement("div"); wrap.className = "vwrap"; main.parentNode.insertBefore(wrap, main); wrap.append(main);
    let done = false, point = 50; // break point = % of the main video (Admin → Settings)
    try { const { data } = await sb.from("site_settings").select("value").eq("key", "midroll_percent").maybeSingle(); const v = Number(data && data.value); if (v >= 10 && v <= 90) point = v; } catch (_) {}
    main.addEventListener("timeupdate", () => {
      if (done || main.seeking || !main.duration || main.duration < 30) return; // very short videos are never interrupted
      const pct = main.currentTime / main.duration * 100; if (pct < point) return;
      done = true; if (pct <= point + 8) this.run(main, wrap); // user jumped far past the break by seeking -> no ad
    });
  },
  async run(main, wrap) {
    const sid = this.sid, { data: c } = await sb.rpc("claim_campaign", { p_session: sid }); if (!c) return;
    const ev = t => sb.rpc("record_campaign_event", { p_campaign: c.id, p_event: t, p_session: sid }).then(() => {}, () => {});
    const resumeAt = main.currentTime; main.pause();
    const E = NV.el, ov = E("div", { class: "adov" }), ad = E("video", { playsinline: "", preload: "auto" }), bar = E("div", { class: "adbar" });
    const cd = E("span", {}), skip = E("button", { class: "btn", type: "button" }, "स्किप करें"), more = E("button", { class: "btn", type: "button" }, "और जानें");
    skip.hidden = true; more.hidden = true; bar.append(E("span", { class: "tag" }, "विज्ञापन"), cd, skip, more); ov.append(ad, bar); wrap.append(ov);
    let ended = false, started = false; const hit = new Set();
    const poll = setInterval(async () => { const { data } = await sb.rpc("campaign_is_live", { p_id: c.id }); if (data === false) { ev("closed"); finish(); } }, 10000);
    function finish() { if (ended) return; ended = true; clearInterval(poll); ad.pause(); ov.remove(); main.currentTime = resumeAt; main.play().catch(() => {}); }
    const { data: su, error } = await sb.storage.from("ad-videos").createSignedUrl(c.video_path, 900); // private bucket -> short-lived link
    if (error || !su) { ev("failed"); finish(); return; }
    ad.src = su.signedUrl;
    ad.addEventListener("playing", () => { if (!started) { started = true; ev("started"); } });
    ad.addEventListener("timeupdate", () => {
      if (!ad.duration) return; const p = ad.currentTime / ad.duration * 100;
      [[25, "q25"], [50, "q50"], [75, "q75"]].forEach(([n, k]) => { if (p >= n && !hit.has(k)) { hit.add(k); ev(k); } });
      const left = Math.ceil(ad.duration - ad.currentTime); cd.textContent = left > 0 ? left + " सेकंड" : "";
      if (c.skip_allowed && ad.currentTime >= 5) skip.hidden = false;
    });
    ad.addEventListener("ended", () => { ev("completed"); finish(); });
    ad.addEventListener("error", () => { ev("failed"); finish(); });
    skip.onclick = () => { ev("skipped"); finish(); };
    const dest = c.destination_url ? NVNews.safeUrl(c.destination_url) : "";
    if (dest) { more.hidden = false; more.onclick = () => window.open(dest, "_blank", "noopener,noreferrer"); }
    ad.play().catch(() => { const t = E("button", { class: "btn", type: "button" }, "▶ विज्ञापन चलाएँ"); t.onclick = () => { t.remove(); ad.play().catch(() => { ev("failed"); finish(); }); }; ov.append(t); });
  }
};
