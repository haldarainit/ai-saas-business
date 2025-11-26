import dbConnect from "../../../lib/mongodb";
import EmailTracking from "../../../lib/models/EmailTracking";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("trackingId");
  const action = searchParams.get("action"); // 'view', 'test-open', 'test-click'

  try {
    await dbConnect();

    // Action: Test opening (simulate loading the pixel)
    if (action === "test-open" && trackingId) {
      let tracked = null;
      try {
        tracked = await EmailTracking.findById(trackingId);
      } catch (_e) {}

      if (!tracked) {
        tracked = await EmailTracking.findOne({ emailId: trackingId });
      }

      if (tracked) {
        await tracked.recordOpen({
          ipAddress: "127.0.0.1",
          userAgent: "Debug Test",
          device: { type: "desktop", browser: "test", os: "test" },
        });

        return Response.json({
          success: true,
          message: "Open recorded successfully",
          data: {
            trackingId: tracked._id.toString(),
            totalOpens: tracked.totalOpens,
            firstOpenedAt: tracked.firstOpenedAt,
            lastOpenedAt: tracked.lastOpenedAt,
            status: tracked.status,
          },
        });
      }

      return Response.json(
        { success: false, error: "Tracking record not found" },
        { status: 404 }
      );
    }

    // Action: Test click
    if (action === "test-click" && trackingId) {
      let tracked = null;
      try {
        tracked = await EmailTracking.findById(trackingId);
      } catch (_e) {}

      if (!tracked) {
        tracked = await EmailTracking.findOne({ emailId: trackingId });
      }

      if (tracked) {
        await tracked.recordClick({
          url: "https://example.com/test",
          ipAddress: "127.0.0.1",
          userAgent: "Debug Test",
          device: { type: "desktop", browser: "test", os: "test" },
        });

        return Response.json({
          success: true,
          message: "Click recorded successfully",
          data: {
            trackingId: tracked._id.toString(),
            totalClicks: tracked.totalClicks,
            status: tracked.status,
          },
        });
      }

      return Response.json(
        { success: false, error: "Tracking record not found" },
        { status: 404 }
      );
    }

    // Action: View tracking details
    if (action === "view" && trackingId) {
      let tracked = null;
      try {
        tracked = await EmailTracking.findById(trackingId);
      } catch (_e) {}

      if (!tracked) {
        tracked = await EmailTracking.findOne({ emailId: trackingId });
      }

      if (tracked) {
        return Response.json({
          success: true,
          data: tracked,
        });
      }

      return Response.json(
        { success: false, error: "Tracking record not found" },
        { status: 404 }
      );
    }

    // Default: List all tracking records
    const allTracking = await EmailTracking.find()
      .sort({ sentAt: -1 })
      .limit(20)
      .lean();

    return Response.json({
      success: true,
      count: allTracking.length,
      data: allTracking,
      instructions: {
        viewTracking: "/api/debug-tracking?action=view&trackingId=YOUR_ID",
        testOpen: "/api/debug-tracking?action=test-open&trackingId=YOUR_ID",
        testClick: "/api/debug-tracking?action=test-click&trackingId=YOUR_ID",
      },
    });
  } catch (error) {
    console.error("Debug tracking error:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

// HTML interface for easier debugging
export async function POST(request) {
  try {
    const { action, trackingId } = await request.json();

    await dbConnect();

    if (action === "simulate-open" && trackingId) {
      const tracked = await EmailTracking.findById(trackingId);
      if (!tracked) {
        return Response.json(
          { success: false, error: "Tracking record not found" },
          { status: 404 }
        );
      }

      await tracked.recordOpen({
        ipAddress: "127.0.0.1",
        userAgent: "Manual Test",
        device: { type: "desktop", browser: "test", os: "windows" },
      });

      return Response.json({
        success: true,
        message: "Open event recorded",
        data: {
          trackingId: tracked._id.toString(),
          totalOpens: tracked.totalOpens,
          status: tracked.status,
        },
      });
    }

    if (action === "simulate-click" && trackingId) {
      const tracked = await EmailTracking.findById(trackingId);
      if (!tracked) {
        return Response.json(
          { success: false, error: "Tracking record not found" },
          { status: 404 }
        );
      }

      await tracked.recordClick({
        url: "https://example.com/manual-test",
        ipAddress: "127.0.0.1",
        userAgent: "Manual Test",
        device: { type: "desktop", browser: "test", os: "windows" },
      });

      return Response.json({
        success: true,
        message: "Click event recorded",
        data: {
          trackingId: tracked._id.toString(),
          totalClicks: tracked.totalClicks,
          status: tracked.status,
        },
      });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Debug tracking POST error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
