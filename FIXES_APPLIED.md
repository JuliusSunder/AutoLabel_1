# Fixes Applied - December 18, 2025

## Issues Identified and Fixed

### 1. ✅ Shipping Company Not Displayed
**Problem:** The `shipping_company` column was missing from the database schema.

**Fix:**
- Added migration to create `shipping_company` column in the sales table
- Added data migration to populate shipping company from existing email metadata
- Improved shipping company detection logic (prioritized "myHermes" detection)
- Added logging to track shipping company detection

**Files Modified:**
- `app/src/main/database/schema.ts` - Added migrations 2 & 3
- `app/src/main/email/email-parser.ts` - Improved detection keywords

### 2. ✅ All Emails Showing "Shipping Label Attached"
**Problem:** Sales were being created even when no valid attachments were found.

**Fix:**
- Modified scanner to check for valid attachments BEFORE creating sale record
- Only creates sale if `savedAttachments.length > 0`
- This ensures only emails with actual shipping labels are stored

**Files Modified:**
- `app/src/main/email/scanner.ts` - Reordered logic to validate attachments first

### 3. ✅ All Sales Selectable for Printing
**Problem:** Related to issue #2 - all sales had attachments because invalid sales weren't being created anymore.

**Fix:** Same as issue #2. Now only sales with valid attachments are created, so the selection logic works correctly.

### 4. ✅ Shipping Company Badge Display
**Problem:** UI component wasn't displaying shipping company badge.

**Fix:** Already implemented in previous session - verified working in PrepareScreen.

**Files Modified:**
- `app/src/renderer/components/SaleCard.tsx` - Added shipping badge display
- `app/src/renderer/components/SaleCard.css` - Added styling

### 5. ✅ Attachment Status Indicator
**Problem:** Users couldn't easily see which sales had shipping labels attached.

**Fix:** Added clear visual indicator showing "✓ Shipping Label Attached" or "✗ No Shipping Label"

**Files Modified:**
- `app/src/renderer/components/SaleCard.tsx` - Added status badge
- `app/src/renderer/components/SaleCard.css` - Added green/red styling

## Database Migrations

### Migration 2: Add shipping_company Column
```sql
ALTER TABLE sales ADD COLUMN shipping_company TEXT
```

### Migration 3: Populate Existing Data
- Scans all existing sales with NULL shipping_company
- Extracts shipping company from metadata (subject, from fields)
- Updates records with detected shipping company
- Detects: Hermes, DHL, DPD, GLS, UPS

## Improved Shipping Company Detection

Enhanced detection keywords (case-insensitive):
- **Hermes:** myhermes, hermes, hermesworld, hermes-europe (prioritized first)
- **DHL:** dhl, dhl.de, dhl.com, deutsche post, deutschepost
- **DPD:** dpd, dpd.de, dpd.com, dpd.co
- **GLS:** gls, gls-group, gls.de, gls-pakete
- **UPS:** ups.com, ups.de, ups., united parcel

Detection checks:
- Email sender (from address)
- Email subject line
- Email body content
- Attachment filenames

## Testing Instructions

1. **Fresh Start Required:**
   ```bash
   cd app
   npm run fresh
   ```

2. **Verify Existing Data:**
   - Open History tab
   - Check if existing sales now show shipping company badges
   - Verify attachment status indicators

3. **Test New Scan:**
   - Go to Scan tab
   - Run a new email scan
   - New sales should have shipping company detected
   - Only emails with valid PDF/image attachments should create sales

4. **Test Selection:**
   - Try selecting sales in History tab
   - Only sales with "✓ Shipping Label Attached" should be selectable
   - Sales with "✗ No Shipping Label" should be disabled

## Next Features to Implement

1. **Label Configuration Per Sale** (TODO #4)
   - Allow customizing footer settings for individual sales
   - Override global footer configuration

2. **Visual Label Preview** (TODO #5)
   - Show actual preview images of prepared labels
   - Display footer content before printing
   - Render preview with Sharp/PDF-lib

## Notes

- All existing sales should now have shipping company populated (if detectable from metadata)
- Future scans will populate shipping company automatically
- Scanner now more selective - only saves legitimate shipping label emails
- Database migrations are idempotent and safe to run multiple times

