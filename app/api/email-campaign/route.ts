import { NextRequest } from "next/server";
import { createCampaignScheduler } from "../../../lib/email/CampaignScheduler";
import { getAuthenticatedUser } from "../../../lib/get-auth-user";

// Type definitions for campaign actions
interface CampaignData {
    emails?: string[];
    campaignId?: string;
    prompt?: string;
    emailType?: string;
    availableVariables?: string[];
    [key: string]: unknown;
}

interface CampaignRequest {
    action: string;
    campaignData?: CampaignData;
}

interface CampaignResult {
    success: boolean;
    error?: string;
    [key: string]: unknown;
}

interface TemplateResult {
    success: boolean;
    subject?: string;
    content?: string;
    error?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        // Extract user information from authentication - supports both Google OAuth and email/password login
        const authResult = await getAuthenticatedUser(request);
        const userId = authResult.userId;

        if (!userId) {
            // Return unauthorized error instead of using a fallback userId
            console.error("❌ No authenticated user found for email-campaign POST request");
            return Response.json(
                { success: false, error: "Unauthorized - Please log in to manage campaigns" },
                { status: 401 }
            );
        }

        console.log("✅ Authenticated user for email-campaign:", userId);
        const campaignScheduler = createCampaignScheduler(userId);

        const { action, campaignData }: CampaignRequest = await request.json();

        switch (action) {
            case "start": {
                const startResult: CampaignResult = await campaignScheduler.startCampaign(campaignData);
                return Response.json(startResult);
            }

            case "stop": {
                const stopResult: CampaignResult = await campaignScheduler.stopCampaign();
                return Response.json(stopResult);
            }

            case "reset": {
                const resetResult: CampaignResult = await campaignScheduler.resetCampaign();
                return Response.json(resetResult);
            }

            case "status": {
                const statusResult: CampaignResult = await campaignScheduler.getCampaignStatus();
                return Response.json(statusResult);
            }

            case "updateEmails": {
                const updateResult: CampaignResult = await campaignScheduler.updateCampaignEmails(
                    campaignData?.emails
                );
                return Response.json(updateResult);
            }

            case "resume": {
                const resumeResult: CampaignResult = await campaignScheduler.resumeCampaign();
                return Response.json(resumeResult);
            }

            case "deleteAll": {
                const deleteAllResult: CampaignResult = await campaignScheduler.deleteAllCampaigns();
                return Response.json(deleteAllResult);
            }

            case "clearLogs": {
                const clearLogsResult: CampaignResult = await campaignScheduler.clearAllLogs();
                return Response.json(clearLogsResult);
            }

            case "clearAll": {
                const clearAllResult: CampaignResult = await campaignScheduler.clearAll();
                return Response.json(clearAllResult);
            }

            case "updateCampaignData": {
                const updateCampaignDataResult: CampaignResult =
                    await campaignScheduler.updateCampaignData(campaignData);
                return Response.json(updateCampaignDataResult);
            }

            case "completeCampaign": {
                // campaignData may be undefined if called without payload - handle gracefully
                const campaignIdToComplete = campaignData?.campaignId;
                if (!campaignIdToComplete) {
                    return Response.json(
                        { success: false, error: "campaignId is required for completeCampaign action" },
                        { status: 400 }
                    );
                }
                const completeCampaignResult = await campaignScheduler.storage.updateCampaignStatus(
                    campaignIdToComplete,
                    "completed",
                    { completedAt: new Date() }
                );
                return Response.json(completeCampaignResult);
            }

            case "generateTemplate": {
                try {
                    const {
                        prompt,
                        emailType = "marketing",
                        availableVariables = [],
                    } = campaignData || {};

                    if (!prompt || !prompt.trim()) {
                        return Response.json(
                            { success: false, error: "Prompt is required" },
                            { status: 400 }
                        );
                    }

                    console.log("Generating template with:", {
                        prompt,
                        emailType,
                        availableVariables,
                    });

                    // Import using default export for webpack compatibility
                    const geminiModule = await import("../../../utils/gemini.js");
                    const gemini = geminiModule.default || geminiModule;

                    const result: TemplateResult = await gemini.generateEmailTemplate(
                        prompt,
                        availableVariables,
                        emailType
                    );

                    if (result.success) {
                        return Response.json({
                            success: true,
                            template: {
                                subject: result.subject,
                                content: result.content,
                            },
                        });
                    } else {
                        return Response.json(
                            {
                                success: false,
                                error: result.error || "Failed to generate template",
                            },
                            { status: 500 }
                        );
                    }
                } catch (templateError) {
                    console.error("Template generation error:", templateError);
                    return Response.json(
                        {
                            success: false,
                            error: "Internal server error while generating template",
                        },
                        { status: 500 }
                    );
                }
            }

            default:
                return Response.json(
                    { success: false, error: "Invalid action" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Email campaign API error:", error);
        return Response.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest): Promise<Response> {
    try {
        // Extract user information from authentication - supports both Google OAuth and email/password login
        const authResult = await getAuthenticatedUser(request);
        const userId = authResult.userId;

        if (!userId) {
            // Return unauthorized error instead of using a fallback userId
            console.error("❌ No authenticated user found for email-campaign GET request");
            return Response.json(
                { success: false, error: "Unauthorized - Please log in to view campaign status" },
                { status: 401 }
            );
        }

        console.log("✅ Authenticated user for email-campaign GET:", userId);
        const campaignScheduler = createCampaignScheduler(userId);

        const statusResult = await campaignScheduler.getCampaignStatus();
        return Response.json(statusResult);
    } catch (error) {
        console.error("Email campaign status error:", error);
        return Response.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
