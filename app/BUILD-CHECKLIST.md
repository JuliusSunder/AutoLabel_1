# AutoLabel Build Checklist

Diese Checkliste stellt sicher, dass alle externen Tools (ImageMagick, SumatraPDF) korrekt in den Build eingebunden werden.

---

## 🔧 Pre-Build Setup

### 1. ImageMagick vorbereiten

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] ImageMagick Portable herunterladen
   - URL: https://imagemagick.org/script/download.php#windows
   - Datei: `ImageMagick-7.x.x-portable-Q16-HDRI-x64.zip`
   - Direktlink: https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-36-portable-Q16-HDRI-x64.zip

2. [ ] Alle Dateien nach `app/bin/ImageMagick/` kopieren
   - **WICHTIG:** Alle Dateien kopieren, nicht nur `magick.exe`!
   - Benötigt: `magick.exe`, alle `CORE_RL_*.dll`, alle `IM_MOD_*.dll`, XML-Dateien

3. [ ] Verifizieren dass `magick.exe` funktioniert:
   ```powershell
   cd app/bin/ImageMagick
   .\magick.exe --version
   ```
   Erwartete Ausgabe: `Version: ImageMagick 7.1.1-36 Q16-HDRI x64 ...`

4. [ ] Prüfen dass alle erforderlichen Dateien vorhanden sind:
   ```powershell
   # Mindestens diese Dateien müssen existieren:
   dir magick.exe
   dir CORE_RL_*.dll
   dir IM_MOD_RL_pdf_.dll
   dir IM_MOD_RL_png_.dll
   ```

**Dokumentation:** Siehe `app/bin/ImageMagick/README.md`

---

### 2. SumatraPDF verifizieren

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] Prüfen dass SumatraPDF vorhanden ist:
   ```powershell
   dir app\bin\SumatraPDF\SumatraPDF.exe
   ```

2. [ ] Prüfen dass alle DLLs vorhanden sind:
   ```powershell
   dir app\bin\SumatraPDF\*.dll
   ```
   Erforderlich: `libmupdf.dll`, `PdfFilter.dll`, `PdfPreview.dll`

**Status:** ✅ SumatraPDF ist bereits vollständig vorhanden

---

### 3. Build-Konfiguration prüfen

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] `app/forge.config.ts` öffnen und verifizieren:
   ```typescript
   extraResource: [
     './bin/SumatraPDF',
     './bin/ImageMagick',
   ]
   ```

2. [ ] ASAR unpack pattern prüfen:
   ```typescript
   asar: {
     unpack: '**/*.{node,dll,dylib,so,exe}',
   }
   ```

**Status:** ✅ Build-Konfiguration ist korrekt

---

## 🏗️ Build Process

### 4. Dependencies installieren

**Status:** [ ] Erledigt

```powershell
cd app
npm install
```

---

### 5. Build erstellen

**Status:** [ ] Erledigt

```powershell
cd app
npm run make
```

**Erwartete Ausgabe:**
- Build-Prozess läuft ohne Fehler
- Installer wird erstellt in `app/out/make/squirrel.windows/x64/`
- Installer-Name: `AutoLabel-Setup.exe`

**Erwartete Installer-Größe:**
- **Mit ImageMagick:** ~250-300 MB
- **Ohne ImageMagick:** ~50-100 MB

⚠️ **Wenn Installer < 150 MB:** ImageMagick wurde nicht eingebunden!

---

### 6. Build-Output verifizieren

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] Prüfen dass Installer erstellt wurde:
   ```powershell
   dir app\out\make\squirrel.windows\x64\AutoLabel-Setup.exe
   ```

2. [ ] Installer-Größe prüfen:
   ```powershell
   (Get-Item app\out\make\squirrel.windows\x64\AutoLabel-Setup.exe).Length / 1MB
   ```
   Erwartung: > 200 MB

3. [ ] Prüfen dass unpacked App ImageMagick enthält:
   ```powershell
   # Unpacked App befindet sich in:
   dir app\out\AutoLabel-win32-x64\resources\bin\ImageMagick\magick.exe
   dir app\out\AutoLabel-win32-x64\resources\bin\SumatraPDF\SumatraPDF.exe
   ```

---

## 🧪 Testing (Frisches System)

### 7. Installation testen

**Status:** [ ] Erledigt

**Testumgebung:**
- Frisches Windows 10/11 System (VM empfohlen)
- **KEINE** lokale ImageMagick-Installation
- **KEINE** lokale SumatraPDF-Installation

**Schritte:**
1. [ ] Installer auf Test-System kopieren
2. [ ] `AutoLabel-Setup.exe` ausführen
3. [ ] Installation abschließen
4. [ ] App starten

---

### 8. ImageMagick Funktionalität testen

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] App starten und Logs öffnen (Developer Tools)
2. [ ] Nach "[Thumbnail]" und "[Vinted Profile]" suchen
3. [ ] Erwartete Log-Meldung:
   ```
   [Thumbnail] ✓ Found ImageMagick at: C:\Users\...\AppData\Local\autolabel\app-...\resources\bin\ImageMagick\magick.exe
   ```

4. [ ] Email-Account verbinden
5. [ ] Test-Labels scannen:
   - [ ] DPD Label (funktioniert ohne ImageMagick)
   - [ ] Hermes Label (benötigt ImageMagick)
   - [ ] GLS Label (benötigt ImageMagick)
   - [ ] DHL Label (benötigt ImageMagick)

6. [ ] Verifizieren:
   - [ ] Alle Labels werden korrekt verarbeitet
   - [ ] Thumbnails werden angezeigt (keine Platzhalter)
   - [ ] Keine Fehlermeldungen "ImageMagick nicht gefunden"

---

### 9. SumatraPDF Funktionalität testen

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] Drucker konfigurieren (echter oder virtueller Drucker)
2. [ ] Label drucken
3. [ ] Erwartete Log-Meldung:
   ```
   [Printer] ✓ Found SumatraPDF at: C:\Users\...\AppData\Local\autolabel\app-...\resources\bin\SumatraPDF\SumatraPDF.exe
   [Printer] ✓ Successfully printed with SumatraPDF
   ```

4. [ ] Verifizieren:
   - [ ] Drucken funktioniert ohne Fehler
   - [ ] Keine Fehlermeldungen "SumatraPDF nicht gefunden"

---

### 10. Fehlerfall-Testing

**Status:** [ ] Erledigt

**Schritte:**
1. [ ] Hermes/GLS/DHL Label ohne ImageMagick verarbeiten
   - Erwartung: Fehlermeldung mit Hinweis auf Support

2. [ ] Drucken ohne SumatraPDF
   - Erwartung: Fallback auf Electron-Drucken (mit Warnung)

---

## 📋 Final Checklist

Vor dem Release:

- [ ] Alle Pre-Build Schritte abgeschlossen
- [ ] Build erfolgreich erstellt
- [ ] Installer-Größe > 200 MB
- [ ] Installation auf frischem System getestet
- [ ] ImageMagick funktioniert (Hermes/GLS/DHL Labels)
- [ ] SumatraPDF funktioniert (Drucken)
- [ ] Thumbnails werden korrekt angezeigt
- [ ] Keine "nicht gefunden" Fehlermeldungen in Logs

---

## 🐛 Troubleshooting

### Problem: Installer zu klein (< 150 MB)

**Ursache:** ImageMagick wurde nicht in Build eingebunden

**Lösung:**
1. Prüfe ob `app/bin/ImageMagick/magick.exe` existiert
2. Prüfe ob alle DLLs vorhanden sind (siehe Schritt 1)
3. Lösche `app/out/` Verzeichnis
4. Build neu erstellen: `npm run make`

---

### Problem: "ImageMagick nicht gefunden" nach Installation

**Ursache:** ImageMagick wurde nicht korrekt gepackt

**Lösung:**
1. Prüfe unpacked App:
   ```powershell
   dir app\out\AutoLabel-win32-x64\resources\bin\ImageMagick\
   ```
2. Wenn leer: ImageMagick vor Build kopieren (Schritt 1)
3. Build neu erstellen

---

### Problem: "magick.exe funktioniert nicht" nach Installation

**Ursache:** DLLs fehlen oder sind nicht entpackt

**Lösung:**
1. Prüfe ob alle `CORE_RL_*.dll` und `IM_MOD_*.dll` vorhanden sind
2. Prüfe `forge.config.ts` ASAR unpack pattern:
   ```typescript
   asar: {
     unpack: '**/*.{node,dll,dylib,so,exe}',
   }
   ```
3. Build neu erstellen

---

### Problem: Hermes/GLS/DHL Labels werden nicht verarbeitet

**Ursache:** ImageMagick fehlt oder funktioniert nicht

**Debug-Schritte:**
1. Developer Tools öffnen (Ctrl+Shift+I)
2. Nach "[Vinted Profile]" suchen
3. Prüfe welche Pfade durchsucht werden
4. Prüfe ob ImageMagick gefunden wurde

**Erwartete Logs:**
```
[Vinted Profile] Searching for ImageMagick...
[Vinted Profile] Checking: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Vinted Profile] ✓ Found ImageMagick at: ...
```

**Wenn nicht gefunden:**
```
[Vinted Profile] ⚠ ImageMagick not found in any location
```

---

### Problem: Thumbnails zeigen Platzhalter statt Label-Vorschau

**Ursache:** ImageMagick fehlt für PDF-Thumbnail-Generierung

**Lösung:** Siehe "ImageMagick nicht gefunden" oben

---

## 📚 Weitere Ressourcen

- **ImageMagick Setup:** `app/bin/ImageMagick/README.md`
- **Build-Konfiguration:** `app/forge.config.ts`
- **Code-Referenzen:**
  - ImageMagick-Suche: `app/src/main/labels/profiles/vinted.ts` (Zeile 49-81)
  - ImageMagick-Suche: `app/src/main/labels/pdf-thumbnail.ts` (Zeile 17-62)
  - SumatraPDF-Suche: `app/src/main/printing/printer-manager.ts` (Zeile 156-192)

---

## 🎯 Quick Reference

**ImageMagick Download:**
```
https://imagemagick.org/archive/binaries/ImageMagick-7.1.1-36-portable-Q16-HDRI-x64.zip
```

**Kopieren nach:**
```
app/bin/ImageMagick/
```

**Build Command:**
```powershell
cd app
npm run make
```

**Installer Location:**
```
app/out/make/squirrel.windows/x64/AutoLabel-Setup.exe
```

**Erwartete Installer-Größe:**
```
> 200 MB (mit ImageMagick)
```

---

**Letzte Aktualisierung:** 2025-01-01  
**AutoLabel Version:** 1.0.0

