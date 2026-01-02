# ImageMagick Debugging Guide

## Problem

Auf dem Test-Gerät werden Hermes/GLS/DHL Labels nicht verarbeitet und Thumbnails zeigen Platzhalter statt echte Vorschauen.

## Ursache

ImageMagick wird im Build nicht gefunden oder ist nicht korrekt eingebunden.

## Logging-Verbesserungen

Ich habe das Logging in folgenden Dateien verbessert:

### 1. `app/src/main/labels/profiles/vinted.ts`
- ✅ `findImageMagick()` zeigt jetzt alle geprüften Pfade
- ✅ Zeigt `process.resourcesPath`, `app.getAppPath()`, `process.cwd()`
- ✅ Klare Erfolgsmeldungen (✅) und Fehlermeldungen (❌)
- ✅ Alle `console.debug` → `console.log` (immer sichtbar)

### 2. `app/src/main/labels/processor.ts`
- ✅ Zeigt jeden Verarbeitungsschritt
- ✅ Zeigt Sale-Info (Shipping Company, Platform)
- ✅ Zeigt Attachment-Info (Type, Path)
- ✅ Detaillierte Fehlermeldungen mit vollständigem Stack Trace

### 3. `app/src/main/labels/pdf-thumbnail.ts`
- ✅ `findImageMagick()` zeigt alle geprüften Pfade
- ✅ Zeigt Fallback auf PDF.js wenn ImageMagick fehlt
- ✅ Klare Erfolgsmeldungen (✅) und Warnungen (⚠️)

## Testing-Anleitung

### 1. Build neu erstellen

```powershell
cd app
npm run make
```

**Wichtig:** Prüfe, dass ImageMagick im Build enthalten ist:
- Installer-Größe > 200 MB? ✅
- `app/bin/ImageMagick/magick.exe` existiert? ✅
- Alle DLLs vorhanden? ✅

### 2. Auf Test-Gerät installieren

1. Installer auf Test-Gerät kopieren
2. Alte Version deinstallieren (falls vorhanden)
3. Neue Version installieren

### 3. Console öffnen und Logs prüfen

1. App starten
2. Developer Tools öffnen (`Ctrl + Shift + I`)
3. Console-Tab auswählen
4. Console leeren (`Ctrl + L`)

### 4. Labels vorbereiten

1. Wähle 4 Labels aus (DPD, Hermes, GLS, DHL)
2. Klicke auf "Prepare Labels"
3. Beobachte die Console

### 5. Erwartete Logs

#### Erfolgreicher Fall (ImageMagick gefunden):

```
[Processor] 🚀 Starting label preparation for 4 sale(s)
[Processor] 📦 Processing sale: xxx
[Processor] Sale info - Shipping: DPD, Platform: vinted
[Processor] Found 1 attachment(s), using: yyy (type: pdf)
[Processor] Attachment path: C:\...\xxx.pdf
[Processor] 🔄 Processing attachment: yyy
[Normalizer] Normalizing label: C:\...\xxx.pdf
[Normalizer] Shipping company: DPD
[Vinted Profile] Processing label for: DPD
[Processor] ✅ Successfully prepared label: zzz

[Processor] 📦 Processing sale: xxx
[Processor] Sale info - Shipping: Hermes, Platform: vinted
[Vinted Profile] 🔍 Searching for ImageMagick...
[Vinted Profile] process.resourcesPath: C:\Users\...\AppData\Local\autolabel\app-1.0.0\resources
[Vinted Profile] app.getAppPath(): C:\Users\...\AppData\Local\autolabel\app-1.0.0\resources\app.asar
[Vinted Profile] process.cwd(): C:\Users\...\AppData\Local\autolabel\app-1.0.0
[Vinted Profile] Checking: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Vinted Profile] ✅ Found ImageMagick at: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Vinted Profile] 🔄 Processing Hermes PDF with ImageMagick
[Vinted Profile] Using ImageMagick at: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Processor] ✅ Successfully prepared label: zzz
```

#### Fehlerfall (ImageMagick nicht gefunden):

```
[Processor] 🚀 Starting label preparation for 4 sale(s)
[Processor] 📦 Processing sale: xxx
[Processor] Sale info - Shipping: Hermes, Platform: vinted
[Vinted Profile] 🔍 Searching for ImageMagick...
[Vinted Profile] process.resourcesPath: C:\Users\...\AppData\Local\autolabel\app-1.0.0\resources
[Vinted Profile] Checking: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Vinted Profile] Checking: C:\Users\...\resources\app.asar\bin\ImageMagick\magick.exe
[Vinted Profile] Checking: C:\Users\...\app\bin\ImageMagick\magick.exe
[Vinted Profile] Checking: C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe
[Vinted Profile] ❌ ImageMagick not found in any standard location
[Vinted Profile] Searched paths: [...]
[Vinted Profile] ❌ ImageMagick nicht gefunden. Hermes-Labels können nicht verarbeitet werden.
[Processor] ❌ Error processing attachment yyy: ImageMagick nicht gefunden...
[Processor] ⚠️ Completed with 3 error(s)
```

#### Thumbnail-Logs (ImageMagick gefunden):

```
[Thumbnail] 🖼️ Generating PDF thumbnail with ImageMagick: C:\...\xxx.pdf
[Thumbnail] 🔍 Searching for ImageMagick...
[Thumbnail] process.resourcesPath: C:\Users\...\AppData\Local\autolabel\app-1.0.0\resources
[Thumbnail] Checking: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Thumbnail] ✅ Found ImageMagick at: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Thumbnail] Using ImageMagick at: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Thumbnail] Converting first page of PDF to 200x300 PNG...
[Thumbnail] ✅ PDF thumbnail generated successfully
```

#### Thumbnail-Logs (ImageMagick nicht gefunden):

```
[Thumbnail] 🖼️ Generating PDF thumbnail with ImageMagick: C:\...\xxx.pdf
[Thumbnail] 🔍 Searching for ImageMagick...
[Thumbnail] Checking: C:\Users\...\resources\bin\ImageMagick\magick.exe
[Thumbnail] ❌ ImageMagick not found in any location
[Thumbnail] ⚠️ ImageMagick not found, falling back to PDF.js
[Thumbnail] Generating PDF thumbnail with PDF.js: C:\...\xxx.pdf
```

## Debugging-Schritte

### Schritt 1: Prüfe ob ImageMagick gesucht wird

Suche in der Console nach:
- `[Vinted Profile] 🔍 Searching for ImageMagick...`
- `[Thumbnail] 🔍 Searching for ImageMagick...`

**Wenn nicht gefunden:**
- Labels werden nicht verarbeitet (Fehler tritt früher auf)
- Prüfe `[Processor]` Logs auf Fehler

### Schritt 2: Prüfe welche Pfade geprüft werden

Suche nach:
- `[Vinted Profile] Checking: ...`
- `[Vinted Profile] process.resourcesPath: ...`

**Wichtige Pfade:**
- `process.resourcesPath` sollte auf `.../resources` zeigen
- Erster geprüfter Pfad: `.../resources/bin/ImageMagick/magick.exe`

### Schritt 3: Prüfe ob ImageMagick gefunden wird

Suche nach:
- `[Vinted Profile] ✅ Found ImageMagick at: ...`
- `[Thumbnail] ✅ Found ImageMagick at: ...`

**Wenn gefunden:**
- Labels sollten verarbeitet werden ✅
- Thumbnails sollten echte Vorschauen zeigen ✅

**Wenn nicht gefunden:**
- `[Vinted Profile] ❌ ImageMagick not found in any standard location`
- Labels werden übersprungen ❌
- Thumbnails zeigen Platzhalter ❌

### Schritt 4: Prüfe Fehler-Details

Suche nach:
- `[Processor] ❌ Error processing attachment ...`
- `[Processor] Full error: ...`

**Häufige Fehler:**
- "ImageMagick nicht gefunden" → ImageMagick fehlt im Build
- "magick.exe funktioniert nicht" → DLLs fehlen
- "Keine Berechtigung" → Berechtigungsproblem

## Lösungen

### Problem 1: ImageMagick nicht gefunden

**Ursache:** ImageMagick wurde nicht in den Build eingebunden

**Lösung:**
1. Prüfe ob `app/bin/ImageMagick/magick.exe` existiert
2. Prüfe ob alle DLLs vorhanden sind (siehe `app/bin/ImageMagick/README.md`)
3. Build neu erstellen: `npm run make`
4. Installer-Größe prüfen (> 200 MB)

### Problem 2: ImageMagick gefunden, aber funktioniert nicht

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

### Problem 3: Falscher Pfad

**Ursache:** `process.resourcesPath` zeigt auf falsches Verzeichnis

**Lösung:**
1. Prüfe Logs: `process.resourcesPath` sollte auf `.../resources` zeigen
2. Prüfe ob `.../resources/bin/ImageMagick/` existiert
3. Falls nicht: Build-Problem, neu erstellen

## Zusammenfassung

Nach den Logging-Verbesserungen solltest du:
1. ✅ Sehen, ob ImageMagick gesucht wird
2. ✅ Sehen, welche Pfade geprüft werden
3. ✅ Sehen, ob ImageMagick gefunden wird
4. ✅ Detaillierte Fehlermeldungen erhalten

Die Logs zeigen genau, wo das Problem liegt:
- ImageMagick fehlt im Build?
- ImageMagick am falschen Ort?
- ImageMagick gefunden, aber funktioniert nicht?

---

**Nächste Schritte:**
1. Build neu erstellen mit verbessertem Logging
2. Auf Test-Gerät installieren
3. Console-Logs teilen
4. Problem identifizieren und beheben

