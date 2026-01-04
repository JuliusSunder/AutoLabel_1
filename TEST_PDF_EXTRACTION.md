# Test-Anleitung: PDF-Text-Extraktion

## Status
✅ **Code erfolgreich kompiliert** (siehe Terminal 13:20:31)  
✅ **Hot-Reload funktioniert** - Änderungen sind bereits aktiv  
🧪 **Bereit zum Testen**

## Was wurde geändert?

### Datei: `app/src/main/email/pdf-analyzer.ts`
- ❌ **Entfernt**: `pdf-parse` (CommonJS, funktionierte nicht)
- ✅ **Hinzugefügt**: PDF.js (`pdfjs-dist`) für Text-Extraktion
- ✅ **Bewährt**: Gleiche Library wie in `vinted.ts` und `pdf-thumbnail.ts`

### Datei: `app/vite.main.config.ts`
- ❌ **Entfernt**: `pdf-parse` aus External-Liste

## Test 1: Folder Scanner mit PDF

### Vorbereitung:
1. **Watched Folder prüfen**: 
   - Laut Terminal: `C:\Users\cooki\Downloads` ist aktiv
   - Oder in der App unter "Settings" → "Watched Folders"

2. **Test-PDF vorbereiten**:
   - Vinted-Label mit Hermes/DHL/DPD/GLS
   - Oder ein beliebiges Versandlabel-PDF

### Test-Durchführung:

1. **PDF in Downloads-Ordner kopieren**:
   ```powershell
   # Beispiel: Kopiere ein Vinted-Label
   Copy-Item "C:\path\to\Vinted-Online-Versandschein-12345.pdf" "C:\Users\cooki\Downloads\"
   ```

2. **In der App: Folder-Scan starten**:
   - Gehe zu "Scan" Tab
   - Klicke "Scan Folders" Button
   - Oder nutze IPC-Handler direkt

3. **Console-Logs beobachten** (F12 in der App):
   ```
   [Folder Scanner] Scanning folder: Downloads
   [Folder Scanner] 🔍 Processing: Vinted-Online-Versandschein-12345.pdf
   [PDF Analyzer] 📄 Extracting text from PDF: C:\Users\cooki\Downloads\...
   [PDF Analyzer] 📖 PDF loaded, pages: 1
   [PDF Analyzer] ✅ Successfully extracted text, length: 1234
   [PDF Analyzer] 📝 Text preview: Hermes Versand Paket...
   [PDF Analyzer] 🔍 Starting shipping company detection
   [PDF Analyzer] ✅ Detected Hermes from indicator: "hermes"
   [Folder Scanner] 🚚 Detected shipping company: Hermes
   [Folder Scanner] ✅ Sale created: ...
   ```

4. **Ergebnis prüfen**:
   - Gehe zu "History" Tab
   - Neueste Sale sollte sichtbar sein
   - **Orange Badge**: Shipping Company (z.B. "Hermes")
   - **Blue Badge**: Platform (z.B. "Vinted/Kleiderkreisel")

### Erwartete Ergebnisse:

#### ✅ Erfolg:
- Text wird aus PDF extrahiert
- Shipping Company wird erkannt (Hermes/DHL/DPD/GLS/UPS)
- Sale wird mit `shippingCompany` gespeichert
- Badge wird in History angezeigt

#### ⚠️ Warnung (OK):
```
[PDF Analyzer] ⚠️  PDF parsed successfully but no text extracted
[PDF Analyzer] ⚠️  This might be a scanned PDF or image-based PDF
```
**Bedeutung**: PDF ist ein gescanntes Bild, kein Text-Layer vorhanden  
**Lösung**: Für OCR würde Tesseract.js benötigt (zukünftige Enhancement)

#### ❌ Fehler (Nicht OK):
```
[PDF Analyzer] ❌ Failed to extract text from PDF
TypeError: ...
```
**Bedeutung**: Etwas ist schiefgelaufen  
**Aktion**: Fehlerdetails an mich senden

## Test 2: Re-Analyze Bestehende Sales

### Zweck:
Bestehende Sales (48 laut Terminal) ohne `shippingCompany` neu analysieren

### Durchführung:

1. **In der App**:
   - Gehe zu "Scan" Tab
   - Klicke "Re-analyze PDFs" Button

2. **Console-Logs beobachten**:
   ```
   [PDF Reanalyzer] Starting re-analysis of 48 sales...
   [PDF Reanalyzer] (1/48) Analyzing sale...
   [PDF Analyzer] 📄 Extracting text from PDF: ...
   [PDF Analyzer] ✅ Detected Hermes from indicator: "hermes"
   [PDF Reanalyzer] ✅ Updated: None → Hermes
   ...
   [PDF Reanalyzer] SUMMARY:
     Total sales: 48
     Analyzed: 48
     Updated: 12
   ```

3. **Ergebnis prüfen**:
   - Gehe zu "History" Tab
   - Sales sollten jetzt Orange Badges haben (Shipping Company)

## Test 3: Email Scanner (Fallback)

### Zweck:
Wenn Email-Sender unklar ist, soll PDF-Text-Extraktion als Fallback dienen

### Durchführung:

1. **Email-Account hinzufügen** (falls noch nicht vorhanden):
   - Gehe zu "Settings" → "Email Accounts"
   - Füge IMAP-Account hinzu

2. **Email-Scan starten**:
   - Gehe zu "Scan" Tab
   - Klicke "Scan Emails" Button

3. **Console-Logs beobachten**:
   ```
   [Email Scanner] Scanning account: ...
   [Email Scanner] Processing email: ...
   [Email Parser] Email-based detection: Unknown
   [PDF Analyzer] 📄 Extracting text from PDF (fallback)...
   [PDF Analyzer] ✅ Detected DHL from indicator: "dhl"
   [Email Scanner] ✅ Sale created with shipping company: DHL
   ```

## Test 4: Vinted Label Processing

### Zweck:
Prüfen, ob das richtige Label-Profil verwendet wird

### Vorbereitung:
1. Sale mit Vinted-Label und erkanntem Carrier (z.B. Hermes)
2. Sale sollte `platform: "Vinted/Kleiderkreisel"` und `shippingCompany: "Hermes"` haben

### Durchführung:

1. **Label vorbereiten**:
   - Gehe zu "History" Tab
   - Wähle Vinted-Sale mit Hermes
   - Klicke "Prepare Label" Button

2. **Console-Logs beobachten**:
   ```
   [Label Prepare] Preparing label for sale: ...
   [Label Prepare] Platform: Vinted/Kleiderkreisel
   [Label Prepare] Shipping Company: Hermes
   [Label Prepare] Using profile: Vinted
   [Vinted Profile] Processing Hermes label...
   [Vinted Profile] Applying Hermes-specific transformations...
   ```

3. **Ergebnis prüfen**:
   - Label sollte korrekt verarbeitet sein
   - Hermes-spezifisches Layout (crop upper half, rotate -90°)
   - Footer mit Sale-Info

### Erwartete Profile-Auswahl:

| Platform | Shipping Company | Profil | Processing |
|----------|------------------|--------|------------|
| Vinted | Hermes | Vinted | Crop + Rotate -90° |
| Vinted | DHL | Vinted | Crop + Rotate -90° |
| Vinted | GLS | Vinted | Crop + Rotate -90° |
| Vinted | DPD | Vinted | Crop upper-left, NO rotate |
| Andere | Beliebig | Generic | Resize + Footer |

## Debugging-Tipps

### Console öffnen:
- **In der App**: F12 oder Ctrl+Shift+I
- **Terminal**: Bereits offen (Terminal 5)

### Wichtige Log-Präfixe:
- `[PDF Analyzer]` - Text-Extraktion und Carrier-Erkennung
- `[Folder Scanner]` - Folder-Scan-Prozess
- `[Email Scanner]` - Email-Scan-Prozess
- `[Vinted Profile]` - Label-Processing
- `[Label Prepare]` - Label-Vorbereitung

### Detaillierte Logs aktivieren:
Bereits aktiv! Die Logs sind sehr ausführlich.

### Häufige Probleme:

#### Problem: "File is not a valid PDF"
```
[PDF Analyzer] ❌ File is not a valid PDF (magic bytes check failed)
```
**Lösung**: Datei ist kein echtes PDF, eventuell umbenennt oder korrupt

#### Problem: "No text extracted"
```
[PDF Analyzer] ⚠️  PDF parsed successfully but no text extracted
```
**Lösung**: PDF ist gescanntes Bild, kein Text-Layer vorhanden (OK, kein Fehler)

#### Problem: "No shipping company detected"
```
[PDF Analyzer] ⚠️  No shipping company detected in PDF
```
**Lösung**: PDF enthält keine bekannten Keywords (hermes, dhl, dpd, gls, ups)

## Erfolgs-Kriterien

### ✅ Test erfolgreich, wenn:
1. Text wird aus PDF extrahiert (Länge > 0)
2. Shipping Company wird erkannt (Hermes/DHL/DPD/GLS/UPS)
3. Sale wird mit `shippingCompany` gespeichert
4. Orange Badge wird in History angezeigt
5. Vinted-Profil wird korrekt angewendet
6. Keine TypeScript/Build-Fehler

### ❌ Test fehlgeschlagen, wenn:
1. TypeError: pdfParse is not a function (alter Fehler)
2. TypeError bei PDF.js Import
3. Keine Text-Extraktion möglich
4. Build-Fehler in Terminal

## Nächste Schritte nach erfolgreichem Test

### 1. Optional: pdf-parse entfernen
```powershell
cd app
npm uninstall pdf-parse @types/pdf-parse
```

### 2. Dokumentation aktualisieren
- ✅ `SIMPLIFIED_APPROACH.md` - Bereits aktualisiert
- ✅ `PDF_TEXT_EXTRACTION_FIX.md` - Bereits erstellt
- ✅ `TEST_PDF_EXTRACTION.md` - Diese Datei

### 3. Commit erstellen
```powershell
git add app/src/main/email/pdf-analyzer.ts
git add app/vite.main.config.ts
git add SIMPLIFIED_APPROACH.md
git add PDF_TEXT_EXTRACTION_FIX.md
git add TEST_PDF_EXTRACTION.md
git commit -m "Fix PDF text extraction using PDF.js instead of pdf-parse

- Replace pdf-parse with pdfjs-dist for text extraction
- Fix CommonJS/ES Module compatibility issues in Electron+Vite
- Enable shipping company detection from PDF content
- Update documentation with solution details"
```

## Kontakt

Bei Fragen oder Problemen:
- Sende Console-Logs (F12)
- Sende Terminal-Output
- Beschreibe, welcher Test fehlschlägt

---

**Erstellt**: 2026-01-04  
**Status**: Bereit zum Testen  
**Build**: ✅ Erfolgreich kompiliert (13:20:31)

