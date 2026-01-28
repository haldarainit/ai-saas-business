import { NextRequest } from "next/server";

// Type definitions for campaign planner
interface Message {
    role: "user" | "ai";
    content: string;
}

interface ConversationRequest {
    conversationHistory: Message[];
}

interface GeminiResult {
    success?: boolean;
    error?: string;
    [key: string]: unknown;
}

interface CampaignPlannerResponse {
    success: boolean;
    response?: string;
    isQuestion?: boolean;
    isComplete?: boolean;
    stage?: number;
    error?: string;
    details?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const { conversationHistory }: ConversationRequest = await request.json();

        if (!conversationHistory || conversationHistory.length === 0) {
            return Response.json(
                {
                    success: false,
                    error: "Conversation history is required",
                },
                { status: 400 }
            );
        }

        console.log("Campaign Planner - Processing conversation:", {
            messageCount: conversationHistory.length,
        });

        // Import Gemini AI
        const geminiModule = await import("../../../utils/gemini");
        const gemini = geminiModule.default || geminiModule;

        // Build the conversation context for Gemini
        const conversationContext = conversationHistory
            .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
            .join("\n\n");

        // Determine conversation stage based on history length
        const userMessageCount = conversationHistory.filter(
            (msg) => msg.role === "user"
        ).length;

        let systemPrompt = "";

        if (userMessageCount === 1) {
            // First question - ask about target audience
            systemPrompt = `You are a professional marketing strategist AI helping create a comprehensive campaign plan. The user has just described their campaign type.

Previous conversation:
${conversationContext}

Your task: Ask about their TARGET AUDIENCE in detail. Request information about:
- Demographics (age, location, income level)
- Psychographics (interests, values, behaviors)
- Pain points and needs

Keep your response conversational, friendly, and concise (2-3 sentences). End with a clear question about their target audience.`;
        } else if (userMessageCount === 2) {
            // Second question - ask about budget and timeline
            systemPrompt = `You are a professional marketing strategist AI helping create a comprehensive campaign plan. The user has described their campaign type and target audience.

Previous conversation:
${conversationContext}

Your task: Ask about their BUDGET and TIMELINE. Request information about:
- Marketing budget range
- Campaign duration
- Key deadlines or launch dates

Keep your response conversational, friendly, and concise (2-3 sentences). End with a clear question about budget and timeline.`;
        } else if (userMessageCount === 3) {
            // Third question - ask about current marketing channels
            systemPrompt = `You are a professional marketing strategist AI helping create a comprehensive campaign plan. The user has described their campaign type, target audience, and budget/timeline.

Previous conversation:
${conversationContext}

Your task: Ask about their CURRENT MARKETING CHANNELS and preferred platforms. Request information about:
- Current marketing channels (social media, email, paid ads, etc.)
- What has worked well before
- Any channels they want to explore

Keep your response conversational, friendly, and concise (2-3 sentences). End with a clear question about marketing channels.`;
        } else if (userMessageCount === 4) {
            // Fourth question - ask about key messages and goals
            systemPrompt = `You are a professional marketing strategist AI helping create a comprehensive campaign plan. The user has provided campaign type, target audience, budget/timeline, and marketing channels.

Previous conversation:
${conversationContext}

Your task: Ask about their KEY MESSAGES and CAMPAIGN GOALS. Request information about:
- Main message or value proposition
- Specific goals (leads, sales, awareness, engagement)
- Success metrics (KPIs)

Keep your response conversational, friendly, and concise (2-3 sentences). End with a clear question about their key messages and goals.`;
        } else {
            // Final response - generate comprehensive campaign strategy
            systemPrompt = `You are a professional marketing strategist AI. Based on the entire conversation, create a COMPREHENSIVE MARKETING CAMPAIGN STRATEGY.

Previous conversation:
${conversationContext}

Your task: Generate a detailed, actionable campaign plan that includes:

📋 **CAMPAIGN OVERVIEW**
- Campaign name/theme suggestion
- Primary objective
- Target timeline

🎯 **TARGET AUDIENCE PROFILE**
- Demographics summary
- Key pain points
- Messaging approach

💡 **STRATEGIC RECOMMENDATIONS**
- Recommended marketing channels (prioritized)
- Content types for each channel
- Campaign phases/timeline breakdown

📊 **IMPLEMENTATION PLAN**
- Week-by-week action items
- Resource allocation suggestions
- Budget distribution across channels

📈 **SUCCESS METRICS**
- Key Performance Indicators (KPIs)
- Tracking methods
- Optimization recommendations

💪 **CREATIVE DIRECTION**
- Messaging themes
- Visual style suggestions
- Call-to-action recommendations

⚠️ **RISK MITIGATION**
- Potential challenges
- Contingency plans

Make the strategy specific, actionable, and tailored to their responses. Use emojis for sections. Format with clear headings and bullet points. Be comprehensive but easy to scan.

Important: This is the FINAL response. Do NOT ask any more questions. Provide the complete strategy.`;
        }

        // Generate AI response
        const aiResponse: string = await gemini.generateAIResponse(systemPrompt);

        // Determine if this is a question or final response
        const isQuestion = userMessageCount < 5;
        const isComplete = userMessageCount >= 5;

        const response: CampaignPlannerResponse = {
            success: true,
            response: aiResponse,
            isQuestion: isQuestion,
            isComplete: isComplete,
            stage: userMessageCount,
        };

        return Response.json(response);
    } catch (error) {
        console.error("Error in campaign-planner API:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return Response.json(
            {
                success: false,
                error: "Failed to generate response",
                details: errorMessage,
            },
            { status: 500 }
        );
    }
}
