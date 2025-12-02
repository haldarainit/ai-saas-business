import { MongoClient, Collection } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/business-ai";
const DB_NAME = process.env.TALLY_DB_NAME || "tally_snapshot";
const STOCK_COLLECTION =
  process.env.TALLY_STOCK_COLLECTION || "stock_items";

type CachedMongo = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalWithMongo = global as typeof global & {
  __tallyMongo?: CachedMongo;
};

if (!globalWithMongo.__tallyMongo) {
  globalWithMongo.__tallyMongo = { client: null, promise: null };
}

async function getClient() {
  const cache = globalWithMongo.__tallyMongo!;

  if (cache.client) return cache.client;

  if (!cache.promise) {
    cache.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      cache.client = client;
      return client;
    });
  }

  return cache.promise;
}

export async function getStockCollection(): Promise<Collection> {
  const client = await getClient();
  return client.db(DB_NAME).collection(STOCK_COLLECTION);
}

export async function findStockByName(query: string) {
  if (!query) return null;

  const collection = await getStockCollection();
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  return collection.findOne(
    {
      $or: [{ name: regex }, { aliases: regex }],
    },
    {
      projection: {
        name: 1,
        closingQuantity: 1,
        closingBalance: 1,
        closingValue: 1,
        baseUnits: 1,
        syncedAt: 1,
        fetchedAt: 1,
      },
    }
  );
}

