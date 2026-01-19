'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Upload,
    FileText, Calculator, Lightbulb, CheckCircle, ArrowUpRight, ArrowDownRight,
    BarChart3, PieChart as PieChartIcon, Plus, Trash2, Download, LucideIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

// Type definitions
interface Transaction {
    date: string;
    type: 'sale' | 'expense' | 'purchase' | 'refund';
    amount: number;
    costOfGoods: number | null;
    category: string;
    paymentMethod: string;
    productName: string;
    customerOrSupplier: string;
    notes: string;
}

interface BusinessInfo {
    businessName: string;
    currency: string;
    periodLabel: string;
}

interface NewTransaction {
    date: string;
    type: string;
    amount: string;
    costOfGoods: string;
    category: string;
    paymentMethod: string;
    productName: string;
    customerOrSupplier: string;
    notes: string;
}

interface FinancialData {
    businessName: string;
    currency: string;
    period: { label: string };
    transactions: Transaction[];
}

interface ExpenseCategory {
    category: string;
    total: number;
    percentageOfExpenses: number;
}

interface ProductRevenue {
    productName: string;
    totalRevenue: number;
    estimatedGrossProfit: number;
}

interface AnalysisSummary {
    businessName: string;
    periodLabel: string;
    currency: string;
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    grossMarginPercent: number;
    totalOperatingExpenses: number;
    netProfit: number;
    netMarginPercent: number;
    cashFlow: number;
}

interface AnalysisData {
    summary: AnalysisSummary;
    expenseBreakdown: ExpenseCategory[];
    productInsights: {
        topByRevenue: ProductRevenue[];
        topByProfit: ProductRevenue[];
        notes: string;
    };
    topInsights: string[];
    recommendedActions: string[];
    warnings: string[];
    ownerFriendlySummary: string;
}

interface MetricCardProps {
    title: string;
    value: string;
    subtitle: string;
    trend?: number;
    icon: LucideIcon;
    color?: string;
}

export default function ExpenseProfitAnalyzer() {
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
        businessName: '',
        currency: 'INR',
        periodLabel: ''
    });
    const [newTransaction, setNewTransaction] = useState<NewTransaction>({
        date: new Date().toISOString().split('T')[0],
        type: 'sale',
        amount: '',
        costOfGoods: '',
        category: '',
        paymentMethod: '',
        productName: '',
        customerOrSupplier: '',
        notes: ''
    });
    const { toast } = useToast();

    const analyzeFinancialData = useCallback((transactionData: FinancialData): AnalysisData => {
        const validTransactions = transactionData.transactions.filter(t =>
            t && typeof t.amount === 'number' && !isNaN(t.amount)
        );

        const sales = validTransactions.filter(t => t.type === 'sale');
        const expenses = validTransactions.filter(t => t.type === 'expense');
        const purchases = validTransactions.filter(t => t.type === 'purchase');
        const refunds = validTransactions.filter(t => t.type === 'refund');

        const warnings: string[] = [];
        const salesWithoutCOGS = sales.filter(s => s.costOfGoods === null || s.costOfGoods === undefined);
        if (salesWithoutCOGS.length > 0) {
            warnings.push(`${salesWithoutCOGS.length} sales transactions missing cost of goods data`);
        }

        const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
        const totalCOGS = sales.reduce((sum, s) => sum + (s.costOfGoods || 0), 0);
        const grossProfit = totalRevenue - totalCOGS;
        const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = grossProfit - totalOperatingExpenses;
        const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        const expenseByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
            const category = expense.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {});

        const expenseBreakdown: ExpenseCategory[] = Object.entries(expenseByCategory)
            .map(([category, total]) => ({
                category,
                total,
                percentageOfExpenses: totalOperatingExpenses > 0 ? (total / totalOperatingExpenses) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);

        const productRevenue = sales.reduce<Record<string, { revenue: number; profit: number; count: number }>>((acc, sale) => {
            if (sale.productName) {
                acc[sale.productName] = acc[sale.productName] || { revenue: 0, profit: 0, count: 0 };
                acc[sale.productName].revenue += sale.amount;
                acc[sale.productName].profit += (sale.amount - (sale.costOfGoods || 0));
                acc[sale.productName].count += 1;
            }
            return acc;
        }, {});

        const topByRevenue: ProductRevenue[] = Object.entries(productRevenue)
            .map(([name, data]) => ({ productName: name, totalRevenue: data.revenue, estimatedGrossProfit: data.profit }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        const topByProfit: ProductRevenue[] = Object.entries(productRevenue)
            .map(([name, data]) => ({ productName: name, estimatedGrossProfit: data.profit, totalRevenue: data.revenue }))
            .sort((a, b) => b.estimatedGrossProfit - a.estimatedGrossProfit)
            .slice(0, 5);

        const totalInflow = sales.reduce((sum, s) => sum + s.amount, 0) - refunds.reduce((sum, r) => sum + r.amount, 0);
        const totalOutflow = purchases.reduce((sum, p) => sum + p.amount, 0) + expenses.reduce((sum, e) => sum + e.amount, 0);
        const cashFlow = totalInflow - totalOutflow;

        const insights: string[] = [];
        const recommendations: string[] = [];

        if (grossMarginPercent < 20) {
            insights.push(`Gross margin is low at ${grossMarginPercent.toFixed(1)}%`);
        }
        if (netMarginPercent > 15) {
            insights.push(`Healthy net margin of ${netMarginPercent.toFixed(1)}%`);
        }

        if (grossMarginPercent < 25) {
            recommendations.push(`Increase prices or reduce costs to improve gross margin above 25%`);
        }

        const ownerFriendlySummary = netProfit >= 0
            ? `Business is profitable with ${transactionData.currency} ${netProfit.toFixed(2)} net profit.`
            : `Business is losing ${transactionData.currency} ${Math.abs(netProfit).toFixed(2)}. Immediate action needed.`;

        return {
            summary: {
                businessName: transactionData.businessName,
                periodLabel: transactionData.period.label,
                currency: transactionData.currency,
                totalRevenue,
                totalCOGS,
                grossProfit,
                grossMarginPercent,
                totalOperatingExpenses,
                netProfit,
                netMarginPercent,
                cashFlow
            },
            expenseBreakdown,
            productInsights: {
                topByRevenue,
                topByProfit,
                notes: topByRevenue.length > 0 ? 'Product analysis based on available sales data' : 'Not enough product data.'
            },
            topInsights: insights,
            recommendedActions: recommendations,
            warnings,
            ownerFriendlySummary
        };
    }, []);

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setLoading(true);

        try {
            const text = await file.text();
            const data: FinancialData = JSON.parse(text);

            if (!data.businessName || !data.transactions || !Array.isArray(data.transactions)) {
                throw new Error('Invalid data format.');
            }

            const analysis = analyzeFinancialData(data);
            setAnalysisData(analysis);
            toast({ title: 'Analysis Complete', description: `Analyzed ${data.transactions.length} transactions` });
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message || 'Failed to process file.', variant: 'destructive' });
            setAnalysisData(null);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = () => {
        if (!newTransaction.amount) {
            toast({ title: 'Error', description: 'Amount is required', variant: 'destructive' });
            return;
        }

        const transaction: Transaction = {
            date: newTransaction.date,
            type: newTransaction.type as Transaction['type'],
            amount: parseFloat(newTransaction.amount),
            costOfGoods: newTransaction.costOfGoods ? parseFloat(newTransaction.costOfGoods) : null,
            category: newTransaction.category,
            paymentMethod: newTransaction.paymentMethod,
            productName: newTransaction.productName,
            customerOrSupplier: newTransaction.customerOrSupplier,
            notes: newTransaction.notes
        };

        setManualTransactions([...manualTransactions, transaction]);
        setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'sale',
            amount: '',
            costOfGoods: '',
            category: '',
            paymentMethod: '',
            productName: '',
            customerOrSupplier: '',
            notes: ''
        });

        toast({ title: 'Transaction Added', description: 'Transaction added successfully' });
    };

    const removeTransaction = (index: number) => {
        setManualTransactions(manualTransactions.filter((_, i) => i !== index));
    };

    const analyzeManualData = () => {
        if (!businessInfo.businessName.trim()) {
            toast({ title: 'Error', description: 'Business name is required', variant: 'destructive' });
            return;
        }

        if (manualTransactions.length === 0) {
            toast({ title: 'Error', description: 'Add at least one transaction', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const data: FinancialData = {
                businessName: businessInfo.businessName,
                currency: businessInfo.currency,
                period: { label: businessInfo.periodLabel || 'Custom Period' },
                transactions: manualTransactions
            };

            const analysis = analyzeFinancialData(data);
            setAnalysisData(analysis);
            toast({ title: 'Analysis Complete', description: `Analyzed ${manualTransactions.length} transactions` });
        } catch {
            toast({ title: 'Error', description: 'Failed to analyze data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const generateSampleData = () => {
        const sampleData: FinancialData = {
            businessName: "Sample Retail Store",
            currency: "INR",
            period: { label: "November 2025" },
            transactions: [
                { date: "2025-11-01", type: "sale", amount: 5000, costOfGoods: 3000, category: "Electronics", paymentMethod: "card", productName: "Laptop", customerOrSupplier: "John", notes: "" },
                { date: "2025-11-02", type: "expense", amount: 15000, costOfGoods: null, category: "Rent", paymentMethod: "bank transfer", productName: "", customerOrSupplier: "Landlord", notes: "" },
                { date: "2025-11-03", type: "sale", amount: 1500, costOfGoods: 900, category: "Accessories", paymentMethod: "cash", productName: "Mouse", customerOrSupplier: "Jane", notes: "" }
            ]
        };

        setLoading(true);
        try {
            const analysis = analyzeFinancialData(sampleData);
            setAnalysisData(analysis);
            toast({ title: 'Sample Data Loaded', description: 'Analyzing sample business data' });
        } catch {
            toast({ title: 'Error', description: 'Failed to analyze sample data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'INR'): string => {
        return `${currency} ${amount.toFixed(2)}`;
    };

    const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }: MetricCardProps) => (
        <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-${color}-600`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
                {trend !== undefined && (
                    <div className={`flex items-center mt-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (!analysisData) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            AI Expense & Profit Analyzer
                            <Badge variant="secondary">Financial Intelligence</Badge>
                        </CardTitle>
                        <CardDescription>Multiple ways to input your transaction data for comprehensive financial analysis</CardDescription>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="upload">File Upload</TabsTrigger>
                        <TabsTrigger value="sample">Sample Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Business Name *</label>
                                        <Input placeholder="Your Business Name" value={businessInfo.businessName} onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Currency</label>
                                        <Select value={businessInfo.currency} onValueChange={(value) => setBusinessInfo({ ...businessInfo, currency: value })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">INR (₹)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Period</label>
                                        <Input placeholder="e.g., November 2025" value={businessInfo.periodLabel} onChange={(e) => setBusinessInfo({ ...businessInfo, periodLabel: e.target.value })} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add Transaction</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Date *</label>
                                        <Input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Type *</label>
                                        <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sale">Sale</SelectItem>
                                                <SelectItem value="expense">Expense</SelectItem>
                                                <SelectItem value="purchase">Purchase</SelectItem>
                                                <SelectItem value="refund">Refund</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Amount *</label>
                                        <Input type="number" placeholder="0.00" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                                    </div>
                                </div>
                                <Button onClick={addTransaction} className="w-full"><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
                            </CardContent>
                        </Card>

                        {manualTransactions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Transactions ({manualTransactions.length})</span>
                                        <Button onClick={analyzeManualData} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Data'}</Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {manualTransactions.map((transaction, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{transaction.productName || transaction.category || 'Transaction'}</div>
                                                    <div className="text-sm text-muted-foreground">{transaction.type} • {transaction.date} • {businessInfo.currency} {transaction.amount}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeTransaction(index)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload JSON File</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <Input type="file" accept=".json" onChange={handleFileUpload} className="mt-4" disabled={loading} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sample" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Try Sample Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={generateSampleData} disabled={loading} className="w-full">{loading ? 'Analyzing...' : 'Load Sample Data'}</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                            <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        Financial Analysis Results
                        <Badge variant="secondary">{analysisData.summary.periodLabel}</Badge>
                    </CardTitle>
                    <CardDescription>{analysisData.summary.businessName}</CardDescription>
                </CardHeader>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Business Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed">{analysisData.ownerFriendlySummary}</p>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Revenue" value={formatCurrency(analysisData.summary.totalRevenue, analysisData.summary.currency)} subtitle="Gross sales income" icon={DollarSign} color="blue" />
                <MetricCard title="Gross Profit" value={formatCurrency(analysisData.summary.grossProfit, analysisData.summary.currency)} subtitle={`${analysisData.summary.grossMarginPercent.toFixed(1)}% margin`} icon={TrendingUp} color={analysisData.summary.grossProfit >= 0 ? 'green' : 'red'} />
                <MetricCard title="Net Profit" value={formatCurrency(analysisData.summary.netProfit, analysisData.summary.currency)} subtitle={`${analysisData.summary.netMarginPercent.toFixed(1)}% margin`} icon={Target} color={analysisData.summary.netProfit >= 0 ? 'emerald' : 'red'} />
                <MetricCard title="Cash Flow" value={formatCurrency(analysisData.summary.cashFlow, analysisData.summary.currency)} subtitle="Inflow minus outflow" icon={analysisData.summary.cashFlow >= 0 ? TrendingUp : TrendingDown} color={analysisData.summary.cashFlow >= 0 ? 'blue' : 'amber'} />
            </div>

            {analysisData.warnings && analysisData.warnings.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {analysisData.warnings.map((warning, index) => (<p key={index} className="text-sm">{warning}</p>))}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Button onClick={generateSampleData} variant="outline">Load Sample Data</Button>
                        <Button onClick={() => { setAnalysisData(null); setUploadedFile(null); }}>Analyze New Data</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
