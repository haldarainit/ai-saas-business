"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, FileText, Receipt, DollarSign, Calculator, TrendingUp, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function Accounting() {
    const accountingTools = [
        {
            icon: <Receipt className="w-8 h-8" />,
            title: "Invoice Management",
            description: "Create professional invoices instantly with AI-powered templates. Automate billing, track payments, and manage client accounts with intelligent financial workflows.",
            features: ["Auto Invoice Generation", "Payment Tracking", "Client Portal"],
            image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            accentColor: "rgba(6, 182, 212, 0.5)",
            iconColor: "text-cyan-500",
            gradient: "from-cyan-500/20 to-blue-500/20",
            link: "/accounting/invoice",
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "Quotation System",
            description: "Generate detailed quotations and estimates with smart pricing suggestions. Convert quotes to invoices seamlessly and track proposal acceptance rates.",
            features: ["Smart Pricing", "Quote Templates", "Conversion Tracking"],
            image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            accentColor: "rgba(16, 185, 129, 0.5)",
            iconColor: "text-emerald-500",
            gradient: "from-emerald-500/20 to-teal-500/20",
            link: "/accounting/techno-quotation",
        },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
    }

    return (
        <>
            <StructuredData />
            <div className="flex min-h-screen flex-col">
                <Navbar />

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                        {/* Background effects */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_70%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1),transparent_70%)]" />

                        <div className="container relative px-4 md:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center max-w-4xl mx-auto"
                            >
                                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    AI-Powered Accounting
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Streamline Your
                                    <span className="block bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                                        Financial Operations
                                    </span>
                                </h1>

                                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8 leading-relaxed">
                                    Automate invoicing, generate professional quotations, and manage your finances with
                                    intelligent AI-powered tools designed for modern businesses.
                                </p>

                                {/* How to Use Steps */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl px-8 py-4 mb-12">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white font-bold text-sm">
                                            1
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Choose a card below</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm">
                                            2
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Generate Invoice or Quotation instantly</span>
                                    </div>
                                </div>

                                {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" className="text-lg px-8 py-6 h-auto">
                                        Start Free Trial
                                        <DollarSign className="ml-2 w-5 h-5" />
                                    </Button>
                                    <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                                        View Demo
                                    </Button>
                                </div> */}

                                {/* Stats */}
                                {/* <div className="grid grid-cols-3 gap-8 mt-16 w-full max-w-2xl mx-auto">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-cyan-500">98%</div>
                                        <div className="text-sm text-muted-foreground">Faster Invoicing</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-emerald-500">50K+</div>
                                        <div className="text-sm text-muted-foreground">Invoices Generated</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-500">24/7</div>
                                        <div className="text-sm text-muted-foreground">Automation</div>
                                    </div>
                                </div> */}
                            </motion.div>
                        </div>
                    </section>

                    {/* Accounting Tools Grid */}
                    <section className="py-24 bg-muted/30">
                        <div className="container px-4 md:px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                                    Complete Accounting Suite
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                    Everything you need to manage invoices, quotations, and financial workflows in one powerful platform.
                                </p>
                            </motion.div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
                            >
                                {accountingTools.map((tool, index) => (
                                    <motion.div key={index} variants={cardVariants}>
                                        <Link href={tool.link}>
                                            <Card className={`group relative h-full overflow-hidden bg-gradient-to-br ${tool.gradient} backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 pt-0 cursor-pointer`}>
                                                {/* Background gradient on hover */}
                                                <div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${tool.accentColor}, transparent)`,
                                                    }}
                                                />

                                                <div className="relative h-full flex flex-col">
                                                    {/* Large Image Banner */}
                                                    <div className="relative w-full h-96 mb-6 overflow-hidden rounded-t-xl">
                                                        <Image
                                                            src={tool.image}
                                                            alt={tool.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        />
                                                        {/* Icon Overlay */}
                                                        <div className="absolute top-4 right-4">
                                                            <div className={`p-3 rounded-xl bg-background/90 backdrop-blur-sm shadow-lg ${tool.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                                                {tool.icon}
                                                            </div>
                                                        </div>
                                                        {/* Gradient Overlay on Hover */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>

                                                    <div className="px-6 pb-6">
                                                        {/* Title */}
                                                        <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-white transition-colors duration-300">
                                                            {tool.title}
                                                        </h3>

                                                        {/* Description */}
                                                        <p className="text-muted-foreground text-base leading-relaxed mb-6 flex-grow group-hover:text-white/90 transition-colors duration-300">
                                                            {tool.description}
                                                        </p>

                                                        {/* Features */}
                                                        <div className="space-y-2 mb-6">
                                                            {tool.features.map((feature, featureIndex) => (
                                                                <div key={featureIndex} className="flex items-center text-sm">
                                                                    <CheckCircle className={`w-4 h-4 mr-3 ${tool.iconColor} group-hover:text-white/80`} />
                                                                    <span className="text-muted-foreground group-hover:text-white/90 transition-colors duration-300">{feature}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* CTA Button */}
                                                        <Button className={`w-full justify-between group/btn bg-gradient-to-r ${tool.title === "Invoice Management" ? "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600" : "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"} text-white transition-all duration-300 text-sm py-3 h-auto shadow-lg hover:shadow-xl`}>
                                                            Get Started with {tool.title}
                                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Bottom CTA Section */}
                            {/* <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                viewport={{ once: true }}
                                className="text-center mt-20"
                            >
                                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20">
                                    <h3 className="text-3xl font-bold mb-4">Ready to Automate Your Accounting?</h3>
                                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                        Join thousands of businesses streamlining their financial operations with our AI-powered platform.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button size="lg" className="text-lg px-8 py-6 h-auto">
                                            Start Your Free Trial
                                            <TrendingUp className="ml-2 w-5 h-5" />
                                        </Button>
                                        <Link href="/get-started">
                                            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                                                Back to Features
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div> */}
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    )
}
