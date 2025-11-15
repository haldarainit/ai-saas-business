const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function checkDatabase() {
  console.log("🔍 Checking MongoDB database...");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI environment variable not found");
    return;
  }

  console.log("🔗 Connecting to:", uri.substring(0, 20) + "...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const campaigns = await db.collection("campaigns").find({}).toArray();

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
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

checkDatabase();
