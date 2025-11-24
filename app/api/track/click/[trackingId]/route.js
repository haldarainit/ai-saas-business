import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb.ts";
import EmailTracking from "@/lib/models/EmailTracking";
import {
  isValidTrackingId,
  createTrackingDataFromRequest,
} from "@/lib/tracking-utils";

export async function GET(request, { params }) {
  try {
    const { trackingId } = await params;
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get("url");

    // Validate inputs
    if (!trackingId || !isValidTrackingId(trackingId)) {
      return NextResponse.json(
        { error: "Invalid tracking ID" },
        { status: 400 }
      );
    }

    if (!originalUrl) {
      return NextResponse.json(
        { error: "Missing destination URL" },
        { status: 400 }
      );
    }

    // Decode the original URL
    const decodedUrl = decodeURIComponent(originalUrl);

    // Connect to database
    await connectDB();

    // Find tracking record
    const tracking = await EmailTracking.findOne({ emailId: trackingId });

    if (tracking) {
      // Extract tracking data from request
      const trackingData = await createTrackingDataFromRequest(request);
      trackingData.url = decodedUrl;

      // Record the click event
      await tracking.recordClick(trackingData);

      console.log(
        `Link clicked - Tracking ID: ${trackingId}, URL: ${decodedUrl}, Recipient: ${tracking.recipientEmail}`
      );
    } else {
      console.log(`Tracking record not found for ID: ${trackingId}`);
    }

    // Redirect to the original URL
    return NextResponse.redirect(decodedUrl);
  } catch (error) {
    console.error("Error tracking link click:", error);

    // Try to redirect anyway if we have the URL
    const { searchParams } = new URL(request.url);
    const originalUrl = searchParams.get("url");

    if (originalUrl) {
      try {
        const decodedUrl = decodeURIComponent(originalUrl);
        return NextResponse.redirect(decodedUrl);
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid redirect URL" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error processing click tracking" },
      { status: 500 }
    );
  }
}
