// Test script to verify CSV data storage in MongoDB
import dbConnect from "./lib/mongodb.ts";
import Campaign from "./lib/models/Campaign.js";

async function testCsvStorage() {
  console.log("🔍 Testing CSV data storage...");

  try {
    await dbConnect();
    console.log("✅ Connected to MongoDB");

    // Find all campaigns
    const campaigns = await Campaign.find({});
    console.log(`📊 Found ${campaigns.length} campaigns in database`);

    campaigns.forEach((campaign, index) => {
      console.log(`\nCampaign ${index + 1}:`);
      console.log("- Subject:", campaign.subject);
      console.log("- Recipients count:", campaign.recipients?.length || 0);
      console.log("- Has CSV Data:", !!campaign.csvData);

      if (campaign.csvData) {
        console.log("- CSV Headers:", campaign.csvData.headers || []);
        console.log("- CSV Rows:", campaign.csvData.data?.length || 0);
        console.log("- Total Rows:", campaign.csvData.totalRows || 0);
        console.log("- Sample Data:", campaign.csvData.data?.[0] || "No data");
      }

      console.log("- Enabled Columns:", campaign.enabledColumns || []);
      console.log("- Status:", campaign.status);
      console.log("- Created:", campaign.createdAt);
      console.log("- Updated:", campaign.updatedAt);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

testCsvStorage();
