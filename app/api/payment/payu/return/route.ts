import { NextResponse } from "next/server";

function resolveDestinationPath(type?: string | null, status?: string | null) {
  if (type === "success") return "/payment/success";
  if (type === "failure") return "/payment/failure";
  if (type === "cancel") return "/payment/cancel";

  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "success") return "/payment/success";
  if (normalizedStatus === "failed" || normalizedStatus === "failure") {
    return "/payment/failure";
  }
  if (normalizedStatus === "cancel" || normalizedStatus === "cancelled") {
    return "/payment/cancel";
  }

  return "/payment/failure";
}

function appendPayUFields(
  redirectUrl: URL,
  data: Record<string, string | undefined>
) {
  const passThroughKeys = [
    "txnid",
    "mihpayid",
    "status",
    "amount",
    "hash",
    "key",
    "additional_charges",
    "mode",
    "bankcode",
    "bank_ref_no",
    "error",
    "error_Message",
    "productinfo",
    "email",
    "firstname",
    "udf1",
    "udf2",
    "udf3",
    "udf4",
    "udf5",
  ];

  for (const key of passThroughKeys) {
    const value = data[key];
    if (value) {
      redirectUrl.searchParams.set(key, value);
    }
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const formData = await request.formData();
    const data: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = String(value);
    }

    const destination = resolveDestinationPath(type, data.status);
    const redirectUrl = new URL(destination, request.url);
    appendPayUFields(redirectUrl, data);

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("PayU return redirect failed:", error);
    return new NextResponse(
      `<html><body><h1>Payment redirect failed</h1><p><a href="/payment/failure">Go to payment result</a></p></body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json({
    success: true,
    message: "This endpoint expects PayU POST callbacks.",
    query: Object.fromEntries(url.searchParams.entries()),
  });
}
