# Production Deployment Guide

## Issues Fixed

### 1. ✅ Dynamic Route Conflict

**Problem**: Next.js error - "You cannot use different slug names for the same dynamic path ('id' !== 'trackingId')"

**Solution**: Removed duplicate `[trackingId]` folder. The app now uses the standard `[id]` parameter name for all tracking routes:

- `/api/track/click/[id]` - Link click tracking
- `/api/track/pixel/[id]` - Email open tracking

### 2. ✅ Authentication Configuration

**Problem**: Login not working in production

**Solution**: Added proper NextAuth environment variables and configuration.

---

## Environment Variables for Production

### Required Environment Variables

Add these to your production environment (Vercel/hosting platform):

```bash
# ============================================
# CRITICAL: Update these for production
# ============================================

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-random-secret-here

# Backend API URL (usually same as NEXTAUTH_URL)
NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com

# Base URL for email tracking links
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# ============================================
# Google OAuth (from Google Cloud Console)
# ============================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# ============================================
# Database
# ============================================
MONGODB_URI=your-mongodb-connection-string

# ============================================
# Email Service (Hostinger SMTP)
# ============================================
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-email-password

# ============================================
# AI Services
# ============================================
GOOGLE_API_KEY=your-gemini-api-key

# ============================================
# Security
# ============================================
JWT_SECRET=generate-another-strong-secret

# Cron job security (if using external cron)
CRON_SECRET=your-cron-secret

# ============================================
# Cron Configuration
# ============================================
# For Vercel/serverless: set to false (use external cron)
ENABLE_INTERNAL_CRON=false

# ============================================
# Environment
# ============================================
NODE_ENV=production
```

---

## Step-by-Step Production Setup

### 1. Generate Secrets

Generate strong random secrets for production:

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
-join ((33..126) | Get-Random -Count 32 | % {[char]$_})

# Or use online generator:
# https://generate-secret.vercel.app/32
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project or create a new one
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Add Authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
5. Copy Client ID and Client Secret
6. Add them to your production environment variables

### 3. Configure MongoDB

1. Use MongoDB Atlas for production
2. Ensure connection string includes:
   - Username and password
   - Proper database name
   - `retryWrites=true&w=majority`
3. Add your hosting platform's IP to MongoDB whitelist (or use `0.0.0.0/0` for all IPs)

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Add Environment Variables in Vercel:

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add all variables from the list above
4. Make sure to select "Production" environment
5. Redeploy after adding variables

### 5. Set Up External Cron (for Vercel)

Since Vercel doesn't support long-running processes, use external cron:

#### Option A: Vercel Cron Jobs (Recommended)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/email-campaign",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Option B: External Service (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org)
2. Create free account
3. Add new cron job:
   - URL: `https://yourdomain.com/api/cron/email-campaign`
   - Schedule: Every minute
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### 6. Test Production Deployment

1. **Test Authentication**:

   - Visit `https://yourdomain.com`
   - Click "Sign in with Google"
   - Verify successful login

2. **Test Email Sending**:

   - Go to Email Automation
   - Send test email to yourself
   - Check if email arrives

3. **Test Link Tracking**:

   - Add CTA button with link
   - Send test email
   - Click link in email
   - Check analytics dashboard

4. **Test Email Analytics**:
   - Visit `/email-analytics`
   - Verify metrics are displayed
   - Check if clicks are tracked

---

## Common Production Issues

### Issue: "Invalid callback URL"

**Solution**: Add correct callback URL in Google OAuth settings:

```
https://yourdomain.com/api/auth/callback/google
```

### Issue: Database connection timeout

**Solution**:

- Check MongoDB Atlas IP whitelist
- Verify connection string is correct
- Ensure network access is enabled

### Issue: Emails not sending

**Solution**:

- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Check Hostinger SMTP settings
- Test with different email provider if needed

### Issue: Cron jobs not running

**Solution**:

- Ensure ENABLE_INTERNAL_CRON=false on Vercel
- Set up external cron trigger
- Check cron secret matches

### Issue: Link tracking not working

**Solution**:

- Verify NEXT_PUBLIC_BASE_URL is set to production URL
- Check tracking routes are deployed
- Look for errors in Vercel logs

---

## Security Checklist

- ✅ Use strong random secrets (32+ characters)
- ✅ Never commit `.env.local` to git
- ✅ Use environment variables in production
- ✅ Enable HTTPS (automatic on Vercel)
- ✅ Restrict MongoDB access by IP
- ✅ Rotate secrets periodically
- ✅ Use secure SMTP (SSL/TLS)
- ✅ Validate all user inputs
- ✅ Enable CORS only for your domain

---

## Monitoring & Logging

### Vercel Dashboard

- Check Function Logs for errors
- Monitor bandwidth and function invocations
- Set up log drains if needed

### MongoDB Atlas

- Monitor database connections
- Check query performance
- Set up alerts for issues

### Email Tracking

- Monitor analytics dashboard
- Check for failed email sends
- Review click-through rates

---

## Rollback Procedure

If issues occur in production:

1. **Quick Rollback**:

   ```bash
   vercel rollback
   ```

2. **Revert to specific deployment**:

   - Go to Vercel Dashboard
   - Deployments → Select previous working version
   - Click "Promote to Production"

3. **Check logs**:
   ```bash
   vercel logs --follow
   ```

---

## Support & Troubleshooting

### Debug Mode

Enable debug logging in production (temporarily):

```bash
# Add to environment variables
DEBUG=*
```

### Check Health

Create health check endpoint to verify services:

- Database: `/api/health/db`
- Email: `/api/health/email`
- Auth: `/api/health/auth`

---

## Performance Optimization

1. **Enable Edge Functions** (in `vercel.json`):

   ```json
   {
     "functions": {
       "app/api/**/*.js": {
         "memory": 1024,
         "maxDuration": 10
       }
     }
   }
   ```

2. **Use Connection Pooling** (MongoDB):

   - Already implemented in `lib/mongodb.js`
   - Reuses connections across requests

3. **Cache Static Assets**:
   - Next.js handles this automatically
   - CDN caching on Vercel Edge Network

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain
4. ✅ Add SSL certificate (automatic on Vercel)
5. ✅ Set up backup strategy for database
6. ✅ Document any custom configurations
7. ✅ Train team on production environment

---

## Quick Reference

| Feature          | Development URL               | Production URL                |
| ---------------- | ----------------------------- | ----------------------------- |
| Homepage         | http://localhost:3000         | https://yourdomain.com        |
| Email Automation | /get-started/email-automation | /get-started/email-automation |
| Analytics        | /email-analytics              | /email-analytics              |
| Click Tracking   | /api/track/click/[id]         | /api/track/click/[id]         |
| Auth Callback    | /api/auth/callback/google     | /api/auth/callback/google     |

---

**Deployment Status**: ✅ Ready for Production

All issues fixed and environment configured for production deployment!
