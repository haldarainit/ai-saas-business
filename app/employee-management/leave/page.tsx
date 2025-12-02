"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { Calendar, Plus, CheckCircle, Clock, XCircle, CalendarDays, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeaveSystem() {
  const [open, setOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/leave/all");
      const data = await response.json();

      if (data.success) {
        setLeaveRequests(data.leaves || []);
      }
    } catch (error) {
      console.error("Failed to load leave requests:", error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    setProcessing(leaveId);
    try {
      const response = await fetch("/api/leave/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveId,
          action: "approve",
          approvedBy: "Admin",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Approved",
          description: "Leave request has been approved",
        });
        loadLeaveRequests();
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to approve leave",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Approve leave error:", error);
      toast({
        title: "❌ Network Error",
        description: "Failed to approve leave. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setProcessing(leaveId);
    try {
      const response = await fetch("/api/leave/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveId,
          action: "reject",
          rejectionReason: reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Rejected",
          description: "Leave request has been rejected",
        });
        loadLeaveRequests();
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to reject leave",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reject leave error:", error);
      toast({
        title: "❌ Network Error",
        description: "Failed to reject leave. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-orange-500/5 via-background to-amber-500/5">
          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <Link href="/employee-management" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
                ← Back to Employee Management
              </Link>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Leave Management System</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Streamline leave requests, approvals, and balance tracking with automated workflows.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-500">
                  {leaveRequests.filter((l) => l.status === "approved").reduce((sum, l) => sum + l.days, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Approved Days</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-500">
                  {leaveRequests.filter((l) => l.status === "approved").length}
                </div>
                <div className="text-sm text-muted-foreground">Approved Requests</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-500">
                  {leaveRequests.filter((l) => l.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Pending Requests</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-500">
                  {leaveRequests.filter((l) => l.status === "rejected").length}
                </div>
                <div className="text-sm text-muted-foreground">Rejected Requests</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {/* Controls */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Leave Requests</h2>
              <Button variant="outline" onClick={loadLeaveRequests} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Leave Requests Table */}
            <Card>
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                  <p className="text-muted-foreground">Loading leave requests...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-semibold">Employee</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">From</th>
                        <th className="p-4 font-semibold">To</th>
                        <th className="p-4 font-semibold">Days</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No leave requests found
                          </td>
                        </tr>
                      ) : (
                        leaveRequests.map((request) => (
                          <tr key={request._id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-4 font-medium">{request.employeeName}</td>
                            <td className="p-4 text-muted-foreground capitalize">{request.leaveType}</td>
                            <td className="p-4 text-muted-foreground">{formatDate(request.fromDate)}</td>
                            <td className="p-4 text-muted-foreground">{formatDate(request.toDate)}</td>
                            <td className="p-4 text-muted-foreground">{request.days}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.status)}
                                <span className={`text-sm font-medium capitalize ${
                                  request.status === "approved" ? "text-green-600" :
                                  request.status === "pending" ? "text-orange-600" :
                                  "text-red-600"
                                }`}>
                                  {request.status}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              {request.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => handleApproveLeave(request._id)}
                                    disabled={processing === request._id}
                                  >
                                    {processing === request._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Approve"
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => handleRejectLeave(request._id)}
                                    disabled={processing === request._id}
                                  >
                                    {processing === request._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Reject"
                                    )}
                                  </Button>
                                </div>
                              )}
                              {request.status === "approved" && request.approvedBy && (
                                <span className="text-xs text-muted-foreground">
                                  Approved by {request.approvedBy}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6">
                <Calendar className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Easy Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Submit leave requests quickly with a simple and intuitive interface.
                </p>
              </Card>
              <Card className="p-6">
                <CheckCircle className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Approval Workflow</h3>
                <p className="text-sm text-muted-foreground">
                  Automated approval workflows with manager notifications and tracking.
                </p>
              </Card>
              <Card className="p-6">
                <CalendarDays className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Calendar Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Sync approved leaves with team calendars for better planning.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
