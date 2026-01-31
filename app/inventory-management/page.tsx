'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Factory, Package2, ArrowRight, BarChart3, Boxes, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function InventoryManagementPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <Package2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Inventory Management</h1>
                            <p className="text-sm text-slate-400">Choose your inventory type to get started</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Welcome to Your Inventory Hub
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Manage your products, track stock levels, analyze profits, and streamline your business operations with our powerful inventory tools.
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Trading Card */}
                        <Link href="/inventory-management/trading" className="group">
                            <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                                            <ShoppingCart className="h-8 w-8 text-white" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <CardTitle className="text-2xl text-white mt-4">Trading Inventory</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        For retail and wholesale businesses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <Boxes className="h-4 w-4 text-blue-400" />
                                            <span className="text-sm">Product management & stock tracking</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <BarChart3 className="h-4 w-4 text-blue-400" />
                                            <span className="text-sm">Sales analytics & profit reports</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <TrendingUp className="h-4 w-4 text-blue-400" />
                                            <span className="text-sm">Invoice scanning & quotations</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                                        size="lg"
                                    >
                                        Open Trading Inventory
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Manufacturing Card */}
                        <Link href="/inventory-management/manufacturing" className="group">
                            <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 cursor-pointer">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
                                            <Factory className="h-8 w-8 text-white" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <CardTitle className="text-2xl text-white mt-4">Manufacturing Inventory</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        For production and manufacturing businesses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <Package2 className="h-4 w-4 text-orange-400" />
                                            <span className="text-sm">Raw materials & finished goods</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <Factory className="h-4 w-4 text-orange-400" />
                                            <span className="text-sm">Bill of materials & production</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <TrendingUp className="h-4 w-4 text-orange-400" />
                                            <span className="text-sm">Cost tracking & supplier management</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                                        size="lg"
                                    >
                                        Open Manufacturing Inventory
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* Quick Stats Section */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                            <Package2 className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">Products</p>
                            <p className="text-sm text-slate-400">Track inventory</p>
                        </div>
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                            <BarChart3 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">Analytics</p>
                            <p className="text-sm text-slate-400">Profit insights</p>
                        </div>
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                            <ShoppingCart className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">Sales</p>
                            <p className="text-sm text-slate-400">Quick checkout</p>
                        </div>
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center">
                            <Factory className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">Production</p>
                            <p className="text-sm text-slate-400">BOM tracking</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
