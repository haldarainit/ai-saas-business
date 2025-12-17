/**
 * AI-Powered Scheduling Features
 * Uses Gemini AI for smart scheduling suggestions, meeting prep, and more
 * 
 * NOTE: All functions gracefully handle AI quota errors by returning fallback responses
 */

import { generateAIResponse } from "../../utils/gemini.js";

// Fallback responses when AI is unavailable
const FALLBACKS = {
    eventDescription: (eventName, duration) =>
        `Schedule a ${duration}-minute ${eventName} session. This is a great opportunity to discuss your needs and get personalized attention.`,
    welcomeMessage: (hostName) =>
        `Welcome! I'm ${hostName}. Select an available time slot to book an appointment with me.`,
    meetingPrep: () =>
        `• Review attendee information\n• Prepare relevant materials\n• Test your video/audio connection\n• Have your calendar ready for follow-up scheduling`,
    followUpEmail: (booking, hostName) => ({
        subject: `Thank you for meeting with ${hostName}`,
        content: `<p>Thank you for your time today. It was great connecting with you.</p><p>If you have any questions or would like to schedule a follow-up, please don't hesitate to reach out.</p><p>Best regards,<br>${hostName}</p>`
    }),
    insights: [
        { type: "info", title: "Getting Started", message: "Keep booking appointments to unlock AI-powered insights about your scheduling patterns." }
    ],
    timeSlots: [
        { dayOfWeek: "Weekdays", timeSlot: "10:00 AM - 12:00 PM", reason: "Morning slots are typically preferred" },
        { dayOfWeek: "Weekdays", timeSlot: "2:00 PM - 4:00 PM", reason: "Afternoon slots after lunch" }
    ]
};

/**
 * Safely call AI and return null on any error (caller uses fallback)
 */
async function safeAICall(prompt) {
    try {
        const response = await generateAIResponse(prompt);
        // Return null if no response or error-like response
        if (!response || response.includes?.("Error") || response.includes?.("quota")) {
            return null;
        }
        return response;
    } catch (error) {
        // Silently handle all errors - caller will use fallback
        return null;
    }
}

/**
 * Generate AI-powered event description based on event name
 */
export async function generateEventDescription(eventName, duration, locationType) {
    const prompt = `You are a professional scheduling assistant. Generate a concise, professional description for an appointment event type.

Event Name: ${eventName}
Duration: ${duration} minutes
Location Type: ${locationType === 'video' ? 'Video Call' : locationType}

Generate a 2-3 sentence description that:
- Explains what the meeting is about
- Sets expectations for attendees
- Sounds professional but friendly

Return ONLY the description text, no quotes or extra formatting.`;

    const response = await safeAICall(prompt);

    if (response) {
        return { success: true, description: response.trim() };
    }

    // Return fallback
    return {
        success: true,
        description: FALLBACKS.eventDescription(eventName, duration),
        fallback: true
    };
}

/**
 * Generate smart time slot suggestions based on booking patterns
 */
export async function suggestOptimalTimeSlots(bookings, eventType, preferences) {
    const prompt = `You are an AI scheduling assistant. Analyze the booking patterns and suggest optimal time slots.

Current Bookings Pattern:
${bookings.map(b => `- ${b.date} at ${b.startTime}`).join('\n') || 'No previous bookings'}

Event Type: ${eventType.name}
Duration: ${eventType.duration} minutes
User Preferences: ${preferences || 'No specific preferences'}

Based on typical business patterns and availability, suggest 3 optimal time slots for this week. Consider:
1. Avoiding back-to-back meetings
2. Peak productivity hours (9 AM - 12 PM, 2 PM - 5 PM)
3. Buffer time between meetings

Return as JSON array:
[
  {"dayOfWeek": "Monday", "timeSlot": "10:00 AM - 10:30 AM", "reason": "Prime morning slot"},
  ...
]`;

    const response = await safeAICall(prompt);

    if (response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return { success: true, suggestions: JSON.parse(jsonMatch[0]) };
            }
        } catch (e) {
            // Parse failed, use fallback
        }
    }

    return { success: true, suggestions: FALLBACKS.timeSlots, fallback: true };
}

/**
 * Generate AI meeting agenda/prep notes based on booking details
 */
export async function generateMeetingPrep(booking, eventType, attendeeInfo) {
    const prompt = `You are a professional meeting preparation assistant. Generate a brief meeting prep note.

Meeting Details:
- Event: ${eventType.name || booking.title}
- Date: ${booking.date}
- Time: ${booking.startTime} - ${booking.endTime}
- Duration: ${eventType.duration || 30} minutes
- Attendee: ${attendeeInfo.name} (${attendeeInfo.email})
${booking.attendeeNotes ? `- Attendee Notes: ${booking.attendeeNotes}` : ''}

Generate a concise meeting prep that includes:
1. Quick preparation checklist (3-4 items)
2. Suggested talking points
3. Key questions to ask

Format as clean, readable text with bullet points. Keep it under 200 words.`;

    const response = await safeAICall(prompt);

    if (response) {
        return { success: true, prep: response };
    }

    return { success: true, prep: FALLBACKS.meetingPrep(), fallback: true };
}

/**
 * Generate AI-powered follow-up email after meeting
 */
export async function generateFollowUpEmail(booking, eventType, hostName) {
    const prompt = `You are a professional email writer. Generate a brief follow-up email after a meeting.

Meeting Details:
- Event: ${eventType.name || booking.title}
- Date: ${booking.date}
- Attendee: ${booking.attendee?.name}
- Host: ${hostName}

Generate a professional follow-up email that:
1. Thanks them for their time
2. Summarizes next steps (generic but helpful)
3. Invites them to reach out with questions
4. Sounds warm and professional

Return as JSON:
{
  "subject": "Thank you for meeting with us!",
  "content": "<p>Email content with HTML formatting...</p>"
}`;

    const response = await safeAICall(prompt);

    if (response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return { success: true, email: JSON.parse(jsonMatch[0]) };
            }
        } catch (e) {
            // Parse failed, use fallback
        }
    }

    return { success: true, email: FALLBACKS.followUpEmail(booking, hostName), fallback: true };
}

/**
 * Analyze booking patterns and provide insights
 */
export async function analyzeBookingPatterns(bookings, eventTypes) {
    if (!bookings || bookings.length < 3) {
        return {
            success: true,
            insights: [
                { type: "info", title: "Getting Started", message: "Not enough bookings yet to analyze patterns. Keep booking!" }
            ]
        };
    }

    const prompt = `You are a business analytics AI. Analyze these booking patterns and provide actionable insights.

Booking Data:
${bookings.slice(0, 20).map(b => `- ${b.date} ${b.startTime}: ${b.title} (${b.status})`).join('\n')}

Event Types:
${eventTypes.map(e => `- ${e.name}: ${e.duration}min, ${e.isActive ? 'Active' : 'Inactive'}`).join('\n')}

Total Bookings: ${bookings.length}

Analyze and provide 3-4 key insights about:
1. Most popular booking times
2. Busiest days
3. Potential scheduling optimization
4. Any patterns or trends

Return as JSON array:
[
  {"type": "trend", "title": "Peak Hours", "message": "Most bookings occur between..."},
  {"type": "suggestion", "title": "Optimization Tip", "message": "Consider..."},
  ...
]

Types can be: trend, suggestion, warning, success`;

    const response = await safeAICall(prompt);

    if (response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return { success: true, insights: JSON.parse(jsonMatch[0]) };
            }
        } catch (e) {
            // Parse failed, use fallback
        }
    }

    // Generate basic insights from data without AI
    const basicInsights = [
        {
            type: "info",
            title: "Booking Overview",
            message: `You have ${bookings.length} total bookings across ${eventTypes.length} event types.`
        },
        {
            type: "suggestion",
            title: "AI Temporarily Unavailable",
            message: "Detailed AI analysis will be available soon. Keep scheduling to build more data!"
        }
    ];

    return { success: true, insights: basicInsights, fallback: true };
}

/**
 * Generate personalized welcome message for booking page
 */
export async function generateWelcomeMessage(hostName, businessType, tone = "professional") {
    const prompt = `Generate a short, engaging welcome message for a booking page.

Host Name: ${hostName}
Business/Service Type: ${businessType || "Professional Services"}  
Tone: ${tone}

Create a 1-2 sentence welcome message that:
- Greets visitors warmly
- Briefly states what they can book
- Encourages them to schedule

Return ONLY the welcome message text, no quotes.`;

    const response = await safeAICall(prompt);

    if (response) {
        return { success: true, message: response.trim() };
    }

    return {
        success: true,
        message: FALLBACKS.welcomeMessage(hostName),
        fallback: true
    };
}

/**
 * Smart rescheduling suggestions when a slot is busy
 */
export async function suggestAlternativeSlots(requestedDate, requestedTime, busySlots, duration) {
    const prompt = `You are a scheduling AI. The requested time slot is unavailable. Suggest 3 alternative slots.

Requested: ${requestedDate} at ${requestedTime}
Duration needed: ${duration} minutes
Busy times on that day: ${busySlots.map(s => `${s.startTime}-${s.endTime}`).join(', ') || 'None specified'}

Suggest 3 alternative slots that are:
1. Close to the requested time
2. On the same day if possible, or within a few days
3. During reasonable business hours

Return as JSON:
[
  {"date": "2024-01-15", "time": "10:00", "reason": "30 minutes after your requested time"},
  ...
]`;

    const response = await safeAICall(prompt);

    if (response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return { success: true, alternatives: JSON.parse(jsonMatch[0]) };
            }
        } catch (e) {
            // Parse failed, use fallback
        }
    }

    // Generate simple alternatives
    const alternatives = [
        { date: requestedDate, time: "10:00", reason: "Morning slot" },
        { date: requestedDate, time: "14:00", reason: "Afternoon slot" },
        { date: requestedDate, time: "16:00", reason: "Late afternoon slot" }
    ];

    return { success: true, alternatives, fallback: true };
}

export default {
    generateEventDescription,
    suggestOptimalTimeSlots,
    generateMeetingPrep,
    generateFollowUpEmail,
    analyzeBookingPatterns,
    generateWelcomeMessage,
    suggestAlternativeSlots
};
