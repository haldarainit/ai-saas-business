'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package2, DollarSign, TrendingUp, Activity, Upload, Factory, ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Analytics from '../components/Analytics';
import CSVUpload from '../components/CSVUpload';

export default function TradingInventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('inventory');
    const [showCSVUpload, setShowCSVUpload] = useState(false);
    const { toast } = useToast();

    // Form state
    const [shelves, setShelves] = useState(['Default', 'A1', 'A2', 'B1', 'B2']);
    const [newShelf, setNewShelf] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        category: 'Uncategorized',
        price: '',
        cost: '',
        quantity: '0',
        shelf: 'Default',
        expiryDate: '',
        supplier: ''
    });

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/inventory/products', {
                    cache: 'no-store',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setProducts(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error('Error in fetchProducts:', error);
                toast({
                    title: 'Error Loading Products',
                    description: error.message || 'Failed to load products. Please try again later.',
                    variant: 'destructive',
                });
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [toast]);

    // Handle CSV upload success
    const handleCSVUploadSuccess = (result) => {
        // Refresh products list
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/inventory/products', {
                    cache: 'no-store',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setProducts(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error('Error refreshing products:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to refresh products list',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    };

    // Handle empty or error states
    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            );
        }

        if (!Array.isArray(products) || products.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No products found</h3>
                    <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'No products match your search' : 'Get started by adding your first product'}
                    </p>
                    <Button
                        className="mt-4"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            );
        }

        return (
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden animate-in fade-in duration-500">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => requestSort('name')}
                            >
                                <div className="flex items-center">
                                    Name
                                    {sortConfig.key === 'name' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('sku')}
                            >
                                <div className="flex items-center justify-center">
                                    SKU
                                    {sortConfig.key === 'sku' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('category')}
                            >
                                <div className="flex items-center justify-center">
                                    Category
                                    {sortConfig.key === 'category' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('cost')}
                            >
                                <div className="flex items-center justify-center">
                                    Cost Price
                                    {sortConfig.key === 'cost' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('price')}
                            >
                                <div className="flex items-center justify-center">
                                    Selling Price
                                    {sortConfig.key === 'price' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('profit')}
                            >
                                <div className="flex items-center justify-center">
                                    Profit
                                    {sortConfig.key === 'profit' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('quantity')}
                            >
                                <div className="flex items-center justify-center">
                                    In Stock
                                    {sortConfig.key === 'quantity' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('shelf')}
                            >
                                <div className="flex items-center justify-center">
                                    Shelf
                                    {sortConfig.key === 'shelf' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-accent transition-colors text-center"
                                onClick={() => requestSort('expiryDate')}
                            >
                                <div className="flex items-center justify-center">
                                    Expires
                                    {sortConfig.key === 'expiryDate' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAndFilteredProducts.map((product) => (
                            <TableRow
                                key={product._id}
                                className={getRowClass(product)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        {renderExpiryBadge(product)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">{product.sku}</TableCell>
                                <TableCell className="text-center">{product.category}</TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-block text-left">
                                        <div>₹{product.cost?.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">Cost</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-block text-left">
                                        <div>₹{product.price?.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">Selling</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-block text-left">
                                        <div className={product.price - product.cost >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            ₹{((product.price - product.cost) * product.quantity).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {product.price - product.cost >= 0 ? '+' : ''}₹{(product.price - product.cost).toFixed(2)} per unit
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">{product.quantity}</TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {product.shelf || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {product.expiryDate
                                        ? new Date(product.expiryDate).toLocaleDateString()
                                        : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-muted hover:text-muted-foreground transition-colors"
                                            onClick={() => handleEdit(product)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={() => handleDelete(product._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    // Helper function to get row class based on expiry
    const getRowClass = (product) => {
        if (!product.expiryDate) return 'hover:bg-muted/50 transition-colors';

        const expiry = new Date(product.expiryDate);
        const today = new Date();

        if (expiry < today) return 'bg-destructive/10 hover:bg-destructive/20 transition-colors border-l-4 border-l-destructive';

        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 15) return 'bg-amber-50/80 hover:bg-amber-100/80 transition-colors border-l-4 border-l-amber-500 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';

        return 'hover:bg-muted/50 transition-colors';
    };

    // Render expiry badge
    const renderExpiryBadge = (product) => {
        if (!product.expiryDate) return null;

        const expiry = new Date(product.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return (
                <span className="text-xs text-red-500">
                    Expired {Math.abs(daysUntilExpiry)} days ago
                </span>
            );
        } else if (daysUntilExpiry <= 15) {
            return (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-full">
                    Expires in {daysUntilExpiry} days
                </span>
            );
        }

        return null;
    };

    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const totalProfit = products.reduce((sum, product) => sum + ((product.price - product.cost) * product.quantity), 0);

    const aboutToExpire = products.filter(product => {
        if (!product.expiryDate) return false;
        const expiry = new Date(product.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 15 && daysUntilExpiry >= 0;
    }).length;

    // Add new shelf
    const addShelf = (e) => {
        e.preventDefault();
        if (newShelf.trim() && !shelves.includes(newShelf.trim())) {
            setShelves([...shelves, newShelf.trim()]);
            setFormData(prev => ({ ...prev, shelf: newShelf.trim() }));
            setNewShelf('');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            sku: '',
            category: 'Uncategorized',
            price: '',
            cost: '',
            quantity: '0',
            shelf: 'Default',
            expiryDate: '',
            supplier: ''
        });
        setEditingProduct(null);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const url = editingProduct
            ? `/api/inventory/products/${editingProduct._id}`
            : '/api/inventory/products';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            // Basic validation
            const validationErrors = [];

            if (!formData.name?.trim()) validationErrors.push('Name is required');
            if (!formData.sku?.trim()) validationErrors.push('SKU is required');
            if (!formData.price) validationErrors.push('Price is required');
            if (formData.cost === undefined || formData.cost === '') validationErrors.push('Cost is required');
            if (formData.quantity === undefined || formData.quantity === '') validationErrors.push('Quantity is required');

            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join('\n'));
            }

            // Prepare the request body
            const requestBody = {
                ...formData,
                name: String(formData.name).trim(),
                sku: String(formData.sku).trim(),
                description: formData.description ? String(formData.description).trim() : '',
                category: formData.category ? String(formData.category).trim() : 'Uncategorized',
                price: parseFloat(formData.price),
                cost: parseFloat(formData.cost || 0),
                quantity: parseInt(formData.quantity, 10) || 0,
                shelf: formData.shelf || 'Default',
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
                supplier: formData.supplier ? String(formData.supplier).trim() : ''
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Invalid server response. Please try again.');
            }

            if (!response.ok) {
                let errorMessage = responseData?.message || `Server responded with ${response.status}`;

                if (response.status === 400 && responseData?.errors) {
                    if (typeof responseData.errors === 'object') {
                        errorMessage = Object.values(responseData.errors).join('\n');
                    } else if (Array.isArray(responseData.errors)) {
                        errorMessage = responseData.errors.join('\n');
                    }
                }

                throw new Error(errorMessage);
            }

            // Update local state
            if (editingProduct) {
                setProducts(products.map(p => p._id === editingProduct._id ? responseData : p));
                toast({
                    title: 'Success',
                    description: 'Product updated successfully',
                });
            } else {
                setProducts([responseData, ...products]);
                toast({
                    title: 'Success',
                    description: 'Product added successfully',
                });
            }

            // Reset form and close modal
            resetForm();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save product. Please check your input and try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle edit product
    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            sku: product.sku || '',
            category: product.category || 'Uncategorized',
            price: product.price?.toString() || '',
            cost: product.cost?.toString() || '',
            quantity: product.quantity?.toString() || '0',
            shelf: product.shelf || 'Default',
            expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
            supplier: product.supplier || ''
        });
        setIsModalOpen(true);
    };

    // Handle delete product
    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/inventory/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete product');
            }

            // Update local state
            setProducts(products.filter(p => p._id !== productId));

            toast({
                title: 'Success',
                description: 'Product deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete product',
                variant: 'destructive',
            });
        }
    };

    // Sort products
    const sortProducts = (products) => {
        if (!sortConfig.key) return products;

        return [...products].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle profit calculation
            if (sortConfig.key === 'profit') {
                aValue = (a.price - a.cost) * a.quantity;
                bValue = (b.price - b.cost) * b.quantity;
            }

            // Handle nested properties if needed
            if (sortConfig.key === 'expiryDate' && aValue && bValue) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle undefined/null values
            if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
            if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

            // Compare values
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Handle sort request
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting to filtered products
    const sortedAndFilteredProducts = sortProducts(filteredProducts);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                            <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Trading Inventory
                                </h1>
                                <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                                    Trading Mode
                                </span>
                            </div>
                            <p className="text-muted-foreground text-lg">
                                Buy products and sell at higher prices • Simple buy/sell tracking
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/inventory-management">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <Link href="/inventory-management/manufacturing">
                        <Button variant="outline" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                            <Factory className="h-4 w-4" />
                            Manufacturing Mode
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Items in inventory</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Inventory worth</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalProfit.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Potential profit</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{aboutToExpire}</div>
                        <p className="text-xs text-muted-foreground">Within 15 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="inventory" className="gap-2">
                        <Package2 className="h-4 w-4" />
                        Inventory
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2">
                        <Upload className="h-4 w-4" />
                        CSV Upload
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="space-y-6">
                    {/* Search and Add */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, SKU, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        resetForm();
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Product
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                                <DialogHeader className="flex-shrink-0">
                                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                                    <DialogDescription>
                                        {editingProduct ? 'Update the product details below.' : 'Fill in the details to add a new product to your trading inventory.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-4">
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">
                                                Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="description" className="text-right">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="col-span-3"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="sku" className="text-right">
                                                SKU <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="sku"
                                                value={formData.sku}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                className="col-span-3"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="category" className="text-right">
                                                Category
                                            </Label>
                                            <Input
                                                id="category"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="cost" className="text-right">
                                                Cost <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="col-span-3 relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                                                <Input
                                                    id="cost"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.cost}
                                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                                    className="pl-8"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="price" className="text-right">
                                                Selling Price <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="col-span-3 relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="pl-8"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="quantity" className="text-right">
                                                Quantity <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                className="col-span-3"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="shelf" className="text-right">
                                                Shelf
                                            </Label>
                                            <div className="flex gap-2 col-span-3">
                                                <select
                                                    id="shelf"
                                                    value={formData.shelf}
                                                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {shelves.map((shelf) => (
                                                        <option key={shelf} value={shelf}>
                                                            {shelf}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="New shelf"
                                                        value={newShelf}
                                                        onChange={(e) => setNewShelf(e.target.value)}
                                                        className="w-24"
                                                    />
                                                    <Button type="button" variant="outline" size="sm" onClick={addShelf}>
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="expiryDate" className="text-right">
                                                Expiry Date
                                            </Label>
                                            <Input
                                                id="expiryDate"
                                                type="date"
                                                value={formData.expiryDate}
                                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="supplier" className="text-right">
                                                Supplier
                                            </Label>
                                            <Input
                                                id="supplier"
                                                value={formData.supplier}
                                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Products Table */}
                    {renderContent()}
                </TabsContent>

                <TabsContent value="analytics">
                    <Analytics products={products} />
                </TabsContent>

                <TabsContent value="upload">
                    <CSVUpload onUploadSuccess={handleCSVUploadSuccess} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
