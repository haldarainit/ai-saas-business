"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
    ArrowRight,
    Receipt,
    Presentation,
    Mail,
    Users,
    Layout,
    Package2,
    Zap,
} from "lucide-react";

interface FeatureShowcaseItem {
    title: string;
    description: string;
    features: string[];
    image: string;
    icon: React.ReactNode;
    borderColor: string;
}

const features: FeatureShowcaseItem[] = [
    {
        title: "Smart Invoice & Quotation System",
        description:
            "Create professional invoices and quotations in seconds. Our AI-powered system handles calculations, GST formatting, and generates beautiful PDFs ready to share with clients.",
        features: [
            "Auto-calculate totals, taxes, and discounts",
            "GST-ready invoice formats",
            "One-click quotation to invoice conversion",
            "Professional PDF export with custom branding",
        ],
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Receipt className="w-6 h-6" />,
        borderColor: "border-cyan-500",
    },
    {
        title: "AI Presentation Generator",
        description:
            "Generate complete, professional presentations in minutes. Just describe your topic and our AI creates stunning slides with perfect layouts, relevant images, and compelling content.",
        features: [
            "Prompt-based presentation creation",
            "Auto-structured slides with professional layouts",
            "AI-generated content and image suggestions",
            "Export to PowerPoint format",
        ],
        image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Presentation className="w-6 h-6" />,
        borderColor: "border-amber-500",
    },
    {
        title: "Email Campaign Automation",
        description:
            "Launch personalized email campaigns at scale. Import your contacts, design beautiful emails, and track performance with detailed analytics—all in one place.",
        features: [
            "CSV import for bulk contacts",
            "Rich email template editor",
            "Click and open tracking",
            "Real-time analytics dashboard",
        ],
        image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Mail className="w-6 h-6" />,
        borderColor: "border-orange-500",
    },
    {
        title: "Employee Management System",
        description:
            "Streamline HR operations with our complete employee management suite. Track attendance via email links, manage leave requests, and monitor field staff with GPS tracking.",
        features: [
            "Email-based attendance check-in",
            "Automated leave approval workflows",
            "Real-time GPS tracking for field staff",
            "Comprehensive attendance reports",
        ],
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Users className="w-6 h-6" />,
        borderColor: "border-purple-500",
    },
    {
        title: "AI Landing Page Builder",
        description:
            "Create stunning, high-converting landing pages without any coding. Just describe your business and watch AI build a complete, professional page in seconds.",
        features: [
            "AI-powered page generation",
            "Real-time chat-based editing",
            "Version history with undo/redo",
            "One-click deployment",
        ],
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Layout className="w-6 h-6" />,
        borderColor: "border-blue-500",
    },
    {
        title: "Inventory Management",
        description:
            "Track stock levels, manage costs, and optimize operations for both trading and manufacturing businesses. Get low stock alerts, profit analysis, and complete visibility.",
        features: [
            "Real-time stock tracking",
            "Profit margin analysis",
            "Low stock alerts and notifications",
            "Bill of Materials (BOM) support",
        ],
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        icon: <Package2 className="w-6 h-6" />,
        borderColor: "border-emerald-500",
    },
];

export default function FeatureShowcase() {
    const { user } = useAuth();

    return (
        <section className="py-20 lg:py-32 overflow-hidden" id="features">
            <div className="container px-4 md:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 lg:mb-24"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                        Everything Your Business Needs
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Powerful AI-driven tools to automate your operations, save time, and scale faster.
                    </p>
                </motion.div>

                {/* Feature Items */}
                <div className="space-y-24 lg:space-y-32">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            viewport={{ once: true, margin: "-100px" }}
                            className={`flex flex-col gap-8 lg:gap-16 items-center ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                                }`}
                        >
                            {/* Text Content */}
                            <div className="flex-1 max-w-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg bg-primary/10 text-primary`}>
                                        {feature.icon}
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                                    {feature.description}
                                </p>

                                <ul className="space-y-3">
                                    {feature.features.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Image */}
                            <div className="flex-1 w-full max-w-2xl">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                    className={`relative rounded-xl overflow-hidden border-4 ${feature.borderColor} shadow-2xl bg-card`}
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden">
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="object-cover w-full h-full"
                                        />
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mt-24"
                >
                    <p className="text-lg text-muted-foreground mb-6">
                        And many more tools to help your business grow
                    </p>
                    {user ? (
                        <Link href="/get-started">
                            <Button size="lg" className="gap-2">
                                <Zap className="w-4 h-4" />
                                Get Started Now
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/auth/signup">
                            <Button size="lg" className="gap-2">
                                <Zap className="w-4 h-4" />
                                Join to Try
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
