import EmailService from "../../../lib/email/EmailService.js";

export async function POST(request) {
  try {
    const { testEmail } = await request.json();

    if (!testEmail) {
      return Response.json(
        { success: false, error: "Test email address is required" },
        { status: 400 }
      );
    }

    const emailService = new EmailService();

    // First test the connection
    const connectionResult = await emailService.testConnection();
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
      "HAI - Email Configuration Test",
      "<h1>Email Configuration Test</h1><p>If you receive this email, your HAI email configuration is working correctly!</p><p>Test sent at: " +
        new Date().toISOString() +
        "</p>",
      "Email Configuration Test - If you receive this email, your HAI email configuration is working correctly! Test sent at: " +
        new Date().toISOString()
    );

    return Response.json(testResult);
  } catch (error) {
    console.error("Email test error:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
