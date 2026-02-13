"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { motion, Variants } from "framer-motion";
import {
    ArrowRight,
    CheckCircle,
    Package2,
    Layout,
    Megaphone,
    MessageSquare,
    Presentation,
    Mail,
    Users,
    Receipt,
    Calendar,
    Zap,
    Star,
} from "lucide-react";
import Link from "next/link";

export default function Features() {
    const features = [
        {
            icon: <Receipt className="w-6 h-6" />,
            title: "Accounting & Finance",
            description: "Generate professional invoices and quotations with AI-powered automation and instant PDF export.",
            benefits: ["Invoice Generator", "Quotation System", "GST Ready", "PDF Export"],
            gradient: "from-cyan-500 to-blue-600",
            shadowColor: "shadow-cyan-500/20",
            link: "/accounting",
            popular: true,
        },
        {
            icon: <Presentation className="w-6 h-6" />,
            title: "AI Presentations",
            description: "Generate complete, professional presentations in seconds. Just describe your topic.",
            benefits: ["Instant Generation", "Professional Layouts", "Auto Images", "PowerPoint Export"],
            gradient: "from-amber-500 to-orange-600",
            shadowColor: "shadow-amber-500/20",
            link: "/presentations",
            popular: true,
        },
        {
            icon: <Mail className="w-6 h-6" />,
            title: "Email Automation",
            description: "Launch personalized email campaigns at scale with intelligent scheduling and analytics.",
            benefits: ["Campaign Manager", "CSV Import", "Click Tracking", "Analytics Dashboard"],
            gradient: "from-orange-500 to-red-600",
            shadowColor: "shadow-orange-500/20",
            link: "/get-started/email-automation",
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "Employee Management",
            description: "Streamline HR with attendance tracking, leave management, and real-time GPS monitoring.",
            benefits: ["Attendance System", "Leave Management", "Live Tracking", "Automated Reports"],
            gradient: "from-purple-500 to-pink-600",
            shadowColor: "shadow-purple-500/20",
            link: "/employee-management",
        },
        {
            icon: <Package2 className="w-6 h-6" />,
            title: "Inventory Management",
            description: "Track stock levels, manage costs, and optimize operations for trading or manufacturing.",
            benefits: ["Real-time Stock", "Profit Analysis", "Low Stock Alerts", "BOM Support"],
            gradient: "from-emerald-500 to-teal-600",
            shadowColor: "shadow-emerald-500/20",
            link: "/inventory-management",
        },
        {
            icon: <Layout className="w-6 h-6" />,
            title: "Landing Page Builder",
            description: "Create stunning, high-converting landing pages with AI. Just describe and watch it build.",
            benefits: ["AI-Powered Design", "Drag & Drop", "Version History", "Instant Deploy"],
            gradient: "from-blue-500 to-indigo-600",
            shadowColor: "shadow-blue-500/20",
            link: "/builder",
        },
        {
            icon: <Megaphone className="w-6 h-6" />,
            title: "Marketing AI",
            description: "Plan and execute marketing campaigns with AI-powered insights and strategy recommendations.",
            benefits: ["Campaign Planner", "AI Insights", "Strategy Builder"],
            gradient: "from-pink-500 to-rose-600",
            shadowColor: "shadow-pink-500/20",
            link: "/marketing-ai",
        },
        {
            icon: <Calendar className="w-6 h-6" />,
            title: "Appointment Scheduling",
            description: "Auto-schedule meetings, send reminders, and sync with Google Calendar effortlessly.",
            benefits: ["Calendar Sync", "Auto Reminders", "Smart Scheduling", "Client Booking"],
            gradient: "from-indigo-500 to-violet-600",
            shadowColor: "shadow-indigo-500/20",
            link: "/appointment-scheduling",
        },
        {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "Sales AI",
            description: "AI-powered sales acceleration with intelligent scripts and conversation templates.",
            benefits: ["Sales Scripts", "AI Assistance", "Templates"],
            gradient: "from-sky-500 to-cyan-600",
            shadowColor: "shadow-sky-500/20",
            link: "/sales-ai",
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        },
    };

    return (
        <>
            <StructuredData />
            <div className="flex min-h-screen flex-col bg-background">
                <Navbar />

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative py-20 lg:py-28 overflow-hidden">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,119,198,0.1),transparent_50%)]" />

                        {/* Subtle Grid Pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.02]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />

                        <div className="container relative px-4 md:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="flex flex-col items-center text-center max-w-4xl mx-auto"
                            >
                                {/* Main Heading */}
                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                                    <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Your Complete
                                    </span>
                                    <br />
                                    <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                                        Business Toolkit
                                    </span>
                                </h1>

                                {/* Subtitle */}
                                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                                    From invoices to presentations, email campaigns to employee management—everything powered by AI to help you work smarter.
                                </p>

                                {/* Quick Start Guide */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl px-6 sm:px-8 py-5 mb-4 shadow-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
                                            1
                                        </div>
                                        <span className="text-sm font-medium">Choose a tool below</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
                                            2
                                        </div>
                                        <span className="text-sm font-medium">Start using it instantly</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className="py-16 lg:py-24 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

                        <div className="container relative px-4 md:px-6">
                            {/* Section Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="text-center mb-14"
                            >
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                    Everything You Need
                                </h2>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                    Select any tool to start automating your business operations today.
                                </p>
                            </motion.div>

                            {/* Cards Grid */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-7xl mx-auto"
                            >
                                {features.map((feature, index) => (
                                    <motion.div key={index} variants={cardVariants}>
                                        <Link href={feature.link} className="block h-full">
                                            <Card className={`group relative h-full overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50 p-0 transition-all duration-500 hover:shadow-2xl ${feature.shadowColor} hover:border-border hover:-translate-y-1`}>
                                                {/* Popular Badge */}
                                                {feature.popular && (
                                                    <div className="absolute top-4 right-4 z-20">
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                                            Popular
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Top Gradient Bar */}
                                                <div className={`h-1.5 w-full bg-gradient-to-r ${feature.gradient}`} />

                                                <div className="p-6">
                                                    {/* Icon */}
                                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-3.5 text-white mb-5 shadow-lg ${feature.shadowColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                        {feature.icon}
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                                                        {feature.title}
                                                    </h3>

                                                    {/* Description */}
                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                                                        {feature.description}
                                                    </p>

                                                    {/* Benefits */}
                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                        {feature.benefits.map((benefit, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 text-xs font-medium text-muted-foreground"
                                                            >
                                                                <CheckCircle className="w-3 h-3 text-primary" />
                                                                {benefit}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* CTA */}
                                                    <div className={`flex items-center justify-between pt-4 border-t border-border/50`}>
                                                        <span className="text-sm font-semibold text-primary group-hover:underline">
                                                            Open Tool
                                                        </span>
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-md`}>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Bottom CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="text-center mt-16"
                            >
                                <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Need help getting started?</span>
                                    </div>
                                    <Link href="/guide">
                                        <Button variant="default" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                                            View Our Guide
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}
