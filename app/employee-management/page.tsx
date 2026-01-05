"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Clock, DollarSign, Brain, Calendar, FileText, UserPlus, MapPin } from "lucide-react";
import Link from "next/link";

export default function EmployeeManagement() {
  const employeeModules = [
    {
      icon: Clock,
      title: "Attendance",
      description:
        "Track employee attendance with real-time monitoring, biometric integration, and automated reporting.",
      features: ["Real-time Tracking", "Biometric Integration", "Automated Reports", "Leave Balance"],
      accentColor: "rgba(34, 211, 238, 0.5)",
      iconColor: "text-cyan-500",
      link: "/employee-management/attendance",
    },
    // {
    //   icon: DollarSign,
    //   title: "Payroll",
    //   description:
    //     "Automate payroll processing with tax calculations, deductions, and direct deposit management.",
    //   features: ["Auto Calculations", "Tax Management", "Direct Deposits", "Salary Slips"],
    //   accentColor: "rgba(34, 197, 94, 0.5)",
    //   iconColor: "text-green-500",
    //   link: "/employee-management/payroll",
    // },
    // {
    //   icon: Brain,
    //   title: "HR AI Assistant",
    //   description:
    //     "AI-powered HR assistant to answer policy questions, handle queries, and provide instant support.",
    //   features: ["24/7 Availability", "Policy Guidance", "Query Resolution", "Smart Suggestions"],
    //   accentColor: "rgba(236, 72, 153, 0.5)",
    //   iconColor: "text-pink-500",
    //   link: "/employee-management/hr-ai",
    // },
    {
      icon: Calendar,
      title: "Leave System",
      description:
        "Streamline leave requests and approvals with automated workflows and balance tracking.",
      features: ["Leave Requests", "Approval Workflow", "Balance Tracking", "Calendar Sync"],
      accentColor: "rgba(249, 115, 22, 0.5)",
      iconColor: "text-orange-500",
      link: "/employee-management/leave",
    },
    // {
    //   icon: FileText,
    //   title: "Tasks & Reports",
    //   description:
    //     "Assign tasks, track progress, and generate comprehensive HR reports with analytics.",
    //   features: ["Task Assignment", "Progress Tracking", "Analytics Dashboard", "Custom Reports"],
    //   accentColor: "rgba(139, 92, 246, 0.5)",
    //   iconColor: "text-purple-500",
    //   link: "/employee-management/tasks",
    // },
    {
      icon: MapPin,
      title: "Live Tracking",
      description:
        "Real-time GPS tracking with activity monitoring, geofencing, and movement history analytics.",
      features: ["Live GPS", "Geofencing", "Activity Status", "Movement History"],
      accentColor: "rgba(59, 130, 246, 0.5)",
      iconColor: "text-blue-500",
      link: "/employee-management/tracking",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-background to-cyan-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.1),transparent_70%)]" />

          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-sm font-medium text-purple-500 mb-8">
                <CheckCircle className="w-4 h-4 mr-2" />
                AI-Powered HR Management
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Employee Management
                <span className="block bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8 leading-relaxed">
                Streamline your HR operations with our comprehensive suite of AI-powered tools for attendance, payroll, leave management, and more.
              </p>

              {/* How It Works Steps */}
              <div className="w-full max-w-4xl bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 mb-12">
                <h3 className="text-lg font-semibold text-center mb-6 text-foreground">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm shrink-0">
                      1
                    </div>
                    <span className="text-sm font-medium text-foreground">Register your employee</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm shrink-0">
                      2
                    </div>
                    <span className="text-sm font-medium text-foreground">Employee receives email with attendance link</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm shrink-0">
                      3
                    </div>
                    <span className="text-sm font-medium text-foreground">Employee uses the link to mark attendance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-sm shrink-0">
                      4
                    </div>
                    <span className="text-sm font-medium text-foreground">Track attendance in the Attendance card</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/employee-management/register">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto">
                    <UserPlus className="mr-2 w-5 h-5" />
                    Register Employee
                  </Button>
                </Link>
                {/* <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  Watch Demo
                </Button> */}
              </div>

              {/* Stats */}
              {/* <div className="grid grid-cols-3 gap-8 mt-16 w-full max-w-2xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">500+</div>
                  <div className="text-sm text-muted-foreground">
                    Companies
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">50K+</div>
                  <div className="text-sm text-muted-foreground">
                    Employees
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">80%</div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
              </div> */}
            </motion.div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Complete HR Solution
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your workforce efficiently and effectively.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {employeeModules.map((module, index) => (
                <motion.div key={index} variants={cardVariants}>
                  <Link href={module.link}>
                    <Card className="group relative h-full overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 p-6">
                      {/* Background gradient on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${module.accentColor}, transparent)`,
                        }}
                      />

                      <div className="relative h-full flex flex-col">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${module.iconColor.replace('text-', '')}/20 to-${module.iconColor.replace('text-', '')}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <module.icon className={`w-7 h-7 ${module.iconColor} group-hover:text-white transition-colors duration-300`} />
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-white transition-colors duration-300">
                          {module.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow group-hover:text-white/90 transition-colors duration-300">
                          {module.description}
                        </p>

                        {/* Features */}
                        <div className="space-y-2 mb-6">
                          {module.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center text-xs text-muted-foreground group-hover:text-white/90 transition-colors duration-300"
                            >
                              <CheckCircle
                                className={`w-3 h-3 mr-2 ${module.iconColor} group-hover:text-white/80`}
                              />
                              {feature}
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button
                          variant="ghost"
                          className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm py-3 h-auto font-medium"
                        >
                          Explore Module
                          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom CTA */}
            {/* <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center mt-20"
            >
              <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-cyan-500/10 rounded-3xl p-12 border border-purple-500/20">
                <h3 className="text-3xl font-bold mb-4">
                  Ready to Modernize Your HR?
                </h3>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join hundreds of companies that trust our platform for their employee management needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 h-auto"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </motion.div> */}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
