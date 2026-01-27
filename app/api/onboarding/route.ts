import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

// Type definitions
interface OnboardingRequest {
    fullName: string;
    companyName?: string;
    companyWebsite?: string;
    companySize?: string;
    industry?: string;
    primaryMarket?: string;
    role?: string;
    challenges?: string[];
}

interface DecodedToken extends JwtPayload {
    userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Email configuration using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: OnboardingRequest = await request.json();
        const {
            fullName,
            companyName,
            companyWebsite,
            companySize,
            industry,
            primaryMarket,
            role,
            challenges
        } = body;

        // Validate required fields
        if (!fullName) {
            return NextResponse.json(
                { error: "Full name is required" },
                { status: 400 }
            );
        }

        // Format challenges as a list
        const challengesList = challenges && challenges.length > 0
            ? challenges.map(c => `• ${c}`).join("<br/>")
            : "Not specified";

        // Email HTML template
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                    .header { background: linear-gradient(135deg, #2465ed 0%, #1a4fc9 100%); color: white; padding: 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
                    .content { padding: 30px; }
                    .section { margin-bottom: 24px; }
                    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 12px; font-weight: 600; }
                    .info-card { background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2465ed; }
                    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: 600; color: #374151; min-width: 140px; font-size: 14px; }
                    .info-value { color: #1f2937; font-size: 14px; }
                    .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 2px; }
                    .challenges-list { background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 New User Onboarding</h1>
                        <p>A new user has completed the onboarding questionnaire</p>
                    </div>
                    <div class="content">
                        <div class="section">
                            <div class="section-title">Personal Information</div>
                            <div class="info-card">
                                <div class="info-row">
                                    <span class="info-label">Full Name</span>
                                    <span class="info-value">${fullName}</span>
                                </div>
                                ${role ? `
                                <div class="info-row">
                                    <span class="info-label">Role</span>
                                    <span class="info-value"><span class="badge">${role}</span></span>
                                </div>
                                ` : ""}
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Company Details</div>
                            <div class="info-card">
                                ${companyName ? `
                                <div class="info-row">
                                    <span class="info-label">Company Name</span>
                                    <span class="info-value">${companyName}</span>
                                </div>
                                ` : ""}
                                <div class="info-row">
                                    <span class="info-label">Website</span>
                                    <span class="info-value">${companyWebsite || "Not provided"}</span>
                                </div>
                                ${companySize ? `
                                <div class="info-row">
                                    <span class="info-label">Company Size</span>
                                    <span class="info-value"><span class="badge">${companySize}</span></span>
                                </div>
                                ` : ""}
                                ${industry ? `
                                <div class="info-row">
                                    <span class="info-label">Industry</span>
                                    <span class="info-value"><span class="badge">${industry}</span></span>
                                </div>
                                ` : ""}
                                ${primaryMarket ? `
                                <div class="info-row">
                                    <span class="info-label">Primary Market</span>
                                    <span class="info-value"><span class="badge">${primaryMarket}</span></span>
                                </div>
                                ` : ""}
                            </div>
                        </div>

                        ${challenges && challenges.length > 0 ? `
                        <div class="section">
                            <div class="section-title">Operational Challenges</div>
                            <div class="challenges-list">
                                ${challengesList}
                            </div>
                        </div>
                        ` : ""}

                        <p style="color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center;">
                            Submitted at: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </p>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">This is an automated email from the Business AI onboarding system.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email to admin (non-blocking)
        try {
            await transporter.sendMail({
                from: `"Business AI" <${process.env.EMAIL_USER}>`,
                to: "haldarainit@gmail.com",
                subject: `🚀 New User Onboarding: ${fullName}${companyName ? ` from ${companyName}` : ""}`,
                html: emailHtml,
            });
        } catch (emailError) {
            console.error("Failed to send onboarding email notification:", emailError);
            // Continue execution to mark user as onboarded in DB
        }

        // Mark user's onboarding as completed in database
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get("auth-token")?.value;
            let userId: string | null = null;

            // First try auth-token cookie (traditional login)
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
                    userId = decoded.userId;
                } catch (tokenError) {
                    console.log("Token verification failed, trying NextAuth session");
                }
            }

            // If no auth-token, try NextAuth session (Google OAuth login)
            if (!userId) {
                const { getServerSession } = await import("next-auth");
                const { authOptions } = await import("@/lib/auth-options");
                const session = await getServerSession(authOptions);

                if (session?.user?.email) {
                    await dbConnect();
                    const user = await User.findOne({ email: session.user.email });
                    if (user) {
                        userId = user._id.toString();
                    }
                }
            }

            if (userId) {
                await dbConnect();
                await User.findByIdAndUpdate(userId, { onboardingCompleted: true });
                console.log("Marked onboarding completed for user:", userId);
            } else {
                console.log("Could not find user to mark onboarding completed");
            }
        } catch (dbError) {
            console.error("Error updating onboarding status in DB:", dbError);
            // Don't fail the request if DB update fails might be risky, but usually we want to return success to client
        }

        return NextResponse.json({
            success: true,
            message: "Onboarding data submitted successfully",
        });
    } catch (error) {
        // If the error is not related to email (which is handled above), log it
        console.error("Error in onboarding process:", error);
        return NextResponse.json(
            { error: "Failed to process onboarding request" },
            { status: 500 }
        );
    }
}
