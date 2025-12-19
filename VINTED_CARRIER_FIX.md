# Vinted Carrier Detection & Attachment Filtering Fix

**Date:** December 19, 2025  
**Issues:**
1. Alle Vinted-Sales werden als "Hermes" markiert (auch wenn DPD/DHL/GLS genutzt wird)
2. "Shipping Label Attached" steht unter allen Emails

## Root Causes

### Problem 1: Aggressive Hermes Default
- Reanalyzer hatte einen "Default to Hermes" für alle Vinted-Sales
- Dies war zu aggressiv - Vinted nutzt verschiedene Carrier (Hermes, DPD, DHL, GLS, UPS)
- Der Carrier sollte aus Subject/Filename erkannt werden, nicht defaulted

### Problem 2: Zu permissive Attachment-Filterung
- `isLikelyShippingLabel()` gab `true` zurück wenn keine Indikatoren gefunden wurden
- Das war zu permissiv - dadurch wurden alle PDF-Attachments als "Shipping Labels" behandelt
- Rechnungen, Bestätigungen, etc. wurden fälschlicherweise als Shipping Labels akzeptiert

## Solutions Implemented

### 1. Removed Vinted-Hermes Default

**Before:**
```javascript
// Vinted in Germany defaults to Hermes if no other carrier is specified
detectedCompany = 'Hermes';
console.log(`ℹ️  Defaulting to Hermes (Vinted Germany default carrier)`);
```

**After:**
```javascript
// No default! If carrier not found, leave as null
if (detectedCompany) {
  console.log(`✅ Detected ${detectedCompany} from Vinted email`);
} else {
  console.log(`⚠️  Could not detect carrier for Vinted sale - check subject or filename`);
}
```

### 2. Improved Vinted Carrier Detection

**Key Changes:**
- Checks for ALL carriers: Hermes, DHL, DPD, GLS, UPS
- Looks in email subject AND attachment filenames
- NO default carrier - only sets if explicitly detected
- Works for both scanner (new emails) and reanalyzer (existing sales)

**Detection Sources for Vinted:**
1. Email subject line (e.g., "Versandschein für... Hermes")
2. Attachment filenames (e.g., "hermes_label.pdf")
3. Email body (secondary)

### 3. Stricter Attachment Filtering

**Changed Default Behavior:**

**Before (too permissive):**
```javascript
// If no clear indicators, assume it might be a label
return true;  // ❌ TOO PERMISSIVE!
```

**After (strict):**
```javascript
// If no clear indicators, REJECT IT (strict approach)
// Only files with clear label indicators should pass
console.log(`[Email Parser] Rejecting attachment (no label indicators): ${filename}`);
return false;  // ✅ STRICT!
```

### 4. Enhanced Detection Keywords

**Label Keywords (MUST have one of these):**
- German: `versandschein`, `versandetikett`, `paketschein`, `frankierung`
- English: `shipping label`, `shipment label`, `tracking label`
- Carriers: `hermes`, `dhl`, `dpd`, `gls`, `ups`, `fedex`
- Generic: `label`, `paket`, `sendung`

**Rejection Keywords (automatic rejection):**
- German: `rechnung`, `beleg`, `quittung`, `bestätigung`, `kaufbeleg`, `zahlungsbestätigung`
- English: `invoice`, `receipt`, `bill`, `payment`, `confirmation`
- Others: `order`, `auftrag`, `zahlung`, `bestellung`

### 5. Verbose Logging

Added detailed console logs to help debug:
```
[Email Parser] Rejecting attachment (invoice/receipt): Rechnung_12345.pdf
[Email Parser] Accepting attachment (shipping label): Hermes_Versandschein.pdf
[Email Parser] Rejecting email (no label indicators): Order Confirmation...
[Email Parser] Vinted email detected - checking subject and filenames for carrier...
[Email Parser] Detected Hermes from Vinted email
```

## Files Modified

1. **`app/src/main/database/pdf-reanalyzer.ts`**
   - Removed Vinted-Hermes default
   - Added checks for all carriers (DPD, DHL, GLS, UPS)
   - Better logging for debugging

2. **`app/src/main/database/schema.ts`**
   - Updated Migration 5 to remove Hermes default
   - Now only sets carrier if explicitly detected

3. **`app/src/main/email/email-parser.ts`**
   - `isLikelyShippingLabel()`: Changed default from `true` to `false` (strict)
   - `isShippingLabelEmail()`: Added negative keyword check, better logging
   - `detectShippingCompany()`: Special Vinted handling, checks subject/filenames only
   - Added verbose logging throughout

## Expected Behavior

### Before Fix

❌ **Vinted Carrier Detection:**
```
🔍 Vinted platform detected - checking for shipping carrier...
ℹ️  Defaulting to Hermes (Vinted Germany default carrier)
✅ Updated: None → Hermes
```
Result: ALL Vinted sales marked as Hermes

❌ **Attachment Filtering:**
- All PDF attachments accepted (invoices, receipts, confirmations)
- "✓ Shipping Label Attached" on every email
- Users confused about which emails have actual labels

### After Fix

✅ **Vinted Carrier Detection:**
```
🔍 Vinted platform detected - checking for shipping carrier...
✅ Detected DPD from Vinted email
✅ Updated: None → DPD
```
Result: Correct carrier detected (Hermes, DPD, DHL, GLS, or UPS)

✅ **Vinted Carrier NOT Detected (when carrier info missing):**
```
🔍 Vinted platform detected - checking for shipping carrier...
⚠️  Could not detect carrier for Vinted sale - check subject or filename
```
Result: Shipping company remains `null` (no false Hermes default)

✅ **Attachment Filtering:**
```
[Email Parser] Rejecting attachment (invoice/receipt): Rechnung_2025.pdf
[Email Parser] Accepting attachment (shipping label): DPD_Versandschein.pdf
```
Result: Only actual shipping labels saved

## Testing Instructions

### Test 1: Restart App & Check Migrations

```bash
cd app
npm run fresh
```

Watch for migration logs:
```
[Schema] Analyzing attachment filenames for shipping company detection...
[Schema] Detected DPD for sale xxx
[Schema] Detected Hermes for sale yyy
[Schema] Updated X sales with shipping company from filename analysis
```

### Test 2: Re-analyze Existing Sales

1. Open **History** tab
2. Click **"Re-analyze PDFs"** button
3. Check PowerShell terminal logs

**Expected Output:**
```
[PDF Reanalyzer] (X/Y) Analyzing sale...
  Sale: Versandschein für...
  Platform: Vinted/Kleiderkreisel
  Current shipping company: Hermes
  Email from: "vinted-team" <no-reply@vinted.de>
  Attachments: 1 file(s)
  Filenames: versandschein_dpd_12345.pdf
  🔍 Vinted platform detected - checking for shipping carrier...
  ✅ Detected DPD from Vinted email
  ✅ Updated: Hermes → DPD
```

### Test 3: Check Vinted Sales

1. Open **History** tab
2. Look at Vinted sales (Platform badge: "Vinted/Kleiderkreisel")
3. **Expected Results:**
   - Some show: "Hermes" badge (orange)
   - Some show: "DPD" badge (orange)
   - Some show: "DHL" badge (orange)
   - Some show: NO shipping badge (if carrier couldn't be detected)
   - ✅ NO longer ALL marked as "Hermes"

### Test 4: Attachment Filtering

1. Go to **Scan** tab
2. Click **"Scan Mailbox"**
3. Watch terminal logs during scan:

**Expected Logs:**
```
[Email Parser] Rejecting attachment (invoice/receipt): Invoice_12345.pdf
[Email Parser] Accepting attachment (shipping label): Hermes_Label.pdf
[Email Parser] Rejecting email (no label indicators): Your Order Confirmation...
[Email Parser] Accepting email (shipping label): Versandschein für...
```

4. Check **History** tab after scan:
   - ✅ Only emails with ACTUAL shipping labels have "✓ Shipping Label Attached"
   - ✅ Emails with only invoices/receipts are NOT imported
   - ✅ "✗ No Shipping Label" should rarely appear (only if filter fails)

### Test 5: New Vinted Email Scan

1. If you have NEW Vinted emails, run scan
2. Check terminal for Vinted detection:

```
[Email Parser] Vinted email detected - checking subject and filenames for carrier...
[Email Parser] Detected DPD from Vinted email
[Scanner] Created sale: xxx | Platform: Vinted/Kleiderkreisel | Shipping: DPD
```

3. Verify in **History** tab:
   - New Vinted sale has correct carrier badge (DPD, Hermes, DHL, etc.)
   - NOT defaulted to Hermes

## Troubleshooting

### Issue: Some Vinted sales still have no shipping company

**This is EXPECTED now!** If the carrier cannot be detected from subject or filename, it remains `null`.

**Solutions:**
1. Check if email subject mentions carrier (e.g., "Hermes", "DPD")
2. Check attachment filename for carrier indicators
3. If neither contains carrier info, it cannot be auto-detected
4. Future enhancement: Parse PDF content to extract carrier

### Issue: Wrong carrier detected for Vinted

**Debug Steps:**
1. Check terminal logs during re-analysis
2. Look for: "Filenames: ..." line
3. Check what keywords are in the subject/filename
4. May need to add more detection keywords

### Issue: Invoices still being saved as labels

**Debug Steps:**
1. Check terminal logs for: "Rejecting attachment" messages
2. If invoice passes through, check its filename
3. Add more rejection keywords to `nonLabelKeywords` array

### Issue: Real shipping labels being rejected

**Debug Steps:**
1. Check terminal logs for: "Rejecting attachment (no label indicators)"
2. Check the attachment filename
3. Add missing keywords to `labelKeywords` array

## Detection Logic Summary

### Vinted Carrier Detection (Priority Order):

1. **Check Subject Line**
   - Example: "Versandschein für ... | Hermes"
   - Keywords: hermes, dhl, dpd, gls, ups

2. **Check Attachment Filenames**
   - Example: "versandschein_dpd_12345.pdf"
   - Keywords: hermes, dhl, dpd, gls, ups

3. **No Match?**
   - Leave `shippingCompany` as `null`
   - DO NOT default to Hermes

### Attachment Filtering (Sequential):

1. **Check for Rejection Keywords**
   - If found: REJECT immediately
   - Keywords: rechnung, invoice, payment, etc.

2. **Check for Label Keywords**
   - If found: ACCEPT
   - Keywords: versandschein, label, hermes, dhl, etc.

3. **No Clear Indicators?**
   - REJECT (strict mode)
   - Only explicit labels pass

## Summary

✅ **Vinted-Hermes Default entfernt** - Nur explizite Detection  
✅ **Alle Carrier werden erkannt** - Hermes, DPD, DHL, GLS, UPS  
✅ **Attachment-Filterung verschärft** - Nur echte Labels werden gespeichert  
✅ **"Shipping Label Attached" nur für echte Labels** - Keine false positives mehr  
✅ **Verbose Logging** - Besseres Debugging im Terminal  

Die Lösung ist jetzt präziser und flexibler. Vinted-Sales können alle verschiedenen Carrier haben, und nur echte Shipping Labels werden als solche markiert.

