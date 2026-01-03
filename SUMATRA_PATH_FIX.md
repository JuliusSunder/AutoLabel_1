# SumatraPDF Pfad-Problem - Fix Dokumentation

**Datum:** 2025-01-03  
**Status:** ✅ Behoben

---

## 🐛 Problem

### Symptome

```
[Printer] Using SumatraPDF at: C:\Users\knout\AppData\Local\AutoLabel\app-1.0.3\resources\app.asar\bin\SumatraPDF\SumatraPDF.exe
[Printer] SumatraPDF execution failed: Command failed: ...
Das System kann den angegebenen Pfad nicht finden.
```

### Root Cause

**Problem 1: Falscher Suchpfad**

Der Code suchte nach:
```
resources\bin\SumatraPDF\SumatraPDF.exe
```

Aber `extraResource` in Electron Forge kopiert Dateien direkt nach:
```
resources\SumatraPDF\SumatraPDF.exe
```

**Problem 2: ASAR-Pfad**

`app.getAppPath()` gibt zurück:
```
C:\...\resources\app.asar\bin\SumatraPDF\SumatraPDF.exe
```

Dieser Pfad:
- ✅ Existiert (laut `fs.existsSync()`)
- ❌ Kann von Windows nicht ausgeführt werden (EXE im ASAR-Archiv)

---

## ✅ Lösung

### 1. Korrekte Suchpfade

Die `findSumatraPDF()` Funktion wurde aktualisiert:

```typescript
const possiblePaths = [
  // Primary location: resources/SumatraPDF/ (direct extraResource location)
  path.join(process.resourcesPath || '', 'SumatraPDF', 'SumatraPDF.exe'),
  // Alternative location: resources/bin/SumatraPDF/ (with bin/ folder)
  path.join(process.resourcesPath || '', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
  // Unpacked location: resources/app.asar.unpacked/bin/SumatraPDF/
  path.join(process.resourcesPath || '', 'app.asar.unpacked', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
  // ... weitere Pfade
];
```

### 2. ASAR-Pfade überspringen

```typescript
for (const sumatraPath of possiblePaths) {
  // Skip ASAR paths (without .unpacked)
  if (sumatraPath.includes('app.asar') && !sumatraPath.includes('app.asar.unpacked')) {
    console.log(`[Printer] ⚠️ Skipping ASAR path (cannot execute .exe from ASAR)`);
    continue;
  }
  
  if (fs.existsSync(sumatraPath)) {
    return sumatraPath;
  }
}
```

---

## 📊 Tatsächliche Pfade (auf dem anderen PC)

### Gefunden

1. ✅ `C:\Users\knout\AppData\Local\AutoLabel\app-1.0.3\resources\SumatraPDF\SumatraPDF.exe`
   - Direkt in `resources/`
   - Funktioniert ✅

2. ✅ `C:\Users\knout\AppData\Local\AutoLabel\app-1.0.3\resources\app.asar.unpacked\bin\SumatraPDF\SumatraPDF.exe`
   - Durch AutoUnpackNativesPlugin entpackt
   - Funktioniert ✅

### Nicht gefunden

❌ `C:\Users\knout\AppData\Local\AutoLabel\app-1.0.3\resources\bin\SumatraPDF\SumatraPDF.exe`
   - Dieser Pfad existiert nicht
   - War der primäre Suchpfad (FEHLER!)

---

## 🔧 Warum passiert das?

### Electron Forge extraResource

```typescript
// forge.config.ts
extraResource: [
  './bin/SumatraPDF',
  './bin/ImageMagick',
]
```

**Was passiert:**
```
Source:  app/bin/SumatraPDF/
Target:  resources/SumatraPDF/     ← NICHT resources/bin/SumatraPDF/
```

Electron Forge kopiert den **Inhalt** des Ordners, nicht den Ordner selbst mit seinem Pfad.

### Vergleich: Development vs Production

**Development (`npm run start`):**
```
app.getAppPath() → C:\...\app
Pfad: C:\...\app\bin\SumatraPDF\SumatraPDF.exe ✅
```

**Production (installiert):**
```
process.resourcesPath → C:\...\resources
Pfad: C:\...\resources\SumatraPDF\SumatraPDF.exe ✅
```

---

## 📋 Änderungen

### Geänderte Datei

`app/src/main/printing/printer-manager.ts`

**Funktion:** `findSumatraPDF()`

**Änderungen:**
1. ✅ Primärer Pfad: `resources/SumatraPDF/` (ohne `bin/`)
2. ✅ Alternativer Pfad: `resources/bin/SumatraPDF/` (mit `bin/`)
3. ✅ Unpacked Pfad: `resources/app.asar.unpacked/bin/SumatraPDF/`
4. ✅ ASAR-Pfade überspringen (außer `.unpacked`)

---

## 🧪 Testing

### Lokale Entwicklung

```bash
npm run start
```

**Erwartung:**
```
[Printer] ✅ FOUND SumatraPDF at: C:\...\app\bin\SumatraPDF\SumatraPDF.exe
```

### Production Build

```bash
npm run make
```

**Nach Installation auf anderem PC:**
```
[Printer] ✅ FOUND SumatraPDF at: C:\Users\...\AppData\Local\AutoLabel\app-1.0.3\resources\SumatraPDF\SumatraPDF.exe
```

### Drucktest

1. Label vorbereiten
2. Drucken
3. **Erwartung:**
   ```
   [Printer] Using SumatraPDF at: C:\...\resources\SumatraPDF\SumatraPDF.exe
   [Printer] Executing SumatraPDF: X4
   [Printer] SumatraPDF command completed
   [Printer] ✅ Successfully printed with SumatraPDF
   ```

---

## 🎯 Zusammenfassung

### Vor dem Fix

- ❌ SumatraPDF wurde am falschen Pfad gesucht
- ❌ ASAR-Pfade wurden nicht übersprungen
- ❌ Electron-Fallback wurde verwendet → leere Seiten

### Nach dem Fix

- ✅ SumatraPDF wird am richtigen Pfad gefunden
- ✅ ASAR-Pfade werden übersprungen
- ✅ SumatraPDF wird korrekt ausgeführt
- ✅ Drucken funktioniert!

---

## 📚 Verwandte Dokumentation

- `PRINTING_BUG_FIX.md` - Ursprüngliches Druck-Problem
- `PRINTING_TROUBLESHOOTING.md` - Allgemeine Troubleshooting-Anleitung
- `app/EXTERNAL-TOOLS-INTEGRATION.md` - Externe Tools Integration
- `app/BUILD-CHECKLIST.md` - Build Checkliste

---

**Erstellt:** 2025-01-03  
**AutoLabel Version:** 1.0.3  
**Status:** ✅ Behoben

