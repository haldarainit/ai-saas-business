/**
 * Test Script for Web Scraper API
 * Run this to test the scraper functionality
 *
 * Usage: node test-scraper.ts
 */

const testScraper = async () => {
    console.log("🧪 Testing Web Scraper API...\n");

    const testUrls = [
        "https://www.stripe.com",
        "https://www.shopify.com",
        "https://www.notion.so",
    ];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    for (const url of testUrls) {
        console.log(`📄 Testing URL: ${url}`);
        console.log("─".repeat(60));

        try {
            const response = await fetch(`${baseUrl}/api/scrape-website`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data: any = await response.json();

            if (data.success) {
                console.log("✅ Scraping successful!");
                console.log(`\n📊 Results:`);
                console.log(`   Title: ${data.data.title}`);
                console.log(`   Description: ${data.data.metaDescription}`);
                console.log(`   Headings Found: ${data.data.headings.length}`);
                console.log(`   Links Found: ${data.data.linkCount}`);
                console.log(`   Images Found: ${data.data.imageCount}`);
                console.log(`\n🤖 AI Summary Preview:`);
                console.log(`   ${data.data.summary.substring(0, 200)}...\n`);
            } else {
                console.log("❌ Scraping failed!");
                console.log(`   Error: ${data.error}`);
                if (data.details) {
                    console.log(`   Details: ${data.details}`);
                }
            }
        } catch (error: any) {
            console.log("❌ Request failed!");
            console.log(`   Error: ${error.message}\n`);
        }

        console.log("─".repeat(60) + "\n");
    }

    console.log("\n🧪 Testing Campaign Strategies with URLs...\n");
    console.log("─".repeat(60));

    try {
        const response = await fetch(`${baseUrl}/api/generate-strategies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt:
                    "Create a marketing campaign for a new SaaS project management tool targeting small businesses",
                urls: ["https://www.trello.com"],
            }),
        });

        const data: any = await response.json();

        if (data.success) {
            console.log("✅ Strategy generation successful!");
            console.log(`\n📈 Generated ${data.strategies.length} strategies:`);
            data.strategies.forEach((strategy: any, index: number) => {
                console.log(`\n${index + 1}. ${strategy.title}`);
                console.log(`   Channel: ${strategy.channelType}`);
                console.log(`   Tags: ${strategy.tags.join(", ")}`);
                console.log(
                    `   Description: ${strategy.description.substring(0, 100)}...`
                );
            });
        } else {
            console.log("❌ Strategy generation failed!");
            console.log(`   Error: ${data.error}`);
        }
    } catch (error: any) {
        console.log("❌ Request failed!");
        console.log(`   Error: ${error.message}`);
    }

    console.log("\n─".repeat(60));
    console.log("\n✨ Testing complete!\n");
};

// Run the test
testScraper().catch(console.error);  
