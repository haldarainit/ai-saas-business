import dbConnect from "../lib/mongodb";
import Campaign from "../lib/models/Campaign";
import EmailLog from "../lib/models/EmailLog";
import User from "../lib/models/User";

interface InitResult {
    success: boolean;
    error?: string;
    statistics?: {
        users: number;
        campaigns: number;
        emailLogs: number;
        collections: string[];
    };
}

async function initializeDatabase(): Promise<InitResult> {
    try {
        console.log("🚀 Initializing MongoDB database...");

        // Connect to MongoDB
        await dbConnect();
        console.log("✅ Connected to MongoDB");

        // Ensure indexes are created
        console.log("📊 Creating database indexes...");

        // Campaign indexes
        await Campaign.createIndexes();
        console.log("✅ Campaign indexes created");

        // EmailLog indexes
        await EmailLog.createIndexes();
        console.log("✅ EmailLog indexes created");

        // User indexes
        await User.createIndexes();
        console.log("✅ User indexes created");

        // Check collections
        const collections = await Campaign.db.listCollections().toArray();
        const collectionNames = collections.map((c: { name: string }) => c.name);

        console.log("📋 Available collections:", collectionNames);

        // Database statistics
        const campaignCount = await Campaign.countDocuments();
        const logCount = await EmailLog.countDocuments();
        const userCount = await User.countDocuments();

        console.log(`📈 Database Statistics:
    - Users: ${userCount}
    - Campaigns: ${campaignCount}
    - Email Logs: ${logCount}`);

        console.log("🎉 Database initialization completed successfully!");

        return {
            success: true,
            statistics: {
                users: userCount,
                campaigns: campaignCount,
                emailLogs: logCount,
                collections: collectionNames,
            },
        };
    } catch (error) {
        const err = error as Error;
        console.error("❌ Database initialization failed:", err);
        return {
            success: false,
            error: err.message,
        };
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase()
        .then((result) => {
            console.log("Result:", result);
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error("Script error:", error);
            process.exit(1);
        });
}

export default initializeDatabase;
