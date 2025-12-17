/**
 * Google Calendar / Google Meet Integration Service
 * 
 * Creates real Google Meet links through Google Calendar API.
 * Supports user-specific Google API credentials.
 */

/**
 * Create OAuth2 client for Google APIs
 * Uses user-specific credentials if provided, otherwise falls back to env vars
 */
function getOAuth2Client(options = {}) {
    const { accessToken, refreshToken, clientId, clientSecret, redirectUri } = options;

    // Use user's credentials if provided, otherwise use env vars
    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    const callbackUri = redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

    if (!googleClientId || !googleClientSecret) {
        throw new Error("Google API credentials not configured. Please add your Client ID and Client Secret in Settings.");
    }

    // We'll use fetch-based approach instead of googleapis package
    return {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: callbackUri,
        accessToken,
        refreshToken
    };
}

/**
 * Create a Google Calendar event with Google Meet link
 * 
 * @param {Object} options - Meeting options
 * @returns {Promise<Object>} - Created event with meeting link
 */
export async function createGoogleMeetEvent(options) {
    const {
        accessToken,
        refreshToken,
        clientId,
        clientSecret,
        title,
        description = "",
        date,
        startTime,
        endTime,
        timezone = "Asia/Kolkata",
        attendees = []
    } = options;

    if (!accessToken) {
        throw new Error("Google Calendar not connected. Please connect your Google Calendar in Settings.");
    }

    // Create event with conference data (Google Meet)
    const event = {
        summary: title,
        description: description,
        start: {
            dateTime: `${date}T${startTime}:00`,
            timeZone: timezone
        },
        end: {
            dateTime: `${date}T${endTime}:00`,
            timeZone: timezone
        },
        attendees: attendees.map(a => ({
            email: a.email,
            displayName: a.name,
            responseStatus: "needsAction"
        })),
        reminders: {
            useDefault: false,
            overrides: [
                { method: "email", minutes: 24 * 60 },
                { method: "popup", minutes: 60 },
                { method: "popup", minutes: 10 }
            ]
        },
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                conferenceSolutionKey: {
                    type: "hangoutsMeet"
                }
            }
        }
    };

    try {
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Failed to create calendar event");
        }

        const createdEvent = await response.json();
        const meetingLink = createdEvent.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === "video"
        )?.uri || createdEvent.hangoutLink;

        return {
            success: true,
            eventId: createdEvent.id,
            meetingLink: meetingLink,
            htmlLink: createdEvent.htmlLink,
            conferenceId: createdEvent.conferenceData?.conferenceId,
            provider: "google-meet",
            joinInstructions: "Click the meeting link to join via Google Meet."
        };
    } catch (error) {
        console.error("Error creating Google Calendar event:", error);

        if (error.message?.includes("invalid_grant") || error.message?.includes("401")) {
            throw new Error("Google Calendar access expired. Please reconnect in Settings.");
        }

        throw error;
    }
}

/**
 * Check if Google Calendar is connected
 */
export async function checkGoogleCalendarConnection(accessToken) {
    if (!accessToken) {
        return { connected: false, error: "No access token" };
    }

    try {
        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendarList/primary",
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            return { connected: false, error: "Token expired or invalid" };
        }

        const data = await response.json();
        return {
            connected: true,
            email: data.id,
            summary: data.summary
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message || "Failed to verify connection"
        };
    }
}

/**
 * Generate Google OAuth URL for calendar access
 * Uses user-specific credentials
 */
export function getGoogleCalendarAuthUrl(options = {}) {
    const { clientId, clientSecret, state = "" } = options;

    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

    if (!googleClientId) {
        throw new Error("Google Client ID not configured");
    }

    const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ");

    const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes,
        access_type: "offline",
        prompt: "consent",
        state: state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * Uses user-specific credentials
 */
export async function exchangeCodeForTokens(code, options = {}) {
    const { clientId, clientSecret } = options;

    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

    if (!googleClientId || !googleClientSecret) {
        throw new Error("Google API credentials not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || "Failed to exchange code for tokens");
    }

    const tokens = await response.json();

    // Get user email
    let email = null;
    try {
        const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    "Authorization": `Bearer ${tokens.access_token}`
                }
            }
        );
        if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            email = userInfo.email;
        }
    } catch (e) {
        console.error("Failed to get user email:", e);
    }

    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        email
    };
}

/**
 * Refresh access token using refresh token
 * Uses user-specific credentials
 */
export async function refreshAccessToken(refreshToken, options = {}) {
    const { clientId, clientSecret } = options;

    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
        throw new Error("Google API credentials not configured");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            grant_type: "refresh_token"
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || "Failed to refresh token");
    }

    const tokens = await response.json();

    return {
        accessToken: tokens.access_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000)
    };
}

export default {
    createGoogleMeetEvent,
    checkGoogleCalendarConnection,
    getGoogleCalendarAuthUrl,
    exchangeCodeForTokens,
    refreshAccessToken
};
