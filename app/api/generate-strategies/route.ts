interface GenerateStrategiesBody {
    prompt: string;
    urls?: string[];
}

interface ChannelConfig {
    icon: string;
    gradient: string;
}

interface Strategy {
    id?: number;
    title: string;
    description: string;
    whyItStandsOut: string;
    tags: string[];
    channelType: string;
    icon?: string;
    gradient?: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const { prompt, urls = [] }: GenerateStrategiesBody = await request.json();

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
            urls: urls,
        });

        // STEP 1: Complete ALL scraping FIRST before generating AI content
        let urlContext = "";
        if (urls && urls.length > 0) {
            console.log(`🌐 Starting web scraping for ${urls.length} URL(s)...`);
            urlContext = "\n\n--- BUSINESS/PRODUCT CONTEXT FROM YOUR WEBSITE ---\n";

            // Scrape all URLs sequentially and wait for completion
            for (const url of urls) {
                try {
                    console.log(`📡 Scraping website: ${url}`);

                    // Use our web scraper API internally
                    const scrapeResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
                        }/api/scrape-website`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ url }),
                        }
                    );

                    if (scrapeResponse.ok) {
                        const scrapeData = await scrapeResponse.json();

                        if (scrapeData.success && scrapeData.data) {
                            const data = scrapeData.data;
                            console.log(`✅ Successfully scraped: ${url}`);
                            console.log(`   - Title: ${data.title}`);
                            console.log(
                                `   - Content length: ${data.summary?.length || 0} chars`
                            );

                            urlContext += `\n\n📊 WEBSITE CONTENT FROM: ${url}\n`;
                            urlContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                            urlContext += `Page Title: ${data.title}\n`;
                            urlContext += `Meta Description: ${data.metaDescription}\n\n`;

                            if (data.headings && data.headings.length > 0) {
                                urlContext += `Main Headings & Sections:\n${data.headings
                                    .slice(0, 15)
                                    .join("\n")}\n\n`;
                            }

                            urlContext += `Detailed Website Analysis:\n${data.summary}\n`;
                            urlContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                        } else {
                            console.log(`⚠️ Could not fully analyze ${url}`);
                            urlContext += `\n\n⚠️ Could not fully analyze ${url}\n`;
                        }
                    } else {
                        console.error(
                            `❌ Scraper API failed for ${url}: ${scrapeResponse.status}`
                        );
                        urlContext += `\n\n⚠️ Unable to scrape ${url}\n`;
                    }
                } catch (error) {
                    const err = error as Error;
                    console.error(`❌ Error scraping URL ${url}:`, error);
                    urlContext += `\n\n⚠️ Error analyzing ${url}: ${err.message}\n`;
                }
            }
            urlContext += "\n--- END OF WEBSITE CONTEXT ---\n\n";
            console.log(
                `✅ Scraping complete. Total context length: ${urlContext.length} chars`
            );
        } else {
            console.log("ℹ️ No URLs provided - generating generic strategies");
        }

        // STEP 2: Now that scraping is COMPLETE, import Gemini and generate AI response
        console.log("🤖 Starting AI strategy generation...");
        const geminiModule = await import("../../../utils/gemini");
        const gemini = geminiModule.default || geminiModule;

        // Create the prompt for generating multiple strategies
        const systemPrompt = `You are a world-class marketing strategist AI. Your task is to analyze the business/product information provided and create 4-6 HIGHLY PERSONALIZED marketing campaign strategies.

${urlContext
                ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CRITICAL CONTEXT - READ CAREFULLY 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user has provided their website URL, and we have scraped comprehensive information about their business. Below is DETAILED INFORMATION about their business, products, services, value proposition, and target audience.

**YOUR PRIMARY TASK**: Use this scraped website data to create SPECIFIC, PERSONALIZED marketing strategies that are tailored to THIS EXACT BUSINESS. Do NOT create generic strategies. Reference their specific products, services, value propositions, and target audiences from the website content below.

${urlContext}

USER'S SPECIFIC MARKETING GOAL/CHALLENGE:
${prompt}

**MANDATORY REQUIREMENTS**:
1. Every strategy MUST reference specific elements from the website content above
2. Tailor strategies to their actual products/services mentioned in the scraped content
3. Address their specific target audience identified in the website
4. Leverage their unique value propositions and differentiators
5. Make strategies actionable based on their current offerings and positioning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                : `USER'S MARKETING GOAL/CHALLENGE:
${prompt}

**NOTE**: No website URL was provided. Create strategies based on the user's prompt, but keep them adaptable and broadly applicable.`
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

        console.log("📝 AI Prompt created. Length:", systemPrompt.length, "chars");
        if (urlContext) {
            console.log("   ✅ Includes scraped website data");
        }
        console.log("🚀 Sending to Gemini AI...");

        // Generate AI response
        const aiResponse: string = await gemini.generateAIResponse(systemPrompt);

        console.log("✅ AI Response received. Length:", aiResponse.length, "chars");

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

            const parsedStrategies: Strategy[] = JSON.parse(jsonStr);

            // Map channel types to icons and gradients
            const channelConfig: Record<string, ChannelConfig> = {
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
            const strategies: Strategy[] = parsedStrategies.map((strategy, index) => ({
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
        const err = error as Error;
        console.error("Error in generate-strategies API:", error);
        return Response.json(
            {
                success: false,
                error: "Failed to generate strategies",
                details: err.message,
            },
            { status: 500 }
        );
    }
}
