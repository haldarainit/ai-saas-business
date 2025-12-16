# Google Calendar Credentials Save - Debugging & Fix

## Issue
After clicking "Save Credentials", the page refreshes but the Google Client ID and Client Secret fields show blank. The credentials are not persisting.

## Root Cause Analysis
The issue was that after saving credentials, the profile state wasn't being updated immediately, causing the form to show blank values.

## Fixes Applied

### 1. Dashboard UI (`app/appointment-scheduling/dashboard/page.tsx`)
- **Updated Save Button Handler**: Now immediately updates the profile state after successful save
- **Added Error Logging**: Console logs errors for better debugging
- **Optimistic Update**: Updates local state before fetching from server

```typescript
// Update the profile state immediately after save
if (profile) {
    setProfile({
        ...profile,
        googleCalendar: {
            ...profile.googleCalendar,
            clientId: profileForm.googleClientId,
            clientSecret: profileForm.googleClientSecret,
            connected: profile.googleCalendar?.connected || false
        }
    });
}
```

### 2. Profile API (`app/api/scheduling/profile/route.js`)
- **Added Debug Logging**: Logs what credentials are being returned
- **Returns Credentials**: Ensures clientId and clientSecret are included in response

### 3. Connect API (`app/api/calendar/google/connect/route.js`)
- **Added Debug Logging**: Logs save attempts and results
- **Validates Profile Exists**: Returns 404 if profile not found
- **Returns Saved Data**: Confirms what was saved to database

## How to Test

1. **Open Browser Console** (F12 → Console tab)
2. **Go to Dashboard → Settings**
3. **Enter Credentials**:
   - Client ID: `test-client-id-123.apps.googleusercontent.com`
   - Client Secret: `test-secret-456`
4. **Click "Save Credentials"**
5. **Check Console Logs**:
   ```
   Connect API - Saving credentials for userId: [your-email]
   Connect API - ClientId length: 43
   Connect API - ClientSecret length: 16
   Connect API - Saved successfully. ClientId: test-clien...
   ```
6. **Check UI**: Fields should still show the values
7. **Refresh Page**: Fields should persist

## Expected Console Output

### When Saving:
```
Connect API - Saving credentials for userId: user@example.com
Connect API - ClientId length: 50
Connect API - ClientSecret length: 24
Connect API - Saved successfully. ClientId: 123456789...
```

### When Loading Profile:
```
Profile API - Returning googleCalendar: {
  connected: false,
  clientId: '123456789...',
  clientSecret: 'GOCSPX-...',
  connectedEmail: ''
}
```

## If Still Not Working

### Check These:
1. **MongoDB Connection**: Ensure database is connected
2. **User Profile Exists**: Profile must exist before saving credentials
3. **userId is Correct**: Check that userId matches your login email
4. **Browser Console**: Look for any error messages
5. **Network Tab**: Check API responses

### Manual Database Check:
```javascript
// In MongoDB, check if credentials are saved:
db.userprofiles.findOne({ userId: "your-email@example.com" })
```

Should show:
```json
{
  "googleCalendar": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "connected": false
  }
}
```

## Next Steps After Credentials Save

1. ✅ **Credentials Saved** - You'll see success message
2. 🔗 **Connect Calendar** - Click "Connect Google Calendar" button
3. 🔐 **OAuth Flow** - Authorize with Google
4. ✅ **Connected** - Calendar shows as connected
5. 📅 **Create Bookings** - New bookings will get Google Meet links

## Security Notes

- Client Secret is stored in database (encrypted at rest by MongoDB)
- Each user has their own credentials (multi-tenant)
- Credentials are only used for that user's OAuth flow
- Access tokens auto-refresh when expired
