import { NextResponse } from "next/server";
import { fetchLiveStockItems, TallyUnavailableError } from "@/lib/tally/live-client";
import { findStockByName } from "@/lib/tally/mongo";

type ChatRequest = {
  message: string;
};

const UNSUPPORTED_RESPONSE =
  "I can currently help with inventory lookups. Try asking for stock availability, e.g. \"Do we have Blue Widgets in stock?\"";

function extractProductName(message: string) {
  if (!message) return null;

  const normalized = message.trim();
  const inventoryMatch = normalized.match(
    /(inventory|stock|qty|quantity|available)\s*(?:of|for)?\s*(.+)/i
  );

  if (inventoryMatch && inventoryMatch[2]) {
    return inventoryMatch[2].replace(/\?$/, "").trim();
  }

  // fallback: return message minus verbs like "show", "check"
  const sanitized = normalized
    .replace(/^(show|check|find|get)\s+/i, "")
    .replace(/(available|left|remaining)\??$/i, "")
    .trim();

  return sanitized.length > 0 ? sanitized : null;
}

function findLocalMatch(items: any[], productName: string) {
  const lower = productName.toLowerCase();
  return (
    items.find((item) => item.name.toLowerCase() === lower) ||
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    null
  );
}

function buildResponsePayload(item: any, source: "tally-live" | "mongodb-snapshot") {
  return {
    source,
    item: {
      name: item.name,
      closingQuantity: item.closingQuantity ?? null,
      baseUnits: item.baseUnits ?? null,
      closingBalance: item.closingBalance ?? null,
      closingValue: item.closingValue ?? null,
      lastUpdated: item.fetchedAt || item.syncedAt || item.updatedAt || null,
    },
  };
}

export async function POST(request: Request) {
  const { message }: Partial<ChatRequest> = await request.json();

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  const productName = extractProductName(message);

  if (!productName) {
    return NextResponse.json({
      reply: UNSUPPORTED_RESPONSE,
    });
  }

  try {
    const live = await fetchLiveStockItems();
    const liveMatch = findLocalMatch(live.items, productName);

    if (liveMatch) {
      return NextResponse.json({
        reply: `Live data: ${liveMatch.name} has ${
          liveMatch.closingQuantity ?? "an unknown number of"
        } ${liveMatch.baseUnits || ""} available.`,
        ...buildResponsePayload(liveMatch, "tally-live"),
      });
    }
  } catch (error) {
    if (!(error instanceof TallyUnavailableError)) {
      const message =
        error instanceof Error ? error.message : "Unknown server error.";
      console.error("Unexpected Tally error:", error);
      return NextResponse.json(
        { error: "Unable to query TallyPrime.", details: message },
        { status: 500 }
      );
    }
    // silent fallback below
  }

  const snapshot = await findStockByName(productName);

  if (snapshot) {
    return NextResponse.json({
      reply: `Tally server is offline. Showing last synced data: ${snapshot.name} has ${
        snapshot.closingQuantity ?? "an unknown number of"
      } ${snapshot.baseUnits || ""} available (synced at ${
        snapshot.syncedAt || snapshot.fetchedAt || "unknown time"
      }).`,
      ...buildResponsePayload(snapshot, "mongodb-snapshot"),
    });
  }

  return NextResponse.json({
    reply: `I couldn't find ${productName} in either live Tally data or the last MongoDB snapshot.`,
    item: null,
    source: null,
  });
}

