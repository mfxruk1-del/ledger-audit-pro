# Setup Environment Variables on Vercel - URGENT

## 🚨 Your App is Live But Needs Configuration

**Your app is deployed at:**
https://ledger-audit-got8yda75-mfxruks-projects.vercel.app

**But it won't work until you add environment variables!**

---

## Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Find your project: `ledger-audit-pro`
3. Click on the project

---

## Step 2: Add Environment Variables

1. Click **"Settings"** tab in the left sidebar
2. Click **"Environment Variables"**
3. Click **"Add New"**

## Step 3: Add Both Variables (REQUIRED!)

### Variable 1: NEXT_PUBLIC_SUPABASE_URL

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://cshjqxethbobrvxgjzsf.supabase.co
Environment: Production, Preview, Development (All three)
```

Then click **"Add"**

---

### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaGpxeGV0aGJvYnJ2eGdqenNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDU5ODIsImV4cCI6MjA4MjUyMTk4Mn0.C8NSfvkHZpijryzIwFgAk1ewzgK_CI03VXXtIs8ayD4
Environment: Production, Preview, Development (All three)
```

Then click **"Add"**

---

## Step 4: Save and Redeploy

After adding both variables:
1. Click **"Save"** at the bottom of the page
2. Go to **"Deployments"** tab
3. Click the three dots (⋮) on the latest deployment
4. Click **"Redeploy"**
5. Wait 30-60 seconds

---

## Step 5: Test Your Live App!

1. Go to: https://ledger-audit-got8yda75-mfxruks-projects.vercel.app
2. You should see **Login/Signup** form
3. Click **"Sign Up"**
4. Enter email and password
5. Create your first ledger
6. Add some entries

**Everything should work now!** ✅

---

## 🔍 If You Still See Errors

If after redeploy you still see errors, check:

### Check 1: Verify Variables Are Set
1. Go back to Environment Variables in Vercel
2. Make sure BOTH variables are there
3. Make sure Environment is set for all three (Production, Preview, Development)

### Check 2: Variable Names Match Exactly

Make sure the names are EXACTLY:
```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

NOT:
```
✗ SUPABASE_URL (missing NEXT_PUBLIC_)
✗ NEXT_PUBLIC_SUPABASE_ANONKEY (missing underscore)
✗ Supabase_URL (wrong capitalization)
```

### Check 3: Values Are Correct

URL should be exactly:
```
https://cshjqxethbobrvxgjzsf.supabase.co
```

Key should be the full string starting with:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaGpxeGV0aGJvYnJ2eGdqenNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDU5ODIsImV4cCI6MjA4MjUyMTk4Mn0...
```

---

## ✅ What Happens After Configuration

| Component | Status | How It Works |
|---|---|---|
| **Frontend (Vercel)** | ✅ Live | Your public URL |
| **Database (Supabase)** | ✅ Ready | Environment vars connect them |
| **App** | ✅ Working | Login, create ledgers, sync across devices! |

---

## 📱 Testing Checklist

After redeploy, test these:

- [ ] App loads without errors
- [ ] You see Login/Signup form
- [ ] Can create new account
- [ ] Can sign in with email/password
- [ ] Can create ledgers
- [ ] Can add entries
- [ ] Test on multiple devices (iPhone + iPad or Mac)

---

## 🎯 Quick Start

1. Go to: https://ledger-audit-got8yda75-mfxruks-projects.vercel.app
2. Sign up with your email
3. Create a ledger
4. Add entries
5. Open same URL on another device
6. Login with same credentials
7. See your data sync across devices! 🎉

---

**Your app is LIVE! Just add the environment variables and it's fully functional!** 🚀
