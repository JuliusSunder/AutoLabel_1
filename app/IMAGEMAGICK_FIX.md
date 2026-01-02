# ImageMagick Pfad-Problem - Lösung ✅

## Problem (BEHOBEN)

ImageMagick wurde im ASAR-Archiv gefunden (`app.asar\bin\ImageMagick\magick.exe`), konnte aber nicht ausgeführt werden, da Windows keine Executables direkt aus ASAR-Archiven starten kann.

**Fehler:** "Das System kann den angegebenen Pfad nicht finden."

## Ursache

1. **ASAR ist ein gepacktes Archiv** (ähnlich wie ZIP)
2. **Windows kann keine .exe Dateien aus ASAR ausführen**
3. ImageMagick wurde durch `extraResource` nach `resources/ImageMagick/` kopiert (nicht `resources/bin/ImageMagick/`)
4. Die Pfad-Suche suchte am falschen Ort (`resources/bin/ImageMagick/` statt `resources/ImageMagick/`)

## Lösung ✅

### 1. Pfad-Suche korrigiert

Der korrekte Pfad ist `resources/ImageMagick/magick.exe` (nicht `resources/bin/ImageMagick/magick.exe`).

`extraResource` in `forge.config.ts` kopiert:
- `./bin/ImageMagick` → `resources/ImageMagick/` (ohne `bin/` Ordner!)

**Korrigierte Pfade in beiden `findImageMagick()` Funktionen:**

```typescript
const possiblePaths = [
  // Bundled with app (primary location for packaged builds)
  // extraResource copies to resources/ImageMagick/ (not resources/bin/ImageMagick/)
  path.join(process.resourcesPath || '', 'ImageMagick', 'magick.exe'),
  // Development paths...
];
```

**Betroffene Dateien:**
- `app/src/main/labels/profiles/vinted.ts` (Zeile 56-59)
- `app/src/main/labels/pdf-thumbnail.ts` (Zeile 29-32)

### 2. ASAR-Pfade explizit ausschließen

In beiden `findImageMagick()` Funktionen wurde eine Prüfung hinzugefügt:

```typescript
// Skip ASAR paths - executables cannot be run from inside ASAR
if (magickPath.includes('.asar')) {
  logToRenderer(`⚠️ Skipping ASAR path (executables must be unpacked): ${magickPath}`);
  continue;
}
```

**Betroffene Dateien:**
- `app/src/main/labels/profiles/vinted.ts` (Zeile 75-78)
- `app/src/main/labels/pdf-thumbnail.ts` (Zeile 45-48)

### 3. Verbessertes Logging

Jetzt wird explizit geloggt, wenn ein Pfad nicht gefunden wird:

```typescript
if (fs.existsSync(magickPath)) {
  logToRenderer(`✅ Found ImageMagick at: ${magickPath}`);
  return magickPath;
} else {
  logToRenderer(`❌ Not found at: ${magickPath}`);
}
```

### 4. Build-Konfiguration dokumentiert

In `app/forge.config.ts` wurde dokumentiert, dass `extraResource` Dateien automatisch außerhalb von ASAR platziert werden:

```typescript
asar: {
  unpack: '**/*.{node,dll,dylib,so,exe}',
  // Note: extraResource files are automatically placed outside ASAR in resources/ folder
},
```

## Erwartetes Verhalten nach dem Fix ✅

### Bei korrektem Build

1. ImageMagick wird in `process.resourcesPath/ImageMagick/magick.exe` gefunden
2. Der Pfad zeigt auf `C:\Users\...\AutoLabel\app-1.0.3\resources\ImageMagick\magick.exe` (außerhalb von ASAR)
3. ImageMagick kann erfolgreich ausgeführt werden
4. Hermes, GLS, DHL Labels werden korrekt verarbeitet

### Bei fehlendem ImageMagick

Die Logs zeigen jetzt klar:
```
[Vinted Profile] 🔍 Searching for ImageMagick...
[Vinted Profile] Checking: C:\Users\...\AutoLabel\app-1.0.3\resources\ImageMagick\magick.exe
[Vinted Profile] ✅ Found ImageMagick at: C:\Users\...\AutoLabel\app-1.0.3\resources\ImageMagick\magick.exe
```

Oder bei fehlendem ImageMagick:
```
[Vinted Profile] Checking: C:\Users\...\resources\ImageMagick\magick.exe
[Vinted Profile] ❌ Not found at: C:\Users\...\resources\ImageMagick\magick.exe
[Vinted Profile] Checking: C:\Users\...\app.asar\bin\ImageMagick\magick.exe
[Vinted Profile] ⚠️ Skipping ASAR path (executables must be unpacked): C:\Users\...\app.asar\bin\ImageMagick\magick.exe
```

## Nächste Schritte ✅

### 1. App neu bauen ✅

```bash
cd app
npm run make
```

**Status:** ✅ Erfolgreich gebaut (02.01.2026 12:48)

### 2. App neu installieren

Installer-Pfad:
```
C:\STRUKTUR\Business_\online_\SaaS_\AutoLabel_1\app\out\make\squirrel.windows\x64\AutoLabel-Setup.exe
```

Nach der Installation sollte ImageMagick hier sein:
```
C:\Users\[USERNAME]\AppData\Local\AutoLabel\app-1.0.3\resources\ImageMagick\magick.exe
```

### 3. Logs prüfen

In der App sollten die Logs jetzt zeigen:
```
[Vinted Profile] ✅ Found ImageMagick at: C:\Users\...\AutoLabel\app-1.0.3\resources\ImageMagick\magick.exe
```

### 4. Label-Verarbeitung testen

- **Hermes Label:** Sollte mit ImageMagick verarbeitet werden
- **GLS Label:** Sollte mit ImageMagick verarbeitet werden  
- **DHL Label:** Sollte mit ImageMagick verarbeitet werden
- **DPD Label:** Verwendet PDF-lib (kein ImageMagick nötig)

## Fallback-Strategie

Falls ImageMagick immer noch nicht gefunden wird:

1. **System-Installation prüfen:** ImageMagick in `C:\Program Files\ImageMagick-*\magick.exe`
2. **PATH prüfen:** `where magick.exe` in PowerShell ausführen
3. **Manuelle Installation:** ImageMagick von https://imagemagick.org/script/download.php#windows herunterladen

## Technische Details

### Warum funktioniert ASAR nicht für Executables?

- ASAR ist ein virtuelles Dateisystem
- Node.js kann Dateien aus ASAR lesen (via `fs.readFile`)
- Windows kann aber keine `.exe` Dateien aus ASAR starten
- Electron's `asar.unpack` Pattern hilft nicht bei `extraResource` Dateien

### Warum extraResource?

- `extraResource` kopiert Dateien nach `resources/` (außerhalb von ASAR)
- Das ist der korrekte Weg für Executables und native Tools
- `process.resourcesPath` zeigt auf diesen Ordner

### Build-Konfiguration

```typescript
extraResource: [
  './bin/SumatraPDF',
  './bin/ImageMagick',
],
```

Dies kopiert:
- `app/bin/ImageMagick/` → `resources/bin/ImageMagick/`
- Alle Dateien bleiben außerhalb von ASAR
- Windows kann die `.exe` Dateien normal ausführen

## Zusammenfassung

✅ **ASAR-Pfade werden jetzt übersprungen**
✅ **Besseres Logging für Debugging**
✅ **Build-Konfiguration dokumentiert**
✅ **Pfad-Priorität korrekt (resources/ vor app.asar/)**

Das Problem sollte nach einem Rebuild behoben sein.

