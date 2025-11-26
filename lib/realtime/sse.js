// Simple in-memory SSE hub (best-effort; not multi-instance safe)

const GLOBAL_KEY = "__EMAIL_SSE_HUB__";

function getHub() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = new Map(); // Map<trackingId, Set<WritableStreamDefaultWriter>>
  }
  return globalThis[GLOBAL_KEY];
}

export function addClient(trackingId, writer) {
  const hub = getHub();
  if (!hub.has(trackingId)) hub.set(trackingId, new Set());
  hub.get(trackingId).add(writer);
}

export function removeClient(trackingId, writer) {
  const hub = getHub();
  const set = hub.get(trackingId);
  if (set) {
    try {
      set.delete(writer);
    } catch (_) {}
    if (set.size === 0) hub.delete(trackingId);
  }
}

export async function broadcast(trackingId, data) {
  const hub = getHub();
  const set = hub.get(trackingId);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const dead = [];
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
