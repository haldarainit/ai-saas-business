"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function PaymentFailurePage() {
  const params = useSearchParams();
  const reason = params.get("error_Message") || params.get("error") || "Payment was not completed.";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="container px-4 md:px-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                Payment Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{reason}</p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/pricing">Try Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact Support</Link>
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
