import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import UserProfile from "@/lib/models/UserProfile";

// Email configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// POST - Send booking-related emails
export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { type, bookingId, customMessage } = body;

        if (!type || !bookingId) {
            return NextResponse.json(
                { error: "Email type and booking ID are required" },
                { status: 400 }
            );
        }

        const booking = await Booking.findOne({ bookingId }).populate("eventTypeId");

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        const userProfile = await UserProfile.findOne({ userId: booking.userId });
        const hostName = userProfile?.displayName || userProfile?.email || "Host";
        const hostEmail = userProfile?.email;

        const emailData = getEmailData(type, booking, hostName, hostEmail, customMessage);

        // Send to attendee
        if (emailData.sendToAttendee) {
            await transporter.sendMail({
                from: `"${hostName}" <${process.env.EMAIL_USER}>`,
                to: booking.attendee.email,
                subject: emailData.attendeeSubject,
                html: emailData.attendeeHtml,
            });
        }

        // Send to host
        if (emailData.sendToHost && hostEmail) {
            await transporter.sendMail({
                from: `"Appointment Scheduler" <${process.env.EMAIL_USER}>`,
                to: hostEmail,
                subject: emailData.hostSubject,
                html: emailData.hostHtml,
            });
        }

        // Update reminder status
        booking.remindersSent.push({
            type,
            sentAt: new Date(),
            channel: "email",
        });
        await booking.save();

        return NextResponse.json({
            success: true,
            message: `${type} email sent successfully`,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send email" },
            { status: 500 }
        );
    }
}

function getEmailData(type, booking, hostName, hostEmail, customMessage) {
    const eventName = booking.eventTypeId?.name || booking.title;
    const dateFormatted = new Date(booking.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const timeFormatted = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;

    const baseStyles = `
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: 0; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .button:hover { background: #4f46e5; }
            h1 { margin: 0; }
            .meeting-link { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    `;

    switch (type) {
        case "confirmation":
            return {
                sendToAttendee: true,
                sendToHost: true,
                attendeeSubject: `Confirmed: ${eventName} with ${hostName}`,
                attendeeHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>✅ Booking Confirmed!</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${booking.attendee.name},</p>
                            <p>Your appointment has been confirmed!</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>With:</strong> ${hostName}
                            </div>
                            
                            ${booking.meetingLink ? `
                            <div class="meeting-link">
                                <strong>🎥 Join Meeting</strong><br>
                                <a href="${booking.meetingLink}">${booking.meetingLink}</a>
                            </div>
                            ` : ""}
                            
                            <p>A calendar invite has been sent. We'll send you a reminder before the meeting.</p>
                        </div>
                        <div class="footer">
                            <p>Need to make changes?</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/book/manage/${booking.bookingId}" class="button">Manage Booking</a>
                        </div>
                    </div>
                `,
                hostSubject: `New Booking: ${eventName} with ${booking.attendee.name}`,
                hostHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>🗓️ New Booking</h1>
                        </div>
                        <div class="content">
                            <p>You have a new appointment!</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>With:</strong> ${booking.attendee.name} (${booking.attendee.email})
                            </div>
                            
                            ${booking.attendeeNotes ? `<p><strong>Notes:</strong> ${booking.attendeeNotes}</p>` : ""}
                            
                            ${booking.meetingLink ? `
                            <div class="meeting-link">
                                <strong>🎥 Meeting Link</strong><br>
                                <a href="${booking.meetingLink}">${booking.meetingLink}</a>
                            </div>
                            ` : ""}
                        </div>
                        <div class="footer">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/appointment-scheduling/dashboard" class="button">View Dashboard</a>
                        </div>
                    </div>
                `,
            };

        case "reminder-24h":
            return {
                sendToAttendee: true,
                sendToHost: true,
                attendeeSubject: `Reminder: ${eventName} tomorrow with ${hostName}`,
                attendeeHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>⏰ Meeting Tomorrow</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${booking.attendee.name},</p>
                            <p>This is a reminder about your upcoming appointment.</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>With:</strong> ${hostName}
                            </div>
                            
                            ${booking.meetingLink ? `
                            <div class="meeting-link">
                                <strong>🎥 Join Meeting</strong><br>
                                <a href="${booking.meetingLink}" class="button">Join Now</a>
                            </div>
                            ` : ""}
                        </div>
                        <div class="footer">
                            <p>Need to reschedule? <a href="${process.env.NEXT_PUBLIC_APP_URL}/book/manage/${booking.bookingId}">Click here</a></p>
                        </div>
                    </div>
                `,
                hostSubject: `Reminder: ${eventName} tomorrow with ${booking.attendee.name}`,
                hostHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>⏰ Meeting Tomorrow</h1>
                        </div>
                        <div class="content">
                            <p>Reminder about your upcoming appointment.</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>With:</strong> ${booking.attendee.name}
                            </div>
                        </div>
                    </div>
                `,
            };

        case "reminder-1h":
            return {
                sendToAttendee: true,
                sendToHost: false,
                attendeeSubject: `Starting Soon: ${eventName} in 1 hour`,
                attendeeHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>🚀 Meeting in 1 Hour!</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${booking.attendee.name},</p>
                            <p>Your meeting starts in 1 hour!</p>
                            
                            ${booking.meetingLink ? `
                            <div class="meeting-link" style="text-align: center;">
                                <a href="${booking.meetingLink}" class="button" style="font-size: 18px; padding: 15px 30px;">Join Meeting Now</a>
                            </div>
                            ` : ""}
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>With:</strong> ${hostName}
                            </div>
                        </div>
                    </div>
                `,
            };

        case "cancellation":
            return {
                sendToAttendee: true,
                sendToHost: true,
                attendeeSubject: `Cancelled: ${eventName}`,
                attendeeHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                            <h1>❌ Booking Cancelled</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${booking.attendee.name},</p>
                            <p>Your appointment has been cancelled.</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}
                            </div>
                            
                            ${booking.cancellationReason ? `<p><strong>Reason:</strong> ${booking.cancellationReason}</p>` : ""}
                            
                            <p>Would you like to reschedule?</p>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/book/${booking.userId}" class="button">Book New Time</a>
                        </div>
                    </div>
                `,
                hostSubject: `Cancelled: ${eventName} with ${booking.attendee.name}`,
                hostHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                            <h1>Booking Cancelled</h1>
                        </div>
                        <div class="content">
                            <p>The following booking has been cancelled:</p>
                            
                            <div class="details">
                                <strong>📅 ${eventName}</strong><br>
                                <strong>Date:</strong> ${dateFormatted}<br>
                                <strong>Time:</strong> ${timeFormatted}<br>
                                <strong>Attendee:</strong> ${booking.attendee.name}
                            </div>
                            
                            ${booking.cancellationReason ? `<p><strong>Reason:</strong> ${booking.cancellationReason}</p>` : ""}
                        </div>
                    </div>
                `,
            };

        case "booking-link":
            const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${customMessage?.username}`;
            return {
                sendToAttendee: true,
                sendToHost: false,
                attendeeSubject: `${hostName} invites you to schedule a meeting`,
                attendeeHtml: `
                    ${baseStyles}
                    <div class="container">
                        <div class="header">
                            <h1>📅 Schedule a Meeting</h1>
                        </div>
                        <div class="content">
                            <p>Hi there!</p>
                            <p>${hostName} would like to schedule a meeting with you.</p>
                            
                            ${customMessage?.message ? `<p>${customMessage.message}</p>` : ""}
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${bookingUrl}" class="button" style="font-size: 18px; padding: 15px 30px;">Choose a Time</a>
                            </div>
                            
                            <p>Click the button above to see available times and book your appointment.</p>
                        </div>
                    </div>
                `,
            };

        default:
            throw new Error(`Unknown email type: ${type}`);
    }
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}
