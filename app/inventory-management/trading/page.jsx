'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package2, DollarSign, TrendingUp, Activity, Upload, Factory, ShoppingCart, ArrowLeft, ScanLine, Filter, X, ChevronDown, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import Analytics from '../components/Analytics';
import CSVUpload from '../components/CSVUpload';
import InvoiceScanner from '@/components/inventory/InvoiceScanner';

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

    // Invoice Scanner State
    const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // Select and bulk delete state
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        shelf: '',
        stockStatus: '', // 'in-stock', 'low-stock', 'out-of-stock'
        expiryStatus: '' // 'expired', 'expiring-soon', 'not-expiring'
    });

    // Sales state (Cart-based for multiple products)
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sellCart, setSellCart] = useState([]); // Array of {product, quantity}
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [sellCustomer, setSellCustomer] = useState({ name: '', phone: '', email: '' });
    const [sellPaymentMethod, setSellPaymentMethod] = useState('cash');
    const [sellNotes, setSellNotes] = useState('');
    const [sellingLoading, setSellingLoading] = useState(false);

    // Sales History state
    const [sales, setSales] = useState([]);
    const [salesSummary, setSalesSummary] = useState(null);
    const [salesLoading, setSalesLoading] = useState(false);

    // Quotation prompt state (after sale completion)
    const [showQuotationDialog, setShowQuotationDialog] = useState(false);
    const [completedSaleData, setCompletedSaleData] = useState(null);
    const [creatingQuotation, setCreatingQuotation] = useState(false);

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

    // Fetch sales data
    const fetchSales = async () => {
        try {
            setSalesLoading(true);
            const response = await fetch('/api/inventory/sales', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setSales(data.sales || []);
                setSalesSummary(data.summary || null);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setSalesLoading(false);
        }
    };

    // Open sell modal (reset cart)
    const openSellModal = () => {
        setSellCart([]);
        setProductSearchTerm('');
        setSellCustomer({ name: '', phone: '', email: '' });
        setSellPaymentMethod('cash');
        setSellNotes('');
        setIsSellModalOpen(true);
    };

    // Add selected products to sale cart and open modal
    const addSelectedToSale = () => {
        if (selectedProducts.length === 0) {
            toast({ title: '⚠️ No products selected', description: 'Please select products to add to sale', variant: 'destructive' });
            return;
        }

        // Get the selected products with their full data
        const selectedProductsData = products.filter(p => selectedProducts.includes(p._id));

        // Filter out products that are out of stock
        const availableProducts = selectedProductsData.filter(p => p.quantity > 0);
        const outOfStockProducts = selectedProductsData.filter(p => p.quantity <= 0);

        if (outOfStockProducts.length > 0) {
            toast({
                title: '⚠️ Some products skipped',
                description: `${outOfStockProducts.length} product(s) are out of stock and were not added`,
                variant: 'warning'
            });
        }

        if (availableProducts.length === 0) {
            toast({ title: '❌ All selected products are out of stock', description: 'Please select products with available stock', variant: 'destructive' });
            return;
        }

        // Create cart items from selected products (quantity 1 each)
        const cartItems = availableProducts.map(product => ({
            product,
            quantity: 1
        }));

        // Reset and open the sell modal with pre-filled cart
        setSellCart(cartItems);
        setProductSearchTerm('');
        setSellCustomer({ name: '', phone: '', email: '' });
        setSellPaymentMethod('cash');
        setSellNotes('');
        setIsSellModalOpen(true);

        // Clear the selection
        setSelectedProducts([]);

        toast({
            title: '✅ Products added to cart',
            description: `${availableProducts.length} product(s) added to sale cart`,
        });
    };

    // Add product to cart
    const addToCart = (product) => {
        const existing = sellCart.find(item => item.product._id === product._id);
        if (existing) {
            // Increase quantity
            if (existing.quantity < product.quantity) {
                setSellCart(sellCart.map(item =>
                    item.product._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ));
            } else {
                toast({ title: '⚠️ Stock limit reached', description: `Only ${product.quantity} available`, variant: 'destructive' });
            }
        } else {
            if (product.quantity < 1) {
                toast({ title: '❌ Out of stock', description: `${product.name} is out of stock`, variant: 'destructive' });
                return;
            }
            setSellCart([...sellCart, { product, quantity: 1 }]);
        }
        setProductSearchTerm('');
    };

    // Update cart item quantity
    const updateCartQuantity = (productId, newQuantity) => {
        const item = sellCart.find(i => i.product._id === productId);
        if (!item) return;

        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        if (newQuantity > item.product.quantity) {
            toast({ title: '⚠️ Stock limit', description: `Only ${item.product.quantity} available`, variant: 'destructive' });
            return;
        }
        setSellCart(sellCart.map(i =>
            i.product._id === productId ? { ...i, quantity: newQuantity } : i
        ));
    };

    // Remove from cart
    const removeFromCart = (productId) => {
        setSellCart(sellCart.filter(item => item.product._id !== productId));
    };

    // Debounce search and product search for better performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const debouncedProductSearch = useDebounce(productSearchTerm, 200);

    // Memoize cart calculations
    const cartTotals = useMemo(() => ({
        subtotal: sellCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        profit: sellCart.reduce((sum, item) => sum + ((item.product.price - item.product.cost) * item.quantity), 0),
        itemCount: sellCart.reduce((sum, item) => sum + item.quantity, 0)
    }), [sellCart]);

    // Renamed for clarity
    const cartSubtotal = cartTotals.subtotal;
    const cartProfit = cartTotals.profit;
    const cartItemCount = cartTotals.itemCount;

    // Memoize product search results
    const searchedProducts = useMemo(() => {
        if (debouncedProductSearch.length === 0) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(debouncedProductSearch.toLowerCase())
        ).slice(0, 5);
    }, [products, debouncedProductSearch]);

    // Handle complete sale
    const handleSell = async () => {
        if (sellCart.length === 0) {
            toast({ title: '❌ Empty Cart', description: 'Add products to sell first.', variant: 'destructive' });
            return;
        }

        // Validate stock for all items
        for (const item of sellCart) {
            if (item.quantity > item.product.quantity) {
                toast({
                    title: '❌ Insufficient Stock',
                    description: `${item.product.name}: Only ${item.product.quantity} available.`,
                    variant: 'destructive'
                });
                return;
            }
        }

        try {
            setSellingLoading(true);
            const response = await fetch('/api/inventory/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    items: sellCart.map(item => ({
                        productId: item.product._id,
                        productName: item.product.name,
                        quantity: item.quantity,
                        sellingPrice: item.product.price,
                    })),
                    customer: sellCustomer.name ? sellCustomer : { name: 'Walk-in Customer' },
                    paymentMethod: sellPaymentMethod,
                    notes: sellNotes,
                    amountPaid: cartSubtotal,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Sale failed');
            }

            toast({
                title: '✅ Sale Completed!',
                description: `Sold ${cartItemCount} items for ₹${cartSubtotal.toFixed(2)}. Profit: ₹${result.summary.profit.toFixed(2)}`,
                duration: 5000,
            });

            // Store sale data for potential quotation
            setCompletedSaleData({
                items: sellCart.map(item => ({
                    name: item.product.name,
                    sku: item.product.sku,
                    quantity: item.quantity,
                    price: item.product.price,
                    total: item.product.price * item.quantity
                })),
                customer: sellCustomer.name ? sellCustomer : { name: 'Walk-in Customer' },
                total: cartSubtotal,
                profit: result.summary.profit,
                paymentMethod: sellPaymentMethod,
                notes: sellNotes,
                saleId: result.sale?._id
            });

            setIsSellModalOpen(false);
            setSellCart([]);

            // Show quotation dialog
            setShowQuotationDialog(true);

            // Refresh products to show updated stock
            const fetchProducts = async () => {
                const res = await fetch('/api/inventory/products', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setProducts(Array.isArray(data) ? data : []);
                }
            };
            fetchProducts();
            fetchSales();

        } catch (error) {
            toast({
                title: '❌ Sale Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSellingLoading(false);
        }
    };

    // Handle quotation choice after sale completion
    const handleQuotationChoice = async (wantsQuotation) => {
        if (!wantsQuotation) {
            setShowQuotationDialog(false);
            setCompletedSaleData(null);
            return;
        }

        if (!completedSaleData) {
            toast({
                title: '❌ Error',
                description: 'Sale data not found. Please try again.',
                variant: 'destructive',
            });
            setShowQuotationDialog(false);
            return;
        }

        setCreatingQuotation(true);

        try {
            const currentDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Build table data for products
            const tableHeaders = ['S.No', 'Product Name', 'SKU', 'Quantity', 'Unit Price (₹)', 'Total (₹)'];
            const tableRows = completedSaleData.items.map((item, idx) => [
                String(idx + 1),
                item.name,
                item.sku,
                String(item.quantity),
                item.price.toFixed(2),
                item.total.toFixed(2)
            ]);

            // Add total row
            tableRows.push([
                '',
                '',
                '',
                '',
                'Grand Total:',
                `₹${completedSaleData.total.toFixed(2)}`
            ]);

            // Build content blocks for the quotation
            const contentBlocks = [
                {
                    id: 'block-1',
                    type: 'heading',
                    content: 'SALES QUOTATION',
                    style: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
                },
                {
                    id: 'block-2',
                    type: 'paragraph',
                    content: `Date: ${currentDate}`,
                    style: { fontSize: 11, textAlign: 'right' }
                },
                {
                    id: 'block-3',
                    type: 'heading',
                    content: 'Customer Details',
                    style: { fontSize: 12, fontWeight: 'bold', textAlign: 'left' }
                },
                {
                    id: 'block-4',
                    type: 'paragraph',
                    content: `Name: ${completedSaleData.customer.name || 'Walk-in Customer'}${completedSaleData.customer.phone ? `\nPhone: ${completedSaleData.customer.phone}` : ''}`,
                    style: { fontSize: 11, textAlign: 'left' }
                },
                {
                    id: 'block-5',
                    type: 'heading',
                    content: 'Product Details',
                    style: { fontSize: 12, fontWeight: 'bold', textAlign: 'left' }
                },
                {
                    id: 'block-6',
                    type: 'table',
                    tableData: {
                        headers: tableHeaders,
                        rows: tableRows,
                        style: {
                            headerBgColor: '#1e40af',
                            headerTextColor: '#ffffff',
                            borderColor: '#e5e7eb',
                            borderWidth: 1,
                            textColor: '#1a1a1a',
                            alternateRowColor: '#f9fafb',
                            fontSize: 10
                        }
                    }
                },
                {
                    id: 'block-7',
                    type: 'heading',
                    content: 'Payment Information',
                    style: { fontSize: 12, fontWeight: 'bold', textAlign: 'left' }
                },
                {
                    id: 'block-8',
                    type: 'paragraph',
                    content: `Payment Method: ${completedSaleData.paymentMethod.charAt(0).toUpperCase() + completedSaleData.paymentMethod.slice(1).replace('_', ' ')}${completedSaleData.notes ? `\nNotes: ${completedSaleData.notes}` : ''}`,
                    style: { fontSize: 11, textAlign: 'left' }
                }
            ];

            // Prepare items for Bill of Quantities text field backup
            const itemsBoq = completedSaleData.items.map((item, idx) =>
                `${idx + 1}. ${item.name} (SKU: ${item.sku}) - Qty: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}`
            ).join('\n');

            // Create quotation via API
            const response = await fetch('/api/techno-quotation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'manual',
                    title: `Sales Quotation - ${completedSaleData.customer.name || 'Customer'} - ${currentDate}`,
                    subject: `Sales Quotation - ${completedSaleData.items.length} item(s) - ₹${completedSaleData.total.toFixed(2)}`,
                    clientDetails: {
                        name: completedSaleData.customer.name || 'Walk-in Customer',
                        company: completedSaleData.customer.name || 'Walk-in Customer',
                        contact: completedSaleData.customer.phone || '',
                        address: ''
                    },
                    contentBlocks: contentBlocks,
                    answers: {
                        client_name: completedSaleData.customer.name || 'Walk-in Customer',
                        client_contact: completedSaleData.customer.phone || '',
                        project_subject: `Sales Quotation - ${completedSaleData.items.length} item(s)`,
                        items_boq: itemsBoq + `\n\n--- TOTAL: ₹${completedSaleData.total.toFixed(2)} ---`,
                        terms_conditions: `Payment Method: ${completedSaleData.paymentMethod.toUpperCase()}\n${completedSaleData.notes ? `Notes: ${completedSaleData.notes}` : ''}`,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create quotation');
            }

            const result = await response.json();

            // Open quotation in new tab
            const quotationUrl = `/accounting/techno-quotation/${result.quotation._id}`;
            window.open(quotationUrl, '_blank');

            toast({
                title: '✅ Quotation Created!',
                description: 'Quotation opened in a new tab.',
                duration: 3000,
            });

        } catch (error) {
            console.error('Error creating quotation:', error);
            toast({
                title: '❌ Quotation Failed',
                description: error.message || 'Failed to create quotation. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setCreatingQuotation(false);
            setShowQuotationDialog(false);
            setCompletedSaleData(null);
        }
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
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={sortedAndFilteredProducts.length > 0 && selectedProducts.length === sortedAndFilteredProducts.length}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                            </TableHead>
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
                                className={`${getRowClass(product)} ${selectedProducts.includes(product._id) ? 'bg-primary/5' : ''}`}
                            >
                                <TableCell className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product._id)}
                                        onChange={() => toggleProductSelection(product._id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                </TableCell>
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
                                    <div className="flex justify-end gap-1">
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
                                            onClick={() => handleDelete(product)}
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

        return (
            <span className="text-xs text-muted-foreground">
                Expires {expiry.toLocaleDateString()}
            </span>
        );
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
            const validationErrors = [];

            if (!formData.name?.trim()) validationErrors.push('Name is required');
            if (!formData.sku?.trim()) validationErrors.push('SKU is required');
            if (!formData.price) validationErrors.push('Price is required');
            if (formData.cost === undefined || formData.cost === '') validationErrors.push('Cost is required');
            if (formData.quantity === undefined || formData.quantity === '') validationErrors.push('Quantity is required');

            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join('\n'));
            }

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

    // Handle delete product - open confirmation dialog
    const handleDelete = (product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    // Confirm delete product
    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const response = await fetch(`/api/inventory/products/${productToDelete._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete product');
            }

            setProducts(products.filter(p => p._id !== productToDelete._id));

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
        } finally {
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    // Toggle single product selection
    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Toggle select all products
    const toggleSelectAll = () => {
        if (selectedProducts.length === sortedAndFilteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(sortedAndFilteredProducts.map(p => p._id));
        }
    };

    // Bulk delete confirmation
    const confirmBulkDelete = async () => {
        if (selectedProducts.length === 0) return;

        let successCount = 0;
        let errorCount = 0;

        for (const productId of selectedProducts) {
            try {
                const response = await fetch(`/api/inventory/products/${productId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                errorCount++;
            }
        }

        // Update products list
        setProducts(products.filter(p => !selectedProducts.includes(p._id)));
        setSelectedProducts([]);
        setBulkDeleteDialogOpen(false);

        toast({
            title: successCount > 0 ? 'Products Deleted' : 'Error',
            description: successCount > 0
                ? `Successfully deleted ${successCount} product${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
                : 'Failed to delete products',
            variant: errorCount > 0 && successCount === 0 ? 'destructive' : 'default'
        });
    };

    // Handle scanned products from invoice
    const handleScannedProducts = async (items, supplierInfo) => {
        let successCount = 0;
        let errorCount = 0;
        let errorMessages = [];

        for (const item of items) {
            try {
                // Calculate cost price from basePrice + gstAmount if available
                const basePrice = parseFloat(item.basePrice) || 0;
                const gstAmount = parseFloat(item.gstAmount) || 0;
                const calculatedCostPrice = basePrice + gstAmount;

                // Use costPrice from item if available, otherwise use calculated value
                const costPrice = parseFloat(item.costPrice) || calculatedCostPrice || 0;

                // Use sellingPrice from item, fallback to cost * 1.25 (25% margin)
                const sellingPrice = parseFloat(item.sellingPrice) || (costPrice * 1.25);

                // Use quantity from the edited item
                const quantity = parseFloat(item.quantity) || 0;

                const productData = {
                    name: item.name || '',
                    description: item.description || '',
                    sku: item.sku || '',
                    category: item.category || 'Uncategorized',
                    price: sellingPrice,  // Selling price for product
                    cost: costPrice,      // Cost price (including GST)
                    quantity: quantity,
                    shelf: item.shelf || 'Default',
                    supplier: supplierInfo?.name || item.supplier || '',
                    hsnCode: item.hsnCode || ''
                };

                console.log('Adding product:', productData); // Debug log

                const response = await fetch('/api/inventory/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(productData)
                });

                if (response.ok) {
                    const newProduct = await response.json();
                    setProducts(prev => [newProduct, ...prev]);
                    successCount++;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.message || errorData.error || `Failed to add "${item.name}"`;
                    console.error('Failed to add product:', errorMsg, errorData);
                    errorMessages.push(`${item.name}: ${errorMsg}`);
                    errorCount++;
                }
            } catch (error) {
                console.error('Error adding product:', error);
                errorMessages.push(`${item.name}: ${error.message || 'Unknown error'}`);
                errorCount++;
            }
        }

        // Show result toast with detailed error info
        if (successCount > 0 && errorCount === 0) {
            toast({
                title: '✅ Products Added Successfully',
                description: `Added ${successCount} product${successCount > 1 ? 's' : ''} to inventory`,
                variant: 'default'
            });
        } else if (successCount > 0 && errorCount > 0) {
            toast({
                title: '⚠️ Partially Added',
                description: `Added ${successCount} product${successCount > 1 ? 's' : ''}, but ${errorCount} failed: ${errorMessages.slice(0, 2).join('; ')}${errorMessages.length > 2 ? '...' : ''}`,
                variant: 'warning'
            });
        } else {
            toast({
                title: '❌ Failed to Add Products',
                description: errorMessages.length > 0
                    ? `Errors: ${errorMessages.slice(0, 3).join('; ')}${errorMessages.length > 3 ? '...' : ''}`
                    : 'Failed to add products from invoice. Please try again.',
                variant: 'destructive'
            });
        }
    };

    // Sort products
    const sortProducts = (products) => {
        if (!sortConfig.key) return products;

        return [...products].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'profit') {
                aValue = (a.price - a.cost) * a.quantity;
                bValue = (b.price - b.cost) * b.quantity;
            }

            if (sortConfig.key === 'expiryDate' && aValue && bValue) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
            if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

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

    // Get unique categories and shelves for filter dropdowns
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const uniqueShelves = [...new Set(products.map(p => p.shelf).filter(Boolean))];

    // Count active filters
    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: '',
            shelf: '',
            stockStatus: '',
            expiryStatus: ''
        });
    };

    // Memoize filtered products based on debounced search term and filters
    const filteredProducts = useMemo(() => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const today = new Date();

        return products.filter(product => {
            // Search filter (use debounced value)
            if (searchLower) {
                const matchesSearch =
                    product.name?.toLowerCase().includes(searchLower) ||
                    product.sku?.toLowerCase().includes(searchLower) ||
                    product.category?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Category filter
            if (filters.category && product.category !== filters.category) return false;

            // Shelf filter
            if (filters.shelf && product.shelf !== filters.shelf) return false;

            // Stock status filter
            if (filters.stockStatus) {
                const quantity = product.quantity || 0;
                if (filters.stockStatus === 'out-of-stock' && quantity > 0) return false;
                if (filters.stockStatus === 'low-stock' && (quantity === 0 || quantity > 10)) return false;
                if (filters.stockStatus === 'in-stock' && quantity <= 10) return false;
            }

            // Expiry status filter
            if (filters.expiryStatus) {
                const expiryDate = product.expiryDate ? new Date(product.expiryDate) : null;

                if (filters.expiryStatus === 'expired') {
                    if (!expiryDate || expiryDate >= today) return false;
                } else if (filters.expiryStatus === 'expiring-soon') {
                    if (!expiryDate) return false;
                    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    if (daysUntilExpiry < 0 || daysUntilExpiry > 15) return false;
                } else if (filters.expiryStatus === 'not-expiring') {
                    if (expiryDate) {
                        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        if (daysUntilExpiry <= 15) return false;
                    }
                }
            }

            return true;
        });
    }, [products, debouncedSearchTerm, filters]);

    // Memoize sorted products
    const sortedAndFilteredProducts = useMemo(() =>
        sortProducts(filteredProducts),
        [filteredProducts, sortConfig]
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory-management">
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Trading Inventory
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage your products and track inventory levels with ease
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsInvoiceScannerOpen(true)}
                        className="gap-2 border-violet-400 text-violet-700 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20"
                    >
                        <ScanLine className="h-4 w-4" />
                        Scan Invoice
                    </Button>
                    <Button
                        onClick={openSellModal}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        New Sale
                    </Button>
                    <Link href="/inventory-management/manufacturing">
                        <Button variant="outline" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                            <Factory className="h-4 w-4" />
                            Manufacturing
                        </Button>
                    </Link>
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
                                        <select
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="Uncategorized">Uncategorized</option>
                                            <optgroup label="Plumbing & Sanitary">
                                                <option value="Plumbing">Plumbing</option>
                                                <option value="Sanitary Ware">Sanitary Ware</option>
                                                <option value="Pipes & Fittings">Pipes & Fittings</option>
                                                <option value="Valves & Taps">Valves & Taps</option>
                                                <option value="Bathroom Accessories">Bathroom Accessories</option>
                                            </optgroup>
                                            <optgroup label="Electrical">
                                                <option value="Electrical">Electrical</option>
                                                <option value="Wires & Cables">Wires & Cables</option>
                                                <option value="Switches & Sockets">Switches & Sockets</option>
                                                <option value="Lighting">Lighting</option>
                                            </optgroup>
                                            <optgroup label="Construction">
                                                <option value="Construction Materials">Construction Materials</option>
                                                <option value="Cement & Concrete">Cement & Concrete</option>
                                                <option value="Tiles & Flooring">Tiles & Flooring</option>
                                                <option value="Paints & Coatings">Paints & Coatings</option>
                                                <option value="Adhesives & Sealants">Adhesives & Sealants</option>
                                            </optgroup>
                                            <optgroup label="Hardware">
                                                <option value="Hardware">Hardware</option>
                                                <option value="Fasteners">Fasteners</option>
                                                <option value="Tools & Equipment">Tools & Equipment</option>
                                                <option value="Locks & Security">Locks & Security</option>
                                            </optgroup>
                                            <optgroup label="General">
                                                <option value="Electronics">Electronics</option>
                                                <option value="Furniture">Furniture</option>
                                                <option value="Automotive">Automotive</option>
                                                <option value="Food & Beverages">Food & Beverages</option>
                                                <option value="Office Supplies">Office Supplies</option>
                                                <option value="Chemicals">Chemicals</option>
                                                <option value="Industrial Supplies">Industrial Supplies</option>
                                                <option value="Other">Other</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">
                                            Price <span className="text-red-500">*</span>
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
                                            Shelf <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex gap-2 col-span-3">
                                            <select
                                                id="shelf"
                                                value={formData.shelf}
                                                onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                required
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
                                                    className="w-32"
                                                />
                                                <Button type="button" size="sm" onClick={addShelf}>
                                                    <Plus className="h-4 w-4" />
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
                                <div className="flex justify-end space-x-4 pt-4 flex-shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            resetForm();
                                            setIsModalOpen(false);
                                        }}
                                    >
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
            </div>

            {/* Tab Navigation */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-1 shadow-sm">
                <div className="flex space-x-1">
                    <Button
                        variant={activeTab === 'inventory' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('inventory')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'inventory'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Package2 className="h-4 w-4" />
                        Inventory
                    </Button>
                    <Button
                        variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'analytics'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Activity className="h-4 w-4" />
                        Analytics
                    </Button>
                    <Button
                        variant={activeTab === 'csv-upload' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('csv-upload')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'csv-upload'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Upload className="h-4 w-4" />
                        CSV Upload
                    </Button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'inventory' ? (
                <div className="space-y-8">
                    {/* Dashboard Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                        <Card className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Package2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalProducts}</div>
                                <p className="text-xs text-muted-foreground">
                                    {totalProducts === 0 ? 'No products yet' : 'Active items in inventory'}
                                </p>
                                <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${Math.min((totalProducts / 100) * 100, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total inventory worth
                                </p>
                                <div className="mt-2 flex items-center text-xs">
                                    <span className="text-green-600 dark:text-green-400">
                                        ₹{totalProducts > 0 ? (totalValue / totalProducts).toFixed(2) : '0.00'} avg/item
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ₹{totalProfit.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Potential profit on all stock
                                </p>
                                <div className="mt-2 flex items-center text-xs">
                                    {totalProfit >= 0 ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            ↑ {totalValue > 0 ? ((totalProfit / totalValue) * 100).toFixed(1) : '0.0'}% margin
                                        </span>
                                    ) : (
                                        <span className="text-red-600 dark:text-red-400">
                                            Loss on inventory
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{aboutToExpire}</div>
                                <p className="text-xs text-muted-foreground">
                                    Items expiring in 15 days
                                </p>
                                {aboutToExpire > 0 && (
                                    <div className="mt-2 h-1 w-full bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-500"
                                            style={{ width: `${Math.min((aboutToExpire / totalProducts) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Dashboard Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                                    Low Stock Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {products.filter(p => p.quantity <= 10).length}
                                        </div>
                                        <p className="text-sm text-purple-700 dark:text-purple-300">
                                            Items need restocking
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                                        <Package2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {[...new Set(products.map(p => p.category))].length}
                                        </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Product categories
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                                        <div className="grid grid-cols-2 gap-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">
                                    Total Stock
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {products.reduce((sum, p) => sum + p.quantity, 0)}
                                        </div>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Units across all products
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                                        <div className="w-6 h-6 border-2 border-green-600 dark:border-green-400 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and filter */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search products by name, SKU, or category..."
                                        className="w-full pl-10 h-11 bg-background border-muted focus:border-primary transition-colors"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                {/* Filters Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`gap-2 transition-all ${showFilters ? 'bg-primary/10 border-primary' : ''}`}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {sortedAndFilteredProducts.length} of {totalProducts} products
                                </span>
                                {selectedProducts.length > 0 && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={addSelectedToSale}
                                            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            Add to Sale ({selectedProducts.length})
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setBulkDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete ({selectedProducts.length})
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="border-t pt-4 mt-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-foreground">Filter Products</h3>
                                    {activeFilterCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="text-muted-foreground hover:text-foreground gap-1"
                                        >
                                            <X className="h-3 w-3" />
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Category Filter */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Category
                                        </label>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="">All Categories</option>
                                            {uniqueCategories.map((category) => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Shelf Filter */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Shelf Location
                                        </label>
                                        <select
                                            value={filters.shelf}
                                            onChange={(e) => setFilters({ ...filters, shelf: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="">All Shelves</option>
                                            {uniqueShelves.map((shelf) => (
                                                <option key={shelf} value={shelf}>{shelf}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Stock Status Filter */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Stock Status
                                        </label>
                                        <select
                                            value={filters.stockStatus}
                                            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="">All Stock Levels</option>
                                            <option value="in-stock">In Stock (more than 10)</option>
                                            <option value="low-stock">Low Stock (1-10)</option>
                                            <option value="out-of-stock">Out of Stock (0)</option>
                                        </select>
                                    </div>

                                    {/* Expiry Status Filter */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Expiry Status
                                        </label>
                                        <select
                                            value={filters.expiryStatus}
                                            onChange={(e) => setFilters({ ...filters, expiryStatus: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="">All Expiry Status</option>
                                            <option value="expired">Expired</option>
                                            <option value="expiring-soon">Expiring Soon (within 15 days)</option>
                                            <option value="not-expiring">Not Expiring Soon</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {activeFilterCount > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                        {filters.category && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                Category: {filters.category}
                                                <button onClick={() => setFilters({ ...filters, category: '' })} className="ml-1 hover:text-blue-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.shelf && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                                Shelf: {filters.shelf}
                                                <button onClick={() => setFilters({ ...filters, shelf: '' })} className="ml-1 hover:text-purple-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.stockStatus && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                Stock: {filters.stockStatus.replace('-', ' ')}
                                                <button onClick={() => setFilters({ ...filters, stockStatus: '' })} className="ml-1 hover:text-green-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.expiryStatus && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                Expiry: {filters.expiryStatus.replace('-', ' ')}
                                                <button onClick={() => setFilters({ ...filters, expiryStatus: '' })} className="ml-1 hover:text-amber-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    {renderContent()}

                    {/* Expiration Alert */}
                    {!loading && aboutToExpire > 0 && (
                        <Alert variant="destructive" className="mt-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Expiry Alert</AlertTitle>
                            <AlertDescription>
                                You have {aboutToExpire} product(s) expiring within the next 15 days. Consider taking action to avoid losses.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            ) : activeTab === 'csv-upload' ? (
                <div className="space-y-8">
                    <CSVUpload onUploadSuccess={handleCSVUploadSuccess} />
                </div>
            ) : (
                <Analytics products={products} />
            )}

            {/* AI Invoice Scanner */}
            <InvoiceScanner
                isOpen={isInvoiceScannerOpen}
                onClose={() => setIsInvoiceScannerOpen(false)}
                inventoryType="trading"
                onProductsConfirmed={handleScannedProducts}
            />



            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Product
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {productToDelete && (
                        <div className="py-4">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="font-medium">{productToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">SKU: {productToDelete.sku}</p>
                                <p className="text-sm text-muted-foreground">Quantity: {productToDelete.quantity}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Dialog */}
            <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete {selectedProducts.length} Products
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedProducts.length} selected product{selectedProducts.length > 1 ? 's' : ''}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="font-medium text-destructive">Warning</p>
                            <p className="text-sm text-muted-foreground">
                                You are about to permanently delete {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} from your inventory.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmBulkDelete}>
                            Delete All ({selectedProducts.length})
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sell Product Modal - Cart Based */}
            <Dialog open={isSellModalOpen} onOpenChange={setIsSellModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <ShoppingCart className="h-5 w-5" />
                            New Sale
                        </DialogTitle>
                        <DialogDescription>
                            Add products to cart and complete the sale
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Product Search */}
                        <div className="relative">
                            <Label className="mb-2 block">Search Products</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Type product name or SKU..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            {searchedProducts.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                    {searchedProducts.map(product => (
                                        <div
                                            key={product._id}
                                            className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                            onClick={() => addToCart(product)}
                                        >
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">SKU: {product.sku} • Stock: {product.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-blue-600 dark:text-blue-400">₹{product.price?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                                <h4 className="font-semibold text-white flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Cart ({cartItemCount} items)
                                </h4>
                            </div>
                            {sellCart.length === 0 ? (
                                <div className="p-10 text-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <ShoppingCart className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <p className="font-medium text-muted-foreground">Cart is empty</p>
                                    <p className="text-sm text-muted-foreground/60 mt-1">Search and add products above to start selling</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border max-h-[250px] overflow-y-auto bg-background">
                                    {sellCart.map((item) => {
                                        const isNearLimit = item.quantity >= item.product.quantity * 0.8;
                                        const isAtLimit = item.quantity >= item.product.quantity;
                                        return (
                                            <div
                                                key={item.product._id}
                                                className={`p-4 transition-colors bg-background ${isAtLimit ? 'bg-red-500/10' : isNearLimit ? 'bg-amber-500/10' : 'hover:bg-muted/30'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate text-foreground">{item.product.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">₹{item.product.price?.toFixed(2)}</span>
                                                            <span className="text-xs text-muted-foreground">×</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isAtLimit ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : isNearLimit ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                                                                Stock: {item.product.quantity}
                                                            </span>
                                                        </div>
                                                        {isAtLimit && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                                <AlertTriangle className="h-3 w-3" /> Maximum stock reached!
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 rounded-md hover:bg-red-500/10 hover:text-red-600"
                                                                onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}
                                                            >
                                                                -
                                                            </Button>
                                                            <span className="w-10 text-center font-bold text-lg text-foreground">{item.quantity}</span>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className={`h-8 w-8 rounded-md ${isAtLimit ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30'}`}
                                                                onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                                                                disabled={isAtLimit}
                                                            >
                                                                +
                                                            </Button>
                                                        </div>
                                                        <div className="text-right min-w-[80px]">
                                                            <p className="font-bold text-lg text-blue-600 dark:text-blue-400">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full"
                                                            onClick={() => removeFromCart(item.product._id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Customer Name</Label>
                                <Input
                                    placeholder="Walk-in Customer"
                                    value={sellCustomer.name}
                                    onChange={(e) => setSellCustomer({ ...sellCustomer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    placeholder="Optional"
                                    value={sellCustomer.phone}
                                    onChange={(e) => setSellCustomer({ ...sellCustomer, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Method & Notes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Payment Method</Label>
                                <select
                                    value={sellPaymentMethod}
                                    onChange={(e) => setSellPaymentMethod(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="cash">💵 Cash</option>
                                    <option value="upi">📱 UPI</option>
                                    <option value="card">💳 Card</option>
                                    <option value="bank_transfer">🏦 Bank Transfer</option>
                                    <option value="credit">📝 Credit</option>
                                </select>
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Input
                                    placeholder="Optional notes..."
                                    value={sellNotes}
                                    onChange={(e) => setSellNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Price Summary */}
                        {sellCart.length > 0 && (
                            <div className="rounded-xl overflow-hidden border-2 border-blue-300 dark:border-blue-700">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" /> Order Summary
                                    </h4>
                                </div>
                                <div className="p-4 bg-background space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Subtotal ({cartItemCount} items):</span>
                                        <span className="font-medium text-foreground">₹{cartSubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Expected Profit:</span>
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">+₹{cartProfit.toFixed(2)} ({cartSubtotal > 0 ? ((cartProfit / cartSubtotal) * 100).toFixed(1) : 0}%)</span>
                                    </div>
                                    <div className="border-t border-blue-200 dark:border-blue-700 pt-3 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xl text-foreground">Grand Total:</span>
                                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{cartSubtotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center gap-3 pt-2 border-t">
                        <Button variant="outline" onClick={() => setIsSellModalOpen(false)} className="px-6">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSell}
                            disabled={sellingLoading || sellCart.length === 0}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-lg font-semibold"
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            {sellingLoading ? 'Processing...' : `Complete Sale • ₹${cartSubtotal.toFixed(2)}`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quotation Confirmation Dialog */}
            <Dialog open={showQuotationDialog} onOpenChange={(open) => {
                if (!open && !creatingQuotation) {
                    setShowQuotationDialog(false);
                    setCompletedSaleData(null);
                }
            }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <FileText className="h-5 w-5" />
                            Generate Quotation?
                        </DialogTitle>
                        <DialogDescription>
                            Would you like to create a quotation for this sale?
                        </DialogDescription>
                    </DialogHeader>

                    {completedSaleData && (
                        <div className="py-4">
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Customer:</span>
                                        <span className="font-medium">{completedSaleData.customer.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Items:</span>
                                        <span className="font-medium">{completedSaleData.items.length} product(s)</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                                        <span className="text-muted-foreground">Total:</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">₹{completedSaleData.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                A quotation will be created and opened in a new tab for review and customization.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleQuotationChoice(false)}
                            disabled={creatingQuotation}
                        >
                            No, Skip
                        </Button>
                        <Button
                            onClick={() => handleQuotationChoice(true)}
                            disabled={creatingQuotation}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                            {creatingQuotation ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Yes, Create Quotation
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
