"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Receipt,
  FileText,
  Layout,
  Presentation,
  Users,
  Package2,
  Loader2,
  RefreshCw,
  TrendingUp,
  Activity,
  Building2,
} from "lucide-react";
import Link from "next/link";

interface ProfileStats {
  invoices: number;
  quotations: number;
  workspaces: number;
  emailsSent: number;
  employees: number;
  presentations: number;
}

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ProfileStats>({
    invoices: 0,
    quotations: 0,
    workspaces: 0,
    emailsSent: 0,
    employees: 0,
    presentations: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [daysActive, setDaysActive] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAllStats();
      calculateDaysActive();
    }
  }, [user]);

  const calculateDaysActive = () => {
    if (user?.createdAt) {
      const createdDate = new Date(user.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysActive(diffDays);
    }
  };

  const fetchAllStats = async () => {
    setLoadingStats(true);
    try {
      const [
        invoicesRes,
        quotationsRes,
        workspacesRes,
        emailsRes,
        employeesRes,
        presentationsRes,
      ] = await Promise.allSettled([
        fetch("/api/invoice"),
        fetch("/api/techno-quotation"),
        fetch("/api/workspace"),
        fetch("/api/email-analytics"),
        fetch("/api/employee"),
        fetch("/api/presentation-workspace"),
      ]);

      const newStats: ProfileStats = {
        invoices: 0,
        quotations: 0,
        workspaces: 0,
        emailsSent: 0,
        employees: 0,
        presentations: 0,
      };

      // Parse invoices
      if (invoicesRes.status === "fulfilled" && invoicesRes.value.ok) {
        const data = await invoicesRes.value.json();
        newStats.invoices = data.invoices?.length || 0;
      }

      // Parse quotations
      if (quotationsRes.status === "fulfilled" && quotationsRes.value.ok) {
        const data = await quotationsRes.value.json();
        newStats.quotations = data.quotations?.length || 0;
      }

      // Parse workspaces (landing pages)
      if (workspacesRes.status === "fulfilled" && workspacesRes.value.ok) {
        const data = await workspacesRes.value.json();
        newStats.workspaces = data.workspaces?.length || 0;
      }

      // Parse email analytics
      if (emailsRes.status === "fulfilled" && emailsRes.value.ok) {
        const data = await emailsRes.value.json();
        newStats.emailsSent = data.totals?.totalSent || 0;
      }

      // Parse employees
      if (employeesRes.status === "fulfilled" && employeesRes.value.ok) {
        const data = await employeesRes.value.json();
        newStats.employees = data.employees?.length || 0;
      }

      // Parse presentations
      if (presentationsRes.status === "fulfilled" && presentationsRes.value.ok) {
        const data = await presentationsRes.value.json();
        newStats.presentations = data.workspaces?.length || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <>
        <StructuredData />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statCards = [
    { label: "Invoices", value: stats.invoices, icon: Receipt, href: "/accounting/invoice", color: "text-blue-500" },
    { label: "Quotations", value: stats.quotations, icon: FileText, href: "/accounting/techno-quotation", color: "text-emerald-500" },
    { label: "Landing Pages", value: stats.workspaces, icon: Layout, href: "/landing-page-builder", color: "text-purple-500" },
    { label: "Emails Sent", value: stats.emailsSent, icon: Mail, href: "/email-analytics", color: "text-orange-500" },
    { label: "Employees", value: stats.employees, icon: Users, href: "/employee-management", color: "text-pink-500" },
    { label: "Presentations", value: stats.presentations, icon: Presentation, href: "/presentations", color: "text-amber-500" },
  ];

  const totalActivity = stats.invoices + stats.quotations + stats.workspaces + stats.emailsSent + stats.presentations;

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container relative px-4 md:px-6">
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                <Avatar className="w-24 h-24 mb-6 ring-4 ring-primary/20">
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                  {user.name || "Welcome"}
                </h1>

                <p className="text-muted-foreground mb-4">{user.email}</p>

                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="px-3 py-1">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    Joined {formatDate(user.createdAt || new Date().toISOString())}
                  </Badge>
                  {user.isEmployee && (
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      Employee
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 lg:py-16">
            <div className="container px-4 md:px-6">
              <div className="max-w-6xl mx-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">{totalActivity}</div>
                      <div className="text-xs text-muted-foreground">Total Activity</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{daysActive}</div>
                      <div className="text-xs text-muted-foreground">Days Active</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Receipt className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{stats.invoices + stats.quotations}</div>
                      <div className="text-xs text-muted-foreground">Documents</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Mail className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{stats.emailsSent}</div>
                      <div className="text-xs text-muted-foreground">Emails Sent</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Stats */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Your Activity</CardTitle>
                      <CardDescription>Overview of your platform usage</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchAllStats}
                      disabled={loadingStats}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {statCards.map((stat) => (
                          <Link key={stat.label} href={stat.href}>
                            <div className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-center cursor-pointer">
                              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
                              <div className="text-2xl font-bold">{stat.value}</div>
                              <div className="text-xs text-muted-foreground">{stat.label}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <Link href="/profile/company-profiles">
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1 border-primary/30 bg-primary/5">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="text-xs">Company Profiles</span>
                        </Button>
                      </Link>
                      <Link href="/accounting/invoice">
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
                          <Receipt className="w-5 h-5" />
                          <span className="text-xs">New Invoice</span>
                        </Button>
                      </Link>
                      <Link href="/presentations">
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
                          <Presentation className="w-5 h-5" />
                          <span className="text-xs">New Presentation</span>
                        </Button>
                      </Link>
                      <Link href="/get-started/email-automation">
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
                          <Mail className="w-5 h-5" />
                          <span className="text-xs">Email Campaign</span>
                        </Button>
                      </Link>
                      <Link href="/landing-page-builder">
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-1">
                          <Layout className="w-5 h-5" />
                          <span className="text-xs">Landing Page</span>
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Company Profiles Card */}
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Company Profiles
                      </CardTitle>
                      <CardDescription>Manage company details for invoices & quotations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/profile/company-profiles">
                        <Button className="w-full">
                          <Building2 className="w-4 h-4 mr-2" />
                          Manage Company Profiles
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-3">
                        Your company details (GSTIN, PAN, CIN, TAN, MSME, Bank details) are saved here and auto-fill in all invoices & quotations.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Section */}
                <div className="grid md:grid-cols-1 gap-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{user.name || "No name set"}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full mt-4"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
