import axios from "axios";
import { parseStringPromise } from "xml2js";

export type StockItem = {
  id: string;
  guid?: string | null;
  name: string;
  closingBalance: number;
  closingValue: number;
  closingQuantity: number | null;
  baseUnits: string | null;
  alterId?: string | null;
  fetchedAt: string;
};

export class TallyUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TallyUnavailableError";
  }
}

const TALLY_ENDPOINT =
  process.env.TALLY_ENDPOINT ||
  process.env.NEXT_PUBLIC_TALLY_ENDPOINT ||
  "http://127.0.0.1:9000";
const COMPANY_NAME =
  process.env.TALLY_COMPANY_NAME ||
  process.env.COMPANY_NAME ||
  process.env.NEXT_PUBLIC_TALLY_COMPANY ||
  "";

function buildEnvelope() {
  if (!COMPANY_NAME) {
    throw new Error(
      "Missing TALLY_COMPANY_NAME (or COMPANY_NAME) environment variable."
    );
  }

  return `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Stock Item</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="StockItems" ISMODIFY="No">
            <TYPE>Stock Item</TYPE>
            <NATIVEMETHOD>GUID</NATIVEMETHOD>
            <NATIVEMETHOD>NAME</NATIVEMETHOD>
            <NATIVEMETHOD>CLOSINGBALANCE</NATIVEMETHOD>
            <NATIVEMETHOD>CLOSINGVALUE</NATIVEMETHOD>
            <NATIVEMETHOD>CLOSINGQTY</NATIVEMETHOD>
            <NATIVEMETHOD>BASEUNITS</NATIVEMETHOD>
            <NATIVEMETHOD>ALTERID</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`.trim();
}

function normalizeQuantity(rawValue?: string | null) {
  if (!rawValue) return { quantity: null, units: null };
  const [amount, ...rest] = rawValue.split(" ");
  const parsed = parseFloat(amount);
  return {
    quantity: Number.isNaN(parsed) ? null : parsed,
    units: rest.join(" ") || null,
  };
}

function transform(items: any[] = []): StockItem[] {
  return items.map((item) => {
    const guid = item.GUID?.[0] ?? null;
    const name = item.NAME?.[0] ?? "Unknown";
    const closingBalance = parseFloat(item.CLOSINGBALANCE?.[0]) || 0;
    const closingValue = parseFloat(item.CLOSINGVALUE?.[0]) || 0;
    const { quantity, units } = normalizeQuantity(item.CLOSINGQTY?.[0]);

    return {
      id: guid || name,
      guid,
      name,
      closingBalance,
      closingValue,
      closingQuantity: quantity,
      baseUnits: units || item.BASEUNITS?.[0] || null,
      alterId: item.ALTERID?.[0] || null,
      fetchedAt: new Date().toISOString(),
    };
  });
}

export async function fetchLiveStockItems() {
  const envelope = buildEnvelope();

  try {
    const { data } = await axios.post(TALLY_ENDPOINT, envelope, {
      headers: { "Content-Type": "text/xml" },
      timeout: 7_000,
    });

    const parsed = await parseStringPromise(data, { explicitArray: true });
    const collection =
      parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.STOCKITEM || [];

    const items = transform(collection);

    return {
      items,
      meta: {
        company: COMPANY_NAME,
        source: TALLY_ENDPOINT,
        fetchedAt: new Date().toISOString(),
        total: items.length,
      },
    };
  } catch (error: any) {
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw new TallyUnavailableError("TallyPrime endpoint is not reachable.");
    }

    throw new TallyUnavailableError(
      error?.message || "Unable to fetch data from TallyPrime."
    );
  }
}

