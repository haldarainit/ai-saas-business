# Quick Start: Adding Tracked Buttons to Your Emails

## 📝 Step-by-Step Visual Guide

### Step 1: Open the Email Editor

Navigate to **Get Started → Email Automation** (`/get-started/email-automation`)

### Step 2: Locate the CTA Button in Toolbar

Look for the toolbar above the email content editor. You'll see:

```
[B] [I] [U] | [Vars] [AI] | [←] [↔] [→] | [🖼] [🔗] [👆 CTA]
```

The **[👆 CTA]** button (blue with mouse pointer icon) is your tracked button tool.

### Step 3: Click CTA Button

A dialog will open with the title **"Insert Tracked CTA Button"**

### Step 4: Configure Your Button

#### Enter Button Text

```
Example: "Get Started"
```

#### Enter Destination URL

```
Example: https://yourwebsite.com/signup
```

#### Choose Button Style

Click on one of 5 color swatches:

- **Purple** = Primary (professional, default)
- **Green** = Success (positive actions)
- **Red** = Danger/Urgent (limited offers)
- **Orange** = Warning (attention-grabbing)
- **Gray** = Dark (sophisticated)

#### See Live Preview

The dialog shows a live preview of your button with the exact styling it will have in emails.

### Step 5: Insert the Button

Click the **"Insert Button"** button at the bottom of the dialog.

Your button is now inserted in the email! 🎉

### Step 6: Add More Buttons (Optional)

Repeat steps 2-5 to add additional buttons anywhere in your email.

### Step 7: Send Your Campaign

Click **"Start Campaign"** to send your emails.

All buttons will automatically track clicks! 📊

---

## 💡 Example Email Template with Multiple Buttons

```
Subject: Welcome to Our Platform! 🚀

Hi {{name}},

Thank you for joining us! We're excited to have you on board.

[Green Button: "Complete Your Profile"]

Explore our features:
- Feature 1: Amazing analytics
- Feature 2: Easy integration
- Feature 3: 24/7 support

[Purple Button: "View Dashboard"]

Need help getting started?
[Orange Button: "Watch Tutorial"]

Best regards,
The Team

[Gray Button: "Contact Support"]
```

---

## 🎯 Common Button Use Cases

| Button Text      | URL        | Style   | Use Case      |
| ---------------- | ---------- | ------- | ------------- |
| "Shop Now"       | /products  | Primary | E-commerce    |
| "Get 20% Off"    | /promo     | Warning | Limited offer |
| "Sign Up Free"   | /register  | Success | Registration  |
| "Learn More"     | /about     | Primary | Information   |
| "Download Guide" | /guide.pdf | Dark    | Resource      |
| "Book Now"       | /booking   | Danger  | Urgency       |
| "Join Webinar"   | /webinar   | Success | Events        |
| "Watch Demo"     | /demo      | Primary | Product demo  |
| "Claim Offer"    | /offer     | Warning | Promotion     |
| "Contact Us"     | /contact   | Dark    | Support       |

---

## 🔍 Viewing Click Data

After sending your campaign:

1. Navigate to **Email Analytics** (`/email-analytics`)
2. See overall click rate
3. View individual email click counts
4. Export detailed click data to CSV
5. Check console logs for real-time tracking

### Console Output Example:

```
🔗 [TRACKING] Click tracked for ID: abc123 URL: https://yoursite.com/signup
✅ [TRACKING] Recording click for: user@example.com
🔗 [TRACKING] Destination URL: https://yoursite.com/signup
✅ [TRACKING] Click recorded! Total clicks: 1
📡 [WEBHOOK] Email click webhook sent: ✅ Success
🔄 [TRACKING] Redirecting to: https://yoursite.com/signup
```

---

## ✅ Checklist Before Sending

- [ ] Button text is clear and action-oriented
- [ ] URL is complete and starts with https://
- [ ] Button style matches the action (green = positive, red = urgent, etc.)
- [ ] Tested button by sending to yourself first
- [ ] Clicked button in test email to verify tracking works
- [ ] Checked analytics dashboard shows the click

---

## 🎨 Button Preview

Your buttons will look like this in emails:

**Primary (Purple):**

```
╔══════════════════════╗
║   Get Started Now    ║  ← Beautiful gradient
╚══════════════════════╝
```

**Success (Green):**

```
╔══════════════════════╗
║    Complete Setup    ║  ← Encouraging action
╚══════════════════════╝
```

**Warning (Orange):**

```
╔══════════════════════╗
║   Limited Time!      ║  ← Urgent attention
╚══════════════════════╝
```

All buttons have:

- ✅ Gradient backgrounds
- ✅ Box shadows for depth
- ✅ Rounded corners (8px)
- ✅ Bold text
- ✅ Centered alignment
- ✅ Professional spacing

---

## 🚀 You're Ready!

Start adding tracked buttons to your email campaigns and watch the engagement soar! 📈

**Questions?** Check the full documentation in [TRACKED_BUTTON_FEATURE.md](./TRACKED_BUTTON_FEATURE.md)
