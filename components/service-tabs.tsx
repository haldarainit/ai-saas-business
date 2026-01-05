"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface ServiceTab {
    id: string;
    label: string;
    title: string;
    steps: {
        title: string;
        description: string;
    }[];
    image: string;
}

const services: ServiceTab[] = [
    {
        id: "accounting",
        label: "Accounting",
        title: "Invoice & Quotation",
        steps: [
            {
                title: "Create New Document",
                description: "Click 'New Invoice' or 'New Quotation' to start. Choose from blank or use a saved template.",
            },
            {
                title: "Add Company & Client Details",
                description: "Fill in your company information and client details. These are saved for future use.",
            },
            {
                title: "Add Line Items",
                description: "Add products/services with quantities, rates, and tax. Totals calculate automatically.",
            },
            {
                title: "Export & Share",
                description: "Preview your document, download as PDF, or convert quotation to invoice with one click.",
            },
        ],
        image: "/screenshots/accounting.png",
    },
    {
        id: "presentations",
        label: "Presentations",
        title: "AI Presentations",
        steps: [
            {
                title: "Describe Your Topic",
                description: "Enter your presentation topic and key points you want to cover in the prompt box.",
            },
            {
                title: "AI Generates Slides",
                description: "Our AI creates a complete presentation with professional layouts and relevant content.",
            },
            {
                title: "Edit & Customize",
                description: "Modify text, rearrange slides, and customize the design to match your brand.",
            },
            {
                title: "Download PowerPoint",
                description: "Export your presentation as a .pptx file ready for presenting or sharing.",
            },
        ],
        image: "/screenshots/presentations.png",
    },
    {
        id: "email",
        label: "Email Automation",
        title: "Email Campaigns",
        steps: [
            {
                title: "Import Contacts",
                description: "Upload a CSV file with your recipient list including names and email addresses.",
            },
            {
                title: "Design Your Email",
                description: "Create your email using our template editor. Add images, links, and personalization.",
            },
            {
                title: "Set Campaign Details",
                description: "Add subject line, sender name, and schedule when to send your campaign.",
            },
            {
                title: "Launch & Track",
                description: "Send your campaign and monitor opens, clicks, and engagement in real-time.",
            },
        ],
        image: "/screenshots/email.png",
    },
    {
        id: "employee",
        label: "Employee Management",
        title: "HR & Attendance",
        steps: [
            {
                title: "Add Employees",
                description: "Register employees with their email, department, and role information.",
            },
            {
                title: "Daily Attendance",
                description: "Employees receive email links to check-in. GPS location is captured automatically.",
            },
            {
                title: "Manage Leave Requests",
                description: "Employees apply for leave through the system. Approve or reject with one click.",
            },
            {
                title: "View Reports",
                description: "Access attendance reports, track working hours, and monitor field staff location.",
            },
        ],
        image: "/screenshots/employee.png",
    },
    {
        id: "inventory",
        label: "Inventory",
        title: "Stock Management",
        steps: [
            {
                title: "Add Products",
                description: "Create your product catalog with SKU, pricing, and initial stock quantities.",
            },
            {
                title: "Record Transactions",
                description: "Log stock in/out movements. System updates quantities automatically.",
            },
            {
                title: "Set Alerts",
                description: "Configure low stock alerts to never run out of important items.",
            },
            {
                title: "Analyze & Report",
                description: "View profit margins, stock valuation, and movement history reports.",
            },
        ],
        image: "/screenshots/inventory.png",
    },
    {
        id: "landing",
        label: "Landing Pages",
        title: "AI Page Builder",
        steps: [
            {
                title: "Describe Your Business",
                description: "Tell the AI about your business, target audience, and what you want to achieve.",
            },
            {
                title: "AI Builds Your Page",
                description: "Watch as AI generates a complete, professional landing page in seconds.",
            },
            {
                title: "Chat to Edit",
                description: "Request changes conversationally. Say 'make the header blue' or 'add testimonials'.",
            },
            {
                title: "Deploy Instantly",
                description: "Preview your page and deploy with one click. Get a shareable link immediately.",
            },
        ],
        image: "/screenshots/landing.png",
    },
];

export default function ServiceTabs() {
    const [activeTab, setActiveTab] = useState(services[0].id);
    const activeService = services.find((s) => s.id === activeTab)!;

    return (
        <section className="py-20 lg:py-28 bg-muted/30" id="how-it-works">
            <div className="container px-4 md:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                        How Each Service Works
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Simple steps to get started with any of our tools
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {services.map((service) => (
                        <button
                            key={service.id}
                            onClick={() => setActiveTab(service.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === service.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {service.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"
                    >
                        {/* Left Side - Steps */}
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-8">
                                {activeService.title}
                            </h3>

                            <div className="space-y-6">
                                {activeService.steps.map((step, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex gap-4"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-1">
                                                {step.title}
                                            </h4>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Screenshot */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Decorative background */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl -z-10" />

                            {/* Image container */}
                            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl bg-muted/50">
                                <div className="aspect-video relative bg-background">
                                    <img
                                        src={activeService.image}
                                        alt={`${activeService.title} interface`}
                                        className="object-contain w-full h-full"
                                        onError={(e) => {
                                            // Fallback to placeholder if image not found
                                            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`;
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                            <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
