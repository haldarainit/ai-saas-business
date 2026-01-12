import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import CampaignEmailHistory from "@/lib/models/CampaignEmailHistory";
import CampaignStorage from "@/lib/email/CampaignStorage";
import { getAuthenticatedUser } from "@/lib/get-auth-user";

interface EmailHistoryQuery {
    userId: string;
    campaignId?: mongoose.Types.ObjectId;
    status?: string;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Extract user information from authentication - supports both Google OAuth and email/password login
        const authResult = await getAuthenticatedUser(request);
        const userId = authResult.userId;

        if (!userId) {
            // Return unauthorized error instead of using a fallback userId
            console.error("❌ No authenticated user found for email-history request");
            return NextResponse.json(
                { success: false, error: "Unauthorized - Please log in to view email history" },
                { status: 401 }
            );
        }

        console.log("✅ Authenticated user for email-history:", userId);

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const type = searchParams.get("type"); // 'campaigns' or 'logs' (default)
        const campaignId = searchParams.get("campaignId");

        // Initialize storage
        const storage = new CampaignStorage(userId);

        // Handle Campaign List Request
        if (type === "campaigns") {
            console.log("📧 Fetching campaigns for userId:", userId);

            const result = await storage.getCampaigns(limit, (page - 1) * limit, status || undefined);

            if (!result.success) {
                throw new Error(result.error);
            }

            return NextResponse.json({
                success: true,
                data: {
                    campaigns: result.data,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil((result.totalCount || 0) / limit),
                        totalCount: result.totalCount,
                        pageSize: limit,
                    },
                },
            });
        }

        // Handle Email Logs Request (Default)
        // Build query - filter by userId to show only user's emails
        const query: EmailHistoryQuery = { userId };

        if (campaignId) {
            // Convert campaignId string to ObjectId for proper MongoDB matching
            try {
                query.campaignId = new mongoose.Types.ObjectId(campaignId);
            } catch {
                console.error("Invalid campaignId format:", campaignId);
                return NextResponse.json(
                    { success: false, error: "Invalid campaign ID format" },
                    { status: 400 }
                );
            }
        }

        if (status && status !== "all") {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { recipientEmail: { $regex: search, $options: "i" } },
                { recipientName: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
            ];
        }

        console.log("📧 Fetching email history for userId:", userId);
        console.log("Query:", JSON.stringify(query));

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch email logs with pagination
        const [emailLogs, totalCount] = await Promise.all([
            CampaignEmailHistory.find(query)
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("campaignId", "subject status")
                .lean(),
            CampaignEmailHistory.countDocuments(query),
        ]);

        console.log(`📊 Found ${totalCount} total emails for user`);

        // Get statistics for this user's emails (filtered by campaign if provided)
        // Since we already have the query.campaignId as ObjectId, we can use it directly
        const statsMatch: { userId: string; campaignId?: mongoose.Types.ObjectId } = { userId };
        if (campaignId && query.campaignId) {
            statsMatch.campaignId = query.campaignId;
        }

        const stats = await CampaignEmailHistory.aggregate([
            { $match: statsMatch },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const statsMap = stats.reduce((acc: Record<string, number>, stat: { _id: string; count: number }) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            data: {
                emailLogs,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    pageSize: limit,
                },
                stats: {
                    total: totalCount,
                    pending: statsMap.pending || 0,
                    sent: statsMap.sent || 0,
                    failed: statsMap.failed || 0,
                    bounced: statsMap.bounced || 0,
                    opened: statsMap.opened || 0,
                    clicked: statsMap.clicked || 0,
                },
            },
        });
    } catch (error) {
        console.error("Email history API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
