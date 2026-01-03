# AutoLabel - Druck-Problembehebung

## Problem: Leere Seiten beim Drucken

Wenn AutoLabel leere Seiten druckt, liegt das meist daran, dass **SumatraPDF nicht gefunden wird** und die App auf die Electron-Fallback-Methode zurückfällt, die bei vielen Etikettendruckern nicht funktioniert.

---

## Schnelle Diagnose

### Schritt 1: Logs prüfen

1. AutoLabel öffnen
2. Developer Tools öffnen: `Ctrl + Shift + I` oder `F12`
3. Zum "Console" Tab wechseln
4. Einen Druckvorgang starten
5. Nach folgenden Meldungen suchen:

**✅ GUT - SumatraPDF wird verwendet:**
```
[Printer] 🔍 Searching for SumatraPDF...
[Printer] ✅ FOUND SumatraPDF at: C:\Users\...\resources\bin\SumatraPDF\SumatraPDF.exe
[Printer] Executing SumatraPDF command: ...
[Printer] ✓ Successfully printed with SumatraPDF
```

**❌ PROBLEM - Electron Fallback wird verwendet:**
```
[Printer] 🔍 Searching for SumatraPDF...
[Printer] ❌ Not found at: ...
[Printer] ⚠️⚠️⚠️ SumatraPDF NOT FOUND IN ANY LOCATION ⚠️⚠️⚠️
[Printer] ⚠️⚠️⚠️ Using Electron fallback method ⚠️⚠️⚠️
[Printer] This may cause rendering issues with label printers (blank pages, black backgrounds, etc.)
```

### Schritt 2: Diagnose-Script ausführen

1. Kopiere die Datei `diagnose-sumatra.ps1` auf den betroffenen PC
2. Rechtsklick → "Mit PowerShell ausführen"
3. Das Script zeigt an, ob SumatraPDF gefunden wird

**Oder manuell in PowerShell:**
```powershell
cd C:\STRUKTUR\Business_\online_\SaaS_\AutoLabel_1\app
.\diagnose-sumatra.ps1
```

---

## Lösungen

### Lösung 1: AutoLabel neu installieren (Empfohlen)

Wenn SumatraPDF nicht gefunden wird, wurde es möglicherweise nicht korrekt mit der App gebündelt.

1. **Vor dem Build prüfen:**
   ```powershell
   # Prüfe ob SumatraPDF im Source vorhanden ist
   Test-Path "C:\STRUKTUR\Business_\online_\SaaS_\AutoLabel_1\app\bin\SumatraPDF\SumatraPDF.exe"
   ```
   
   Falls `False`: SumatraPDF fehlt im Source! Siehe "Lösung 2"

2. **Neuen Build erstellen:**
   ```powershell
   cd app
   npm run make
   ```

3. **Installer auf anderen PC kopieren und installieren:**
   ```
   app/out/make/squirrel.windows/x64/AutoLabel-Setup.exe
   ```

### Lösung 2: SumatraPDF manuell hinzufügen

Falls SumatraPDF im Source fehlt:

1. **SumatraPDF herunterladen:**
   - Website: https://www.sumatrapdfreader.org/
   - Version: Portable (ZIP)
   - Datei: `SumatraPDF-3.x.x-64.zip`

2. **Entpacken nach:**
   ```
   app/bin/SumatraPDF/
   ```

3. **Prüfen dass folgende Dateien vorhanden sind:**
   ```
   app/bin/SumatraPDF/
   ├── SumatraPDF.exe          ← WICHTIG!
   ├── libmupdf.dll
   ├── PdfFilter.dll
   └── PdfPreview.dll
   ```

4. **Neuen Build erstellen** (siehe Lösung 1, Schritt 2-3)

### Lösung 3: System-Installation als Workaround

Als temporärer Workaround (nicht empfohlen für Production):

1. SumatraPDF systemweit installieren:
   - Download: https://www.sumatrapdfreader.org/download-free-pdf-viewer
   - Installieren nach: `C:\Program Files\SumatraPDF\`

2. AutoLabel wird es automatisch finden

**Nachteil:** Muss auf jedem PC manuell installiert werden

---

## Technische Details

### Warum SumatraPDF?

- **Problem mit Electron:** Electron's eingebaute Druckfunktion hat bekannte Probleme mit Etikettendruckern:
  - Schwarze Hintergründe
  - Leere Seiten
  - Falsche Skalierung
  
- **Lösung SumatraPDF:** 
  - Nutzt Windows-Druckertreiber direkt
  - Zuverlässiges Drucken
  - Keine Rendering-Probleme

### Suchpfade (in dieser Reihenfolge)

1. `{resourcesPath}/bin/SumatraPDF/SumatraPDF.exe` ← **Primär (Production)**
2. `{appPath}/bin/SumatraPDF/SumatraPDF.exe` ← Development
3. `{cwd}/app/bin/SumatraPDF/SumatraPDF.exe` ← Development
4. `C:\Program Files\SumatraPDF\SumatraPDF.exe` ← System-Installation
5. System PATH

**Wichtig:** `{resourcesPath}` ist der Pfad nach Installation, z.B.:
```
C:\Users\USERNAME\AppData\Local\autolabel\app-1.0.0\resources
```

### Build-Konfiguration

In `forge.config.ts`:
```typescript
extraResource: [
  './bin/SumatraPDF',  // ← Wird nach resources/bin/SumatraPDF/ kopiert
  './bin/ImageMagick',
  './bin/Ghostscript',
]
```

---

## Häufige Fehler

### 1. SumatraPDF.exe fehlt im Build

**Symptom:** 
```
[Printer] ❌ Not found at: C:\Users\...\resources\bin\SumatraPDF\SumatraPDF.exe
```

**Ursache:** 
- `app/bin/SumatraPDF/` existierte nicht vor dem Build
- Oder wurde von `.gitignore` ausgeschlossen

**Lösung:** Siehe "Lösung 2" oben

### 2. DLL fehlt

**Symptom:**
```
SumatraPDF.exe - System Error
The program can't start because libmupdf.dll is missing
```

**Ursache:** Nicht alle Dateien wurden kopiert

**Lösung:** Alle Dateien aus dem SumatraPDF Portable ZIP kopieren, nicht nur die .exe

### 3. Berechtigungsproblem

**Symptom:**
```
[Printer] SumatraPDF execution failed: Access denied
```

**Ursache:** Windows blockiert die Datei (SmartScreen)

**Lösung:**
1. Rechtsklick auf `SumatraPDF.exe`
2. Eigenschaften
3. Unten: "Zulassen" aktivieren
4. OK

---

## Weitere Hilfe

Falls das Problem weiterhin besteht:

1. **Logs sammeln:**
   - Developer Tools → Console → Rechtsklick → "Save as..."
   - Speichern als `console-logs.txt`

2. **Diagnose-Output:**
   - `diagnose-sumatra.ps1` ausführen
   - Screenshot machen oder Output kopieren

3. **PDF prüfen:**
   - PDF aus `%APPDATA%\AutoLabel\prepared\` mit Adobe Reader öffnen
   - Ist die PDF korrekt oder leer?

4. **Support kontaktieren** mit:
   - Console Logs
   - Diagnose Output
   - PDF-Datei (falls leer)
   - Druckermodell und Treiber-Version

---

**Letzte Aktualisierung:** 2025-01-03  
**AutoLabel Version:** 1.0.0

