import { runExport } from "./tally-export";
import { runImport } from "./import-to-mongo";

export async function runSync() {
    console.log("[tally-sync] Starting export...");
    await runExport();

    console.log("[tally-sync] Importing into MongoDB...");
    await runImport();

    console.log("[tally-sync] Completed successfully.");
}

// if (require.main === module) {
//   runSync().catch((error) => {
//     console.error("[tally-sync] Failed:", error.message);
//     process.exitCode = 1;
//   });
// }
