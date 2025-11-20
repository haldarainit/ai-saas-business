export async function POST(request) {
  try {
    const { prompt, urls = [] } = await request.json();

    if (!prompt || !prompt.trim()) {
      return Response.json(
        {
          success: false,
          error: "Prompt is required",
        },
        { status: 400 }
      );
    }

    console.log("Generating strategies with:", {
      prompt,
      urlCount: urls.length,
    });

    // Import Gemini AI
    const geminiModule = await import("../../../utils/gemini.js");
    const gemini = geminiModule.default || geminiModule;

    // Fetch URL content if provided
    let urlContext = "";
    if (urls && urls.length > 0) {
      urlContext = "\n\n--- ADDITIONAL CONTEXT FROM PROVIDED URLS ---\n";
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (response.ok) {
            const html = await response.text();
            // Simple HTML text extraction
            let text = html
              .replace(/<script[^>]*>.*?<\/script>/gis, "")
              .replace(/<style[^>]*>.*?<\/style>/gis, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 5000); // Limit length

            urlContext += `\n\nContent from ${url}:\n${text}\n`;
          }
        } catch (error) {
          console.error(`Error fetching URL ${url}:`, error);
          urlContext += `\n\nNote: Could not fetch content from ${url}\n`;
        }
      }
      urlContext += "\n--- END OF URL CONTENT ---\n\n";
    }

    // Create the prompt for generating multiple strategies
    const systemPrompt = `You are a world-class marketing strategist AI. Analyze this marketing challenge and generate 4-6 DISTINCT, creative campaign strategies.

User's Goal/Challenge:
${prompt}
${urlContext}

${
  urlContext
    ? "**IMPORTANT**: Incorporate competitive insights and industry trends from the provided URLs throughout your strategies.\n"
    : ""
}

Generate 4-6 diverse marketing campaign strategies. Each strategy should be DISTINCTLY DIFFERENT and cover various marketing channels/approaches.

For EACH strategy, provide a JSON object with these fields:
- title: A catchy, specific campaign name (3-6 words)
- description: Detailed explanation of the campaign approach (50-80 words)
- whyItStandsOut: Why this strategy is uniquely effective (30-50 words)
- tags: Array of 3-5 relevant marketing tags/categories (e.g., "Social Media", "Paid Ads", "Email Marketing", "Content Strategy", "Influencer Marketing", "SEO", "Analytics", etc.)
- channelType: One of: "social", "paid-ads", "email", "content", "analytics", "seo"

Make sure each strategy focuses on a DIFFERENT marketing channel or approach:
1. Strategy focused on Social Media campaigns
2. Strategy focused on Paid Advertising (Meta/Google Ads)
3. Strategy focused on Email Marketing
4. Strategy focused on Content Marketing & SEO
5. Strategy focused on Analytics & Data-Driven approach
6. Strategy focused on Influencer/Partnership Marketing

Return ONLY a valid JSON array of strategy objects. No markdown, no code blocks, just the JSON array.

Example format:
[
  {
    "title": "Data-Driven Personalization Engine",
    "description": "Create a hyper-personalized campaign using granular data to customize user experience. Deliver tailored content and retargeting ads based on real-time behavior and preferred channels for maximum impact.",
    "whyItStandsOut": "This approach offers high impact by directly addressing user challenges with a practical, data-driven method. It enhances existing efforts with clear execution paths.",
    "tags": ["Real-Time Behavioral Targeting", "Multi-Channel Personalization", "Data-Driven ROI", "Analytics"],
    "channelType": "analytics"
  }
]`;

    // Generate AI response
    const aiResponse = await gemini.generateAIResponse(systemPrompt);

    console.log("Raw AI response:", aiResponse);

    // Parse the JSON response
    try {
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "");

      // Find JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsedStrategies = JSON.parse(jsonStr);

      // Map channel types to icons and gradients
      const channelConfig = {
        social: {
          icon: "Share2",
          gradient: "from-blue-500 to-cyan-500",
        },
        "paid-ads": {
          icon: "Megaphone",
          gradient: "from-pink-500 to-rose-500",
        },
        email: {
          icon: "Mail",
          gradient: "from-green-500 to-emerald-500",
        },
        content: {
          icon: "Globe",
          gradient: "from-purple-500 to-indigo-500",
        },
        analytics: {
          icon: "LineChart",
          gradient: "from-orange-500 to-amber-500",
        },
        seo: {
          icon: "TrendingUp",
          gradient: "from-teal-500 to-cyan-500",
        },
      };

      // Add IDs and visual properties to strategies
      const strategies = parsedStrategies.map((strategy, index) => ({
        id: index + 1,
        ...strategy,
        icon: channelConfig[strategy.channelType]?.icon || "Target",
        gradient:
          channelConfig[strategy.channelType]?.gradient ||
          "from-purple-500 to-indigo-500",
      }));

      return Response.json({
        success: true,
        strategies: strategies,
      });
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("AI Response:", aiResponse);

      // Return fallback strategies
      return Response.json({
        success: true,
        strategies: [
          {
            id: 1,
            title: "Social Media Engagement Blitz",
            description:
              "Launch a multi-platform social media campaign targeting your ideal audience with engaging content, interactive polls, and user-generated content initiatives to build community and drive organic reach.",
            whyItStandsOut:
              "Leverages the power of social proof and community building to create authentic brand connections that convert followers into customers.",
            tags: [
              "Social Media",
              "Community Building",
              "User-Generated Content",
              "Organic Reach",
            ],
            icon: "Share2",
            gradient: "from-blue-500 to-cyan-500",
            channelType: "social",
          },
          {
            id: 2,
            title: "Precision-Targeted Ad Campaign",
            description:
              "Deploy data-driven paid advertising across Meta and Google platforms with laser-focused targeting, A/B tested creatives, and optimized bidding strategies to maximize ROI and conversion rates.",
            whyItStandsOut:
              "Combines advanced targeting capabilities with continuous optimization to ensure every advertising dollar delivers measurable results.",
            tags: [
              "Paid Ads",
              "Meta Ads",
              "Google Ads",
              "A/B Testing",
              "ROI Optimization",
            ],
            icon: "Megaphone",
            gradient: "from-pink-500 to-rose-500",
            channelType: "paid-ads",
          },
          {
            id: 3,
            title: "Email Nurture Sequence",
            description:
              "Create a sophisticated email marketing funnel with personalized sequences, behavioral triggers, and segmented messaging to guide prospects through the customer journey and maximize lifetime value.",
            whyItStandsOut:
              "Delivers personalized communication at scale, nurturing relationships and converting leads with tailored messaging at each stage.",
            tags: [
              "Email Marketing",
              "Marketing Automation",
              "Personalization",
              "Lead Nurturing",
            ],
            icon: "Mail",
            gradient: "from-green-500 to-emerald-500",
            channelType: "email",
          },
          {
            id: 4,
            title: "Content-Powered SEO Strategy",
            description:
              "Build authority through strategic content marketing and SEO optimization, creating valuable resources that attract organic traffic, establish thought leadership, and drive sustainable growth.",
            whyItStandsOut:
              "Creates long-term value through organic visibility while positioning your brand as an industry authority that customers trust.",
            tags: [
              "Content Marketing",
              "SEO",
              "Thought Leadership",
              "Organic Traffic",
            ],
            icon: "Globe",
            gradient: "from-purple-500 to-indigo-500",
            channelType: "content",
          },
        ],
      });
    }
  } catch (error) {
    console.error("Error in generate-strategies API:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to generate strategies",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
