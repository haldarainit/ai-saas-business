# 🚀 Quick Start: Web Scraper Feature

## What's New?

Your Marketing Campaign Planner AI can now **scrape and analyze competitor websites** to generate smarter campaign strategies!

## How to Use (3 Simple Steps)

### 1️⃣ Enter Your Campaign Goal

Navigate to **Marketing AI → Campaign Planner** and describe what you want:

```
Example: "Create a marketing campaign for a new SaaS project management tool"
```

### 2️⃣ Add Competitor URLs (Optional)

Click **"Add URL"** and paste competitor landing pages:

```
✓ https://asana.com
✓ https://trello.com
✓ https://monday.com
```

### 3️⃣ Generate Strategies

Click **"Unlock Campaign Genius"** and watch the magic happen:

- 🌐 AI scrapes your competitor sites
- 🧠 Analyzes their marketing strategies
- 💡 Generates 4-6 informed campaign strategies
- 🎯 Incorporates competitive intelligence

## What Gets Scraped?

From each URL, the AI extracts:

- ✅ Page title & description
- ✅ Main headings (H1, H2, H3)
- ✅ Key marketing messages
- ✅ Value propositions
- ✅ Target audience indicators
- ✅ Marketing approaches used

Then generates an **AI-powered summary** analyzing:

1. Business overview
2. Target audience
3. Value proposition
4. Marketing strategy
5. Competitive insights

## Example Results

**Input:**

```
Prompt: "Launch a payment processing solution"
URLs: ["https://stripe.com"]
```

**Output:**
You'll get 4-6 strategies like:

- 🎯 **Social Media Engagement Blitz** - Community-driven approach
- 📢 **Precision-Targeted Ad Campaign** - Data-driven paid ads
- 📧 **Email Nurture Sequence** - Personalized automation
- 📝 **Content-Powered SEO Strategy** - Organic authority building

Each strategy informed by what Stripe is doing!

## Pro Tips

### Best URLs to Add:

✓ Direct competitor landing pages
✓ Industry leader homepages
✓ Successful companies in your space
✓ Different marketing approaches (B2B, B2C)

### How Many URLs?

- **Minimum**: 0 (works without URLs)
- **Sweet Spot**: 2-3 URLs
- **Maximum**: 5 URLs (more = slower)

### What Works Best:

✓ Public landing pages
✓ Marketing-focused pages
✓ Product homepages
✓ About/features pages

### What Doesn't Work:

✗ Login-required pages
✗ Heavy JavaScript apps (limited)
✗ Bot-protected sites
✗ Rate-limited endpoints

## Setup (First Time Only)

1. **Add to `.env.local`** (if not already set):

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
GOOGLE_API_KEY=your-gemini-api-key
```

2. **Start dev server**:

```bash
npm run dev
```

3. **Test it** (optional):

```bash
node test-scraper.js
```

## Troubleshooting

### URL Not Working?

- ✓ Check it loads in your browser
- ✓ Try with/without "www"
- ✓ Make sure it's a public page
- ✓ Some sites block scrapers

### Slow Generation?

- ✓ Reduce number of URLs
- ✓ Each URL adds ~5-10 seconds
- ✓ Complex sites take longer

### No AI Summary?

- ✓ Check `GOOGLE_API_KEY` is set
- ✓ Raw data still gets scraped
- ✓ Strategies still generate

## Need More Help?

📖 **Full Documentation**: See `WEB_SCRAPER_GUIDE.md`
📝 **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
🧪 **Test Script**: Run `test-scraper.js`

## That's It! 🎉

Start using competitor intelligence to create better marketing campaigns!

---

**Questions?** Check the full documentation or review the code in:

- `/app/api/scrape-website/route.js`
- `/app/api/generate-strategies/route.js`
