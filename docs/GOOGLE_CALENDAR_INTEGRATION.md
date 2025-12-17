# Google Calendar & Google Meet Integration

This guide explains how to set up Google Calendar integration for the Appointment Scheduling feature. Once configured, each booking will automatically:
- Create a calendar event in the host's Google Calendar
- Generate a unique Google Meet video conference link
- Send invitations to attendees

## Prerequisites

1. A Google Account
2. Access to [Google Cloud Console](https://console.cloud.google.com/)

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **New Project**
4. Enter a project name (e.g., "My Scheduling App")
5. Click **Create**

### Step 2: Enable the Google Calendar API

1. In your Google Cloud project, go to **APIs & Services → Library**
2. Search for "Google Calendar API"
3. Click on **Google Calendar API** in the results
4. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - App name: Your app name
   - User support email: Your email
   - Developer contact email: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Add or Remove Scopes**
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
8. Click **Save and Continue**
9. Add test users if in testing mode
10. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "Scheduling App Web Client")
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/calendar/google/callback
   ```
   For production, also add:
   ```
   https://your-domain.com/api/calendar/google/callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** - you'll need these!

### Step 5: Configure in Your Dashboard

1. Log into your Appointment Scheduling Dashboard
2. Go to the **Settings** tab
3. Find the **Google Calendar & Meet Integration** section
4. Enter your **Google Client ID** in the first field
5. Enter your **Google Client Secret** in the second field
6. Click **Save Credentials**
7. Click **Connect Google Calendar**
8. Follow the Google authorization flow
9. Done! Your calendar is now connected.

## How It Works

Once connected:

1. **Booking Created**: When someone books an appointment
2. **Calendar Event**: A Google Calendar event is automatically created
3. **Google Meet Link**: A unique Google Meet link is generated
4. **Invitations Sent**: Google sends calendar invitations to attendees
5. **Dashboard**: Meeting links are visible in your dashboard
6. **Booking Confirmation**: Attendees see the meeting link in their confirmation

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure your redirect URI exactly matches what's in Google Cloud Console
- The redirect URI should be: `{your-domain}/api/calendar/google/callback`

### "Google Calendar token expired"
- Go to Settings and click "Disconnect Calendar"
- Reconnect by clicking "Connect Google Calendar" again

### "Failed to create meeting link"
- Verify Google Calendar API is enabled in your project
- Check that you've added the correct scopes to OAuth consent screen
- Ensure your credentials are correct

### Testing Mode Limitations
- In testing mode, only users added as test users can connect
- To allow all users, submit your app for verification

## Security Notes

- Your Google API credentials are stored securely in your user profile
- Credentials are not shared between users - each admin has their own
- Access tokens auto-refresh when they expire
- You can disconnect at any time to revoke access

## API Reference

### Endpoints

- `GET /api/calendar/google/connect?userId=X` - Check connection status
- `GET /api/calendar/google/connect?userId=X&action=connect` - Get OAuth URL
- `POST /api/calendar/google/connect` - Save credentials
- `DELETE /api/calendar/google/connect?userId=X` - Disconnect calendar
- `GET /api/calendar/google/callback` - OAuth callback handler

### Environment Variables (Optional)

If you prefer to use environment variables instead of per-user credentials:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

When environment variables are set, they serve as fallback if user hasn't configured their own credentials.
