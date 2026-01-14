import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/sales
// Get all sales with optional filters
export async function GET(request) {
    console.log('GET /api/inventory/sales - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        await dbConnect();

        let query = { userId };

        // Date range filter
        if (startDate || endDate) {
            query.saleDate = {};
            if (startDate) query.saleDate.$gte = new Date(startDate);
            if (endDate) query.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        // Status filters
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Text search
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const sales = await Sale.find(query)
            .sort({ saleDate: -1 })
            .limit(limit);

        // Calculate summary stats
        const allSales = await Sale.find({ userId, status: 'completed' });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todaySales = allSales.filter(s => new Date(s.saleDate) >= todayStart);

        const summary = {
            totalSales: allSales.length,
            todaySales: todaySales.length,
            totalRevenue: allSales.reduce((sum, s) => sum + s.grandTotal, 0),
            todayRevenue: todaySales.reduce((sum, s) => sum + s.grandTotal, 0),
            totalProfit: allSales.reduce((sum, s) => sum + s.profit, 0),
            todayProfit: todaySales.reduce((sum, s) => sum + s.profit, 0),
            pendingPayments: allSales.filter(s => s.paymentStatus === 'pending').length,
            pendingAmount: allSales.filter(s => s.paymentStatus !== 'paid').reduce((sum, s) => sum + s.amountDue, 0)
        };

        console.log(`Fetched ${sales.length} sales for user ${userId}`);

        return NextResponse.json({ sales, summary });
    } catch (error) {
        console.error('Error in GET /api/inventory/sales:', error);
        return NextResponse.json(
            { message: 'Failed to fetch sales', error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/inventory/sales
// Create a new sale
export async function POST(request) {
    console.log('POST /api/inventory/sales - Request received');

    try {
        const { userId } = await getAuthenticatedUser(request);

        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.items || data.items.length === 0) {
            return NextResponse.json(
                { message: 'At least one item is required for a sale' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Generate invoice number if not provided
        const invoiceNumber = data.invoiceNumber || await Sale.generateInvoiceNumber(userId);

        // Validate stock availability and build items array
        const saleItems = [];
        const stockUpdates = [];

        for (const item of data.items) {
            const product = await Product.findOne({ _id: item.productId, userId });

            if (!product) {
                return NextResponse.json(
                    { message: `Product not found: ${item.productName || item.productId}` },
                    { status: 400 }
                );
            }

            // Note: Stock validation removed to allow sales with insufficient stock (for pre-orders/backorders)
            // Stock can go negative - this should be monitored
            if (product.quantity < item.quantity) {
                console.warn(`Warning: Selling ${item.quantity} of ${product.name} but only ${product.quantity} in stock. Stock will go negative.`);
            }

            const sellingPrice = item.sellingPrice || product.price;
            const costPrice = product.cost || 0;
            const quantity = item.quantity;
            const discount = item.discount || 0;
            const tax = item.tax || 0;
            const totalPrice = (sellingPrice * quantity) - discount + tax;

            saleItems.push({
                productId: product._id,
                productName: product.name,
                productSku: product.sku,
                quantity: quantity,
                unit: product.unit || 'pcs',
                costPrice: costPrice,
                sellingPrice: sellingPrice,
                discount: discount,
                tax: tax,
                totalPrice: totalPrice
            });

            stockUpdates.push({
                productId: product._id,
                deductQuantity: quantity
            });
        }

        // Calculate totals
        const subtotal = saleItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        const totalDiscount = saleItems.reduce((sum, item) => sum + item.discount, 0);
        const totalTax = saleItems.reduce((sum, item) => sum + item.tax, 0);
        const grandTotal = subtotal - totalDiscount + totalTax;
        const totalCost = saleItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        const profit = grandTotal - totalCost;
        const profitMargin = grandTotal > 0 ? (profit / grandTotal) * 100 : 0;
        const amountPaid = data.amountPaid !== undefined ? data.amountPaid : grandTotal;
        const amountDue = Math.max(0, grandTotal - amountPaid);

        // Determine payment status
        let paymentStatus = 'paid';
        if (amountPaid === 0) paymentStatus = 'pending';
        else if (amountPaid < grandTotal) paymentStatus = 'partial';

        // Create sale record
        const sale = new Sale({
            userId,
            invoiceNumber,
            customer: data.customer || { name: 'Walk-in Customer' },
            items: saleItems,
            subtotal,
            totalDiscount,
            totalTax,
            grandTotal,
            totalCost,
            profit,
            profitMargin,
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus,
            amountPaid,
            amountDue,
            saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
            notes: data.notes || '',
            status: 'completed'
        });

        await sale.save();

        // Deduct stock from products
        for (const update of stockUpdates) {
            await Product.findByIdAndUpdate(
                update.productId,
                {
                    $inc: { quantity: -update.deductQuantity },
                    updatedAt: new Date()
                }
            );
        }

        console.log(`Sale created: ${invoiceNumber} for user ${userId}`);

        return NextResponse.json({
            message: 'Sale recorded successfully',
            sale,
            summary: {
                invoiceNumber,
                itemCount: saleItems.length,
                grandTotal,
                profit,
                profitMargin: profitMargin.toFixed(1)
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/inventory/sales:', error);
        return NextResponse.json(
            { message: 'Failed to create sale', error: error.message },
            { status: 500 }
        );
    }
}
