"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    Package2,
    Layout,
    Mail,
    Users,
    Receipt,
    Presentation,
    Megaphone,
    Calendar,
    CheckCircle,
    LogIn,
    MousePointerClick,
    FileText,
    Clock,
    MapPin,
    Factory,
    ShoppingCart,
    Zap,
    Target,
} from "lucide-react";
import Link from "next/link";

export default function GuidePage() {
    const tableOfContents = [
        { id: "getting-started", label: "Getting Started", icon: LogIn },
        { id: "inventory", label: "Inventory Management", icon: Package2 },
        { id: "landing-page", label: "Landing Page Builder", icon: Layout },
        { id: "email", label: "Email Automation", icon: Mail },
        { id: "employees", label: "Employee Management", icon: Users },
        { id: "accounting", label: "Accounting", icon: Receipt },
        { id: "presentations", label: "AI Presentations", icon: Presentation },
        { id: "marketing", label: "Marketing AI", icon: Megaphone },
        { id: "appointments", label: "Appointment Scheduling", icon: Calendar },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_70%)]" />

                    <div className="container relative px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center text-center max-w-4xl mx-auto"
                        >
                            <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Platform Guide
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                How to Use
                                <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                    Business Accelerator
                                </span>
                            </h1>

                            <p className="text-xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                                Your complete guide to unlocking the full potential of our AI-powered business tools.
                                From invoices to presentations, everything you need to grow your business.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Table of Contents */}
                <section className="py-12 bg-muted/30">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="max-w-4xl mx-auto"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">Quick Navigation</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {tableOfContents.map((item) => (
                                    <motion.a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        variants={itemVariants}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-center group"
                                    >
                                        <item.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Guide Sections */}
                <section className="py-16">
                    <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-20">

                        {/* Getting Started */}
                        <GuideSection
                            id="getting-started"
                            icon={<LogIn className="w-8 h-8" />}
                            title="Getting Started"
                            description="Create your account and start using the platform in minutes."
                            accentColor="from-blue-500 to-cyan-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Create Account", description: "Click 'Join' in the navbar and sign up with your email or Google account." },
                                { step: 2, title: "Complete Profile", description: "Add your business details to personalize your experience." },
                                { step: 3, title: "Explore Features", description: "Click 'Get Started' to see all available tools and select the one you need." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/get-started">
                                    <Button className="gap-2">
                                        Explore All Features <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Inventory Management */}
                        <GuideSection
                            id="inventory"
                            icon={<Package2 className="w-8 h-8" />}
                            title="Inventory Management"
                            description="Track stock, manage costs, and optimize your operations with powerful real-time tools."
                            accentColor="from-emerald-500 to-teal-500"
                        >
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <FeatureCard
                                    icon={<ShoppingCart className="w-5 h-5" />}
                                    title="Trading Inventory"
                                    features={["Buy & sell tracking", "Profit margin analysis", "Stock management", "Expiry alerts"]}
                                />
                                <FeatureCard
                                    icon={<Factory className="w-5 h-5" />}
                                    title="Manufacturing Inventory"
                                    features={["Raw materials management", "Bill of Materials (BOM)", "Production tracking", "Cost analysis"]}
                                />
                            </div>
                            <StepList steps={[
                                { step: 1, title: "Choose Your Type", description: "Select Trading (buy/sell) or Manufacturing (produce/sell) based on your business model." },
                                { step: 2, title: "Add Products", description: "Enter your products with cost prices, selling prices, and stock quantities." },
                                { step: 3, title: "Track Operations", description: "Record purchases, sales, and monitor profit margins in real-time." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/inventory-management">
                                    <Button className="gap-2">
                                        Open Inventory <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Landing Page Builder */}
                        <GuideSection
                            id="landing-page"
                            icon={<Layout className="w-8 h-8" />}
                            title="Landing Page Builder"
                            description="Create stunning, high-converting landing pages with AI. No coding required."
                            accentColor="from-blue-500 to-purple-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Create Workspace", description: "Click 'New' to start a fresh landing page project." },
                                { step: 2, title: "Enter Business Details", description: "Describe your business, target audience, and preferred color scheme." },
                                { step: 3, title: "AI Generates Your Page", description: "Watch as AI creates a complete, professional landing page in seconds." },
                                { step: 4, title: "Refine with Chat", description: "Type requests like 'Add a testimonials section' or 'Change the hero image' to customize." },
                                { step: 5, title: "Use Version History", description: "Undo/redo changes and switch between different versions of your design." },
                                { step: 6, title: "Export & Deploy", description: "Download the code or deploy directly to your hosting." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/landing-page-builder">
                                    <Button className="gap-2">
                                        Try Page Builder <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Email Automation */}
                        <GuideSection
                            id="email"
                            icon={<Mail className="w-8 h-8" />}
                            title="Email Automation"
                            description="Create, manage, and automate professional email campaigns with enterprise-grade delivery."
                            accentColor="from-orange-500 to-red-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Upload Recipients", description: "Import your contact list via CSV file with email addresses and custom fields." },
                                { step: 2, title: "Design Your Email", description: "Use the rich text editor to create beautiful emails. Insert personalization tags like {{name}}." },
                                { step: 3, title: "Add Call-to-Action", description: "Include CTA buttons with tracking to measure click-through rates." },
                                { step: 4, title: "Send Test Email", description: "Preview your campaign by sending a test to yourself first." },
                                { step: 5, title: "Start Campaign", description: "Launch your campaign. Emails are sent at optimal intervals (max 50/day for deliverability)." },
                                { step: 6, title: "Track Analytics", description: "Monitor open rates, clicks, and campaign performance in the analytics dashboard." },
                            ]} />
                            <div className="mt-6 flex gap-3 flex-wrap">
                                <Link href="/get-started/email-automation">
                                    <Button className="gap-2">
                                        Start Campaign <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/email-analytics">
                                    <Button variant="outline" className="gap-2">
                                        View Analytics
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Employee Management */}
                        <GuideSection
                            id="employees"
                            icon={<Users className="w-8 h-8" />}
                            title="Employee Management"
                            description="Streamline HR operations with AI-powered attendance, leave management, and tracking."
                            accentColor="from-purple-500 to-pink-500"
                        >
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                <FeatureCard
                                    icon={<Clock className="w-5 h-5" />}
                                    title="Attendance"
                                    features={["Real-time tracking", "Email-based check-in", "Automated reports"]}
                                />
                                <FeatureCard
                                    icon={<Calendar className="w-5 h-5" />}
                                    title="Leave System"
                                    features={["Leave requests", "Approval workflow", "Balance tracking"]}
                                />
                                <FeatureCard
                                    icon={<MapPin className="w-5 h-5" />}
                                    title="Live Tracking"
                                    features={["GPS location", "Geofencing", "Movement history"]}
                                />
                            </div>
                            <StepList steps={[
                                { step: 1, title: "Register Employees", description: "Add employee details including name, email, and department." },
                                { step: 2, title: "Employee Gets Email", description: "Each employee receives an email with their unique attendance link." },
                                { step: 3, title: "Mark Attendance", description: "Employees use their link to check-in/out daily - no app installation needed." },
                                { step: 4, title: "Monitor Dashboard", description: "View attendance reports, approve leave requests, and track locations in real-time." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/employee-management">
                                    <Button className="gap-2">
                                        Manage Employees <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Accounting */}
                        <GuideSection
                            id="accounting"
                            icon={<Receipt className="w-8 h-8" />}
                            title="Accounting & Finance"
                            description="Generate professional invoices and quotations with AI-powered automation."
                            accentColor="from-cyan-500 to-blue-500"
                        >
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <FeatureCard
                                    icon={<FileText className="w-5 h-5" />}
                                    title="Invoice Management"
                                    features={["Professional templates", "Auto calculations", "Payment tracking", "PDF export"]}
                                />
                                <FeatureCard
                                    icon={<Target className="w-5 h-5" />}
                                    title="Quotation System"
                                    features={["Smart pricing", "Custom templates", "Convert to invoice", "Client sharing"]}
                                />
                            </div>
                            <StepList steps={[
                                { step: 1, title: "Select Document Type", description: "Choose between Invoice or Quotation based on your needs." },
                                { step: 2, title: "Enter Details", description: "Add client information, line items, quantities, and prices." },
                                { step: 3, title: "Customize", description: "Add your logo, terms, and adjust the layout as needed." },
                                { step: 4, title: "Generate & Share", description: "Download as PDF or send directly to your client." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/accounting">
                                    <Button className="gap-2">
                                        Create Invoice <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* AI Presentations */}
                        <GuideSection
                            id="presentations"
                            icon={<Presentation className="w-8 h-8" />}
                            title="AI Presentations"
                            description="Generate professional presentations in seconds. Just describe your topic and let AI do the rest."
                            accentColor="from-yellow-500 to-orange-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Describe Your Topic", description: "Enter your presentation topic and key points you want to cover." },
                                { step: 2, title: "AI Creates Slides", description: "AI generates a complete presentation with professional layouts and relevant images." },
                                { step: 3, title: "Review & Edit", description: "Customize the content, reorder slides, or regenerate specific sections." },
                                { step: 4, title: "Export to PowerPoint", description: "Download your presentation as a .pptx file ready to present." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/presentations">
                                    <Button className="gap-2">
                                        Create Presentation <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Marketing AI */}
                        <GuideSection
                            id="marketing"
                            icon={<Megaphone className="w-8 h-8" />}
                            title="Marketing AI"
                            description="Plan and execute marketing campaigns with AI-powered insights and automation."
                            accentColor="from-pink-500 to-rose-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Define Your Campaign", description: "Enter your product, target audience, and campaign goals." },
                                { step: 2, title: "AI Generates Strategy", description: "Get a complete marketing plan with channel recommendations and content ideas." },
                                { step: 3, title: "Execute & Track", description: "Implement the suggestions and monitor performance." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/marketing-ai">
                                    <Button className="gap-2">
                                        Plan Campaign <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                        {/* Appointment Scheduling */}
                        <GuideSection
                            id="appointments"
                            icon={<Calendar className="w-8 h-8" />}
                            title="Appointment Scheduling"
                            description="Auto-schedule meetings, send reminders, and sync with Google Calendar effortlessly."
                            accentColor="from-indigo-500 to-purple-500"
                        >
                            <StepList steps={[
                                { step: 1, title: "Connect Calendar", description: "Link your Google Calendar for automatic sync." },
                                { step: 2, title: "Set Availability", description: "Define your working hours and meeting preferences." },
                                { step: 3, title: "Share Booking Link", description: "Give clients your booking link for self-scheduling." },
                                { step: 4, title: "Automatic Reminders", description: "Both you and your clients receive reminders before appointments." },
                            ]} />
                            <div className="mt-6">
                                <Link href="/appointment-scheduling">
                                    <Button className="gap-2">
                                        Setup Scheduling <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </GuideSection>

                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center max-w-2xl mx-auto"
                        >
                            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                            <p className="text-muted-foreground mb-8">
                                Explore all our AI-powered business tools and transform the way you work.
                            </p>
                            <Link href="/get-started">
                                <Button size="lg" className="gap-2">
                                    <Zap className="w-5 h-5" />
                                    Explore All Features
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

// Guide Section Component
function GuideSection({
    id,
    icon,
    title,
    description,
    accentColor,
    children,
}: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentColor: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="scroll-mt-24"
        >
            <Card className="p-8 border border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${accentColor} text-white shrink-0`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>
                {children}
            </Card>
        </motion.div>
    );
}

// Step List Component
function StepList({ steps }: { steps: { step: number; title: string; description: string }[] }) {
    return (
        <div className="space-y-4">
            {steps.map((item) => (
                <div key={item.step} className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                        {item.step}
                    </div>
                    <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Feature Card Component
function FeatureCard({
    icon,
    title,
    features,
}: {
    icon: React.ReactNode;
    title: string;
    features: string[];
}) {
    return (
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-primary">{icon}</div>
                <h4 className="font-semibold">{title}</h4>
            </div>
            <ul className="space-y-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-primary" />
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    );
}
