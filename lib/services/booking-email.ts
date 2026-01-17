/**
 * Booking Email Service
 * Sends confirmation emails, notifications, and reminders for appointments
 */

import nodemailer, { Transporter } from "nodemailer";
import { SentMessageInfo } from "nodemailer";

// Types for email settings
interface EmailSettings {
    emailUser?: string;
    emailPassword?: string;
    emailProvider?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    fromName?: string;
    sendConfirmationToAttendee?: boolean;
    sendNotificationToHost?: boolean;
    sendReminders?: boolean;
}

// Types for booking data
interface Attendee {
    name?: string;
    email?: string;
}

interface Booking {
    title?: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    locationType?: string;
    attendee?: Attendee;
    notes?: string;
}

interface EventType {
    name?: string;
    duration?: number;
}

interface Host {
    displayName?: string;
    email?: string;
    emailSettings?: EmailSettings;
    notifications?: {
        notificationEmail?: string;
    };
}

// Email result types
interface EmailResult {
    sent: boolean;
    messageId?: string;
    reason?: string;
    error?: string;
}

interface BookingEmailsResult {
    attendeeEmail: EmailResult;
    hostEmail: EmailResult;
}

// Provider configuration type
interface ProviderConfig {
    host: string;
    port: number;
    secure: boolean;
    name: string;
}

interface ProviderInfo {
    id: string;
    name: string;
    host: string;
    port: number;
}

/**
 * Email provider SMTP presets
 */
const EMAIL_PROVIDERS: Record<string, ProviderConfig> = {
    gmail: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        name: "Gmail"
    },
    hostinger: {
        host: "smtp.hostinger.com",
        port: 587,
        secure: false,
        name: "Hostinger"
    },
    outlook: {
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        name: "Outlook/Hotmail"
    },
    yahoo: {
        host: "smtp.mail.yahoo.com",
        port: 587,
        secure: false,
        name: "Yahoo"
    },
    zoho: {
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        name: "Zoho"
    },
    custom: {
        host: "",
        port: 587,
        secure: false,
        name: "Custom SMTP"
    }
};

/**
 * Get SMTP config for a provider
 */
export function getEmailProviderConfig(provider: string): ProviderConfig {
    return EMAIL_PROVIDERS[provider] || EMAIL_PROVIDERS.custom;
}

/**
 * Get all available email providers
 */
export function getEmailProviders(): ProviderInfo[] {
    return Object.entries(EMAIL_PROVIDERS).map(([key, value]) => ({
        id: key,
        name: value.name,
        host: value.host,
        port: value.port
    }));
}

/**
 * Create a nodemailer transporter with user's email settings
 */
function createTransporter(emailSettings: EmailSettings): Transporter<SentMessageInfo> {
    if (!emailSettings?.emailUser || !emailSettings?.emailPassword) {
        throw new Error("Email settings not configured. Please add your email credentials in Settings.");
    }

    // Get provider config or use custom settings
    const provider = emailSettings.emailProvider || "gmail";
    const providerConfig = EMAIL_PROVIDERS[provider] || EMAIL_PROVIDERS.custom;

    // Use provider defaults or custom settings
    const host = provider === "custom" ? emailSettings.smtpHost : providerConfig.host;
    const port = provider === "custom" ? (emailSettings.smtpPort || 587) : providerConfig.port;
    const secure = provider === "custom" ? emailSettings.smtpSecure : providerConfig.secure;

    if (!host) {
        throw new Error("SMTP host not configured. Please select a provider or enter custom SMTP settings.");
    }

    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure || false,
        auth: {
            user: emailSettings.emailUser,
            pass: emailSettings.emailPassword,
        },
    });
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Format time for display
 */
function formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Send confirmation email to attendee after booking
 */
export async function sendBookingConfirmationToAttendee(
    booking: Booking,
    eventType: EventType,
    host: Host,
    emailSettings: EmailSettings
): Promise<EmailResult> {
    if (!emailSettings?.sendConfirmationToAttendee) {
        console.log("Attendee confirmation email disabled");
        return { sent: false, reason: "disabled" };
    }

    try {
        const transporter = createTransporter(emailSettings);

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .details-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #666; min-width: 120px; }
        .detail-value { color: #333; }
        .meeting-link { background: #6366f1; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${booking.attendee?.name || "there"}</strong>,</p>
            <p>Your appointment has been successfully booked with <strong>${host.displayName || "the host"}</strong>.</p>
            
            <div class="details-box">
                <div class="detail-row">
                    <span class="detail-label">📅 Event:</span>
                    <span class="detail-value">${eventType.name || booking.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📆 Date:</span>
                    <span class="detail-value">${formatDate(booking.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏱️ Duration:</span>
                    <span class="detail-value">${eventType.duration || 30} minutes</span>
                </div>
                ${booking.locationType === "video" ? `
                <div class="detail-row">
                    <span class="detail-label">📹 Location:</span>
                    <span class="detail-value">Video Call (Google Meet)</span>
                </div>
                ` : ""}
            </div>
            
            ${booking.meetingLink ? `
            <div style="text-align: center;">
                <a href="${booking.meetingLink}" class="meeting-link">🎥 Join Meeting</a>
            </div>
            ` : ""}
            
            <p style="color: #666; font-size: 14px;">
                You will receive a reminder email before your appointment.
            </p>
            
            <div class="footer">
                <p>Need to reschedule or cancel? Contact ${host.email || "the host"}.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const result = await transporter.sendMail({
            from: `"${emailSettings.fromName || host.displayName || "Appointment"}" <${emailSettings.emailUser}>`,
            to: booking.attendee?.email,
            subject: `✅ Confirmed: ${eventType.name || booking.title} on ${formatDate(booking.date)}`,
            html: emailHtml,
        });

        console.log("Confirmation email sent to attendee:", booking.attendee?.email);
        return { sent: true, messageId: result.messageId };
    } catch (error) {
        const err = error as Error;
        console.error("Error sending confirmation email to attendee:", error);
        return { sent: false, error: err.message };
    }
}

/**
 * Send notification email to host when someone books
 */
export async function sendBookingNotificationToHost(
    booking: Booking,
    eventType: EventType,
    host: Host,
    emailSettings: EmailSettings
): Promise<EmailResult> {
    if (!emailSettings?.sendNotificationToHost) {
        console.log("Host notification email disabled");
        return { sent: false, reason: "disabled" };
    }

    try {
        const transporter = createTransporter(emailSettings);

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .details-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .meeting-link { background: #6366f1; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 New Booking!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${host.displayName || "there"}</strong>,</p>
            <p>You have a new appointment booking!</p>
            
            <div class="details-box">
                <div class="detail-row">
                    <strong>👤 Attendee:</strong> ${booking.attendee?.name || "Unknown"}<br>
                    <small style="color: #666;">${booking.attendee?.email}</small>
                </div>
                <div class="detail-row">
                    <strong>📅 Event:</strong> ${eventType.name || booking.title}
                </div>
                <div class="detail-row">
                    <strong>📆 Date:</strong> ${formatDate(booking.date)}
                </div>
                <div class="detail-row">
                    <strong>🕐 Time:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
                </div>
                ${booking.notes ? `
                <div class="detail-row">
                    <strong>📝 Notes:</strong> ${booking.notes}
                </div>
                ` : ""}
            </div>
            
            ${booking.meetingLink ? `
            <div style="text-align: center;">
                <a href="${booking.meetingLink}" class="meeting-link">🎥 Join Meeting</a>
            </div>
            ` : ""}
        </div>
    </div>
</body>
</html>
        `;

        const hostEmail = host.notifications?.notificationEmail || host.email;

        const result = await transporter.sendMail({
            from: `"${emailSettings.fromName || "Appointment System"}" <${emailSettings.emailUser}>`,
            to: hostEmail,
            subject: `🎉 New Booking: ${booking.attendee?.name} booked ${eventType.name || booking.title}`,
            html: emailHtml,
        });

        console.log("Notification email sent to host:", hostEmail);
        return { sent: true, messageId: result.messageId };
    } catch (error) {
        const err = error as Error;
        console.error("Error sending notification email to host:", error);
        return { sent: false, error: err.message };
    }
}

/**
 * Send reminder email to attendee before appointment
 */
export async function sendReminderEmail(
    booking: Booking,
    eventType: EventType,
    host: Host,
    emailSettings: EmailSettings,
    hoursUntilMeeting: number
): Promise<EmailResult> {
    if (!emailSettings?.sendReminders) {
        console.log("Reminder emails disabled");
        return { sent: false, reason: "disabled" };
    }

    try {
        const transporter = createTransporter(emailSettings);

        const timeText = hoursUntilMeeting === 1 ? "1 hour" : `${hoursUntilMeeting} hours`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
        .details-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .meeting-link { background: #6366f1; color: white !important; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 15px 0; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Reminder: Appointment in ${timeText}</h1>
        </div>
        <div class="content">
            <p>Hi <strong>${booking.attendee?.name || "there"}</strong>,</p>
            <p>This is a friendly reminder that your appointment is coming up in <strong>${timeText}</strong>.</p>
            
            <div class="details-box">
                <p><strong>📅 ${eventType.name || booking.title}</strong></p>
                <p>📆 ${formatDate(booking.date)}</p>
                <p>🕐 ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
                <p>👤 With: ${host.displayName || "Host"}</p>
            </div>
            
            ${booking.meetingLink ? `
            <div style="text-align: center;">
                <a href="${booking.meetingLink}" class="meeting-link">🎥 Join Meeting Now</a>
            </div>
            ` : ""}
            
            <p style="color: #666; font-size: 14px;">
                Make sure you're ready for your appointment. See you soon!
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const result = await transporter.sendMail({
            from: `"${emailSettings.fromName || host.displayName || "Appointment"}" <${emailSettings.emailUser}>`,
            to: booking.attendee?.email,
            subject: `⏰ Reminder: ${eventType.name || booking.title} in ${timeText}`,
            html: emailHtml,
        });

        console.log("Reminder email sent:", booking.attendee?.email);
        return { sent: true, messageId: result.messageId };
    } catch (error) {
        const err = error as Error;
        console.error("Error sending reminder email:", error);
        return { sent: false, error: err.message };
    }
}

/**
 * Send all booking emails (confirmation to attendee + notification to host)
 */
export async function sendBookingEmails(
    booking: Booking,
    eventType: EventType,
    host: Host
): Promise<BookingEmailsResult> {
    const emailSettings = host.emailSettings;

    if (!emailSettings?.emailUser || !emailSettings?.emailPassword) {
        console.log("Email settings not configured, skipping booking emails");
        return {
            attendeeEmail: { sent: false, reason: "not_configured" },
            hostEmail: { sent: false, reason: "not_configured" }
        };
    }

    const [attendeeResult, hostResult] = await Promise.all([
        sendBookingConfirmationToAttendee(booking, eventType, host, emailSettings),
        sendBookingNotificationToHost(booking, eventType, host, emailSettings)
    ]);

    return {
        attendeeEmail: attendeeResult,
        hostEmail: hostResult
    };
}

export default {
    sendBookingConfirmationToAttendee,
    sendBookingNotificationToHost,
    sendReminderEmail,
    sendBookingEmails
};
