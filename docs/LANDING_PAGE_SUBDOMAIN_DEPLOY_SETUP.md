# Landing Page Subdomain Deployment Setup

This project now supports:

- Auto-assigned available subdomains on deploy
- Manual subdomain change with availability checks
- Workspace ownership checks for deploy actions
- Auto-updating deployed site per workspace (same workspace/chat keeps updating)

## How It Works

- Deploy API: `POST /api/deploy`
- Availability API: `GET /api/deploy/subdomain?workspaceId=...&value=...`
- Public preview route: `/preview/[subdomain]`
- Middleware rewrite (for wildcard domains): `subdomain.your-domain.com` -> `/preview/subdomain`

When a workspace already has a subdomain and you generate more updates in the same workspace, the deployed page shows the latest workspace code automatically.

## Current Fallback (No Custom Domain Yet)

If `NEXT_PUBLIC_ROOT_DOMAIN` is not set, deploy URLs use:

- `https://your-app.vercel.app/preview/<subdomain>`

So deployment still works even before buying/configuring a custom domain.

## Custom Domain Setup (Vercel + DNS)

Use this when you want URLs like:

- `myclient.yourdomain.com`

### 1) Add Domain in Vercel

1. Open your Vercel project settings
2. Go to `Domains`
3. Add your base/root domain (example: `yourdomain.com`)
4. Add wildcard subdomain: `*.yourdomain.com`

### 2) Configure DNS at Your Domain Provider

Add/confirm these DNS records (values shown by Vercel should be used):

1. `A` record for root (`@`) pointing to Vercel
2. `CNAME` for `www` to Vercel target
3. `CNAME` wildcard record:
   - Host: `*`
   - Value: Vercel target (usually `cname.vercel-dns.com`)

### 3) Set Environment Variable

In Vercel project environment variables:

1. `NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com`

Redeploy after saving env vars.

### 4) Verify

1. Deploy any workspace from landing page builder
2. Check generated URL in deployment modal
3. Open `https://<subdomain>.yourdomain.com`

## Optional Email Notification Settings

`/api/deploy` can send deployment notifications via SMTP.

Set these env vars if needed:

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `DEPLOYMENT_NOTIFICATION_TO` (optional, default is hardcoded fallback)

## Notes

- Subdomains are unique across all workspaces.
- Reserved words are blocked (`www`, `api`, `admin`, etc.).
- If user-entered subdomain is taken, API returns conflict with a suggestion.
- If subdomain is left blank, API auto-selects the first available one.

