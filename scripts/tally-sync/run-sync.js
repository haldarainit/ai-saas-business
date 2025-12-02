const { runExport } = require("./tally-export");
const { runImport } = require("./import-to-mongo");

async function runSync() {
  console.log("[tally-sync] Starting export...");
  await runExport();

  console.log("[tally-sync] Importing into MongoDB...");
  await runImport();

  console.log("[tally-sync] Completed successfully.");
}

if (require.main === module) {
  runSync().catch((error) => {
    console.error("[tally-sync] Failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  runSync,
};

