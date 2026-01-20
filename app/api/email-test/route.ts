import { NextRequest } from "next/server";
import EmailService from "../../../lib/email/EmailService";
import { getAuthenticatedUser } from "../../../lib/get-auth-user";

interface TestEmailRequest {
    testEmail: string;
}

interface EmailTestResult {
    success: boolean;
    error?: string;
    details?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const authResult = await getAuthenticatedUser(request);

        if (!authResult.userId) {
            return Response.json(
                { success: false, error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        const { testEmail }: TestEmailRequest = await request.json();

        if (!testEmail) {
            return Response.json(
                { success: false, error: "Test email address is required" },
                { status: 400 }
            );
        }

        // Create EmailService with user's specific settings
        const emailService = await EmailService.createForUser(authResult.userId);

        // Check if user has configured their email settings
        if (!emailService.hasUserConfig()) {
            return Response.json({
                success: false,
                error: "Email not configured. Please configure your email settings first.",
                details: "Go to Email Configuration to set up your SMTP settings."
            });
        }

        // First test the connection
        const connectionResult: EmailTestResult = await emailService.testConnection();
        if (!connectionResult.success) {
            return Response.json({
                success: false,
                error: "Email configuration test failed",
                details: connectionResult.error,
            });
        }

        // Send a test email
        const testResult = await emailService.sendEmail(
            testEmail,
            "Email Configuration Test - Success!",
            `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Email Test Successful!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          <p>Congratulations! Your email configuration is working correctly.</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p><strong>Sender Email:</strong> ${emailService.fromEmail}</p>
            <p><strong>From Name:</strong> ${emailService.fromName}</p>
            <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            You can now start sending email campaigns from your configured email address.
          </p>
        </div>
      </div>
      `,
            "Email Configuration Test - If you receive this email, your email configuration is working correctly! Test sent at: " +
            new Date().toISOString()
        );

        return Response.json(testResult);
    } catch (error) {
        console.error("Email test error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return Response.json(
            {
                success: false,
                error: "Internal server error",
                details: errorMessage,
            },
            { status: 500 }
        );
    }
}
