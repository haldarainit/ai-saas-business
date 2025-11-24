import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb.ts";
import EmailTracking from "@/lib/models/EmailTracking";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const { trackingId } = await request.json();

    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create a test tracking record
    const testRecord = await EmailTracking.create({
      campaignId: new mongoose.Types.ObjectId(),
      emailId: trackingId,
      recipientEmail: "test@example.com",
      userId: "test-user",
      emailSubject: "Test Email",
      status: "sent",
      sentAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Test tracking record created",
      record: {
        id: testRecord._id,
        emailId: testRecord.emailId,
        trackingUrl: `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/track/pixel/${trackingId}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
