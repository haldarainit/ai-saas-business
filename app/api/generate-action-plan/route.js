export async function POST(request) {
  try {
    const { strategy, prompt, websiteContext } = await request.json();

    if (!strategy || !strategy.title) {
      return Response.json(
        {
          success: false,
          error: "Strategy data is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating action plan for strategy:", strategy.title);

    // Import Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    // Create the prompt for generating a comprehensive action plan
    const actionPlanPrompt = `You are a world-class marketing strategist AI. You need to create a comprehensive, actionable implementation plan for the following marketing campaign strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 STRATEGY TO IMPLEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Campaign Title**: ${strategy.title}
**Campaign Description**: ${strategy.description}
**Why It Stands Out**: ${strategy.whyItStandsOut}
**Channel Type**: ${strategy.channelType || "general"}
**Tags**: ${strategy.tags.join(", ")}

**Original User Goal/Challenge**: ${prompt || "General marketing campaign"}

${
  websiteContext
    ? `**Business Context**: Information from the user's website:\n${websiteContext.substring(
        0,
        1500
      )}...`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a detailed action plan that includes specific, actionable guidance. Return ONLY a valid JSON object (no markdown, no code blocks):

{
  "projectBrief": {
    "title": "string (campaign launch title)",
    "overview": "string (2-3 sentences about campaign overview)",
    "keyObjectives": ["string", "string", "string"] (3-4 specific measurable objectives),
    "successMetrics": ["string", "string", "string", "string"] (4-5 specific KPIs to track)
  },
  "strategicAnalysis": {
    "marketOpportunity": "string (2-3 sentences)",
    "competitiveAdvantage": "string (2-3 sentences with numbered points)",
    "riskAssessment": "string (2-3 sentences with numbered points)",
    "resourceRequirements": "string (2-3 sentences with budget, team, timeline)"
  },
  "executionPhases": [
    {
      "phaseNumber": 1,
      "title": "string (phase name)",
      "duration": "string (e.g., '4 weeks')",
      "description": "string (what happens in this phase)",
      "deliverables": ["string", "string", "string", "string"],
      "milestones": ["string", "string", "string", "string"]
    },
    {
      "phaseNumber": 2,
      "title": "string",
      "duration": "string",
      "description": "string",
      "deliverables": ["string", "string", "string", "string"],
      "milestones": ["string", "string", "string", "string"]
    },
    {
      "phaseNumber": 3,
      "title": "string",
      "duration": "string",
      "description": "string",
      "deliverables": ["string", "string", "string", "string"],
      "milestones": ["string", "string", "string", "string"]
    }
  ],
  "actionItems": [
    {
      "priority": "High|Medium|Low",
      "timeframe": "string (e.g., 'Week 1', 'Weeks 2-4')",
      "task": "string (detailed task description)"
    },
    {
      "priority": "High|Medium|Low",
      "timeframe": "string",
      "task": "string"
    },
    {
      "priority": "High|Medium|Low",
      "timeframe": "string",
      "task": "string"
    }
  ],
  "templates": [
    {
      "title": "string (template name)",
      "description": "string (what this template is for)",
      "content": "string (actual template content/code)"
    },
    {
      "title": "string",
      "description": "string",
      "content": "string"
    },
    {
      "title": "string",
      "description": "string",
      "content": "string"
    }
  ],
  "recommendedTools": [
    {
      "name": "string (tool name)",
      "description": "string (brief description)",
      "details": "string (how to use it for this campaign)"
    },
    {
      "name": "string",
      "description": "string",
      "details": "string"
    },
    {
      "name": "string",
      "description": "string",
      "details": "string"
    }
  ],
  "nextSteps": {
    "immediate": ["string", "string"] (2 tasks for today),
    "week1": ["string", "string"] (2 tasks for week 1),
    "month1": ["string", "string"] (2 tasks for month 1)
  }
}

Guidelines:
- Make all content SPECIFIC to the ${
      strategy.channelType || "marketing"
    } channel and strategy provided
- Provide actionable, practical advice that can be implemented immediately
- Include realistic timelines and resource estimates
- Templates should be ready-to-use with placeholders
- Tools should be specific to the campaign type
- Consider the user's business context if provided
- Be comprehensive but concise - focus on actionable items
- Create 3 execution phases with clear deliverables and milestones
- Provide 3-4 action items prioritized by urgency
- Include 3-4 ready-to-use templates specific to this campaign type
- Recommend 3-4 tools that are most relevant to this strategy`;

    console.log("🚀 Sending action plan request to Gemini AI...");

    // Generate AI response
    const aiResponse = await gemini.generateAIResponse(actionPlanPrompt);

    console.log(
      "✅ AI Action Plan received. Length:",
      aiResponse.length,
      "chars"
    );

    // Parse the JSON response
    try {
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "");

      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const actionPlan = JSON.parse(jsonStr);

      // Validate the structure
      if (
        !actionPlan.projectBrief ||
        !actionPlan.executionPhases ||
        !actionPlan.actionItems
      ) {
        throw new Error("Invalid action plan structure");
      }

      return Response.json({
        success: true,
        actionPlan: actionPlan,
      });
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("AI Response:", aiResponse);

      // Return a fallback action plan based on the strategy
      return Response.json({
        success: true,
        actionPlan: {
          projectBrief: {
            title: `${strategy.title} Campaign Launch`,
            overview: `${strategy.description} This campaign will be designed to create meaningful engagement and drive measurable results through strategic execution.`,
            keyObjectives: [
              "Increase brand awareness by 25% within target demographic",
              "Generate qualified leads through strategic channels",
              "Achieve strong engagement metrics and positive ROI",
              "Build sustainable momentum for long-term success",
            ],
            successMetrics: [
              "Campaign reach and impressions",
              "Engagement rate (likes, shares, comments)",
              "Lead generation and conversion rate",
              "Return on ad spend (ROAS)",
              "Customer acquisition cost (CAC)",
            ],
          },
          strategicAnalysis: {
            marketOpportunity:
              "The market shows strong demand for this type of marketing approach. Current trends indicate growing consumer engagement with these channels, creating significant opportunity for brands to capture attention and drive conversions.",
            competitiveAdvantage:
              "This strategy differentiates through: 1) Innovative execution and targeted positioning; 2) Data-driven optimization and continuous improvement; 3) Strategic channel selection and timing; 4) Compelling creative that resonates with the target audience.",
            riskAssessment:
              "Primary risks include: 1) Market saturation - mitigation through unique positioning and creative; 2) Budget constraints - mitigation through phased rollout and testing; 3) Execution challenges - mitigation through detailed planning and experienced team.",
            resourceRequirements:
              "Implementation requires: Budget ($10,000 - $50,000 depending on scale); Team (3-5 marketing professionals); Tools (marketing automation, analytics, creative software); Timeline (6-8 weeks from planning to launch).",
          },
          executionPhases: [
            {
              phaseNumber: 1,
              title: "Strategy & Planning",
              duration: "2-3 weeks",
              description:
                "Define campaign strategy, target audience, messaging, and creative direction. Set up tracking and measurement infrastructure.",
              deliverables: [
                "Campaign strategy document",
                "Target audience profiles",
                "Creative brief and messaging framework",
                "Measurement plan and KPI dashboard",
              ],
              milestones: [
                "Strategy approved by stakeholders (Week 1)",
                "Creative brief finalized (Week 2)",
                "Tools and platforms configured (Week 2)",
                "Team aligned and ready to execute (Week 3)",
              ],
            },
            {
              phaseNumber: 2,
              title: "Content Creation & Setup",
              duration: "3-4 weeks",
              description:
                "Create campaign assets, set up channels, and prepare all materials for launch. Test and optimize before going live.",
              deliverables: [
                "Campaign creative assets (images, videos, copy)",
                "Landing pages and conversion funnels",
                "Email sequences and automation",
                "Ad campaigns configured and tested",
              ],
              milestones: [
                "Creative assets approved (Week 4)",
                "Landing pages published (Week 5)",
                "Campaign setup complete (Week 6)",
                "Pre-launch testing successful (Week 6)",
              ],
            },
            {
              phaseNumber: 3,
              title: "Launch & Optimization",
              duration: "4+ weeks",
              description:
                "Launch campaign, monitor performance closely, and continuously optimize based on data. Scale what works and cut what doesn't.",
              deliverables: [
                "Campaign launched across all channels",
                "Daily performance reports",
                "A/B test results and optimizations",
                "Scaling plan for successful elements",
              ],
              milestones: [
                "Successful campaign launch (Week 7)",
                "First optimization cycle complete (Week 8)",
                "Performance targets met or exceeded (Week 10)",
                "Scale-up plan implemented (Week 12)",
              ],
            },
          ],
          actionItems: [
            {
              priority: "High",
              timeframe: "Today",
              task: "Define target audience segments and create detailed buyer personas with demographics, pain points, and motivations.",
            },
            {
              priority: "High",
              timeframe: "Week 1",
              task: "Develop core campaign messaging and value proposition that resonates with target audience needs and differentiates from competitors.",
            },
            {
              priority: "High",
              timeframe: "Weeks 2-3",
              task: "Create initial creative assets and landing pages, focusing on compelling headlines and clear calls-to-action.",
            },
            {
              priority: "Medium",
              timeframe: "Weeks 2-4",
              task: "Set up tracking pixels, analytics dashboards, and conversion tracking to measure campaign performance accurately.",
            },
          ],
          templates: [
            {
              title: "Campaign Brief Template",
              description:
                "A comprehensive template for documenting your campaign strategy and getting team alignment.",
              content: `CAMPAIGN BRIEF: ${strategy.title}

OBJECTIVE:
[Primary campaign goal]

TARGET AUDIENCE:
- Demographics: [Age, location, income, etc.]
- Psychographics: [Interests, values, behaviors]
- Pain Points: [What problems do they face?]

KEY MESSAGE:
[Core value proposition in one sentence]

CHANNELS:
- Primary: [Main channel]
- Secondary: [Supporting channels]

BUDGET: $[Amount]
TIMELINE: [Start date] - [End date]

SUCCESS METRICS:
1. [Primary KPI]
2. [Secondary KPI]
3. [Tertiary KPI]`,
            },
            {
              title: "Content Calendar Template",
              description:
                "Organize your campaign content and posting schedule across channels.",
              content: `WEEK 1:
Mon: [Content type] - [Platform] - [Topic]
Wed: [Content type] - [Platform] - [Topic]  
Fri: [Content type] - [Platform] - [Topic]

WEEK 2:
Mon: [Content type] - [Platform] - [Topic]
Wed: [Content type] - [Platform] - [Topic]
Fri: [Content type] - [Platform] - [Topic]

CONTENT THEMES:
- Educational (40%)
- Entertaining (30%)
- Promotional (30%)`,
            },
            {
              title: "Performance Tracking Sheet",
              description: "Track campaign metrics and ROI on a weekly basis.",
              content: `WEEK | SPEND | IMPRESSIONS | CLICKS | CTR | CONVERSIONS | CPA | ROAS
1    | $[X]  | [X]         | [X]    | [X]%| [X]         | $[X]| [X]x
2    | $[X]  | [X]         | [X]    | [X]%| [X]         | $[X]| [X]x
3    | $[X]  | [X]         | [X]    | [X]%| [X]         | $[X]| [X]x

KEY INSIGHTS:
- [Observation 1]
- [Observation 2]
- [Action item based on data]`,
            },
          ],
          recommendedTools: [
            {
              name: "Google Analytics",
              description:
                "Essential web analytics platform for tracking campaign performance.",
              details:
                "Set up conversion goals, UTM parameters, and custom dashboards to monitor traffic sources, user behavior, and ROI in real-time.",
            },
            {
              name: "Canva Pro",
              description:
                "Design tool for creating professional campaign visuals.",
              details:
                "Use brand kit feature for consistent visuals across all campaign materials. Access premium templates and stock photos for faster creation.",
            },
            {
              name: "Buffer/Hootsuite",
              description:
                "Social media management platform for scheduling and analytics.",
              details:
                "Schedule posts in advance, monitor engagement across platforms, and analyze performance to optimize posting times and content types.",
            },
            {
              name: "Google Ads / Meta Ads Manager",
              description: "Primary advertising platforms for paid campaigns.",
              details:
                "Set up conversion tracking, create A/B tests, and use audience targeting to maximize ROI. Start with small budgets and scale winners.",
            },
          ],
          nextSteps: {
            immediate: [
              "Finalize campaign objectives and target audience definition",
              "Set up project tracking board with timeline and responsibilities",
            ],
            week1: [
              "Develop core messaging and creative brief",
              "Begin designing initial campaign assets and landing pages",
            ],
            month1: [
              "Launch campaign with initial budget allocation",
              "Implement tracking and begin daily performance monitoring",
            ],
          },
        },
      });
    }
  } catch (error) {
    console.error("Error in generate-action-plan API:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to generate action plan",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
