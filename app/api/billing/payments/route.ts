import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import dbConnect from "@/lib/mongodb";
import PaymentTransaction from "@/lib/models/PaymentTransaction";
import { getBillingCatalog } from "@/lib/billing/catalog";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    const catalog = await getBillingCatalog();

    const transactions = await PaymentTransaction.find({ userId: String(user._id) })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("planId amount currency status txnId createdAt activatedAt metadata.mihpayid metadata.billingCycle")
      .lean();

    const normalizedTransactions = transactions.map((transaction) => {
      const plan =
        catalog.plans[transaction.planId as keyof typeof catalog.plans] || null;
      return {
        ...transaction,
        planName: plan?.name || String(transaction.planId).toUpperCase(),
      };
    });

    return NextResponse.json({
      pricingCurrency: catalog.currency,
      transactions: normalizedTransactions,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
