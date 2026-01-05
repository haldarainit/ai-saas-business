import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';
import EmailService from '@/lib/email/EmailService';

// POST /api/inventory/purchase-history/notify-pending
// Send email notification for unpaid purchase
export async function POST(request) {
    console.log('POST /api/inventory/purchase-history/notify-pending - Request received');

    try {
        const { userId, email, name } = await getAuthenticatedUser(request);

        if (!userId || !email) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            return NextResponse.json(
                { message: 'Items array is required' },
                { status: 400 }
            );
        }

        const items = data.items;
        const supplier = data.supplier;
        const totalValue = data.totalValue || items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
        const purchaseDate = data.date ? new Date(data.date) : new Date();

        // Generate email HTML content
        const emailHtml = generatePendingPaymentEmail({
            userName: name || 'User',
            items,
            supplier,
            totalValue,
            purchaseDate,
            itemCount: items.length
        });

        const emailService = new EmailService();
        const result = await emailService.sendEmail(
            email,
            `⚠️ Pending Payment Reminder - ₹${totalValue.toFixed(2)}`,
            emailHtml
        );

        if (result.success) {
            console.log(`Pending payment email sent to ${email}`);
            return NextResponse.json({
                success: true,
                message: 'Email sent successfully',
                recipient: email
            });
        } else {
            throw new Error(result.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('Error sending pending payment email:', error);
        return NextResponse.json(
            { message: 'Failed to send email', error: error.message },
            { status: 500 }
        );
    }
}

// Generate HTML email for pending payment notification
function generatePendingPaymentEmail({ userName, items, supplier, totalValue, purchaseDate, itemCount }) {
    const formattedDate = purchaseDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemRows = items.map((item, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-size: 14px;">${index + 1}</td>
            <td style="padding: 12px 8px;">
                <div style="font-weight: 500; color: #1f2937;">${item.name || 'Unknown Item'}</div>
                ${item.sku ? `<div style="font-size: 12px; color: #6b7280;">${item.sku}</div>` : ''}
            </td>
            <td style="padding: 12px 8px; text-align: center; font-size: 14px;">${item.quantity || 0} ${item.unit || 'pcs'}</td>
            <td style="padding: 12px 8px; text-align: right; font-size: 14px;">₹${(item.costPerUnit || item.basePrice || 0).toFixed(2)}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #1f2937;">₹${(item.totalCost || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pending Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Pending Payment Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Raw Materials Added Without Payment</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hello <strong>${userName}</strong>,
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                You have added raw materials to your inventory without recording payment. Please find the details below for your reference and follow up.
            </p>

            <!-- Summary Cards -->
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <div style="flex: 1; background: #fef3c7; border-radius: 10px; padding: 15px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Total Amount Due</div>
                    <div style="font-size: 28px; font-weight: 700; color: #b45309; margin-top: 5px;">₹${totalValue.toFixed(2)}</div>
                </div>
            </div>

            <!-- Purchase Info -->
            <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">Purchase Date</div>
                        <div style="font-weight: 500; color: #1f2937;">${formattedDate}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">Total Items</div>
                        <div style="font-weight: 500; color: #1f2937;">${itemCount} items</div>
                    </div>
                    ${supplier?.name ? `
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">Supplier</div>
                        <div style="font-weight: 500; color: #1f2937;">${supplier.name}</div>
                    </div>
                    ` : ''}
                    ${supplier?.gstin ? `
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">GSTIN</div>
                        <div style="font-weight: 500; color: #1f2937;">${supplier.gstin}</div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                    📦 Purchased Items
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 12px;">#</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 12px;">Item</th>
                                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; font-size: 12px;">Qty</th>
                                <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px;">Unit Cost</th>
                                <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; font-size: 12px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                        <tfoot>
                            <tr style="background: #fef3c7;">
                                <td colspan="4" style="padding: 15px 8px; text-align: right; font-weight: 600; color: #92400e;">Total Amount Pending:</td>
                                <td style="padding: 15px 8px; text-align: right; font-weight: 700; font-size: 18px; color: #b45309;">₹${totalValue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #f59e0b;">
                <div style="font-size: 24px; margin-bottom: 10px;">💳</div>
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Action Required</h4>
                <p style="color: #78350f; font-size: 14px; margin: 0;">
                    Please make the payment to the supplier and update the payment status in your inventory management system.
                </p>
            </div>

            <!-- Footer Note -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 25px 0 0 0;">
                This is an automated reminder from your Inventory Management System.
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} HAI Business Platform. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;
}
