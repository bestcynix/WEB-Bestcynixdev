# Status monitoring

The live status page uses the Supabase Edge Function `status-api` and never calls a public CORS proxy or fabricates uptime values. Vercel hosts the deployable site and GitHub Actions provides the free scheduled trigger.

- The deployable source is `supabase/functions/status-api/index.ts`; the same code is deployed as Supabase Dashboard Edge Function `status-api`.
- It probes SkylineBOT, Lanyard/Discord, Firebase Hosting, public Firestore CMS access, and the protected Firestore chat endpoint.
- Reports are stored in Supabase Free table `status_reports` with RLS enabled and no anonymous read/write access.
- `.github/workflows/status-monitor.yml` triggers a fresh probe every 10 minutes using the public GitHub repository runner.
- The deployed Edge Function receives its privileged Supabase runtime variables from Supabase; no secret key is committed to GitHub, Vercel, or the browser.

Firebase Functions code remains in `functions/` as the paid-Firebase deployment path, but it is not required by the free Vercel + Supabase path. `api/status.js` remains as a Vercel-compatible server implementation for future use, but the public page uses the Edge Function directly.
