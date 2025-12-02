const path = require("path");
const dotenv = require("dotenv");
const cron = require("node-cron");
const { runSync } = require("./run-sync");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const CRON_EXPRESSION = process.env.TALLY_SYNC_CRON || "0 * * * *";

console.log(`[tally-scheduler] Using cron expression "${CRON_EXPRESSION}".`);

cron.schedule(
  CRON_EXPRESSION,
  () => {
    console.log("[tally-scheduler] Triggering sync...");
    runSync().catch((error) => {
      console.error("[tally-scheduler] Sync failed:", error.message);
    });
  },
  {
    scheduled: true,
  }
);

console.log("[tally-scheduler] Scheduler started. Press Ctrl+C to exit.");

