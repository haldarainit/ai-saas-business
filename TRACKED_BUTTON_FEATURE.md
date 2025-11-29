# Tracked CTA Button Feature - Complete Guide

## 🎯 Overview

The tracked button feature allows users to insert beautiful, clickable CTA (Call-to-Action) buttons anywhere in their email templates. Every click on these buttons is automatically tracked, and webhooks are triggered to notify external systems.

## ✨ Features

### 1. **Easy Button Insertion**

- Click the "CTA" button in the email template editor toolbar
- Configure button text, URL, and style
- Insert multiple buttons anywhere in your email

### 2. **5 Beautiful Button Styles**

- **Primary**: Purple gradient (default)
- **Success**: Green gradient
- **Danger**: Red gradient
- **Warning**: Orange gradient
- **Dark**: Dark gray gradient

### 3. **Automatic Click Tracking**

- All button clicks are automatically tracked
- Stores click data: timestamp, IP address, user agent, device info
- Updates email status from "sent" → "opened" → "clicked"
- Tracks multiple clicks from same recipient

### 4. **Webhook Integration**

- Automatic webhook trigger on each click
- Webhook payload includes:
  - `trackingId`: Unique tracking identifier
  - `recipient`: Email address of clicker
  - `subject`: Email subject line
  - `url`: Destination URL that was clicked
  - `clickedAt`: ISO timestamp of click
  - `clickCount`: Total clicks from this recipient
  - `ipAddress`: IP address of clicker
  - `device`: Device info (type, browser, OS)

### 5. **Real-time Analytics**

- View click counts in email analytics dashboard
- Export click data to CSV
- See which recipients clicked and when

## 🚀 How to Use

### Step 1: Open Email Automation

Navigate to `/get-started/email-automation`

### Step 2: Create Your Email Template

1. Upload your recipient list (CSV)
2. Write your email subject and content
3. Use the rich text editor to format your message

### Step 3: Insert Tracked Button

1. Position your cursor where you want the button
2. Click the **"CTA"** button in the toolbar (blue button with mouse pointer icon)
3. In the dialog that appears:
   - Enter **Button Text** (e.g., "Get Started", "Learn More", "Shop Now")
   - Enter **Destination URL** (e.g., "https://yoursite.com/product")
   - Choose a **Button Style** by clicking on color options
4. Preview your button in the dialog
5. Click **"Insert Button"**

### Step 4: Insert Multiple Buttons (Optional)

- You can insert as many tracked buttons as needed
- Each button can have different text, URLs, and styles
- All buttons will be tracked independently

### Step 5: Send Campaign

1. Click **"Start Campaign"** to begin sending
2. All buttons in your emails will be automatically converted to tracked links
3. When recipients click, tracking data is recorded

## 🔍 How It Works Technically

### Email Processing Flow

```
1. User creates email with inserted CTA buttons
2. When campaign starts, EmailService processes the HTML
3. All href attributes (including buttons) are rewritten to tracking URLs
4. Tracking URL format: /api/track/click/{trackingId}?url={encodedDestinationUrl}
5. Email is sent with tracked button links
```

### Click Tracking Flow

```
1. Recipient clicks button in email
2. Request goes to /api/track/click/{trackingId}?url={destination}
3. Server:
   - Logs click to database (timestamp, IP, user agent, device)
   - Updates email status to "clicked"
   - Increments click counter
   - Triggers webhook to /api/webhook/email-clicked
   - Broadcasts to SSE subscribers (real-time updates)
   - Redirects user to destination URL
4. User arrives at destination seamlessly
```

### Button HTML Structure

```html
<div style="text-align: center; margin: 20px 0;">
  <a
    href="https://destination-url.com"
    class="tracked-button"
    data-track="true"
    style="display: inline-block; padding: 15px 40px; background: linear-gradient(...); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(...); transition: transform 0.2s;"
  >
    Button Text
  </a>
</div>
```

## 📊 Tracking Data Captured

For each button click, the system records:

- **Timestamp**: Exact date/time of click
- **URL**: Which link/button was clicked
- **IP Address**: Originating IP (respects x-forwarded-for)
- **User Agent**: Full browser/client string
- **Device Info**:
  - Type: desktop, mobile, or tablet
  - Browser: chrome, safari, firefox, edge, etc.
  - OS: windows, macos, android, ios, linux

## 🔗 API Endpoints

### Click Tracking Endpoint

**GET** `/api/track/click/[trackingId]?url={encodedUrl}`

Query Parameters:

- `url`: URL-encoded destination URL

Response:

- 302 redirect to destination URL

### Webhook Endpoint

**POST** `/api/webhook/email-clicked`

Request Body:

```json
{
  "trackingId": "507f1f77bcf86cd799439011",
  "recipient": "user@example.com",
  "subject": "Welcome to Our Service",
  "url": "https://example.com/product",
  "clickedAt": "2025-11-29T10:30:00.000Z",
  "clickCount": 1,
  "ipAddress": "192.168.1.1",
  "device": {
    "type": "desktop",
    "browser": "chrome",
    "os": "windows"
  }
}
```

Response:

```json
{
  "received": true,
  "message": "Click tracked successfully"
}
```

## 📈 Viewing Analytics

### Email Analytics Dashboard

Navigate to `/email-analytics` to view:

- Total emails sent
- Open rate
- Click rate
- Individual email performance
- Click details per recipient

### Console Logs

Check server console for detailed tracking logs:

```
🔗 [TRACKING] Click tracked for ID: 507f1f77bcf86cd799439011 URL: https://example.com
✅ [TRACKING] Recording click for: user@example.com
🔗 [TRACKING] Destination URL: https://example.com/product
✅ [TRACKING] Click recorded! Total clicks: 1
📡 [WEBHOOK] Email click webhook sent: ✅ Success
🔄 [TRACKING] Redirecting to: https://example.com/product
```

## 🎨 Button Style Examples

### Primary (Purple)

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Success (Green)

```css
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

### Danger (Red)

```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

### Warning (Orange)

```css
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```

### Dark (Gray)

```css
background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
```

## 🧪 Testing the Feature

### Test Checklist

- [ ] Insert a tracked button in email template
- [ ] Preview button appears correctly
- [ ] Button is visible in content editor
- [ ] Start email campaign
- [ ] Send test email to yourself
- [ ] Receive email with button
- [ ] Click button in email
- [ ] Verify redirect to destination URL works
- [ ] Check server console for tracking logs
- [ ] Verify click appears in analytics dashboard
- [ ] Check webhook was triggered (if configured)
- [ ] Test multiple button clicks (should increment counter)
- [ ] Test different button styles
- [ ] Test multiple buttons in same email

### Quick Test Command

```bash
# Send a test email to yourself
# In the email automation page, use the "Test" button
```

## 🔧 Configuration

### Environment Variables

```env
# Base URL for tracking links
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Email configuration (already set)
EMAIL_USER=info@myhai.in
EMAIL_PASSWORD=your_password
```

## 🎯 Use Cases

1. **Product Launches**: "Shop Now" buttons to product pages
2. **Event Invitations**: "Register Now" buttons to registration forms
3. **Content Marketing**: "Read More" buttons to blog posts
4. **Lead Generation**: "Download Guide" buttons to landing pages
5. **Customer Engagement**: "Give Feedback" buttons to surveys
6. **Promotions**: "Claim Offer" buttons to special deals

## 💡 Best Practices

1. **Button Text**: Keep it short and action-oriented (2-4 words)
2. **URL**: Always use full URLs with https://
3. **Placement**: Insert buttons at key conversion points
4. **Style**: Match button style to email theme and action urgency
5. **Multiple Buttons**: Use different styles to create visual hierarchy
6. **Testing**: Always send test emails before launching campaigns

## 🚨 Troubleshooting

### Button not showing up in email

- Ensure you clicked "Insert Button" in the dialog
- Check that both text and URL were entered
- Verify campaign was started after inserting button

### Clicks not being tracked

- Check server console for tracking logs
- Verify MongoDB connection is active
- Ensure tracking is enabled in campaign settings
- Check that recipient actually clicked (not just opened)

### Webhook not firing

- Check NEXT_PUBLIC_BASE_URL is set correctly
- Verify webhook endpoint is accessible
- Check server console for webhook errors
- Ensure MongoDB is recording clicks

## 📝 Notes

- Buttons are email-client safe (uses inline styles)
- All tracking happens server-side (no JavaScript required)
- Works with all major email clients (Gmail, Outlook, Apple Mail, etc.)
- Privacy-friendly: Only tracks when user explicitly clicks
- GDPR compliant: Users can opt-out of tracking
- No cookies or client-side storage required

## 🎉 Summary

You now have a powerful, easy-to-use tracked button system that:

- ✅ Lets users insert beautiful CTA buttons anywhere in emails
- ✅ Automatically tracks all button clicks
- ✅ Triggers webhooks for external integrations
- ✅ Provides detailed analytics and reporting
- ✅ Works seamlessly with existing email automation system

Start creating engaging email campaigns with tracked buttons today! 🚀
