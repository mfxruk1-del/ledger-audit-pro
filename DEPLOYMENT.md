# Deployment Guide - Ledger Audit Pro (GitHub + Vercel Auto-Deploy)

## Step 1: Install Git

### Windows:
```bash
# Download from: https://git-scm.com/download/win
# Run installer with defaults
# Restart command prompt/terminal
```

### macOS:
```bash
# Install Homebrew if not already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git

# Verify installation
git --version
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install git

# Verify installation
git --version
```

---

## Step 2: Install Vercel CLI (Already Done on Dev Server)

### On Your Machine:
```bash
npm install -g vercel
# OR
bun install -g vercel
```

---

## Step 3: Create GitHub Repository

### Option A: Create on GitHub.com (Recommended)

1. Go to [github.com](https://github.com) and sign up/login
2. Click **"+"** button (top-right corner)
3. Select **"New repository"**
4. Enter repository name: `ledger-audit-pro`
5. Choose **"Public"** (recommended for free hosting)
6. Click **"Create repository"**
7. Copy repository URL: `https://github.com/YOUR_USERNAME/ledger-audit-pro.git`

### Option B: GitHub CLI (If Available)

```bash
# Install GitHub CLI
brew install gh  # Mac
# OR
npm install -g gh  # Any OS

# Login
gh auth login

# Create repository
gh repo create ledger-audit-pro --public
```

---

## Step 4: Initialize Git and Push to GitHub

```bash
# Navigate to project
cd /home/z/my-project

# Initialize Git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit - Ledger Audit Pro with Supabase"

# Add GitHub remote (replace with YOUR username)
git remote add origin https://github.com/YOUR_USERNAME/ledger-audit-pro.git

# Push to GitHub
git push -u origin main
```

---

## Step 5: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** or **"New Project"**
3. Select **"Import Git Repository"**
4. Select GitHub
5. Choose `ledger-audit-pro` repository
6. Click **"Import"**

**Vercel will:**
- Detect Next.js project
- Configure build settings automatically
- Deploy your app
- Give you URL: `https://ledger-audit-pro.vercel.app` (or similar)

---

## Step 6: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://cshjqxethbobrvxgjzsf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaGpxeGV0aGJvYnJ2eGdqenNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDU5ODIsImV4cCI6MjA4MjUyMTk4Mn0.C8NSfvkHZpijryzIwFgAk1ewzgK_CI03VXXtIs8ayD4
```

4. Click **"Save"**
5. Redeploy (automatic or manual button)

---

## Complete Workflow: Continuous Deployment

### Making Changes (After Initial Setup):

```bash
# 1. Make changes to code
# (Edit files in /home/z/my-project/src/)

# 2. Stage and commit changes
git add .
git commit -m "Add new feature: [description]"

# 3. Push to GitHub
git push

# 4. Vercel auto-deploys!
# (Within 30-60 seconds, changes live)
```

### Example: Adding a Feature

```
You: "I want to add a dark mode feature"
   ↓
I: [Modifies code, adds dark mode toggle]
   ↓
You: [Tests on localhost:3000]
   ↓
You: [Commits and pushes]
   ↓
Vercel: [Auto-detects push, redeploys]
   ↓
You: [Tests on vercel.app]
Result: "Dark mode is live! ✅"
```

---

## Branching Strategy (For Development)

### Main Branch (Production):
```bash
# Always deploy main branch
git push origin main

# Vercel auto-deploys main
```

### Feature Branches (Optional - For Testing):
```bash
# Create feature branch
git checkout -b feature/new-thing

# Make changes
# ... coding ...

# Commit and push
git add .
git commit -m "Add new thing"
git push -u origin feature/new-thing

# Merge to main
git checkout main
git merge feature/new-thing
git push origin main

# Vercel deploys main automatically
```

---

## Directory Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   └── page.tsx          ← Main app component
│   ├── components/
│   │   ├── auth/             ← Login/Signup
│   │   └── ui/              ← shadcn components
│   └── lib/
│       ├── supabase.ts        ← Supabase client
│       └── supabase-db.ts     ← Database functions
├── db/
│   └── supabase/
│       └── schema.sql          ← Database schema
├── package.json
├── tsconfig.json
└── DEPLOYMENT.md              ← This file
```

---

## Summary: What You'll Have After Setup

| Component | URL/Location | Purpose |
|---|---|---|
| **Development Server** | http://localhost:3000 | Local testing |
| **GitHub Repository** | https://github.com/YOUR_USER/ledger-audit-pro | Code storage + version control |
| **Vercel Production** | https://ledger-audit-pro.vercel.app | Public access (any device) |
| **Supabase Database** | https://cshjqxethbobrvxgjzsf.supabase.co | Data + auth |

---

## Workflow Diagram

```
Code Changes
    ↓
Commit to Git
    ↓
Push to GitHub
    ↓
Vercel Auto-Detects
    ↓
Auto-Build & Deploy
    ↓
Live on vercel.app
    ↓
All devices see changes!
    ↓
Connected to same Supabase DB → Data syncs
```

---

## Troubleshooting

### Git Push Fails:
```bash
# Authentication required
git config --global credential.helper store
git push
# Enter GitHub username and token
```

### Vercel Not Auto-Deploying:
- Check repository is connected to correct Vercel project
- Go to Vercel project → Git → Verify repository is linked
- Trigger manual deploy from Vercel dashboard

### Environment Variables Not Working:
- Must start with `NEXT_PUBLIC_` (accessible to client)
- After adding vars, trigger redeploy from Vercel dashboard
- Wait 2-3 minutes for redeploy to complete

### Build Fails:
- Check for TypeScript errors: `bun run lint`
- Ensure all dependencies installed: `bun install`
- Check Supabase credentials are correct in `.env.local`

---

## Quick Reference Commands

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b branch-name

# Merge branch
git merge branch-name

# Push to specific remote
git push origin main
```

---

## Benefits of This Setup

1. ✅ **Version Control** - All changes tracked in Git
2. ✅ **Backup** - Your code is safe on GitHub
3. ✅ **Collaboration** - Multiple people can contribute
4. ✅ **Auto-Deploy** - Push to GitHub = Auto deploy to Vercel
5. ✅ **Rollback** - Easy to revert to previous versions
6. ✅ **Multi-Device** - All devices access same Vercel URL + Supabase DB
7. ✅ **Continuous Updates** - Fast iteration workflow

---

## Setup Checklist

- [ ] Install Git on your machine
- [ ] Create GitHub repository
- [ ] Initialize Git in project folder
- [ ] Make initial commit
- [ ] Push to GitHub
- [ ] Import to Vercel
- [ ] Set environment variables in Vercel
- [ ] Test deployment on vercel.app
- [ ] Test on multiple devices
- [ ] Verify Supabase connection

---

**Follow these steps and you'll have a perfect continuous deployment setup!** 🚀
