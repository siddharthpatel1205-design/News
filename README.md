# NEWSVERSE — News & Media Platform
HTML + CSS + Vanilla JS + Supabase (Auth, PostgreSQL, Storage, Realtime, RLS, Edge Functions). No frameworks. Original brand/UI (name is changeable in Admin → Settings).

## 1. Installation
1. Create a Supabase project (supabase.com).
2. Put the **Project URL** and **anon (public) key** in `js/supabase.js`. Never put the service-role key or the VAPID private key in any frontend file.
3. Host the folder on any static host over **HTTPS** (Netlify, Cloudflare Pages, GitHub Pages, Vercel static) or test locally: `npx serve .` (PWA/service worker need HTTPS or localhost, not `file://`).
4. In Supabase → Auth → URL Configuration, add your site URL (needed for email-confirmation links).

## 2. Database setup (SQL Editor, run each file ONCE, in this order)
`01_schema` → `02_rls_functions` → `03_seed` → `04_news_security` → `05_admin` → `06_media` → `07_chat` → `08_notifications` → `09_subscriptions` → `10_campaigns` → `11_analytics` → `12_audit`
- Fresh project shows "relation already exists"? Check `select count(*) from profiles;` — if 0, run `00_reset.sql` first (deletes all NEWSVERSE tables/data).
- Realtime: `07_chat.sql` adds `messages` to the realtime publication. If live chat does not update, check Database → Replication.

## 3. Storage
Buckets are created by `02_rls_functions.sql`: `news-images`, `news-videos`, `news-audio`, `avatars`, `site-assets` (public read) and `ad-videos` (private; signed URLs, readable only for live campaigns). Only admins can upload/delete (except own avatar). File type and size limits are set on the buckets and checked again in the Admin UI.

## 4. Authentication
Supabase Auth (email + password). Passwords are never stored in our tables. Auth → Providers → Email: decide whether "Confirm email" is on (if on, users confirm by email before logging in).

## 5. Admin setup
Sign up once on the site, then in SQL Editor:
```sql
update profiles set role='admin' where email='you@example.com';
```
(0 rows? `insert into profiles(id,email,role) select id,email,'admin' from auth.users where email='you@example.com' on conflict (id) do update set role='admin';`) → log in at `/admin/`. Admin rights live in the database (`profiles.role`) and are enforced by RLS; no admin email is in the code.

## 6. Day-to-day
- **News**: Admin → खबरें (create, edit, draft/publish/schedule, breaking/trending/premium). Video/Audio pages upload media quickly. Comments: Admin → कमेंट (hide/delete, reported comments).
- **Categories**: Admin → श्रेणियाँ. All categories (even the 3 defaults) can be edited, reordered, disabled or deleted.
- **Subscriptions**: Admin → प्लान (prices/features), कूपन, सब्सक्रिप्शन (also trial users). Trial length and on/off: Admin → Settings. Trial is one per account (database primary key on `trial_usage.user_id`).
- **Coupons**: fixed or percent, max uses, per-user limit, start/expiry. Prices are always computed in the database (`_quote`); a 100% coupon activates the plan without payment; final price never goes below ₹0.
- **Payments are DEMO only.** Before going live, turn off "डेमो भुगतान चालू" in Settings and add a real gateway provider in `js/payment.js` (order via Edge Function; activation only from a verified webhook).
- **Video campaigns**: Admin → वीडियो विज्ञापन. For **logged-in** users watching a news video, at the break point (default 50%, Settings) the server (`claim_campaign`) checks status, window, audience and frequency; ad plays from a short-lived signed URL, then the video resumes. Ads do not run over other apps or when the site is closed; use the "सूचना भेजें" option to notify those users. Videos shorter than 30 s are never interrupted.
- **Notifications**: Admin → नोटिफिकेशन (all / selected users). Push needs the setup below; otherwise users still get in-app notifications.
- **Settings**: name, logo, favicon, colors, footer, maintenance mode (admins still see the site), trial, comments, push, campaigns.

## 7. Push notifications (optional)
1. `npx web-push generate-vapid-keys`
2. Public key → `js/supabase.js` (`VAPID_PUBLIC_KEY`).
3. Supabase secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:you@example.com`).
4. Deploy `supabase/functions/send-push` (CLI `supabase functions deploy send-push`, or paste into Dashboard → Edge Functions).
5. Push needs HTTPS. iPhone: only after "Add to Home Screen" (iOS 16.4+). Not every browser/device supports push.

## 8. PWA
`manifest.webmanifest` + `sw.js` (offline shell only; API/user data are never cached). For best install icons on Android add PNG icons (192/512) to `icons/` and reference them in the manifest.

## 9. Troubleshooting
- Blank lists / "Supabase अभी सेट नहीं है" → `js/supabase.js` still has placeholders.
- "relation already exists" → see section 2.
- Admin login says no permission → run the admin SQL above, log out and in again.
- Chat/notifications not live → Realtime publication (section 2).
- Upload fails → file type/size limit, or you are not admin.
- Ad never shows → campaign must be *live*, inside its time window, you must be logged in, audience/frequency must match, and the video must be ≥ 30 s.

## 10. Testing
See `TESTING.md` (manual checklist for security, coupons, trial, campaigns, responsive, accessibility).
