# 🚀 How to Start AutoLabel (Always Get Latest Version)

## The Problem
Electron apps cache builds in the `.vite` folder. When you make changes, the old version (5173) keeps running instead of the new version (5174+).

## ✅ The Solution - 3 Easy Ways to Start Fresh

### Option 1: PowerShell Script (Recommended for Windows)
```powershell
.\start-fresh.ps1
```

### Option 2: Batch Script
```cmd
start-fresh.bat
```

### Option 3: NPM Command
```bash
npm run fresh
```

## What These Do
All three methods:
1. Delete the `.vite` cache folder
2. Delete the `out` folder (if it exists)
3. Start the app with a completely fresh build

## Regular Start (May Use Cache)
If you haven't made changes and just want to start quickly:
```bash
npm start
```

## Manual Cleaning
If you just want to clean the cache without starting:
```bash
npm run clean
```

---

**⚠️ Important:** Always use one of the "fresh start" methods after making code changes to ensure you see the latest version!

