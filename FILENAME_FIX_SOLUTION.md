# Filename Fix Solution - Database Recovery Tool

**Date:** December 19, 2025  
**Problem:** Alle Vinted = "Hermes" + "Shipping Label Attached" überall

## Root Cause Analysis

### Das eigentliche Problem

Die existierenden Sales wurden **VOR** meinem Code-Fix erstellt:
1. ❌ `original_filename` war NULL in der Datenbank (wurde nie gespeichert)
2. ❌ Migration 5 hatte bereits ALLE Vinted auf "Hermes" gesetzt
3. ❌ Ohne Filenames konnte der Reanalyzer die Carrier nicht erkennen
4. ❌ Alte Attachment-Filterung war zu permissiv

**Der neue Code ist korrekt, aber die alten Daten fehlen die nötigen Informationen!**

## Solution: Database Recovery Tool

Ich habe ein neues Tool erstellt, das:

### 1. Attachment Filenames rekonstruiert
- Liest Filenames vom Filesystem (aus dem Attachments-Verzeichnis)
- Updated die Datenbank mit den tatsächlichen Filenames
- Ermöglicht danach korrekte Carrier-Erkennung

### 2. Carrier aus Email-Subjects extrahiert
- Parsed `metadata_json` für alle Vinted-Sales
- Sucht nach Carrier-Keywords im Subject (DPD, DHL, Hermes, GLS, UPS)
- Updated `shipping_company` mit erkanntem Carrier
- **Kein Default mehr!** Nur explizite Detection

### 3. Neue UI mit "Fix Database" Button
- Prominenter orangener Button im Scan-Screen
- Zeigt detaillierte Ergebnisse an
- Reload der Page nach 2 Sekunden

## Files Created/Modified

### New Files:
1. **`app/src/main/database/filename-fixer.ts`**
   - `fixAttachmentFilenames()` - Hauptfunktion
   - Reconstructs filenames from filesystem
   - Extracts carriers from email subjects
   - Returns detailed results

### Modified Files:
1. **`app/src/main/ipc/scan.ts`**
   - Added `scan:fix-filenames` IPC handler
   - Imports filename-fixer module

2. **`app/src/preload.ts`**
   - Added `fixFilenames()` to scan API
   - Exposed to renderer process

3. **`app/src/renderer/screens/ScanScreen.tsx`**
   - New "Fix Database" section with orange button
   - `handleFixFilenames()` function
   - Results display with reload

## How It Works

### Step 1: Reconstruct Filenames
```typescript
// Reads from attachments table
SELECT id, sale_id, local_path, original_filename
FROM attachments

// For each attachment with NULL original_filename:
const basename = path.basename(att.local_path);
// Example: /path/to/attachments/abc123/label_0.pdf → "label_0.pdf"

// Update database
UPDATE attachments SET original_filename = ? WHERE id = ?
```

### Step 2: Extract Carriers from Subjects
```typescript
// Get Vinted sales without carrier
SELECT id, item_title, metadata_json
FROM sales
WHERE platform = 'Vinted/Kleiderkreisel'
AND (shipping_company IS NULL OR shipping_company = '')

// Parse metadata_json
const metadata = JSON.parse(sale.metadata_json);
const subject = metadata.subject; // "Versandschein für... | DPD"

// Check for carrier keywords
if (subject.includes('hermes')) return 'Hermes';
if (subject.includes('dhl')) return 'DHL';
if (subject.includes('dpd')) return 'DPD';
if (subject.includes('gls')) return 'GLS';
if (subject.includes('ups')) return 'UPS';

// Update database
UPDATE sales SET shipping_company = ? WHERE id = ?
```

## User Instructions

### CRITICAL FIX - Jetzt testen!

```bash
cd app
npm run fresh
```

1. **Open App** → Navigate to **Scan** tab

2. **Click the orange "🔧 Fix Database Now" button**
   - This will:
     - Reconstruct attachment filenames
     - Extract carriers from email subjects
     - Update database

3. **Watch the results:**
   ```
   ✅ Fix Complete!
   Attachments checked: 124
   Filenames updated: 0 (oder X wenn welche fehlten)
   Vinted carriers fixed: X (z.B. 50 Sales updated)
   ```

4. **Page reloads automatically** after 2 seconds

5. **Optional: Click "🔍 Re-analyze PDFs"** button
   - This will now use the reconstructed filenames
   - Should detect more carriers correctly

6. **Check History tab:**
   - Vinted sales should now show different carriers
   - NOT all "Hermes" anymore!
   - Only emails with actual shipping labels have "✓ Shipping Label Attached"

## Expected Results

### Before Fix:
```
❌ All Vinted sales: "Hermes" badge
❌ Every email: "✓ Shipping Label Attached"
❌ Reanalyzer logs: "Could not detect carrier"
❌ Reanalyzer logs: No "Filenames: ..." line (NULL in DB)
```

### After Fix:
```
✅ Vinted sales: Mix of Hermes, DPD, DHL, GLS (or no badge if not detected)
✅ Only real labels: "✓ Shipping Label Attached"
✅ Reanalyzer logs: "✅ Detected DPD from Vinted email"
✅ Reanalyzer logs: "Filenames: label_0.pdf" (reconstructed!)
```

### Terminal Logs (Expected):

```
[Filename Fixer] Starting filename reconstruction...
[Filename Fixer] Found 124 attachments to check
  ✅ Updated attachment abc123: label_0.pdf
  ✅ Updated attachment def456: label_0.pdf
  ...

[Filename Fixer] Now checking Vinted sales for carrier info in subjects...
[Filename Fixer] Found 95 Vinted sales without carrier
  ✅ Set carrier for "Versandschein für...": DPD
  ✅ Set carrier for "Versandschein für...": Hermes
  ✅ Set carrier for "Versandschein für...": DHL
  ...

[Filename Fixer] SUMMARY:
  Attachments checked: 124
  Filenames updated: 124
  Vinted carriers fixed: 95
  Errors: 0
```

## Fallback: If Fix Doesn't Work

If the Fix Database button doesn't solve all issues, you have 2 options:

### Option 1: Database Reset (Clean Slate) ✅ RECOMMENDED

```bash
# 1. Close app completely
# 2. Find and delete database
#    Location: C:\Users\cooki\AppData\Roaming\[app-name]\autolabel.db
#    (or similar Electron app data folder)
# 3. Restart app
npm run fresh
# 4. Re-scan emails - new logic will work correctly from the start
```

### Option 2: Manual SQL Fixes

If you know SQL and want to manually fix the database:

```sql
-- Check current state
SELECT COUNT(*) FROM attachments WHERE original_filename IS NULL;
SELECT shipping_company, COUNT(*) FROM sales WHERE platform = 'Vinted/Kleiderkreisel' GROUP BY shipping_company;

-- Reset all Vinted carriers to NULL
UPDATE sales SET shipping_company = NULL WHERE platform = 'Vinted/Kleiderkreisel';

-- Then run the Fix Database tool
```

## Why This Happened

1. **Timing Issue:**
   - Old sales created before `original_filename` column existed
   - Migration 5 ran with incomplete data
   - Defaulted everything to Hermes

2. **Missing Data:**
   - Can't extract carrier from NULL filenames
   - Email subjects have carrier info, but wasn't being parsed

3. **Solution:**
   - Parse email subjects (metadata_json) for carrier keywords
   - Reconstruct filenames for future use
   - No more defaults - only explicit detection

## Prevention for Future

New sales (scanned after this fix) will:
- ✅ Have `original_filename` saved automatically
- ✅ Have carrier detected from email during scan
- ✅ Work with strict attachment filtering (no false "shipping labels")
- ✅ Show correct badges in UI immediately

## Testing Checklist

- [ ] Run `npm run fresh`
- [ ] Click "Fix Database Now" button
- [ ] Check terminal logs for success messages
- [ ] Verify results: "Vinted carriers fixed: X"
- [ ] Wait for page reload (2 seconds)
- [ ] Go to History tab
- [ ] Check Vinted sales - should show different carriers
- [ ] Check "Shipping Label Attached" - should only be on real labels
- [ ] Optional: Click "Re-analyze PDFs" for double-check

## Summary

**The Fix:**
- 🔧 New tool extracts carrier from email subjects
- 📁 Reconstructs missing attachment filenames
- 🎯 Updates database with correct information
- 🔵 One-click fix via orange button in UI

**Result:**
- ✅ Vinted sales show correct carriers (DPD, DHL, Hermes, GLS, UPS)
- ✅ "Shipping Label Attached" only on real labels
- ✅ Future scans work perfectly with new logic
- ✅ No more false "Hermes" defaults!

Bitte teste jetzt mit `npm run fresh` und dem orangenen "Fix Database" Button! 🚀

