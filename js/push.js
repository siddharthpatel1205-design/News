// Web Push (client side). Works only where the browser supports it AND the user allows it; otherwise in-app notifications still work.
const NVPush = {
  supported() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window; },
  key() { const k = window.NV_CONFIG && NV_CONFIG.VAPID_PUBLIC_KEY; return k && !k.startsWith("YOUR") ? k : null; },
  b64(s) { const r = atob((s + "=".repeat((4 - s.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); },
  async current() { if (!this.supported()) return null; const reg = await navigator.serviceWorker.ready; return reg.pushManager.getSubscription(); },
  async enable() {
    if (!this.supported()) throw new Error("आपके ब्राउज़र में पुश नोटिफिकेशन उपलब्ध नहीं है। ऐप के अंदर सूचनाएँ मिलती रहेंगी।");
    if (!this.key()) throw new Error("पुश अभी सेट नहीं है। (VAPID key जोड़नी होगी)");
    if ((await Notification.requestPermission()) !== "granted") throw new Error("अनुमति नहीं मिली। ब्राउज़र की सेटिंग में सूचनाएँ चालू करें।");
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.b64(this.key()) });
    const j = sub.toJSON();
    const { error } = await sb.rpc("register_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    if (error) throw new Error("पुश चालू नहीं हो सका। कृपया दोबारा कोशिश करें।");
  },
  async disable() { const sub = await this.current(); if (sub) { await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); } }
};
