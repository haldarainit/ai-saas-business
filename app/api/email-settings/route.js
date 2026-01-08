import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import EmailAutomationSettings from "@/lib/models/EmailAutomationSettings";
import { getAuthenticatedUser } from "@/lib/get-auth-user";

/**
 * Email provider SMTP presets
 */
const EMAIL_PROVIDERS = {
    gmail: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        name: "Gmail",
        helpUrl: "https://support.google.com/accounts/answer/185833",
        instructions: "Use an App Password. Enable 2FA first, then generate an App Password in your Google Account settings."
    },
    hostinger: {
        host: "smtp.hostinger.com",
        port: 587,
        secure: false,
        name: "Hostinger",
        instructions: "Use your Hostinger email credentials."
    },
    outlook: {
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        name: "Outlook/Hotmail",
        helpUrl: "https://support.microsoft.com/en-us/account-billing/manage-app-passwords",
        instructions: "Use an App Password if 2FA is enabled."
    },
    yahoo: {
        host: "smtp.mail.yahoo.com",
        port: 587,
        secure: false,
        name: "Yahoo",
        helpUrl: "https://help.yahoo.com/kb/generate-password-sln15241.html",
        instructions: "Generate an App Password in Yahoo Account Security settings."
    },
    zoho: {
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        name: "Zoho",
        instructions: "Use your Zoho email credentials or App Password."
    },
    custom: {
        host: "",
        port: 587,
        secure: false,
        name: "Custom SMTP",
        instructions: "Enter your custom SMTP server details."
    }
};

/**
 * GET - Retrieve user's email automation settings
 */
export async function GET(request) {
    try {
        const authResult = await getAuthenticatedUser(request);

        if (!authResult.userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get user's email settings
        let settings = await EmailAutomationSettings.findOne({ userId: authResult.userId });

        // Return providers list along with user settings
        const providers = Object.entries(EMAIL_PROVIDERS).map(([key, value]) => ({
            id: key,
            name: value.name,
            host: value.host,
            port: value.port,
            helpUrl: value.helpUrl,
            instructions: value.instructions
        }));

        if (!settings) {
            return NextResponse.json({
                success: true,
                data: {
                    settings: null,
                    isConfigured: false,
                    providers
                }
            });
        }

        // Don't send password back to client
        const safeSettings = {
            emailProvider: settings.emailProvider,
            emailUser: settings.emailUser,
            hasPassword: !!settings.emailPassword,
            fromName: settings.fromName,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpSecure: settings.smtpSecure,
            isConfigured: settings.isConfigured,
            verificationStatus: settings.verificationStatus,
            lastVerifiedAt: settings.lastVerifiedAt,
        };

        return NextResponse.json({
            success: true,
            data: {
                settings: safeSettings,
                isConfigured: settings.isConfigured,
                providers
            }
        });

    } catch (error) {
        console.error("Error fetching email settings:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST - Save or update user's email automation settings
 */
export async function POST(request) {
    try {
        const authResult = await getAuthenticatedUser(request);

        if (!authResult.userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        await dbConnect();

        const body = await request.json();
        const {
            emailProvider,
            emailUser,
            emailPassword,
            fromName,
            smtpHost,
            smtpPort,
            smtpSecure,
            action
        } = body;

        // Handle verification test
        if (action === "verify") {
            return await verifySmtpConnection(authResult.userId, body);
        }

        // Validate required fields
        if (!emailProvider || !emailUser) {
            return NextResponse.json(
                { success: false, error: "Email provider and email address are required" },
                { status: 400 }
            );
        }

        // For custom provider, validate host
        if (emailProvider === "custom" && !smtpHost) {
            return NextResponse.json(
                { success: false, error: "SMTP host is required for custom provider" },
                { status: 400 }
            );
        }

        // Find or create settings
        let settings = await EmailAutomationSettings.findOne({ userId: authResult.userId });

        if (!settings) {
            settings = new EmailAutomationSettings({ userId: authResult.userId });
        }

        // Update settings
        settings.emailProvider = emailProvider;
        settings.emailUser = emailUser;
        settings.fromName = fromName || "Email Campaign";

        // Only update password if provided (allows updating other fields without re-entering password)
        if (emailPassword) {
            settings.emailPassword = emailPassword;
        }

        // Custom SMTP settings
        if (emailProvider === "custom") {
            settings.smtpHost = smtpHost;
            settings.smtpPort = smtpPort || 587;
            settings.smtpSecure = smtpSecure || false;
        }

        // Mark as configured if we have credentials
        settings.isConfigured = !!(settings.emailUser && settings.emailPassword);
        settings.verificationStatus = "pending";

        await settings.save();

        return NextResponse.json({
            success: true,
            message: "Email settings saved successfully",
            data: {
                isConfigured: settings.isConfigured,
                verificationStatus: settings.verificationStatus
            }
        });

    } catch (error) {
        console.error("Error saving email settings:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Remove user's email automation settings
 */
export async function DELETE(request) {
    try {
        const authResult = await getAuthenticatedUser(request);

        if (!authResult.userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        await dbConnect();

        await EmailAutomationSettings.deleteOne({ userId: authResult.userId });

        return NextResponse.json({
            success: true,
            message: "Email settings removed successfully"
        });

    } catch (error) {
        console.error("Error deleting email settings:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Verify SMTP connection
 */
async function verifySmtpConnection(userId, settings) {
    try {
        await dbConnect();

        let userSettings = await EmailAutomationSettings.findOne({ userId });

        // Get SMTP config
        const provider = settings.emailProvider || userSettings?.emailProvider || "gmail";
        const providerConfig = EMAIL_PROVIDERS[provider] || EMAIL_PROVIDERS.gmail;

        const host = provider === "custom"
            ? (settings.smtpHost || userSettings?.smtpHost)
            : providerConfig.host;
        const port = provider === "custom"
            ? (settings.smtpPort || userSettings?.smtpPort || 587)
            : providerConfig.port;
        const secure = provider === "custom"
            ? (settings.smtpSecure || userSettings?.smtpSecure || false)
            : providerConfig.secure;

        const emailUser = settings.emailUser || userSettings?.emailUser;
        const emailPassword = settings.emailPassword || userSettings?.emailPassword;

        if (!emailUser || !emailPassword) {
            return NextResponse.json(
                { success: false, error: "Email credentials are required for verification" },
                { status: 400 }
            );
        }

        if (!host) {
            return NextResponse.json(
                { success: false, error: "SMTP host is required" },
                { status: 400 }
            );
        }

        // Create transporter and verify
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
        });

        await transporter.verify();

        // Update verification status
        if (userSettings) {
            userSettings.verificationStatus = "verified";
            userSettings.lastVerifiedAt = new Date();
            await userSettings.save();
        }

        return NextResponse.json({
            success: true,
            message: "SMTP connection verified successfully!",
            data: {
                verificationStatus: "verified",
                lastVerifiedAt: new Date()
            }
        });

    } catch (error) {
        console.error("SMTP verification failed:", error);

        // Update verification status to failed
        try {
            const userSettings = await EmailAutomationSettings.findOne({ userId });
            if (userSettings) {
                userSettings.verificationStatus = "failed";
                await userSettings.save();
            }
        } catch (e) {
            // Ignore update errors
        }

        // Return user-friendly error messages
        let errorMessage = "SMTP connection failed";

        if (error.code === "EAUTH") {
            errorMessage = "Authentication failed. Please check your email and password. For Gmail, make sure you're using an App Password.";
        } else if (error.code === "ESOCKET" || error.code === "ECONNECTION") {
            errorMessage = "Could not connect to SMTP server. Please check the host and port settings.";
        } else if (error.code === "ETIMEDOUT") {
            errorMessage = "Connection timed out. The SMTP server might be blocking the connection.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 }
        );
    }
}
