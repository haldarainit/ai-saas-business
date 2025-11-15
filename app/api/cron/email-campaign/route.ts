import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import campaignScheduler, {
  createCampaignScheduler,
} from "@/lib/email/CampaignScheduler";

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token =
    url.searchParams.get("token") ||
    request.headers.get("x-cron-secret") ||
    request.headers.get("x-cronjob-token");

  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      {
        success: false,
        error:
          "CRON_SECRET env not set on server. Set it on Vercel project settings.",
      },
      { status: 500 }
    );
  }

  if (token !== expected) {
    return unauthorized("Invalid or missing token");
  }

  const runs = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("runs") || 1))
  );
  const userId = url.searchParams.get("userId");
  const all = url.searchParams.get("all") === "true";

  const result = {
    success: true,
    mode: all ? "all" : userId ? "user" : "default",
    runs,
    processedUsers: 0,
    ticksAttempted: 0,
  } as any;

  try {
    await dbConnect();

    if (userId) {
      const scheduler = createCampaignScheduler(userId);
      for (let i = 0; i < runs; i++) {
        await scheduler.processNextEmail();
        result.ticksAttempted++;
      }
      result.processedUsers = 1;
    } else if (all) {
      // Process one tick for each active campaign's user
      const active = await Campaign.find({ status: "active" }).select(
        "userId _id"
      );
      const userIds = Array.from(
        new Set(active.map((c: any) => c.userId || "__no_user__"))
      );

      for (const uid of userIds) {
        const scheduler =
          uid === "__no_user__"
            ? campaignScheduler
            : createCampaignScheduler(uid);
        for (let i = 0; i < runs; i++) {
          await scheduler.processNextEmail();
          result.ticksAttempted++;
        }
        result.processedUsers++;
      }
    } else {
      // Default: one instance tick (global/no-user campaign)
      for (let i = 0; i < runs; i++) {
        await campaignScheduler.processNextEmail();
        result.ticksAttempted++;
      }
      result.processedUsers = 1;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Cron execution failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs"; // Ensure Node runtime
export const dynamic = "force-dynamic"; // Avoid caching
