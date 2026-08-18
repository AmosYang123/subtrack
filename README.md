# SubTrack — Subscription Manager & Spending Tracker

A local-first, privacy-respecting subscription tracking application with real-world catalog pricing, live foreign exchange rates, bank statement CSV import, and receipt parsing.

---

## Features

- **Local-First & Private:** All subscription data, payment cards, and uploaded statements remain 100% on your device in browser storage.
- **Live Currency Rates:** Real-time exchange rate engine dynamically converts multi-currency subscriptions (USD, EUR, GBP, CAD, AUD, JPY, INR, SGD, etc.) into your active display currency.
- **50+ Real Service Catalog:** Pre-configured with verified 2025/2026 pricing tiers, cancellation links, and official brand colors for major AI, Streaming, Cloud, Dev, Design, and Productivity tools.
- **Bank Statement CSV Parser:** Directly upload CSV statement exports from Chase, Amex, Bank of America, Apple Card, Revolut, Monzo, PayPal, or Stripe to automatically detect recurring subscriptions.
- **Receipt & Email Parser:** Paste raw confirmation email text or upload `.eml` files from Apple, Stripe, Google Play, Amazon, and GitHub to parse and import charges with 1 click.
- **Curated Profiles:** 1-click starter datasets for Tech & AI Engineers, Content Creators & Nomads, Household & Family, and Modern Minimalists.
- **Analytics & Forecasting:** 12-month renewal projections, category breakdowns, and renewal urgency alerts.
- **Full Backup & Restore:** Export and import JSON backups or CSV spreadsheets anytime.

---

## Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local dev server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deploying to Production (Web)

### Option 1: Deploy to Vercel (Recommended)
1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Keep default settings (Vite / `npm run build` / `dist`) and click **Deploy**.
   *(The included `vercel.json` automatically handles SPA routing).*

### Option 2: Deploy to Netlify
1. Connect your repository at [app.netlify.com](https://app.netlify.com).
2. The included `netlify.toml` automatically configures the build command and redirects.

### Option 3: Deploy to GitHub Pages
1. In `vite.config.ts`, set `base: '/<repo-name>/'`.
2. Run `npm run build` and publish the `dist` folder to your `gh-pages` branch.
