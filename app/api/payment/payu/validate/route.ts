import { NextResponse } from "next/server";
import {
  processPayUPayload,
  type ProcessPayUResult,
} from "@/lib/payment/payu-processing";
import type { PayUResponsePayload } from "@/lib/payment/payu";

function toNextResponse(result: ProcessPayUResult) {
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
}

async function parsePayload(request: Request): Promise<PayUResponsePayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const payload: PayUResponsePayload = {};

    for (const [key, value] of formData.entries()) {
      payload[key] = String(value);
    }

    return payload;
  }

  return (await request.json()) as PayUResponsePayload;
}

export async function POST(request: Request) {
  try {
    const payload = await parsePayload(request);
    const result = await processPayUPayload({ payload, source: "validate" });
    return toNextResponse(result);
  } catch (error) {
    console.error("Error validating PayU payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate payment" },
      { status: 500 }
    );
  }
}
