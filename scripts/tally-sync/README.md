## Tally → Mongo snapshot sync

This utility keeps a MongoDB collection populated with the latest snapshot of your TallyPrime data, and provides helpers for running the sync manually or on a schedule.

### Files

- `tally-export.js` – calls the TallyPrime HTTP/XML interface and saves structured JSON into `data_dumps/`:
  - `stock-items.json` – inventory items
  - `ledgers.json` – ledgers / parties
  - `vouchers.json` – vouchers (all types)
- `import-to-mongo.js` – ingests the exported JSON and upserts records into MongoDB collections:
  - `stock_items`
  - `ledgers`
  - `vouchers`
- `run-sync.js` – convenience runner that executes export → import as a single step.
- `scheduler.js` – optional cron-style runner (powered by `node-cron`); respects `TALLY_SYNC_CRON`.
- `.env.example` – sample environment variables you can copy to your project-level `.env`.

### Usage

1. Copy `.env.example` to your root `.env` (or merge the keys with any existing file) and fill in:
   - `TALLY_ENDPOINT` – e.g. `http://127.0.0.1:9000`
   - `TALLY_COMPANY_NAME` – exact company name loaded in TallyPrime
   - `MONGODB_URI` / `TALLY_DB_NAME` – where snapshots should be stored
2. Make sure TallyPrime is running with HTTP Server enabled and the company is loaded.
3. Run `npm run tally:sync` to export stock items and import them into MongoDB.
4. (Optional) Run `npm run tally:schedule` to keep data fresh based on the cron expression.

The chatbot API uses the `stock_items` collection produced by these scripts, automatically falling back to MongoDB when the live Tally endpoint is unavailable.***

