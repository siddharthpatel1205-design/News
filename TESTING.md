# NEWSVERSE — Test checklist (run after setup)
Use two normal accounts (A, B) and one admin. Tick each line.

## Auth
- [ ] Signup (all fields) → lands on subscription page (or "confirm email" message)
- [ ] Duplicate email → friendly message · wrong password → friendly message
- [ ] Logout / login · refresh keeps session

## Admin security
- [ ] Logged out or normal user opens `/admin/dashboard.html` → sent to home
- [ ] As A in browser console: `await sb.from('categories').insert({title:'x',slug:'x'})` → error (RLS)
- [ ] Same for `news`, `plans`, `coupons`, `video_campaigns` inserts → all error
- [ ] `await sb.from('profiles').update({role:'admin'}).eq('id', <A id>)` → error "role change not allowed"
- [ ] `await sb.rpc('send_notification',{...})`, `admin_stats`, `admin_analytics` as A → "not allowed"

## RLS / privacy
- [ ] A sends a chat message; B's `await sb.from('messages').select()` shows none of A's
- [ ] A cannot read B's profile: `await sb.from('profiles').select().eq('id', <B id>)` → empty
- [ ] A cannot insert into `subscriptions` / `trial_usage` / `coupon_usage` directly → error
- [ ] A cannot edit someone else's comment; cannot un-hide own hidden comment

## Storage
- [ ] Non-admin upload to `news-images`, `ad-videos` → denied
- [ ] Wrong file type / too big in Admin → friendly error
- [ ] Non-live campaign video path cannot be signed by a normal user

## XSS
- [ ] Post comment `<img src=x onerror=alert(1)>`, name `<script>`, search `<b>` → shown as plain text, no popup

## Trial
- [ ] Start trial → expiry = start + trial days · logout/login/other browser → same expiry
- [ ] Start again → "ट्रायल पहले ही इस्तेमाल हो चुका है" · Admin → Settings: disable trial → button hidden
- [ ] In SQL set `expires_at` in the past → premium news locks, trial does not restart

## Coupons (Admin creates; user previews on Subscription page)
- [ ] Valid fixed (₹299 − SAVE100 = ₹199) · valid percent · 100% → ₹0, no payment page, plan active
- [ ] Invalid · expired · future start · max uses reached · per-user limit reached → proper Hindi message
- [ ] Discount larger than price → final ₹0 (never negative)

## Subscription
- [ ] Monthly vs Annual price/saving changes · demo payment page shows DEMO banner · active plan expiry correct
- [ ] Basic (non-premium) plan does not open premium news; Premium plan does
- [ ] Admin cancels subscription → access ends

## Video campaigns (use a video ≥ 30 s; campaign live, window includes now)
- [ ] Ad appears once at the break point, main video resumes at same second
- [ ] Skip appears after 5 s only when allowed · events recorded (Admin → analytics numbers move)
- [ ] Audience: all / logged-in / premium / free / selected / online each match correctly
- [ ] Frequency: once per session · every X minutes · max per day
- [ ] Pause/Stop → new videos get no ad; playing ad closes within ~10 s · outside window → no ad

## Chat & notifications
- [ ] User ↔ Admin messages appear live both ways · unread badge works
- [ ] Notification to one user / selected / all · bell badge · read / delete
- [ ] Push (after VAPID setup): arrives with site closed; unsupported browser shows in-app only

## Site settings
- [ ] Change name/colors/logo/footer → public pages update · Maintenance on → normal user sees maintenance page, admin sees site

## Responsive (browser DevTools device mode)
Widths: 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920
- [ ] No sideways scroll · cards/grids OK · modals/video fit · admin sidebar opens with ☰ on mobile · bottom nav/message button don't overlap content

## Accessibility
- [ ] Tab through header, forms, buttons: visible focus · every input has a label · images have alt (`alt=""` only for decorative)
- [ ] Text readable at 200% zoom · contrast OK in light & dark

## Performance
- [ ] Lists load 12–20 items with "more" button · images lazy load · Network tab shows no private data cached by the service worker
