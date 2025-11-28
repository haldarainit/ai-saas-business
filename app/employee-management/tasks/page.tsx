"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { FileText, Plus, Download, BarChart3, CheckSquare, Clock, TrendingUp } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

export default function TasksAndReports() {
  const [open, setOpen] = useState(false);

  const tasks = [
    { id: 1, title: "Complete Performance Reviews", assignee: "HR Manager", deadline: "Nov 30", status: "In Progress", progress: 60 },
    { id: 2, title: "Update Employee Handbook", assignee: "HR Admin", deadline: "Dec 5", status: "Not Started", progress: 0 },
    { id: 3, title: "Organize Team Building Event", assignee: "HR Coordinator", deadline: "Dec 15", status: "In Progress", progress: 40 },
    { id: 4, title: "Process Q4 Bonuses", assignee: "Payroll Manager", deadline: "Dec 20", status: "Completed", progress: 100 },
  ];

  const reports = [
    { id: 1, name: "Monthly Attendance Report", date: "Nov 2025", downloads: 45, type: "Attendance" },
    { id: 2, name: "Payroll Summary Q4", date: "Oct-Dec 2025", downloads: 32, type: "Payroll" },
    { id: 3, name: "Employee Turnover Analysis", date: "2025", downloads: 28, type: "Analytics" },
    { id: 4, name: "Leave Balance Report", date: "Nov 2025", downloads: 51, type: "Leave" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-500/20";
      case "In Progress":
        return "text-blue-600 bg-blue-500/20";
      case "Not Started":
        return "text-gray-600 bg-gray-500/20";
      default:
        return "text-gray-600 bg-gray-500/20";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-purple-500/5 via-background to-violet-500/5">
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
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Tasks & Reports</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Manage HR tasks, track progress, and generate comprehensive reports with analytics.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-500">12</div>
                <div className="text-sm text-muted-foreground">Active Tasks</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-500">8</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-500">24</div>
                <div className="text-sm text-muted-foreground">Reports Generated</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-orange-500">92%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tasks Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">HR Tasks</h2>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                          Assign a new task to your HR team.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="task-title">Task Title</Label>
                          <Input id="task-title" placeholder="Enter task title..." />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="assignee">Assign To</Label>
                          <Select>
                            <SelectTrigger id="assignee">
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">HR Manager</SelectItem>
                              <SelectItem value="admin">HR Admin</SelectItem>
                              <SelectItem value="coordinator">HR Coordinator</SelectItem>
                              <SelectItem value="payroll">Payroll Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input id="deadline" type="date" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="Task details..." />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setOpen(false)}>Create Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{task.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-4 h-4" />
                              {task.assignee}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {task.deadline}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Reports Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Generated Reports</h2>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>

                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              {report.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {report.downloads} downloads
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{report.date}</div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6">
                <CheckSquare className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Task Assignment</h3>
                <p className="text-sm text-muted-foreground">
                  Assign and track HR tasks with deadlines and progress monitoring.
                </p>
              </Card>
              <Card className="p-6">
                <BarChart3 className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize HR metrics and KPIs with interactive charts and graphs.
                </p>
              </Card>
              <Card className="p-6">
                <FileText className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Custom Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate custom reports tailored to your specific business needs.
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
