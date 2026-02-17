"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ValidationResponse {
  success: boolean;
  message: string;
  paymentStatus?: string;
  planApplied?: boolean;
}

function getPayloadFromParams(params: URLSearchParams) {
  const payload: Record<string, string> = {};
  params.forEach((value, key) => {
    payload[key] = value;
  });
  return payload;
}

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ValidationResponse | null>(null);

  const payload = useMemo(() => getPayloadFromParams(params), [params]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!payload.txnid || !payload.hash) {
          setResult({
            success: true,
            message: "Payment callback received. Plan update may take a moment.",
          });
          return;
        }

        const response = await fetch("/api/payment/payu/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as ValidationResponse;
        setResult(data);
      } catch {
        setResult({
          success: false,
          message: "Unable to verify payment right now. Please check your profile shortly.",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [payload]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="container px-4 md:px-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying payment and activating your plan...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {result?.message || "Your payment has been processed."}
                </p>
              )}

              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/profile">Go to Profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
