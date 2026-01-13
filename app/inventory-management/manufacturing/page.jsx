'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Plus, Search, Edit, Trash2, AlertTriangle, Package2, DollarSign,
    TrendingUp, Activity, Factory, Boxes, Cog, ArrowRight, ArrowLeft,
    ClipboardList, RefreshCcw, ShoppingCart, History, Clock, Calendar,
    ChevronDown, ChevronUp, Eye, BarChart3, Package, ScanLine, Receipt, CreditCard, Wallet, Loader2
} from 'lucide-react';
import InvoiceScanner from '@/components/inventory/InvoiceScanner';
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

    // Raw Material History State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedMaterialForHistory, setSelectedMaterialForHistory] = useState(null);
    const [materialHistory, setMaterialHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedHistoryItems, setExpandedHistoryItems] = useState({});

    // Invoice Scanner State
    const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(''); // 'raw-material' or 'product'

    // Select and bulk delete state
    const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
    const [selectedManufacturingProducts, setSelectedManufacturingProducts] = useState([]);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [bulkDeleteType, setBulkDeleteType] = useState(''); // 'raw-material' or 'product'

    // Payment confirmation state
    const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);
    const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
    const [pendingScannedItems, setPendingScannedItems] = useState([]);
    const [pendingSupplierInfo, setPendingSupplierInfo] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'cash',
        transactionId: '',
        bankName: '',
        accountNumber: '',
        chequeNumber: '',
        chequeDate: '',
        upiId: '',
        notes: ''
    });

    // Purchase history state
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
    const [showPurchaseHistoryDialog, setShowPurchaseHistoryDialog] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [addingProducts, setAddingProducts] = useState(false);
    const [updatingPurchase, setUpdatingPurchase] = useState(null);

    const unitOptions = ['pcs', 'kg', 'g', 'ltr', 'ml', 'meter', 'cm', 'sqft', 'sqm', 'unit', 'box', 'pack', 'set', 'pair', 'roll', 'bundle', 'dozen', 'ton', 'quintal', 'nos', 'mt', 'bag', 'carton', 'sheet', 'feet', 'inch'];

    // Fetch all data
    useEffect(() => {
        fetchRawMaterials();
        fetchManufacturingProducts();
        fetchProductionLogs();
        fetchPurchaseHistory();
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

    const fetchPurchaseHistory = async () => {
        try {
            setPurchaseHistoryLoading(true);
            const response = await fetch('/api/inventory/purchase-history?type=manufacturing&limit=100', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                // Map the API response to match the expected format
                const purchases = data.purchases || [];
                setPurchaseHistory(purchases.map(p => ({
                    id: p._id,
                    date: p.createdAt,
                    items: p.items,
                    supplier: p.supplier,
                    totalValue: p.totalValue,
                    itemCount: p.itemCount,
                    isPaid: p.isPaid,
                    paymentDetails: p.paymentDetails
                })));
            }
        } catch (error) {
            console.error('Error fetching purchase history:', error);
        } finally {
            setPurchaseHistoryLoading(false);
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

    const handleDeleteRawMaterial = (material) => {
        setItemToDelete(material);
        setDeleteType('raw-material');
        setDeleteDialogOpen(true);
    };

    const confirmDeleteRawMaterial = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`/api/inventory/raw-materials/${itemToDelete._id}`, {
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
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            setDeleteType('');
        }
    };

    // Handle scanned raw materials from invoice - uses batch upsert API for atomic processing
    const handleScannedMaterials = async (items, supplierInfo, paymentInfo = null) => {
        // Filter out items without SKU and track errors
        const itemsWithoutSku = items.filter(item => !item.sku);
        const validItems = items.filter(item => item.sku);

        if (itemsWithoutSku.length > 0) {
            console.warn(`${itemsWithoutSku.length} items without SKU will be skipped:`, itemsWithoutSku.map(i => i.name));
        }

        if (validItems.length === 0) {
            toast({
                title: '❌ No Valid Items',
                description: 'All items are missing SKU. Please ensure all products have valid SKU codes.',
                variant: 'destructive'
            });
            return;
        }

        // Prepare items for batch upsert with calculated costs
        const preparedItems = validItems.map(item => {
            // Calculate cost per unit from basePrice + gstAmount if available
            const basePrice = parseFloat(item.basePrice) || 0;
            const gstAmount = parseFloat(item.gstAmount) || 0;
            const calculatedCostPerUnit = basePrice + gstAmount;

            // Use costPerUnit from item if available, otherwise use calculated value
            const costPerUnit = parseFloat(item.costPerUnit) || calculatedCostPerUnit || 0;

            return {
                name: item.name || '',
                description: item.description || '',
                sku: item.sku.trim(),
                category: item.category || 'Uncategorized',
                unit: (item.unit || 'pcs').toLowerCase().trim(),
                costPerUnit: costPerUnit,
                quantity: parseFloat(item.quantity) || 0,
                minimumStock: item.minimumStock || 10,
                shelf: item.shelf || 'Default',
                supplier: supplierInfo?.name || item.supplier || '',
                supplierContact: supplierInfo?.contact || item.supplierContact || '',
                hsnCode: item.hsnCode || '',
                gstPercentage: parseFloat(item.gstPercentage) || 0,
                expiryDate: item.expiryDate || null
            };
        });

        console.log(`Sending ${preparedItems.length} items to batch upsert API`);

        try {
            // Use the batch upsert API for atomic processing
            const response = await fetch('/api/inventory/raw-materials/batch-upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ items: preparedItems })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to process materials');
            }

            // Refresh the list after successful processing
            await fetchRawMaterials();

            // Show result toast with detailed info
            const { created, updated, errors, total } = result;
            const skippedCount = itemsWithoutSku.length;

            if (total > 0 && errors.length === 0) {
                let message = '';
                if (created > 0 && updated > 0) {
                    message = `Added ${created} new material${created > 1 ? 's' : ''} and updated ${updated} existing material${updated > 1 ? 's' : ''}`;
                } else if (created > 0) {
                    message = `Added ${created} raw material${created > 1 ? 's' : ''} to inventory`;
                } else {
                    message = `Updated ${updated} existing material${updated > 1 ? 's' : ''} with new quantities`;
                }

                if (skippedCount > 0) {
                    message += ` (${skippedCount} skipped - missing SKU)`;
                }

                toast({
                    title: '✅ Materials Processed Successfully',
                    description: message,
                    variant: 'default'
                });
            } else if (total > 0 && errors.length > 0) {
                const errorMsgs = errors.map(e => `${e.name || e.sku}: ${e.message}`).slice(0, 2);
                toast({
                    title: '⚠️ Partially Processed',
                    description: `Processed ${total} material${total > 1 ? 's' : ''}, but ${errors.length} failed: ${errorMsgs.join('; ')}${errors.length > 2 ? '...' : ''}`,
                    variant: 'warning'
                });
            } else {
                const errorMsgs = errors.map(e => `${e.name || e.sku}: ${e.message}`).slice(0, 3);
                toast({
                    title: '❌ Failed to Process Materials',
                    description: errorMsgs.length > 0
                        ? `Errors: ${errorMsgs.join('; ')}${errors.length > 3 ? '...' : ''}`
                        : 'Failed to process raw materials from invoice. Please try again.',
                    variant: 'destructive'
                });
            }

            // Log detailed results for debugging
            console.log('Batch upsert results:', {
                total,
                created,
                updated,
                errors: errors.length,
                skippedNoSku: skippedCount
            });

        } catch (error) {
            console.error('Error in batch upsert:', error);
            toast({
                title: '❌ Failed to Process Materials',
                description: error.message || 'An unexpected error occurred. Please try again.',
                variant: 'destructive'
            });
        }
    };

    // Handler for when products are confirmed from invoice scanner
    // This triggers the payment confirmation flow
    const onProductsConfirmedFromScanner = (items, supplierInfo) => {
        // Store the scanned items and supplier info temporarily
        setPendingScannedItems(items);
        setPendingSupplierInfo(supplierInfo);
        // Show payment confirmation dialog
        setShowPaymentConfirmDialog(true);
    };

    // Handle payment confirmation response
    const handlePaymentConfirmation = async (isPaid) => {
        setShowPaymentConfirmDialog(false);

        if (isPaid) {
            // Show payment method dialog
            setShowPaymentMethodDialog(true);
        } else {
            // Show immediate feedback
            toast({
                title: '⏳ Processing...',
                description: 'Adding materials and setting up reminders...',
                variant: 'default'
            });

            // First, save the purchase record to get the purchaseId
            setAddingProducts(true);
            let savedPurchaseId = null;

            try {
                // Create purchase record data for API
                const purchaseData = {
                    purchaseType: 'manufacturing',
                    items: pendingScannedItems.map(item => ({
                        name: item.name || '',
                        sku: item.sku || '',
                        quantity: item.quantity || 0,
                        unit: item.unit || 'pcs',
                        basePrice: item.basePrice || 0,
                        costPerUnit: item.costPerUnit || item.basePrice || 0,
                        gstPercentage: item.gstPercentage || 0,
                        gstAmount: item.gstAmount || 0,
                        totalCost: item.totalCost || 0,
                        category: item.category || 'Uncategorized',
                        hsnCode: item.hsnCode || ''
                    })),
                    supplier: pendingSupplierInfo,
                    totalValue: pendingScannedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0),
                    itemCount: pendingScannedItems.length,
                    isPaid: false,
                    paymentDetails: null
                };

                // Save to database via API
                const purchaseResponse = await fetch('/api/inventory/purchase-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(purchaseData)
                });

                if (purchaseResponse.ok) {
                    const savedPurchase = await purchaseResponse.json();
                    savedPurchaseId = savedPurchase._id;

                    // Add to local state with mapped format
                    const purchaseRecord = {
                        id: savedPurchase._id,
                        date: savedPurchase.createdAt,
                        items: savedPurchase.items,
                        supplier: savedPurchase.supplier,
                        totalValue: savedPurchase.totalValue,
                        itemCount: savedPurchase.itemCount,
                        isPaid: savedPurchase.isPaid,
                        paymentDetails: savedPurchase.paymentDetails
                    };
                    setPurchaseHistory(prev => [purchaseRecord, ...prev]);
                } else {
                    console.error('Failed to save purchase history');
                }

                // Now send email notification with the purchaseId for reminder tracking
                const emailResponse = await fetch('/api/inventory/purchase-history/notify-pending', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        purchaseId: savedPurchaseId, // Include purchaseId for reminder linking
                        items: pendingScannedItems,
                        supplier: pendingSupplierInfo,
                        totalValue: pendingScannedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0),
                        date: new Date().toISOString()
                    })
                });

                if (emailResponse.ok) {
                    toast({
                        title: '📧 Reminder System Activated',
                        description: 'A pending payment reminder has been sent. You will receive weekly reminders until payment is marked as complete.',
                        variant: 'default'
                    });
                } else {
                    const errorData = await emailResponse.json().catch(() => ({}));
                    console.error('Failed to send pending payment email:', errorData);
                    toast({
                        title: '⚠️ Email Not Sent',
                        description: errorData.message || 'Could not send reminder email, but materials will still be added.',
                        variant: 'destructive'
                    });
                }

                // Add materials to inventory
                await handleScannedMaterials(pendingScannedItems, pendingSupplierInfo, null);

                // Clear pending data
                setPendingScannedItems([]);
                setPendingSupplierInfo(null);
                resetPaymentDetails();
            } catch (error) {
                console.error('Error in payment confirmation flow:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to process. Please try again.',
                    variant: 'destructive'
                });
            } finally {
                setAddingProducts(false);
            }
        }
    };

    // Handle payment method submission
    const handlePaymentMethodSubmit = () => {
        if (updatingPurchase) {
            updatePurchasePayment();
        } else {
            setShowPaymentMethodDialog(false);
            // Proceed with adding materials (with payment info)
            proceedWithAddingMaterials(true);
        }
    };

    // Handle marking an existing purchase as paid
    const handleMarkAsPaid = (purchase) => {
        setUpdatingPurchase(purchase);
        resetPaymentDetails();
        setShowPaymentMethodDialog(true);
    };

    // Update existing purchase payment
    const updatePurchasePayment = async () => {
        if (!updatingPurchase) return;

        setAddingProducts(true); // Reuse loading state
        try {
            const response = await fetch(`/api/inventory/purchase-history/${updatingPurchase.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    isPaid: true,
                    paymentDetails: paymentDetails
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update payment status');
            }

            const updatedData = await response.json();

            // Update local state
            setPurchaseHistory(prev => prev.map(p =>
                p.id === updatedData._id
                    ? {
                        ...p,
                        isPaid: true,
                        paymentDetails: updatedData.paymentDetails
                    }
                    : p
            ));

            // Update selected purchase if it's the one we're viewing
            if (selectedPurchase && selectedPurchase.id === updatingPurchase.id) {
                setSelectedPurchase({
                    ...selectedPurchase,
                    isPaid: true,
                    paymentDetails: updatedData.paymentDetails
                });
            }

            toast({
                title: 'Success',
                description: 'Payment status updated to Paid'
            });

            setShowPaymentMethodDialog(false);
            setUpdatingPurchase(null);
        } catch (error) {
            console.error('Error updating payment:', error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setAddingProducts(false);
        }
    };

    // Reset payment details
    const resetPaymentDetails = () => {
        setPaymentDetails({
            method: 'cash',
            transactionId: '',
            bankName: '',
            accountNumber: '',
            chequeNumber: '',
            chequeDate: '',
            upiId: '',
            notes: ''
        });
    };

    // Proceed with adding materials to inventory
    const proceedWithAddingMaterials = async (withPayment) => {
        setAddingProducts(true);
        try {
            // Create purchase record data for API
            const purchaseData = {
                purchaseType: 'manufacturing',
                items: pendingScannedItems.map(item => ({
                    name: item.name || '',
                    sku: item.sku || '',
                    quantity: item.quantity || 0,
                    unit: item.unit || 'pcs',
                    basePrice: item.basePrice || 0,
                    costPerUnit: item.costPerUnit || item.basePrice || 0,
                    gstPercentage: item.gstPercentage || 0,
                    gstAmount: item.gstAmount || 0,
                    totalCost: item.totalCost || 0,
                    category: item.category || 'Uncategorized',
                    hsnCode: item.hsnCode || ''
                })),
                supplier: pendingSupplierInfo,
                totalValue: pendingScannedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0),
                itemCount: pendingScannedItems.length,
                isPaid: withPayment,
                paymentDetails: withPayment ? { ...paymentDetails } : null
            };

            // Save to database via API
            const response = await fetch('/api/inventory/purchase-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(purchaseData)
            });

            if (response.ok) {
                const savedPurchase = await response.json();
                // Add to local state with mapped format
                const purchaseRecord = {
                    id: savedPurchase._id,
                    date: savedPurchase.createdAt,
                    items: savedPurchase.items,
                    supplier: savedPurchase.supplier,
                    totalValue: savedPurchase.totalValue,
                    itemCount: savedPurchase.itemCount,
                    isPaid: savedPurchase.isPaid,
                    paymentDetails: savedPurchase.paymentDetails
                };
                setPurchaseHistory(prev => [purchaseRecord, ...prev]);
            } else {
                console.error('Failed to save purchase history');
            }

            // Call the original handleScannedMaterials with the stored items
            await handleScannedMaterials(pendingScannedItems, pendingSupplierInfo, withPayment ? paymentDetails : null);

            // Clear pending data
            setPendingScannedItems([]);
            setPendingSupplierInfo(null);
            resetPaymentDetails();

            if (withPayment) {
                toast({
                    title: '💰 Payment Recorded',
                    description: `Payment via ${paymentDetails.method.charAt(0).toUpperCase() + paymentDetails.method.slice(1)} has been recorded.`,
                    variant: 'default'
                });
            }
        } catch (error) {
            console.error('Error saving purchase:', error);
            toast({
                title: 'Error',
                description: 'Failed to save purchase record',
                variant: 'destructive'
            });
        } finally {
            setAddingProducts(false);
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

    const handleDeleteProduct = (product) => {
        setItemToDelete(product);
        setDeleteType('product');
        setDeleteDialogOpen(true);
    };

    const confirmDeleteProduct = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`/api/inventory/manufacturing-products/${itemToDelete._id}`, {
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
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            setDeleteType('');
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

    // Raw Material History Functions
    const openMaterialHistory = async (material) => {
        setSelectedMaterialForHistory(material);
        setIsHistoryModalOpen(true);
        setMaterialHistory(null);
        setHistoryLoading(true);
        setExpandedHistoryItems({});

        try {
            const response = await fetch(`/api/inventory/raw-materials/${material._id}/history`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setMaterialHistory(data);
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to fetch material history',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error fetching material history:', error);
            toast({
                title: 'Error',
                description: 'Failed to load material history',
                variant: 'destructive'
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const toggleHistoryItemExpand = (itemId) => {
        setExpandedHistoryItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
        return `${diffMonths} months ago`;
    };

    const getTimelineColor = (index, total) => {
        const colors = [
            'from-blue-500 to-indigo-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-amber-500 to-orange-500',
            'from-red-500 to-rose-500',
            'from-cyan-500 to-teal-500'
        ];
        return colors[index % colors.length];
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

    // Raw Material Selection Functions
    const toggleRawMaterialSelection = (materialId) => {
        setSelectedRawMaterials(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    const toggleSelectAllRawMaterials = () => {
        if (selectedRawMaterials.length === filteredRawMaterials.length) {
            setSelectedRawMaterials([]);
        } else {
            setSelectedRawMaterials(filteredRawMaterials.map(m => m._id));
        }
    };

    // Product Selection Functions
    const toggleProductSelection = (productId) => {
        setSelectedManufacturingProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleSelectAllProducts = () => {
        if (selectedManufacturingProducts.length === filteredProducts.length) {
            setSelectedManufacturingProducts([]);
        } else {
            setSelectedManufacturingProducts(filteredProducts.map(p => p._id));
        }
    };

    // Bulk Delete Functions
    const openBulkDeleteDialog = (type) => {
        setBulkDeleteType(type);
        setBulkDeleteDialogOpen(true);
    };

    const confirmBulkDelete = async () => {
        const selectedIds = bulkDeleteType === 'raw-material' ? selectedRawMaterials : selectedManufacturingProducts;
        const endpoint = bulkDeleteType === 'raw-material' ? '/api/inventory/raw-materials' : '/api/inventory/manufacturing-products';

        if (selectedIds.length === 0) return;

        let successCount = 0;
        let errorCount = 0;

        for (const id of selectedIds) {
            try {
                const response = await fetch(`${endpoint}/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                errorCount++;
            }
        }

        // Refresh and reset
        if (bulkDeleteType === 'raw-material') {
            await fetchRawMaterials();
            setSelectedRawMaterials([]);
        } else {
            await fetchManufacturingProducts();
            setSelectedManufacturingProducts([]);
        }

        setBulkDeleteDialogOpen(false);
        setBulkDeleteType('');

        toast({
            title: successCount > 0 ? 'Items Deleted' : 'Error',
            description: successCount > 0
                ? `Successfully deleted ${successCount} ${bulkDeleteType === 'raw-material' ? 'material' : 'product'}${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
                : 'Failed to delete items',
            variant: errorCount > 0 && successCount === 0 ? 'destructive' : 'default'
        });
    };

    // Additional metrics
    const rawMaterialCategories = [...new Set(rawMaterials.map(m => m.category))].length;
    const productCategories = [...new Set(manufacturingProducts.map(p => p.category))].length;
    const todayProductions = productionLogs.filter(log => {
        const logDate = new Date(log.productionDate);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
    }).length;
    const avgCostPerProduct = manufacturingProducts.length > 0
        ? manufacturingProducts.reduce((sum, p) => sum + (p.totalCost || 0), 0) / manufacturingProducts.length
        : 0;

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
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Manufacturing Inventory
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage raw materials, products & production with ease
                            </p>
                        </div>
                    </div>
                </div>
                <Link href="/inventory-management/trading">
                    <Button variant="outline" className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <ShoppingCart className="h-4 w-4" />
                        Trading Mode
                    </Button>
                </Link>
            </div>

            {/* Dashboard Cards - Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                            <Boxes className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rawMaterials.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {rawMaterials.length === 0 ? 'No materials yet' : 'Active raw materials'}
                        </p>
                        <div className="mt-2 flex items-center text-xs">
                            <span className="text-amber-600 dark:text-amber-400">
                                ₹{totalRawMaterialValue.toFixed(2)} total value
                            </span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-500"
                                style={{ width: `${Math.min((rawMaterials.length / 50) * 100, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Cog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{manufacturingProducts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalFinishedProducts} finished units
                        </p>
                        <div className="mt-2 flex items-center text-xs">
                            <span className="text-blue-600 dark:text-blue-400">
                                ₹{avgCostPerProduct.toFixed(2)} avg cost/product
                            </span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min((manufacturingProducts.length / 50) * 100, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finished Value</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalFinishedValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total selling value
                        </p>
                        <div className="mt-2 flex items-center text-xs">
                            <span className="text-green-600 dark:text-green-400">
                                ₹{totalFinishedProducts > 0 ? (totalFinishedValue / totalFinishedProducts).toFixed(2) : '0.00'} avg/unit
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPotentialProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            ₹{totalPotentialProfit.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            On all finished goods
                        </p>
                        <div className="mt-2 flex items-center text-xs">
                            {totalPotentialProfit >= 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    ↑ {totalFinishedValue > 0 ? ((totalPotentialProfit / totalFinishedValue) * 100).toFixed(1) : '0.0'}% margin
                                </span>
                            ) : (
                                <span className="text-red-600 dark:text-red-400">
                                    Loss on production
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dashboard Cards - Row 2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-red-900 dark:text-red-100">
                            Low Stock Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                    {lowStockMaterials}
                                </div>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Materials need restocking
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        {lowStockMaterials > 0 && (
                            <div className="mt-3 h-1 w-full bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${Math.min((lowStockMaterials / rawMaterials.length) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                    {rawMaterialCategories + productCategories}
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {rawMaterialCategories} materials, {productCategories} products
                                </p>
                            </div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-full">
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                                    <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                            Today's Production
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                                    {todayProductions}
                                </div>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    Production batches today
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full">
                                <Factory className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                            Total Stock Units
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    {rawMaterials.reduce((sum, m) => sum + m.quantity, 0)}
                                </div>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Raw material units in stock
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                                <div className="w-6 h-6 border-2 border-emerald-600 dark:border-emerald-400 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-1 shadow-sm">
                <div className="flex space-x-1">
                    <Button
                        variant={activeTab === 'raw-materials' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('raw-materials')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'raw-materials'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Boxes className="h-4 w-4" />
                        Raw Materials
                    </Button>
                    <Button
                        variant={activeTab === 'products' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'products'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Package2 className="h-4 w-4" />
                        Products
                    </Button>
                    <Button
                        variant={activeTab === 'production' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('production')}
                        className={`flex items-center gap-2 transition-all duration-200 ${activeTab === 'production'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <Activity className="h-4 w-4" />
                        Production Log
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, SKU, or category..."
                                className="w-full pl-10 h-11 bg-background border-muted focus:border-primary transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <span className="text-sm text-muted-foreground">
                            {activeTab === 'raw-materials'
                                ? `${filteredRawMaterials.length} of ${rawMaterials.length} materials`
                                : activeTab === 'products'
                                    ? `${filteredProducts.length} of ${manufacturingProducts.length} products`
                                    : `${productionLogs.length} production logs`
                            }
                        </span>
                        <Button variant="outline" size="icon" onClick={() => { fetchRawMaterials(); fetchManufacturingProducts(); fetchProductionLogs(); }}>
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab Content wrapped in Tabs component */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

                {/* Raw Materials Tab */}
                <TabsContent value="raw-materials" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Raw Materials Inventory</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsInvoiceScannerOpen(true)}
                                className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/20"
                            >
                                <ScanLine className="mr-2 h-4 w-4" />
                                Scan Invoice
                            </Button>
                            {purchaseHistory.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPurchaseHistoryDialog(true)}
                                    className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                >
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Purchase History
                                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        {purchaseHistory.length}
                                    </Badge>
                                </Button>
                            )}
                            <Button
                                onClick={() => { resetRawMaterialForm(); setIsRawMaterialModalOpen(true); }}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Raw Material
                            </Button>
                            {selectedRawMaterials.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openBulkDeleteDialog('raw-material')}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete ({selectedRawMaterials.length})
                                </Button>
                            )}
                        </div>
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
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={filteredRawMaterials.length > 0 && selectedRawMaterials.length === filteredRawMaterials.length}
                                                onChange={toggleSelectAllRawMaterials}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </TableHead>
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
                                        <TableRow
                                            key={material._id}
                                            className={`transition-colors border-l-2 ${material.quantity <= material.minimumStock
                                                ? 'bg-red-500/5 dark:bg-red-500/10 border-l-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20'
                                                : 'border-l-transparent hover:bg-muted/50 dark:hover:bg-muted/30'} ${selectedRawMaterials.includes(material._id)
                                                    ? 'bg-primary/5 dark:bg-primary/10'
                                                    : ''}`}
                                        >
                                            <TableCell className="w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRawMaterials.includes(material._id)}
                                                    onChange={() => toggleRawMaterialSelection(material._id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{material.name}</div>
                                                    {material.supplier && (
                                                        <div className="text-xs text-muted-foreground">Supplier: {material.supplier}</div>
                                                    )}
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {material.hsnCode && (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                                                                HSN: {material.hsnCode}
                                                            </Badge>
                                                        )}
                                                        {material.gstPercentage > 0 && (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal text-amber-600 border-amber-300">
                                                                GST: {material.gstPercentage}%
                                                            </Badge>
                                                        )}
                                                    </div>
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
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openMaterialHistory(material)}
                                                        title="View usage history"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditRawMaterial(material)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRawMaterial(material)}>
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
                        <div className="flex gap-2">
                            <Button
                                onClick={() => { resetProductForm(); setIsProductModalOpen(true); }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                            {selectedManufacturingProducts.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openBulkDeleteDialog('product')}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete ({selectedManufacturingProducts.length})
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Select All option for products */}
                    {filteredProducts.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <input
                                type="checkbox"
                                checked={filteredProducts.length > 0 && selectedManufacturingProducts.length === filteredProducts.length}
                                onChange={toggleSelectAllProducts}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground">
                                {selectedManufacturingProducts.length === 0
                                    ? 'Select all products'
                                    : `${selectedManufacturingProducts.length} of ${filteredProducts.length} selected`}
                            </span>
                        </div>
                    )}

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No products found</h3>
                            <p className="text-muted-foreground">Create your first product with Bill of Materials</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((product) => (
                                <Card key={product._id} className={`relative overflow-hidden ${selectedManufacturingProducts.includes(product._id) ? 'ring-2 ring-primary' : ''}`}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedManufacturingProducts.includes(product._id)}
                                                    onChange={() => toggleProductSelection(product._id)}
                                                    className="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                                <div>
                                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                                    <CardDescription>{product.sku} • {product.category}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(product)}>
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
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Recent Production</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Total batches: {productionLogs.length}</span>
                            <span>•</span>
                            <span>Total produced: {productionLogs.reduce((sum, log) => sum + (log.quantityProduced || 0), 0)} units</span>
                        </div>
                    </div>

                    {productionLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No production logs yet</h3>
                            <p className="text-muted-foreground">Start producing to see history here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {productionLogs.map((log) => {
                                // Calculate profit for this batch
                                const product = manufacturingProducts.find(p => p._id === log.productId);
                                const batchRevenue = (product?.sellingPrice || 0) * (log.quantityProduced || 0);
                                const batchProfit = batchRevenue - (log.totalProductionCost || 0);
                                const profitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

                                return (
                                    <Card key={log._id} className="overflow-hidden">
                                        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <Factory className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                        {log.productName}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1">
                                                        <span>Batch: {log.batchNumber}</span>
                                                        <span>•</span>
                                                        <span>{new Date(log.productionDate).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{new Date(log.productionDate).toLocaleTimeString()}</span>
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={log.status === 'completed' ? 'default' : 'destructive'} className="text-sm">
                                                    {log.status === 'completed' ? '✓ Completed' : log.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            {/* Production Summary */}
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground">Qty Produced</div>
                                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{log.quantityProduced}</div>
                                                    <div className="text-xs text-muted-foreground">units</div>
                                                </div>
                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground">Raw Material</div>
                                                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{(log.totalRawMaterialCost || 0).toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">total cost</div>
                                                </div>
                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground">Mfg. Cost</div>
                                                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{((log.manufacturingCost || 0) * log.quantityProduced).toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">labor/overhead</div>
                                                </div>
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                                                    <div className="text-xs text-muted-foreground">Total Cost</div>
                                                    <div className="text-lg font-bold text-red-600 dark:text-red-400">₹{(log.totalProductionCost || 0).toFixed(2)}</div>
                                                    <div className="text-xs text-muted-foreground">₹{(log.costPerUnit || 0).toFixed(2)}/unit</div>
                                                </div>
                                                <div className={`p-3 rounded-lg text-center ${batchProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                                    <div className="text-xs text-muted-foreground">Est. Profit</div>
                                                    <div className={`text-lg font-bold ${batchProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        ₹{batchProfit.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {profitMargin >= 0 ? '↑' : '↓'} {Math.abs(profitMargin).toFixed(1)}% margin
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Raw Materials Consumed */}
                                            {log.materialsConsumed && log.materialsConsumed.length > 0 && (
                                                <div className="mt-4 border rounded-lg overflow-hidden">
                                                    <div className="bg-muted/50 px-4 py-2 border-b">
                                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                                            <Boxes className="h-4 w-4" />
                                                            Raw Materials Consumed ({log.materialsConsumed.length} items)
                                                        </h4>
                                                    </div>
                                                    <div className="divide-y">
                                                        {log.materialsConsumed.map((material, idx) => (
                                                            <div key={idx} className="px-4 py-2 flex justify-between items-center hover:bg-muted/30">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{material.rawMaterialName || material.name}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            SKU: {material.rawMaterialSku || material.sku || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-medium">
                                                                        {material.quantityUsed || material.quantityRequired} {material.unit}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        @ ₹{(material.costPerUnit || 0).toFixed(2)}/{material.unit}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right min-w-[80px]">
                                                                    <div className="font-bold text-amber-600 dark:text-amber-400">
                                                                        ₹{((material.quantityUsed || material.quantityRequired || 0) * (material.costPerUnit || 0)).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="bg-muted/50 px-4 py-2 border-t flex justify-between items-center">
                                                        <span className="text-sm font-medium">Total Raw Material Cost</span>
                                                        <span className="text-sm font-bold">₹{(log.totalRawMaterialCost || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {log.notes && (
                                                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                                                    <div className="text-xs text-muted-foreground mb-1">Production Notes:</div>
                                                    <div className="text-sm">{log.notes}</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
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
                                <select
                                    value={rawMaterialForm.category}
                                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value })}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="Uncategorized">Uncategorized</option>
                                    <optgroup label="Metals">
                                        <option value="Metals">Metals (General)</option>
                                        <option value="Steel">Steel</option>
                                        <option value="Aluminum">Aluminum</option>
                                        <option value="Copper">Copper</option>
                                        <option value="Brass">Brass</option>
                                        <option value="Iron">Iron</option>
                                    </optgroup>
                                    <optgroup label="Plastics & Polymers">
                                        <option value="Plastics">Plastics (General)</option>
                                        <option value="PVC">PVC</option>
                                        <option value="CPVC">CPVC</option>
                                        <option value="HDPE">HDPE</option>
                                        <option value="ABS">ABS</option>
                                        <option value="Polymers">Polymers</option>
                                        <option value="Rubber">Rubber</option>
                                    </optgroup>
                                    <optgroup label="Building Materials">
                                        <option value="Cement">Cement</option>
                                        <option value="Sand & Aggregates">Sand & Aggregates</option>
                                        <option value="Tiles">Tiles</option>
                                        <option value="Glass">Glass</option>
                                        <option value="Wood & Timber">Wood & Timber</option>
                                    </optgroup>
                                    <optgroup label="Chemicals & Coatings">
                                        <option value="Chemicals">Chemicals</option>
                                        <option value="Solvents">Solvents</option>
                                        <option value="Adhesives">Adhesives</option>
                                        <option value="Paints">Paints</option>
                                        <option value="Coatings">Coatings</option>
                                        <option value="Lubricants">Lubricants</option>
                                    </optgroup>
                                    <optgroup label="Components & Parts">
                                        <option value="Plumbing Components">Plumbing Components</option>
                                        <option value="Pipe Fittings">Pipe Fittings</option>
                                        <option value="Valves">Valves</option>
                                        <option value="Connectors">Connectors</option>
                                        <option value="Fasteners">Fasteners</option>
                                        <option value="Electronics Components">Electronics Components</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="Textiles">Textiles</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Packaging">Packaging</option>
                                        <option value="Consumables">Consumables</option>
                                        <option value="Other">Other</option>
                                    </optgroup>
                                </select>
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
                                    <Label className="text-right">Category</Label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="Uncategorized">Uncategorized</option>
                                        <optgroup label="Plumbing & Sanitary">
                                            <option value="Plumbing Products">Plumbing Products</option>
                                            <option value="Sanitary Products">Sanitary Products</option>
                                            <option value="Pipe Assemblies">Pipe Assemblies</option>
                                        </optgroup>
                                        <optgroup label="Electrical">
                                            <option value="Electrical Products">Electrical Products</option>
                                            <option value="Wiring Assemblies">Wiring Assemblies</option>
                                        </optgroup>
                                        <optgroup label="Furniture & Home">
                                            <option value="Furniture">Furniture</option>
                                            <option value="Home Products">Home Products</option>
                                        </optgroup>
                                        <optgroup label="Industrial">
                                            <option value="Industrial Products">Industrial Products</option>
                                            <option value="Machine Parts">Machine Parts</option>
                                            <option value="Tools">Tools</option>
                                        </optgroup>
                                        <optgroup label="Other">
                                            <option value="Consumer Products">Consumer Products</option>
                                            <option value="Other">Other</option>
                                        </optgroup>
                                    </select>
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
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Factory className="h-5 w-5 text-green-600" />
                            Produce: {selectedProductForProduction?.name}
                        </DialogTitle>
                        <DialogDescription>This will consume raw materials and add finished products to inventory</DialogDescription>
                    </DialogHeader>

                    {selectedProductForProduction && (() => {
                        // Calculate max producible quantity based on available materials
                        const maxProducible = selectedProductForProduction.billOfMaterials?.length > 0
                            ? Math.floor(Math.min(...selectedProductForProduction.billOfMaterials.map(item => {
                                const rawMaterial = rawMaterials.find(rm => rm._id === item.rawMaterialId);
                                const available = rawMaterial?.quantity || 0;
                                return item.quantityRequired > 0 ? available / item.quantityRequired : 0;
                            })))
                            : 0;

                        const currentQty = parseInt(productionQuantity || 0, 10);
                        const totalRawMaterialCost = selectedProductForProduction.billOfMaterials?.reduce((sum, item) => {
                            return sum + (item.quantityRequired * currentQty * (item.costPerUnit || 0));
                        }, 0) || 0;
                        const totalMfgCost = (selectedProductForProduction.manufacturingCost || 0) * currentQty;
                        const totalCost = totalRawMaterialCost + totalMfgCost;
                        const expectedRevenue = (selectedProductForProduction.sellingPrice || 0) * currentQty;
                        const expectedProfit = expectedRevenue - totalCost;
                        const profitMargin = expectedRevenue > 0 ? (expectedProfit / expectedRevenue * 100) : 0;

                        return (
                            <div className="space-y-4">
                                {/* Max Producible Info */}
                                <div className={`p-4 rounded-lg border-2 ${maxProducible > 0 ? 'border-green-200 bg-green-500/5 dark:bg-green-500/10' : 'border-red-200 bg-red-500/5 dark:bg-red-500/10'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Maximum Producible:</span>
                                        <span className={`text-2xl font-bold ${maxProducible > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {maxProducible} units
                                        </span>
                                    </div>
                                    {maxProducible === 0 && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ Not enough raw materials to produce even 1 unit</p>
                                    )}
                                </div>

                                {/* BOM Preview with Stock Status */}
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-2 border-b">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <Boxes className="h-4 w-4" />
                                            Raw Materials Required
                                        </h4>
                                    </div>
                                    <div className="divide-y max-h-[200px] overflow-y-auto">
                                        {selectedProductForProduction.billOfMaterials?.map((item, i) => {
                                            const rawMaterial = rawMaterials.find(rm => rm._id === item.rawMaterialId);
                                            const available = rawMaterial?.quantity || 0;
                                            const needed = item.quantityRequired * currentQty;
                                            const remaining = available - needed;
                                            const isEnough = available >= needed;
                                            const willBeLow = remaining <= (rawMaterial?.minimumStock || 10);
                                            const itemCost = needed * (item.costPerUnit || 0);

                                            return (
                                                <div key={i} className={`px-4 py-2 ${!isEnough ? 'bg-red-500/5 dark:bg-red-500/10' : willBeLow ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">{item.rawMaterialName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {item.quantityRequired} {item.unit} × {currentQty} units = <span className="font-medium">{needed.toFixed(2)} {item.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium">₹{itemCost.toFixed(2)}</div>
                                                            <div className={`text-xs ${!isEnough ? 'text-red-600 font-medium' : willBeLow ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                                Stock: {available} → {remaining.toFixed(2)} {item.unit}
                                                                {!isEnough && <span className="ml-1">    Shortage!</span>}
                                                                {isEnough && willBeLow && <span className="ml-1">⚠️ Low after</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div className="grid gap-2">
                                    <Label className="flex justify-between">
                                        <span>Quantity to Produce</span>
                                        <span className="text-xs text-muted-foreground">Max: {maxProducible}</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            max={maxProducible}
                                            value={productionQuantity}
                                            onChange={(e) => setProductionQuantity(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setProductionQuantity(Math.max(1, Math.floor(maxProducible / 2)).toString())}
                                            disabled={maxProducible < 2}
                                        >
                                            Half
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setProductionQuantity(maxProducible.toString())}
                                            disabled={maxProducible < 1}
                                        >
                                            Max
                                        </Button>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label>Production Notes (Optional)</Label>
                                    <Textarea
                                        value={productionNotes}
                                        onChange={(e) => setProductionNotes(e.target.value)}
                                        placeholder="E.g., Order #12345, Priority batch..."
                                        rows={2}
                                    />
                                </div>

                                {/* Cost & Profit Summary */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 text-center">
                                        <div className="text-xs text-muted-foreground">Raw Material Cost</div>
                                        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{totalRawMaterialCost.toFixed(2)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-500/5 dark:bg-purple-500/10 text-center">
                                        <div className="text-xs text-muted-foreground">Manufacturing Cost</div>
                                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{totalMfgCost.toFixed(2)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 text-center">
                                        <div className="text-xs text-muted-foreground">Total Production Cost</div>
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{totalCost.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">₹{currentQty > 0 ? (totalCost / currentQty).toFixed(2) : '0.00'}/unit</div>
                                    </div>
                                    <div className={`p-3 rounded-lg text-center ${expectedProfit >= 0 ? 'bg-green-500/5 dark:bg-green-500/10' : 'bg-red-500/5 dark:bg-red-500/10'}`}>
                                        <div className="text-xs text-muted-foreground">Expected Profit</div>
                                        <div className={`text-lg font-bold ${expectedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            ₹{expectedProfit.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {profitMargin >= 0 ? '↑' : '↓'} {Math.abs(profitMargin).toFixed(1)}% margin
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductionModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleProduction}
                            disabled={loading || parseInt(productionQuantity || 0, 10) < 1}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                            {loading ? 'Producing...' : `Produce ${productionQuantity || 0} Units`}
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

            {/* Raw Material History Modal - Compact Design */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-3">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5 text-blue-600" />
                            {selectedMaterialForHistory?.name}
                            <Badge variant="outline" className="ml-2 font-normal">
                                {selectedMaterialForHistory?.sku}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {historyLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        ) : materialHistory ? (
                            <>
                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                            {materialHistory.rawMaterial.currentStock}
                                            <span className="text-xs font-normal ml-1">{materialHistory.rawMaterial.unit}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">In Stock</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                                        <div className="text-lg font-bold text-red-600">
                                            {materialHistory.summary.totalConsumed.toFixed(1)}
                                            <span className="text-xs font-normal ml-1">{materialHistory.rawMaterial.unit}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total Used</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
                                        <div className="text-lg font-bold text-purple-600">
                                            {materialHistory.summary.uniqueProducts}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Products</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                                        <div className="text-lg font-bold text-green-600">
                                            {materialHistory.summary.totalBatches}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Batches</div>
                                    </div>
                                </div>

                                {/* Products Using This Material - Compact Table */}
                                {materialHistory.productsUsingMaterial && materialHistory.productsUsingMaterial.length > 0 && (
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-3 py-2 border-b">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Package2 className="h-4 w-4 text-purple-600" />
                                                Products Using This Material
                                            </h4>
                                        </div>
                                        <div className="divide-y">
                                            {materialHistory.productsUsingMaterial.map((product, index) => {
                                                const usageData = materialHistory.productUsageBreakdown?.find(
                                                    u => u.productId.toString() === product._id.toString()
                                                );
                                                const maxUsage = Math.max(...(materialHistory.productUsageBreakdown?.map(u => u.totalQuantityUsed) || [1]));
                                                const usagePercent = usageData ? (usageData.totalQuantityUsed / maxUsage) * 100 : 0;

                                                return (
                                                    <div key={product._id} className="px-3 py-2 hover:bg-muted/30">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getTimelineColor(index, materialHistory.productsUsingMaterial.length)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                                                    {index + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-sm truncate">{product.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                                                                </div>
                                                            </div>

                                                            <div className="text-center shrink-0 w-20">
                                                                <div className="text-sm font-bold text-blue-600">
                                                                    {product.quantityRequiredPerUnit} {product.unit}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground">per unit</div>
                                                            </div>

                                                            <div className="text-center shrink-0 w-24">
                                                                {usageData ? (
                                                                    <>
                                                                        <div className="text-sm font-bold text-red-600">
                                                                            {usageData.totalQuantityUsed.toFixed(1)} {materialHistory.rawMaterial.unit}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground">{usageData.batches} batches</div>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">Not used yet</span>
                                                                )}
                                                            </div>

                                                            <div className="text-right shrink-0 w-20">
                                                                {usageData ? (
                                                                    <div className="text-sm font-bold text-amber-600">
                                                                        ₹{usageData.totalCost.toFixed(0)}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {usageData && (
                                                            <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${getTimelineColor(index, materialHistory.productsUsingMaterial.length)} transition-all duration-500`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Production Timeline - Compact Table Version */}
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-3 py-2 border-b flex items-center justify-between">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            Production History
                                        </h4>
                                        <span className="text-xs text-muted-foreground">
                                            {materialHistory.usageHistory.length} records
                                        </span>
                                    </div>

                                    {materialHistory.usageHistory.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No production history yet</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-[250px] overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 sticky top-0">
                                                    <tr className="text-xs text-muted-foreground">
                                                        <th className="text-left px-3 py-2 font-medium">Date</th>
                                                        <th className="text-left px-3 py-2 font-medium">Product</th>
                                                        <th className="text-center px-3 py-2 font-medium">Used</th>
                                                        <th className="text-center px-3 py-2 font-medium">Produced</th>
                                                        <th className="text-right px-3 py-2 font-medium">Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {materialHistory.usageHistory.map((item, index) => (
                                                        <tr key={item._id} className="hover:bg-muted/30">
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${getTimelineColor(index, materialHistory.usageHistory.length)}`} />
                                                                    <div>
                                                                        <div className="font-medium text-xs">
                                                                            {new Date(item.productionDate).toLocaleDateString('en-IN', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: '2-digit'
                                                                            })}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground">
                                                                            {formatTimeAgo(item.productionDate)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="font-medium truncate max-w-[140px]">{item.productName}</div>
                                                                <div className="text-[10px] text-muted-foreground">{item.productSku}</div>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className="font-bold text-red-600">-{item.quantityConsumed.toFixed(1)}</span>
                                                                <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className="font-bold text-green-600">+{item.productQuantityProduced}</span>
                                                                <span className="text-xs text-muted-foreground ml-1">units</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                <span className="font-bold text-amber-600">₹{item.totalCost.toFixed(0)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Monthly Trend - Compact */}
                                {materialHistory.monthlyTrend && materialHistory.monthlyTrend.some(m => m.quantityUsed > 0) && (
                                    <div className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-indigo-600" />
                                                Monthly Trend
                                            </h4>
                                            <span className="text-xs text-muted-foreground">Last 12 months</span>
                                        </div>
                                        <div className="flex items-end justify-between gap-1 h-14">
                                            {materialHistory.monthlyTrend.map((month, index) => {
                                                const maxQty = Math.max(...materialHistory.monthlyTrend.map(m => m.quantityUsed));
                                                const heightPercent = maxQty > 0 ? (month.quantityUsed / maxQty) * 100 : 0;
                                                return (
                                                    <div key={month.month} className="flex-1 flex flex-col items-center">
                                                        <div
                                                            className={`w-full rounded-t transition-all duration-300 ${month.quantityUsed > 0
                                                                ? 'bg-gradient-to-t from-indigo-500 to-purple-400'
                                                                : 'bg-muted/30'
                                                                }`}
                                                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                                            title={`${month.month}: ${month.quantityUsed.toFixed(1)} ${materialHistory.rawMaterial.unit}`}
                                                        />
                                                        <div className="text-[8px] text-muted-foreground mt-1">
                                                            {month.month.slice(5)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Failed to load history</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-3 border-t">
                        <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Invoice Scanner */}
            <InvoiceScanner
                isOpen={isInvoiceScannerOpen}
                onClose={() => setIsInvoiceScannerOpen(false)}
                inventoryType="manufacturing"
                onProductsConfirmed={onProductsConfirmedFromScanner}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete {deleteType === 'raw-material' ? 'Raw Material' : 'Product'}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this {deleteType === 'raw-material' ? 'raw material' : 'product'}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {itemToDelete && (
                        <div className="py-4">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="font-medium">{itemToDelete.name}</p>
                                <p className="text-sm text-muted-foreground">SKU: {itemToDelete.sku}</p>
                                {deleteType === 'raw-material' && (
                                    <p className="text-sm text-muted-foreground">
                                        Quantity: {itemToDelete.quantity} {itemToDelete.unit}
                                    </p>
                                )}
                                {deleteType === 'product' && (
                                    <p className="text-sm text-muted-foreground">
                                        Finished: {itemToDelete.finishedQuantity} units
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteType === 'raw-material' ? confirmDeleteRawMaterial : confirmDeleteProduct}
                        >
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
                            Delete {bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length} {bulkDeleteType === 'raw-material' ? 'Raw Materials' : 'Products'}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length} selected {bulkDeleteType === 'raw-material' ? 'raw material' : 'product'}{(bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length) > 1 ? 's' : ''}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="font-medium text-destructive">Warning</p>
                            <p className="text-sm text-muted-foreground">
                                You are about to permanently delete {bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length} {bulkDeleteType === 'raw-material' ? 'raw material' : 'product'}{(bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length) > 1 ? 's' : ''} from your inventory.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmBulkDelete}>
                            Delete All ({bulkDeleteType === 'raw-material' ? selectedRawMaterials.length : selectedManufacturingProducts.length})
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Confirmation Dialog */}
            <Dialog open={showPaymentConfirmDialog} onOpenChange={setShowPaymentConfirmDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            Payment Confirmation
                        </DialogTitle>
                        <DialogDescription>
                            Are these raw materials being paid for?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/50 border">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">Items to add:</span>
                                <Badge variant="secondary" className="font-semibold">
                                    {pendingScannedItems.length} items
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Value:</span>
                                <span className="text-lg font-bold text-green-600">
                                    ₹{pendingScannedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}
                                </span>
                            </div>
                            {pendingSupplierInfo?.name && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                    <span className="text-sm text-muted-foreground">Supplier:</span>
                                    <span className="text-sm font-medium">{pendingSupplierInfo.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3 sm:gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handlePaymentConfirmation(false)}
                            disabled={addingProducts}
                            className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                            {addingProducts ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Not Paid
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handlePaymentConfirmation(true)}
                            disabled={addingProducts}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        >
                            {addingProducts ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Yes, Paid
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Method Dialog */}
            <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            Payment Details
                        </DialogTitle>
                        <DialogDescription>
                            Select the payment method and enter the details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
                        {/* Payment Method Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Payment Method</Label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {[
                                    { id: 'cash', label: 'Cash', Icon: Wallet },
                                    { id: 'card', label: 'Card', Icon: CreditCard },
                                    { id: 'upi', label: 'UPI', Icon: Receipt },
                                    { id: 'bank', label: 'Bank', Icon: DollarSign },
                                    { id: 'cheque', label: 'Cheque', Icon: ClipboardList }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPaymentDetails({ ...paymentDetails, method: method.id })}
                                        className={`p-3 rounded-xl border-2 transition-all text-center ${paymentDetails.method === method.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                            : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/30'
                                            }`}
                                    >
                                        <method.Icon className={`h-6 w-6 mx-auto mb-1 ${paymentDetails.method === method.id ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs font-medium ${paymentDetails.method === method.id ? 'text-blue-600' : 'text-muted-foreground'
                                            }`}>
                                            {method.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Fields based on Payment Method */}
                        {paymentDetails.method === 'card' && (
                            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                                <div className="space-y-2">
                                    <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
                                    <Input
                                        id="transactionId"
                                        placeholder="Enter transaction ID"
                                        value={paymentDetails.transactionId}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {paymentDetails.method === 'upi' && (
                            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                                <div className="space-y-2">
                                    <Label htmlFor="upiId">UPI ID</Label>
                                    <Input
                                        id="upiId"
                                        placeholder="e.g., name@upi"
                                        value={paymentDetails.upiId}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transactionIdUpi">Transaction ID</Label>
                                    <Input
                                        id="transactionIdUpi"
                                        placeholder="Enter UPI transaction ID"
                                        value={paymentDetails.transactionId}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {paymentDetails.method === 'bank' && (
                            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input
                                            id="bankName"
                                            placeholder="Enter bank name"
                                            value={paymentDetails.bankName}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNumber">Account Number</Label>
                                        <Input
                                            id="accountNumber"
                                            placeholder="Last 4 digits"
                                            value={paymentDetails.accountNumber}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transactionIdBank">Transaction / NEFT / RTGS Reference</Label>
                                    <Input
                                        id="transactionIdBank"
                                        placeholder="Enter reference number"
                                        value={paymentDetails.transactionId}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {paymentDetails.method === 'cheque' && (
                            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="chequeNumber">Cheque Number</Label>
                                        <Input
                                            id="chequeNumber"
                                            placeholder="Enter cheque number"
                                            value={paymentDetails.chequeNumber}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="chequeDate">Cheque Date</Label>
                                        <Input
                                            id="chequeDate"
                                            type="date"
                                            value={paymentDetails.chequeDate}
                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankNameCheque">Bank Name</Label>
                                    <Input
                                        id="bankNameCheque"
                                        placeholder="Enter bank name"
                                        value={paymentDetails.bankName}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes (always shown) */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                            <Textarea
                                id="paymentNotes"
                                placeholder="Add any payment notes..."
                                value={paymentDetails.notes}
                                onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                                rows={2}
                            />
                        </div>

                        {/* Invoice Summary */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Amount Paid:</span>
                                <span className="text-xl font-bold text-green-600">
                                    ₹{updatingPurchase
                                        ? updatingPurchase.totalValue.toFixed(2)
                                        : pendingScannedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-shrink-0 flex gap-3 sm:gap-3">
                        <Button
                            variant="outline"
                            disabled={addingProducts}
                            onClick={() => {
                                setShowPaymentMethodDialog(false);
                                setUpdatingPurchase(null);
                                resetPaymentDetails();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePaymentMethodSubmit}
                            disabled={addingProducts}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        >
                            {addingProducts ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Purchase History Dialog */}
            <Dialog open={showPurchaseHistoryDialog} onOpenChange={setShowPurchaseHistoryDialog}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] h-auto overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                            Purchase History
                            <Badge variant="secondary" className="ml-2">
                                {purchaseHistory.length} purchases
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 ml-auto"
                                onClick={fetchPurchaseHistory}
                                disabled={purchaseHistoryLoading}
                            >
                                <RefreshCcw className={`h-4 w-4 ${purchaseHistoryLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </DialogTitle>
                        <DialogDescription>
                            View all your recent purchases and their payment details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
                        {selectedPurchase ? (
                            // Detailed view of selected purchase
                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPurchase(null)}
                                    className="mb-2"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to list
                                </Button>

                                {/* Purchase Summary */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/50 border">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date</p>
                                            <p className="font-medium">{new Date(selectedPurchase.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier</p>
                                            <p className="font-medium">{selectedPurchase.supplier?.name || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Items</p>
                                            <p className="font-medium">{selectedPurchase.itemCount} items</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Value</p>
                                            <p className="font-bold text-green-600">₹{selectedPurchase.totalValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className={`p-4 rounded-xl border ${selectedPurchase.isPaid
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        {selectedPurchase.isPaid ? (
                                            <>
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                <h4 className="font-semibold text-green-700 dark:text-green-400">Payment Details</h4>
                                                <Badge className="bg-green-500 text-white">Paid</Badge>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">Payment Status</h4>
                                                    <Badge variant="outline" className="border-amber-500 text-amber-600">Unpaid</Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleMarkAsPaid(selectedPurchase)}
                                                >
                                                    Mark as Paid
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {selectedPurchase.isPaid && selectedPurchase.paymentDetails && (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Method</p>
                                                <p className="font-medium capitalize flex items-center gap-2 text-green-700 dark:text-green-400">
                                                    {selectedPurchase.paymentDetails.method === 'cash' && <Wallet className="h-4 w-4" />}
                                                    {selectedPurchase.paymentDetails.method === 'card' && <CreditCard className="h-4 w-4" />}
                                                    {selectedPurchase.paymentDetails.method === 'upi' && <Receipt className="h-4 w-4" />}
                                                    {selectedPurchase.paymentDetails.method === 'bank' && <DollarSign className="h-4 w-4" />}
                                                    {selectedPurchase.paymentDetails.method === 'cheque' && <ClipboardList className="h-4 w-4" />}
                                                    {selectedPurchase.paymentDetails.method}
                                                </p>
                                            </div>
                                            {selectedPurchase.paymentDetails.transactionId && (
                                                <div>
                                                    <p className="text-muted-foreground">Transaction ID</p>
                                                    <p className="font-mono font-medium text-green-700 dark:text-green-400">{selectedPurchase.paymentDetails.transactionId}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.upiId && (
                                                <div>
                                                    <p className="text-muted-foreground">UPI ID</p>
                                                    <p className="font-medium text-green-700 dark:text-green-400">{selectedPurchase.paymentDetails.upiId}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.bankName && (
                                                <div>
                                                    <p className="text-muted-foreground">Bank</p>
                                                    <p className="font-medium text-green-700 dark:text-green-400">{selectedPurchase.paymentDetails.bankName}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.accountNumber && (
                                                <div>
                                                    <p className="text-muted-foreground">Account</p>
                                                    <p className="font-mono font-medium text-green-700 dark:text-green-400">****{selectedPurchase.paymentDetails.accountNumber}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.chequeNumber && (
                                                <div>
                                                    <p className="text-muted-foreground">Cheque No.</p>
                                                    <p className="font-mono font-medium text-green-700 dark:text-green-400">{selectedPurchase.paymentDetails.chequeNumber}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.chequeDate && (
                                                <div>
                                                    <p className="text-muted-foreground">Cheque Date</p>
                                                    <p className="font-medium text-green-700 dark:text-green-400">{new Date(selectedPurchase.paymentDetails.chequeDate).toLocaleDateString('en-IN')}</p>
                                                </div>
                                            )}
                                            {selectedPurchase.paymentDetails.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground">Notes</p>
                                                    <p className="font-medium text-green-700 dark:text-green-400">{selectedPurchase.paymentDetails.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Items Table */}
                                <div className="rounded-lg border overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-2 border-b">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Purchased Items
                                        </h4>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead className="text-right">Unit Cost</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPurchase.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                {item.sku && <code className="text-xs text-muted-foreground">{item.sku}</code>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {item.quantity} {item.unit}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            ₹{(item.costPerUnit || item.basePrice || 0).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ₹{(item.totalCost || 0).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // List of all purchases
                            <div className="space-y-3">
                                {purchaseHistoryLoading ? (
                                    // Loading skeleton
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 rounded-xl border">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Skeleton className="h-5 w-16" />
                                                            <Skeleton className="h-5 w-12" />
                                                        </div>
                                                        <Skeleton className="h-4 w-32 mb-1" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                    <div className="text-right">
                                                        <Skeleton className="h-6 w-20 mb-1" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : purchaseHistory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>No purchase history yet</p>
                                        <p className="text-sm">Scan invoices and add products to see them here</p>
                                    </div>
                                ) : (
                                    purchaseHistory.map((purchase) => (
                                        <div
                                            key={purchase.id}
                                            className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => setSelectedPurchase(purchase)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant={purchase.isPaid ? 'default' : 'outline'}
                                                            className={purchase.isPaid
                                                                ? 'bg-green-500 text-white'
                                                                : 'border-amber-500 text-amber-600'
                                                            }>
                                                            {purchase.isPaid ? '✓ Paid' : 'Unpaid'}
                                                        </Badge>
                                                        {purchase.isPaid && purchase.paymentDetails && (
                                                            <Badge variant="outline" className="text-xs capitalize flex items-center gap-1">
                                                                {purchase.paymentDetails.method === 'cash' && <Wallet className="h-3 w-3" />}
                                                                {purchase.paymentDetails.method === 'card' && <CreditCard className="h-3 w-3" />}
                                                                {purchase.paymentDetails.method === 'upi' && <Receipt className="h-3 w-3" />}
                                                                {purchase.paymentDetails.method === 'bank' && <DollarSign className="h-3 w-3" />}
                                                                {purchase.paymentDetails.method === 'cheque' && <ClipboardList className="h-3 w-3" />}
                                                                {purchase.paymentDetails.method}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(purchase.date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Package className="h-3.5 w-3.5" />
                                                            {purchase.itemCount} items
                                                        </span>
                                                        {purchase.supplier?.name && (
                                                            <span className="flex items-center gap-1">
                                                                <Factory className="h-3.5 w-3.5" />
                                                                {purchase.supplier.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">
                                                        ₹{purchase.totalValue.toFixed(2)}
                                                    </p>
                                                    <Button variant="ghost" size="sm" className="mt-1">
                                                        View Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-shrink-0 border-t pt-4">
                        <Button variant="outline" onClick={() => {
                            setShowPurchaseHistoryDialog(false);
                            setSelectedPurchase(null);
                        }}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div >
    );
}

