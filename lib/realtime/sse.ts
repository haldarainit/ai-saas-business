// Simple in-memory SSE hub (best-effort; not multi-instance safe)

interface SSEHub extends Map<string, Set<WritableStreamDefaultWriter<string>>> { }

declare global {
    // eslint-disable-next-line no-var
    var __EMAIL_SSE_HUB__: SSEHub | undefined;
}

const GLOBAL_KEY = "__EMAIL_SSE_HUB__" as const;

function getHub(): SSEHub {
    if (!globalThis[GLOBAL_KEY]) {
        globalThis[GLOBAL_KEY] = new Map<string, Set<WritableStreamDefaultWriter<string>>>();
    }
    return globalThis[GLOBAL_KEY] as SSEHub;
}

export function addClient(trackingId: string, writer: WritableStreamDefaultWriter<string>): void {
    const hub = getHub();
    if (!hub.has(trackingId)) hub.set(trackingId, new Set());
    hub.get(trackingId)!.add(writer);
}

export function removeClient(trackingId: string, writer: WritableStreamDefaultWriter<string>): void {
    const hub = getHub();
    const set = hub.get(trackingId);
    if (set) {
        try {
            set.delete(writer);
        } catch (_) {
            // Ignore errors when deleting
        }
        if (set.size === 0) hub.delete(trackingId);
    }
}

export async function broadcast(trackingId: string, data: unknown): Promise<void> {
    const hub = getHub();
    const set = hub.get(trackingId);
    if (!set || set.size === 0) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const dead: WritableStreamDefaultWriter<string>[] = [];

    for (const writer of set) {
        try {
            await writer.write(payload);
        } catch (_) {
            dead.push(writer);
        }
    }

    // Cleanup dead writers
    for (const w of dead) {
        removeClient(trackingId, w);
    }
}
