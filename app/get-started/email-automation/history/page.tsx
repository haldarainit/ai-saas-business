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
  Calendar,
  ChevronRight,
  BarChart2,
  Send,
  PauseCircle,
  PlayCircle,
  AlertCircle
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

// Define types for better type safety
interface Campaign {
  _id: string;
  subject: string;
  status: string;
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface EmailLog {
  _id: string;
  sentAt: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: string;
  campaignId?: {
    _id: string;
    subject: string;
  };
}

export default function EmailHistoryPage() {
  const router = useRouter();

  // View Mode State
  const [viewMode, setViewMode] = useState<"campaigns" | "logs">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Data State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

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
    pageSize: 20,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch data based on view mode
  useEffect(() => {
    if (viewMode === "campaigns") {
      fetchCampaigns();
    } else {
      fetchEmailHistory();
    }
  }, [viewMode, pagination.currentPage, statusFilter, selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        type: "campaigns"
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/email-history?${params}`);
      const result = await response.json();

      if (result.success) {
        // Deduplicate campaigns based on _id
        const uniqueCampaigns = result.data.campaigns.filter(
          (campaign: Campaign, index: number, self: Campaign[]) =>
            index === self.findIndex((c) => c._id === campaign._id)
        );

        setCampaigns(uniqueCampaigns);
        setPagination(result.data.pagination);
      } else {
        toast.error("Failed to load campaigns");
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (selectedCampaign) {
        params.append("campaignId", selectedCampaign._id);
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
    if (viewMode === "logs") {
      fetchEmailHistory();
    }
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewMode("logs");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaign(null);
    setViewMode("campaigns");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleExport = () => {
    // Convert data to CSV based on view mode
    let csvContent = "";
    let filename = "";

    if (viewMode === "campaigns") {
      const headers = ["Date Created", "Subject", "Status", "Total Emails", "Sent", "Failed"];
      csvContent = [
        headers.join(","),
        ...campaigns.map((c) =>
          [
            new Date(c.createdAt).toLocaleString(),
            `"${c.subject}"`,
            c.status,
            c.totalEmails,
            c.sentCount,
            c.failedCount
          ].join(",")
        ),
      ].join("\n");
      filename = `campaign-history-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      const headers = [
        "Date",
        "Recipient Email",
        "Recipient Name",
        "Subject",
        "Status",
        "Campaign ID",
      ];
      csvContent = [
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
      filename = `email-history-${selectedCampaign ? 'campaign-' : ''}${new Date().toISOString().split("T")[0]}.csv`;
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      sent: {
        className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-semibold",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      active: {
        className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-semibold",
        icon: <PlayCircle className="w-3 h-3" />,
      },
      completed: {
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold",
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      failed: {
        className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-semibold",
        icon: <XCircle className="w-3 h-3" />,
      },
      cancelled: {
        className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-semibold",
        icon: <XCircle className="w-3 h-3" />,
      },
      bounced: {
        className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-semibold",
        icon: <AlertCircle className="w-3 h-3" />,
      },
      opened: {
        className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold",
        icon: <Eye className="w-3 h-3" />,
      },
      clicked: {
        className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold",
        icon: <MousePointer className="w-3 h-3" />,
      },
      paused: {
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 font-semibold",
        icon: <PauseCircle className="w-3 h-3" />,
      },
      draft: {
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold",
        icon: <Clock className="w-3 h-3" />,
      },
    };

    const statusConfig = config[status] || {
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold",
      icon: <Clock className="w-3 h-3" />,
    };

    return (
      <Badge className={statusConfig.className}>
        <span className="flex items-center gap-1.5">
          {statusConfig.icon}
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
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (viewMode === "logs" && selectedCampaign) {
                    handleBackToCampaigns();
                  } else {
                    router.push("/get-started/email-automation");
                  }
                }}
                className="frost-glass"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {viewMode === "logs" && selectedCampaign ? "Back to Campaigns" : "Back to Email Automation"}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {viewMode === "campaigns" ? "Campaign History" : selectedCampaign?.subject || "Email Logs"}
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  {viewMode === "campaigns"
                    ? "View and manage all your email campaigns"
                    : `Detailed logs for campaign started on ${selectedCampaign ? new Date(selectedCampaign.createdAt).toLocaleDateString() : ''}`}
                </p>
              </div>
              <Button
                onClick={handleExport}
                className="w-fit bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            {/* Statistics Cards - Only show in Logs view */}
            {viewMode === "logs" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card className="p-5 frost-glass border-l-4 border-l-primary hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.total.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-5 frost-glass border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Sent
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.sent.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-5 frost-glass border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failed.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-5 frost-glass border-l-4 border-l-orange-500 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Bounced
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.bounced.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-5 frost-glass border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Opened
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.opened.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-5 frost-glass border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <MousePointer className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Clicked
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.clicked.toLocaleString()}
                  </p>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="p-5 frost-glass border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={viewMode === "campaigns" ? "Search campaigns..." : "Search by email, name, or subject..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 font-medium"
                      disabled={viewMode === "campaigns"} // Campaign search not implemented in API yet
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-primary hover:bg-primary/90"
                    disabled={viewMode === "campaigns"}
                  >
                    Search
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] font-medium">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {viewMode === "campaigns" ? (
                        <>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="bounced">Bounced</SelectItem>
                          <SelectItem value="opened">Opened</SelectItem>
                          <SelectItem value="clicked">Clicked</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Content Table */}
            <Card className="frost-glass overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {viewMode === "campaigns" ? (
                      <BarChart2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Mail className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {viewMode === "campaigns" ? "All Campaigns" : "Email Logs"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {viewMode === "campaigns"
                        ? "Select a campaign to view detailed logs"
                        : "Detailed delivery status for each recipient"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {viewMode === "campaigns" ? (
                        <>
                          <TableHead className="font-bold">Campaign Subject</TableHead>
                          <TableHead className="font-bold">Created At</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="font-bold">Progress</TableHead>
                          <TableHead className="font-bold text-right">Actions</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-bold">Date & Time</TableHead>
                          <TableHead className="font-bold">Recipient</TableHead>
                          <TableHead className="font-bold">Subject</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="font-medium text-muted-foreground">
                              Loading data...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (viewMode === "campaigns" ? campaigns.length === 0 : emailLogs.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-muted/30 rounded-full">
                              <Mail className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">
                                No records found
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {viewMode === "campaigns"
                                  ? "Start a new campaign to see it here"
                                  : "No emails found for this selection"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      viewMode === "campaigns" ? (
                        // Campaigns List
                        campaigns.map((campaign) => (
                          <TableRow
                            key={campaign._id}
                            className="hover:bg-muted/20 transition-colors cursor-pointer group"
                            onClick={() => handleCampaignClick(campaign)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="text-base font-semibold group-hover:text-primary transition-colors">
                                  {campaign.subject}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  ID: {campaign._id.slice(-8)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>{Math.round((campaign.sentCount / (campaign.totalEmails || 1)) * 100)}%</span>
                                  <span className="text-muted-foreground">{campaign.sentCount}/{campaign.totalEmails}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(campaign.sentCount / (campaign.totalEmails || 1)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        // Email Logs List
                        emailLogs.map((log) => (
                          <TableRow
                            key={log._id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>
                                  {new Date(log.sentAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.sentAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
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
                            <TableCell className="max-w-xs">
                              <div
                                className="truncate font-medium"
                                title={log.subject}
                              >
                                {log.subject}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                  <div className="text-sm text-muted-foreground font-medium">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount.toLocaleString()} {viewMode === "campaigns" ? "campaigns" : "emails"}
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
                      <span className="text-sm font-medium">
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
