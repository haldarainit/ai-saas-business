"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    Bell,
    Users,
    CalendarCheck,
    RefreshCw,
    MessageSquare,
    CheckCircle,
    ArrowRight,
    Sparkles,
    Zap,
    Shield,
    Globe,
    Smartphone,
    Video,
    Mail,
    Settings,
    BarChart3,
    CalendarDays,
    CalendarPlus,
    CalendarX,
    Link2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AppointmentScheduling() {
    const schedulingFeatures = [
        // {
        //     icon: <CalendarPlus className="w-8 h-8" />,
        //     title: "Smart Auto-Scheduling",
        //     description:
        //         "AI-powered scheduling that finds the perfect time for everyone. Our intelligent algorithm considers availability, preferences, and time zones to suggest optimal meeting times.",
        //     features: ["AI Time Optimization", "Conflict Detection", "Smart Suggestions"],
        //     image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80",
        //     accentColor: "rgba(99, 102, 241, 0.5)",
        //     iconColor: "text-indigo-500",
        // },
        // {
        //     icon: <Bell className="w-8 h-8" />,
        //     title: "Automated Reminders",
        //     description:
        //         "Never miss an appointment again. Send customizable email and SMS reminders to reduce no-shows by up to 80%.",
        //     features: ["Email Notifications", "SMS Reminders", "Custom Templates"],
        //     image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        //     accentColor: "rgba(236, 72, 153, 0.5)",
        //     iconColor: "text-pink-500",
        // },
        // {
        //     icon: <CalendarX className="w-8 h-8" />,
        //     title: "Easy Cancellations",
        //     description:
        //         "Hassle-free rescheduling and cancellation management. Automatically notify attendees and update all synced calendars.",
        //     features: ["One-Click Cancel", "Auto-Reschedule", "Waitlist Management"],
        //     image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        //     accentColor: "rgba(239, 68, 68, 0.5)",
        //     iconColor: "text-red-500",
        // },
        // {
        //     icon: <RefreshCw className="w-8 h-8" />,
        //     title: "Calendar Sync",
        //     description:
        //         "Seamlessly sync with Google Calendar, Outlook, Apple Calendar, and more. Real-time bi-directional sync keeps everything updated.",
        //     features: ["Google Calendar", "Outlook Integration", "Apple Calendar"],
        //     image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
        //     accentColor: "rgba(34, 197, 94, 0.5)",
        //     iconColor: "text-green-500",
        // },
        // {
        //     icon: <MessageSquare className="w-8 h-8" />,
        //     title: "Chat Booking",
        //     description:
        //         "Let customers book appointments through conversational AI chatbots. Available 24/7 on your website or messaging platforms.",
        //     features: ["AI Chatbot", "Website Widget", "WhatsApp Integration"],
        //     image: "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        //     accentColor: "rgba(59, 130, 246, 0.5)",
        //     iconColor: "text-blue-500",
        // },
        // {
        //     icon: <Video className="w-8 h-8" />,
        //     title: "Virtual Meetings",
        //     description:
        //         "Automatically generate Zoom, Google Meet, or Teams links for online appointments. One-click join for attendees.",
        //     features: ["Zoom Integration", "Google Meet", "Microsoft Teams"],
        //     image: "https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        //     accentColor: "rgba(139, 92, 246, 0.5)",
        //     iconColor: "text-purple-500",
        // },
    ];

    const stats = [
        { value: "85%", label: "Reduction in No-Shows" },
        { value: "3x", label: "Faster Booking" },
        { value: "24/7", label: "Available to Book" },
        { value: "100+", label: "Calendar Integrations" },
    ];

    const calendarIntegrations = [
        { name: "Google Calendar", icon: "/google-calendar.svg", color: "#4285F4" },
        { name: "Outlook", icon: "/outlook.svg", color: "#0078D4" },
        { name: "Apple Calendar", icon: "/apple-calendar.svg", color: "#FF3B30" },
        { name: "Zoom", icon: "/zoom.svg", color: "#2D8CFF" },
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
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <StructuredData />
            <div className="flex min-h-screen flex-col">
                <Navbar />

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative py-24 overflow-hidden">
                        {/* Animated background gradients */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5" />
                        <motion.div
                            className="absolute inset-0"
                            animate={{
                                background: [
                                    "radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15), transparent 50%)",
                                    "radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15), transparent 50%)",
                                    "radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.15), transparent 50%)",
                                ],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                        />

                        {/* Floating calendar icons */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-indigo-500/10"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                    }}
                                    animate={{
                                        y: [0, -30, 0],
                                        rotate: [0, 10, -10, 0],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 4 + i,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                    }}
                                >
                                    <Calendar className="w-12 h-12" />
                                </motion.div>
                            ))}
                        </div>

                        <div className="container relative px-4 md:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col items-center text-center max-w-5xl mx-auto"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 px-6 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-8 backdrop-blur-sm"
                                >
                                    <CalendarCheck className="w-4 h-4 mr-2" />
                                    <span>AI-Powered Appointment Scheduling</span>
                                    <Sparkles className="w-4 h-4 ml-2 text-purple-500" />
                                </motion.div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                                    <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Smart Scheduling,
                                    </span>
                                    <br />
                                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        Zero Hassle
                                    </span>
                                </h1>

                                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                                    Auto-schedule meetings, send intelligent reminders, handle
                                    cancellations, and sync with all major calendars. Let customers
                                    book appointments through chat or forms without manual
                                    coordination.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                                    <Link href="/appointment-scheduling/dashboard">
                                        <Button
                                            size="lg"
                                            className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                                        >
                                            Get Started Free
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </Link>
                                    {/* <Button
                                        variant="outline"
                                        size="lg"
                                        className="text-lg px-8 py-6 h-auto border-indigo-500/30 hover:bg-indigo-500/10"
                                    >
                                        <Video className="mr-2 w-5 h-5" />
                                        Watch Demo
                                    </Button> */}
                                </div>

                                {/* Stats Grid */}
                                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl">
                                    {stats.map((stat, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + index * 0.1 }}
                                            className="relative group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                                            <div className="relative bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center hover:border-indigo-500/30 transition-all">
                                                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    {stat.value}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {stat.label}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div> */}
                            </motion.div>
                        </div>
                    </section>

                    {/* Features Grid Section */}
                    <section className="py-24 bg-muted/30 relative overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

                        <div className="container px-4 md:px-6 relative">
                            {/* <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <Badge className="mb-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                                    Features
                                </Badge>
                                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                    Everything You Need for{" "}
                                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        Perfect Scheduling
                                    </span>
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                    Powerful features designed to automate your appointment
                                    management and delight your customers.
                                </p>
                            </motion.div> */}

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {schedulingFeatures.map((feature, index) => (
                                    <motion.div key={index} variants={cardVariants}>
                                        <Card className="group relative h-full overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-2 pt-0">
                                            {/* Gradient overlay on hover */}
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{
                                                    background: `linear-gradient(135deg, ${feature.accentColor}, transparent)`,
                                                }}
                                            />

                                            <div className="relative h-full flex flex-col">
                                                {/* Image */}
                                                <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
                                                    <Image
                                                        src={feature.image}
                                                        alt={feature.title}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                                                    {/* Floating Icon */}
                                                    {/* <div className="absolute bottom-4 left-4">
                                                        <div
                                                            className={`p-3 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}
                                                        >
                                                            {feature.icon}
                                                        </div>
                                                    </div> */}
                                                </div>

                                                <div className="p-6 flex-grow flex flex-col">
                                                    {/* <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-white transition-colors duration-300">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow group-hover:text-white/80 transition-colors duration-300">
                                                        {feature.description}
                                                    </p> */}

                                                    {/* Feature tags */}
                                                    {/* <div className="flex flex-wrap gap-2 mb-4">
                                                        {feature.features.map((feat, i) => (
                                                            <Badge
                                                                key={i}
                                                                variant="secondary"
                                                                className="text-xs group-hover:bg-white/20 group-hover:text-white transition-colors"
                                                            >
                                                                {feat}
                                                            </Badge>
                                                        ))}
                                                    </div> */}

                                                    {/* <Button
                                                        variant="ghost"
                                                        className="w-full justify-between group/btn hover:bg-indigo-500 hover:text-white transition-all duration-300"
                                                    >
                                                        Learn More
                                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Button> */}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </section>

                    {/* Google Calendar Integration Section */}
                    {/* <section className="py-24 relative overflow-hidden"> */}
                        {/* <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5" /> */}

                        {/* <div className="container px-4 md:px-6 relative"> */}
                            {/* <div className="grid lg:grid-cols-2 gap-16 items-center"> */}
                                {/* <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <Badge className="mb-4 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                        <Link2 className="w-3 h-3 mr-1" />
                                        Integrations
                                    </Badge>
                                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                        Seamless{" "}
                                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                                            Google Calendar
                                        </span>{" "}
                                        Integration
                                    </h2>
                                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                                        Connect your Google Calendar in seconds and enjoy real-time
                                        bi-directional sync. All your appointments, meetings, and
                                        events stay perfectly synchronized across all devices.
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {[
                                            "Real-time bi-directional sync",
                                            "Automatic conflict detection",
                                            "Multi-calendar support",
                                            "Works with Google Workspace",
                                        ].map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.2 + index * 0.1 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="p-1 rounded-full bg-green-500/10">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                </div>
                                                <span className="text-muted-foreground">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <Button
                                        size="lg"
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                    >
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M19.0001 3H5.00006C3.90006 3 3.00006 3.9 3.00006 5V19C3.00006 20.1 3.90006 21 5.00006 21H19.0001C20.1001 21 21.0001 20.1 21.0001 19V5C21.0001 3.9 20.1001 3 19.0001 3ZM19.0001 5V7H5.00006V5H19.0001ZM19.0001 19H5.00006V9H19.0001V19ZM7.00006 11H12.0001V16H7.00006V11Z"
                                            />
                                        </svg>
                                        Connect Google Calendar
                                    </Button>
                                </motion.div> */}

                                {/* <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    className="relative"
                                > */}
                                    {/* Calendar Preview Card */}
                                    {/* <div className="relative bg-background rounded-3xl shadow-2xl border border-border/50 overflow-hidden"> */}
                                        {/* Calendar Header */}
                                        {/* <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500">
                                            <div className="flex items-center justify-between text-white">
                                                <div>
                                                    <h3 className="text-2xl font-bold">December 2025</h3>
                                                    <p className="text-white/80">Your Schedule</p>
                                                </div>
                                                <CalendarDays className="w-10 h-10 text-white/80" />
                                            </div>
                                        </div> */}

                                        {/* Calendar Grid */}
                                        {/* <div className="p-6"> */}
                                            {/* <div className="grid grid-cols-7 gap-2 mb-4">
                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                                    (day) => (
                                                        <div
                                                            key={day}
                                                            className="text-center text-sm font-medium text-muted-foreground"
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                )}
                                            </div> */}

                                            {/* <div className="grid grid-cols-7 gap-2">
                                                {[...Array(31)].map((_, i) => {
                                                    const hasEvent = [3, 7, 12, 15, 20, 25].includes(i + 1);
                                                    const isToday = i + 1 === 15;

                                                    return (
                                                        <motion.div
                                                            key={i}
                                                            whileHover={{ scale: 1.1 }}
                                                            className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all ${isToday
                                                                    ? "bg-indigo-500 text-white"
                                                                    : hasEvent
                                                                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                                        : "hover:bg-muted"
                                                                }`}
                                                        >
                                                            {i + 1}
                                                            {hasEvent && !isToday && (
                                                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div> */}

                                            {/* Upcoming Events */}
                                            {/* <div className="mt-6 space-y-3">
                                                <h4 className="font-semibold text-sm text-muted-foreground">
                                                    Upcoming Appointments
                                                </h4>
                                                {[
                                                    {
                                                        time: "10:00 AM",
                                                        title: "Team Standup",
                                                        color: "bg-indigo-500",
                                                    },
                                                    {
                                                        time: "2:00 PM",
                                                        title: "Client Meeting",
                                                        color: "bg-purple-500",
                                                    },
                                                    {
                                                        time: "4:30 PM",
                                                        title: "Product Demo",
                                                        color: "bg-pink-500",
                                                    },
                                                ].map((event, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                                    >
                                                        <div
                                                            className={`w-2 h-10 rounded-full ${event.color}`}
                                                        />
                                                        <div>
                                                            <p className="font-medium text-sm">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {event.time}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div> */}
                                        {/* </div> */}
                                    {/* </div> */}

                                    {/* Floating notification */}
                                    {/* <motion.div
                                        initial={{ opacity: 0, y: 20, x: 20 }}
                                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="absolute -top-4 -right-4 bg-background rounded-2xl shadow-xl border border-border/50 p-4 max-w-[200px]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <Bell className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Reminder Sent!</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Meeting in 30 min
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div> */}
                                {/* </motion.div> */}
                            {/* </div> */}
                        {/* </div> */}
                    {/* </section> */}

                    {/* How It Works Section */}
                    {/* <section className="py-24 bg-muted/30">
                        <div className="container px-4 md:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <Badge className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                    How It Works
                                </Badge>
                                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                    Start Scheduling in{" "}
                                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        3 Simple Steps
                                    </span>
                                </h2>
                            </motion.div>

                            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {[
                                    {
                                        step: "01",
                                        icon: <Settings className="w-8 h-8" />,
                                        title: "Connect Your Calendar",
                                        description:
                                            "Link your Google Calendar, Outlook, or other calendars. We'll sync all your availability automatically.",
                                        color: "from-indigo-500 to-blue-500",
                                    },
                                    {
                                        step: "02",
                                        icon: <Globe className="w-8 h-8" />,
                                        title: "Share Your Booking Link",
                                        description:
                                            "Get a personalized booking page. Add it to your website, email signature, or share directly.",
                                        color: "from-purple-500 to-pink-500",
                                    },
                                    {
                                        step: "03",
                                        icon: <CheckCircle className="w-8 h-8" />,
                                        title: "Get Booked Automatically",
                                        description:
                                            "Clients book available slots. You get notified. Reminders go out automatically. Done!",
                                        color: "from-pink-500 to-red-500",
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.2 }}
                                        className="relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Card className="relative h-full bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all p-8 text-center">
                                            <div
                                                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-6 mx-auto`}
                                            >
                                                {item.icon}
                                            </div>
                                            <div className="text-6xl font-bold text-muted-foreground/20 absolute top-4 right-4">
                                                {item.step}
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                            <p className="text-muted-foreground">{item.description}</p>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section> */}

                    {/* CTA Section */}
                    {/* <section className="py-24 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />

                        <div className="container px-4 md:px-6 relative">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center max-w-3xl mx-auto"
                            >
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                    Ready to Transform Your Scheduling?
                                </h2>
                                <p className="text-xl text-white/80 mb-8">
                                    Join thousands of businesses saving hours every week with
                                    intelligent appointment scheduling.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/appointment-scheduling/dashboard">
                                        <Button
                                            size="lg"
                                            className="text-lg px-8 py-6 h-auto bg-white text-indigo-600 hover:bg-white/90"
                                        >
                                            Start Free Trial
                                            <ArrowRight className="ml-2 w-5 h-5" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="text-lg px-8 py-6 h-auto border-white/30 text-white hover:bg-white/10"
                                    >
                                        Schedule a Demo
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </section> */}
                </main>

                <Footer />
            </div>
        </>
    );
}
