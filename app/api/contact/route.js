import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email configuration using Hostinger SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, company, role, size, message } = body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return NextResponse.json(
                { error: "First name, last name, and email are required" },
                { status: 400 }
            );
        }

        const fullName = `${firstName} ${lastName}`;

        // Email to admin
        const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #2465ed, #1a4fc9); color: white; padding: 30px; text-align: center; }
                    .content { background: #ffffff; padding: 30px; }
                    .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2465ed; }
                    .details p { margin: 8px 0; }
                    .label { font-weight: 600; color: #374151; }
                    .message-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">📩 New Contact Form Submission</h1>
                    </div>
                    <div class="content">
                        <p>You have received a new inquiry from the website contact form.</p>
                        
                        <div class="details">
                            <p><span class="label">Name:</span> ${fullName}</p>
                            <p><span class="label">Email:</span> ${email}</p>
                            ${company ? `<p><span class="label">Company:</span> ${company}</p>` : ""}
                            ${role ? `<p><span class="label">Role:</span> ${role}</p>` : ""}
                            ${size ? `<p><span class="label">Organization Size:</span> ${size}</p>` : ""}
                        </div>
                        
                        ${message ? `
                        <div class="message-box">
                            <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
                            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                        </div>
                        ` : ""}
                    </div>
                    <div class="footer">
                        <p>This email was sent from the Haldar AI & IT website contact form.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email to admin
        await transporter.sendMail({
            from: `"Haldar AI & IT Website" <${process.env.EMAIL_USER}>`,
            to: "haldarainit@gmail.com",
            replyTo: email,
            subject: `New Contact Form Inquiry from ${fullName}`,
            html: adminEmailHtml,
        });

        // Confirmation email to user
        const userEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #2465ed, #1a4fc9); color: white; padding: 30px; text-align: center; }
                    .content { background: #ffffff; padding: 30px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${firstName},</p>
                        <p>Thank you for reaching out to Haldar AI & IT. We have received your inquiry and our team will get back to you within 24-48 hours.</p>
                        <p>In the meantime, feel free to explore our website to learn more about our AI-powered business automation solutions.</p>
                        <p>Best regards,<br><strong>Haldar AI & IT Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Haldar AI & IT PVT LTD. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send confirmation to user
        await transporter.sendMail({
            from: `"Haldar AI & IT" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Thank you for contacting Haldar AI & IT",
            html: userEmailHtml,
        });

        return NextResponse.json({
            success: true,
            message: "Your message has been sent successfully!",
        });
    } catch (error) {
        console.error("Error sending contact email:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send message" },
            { status: 500 }
        );
    }
}
