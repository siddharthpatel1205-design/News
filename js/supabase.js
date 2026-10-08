// Only PUBLIC values here. Never put the service-role key or the VAPID PRIVATE key in frontend code.
window.NV_CONFIG = {
  SUPABASE_URL: "https://ocrlssidcrckkrtzgvjw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_E32UkE1_HOpus8XdiLTfPw_ULCwwWb3",
  VAPID_PUBLIC_KEY: "BDJGnLSGYZNSuWKeNbRor6RMsE5xGrfaNV234iT50IY-OQOt1mLdv9RzhSWLfdroBE5Yza0QXT8pZyErKMS7ST4" // public key only (see README → Push)
};
window.NV_CONFIGURED = !window.NV_CONFIG.SUPABASE_URL.includes("YOUR-PROJECT");
// Needs the supabase-js CDN script loaded BEFORE this file.
window.sb = (window.NV_CONFIGURED && window.supabase)
  ? window.supabase.createClient(NV_CONFIG.SUPABASE_URL, NV_CONFIG.SUPABASE_ANON_KEY)
  : null;