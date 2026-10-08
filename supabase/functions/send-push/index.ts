// Supabase Edge Function: send-push
// Deploy: supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are provided automatically; the service key stays on the server.)
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    // 1) Only a logged-in ADMIN may trigger pushes (checked in the database, not in the browser)
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const { notification_id } = await req.json();
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: on } = await db.from("site_settings").select("value").eq("key", "push_enabled").maybeSingle();
    if (on && on.value === false) return json({ skipped: "push disabled in settings" });

    const { data: n } = await db.from("notifications").select("*").eq("id", notification_id).single();
    if (!n) return json({ error: "notification not found" }, 404);

    let q = db.from("push_subscriptions").select("id,endpoint,p256dh,auth");
    if (n.audience === "selected") {
      const { data: t } = await db.from("notification_targets").select("user_id").eq("notification_id", n.id);
      q = q.in("user_id", (t ?? []).map((x: { user_id: string }) => x.user_id));
    }
    const { data: subs } = await q;

    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
    const payload = JSON.stringify({ title: n.title, body: n.message ?? "", image: n.image_url ?? undefined, url: n.link ?? "notifications.html" });
    let sent = 0, failed = 0; const gone: string[] = [];
    await Promise.allSettled((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; }
      catch (e) { failed++; const c = (e as { statusCode?: number }).statusCode; if (c === 404 || c === 410) gone.push(s.id); }
    }));
    if (gone.length) await db.from("push_subscriptions").delete().in("id", gone); // expired devices
    return json({ devices: subs?.length ?? 0, sent, failed, removed: gone.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
