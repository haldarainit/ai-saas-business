'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Target, 
  Upload,
  FileText,
  Calculator,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  Edit,
  Save,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function ExpenseProfitAnalyzer() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [manualTransactions, setManualTransactions] = useState([]);
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    currency: 'INR',
    periodLabel: ''
  });
  const [newTransaction, setNewTransaction] = useState({
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

  const analyzeFinancialData = useCallback((transactionData) => {
    try {
      // 1. CLEAN & UNDERSTAND DATA
      const validTransactions = transactionData.transactions.filter(t => 
        t && typeof t.amount === 'number' && !isNaN(t.amount)
      );

      const sales = validTransactions.filter(t => t.type === 'sale');
      const expenses = validTransactions.filter(t => t.type === 'expense');
      const purchases = validTransactions.filter(t => t.type === 'purchase');
      const refunds = validTransactions.filter(t => t.type === 'refund');

      // Check for missing costOfGoods
      const salesWithoutCOGS = sales.filter(s => s.costOfGoods === null || s.costOfGoods === undefined);
      const warnings = [];
      if (salesWithoutCOGS.length > 0) {
        warnings.push(`${salesWithoutCOGS.length} sales transactions missing cost of goods data - treated as 0 for calculations`);
      }

      // 2. CALCULATE KEY METRICS
      const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
      const totalCOGS = sales.reduce((sum, s) => sum + (s.costOfGoods || 0), 0);
      const grossProfit = totalRevenue - totalCOGS;
      const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = grossProfit - totalOperatingExpenses;
      const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // 3. EXPENSE & CATEGORY ANALYSIS
      const expenseByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});

      const expenseBreakdown = Object.entries(expenseByCategory).map(([category, total]) => ({
        category,
        total,
        percentageOfExpenses: totalOperatingExpenses > 0 ? (total / totalOperatingExpenses) * 100 : 0
      })).sort((a, b) => b.total - a.total);

      const topExpenseCategories = expenseBreakdown.slice(0, 3);
      const highExpenseCategories = expenseBreakdown.filter(cat => cat.percentageOfExpenses > 30);

      // 4. PRODUCT / REVENUE INSIGHTS
      const productRevenue = sales.reduce((acc, sale) => {
        if (sale.productName) {
          acc[sale.productName] = (acc[sale.productName] || { revenue: 0, profit: 0, count: 0 });
          acc[sale.productName].revenue += sale.amount;
          acc[sale.productName].profit += (sale.amount - (sale.costOfGoods || 0));
          acc[sale.productName].count += 1;
        }
        return acc;
      }, {});

      const topByRevenue = Object.entries(productRevenue)
        .map(([name, data]) => ({
          productName: name,
          totalRevenue: data.revenue,
          estimatedGrossProfit: data.profit
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      const topByProfit = Object.entries(productRevenue)
        .map(([name, data]) => ({
          productName: name,
          estimatedGrossProfit: data.profit,
          totalRevenue: data.revenue
        }))
        .sort((a, b) => b.estimatedGrossProfit - a.estimatedGrossProfit)
        .slice(0, 5);

      // 5. CASHFLOW VIEW
      const totalInflow = sales.reduce((sum, s) => sum + s.amount, 0) - refunds.reduce((sum, r) => sum + r.amount, 0);
      const totalOutflow = purchases.reduce((sum, p) => sum + p.amount, 0) + expenses.reduce((sum, e) => sum + e.amount, 0);
      const cashFlow = totalInflow - totalOutflow;

      // 6. INSIGHTS & RECOMMENDATIONS
      const insights = [];
      const recommendations = [];

      // Generate insights
      if (highExpenseCategories.length > 0) {
        insights.push(`${highExpenseCategories[0].category} is ${highExpenseCategories[0].percentageOfExpenses.toFixed(1)}% of total expenses`);
      }

      if (grossMarginPercent < 20) {
        insights.push(`Gross margin is low at ${grossMarginPercent.toFixed(1)}% - review pricing and costs`);
      }

      if (netMarginPercent > 15) {
        insights.push(`Healthy net margin of ${netMarginPercent.toFixed(1)}% - good profitability`);
      } else if (netMarginPercent < 5) {
        insights.push(`Net margin is concerning at ${netMarginPercent.toFixed(1)}% - need cost reduction`);
      }

      if (topByRevenue.length > 0) {
        const topRevenueContribution = (topByRevenue[0].totalRevenue / totalRevenue) * 100;
        insights.push(`Top product '${topByRevenue[0].productName}' contributes ${topRevenueContribution.toFixed(1)}% of revenue`);
      }

      if (cashFlow < 0) {
        insights.push(`Negative cash flow of ${Math.abs(cashFlow).toFixed(2)} ${transactionData.currency} - monitor liquidity`);
      }

      // Generate recommendations
      if (highExpenseCategories.length > 0) {
        recommendations.push(`Review and optimize ${highExpenseCategories[0].category} expenses - consider cost reduction measures`);
      }

      if (grossMarginPercent < 25) {
        recommendations.push(`Increase prices or reduce costs to improve gross margin above 25%`);
      }

      if (topByRevenue.length > 0 && topByRevenue.length < 3) {
        recommendations.push(`Diversify product portfolio - currently reliant on few products`);
      }

      if (salesWithoutCOGS.length > 0) {
        recommendations.push(`Track cost of goods for all sales to get accurate profit analysis`);
      }

      if (netProfit < 0) {
        recommendations.push(`Immediate action required - business is operating at a loss`);
      } else if (netMarginPercent < 10) {
        recommendations.push(`Focus on high-margin products and reduce operating expenses`);
      }

      // Owner-friendly summary
      const ownerFriendlySummary = netProfit >= 0 
        ? `Business is profitable with ${transactionData.currency} ${netProfit.toFixed(2)} net profit (${netMarginPercent.toFixed(1)}% margin). Gross margin is ${grossMarginPercent.toFixed(1)}% and cash flow is ${cashFlow >= 0 ? 'positive' : 'negative'} at ${transactionData.currency} ${Math.abs(cashFlow).toFixed(2)}.`
        : `Business is losing ${transactionData.currency} ${Math.abs(netProfit).toFixed(2)} with a negative margin of ${Math.abs(netMarginPercent).toFixed(1)}%. Immediate action needed to reduce costs and increase revenue.`;

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
          notes: topByRevenue.length > 0 ? 'Product analysis based on available sales data' : 'Not enough product data provided.'
        },
        topInsights: insights,
        recommendedActions: recommendations,
        warnings,
        ownerFriendlySummary
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error('Failed to analyze financial data');
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.businessName || !data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Invalid data format. Please ensure your JSON has businessName and transactions array.');
      }

      const analysis = analyzeFinancialData(data);
      setAnalysisData(analysis);
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${data.transactions.length} transactions for ${data.businessName}`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process file. Please check the format.',
        variant: 'destructive',
      });
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = () => {
    if (!newTransaction.amount || newTransaction.amount === '') {
      toast({
        title: 'Error',
        description: 'Amount is required',
        variant: 'destructive',
      });
      return;
    }

    const transaction = {
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
      costOfGoods: newTransaction.costOfGoods ? parseFloat(newTransaction.costOfGoods) : null
    };

    setManualTransactions([...manualTransactions, transaction]);
    
    // Reset form
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

    toast({
      title: 'Transaction Added',
      description: 'Transaction added successfully',
    });
  };

  const removeTransaction = (index) => {
    setManualTransactions(manualTransactions.filter((_, i) => i !== index));
  };

  const analyzeManualData = () => {
    if (!businessInfo.businessName || businessInfo.businessName.trim() === '') {
      toast({
        title: 'Error',
        description: 'Business name is required',
        variant: 'destructive',
      });
      return;
    }

    if (manualTransactions.length === 0) {
      toast({
        title: 'Error',
        description: 'Add at least one transaction to analyze',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        businessName: businessInfo.businessName,
        currency: businessInfo.currency,
        period: {
          label: businessInfo.periodLabel || 'Custom Period'
        },
        transactions: manualTransactions
      };

      const analysis = analyzeFinancialData(data);
      setAnalysisData(analysis);
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${manualTransactions.length} transactions for ${businessInfo.businessName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      businessName: "Your Business Name",
      currency: "INR",
      period: {
        label: "November 2025"
      },
      transactions: [
        {
          date: "2025-11-01",
          type: "sale",
          amount: 5000,
          costOfGoods: 3000,
          category: "Electronics",
          paymentMethod: "card",
          productName: "Laptop",
          customerOrSupplier: "Customer Name",
          notes: "Optional notes"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial-data-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Template file downloaded successfully',
    });
  };

  const generateSampleData = () => {
    const sampleData = {
      businessName: "Sample Retail Store",
      currency: "INR",
      period: {
        label: "November 2025"
      },
      transactions: [
        { date: "2025-11-01", type: "sale", amount: 5000, costOfGoods: 3000, category: "Electronics", paymentMethod: "card", productName: "Laptop", customerOrSupplier: "John Doe", notes: "Premium laptop sale" },
        { date: "2025-11-02", type: "sale", amount: 1500, costOfGoods: 900, category: "Accessories", paymentMethod: "upi", productName: "Mouse", customerOrSupplier: "Jane Smith", notes: "Wireless mouse" },
        { date: "2025-11-03", type: "expense", amount: 15000, costOfGoods: null, category: "Rent", paymentMethod: "bank transfer", productName: null, customerOrSupplier: "Landlord", notes: "Monthly rent" },
        { date: "2025-11-04", type: "sale", amount: 800, costOfGoods: 400, category: "Accessories", paymentMethod: "cash", productName: "Keyboard", customerOrSupplier: "Bob Wilson", notes: "Mechanical keyboard" },
        { date: "2025-11-05", type: "expense", amount: 3000, costOfGoods: null, category: "Salaries", paymentMethod: "bank transfer", productName: null, customerOrSupplier: "Staff", notes: "Monthly salaries" },
        { date: "2025-11-06", type: "sale", amount: 2500, costOfGoods: 1500, category: "Electronics", paymentMethod: "card", productName: "Tablet", customerOrSupplier: "Alice Brown", notes: "Android tablet" },
        { date: "2025-11-07", type: "expense", amount: 2000, costOfGoods: null, category: "Electricity", paymentMethod: "bank transfer", productName: null, customerOrSupplier: "Power Company", notes: "Monthly electricity" },
        { date: "2025-11-08", type: "sale", amount: 1200, costOfGoods: 600, category: "Accessories", paymentMethod: "upi", productName: "Headphones", customerOrSupplier: "Charlie Davis", notes: "Bluetooth headphones" },
        { date: "2025-11-09", type: "expense", amount: 1500, costOfGoods: null, category: "Marketing", paymentMethod: "card", productName: null, customerOrSupplier: "Ad Agency", notes: "Online advertising" },
        { date: "2025-11-10", type: "sale", amount: 3000, costOfGoods: 1800, category: "Electronics", paymentMethod: "cash", productName: "Smartphone", customerOrSupplier: "Eva Martinez", notes: "Budget smartphone" }
      ]
    };

    setLoading(true);
    try {
      const analysis = analyzeFinancialData(sampleData);
      setAnalysisData(analysis);
      toast({
        title: 'Sample Data Loaded',
        description: 'Analyzing sample business data for demonstration',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze sample data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) => (
    <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-${color}-900 dark:text-${color}-100">{value}</div>
        <p className="text-xs text-${color}-700 dark:text-${color}-300">{subtitle}</p>
        {trend && (
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
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              AI Expense & Profit Analyzer
              <Badge variant="secondary">Financial Intelligence</Badge>
            </CardTitle>
            <CardDescription>
              Multiple ways to input your transaction data for comprehensive financial analysis
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Input Methods Tabs */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">File Upload</TabsTrigger>
            <TabsTrigger value="sample">Sample Data</TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Business Name *</label>
                    <Input
                      placeholder="Your Business Name"
                      value={businessInfo.businessName}
                      onChange={(e) => setBusinessInfo({...businessInfo, businessName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Currency</label>
                    <Select value={businessInfo.currency} onValueChange={(value) => setBusinessInfo({...businessInfo, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Period Label</label>
                    <Input
                      placeholder="e.g., November 2025"
                      value={businessInfo.periodLabel}
                      onChange={(e) => setBusinessInfo({...businessInfo, periodLabel: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Transaction Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date *</label>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type *</label>
                    <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({...newTransaction, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cost of Goods (Sales Only)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.costOfGoods}
                      onChange={(e) => setNewTransaction({...newTransaction, costOfGoods: e.target.value})}
                      disabled={newTransaction.type !== 'sale'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Input
                      placeholder="e.g., Electronics, Rent, Salaries"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Payment Method</label>
                    <Select value={newTransaction.paymentMethod} onValueChange={(value) => setNewTransaction({...newTransaction, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Product Name</label>
                    <Input
                      placeholder="e.g., Laptop, Office Supplies"
                      value={newTransaction.productName}
                      onChange={(e) => setNewTransaction({...newTransaction, productName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Customer/Supplier</label>
                    <Input
                      placeholder="Customer or supplier name"
                      value={newTransaction.customerOrSupplier}
                      onChange={(e) => setNewTransaction({...newTransaction, customerOrSupplier: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes</label>
                    <Input
                      placeholder="Optional notes"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                    />
                  </div>
                </div>

                <Button onClick={addTransaction} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </CardContent>
            </Card>

            {/* Transactions List */}
            {manualTransactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Transactions ({manualTransactions.length})</span>
                    <Button onClick={analyzeManualData} disabled={loading}>
                      {loading ? 'Analyzing...' : 'Analyze Data'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {manualTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{transaction.productName || transaction.category || 'Transaction'}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.type} • {transaction.date} • {businessInfo.currency} {transaction.amount}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransaction(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload JSON File
                </CardTitle>
                <CardDescription>
                  Upload a pre-formatted JSON file with your transaction data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your JSON file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a JSON file with businessName, currency, period, and transactions array
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-4"
                    disabled={loading}
                  />
                </div>
                
                <div className="text-center">
                  <Button onClick={downloadTemplate} variant="outline" className="mr-2">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Format Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  JSON Format Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Required Structure:</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "businessName": "Your Business Name",
  "currency": "INR",
  "period": { "label": "November 2025" },
  "transactions": [
    {
      "date": "2025-11-01",
      "type": "sale|expense|purchase|refund",
      "amount": 5000,
      "costOfGoods": 3000,
      "category": "Electronics",
      "paymentMethod": "card",
      "productName": "Laptop",
      "customerOrSupplier": "Customer Name",
      "notes": "Optional notes"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sample Data Tab */}
          <TabsContent value="sample" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Try Sample Data
                </CardTitle>
                <CardDescription>
                  Load pre-populated sample data to see how the analyzer works
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will load sample transaction data for a retail business including sales, expenses, and purchases. 
                    You can then explore the analysis features and insights.
                  </p>
                  <Button onClick={generateSampleData} disabled={loading} className="w-full">
                    {loading ? 'Analyzing...' : 'Load Sample Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            Financial Analysis Results
            <Badge variant="secondary">{analysisData.summary.periodLabel}</Badge>
          </CardTitle>
          <CardDescription>
            {analysisData.summary.businessName} - Comprehensive financial insights and recommendations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Owner Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Business Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysisData.ownerFriendlySummary}</p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analysisData.summary.totalRevenue, analysisData.summary.currency)}
          subtitle="Gross sales income"
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(analysisData.summary.grossProfit, analysisData.summary.currency)}
          subtitle={`${analysisData.summary.grossMarginPercent.toFixed(1)}% margin`}
          icon={TrendingUp}
          color={analysisData.summary.grossProfit >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(analysisData.summary.netProfit, analysisData.summary.currency)}
          subtitle={`${analysisData.summary.netMarginPercent.toFixed(1)}% margin`}
          icon={Target}
          color={analysisData.summary.netProfit >= 0 ? 'emerald' : 'red'}
        />
        <MetricCard
          title="Cash Flow"
          value={formatCurrency(analysisData.summary.cashFlow, analysisData.summary.currency)}
          subtitle="Inflow minus outflow"
          icon={analysisData.summary.cashFlow >= 0 ? TrendingUp : TrendingDown}
          color={analysisData.summary.cashFlow >= 0 ? 'blue' : 'amber'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Operating expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysisData.expenseBreakdown.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value, analysisData.summary.currency), 'Amount']}
                />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expense Distribution
            </CardTitle>
            <CardDescription>Share of total expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysisData.expenseBreakdown.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentageOfExpenses }) => `${category}: ${percentageOfExpenses.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {analysisData.expenseBreakdown.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(value, analysisData.summary.currency), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Insights */}
      {analysisData.productInsights.topByRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Product Performance
            </CardTitle>
            <CardDescription>{analysisData.productInsights.notes}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Top by Revenue</h4>
                <div className="space-y-2">
                  {analysisData.productInsights.topByRevenue.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{product.productName}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatCurrency(product.totalRevenue, analysisData.summary.currency)}</div>
                        <div className="text-xs text-muted-foreground">
                          Profit: {formatCurrency(product.estimatedGrossProfit || 0, analysisData.summary.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Top by Profit</h4>
                <div className="space-y-2">
                  {analysisData.productInsights.topByProfit.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{product.productName}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(product.estimatedGrossProfit, analysisData.summary.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Revenue: {formatCurrency(product.totalRevenue, analysisData.summary.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
            <CardDescription>Important observations about your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.topInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
            <CardDescription>Steps to improve your business performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.recommendedActions.map((action, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {analysisData.warnings && analysisData.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {analysisData.warnings.map((warning, index) => (
                <p key={index} className="text-sm">{warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button onClick={generateSampleData} variant="outline">
              Load Sample Data
            </Button>
            <Button onClick={() => {
              setAnalysisData(null);
              setUploadedFile(null);
            }}>
              Analyze New Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
