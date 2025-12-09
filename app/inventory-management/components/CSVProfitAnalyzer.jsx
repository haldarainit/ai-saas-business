'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Target, 
  Upload,
  FileText,
  Calculator,
  Lightbulb,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function CSVProfitAnalyzer() {
  const [csvData, setCsvData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const { toast } = useToast();

  // Parse CSV data
  const parseCSV = useCallback((text) => {
    console.log('Starting CSV parsing...');
    const lines = text.trim().split('\n');
    console.log('Total lines:', lines.length);
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one row of data');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log('Headers:', headers);
    
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      console.log(`Line ${i} values:`, values);
      
      if (values.length !== headers.length) {
        console.log(`Skipping line ${i} - value count mismatch`);
        continue;
      }

      const row = {};
      headers.forEach((header, index) => {
        let value = values[index];
        
        // Try to parse as number
        if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        
        row[header] = value;
      });
      
      data.push(row);
    }

    console.log('Parsed rows:', data.length);
    return { headers, data };
  }, []);

  // Analyze CSV data for profit insights
  const analyzeCSVData = useCallback((csvData) => {
    const { headers, data } = csvData;
    
    if (data.length === 0) {
      throw new Error('No valid data found in CSV file');
    }

    // Detect data structure and infer types
    const numericColumns = headers.filter(header => 
      data.every(row => !isNaN(row[header]) && row[header] !== '')
    );

    const categoricalColumns = headers.filter(header => 
      !numericColumns.includes(header)
    );

    // Try to identify common business columns
    const revenueColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('revenue') || 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('income')
    );

    const costColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('cost') || 
      col.toLowerCase().includes('expense') ||
      col.toLowerCase().includes('spending')
    );

    const profitColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('profit') || 
      col.toLowerCase().includes('margin')
    );

    const quantityColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('quantity') || 
      col.toLowerCase().includes('stock') || 
      col.toLowerCase().includes('units')
    );

    const priceColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('amount')
    );

    // Calculate summary statistics
    const summary = {};
    numericColumns.forEach(col => {
      const values = data.map(row => row[col]).filter(v => !isNaN(v));
      summary[col] = {
        total: values.reduce((sum, val) => sum + val, 0),
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });

    // Generate insights based on data patterns
    const insights = [];
    const recommendations = [];

    // Revenue insights
    if (revenueColumns.length > 0) {
      const totalRevenue = summary[revenueColumns[0]].total;
      insights.push(`Total revenue: ${totalRevenue.toFixed(2)}`);
      
      if (costColumns.length > 0) {
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
    }

    // Category analysis
    const categoryAnalysis = {};
    categoricalColumns.forEach(col => {
      const categoryCounts = data.reduce((acc, row) => {
        const category = row[col];
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

    // Time series analysis if date column exists
    const dateColumns = headers.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time')
    );

    let timeSeriesData = [];
    if (dateColumns.length > 0 && revenueColumns.length > 0) {
      const dateCol = dateColumns[0];
      const revenueCol = revenueColumns[0];
      
      const monthlyData = data.reduce((acc, row) => {
        const date = new Date(row[dateCol]);
        if (!isNaN(date)) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, revenue: 0, count: 0 };
          }
          acc[monthKey].revenue += row[revenueCol] || 0;
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

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    console.log('File selected:', file);
    
    if (!file) return;

    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    if (!file.name.endsWith('.csv')) {
      console.log('File is not CSV');
      toast({
        title: 'Error',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    setLoading(false);
    console.log('File uploaded, ready for analysis');

    try {
      const text = await file.text();
      console.log('File text length:', text.length);
      console.log('First 200 chars:', text.substring(0, 200));
      setFileContent(text);
      
      toast({
        title: 'File Uploaded',
        description: `File ${file.name} uploaded successfully. Click "Analyze" to process.`,
      });
    } catch (error) {
      console.error('File reading error:', error);
      toast({
        title: 'Error',
        description: 'Failed to read file content',
        variant: 'destructive',
      });
      setUploadedFile(null);
      setFileContent(null);
    }
  };

  // Test function to verify button clicks
  const testClick = () => {
    console.log('Test button clicked!');
    alert('Button click is working!');
  };

  // Analyze the uploaded file
  const analyzeFile = () => {
    console.log('Analyze button clicked!');
    console.log('fileContent exists:', !!fileContent);
    console.log('fileContent length:', fileContent?.length);
    console.log('uploadedFile:', uploadedFile);
    
    if (!fileContent) {
      console.log('No file content - showing error');
      toast({
        title: 'Error',
        description: 'Please upload a file first',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting analysis...');
    setLoading(true);

    try {
      const parsedData = parseCSV(fileContent);
      console.log('Parsed data:', parsedData);
      setCsvData(parsedData);
      
      const analysis = analyzeCSVData(parsedData);
      console.log('Analysis result:', analysis);
      setAnalysisData(analysis);
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${parsedData.data.length} rows from ${uploadedFile.name}`,
      });
    } catch (error) {
      console.error('CSV processing error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process CSV file',
        variant: 'destructive',
      });
      setCsvData(null);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = `Date,Product,Category,Quantity,Price,Revenue,Cost,Profit
2025-01-01,Laptop,Electronics,5,50000,250000,30000,220000
2025-01-02,Mouse,Accessories,10,500,5000,2000,3000
2025-01-03,Keyboard,Accessories,8,1500,12000,6000,6000
2025-01-04,Monitor,Electronics,3,15000,45000,27000,18000
2025-01-05,Phone,Electronics,7,25000,175000,105000,70000`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profit-analyzer-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template downloaded successfully',
    });
  };

  // Generate sample data
  const generateSampleData = () => {
    const sampleCSV = `Date,Product,Category,Quantity,Price,Revenue,Cost,Profit
2025-01-01,Laptop,Electronics,5,50000,250000,30000,220000
2025-01-02,Mouse,Accessories,10,500,5000,2000,3000
2025-01-03,Keyboard,Accessories,8,1500,12000,6000,6000
2025-01-04,Monitor,Electronics,3,15000,45000,27000,18000
2025-01-05,Phone,Electronics,7,25000,175000,105000,70000
2025-01-06,Tablet,Electronics,4,20000,80000,48000,32000
2025-01-07,Headphones,Accessories,12,1000,12000,6000,6000
2025-01-08,Charger,Accessories,15,200,3000,1200,1800
2025-01-09,Speaker,Electronics,6,3000,18000,10800,7200
2025-01-10,Webcam,Accessories,9,1500,13500,8100,5400`;

    setLoading(true);
    try {
      const parsedData = parseCSV(sampleCSV);
      setCsvData(parsedData);
      
      const analysis = analyzeCSVData(parsedData);
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Metric card component
  const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) => (
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
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              CSV Profit Analyzer
              <Badge variant="secondary">Data Intelligence</Badge>
            </CardTitle>
            <CardDescription>
              Upload your CSV file to get comprehensive profit analysis and business insights
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Upload Options */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="sample">Sample Data</TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with your business data for automated analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Supports any CSV format with headers. The system will automatically detect and analyze your data.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-4 cursor-pointer"
                    disabled={loading}
                  />
                </div>
                
                {/* File Status and Analyze Button */}
                {uploadedFile && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            File uploaded successfully. Ready for analysis.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={testClick} 
                            variant="outline"
                            size="sm"
                          >
                            Test
                          </Button>
                          <Button 
                            onClick={analyzeFile} 
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {loading ? 'Analyzing...' : 'Analyze'}
                            <Calculator className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
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

            {/* Format Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  CSV Format Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">The system automatically detects:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Revenue, sales, or income columns</li>
                      <li>Cost, expense, or spending columns</li>
                      <li>Profit or margin columns</li>
                      <li>Quantity and price columns</li>
                      <li>Product and category columns</li>
                      <li>Date columns for time series analysis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recommended columns:</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
Date,Product,Category,Quantity,Price,Revenue,Cost,Profit
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
                    This will load sample business data including products, sales, costs, and profits. 
                    The system will automatically analyze the data and provide insights.
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

  // Render analysis dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            Profit Analysis Dashboard
            <Badge variant="secondary">{uploadedFile?.name || 'Sample Data'}</Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your business data with AI-powered insights
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Records"
          value={analysisData.dataStructure.totalRows}
          subtitle="Data rows analyzed"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Columns Detected"
          value={analysisData.dataStructure.totalColumns}
          subtitle={`${analysisData.dataStructure.numericColumns.length} numeric`}
          icon={BarChart3}
          color="green"
        />
        <MetricCard
          title="Categories Found"
          value={Object.keys(analysisData.categoryAnalysis).length}
          subtitle="Data categories"
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Insights Generated"
          value={analysisData.insights.length + analysisData.recommendations.length}
          subtitle={`${analysisData.insights.length} insights, ${analysisData.recommendations.length} recommendations`}
          icon={Lightbulb}
          color="amber"
        />
      </div>

      {/* Key Metrics */}
      {Object.keys(analysisData.summary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(analysisData.summary).slice(0, 6).map(([key, data]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <h4 className="font-medium capitalize mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">{data.total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {data.average.toFixed(2)} | Min: {data.min.toFixed(2)} | Max: {data.max.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        {Object.keys(analysisData.categoryAnalysis).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.values(analysisData.categoryAnalysis)[0].slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {Object.values(analysisData.categoryAnalysis)[0].slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Time Series */}
        {analysisData.timeSeriesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysisData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights and Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Structure Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Structure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Numeric Columns</h4>
              <div className="space-y-1">
                {analysisData.dataStructure.numericColumns.map(col => (
                  <Badge key={col} variant="secondary" className="mr-1 mb-1">{col}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Categorical Columns</h4>
              <div className="space-y-1">
                {analysisData.dataStructure.categoricalColumns.map(col => (
                  <Badge key={col} variant="outline" className="mr-1 mb-1">{col}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Detected Types</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {analysisData.dataStructure.revenueColumns.length > 0 && (
                  <p>Revenue: {analysisData.dataStructure.revenueColumns.join(', ')}</p>
                )}
                {analysisData.dataStructure.costColumns.length > 0 && (
                  <p>Cost: {analysisData.dataStructure.costColumns.join(', ')}</p>
                )}
                {analysisData.dataStructure.profitColumns.length > 0 && (
                  <p>Profit: {analysisData.dataStructure.profitColumns.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="text-center">
        <Button 
          onClick={() => {
            setCsvData(null);
            setAnalysisData(null);
            setUploadedFile(null);
            setFileContent(null);
          }}
          variant="outline"
        >
          Analyze New File
        </Button>
      </div>
    </div>
  );
}
