import dbConnect from "../../../../../lib/mongodb";
import EmailTracking from "../../../../../lib/models/EmailTracking";
import { addClient, removeClient } from "../../../../../lib/realtime/sse";

export const runtime = "nodejs";

interface SSEData {
    type: string;
    tracking?: unknown;
    t?: number;
}

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(
    _req: Request,
    context: RouteContext
): Promise<Response> {
    // Set up SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const send = async (data: SSEData): Promise<void> => {
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
            // Ignore write errors - client may have disconnected
        }
    };

    const params = await context.params;
    const trackingId = params.id;
    addClient(trackingId, writer);

    // Send initial snapshot
    try {
        await dbConnect();
        let doc = null;
        try {
            doc = await EmailTracking.findById(trackingId).lean();
        } catch {
            // Ignore find errors - try alternate method
        }
        if (!doc) {
            doc = await EmailTracking.findOne({ emailId: trackingId }).lean();
        }
        if (doc) {
            await send({ type: "snapshot", tracking: doc });
        }
    } catch {
        // Ignore initial snapshot errors
    }

    // Keepalive pings
    const ping = setInterval(async () => {
        await send({ type: "ping", t: Date.now() });
    }, 15000);

    const headers = new Headers({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    });

    // Close handling
    const close = async (): Promise<void> => {
        clearInterval(ping);
        removeClient(trackingId, writer);
        try {
            await writer.close();
        } catch {
            // Ignore close errors
        }
    };

    // Add abort listener if available
    if (_req.signal) {
        _req.signal.addEventListener("abort", () => {
            close();
        });
    }

    return new Response(readable, { headers });
}
