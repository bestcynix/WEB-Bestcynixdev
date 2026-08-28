# Status monitoring

The live status page uses the Vercel serverless endpoint `/api/status` and never calls a public CORS proxy or fabricates uptime values.

- `api/status.js` probes SkylineBOT, Lanyard/Discord, Firebase Hosting, public Firestore CMS access, and the protected Firestore chat endpoint.
- Reports are stored in Supabase Free table `status_reports` with RLS enabled and no anonymous read/write access.
- `.github/workflows/status-monitor.yml` triggers a fresh probe every 10 minutes using the public GitHub repository runner.
- Vercel environment variables required by the API:
  - `SUPABASE_URL=https://eujnhvfgraunjqgymslr.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=<Supabase secret key; never commit this value>`

Firebase Functions code remains in `functions/` as the paid-Firebase deployment path, but it is not required by the free Vercel + Supabase path.
