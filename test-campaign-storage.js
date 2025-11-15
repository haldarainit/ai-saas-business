/**
 * Test Script for MongoDB Campaign Storage
 *
 * This script tests the complete flow of:
 * 1. CSV upload and parsing
 * 2. Campaign creation with recipients
 * 3. Data persistence to MongoDB
 * 4. Data retrieval and validation
 *
 * Run with: node test-campaign-storage.js
 */

import dbConnect from "../lib/mongodb";
import CampaignStorage from "../lib/email/CampaignStorage";
import { createCampaignScheduler } from "../lib/email/CampaignScheduler";

async function testCampaignStorage() {
  console.log("🧪 Starting Campaign Storage Test...");

  try {
    // Test 1: Database Connection
    console.log("\n1️⃣ Testing database connection...");
    await dbConnect();
    console.log("✅ Database connected successfully");

    // Test 2: Create CampaignStorage instance
    console.log("\n2️⃣ Testing CampaignStorage instance...");
    const testUserId = "test-user-123";
    const storage = new CampaignStorage(testUserId);
    console.log("✅ CampaignStorage instance created");

    // Test 3: Simulate CSV data
    console.log("\n3️⃣ Creating test CSV data...");
    const testEmails = [
      "john@example.com",
      "jane@example.com",
      "bob@example.com",
    ];
    const testCsvData = {
      headers: ["email", "name", "company"],
      data: [
        { email: "john@example.com", name: "John Doe", company: "Tech Corp" },
        {
          email: "jane@example.com",
          name: "Jane Smith",
          company: "Design Inc",
        },
        { email: "bob@example.com", name: "Bob Wilson", company: "Sales LLC" },
      ],
      totalRows: 3,
    };
    const testEnabledColumns = ["name", "company"];
    console.log("✅ Test CSV data created:", testCsvData);

    // Test 4: Create campaign with CSV data
    console.log("\n4️⃣ Testing campaign creation...");
    const testCampaignData = {
      subject: "Test Campaign with CSV Data",
      template: "Hello {{name}} from {{company}}! This is a test email.",
      recipients: testEmails.map((email) => {
        const csvRow = testCsvData.data.find(
          (row) => row.email.toLowerCase() === email.toLowerCase()
        );
        return {
          email,
          name: csvRow?.name || "",
          sent: false,
        };
      }),
      status: "draft",
      totalEmails: testEmails.length,
      sentCount: 0,
      failedCount: 0,
      currentIndex: 0,
      csvData: testCsvData,
      enabledColumns: testEnabledColumns,
      settings: {
        batchSize: 10,
        delay: 6000,
        maxRetries: 3,
      },
    };

    const saveResult = await storage.saveCampaign(testCampaignData);
    if (!saveResult.success) {
      throw new Error(`Failed to save campaign: ${saveResult.error}`);
    }
    console.log("✅ Campaign saved successfully:", saveResult.data._id);

    // Test 5: Retrieve campaign and validate data
    console.log("\n5️⃣ Testing campaign retrieval...");
    const campaignId = saveResult.data._id;
    const loadResult = await storage.getCampaignById(campaignId);

    if (!loadResult.success) {
      throw new Error(`Failed to load campaign: ${loadResult.error}`);
    }

    const loadedCampaign = loadResult.data;
    console.log("✅ Campaign loaded successfully");
    console.log("📄 Campaign details:");
    console.log("  - ID:", loadedCampaign._id);
    console.log("  - Subject:", loadedCampaign.subject);
    console.log(
      "  - Recipients count:",
      loadedCampaign.recipients?.length || 0
    );
    console.log("  - Has CSV data:", !!loadedCampaign.csvData);
    console.log(
      "  - CSV data size:",
      loadedCampaign.csvData?.data?.length || 0
    );
    console.log("  - Enabled columns:", loadedCampaign.enabledColumns);
    console.log("  - Recipients:", loadedCampaign.recipients);

    // Test 6: Validate CSV data integrity
    console.log("\n6️⃣ Validating CSV data integrity...");
    if (!loadedCampaign.csvData) {
      throw new Error("CSV data not saved to database");
    }

    if (loadedCampaign.csvData.data.length !== testCsvData.data.length) {
      throw new Error(
        `CSV data length mismatch: expected ${testCsvData.data.length}, got ${loadedCampaign.csvData.data.length}`
      );
    }

    if (
      JSON.stringify(loadedCampaign.enabledColumns) !==
      JSON.stringify(testEnabledColumns)
    ) {
      throw new Error(
        `Enabled columns mismatch: expected ${JSON.stringify(
          testEnabledColumns
        )}, got ${JSON.stringify(loadedCampaign.enabledColumns)}`
      );
    }

    console.log("✅ CSV data integrity validated");

    // Test 7: Test CampaignScheduler integration
    console.log("\n7️⃣ Testing CampaignScheduler integration...");
    const scheduler = createCampaignScheduler(testUserId);

    const campaignData = {
      emails: testEmails,
      subject: "Test Campaign via Scheduler",
      content: "Hello {{name}} from {{company}}!",
      csvData: testCsvData,
      enabledColumns: testEnabledColumns,
    };

    const startResult = await scheduler.startCampaign(campaignData);
    if (!startResult.success) {
      throw new Error(
        `Failed to start campaign via scheduler: ${startResult.error}`
      );
    }
    console.log("✅ Campaign started via scheduler:", startResult.campaignId);

    // Test 8: Test delete functions
    console.log("\n8️⃣ Testing delete functions...");

    // Delete specific campaign
    const deleteResult = await storage.deleteCampaign(campaignId);
    if (!deleteResult.success) {
      throw new Error(`Failed to delete campaign: ${deleteResult.error}`);
    }
    console.log("✅ Specific campaign deleted");

    // Delete all campaigns for user
    const deleteAllResult = await storage.deleteAllCampaigns();
    if (!deleteAllResult.success) {
      throw new Error(
        `Failed to delete all campaigns: ${deleteAllResult.error}`
      );
    }
    console.log("✅ All campaigns deleted:", deleteAllResult.deletedCount);

    // Clear all logs
    const clearLogsResult = await storage.clearAllLogs();
    if (!clearLogsResult.success) {
      throw new Error(`Failed to clear logs: ${clearLogsResult.error}`);
    }
    console.log("✅ All logs cleared:", clearLogsResult.deletedCount);

    console.log("\n🎉 All tests passed successfully!");

    return {
      success: true,
      message: "All campaign storage tests completed successfully",
      testsRun: 8,
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);

    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCampaignStorage()
    .then((result) => {
      console.log("\n📋 Test Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("\n💥 Script error:", error);
      process.exit(1);
    });
}

export default testCampaignStorage;
