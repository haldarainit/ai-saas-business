export function generateEmployeeWelcomeEmail(employeeData) {
    const { name, employeeId, tempPassword, verificationLink, portalLink } = employeeData;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px;
      color: white;
    }
    .content {
      background: white;
      border-radius: 12px;
      padding: 32px;
      margin-top: 24px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .credentials {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .credentials h3 {
      margin-top: 0;
      color: #667eea;
    }
    .credential-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .credential-item:last-child {
      border-bottom: none;
    }
    .credential-label {
      font-weight: 600;
      color: #666;
    }
    .credential-value {
      font-family: 'Courier New', monospace;
      background: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      color: #667eea;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 8px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .button-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      box-shadow: none;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
      color: #856404;
    }
    .footer {
      text-align: center;
      color: white;
      margin-top: 24px;
      font-size: 14px;
      opacity: 0.9;
    }
    .steps {
      counter-reset: step-counter;
      list-style: none;
      padding: 0;
    }
    .steps li {
      counter-increment: step-counter;
      margin: 16px 0;
      padding-left: 40px;
      position: relative;
    }
    .steps li:before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      background: #667eea;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Our Team!</h1>
      <p style="margin: 8px 0; font-size: 18px;">Hi ${name},</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 24px;">
        We're excited to have you on board! Your employee account has been created successfully.
      </p>

      <div class="credentials">
        <h3>📋 Your Login Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Employee ID:</span>
          <span class="credential-value">${employeeId}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Temporary Password:</span>
          <span class="credential-value">${tempPassword}</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important Security Notice:</strong>
        <p style="margin: 8px 0 0 0;">
          This is a temporary password. You'll be required to change it on your first login for security purposes.
        </p>
      </div>

      <h3 style="margin-top: 32px; color: #667eea;">📝 Getting Started</h3>
      <ol class="steps">
        <li>Click the "Verify Email" button below to verify your account</li>
        <li>After verification, click "Access Portal" to log in</li>
        <li>Use your Employee ID and temporary password to sign in</li>
        <li>Change your password when prompted</li>
        <li>Start marking your attendance!</li>
      </ol>

      <div class="button-container">
        <a href="${verificationLink}" class="button">
          ✓ Verify Email
        </a>
        <a href="${portalLink}" class="button button-secondary">
          → Access Portal
        </a>
      </div>

      <div style="background: #e7f3ff; padding: 16px; border-radius: 8px; margin-top: 24px;">
        <strong style="color: #0066cc;">💡 Quick Tip:</strong>
        <p style="margin: 8px 0 0 0; color: #0066cc;">
          Save this email for reference. You can access the attendance portal anytime using the link above.
        </p>
      </div>
    </div>

    <div class="footer">
      <p>If you have any questions or need assistance, please contact your HR department.</p>
      <p style="margin-top: 16px; font-size: 12px;">
        © ${new Date().getFullYear()} HAI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateVerificationSuccessEmail(employeeData) {
    const { name, portalLink } = employeeData;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 16px;
      padding: 40px;
      color: white;
      text-align: center;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .content {
      background: white;
      border-radius: 12px;
      padding: 32px;
      margin-top: 24px;
      color: #333;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1 style="margin: 0;">Email Verified!</h1>
    
    <div class="content">
      <p style="font-size: 18px; margin-bottom: 24px;">
        Great news, ${name}! Your email has been successfully verified.
      </p>
      
      <p>You can now access your employee portal and start marking attendance.</p>
      
      <a href="${portalLink}" class="button">Access Employee Portal</a>
    </div>
  </div>
</body>
</html>
  `;
}
