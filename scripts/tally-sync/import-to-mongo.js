const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/tally_snapshot";
const DB_NAME = process.env.TALLY_DB_NAME || "tally_snapshot";
const STOCK_COLLECTION =
  process.env.TALLY_STOCK_COLLECTION || "stock_items";
const LEDGER_COLLECTION =
  process.env.TALLY_LEDGER_COLLECTION || "ledgers";
const VOUCHER_COLLECTION =
  process.env.TALLY_VOUCHER_COLLECTION || "vouchers";

const DATA_DIR = path.resolve(
  process.cwd(),
  "scripts",
  "tally-sync",
  "data_dumps"
);
const STOCK_ITEMS_FILE = path.join(DATA_DIR, "stock-items.json");
const LEDGERS_FILE = path.join(DATA_DIR, "ledgers.json");
const VOUCHERS_FILE = path.join(DATA_DIR, "vouchers.json");

async function readJsonIfExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(
      `[import-to-mongo] ${label} dump not found at ${path.relative(
        process.cwd(),
        filePath
      )}. Skipping.`
    );
    return null;
  }

  const raw = await fs.promises.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function importStockItems(db, items = []) {
  if (!items.length) {
    console.warn("[import-to-mongo] No stock items to import.");
    return;
  }

  const collection = db.collection(STOCK_COLLECTION);

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: {
        $set: {
          name: item.name,
          guid: item.guid,
          closingBalance: item.closingBalance,
          closingValue: item.closingValue,
          closingQuantity: item.closingQuantity,
          baseUnits: item.baseUnits,
          alterId: item.alterId,
          fetchedAt: item.fetchedAt,
          syncedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(bulkOps, {
    ordered: false,
  });

  console.log(
    `[import-to-mongo] Stock items: upserted ${result.upsertedCount}, modified ${result.modifiedCount}.`
  );
}

async function importLedgers(db, items = []) {
  if (!items.length) {
    console.warn("[import-to-mongo] No ledgers to import.");
    return;
  }

  const collection = db.collection(LEDGER_COLLECTION);

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: {
        $set: {
          name: item.name,
          guid: item.guid,
          parent: item.parent,
          isBillWiseOn: item.isBillWiseOn,
          fetchedAt: item.fetchedAt,
          syncedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(bulkOps, {
    ordered: false,
  });

  console.log(
    `[import-to-mongo] Ledgers: upserted ${result.upsertedCount}, modified ${result.modifiedCount}.`
  );
}

async function importVouchers(db, items = []) {
  if (!items.length) {
    console.warn("[import-to-mongo] No vouchers to import.");
    return;
  }

  const collection = db.collection(VOUCHER_COLLECTION);

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: {
        $set: {
          guid: item.guid,
          voucherNumber: item.voucherNumber,
          date: item.date,
          voucherTypeName: item.voucherTypeName,
          partyLedgerName: item.partyLedgerName,
          reference: item.reference,
          raw: item.raw,
          fetchedAt: item.fetchedAt,
          syncedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(bulkOps, {
    ordered: false,
  });

  console.log(
    `[import-to-mongo] Vouchers: upserted ${result.upsertedCount}, modified ${result.modifiedCount}.`
  );
}

async function runImport() {
  const [stockDump, ledgerDump, voucherDump] = await Promise.all([
    readJsonIfExists(STOCK_ITEMS_FILE, "Stock items"),
    readJsonIfExists(LEDGERS_FILE, "Ledgers"),
    readJsonIfExists(VOUCHERS_FILE, "Vouchers"),
  ]);

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    if (stockDump?.items?.length) {
      await importStockItems(db, stockDump.items);
    }

    if (ledgerDump?.items?.length) {
      await importLedgers(db, ledgerDump.items);
    }

    if (voucherDump?.items?.length) {
      await importVouchers(db, voucherDump.items);
    }
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  runImport().catch((error) => {
    console.error("[import-to-mongo] Failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  runImport,
  importStockItems,
  importLedgers,
  importVouchers,
};

