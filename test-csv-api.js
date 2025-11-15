// Test CSV data saving to MongoDB
async function testCsvDataSaving() {
  console.log("🧪 Testing CSV data saving...");

  const testCsvData = {
    headers: ["email", "name", "company"],
    data: [
      { email: "john@test.com", name: "John Smith", company: "Acme Corp" },
      { email: "jane@test.com", name: "Jane Doe", company: "Tech Solutions" },
      {
        email: "bob@test.com",
        name: "Bob Johnson",
        company: "Creative Agency",
      },
    ],
    totalRows: 3,
  };

  const testCampaignData = {
    emails: ["john@test.com", "jane@test.com", "bob@test.com"],
    subject: "Test Campaign with CSV Data",
    content:
      "<p>Hello {{name}} from {{company}}!</p><p>This is a test email.</p>",
    csvData: testCsvData,
    enabledColumns: ["name", "company"],
  };

  try {
    // Test saving campaign data
    console.log("📤 Sending test data to API...");
    const response = await fetch("http://localhost:3000/api/email-campaign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "updateCampaignData",
        campaignData: testCampaignData,
      }),
    });

    const result = await response.json();
    console.log("📥 API Response:", result);

    if (result.success) {
      console.log("✅ CSV data saved successfully!");
      console.log("📄 Campaign ID:", result.campaignId);
    } else {
      console.log("❌ Failed to save CSV data:", result.error);
    }

    // Test retrieving the data
    console.log("\n🔍 Checking saved data...");
    const statusResponse = await fetch(
      "http://localhost:3000/api/email-campaign"
    );
    const statusResult = await statusResponse.json();

    console.log("📊 Campaign Status:", statusResult);

    if (statusResult.success && statusResult.data?.campaign) {
      const campaign = statusResult.data.campaign;
      console.log("✅ Campaign retrieved successfully!");
      console.log("📋 Subject:", campaign.subject);
      console.log("👥 Recipients:", campaign.recipients?.length || 0);
      console.log("📊 Has CSV Data:", !!campaign.csvData);

      if (campaign.csvData) {
        console.log("📊 CSV Headers:", campaign.csvData.headers);
        console.log("📊 CSV Rows:", campaign.csvData.data?.length || 0);
        console.log("📊 Sample Row:", campaign.csvData.data?.[0]);
      }

      console.log("🎯 Enabled Columns:", campaign.enabledColumns);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testCsvDataSaving();
