import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb.ts";
import EmailTracking from "@/lib/models/EmailTracking";
import {
  generateTransparentPixel,
  isValidTrackingId,
  createTrackingDataFromRequest,
} from "@/lib/tracking-utils";

export async function GET(request, { params }) {
  try {
    const { trackingId } = await params;

    console.log("=== Tracking Pixel Request ===");
    console.log("Tracking ID:", trackingId);

    // Validate tracking ID
    if (!trackingId || !isValidTrackingId(trackingId)) {
      console.log("Invalid tracking ID format");
      // Still return pixel even for invalid ID to not break email display
      const pixel = generateTransparentPixel();
      return new NextResponse(pixel, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // Connect to database
    await connectDB();
    console.log("Database connected");

    // Find tracking record by emailId (which stores the trackingId)
    const tracking = await EmailTracking.findOne({ emailId: trackingId });
    console.log("Tracking record found:", tracking ? "YES" : "NO");

    if (tracking) {
      console.log("Recipient:", tracking.recipientEmail);

      // Extract tracking data from request
      const trackingData = await createTrackingDataFromRequest(request);
      console.log("Tracking data:", trackingData);

      // Record the open event
      await tracking.recordOpen(trackingData);

      console.log(
        `✅ Email opened - Tracking ID: ${trackingId}, Recipient: ${tracking.recipientEmail}`
      );
    } else {
      console.log(`❌ Tracking record not found for ID: ${trackingId}`);
      console.log("Searching for any records...");
      const count = await EmailTracking.countDocuments();
      console.log(`Total tracking records in DB: ${count}`);
    }

    // Always return the transparent pixel
    const pixel = generateTransparentPixel();
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error tracking email open:", error);

    // Still return pixel even on error
    const pixel = generateTransparentPixel();
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
