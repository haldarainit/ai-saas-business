import fs from "fs";
import path from "path";
import axios from "axios";
import { parseStringPromise } from "xml2js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const TALLY_ENDPOINT = process.env.TALLY_ENDPOINT || "http://127.0.0.1:9000";
const COMPANY_NAME =
    process.env.TALLY_COMPANY_NAME ||
    process.env.COMPANY_NAME ||
    "Company Name";
const DATA_DUMP_DIR = path.resolve(
    process.cwd(),
    "scripts",
    "tally-sync",
    "data_dumps"
);
const STOCK_ITEMS_FILE = path.join(DATA_DUMP_DIR, "stock-items.json");
const LEDGERS_FILE = path.join(DATA_DUMP_DIR, "ledgers.json");
const VOUCHERS_FILE = path.join(DATA_DUMP_DIR, "vouchers.json");

function ensureDumpDir() {
    if (!fs.existsSync(DATA_DUMP_DIR)) {
        fs.mkdirSync(DATA_DUMP_DIR, { recursive: true });
    }
}

function buildStockItemsEnvelope() {
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

function buildLedgersEnvelope() {
    return `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Ledger</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Ledgers" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <NATIVEMETHOD>GUID</NATIVEMETHOD>
            <NATIVEMETHOD>NAME</NATIVEMETHOD>
            <NATIVEMETHOD>PARENT</NATIVEMETHOD>
            <NATIVEMETHOD>ISBILLWISEON</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`.trim();
}

function buildVouchersEnvelope() {
    return `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Voucher</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Vouchers" ISMODIFY="No">
            <TYPE>Voucher</TYPE>
            <NATIVEMETHOD>GUID</NATIVEMETHOD>
            <NATIVEMETHOD>VOUCHERNUMBER</NATIVEMETHOD>
            <NATIVEMETHOD>DATE</NATIVEMETHOD>
            <NATIVEMETHOD>VOUCHERTYPENAME</NATIVEMETHOD>
            <NATIVEMETHOD>PARTYLEDGERNAME</NATIVEMETHOD>
            <NATIVEMETHOD>REFERENCE</NATIVEMETHOD>
            <NATIVEMETHOD>LEDGERENTRIES.LIST</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`.trim();
}

function normalizeQuantity(rawValue: string) {
    if (!rawValue) return { quantity: null, units: null };

    const parts = rawValue.split(" ");
    const quantity = parseFloat(parts[0]);
    const units = parts.slice(1).join(" ") || null;

    return {
        quantity: Number.isNaN(quantity) ? null : quantity,
        units,
    };
}

function transformStockItems(collection: any[]) {
    if (!Array.isArray(collection)) return [];

    return collection.map((item) => {
        const guid = item.GUID?.[0] || null;
        const name = item.NAME?.[0] || "Unknown";
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

function transformLedgers(collection: any[]) {
    if (!Array.isArray(collection)) return [];

    return collection.map((item) => {
        const guid = item.GUID?.[0] || null;
        const name = item.NAME?.[0] || "Unknown";
        const parent = item.PARENT?.[0] || null;
        const isBillWiseOn = item.ISBILLWISEON?.[0] === "Yes";

        return {
            id: guid || name,
            guid,
            name,
            parent,
            isBillWiseOn,
            fetchedAt: new Date().toISOString(),
        };
    });
}

function transformVouchers(collection: any[]) {
    if (!Array.isArray(collection)) return [];

    return collection.map((item) => {
        const guid = item.GUID?.[0] || null;
        const voucherNumber = item.VOUCHERNUMBER?.[0] || null;
        const date = item.DATE?.[0] || null;
        const typeName = item.VOUCHERTYPENAME?.[0] || null;
        const partyLedgerName = item.PARTYLEDGERNAME?.[0] || null;
        const reference = item.REFERENCE?.[0] || null;

        return {
            id: guid || `${typeName || "Voucher"}-${voucherNumber || ""}-${date || ""}`,
            guid,
            voucherNumber,
            date,
            voucherTypeName: typeName,
            partyLedgerName,
            reference,
            raw: item,
            fetchedAt: new Date().toISOString(),
        };
    });
}

async function fetchStockItems() {
    const xmlBody = buildStockItemsEnvelope();

    const { data } = await axios.post(TALLY_ENDPOINT, xmlBody, {
        headers: { "Content-Type": "text/xml" },
        timeout: 10_000,
    });

    const parsed = await parseStringPromise(data, { explicitArray: true });
    const dataNode = parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0];
    const collection = dataNode?.COLLECTION?.[0]?.STOCKITEM || [];

    if (!collection.length) {
        const debugPath = path.join(DATA_DUMP_DIR, "stock-items-debug.json");
        await fs.promises.writeFile(
            debugPath,
            JSON.stringify(dataNode || parsed, null, 2),
            "utf-8"
        );
        console.warn(
            `No STOCKITEM entries found in Tally response. Debug written to ${path.relative(
                process.cwd(),
                debugPath
            )}`
        );
    }

    return transformStockItems(collection);
}

async function fetchLedgers() {
    const xmlBody = buildLedgersEnvelope();

    const { data } = await axios.post(TALLY_ENDPOINT, xmlBody, {
        headers: { "Content-Type": "text/xml" },
        timeout: 10_000,
    });

    const parsed = await parseStringPromise(data, { explicitArray: true });
    const dataNode = parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0];
    const collection = dataNode?.COLLECTION?.[0]?.LEDGER || [];

    if (!collection.length) {
        const debugPath = path.join(DATA_DUMP_DIR, "ledgers-debug.json");
        await fs.promises.writeFile(
            debugPath,
            JSON.stringify(dataNode || parsed, null, 2),
            "utf-8"
        );
        console.warn(
            `No LEDGER entries found in Tally response. Debug written to ${path.relative(
                process.cwd(),
                debugPath
            )}`
        );
    }

    return transformLedgers(collection);
}

async function fetchVouchers() {
    const xmlBody = buildVouchersEnvelope();

    const { data } = await axios.post(TALLY_ENDPOINT, xmlBody, {
        headers: { "Content-Type": "text/xml" },
        timeout: 30_000,
    });

    const parsed = await parseStringPromise(data, { explicitArray: true });
    const dataNode = parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0];
    const collection = dataNode?.COLLECTION?.[0]?.VOUCHER || [];

    if (!collection.length) {
        const debugPath = path.join(DATA_DUMP_DIR, "vouchers-debug.json");
        await fs.promises.writeFile(
            debugPath,
            JSON.stringify(dataNode || parsed, null, 2),
            "utf-8"
        );
        console.warn(
            `No VOUCHER entries found in Tally response. Debug written to ${path.relative(
                process.cwd(),
                debugPath
            )}`
        );
    }

    return transformVouchers(collection);
}

async function runExport() {
    if (!COMPANY_NAME) {
        throw new Error(
            "COMPANY_NAME or TALLY_COMPANY_NAME must be defined in the environment."
        );
    }

    ensureDumpDir();

    const [stockItems, ledgers, vouchers] = await Promise.all([
        fetchStockItems(),
        fetchLedgers(),
        fetchVouchers(),
    ]);

    const exportedAt = new Date().toISOString();

    const stockPayload = {
        meta: {
            company: COMPANY_NAME,
            source: TALLY_ENDPOINT,
            exportedAt,
            total: stockItems.length,
        },
        items: stockItems,
    };

    const ledgerPayload = {
        meta: {
            company: COMPANY_NAME,
            source: TALLY_ENDPOINT,
            exportedAt,
            total: ledgers.length,
        },
        items: ledgers,
    };

    const voucherPayload = {
        meta: {
            company: COMPANY_NAME,
            source: TALLY_ENDPOINT,
            exportedAt,
            total: vouchers.length,
        },
        items: vouchers,
    };

    await Promise.all([
        fs.promises.writeFile(
            STOCK_ITEMS_FILE,
            JSON.stringify(stockPayload, null, 2),
            "utf-8"
        ),
        fs.promises.writeFile(
            LEDGERS_FILE,
            JSON.stringify(ledgerPayload, null, 2),
            "utf-8"
        ),
        fs.promises.writeFile(
            VOUCHERS_FILE,
            JSON.stringify(voucherPayload, null, 2),
            "utf-8"
        ),
    ]);

    console.log(
        `Exported ${stockItems.length} stock items, ${ledgers.length} ledgers, and ${vouchers.length} vouchers to ${path.relative(
            process.cwd(),
            DATA_DUMP_DIR
        )}`
    );

    return {
        stockItems,
        ledgers,
        vouchers,
    };
}

// if (require.main === module) {
//   runExport().catch((error) => {
//     console.error("[tally-export] Failed:", error.message);
//     process.exitCode = 1;
//   });
// }

export {
    runExport,
};
