'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Factory, Package2, ArrowRight, BarChart3, Boxes, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function InventoryManagementPage() {
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
                            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Inventory Management</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                                Manage Your
                                <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Inventory Efficiently
                                </span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                                Real-time stock tracking, profit analytics, invoice management, and comprehensive inventory control for trading and manufacturing businesses.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Inventory Types Section */}
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
                                Choose Your Inventory Type
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Select the inventory management system that best fits your business needs.
                            </p>
                        </motion.div>

                        {/* Cards Grid */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                        >
                            {/* Trading Inventory Card */}
                            <motion.div variants={cardVariants}>
                                <Link href="/inventory-management/trading" className="block h-full">
                                    <Card className="group relative h-full overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-border/80">
                                        <div className="p-6 flex flex-col h-full">
                                            {/* Icon Container */}
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-5 text-white shadow-md group-hover:shadow-lg transition-shadow">
                                                <ShoppingCart className="w-6 h-6" />
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                                                Trading Inventory
                                            </h3>

                                            {/* Description */}
                                            <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-grow">
                                                For retail and wholesale businesses managing bought products and resale inventory.
                                            </p>

                                            {/* Features */}
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                                                    <span className="text-xs text-muted-foreground">Product management & stock tracking</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                                                    <span className="text-xs text-muted-foreground">Sales analytics & profit reports</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                                                    <span className="text-xs text-muted-foreground">Invoice scanning & quotations</span>
                                                </div>
                                            </div>

                                            {/* CTA Button */}
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                            >
                                                <span>Open Inventory</span>
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>

                            {/* Manufacturing Inventory Card */}
                            <motion.div variants={cardVariants}>
                                <Link href="/inventory-management/manufacturing" className="block h-full">
                                    <Card className="group relative h-full overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-border/80">
                                        <div className="p-6 flex flex-col h-full">
                                            {/* Icon Container */}
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-5 text-white shadow-md group-hover:shadow-lg transition-shadow">
                                                <Factory className="w-6 h-6" />
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                                                Manufacturing Inventory
                                            </h3>

                                            {/* Description */}
                                            <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-grow">
                                                For production and manufacturing businesses managing raw materials and finished goods.
                                            </p>

                                            {/* Features */}
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                                                    <span className="text-xs text-muted-foreground">Raw materials & finished goods tracking</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                                                    <span className="text-xs text-muted-foreground">Bill of materials & production workflows</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                                                    <span className="text-xs text-muted-foreground">Cost tracking & supplier management</span>
                                                </div>
                                            </div>

                                            {/* CTA Button */}
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                            >
                                                <span>Open Inventory</span>
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Highlight Section */}
                <section className="py-16 lg:py-24 bg-muted/50">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl font-bold mb-4">Core Features</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Powerful tools to manage every aspect of your inventory operations.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
                        >
                            <div className="bg-card border border-border rounded-lg p-4 text-center">
                                <Package2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                <p className="font-semibold text-sm text-foreground">Products</p>
                                <p className="text-xs text-muted-foreground">Track & manage</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-4 text-center">
                                <BarChart3 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-sm text-foreground">Analytics</p>
                                <p className="text-xs text-muted-foreground">Profit insights</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-4 text-center">
                                <ShoppingCart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                <p className="font-semibold text-sm text-foreground">Sales</p>
                                <p className="text-xs text-muted-foreground">Quick checkout</p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-4 text-center">
                                <Factory className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                <p className="font-semibold text-sm text-foreground">Production</p>
                                <p className="text-xs text-muted-foreground">BOM tracking</p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
