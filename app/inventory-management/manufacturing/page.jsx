'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Plus, Search, Edit, Trash2, AlertTriangle, Package2, DollarSign,
    TrendingUp, Activity, Factory, Boxes, Cog, ArrowRight, ArrowLeft,
    ClipboardList, RefreshCcw, ShoppingCart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function ManufacturingInventory() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('raw-materials');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Raw Materials State
    const [rawMaterials, setRawMaterials] = useState([]);
    const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);
    const [editingRawMaterial, setEditingRawMaterial] = useState(null);
    const [rawMaterialForm, setRawMaterialForm] = useState({
        name: '',
        description: '',
        sku: '',
        category: 'Uncategorized',
        unit: 'pcs',
        costPerUnit: '',
        quantity: '0',
        minimumStock: '10',
        shelf: 'Default',
        expiryDate: '',
        supplier: '',
        supplierContact: ''
    });

    // Manufacturing Products State
    const [manufacturingProducts, setManufacturingProducts] = useState([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        sku: '',
        category: 'Uncategorized',
        sellingPrice: '',
        manufacturingCost: '0',
        minimumStock: '10',
        shelf: 'Default',
        billOfMaterials: []
    });

    // Production State
    const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
    const [selectedProductForProduction, setSelectedProductForProduction] = useState(null);
    const [productionQuantity, setProductionQuantity] = useState('1');
    const [productionNotes, setProductionNotes] = useState('');
    const [productionLogs, setProductionLogs] = useState([]);

    // BOM Editor State
    const [bomEditorOpen, setBomEditorOpen] = useState(false);
    const [selectedBomRawMaterial, setSelectedBomRawMaterial] = useState('');
    const [bomQuantity, setBomQuantity] = useState('');

    const unitOptions = ['pcs', 'kg', 'g', 'ltr', 'ml', 'meter', 'cm', 'sqft', 'sqm', 'unit', 'box', 'pack'];

    // Fetch all data
    useEffect(() => {
        fetchRawMaterials();
        fetchManufacturingProducts();
        fetchProductionLogs();
    }, []);

    const fetchRawMaterials = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/inventory/raw-materials', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setRawMaterials(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching raw materials:', error);
            toast({
                title: 'Error',
                description: 'Failed to load raw materials',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchManufacturingProducts = async () => {
        try {
            const response = await fetch('/api/inventory/manufacturing-products', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setManufacturingProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching manufacturing products:', error);
        }
    };

    const fetchProductionLogs = async () => {
        try {
            const response = await fetch('/api/inventory/production?limit=20', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setProductionLogs(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching production logs:', error);
        }
    };

    // Raw Material CRUD
    const resetRawMaterialForm = () => {
        setRawMaterialForm({
            name: '',
            description: '',
            sku: '',
            category: 'Uncategorized',
            unit: 'pcs',
            costPerUnit: '',
            quantity: '0',
            minimumStock: '10',
            shelf: 'Default',
            expiryDate: '',
            supplier: '',
            supplierContact: ''
        });
        setEditingRawMaterial(null);
    };

    const handleRawMaterialSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingRawMaterial
                ? `/api/inventory/raw-materials/${editingRawMaterial._id}`
                : '/api/inventory/raw-materials';
            const method = editingRawMaterial ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...rawMaterialForm,
                    costPerUnit: parseFloat(rawMaterialForm.costPerUnit),
                    quantity: parseFloat(rawMaterialForm.quantity),
                    minimumStock: parseInt(rawMaterialForm.minimumStock, 10)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save raw material');
            }

            toast({
                title: 'Success',
                description: editingRawMaterial ? 'Raw material updated' : 'Raw material added'
            });

            resetRawMaterialForm();
            setIsRawMaterialModalOpen(false);
            fetchRawMaterials();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditRawMaterial = (material) => {
        setEditingRawMaterial(material);
        setRawMaterialForm({
            name: material.name || '',
            description: material.description || '',
            sku: material.sku || '',
            category: material.category || 'Uncategorized',
            unit: material.unit || 'pcs',
            costPerUnit: material.costPerUnit?.toString() || '',
            quantity: material.quantity?.toString() || '0',
            minimumStock: material.minimumStock?.toString() || '10',
            shelf: material.shelf || 'Default',
            expiryDate: material.expiryDate ? new Date(material.expiryDate).toISOString().split('T')[0] : '',
            supplier: material.supplier || '',
            supplierContact: material.supplierContact || ''
        });
        setIsRawMaterialModalOpen(true);
    };

    const handleDeleteRawMaterial = async (id) => {
        if (!window.confirm('Are you sure you want to delete this raw material?')) return;

        try {
            const response = await fetch(`/api/inventory/raw-materials/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete');
            }

            toast({ title: 'Success', description: 'Raw material deleted' });
            fetchRawMaterials();
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // Manufacturing Product CRUD
    const resetProductForm = () => {
        setProductForm({
            name: '',
            description: '',
            sku: '',
            category: 'Uncategorized',
            sellingPrice: '',
            manufacturingCost: '0',
            minimumStock: '10',
            shelf: 'Default',
            billOfMaterials: []
        });
        setEditingProduct(null);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingProduct
                ? `/api/inventory/manufacturing-products/${editingProduct._id}`
                : '/api/inventory/manufacturing-products';
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...productForm,
                    sellingPrice: parseFloat(productForm.sellingPrice),
                    manufacturingCost: parseFloat(productForm.manufacturingCost || 0),
                    minimumStock: parseInt(productForm.minimumStock, 10),
                    billOfMaterials: productForm.billOfMaterials.map(item => ({
                        rawMaterialId: item.rawMaterialId,
                        quantityRequired: parseFloat(item.quantityRequired)
                    }))
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save product');
            }

            toast({
                title: 'Success',
                description: editingProduct ? 'Product updated' : 'Product created'
            });

            resetProductForm();
            setIsProductModalOpen(false);
            fetchManufacturingProducts();
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            sku: product.sku || '',
            category: product.category || 'Uncategorized',
            sellingPrice: product.sellingPrice?.toString() || '',
            manufacturingCost: product.manufacturingCost?.toString() || '0',
            minimumStock: product.minimumStock?.toString() || '10',
            shelf: product.shelf || 'Default',
            billOfMaterials: product.billOfMaterials || []
        });
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/inventory/manufacturing-products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete');
            }

            toast({ title: 'Success', description: 'Product deleted' });
            fetchManufacturingProducts();
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // BOM Management
    const addToBom = () => {
        if (!selectedBomRawMaterial || !bomQuantity) return;

        const rawMaterial = rawMaterials.find(rm => rm._id === selectedBomRawMaterial);
        if (!rawMaterial) return;

        const existingIndex = productForm.billOfMaterials.findIndex(
            item => item.rawMaterialId === selectedBomRawMaterial
        );

        if (existingIndex >= 0) {
            // Update existing
            const updated = [...productForm.billOfMaterials];
            updated[existingIndex].quantityRequired = parseFloat(bomQuantity);
            setProductForm({ ...productForm, billOfMaterials: updated });
        } else {
            // Add new
            setProductForm({
                ...productForm,
                billOfMaterials: [
                    ...productForm.billOfMaterials,
                    {
                        rawMaterialId: rawMaterial._id,
                        rawMaterialName: rawMaterial.name,
                        rawMaterialSku: rawMaterial.sku,
                        quantityRequired: parseFloat(bomQuantity),
                        unit: rawMaterial.unit,
                        costPerUnit: rawMaterial.costPerUnit
                    }
                ]
            });
        }

        setSelectedBomRawMaterial('');
        setBomQuantity('');
    };

    const removeFromBom = (index) => {
        const updated = [...productForm.billOfMaterials];
        updated.splice(index, 1);
        setProductForm({ ...productForm, billOfMaterials: updated });
    };

    const calculateBomCost = () => {
        return productForm.billOfMaterials.reduce((total, item) => {
            return total + (item.quantityRequired * item.costPerUnit);
        }, 0);
    };

    // Production
    const openProductionModal = (product) => {
        setSelectedProductForProduction(product);
        setProductionQuantity('1');
        setProductionNotes('');
        setIsProductionModalOpen(true);
    };

    const handleProduction = async () => {
        if (!selectedProductForProduction) return;

        try {
            setLoading(true);
            const response = await fetch('/api/inventory/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    productId: selectedProductForProduction._id,
                    quantityToProduce: parseInt(productionQuantity, 10),
                    notes: productionNotes
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.insufficientMaterials) {
                    const shortages = result.insufficientMaterials.map(m =>
                        `${m.name}: need ${m.required} ${m.unit}, have ${m.available} ${m.unit}`
                    ).join('\n');
                    throw new Error(`Insufficient materials:\n${shortages}`);
                }
                throw new Error(result.message || 'Production failed');
            }

            toast({
                title: 'Production Complete! 🎉',
                description: `Produced ${productionQuantity} units of ${selectedProductForProduction.name}. Cost: ₹${result.summary.totalProductionCost.toFixed(2)}`
            });

            setIsProductionModalOpen(false);
            fetchManufacturingProducts();
            fetchRawMaterials();
            fetchProductionLogs();
        } catch (error) {
            toast({ title: 'Production Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // Metrics
    const totalRawMaterialValue = rawMaterials.reduce((sum, m) => sum + (m.costPerUnit * m.quantity), 0);
    const lowStockMaterials = rawMaterials.filter(m => m.quantity <= m.minimumStock).length;
    const totalFinishedProducts = manufacturingProducts.reduce((sum, p) => sum + p.finishedQuantity, 0);
    const totalFinishedValue = manufacturingProducts.reduce((sum, p) => sum + (p.sellingPrice * p.finishedQuantity), 0);
    const totalPotentialProfit = manufacturingProducts.reduce((sum, p) =>
        sum + ((p.sellingPrice - p.totalCost) * p.finishedQuantity), 0
    );

    // Filter helper
    const filterItems = (items, term) => {
        if (!term) return items;
        const lower = term.toLowerCase();
        return items.filter(item =>
            item.name?.toLowerCase().includes(lower) ||
            item.sku?.toLowerCase().includes(lower) ||
            item.category?.toLowerCase().includes(lower)
        );
    };

    const filteredRawMaterials = filterItems(rawMaterials, searchTerm);
    const filteredProducts = filterItems(manufacturingProducts, searchTerm);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header - Compact */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory-management">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <Factory className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    Manufacturing Inventory
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Raw materials, products & production
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <Link href="/inventory-management/trading">
                    <Button variant="outline" size="sm" className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <ShoppingCart className="h-4 w-4" />
                        Trading
                    </Button>
                </Link>
            </div>

            {/* Dashboard Cards - Compact */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium">Raw Materials</CardTitle>
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-md">
                            <Boxes className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{rawMaterials.length}</div>
                        <p className="text-xs text-muted-foreground">₹{totalRawMaterialValue.toFixed(0)} value</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium">Low Stock</CardTitle>
                        <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-md">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">{lowStockMaterials}</div>
                        <p className="text-xs text-muted-foreground">Need restocking</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium">Products</CardTitle>
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md">
                            <Cog className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{manufacturingProducts.length}</div>
                        <p className="text-xs text-muted-foreground">{totalFinishedProducts} units</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium">Finished Value</CardTitle>
                        <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">
                            <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">₹{totalFinishedValue.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">Selling value</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium">Profit</CardTitle>
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">
                            <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className={`text-xl font-bold ${totalPotentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            ₹{totalPotentialProfit.toFixed(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">On current stock</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="raw-materials" className="gap-2">
                        <Boxes className="h-4 w-4" />
                        Raw Materials
                    </TabsTrigger>
                    <TabsTrigger value="products" className="gap-2">
                        <Package2 className="h-4 w-4" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="production" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Production Log
                    </TabsTrigger>
                </TabsList>

                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, SKU, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => { fetchRawMaterials(); fetchManufacturingProducts(); }}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Raw Materials Tab */}
                <TabsContent value="raw-materials" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Raw Materials Inventory</h2>
                        <Button
                            onClick={() => { resetRawMaterialForm(); setIsRawMaterialModalOpen(true); }}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Raw Material
                        </Button>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : filteredRawMaterials.length === 0 ? (
                        <div className="text-center py-12">
                            <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No raw materials found</h3>
                            <p className="text-muted-foreground">Add your first raw material to get started</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-center">SKU</TableHead>
                                        <TableHead className="text-center">Category</TableHead>
                                        <TableHead className="text-center">Cost/Unit</TableHead>
                                        <TableHead className="text-center">In Stock</TableHead>
                                        <TableHead className="text-center">Value</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRawMaterials.map((material) => (
                                        <TableRow key={material._id} className={material.quantity <= material.minimumStock ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{material.name}</div>
                                                    {material.supplier && (
                                                        <div className="text-xs text-muted-foreground">Supplier: {material.supplier}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{material.sku}</TableCell>
                                            <TableCell className="text-center">{material.category}</TableCell>
                                            <TableCell className="text-center">₹{material.costPerUnit?.toFixed(2)} / {material.unit}</TableCell>
                                            <TableCell className="text-center font-medium">{material.quantity} {material.unit}</TableCell>
                                            <TableCell className="text-center">₹{(material.costPerUnit * material.quantity).toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                {material.quantity <= material.minimumStock ? (
                                                    <Badge variant="destructive">Low Stock</Badge>
                                                ) : (
                                                    <Badge variant="secondary">In Stock</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditRawMaterial(material)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRawMaterial(material._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Manufacturing Products</h2>
                        <Button
                            onClick={() => { resetProductForm(); setIsProductModalOpen(true); }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No products found</h3>
                            <p className="text-muted-foreground">Create your first product with Bill of Materials</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((product) => (
                                <Card key={product._id} className="relative overflow-hidden">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                                <CardDescription>{product.sku} • {product.category}</CardDescription>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(product._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Cost breakdown */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <div className="text-muted-foreground">Raw Material Cost</div>
                                                <div className="font-medium">₹{product.rawMaterialCost?.toFixed(2) || '0.00'}</div>
                                            </div>
                                            <div className="p-2 bg-muted rounded-lg">
                                                <div className="text-muted-foreground">Manufacturing Cost</div>
                                                <div className="font-medium">₹{product.manufacturingCost?.toFixed(2) || '0.00'}</div>
                                            </div>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <div className="text-muted-foreground">Total Cost</div>
                                                <div className="font-bold text-blue-600">₹{product.totalCost?.toFixed(2) || '0.00'}</div>
                                            </div>
                                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <div className="text-muted-foreground">Selling Price</div>
                                                <div className="font-bold text-green-600">₹{product.sellingPrice?.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        {/* Profit info */}
                                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Profit per unit</div>
                                                <div className={`font-bold ${(product.sellingPrice - product.totalCost) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ₹{(product.sellingPrice - product.totalCost).toFixed(2)}
                                                    <span className="text-xs ml-1">
                                                        ({product.sellingPrice > 0 ? (((product.sellingPrice - product.totalCost) / product.sellingPrice) * 100).toFixed(1) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">In Stock</div>
                                                <div className="font-bold">{product.finishedQuantity} units</div>
                                            </div>
                                        </div>

                                        {/* BOM Summary */}
                                        {product.billOfMaterials && product.billOfMaterials.length > 0 && (
                                            <div className="text-xs">
                                                <div className="font-medium mb-1">Bill of Materials ({product.billOfMaterials.length} items):</div>
                                                <div className="text-muted-foreground">
                                                    {product.billOfMaterials.slice(0, 3).map((item, i) => (
                                                        <span key={i}>
                                                            {item.rawMaterialName} ({item.quantityRequired} {item.unit})
                                                            {i < Math.min(product.billOfMaterials.length, 3) - 1 && ', '}
                                                        </span>
                                                    ))}
                                                    {product.billOfMaterials.length > 3 && ` +${product.billOfMaterials.length - 3} more`}
                                                </div>
                                            </div>
                                        )}

                                        {/* Produce Button */}
                                        <Button
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                            onClick={() => openProductionModal(product)}
                                            disabled={!product.billOfMaterials || product.billOfMaterials.length === 0}
                                        >
                                            <Factory className="mr-2 h-4 w-4" />
                                            Produce
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Production Log Tab */}
                <TabsContent value="production" className="space-y-6">
                    <h2 className="text-xl font-semibold">Recent Production</h2>
                    {productionLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No production logs yet</h3>
                            <p className="text-muted-foreground">Start producing to see history here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {productionLogs.map((log) => (
                                <Card key={log._id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{log.productName}</h3>
                                                <p className="text-sm text-muted-foreground">Batch: {log.batchNumber}</p>
                                            </div>
                                            <Badge variant={log.status === 'completed' ? 'default' : 'destructive'}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Quantity</div>
                                                <div className="font-medium">{log.quantityProduced} units</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Raw Material Cost</div>
                                                <div className="font-medium">₹{log.totalRawMaterialCost?.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Total Cost</div>
                                                <div className="font-medium">₹{log.totalProductionCost?.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Cost/Unit</div>
                                                <div className="font-medium">₹{log.costPerUnit?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs text-muted-foreground">
                                            {new Date(log.productionDate).toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Raw Material Modal */}
            <Dialog open={isRawMaterialModalOpen} onOpenChange={setIsRawMaterialModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRawMaterial ? 'Edit Raw Material' : 'Add Raw Material'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRawMaterialSubmit} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name *</Label>
                                <Input
                                    value={rawMaterialForm.name}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">SKU *</Label>
                                <Input
                                    value={rawMaterialForm.sku}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, sku: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Category</Label>
                                <Input
                                    value={rawMaterialForm.category}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Unit *</Label>
                                <select
                                    value={rawMaterialForm.unit}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, unit: e.target.value })}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {unitOptions.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Cost/Unit *</Label>
                                <div className="col-span-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={rawMaterialForm.costPerUnit}
                                        onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, costPerUnit: e.target.value })}
                                        className="pl-8"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Quantity *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={rawMaterialForm.quantity}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, quantity: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Min Stock</Label>
                                <Input
                                    type="number"
                                    value={rawMaterialForm.minimumStock}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, minimumStock: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Supplier</Label>
                                <Input
                                    value={rawMaterialForm.supplier}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, supplier: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Expiry Date</Label>
                                <Input
                                    type="date"
                                    value={rawMaterialForm.expiryDate}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, expiryDate: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsRawMaterialModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : editingRawMaterial ? 'Update' : 'Add Material'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Product Modal with BOM */}
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
                        <DialogDescription>Define your product and its Bill of Materials</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Product Information</h4>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Name *</Label>
                                    <Input
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">SKU *</Label>
                                    <Input
                                        value={productForm.sku}
                                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Selling Price *</Label>
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={productForm.sellingPrice}
                                            onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                                            className="pl-8"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Mfg. Cost</Label>
                                    <div className="col-span-3 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={productForm.manufacturingCost}
                                            onChange={(e) => setProductForm({ ...productForm, manufacturingCost: e.target.value })}
                                            className="pl-8"
                                            placeholder="Labor, overhead, etc."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bill of Materials */}
                        <div className="space-y-4">
                            <h4 className="font-medium">Bill of Materials (Recipe)</h4>

                            {/* Add BOM Item */}
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Label className="text-xs">Raw Material</Label>
                                    <select
                                        value={selectedBomRawMaterial}
                                        onChange={(e) => setSelectedBomRawMaterial(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select material...</option>
                                        {rawMaterials.map(rm => (
                                            <option key={rm._id} value={rm._id}>
                                                {rm.name} (₹{rm.costPerUnit}/{rm.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={bomQuantity}
                                        onChange={(e) => setBomQuantity(e.target.value)}
                                        placeholder="Qty"
                                    />
                                </div>
                                <Button type="button" onClick={addToBom}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* BOM List */}
                            {productForm.billOfMaterials.length > 0 && (
                                <div className="rounded-lg border p-4 space-y-2">
                                    {productForm.billOfMaterials.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                            <div>
                                                <span className="font-medium">{item.rawMaterialName}</span>
                                                <span className="text-muted-foreground ml-2">
                                                    {item.quantityRequired} {item.unit} × ₹{item.costPerUnit} = ₹{(item.quantityRequired * item.costPerUnit).toFixed(2)}
                                                </span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFromBom(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t flex justify-between font-bold">
                                        <span>Total Raw Material Cost:</span>
                                        <span>₹{calculateBomCost().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Production Modal */}
            <Dialog open={isProductionModalOpen} onOpenChange={setIsProductionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Produce: {selectedProductForProduction?.name}</DialogTitle>
                        <DialogDescription>This will consume raw materials and add finished products</DialogDescription>
                    </DialogHeader>

                    {selectedProductForProduction && (
                        <div className="space-y-4">
                            {/* BOM Preview */}
                            <div className="rounded-lg border p-4">
                                <h4 className="font-medium mb-2">Materials per unit:</h4>
                                <div className="space-y-1 text-sm">
                                    {selectedProductForProduction.billOfMaterials?.map((item, i) => {
                                        const rawMaterial = rawMaterials.find(rm => rm._id === item.rawMaterialId);
                                        const available = rawMaterial?.quantity || 0;
                                        const needed = item.quantityRequired * parseInt(productionQuantity || 0, 10);
                                        const isEnough = available >= needed;

                                        return (
                                            <div key={i} className={`flex justify-between ${!isEnough ? 'text-red-600' : ''}`}>
                                                <span>{item.rawMaterialName}</span>
                                                <span>
                                                    {item.quantityRequired} × {productionQuantity || 0} = {needed.toFixed(2)} {item.unit}
                                                    <span className="ml-2 text-muted-foreground">(have: {available})</span>
                                                    {!isEnough && <AlertTriangle className="h-4 w-4 inline ml-1" />}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <Label>Quantity to Produce</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={productionQuantity}
                                        onChange={(e) => setProductionQuantity(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Notes (Optional)</Label>
                                    <Textarea
                                        value={productionNotes}
                                        onChange={(e) => setProductionNotes(e.target.value)}
                                        placeholder="Production batch notes..."
                                    />
                                </div>
                            </div>

                            {/* Cost Preview */}
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex justify-between">
                                    <span>Estimated Cost:</span>
                                    <span className="font-bold">
                                        ₹{((selectedProductForProduction.totalCost || 0) * parseInt(productionQuantity || 0, 10)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductionModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleProduction}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                            {loading ? 'Producing...' : 'Start Production'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Low Stock Alert */}
            {lowStockMaterials > 0 && (
                <Alert variant="destructive" className="mt-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Low Stock Alert</AlertTitle>
                    <AlertDescription>
                        {lowStockMaterials} raw material(s) are below minimum stock levels. Consider restocking to avoid production delays.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
