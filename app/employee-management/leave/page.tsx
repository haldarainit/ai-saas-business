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
import { Calendar, Plus, CheckCircle, Clock, XCircle, CalendarDays } from "lucide-react";
import Link from "next/link";
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
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [leavePolicy, setLeavePolicy] = useState<any | null>(null);
  const [editingTypes, setEditingTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ employeeId: "", casual: 10, sick: 10, annual: 15 });
  const [balanceSaving, setBalanceSaving] = useState(false);

  useEffect(() => {
    loadLeaves();
    loadLeavePolicy();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/leave/all");
      const data = await response.json();

      if (data.success) {
        setLeaveRequests(data.leaves || []);
      }
    } catch (error) {
      console.error("Failed to load leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeavePolicy = async () => {
    try {
      setPolicyLoading(true);
      const response = await fetch("/api/leave/policy");
      const data = await response.json();

      if (data.success && data.policy) {
        setLeavePolicy(data.policy);
        setEditingTypes(data.policy.leaveTypes || []);
      }
    } catch (error) {
      console.error("Failed to load leave policy:", error);
    } finally {
      setPolicyLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await fetch("/api/employee/all");
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handlePolicyFieldChange = (index: number, field: string, value: any) => {
    setEditingTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddLeaveType = () => {
    setEditingTypes((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        yearlyQuota: 0,
        maxConsecutiveDays: null,
        description: "",
        isActive: true,
      },
    ]);
  };

  const handleRemoveLeaveType = (index: number) => {
    setEditingTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePolicy = async () => {
    try {
      setPolicySaving(true);

      const sanitized = editingTypes.map((t) => ({
        ...t,
        yearlyQuota: Number(t.yearlyQuota) || 0,
        maxConsecutiveDays:
          t.maxConsecutiveDays === null || t.maxConsecutiveDays === ""
            ? null
            : Number(t.maxConsecutiveDays),
      }));

      const response = await fetch("/api/leave/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveTypes: sanitized }),
      });

      const data = await response.json();

      if (data.success) {
        setLeavePolicy(data.policy);
        setEditingTypes(data.policy.leaveTypes || []);
        alert("Leave system updated successfully");
      } else {
        alert(data.error || "Failed to update leave system");
      }
    } catch (error) {
      console.error("Failed to save leave policy:", error);
      alert("Failed to update leave system");
    } finally {
      setPolicySaving(false);
    }
  };

  const handleUpdateLeaveBalance = async () => {
    if (!balanceForm.employeeId) {
      alert("Please select an employee");
      return;
    }

    try {
      setBalanceSaving(true);
      const response = await fetch("/api/employee/update-leave-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: balanceForm.employeeId,
          casual: balanceForm.casual,
          sick: balanceForm.sick,
          annual: balanceForm.annual,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Leave balance updated successfully");
        setBalanceForm({ employeeId: "", casual: 10, sick: 10, annual: 15 });
      } else {
        alert(data.error || "Failed to update leave balance");
      }
    } catch (error) {
      console.error("Failed to update leave balance:", error);
      alert("Failed to update leave balance");
    } finally {
      setBalanceSaving(false);
    }
  };

  const handleApproveReject = async (
    leaveId: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ) => {
    setProcessing(leaveId);
    try {
      const response = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId,
          action,
          rejectionReason,
          approvedBy: "Admin",
        }),
      });

      const data = await response.json();

      if (data.success) {
        loadLeaves();
      } else {
        alert(data.error || "Failed to process leave request");
      }
    } catch (error) {
      console.error("Failed to process leave:", error);
      alert("Failed to process leave request");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "Rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const pendingRequestsCount = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedRequestsCount = leaveRequests.filter((r) => r.status === "approved").length;

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
              <Link
                href="/employee-management"
                className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block"
              >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-500">{pendingRequestsCount}</div>
                <div className="text-sm text-muted-foreground">Pending Requests</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-500">{approvedRequestsCount}</div>
                <div className="text-sm text-muted-foreground">Approved Requests</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6 space-y-12">
            {/* Leave System Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Leave System Configuration</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadLeavePolicy}
                    disabled={policyLoading || policySaving}
                  >
                    {policyLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePolicy}
                    disabled={policySaving}
                  >
                    {policySaving ? "Saving..." : "Save Leave System"}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Define your company-specific leave types, yearly quotas, and rules like maximum
                consecutive days. These settings control what employees see in their portal.
              </p>

              <Card className="p-4 overflow-x-auto">
                {policyLoading && !leavePolicy ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading leave system...
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2">Code</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Yearly Quota (days)</th>
                        <th className="p-2">Max Consecutive Days</th>
                        <th className="p-2">Description</th>
                        <th className="p-2">Active</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingTypes.length === 0 ? (
                        <tr>
                          <td
                            className="p-4 text-center text-muted-foreground"
                            colSpan={7}
                          >
                            No leave types configured yet.
                          </td>
                        </tr>
                      ) : (
                        editingTypes.map((type, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="p-2 align-top">
                              <Input
                                value={type.code}
                                onChange={(e) =>
                                  handlePolicyFieldChange(index, "code", e.target.value)
                                }
                                placeholder="e.g. sick"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2 align-top">
                              <Input
                                value={type.name}
                                onChange={(e) =>
                                  handlePolicyFieldChange(index, "name", e.target.value)
                                }
                                placeholder="e.g. Sick Leave"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2 align-top">
                              <Input
                                type="number"
                                value={type.yearlyQuota}
                                onChange={(e) =>
                                  handlePolicyFieldChange(index, "yearlyQuota", e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2 align-top">
                              <Input
                                type="number"
                                value={
                                  type.maxConsecutiveDays === null
                                    ? ""
                                    : type.maxConsecutiveDays
                                }
                                onChange={(e) =>
                                  handlePolicyFieldChange(
                                    index,
                                    "maxConsecutiveDays",
                                    e.target.value,
                                  )
                                }
                                placeholder="No limit"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="p-2 align-top">
                              <Textarea
                                value={type.description || ""}
                                onChange={(e) =>
                                  handlePolicyFieldChange(index, "description", e.target.value)
                                }
                                rows={2}
                                className="text-xs"
                              />
                            </td>
                            <td className="p-2 align-top">
                              <input
                                type="checkbox"
                                checked={type.isActive !== false}
                                onChange={(e) =>
                                  handlePolicyFieldChange(index, "isActive", e.target.checked)
                                }
                              />
                            </td>
                            <td className="p-2 align-top">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLeaveType(index)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Tip: Use simple codes like <code>sick</code>, <code>casual</code>,
                    and <code>annual</code> so existing balances continue to work.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLeaveType}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Leave Type
                  </Button>
                </div>
              </Card>
            </div>

            {/* Leave Requests Section */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Leave Requests</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    {/* <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button> */}
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Request Leave</DialogTitle>
                      <DialogDescription>
                        Fill in the details for your leave request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="leave-type">Leave Type</Label>
                        <Select>
                          <SelectTrigger id="leave-type">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="personal">Personal Leave</SelectItem>
                            <SelectItem value="emergency">Emergency Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="from-date">From Date</Label>
                          <Input id="from-date" type="date" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="to-date">To Date</Label>
                          <Input id="to-date" type="date" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea id="reason" placeholder="Explain your reason for leave..." />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setOpen(false)}>Submit Request</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Leave Requests Table */}
              <Card>
                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">Loading leave requests...</p>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-muted-foreground">No leave requests found</div>
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
                          <th className="p-4 font-semibold">Reason</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests.map((request: any) => (
                          <tr
                            key={request._id}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="p-4 font-medium">{request.employeeName}</td>
                            <td className="p-4 text-muted-foreground capitalize">
                              {request.leaveType}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(request.fromDate).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(request.toDate).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-muted-foreground">{request.days}</td>
                            <td className="p-4 text-muted-foreground text-sm max-w-xs truncate">
                              {request.reason}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(
                                  request.status.charAt(0).toUpperCase() +
                                    request.status.slice(1),
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    request.status === "approved"
                                      ? "text-green-600"
                                      : request.status === "pending"
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {request.status.charAt(0).toUpperCase() +
                                    request.status.slice(1)}
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
                                    onClick={() =>
                                      handleApproveReject(request._id, "approve")
                                    }
                                    disabled={processing === request._id}
                                  >
                                    {processing === request._id ? "Processing..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => {
                                      const reason = prompt(
                                        "Enter rejection reason (optional):",
                                      );
                                      if (reason !== null) {
                                        handleApproveReject(
                                          request._id,
                                          "reject",
                                          reason || undefined,
                                        );
                                      }
                                    }}
                                    disabled={processing === request._id}
                                  >
                                    Reject
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
                        ))}
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}