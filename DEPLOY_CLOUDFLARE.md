# Cloudflare Free Tier & D1 Database Deployment Guide

This guide walks you through deploying **E-GYM** to **Cloudflare Pages** with a serverless **Cloudflare D1 SQL Database**—100% free and globally scalable.

---

## ⚡ Cloudflare Free Tier Capacity

| Resource | Free Tier Allowance |
| :--- | :--- |
| **Cloudflare Pages** | **Unlimited** bandwidth, **unlimited** requests, global edge CDN, free SSL |
| **Cloudflare D1 SQL** | **5 Million** reads/day, **100,000** writes/day, **5 GB** storage |
| **Pages Functions (API)** | **100,000** requests/day |

---

## 🚀 Deployment (Method 1: Direct in Browser - 3 Minutes)

### Step 1: Create your Cloudflare Pages Project
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) (create a free account if you don't have one).
2. On the left menu, select **Compute (Workers) > Workers & Pages**.
3. Click **Create application** > select **Pages** tab > click **Upload assets**.
4. Set **Project name** to `egym-platform`.
5. Drag and drop your `egym-app` folder directly into the upload area.
6. Click **Deploy site**. Your app is now live with an `https://egym-platform.pages.dev` URL!

---

### Step 2: Create the Free Cloudflare D1 Database
1. In the Cloudflare dashboard left menu, click **Storage & Databases > D1 SQL Database**.
2. Click **Create database** > name it `egym-db` > click **Create**.
3. Click into `egym-db` and select the **Console** tab.
4. Copy and paste the contents of `schema.sql` into the SQL editor and click **Execute**.

---

### Step 3: Link the D1 Database to Your Pages Project
1. Go back to **Workers & Pages** > click on your **`egym-platform`** project.
2. Select **Settings** > **Functions**.
3. Scroll down to **D1 Database Bindings** and click **Add binding**.
4. Fill in:
   - **Variable name**: `DB` *(must be exact uppercase `DB`)*
   - **D1 database**: select `egym-db`
5. Click **Save**.
6. Trigger a new deployment (or go to Deployments > click **Retry deployment**) to activate the binding.

---

## 🔄 Method 2: Deploy via GitHub (Continuous Deployment)

If you prefer auto-deploying whenever you make code changes:

1. Create a new repository on [GitHub](https://github.com/new) called `egym-platform`.
2. In your terminal inside `egym-app`:
   ```powershell
   git remote add origin https://github.com/<your-username>/egym-platform.git
   git branch -M main
   git push -u origin main
   ```
3. In Cloudflare Dashboard, go to **Workers & Pages > Create application > Pages > Connect to Git**.
4. Select `egym-platform`:
   - **Build command**: *(leave empty)*
   - **Build output directory**: `.`
5. Click **Save and Deploy**.
6. Follow Step 3 above to bind your D1 database `DB`.

---

## 🧹 Everything is Reset & Cleaned

- **State Reset**: All demo check-ins, habits, and placeholder data have been wiped to a clean slate.
- **Baseline Candidate**: New accounts start at Day 1 with 0 completed tasks and balanced 50% radar baseline.
- **D1 Edge Sync**: The app now automatically syncs with Cloudflare D1 when online and caches locally when offline.
