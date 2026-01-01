# External Tools Integration - AutoLabel

Diese Dokumentation beschreibt wie externe Tools (ImageMagick, SumatraPDF) in AutoLabel integriert sind.

---

## 📋 Übersicht

AutoLabel benötigt zwei externe Tools für volle Funktionalität:

| Tool | Zweck | Erforderlich für | Status |
|------|-------|------------------|--------|
| **ImageMagick** | Label-Verarbeitung & Thumbnails | Hermes, GLS, DHL Labels | ⚠️ Muss heruntergeladen werden |
| **SumatraPDF** | Zuverlässiges Drucken | Alle Labels | ✅ Bereits vorhanden |

---

## 🔧 ImageMagick Integration

### Warum ImageMagick?

ImageMagick wird für zwei kritische Funktionen benötigt:

1. **Label-Verarbeitung** (Hermes, GLS, DHL)
   - Cropping: Obere Hälfte des Labels extrahieren
   - Rotation: Labels um -90° drehen
   - Konvertierung: PDF → PNG → verarbeitetes PDF

2. **PDF Thumbnail-Generierung**
   - Rendering: PDF erste Seite → PNG
   - Skalierung: Thumbnail-Größe
   - Qualität: Hochwertige Vorschau

### Verwendete Dateien

**Label-Verarbeitung:**
- `app/src/main/labels/profiles/vinted.ts`
  - `findImageMagick()` - Zeile 49-81
  - `processHermesPdf()` - Zeile 153-222
  - `processStandardPdf()` - Zeile 228-297 (GLS, DHL)
  - `processHermesImage()` - Zeile 346-393
  - `processStandardImage()` - Zeile 399-446 (GLS, DHL)

**Thumbnail-Generierung:**
- `app/src/main/labels/pdf-thumbnail.ts`
  - `findImageMagick()` - Zeile 22-56
  - `generatePDFThumbnailInternal()` - Zeile 158-234

### Pfad-Suche (Priorität)

Die `findImageMagick()` Funktion sucht in dieser Reihenfolge:

```typescript
1. process.resourcesPath/bin/ImageMagick/magick.exe  // ← Production Build (HÖCHSTE PRIORITÄT)
2. app.getAppPath()/bin/ImageMagick/magick.exe       // ← Development
3. process.cwd()/app/bin/ImageMagick/magick.exe      // ← Development (npm run start)
4. C:\Program Files\ImageMagick-7.x.x\magick.exe     // ← System-Installation (Fallback)
5. System PATH (where magick.exe)                     // ← System PATH (Fallback)
```

**Wichtig:** `process.resourcesPath` wird **zuerst** geprüft, damit gepackte Builds die gebündelte Version verwenden!

### ImageMagick Commands

**Hermes/GLS/DHL PDF-Verarbeitung:**
```bash
magick -density 300 "input.pdf[0]" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "output.png"
```

**Hermes/GLS/DHL Image-Verarbeitung:**
```bash
magick "input.png" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "output.png"
```

**PDF Thumbnail-Generierung:**
```bash
magick -density 200 "input.pdf[0]" -resize 200x300 -quality 90 "thumbnail.png"
```

### Fehlerbehandlung

**Wenn ImageMagick nicht gefunden wird:**

1. **Label-Verarbeitung:**
   - Hermes/GLS/DHL: Fehlermeldung anzeigen
   - DPD: Funktioniert ohne ImageMagick (nutzt PDF-lib)

2. **Thumbnail-Generierung:**
   - Fallback auf PDF.js (Canvas-Rendering)
   - Wenn auch das fehlschlägt: Platzhalter-SVG

**Fehlermeldungen:**
```typescript
// vinted.ts
throw new Error(
  'ImageMagick nicht gefunden. Hermes/GLS/DHL-Labels können nicht verarbeitet werden. ' +
  'Bitte installieren Sie ImageMagick oder kontaktieren Sie den Support.'
);

// pdf-thumbnail.ts
console.warn('[Thumbnail] ImageMagick not found, falling back to PDF.js');
```

---

## 🖨️ SumatraPDF Integration

### Warum SumatraPDF?

SumatraPDF wird für zuverlässiges Drucken verwendet:

- **Problem mit Electron:** Schwarze Hintergründe bei Label-Druckern
- **Lösung:** SumatraPDF nutzt Windows-Druckertreiber direkt
- **Fallback:** Electron-Drucken wenn SumatraPDF nicht verfügbar

### Verwendete Dateien

**Drucken:**
- `app/src/main/printing/printer-manager.ts`
  - `findSumatraPDF()` - Zeile 156-192
  - `printPdfWithSumatra()` - Zeile 248-298
  - `printPdfWithElectron()` - Zeile 304-371 (Fallback)
  - `printPdf()` - Zeile 377-429 (Main Entry)

### Pfad-Suche (Priorität)

Die `findSumatraPDF()` Funktion sucht in dieser Reihenfolge:

```typescript
1. process.resourcesPath/bin/SumatraPDF/SumatraPDF.exe  // ← Production Build (HÖCHSTE PRIORITÄT)
2. app.getAppPath()/bin/SumatraPDF/SumatraPDF.exe       // ← Development
3. process.cwd()/app/bin/SumatraPDF/SumatraPDF.exe      // ← Development (npm run start)
4. process.resourcesPath/bin/SumatraPDF.exe             // ← Legacy (backwards compatibility)
5. app.getAppPath()/bin/SumatraPDF.exe                  // ← Legacy
6. process.cwd()/app/bin/SumatraPDF.exe                 // ← Legacy
7. C:\Program Files\SumatraPDF\SumatraPDF.exe           // ← System-Installation (Fallback)
8. System PATH (where SumatraPDF.exe)                    // ← System PATH (Fallback)
```

### SumatraPDF Command

**Drucken:**
```bash
SumatraPDF.exe -print-to "Printer Name" "file.pdf"
```

**Optionen:**
- `-print-to`: Direkt an Drucker senden (ohne Dialog)
- Silent: Kein UI, nur Drucken
- Exit: Schließt automatisch nach Drucken

### Fehlerbehandlung

**Wenn SumatraPDF nicht gefunden wird:**

1. **Warnung loggen:**
   ```typescript
   console.warn('[Printer] ⚠ Using Electron fallback - may have rendering issues with label printers');
   ```

2. **Fallback auf Electron:**
   - Nutzt `BrowserWindow.webContents.print()`
   - Kann schwarze Hintergründe bei Label-Druckern haben
   - Funktioniert aber grundsätzlich

**Fehlermeldungen:**
```typescript
throw new Error(
  'SumatraPDF nicht gefunden. Drucken könnte Probleme haben. ' +
  'Bitte kontaktieren Sie den Support falls Druckprobleme auftreten.'
);
```

---

## 🏗️ Build-Integration

### Electron Forge Konfiguration

**Datei:** `app/forge.config.ts`

```typescript
packagerConfig: {
  extraResource: [
    './bin/SumatraPDF',    // ← Wird in resources/bin/SumatraPDF/ kopiert
    './bin/ImageMagick',   // ← Wird in resources/bin/ImageMagick/ kopiert
  ],
  asar: {
    unpack: '**/*.{node,dll,dylib,so,exe}',  // ← Entpackt EXE/DLL aus ASAR
  },
}
```

### Build-Prozess

**Was passiert beim Build:**

1. **Packaging:**
   ```
   app/bin/ImageMagick/  →  out/AutoLabel-win32-x64/resources/bin/ImageMagick/
   app/bin/SumatraPDF/   →  out/AutoLabel-win32-x64/resources/bin/SumatraPDF/
   ```

2. **ASAR Unpacking:**
   - Alle `.exe` und `.dll` Dateien werden aus ASAR entpackt
   - Notwendig damit Windows die Dateien ausführen kann

3. **Installer:**
   - Squirrel Installer packt alles in `AutoLabel-Setup.exe`
   - Installer-Größe: ~250-300 MB (mit ImageMagick)

### Verzeichnis-Struktur (Production)

**Nach Installation:**
```
C:\Users\USERNAME\AppData\Local\autolabel\
├── app-1.0.0\
│   ├── AutoLabel.exe                           (Hauptprogramm)
│   ├── resources\
│   │   ├── app.asar                            (Gepackter Code)
│   │   ├── app.asar.unpacked\                  (Entpackte native Module)
│   │   └── bin\                                (Externe Tools)
│   │       ├── ImageMagick\
│   │       │   ├── magick.exe                  ✅
│   │       │   ├── CORE_RL_*.dll               ✅
│   │       │   ├── IM_MOD_*.dll                ✅
│   │       │   └── ... (XML/TXT Dateien)
│   │       └── SumatraPDF\
│   │           ├── SumatraPDF.exe              ✅
│   │           └── *.dll                       ✅
│   └── ...
└── ...
```

**Pfad zur Laufzeit:**
```typescript
process.resourcesPath  // → C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources
```

---

## 🧪 Testing

### Lokale Entwicklung

**ImageMagick testen:**
```powershell
cd app/bin/ImageMagick
.\magick.exe --version
```

**SumatraPDF testen:**
```powershell
cd app/bin/SumatraPDF
.\SumatraPDF.exe -print-to "Microsoft Print to PDF" test.pdf
```

### Production Build testen

**1. Build erstellen:**
```powershell
cd app
npm run make
```

**2. Unpacked App testen:**
```powershell
cd app/out/AutoLabel-win32-x64
.\AutoLabel.exe
```

**3. Logs prüfen:**
- Developer Tools öffnen (Ctrl+Shift+I)
- Nach "[Thumbnail]", "[Vinted Profile]", "[Printer]" suchen
- Erwartete Meldungen:
  ```
  [Thumbnail] ✓ Found ImageMagick at: C:\...\resources\bin\ImageMagick\magick.exe
  [Printer] ✓ Found SumatraPDF at: C:\...\resources\bin\SumatraPDF\SumatraPDF.exe
  ```

**4. Funktionalität testen:**
- [ ] DPD Label verarbeiten (ohne ImageMagick)
- [ ] Hermes Label verarbeiten (mit ImageMagick)
- [ ] GLS Label verarbeiten (mit ImageMagick)
- [ ] DHL Label verarbeiten (mit ImageMagick)
- [ ] Thumbnails anzeigen (mit ImageMagick)
- [ ] Label drucken (mit SumatraPDF)

---

## 🐛 Troubleshooting

### ImageMagick Probleme

**Problem:** "ImageMagick nicht gefunden"

**Debug-Schritte:**
1. Logs prüfen:
   ```
   [Vinted Profile] Searching for ImageMagick...
   [Vinted Profile] Checking: C:\...\resources\bin\ImageMagick\magick.exe
   [Vinted Profile] ⚠ ImageMagick not found in any location
   ```

2. Pfade prüfen:
   ```typescript
   console.log('resourcesPath:', process.resourcesPath);
   console.log('appPath:', app.getAppPath());
   console.log('cwd:', process.cwd());
   ```

3. Dateien prüfen:
   ```powershell
   dir "C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources\bin\ImageMagick\"
   ```

**Lösung:**
- Prüfe ob `app/bin/ImageMagick/magick.exe` vor Build existiert
- Prüfe ob alle DLLs vorhanden sind
- Build neu erstellen

---

**Problem:** "magick.exe funktioniert nicht"

**Debug-Schritte:**
1. Manuell testen:
   ```powershell
   cd "C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources\bin\ImageMagick"
   .\magick.exe --version
   ```

2. Fehler prüfen:
   - "DLL nicht gefunden" → Alle DLLs kopieren
   - "Keine Berechtigung" → Als Admin ausführen
   - "Ungültiges Format" → Falsche Version (x86 statt x64)

**Lösung:**
- Alle Dateien aus ImageMagick Portable ZIP kopieren
- Nicht nur `magick.exe`, sondern **ALLE** Dateien!

---

### SumatraPDF Probleme

**Problem:** "SumatraPDF nicht gefunden"

**Debug-Schritte:**
1. Logs prüfen:
   ```
   [Printer] Searching for SumatraPDF...
   [Printer] Checking: C:\...\resources\bin\SumatraPDF\SumatraPDF.exe
   [Printer] ⚠ SumatraPDF not found in any location
   ```

2. Dateien prüfen:
   ```powershell
   dir "C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources\bin\SumatraPDF\"
   ```

**Lösung:**
- Prüfe ob `app/bin/SumatraPDF/SumatraPDF.exe` existiert
- SumatraPDF ist bereits vorhanden, sollte nicht passieren!

---

**Problem:** Drucken funktioniert nicht

**Debug-Schritte:**
1. SumatraPDF manuell testen:
   ```powershell
   cd "C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources\bin\SumatraPDF"
   .\SumatraPDF.exe -print-to "Drucker Name" "test.pdf"
   ```

2. Logs prüfen:
   ```
   [Printer] Executing SumatraPDF command: ...
   [Printer] SumatraPDF execution failed: ...
   ```

**Lösung:**
- Drucker-Name prüfen (exakter Name erforderlich)
- Drucker online/verfügbar prüfen
- Fallback auf Electron funktioniert automatisch

---

## 📚 Weitere Ressourcen

**Dokumentation:**
- ImageMagick Setup: `app/bin/ImageMagick/README.md`
- Build Checklist: `app/BUILD-CHECKLIST.md`
- Forge Config: `app/forge.config.ts`

**Code-Referenzen:**
- ImageMagick (Labels): `app/src/main/labels/profiles/vinted.ts`
- ImageMagick (Thumbnails): `app/src/main/labels/pdf-thumbnail.ts`
- SumatraPDF: `app/src/main/printing/printer-manager.ts`

**External Links:**
- ImageMagick: https://imagemagick.org/
- ImageMagick Download: https://imagemagick.org/script/download.php#windows
- SumatraPDF: https://www.sumatrapdfreader.org/
- Electron Forge: https://www.electronforge.io/

---

**Letzte Aktualisierung:** 2025-01-01  
**AutoLabel Version:** 1.0.0

