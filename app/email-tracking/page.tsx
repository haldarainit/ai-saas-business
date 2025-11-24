"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import {
  Mail,
  MailOpen,
  MousePointerClick,
  TrendingUp,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  Clock,
  Eye,
  RefreshCw,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";

interface CampaignStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: string;
  clickRate: string;
  totalOpenEvents: number;
  totalClickEvents: number;
}

interface TrackingRecord {
  _id: string;
  recipientEmail: string;
  emailSubject: string;
  totalOpens: number;
  totalClicks: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  status: string;
  sentAt: string;
}

interface DeviceStat {
  _id: string;
  count: number;
}

interface ClickedLink {
  url: string;
  clicks: number;
  uniqueClickers: number;
}

interface DetailedStats {
  recipients: TrackingRecord[];
  timeline: Array<{ date: string; opens: number }>;
  topRecipients: TrackingRecord[];
  deviceStats: DeviceStat[];
  browserStats: DeviceStat[];
  clickedLinks: ClickedLink[];
}

export default function EmailTrackingDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"overview" | "recipients" | "analytics">(
    "overview"
  );

  // Fetch campaigns from email history
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/email-history");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.campaigns) {
          setCampaigns(data.campaigns);
          if (data.campaigns.length > 0) {
            setSelectedCampaign(data.campaigns[0]._id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      fetchTrackingStats();
    }
  }, [selectedCampaign]);

  const fetchTrackingStats = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      // Fetch summary stats
      const summaryResponse = await fetch(
        `/api/track/stats/${selectedCampaign}`
      );
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setStats(summaryData.stats);
      }

      // Fetch detailed stats
      const detailResponse = await fetch(
        `/api/track/stats/${selectedCampaign}?detail=detailed`
      );
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        setDetailedStats(detailData.details);
      }
    } catch (error) {
      console.error("Error fetching tracking stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatPercent = (value: string | number) => {
    return typeof value === "string" ? value : `${value}%`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "clicked":
        return "text-green-500 bg-green-500/10";
      case "opened":
        return "text-blue-500 bg-blue-500/10";
      case "sent":
        return "text-gray-500 bg-gray-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1 py-12">
          <div className="container px-4 md:px-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold mb-2">
                Email Tracking Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your email campaign performance and engagement metrics
              </p>
            </motion.div>

            {/* Campaign Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">
                        Select Campaign
                      </label>
                      <select
                        value={selectedCampaign || ""}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border rounded-md bg-background"
                      >
                        {campaigns.map((campaign) => (
                          <option key={campaign._id} value={campaign._id}>
                            {campaign.subject || "Untitled Campaign"} (
                            {formatDate(campaign.sentAt)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={fetchTrackingStats} disabled={loading}>
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* View Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setView("overview")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    view === "overview"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setView("recipients")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    view === "recipients"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Recipients
                </button>
                <button
                  onClick={() => setView("analytics")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    view === "analytics"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Analytics
                </button>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {view === "overview" && stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total Sent
                          </CardTitle>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.totalSent}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Emails delivered
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Open Rate
                          </CardTitle>
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatPercent(stats.openRate)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stats.totalOpened} recipients opened
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Click Rate
                          </CardTitle>
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatPercent(stats.clickRate)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stats.totalClicked} recipients clicked
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Engagement
                          </CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.totalOpenEvents + stats.totalClickEvents}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total interactions
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Recipients */}
                    {detailedStats?.topRecipients &&
                      detailedStats.topRecipients.length > 0 && (
                        <Card className="mb-8">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Most Engaged Recipients
                            </CardTitle>
                            <CardDescription>
                              Recipients with the highest engagement
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {detailedStats.topRecipients
                                .slice(0, 5)
                                .map((recipient, index) => (
                                  <div
                                    key={recipient._id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {recipient.recipientEmail}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {recipient.firstOpenedAt &&
                                            `First opened: ${formatDate(
                                              recipient.firstOpenedAt
                                            )}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                          <Eye className="w-4 h-4" />
                                          {recipient.totalOpens}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MousePointerClick className="w-4 h-4" />
                                          {recipient.totalClicks}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </motion.div>
                )}

                {/* Recipients Tab */}
                {view === "recipients" && detailedStats?.recipients && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>All Recipients</CardTitle>
                        <CardDescription>
                          Complete list of email recipients and their engagement
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg font-medium text-sm">
                            <div className="col-span-4">Email</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-center">Opens</div>
                            <div className="col-span-2 text-center">Clicks</div>
                            <div className="col-span-2">Last Activity</div>
                          </div>

                          {/* Rows */}
                          {detailedStats.recipients.map((recipient) => (
                            <div
                              key={recipient._id}
                              className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="col-span-4 truncate">
                                {recipient.recipientEmail}
                              </div>
                              <div className="col-span-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    recipient.status
                                  )}`}
                                >
                                  {recipient.status}
                                </span>
                              </div>
                              <div className="col-span-2 text-center">
                                {recipient.totalOpens}
                              </div>
                              <div className="col-span-2 text-center">
                                {recipient.totalClicks}
                              </div>
                              <div className="col-span-2 text-sm text-muted-foreground">
                                {recipient.lastOpenedAt
                                  ? new Date(
                                      recipient.lastOpenedAt
                                    ).toLocaleDateString()
                                  : "Never"}
                              </div>
                            </div>
                          ))}

                          {detailedStats.recipients.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              No recipients found for this campaign
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Analytics Tab */}
                {view === "analytics" && detailedStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Device & Browser Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Device Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5" />
                            Device Breakdown
                          </CardTitle>
                          <CardDescription>
                            Opens by device type
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {detailedStats.deviceStats &&
                          detailedStats.deviceStats.length > 0 ? (
                            <div className="space-y-3">
                              {detailedStats.deviceStats.map((device) => (
                                <div
                                  key={device._id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    {getDeviceIcon(device._id)}
                                    <span className="capitalize">
                                      {device._id || "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary"
                                        style={{
                                          width: `${
                                            (device.count /
                                              detailedStats.deviceStats.reduce(
                                                (sum, d) => sum + d.count,
                                                0
                                              )) *
                                            100
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">
                                      {device.count}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              No device data available
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Browser Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Browser Breakdown
                          </CardTitle>
                          <CardDescription>Opens by browser</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {detailedStats.browserStats &&
                          detailedStats.browserStats.length > 0 ? (
                            <div className="space-y-3">
                              {detailedStats.browserStats.map((browser) => (
                                <div
                                  key={browser._id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Chrome className="w-4 h-4" />
                                    <span>{browser._id || "Unknown"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary"
                                        style={{
                                          width: `${
                                            (browser.count /
                                              detailedStats.browserStats.reduce(
                                                (sum, b) => sum + b.count,
                                                0
                                              )) *
                                            100
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">
                                      {browser.count}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              No browser data available
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Most Clicked Links */}
                    {detailedStats.clickedLinks &&
                      detailedStats.clickedLinks.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <MousePointerClick className="w-5 h-5" />
                              Most Clicked Links
                            </CardTitle>
                            <CardDescription>
                              Top performing links in your email
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {detailedStats.clickedLinks.map((link, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-lg"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {link.url}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {link.uniqueClickers} unique clickers
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold">
                                        {link.clicks}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        clicks
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* Engagement Timeline */}
                    {detailedStats.timeline &&
                      detailedStats.timeline.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Engagement Timeline
                            </CardTitle>
                            <CardDescription>Opens over time</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {detailedStats.timeline.map((day) => (
                                <div
                                  key={day.date}
                                  className="flex items-center gap-4"
                                >
                                  <span className="text-sm text-muted-foreground w-24">
                                    {day.date}
                                  </span>
                                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                                    <div
                                      className="h-full bg-primary flex items-center justify-end pr-2"
                                      style={{
                                        width: `${
                                          (day.opens /
                                            Math.max(
                                              ...detailedStats.timeline.map(
                                                (d) => d.opens
                                              )
                                            )) *
                                          100
                                        }%`,
                                        minWidth: day.opens > 0 ? "30px" : "0",
                                      }}
                                    >
                                      <span className="text-xs font-medium text-primary-foreground">
                                        {day.opens}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </motion.div>
                )}
              </>
            )}

            {!selectedCampaign && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Campaign Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Select a campaign above to view tracking statistics
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
