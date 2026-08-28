# BestCyniX Dev – AI Handoff Contract

## Source of truth

- Static pages live in `public/*.html`.
- Shared visual rules live in `public/css/style.css` and the cross-page responsive contract lives in `public/css/responsive-system.css`.
- Shared behavior lives in `public/js/shared-ui.js`; feature modules are in `public/js/`.
- Homepage CMS fallback data lives in `public/js/cms-loader.js`.
- Firestore and Storage security policies are `firestore.rules` and `storage.rules`.
- Firebase Hosting deploys the `public/` directory as configured in `firebase.json`.
- Affiliate deal eligibility and provider-sync contract live in `public/js/affiliate.js` and `AFFILIATE-OPERATIONS.md`.
- Server-backed status monitoring is implemented in `functions/index.js` and rendered by `public/js/status-monitor.js`.
- Status backend deployment is currently pending Firebase Billing activation. Do not enable billing automatically; after the owner enables it, deploy with `npx -y firebase-tools@latest deploy --only functions:statusApi,functions:statusMonitor`.

## Working rules

1. Preserve existing pages and data unless a change request explicitly removes them.
2. Add new content to the fallback CMS data and the remote `site_cms` document when both are available.
3. Run the static checks and responsive smoke checks before deployment.
4. Keep all new user-controlled values escaped before inserting HTML.
5. Keep public reads limited to public content; never expose account, application, contact, chat, or integration data to guests.
6. Use `minmax(min(100%, <minimum>), 1fr)` for responsive grids and `min-width: 0` on flex/grid children.
7. Record material changes in `ARCHITECTURE.md` or this file so another agent can continue safely.
8. Never render a monetized deal from a direct product URL; require a verified affiliate tracking signal.

## Verification checklist

- HTML pages load without a blocking console error.
- Viewports 320, 375, 768, 1024, and 1440px have no unintended horizontal overflow.
- Project history, timeline, CMS fallback, and remote CMS data agree.
- Firestore/Storage rules pass the Firebase rules deployment validation.
- Deploy only after the local source and security rules are reviewed.
- Status history must come from `site_status_history`/`site_status_daily`; never replace missing telemetry with random or hard-coded uptime values.
- `/api/status` is the only frontend status source. If the function is unavailable, show `UNKNOWN`/empty telemetry and keep the page usable; never fall back to direct browser CORS proxies or fabricated values.
