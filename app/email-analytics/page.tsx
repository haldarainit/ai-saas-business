"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  Activity,
  BarChart3,
  Users,
  ArrowUpRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CssGridBackground from "@/components/css-grid-background";
import FramerSpotlight from "@/components/framer-spotlight";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type Totals = {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  totalOpenEvents: number;
  totalClickEvents: number;
};

export default function EmailAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/email-analytics", { cache: "no-store" });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to load analytics");
      setTotals(data.totals);
      setRecent(data.recent || []);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = recent.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(recent.length / itemsPerPage);

  const handleExport = () => {
    const headers = [
      "Recipient",
      "Subject",
      "Opens",
      "Clicks",
      "Status",
      "Sent At",
    ];
    const csvContent = [
      headers.join(","),
      ...recent.map((r) =>
        [
          r.recipientEmail,
          `"${r.emailSubject || ""}"`,
          r.totalOpens || 0,
          r.totalClicks || 0,
          r.status,
          r.sentAt ? new Date(r.sentAt).toISOString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden bg-background">
        <CssGridBackground />
        <FramerSpotlight />

        <section className="relative pt-20 pb-12">
          <div className="container px-4 md:px-6 max-w-7xl mx-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/get-started/email-automation")}
              className="mb-6 frost-glass"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Automation
            </Button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Email Analytics Dashboard
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  Monitor your email performance and engagement metrics in
                  real-time
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchAnalytics}
                  disabled={loading}
                  className="frost-glass"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {loading && !totals && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground font-medium">
                    Loading analytics data...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <Card className="p-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </Card>
            )}

            {totals && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6 frost-glass border-l-4 border-l-primary hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold"
                      >
                        Total
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Emails Sent
                      </p>
                      <p className="text-3xl font-bold">
                        {totals.totalSent.toLocaleString()}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 frost-glass border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Eye className="w-6 h-6 text-blue-500" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold text-blue-600"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {totals.openRate}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Emails Opened
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {totals.totalOpened.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totals.totalOpenEvents.toLocaleString()} total opens
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 frost-glass border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <MousePointer className="w-6 h-6 text-purple-500" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold text-purple-600"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {totals.clickRate}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Links Clicked
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {totals.totalClicked.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {totals.totalClickEvents.toLocaleString()} total clicks
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 frost-glass border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <Activity className="w-6 h-6 text-green-500" />
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold text-green-600"
                      >
                        Active
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Engagement Rate
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {totals.totalSent > 0
                          ? (
                              ((totals.totalOpened + totals.totalClicked) /
                                (totals.totalSent * 2)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Combined open + click rate
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Recent Activity Table */}
                <Card className="frost-glass overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">
                            Recent Email Activity
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Last {recent.length} tracked emails
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        <Users className="w-3 h-3 mr-1" />
                        {recent.length} Recipients
                      </Badge>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-bold">Recipient</TableHead>
                          <TableHead className="font-bold">Subject</TableHead>
                          <TableHead className="font-bold text-center">
                            Opens
                          </TableHead>
                          <TableHead className="font-bold text-center">
                            Clicks
                          </TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold">
                            First Opened
                          </TableHead>
                          <TableHead className="font-bold">Sent At</TableHead>
                          <TableHead className="font-bold text-center">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((r) => (
                          <TableRow
                            key={r._id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {r.recipientEmail}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={r.emailSubject}>
                                {r.emailSubject || (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                              >
                                <Eye className="w-3 h-3 mr-1 text-blue-500" />
                                {r.totalOpens || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
                              >
                                <MousePointer className="w-3 h-3 mr-1 text-purple-500" />
                                {r.totalClicks || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`capitalize font-medium ${
                                  r.status === "sent"
                                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {r.firstOpenedAt ? (
                                <span className="text-muted-foreground">
                                  {new Date(
                                    r.firstOpenedAt
                                  ).toLocaleDateString()}{" "}
                                  <span className="text-xs">
                                    {new Date(
                                      r.firstOpenedAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {r.sentAt ? (
                                <span className="text-muted-foreground">
                                  {new Date(r.sentAt).toLocaleDateString()}{" "}
                                  <span className="text-xs">
                                    {new Date(r.sentAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(`/email-analytics/watch/${r._id}`)
                                }
                                className="text-primary hover:text-primary/80"
                              >
                                View
                                <ArrowUpRight className="w-3 h-3 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedData.length === 0 && !loading && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-muted/30 rounded-full">
                                  <Mail className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium text-muted-foreground">
                                    No email tracking data available
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Start sending tracked emails to see
                                    analytics here
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                      <div className="text-sm text-muted-foreground font-medium">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, recent.length)} of{" "}
                        {recent.length} emails
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
