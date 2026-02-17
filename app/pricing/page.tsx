"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/contexts/auth-context";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import type { BillingCycle } from "@/lib/billing/plans";

interface Plan {
  id: "free" | "starter" | "pro" | "custom";
  name: string;
  description: string;
  monthlyPriceUsd: number;
  monthlyCompareAtUsd: number | null;
  yearlyPriceUsd: number;
  yearlyCompareAtUsd: number | null;
  monthlyCredits: number;
  isContactSales?: boolean;
  monthly: {
    billingCycle: "monthly";
    priceUsd: number;
    compareAtUsd: number | null;
    discountPercent: number;
  };
  yearly: {
    billingCycle: "yearly";
    priceUsd: number;
    compareAtUsd: number | null;
    discountPercent: number;
  };
}

interface BillingUsage {
  creditsUsed: number;
  remainingCredits: number;
  monthlyLimit: number;
}

interface AuthenticatedViewer {
  isAuthenticated: true;
  billing: {
    planId: string;
    planName: string;
    monthlyPriceUsd: number;
    monthlyCompareAtUsd: number | null;
    yearlyPriceUsd: number;
    yearlyCompareAtUsd: number | null;
    planBillingCycle: BillingCycle;
    monthlyCreditLimit: number;
    planStatus: string;
  };
  usage: BillingUsage;
}

interface PlansApiResponse {
  plans: Plan[];
  pricingCurrency?: string;
  viewer: AuthenticatedViewer | { isAuthenticated: false };
  system?: {
    paymentsEnabled: boolean;
    signupEnabled: boolean;
  };
}

function submitToPayU(paymentUrl: string, params: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function PricingPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlansApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/billing/plans");
        const result = (await response.json()) as PlansApiResponse;
        if (!response.ok) {
          throw new Error((result as unknown as { error?: string }).error || "Failed to fetch pricing plans");
        }
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pricing.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const viewer = data?.viewer;
  const currentPlanId = useMemo(() => {
    if (viewer && "billing" in viewer && viewer.isAuthenticated) {
      return viewer.billing.planId;
    }
    return "free";
  }, [viewer]);
  const paymentsDisabled = data?.system?.paymentsEnabled === false;
  const currency = data?.pricingCurrency || "USD";

  const handleCheckout = async (planId: "starter" | "pro") => {
    try {
      setError(null);

      if (paymentsDisabled) {
        throw new Error("Payments are temporarily disabled by admin.");
      }

      if (!user) {
        setAuthModalOpen(true);
        return;
      }

      setCheckoutPlanId(planId);

      const response = await fetch("/api/payment/payu/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const result = await response.json();
      if (!response.ok || !result?.data?.paymentUrl || !result?.data?.payUParams) {
        throw new Error(result?.error || "Unable to start payment");
      }

      submitToPayU(result.data.paymentUrl, result.data.payUParams);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed to start";
      setError(message);
    } finally {
      setCheckoutPlanId(null);
    }
  };

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <section className="py-14 md:py-20">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-6xl">
                <div className="text-center mb-10">
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                    Pricing Plans for Business AI
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Choose a plan with the right AI rate limit for your team. Admins can increase limits any time.
                  </p>
                </div>

                <div className="mb-6 flex items-center justify-center">
                  <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md transition ${billingCycle === "monthly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                      onClick={() => setBillingCycle("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm rounded-md transition ${billingCycle === "yearly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                      onClick={() => setBillingCycle("yearly")}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {viewer && "billing" in viewer && viewer.isAuthenticated ? (
                  <Card className="mb-8 border-primary/30 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Current Plan: {viewer.billing.planName}
                      </CardTitle>
                      <CardDescription>
                        Status: {viewer.billing.planStatus} | Cycle: {viewer.billing.planBillingCycle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {viewer.usage.creditsUsed} / {viewer.usage.monthlyLimit} credits used this month.
                    </CardContent>
                  </Card>
                ) : null}

                {error && (
                  <p className="text-sm text-red-500 mb-5">{error}</p>
                )}
                {paymentsDisabled ? (
                  <p className="text-sm text-amber-600 mb-5">
                    Checkout is currently disabled by admin.
                  </p>
                ) : null}

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {data?.plans?.map((plan) => {
                      const isCurrent = plan.id === currentPlanId;
                      const isPaid = plan.id === "starter" || plan.id === "pro";
                      const cycleDetails =
                        billingCycle === "yearly" ? plan.yearly : plan.monthly;

                      return (
                        <Card key={plan.id} className={isCurrent ? "border-primary shadow-lg" : ""}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{plan.name}</CardTitle>
                              {isCurrent ? <Badge>Current</Badge> : null}
                            </div>
                            <CardDescription>{plan.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-3xl font-bold">
                                {plan.isContactSales
                                  ? "Custom"
                                  : `${currency === "USD" ? "$" : ""}${cycleDetails.priceUsd}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {plan.isContactSales
                                  ? "Talk with sales for pricing"
                                  : billingCycle === "yearly"
                                  ? `per year (${currency})`
                                  : `per month (${currency})`}
                              </p>
                              {!plan.isContactSales && cycleDetails.compareAtUsd ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="line-through">
                                    {currency === "USD" ? "$" : ""}
                                    {cycleDetails.compareAtUsd}
                                  </span>
                                  {" "}({cycleDetails.discountPercent}% off)
                                </p>
                              ) : null}
                            </div>

                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                {plan.monthlyCredits} monthly AI credits
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Multi-tool access included
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Plan-based rate limiting
                              </li>
                            </ul>

                            {plan.isContactSales ? (
                              <Button asChild className="w-full">
                                <Link href="/contact">Discuss Custom Plan</Link>
                              </Button>
                            ) : isCurrent ? (
                              <Button className="w-full" variant="secondary" disabled>
                                Active Plan
                              </Button>
                            ) : isPaid ? (
                              <Button
                                className="w-full"
                                onClick={() => handleCheckout(plan.id as "starter" | "pro")}
                                disabled={
                                  checkoutPlanId === plan.id ||
                                  paymentsDisabled
                                }
                              >
                                {checkoutPlanId === plan.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirecting...
                                  </>
                                ) : paymentsDisabled ? (
                                  "Checkout Disabled"
                                ) : user ? (
                                  `Upgrade to ${plan.name}`
                                ) : (
                                  "Sign In & Upgrade"
                                )}
                              </Button>
                            ) : (
                              <Button className="w-full" variant="outline" disabled>
                                Free Plan
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        stayOnSuccess
      />
    </>
  );
}
