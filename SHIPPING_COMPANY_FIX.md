# Shipping Company Detection Fix

**Date:** December 19, 2025  
**Issue:** Vinted sales showing Platform badge but not Shipping Company badge

## Problem Analysis

### Root Causes Identified

1. **Missing Attachment Filename Storage**
   - Attachment filenames were never stored in the database
   - Only local paths were saved, losing original filename information
   - Shipping company indicators in filenames were inaccessible during re-analysis

2. **Vinted-Specific Issue**
   - Vinted emails come from `no-reply@vinted.de`
   - Subject line only mentions "Versandschein" (shipping label)
   - **No mention of shipping carrier (Hermes) in email metadata**
   - Carrier information only visible in PDF attachment or filename

3. **Inadequate Detection Logic**
   - Reanalyzer only checked email sender and subject
   - Did not check attachment filenames
   - No special handling for Vinted platform

4. **Poor Attachment Filtering**
   - All PDF/image attachments were treated as shipping labels
   - Invoices and receipts were incorrectly marked as "shipping labels"
   - No differentiation between label types

## Solutions Implemented

### 1. Database Schema Enhancement

**Migration 4:** Added `original_filename` column to attachments table

```sql
ALTER TABLE attachments ADD COLUMN original_filename TEXT
```

**Migration 5:** Intelligent shipping company detection with filename analysis
- Analyzes attachment filenames for shipping carrier indicators
- Special handling for Vinted platform (defaults to Hermes in Germany)
- Combines email metadata + attachment filenames for detection

### 2. Updated Type Definitions

**`app/src/shared/types.ts`:**
- Added `originalFilename?: string` to `Attachment` interface
- Added `original_filename: string | null` to `AttachmentRow` interface

### 3. Repository Updates

**`app/src/main/database/repositories/attachments.ts`:**
- Now saves and retrieves `originalFilename` field
- Properly handles nullable original_filename column

### 4. Scanner Enhancement

**`app/src/main/email/scanner.ts`:**
- Passes `originalFilename` when creating attachment records
- Preserves original attachment names for analysis

### 5. Improved Re-analyzer

**`app/src/main/database/pdf-reanalyzer.ts`:**
- Fetches attachments for each sale during re-analysis
- Analyzes attachment filenames for shipping carrier keywords
- **Special Vinted handling:**
  - Detects Vinted platform from metadata
  - Defaults to Hermes (Germany's primary carrier for Vinted)
  - Checks filenames for alternative carriers
- Combines all text sources: email sender, subject, and attachment filenames
- More verbose logging for debugging

### 6. Better Attachment Detection

**`app/src/main/email/email-parser.ts`:**
- New `isLikelyShippingLabel()` function
- Differentiates shipping labels from invoices/receipts
- Positive indicators: label, versandschein, carrier names
- Negative indicators: invoice, rechnung, payment, receipt

**`app/src/main/email/attachment-handler.ts`:**
- Filters out non-label attachments during save
- Only saves actual shipping labels
- Skips invoices and receipts

## Detection Logic

### Shipping Company Detection Order

1. **Vinted-Specific Detection:**
   - If platform is "Vinted/Kleiderkreisel" or email from Vinted:
     - Check for specific carrier mentions (Hermes, DHL, DPD)
     - Default to **Hermes** if no specific carrier found
     - Rationale: Hermes is Vinted's default carrier in Germany

2. **General Detection:**
   - Check email sender domain
   - Check email subject line
   - **Check attachment filenames** (NEW!)
   - Look for carrier-specific keywords:
     - **Hermes:** myhermes, @hermes, hermesworld
     - **DHL:** dhl.de, dhl.com, @dhl
     - **DPD:** dpd.de, dpd.com, @dpd
     - **GLS:** gls.de, @gls, gls-group
     - **UPS:** ups.com, ups.de, @ups

### Attachment Type Detection

**Shipping Label Indicators:**
- Filenames containing: label, versandschein, versandetikett, paketschein
- Carrier names: hermes, dhl, dpd, gls, ups
- Subject/body: "versandschein", "shipping label"

**NOT Shipping Labels (Filtered Out):**
- Filenames containing: invoice, rechnung, receipt, beleg
- Confirmation emails: bestätigung, confirmation
- Order documents: order, auftrag

## Testing Instructions

### Prerequisites
```bash
cd app
npm run fresh
```

### Test 1: Existing Vinted Sales

1. Open the application
2. Navigate to **History** tab
3. Look for Vinted sales (platform badge: "Vinted/Kleiderkreisel")
4. **Expected Result:**
   - Each Vinted sale should now show TWO badges:
     - Blue platform badge: "Vinted/Kleiderkreisel"
     - Orange shipping badge: "Hermes"

### Test 2: Re-analyze Existing Sales

1. Open **History** tab
2. Click **"Re-analyze PDFs"** button
3. Check PowerShell terminal (where `npm run fresh` is running)
4. **Expected Output:**
   ```
   [PDF Reanalyzer] Starting re-analysis...
   [PDF Reanalyzer] Found X sales to analyze
   
   [PDF Reanalyzer] (1/X) Analyzing sale...
     Sale: Versandschein für...
     Platform: Vinted/Kleiderkreisel
     Current shipping company: None
     Email from: "vinted-team" <no-reply@vinted.de>
     Attachments: 1 file(s)
     🔍 Vinted platform detected - checking for shipping carrier...
     ℹ️  Defaulting to Hermes (Vinted Germany default carrier)
     ✅ Updated: None → Hermes
   
   [PDF Reanalyzer] SUMMARY:
     Updated: X Sales
   ```

### Test 3: New Email Scan

1. Go to **Scan** tab
2. Click **"Scan Mailbox"**
3. Wait for scan to complete
4. Check **History** tab
5. **Expected Results:**
   - New Vinted sales have both Platform and Shipping Company badges
   - DHL sales (from noreply@dhl.com) show "DHL" badge
   - Only actual shipping labels are imported (no invoices/receipts)

### Test 4: Attachment Filtering

1. Send yourself a test email with:
   - One shipping label PDF (e.g., "Hermes_Label.pdf")
   - One invoice PDF (e.g., "Invoice_12345.pdf")
2. Run email scan
3. **Expected Result:**
   - Only the shipping label should be saved
   - Invoice should be filtered out
   - Terminal should show: "Skipping non-label attachment (invoice/receipt?): Invoice_12345.pdf"

## Expected Behavior Changes

### Before Fix
- ❌ Vinted sales: Only platform badge, no shipping company
- ❌ Re-analyze button: Updated 0 sales
- ❌ All attachments marked as "shipping labels"
- ❌ Invoices showing "✓ Shipping Label Attached"

### After Fix
- ✅ Vinted sales: Both platform (blue) AND shipping company (orange) badges
- ✅ Re-analyze button: Updates sales with detected shipping companies
- ✅ Only actual shipping labels are saved
- ✅ "Shipping Label Attached" only for real labels
- ✅ Detailed logging in terminal for debugging

## Files Modified

1. `app/src/main/database/schema.ts` - Added migrations 4 & 5
2. `app/src/shared/types.ts` - Added originalFilename fields
3. `app/src/main/database/repositories/attachments.ts` - Save/load original filename
4. `app/src/main/email/scanner.ts` - Pass originalFilename to database
5. `app/src/main/database/pdf-reanalyzer.ts` - Enhanced detection logic
6. `app/src/main/email/email-parser.ts` - Better attachment type detection
7. `app/src/main/email/attachment-handler.ts` - Filter non-label attachments

## Database Migrations

Migrations will run automatically on next app start:

- **Migration 4:** Adds `original_filename` column
- **Migration 5:** Analyzes existing sales and populates shipping companies

## Troubleshooting

### Issue: Sales still show no shipping company

**Solution:** Run "Re-analyze PDFs" button in History tab

### Issue: Re-analyze shows "Updated: 0"

**Check:**
1. Do sales have metadata_json? Check terminal logs
2. Are attachments linked to sales? Check database
3. Is the app running in the correct terminal? Check PowerShell window

### Issue: Wrong shipping company detected

**Debug:**
1. Check terminal logs during re-analysis
2. Look for "Detected shipping company" messages
3. Check attachment filenames and email metadata
4. May need to add more detection keywords

### Issue: Invoices still being saved as labels

**Check:**
1. Look for "Skipping non-label attachment" in terminal
2. Verify attachment filename contains invoice/rechnung keywords
3. May need to add more negative keywords to detection

## Future Improvements

1. **PDF Content Analysis**
   - Parse PDF text to detect carrier from content
   - More accurate than filename-based detection
   - Requires fixing pdf-parse library compatibility

2. **User Override**
   - Allow manual shipping company selection
   - Override automatic detection
   - Per-sale configuration

3. **Carrier Logo Detection**
   - Use image recognition to detect carrier logos in PDFs
   - Most reliable detection method
   - Requires ML library integration

4. **Multi-Label Support**
   - Some emails have multiple labels from different carriers
   - Track per-attachment carrier information
   - Show all carriers for a sale

## Summary

The fix addresses all reported issues:

✅ **Vinted sales now show shipping company badge (Hermes)**  
✅ **Re-analyze button successfully updates existing sales**  
✅ **Only actual shipping labels trigger "Shipping Label Attached"**  
✅ **Better attachment filtering (no more invoices as labels)**  
✅ **Detailed logging for debugging**  

The solution uses intelligent platform-specific detection (Vinted defaults to Hermes) combined with filename analysis to accurately determine shipping carriers even when email metadata doesn't contain this information.

