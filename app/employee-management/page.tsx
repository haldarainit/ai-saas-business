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
        <section className="relative py-20 lg:py-28 overflow-hidden">
          {/* Subtle background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          
          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">HR Management Suite</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Manage Your
                <span className="block bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Workforce Effortlessly
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                Attendance tracking, leave management, real-time GPS monitoring, and comprehensive HR analytics in one unified platform.
              </p>

              {/* CTA Button */}
              <Link href="/employee-management/register">
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                  <UserPlus className="w-5 h-5" />
                  Register Employee
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="py-16 lg:py-24 relative">
          <div className="container px-4 md:px-6">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Complete HR Solution
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your workforce efficiently and effectively.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
            >
              {employeeModules.map((module, index) => (
                <motion.div key={index} variants={cardVariants}>
                  <Link href={module.link}>
                    <Card className="group relative h-full overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-border/80">
                      <div className="p-6 flex flex-col h-full">
                        {/* Icon Container */}
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.iconColor === 'text-cyan-500' ? 'from-cyan-500 to-blue-600' : module.iconColor === 'text-orange-500' ? 'from-orange-500 to-red-600' : module.iconColor === 'text-blue-500' ? 'from-blue-500 to-indigo-600' : 'from-purple-500 to-pink-600'} flex items-center justify-center mb-5 text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                          <module.icon className="w-6 h-6" />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                          {module.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-grow">
                          {module.description}
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {module.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                              <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
