"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowLeft,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MousePointer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import CssGridBackground from "@/components/css-grid-background";
import FramerSpotlight from "@/components/framer-spotlight";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function EmailHistoryPage() {
  const router = useRouter();
  const [emailLogs, setEmailLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch email history
  useEffect(() => {
    fetchEmailHistory();
  }, [pagination.currentPage, statusFilter]);

  const fetchEmailHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.pageSize.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/email-history?${params}`);
      const result = await response.json();

      if (result.success) {
        setEmailLogs(result.data.emailLogs);
        setPagination(result.data.pagination);
        setStats(result.data.stats);
      } else {
        toast.error("Failed to load email history");
      }
    } catch (error) {
      console.error("Failed to fetch email history:", error);
      toast.error("Failed to load email history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchEmailHistory();
  };

  const handleExport = () => {
    // Convert email logs to CSV
    const headers = [
      "Date",
      "Recipient Email",
      "Recipient Name",
      "Subject",
      "Status",
      "Campaign ID",
    ];
    const csvContent = [
      headers.join(","),
      ...emailLogs.map((log) =>
        [
          new Date(log.sentAt).toLocaleString(),
          log.recipientEmail,
          log.recipientName || "N/A",
          `"${log.subject}"`,
          log.status,
          log.campaignId?._id || "N/A",
        ].join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "bounced":
        return <XCircle className="w-4 h-4 text-orange-500" />;
      case "opened":
        return <Eye className="w-4 h-4 text-blue-500" />;
      case "clicked":
        return <MousePointer className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      bounced:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      opened: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      clicked:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };

    return (
      <Badge className={config[status] || "bg-gray-100 text-gray-800"}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden bg-background">
        <CssGridBackground />
        <FramerSpotlight />
        <Toaster position="top-right" />

        {/* Hero Section */}
        <section className="relative pt-20 pb-12">
          <div className="container px-4 md:px-6">
            <Button
              variant="outline"
              onClick={() => router.push("/get-started/email-automation")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Email Automation
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">
                  Email History
                </h1>
                <p className="text-lg text-muted-foreground">
                  View all your sent emails and campaign performance
                </p>
              </div>
              <Button onClick={handleExport} className="w-fit">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </Card>

              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.sent}
                </p>
              </Card>

              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </Card>

              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Bounced</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.bounced}
                </p>
              </Card>

              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Opened</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.opened}
                </p>
              </Card>

              <Card className="p-4 bg-background/60 backdrop-blur-sm border hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="w-4 h-4 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Clicked</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.clicked}
                </p>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-background/60 backdrop-blur-sm border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by email, name, or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="clicked">Clicked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Email History Table */}
            <Card className="bg-background/60 backdrop-blur-sm border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Campaign</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span>Loading email history...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : emailLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Mail className="w-12 h-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              No emails found
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Start sending campaigns to see history here
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium">
                            {new Date(log.sentAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {log.recipientEmail}
                              </span>
                              {log.recipientName && (
                                <span className="text-sm text-muted-foreground">
                                  {log.recipientName}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.subject}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.campaignId ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-mono text-muted-foreground">
                                  {log.campaignId._id.toString().slice(-8)}
                                </span>
                                {log.campaignId.subject && (
                                  <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                                    {log.campaignId.subject}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                N/A
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} emails
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
