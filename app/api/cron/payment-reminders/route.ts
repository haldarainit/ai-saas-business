import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PaymentReminder from '@/models/PaymentReminder';
import PurchaseHistory from '@/models/PurchaseHistory';
import EmailService from '@/lib/email/EmailService';

interface ReminderItem {
    name?: string;
    sku?: string;
    quantity?: number;
    unit?: string;
    costPerUnit?: number;
    basePrice?: number;
    totalCost?: number;
}

interface Supplier {
    name?: string;
    gstin?: string;
}

interface EmailData {
    userName: string;
    items: ReminderItem[];
    supplier: Supplier | null;
    totalValue: number;
    purchaseDate: Date;
    itemCount: number;
    reminderCount: number;
}

// GET /api/cron/payment-reminders
// This endpoint should be called by a cron job (e.g., daily) to send pending payment reminders
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('GET /api/cron/payment-reminders - Cron job triggered (v2)');

    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('key');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
        const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
        const isParamValid = apiKey === cronSecret;

        if (!isHeaderValid && !isParamValid) {
            console.log('Unauthorized cron request');
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    try {
        await dbConnect();

        const now = new Date();

        // Find all active reminders where nextReminderDate has passed
        const dueReminders = await PaymentReminder.find({
            status: 'active',
            nextReminderDate: { $lte: now }
        }).limit(50); // Process max 50 at a time to avoid timeout

        console.log(`Found ${dueReminders.length} due reminders`);

        if (dueReminders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending reminders to send',
                processed: 0
            });
        }

        const emailService = new EmailService();
        const results = {
            sent: 0,
            failed: 0,
            cancelled: 0,
            errors: [] as { reminderId: string; error: string }[]
        };

        for (const reminder of dueReminders) {
            try {
                // Check if the purchase has been paid (if purchaseId exists)
                if (reminder.purchaseId) {
                    const purchase = await PurchaseHistory.findById(reminder.purchaseId);

                    if (!purchase) {
                        // Purchase was deleted, cancel the reminder
                        reminder.status = 'cancelled';
                        await reminder.save();
                        results.cancelled++;
                        console.log(`Reminder ${reminder._id} cancelled - purchase not found`);
                        continue;
                    }

                    if (purchase.isPaid) {
                        // Payment has been made, mark reminder as completed
                        reminder.status = 'completed';
                        await reminder.save();
                        results.cancelled++;
                        console.log(`Reminder ${reminder._id} completed - payment already made`);
                        continue;
                    }
                }

                // Generate and send email
                const emailHtml = generateFollowUpReminderEmail({
                    userName: reminder.recipientName,
                    items: reminder.items,
                    supplier: reminder.supplier,
                    totalValue: reminder.totalValue,
                    purchaseDate: reminder.purchaseDate,
                    itemCount: reminder.items.length,
                    reminderCount: reminder.reminderCount + 1
                });

                const result = await emailService.sendEmail(
                    reminder.recipientEmail,
                    `⚠️ Payment Reminder #${reminder.reminderCount + 1} - ₹${reminder.totalValue.toFixed(2)} Still Pending`,
                    emailHtml
                );

                if (result.success) {
                    // Update reminder for next week
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + 7);

                    reminder.reminderCount += 1;
                    reminder.lastReminderSent = new Date();
                    reminder.nextReminderDate = nextDate;
                    await reminder.save();

                    results.sent++;
                    console.log(`Reminder sent to ${reminder.recipientEmail}, next: ${nextDate.toISOString()}`);
                } else {
                    throw new Error(result.error || 'Email send failed');
                }
            } catch (error) {
                const err = error as Error;
                results.failed++;
                results.errors.push({
                    reminderId: reminder._id.toString(),
                    error: err.message
                });
                console.error(`Failed to process reminder ${reminder._id}:`, err);
            }
        }

        console.log(`Cron job completed: ${results.sent} sent, ${results.failed} failed, ${results.cancelled} cancelled`);

        return NextResponse.json({
            success: true,
            message: 'Payment reminders processed',
            results
        });
    } catch (error) {
        const err = error as Error;
        console.error('Error in payment reminders cron job:', err);
        return NextResponse.json(
            { message: 'Cron job failed', error: err.message },
            { status: 500 }
        );
    }
}

// Generate HTML email for follow-up reminder
function generateFollowUpReminderEmail({ userName, items, supplier, totalValue, purchaseDate, itemCount, reminderCount }: EmailData): string {
    const formattedDate = new Date(purchaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const daysSincePurchase = Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24));

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
    <title>Payment Reminder #${reminderCount}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Payment Reminder #${reminderCount}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${daysSincePurchase} Days Since Purchase</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hello <strong>${userName}</strong>,
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                This is a friendly reminder that you have an outstanding payment pending since <strong>${formattedDate}</strong>. Please settle this payment at your earliest convenience.
            </p>

            <!-- Alert Banner -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 15px; margin-bottom: 25px; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 15px;">⏰</span>
                <div>
                    <div style="font-weight: 600; color: #991b1b;">Outstanding for ${daysSincePurchase} days</div>
                    <div style="font-size: 12px; color: #b91c1c;">This is reminder #${reminderCount}</div>
                </div>
            </div>

            <!-- Summary Card -->
            <div style="background: #fef2f2; border-radius: 10px; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 25px;">
                <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 600;">Total Amount Due</div>
                <div style="font-size: 28px; font-weight: 700; color: #dc2626; margin-top: 5px;">₹${totalValue.toFixed(2)}</div>
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
                    📦 Pending Items
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
                            <tr style="background: #fef2f2;">
                                <td colspan="4" style="padding: 15px 8px; text-align: right; font-weight: 600; color: #991b1b;">Total Amount Pending:</td>
                                <td style="padding: 15px 8px; text-align: right; font-weight: 700; font-size: 18px; color: #dc2626;">₹${totalValue.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #dc2626;">
                <div style="font-size: 24px; margin-bottom: 10px;">💳</div>
                <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">Immediate Action Required</h4>
                <p style="color: #b91c1c; font-size: 14px; margin: 0;">
                    Please make the payment to the supplier and update the payment status in your inventory management system to stop receiving these reminders.
                </p>
            </div>

            <!-- Footer Note -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 25px 0 0 0;">
                This is an automated reminder from your Inventory Management System.<br/>
                You will continue to receive weekly reminders until the payment is marked as complete.
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
