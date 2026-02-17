"use client";

import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="container px-4 md:px-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                Payment Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You cancelled the payment. Your current plan remains unchanged.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/pricing">Back to Pricing</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/profile">Go to Profile</Link>
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
