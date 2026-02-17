import { NextResponse } from "next/server";
import { processPayUPayload } from "@/lib/payment/payu-processing";
import type { PayUResponsePayload } from "@/lib/payment/payu";

function formDataToPayload(formData: FormData): PayUResponsePayload {
  const payload: PayUResponsePayload = {};

  for (const [key, value] of formData.entries()) {
    payload[key] = String(value);
  }

  return payload;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payload = formDataToPayload(formData);

    const result = await processPayUPayload({
      payload,
      source: "webhook",
    });

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        transactionId: result.transactionId,
        paymentStatus: result.paymentStatus,
        planApplied: result.planApplied || false,
      },
      { status: result.statusCode }
    );
  } catch (error) {
    console.error("Error processing PayU webhook:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
