# 🔄 Recurring Email Reminders - Simple Setup

Your recurring email reminder system is now **fully installed and ready**! 🎉

## ✅ What's Already Done

1. **Database Model**: `PurchaseReminder.js` created
2. **Recurring Service**: Automatic email scheduling every 5 days
3. **Integration**: Works with your existing "Not Paid" button
4. **Development Mode**: Tests every 2 minutes for easy debugging

## 🚀 How to Use

### **Step 1: Start Your App**
```bash
npm run dev
```

### **Step 2: Test It**
1. Go to `/inventory-management/manufacturing`
2. Click **"Scan with AI"** → Add items
3. Click **"Not Paid"** button
4. **Immediate email** sent ✅
5. **Recurring emails** scheduled every 5 days ✅

### **Step 3: Watch Console Logs**
You'll see messages like:
```
✅ Recurring reminder service initialized
📅 Schedule: Every 5 days at 9:00 AM (Asia/Kolkata)
🧪 Development: Also running every 2 minutes for testing
🔄 Processing recurring reminders...
📧 Found 1 due reminders
✅ Email sent to user@example.com
```

## 📧 Email Schedule

- **Immediate**: When you click "Not Paid"
- **Recurring**: Every 5 days at 9:00 AM
- **Development**: Every 2 minutes (for testing)
- **Auto-stop**: After 10 reminders or when paid

## 🛠️ Test Commands

```bash
# Test the system
npm run test:reminders

# Manual cron run
npm run cron:reminders
```

## 📁 Files Created

- `models/PurchaseReminder.js` - Database model
- `lib/recurring-reminders.js` - Main service
- `scripts/test-recurring-reminders.js` - Test script
- Updated `app/layout.tsx` - Auto-initializes service

## 🔧 How It Works

1. **User clicks "Not Paid"** → Immediate email + database record
2. **Every 5 days** → Service checks for due reminders
3. **Sends emails** → Updates schedule automatically
4. **User pays** → Reminders stop automatically

That's it! Your system is ready to use. 🎯
