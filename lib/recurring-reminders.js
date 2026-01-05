import cron from 'node-cron';
import PurchaseReminder from '@/models/PurchaseReminder';
import EmailService from '@/lib/email/EmailService';

// Simple recurring reminder service
class RecurringReminderService {
    constructor() {
        this.isRunning = false;
        this.init();
    }

    init() {
        // Run every 5 days at 9:00 AM
        cron.schedule('0 9 */5 * *', async () => {
            if (this.isRunning) {
                console.log('Recurring reminders already running, skipping...');
                return;
            }
            
            await this.processRecurringReminders();
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        // For testing: run every 2 minutes in development
        if (process.env.NODE_ENV === 'development') {
            cron.schedule('*/2 * * * *', async () => {
                console.log('🧪 Development: Processing recurring reminders (every 2 minutes)');
                await this.processRecurringReminders();
            });
        }

        console.log('✅ Recurring reminder service initialized');
        console.log('📅 Schedule: Every 5 days at 9:00 AM (Asia/Kolkata)');
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Development: Also running every 2 minutes for testing');
        }
    }

    async processRecurringReminders() {
        this.isRunning = true;
        console.log('🔄 Processing recurring reminders...');

        try {
            const now = new Date();
            
            // Find all reminders that are due and active
            const dueReminders = await PurchaseReminder.find({
                'reminderSchedule.nextReminderDue': { $lte: now },
                'reminderSchedule.isActive': true,
                isPaid: false,
                status: { $in: ['pending', 'partial'] }
            });

            console.log(`📧 Found ${dueReminders.length} due reminders`);

            if (dueReminders.length === 0) {
                console.log('✅ No due reminders to process');
                this.isRunning = false;
                return;
            }

            const emailService = new EmailService();
            let successful = 0;
            let failed = 0;

            for (const reminder of dueReminders) {
                try {
                    // Generate recurring reminder email
                    const emailHtml = this.generateRecurringReminderEmail(reminder);
                    
                    const daysSincePurchase = Math.floor((new Date() - reminder.purchaseDate) / (1000 * 60 * 60 * 24));
                    const subject = `🔔 Payment Reminder #${reminder.reminderSchedule.totalRemindersSent + 1} - ₹${reminder.totalValue.toFixed(2)}`;
                    
                    const emailResult = await emailService.sendEmail(
                        reminder.email,
                        subject,
                        emailHtml
                    );

                    if (emailResult.success) {
                        // Update reminder schedule
                        await reminder.updateReminderSchedule();
                        successful++;
                        console.log(`✅ Email sent to ${reminder.email} (Reminder #${reminder.reminderSchedule.totalRemindersSent})`);
                    } else {
                        failed++;
                        console.error(`❌ Failed to send email to ${reminder.email}:`, emailResult.error);
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ Error processing reminder for ${reminder.email}:`, error.message);
                }
            }

            console.log(`📊 Results: ${successful} successful, ${failed} failed`);

        } catch (error) {
            console.error('❌ Error processing recurring reminders:', error);
        } finally {
            this.isRunning = false;
        }
    }

    generateRecurringReminderEmail(reminder) {
        const purchaseDate = reminder.purchaseDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const nextReminderDate = reminder.reminderSchedule.nextReminderDue.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const daysSincePurchase = Math.floor((new Date() - reminder.purchaseDate) / (1000 * 60 * 60 * 24));
        const urgencyLevel = daysSincePurchase > 30 ? 'high' : daysSincePurchase > 15 ? 'medium' : 'low';
        const urgencyColor = urgencyLevel === 'high' ? '#dc2626' : urgencyLevel === 'medium' ? '#ea580c' : '#ca8a04';

        const itemRows = reminder.items.map((item, index) => `
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
    <title>Recurring Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyLevel === 'high' ? '#991b1b' : urgencyLevel === 'medium' ? '#c2410c' : '#a16207'} 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Recurring Payment Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Reminder #${reminder.reminderSchedule.totalRemindersSent + 1} • ${daysSincePurchase} days overdue</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                Hello <strong>${reminder.userName}</strong>,
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                This is your <strong>${reminder.reminderSchedule.totalRemindersSent + 1}</strong> reminder about the pending payment for raw materials purchased on ${purchaseDate}. The payment is now <strong>${daysSincePurchase} days</strong> overdue.
            </p>

            <!-- Summary Cards -->
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <div style="flex: 1; background: #fef3c7; border-radius: 10px; padding: 15px; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 12px; color: #92400e; text-transform: uppercase; font-weight: 600;">Total Amount Due</div>
                    <div style="font-size: 28px; font-weight: 700; color: #b45309; margin-top: 5px;">₹${reminder.totalValue.toFixed(2)}</div>
                </div>
                <div style="flex: 1; background: #fee2e2; border-radius: 10px; padding: 15px; border-left: 4px solid #dc2626;">
                    <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 600;">Days Overdue</div>
                    <div style="font-size: 28px; font-weight: 700; color: #dc2626; margin-top: 5px;">${daysSincePurchase}</div>
                </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">📦 Purchased Items</h3>
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
                    <tbody>${itemRows}</tbody>
                    <tfoot>
                        <tr style="background: #fef3c7;">
                            <td colspan="4" style="padding: 15px 8px; text-align: right; font-weight: 600; color: #92400e;">Total Amount Pending:</td>
                            <td style="padding: 15px 8px; text-align: right; font-weight: 700; font-size: 18px; color: #b45309;">₹${reminder.totalValue.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #dc2626;">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">Payment Urgently Required</h4>
                <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
                    Please make the payment immediately and update the payment status in your inventory management system.
                </p>
            </div>

            <!-- Footer Note -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 25px 0 0 0;">
                This is automated reminder #${reminder.reminderSchedule.totalRemindersSent + 1} from your Inventory Management System.
                <br>Next reminder will be sent on ${nextReminderDate}.
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }
}

// Initialize the service
let recurringReminderService;

// Only initialize on server side
if (typeof window === 'undefined') {
    recurringReminderService = new RecurringReminderService();
}

export default recurringReminderService;
