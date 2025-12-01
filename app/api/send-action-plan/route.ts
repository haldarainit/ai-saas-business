import { NextRequest, NextResponse } from "next/server";
import { extractUserFromRequest } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Extract user information from authentication
    const authResult = extractUserFromRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userEmail = authResult.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    const { actionPlanData } = await request.json();

    if (!actionPlanData) {
      return NextResponse.json(
        { success: false, error: "Action plan data is required" },
        { status: 400 }
      );
    }

    // Generate HTML email template
    const emailHtml = generateActionPlanEmail(actionPlanData);
    const emailSubject = `Your Marketing Campaign Action Plan - ${actionPlanData.projectBrief?.projectName || "Campaign Planner"}`;

    // Dynamically import EmailService
    const EmailServiceModule = await import("@/lib/email/EmailService");
    const EmailService = EmailServiceModule.default;
    const emailService = new EmailService();

    const result = await emailService.sendEmail(
      userEmail,
      emailSubject,
      emailHtml,
      null,
      {
        enableTracking: false, // No tracking for action plan emails
        userId: authResult.user.id,
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Action plan sent successfully to ${userEmail}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send action plan error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateActionPlanEmail(actionPlanData: any): string {
  const { projectBrief, strategicAnalysis, executionPhases, actionItems, templates, recommendedTools, nextSteps } = actionPlanData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Marketing Campaign Action Plan</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-top: 30px;
      font-size: 22px;
    }
    h3 {
      color: #764ba2;
      font-size: 18px;
      margin-top: 20px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .subsection {
      margin: 15px 0;
      padding: 15px;
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    ul {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 8px 0;
    }
    .phase {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #ff6b6b;
    }
    .action-item {
      background-color: #e8f5e9;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
      border-left: 4px solid #4caf50;
    }
    .priority-high {
      color: #d32f2f;
      font-weight: bold;
    }
    .priority-medium {
      color: #f57c00;
      font-weight: bold;
    }
    .priority-low {
      color: #1976d2;
      font-weight: bold;
    }
    .template {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
      border-left: 4px solid #2196f3;
    }
    .code-block {
      background-color: #263238;
      color: #aed581;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      margin: 10px 0;
    }
    .tool {
      background-color: #fff3e0;
      padding: 12px;
      border-radius: 6px;
      margin: 8px 0;
      border-left: 4px solid #ff9800;
    }
    .timeline {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .timeline-item {
      flex: 1;
      background-color: #f3e5f5;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #9c27b0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
    }
    .badge-success {
      background-color: #4caf50;
      color: white;
    }
    .badge-warning {
      background-color: #ff9800;
      color: white;
    }
    .badge-info {
      background-color: #2196f3;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Your Marketing Campaign Action Plan</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Comprehensive strategy ready for immediate implementation</p>
    </div>

    ${projectBrief ? `
    <div class="section">
      <h2>📋 Project Brief</h2>
      <div class="subsection">
        <h3>Project Name</h3>
        <p><strong>${projectBrief.projectName || 'N/A'}</strong></p>
      </div>
      <div class="subsection">
        <h3>Description</h3>
        <p>${projectBrief.description || 'N/A'}</p>
      </div>
      ${projectBrief.targetAudience?.length > 0 ? `
      <div class="subsection">
        <h3>Target Audience</h3>
        <ul>
          ${projectBrief.targetAudience.map((audience: string) => `<li>${audience}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ${projectBrief.keyObjectives?.length > 0 ? `
      <div class="subsection">
        <h3>Key Objectives</h3>
        <ul>
          ${projectBrief.keyObjectives.map((objective: string) => `<li>${objective}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ${projectBrief.successMetrics?.length > 0 ? `
      <div class="subsection">
        <h3>Success Metrics</h3>
        <ul>
          ${projectBrief.successMetrics.map((metric: string) => `<li>${metric}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    ` : ''}

    ${strategicAnalysis ? `
    <div class="section">
      <h2>💡 Strategic Analysis</h2>
      <div class="subsection">
        <h3>Market Opportunity</h3>
        <p>${strategicAnalysis.marketOpportunity || 'N/A'}</p>
      </div>
      <div class="subsection">
        <h3>Competitive Advantage</h3>
        <p>${strategicAnalysis.competitiveAdvantage || 'N/A'}</p>
      </div>
      <div class="subsection">
        <h3>Risk Assessment</h3>
        <p>${strategicAnalysis.riskAssessment || 'N/A'}</p>
      </div>
      <div class="subsection">
        <h3>Resource Requirements</h3>
        <p>${strategicAnalysis.resourceRequirements || 'N/A'}</p>
      </div>
    </div>
    ` : ''}

    ${executionPhases?.length > 0 ? `
    <div class="section">
      <h2>📅 Execution Plan</h2>
      ${executionPhases.map((phase: any) => `
        <div class="phase">
          <h3>Phase ${phase.phaseNumber}: ${phase.title}</h3>
          <p><span class="badge badge-info">${phase.duration}</span></p>
          <p>${phase.description}</p>
          ${phase.deliverables?.length > 0 ? `
            <h4>Deliverables:</h4>
            <ul>
              ${phase.deliverables.map((deliverable: string) => `<li>${deliverable}</li>`).join('')}
            </ul>
          ` : ''}
          ${phase.milestones?.length > 0 ? `
            <h4>Milestones:</h4>
            <ul>
              ${phase.milestones.map((milestone: string) => `<li>${milestone}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${actionItems?.length > 0 ? `
    <div class="section">
      <h2>✅ Action Items Checklist</h2>
      ${actionItems.map((item: any) => `
        <div class="action-item">
          <p>
            <span class="badge ${item.priority === 'High' ? 'badge-warning' : item.priority === 'Medium' ? 'badge-info' : 'badge-success'}">${item.priority} Priority</span>
            <span class="badge badge-info">${item.timeframe}</span>
          </p>
          <p><strong>${item.task}</strong></p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${templates?.length > 0 ? `
    <div class="section">
      <h2>⚡ Ready-to-Use Resources</h2>
      <h3>Content & Templates</h3>
      ${templates.map((template: any) => `
        <div class="template">
          <h4>${template.title}</h4>
          <p>${template.description}</p>
          ${template.content ? `
            <div class="code-block">
              <pre>${template.content}</pre>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${recommendedTools?.length > 0 ? `
    <div class="section">
      <h3>🛠️ Recommended Tools</h3>
      ${recommendedTools.map((tool: any) => `
        <div class="tool">
          <h4>${tool.name}</h4>
          <p>${tool.description}</p>
          <p><small>${tool.details}</small></p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${nextSteps ? `
    <div class="section">
      <h2>⏰ Next Steps Timeline</h2>
      <div class="timeline">
        ${nextSteps.immediate?.length > 0 ? `
        <div class="timeline-item">
          <h4>Immediate (Today)</h4>
          <ul>
            ${nextSteps.immediate.map((step: string) => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        ${nextSteps.week1?.length > 0 ? `
        <div class="timeline-item">
          <h4>Week 1</h4>
          <ul>
            ${nextSteps.week1.map((step: string) => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        ${nextSteps.month1?.length > 0 ? `
        <div class="timeline-item">
          <h4>Month 1</h4>
          <ul>
            ${nextSteps.month1.map((step: string) => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Comprehensive action plan by Campaign Planner AI</strong></p>
      <p>Ready for immediate implementation • Generated with advanced AI analysis</p>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        This action plan was generated specifically for your campaign and contains strategic insights,
        execution phases, and ready-to-use resources to help you achieve your marketing goals.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
