# External Cron Setup (cron-job.org)

This project now supports triggering email campaign processing via an external HTTP cron, suitable for Vercel free plans where always-on processes are not available.

## Summary

- Internal cron via `node-cron` is disabled by default on Vercel.
- A secure HTTP endpoint is available at `/api/cron/email-campaign`.
- 
- Use `cron-job.org` (or any scheduler) to call this endpoint on a schedule.

## Environment Variables Setup

### 1. Copy the Example File

- Copy `example.env` to `.env.local` for local development.
- Fill in your actual values (see below for details).

### 2. Vercel Deployment

Set these in your Vercel Project Settings → Environment Variables (then redeploy):

#### Required for Cron

- `CRON_SECRET`: A strong random token used to authorize cron requests. Example: `s3cUr3-Long-Token-Here`.
- `ENABLE_INTERNAL_CRON`: Set to `false` (default) on Vercel. For local development, set to `true` if you want the in-process scheduler to run automatically.

#### Other Required Variables

- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for JWT authentication.
- `EMAIL_USER`: Your email address (e.g., info@myhai.in).
- `EMAIL_PASSWORD`: Your email password (from Hostinger).
- `GOOGLE_API_KEY`: Your Google Gemini API key.
- `OPENAI_API_KEY`: Your OpenAI API key for image generation.

### Example .env.local (Local Development)

```bash
# Copy from example.env and fill in:
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/business-ai
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=info@myhai.in
EMAIL_PASSWORD=your-hostinger-email-password
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
CRON_SECRET=your-cron-secret-token
ENABLE_INTERNAL_CRON=true  # Set to true for local dev
```

## HTTP Endpoint

- Method: `GET`
- Path: `/api/cron/email-campaign`
- Auth: Provide the secret via either:
  - Query: `?token=<CRON_SECRET>`
  - Header: `X-Cron-Secret: <CRON_SECRET>`

### Query Parameters

- `token` (string, required unless header used): Authorization token.
- `userId` (string, optional): Only process campaigns for a specific user.
- `all` (boolean string, optional): If `true`, processes one tick for each active campaign's user.
- `runs` (number, optional): How many ticks to run per selected scheduler instance. Default `1`, max `50`.

### Examples

- Single global/default tick:
  - `GET https://<your-domain>/api/cron/email-campaign?token=YOUR_SECRET`
- Run 5 ticks for a single user:
  - `GET https://<your-domain>/api/cron/email-campaign?userId=abc123&runs=5&token=YOUR_SECRET`
- Run 1 tick for each active campaign's user:
  - `GET https://<your-domain>/api/cron/email-campaign?all=true&token=YOUR_SECRET`

## cron-job.org Configuration

1. Create a new job.
2. Set URL to your chosen endpoint (e.g., `https://<your-domain>/api/cron/email-campaign?token=YOUR_SECRET`).
   - Alternatively, omit `token` in the URL and add a header: `X-Cron-Secret: YOUR_SECRET`.
3. Method: `GET`.
4. Schedule: Every minute (recommended) or as needed.
5. Timeout: 30 seconds is sufficient.
6. Save.

## Local Testing (PowerShell)

```powershell
# Single tick (default/global)
Invoke-WebRequest -Uri "https://<your-domain>/api/cron/email-campaign?token=YOUR_SECRET" -Method GET | Select-Object -ExpandProperty Content

# All active users, 2 ticks each
Invoke-WebRequest -Uri "https://<your-domain>/api/cron/email-campaign?all=true&runs=2&token=YOUR_SECRET" -Method GET | Select-Object -ExpandProperty Content
```

## Notes

- When `ENABLE_INTERNAL_CRON` is `false`, the scheduler will not auto-start in serverless environments and expects external triggers.
- The endpoint is idempotent per tick: each call processes up to one email per targeted campaign per tick (unless `runs` > 1).
- Daily send limits and campaign status are enforced by the existing logic.
