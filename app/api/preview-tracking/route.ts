export async function GET(): Promise<Response> {
    const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      max-width: 600px; 
      margin: 40px auto; 
      padding: 20px;
      background: #f5f5f5;
    }
    .email-container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; }
    .info-box {
      background: #e3f2fd;
      padding: 15px;
      border-left: 4px solid #2196F3;
      margin: 20px 0;
    }
    .tracking-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px dashed #ddd;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h1>📧 Email with Visible Tracking Image</h1>
    
    <p>Hello,</p>
    
    <p>This is a sample email showing how the tracking image will appear.</p>
    
    <div class="info-box">
      <strong>🎯 Testing Instructions:</strong>
      <ol>
        <li>Send a test email to yourself using <code>/api/test-pixel</code></li>
        <li>Check your email inbox</li>
        <li>Scroll to the bottom of the email</li>
        <li>You should see a GREEN CHECKMARK IMAGE (100x100px)</li>
        <li>If you see it = Images are working ✅</li>
        <li>If you don't see it = Email client is blocking images ❌</li>
      </ol>
    </div>
    
    <p>This is regular email content...</p>
    
    <div class="tracking-section">
      <h3 style="color: #666; text-align: center;">⬇️ TRACKING IMAGE APPEARS BELOW ⬇️</h3>
      
      <!-- This is what gets added to every email -->
      <div style="text-align: center; margin: 20px 0; padding: 10px; background: #f0f0f0; border: 2px dashed #ccc;">
        <p style="margin: 10px 0; color: #666; font-size: 12px;">📊 Email Tracking Active</p>
        <img src="/api/track/pixel/DEMO_TRACKING_ID" width="100" height="100" style="display: block; margin: 0 auto; border: 2px solid #4CAF50;" alt="Tracking Image" />
        <p style="margin: 10px 0; color: #999; font-size: 10px;">If you see this image, tracking is working correctly</p>
      </div>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
    
    <h2>🧪 How to Test:</h2>
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
      <h3>Option 1: Send Test Email via API</h3>
      <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">
POST http://localhost:3000/api/test-pixel
Content-Type: application/json

{
  "testEmail": "your-email@example.com"
}
      </pre>
      
      <h3>Option 2: PowerShell Command</h3>
      <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">
$body = @{
  testEmail = "your-email@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/test-pixel" \`
  -Method POST \`
  -Headers @{"Content-Type"="application/json"} \`
  -Body $body
      </pre>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
      <h3>📋 What You're Testing:</h3>
      <ul>
        <li>✅ Whether images are being included in emails</li>
        <li>✅ Whether your email client loads external images</li>
        <li>✅ Whether the tracking endpoint works</li>
        <li>✅ Whether the base URL is configured correctly</li>
      </ul>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #ffebee; border-radius: 5px; border-left: 4px solid #f44336;">
      <h3>⚠️ Important Notes:</h3>
      <ul>
        <li>Gmail/Outlook often block images by default - look for "Show images" button</li>
        <li>The current base URL is: <code>http://localhost:3000</code></li>
        <li>For production, set <code>NEXT_PUBLIC_BASE_URL</code> to your live domain</li>
        <li>Once you confirm images work, you can switch back to invisible 1x1 pixel</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;

    return new Response(sampleHtml, {
        headers: { "Content-Type": "text/html" },
    });
}
