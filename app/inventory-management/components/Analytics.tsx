'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import {
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
    Package,
    DollarSign,
    AlertTriangle,
    Calendar,
    Target,
    Activity
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

// Type definitions
interface Product {
    name: string;
    category?: string;
    quantity: number;
    price: number;
    cost: number;
    expiryDate?: string;
    shelf?: string;
}

interface CategoryData {
    name: string;
    count: number;
    percentage: string;
}

interface StockData {
    name: string;
    quantity: number;
    value: number;
}

interface ProfitData {
    name: string;
    profit: number;
    profitMargin: string;
    totalValue: number;
}

interface ValueData {
    name: string;
    count: number;
}

interface ExpiryData {
    name: string;
    count: number;
}

interface ShelfData {
    name: string;
    count: number;
}

interface Summary {
    totalProducts: number;
    totalValue: number;
    totalProfit: number;
    totalStock: number;
    lowStockItems: number;
    expiringItems: number;
    categories: number;
}

interface AnalyticsData {
    categoryData: CategoryData[];
    stockData: StockData[];
    profitData: ProfitData[];
    valueData: ValueData[];
    expiryData: ExpiryData[];
    shelfData: ShelfData[];
    summary: Summary;
}

interface TooltipPayload {
    name: string;
    value: number | string;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}

interface AnalyticsProps {
    products?: Product[];
}

export default function Analytics({ products = [] }: AnalyticsProps) {
    const [selectedChart, setSelectedChart] = useState<'overview' | 'detailed'>('overview');

    // Calculate analytics data
    const analyticsData = useMemo<AnalyticsData>(() => {
        if (!products.length) {
            return {
                categoryData: [],
                stockData: [],
                profitData: [],
                valueData: [],
                expiryData: [],
                shelfData: [],
                summary: {
                    totalProducts: 0,
                    totalValue: 0,
                    totalProfit: 0,
                    totalStock: 0,
                    lowStockItems: 0,
                    expiringItems: 0,
                    categories: 0
                }
            };
        }

        // Category distribution
        const categoryMap = products.reduce<Record<string, number>>((acc, product) => {
            const category = product.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        const categoryData: CategoryData[] = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            count: value,
            percentage: ((value / products.length) * 100).toFixed(1)
        }));

        // Stock levels
        const stockData: StockData[] = products
            .filter(p => p.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)
            .map(p => ({
                name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                quantity: p.quantity,
                value: p.price * p.quantity
            }));

        // Profit analysis
        const profitData: ProfitData[] = products
            .filter(p => p.price && p.cost)
            .map(p => ({
                name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                profit: (p.price - p.cost) * p.quantity,
                profitMargin: ((p.price - p.cost) / p.price * 100).toFixed(1),
                totalValue: p.price * p.quantity
            }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10);

        // Value distribution
        const valueRanges = [
            { name: '0-500', min: 0, max: 500 },
            { name: '500-1000', min: 500, max: 1000 },
            { name: '1000-5000', min: 1000, max: 5000 },
            { name: '5000-10000', min: 5000, max: 10000 },
            { name: '10000+', min: 10000, max: Infinity }
        ];

        const valueData: ValueData[] = valueRanges.map(range => ({
            name: range.name,
            count: products.filter(p => {
                const value = p.price * p.quantity;
                return value >= range.min && value < range.max;
            }).length
        })).filter(item => item.count > 0);

        // Expiry analysis
        const today = new Date();
        const expiryData: ExpiryData[] = [
            { name: 'Expired', count: 0 },
            { name: 'Expiring in 7 days', count: 0 },
            { name: 'Expiring in 30 days', count: 0 },
            { name: 'Expiring in 90 days', count: 0 },
            { name: 'No expiry', count: 0 }
        ];

        products.forEach(p => {
            if (!p.expiryDate) {
                expiryData[4].count++;
            } else {
                const expiry = new Date(p.expiryDate);
                const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry < 0) expiryData[0].count++;
                else if (daysUntilExpiry <= 7) expiryData[1].count++;
                else if (daysUntilExpiry <= 30) expiryData[2].count++;
                else if (daysUntilExpiry <= 90) expiryData[3].count++;
            }
        });

        // Shelf distribution
        const shelfMap = products.reduce<Record<string, number>>((acc, product) => {
            const shelf = product.shelf || 'Unassigned';
            acc[shelf] = (acc[shelf] || 0) + 1;
            return acc;
        }, {});

        const shelfData: ShelfData[] = Object.entries(shelfMap).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => b.count - a.count).slice(0, 8);

        // Summary metrics
        const summary: Summary = {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
            totalProfit: products.reduce((sum, p) => sum + ((p.price - p.cost) * p.quantity), 0),
            totalStock: products.reduce((sum, p) => sum + p.quantity, 0),
            lowStockItems: products.filter(p => p.quantity <= 10).length,
            expiringItems: products.filter(p => {
                if (!p.expiryDate) return false;
                const daysUntilExpiry = Math.ceil((new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 15 && daysUntilExpiry >= 0;
            }).length,
            categories: Object.keys(categoryMap).length
        };

        return {
            categoryData,
            stockData,
            profitData,
            valueData,
            expiryData,
            shelfData,
            summary
        };
    }, [products]);

    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                            {entry.name.includes('Value') || entry.name.includes('Profit') || entry.name.includes('price') ? ' ₹' : ''}
                            {entry.name.includes('Margin') ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderOverviewCharts = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analyticsData.summary.totalProducts}</div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Across {analyticsData.summary.categories} categories</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">₹{analyticsData.summary.totalValue.toFixed(2)}</div>
                        <p className="text-xs text-green-700 dark:text-green-300">Inventory worth</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${analyticsData.summary.totalProfit >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                            ₹{analyticsData.summary.totalProfit.toFixed(2)}
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">Potential profit</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {analyticsData.summary.lowStockItems + analyticsData.summary.expiringItems}
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            {analyticsData.summary.lowStockItems} low stock, {analyticsData.summary.expiringItems} expiring
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Category Distribution
                        </CardTitle>
                        <CardDescription>Products by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analyticsData.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {analyticsData.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Top Stock Items
                        </CardTitle>
                        <CardDescription>Items with highest quantity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.stockData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="quantity" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderDetailedCharts = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Value Distribution
                    </CardTitle>
                    <CardDescription>Products by total value range</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.valueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Expiry Analysis
                    </CardTitle>
                    <CardDescription>Products by expiry status</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.expiryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#FF8042" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );

    if (!products.length) {
        return (
            <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No data to analyze</h3>
                <p className="text-muted-foreground">
                    Add products to your inventory to see analytics and visualizations
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        Inventory Analytics
                        <Badge variant="secondary">Live Data</Badge>
                    </CardTitle>
                    <CardDescription>
                        Visual insights and analytics for your inventory management
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Chart Type Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                    variant={selectedChart === 'overview' ? 'default' : 'ghost'}
                    onClick={() => setSelectedChart('overview')}
                    className="flex items-center gap-2"
                >
                    <BarChart3 className="h-4 w-4" />
                    Overview
                </Button>
                <Button
                    variant={selectedChart === 'detailed' ? 'default' : 'ghost'}
                    onClick={() => setSelectedChart('detailed')}
                    className="flex items-center gap-2"
                >
                    <PieChartIcon className="h-4 w-4" />
                    Detailed Analysis
                </Button>
            </div>

            {/* Charts */}
            {selectedChart === 'overview' ? renderOverviewCharts() : renderDetailedCharts()}
        </div>
    );
}
