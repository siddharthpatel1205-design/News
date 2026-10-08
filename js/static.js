// Contact page: show the contact email from Admin → Settings.
document.addEventListener("DOMContentLoaded", async () => {
  const el = document.getElementById("mail"); if (!el || !sb) return;
  const S = await NVSite.load(); const m = S && typeof S.contact_email === "string" ? S.contact_email.trim() : "";
  if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(m)) { el.href = "mailto:" + m; el.textContent = m; }
});
