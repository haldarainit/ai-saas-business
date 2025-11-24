# Email Tracking - Testing & Troubleshooting Guide

## Fixes Applied

### 1. **Next.js 15 Compatibility**

- ✅ Updated all dynamic route handlers to await `params` (Next.js 15 requirement)
- ✅ Fixed request header access for Next.js App Router
- ✅ Updated IP and user agent extraction methods

### 2. **Database Connection**

- ✅ Unified MongoDB connection to use TypeScript version with better logging
- ✅ Added explicit `connectDB()` calls before tracking record creation
- ✅ Enhanced error logging throughout the tracking flow

### 3. **Tracking Pixel Implementation**

- ✅ Fixed tracking pixel route with proper async/await
- ✅ Added comprehensive debug logging
- ✅ Improved error handling to always return pixel image

### 4. **Email Service Improvements**

- ✅ Added detailed logging for tracking record creation
- ✅ Ensured database connection before creating records
- ✅ Better error messages for debugging

## Testing Steps

### 1. **Check Database Connection**

Visit: `http://localhost:3000/api/track/debug`

Expected response:

```json
{
  "success": true,
  "totalRecords": 0,
  "recentRecords": []
}
```

### 2. **Send a Test Email**

1. Go to `/get-started/email-automation`
2. Add a recipient email (use your own email)
3. Write a subject and content
4. Click "Start Campaign"
5. Check the server console for logs like:
   ```
   Creating tracking record...
   Campaign ID: [id]
   Tracking ID: [64-char hash]
   Database connected for tracking
   ✅ Tracking record created successfully
   ```

### 3. **Open the Email**

1. Open your email inbox
2. Open the email you received
3. Check the server console for:
   ```
   === Tracking Pixel Request ===
   Tracking ID: [hash]
   Database connected
   Tracking record found: YES
   ✅ Email opened - Tracking ID: [...], Recipient: [email]
   ```

### 4. **View Tracking Dashboard**

1. Go to `/email-tracking`
2. Select your campaign from the dropdown
3. Click "Refresh" to update stats
4. Check the "Overview" tab for metrics
5. Switch to "Recipients" tab to see who opened
6. Check "Analytics" tab for device/browser breakdown

### 5. **Verify Tracking Record**

Visit: `http://localhost:3000/api/track/debug`

Should now show:

```json
{
  "success": true,
  "totalRecords": 1,
  "recentRecords": [
    {
      "id": "...",
      "emailId": "[tracking-id]",
      "recipient": "your@email.com",
      "status": "opened",
      "opens": 1,
      "clicks": 0,
      "sentAt": "..."
    }
  ]
}
```

## Troubleshooting

### Issue: Tracking pixel not recording opens

**Check:**

1. Server console logs for errors
2. Visit `/api/track/debug` to see if records exist
3. Verify MONGODB_URI in .env file
4. Check if email client blocks external images

**Common causes:**

- Email clients like Gmail cache images on Google servers
- Apple Mail Privacy Protection pre-loads images
- Outlook blocks external images by default

### Issue: Dashboard shows no data

**Check:**

1. Verify campaigns exist in `/api/email-history`
2. Check if `campaignId` matches between email and tracking records
3. Look for console errors in browser dev tools
4. Verify tracking records exist via `/api/track/debug`

### Issue: "Invalid tracking ID" error

**Check:**

1. Tracking ID should be 64-character hexadecimal hash
2. Verify tracking records are created when emails are sent
3. Check server logs for "Tracking record created" message

## Debug Endpoints

### `/api/track/debug` (GET)

Lists all tracking records in database

### `/api/track/test-create` (POST)

Create a test tracking record:

```bash
curl -X POST http://localhost:3000/api/track/test-create \
  -H "Content-Type: application/json" \
  -d '{"trackingId": "test123456789012345678901234567890123456789012345678901234"}'
```

### `/api/track/pixel/[trackingId]` (GET)

Test tracking pixel directly in browser

### `/api/track/stats/[campaignId]` (GET)

View campaign statistics

## Console Log Checklist

When an email is sent, you should see:

```
Creating tracking record...
Campaign ID: 6743...
Tracking ID: a7b9c3d...
Recipient: user@example.com
User ID: dev-user-default
Database connected for tracking
✅ Tracking record created successfully
Record ID: 6743...
Email sent successfully to user@example.com
```

When an email is opened, you should see:

```
=== Tracking Pixel Request ===
Tracking ID: a7b9c3d...
Database connected
Tracking record found: YES
Recipient: user@example.com
Tracking data: { ipAddress: '...', userAgent: '...', ... }
✅ Email opened - Tracking ID: a7b9c3d..., Recipient: user@example.com
```

## Expected Behavior

1. **Email Sent** → Tracking record created with status "sent"
2. **Email Opened** → Record updated with open timestamp, device info
3. **Link Clicked** → Record updated with click data
4. **Dashboard View** → Shows all tracking data in real-time

## Privacy Notes

Some email clients prevent accurate tracking:

- **Gmail**: Caches images on Google's proxy servers
- **Apple Mail**: Pre-loads images (may show false opens)
- **Outlook**: Blocks external images by default
- **Privacy-focused clients**: May block all tracking

This is expected behavior and affects all email tracking systems.
