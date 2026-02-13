
# MongoDB Migration Guide

## Overview

Your application has been successfully migrated from file system storage to MongoDB for persistent data storage. This change addresses the Vercel deployment issue where data in the `/data` folder doesn't persist between deployments.

## What Changed

### Before (File System)

- Campaign data stored in `data/campaigns/active-campaign.json`
- Email logs stored in `data/campaigns/campaign-log.json`
- Data lost between Vercel deployments

### After (MongoDB)

- Campaign data stored in MongoDB `campaigns` collection
- Email logs stored in MongoDB `emaillogs` collection
- Data persists between deployments
- User-specific data isolation
- Better query performance and scalability

## New Features

### 1. User Authentication Integration

- Each user now has isolated campaign data
- Authentication required for all campaign operations
- JWT token-based authentication with HTTP-only cookies

### 2. Enhanced Data Models

- **Campaign Model**: Structured schema with recipient tracking, status management, and progress monitoring
- **EmailLog Model**: Detailed email delivery tracking with status, timestamps, and delivery details

### 3. Improved Campaign Management

- Real-time recipient status tracking
- Better progress monitoring
- Campaign status management (draft, active, paused, completed, cancelled)
- Retry mechanisms and error handling

## Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/business-ai
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### For Production (Vercel)

1. Set up MongoDB Atlas or another cloud MongoDB provider
2. Update `MONGODB_URI` to your production MongoDB connection string
3. Set a strong `JWT_SECRET` in your environment variables

## Data Migration

### Automatic Migration

If you have existing campaign data in the file system, you can migrate it:

1. **Check for existing data:**

```javascript
POST /api/data-migration
{
  "action": "check"
}
```

2. **Migrate existing data:**

```javascript
POST /api/data-migration
{
  "action": "migrate"
}
```

3. **Cleanup old files (optional):**

```javascript
POST /api/data-migration
{
  "action": "cleanup"
}
```

### Manual Migration Script

You can also run migration programmatically:

```javascript
import DataMigrationUtil from "./lib/email/DataMigrationUtil.js";

const migrationUtil = new DataMigrationUtil();
const result = await migrationUtil.migrateFromFileSystem("user-id");
console.log(result);
```

## API Changes

### Authentication Required

All campaign API endpoints now require authentication:

- Include JWT token in Authorization header: `Bearer <token>`
- Or ensure cookies are sent with requests

### New User-Specific Operations

Campaign operations are now user-specific. Each user sees only their own campaigns and email logs.

### Enhanced Campaign Scheduler

- Create user-specific campaign schedulers:

```javascript
import { createCampaignScheduler } from "./lib/email/CampaignScheduler.js";
const scheduler = createCampaignScheduler(userId);
```

## Database Schema

### Campaign Collection

```javascript
{
  _id: ObjectId,
  userId: String,
  subject: String,
  template: String,
  recipients: [
    {
      email: String,
      name: String,
      sent: Boolean,
      sentAt: Date,
      error: String
    }
  ],
  status: String, // "draft", "active", "paused", "completed", "cancelled"
  totalEmails: Number,
  sentCount: Number,
  failedCount: Number,
  currentIndex: Number,
  sendingSpeed: Number,
  scheduledStartTime: Date,
  actualStartTime: Date,
  completedAt: Date,
  pausedAt: Date,
  settings: {
    batchSize: Number,
    delay: Number,
    maxRetries: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### EmailLog Collection

```javascript
{
  _id: ObjectId,
  userId: String,
  campaignId: ObjectId,
  recipientEmail: String,
  recipientName: String,
  subject: String,
  status: String, // "sent", "failed", "bounced", "opened", "clicked"
  sentAt: Date,
  error: String,
  deliveryDetails: {
    messageId: String,
    provider: String,
    attempt: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Improvements

### Database Indexing

- User-specific queries optimized with compound indexes
- Date-based queries for daily limits and reporting
- Campaign status queries for active/paused campaigns

### Query Optimization

- Efficient pagination for large email logs
- Optimized campaign status checks
- Batch operations for recipient updates

## Deployment Notes

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Ensure MongoDB connection string is accessible
3. Deploy normally - data will now persist between deployments

### MongoDB Atlas Setup (Recommended for Production)

1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` environment variable
5. Configure IP whitelist for Vercel IPs (or use 0.0.0.0/0 for simplicity)

## Monitoring & Maintenance

### Database Maintenance

- Monitor connection pool usage
- Set up MongoDB Atlas alerts for performance
- Regular backup schedule recommended

### Log Management

- EmailLog collection will grow over time
- Consider implementing log rotation/archival
- Use the built-in cleanup methods for old campaigns

### Performance Monitoring

- Monitor query performance in MongoDB Atlas
- Watch for slow queries and optimize indexes as needed
- Set up alerts for connection issues

## Troubleshooting

### Common Issues

1. **Connection Errors**

   - Check MongoDB service is running
   - Verify MONGODB_URI is correct
   - Check network connectivity

2. **Authentication Issues**

   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure cookies are being sent

3. **Migration Issues**
   - Check file permissions for old data directory
   - Verify JSON format of old campaign/log files
   - Run migration with proper user context

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG=true
```

## Support

For issues related to the MongoDB migration:

1. Check MongoDB connection status
2. Review server logs for detailed error messages
3. Use the data migration API endpoints for troubleshooting
4. Test with a local MongoDB instance first

The migration provides better reliability, scalability, and user isolation while maintaining all existing functionality.
