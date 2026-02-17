"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BadgeDollarSign,
  LayoutDashboard,
  Loader2,
  Settings2,
  Users,
} from "lucide-react";

type PlanId = "free" | "starter" | "pro" | "custom";
type BillingCycle = "monthly" | "yearly";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  billing: {
    planId: PlanId;
    planBillingCycle: BillingCycle;
    planName: string;
    monthlyCreditLimit: number;
    rateLimitBonusCredits: number;
    customMonthlyCredits: number | null;
    planStatus: string;
    isUnlimitedAccess: boolean;
    developerModeEnabled: boolean;
    accountStatus: "active" | "suspended";
    sessionVersion: number;
  };
  security: {
    suspendedReason: string | null;
    lastLoginAt: string | null;
  };
  usage: {
    periodKey: string;
    creditsUsed: number;
    remainingCredits: number;
    totalRequests: number;
  };
  createdAt: string;
}

interface AdminBillingResponse {
  users: AdminUserRow[];
  periodKey: string;
}

interface AdminPlanConfigResponse {
  currency: string;
  plans: Record<
    PlanId,
    {
      id: PlanId;
      name: string;
      description: string;
      monthlyPriceUsd: number;
      monthlyCompareAtUsd: number | null;
      yearlyPriceUsd: number;
      yearlyCompareAtUsd: number | null;
      monthlyCredits: number;
      isContactSales?: boolean;
    }
  >;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

interface SystemControlState {
  maintenanceMode: boolean;
  signupEnabled: boolean;
  paymentsEnabled: boolean;
  aiGenerationEnabled: boolean;
  deploymentsEnabled: boolean;
  adminOnlyMode: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

interface EditState {
  planId: PlanId;
  planBillingCycle: BillingCycle;
  role: "user" | "admin";
  rateLimitBonusCredits: number;
  customMonthlyCredits: string;
  isUnlimitedAccess: boolean;
  developerModeEnabled: boolean;
  accountStatus: "active" | "suspended";
  suspendedReason: string;
  forceSessionRefresh: boolean;
  resetCurrentUsage: boolean;
}

interface PlanEditState {
  name: string;
  description: string;
  monthlyCredits: number;
  monthlyPriceUsd: number;
  monthlyCompareAtUsd: string;
  yearlyPriceUsd: number;
  yearlyCompareAtUsd: string;
  isContactSales: boolean;
}

type AdminSectionId = "overview" | "users" | "settings";

const PLAN_OPTIONS: PlanId[] = ["free", "starter", "pro", "custom"];

const SYSTEM_CONTROL_FIELDS: Array<{
  key: keyof Omit<SystemControlState, "updatedBy" | "updatedAt">;
  title: string;
  description: string;
}> = [
  {
    key: "maintenanceMode",
    title: "Maintenance Mode",
    description: "Blocks non-admin traffic while system maintenance is active.",
  },
  {
    key: "adminOnlyMode",
    title: "Admin-Only Mode",
    description: "Restricts product usage to admin users only.",
  },
  {
    key: "signupEnabled",
    title: "Signup Enabled",
    description: "Allows new users to create accounts.",
  },
  {
    key: "paymentsEnabled",
    title: "Payments Enabled",
    description: "Allows paid plan checkout and payment creation.",
  },
  {
    key: "aiGenerationEnabled",
    title: "AI Generation Enabled",
    description: "Allows AI generation routes for regular users.",
  },
  {
    key: "deploymentsEnabled",
    title: "Deployments Enabled",
    description: "Allows deployment APIs (GitHub, Vercel, Netlify).",
  },
];

const ADMIN_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    description: "Dashboard summary and shortcuts",
    icon: LayoutDashboard,
  },
  {
    id: "users",
    title: "Users",
    description: "Manage user plans and access",
    icon: Users,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Pricing and system configuration",
    icon: Settings2,
  },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
}

export default function AdminBillingPage() {
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingPlanConfig, setSavingPlanConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSectionId>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [response, setResponse] = useState<AdminBillingResponse | null>(null);
  const [planConfig, setPlanConfig] = useState<AdminPlanConfigResponse | null>(
    null
  );
  const [planEdits, setPlanEdits] = useState<Record<PlanId, PlanEditState> | null>(
    null
  );
  const [systemControl, setSystemControl] = useState<SystemControlState | null>(
    null
  );
  const [edits, setEdits] = useState<Record<string, EditState>>({});

  const users = useMemo(() => response?.users || [], [response?.users]);
  const filteredUsers = useMemo(() => {
    const normalizedQuery = userSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const targets = [user.name, user.email, user.phone || ""];
      return targets.some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [users, userSearch]);
  const overviewStats = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter((user) => user.role === "admin").length;
    const suspendedUsers = users.filter(
      (user) => user.billing.accountStatus === "suspended"
    ).length;
    const unlimitedUsers = users.filter(
      (user) => user.billing.isUnlimitedAccess
    ).length;

    return {
      totalUsers,
      totalAdmins,
      suspendedUsers,
      unlimitedUsers,
    };
  }, [users]);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/billing/users");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Unable to load admin billing users");
    }

    const typedData = data as AdminBillingResponse;
    setResponse(typedData);

    const nextEdits: Record<string, EditState> = {};
    typedData.users.forEach((user) => {
      nextEdits[user.id] = {
        planId: user.billing.planId,
        planBillingCycle: user.billing.planBillingCycle || "monthly",
        role: user.role,
        rateLimitBonusCredits: user.billing.rateLimitBonusCredits,
        customMonthlyCredits:
          user.billing.customMonthlyCredits === null
            ? ""
            : String(user.billing.customMonthlyCredits),
        isUnlimitedAccess: !!user.billing.isUnlimitedAccess,
        developerModeEnabled: !!user.billing.developerModeEnabled,
        accountStatus: user.billing.accountStatus || "active",
        suspendedReason: user.security.suspendedReason || "",
        forceSessionRefresh: false,
        resetCurrentUsage: false,
      };
    });
    setEdits(nextEdits);
  };

  const loadSystemControl = async () => {
    const res = await fetch("/api/admin/system-control");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Unable to load system control state");
    }

    setSystemControl(data.control as SystemControlState);
  };

  const loadPlanConfig = async () => {
    const res = await fetch("/api/admin/billing/plans");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Unable to load plan configuration");
    }

    const typed = data as AdminPlanConfigResponse;
    setPlanConfig(typed);

    const nextPlanEdits = {} as Record<PlanId, PlanEditState>;
    (Object.keys(typed.plans) as PlanId[]).forEach((planId) => {
      const plan = typed.plans[planId];
      nextPlanEdits[planId] = {
        name: plan.name,
        description: plan.description,
        monthlyCredits: plan.monthlyCredits,
        monthlyPriceUsd: plan.monthlyPriceUsd,
        monthlyCompareAtUsd:
          plan.monthlyCompareAtUsd === null ? "" : String(plan.monthlyCompareAtUsd),
        yearlyPriceUsd: plan.yearlyPriceUsd,
        yearlyCompareAtUsd:
          plan.yearlyCompareAtUsd === null ? "" : String(plan.yearlyCompareAtUsd),
        isContactSales: !!plan.isContactSales,
      };
    });

    setPlanEdits(nextPlanEdits);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadUsers(), loadSystemControl(), loadPlanConfig()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setEditField = (
    userId: string,
    key: keyof EditState,
    value: string | number | boolean
  ) => {
    setEdits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: value,
      },
    }));
  };

  const setSystemField = (
    key: keyof Omit<SystemControlState, "updatedBy" | "updatedAt">,
    value: boolean
  ) => {
    setSystemControl((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const setPlanEditField = (
    planId: PlanId,
    key: keyof PlanEditState,
    value: string | number | boolean
  ) => {
    setPlanEdits((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [planId]: {
          ...prev[planId],
          [key]: value,
        },
      };
    });
  };

  const savePlanConfiguration = async () => {
    if (!planConfig || !planEdits) return;

    try {
      setSavingPlanConfig(true);
      setError(null);

      const plansPayload = {} as Record<
        PlanId,
        {
          name: string;
          description: string;
          monthlyCredits: number;
          monthlyPriceUsd: number;
          monthlyCompareAtUsd: number | null;
          yearlyPriceUsd: number;
          yearlyCompareAtUsd: number | null;
          isContactSales: boolean;
        }
      >;

      (Object.keys(planEdits) as PlanId[]).forEach((planId) => {
        const edit = planEdits[planId];
        plansPayload[planId] = {
          name: edit.name.trim(),
          description: edit.description.trim(),
          monthlyCredits: Number(edit.monthlyCredits || 0),
          monthlyPriceUsd: Number(edit.monthlyPriceUsd || 0),
          monthlyCompareAtUsd:
            edit.monthlyCompareAtUsd.trim() === ""
              ? null
              : Number(edit.monthlyCompareAtUsd),
          yearlyPriceUsd: Number(edit.yearlyPriceUsd || 0),
          yearlyCompareAtUsd:
            edit.yearlyCompareAtUsd.trim() === ""
              ? null
              : Number(edit.yearlyCompareAtUsd),
          isContactSales: !!edit.isContactSales,
        };
      });

      const res = await fetch("/api/admin/billing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: planConfig.currency,
          plans: plansPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save plan configuration");
      }

      await loadPlanConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan config save failed");
    } finally {
      setSavingPlanConfig(false);
    }
  };

  const saveSystemControl = async () => {
    if (!systemControl) return;

    try {
      setSavingSystem(true);
      setError(null);

      const payload: Record<string, boolean> = {};
      SYSTEM_CONTROL_FIELDS.forEach(({ key }) => {
        payload[key] = !!systemControl[key];
      });

      const res = await fetch("/api/admin/system-control", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save system control");
      }

      setSystemControl(data.control as SystemControlState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "System control save failed");
    } finally {
      setSavingSystem(false);
    }
  };

  const saveUser = async (userId: string) => {
    const edit = edits[userId];
    if (!edit) return;

    try {
      setSavingUserId(userId);
      setError(null);

      const customValue = edit.customMonthlyCredits.trim();
      if (customValue && Number.isNaN(Number(customValue))) {
        throw new Error("Custom monthly credits must be a valid number.");
      }

      const payload = {
        userId,
        planId: edit.planId,
        planBillingCycle: edit.planBillingCycle,
        role: edit.role,
        rateLimitBonusCredits: Number(edit.rateLimitBonusCredits || 0),
        customMonthlyCredits: customValue === "" ? null : Number(customValue),
        isUnlimitedAccess: edit.isUnlimitedAccess,
        developerModeEnabled: edit.developerModeEnabled,
        accountStatus: edit.accountStatus,
        suspendedReason: edit.suspendedReason,
        forceSessionRefresh: edit.forceSessionRefresh,
        resetCurrentUsage: edit.resetCurrentUsage,
      };

      const res = await fetch("/api/admin/billing/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save user");
      }

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Control Panel
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Manage user billing, security status, session revocation, and
                full system switches.
              </p>
              {response?.periodKey ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Usage period: {response.periodKey}
                </p>
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading admin data...
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <Card className="h-fit lg:sticky lg:top-24">
                  <CardHeader>
                    <CardTitle className="text-lg">Dashboard Menu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ADMIN_SECTIONS.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;

                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full rounded-md border px-3 py-3 text-left transition ${
                            isActive
                              ? "border-primary bg-primary/10"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="mt-1 h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{section.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {activeSection === "overview" ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Dashboard Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-md border p-4">
                              <p className="text-xs text-muted-foreground">
                                Total Users
                              </p>
                              <p className="text-2xl font-semibold">
                                {overviewStats.totalUsers}
                              </p>
                            </div>
                            <div className="rounded-md border p-4">
                              <p className="text-xs text-muted-foreground">
                                Admin Accounts
                              </p>
                              <p className="text-2xl font-semibold">
                                {overviewStats.totalAdmins}
                              </p>
                            </div>
                            <div className="rounded-md border p-4">
                              <p className="text-xs text-muted-foreground">
                                Suspended Users
                              </p>
                              <p className="text-2xl font-semibold">
                                {overviewStats.suspendedUsers}
                              </p>
                            </div>
                            <div className="rounded-md border p-4">
                              <p className="text-xs text-muted-foreground">
                                Unlimited Access
                              </p>
                              <p className="text-2xl font-semibold">
                                {overviewStats.unlimitedUsers}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                          <Button onClick={() => setActiveSection("users")}>
                            <Users className="mr-2 h-4 w-4" />
                            Open User Management
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActiveSection("settings")}
                          >
                            <BadgeDollarSign className="mr-2 h-4 w-4" />
                            Open Billing & Settings
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  ) : null}
                  {activeSection === "settings" ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pricing Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-4">
                          <div>
                            <Label>Currency</Label>
                            <Input
                              value={planConfig?.currency || "USD"}
                              onChange={(e) =>
                                setPlanConfig((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        currency: e.target.value.toUpperCase(),
                                      }
                                    : prev
                                )
                              }
                              placeholder="USD"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {(Object.keys(planEdits || {}) as PlanId[]).map((planId) => {
                            const plan = planEdits?.[planId];
                            if (!plan) return null;

                            return (
                              <div
                                key={planId}
                                className="rounded-md border p-4 space-y-3"
                              >
                                <p className="text-sm font-semibold uppercase">
                                  {planId}
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <Label>Name</Label>
                                    <Input
                                      value={plan.name}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Input
                                      value={plan.description}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-5">
                                  <div>
                                    <Label>Monthly Credits</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={plan.monthlyCredits}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "monthlyCredits",
                                          Number(e.target.value || 0)
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Monthly Price</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={plan.monthlyPriceUsd}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "monthlyPriceUsd",
                                          Number(e.target.value || 0)
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Monthly Compare At</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      placeholder="optional"
                                      value={plan.monthlyCompareAtUsd}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "monthlyCompareAtUsd",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Yearly Price</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={plan.yearlyPriceUsd}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "yearlyPriceUsd",
                                          Number(e.target.value || 0)
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Yearly Compare At</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      placeholder="optional"
                                      value={plan.yearlyCompareAtUsd}
                                      onChange={(e) =>
                                        setPlanEditField(
                                          planId,
                                          "yearlyCompareAtUsd",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <label className="inline-flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={plan.isContactSales}
                                    onChange={(e) =>
                                      setPlanEditField(
                                        planId,
                                        "isContactSales",
                                        e.target.checked
                                      )
                                    }
                                  />
                                  Contact sales plan
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          onClick={savePlanConfiguration}
                          disabled={!planConfig || !planEdits || savingPlanConfig}
                        >
                          {savingPlanConfig ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Pricing Configuration"
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Pricing updated: {formatDate(planConfig?.updatedAt || null)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">System Controls</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {SYSTEM_CONTROL_FIELDS.map((field) => (
                            <label
                              key={field.key}
                              className="flex items-start justify-between gap-3 rounded-md border p-3"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{field.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4"
                                checked={!!systemControl?.[field.key]}
                                onChange={(e) =>
                                  setSystemField(field.key, e.target.checked)
                                }
                              />
                            </label>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            onClick={saveSystemControl}
                            disabled={!systemControl || savingSystem}
                          >
                            {savingSystem ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save System Controls"
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Last updated: {formatDate(systemControl?.updatedAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : activeSection === "users" ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Users</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label>Search User</Label>
                            <Input
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search by name, email, or mobile number"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Showing {filteredUsers.length} of {users.length} users.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid gap-4">
                      {filteredUsers.map((user) => {
                        const edit = edits[user.id];
                        return (
                          <Card key={user.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {user.name || "Unnamed User"}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Mobile: {user.phone || "Not set"}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-5">
                            <div>
                              <Label>Plan</Label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={edit?.planId || "free"}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "planId",
                                    e.target.value as PlanId
                                  )
                                }
                              >
                                {PLAN_OPTIONS.map((planId) => (
                                  <option key={planId} value={planId}>
                                    {planId}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label>Billing Cycle</Label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={edit?.planBillingCycle || "monthly"}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "planBillingCycle",
                                    e.target.value as BillingCycle
                                  )
                                }
                              >
                                <option value="monthly">monthly</option>
                                <option value="yearly">yearly</option>
                              </select>
                            </div>

                            <div>
                              <Label>Role</Label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={edit?.role || "user"}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "role",
                                    e.target.value as "user" | "admin"
                                  )
                                }
                              >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            </div>

                            <div>
                              <Label>Account Status</Label>
                              <select
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={edit?.accountStatus || "active"}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "accountStatus",
                                    e.target.value as "active" | "suspended"
                                  )
                                }
                              >
                                <option value="active">active</option>
                                <option value="suspended">suspended</option>
                              </select>
                            </div>

                            <div>
                              <Label>Bonus Credits</Label>
                              <Input
                                type="number"
                                min={0}
                                value={edit?.rateLimitBonusCredits ?? 0}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "rateLimitBonusCredits",
                                    Number(e.target.value || 0)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label>Custom Monthly Credits</Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder="blank = plan default"
                                value={edit?.customMonthlyCredits ?? ""}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "customMonthlyCredits",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <Label>Suspended Reason</Label>
                              <Input
                                value={edit?.suspendedReason ?? ""}
                                placeholder="reason for suspension"
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "suspendedReason",
                                    e.target.value
                                  )
                                }
                                disabled={edit?.accountStatus !== "suspended"}
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-4 text-sm">
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!edit?.isUnlimitedAccess}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "isUnlimitedAccess",
                                    e.target.checked
                                  )
                                }
                              />
                              Unlimited Access
                            </label>
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!edit?.developerModeEnabled}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "developerModeEnabled",
                                    e.target.checked
                                  )
                                }
                              />
                              Developer Mode
                            </label>
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!edit?.forceSessionRefresh}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "forceSessionRefresh",
                                    e.target.checked
                                  )
                                }
                              />
                              Revoke Sessions
                            </label>
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!edit?.resetCurrentUsage}
                                onChange={(e) =>
                                  setEditField(
                                    user.id,
                                    "resetCurrentUsage",
                                    e.target.checked
                                  )
                                }
                              />
                              Reset This Month Usage
                            </label>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                              Used: {user.usage.creditsUsed} | Remaining:{" "}
                              {user.usage.remainingCredits} | Current limit:{" "}
                              {user.billing.monthlyCreditLimit}
                            </p>
                            <p>
                              Session version: {user.billing.sessionVersion} |
                              Cycle: {user.billing.planBillingCycle} | Last login: {formatDate(user.security.lastLoginAt)}
                            </p>
                          </div>

                              <Button
                                onClick={() => saveUser(user.id)}
                                disabled={savingUserId === user.id}
                              >
                                {savingUserId === user.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save User Changes"
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {filteredUsers.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-sm text-muted-foreground">
                          No users found for this search.
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
