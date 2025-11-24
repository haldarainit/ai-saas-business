# Email Tracking Implementation

## Overview

A comprehensive email tracking system has been implemented using tracking pixels and link tracking to monitor email opens, clicks, and user engagement.

## Features

### 1. Tracking Pixels

- **Invisible 1x1 pixel image** embedded in emails
- Tracks when recipients open emails
- Records multiple opens from the same recipient
- Captures device, browser, OS, and IP address information

### 2. Link Tracking

- All links in emails are automatically wrapped with tracking URLs
- Redirects users to original destination after logging the click
- Tracks which links are most clicked
- Captures device and location data for each click

### 3. Detailed Analytics

- **Campaign-level statistics**: Open rates, click rates, total sent
- **Recipient-level tracking**: Individual opens and clicks per recipient
- **Device breakdown**: Desktop, mobile, tablet usage
- **Browser statistics**: Chrome, Safari, Firefox, etc.
- **Engagement timeline**: Opens and clicks over time
- **Top performers**: Most engaged recipients

## Files Created

### Models

- `lib/models/EmailTracking.js` - MongoDB schema for tracking data

### Utilities

- `lib/tracking-utils.js` - Helper functions for tracking implementation
  - Generate tracking IDs
  - Parse user agents
  - Wrap links with tracking
  - Embed tracking pixels
  - Extract client IP addresses

### API Endpoints

#### 1. Tracking Pixel Endpoint

**Route**: `/api/track/pixel/[trackingId]`

- Serves 1x1 transparent GIF pixel
- Logs email open events
- Records timestamp, IP, user agent, device info

#### 2. Link Click Endpoint

**Route**: `/api/track/click/[trackingId]?url=<destination>`

- Logs click events
- Redirects to original URL
- Records click metadata

#### 3. Statistics Endpoint

**Route**: `/api/track/stats/[campaignId]`

- **GET**: Retrieve campaign statistics
  - Query param `?detail=summary` for overview (default)
  - Query param `?detail=detailed` for comprehensive analytics
- **POST**: Get tracking details for specific recipient
  - Body: `{ "recipientEmail": "user@example.com" }`

## Usage

### Automatic Tracking

Tracking is automatically enabled for all emails sent through the campaign system. No additional configuration required.

### Email Service Integration

The `EmailService` class now accepts tracking options:

```javascript
const result = await emailService.sendEmail(
  recipient,
  subject,
  htmlContent,
  textContent,
  {
    enableTracking: true,
    campaignId: "campaign-id",
    userId: "user-id",
    baseUrl: "https://yourdomain.com",
  }
);
```

### Retrieving Campaign Statistics

#### Summary Stats

```javascript
const response = await fetch("/api/track/stats/[campaignId]");
const data = await response.json();
// Returns: totalSent, totalOpened, totalClicked, openRate, clickRate
```

#### Detailed Analytics

```javascript
const response = await fetch("/api/track/stats/[campaignId]?detail=detailed");
const data = await response.json();
// Returns: stats + recipients, timeline, topRecipients, deviceStats, browserStats, clickedLinks
```

#### Recipient Details

```javascript
const response = await fetch("/api/track/stats/[campaignId]", {
  method: "POST",
  body: JSON.stringify({ recipientEmail: "user@example.com" }),
});
const data = await response.json();
// Returns: complete tracking record with all opens and clicks
```

## Tracking Data Structure

### EmailTracking Model

```javascript
{
  campaignId: ObjectId,
  emailId: String (tracking ID),
  recipientEmail: String,
  userId: String,

  // Events
  opens: [{
    timestamp, ipAddress, userAgent,
    location: { country, region, city },
    device: { type, browser, os }
  }],

  clicks: [{
    timestamp, url, ipAddress, userAgent,
    location: { country, region, city },
    device: { type, browser, os }
  }],

  // Statistics
  firstOpenedAt: Date,
  lastOpenedAt: Date,
  totalOpens: Number,
  uniqueOpens: Number,
  totalClicks: Number,
  uniqueClicks: Number,

  status: String // 'sent', 'opened', 'clicked', 'bounced', 'complained'
}
```

## Privacy Considerations

### Email Client Limitations

Some email clients block tracking pixels:

- Apple Mail Privacy Protection (preloads images)
- Gmail (caches images on Google servers)
- Outlook (blocks external images by default)

### Best Practices

- Always provide value in emails, don't rely solely on tracking
- Respect user privacy and provide opt-out options
- Use tracking data to improve content, not for invasive purposes
- Comply with GDPR, CAN-SPAM, and other privacy regulations

## Future Enhancements

### Potential Additions

1. **IP Geolocation**: Integrate with IP geolocation service (ipapi.co, MaxMind)
2. **Bounce Handling**: Track bounced emails and update status
3. **Spam Complaints**: Monitor complaint rates
4. **A/B Testing**: Track performance of different email variants
5. **Unsubscribe Tracking**: Monitor unsubscribe events
6. **Real-time Notifications**: Webhook alerts for important events
7. **Export Reports**: Generate CSV/PDF reports of tracking data
8. **Heatmaps**: Visual representation of click patterns

## Technical Notes

### Performance

- Tracking pixel requests are lightweight (1x1 GIF)
- No-cache headers prevent email client caching
- Indexes on frequently queried fields
- Aggregation pipelines for efficient statistics

### Security

- Tracking IDs are SHA256 hashes (non-reversible)
- No sensitive data in URLs
- Validation of tracking ID format
- CORS headers for cross-origin requests

### Reliability

- Graceful degradation if tracking fails
- Emails still sent even if tracking record creation fails
- Always returns pixel image, even on errors
- Fallback redirects for click tracking errors
