'use client';

import { useState, useCallback, useMemo, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Upload,
    FileText, Calculator, Lightbulb, Download, BarChart3, PieChart as PieChartIcon,
    Activity, Package, ArrowUpRight, ArrowDownRight, LucideIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

// Type definitions
interface ParsedCSVData {
    headers: string[];
    data: Record<string, string | number>[];
}

interface ColumnSummary {
    total: number;
    average: number;
    min: number;
    max: number;
    count: number;
}

interface CategoryItem {
    category: string;
    count: number;
    percentage: number;
}

interface TimeSeriesItem {
    month: string;
    revenue: number;
    count: number;
}

interface DataStructure {
    totalRows: number;
    totalColumns: number;
    numericColumns: string[];
    categoricalColumns: string[];
    revenueColumns: string[];
    costColumns: string[];
    profitColumns: string[];
    quantityColumns: string[];
    priceColumns: string[];
}

interface AnalysisData {
    summary: Record<string, ColumnSummary>;
    insights: string[];
    recommendations: string[];
    categoryAnalysis: Record<string, CategoryItem[]>;
    timeSeriesData: TimeSeriesItem[];
    dataStructure: DataStructure;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    trend?: number;
    icon: LucideIcon;
    color?: string;
}

export default function CSVProfitAnalyzer() {
    const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const { toast } = useToast();

    // Parse CSV data
    const parseCSV = useCallback((text: string): ParsedCSVData => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file must contain headers and at least one row of data');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data: Record<string, string | number>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) continue;

            const row: Record<string, string | number> = {};
            headers.forEach((header, index) => {
                let value: string | number = values[index];
                if (!isNaN(Number(value)) && value !== '') {
                    value = parseFloat(value);
                }
                row[header] = value;
            });
            data.push(row);
        }

        return { headers, data };
    }, []);

    // Analyze CSV data for profit insights
    const analyzeCSVData = useCallback((csvData: ParsedCSVData): AnalysisData => {
        const { headers, data } = csvData;

        if (data.length === 0) {
            throw new Error('No valid data found in CSV file');
        }

        const numericColumns = headers.filter(header =>
            data.every(row => !isNaN(Number(row[header])) && row[header] !== '')
        );

        const categoricalColumns = headers.filter(header =>
            !numericColumns.includes(header)
        );

        const revenueColumns = numericColumns.filter(col =>
            col.includes('revenue') || col.includes('sales') || col.includes('income')
        );

        const costColumns = numericColumns.filter(col =>
            col.includes('cost') || col.includes('expense') || col.includes('spending')
        );

        const profitColumns = numericColumns.filter(col =>
            col.includes('profit') || col.includes('margin')
        );

        const quantityColumns = numericColumns.filter(col =>
            col.includes('quantity') || col.includes('stock') || col.includes('units')
        );

        const priceColumns = numericColumns.filter(col =>
            col.includes('price') || col.includes('amount')
        );

        // Calculate summary statistics
        const summary: Record<string, ColumnSummary> = {};
        numericColumns.forEach(col => {
            const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
            summary[col] = {
                total: values.reduce((sum, val) => sum + val, 0),
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length
            };
        });

        const insights: string[] = [];
        const recommendations: string[] = [];

        if (revenueColumns.length > 0 && costColumns.length > 0) {
            const totalRevenue = summary[revenueColumns[0]].total;
            const totalCost = summary[costColumns[0]].total;
            const profit = totalRevenue - totalCost;
            const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

            insights.push(`Net profit: ${profit.toFixed(2)} (${margin.toFixed(1)}% margin)`);

            if (margin < 20) {
                recommendations.push('Consider reducing costs or increasing prices to improve profit margin');
            } else if (margin > 40) {
                recommendations.push('Strong profit margins - consider expanding operations');
            }
        }

        // Category analysis
        const categoryAnalysis: Record<string, CategoryItem[]> = {};
        categoricalColumns.forEach(col => {
            const categoryCounts = data.reduce<Record<string, number>>((acc, row) => {
                const category = String(row[col]);
                if (category && category !== '') {
                    acc[category] = (acc[category] || 0) + 1;
                }
                return acc;
            }, {});

            categoryAnalysis[col] = Object.entries(categoryCounts)
                .map(([category, count]) => ({
                    category,
                    count,
                    percentage: (count / data.length) * 100
                }))
                .sort((a, b) => b.count - a.count);
        });

        // Time series analysis
        const dateColumns = headers.filter(col => col.includes('date') || col.includes('time'));
        let timeSeriesData: TimeSeriesItem[] = [];

        if (dateColumns.length > 0 && revenueColumns.length > 0) {
            const dateCol = dateColumns[0];
            const revenueCol = revenueColumns[0];

            const monthlyData = data.reduce<Record<string, TimeSeriesItem>>((acc, row) => {
                const date = new Date(String(row[dateCol]));
                if (!isNaN(date.getTime())) {
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (!acc[monthKey]) {
                        acc[monthKey] = { month: monthKey, revenue: 0, count: 0 };
                    }
                    acc[monthKey].revenue += Number(row[revenueCol]) || 0;
                    acc[monthKey].count += 1;
                }
                return acc;
            }, {});

            timeSeriesData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
        }

        return {
            summary,
            insights,
            recommendations,
            categoryAnalysis,
            timeSeriesData,
            dataStructure: {
                totalRows: data.length,
                totalColumns: headers.length,
                numericColumns,
                categoricalColumns,
                revenueColumns,
                costColumns,
                profitColumns,
                quantityColumns,
                priceColumns
            }
        };
    }, []);

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast({ title: 'Error', description: 'Please upload a CSV file', variant: 'destructive' });
            return;
        }

        setUploadedFile(file);
        setLoading(false);

        try {
            const text = await file.text();
            setFileContent(text);
            toast({ title: 'File Uploaded', description: `File ${file.name} uploaded successfully. Click "Analyze" to process.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to read file content', variant: 'destructive' });
            setUploadedFile(null);
            setFileContent(null);
        }
    };

    const analyzeFile = () => {
        if (!fileContent) {
            toast({ title: 'Error', description: 'Please upload a file first', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const parsedData = parseCSV(fileContent);
            setCsvData(parsedData);
            const analysis = analyzeCSVData(parsedData);
            setAnalysisData(analysis);
            toast({ title: 'Analysis Complete', description: `Analyzed ${parsedData.data.length} rows from ${uploadedFile?.name}` });
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message || 'Failed to process CSV file', variant: 'destructive' });
            setCsvData(null);
            setAnalysisData(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const template = `Date,Product,Category,Quantity,Price,Revenue,Cost,Profit
2025-01-01,Laptop,Electronics,5,50000,250000,30000,220000
2025-01-02,Mouse,Accessories,10,500,5000,2000,3000`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'profit-analyzer-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'Template Downloaded', description: 'CSV template downloaded successfully' });
    };

    const generateSampleData = () => {
        const sampleCSV = `Date,Product,Category,Quantity,Price,Revenue,Cost,Profit
2025-01-01,Laptop,Electronics,5,50000,250000,30000,220000
2025-01-02,Mouse,Accessories,10,500,5000,2000,3000
2025-01-03,Keyboard,Accessories,8,1500,12000,6000,6000`;

        setLoading(true);
        try {
            const parsedData = parseCSV(sampleCSV);
            setCsvData(parsedData);
            const analysis = analyzeCSVData(parsedData);
            setAnalysisData(analysis);
            toast({ title: 'Sample Data Loaded', description: 'Analyzing sample business data for demonstration' });
        } catch {
            toast({ title: 'Error', description: 'Failed to analyze sample data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }: MetricCardProps) => (
        <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-${color}-600`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100`}>{value}</div>
                <p className={`text-xs text-${color}-700 dark:text-${color}-300`}>{subtitle}</p>
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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            CSV Profit Analyzer
                            <Badge variant="secondary">Data Intelligence</Badge>
                        </CardTitle>
                        <CardDescription>Upload your CSV file to get comprehensive profit analysis and business insights</CardDescription>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                        <TabsTrigger value="sample">Sample Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Upload CSV File
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-medium">Drop your CSV file here or click to browse</p>
                                    <Input type="file" accept=".csv" onChange={handleFileUpload} className="mt-4 cursor-pointer" disabled={loading} />
                                </div>

                                {uploadedFile && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{uploadedFile.name}</p>
                                                    <p className="text-sm text-muted-foreground">File uploaded successfully. Ready for analysis.</p>
                                                </div>
                                                <Button onClick={analyzeFile} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600">
                                                    {loading ? 'Analyzing...' : 'Analyze'}
                                                    <Calculator className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="text-center">
                                    <Button onClick={downloadTemplate} variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Template
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sample" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Try Sample Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={generateSampleData} disabled={loading} className="w-full">
                                    {loading ? 'Analyzing...' : 'Load Sample Data'}
                                </Button>
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
                            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        Profit Analysis Dashboard
                        <Badge variant="secondary">{uploadedFile?.name || 'Sample Data'}</Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Records" value={analysisData.dataStructure.totalRows} subtitle="Data rows analyzed" icon={Package} color="blue" />
                <MetricCard title="Columns Detected" value={analysisData.dataStructure.totalColumns} subtitle={`${analysisData.dataStructure.numericColumns.length} numeric`} icon={BarChart3} color="green" />
                <MetricCard title="Categories Found" value={Object.keys(analysisData.categoryAnalysis).length} subtitle="Data categories" icon={Target} color="purple" />
                <MetricCard title="Insights Generated" value={analysisData.insights.length + analysisData.recommendations.length} subtitle={`${analysisData.insights.length} insights`} icon={Lightbulb} color="amber" />
            </div>

            <div className="text-center">
                <Button onClick={() => { setCsvData(null); setAnalysisData(null); setUploadedFile(null); setFileContent(null); }} variant="outline">
                    Analyze New File
                </Button>
            </div>
        </div>
    );
}
