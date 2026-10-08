# NEWSVERSE — Progress (resume from here)
Say: "start working from where you left" and continue at the first unchecked phase.

- [x] Phase 1: skeleton, global.css, index.html (sample data), PWA shell
- [x] Phase 2: supabase/01_schema.sql, 02_rls_functions.sql, 03_seed.sql
- [x] Phase 3: auth (signup.html, login.html, css/auth.css, js/auth.js, js/supabase.js). Needs Supabase URL/anon key. In Supabase: Auth → Providers → Email; decide whether "Confirm email" is on.
- [x] Phase 4: news.js, layout.js, search.js, category/article/search pages, supabase/04_news_security.sql (run it after 01-03). Premium body now only via get_article RPC.
- [x] Phase 5 (core): admin/index (login), dashboard, categories, news, news-editor, users, settings + supabase/05_admin.sql. Other admin pages (videos, audio, messages, notifications, video-ads, plans, subscriptions, coupons, analytics) are linked in the sidebar but built in their own phases.
- [x] Phase 6: video.html, audio.html, js/media.js (NVAds hook for Phase 10), admin/videos+audio (js/admin/media.js), supabase/06_media.sql (run after 05)
- [x] Phase 7: messages.html + js/messages.js (user chat), admin/messages.html + js/admin/messages.js (realtime inbox), css/chat.css, supabase/07_chat.sql (run after 06). Also added online presence heartbeat + unread badge on message button in js/auth.js.
- [x] Phase 8: notifications.html + js/notifications.js, js/push.js, sw.js push handlers, admin/notifications (+ js/admin/picker.js reusable user picker), supabase/08_notifications.sql, supabase/functions/send-push (Edge Function, needs VAPID keys). Bell badge added in js/auth.js. NOTE: dashboard.html (user dashboard) still missing -> Phase 9.
- [x] Phase 9: subscription.html, demo-payment.html, js/payment.js (provider abstraction), dashboard.html, profile.html, admin/plans+coupons+subscriptions, supabase/09_subscriptions.sql (run after 08). Pricing/coupon/trial logic stays in 02 + 09 RPCs.
- [x] Phase 10: supabase/10_campaigns.sql (claim_campaign, record_campaign_event, campaign_is_live, admin_campaign_stats), js/ads.js (mid-roll player, hooked into video.html + article.html), admin/video-ads.html + js/admin/video-ads.js (create/edit/start/pause/stop/delete + analytics). Campaigns need logged-in users.
- [x] Phase 11: supabase/11_analytics.sql (admin_analytics RPC + increment_share), admin/analytics.html + js/admin/analytics.js (tiles, top lists, SVG charts, 7/14/30/90 day filter). Share counts now recorded from article page.
- [x] Phase 12 (code part): site.js applies Admin Settings (name/colors/logo/favicon/footer/maintenance), about/contact/privacy/terms/home pages, 12_audit.sql hardening, comment reports + admin/comments, sw v3, README + TESTING.md. NOT done (needs real browser): responsive/a11y verification at all widths, live Supabase end-to-end tests. Run TESTING.md.

## Known TODOs
- Article body is plain text (paragraphs split on blank lines). If admin editor uses rich HTML later, sanitize on render.
- Make first admin via SQL (see end of 03_seed.sql).
- Run supabase/05_admin.sql after 04. Public site does not yet apply site_settings (name/colors/maintenance mode) — do in Phase 12 or earlier.
- Before real payments: switch off "demo_payments_enabled" in Admin → Settings and add a real gateway provider (see js/payment.js).
- Phase 12 TODO list: (1) apply site_settings on public pages (site name, colors, logo/favicon, footer, maintenance mode page; admin bypass), (2) ensure admin/dashboard link & unknown pages (about/contact/privacy/terms/index->home), (3) static security audit of RLS/storage, (4) responsive/a11y pass, (5) full README + test checklist, (6) service worker cache version + file list check.
