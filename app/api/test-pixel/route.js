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

    // Test HTML content
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #333; }
            .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 Email Tracking Pixel Test</h1>
            <p>This is a test email to verify that the tracking pixel is being added correctly.</p>
            
            <div class="info">
              <h3>What to check:</h3>
              <ul>
                <li><strong>Scroll to the bottom of the email</strong> - You should see a visible tracking image (100x100 green checkmark)</li>
                <li>The image source should point to: <code>/api/track/pixel/[tracking-id]</code></li>
                <li>If you see the image, it means images are loading correctly in your email</li>
                <li>If you DON'T see it, your email client might be blocking external images</li>
              </ul>
            </div>

            <p><strong>Important:</strong> Scroll to the bottom of this email to see if a green checkmark image (100x100px) appears. This verifies that tracking images are being included and loaded.</p>
            
            <p class="success">✅ Email sent successfully at: ${new Date().toISOString()}</p>
            
            <p style="color: #666; font-size: 12px;">Note: If you don't see the tracking image at the bottom, your email client might be blocking external images. Look for a "Show images" or "Display images" button.</p>
            
            <p>Test some links:</p>
            <a href="https://example.com">Click here to test link tracking</a>
          </div>
        </body>
      </html>
    `;

    // Send email WITH tracking enabled
    const result = await emailService.sendEmail(
      testEmail,
      "🔍 Tracking Pixel Test - BusinessAI",
      htmlContent,
      "This is a tracking pixel test email. Please check the HTML source to see the pixel.",
      {
        enableTracking: true,
        userId: "test-user",
        emailId: "pixel-test-" + Date.now(),
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      }
    );

    // Return the result with additional debug info
    return Response.json({
      ...result,
      debug: {
        trackingEnabled: true,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        trackingId: result.trackingId,
        expectedPixelUrl: result.trackingId
          ? `${
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            }/api/track/pixel/${result.trackingId}`
          : "N/A",
        message:
          "Check the email HTML source to see the tracking pixel at the bottom (before </body> tag)",
      },
    });
  } catch (error) {
    console.error("Pixel test error:", error);
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

// Also create a GET endpoint to show the HTML that would be sent
export async function GET() {
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
        </style>
      </head>
      <body>
        <h1>Sample Email Content</h1>
        <p>This is the email content.</p>
        <a href="https://example.com">Test Link</a>
      </body>
    </html>
  `;

  // Simulate what appendOpenPixel does
  const trackingId = "SAMPLE_TRACKING_ID_12345";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const pixelUrl = `${baseUrl}/api/track/pixel/${trackingId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;

  let finalHtml = htmlContent;
  if (finalHtml.includes("</body>")) {
    finalHtml = finalHtml.replace(/<\/body>/i, `${pixel}</body>`);
  } else {
    finalHtml = finalHtml + pixel;
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <title>Sample Email HTML with Tracking Pixel</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
    pre { background: #272822; color: #f8f8f2; padding: 20px; border-radius: 5px; overflow-x: auto; }
    .highlight { background: yellow; color: black; font-weight: bold; }
    h2 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email HTML Preview with Tracking Pixel</h1>
    <p>This shows what the actual HTML looks like with the tracking pixel added.</p>
    
    <h2>HTML Source:</h2>
    <pre>${finalHtml
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /&lt;img src="[^"]*" width="1" height="1" style="display:none;" alt="" \/&gt;/g,
        '<span class="highlight">&lt;img src="' +
          pixelUrl +
          '" width="1" height="1" style="display:none;" alt="" /&gt;</span>'
      )}</pre>

    <h2>Tracking Pixel Details:</h2>
    <ul>
      <li><strong>Pixel URL:</strong> ${pixelUrl}</li>
      <li><strong>Size:</strong> 1x1 pixels (invisible)</li>
      <li><strong>Style:</strong> display:none (hidden)</li>
      <li><strong>Location:</strong> Before &lt;/body&gt; tag</li>
    </ul>

    <h2>Rendered Email:</h2>
    <iframe srcdoc="${finalHtml.replace(
      /"/g,
      "&quot;"
    )}" style="width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 5px;"></iframe>
  </div>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}
