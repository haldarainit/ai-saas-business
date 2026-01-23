import dbConnect from "@/lib/mongodb";
import EmailTracking from "@/lib/models/EmailTracking";
import { addClient, removeClient } from "@/lib/realtime/sse";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    // Set up SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const send = async (data: any) => {
        try {
            await writer.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (_) { }
    };

    const trackingId = params.id;
    addClient(trackingId, writer);

    // Send initial snapshot
    try {
        await dbConnect();
        let doc = null;
        try {
            doc = await EmailTracking.findById(trackingId).lean();
        } catch (_) { }
        if (!doc) {
            doc = await EmailTracking.findOne({ emailId: trackingId }).lean();
        }
        if (doc) {
            await send({ type: "snapshot", tracking: doc });
        }
    } catch (_) { }

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
    const close = async () => {
        clearInterval(ping);
        removeClient(trackingId, writer);
        try {
            await writer.close();
        } catch (_) { }
    };

    // There is no direct close event on Request; rely on GC
    // The runtime will clean up when client disconnects; we also rely on ping failures upstream

    return new Response(readable, { headers });
}
